import os
import uuid
import hashlib
import shutil
from typing import Tuple
from fastapi import UploadFile, HTTPException

UPLOAD_BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg"
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 # 10MB

# Initialize folders
for sub in ["documents", "agreements", "payments", "amc"]:
    os.makedirs(os.path.join(UPLOAD_BASE_DIR, sub), exist_ok=True)

def sanitize_filename(filename: str) -> str:
    """Keep only basic alphanumeric characters and standard extensions."""
    base, ext = os.path.splitext(filename)
    clean_base = "".join(c for c in base if c.isalnum() or c in ("-", "_")).strip()
    clean_ext = "".join(c for c in ext if c.isalnum() or c == ".").lower()
    if not clean_base:
        clean_base = "file"
    return clean_base + clean_ext

def get_subfolder_for_doc_type(doc_type: str) -> str:
    """Map document type to corresponding subfolder."""
    doc_type_lower = doc_type.lower()
    if "agreement" in doc_type_lower or "contract" in doc_type_lower:
        return "agreements"
    elif "payment" in doc_type_lower or "invoice" in doc_type_lower or "receipt" in doc_type_lower:
        return "payments"
    elif "amc" in doc_type_lower:
        return "amc"
    else:
        return "documents"

def save_uploaded_file(file: UploadFile, doc_type: str) -> Tuple[str, str, str, int, str]:
    """
    Validate, sanitize, compute checksum, and save the file.
    Returns: (uuid, stored_filename, file_path, file_size, checksum)
    """
    # 1. Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Supported: PDF, PNG, JPG, JPEG"
        )

    # 2. Read contents for size and checksum
    file_bytes = file.file.read()
    file_size = len(file_bytes)

    # 3. Validate size
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size limit of 10MB. Got: {file_size / (1024*1024):.2f}MB"
        )

    # Reset file pointer for standard operations if needed
    file.file.seek(0)

    # 4. Generate metadata
    file_uuid = str(uuid.uuid4())
    orig_name = sanitize_filename(file.filename or "file")
    ext = os.path.splitext(orig_name)[1]
    stored_name = f"{file_uuid}{ext}"

    subfolder = get_subfolder_for_doc_type(doc_type)
    target_dir = os.path.join(UPLOAD_BASE_DIR, subfolder)
    target_path = os.path.abspath(os.path.join(target_dir, stored_name))

    # 5. Path traversal protection
    if not target_path.startswith(UPLOAD_BASE_DIR):
        raise HTTPException(
            status_code=400,
            detail="Potential path traversal attempt detected."
        )

    # 6. Compute checksum
    sha256 = hashlib.sha256()
    sha256.update(file_bytes)
    checksum = sha256.hexdigest()

    # 7. Write to storage
    with open(target_path, "wb") as f:
        f.write(file_bytes)

    # Calculate a path relative to the project root for DB consistency
    relative_path = os.path.relpath(target_path, os.path.join(UPLOAD_BASE_DIR, ".."))

    return file_uuid, stored_name, relative_path, file_size, checksum

def delete_stored_file(relative_path: str) -> bool:
    """Safely delete file from storage using relative path from DB."""
    abs_path = os.path.abspath(os.path.join(UPLOAD_BASE_DIR, "..", relative_path))
    if not abs_path.startswith(UPLOAD_BASE_DIR):
        return False
    if os.path.exists(abs_path):
        os.remove(abs_path)
        return True
    return False
