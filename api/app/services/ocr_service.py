import os
import io
import re
import json
import base64
import hashlib
import asyncio
from pathlib import Path
from typing import List, Optional, Tuple

from PIL import Image, ImageFilter, ImageOps
from pdf2image import convert_from_path
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

import openai
from openai import AsyncOpenAI

try:
    import pytesseract
except ImportError:
    pytesseract = None

# Configuration (ideally from env or config)
VISION_MODEL = os.getenv("VISION_MODEL", "gpt-4o")
OCR_CONCURRENCY = int(os.getenv("OCR_CONCURRENCY", "2"))
OCR_DPI = 150
MAX_IMAGE_SIDE = 1400
JPEG_QUALITY = 45
TESS_LANGS = os.getenv("TESSERACT_LANGS", "tam+eng")
TESS_MIN_CHARS = 80
TESS_MIN_CONF = 35.0
TESS_PSM_MODES = (6, 11, 12)
OCR_VERSION = "v3_tesseract_multipass_lowres"

CACHE_DIR = Path("/tmp/.ocr_cache")
CACHE_DIR.mkdir(exist_ok=True)

from app.models.report import PageData


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _cache_path(file_path: str, page_num: int) -> Path:
    key = hashlib.md5(
        f"{file_path}:{page_num}:{OCR_VERSION}:{OCR_DPI}:{MAX_IMAGE_SIDE}:{JPEG_QUALITY}".encode()
    ).hexdigest()
    return CACHE_DIR / f"{key}.json"

def load_cache(file_path: str, page_num: int) -> Optional[dict]:
    p = _cache_path(file_path, page_num)
    return json.loads(p.read_text()) if p.exists() else None

def save_cache(file_path: str, page_num: int, data: dict):
    _cache_path(file_path, page_num).write_text(json.dumps(data, ensure_ascii=False, indent=2))

def image_to_base64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return base64.b64encode(buf.getvalue()).decode()

def prepare_ocr_image(img: Image.Image) -> Image.Image:
    img = img.convert("L")
    img = ImageOps.autocontrast(img)
    width, height = img.size
    longest_side = max(width, height)
    if longest_side > MAX_IMAGE_SIDE:
        scale = MAX_IMAGE_SIDE / float(longest_side)
        img = img.resize((int(width * scale), int(height * scale)), Image.LANCZOS)
    return img

def build_tesseract_variants(img: Image.Image) -> List[Image.Image]:
    base = prepare_ocr_image(img)
    upscaled = base.resize((base.width * 2, base.height * 2), Image.LANCZOS) if max(base.size) < 1800 else base
    threshold = base.point(lambda p: 255 if p > 165 else 0)
    sharpened = base.filter(ImageFilter.SHARPEN)
    threshold_sharp = sharpened.point(lambda p: 255 if p > 155 else 0)
    threshold_upscaled = upscaled.point(lambda p: 255 if p > 160 else 0)
    return [base, upscaled, sharpened, threshold, threshold_sharp, threshold_upscaled]

def _safe_float(value) -> Optional[float]:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

def _ocr_text_quality(text: str) -> int:
    return len(re.findall(r"[\w\u0B80-\u0BFF]", text or ""))

def _count_pattern(text: str, pattern: str) -> int:
    return len(re.findall(pattern, text or ""))

def _score_tesseract_candidate(text: str, avg_conf: Optional[float]) -> float:
    char_count = _ocr_text_quality(text)
    tamil_chars = _count_pattern(text, r"[\u0B80-\u0BFF]")
    digit_count = _count_pattern(text, r"\d")
    line_count = len([line for line in (text or "").splitlines() if line.strip()])
    conf_score = avg_conf if avg_conf is not None else 0.0
    return (char_count * 1.0) + (tamil_chars * 0.35) + (digit_count * 0.2) + (line_count * 2.0) + conf_score

def _clean_ocr_text(text: str) -> str:
    lines = []
    for line in (text or "").splitlines():
        cleaned = re.sub(r"[ \t]+", " ", line).strip()
        if cleaned:
            lines.append(cleaned)
    return "\n".join(lines)

