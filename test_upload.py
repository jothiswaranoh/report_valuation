import asyncio
import os
from bson import ObjectId
from app.db.session import db, reports, original_files
from app.repositories.report_repo import ReportRepository

report = ReportRepository.create_report(
    report_name="test_report",
    bank_name="test_bank",
    normalized_name="test_report",
    normalized_bank="test_bank",
    user_id=str(ObjectId()),
    created_by=str(ObjectId())
)
print("Created report:", report["id"])
