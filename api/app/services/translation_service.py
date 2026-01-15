from openai import OpenAI
from typing import Dict, List
import asyncio
import os
from app.models.report import PageData, ProcessingStatus

class TranslationService:
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.client = OpenAI(api_key=api_key)
        self.model = model
    
    async def translate_to_legal_english(self, tamil_text: str, page_num: int) -> str:
        """Translate Tamil text to legal English"""
        prompt = f"""
        Translate this Tamil land document text to formal legal English:
        
        {tamil_text}
        
        Requirements:
        1. Preserve all legal terminology
        2. Maintain original names in transliterated form
        3. Keep measurements in original units with metric equivalents
        4. Include survey numbers, boundaries, dates
        5. Output in clear legal English
        """
        
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert legal translator specializing in Tamil land documents."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        
        return response.choices[0].message.content.strip()
    
    async def simplify_text(self, legal_text: str, page_num: int) -> str:
        """Simplify legal text to simple English"""
        prompt = f"""
        Simplify this legal land document text (Page {page_num}) to simple, meaningful English:
        
        {legal_text}
        
        Include:
        1. A short summary for this page
        2. Key details (owner, land size, survey number, boundaries)
        3. Explanation of any technical terms
        4. Use bullet points for clarity
        """
        
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.model,
            messages=[
                {"role": "system", "content": "You simplify complex legal documents for common people."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        return response.choices[0].message.content.strip()
    
    async def create_document_summary(self, pages_data: List[PageData]) -> str:
        """Create comprehensive summary of all pages"""
        combined_text = "\n\n".join([
            f"Page {page.page_number}:\n{page.legal_english}"
            for page in pages_data if page.legal_english
        ])
        
        prompt = f"""
        Create a complete summary of this Tamil land document:
        
        {combined_text}
        
        Include:
        1. Document type and purpose
        2. All parties involved
        3. Complete property details
        4. Key dates and registration details
        5. Important clauses and conditions
        6. Overall document status
        """
        
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a land document analyst."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        
        return response.choices[0].message.content.strip()
