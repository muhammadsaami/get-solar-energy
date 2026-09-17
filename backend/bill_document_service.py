"""
Bill Document Processing Service
Handles file format validation (magic bytes), PDF page limits, text-first PDF extraction,
and Vision fallback rendering via pdfplumber.
"""

import io
import os
import logging
from typing import Tuple, List, Optional
from PIL import Image

logger = logging.getLogger("bill_document_service")

# Configurable defaults
MAX_PDF_PAGES = int(os.getenv("MAX_PDF_PAGES", "5"))
PDF_RENDER_DPI = int(os.getenv("PDF_RENDER_DPI", "180"))
MAX_IMAGE_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", "2048"))

SUPPORTED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}

UNSUPPORTED_FORMAT_MESSAGE = (
    "Unsupported bill format. Please upload a PDF, PNG, JPG, JPEG, or WEBP electricity bill."
)

UNSUPPORTED_SOLAR_FORMAT_MESSAGE = (
    "Please upload a PDF, PNG, JPG, JPEG, or WEBP solar production report."
)


def validate_file_type(data: bytes, filename: Optional[str] = None) -> Tuple[bool, str]:
    """
    Validate file format using magic bytes rather than trusting filename extension alone.
    Returns (is_valid, mime_type).
    """
    if not data or len(data) < 4:
        return False, ""

    # Magic byte checks
    if data.startswith(b"%PDF-"):
        return True, "application/pdf"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return True, "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return True, "image/jpeg"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return True, "image/webp"

    # Fallback check with PIL if file starts with common image signatures
    try:
        with Image.open(io.BytesIO(data)) as img:
            fmt = (img.format or "").upper()
            if fmt in ("PNG", "JPEG", "JPG", "WEBP"):
                mime_map = {"PNG": "image/png", "JPEG": "image/jpeg", "JPG": "image/jpeg", "WEBP": "image/webp"}
                return True, mime_map[fmt]
    except Exception:
        pass

    return False, ""


def is_sufficient_bill_text(text: str) -> bool:
    """
    Check whether extracted text contains enough meaningful electricity bill content
    to attempt a text-based analysis instead of rendering via Vision.
    Generic check - not tied exclusively to any single vendor/DISCOM.
    """
    if not text:
        return False

    cleaned = text.strip()
    if len(cleaned) < 120:
        return False

    lower = cleaned.lower()

    # Core bill indicator vocabulary groups
    consumption_terms = {"unit", "kwh", "units", "consumption", "reading", "meter", "kw", "load", "demand"}
    financial_terms = {"bill", "amount", "rs", "inr", "payable", "due", "total", "rate", "tariff", "charges"}
    account_terms = {"consumer", "account", "customer", "ca no", "name", "discom", "subdivision", "period", "month"}

    has_consumption = any(term in lower for term in consumption_terms)
    has_financial = any(term in lower for term in financial_terms)
    has_account = any(term in lower for term in account_terms)

    # Must match indicators across at least two domain categories
    categories_matched = sum([has_consumption, has_financial, has_account])
    return categories_matched >= 2


