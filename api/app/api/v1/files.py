from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from typing import Optional
import os
import shutil

from app.core.config import config
from app.api.v1.dependencies import get_current_user
from app.repositories.report_repo import OriginalFileRepository

router = APIRouter(prefix="/api/v1/files", tags=["Files"])


def _resolve_safe_path(relative_path: str) -> str:
    """Resolve a relative path safely within UPLOAD_DIR. Raises 400 on traversal."""
    resolved = os.path.realpath(os.path.join(config.UPLOAD_DIR, relative_path))
    upload_root = os.path.realpath(config.UPLOAD_DIR)
    if not resolved.startswith(upload_root + os.sep) and resolved != upload_root:
        raise HTTPException(status_code=400, detail="Invalid path")
    return resolved


def _validate_file_name(name: str):
    """Validate a file name. Raises 400 on invalid input."""
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="File name cannot be empty")
    if "/" in name or "\\" in name:
        raise HTTPException(status_code=400, detail="File name cannot contain path separators")
    if name.startswith("."):
        raise HTTPException(status_code=400, detail="File name cannot start with a dot")
    if len(name) > 255:
        raise HTTPException(status_code=400, detail="File name is too long")


def _relative_path(absolute_path: str) -> str:
    """Return a path relative to UPLOAD_DIR (S3-friendly)."""
    return os.path.relpath(absolute_path, config.UPLOAD_DIR)


def _to_real_abs_path(file_path: str) -> str:
    """Normalize DB path values (absolute or UPLOAD_DIR-relative) to a real absolute path."""
    if os.path.isabs(file_path):
        return os.path.realpath(file_path)
    return os.path.realpath(os.path.join(config.UPLOAD_DIR, file_path))


def _user_access_roots(current_user: dict) -> set[str]:
    """Folders a user is allowed to browse/download from (root of each report folder)."""
    roots = set()
    user_files = OriginalFileRepository.get_files_for_user(current_user["id"])
    for file_doc in user_files:
        file_path = file_doc.get("file_path")
        if not file_path:
            continue
        abs_path = _to_real_abs_path(file_path)
        roots.add(os.path.dirname(abs_path))
    return roots


def _can_access_path(full_path: str, current_user: dict, roots: Optional[set[str]] = None) -> bool:
    if "admin" in current_user.get("roles", []):
        return True

    accessible_roots = roots if roots is not None else _user_access_roots(current_user)
    for root in accessible_roots:
        if full_path == root or full_path.startswith(root + os.sep):
            return True
    return False


# ----------------------
# LIST FILES + FOLDERS
# ----------------------
@router.get("")
async def list_files(
    path: Optional[str] = Query(""),
    current_user: dict = Depends(get_current_user),
):
    path = path or ""
    full_path = _resolve_safe_path(path)

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Folder not found")
    if not os.path.isdir(full_path):
        raise HTTPException(status_code=400, detail="Path is not a folder")

    user_roots = _user_access_roots(current_user)
    if path and not _can_access_path(full_path, current_user, user_roots):
        raise HTTPException(status_code=403, detail="Access denied")

    # Folders from disk (real filesystem hierarchy)
    folders = sorted([
        item for item in os.listdir(full_path)
        if os.path.isdir(os.path.join(full_path, item))
    ])

    # DB map: absolute file path -> record (for id/metadata when available)
    db_file_by_abs: dict[str, dict] = {}
    user_files = OriginalFileRepository.get_files_for_user(current_user["id"])
    for db_file in user_files:
        db_path = db_file.get("file_path")
        if not db_path:
            continue
        db_file_by_abs[_to_real_abs_path(db_path)] = db_file

    # Files from disk first (includes ExtractedFile PDFs that are not in DB)
    files = []
    for item in sorted(os.listdir(full_path)):
        abs_item = os.path.join(full_path, item)
        if not os.path.isfile(abs_item):
            continue

        rel_path = _relative_path(abs_item)
        db_match = db_file_by_abs.get(os.path.realpath(abs_item))
        file_id = db_match["id"] if db_match else f"disk:{rel_path}"
        file_name = db_match["file_name"] if db_match else item

        files.append({
            "id": file_id,
            "file_name": file_name,
            "file_path": rel_path,
        })

    # Add DB files that belong here but are currently missing on disk
    for abs_db_path, db_file in db_file_by_abs.items():
        if os.path.dirname(abs_db_path) != full_path:
            continue
        if os.path.exists(abs_db_path):
            continue
        rel_path = _relative_path(abs_db_path)
        files.append({
            "id": db_file["id"],
            "file_name": db_file["file_name"],
            "file_path": rel_path,
        })

    return {
        "success": True,
        "path": path,
        "folders": folders,
        "files": files,
    }


