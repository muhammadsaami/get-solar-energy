"""
Phase 5 - Vendor Documents
Upload/storage APIs for vendor documents (GST certificate, PAN, license,
agreements, etc.). Reuses the same local-disk storage convention as
uploads.py (backend/uploads/, served via StaticFiles at /uploads) so files
only ever live in one place - but this module has its own endpoint because
uploads.py's /api/upload is gated by get_current_technician, and vendors
don't have that. vendor_email identifies the vendor directly since there's
no vendor login system yet. Swap to a real auth dependency once vendor
auth exists.

Does NOT touch: auth.py, session_auth.py, technician_auth.py, uploads.py,
Customer APIs, Plant Monitoring, CRM, AI, Admin. Real PostgreSQL table for
metadata, real disk storage for files - no mock/in-memory data.
"""
import os
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from vendor_documents_models import VendorDocument

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/vendor/documents", tags=["Vendor Documents"])

UPLOAD_DIR = "uploads"  # same folder uploads.py already writes to / main.py already serves
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx"}
MAX_FILE_SIZE_MB = 10

os.makedirs(UPLOAD_DIR, exist_ok=True)


from pydantic import BaseModel


class DocumentUpdateRequest(BaseModel):
    document_name: Optional[str] = None
    document_type: Optional[str] = None


def _serialize(d: VendorDocument) -> dict:
    return {
        "id": d.id,
        "vendor_email": d.vendor_email,
        "document_name": d.document_name,
        "document_type": d.document_type,
        "file_url": d.file_url,
        "original_filename": d.original_filename,
        "size_mb": d.size_mb,
        "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
    }


@router.post("")
async def upload_document(
    vendor_email: str = Form(...),
    document_name: str = Form(...),
    document_type: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
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

    try:
        document = VendorDocument(
            vendor_email=vendor_email,
            document_name=document_name,
            document_type=document_type,
            file_url=file_url,
            original_filename=file.filename,
            size_mb=round(size_mb, 2),
        )
        db.add(document)
        db.commit()
        db.refresh(document)
        logger.info("Vendor document uploaded: id=%s vendor=%s name=%s", document.id, vendor_email, document_name)
        return {"success": True, "message": "Document uploaded successfully.", "document": _serialize(document)}
    except Exception as e:
        db.rollback()
        # Roll back the disk write too, so a failed DB insert doesn't leave an orphaned file.
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error("Failed to save vendor document record: %s", str(e))
        raise HTTPException(status_code=500, detail="Could not save document record.")


@router.get("")
def list_documents(vendor_email: str, document_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(VendorDocument).filter(VendorDocument.vendor_email == vendor_email)
    if document_type:
        query = query.filter(VendorDocument.document_type == document_type)
    documents = query.order_by(VendorDocument.uploaded_at.desc()).all()
    return {"success": True, "count": len(documents), "documents": [_serialize(d) for d in documents]}


@router.get("/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(VendorDocument).filter(VendorDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"success": True, "document": _serialize(document)}


@router.put("/{document_id}")
def update_document(document_id: int, data: DocumentUpdateRequest, db: Session = Depends(get_db)):
    """Metadata-only edit (rename, recategorize). The uploaded file itself is
    immutable — to replace the file, delete this record and upload a new one."""
    document = db.query(VendorDocument).filter(VendorDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(document, field, value)

    db.commit()
    db.refresh(document)
    logger.info("Vendor document metadata updated: id=%s", document.id)
    return {"success": True, "message": "Document updated.", "document": _serialize(document)}


@router.get("/{document_id}/download")
def download_document(document_id: int, db: Session = Depends(get_db)):
    """Streams the actual file back (as opposed to GET /{document_id}, which
    just returns metadata including the file_url)."""
    document = db.query(VendorDocument).filter(VendorDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    local_path = document.file_url.lstrip("/")
    if not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail="File is missing from storage.")

    return FileResponse(
        path=local_path,
        filename=document.original_filename or os.path.basename(local_path),
    )


@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(VendorDocument).filter(VendorDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Best-effort disk cleanup — DB record is the source of truth either way.
    local_path = document.file_url.lstrip("/")
    if os.path.exists(local_path):
        try:
            os.remove(local_path)
        except OSError as e:
            logger.warning("Could not remove file %s from disk: %s", local_path, str(e))

    db.delete(document)
    db.commit()
    logger.info("Vendor document deleted: id=%s", document_id)
    return {"success": True, "message": "Document deleted."}