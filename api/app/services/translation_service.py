import os
import re
import json
import asyncio
from typing import Dict, List, Any

import openai
from openai import AsyncOpenAI, OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.models.report import (
    PageData, PageRecord, DocumentRecord, 
    FIELD_SCHEMAS, DETAILS_JSON_SCHEMA, DOC_TYPE_MAP
)

VISION_MODEL = os.getenv("VISION_MODEL", "gpt-4o")
FAST_MODEL = os.getenv("FAST_MODEL", "gpt-4o-mini")
LLM_CONCURRENCY = int(os.getenv("LLM_CONCURRENCY", "2"))
OPENAI_TIMEOUT_SECONDS = int(os.getenv("OPENAI_TIMEOUT_SECONDS", "180"))

def _schema_merge(schema, extracted):
    if isinstance(schema, dict):
        extracted = extracted if isinstance(extracted, dict) else {}
        return {key: _schema_merge(value, extracted.get(key)) for key, value in schema.items()}
    if isinstance(schema, list):
        if not schema:
            return extracted if isinstance(extracted, list) else []
        if not isinstance(extracted, list):
            return []
        return [_schema_merge(schema[0], item) for item in extracted]
    if extracted is None:
        return schema
    return str(extracted).strip()


class TranslationService:
    def __init__(self, api_key: str = None):
        api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.sync_client = OpenAI(api_key=api_key)
        self.client = AsyncOpenAI(api_key=api_key, timeout=OPENAI_TIMEOUT_SECONDS)
        self.semaphore = asyncio.Semaphore(LLM_CONCURRENCY)

    # ----------------------------------------------------
    # Legacy methods (kept for compatibility if needed)
    # ----------------------------------------------------
    async def translate_to_legal_english(self, tamil_text: str, page_num: int) -> str:
        prompt = f"Translate this Tamil land document text to formal legal English:\n\n{tamil_text}\n\nRequirements:\n1. Preserve all legal terminology\n2. Maintain original names in transliterated form\n3. Keep measurements in original units with metric equivalents\n4. Include survey numbers, boundaries, dates\n5. Output in clear legal English"
        response = await asyncio.to_thread(
            self.sync_client.chat.completions.create,
            model=FAST_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert legal translator specializing in Tamil land documents."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        return response.choices[0].message.content.strip()

    async def simplify_text(self, legal_text: str, page_num: int) -> str:
        prompt = f"Simplify this legal land document text (Page {page_num}) to simple, meaningful English:\n\n{legal_text}\n\nInclude:\n1. A short summary for this page\n2. Key details (owner, land size, survey number, boundaries)\n3. Explanation of any technical terms\n4. Use bullet points for clarity"
        response = await asyncio.to_thread(
            self.sync_client.chat.completions.create,
            model=FAST_MODEL,
            messages=[
                {"role": "system", "content": "You simplify complex legal documents for common people."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content.strip()

    async def create_document_summary(self, pages_data: List[PageData]) -> str:
        combined_text = "\n\n".join([f"Page {page.page_number}:\n{page.legal_english}" for page in pages_data if page.legal_english])
        prompt = f"Create a complete summary of this Tamil land document:\n\n{combined_text}\n\nInclude:\n1. Document type and purpose\n2. All parties involved\n3. Complete property details\n4. Key dates and registration details\n5. Important clauses and conditions\n6. Overall document status"
        response = await asyncio.to_thread(
            self.sync_client.chat.completions.create,
            model=FAST_MODEL,
            messages=[
                {"role": "system", "content": "You are a land document analyst."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        return response.choices[0].message.content.strip()

    # ----------------------------------------------------
    # V3 Extraction methods
    # ----------------------------------------------------
    @retry(
        retry=retry_if_exception_type((
            openai.RateLimitError,
            openai.APITimeoutError,
            openai.APIConnectionError,
            openai.InternalServerError,
        )),
        wait=wait_exponential(multiplier=1, min=2, max=20),
        stop=stop_after_attempt(4),
        reraise=True,
    )
    async def _call(self, system: str, user: str, model: str = FAST_MODEL, temperature: float = 0.2) -> str:
        async with self.semaphore:
            response = await self.client.chat.completions.create(
                model=model,
                max_tokens=1500,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user",   "content": user},
                ],
            )
        return response.choices[0].message.content.strip()

    def _fallback_page_summary(self, page: PageRecord) -> str:
        raw = (page.raw_text or "").strip()
        if not raw:
            return "[Page was blank after OCR]"
        lines = [re.sub(r"\s+", " ", line).strip() for line in raw.splitlines() if line.strip()]
        preview = "\n".join(f"- {line}" for line in lines[:12])
        return (
            "**Page summary:** Fallback summary used because the model request timed out.\n"
            "**Extracted details:**\n"
            f"{preview or '- OCR text captured but could not be simplified.'}"
        )

    async def simplify_page(self, page: PageRecord, doc_type: str) -> PageRecord:
        if not page.raw_text or page.raw_text.strip() == "[ILLEGIBLE]":
            page.simplified = "[Page was illegible or blank]"
            return page

        try:
            page.simplified = await self._call(
                system=(
                    "You are an expert at Tamil Nadu government land documents. "
                    "Given raw OCR text (may contain Tamil and English mixed), "
                    "extract and present all meaningful information in clear English bullet points. "
                    "Never write '[To be filled in]' — if a value is present in the text, extract it. "
                    "If a value is genuinely absent from the page, write [not on this page]."
                ),
                user=(
                    f"Document type: {doc_type.replace('_', ' ')}\n"
                    f"Page {page.page_number} raw text:\n\n{page.raw_text}\n\n"
                    "Format your response as:\n"
                    "**Page summary:** one sentence\n"
                    "**Extracted details:**\n"
                    "- field: value\n"
                    "- field: value\n"
                    "Include every number, name, date, and amount you can find."
                ),
                temperature=0.1,
            )
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning(f"Simplify failed for page {page.page_number}: {exc}")
            page.simplified = self._fallback_page_summary(page)
        return page

    async def process_document(self, doc: DocumentRecord) -> DocumentRecord:
        doc.pages = list(await asyncio.gather(
            *[self.simplify_page(p, doc.doc_type) for p in doc.pages]
        ))
        return doc

    async def summarise_and_extract(self, doc: DocumentRecord) -> DocumentRecord:
        if doc.doc_type == "expert_valuation_report":
            combined = "\n\n".join(
                f"--- Page {p.page_number} | OCR ---\n{p.raw_text}\n\n--- Page {p.page_number} | English ---\n{p.simplified}"
                for p in doc.pages if p.raw_text or p.simplified
            )
            raw = await self._call(
                system=(
                    "You are an expert extractor for Indian expert valuation reports. "
                    "Return only valid JSON that matches the provided schema exactly. "
                    "Preserve original numbers, units, dates, addresses, and rupee values exactly as shown. "
                    "Prefer values from tables and form fields over narrative text. "
                    "Leave missing or unclear values as empty strings. Do not add or rename keys."
                ),
                user=(
                    "Extract this expert valuation report into the exact JSON schema below.\n"
                    "Rules:\n"
                    "- Keep 'Date of inspection' and 'Date on which the valuation is made' separate.\n"
                    "- Preserve dimensions, sqft, rates, rupee values, road width, and plan approval text exactly.\n"
                    "- For boundaries and dimensions, capture both document and site/actual values when visible.\n"
                    "- For 'Details of valuation', include one row per visible valuation line item.\n"
                    "- If no value is visible, use an empty string.\n\n"
                    f"Schema:\n{json.dumps(DETAILS_JSON_SCHEMA, ensure_ascii=False, indent=2)}\n\n"
                    f"Document content:\n{combined}"
                ),
                model=VISION_MODEL,
                temperature=0.0,
            )
            try:
                clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                parsed = json.loads(clean)
                doc.summary = "Structured valuation details extracted."
                doc.extracted_fields = _schema_merge(DETAILS_JSON_SCHEMA, parsed)
            except json.JSONDecodeError:
                doc.summary = raw[:500]
                doc.extracted_fields = {"parse_error": "JSON parse failed — raw response stored in summary"}
            return doc

        schema = FIELD_SCHEMAS.get(doc.doc_type, FIELD_SCHEMAS["land_document"])
        schema_lines = "\n".join(f'  "{k}": "{v}"' for k, v in schema.items())
        extra_guidance = ""
        if doc.doc_type == "title_verification_report":
            extra_guidance = (
                "\nExtra extraction rules for technical assessment forms:\n"
                "- Prefer exact values from the TVR/technical assessment table over narrative text\n"
                "- Keep market, realizable, and distress values exactly as written with units\n"
                "- If approved building area and actual building area are both present, keep both separately\n"
                "- Put road width, road type, occupancy status, property category, recommendation, and pre-disbursement conditions into their exact fields\n"
                "- Put the main plan deviation / floor violation sentence into building_violation\n"
                "- Put other observation bullets into remarks as a list of short sentences\n"
            )

        combined = "\n\n".join(
            f"--- Page {p.page_number} ---\n{p.simplified}"
            for p in doc.pages if p.simplified
        )

        raw = await self._call(
            system=(
                "You are a Tamil Nadu land document analyst. "
                "Return ONLY valid JSON with no markdown fences. "
                "Never leave a field as null if the information appears anywhere in the text."
            ),
            user=(
                f"Analyse this {doc.doc_type.replace('_', ' ')} and return JSON with exactly these fields:\n"
                "{\n"
                f"{schema_lines},\n"
                '  "summary": "2-3 sentence document summary",\n'
                '  "red_flags": ["list any anomalies, violations, or missing critical data"]\n'
                "}\n"
                f"{extra_guidance}\n"
                f"Document content:\n{combined}"
            ),
            model=VISION_MODEL,
            temperature=0.1,
        )

        try:
            clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            parsed = json.loads(clean)
            doc.summary = parsed.pop("summary", "")
            doc.extracted_fields = parsed
        except json.JSONDecodeError:
            doc.summary = raw[:500]
            doc.extracted_fields = {"parse_error": "JSON parse failed — raw response stored in summary"}

        return doc
