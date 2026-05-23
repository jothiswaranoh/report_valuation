"""
Celery task: process_document_task
===================================
Pipeline
--------
1. Fetch file path from MongoDB (original_files collection)
2. OCR  → extract raw text per page
3. Translate each page (Tamil → legal English) via OpenAI
4. Simplify each page (legal → plain English)
5. Create a full-document AI summary
6. Persist output to ai_extracted_content collection
7. Write a translated PDF to the shared /app/uploads volume
8. Update original_files.status throughout so the frontend
   can poll /api/v1/jobs/{job_id} for live progress.

All DB writes use pymongo directly (no async) because Celery
tasks run in a regular synchronous worker process.
"""

import os
import io
import logging
import re
from datetime import datetime
from pathlib import Path

from celery import Task
from bson import ObjectId
from pymongo import MongoClient

from app.celery_app import celery_app

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_db():
    """Return the pymongo database handle (one connection per task call)."""
    mongo_uri = os.getenv("MONGO_URI", "mongodb://mongodb:27017")
    db_name   = os.getenv("MONGO_DB_NAME", "reportdb")
    client    = MongoClient(mongo_uri, serverSelectionTimeoutMS=5_000)
    return client[db_name]


def _set_status(db, document_id: str, status: str, extra: dict = None):
    """Update original_files.status (and any extra fields) in MongoDB."""
    update = {
        "processing_status": status,
        "updated_at": datetime.utcnow(),
    }
    if extra:
        update.update(extra)
    db["original_files"].update_one(
        {"_id": ObjectId(document_id)},
        {"$set": update},
    )
    logger.info("[%s] status → %s", document_id, status)


def detect_doc_type(file_path: str) -> str:
    from app.models.report import DOC_TYPE_MAP
    name = Path(file_path).stem
    for keyword, dtype in DOC_TYPE_MAP.items():
        if keyword.lower() in name.lower():
            return dtype
    return "land_document"

def _build_pdf(title: str, content: str) -> bytes:
    """Render a simple PDF from plain text using reportlab."""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        rightMargin=72, leftMargin=72,
        topMargin=72,   bottomMargin=18,
    )
    styles = getSampleStyleSheet()
    story  = [Paragraph(title, styles["Title"]), Spacer(1, 12)]

    for line in content.split("\n"):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 8))
            continue
        if line.startswith("#"):
            level = len(line) - len(line.lstrip("#"))
            text  = line.lstrip("#").strip()
            story.append(Paragraph(text, styles["Heading1" if level == 1 else "Heading2"]))
        elif line.startswith(("- ", "* ")):
            story.append(Paragraph(f"• {line[2:].strip()}", styles["BodyText"]))
        else:
            story.append(Paragraph(line, styles["BodyText"]))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Celery base class with shared retry logic
# ---------------------------------------------------------------------------

class BaseDocumentTask(Task):
    abstract = True
    # Automatically retry on transient network / rate-limit errors
    autoretry_for = (Exception,)
    retry_kwargs  = {"max_retries": 3, "countdown": 10}
    retry_backoff = True


# ---------------------------------------------------------------------------
# Main tasks
# ---------------------------------------------------------------------------

