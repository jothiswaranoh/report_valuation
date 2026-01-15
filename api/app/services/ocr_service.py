from typing import List, Tuple
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import tempfile
import os

class OCRService:
    def __init__(self, lang: str = "tam"):
        self.lang = lang
        if not os.getenv("TESSDATA_PREFIX"):
            print("⚠️ Warning: TESSDATA_PREFIX not set. Tamil OCR may fail.")

        if os.getenv("TESSERACT_PATH"):
            pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_PATH")
    
    def extract_text_from_pdf(self, pdf_path: str, dpi: int = 300) -> List[Tuple[int, str]]:
        """Extract text from PDF page by page"""
        pages = convert_from_path(pdf_path, dpi=dpi)
        results = []
        
        for i, page in enumerate(pages, start=1):
            text = pytesseract.image_to_string(page, lang=self.lang)
            results.append((i, text.strip()))
        
        return results
    
    def extract_text_from_image(self, image_path: str) -> List[Tuple[int, str]]:
        """Extract text from image"""
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image, lang=self.lang)
        return [(1, text.strip())]
    
    def extract_from_bytes(self, file_bytes: bytes, file_type: str) -> List[Tuple[int, str]]:
        """Extract text from bytes (PDF or image)"""
        with tempfile.NamedTemporaryFile(suffix=f".{file_type}", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        
        try:
            if file_type == "pdf":
                results = self.extract_text_from_pdf(tmp_path)
            else:
                results = self.extract_text_from_image(tmp_path)
        finally:
            os.unlink(tmp_path)
        
        return results
