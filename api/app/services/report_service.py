import os
from typing import Dict
import asyncio
import logging
from app.models.report import DocumentRequest, DocumentResponse, PageData, ProcessingStatus
from app.services.ocr_service import OCRService
from app.services.translation_service import TranslationService
from app.streaming.sse_manager import SSEManager
from app.repositories.report_repo import OriginalFileRepository
from app.core.config import config
from datetime import datetime
from app.db.session import original_files
import re

from app.db.session import db
from bson import ObjectId

logger = logging.getLogger(__name__)

def contains_tamil(text: str) -> bool:
    return bool(re.search(r"[\u0B80-\u0BFF]", text))

class DocumentProcessingService:
    def __init__(self):
        self.ocr_service = OCRService()
        self.translation_service = TranslationService(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.sse_manager = SSEManager()
        self.active_processes: Dict[str, asyncio.Task] = {}    
    
    async def import_document(self, file_path: str) -> str:
        """
        OCR + translate a document and return final legal English text
        """

        # OCR page-by-page
        pages = self.ocr_service.extract_text_from_pdf(file_path)

        final_pages = []

        for page_num, text in pages:
            if not text.strip():
                continue

            # Tamil or mixed → translate
            if contains_tamil(text):
                try:
                    translated = await self.translation_service.translate_to_legal_english(
                        tamil_text=text,
                        page_num=page_num
                    )
                    final_pages.append(
                        f"Page {page_num}\n{translated}"
                    )
                except Exception as e:
                    logger.warning(
                        f"Translation failed for page {page_num}, using raw OCR text: {e}"
                    )
                    # Fall back to raw OCR text so import still succeeds
                    final_pages.append(
                        f"Page {page_num}\n{text.strip()}"
                    )
            else:
                # Already English
                final_pages.append(
                    f"Page {page_num}\n{text.strip()}"
                )

        return "\n\n".join(final_pages)
      
    async def process_document(self, request: DocumentRequest, document_id: str, user_id: str = "system") -> str:
        """Dispatch document processing to Celery"""
        from app.celery_app import celery_app
        from app.db.session import original_files as orig_col
        from bson import ObjectId
        from datetime import datetime

        logger.info(f"Dispatching document processing to Celery: {document_id}")

        # Initial status
        orig_col.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"processing_status": "queued", "updated_at": datetime.utcnow()}},
        )

        # Dispatch
        task = celery_app.send_task(
            "app.tasks.process_task.process_document_task",
            args=[document_id, user_id],
            queue="document_processing",
            task_id=document_id
        )

        return document_id

    def get_sse_stream(self, document_id: str):
        """Get SSE stream for document updates"""
        logger.info(f"Establishing SSE stream for document: {document_id}")
        return self.sse_manager.event_generator(document_id)

    def generate_pdf(self, title: str, content: str) -> bytes:
        """Generate PDF from report content"""
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        import io
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='Justify', alignment=1))

        Story = []
        
        # Title
        Story.append(Paragraph(title, styles["Title"]))
        Story.append(Spacer(1, 12))

        # Content - Split by newlines and handle basic markdown-like structure
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                Story.append(Spacer(1, 12))
                continue
            
            # Simple markdown handling
            if line.startswith('#'):
                # Headers
                header_level = len(line) - len(line.lstrip('#'))
                text = line.lstrip('#').strip()
                style_name = "Heading1" if header_level == 1 else "Heading2"
                Story.append(Paragraph(text, styles[style_name]))
            elif line.startswith('- ') or line.startswith('* '):
                # Bullets
                text = line[2:].strip()
                Story.append(Paragraph(f"• {text}", styles["BodyText"]))
            else:
                # Normal text
                Story.append(Paragraph(line, styles["BodyText"]))
            
        doc.build(Story)
        buffer.seek(0)
        return buffer.getvalue()


