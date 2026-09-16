"""
backend/utils/security.py
=========================
GET Solar Energy — Input Sanitisation & Security Utilities
Phase 12.4A+++ Production Excellence

Protects against:
  • SQL Injection    — mitigated at ORM layer (SQLAlchemy parameterised queries)
  • CSV Injection    — neutralise formula-injection characters in CSV exports
  • XSS             — strip disallowed HTML from free-text inputs
  • Error Leakage   — never expose raw exception messages to clients
"""

import re
from typing import Any, Optional

# Characters that trigger formula injection in Excel / Google Sheets
_CSV_INJECTION_CHARS = ("=", "+", "-", "@", "\t", "\r")

# Simple tag-strip regex (not a full HTML parser — just strips angle-bracket tags)
_HTML_TAG_RE = re.compile(r"<[^>]+>")


def sanitise_csv_field(value: Any) -> str:
    """
    Prevent CSV formula injection by prefixing dangerous characters with a
    single quote.  Excel and Google Sheets will treat the cell as plain text.

    Args:
        value: Any Python value to serialise as a CSV field.

    Returns:
        Safe string representation.

    Example:
        sanitise_csv_field("=HYPERLINK('evil')") → "'=HYPERLINK('evil')"
    """
    text = str(value) if value is not None else ""
    if text and text[0] in _CSV_INJECTION_CHARS:
        return f"'{text}"
    return text


def sanitise_text_input(value: Optional[str], max_length: int = 2000) -> Optional[str]:
    """
    Strip HTML tags and truncate a free-text string to prevent XSS and
    excessively large payloads from being stored.

    Args:
        value:      Raw input string (may be None).
        max_length: Maximum allowed length after stripping.

    Returns:
        Sanitised string or None.
    """
    if value is None:
        return None
    stripped = _HTML_TAG_RE.sub("", value).strip()
    return stripped[:max_length] if len(stripped) > max_length else stripped


def safe_int(value: Any, default: int = 0) -> int:
    """Safely coerce a value to int, returning default on failure."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely coerce a value to float, returning default on failure."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def mask_sensitive(value: Optional[str], visible_chars: int = 4) -> str:
    """
    Mask a sensitive string (e.g. consumer number) for display in logs.

    Example:
        mask_sensitive("5109642660") → "510****60"
    """
    if not value:
        return "—"
    s = str(value)
    if len(s) <= visible_chars * 2:
        return "*" * len(s)
    return s[:visible_chars] + "*" * (len(s) - visible_chars * 2) + s[-visible_chars:]
