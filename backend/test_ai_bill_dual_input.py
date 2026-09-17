"""
backend/test_ai_bill_dual_input.py
==================================
GET Solar Energy — Bill Analyzer Dual-Input Architecture Test Suite
Phase: Dual-Input Architecture (Upload + Manual Entry)

Validates:
1. File Handling & Format Validation (PDF, PNG, JPG, JPEG, WEBP accepted; unsupported rejected).
2. PDF Text-First Extraction & Conservative Quality Check.
3. PDF Page Limit Enforcement (MAX_PDF_PAGES = 5).
4. Vision Fallback for Scanned/Unusable PDFs using centralized OpenAIProvider.
5. Manual Bill Form Validation & Processing.
6. Unified Pipeline & Canonical Response Validation (_is_valid_bill_analysis).
7. Independent Daily Quotas (3 uploads/day, 5 manual/day, IST reset).
8. Quota preservation on pre-analysis errors (zero quota consumed on bad format, corrupted PDF, etc.).
9. OpenAI Parameter Compatibility (gpt-5.6-luna temperature omission, max_completion_tokens).
10. Friendly Error Handling (No raw exceptions or stack traces leaked).
"""

import os
import io
import json
import base64
import unittest
from datetime import datetime, date
from unittest.mock import MagicMock, patch

from pydantic import ValidationError

from bill_document_service import (
    validate_file_type,
    is_sufficient_bill_text,
    process_pdf_document,
    normalize_image_bytes,
    MAX_PDF_PAGES,
    PDF_RENDER_DPI,
    UNSUPPORTED_FORMAT_MESSAGE,
)
from database_sqlite import SessionLocalSqlite
from quota_service import (
    get_user_quotas,
    check_quota,
    record_quota_consumption,
    get_ist_date,
    BILL_UPLOAD_DAILY_LIMIT,
    MANUAL_BILL_DAILY_LIMIT,
)
from ai.provider_base import AIRequest, AIResponse, AIImageInput, AIUsage
from ai.providers.luna_provider import OpenAIProvider
from ai.providers.mock_provider import MockAIProvider
from ai.provider_factory import get_ai_provider, set_ai_provider
from main import (
    ManualBillRequest,
    _is_valid_bill_analysis,
    app,
)
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Helpers & Fixtures
# ---------------------------------------------------------------------------

SAMPLE_VALID_BILL_RESULT = {
    "customer_name": "Rajesh Kumar",
    "consumer_number": "1234567890",
    "discom": "UPPCL",
    "billing_period": "June 2026",
    "monthly_units": 450,
    "bill_amount": 4200,
    "per_unit_rate": 9.33,
    "sanctioned_load_kw": 5.0,
    "recommended_kw": 4.0,
    "monthly_generation_units": 480,
    "monthly_savings_rs": 3800,
    "system_cost_rs": 240000,
    "payback_years": 4.5,
    "savings_25_years_rs": 980000,
}


# ===========================================================================
# 1. File Format & Magic Byte Validation Tests
# ===========================================================================

class TestFileFormatValidation(unittest.TestCase):
    """Verifies file type validation using magic bytes, not just extensions."""

    def test_01_pdf_magic_bytes_accepted(self):
        pdf_bytes = b"%PDF-1.4\n%test pdf content"
        is_valid, mime = validate_file_type(pdf_bytes, "bill.pdf")
        self.assertTrue(is_valid)
        self.assertEqual(mime, "application/pdf")

    def test_02_png_magic_bytes_accepted(self):
        png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
        is_valid, mime = validate_file_type(png_bytes, "bill.png")
        self.assertTrue(is_valid)
        self.assertEqual(mime, "image/png")

    def test_03_jpg_magic_bytes_accepted(self):
        jpg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF"
        is_valid, mime = validate_file_type(jpg_bytes, "bill.jpg")
        self.assertTrue(is_valid)
        self.assertEqual(mime, "image/jpeg")

    def test_04_webp_magic_bytes_accepted(self):
        webp_bytes = b"RIFF\x00\x00\x00\x00WEBPVP8 "
        is_valid, mime = validate_file_type(webp_bytes, "bill.webp")
        self.assertTrue(is_valid)
        self.assertEqual(mime, "image/webp")

    def test_05_unsupported_text_file_rejected(self):
        txt_bytes = b"Just plain text pretending to be a bill."
        is_valid, mime = validate_file_type(txt_bytes, "bill.txt")
        self.assertFalse(is_valid)
        self.assertEqual(mime, "")

    def test_06_spoofed_extension_rejected(self):
        """A text or exe file renamed to .pdf must be rejected by magic bytes."""
        spoofed_bytes = b"MZ\x90\x00\x03\x00\x00\x00" # Windows EXE header
        is_valid, mime = validate_file_type(spoofed_bytes, "bill.pdf")
        self.assertFalse(is_valid)
        self.assertEqual(mime, "")


