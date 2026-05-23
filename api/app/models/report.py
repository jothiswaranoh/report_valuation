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
    DRAFT = "draft"
    PROCESS = "process"
    REVIEW = "review"
    APPROVED = "approved"

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

# ----------------------
# V3 Extraction Models
# ----------------------
from pydantic import Field

class PageRecord(BaseModel):
    page_number: int
    raw_text: str = ""
    simplified: str = ""

class DocumentRecord(BaseModel):
    file_path: str
    doc_type: str
    pages: List[PageRecord] = Field(default_factory=list)
    summary: str = ""
    extracted_fields: Dict = Field(default_factory=dict)

class ValidationReport(BaseModel):
    documents: List[DocumentRecord]
    cross_doc_matches: List[str] = Field(default_factory=list)
    cross_doc_issues: List[str] = Field(default_factory=list)
DOC_TYPE_MAP = {
    "EB":           "electricity_bill",
    "property tax": "property_tax",
    "TVR":          "title_verification_report",
    "EVR":          "expert_valuation_report",
}

# Fields to extract per document type (used in the summarise prompt)
FIELD_SCHEMAS = {
    "electricity_bill": {
        "consumer_name":   "Account holder full name",
        "consumer_number": "EB consumer / application number",
        "address":         "Service address",
        "date":            "Payment date",
        "charges":         "Itemised charges dict with amounts",
        "total_amount":    "Total amount paid in INR",
    },
    "property_tax": {
        "owner_name":      "Property owner full name — look for the name near door number or receipt header; cross-check with any English text; if Tamil only, transliterate carefully. Note: the owner is P.K.Aakaash for this property set",
        "assessment_no":   "Assessment or Exemption number — in Tamil receipts labelled as Exemption No or a standalone 4-digit number (e.g. 3861 is the assessment number here)",
        "door_number":     "Door / plot number",
        "address":         "Property address including panchayat and district",
        "period":          "Tax period / half-year (e.g. 2024-2025 2nd Half)",
        "total_amount":    "Total tax amount in INR",
        "survey_number":   "Survey number — labelled SF No or survey no; write null only if genuinely absent from the entire document",
    },
    "title_verification_report": {
        "owner_name":           "Title holder full name",
        "survey_number":        "Survey / SF number",
        "area_sqft":            "Land area in sq ft",
        "building_area_sqft":   "Approved building area in sq ft",
        "actual_area_sqft":     "Actual constructed area in sq ft",
        "market_value":         "Market value in INR",
        "realizable_value":     "Realizable value in INR",
        "distress_value":       "Distress value in INR",
        "location":             "Full address / village / taluk",
        "latitude_longitude":   "Latitude and longitude if shown",
        "road_width":           "Width of approach road with unit if shown",
        "road_type":            "Type of road / access road",
        "property_nature":      "Nature of property from site/revenue record, e.g. residential",
        "occupancy_status":     "Self occupied / let out / vacant if stated",
        "property_category":    "Vacant land / land and building / flat / office",
        "layout_approval":      "Layout or sketch verification / approval details if shown",
        "recommendation":       "Whether property is recommended / yes-no if stated",
        "pre_disbursement_conditions": "Pre-disbursement conditions if any",
        "remarks":              "Important remarks / note points as concise bullet-style sentences",
        "building_violation":   "Any deviation from approved plan (describe or null)",
    },
    "expert_valuation_report": {
        "owner_name":           "Property owner full name",
        "applicant_name":       "Applicant full name",
        "inspection_date":      "Date of inspection",
        "valuation_date":       "Date on which valuation is made",
        "survey_number":        "Survey / SF number",
        "address_documents":    "Address as per documents",
        "address_postal":       "Address as per actual/postal",
        "property_type":        "Leasehold / Freehold",
        "property_zone":        "Residential / Commercial / Industrial / Agricultural",
        "area_classification":  "High / Middle / Poor",
        "location_classification": "Urban / Semi Urban / Rural",
        "local_body":           "Corporation / Municipality / Panchayat details",
        "govt_enactment_covered": "Whether covered under any state/central enactments",
        "conversion_contemplated": "Whether agricultural land conversion to house sites is contemplated",
        "land_area":            "Land area with unit",
        "latitude_longitude":   "Latitude and longitude / coordinates",
        "demarcation":          "Compound wall / side stone / fencing details",
        "occupancy_details":    "Floor-wise occupancy summary",
        "road_type":            "Type of road available at present",
        "road_width":           "Width of road with unit",
        "land_locked":          "Whether land locked",
        "guideline_rate":       "Guideline rate per sq ft",
        "guideline_value":      "Guideline value in INR",
        "market_rate":          "Prevailing market rate per sq ft",
        "market_land_value":    "Prevailing market value of land in INR",
        "building_type":        "Type of building",
        "construction_type":    "Type of construction",
        "building_age":         "Age of building",
        "residual_age":         "Residual age of building",
        "plan_issuing_authority": "Approved map/plan issuing authority",
        "plan_verified":        "Whether approved map / plan is verified",
        "plan_authenticity_comments": "Other comments on authenticity of approved plan",
        "building_violation":   "Any deviation from approved plan / floor violation / BUA deviation",
        "market_value":         "Overall market value in INR if shown",
        "realizable_value":     "Realizable value in INR if shown",
        "distress_value":       "Distress value in INR if shown",
        "remarks":              "Important remarks as list of short bullet-style sentences",
    },
    "land_document": {
        "owner_name":     "Owner full name",
        "survey_number":  "Survey number",
        "area":           "Land area",
        "location":       "Location / village / taluk",
        "sale_amount":    "Sale consideration if present",
        "date":           "Execution / registration date",
    },
}