def _extract_tesseract(img: Image.Image) -> tuple[str, Optional[float]]:
    if pytesseract is None:
        return "", None
    try:
        best_text = ""
        best_conf = None
        best_score = -1.0
        for variant in build_tesseract_variants(img):
            for psm in TESS_PSM_MODES:
                config = f"--oem 1 --psm {psm}"
                data = pytesseract.image_to_data(
                    variant, lang=TESS_LANGS, config=config, output_type=pytesseract.Output.DICT
                )
                confidences = [conf for conf in (_safe_float(v) for v in data.get("conf", [])) if conf is not None and conf >= 0]
                text = _clean_ocr_text(pytesseract.image_to_string(variant, lang=TESS_LANGS, config=config))
                avg_conf = sum(confidences) / len(confidences) if confidences else None
                score = _score_tesseract_candidate(text, avg_conf)
                if score > best_score:
                    best_text = text
                    best_conf = avg_conf
                    best_score = score
        return best_text, best_conf
    except pytesseract.TesseractNotFoundError:
        return "", None

def _should_use_tesseract_result(text: str, avg_conf: Optional[float]) -> bool:
    if not text:
        return False
    char_count = _ocr_text_quality(text)
    if char_count < TESS_MIN_CHARS:
        return False
    if avg_conf is None:
        return char_count >= (TESS_MIN_CHARS * 2)
    return avg_conf >= TESS_MIN_CONF

# ─────────────────────────────────────────────
# Vision OCR Service
# ─────────────────────────────────────────────

class OCRService:
    """
    Uses local Tesseract first on a compressed grayscale page image.
    Falls back to GPT Vision only when the local OCR looks weak.
    """

    def __init__(self, api_key: str = None):
        api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=api_key)
        self.semaphore = asyncio.Semaphore(OCR_CONCURRENCY)

    @retry(
        retry=retry_if_exception_type((openai.RateLimitError, openai.APIStatusError)),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(4),
    )
    async def _ocr_page(self, img: Image.Image, page_num: int, doc_type: str = "document") -> str:
        prepared = prepare_ocr_image(img)
        tesseract_text, tesseract_conf = await asyncio.to_thread(_extract_tesseract, prepared)
        
        if _should_use_tesseract_result(tesseract_text, tesseract_conf):
            return tesseract_text

        b64 = image_to_base64(prepared)
        async with self.semaphore:
            response = await self.client.chat.completions.create(
                model=VISION_MODEL,
                max_tokens=1400,
                temperature=0.0,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{b64}",
                                "detail": "low",
                            },
                        },
                        {
                            "type": "text",
                            "text": (
                                f"This is page {page_num} of a Tamil government land document "
                                f"(type: {doc_type}).\n\n"
                                "A local Tesseract OCR pass was insufficient, so transcribe the page carefully.\n"
                                "Your task: transcribe ALL text visible on this page.\n"
                                "Rules:\n"
                                "- Preserve Tamil script exactly as printed\n"
                                "- Preserve all numbers, dates, amounts\n"
                                "- Preserve survey numbers, Aadhaar numbers, receipt numbers verbatim\n"
                                "- Output only the transcribed text, no commentary"
                            ),
                        },
                    ],
                }],
            )
        return response.choices[0].message.content.strip()

    async def extract_pages_async(self, pdf_path: str, dpi: int = OCR_DPI) -> List[Tuple[int, str]]:
        images = await asyncio.to_thread(convert_from_path, pdf_path, dpi=dpi)
        
        async def process_one(i: int, img: Image.Image) -> Tuple[int, str]:
            cached = load_cache(pdf_path, i)
            if cached:
                return (i, cached["raw_text"])
            text = await self._ocr_page(img, i, "document")
            save_cache(pdf_path, i, {"raw_text": text})
            return (i, text)

        records = await asyncio.gather(*[process_one(i, img) for i, img in enumerate(images, 1)])
        return list(records)

    def extract_text_from_pdf(self, pdf_path: str, dpi: int = 300) -> List[Tuple[int, str]]:
        """Sync wrapper for legacy celery code"""
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(self.extract_pages_async(pdf_path, dpi))

    def extract_text_from_image(self, image_path: str) -> List[Tuple[int, str]]:
        img = Image.open(image_path)
        loop = asyncio.get_event_loop()
        text = loop.run_until_complete(self._ocr_page(img, 1, "image"))
        return [(1, text)]