class JSONReportBuilder:
    def __init__(self, output_path: str):
        self.out = output_path

    def _doc_map(self, report: ValidationReport) -> dict:
        return {doc.doc_type: doc for doc in report.documents}

    def _get_field(self, docs: dict, doc_type: str, *path: str) -> Optional[str]:
        doc = docs.get(doc_type)
        if not doc:
            return None
        value = doc.extracted_fields
        for key in path:
            if not isinstance(value, dict):
                return None
            value = value.get(key)
        return value

    def _blank(self, value) -> bool:
        return value is None or str(value).strip() in {"", "--", "null", "None"}

    def _fill_if_blank(self, container: dict, keys: List[str], value: Optional[str]):
        if self._blank(value):
            return
        target = container
        for key in keys[:-1]:
            target = target[key]
        if self._blank(target.get(keys[-1])):
            target[keys[-1]] = str(value).strip()

    def _with_supporting_document_fills(self, report: ValidationReport) -> dict:
        docs = self._doc_map(report)
        evr = docs.get("expert_valuation_report")
        base = _schema_merge(DETAILS_JSON_SCHEMA, evr.extracted_fields if evr else {})

        self._fill_if_blank(base, ["I. Property Details", "4. Name of the owner(s)"], self._get_field(docs, "title_verification_report", "owner_name"))
        self._fill_if_blank(base, ["I. Property Details", "4. Name of the owner(s)"], self._get_field(docs, "property_tax", "owner_name"))
        self._fill_if_blank(base, ["I. Property Details", "5. Name of the applicant(s)"], base["I. Property Details"]["4. Name of the owner(s)"])
        self._fill_if_blank(base, ["I. Property Details", "6. The address of the property (including pin code)", "As per Documents"], self._get_field(docs, "title_verification_report", "location"))
        self._fill_if_blank(base, ["I. Property Details", "6. The address of the property (including pin code)", "As per actual/ postal"], self._get_field(docs, "property_tax", "address"))
        self._fill_if_blank(base, ["I. Property Details", "6. The address of the property (including pin code)", "As per actual/ postal"], self._get_field(docs, "electricity_bill", "address"))
        self._fill_if_blank(base, ["15. Dimensions of the site", "Total Area", "As per documents"], self._get_field(docs, "title_verification_report", "area_sqft"))
        self._fill_if_blank(base, ["15. Dimensions of the site", "Total Area", "Adopted area in Sft"], self._get_field(docs, "title_verification_report", "area_sqft"))
        self._fill_if_blank(base, ["Part – A (Valuation of land)", "2. Guideline rate obtained from the Registrar’s Office (an evidence thereof to be enclosed)", "Rate per Sq ft"], self._get_field(docs, "expert_valuation_report", "guideline_rate"))
        self._fill_if_blank(base, ["Part – A (Valuation of land)", "2. Guideline rate obtained from the Registrar’s Office (an evidence thereof to be enclosed)", "Value in Rs."], self._get_field(docs, "expert_valuation_report", "guideline_value"))
        self._fill_if_blank(base, ["Part – A (Valuation of land)", "3. Prevailing market value of the land", "Rate per Sq ft"], self._get_field(docs, "expert_valuation_report", "market_rate"))
        self._fill_if_blank(base, ["Part – A (Valuation of land)", "3. Prevailing market value of the land", "Value in Rs."], self._get_field(docs, "title_verification_report", "market_value"))

        return base

    def build(self, report):
        result = self._with_supporting_document_fills(report)
        Path(self.out).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\n[Done] JSON saved to: {self.out}")
        return self.out, result