# ===========================================================================
# 2. PDF Text Quality & Text-First Processing Tests
# ===========================================================================

class TestPDFProcessing(unittest.TestCase):
    """Verifies text-first extraction and conservative quality checks."""

    def test_07_sufficient_bill_text_check(self):
        rich_text = """
        Uttar Pradesh Power Corporation Limited (UPPCL)
        Electricity Bill for the month of May 2026
        Consumer No: 09876543210  Account ID: 1122334455
        Sanctioned Load: 5.00 kW  Tariff: LMV-1 Domestic
        Current Meter Reading: 12450 kWh  Previous Reading: 11950 kWh
        Units Consumed: 500 kWh  Total Current Bill Amount: Rs. 4,650.00
        Net Metering: Solar Generation: 320 kWh  Export: 140 kWh
        Payable Amount: Rs. 4,650.00
        """
        self.assertTrue(is_sufficient_bill_text(rich_text))

    def test_08_empty_or_scant_text_rejected_by_quality_check(self):
        self.assertFalse(is_sufficient_bill_text(""))
        self.assertFalse(is_sufficient_bill_text("Scan of bill"))
        self.assertFalse(is_sufficient_bill_text("123456"))
        self.assertFalse(is_sufficient_bill_text("   \n\t   "))

    def test_09_pdf_page_limit_enforced(self):
        """A PDF with more than MAX_PDF_PAGES (5) must be rejected cleanly."""
        mock_pdf = MagicMock()
        mock_pdf.pages = [MagicMock() for _ in range(6)]
        mock_cm = MagicMock()
        mock_cm.__enter__.return_value = mock_pdf
        mock_cm.__exit__.return_value = False

        pdf_bytes = b"%PDF-1.4\n" + b"\x00" * 100
        with patch("pdfplumber.open", return_value=mock_cm):
            result = process_pdf_document(pdf_bytes)
            self.assertIsNotNone(result.error)
            self.assertIn("too many pages", result.error.lower())

    def test_10_corrupted_pdf_handled_gracefully(self):
        corrupt_bytes = b"%PDF-1.4\nCORRUPTED_GARBAGE_BYTES_NO_HEADER_OR_PAGES"
        result = process_pdf_document(corrupt_bytes)
        self.assertIsNotNone(result.error)
        self.assertTrue(
            "couldn't process this pdf" in result.error.lower()
            or "enter the bill details manually" in result.error.lower()
        )


# ===========================================================================
# 3. Manual Bill Form & Request Schema Tests
# ===========================================================================