@celery_app.task(
    bind=True,
    base=BaseDocumentTask,
    name="app.tasks.process_task.generate_final_report_task",
    queue="document_processing",
    autoretry_for=(),
)
def generate_final_report_task(self, report_id: str):
    db = _get_db()
    try:
        from app.models.report import ValidationReport, DocumentRecord, PageRecord
        from app.services.validation_service import ValidationService
        from app.services.report_service import JSONReportBuilder, ReportBuilder
        import asyncio

        # Gather all docs from MongoDB
        docs = db["ai_extracted_content"].find({"report_id": ObjectId(report_id)})
        document_records = []
        for d in docs:
            file_doc = db["original_files"].find_one({"_id": d["original_file_id"]})
            file_path = file_doc["file_path"] if file_doc else "unknown"
            
            pages = []
            for p in d.get("page_results", []):
                pages.append(PageRecord(
                    page_number=p.get("page_number", 1),
                    raw_text=p.get("raw_text", ""),
                    simplified=p.get("simplified", "")
                ))
            
            document_records.append(DocumentRecord(
                file_path=file_path,
                doc_type=d.get("doc_type", "land_document"),
                pages=pages,
                summary=d.get("summary", ""),
                extracted_fields=d.get("extracted_fields", {})
            ))
            
        report = ValidationReport(documents=document_records)
        
        # Validation
        validator = ValidationService()
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        report = loop.run_until_complete(validator.validate(report))
        loop.close()
        
        # Generate JSON
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Create output directories if they don't exist
        os.makedirs("/tmp/data/output", exist_ok=True)
        json_output_path = f"/tmp/data/output/validation_details_{timestamp}.json"
        pdf_output_path = f"/tmp/data/output/validation_report_{timestamp}.pdf"
        
        json_builder = JSONReportBuilder(json_output_path)
        out_json_path, final_json = json_builder.build(report)
        
        # Generate PDF
        pdf_builder = ReportBuilder(pdf_output_path)
        out_pdf_path = pdf_builder.build(report, final_json)
        
        # Save to DB
        db["reports"].update_one(
            {"_id": ObjectId(report_id)},
            {
                "$set": {
                    "final_pdf_path": out_pdf_path,
                    "final_json_path": out_json_path,
                    "cross_doc_matches": report.cross_doc_matches,
                    "cross_doc_issues": report.cross_doc_issues,
                    "structured_json": final_json
                }
            }
        )
        
        logger.info(f"Final report generated for {report_id}")
        return {"report_id": report_id, "pdf": out_pdf_path}
    except Exception as exc:
        logger.error("Final report generation failed: %s", exc, exc_info=True)
        raise