# ----------------------
# RENAME FILE
# ----------------------
@router.put("/{file_id}/rename")
async def rename_file(
    file_id: str,
    new_name: str,
    current_user: dict = Depends(get_current_user),
):
    _validate_file_name(new_name)

    file = OriginalFileRepository.get_by_id_for_user(file_id, current_user["id"])
    if not file:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    old_path = file["file_path"]
    directory = os.path.dirname(old_path)
    new_path = os.path.join(directory, new_name)

    if os.path.exists(new_path):
        raise HTTPException(
            status_code=400,
            detail="A file with this name already exists in this folder",
        )

    # Disk first, then DB — rollback disk if DB fails
    try:
        os.rename(old_path, new_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rename failed: {str(e)}")

    try:
        updated = OriginalFileRepository.update_file_metadata(
            file_id=file_id,
            file_name=new_name,
            file_path=new_path,
            updated_by=current_user["id"],
        )
    except Exception:
        # Rollback disk change
        os.rename(new_path, old_path)
        raise HTTPException(status_code=500, detail="Failed to update file record, rename rolled back")

    return {"success": True, "file": updated, "message": "File renamed successfully"}


# ----------------------
# MOVE FILE
# ----------------------
@router.post("/{file_id}/move")
async def move_file(
    file_id: str,
    target_path: str,
    current_user: dict = Depends(get_current_user),
):
    new_dir = _resolve_safe_path(target_path)

    file = OriginalFileRepository.get_by_id_for_user(file_id, current_user["id"])
    if not file:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    old_path = file["file_path"]
    os.makedirs(new_dir, exist_ok=True)
    new_path = os.path.join(new_dir, file["file_name"])

    if os.path.exists(new_path):
        raise HTTPException(
            status_code=400,
            detail="File already exists in target folder",
        )

    # Disk first, then DB — rollback disk if DB fails
    try:
        shutil.move(old_path, new_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Move failed: {str(e)}")

    try:
        updated = OriginalFileRepository.update_path(file_id, new_path, current_user["id"])
    except Exception:
        # Rollback: move file back
        shutil.move(new_path, old_path)
        raise HTTPException(status_code=500, detail="Failed to update file record, move rolled back")

    return {"success": True, "file": updated, "message": "File moved successfully"}


# ----------------------
# COPY FILE
# ----------------------
@router.post("/{file_id}/copy")
async def copy_file(
    file_id: str,
    target_path: str,
    current_user: dict = Depends(get_current_user),
):
    new_dir = _resolve_safe_path(target_path)

    file = OriginalFileRepository.get_by_id_for_user(file_id, current_user["id"])
    if not file:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    source_path = file["file_path"]
    os.makedirs(new_dir, exist_ok=True)
    new_path = os.path.join(new_dir, file["file_name"])

    if os.path.exists(new_path):
        raise HTTPException(
            status_code=400,
            detail="File already exists in target folder",
        )

    # Disk first, then DB — rollback disk if DB fails
    try:
        shutil.copy2(source_path, new_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copy failed: {str(e)}")

    try:
        new_file = OriginalFileRepository.create(
            report_id=file["report_id"],
            file_name=file["file_name"],
            file_type=file["file_type"],
            file_path=new_path,
            created_by=current_user["id"],
        )
    except Exception:
        # Rollback: remove copied file
        if os.path.exists(new_path):
            os.remove(new_path)
        raise HTTPException(status_code=500, detail="Failed to create file record, copy rolled back")

    return {"success": True, "file": new_file, "message": "File copied successfully"}


# ----------------------
# DOWNLOAD FILE BY RELATIVE PATH (disk-backed files)
# ----------------------
@router.get("/by-path/download")
async def download_file_by_path(
    path: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user),
):
    full_path = _resolve_safe_path(path)
    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="File not found")

    if not _can_access_path(full_path, current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    return FileResponse(
        path=full_path,
        filename=os.path.basename(full_path),
        media_type="application/pdf",
    )


# ----------------------
# DELETE FILE
# ----------------------
@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    current_user: dict = Depends(get_current_user),
):
    file = OriginalFileRepository.get_by_id_for_user(file_id, current_user["id"])
    if not file:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    # DB first for delete — the file is logically gone regardless of disk state
    success = OriginalFileRepository.delete(file_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete file record")

    file_path = file.get("file_path")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            # DB record is already deleted — log but don't fail the request
            pass

    return {"success": True, "message": "File deleted successfully"}