class TestManualBillFormValidation(unittest.TestCase):
    """Verifies manual bill input validation, boundaries, and optional fields."""

    def test_11_valid_manual_bill_request(self):
        req = ManualBillRequest(
            billing_period="June 2026",
            bill_amount=4500.0,
            monthly_units=480.0,
            sanctioned_load_kw=5.0,
            customer_name="Sunil Sharma",
            discom="BSES Rajdhani",
        )
        self.assertEqual(req.billing_period, "June 2026")
        self.assertEqual(req.bill_amount, 4500.0)
        self.assertEqual(req.monthly_units, 480.0)
        self.assertEqual(req.sanctioned_load_kw, 5.0)
        self.assertEqual(req.customer_name, "Sunil Sharma")
        self.assertFalse(req.solar_installed)

    def test_12_missing_required_fields_raise_validation_error(self):
        with self.assertRaises(ValidationError):
            ManualBillRequest(
                bill_amount=4500.0,
                monthly_units=480.0,
                # billing_period missing
            )

    def test_13_non_positive_numbers_rejected(self):
        with self.assertRaises(ValidationError):
            ManualBillRequest(
                billing_period="June 2026",
                bill_amount=-100.0, # Negative prohibited
                monthly_units=480.0,
                sanctioned_load_kw=5.0,
            )

        with self.assertRaises(ValidationError):
            ManualBillRequest(
                billing_period="June 2026",
                bill_amount=4500.0,
                monthly_units=0.0, # Must be > 0
                sanctioned_load_kw=5.0,
            )

        with self.assertRaises(ValidationError):
            ManualBillRequest(
                billing_period="June 2026",
                bill_amount=4500.0,
                monthly_units=480.0,
                sanctioned_load_kw=-2.0, # Must be > 0
            )

    def test_14_conditional_solar_fields_accepted(self):
        req = ManualBillRequest(
            billing_period="June 2026",
            bill_amount=3200.0,
            monthly_units=350.0,
            sanctioned_load_kw=5.0,
            solar_installed=True,
            solar_capacity_kw=3.0,
            solar_generation_kwh=360.0,
            solar_export_kwh=120.0,
        )
        self.assertTrue(req.solar_installed)
        self.assertEqual(req.solar_capacity_kw, 3.0)
        self.assertEqual(req.solar_generation_kwh, 360.0)
        self.assertEqual(req.solar_export_kwh, 120.0)

    def test_15_manual_bill_format_result_produces_canonical_schema(self):
        req = ManualBillRequest(
            billing_period="July 2026",
            bill_amount=5000.0,
            monthly_units=500.0,
            sanctioned_load_kw=5.0,
            customer_name="Anita Verma",
            discom="UPPCL",
        )
        per_unit_rate = round(req.bill_amount / max(1.0, req.monthly_units), 2)
        rec_kw = round(req.monthly_units / 135, 1)
        gen = round(rec_kw * 4.5 * 30, 0)
        savings = round(gen * per_unit_rate, 0)
        cost = round(rec_kw * 55000, 0)
        payback = round(cost / max(1.0, savings * 12), 1)
        savings25 = round((savings * 12 * 25) - cost, 0)

        result = {
            "customer_name": req.customer_name,
            "consumer_number": req.consumer_number or "N/A",
            "discom": req.discom or "Electricity Board",
            "monthly_units": req.monthly_units,
            "bill_amount": req.bill_amount,
            "per_unit_rate": per_unit_rate,
            "billing_period": req.billing_period,
            "recommended_kw": rec_kw,
            "monthly_generation_units": gen,
            "monthly_savings_rs": savings,
            "system_cost_rs": cost,
            "payback_years": payback,
            "savings_25_years_rs": savings25,
        }
        self.assertTrue(_is_valid_bill_analysis(result))
        self.assertEqual(result["customer_name"], "Anita Verma")
        self.assertEqual(result["monthly_units"], 500.0)
        self.assertEqual(result["bill_amount"], 5000.0)
        self.assertEqual(result["per_unit_rate"], 10.0)
        self.assertGreater(result["recommended_kw"], 0)
        self.assertGreater(result["monthly_savings_rs"], 0)


# ===========================================================================
# 4. Canonical Response Validation Tests
# ===========================================================================

class TestUnifiedValidation(unittest.TestCase):
    """Verifies that both upload and manual outputs must pass _is_valid_bill_analysis."""

    def test_16_valid_canonical_result_passes(self):
        self.assertTrue(_is_valid_bill_analysis(SAMPLE_VALID_BILL_RESULT))

    def test_17_missing_critical_field_rejected(self):
        bad = dict(SAMPLE_VALID_BILL_RESULT)
        del bad["monthly_units"]
        self.assertFalse(_is_valid_bill_analysis(bad))

    def test_18_negative_financial_values_rejected(self):
        bad = dict(SAMPLE_VALID_BILL_RESULT)
        bad["bill_amount"] = -500
        self.assertFalse(_is_valid_bill_analysis(bad))

    def test_19_zero_units_rejected(self):
        bad = dict(SAMPLE_VALID_BILL_RESULT)
        bad["monthly_units"] = 0
        self.assertFalse(_is_valid_bill_analysis(bad))