class ReportBuilder:
    FRAME_X = 8
    FRAME_Y = 8
    FRAME_W = 194
    FRAME_H = 281
    CONTENT_X = 12
    CONTENT_TOP_Y = 14
    CONTENT_W = 186
    TABLE_WIDTHS = [15, 82, 89]

    def __init__(self, output_path: str):
        self.out = output_path
        self.pdf = FPDF(format="A4")
        self.pdf.set_auto_page_break(auto=False)
        self.pdf.set_margins(12, 12, 12)

    def sanitize(self, text):
        import textwrap
        if text is None:
            text = "--"
        if isinstance(text, list):
            text = "\n".join(f"- {self.sanitize(item)}" for item in text if item)
        elif not isinstance(text, str):
            text = str(text)
        text = text.replace('₹', 'Rs. ').replace('—', '-').replace('–', '-').replace('‘', "'").replace('’', "'").replace('“', '"').replace('”', '"')
        text = text.replace("\r", "\n")
        raw_lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
        text = text.encode('latin-1', 'ignore').decode('latin-1')
        wrapped = []
        for line in raw_lines:
            wrapped.extend(textwrap.wrap(line, width=60, break_long_words=True, break_on_hyphens=True) or [""])
        return "\n".join(wrapped).strip() or "--"

    def _is_blank(self, value) -> bool:
        if value is None:
            return True
        text = str(value).strip()
        return text == "" or text.lower() in {"null", "none", "--", "[not on this page]"}

    def _clean_value(self, value: Optional[str]) -> str:
        text = self.sanitize(value)
        return "--" if self._is_blank(text) else text

    def _doc_map(self, report: ValidationReport) -> dict:
        return {doc.doc_type: doc for doc in report.documents}

    def _get_field(self, docs: dict, doc_type: str, field_name: str) -> Optional[str]:
        doc = docs.get(doc_type)
        if not doc:
            return None
        return doc.extracted_fields.get(field_name)

    def _first_value(self, docs: dict, *pairs) -> str:
        for doc_type, field_name in pairs:
            value = self._get_field(docs, doc_type, field_name)
            if not self._is_blank(value):
                return self._clean_value(value)
        return "--"

    def _normalize_name(self, text: str) -> str:
        text = re.sub(r"[^A-Za-z0-9]+", " ", text or "").strip()
        return text.title() if text else "--"

    def _compact_list(self, value) -> List[str]:
        if isinstance(value, list):
            return [self._clean_value(v) for v in value if not self._is_blank(v)]
        if self._is_blank(value):
            return []
        return [self._clean_value(value)]

    def _property_details(self, docs: dict) -> str:
        survey = self._first_value(
            docs,
            ("title_verification_report", "survey_number"),
            ("property_tax", "survey_number"),
            ("encumbrance_verification_report", "survey_number"),
        )
        address = self._first_value(
            docs,
            ("title_verification_report", "location"),
            ("property_tax", "address"),
            ("electricity_bill", "address"),
        )
        assessment_no = self._get_field(docs, "property_tax", "assessment_no")
        parts = []
        if not self._is_blank(survey):
            parts.append(f"Survey / SF No.: {survey}")
        if not self._is_blank(assessment_no):
            parts.append(f"Assessment No.: {self._clean_value(assessment_no)}")
        if not self._is_blank(address):
            parts.append(f"Address: {address}")
        return "\n".join(parts) if parts else "--"

    def _value_block(self, docs: dict) -> str:
        market = self._first_value(docs, ("title_verification_report", "market_value"))
        realizable = self._first_value(docs, ("title_verification_report", "realizable_value"))
        distress = self._first_value(docs, ("title_verification_report", "distress_value"))
        return "\n".join([
            f"Market Value: {market}",
            f"Realizable Value: {realizable}",
            f"Distress Value: {distress}",
        ])

    def _remarks(self, report: ValidationReport, docs: dict) -> List[str]:
        remarks = []
        tvr_remarks = self._compact_list(self._get_field(docs, "title_verification_report", "remarks"))
        remarks.extend(tvr_remarks)
        violation = self._get_field(docs, "title_verification_report", "building_violation")
        if not self._is_blank(violation):
            remarks.append(self._clean_value(violation))
        for issue in report.cross_doc_issues[:3]:
            if not self._is_blank(issue):
                remarks.append(self._clean_value(issue))
        deduped = []
        seen = set()
        for item in remarks:
            key = item.lower()
            if key not in seen:
                deduped.append(item)
                seen.add(key)
        return deduped or ["No additional remarks recorded."]

    def _note(self, docs: dict) -> str:
        property_tax_period = self._get_field(docs, "property_tax", "period")
        if not self._is_blank(property_tax_period):
            return f"Latest property tax period available: {self._clean_value(property_tax_period)}"
        return "Latest supporting tax receipt to be obtained if not already enclosed."

    def _page_frame(self):
        self.pdf.rect(self.FRAME_X, self.FRAME_Y, self.FRAME_W, self.FRAME_H)

    def _title(self, text: str):
        self.pdf.set_xy(self.CONTENT_X, self.CONTENT_TOP_Y)
        self.pdf.set_font("Times", "BU", 15)
        self.pdf.cell(self.CONTENT_W, 8, self.sanitize(text), align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.pdf.ln(2)

    def _section_text(self, text: str):
        self.pdf.set_x(self.CONTENT_X)
        self.pdf.set_font("Times", "", 11.5)
        self.pdf.cell(self.CONTENT_W, 7, self.sanitize(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def _estimate_lines(self, text: str, width: float, font_size: float) -> int:
        plain = self.sanitize(text)
        approx_chars = max(10, int(width / max(font_size * 0.23, 1)))
        line_count = 0
        for para in plain.split("\n"):
            line_count += max(1, (len(para) // approx_chars) + (1 if len(para) % approx_chars else 0))
        return max(1, line_count)

    def _table_row(self, cells: List[str], widths: List[float], aligns: Optional[List[str]] = None,
                   styles: Optional[List[str]] = None, font_size: float = 9.4, line_h: float = 5.0,
                   min_height: float = 10):
        pdf = self.pdf
        x0 = pdf.get_x()
        y0 = pdf.get_y()
        aligns = aligns or ["L"] * len(cells)
        styles = styles or [""] * len(cells)
        rendered_cells = []
        text_heights = []
        for cell, width in zip(cells, widths):
            rendered = "" if cell == "" else self.sanitize(cell)
            rendered_cells.append(rendered)
            text_heights.append(
                self._estimate_lines(rendered, width - 3, font_size) * line_h if rendered else line_h
            )
        row_h = max(min_height, max(height + 2 for height in text_heights))
        for idx, width in enumerate(widths):
            x = pdf.get_x()
            y = pdf.get_y()
            pdf.rect(x, y, width, row_h)
            rendered = rendered_cells[idx]
            if rendered:
                text_h = text_heights[idx]
                y_offset = max(1.0, (row_h - text_h) / 2)
                pdf.set_font("Times", styles[idx], font_size)
                if width <= 8:
                    pdf.set_xy(x, y + y_offset)
                    pdf.cell(width, line_h, rendered, align=aligns[idx])
                else:
                    pdf.set_xy(x + 1.5, y + y_offset)
                    pdf.multi_cell(max(width - 3, 1), line_h, rendered, align=aligns[idx], border=0)
            pdf.set_xy(x + width, y)
        pdf.set_xy(x0, y0 + row_h)

    def _header_row(self):
        self.pdf.set_x(self.CONTENT_X)
        self.pdf.set_font("Times", "B", 11)
        self._table_row(
            ["Sl. No.", "Particulars", "Details"],
            self.TABLE_WIDTHS,
            aligns=["C", "C", "C"],
            styles=["B", "B", "B"],
            font_size=11,
            line_h=5.4,
            min_height=8,
        )

    def _collect_template_data(self, report: ValidationReport) -> dict:
        docs = self._doc_map(report)
        owner_name = self._normalize_name(self._first_value(
            docs,
            ("title_verification_report", "owner_name"),
            ("property_tax", "owner_name"),
            ("encumbrance_verification_report", "owner_name"),
            ("electricity_bill", "consumer_name"),
        ))
        recommendation = self._first_value(docs, ("title_verification_report", "recommendation"))
        if recommendation == "--":
            recommendation = "Yes" if not report.cross_doc_issues else "--"
        property_category = self._first_value(docs, ("title_verification_report", "property_category"))
        if property_category == "--":
            property_category = "Land And Building" if not self._is_blank(self._get_field(docs, "title_verification_report", "building_area_sqft")) else "--"
        data = {
            "branch_office": "--",
            "purpose": "Fresh",
            "owner_name": owner_name,
            "property_details": self._property_details(docs),
            "land_area": self._first_value(
                docs,
                ("title_verification_report", "area_sqft"),
                ("encumbrance_verification_report", "area"),
            ),
            "building_area": self._first_value(docs, ("title_verification_report", "building_area_sqft")),
            "latitude_longitude": self._first_value(docs, ("title_verification_report", "latitude_longitude")),
            "value_block": self._value_block(docs),
            "final_valuation": self._value_block(docs),
            "demarcation": "Yes" if not self._is_blank(self._get_field(docs, "title_verification_report", "location")) else "--",
            "layout_verified": self._first_value(docs, ("title_verification_report", "layout_approval")),
            "road_width": self._first_value(docs, ("title_verification_report", "road_width")),
            "road_type": self._first_value(docs, ("title_verification_report", "road_type")),
            "revenue_nature": self._first_value(docs, ("title_verification_report", "property_nature")),
            "rera_approval": "NA",
            "site_nature": self._first_value(docs, ("title_verification_report", "property_nature")),
            "occupancy_status": self._first_value(docs, ("title_verification_report", "occupancy_status")),
            "property_category": property_category,
            "other_remarks": self._first_value(docs, ("title_verification_report", "building_violation")),
            "guidelines_complied": "Yes" if not report.cross_doc_issues else "Refer remarks",
            "recommendation": recommendation,
            "pre_disbursement_conditions": self._first_value(docs, ("title_verification_report", "pre_disbursement_conditions")),
            "remarks": self._remarks(report, docs),
            "note": self._note(docs),
            "manager_name": "Technical Manager",
            "designation": "Regional Technical Manager",
            "generated_on": datetime.now().strftime("%d.%m.%Y %H:%M"),
            "cross_matches": report.cross_doc_matches[:3],
        }
        if data["layout_verified"] == "--":
            data["layout_verified"] = "Yes" if data["property_details"] != "--" else "--"
        if data["occupancy_status"] == "--":
            data["occupancy_status"] = "Self-occupied" if data["building_area"] != "--" else "--"
        if data["site_nature"] == "--":
            data["site_nature"] = "Residential" if "residential" in data["remarks"][0].lower() else "--"
        if data["revenue_nature"] == "--":
            data["revenue_nature"] = data["site_nature"]
        if data["road_width"] == "--":
            data["road_width"] = "30 Feet Road" if any("road" in item.lower() for item in data["cross_matches"]) else "--"
        return data

    def _build_page_one(self, data: dict):
        self.pdf.add_page()
        self._page_frame()
        self._title("Format for Technical Assessment of Immovable Properties")
        self._section_text("Part A: Details of the property")
        self._header_row()
        widths = self.TABLE_WIDTHS
        self.pdf.set_x(self.CONTENT_X)
        self._table_row(["1.", "Name of Branch/Office from where the Technical vetting request has initiated", data["branch_office"]], widths, aligns=["C", "L", "C"], styles=["B", "", "B"], min_height=16)
        self._table_row(["2.", "Purpose of EVR and subsequent Technical vetting (Renewal/Enhancement/Fresh)", data["purpose"]], widths, aligns=["C", "L", "C"], styles=["B", "", "B"], min_height=14)
        self._table_row(["3.", "Name of the property owner", data["owner_name"]], widths, aligns=["C", "L", "C"], styles=["B", "", "B"], min_height=12)
        self._table_row(["4.", "Details of Property (Location, Sy. No., Village, Taluka, District, Pin code etc)", data["property_details"]], widths, aligns=["C", "L", "L"], styles=["B", "", "B"], min_height=26)
        self._table_row(["5.", "Area of Property - Land", data["land_area"]], widths, aligns=["C", "L", "C"], styles=["B", "", "B"], min_height=9)
        self._table_row(["", "Area of Property - Building", data["building_area"]], widths, aligns=["C", "L", "C"], styles=["", "", "B"], min_height=9)
        self._table_row(["6.", "Latitude & longitude of the property (as confirmed by the valuer)", data["latitude_longitude"]], widths, aligns=["C", "L", "C"], styles=["B", "", "B"], min_height=13)
        self._table_row(["7.", "Value of the property as per the Expert Valuation Report", data["value_block"]], widths, aligns=["C", "L", "C"], styles=["B", "", "B"], min_height=20)
        self._section_text("Part B : Technical Assessment")
        self._header_row()
        rows = [
            ("1.", "Final Valuation accepted by Technical team", data["final_valuation"]),
            ("2.", "Demarcation observed such as Fencing/Boundary walls (Yes/No)", data["demarcation"]),
            ("3.", "Property identification sketch verified (Yes/No)", data["layout_verified"]),
            ("4.", "Width of the road (in feet)", data["road_width"]),
            ("5.", "Type of road (Mud / WBM / Bitumen / Concrete / Tar, Pathway access) and other please specify", data["road_type"]),
            ("6.", "Nature of the property as per revenue records (applicable to respective state laws)", data["revenue_nature"]),
            ("7.", "RERA Approval No. And Validity if the same is applicable (Mention N.A if not applicable)", data["rera_approval"]),
            ("8.", "Nature of the property as per site inspection (Residential/Commercial/Industrial/Agriculture/Others)", data["site_nature"]),
            ("9.", "Vacant / Partly Let Out / Fully Let out / Self Occupied property", data["occupancy_status"]),
        ]
        for row in rows:
            self.pdf.set_x(self.CONTENT_X)
            self._table_row(list(row), widths, aligns=["C", "L", "C"], styles=["", "", "B"], min_height=11)

    def _build_page_two(self, data: dict):
        self.pdf.add_page()
        self._page_frame()
        self.pdf.set_xy(self.CONTENT_X, 12)
        widths = self.TABLE_WIDTHS
        rows = [
            ("10.", "Vacant land / land and building / Flat / Office", data["property_category"]),
            ("11.", "Any other remarks (restricted properties, HTL, CRZ, Burial Ground, Water logging etc.) Please specify", data["other_remarks"]),
            ("12.", "Are the guidelines on Policy of Valuation of Security complied with (Yes/No). If no, specify the details", data["guidelines_complied"]),
            ("13.", "Whether the property is recommended for Renewal/Enhancement/fresh limit (YES/NO)", data["recommendation"]),
            ("14.", "Pre disbursement conditions if any", data["pre_disbursement_conditions"]),
        ]
        for row in rows:
            self.pdf.set_x(self.CONTENT_X)
            self._table_row(list(row), widths, aligns=["C", "L", "C"], styles=["", "", "B"], min_height=10 if row[0] != "11." else 28)

        self.pdf.ln(8)
        self.pdf.set_x(self.CONTENT_X)
        self.pdf.set_font("Times", "B", 12.5)
        self.pdf.cell(self.CONTENT_W, 7, "Remarks:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.pdf.set_font("Times", "B", 10.5)
        for item in data["remarks"]:
            self.pdf.set_x(18)
            self.pdf.cell(4, 5.5, chr(149))
            self.pdf.multi_cell(160, 5.5, self.sanitize(item))

        self.pdf.ln(3)
        self.pdf.set_x(self.CONTENT_X)
        self.pdf.set_font("Times", "B", 12)
        self.pdf.cell(self.CONTENT_W, 7, "Note:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.pdf.set_font("Times", "B", 10.5)
        self.pdf.set_x(self.CONTENT_X)
        self.pdf.multi_cell(self.CONTENT_W, 5.5, self.sanitize(data["note"]))

        self.pdf.set_y(245)
        self.pdf.set_font("Times", "", 10.5)
        self.pdf.set_x(self.CONTENT_X)
        self.pdf.multi_cell(90, 6, self.sanitize(
            f"Name of the Technical Manager: {data['manager_name']}\n"
            f"Designation: {data['designation']}\n"
            f"Generated on: {data['generated_on']}"
        ))
        self.pdf.set_xy(130, 245)
        self.pdf.set_font("Times", "B", 12.5)
        self.pdf.cell(55, 8, "Signature of the Official", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.pdf.set_xy(130, 256)
        self.pdf.set_font("Helvetica", "", 8.5)
        self.pdf.multi_cell(55, 4.5, "Digitally generated validation output", align="C")

    def _evr_first(self, docs: dict, *pairs) -> str:
        return self._first_value(docs, *pairs)

    def _collect_evr_data(self, report: ValidationReport) -> dict:
        docs = self._doc_map(report)
        evr_type = "expert_valuation_report"
        doc_name_list = []
        if not self._is_blank(self._get_field(docs, evr_type, "survey_number")):
            doc_name_list.append("Copy of valuation working papers")
        if not self._is_blank(self._get_field(docs, "property_tax", "assessment_no")):
            doc_name_list.append(f"Copy of property tax receipt - Assessment No. {self._clean_value(self._get_field(docs, 'property_tax', 'assessment_no'))}")
        if not self._is_blank(self._get_field(docs, "electricity_bill", "consumer_number")):
            doc_name_list.append(f"Copy of EB receipt - Service No. {self._clean_value(self._get_field(docs, 'electricity_bill', 'consumer_number'))}")
        if not self._is_blank(self._get_field(docs, "title_verification_report", "survey_number")):
            doc_name_list.append("Copy of title / technical verification report")
        documents_reviewed = doc_name_list or ["--"]
        return {
            "purpose": "Valuation for bank review",
            "inspection_date": self._evr_first(docs, (evr_type, "inspection_date")),
            "valuation_date": self._evr_first(docs, (evr_type, "valuation_date")),
            "documents_reviewed": documents_reviewed,
            "owner_name": self._evr_first(docs, (evr_type, "owner_name"), ("title_verification_report", "owner_name"), ("property_tax", "owner_name")),
            "applicant_name": self._evr_first(docs, (evr_type, "applicant_name"), (evr_type, "owner_name"), ("title_verification_report", "owner_name")),
            "address_documents": self._evr_first(docs, (evr_type, "address_documents"), ("title_verification_report", "location")),
            "address_postal": self._evr_first(docs, (evr_type, "address_postal"), ("property_tax", "address"), ("electricity_bill", "address")),
            "deviations": self._evr_first(docs, (evr_type, "building_violation"), ("title_verification_report", "building_violation")),
            "property_type": self._evr_first(docs, (evr_type, "property_type")),
            "property_zone": self._evr_first(docs, (evr_type, "property_zone"), ("title_verification_report", "property_nature")),
            "area_classification": self._evr_first(docs, (evr_type, "area_classification")),
            "location_classification": self._evr_first(docs, (evr_type, "location_classification")),
            "local_body": self._evr_first(docs, (evr_type, "local_body")),
            "govt_enactment_covered": self._evr_first(docs, (evr_type, "govt_enactment_covered")),
            "conversion_contemplated": self._evr_first(docs, (evr_type, "conversion_contemplated")),
            "survey_number": self._evr_first(docs, (evr_type, "survey_number"), ("title_verification_report", "survey_number"), ("property_tax", "survey_number")),
            "land_area": self._evr_first(docs, (evr_type, "land_area"), ("title_verification_report", "area_sqft")),
            "latitude_longitude": self._evr_first(docs, (evr_type, "latitude_longitude"), ("title_verification_report", "latitude_longitude")),
            "demarcation": self._evr_first(docs, (evr_type, "demarcation")),
            "occupancy_details": self._evr_first(docs, (evr_type, "occupancy_details"), ("title_verification_report", "occupancy_status")),
            "road_type": self._evr_first(docs, (evr_type, "road_type"), ("title_verification_report", "road_type")),
            "road_width": self._evr_first(docs, (evr_type, "road_width"), ("title_verification_report", "road_width")),
            "land_locked": self._evr_first(docs, (evr_type, "land_locked")),
            "guideline_rate": self._evr_first(docs, (evr_type, "guideline_rate")),
            "guideline_value": self._evr_first(docs, (evr_type, "guideline_value")),
            "market_rate": self._evr_first(docs, (evr_type, "market_rate")),
            "market_land_value": self._evr_first(docs, (evr_type, "market_land_value"), ("title_verification_report", "market_value")),
            "building_type": self._evr_first(docs, (evr_type, "building_type"), ("title_verification_report", "property_nature")),
            "construction_type": self._evr_first(docs, (evr_type, "construction_type")),
            "building_age": self._evr_first(docs, (evr_type, "building_age")),
            "residual_age": self._evr_first(docs, (evr_type, "residual_age")),
            "plan_issuing_authority": self._evr_first(docs, (evr_type, "plan_issuing_authority")),
            "plan_verified": self._evr_first(docs, (evr_type, "plan_verified")),
            "plan_authenticity_comments": self._evr_first(docs, (evr_type, "plan_authenticity_comments")),
            "remarks": self._compact_list(self._get_field(docs, evr_type, "remarks")) or self._remarks(report, docs),
        }

    def _evr_main_row(self, number: str, label: str, value: str, min_height: float = 10):
        self.pdf.set_x(self.CONTENT_X)
        self._table_row([number, label, ":", value], [13, 91, 5, 77], aligns=["C", "L", "C", "L"], min_height=min_height)

    def _evr_page_one(self, data: dict):
        self.pdf.add_page()
        self._page_frame()
        self.pdf.set_xy(20, 20)
        self.pdf.set_font("Times", "", 13)
        self.pdf.multi_cell(80, 7, "TO,\nThe South Indian Bank Ltd\nCoimbatore Branch")
        self.pdf.ln(10)
        self.pdf.set_font("Times", "B", 14)
        self.pdf.cell(0, 8, "VALUATION REPORT (IN RESPECT OF LAND / SITE AND BUILDING)", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.pdf.ln(2)
        self.pdf.set_font("Times", "", 12)
        self.pdf.cell(0, 7, "(To be filled in by the Approved Valuer)", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.pdf.ln(8)
        self.pdf.set_x(self.CONTENT_X)
        self._table_row(["I.", "Property Details", "", ""], [13, 91, 5, 77], styles=["B", "B", "", ""], min_height=8)
        self._evr_main_row("1.", "Purpose for which the valuation is made", data["purpose"], 9)
        self._evr_main_row("2.a)", "Date of inspection", data["inspection_date"], 9)
        self._evr_main_row("2.b)", "Date on which the valuation is made", data["valuation_date"], 11)
        self.pdf.set_x(self.CONTENT_X)
        self._table_row(["3.", "List of documents produced for Perusal with No. & date.", "", ""], [9, 95, 5, 77], min_height=9)
        for idx, item in enumerate(data["documents_reviewed"], 1):
            self._evr_main_row("", f"{idx}) Document", item, 10)
        self._evr_main_row("4.", "Name of the owner(s)", data["owner_name"], 9)
        self._evr_main_row("5.", "Name of the applicant(s)", data["applicant_name"], 9)

    def _evr_page_two(self, data: dict):
        self.pdf.add_page()
        self._page_frame()
        self.pdf.set_xy(self.CONTENT_X, 14)
        self.pdf.set_x(self.CONTENT_X)
        self._table_row(["6.", "The address of the property (including pin code)", "As per Documents", ":", data["address_documents"]], [13, 52, 46, 5, 70], min_height=24)
        self.pdf.set_x(self.CONTENT_X)
        self._table_row(["", "", "As per actual/ postal", ":", data["address_postal"]], [13, 52, 46, 5, 70], min_height=18)
        self._evr_main_row("7.", "Deviations If any", data["deviations"], 9)
        self._evr_main_row("8.", "The property type (Leasehold/ Freehold)", data["property_type"], 9)
        self._evr_main_row("9.", "Property Zone (Residential/ Commercial/ Industrial/ Agricultural)", data["property_zone"], 11)
        self._evr_main_row("10.i)", "Classification of the area - High / Middle / Poor", data["area_classification"], 9)
        self._evr_main_row("10.ii)", "Urban / Semi Urban / Rural", data["location_classification"], 9)
        self._evr_main_row("11.", "Coming under Corporation limit / Village Panchayat / Municipality", data["local_body"], 11)
        self._evr_main_row("12.", "Whether covered under any State / Central Govt. enactments", data["govt_enactment_covered"], 12)
        self._evr_main_row("13.", "Any conversion to house site plots is contemplated", data["conversion_contemplated"], 10)
        self._evr_main_row("14.", "Survey / SF number", data["survey_number"], 10)
        self._evr_main_row("15.", "Land area", data["land_area"], 9)

    def _evr_page_three(self, data: dict):
        self.pdf.add_page()
        self._page_frame()
        self.pdf.set_xy(self.CONTENT_X, 14)
        self._evr_main_row("16.", "Latitude, Longitude and Coordinates of the site", data["latitude_longitude"], 9)
        self._evr_main_row("17.", "Demarcation (Compound wall/Side stone/fencing)", data["demarcation"], 12)
        self._evr_main_row("18.", "Occupancy / tenant details", data["occupancy_details"], 12)
        self._evr_main_row("19.", "Type of road available at present", data["road_type"], 9)
        self._evr_main_row("20.", "Width of road in feet", data["road_width"], 9)
        self._evr_main_row("21.", "Is it a land locked land?", data["land_locked"], 9)
        self.pdf.set_x(self.CONTENT_X)
        self._table_row(["Part - A (Valuation of land)"], [186], styles=["B"], min_height=8)
        self.pdf.set_x(self.CONTENT_X)
        self._table_row(["1.", "Details", "Land area in Sq Ft", "Rate / Value"], [13, 71, 45, 57], styles=["", "", "B", "B"], min_height=9)
        self.pdf.set_x(self.CONTENT_X)
        self._table_row(["2.", "Guideline rate obtained from Registrar's Office", data["land_area"], f"{data['guideline_rate']}\n{data['guideline_value']}"], [13, 71, 45, 57], min_height=16)
        self.pdf.set_x(self.CONTENT_X)
        self._table_row(["3.", "Prevailing market value of the land", data["land_area"], f"{data['market_rate']}\n{data['market_land_value']}"], [13, 71, 45, 57], min_height=16)
        self.pdf.set_x(self.CONTENT_X)
        self._table_row(["Part - B (Valuation of Building)"], [186], styles=["B"], min_height=8)
        self._evr_main_row("1.a)", "Type of Building", data["building_type"], 9)
        self._evr_main_row("1.b)", "Type of construction", data["construction_type"], 9)
        self._evr_main_row("1.c)", "Age of the building", data["building_age"], 9)
        self._evr_main_row("1.d)", "Residual age of the building", data["residual_age"], 9)
        self._evr_main_row("1.e)", "Approved map / plan issuing authority", data["plan_issuing_authority"], 12)
        self._evr_main_row("1.f)", "Whether approved map / plan is verified", data["plan_verified"], 9)
        self._evr_main_row("1.g)", "Comments on authenticity of approved plan", data["plan_authenticity_comments"], 10)

    def build(self, report: ValidationReport):
        data = self._collect_evr_data(report)
        self._evr_page_one(data)
        self._evr_page_two(data)
        self._evr_page_three(data)
        self.pdf.output(self.out)
        print(f"\n[Done] Report saved to: {self.out}")


# ─────────────────────────────────────────────
# Orchestrator