@celery_app.task(
    bind=True,
    base=BaseDocumentTask,
    name="app.tasks.process_task.process_document_task",
    queue="document_processing",
    autoretry_for=(),
)
def process_document_task(self, document_id: str, user_id: str):
    db = _get_db()

    # ------------------------------------------------------------------ #
    # 0. Resolve file path from DB                                         #
    # ------------------------------------------------------------------ #
    try:
        _set_status(db, document_id, "processing")
        file_doc = db["original_files"].find_one({"_id": ObjectId(document_id)})
        if not file_doc:
            raise ValueError(f"document_id {document_id} not found in DB")

        file_path = file_doc.get("file_path")
        if not file_path or not os.path.exists(file_path):
            raise FileNotFoundError(f"File not on disk: {file_path}")

        file_type = file_doc.get("file_type", "pdf")
        is_pdf    = "pdf" in str(file_type).lower()
        report_id = str(file_doc.get("report_id", ""))
        file_name = file_doc.get("file_name", "document")

        logger.info("[%s] Starting processing: %s", document_id, file_path)

    except Exception as exc:
        logger.error("[%s] Setup failed: %s", document_id, exc, exc_info=True)
        _set_status(db, document_id, "failed", {"error_message": str(exc)})
        raise

    # ------------------------------------------------------------------ #
    # 1. OCR extraction                                                    #
    # ------------------------------------------------------------------ #
    try:
        _set_status(db, document_id, "ocr_started")

        from app.services.ocr_service import OCRService
        ocr = OCRService()

        if is_pdf:
            pages = ocr.extract_text_from_pdf(file_path)
        else:
            pages = ocr.extract_text_from_image(file_path)

        total_pages = len(pages)
        _set_status(db, document_id, "ocr_completed", {"total_pages": total_pages})
        logger.info("[%s] OCR done: %d pages", document_id, total_pages)

    except Exception as exc:
        logger.error("[%s] OCR failed: %s", document_id, exc, exc_info=True)
        _set_status(db, document_id, "failed", {"error_message": f"OCR failed: {exc}"})
        raise

    # ------------------------------------------------------------------ #
    # 2. Translate + simplify each page                                    #
    # ------------------------------------------------------------------ #
    import asyncio
    from app.services.translation_service import TranslationService
    from app.models.report import PageRecord, DocumentRecord

    translator = TranslationService(api_key=os.getenv("OPENAI_API_KEY"))

    doc_type = detect_doc_type(file_path)
    page_records = [PageRecord(page_number=pn, raw_text=text) for pn, text in pages]
    doc_record = DocumentRecord(file_path=file_path, doc_type=doc_type, pages=page_records)

    try:
        _set_status(db, document_id, "translation_started")
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        doc_record = loop.run_until_complete(translator.process_document(doc_record))
        loop.close()
        _set_status(db, document_id, "translation_completed")
    except Exception as exc:
        logger.error("[%s] Translation phase failed: %s", document_id, exc, exc_info=True)
        _set_status(db, document_id, "failed", {"error_message": f"Translation failed: {exc}"})
        raise

    # ------------------------------------------------------------------ #
    # 3. Create AI summary & extract JSON                                  #
    # ------------------------------------------------------------------ #
    try:
        _set_status(db, document_id, "summarising")
        loop2 = asyncio.new_event_loop()
        asyncio.set_event_loop(loop2)
        doc_record = loop2.run_until_complete(translator.summarise_and_extract(doc_record))
        loop2.close()
        logger.info("[%s] Summary created (%d chars)", document_id, len(doc_record.summary))
    except Exception as exc:
        logger.warning("[%s] Summary failed (non-fatal): %s", document_id, exc)
        doc_record.summary = "Summary generation failed."

    # ------------------------------------------------------------------ #
    # 4. Persist translated content → ai_extracted_content collection      #
    # ------------------------------------------------------------------ #
    try:
        full_text = "\n\n".join(
            f"Page {p.page_number}\n{p.simplified}"
            for p in doc_record.pages
        )

        ai_doc = {
            "report_id":         ObjectId(report_id),
            "original_file_id":  ObjectId(document_id),
            "ai_report_content": full_text,
            "summary":           doc_record.summary,
            "doc_type":          doc_record.doc_type,
            "extracted_fields":  doc_record.extracted_fields,
            "page_results":      [p.model_dump() for p in doc_record.pages],
            "created_at":        datetime.utcnow(),
            "created_by":        ObjectId(user_id),
        }
        db["ai_extracted_content"].replace_one(
            {"original_file_id": ObjectId(document_id)},
            ai_doc,
            upsert=True,
        )
        db["original_files"].update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"file_content": full_text}}
        )
        logger.info("[%s] Saved to ai_extracted_content", document_id)

    except Exception as exc:
        logger.error("[%s] DB persist failed: %s", document_id, exc, exc_info=True)
        _set_status(db, document_id, "failed", {"error_message": f"DB persist failed: {exc}"})
        raise

    # ------------------------------------------------------------------ #
    # 5. Write translated PDF to shared volume                             #
    # ------------------------------------------------------------------ #
    try:
        file_dir = os.path.dirname(file_path)
        extracted_dir = os.path.join(file_dir, "ExtractedFile")
        os.makedirs(extracted_dir, exist_ok=True)

        base_name = os.path.splitext(os.path.basename(file_path))[0]
        output_pdf_path = os.path.join(extracted_dir, f"{base_name}_translated.pdf")

        pdf_bytes = _build_pdf(
            title=f"Simplified Document – {file_name}",
            content=full_text,
        )
        with open(output_pdf_path, "wb") as fh:
            fh.write(pdf_bytes)

        db["original_files"].update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"output_pdf_path": output_pdf_path}},
        )
        logger.info("[%s] Simplified PDF written: %s", document_id, output_pdf_path)

    except Exception as exc:
        logger.warning("[%s] PDF generation failed (non-fatal): %s", document_id, exc)
        output_pdf_path = None

    # ------------------------------------------------------------------ #
    # 6. Mark as completed                                                 #
    # ------------------------------------------------------------------ #
    _set_status(
        db,
        document_id,
        "completed",
        {
            "output_pdf_path":   output_pdf_path,
            "processed_pages":   len(doc_record.pages),
            "summary":           doc_record.summary,
            "completed_at":      datetime.utcnow(),
        },
    )

    # ------------------------------------------------------------------ #
    # 7. Check if all docs for report are done, then generate final report #
    # ------------------------------------------------------------------ #
    all_files = list(db["original_files"].find({"report_id": ObjectId(report_id)}))
    report_doc = db["reports"].find_one({"_id": ObjectId(report_id)}, {"report_status": 1})
    if (
        all_files
        and all(f.get("processing_status") == "completed" for f in all_files)
        and report_doc
        and report_doc.get("report_status") == "importing"
    ):
        db["reports"].update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"report_status": "review", "updated_at": datetime.utcnow()}}
        )
        logger.info("[%s] All files completed. Triggering generate_final_report_task for report %s", document_id, report_id)
        
        # Dispatch the final synthesis task
        celery_app.send_task(
            "app.tasks.process_task.generate_final_report_task",
            args=[report_id],
            queue="document_processing"
        )

    logger.info("[%s] ✅ Processing completed", document_id)

    return {
        "document_id":    document_id,
        "status":         "completed",
        "total_pages":    len(doc_record.pages),
        "output_pdf":     output_pdf_path,
        "summary_length": len(doc_record.summary),
    }