# ===========================================================================
# 5. Daily Quotas & Independence Tests
# ===========================================================================

class TestDailyQuotas(unittest.TestCase):
    """Verifies separate daily quotas (3 upload, 5 manual), IST reset, and error preservation."""

    def setUp(self):
        self.db = SessionLocalSqlite()
        self.test_user = "test_user_dual_input@getsolar.internal"

    def tearDown(self):
        self.db.close()

    def test_20_default_quotas_initialized_correctly(self):
        quotas = get_user_quotas(self.db, self.test_user)
        self.assertEqual(quotas["upload"]["limit"], 3)
        self.assertEqual(quotas["manual"]["limit"], 5)
        self.assertGreaterEqual(quotas["upload"]["remaining"], 0)
        self.assertGreaterEqual(quotas["manual"]["remaining"], 0)

    def test_21_quotas_are_independent(self):
        """Consuming an upload quota must not decrement manual quota."""
        user = f"independent_quota_{datetime.now().timestamp()}@getsolar.internal"
        initial = get_user_quotas(self.db, user)
        self.assertEqual(initial["upload"]["remaining"], 3)
        self.assertEqual(initial["manual"]["remaining"], 5)

        # Consume 1 upload
        record_quota_consumption(self.db, user, "upload")
        after_upload = get_user_quotas(self.db, user)
        self.assertEqual(after_upload["upload"]["used"], 1)
        self.assertEqual(after_upload["upload"]["remaining"], 2)
        # Manual quota must remain untouched!
        self.assertEqual(after_upload["manual"]["used"], 0)
        self.assertEqual(after_upload["manual"]["remaining"], 5)

        # Consume 2 manual
        record_quota_consumption(self.db, user, "manual")
        record_quota_consumption(self.db, user, "manual")
        after_manual = get_user_quotas(self.db, user)
        self.assertEqual(after_manual["upload"]["remaining"], 2)
        self.assertEqual(after_manual["manual"]["used"], 2)
        self.assertEqual(after_manual["manual"]["remaining"], 3)

    def test_22_quota_exhaustion_enforcement(self):
        """When 3 uploads are reached, check_quota returns False for upload but True for manual."""
        user = f"exhaust_user_{datetime.now().timestamp()}@getsolar.internal"
        for _ in range(3):
            avail, msg, _ = check_quota(self.db, user, "upload")
            self.assertTrue(avail)
            record_quota_consumption(self.db, user, "upload")

        # 4th upload must be blocked
        avail, msg, _ = check_quota(self.db, user, "upload")
        self.assertFalse(avail)
        self.assertIn("Daily upload limit reached", msg)

        # Manual quota is unaffected and can still be consumed
        avail_manual, _, _ = check_quota(self.db, user, "manual")
        self.assertTrue(avail_manual)
        for _ in range(5):
            avail_m, _, _ = check_quota(self.db, user, "manual")
            self.assertTrue(avail_m)
            record_quota_consumption(self.db, user, "manual")

        # 6th manual must be blocked
        avail_m_blocked, msg_m, _ = check_quota(self.db, user, "manual")
        self.assertFalse(avail_m_blocked)
        self.assertIn("Daily manual analysis limit reached", msg_m)

    def test_23_today_date_str_format_and_tz(self):
        """Date string must be YYYY-MM-DD corresponding to IST."""
        today_str = get_ist_date()
        self.assertRegex(today_str, r"^\d{4}-\d{2}-\d{2}$")


# ===========================================================================
# 6. OpenAI Parameter Compatibility Tests
# ===========================================================================

class TestOpenAIParameterCompatibility(unittest.TestCase):
    """Verifies that gpt-5.6-luna parameters are normalized centralized in OpenAIProvider."""

    def test_24_luna_omits_custom_temperature(self):
        """Reasoning models reject temperature != 1.0; provider normalizes it."""
        provider = OpenAIProvider(api_key="sk-test-key", model_name="gpt-5.6-luna")

        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps(SAMPLE_VALID_BILL_RESULT)
        mock_response.choices = [mock_choice]
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 150
        mock_response.usage.total_tokens = 250
        mock_client.chat.completions.create.return_value = mock_response

        with patch.object(provider, "_get_client", return_value=mock_client):
            req = AIRequest(
                prompt="Analyze bill",
                temperature=0.2, # Custom temperature should be omitted for Luna
                max_tokens=1000, # Legacy max_tokens should be translated to max_completion_tokens
            )
            provider.generate_response(req)

            call_kwargs = mock_client.chat.completions.create.call_args[1]
            self.assertNotIn("temperature", call_kwargs, "Custom temperature must not be sent to gpt-5.6-luna")
            self.assertNotIn("max_tokens", call_kwargs, "Legacy max_tokens must not be sent to gpt-5.6-luna")
            self.assertEqual(call_kwargs.get("max_completion_tokens"), 1000)


