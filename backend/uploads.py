"""
Phase 3 (extension) - Shared Upload API
Stores files on local disk under backend/uploads/ and returns a URL path
that main.py serves via StaticFiles (mounted at /uploads).

Used by: work order photos/documents/signature, profile photo, certificates,
AI troubleshooting image uploads — all point here instead of duplicating
upload logic in every module.

NOTE: This is local-disk storage, fine for development. Before real
production launch (multiple servers / no persistent disk on some hosts),
swap _save_to_disk() for an S3/Cloudinary upload — every other endpoint
that calls this stays unchanged since they only care about the returned URL.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from technician_auth import get_current_technician
from technician_models import Technician
import os
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/upload", tags=["Shared Upload"])

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx"}
MAX_FILE_SIZE_MB = 10

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_technician: Technician = Depends(get_current_technician)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File too large ({round(size_mb, 1)}MB). Max allowed is {MAX_FILE_SIZE_MB}MB.")

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    file_url = f"/uploads/{unique_filename}"
    logger.info("File uploaded by technician %s: %s", current_technician.email, file_url)

    return {
        "success": True,
        "message": "File uploaded successfully.",
        "file_url": file_url,
        "original_filename": file.filename,
        "size_mb": round(size_mb, 2)
    }