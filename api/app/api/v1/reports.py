"""
Reports API routes
"""

from fastapi import APIRouter, HTTPException, Depends, Query
import logging
from datetime import datetime
from pydantic import BaseModel

from app.models.report import DocumentRequest
from app.services.report_service import DocumentProcessingService
from app.repositories.report_repo import ReportRepository, OriginalFileRepository
from app.core.config import config
from app.api.v1.dependencies import get_current_user


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Reports"])


# ----------------------
# Request Models
# ----------------------

class CreateReportRequest(BaseModel):
    report_name: str


class UpdateReportRequest(BaseModel):
    report_name: str


# ----------------------
# APIs
# ----------------------

@router.post("/reports")
async def create_report(
    payload: CreateReportRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new report (no document upload)"""

    report = ReportRepository.create_report(
        report_name=payload.report_name,
        user_id=current_user["id"],
        created_by=current_user["id"],
    )

    if not report:
        raise HTTPException(status_code=500, detail="Failed to create report")

    return {
        "id": report["id"],
        "report_name": report["report_name"],
        "created_at": report.get("created_at", datetime.utcnow().isoformat()),
    }


@router.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    """Get all reports for current user"""

    if "admin" in current_user.get("roles", []):
        reports = ReportRepository.get_all()
    else:
        reports = ReportRepository.get_all(user_id=current_user["id"])

    return {"success": True, "reports": reports}


@router.get("/reports/check")
async def check_report_name(
    report_name: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user),
):
    """Check if report name already exists"""

    exists = ReportRepository.exists_by_name(
        report_name,
        user_id=current_user["id"],
    )

    return {"exists": exists}


@router.put("/reports/{report_id}")
async def update_report(
    report_id: str,
    payload: UpdateReportRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update report name"""

    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    updated_report = ReportRepository.update_name(
        report_id,
        payload.report_name,
        current_user["id"],
    )

    if not updated_report:
        raise HTTPException(status_code=500, detail="Failed to update report")

    return {
        "id": updated_report["id"],
        "report_name": updated_report["report_name"],
        "created_at": updated_report["created_at"],
    }


@router.get("/reports/{report_id}")
async def get_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get report by ID"""

    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    files = OriginalFileRepository.get_by_report(report_id)

    return {
        "success": True,
        "report": report,
        "files": files,
    }


@router.delete("/reports/{report_id}")
async def delete_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a report"""

    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    success = ReportRepository.delete(report_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete report")

    return {"success": True, "message": "Report deleted"}