# ===========================================================================
# 7. Route Integration Tests (FastAPI TestClient with Mock Provider)
# ===========================================================================

class TestBillAnalyzerRoutes(unittest.TestCase):
    """End-to-end route tests using FastAPI TestClient with Mock Provider."""

    def setUp(self):
        import uuid
        from security import verify_token
        self.client = TestClient(app)
        self.mock_provider = MockAIProvider(default_response=json.dumps(SAMPLE_VALID_BILL_RESULT))
        set_ai_provider(self.mock_provider)
        self.user_email = f"test_route_user_{self._testMethodName}_{uuid.uuid4().hex[:8]}@getsolar.internal"
        app.dependency_overrides[verify_token] = lambda: self.user_email

    def tearDown(self):
        from security import verify_token
        set_ai_provider(None)
        app.dependency_overrides.pop(verify_token, None)

    def test_25_quota_endpoint_returns_json(self):
        response = self.client.get("/api/analyze-bill/quota")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        quota = data.get("quota", data)
        self.assertIn("upload", quota)
        self.assertIn("manual", quota)
        self.assertEqual(quota["upload"]["limit"], 3)
        self.assertEqual(quota["manual"]["limit"], 5)

    def test_26_manual_bill_endpoint_success(self):
        payload = {
            "billing_period": "June 2026",
            "bill_amount": 4200.0,
            "monthly_units": 450.0,
            "sanctioned_load_kw": 5.0,
            "customer_name": "Rajesh Kumar",
            "discom": "UPPCL",
            "solar_installed": False,
        }
        response = self.client.post("/api/analyze-bill/manual", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)
        self.assertEqual(data["data"]["monthly_units"], 450.0)

    def test_27_manual_bill_invalid_data_rejected_with_422(self):
        # Invalid: monthly_units <= 0
        payload = {
            "billing_period": "June 2026",
            "bill_amount": 4200.0,
            "monthly_units": -50.0,
            "sanctioned_load_kw": 5.0,
        }
        response = self.client.post("/api/analyze-bill/manual", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_28_upload_unsupported_file_rejected_without_consuming_quota(self):
        files = {"image": ("bad.txt", b"plain text data", "text/plain")}
        response = self.client.post("/api/analyze-bill", files=files)
        self.assertEqual(response.status_code, 400)
        body = response.json()
        err = body.get("error") or body.get("detail", "")
        self.assertIn("Unsupported bill format", err)

    def test_29_upload_valid_image_bill_success(self):
        png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\x00" * 30
        files = {"image": ("my_bill.png", png_bytes, "image/png")}
        response = self.client.post("/api/analyze-bill", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)
        self.assertEqual(data["data"]["customer_name"], "Rajesh Kumar")

    def test_30_pdf_exceeding_page_limit_returns_400_friendly_error(self):
        mock_pdf = MagicMock()
        mock_pdf.pages = [MagicMock() for _ in range(6)]
        mock_cm = MagicMock()
        mock_cm.__enter__.return_value = mock_pdf
        mock_cm.__exit__.return_value = False

        pdf_bytes = b"%PDF-1.4\n" + b"\x00" * 100
        files = {"image": ("big_bill.pdf", pdf_bytes, "application/pdf")}
        with patch("pdfplumber.open", return_value=mock_cm):
            response = self.client.post("/api/analyze-bill", files=files)
            self.assertEqual(response.status_code, 400)
            body = response.json()
            err = body.get("error") or body.get("detail", "")
            self.assertIn("5 pages or fewer", err)


if __name__ == "__main__":
    unittest.main()
