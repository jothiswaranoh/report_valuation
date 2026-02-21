"""
Report-related models based on DocSpec schema
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Literal
from datetime import datetime
from enum import Enum


# ----------------------
# Processing Status
# ----------------------

class ProcessingStatus(str, Enum):
    UPLOADED = "uploaded"
    OCR_STARTED = "ocr_started"
    OCR_COMPLETED = "ocr_completed"
    TRANSLATION_STARTED = "translation_started"
    TRANSLATION_COMPLETED = "translation_completed"
    SIMPLIFICATION_STARTED = "simplification_started"
    SIMPLIFICATION_COMPLETED = "simplification_completed"
    COMPLETED = "completed"
    FAILED = "failed"


class ReportStatus(str, Enum):
    INITIALISING = "initialising"
    UPLOAD_FILES = "upload_files"
    IMPORTING = "importing"
    ANALYSING = "analysing"
    COMPLETED = "completed"

# ----------------------
# Report Models
# ----------------------

class ReportCreate(BaseModel):
    report_name: str = Field(..., max_length=255)


class ReportResponse(BaseModel):
    id: str
    report_name: str
    user_id: str
    report_status: ReportStatus
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ----------------------
# Original File Models
# ----------------------

class OriginalFileCreate(BaseModel):
    report_id: str
    file_name: str = Field(..., max_length=255)
    file_type: Optional[str] = Field(None, max_length=50)
    file_path: Optional[str] = None
    file_text_content: Optional[str] = None


class OriginalFileResponse(BaseModel):
    id: str
    report_id: str
    file_name: str
    file_type: Optional[str] = None
    file_path: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ----------------------
# AI Extracted Content
# ----------------------

class AIExtractedContentCreate(BaseModel):
    report_id: str
    ai_report_content: str


class AIExtractedContentResponse(BaseModel):
    id: str
    report_id: str
    ai_report_content: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ----------------------
# Final Report
# ----------------------

class FinalReportCreate(BaseModel):
    report_id: str
    final_report: str


class FinalReportResponse(BaseModel):
    id: str
    report_id: str
    final_report: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ----------------------
# Document Processing Models
# ----------------------

class PageData(BaseModel):
    page_number: int
    original_text: Optional[str] = None
    legal_english: Optional[str] = None
    simple_english: Optional[str] = None
    status: ProcessingStatus = ProcessingStatus.UPLOADED


class DocumentRequest(BaseModel):
    file_path: Optional[str] = None
    file_content: Optional[bytes] = None
    file_type: Literal["pdf", "image"]


class DocumentResponse(BaseModel):
    document_id: str
    total_pages: int
    pages: List[PageData]
    summary: Optional[str] = None
    status: ProcessingStatus


class SSEEvent(BaseModel):
    event_type: str
    data: Dict
    document_id: str
    timestamp: str