DETAILS_JSON_SCHEMA = {
    "I. Property Details": {
        "1. Purpose for which the valuation is made": "",
        "2. a) Date of inspection": "",
        "2. b) Date on which the valuation is made": "",
        "3. List of documents produced for Perusal with No. & date": {
            "i": "",
            "ii": "",
            "iii": "",
            "iv": "",
            "v": ""
        },
        "4. Name of the owner(s)": "",
        "5. Name of the applicant(s)": "",
        "6. The address of the property (including pin code)": {
            "As per Documents": "",
            "As per actual/ postal": ""
        },
        "7. Deviations If any": "",
        "8. The property type (Leasehold/ Freehold)": "",
        "9. Property Zone (Residential/ Commercial/ Industrial/Agricultural)": "",
        "10. Classification of the area": {
            "i) High / Middle / Poor": "",
            "ii) Urban / Semi Urban / Rural": ""
        },
        "11. Coming under Corporation limit / Village Panchayat / Municipality": "",
        "12. Whether covered under any State / Central Govt. enactments (e.g. Urban Land Ceiling Act) or notified under agency area / scheduled area / cantonment area": "",
        "13. In case it is an agricultural land, any conversion to house site plots is contemplated": ""
    },
    "14. Boundaries of the property": {
        "North": {"As per documents": "", "As per Site": ""},
        "South": {"As per documents": "", "As per Site": ""},
        "East": {"As per documents": "", "As per Site": ""},
        "West": {"As per documents": "", "As per Site": ""},
        "Deviations If any": ""
    },
    "15. Dimensions of the site": {
        "North": {"As per Actuals": "", "As per documents": "", "Adopted area in Sft": ""},
        "South": {"As per Actuals": "", "As per documents": "", "Adopted area in Sft": ""},
        "East": {"As per Actuals": "", "As per documents": "", "Adopted area in Sft": ""},
        "West": {"As per Actuals": "", "As per documents": "", "Adopted area in Sft": ""},
        "Total Area": {"As per Actuals": "", "As per documents": "", "Adopted area in Sft": ""},
        "Deviations If any": ""
    },
    "Part – A (Valuation of land)": {
        "2. Guideline rate obtained from the Registrar’s Office (an evidence thereof to be enclosed)": {
            "Land area in Sq Ft": "",
            "Rate per Sq ft": "",
            "Value in Rs.": ""
        },
        "3. Prevailing market value of the land": {
            "Land area in Sq Ft": "",
            "Rate per Sq ft": "",
            "Value in Rs.": ""
        }
    },
    "Part – B (Valuation of Building)": {
        "1. Technical details of the building": {
            "a) Type of Building (Residential / Commercial / Industrial)": "",
            "b) Type of construction (Load bearing / RCC / Steel Framed)": "",
            "c) Age of the building": "",
            "d) Residual age of the building": "",
            "e) Approved map / plan issuing authority": "",
            "f) Whether genuineness or authenticity of approved map / plan is verified": "",
            "g) Any other comments by our empanelled valuers on authentic of approved plan": ""
        },
        "Details of valuation": [
            {
                "Sr. no.": "",
                "Particulars of item": "",
                "Built up area As per Approved Plan/FSI": "",
                "Built up area As per Actual": "",
                "Area considered for the valuation": "",
                "Replacement cost of construction": "",
                "Replacement cost in Rs.": "",
                "Depreciation in Rs.": "",
                "Net value after depreciations Rs.": ""
            }
        ],
        "Total": {
            "Replacement cost": "",
            "Depreciation": "",
            "Net value": ""
        }
    }
}

