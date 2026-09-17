"""
Quota Service for Bill Analyzer
Enforces independent server-side daily quotas for bill uploads and manual entries:
- BILL_UPLOAD_DAILY_LIMIT = 3
- MANUAL_BILL_DAILY_LIMIT = 5
Resets at midnight IST (Asia/Kolkata).
"""

import os
import logging
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session

from database_sqlite import BillAnalysisUsageModel

logger = logging.getLogger("quota_service")

# Configurable daily limits
BILL_UPLOAD_DAILY_LIMIT = int(os.getenv("BILL_UPLOAD_DAILY_LIMIT", "3"))
MANUAL_BILL_DAILY_LIMIT = int(os.getenv("MANUAL_BILL_DAILY_LIMIT", "5"))

IST = ZoneInfo("Asia/Kolkata")


def get_ist_date() -> str:
    """Return current date string YYYY-MM-DD in Asia/Kolkata timezone."""
    return datetime.now(IST).strftime("%Y-%m-%d")


def get_user_quotas(db: Session, user_email: str) -> Dict[str, Dict[str, int]]:
    """
    Retrieve current quota status for upload and manual methods for today.
    """
    today = get_ist_date()
    upload_limit = int(os.getenv("BILL_UPLOAD_DAILY_LIMIT", str(BILL_UPLOAD_DAILY_LIMIT)))
    manual_limit = int(os.getenv("MANUAL_BILL_DAILY_LIMIT", str(MANUAL_BILL_DAILY_LIMIT)))

    try:
        upload_used = (
            db.query(BillAnalysisUsageModel)
            .filter(
                BillAnalysisUsageModel.user_email == user_email,
                BillAnalysisUsageModel.method == "upload",
                BillAnalysisUsageModel.usage_date == today,
            )
            .count()
        )
        manual_used = (
            db.query(BillAnalysisUsageModel)
            .filter(
                BillAnalysisUsageModel.user_email == user_email,
                BillAnalysisUsageModel.method == "manual",
                BillAnalysisUsageModel.usage_date == today,
            )
            .count()
        )
    except Exception as e:
        logger.error("Error querying bill analysis quota: %s", e)
        upload_used = 0
        manual_used = 0

    return {
        "upload": {
            "used": upload_used,
            "limit": upload_limit,
            "remaining": max(0, upload_limit - upload_used),
        },
        "manual": {
            "used": manual_used,
            "limit": manual_limit,
            "remaining": max(0, manual_limit - manual_used),
        },
    }


def check_quota(db: Session, user_email: str, method: str) -> Tuple[bool, str, Dict[str, Dict[str, int]]]:
    """
    Check if the user has remaining quota for the specified method ('upload' or 'manual').
    Returns (is_allowed, error_message, quotas).
    """
    quotas = get_user_quotas(db, user_email)
    method_quota = quotas.get(method)
    if not method_quota:
        return False, f"Unknown analysis method: {method}", quotas

    if method_quota["remaining"] <= 0:
        if method == "upload":
            msg = (
                "Daily upload limit reached.\n\n"
                f"You've used all {method_quota['limit']} bill-upload analyses for today. "
                "You can use Manual Bill Analysis or try again tomorrow."
            )
        else:
            msg = (
                "Daily manual analysis limit reached.\n\n"
                f"You've used all {method_quota['limit']} manual bill analyses for today. "
                "You can upload a bill if upload analyses remain, or try again tomorrow."
            )
        return False, msg, quotas

    return True, "", quotas


def record_quota_consumption(db: Session, user_email: str, method: str) -> Dict[str, Dict[str, int]]:
    """
    Record 1 quota consumption for the user and method.
    Must ONLY be called after a bill analysis is successfully processed and validated.
    """
    today = get_ist_date()
    try:
        usage = BillAnalysisUsageModel(
            user_email=user_email,
            method=method,
            usage_date=today,
        )
        db.add(usage)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Failed to record quota consumption for %s (%s): %s", user_email, method, e)

    return get_user_quotas(db, user_email)