def normalize_image_bytes(data: bytes, mime_type: str) -> Tuple[bytes, str]:
    """
    Normalize image dimensions if oversized (max 2048px) to avoid pathological requests
    while preserving document readability and sharpness.
    """
    try:
        with Image.open(io.BytesIO(data)) as img:
            width, height = img.size
            if max(width, height) > MAX_IMAGE_DIMENSION:
                scale = MAX_IMAGE_DIMENSION / float(max(width, height))
                new_size = (int(width * scale), int(height * scale))
                resized = img.resize(new_size, Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                save_format = "PNG" if mime_type == "image/png" else ("WEBP" if mime_type == "image/webp" else "JPEG")
                resized.save(buf, format=save_format, quality=90)
                return buf.getvalue(), mime_type
    except Exception as e:
        logger.warning("Image normalization skipped: %s", e)
    return data, mime_type


class PDFProcessingResult:
    def __init__(
        self,
        use_text: bool,
        text_content: str = "",
        images: Optional[List[Tuple[bytes, str]]] = None,
        page_count: int = 0,
        error: Optional[str] = None,
    ):
        self.use_text = use_text
        self.text_content = text_content
        self.images = images or []
        self.page_count = page_count
        self.error = error


def process_pdf_document(pdf_bytes: bytes) -> PDFProcessingResult:
    """
    Process PDF with Text-First architecture and Vision fallback:
    1. Check page count <= MAX_PDF_PAGES (default 5).
    2. Extract text across pages.
    3. Evaluate text quality via is_sufficient_bill_text.
    4. If text is sufficient: return text_content (skipping Vision rendering).
    5. If text is empty/garbled: render pages to PNG images for Vision processing.
    """
    max_pages = int(os.getenv("MAX_PDF_PAGES", str(MAX_PDF_PAGES)))
    dpi = int(os.getenv("PDF_RENDER_DPI", str(PDF_RENDER_DPI)))

    try:
        import pdfplumber
    except ImportError:
        logger.error("pdfplumber is required for PDF processing.")
        return PDFProcessingResult(
            use_text=False,
            error="PDF processing engine is unavailable. Please upload an image or enter details manually.",
        )

    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            page_count = len(pdf.pages)
            if page_count == 0:
                return PDFProcessingResult(
                    use_text=False,
                    page_count=0,
                    error="This PDF file appears to be empty.",
                )

            if page_count > max_pages:
                return PDFProcessingResult(
                    use_text=False,
                    page_count=page_count,
                    error=f"This bill has too many pages ({page_count} pages) to process. "
                          f"Please upload a bill with {max_pages} pages or fewer, or enter the bill details manually.",
                )

            # ── 1. Attempt text-first extraction ──────────────────────────────
            extracted_pages_text = []
            for i, page in enumerate(pdf.pages):
                try:
                    txt = page.extract_text() or ""
                    if txt.strip():
                        extracted_pages_text.append(f"--- PAGE {i+1} ---\n{txt}")
                except Exception as extract_err:
                    logger.debug("Failed extracting text from page %d: %s", i+1, extract_err)

            full_text = "\n\n".join(extracted_pages_text)

            if is_sufficient_bill_text(full_text):
                logger.info("PDF text-first extraction succeeded (%d chars, %d pages)", len(full_text), page_count)
                return PDFProcessingResult(
                    use_text=True,
                    text_content=full_text,
                    page_count=page_count,
                )

            # ── 2. Vision Fallback: Render pages to images ─────────────────────
            logger.info("PDF text insufficient (%d chars). Triggering Vision fallback for %d pages.", len(full_text), page_count)
            rendered_images: List[Tuple[bytes, str]] = []

            for i, page in enumerate(pdf.pages):
                try:
                    # Render page to PIL image
                    page_image = page.to_image(resolution=dpi).original
                    # Constrain dimensions if needed
                    w, h = page_image.size
                    if max(w, h) > MAX_IMAGE_DIMENSION:
                        scale = MAX_IMAGE_DIMENSION / float(max(w, h))
                        page_image = page_image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

                    buf = io.BytesIO()
                    page_image.save(buf, format="PNG")
                    rendered_images.append((buf.getvalue(), "image/png"))
                except Exception as render_err:
                    logger.error("Failed rendering PDF page %d: %s", i+1, render_err)
                    raise render_err

            if not rendered_images:
                return PDFProcessingResult(
                    use_text=False,
                    page_count=page_count,
                    error="We couldn't read this bill. Please try another copy or enter the bill details manually.",
                )

            return PDFProcessingResult(
                use_text=False,
                text_content="",
                images=rendered_images,
                page_count=page_count,
            )

    except Exception as e:
        logger.error("Error processing PDF: %s", e)
        return PDFProcessingResult(
            use_text=False,
            error="We couldn't process this PDF. Please try another copy or enter the bill details manually.",
        )


def is_sufficient_solar_text(text: str) -> bool:
    """
    Check whether extracted text contains enough meaningful solar production information
    to attempt a text-based analysis instead of rendering via Vision.
    Generic check - covers various inverters, apps, and monitoring reports.
    """
    if not text:
        return False

    cleaned = text.strip()
    if len(cleaned) < 40:
        return False

    lower = cleaned.lower()

    # Core solar vocabulary groups
    generation_terms = {
        "generation", "production", "yield", "total yield", "energy generated",
        "kwh", "mwh", "e-total", "e_total", "generated", "daily generation", "monthly generation",
        "power generated", "pv yield", "solar yield"
    }
    hardware_terms = {
        "kw", "kwp", "system capacity", "capacity", "inverter", "pv", "solar",
        "solarman", "sungrow", "huawei", "growatt", "enphase", "solis", "goodwe", "plant"
    }
    time_terms = {
        "month", "monthly", "daily", "year", "date", "period", "today", "jan", "feb", "mar",
        "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"
    }

    has_generation = any(term in lower for term in generation_terms)
    has_hardware = any(term in lower for term in hardware_terms)
    has_time = any(term in lower for term in time_terms)

    # Must match indicators across at least two domain categories
    categories_matched = sum([has_generation, has_hardware, has_time])
    return categories_matched >= 2


def process_solar_pdf_document(pdf_bytes: bytes) -> PDFProcessingResult:
    """
    Process Solar Production Report PDF with Text-First architecture and Vision fallback:
    1. Check page count <= MAX_PDF_PAGES (default 5).
    2. Extract text across pages.
    3. Evaluate text quality via is_sufficient_solar_text.
    4. If text is sufficient: return text_content (skipping Vision rendering).
    5. If text is empty/garbled: render PDF pages (up to 5 pages, in order) to PNG images for Vision processing.
    """
    max_pages = int(os.getenv("MAX_PDF_PAGES", str(MAX_PDF_PAGES)))
    dpi = int(os.getenv("PDF_RENDER_DPI", str(PDF_RENDER_DPI)))

    try:
        import pdfplumber
    except ImportError:
        logger.error("pdfplumber is required for PDF processing.")
        return PDFProcessingResult(
            use_text=False,
            error="PDF processing engine is unavailable. Please upload an image or enter details manually.",
        )

    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            page_count = len(pdf.pages)
            if page_count == 0:
                return PDFProcessingResult(
                    use_text=False,
                    page_count=0,
                    error="We couldn't read this report. Please upload another copy or skip the optional report.",
                )

            if page_count > max_pages:
                return PDFProcessingResult(
                    use_text=False,
                    page_count=page_count,
                    error=f"This report has too many pages ({page_count} pages) to process. "
                          f"Please upload a report with {max_pages} pages or fewer, or skip the optional report.",
                )

            # ── 1. Attempt text-first extraction ──────────────────────────────
            extracted_pages_text = []
            for i, page in enumerate(pdf.pages):
                try:
                    txt = page.extract_text() or ""
                    if txt.strip():
                        extracted_pages_text.append(f"--- PAGE {i+1} ---\n{txt}")
                except Exception as extract_err:
                    logger.debug("Failed extracting text from solar PDF page %d: %s", i+1, extract_err)

            full_text = "\n\n".join(extracted_pages_text)

            if is_sufficient_solar_text(full_text):
                logger.info("Solar PDF text-first extraction succeeded (%d chars, %d pages)", len(full_text), page_count)
                return PDFProcessingResult(
                    use_text=True,
                    text_content=full_text,
                    page_count=page_count,
                )

            # ── 2. Vision Fallback: Render pages to images ─────────────────────
            logger.info("Solar PDF text insufficient (%d chars). Triggering Vision fallback for %d pages.", len(full_text), page_count)
            rendered_images: List[Tuple[bytes, str]] = []

            for i, page in enumerate(pdf.pages):
                try:
                    page_image = page.to_image(resolution=dpi).original
                    w, h = page_image.size
                    if max(w, h) > MAX_IMAGE_DIMENSION:
                        scale = MAX_IMAGE_DIMENSION / float(max(w, h))
                        page_image = page_image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

                    buf = io.BytesIO()
                    page_image.save(buf, format="PNG")
                    rendered_images.append((buf.getvalue(), "image/png"))
                except Exception as render_err:
                    logger.error("Failed rendering solar PDF page %d: %s", i+1, render_err)
                    raise render_err

            if not rendered_images:
                return PDFProcessingResult(
                    use_text=False,
                    page_count=page_count,
                    error="We couldn't read this report. Please upload another copy or skip the optional report.",
                )

            return PDFProcessingResult(
                use_text=False,
                text_content="",
                images=rendered_images,
                page_count=page_count,
            )

    except Exception as e:
        logger.error("Error processing solar PDF: %s", e)
        return PDFProcessingResult(
            use_text=False,
            error="We couldn't process this solar report right now. Please try again or skip the optional report.",
        )
