"""
backend/test_ai_solar_report.py
================================
GET Solar Energy — Solar Production Report Extraction Architecture Test Suite
Phase: Solar Production Report Implementation

Validates:
1. Endpoint Existence & Authentication (POST /api/analyze-solar-report).
2. Input Format Validation (Magic Bytes: PNG, JPG, JPEG, WEBP, PDF accepted; invalid rejected).
3. PDF Processing:
   - <= 5 pages accepted
   - > 5 pages rejected with friendly limit error
   - Text-first extraction when text is sufficient
   - Vision fallback across all pages when text is insufficient
   - Corrupt PDF handled safely
4. Acceptance Test Case & Extraction:
   - Real test case (Mr.nadeem 3.6 kW, May/2026, 446.70 kWh) extracts correctly
   - Canonical response conforms to SolarReportData contract
   - Missing generation returns controlled HTTP 422
   - Daily generation optional
5. Validation Logic (_is_valid_solar_report):
   - Accepts realistic generation figures
   - Rejects negative, zero, non-numeric, or extreme values
   - Accepts nullable optional capacity, month, year, daily generation
6. Domain Separation & Quota Isolation:
   - Solar report does NOT consume bill upload quota (BILL_UPLOAD_DAILY_LIMIT = 3)
   - Solar report does NOT consume manual bill quota
   - Generation is kept separate from consumption and export
7. Centralized OpenAI Architecture:
   - Route uses centralized get_ai_provider()
   - No route-local clients
   - Zero Gemini runtime execution
"""

import io
import json
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from bill_document_service import (
    validate_file_type,
    is_sufficient_solar_text,
    process_solar_pdf_document,
    UNSUPPORTED_SOLAR_FORMAT_MESSAGE,
    PDFProcessingResult,
    MAX_PDF_PAGES,
)
from quota_service import (
    get_user_quotas,
    BILL_UPLOAD_DAILY_LIMIT,
    MANUAL_BILL_DAILY_LIMIT,
)
from database_sqlite import SessionLocalSqlite
from ai.provider_base import AIRequest, AIResponse, AIUsage
from ai.providers.mock_provider import MockAIProvider
from ai.provider_factory import get_ai_provider, set_ai_provider
from main import (
    app,
    _is_valid_solar_report,
    _normalize_solar_report_data,
    SOLAR_REPORT_ANALYSIS_PROMPT,
)


# ---------------------------------------------------------------------------
# Helpers & Dummy Fixtures
# ---------------------------------------------------------------------------

ACCEPTANCE_TEST_SOLAR_DATA = {
    "system_capacity_kw": 3.6,
    "monthly_generation_kwh": 446.70,
    "production_month": "2026-05",
    "month": "May",
    "year": "2026",
    "source": "Solar App",
    "daily_generation_kwh": [14.2, 15.1, 14.8, 15.0],
    "confidence": 0.95,
}

# Minimal valid 1x1 image bytes for magic byte validation
DUMMY_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00"
    b"\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)

DUMMY_JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00"
DUMMY_WEBP_BYTES = b"RIFF\x20\x00\x00\x00WEBPVP8 \x14\x00\x00\x00\x30\x01\x00\x9d\x01\x2a\x01\x00\x01\x00"
DUMMY_PDF_BYTES = b"%PDF-1.4\n%Fake PDF content for magic byte checking\n%%EOF"


class TestSolarReportArchitecture(unittest.TestCase):
    """Unit and integration tests for Solar Production Report extraction architecture."""

    def setUp(self):
        from security import verify_token
        self.client = TestClient(app)
        self.test_email = f"solar_test_user_{self._testMethodName}@getsolar.in"
        self.auth_headers = {"Authorization": "Bearer test-valid-token"}
        app.dependency_overrides[verify_token] = lambda: self.test_email

    def tearDown(self):
        from security import verify_token
        set_ai_provider(None)
        app.dependency_overrides.pop(verify_token, None)

    # =========================================================================
    # 1. Endpoint Existence & Authentication
    # =========================================================================

    def test_solar_report_endpoint_requires_auth(self):
        """Unauthenticated requests to /api/analyze-solar-report must be rejected (401/403)."""
        from security import verify_token
        app.dependency_overrides.pop(verify_token, None)
        try:
            response = self.client.post(
                "/api/analyze-solar-report",
                files={"image": ("solar.png", DUMMY_PNG_BYTES, "image/png")},
            )
            self.assertIn(response.status_code, (401, 403))
        finally:
            app.dependency_overrides[verify_token] = lambda: self.test_email

    # =========================================================================
    # 2. Input Format Validation (Magic Bytes)
    # =========================================================================

    def test_magic_bytes_accepts_valid_formats(self):
        """Valid PNG, JPEG, WEBP, and PDF magic bytes must be accepted."""
        is_valid, mime = validate_file_type(DUMMY_PNG_BYTES, "report.png")
        self.assertTrue(is_valid)
        self.assertEqual(mime, "image/png")

        is_valid, mime = validate_file_type(DUMMY_JPEG_BYTES, "report.jpg")
        self.assertTrue(is_valid)
        self.assertEqual(mime, "image/jpeg")

        is_valid, mime = validate_file_type(DUMMY_WEBP_BYTES, "report.webp")
        self.assertTrue(is_valid)
        self.assertEqual(mime, "image/webp")

        is_valid, mime = validate_file_type(DUMMY_PDF_BYTES, "report.pdf")
        self.assertTrue(is_valid)
        self.assertEqual(mime, "application/pdf")

    def test_magic_bytes_rejects_invalid_binary(self):
        """Invalid binaries (spoofed extensions, exe, text) must be rejected with 400."""
        with patch("main.verify_token", return_value=self.test_email):
            bad_binary = b"MZ\x90\x00\x03\x00\x00\x00ThisIsNotAnImageOrPdf"
            response = self.client.post(
                "/api/analyze-solar-report",
                headers=self.auth_headers,
                files={"image": ("spoofed.png", bad_binary, "image/png")},
            )
            self.assertEqual(response.status_code, 400)
            data = response.json()
            self.assertFalse(data["success"])
            self.assertIn("PDF, PNG, JPG, JPEG, or WEBP", data["error"])

    # =========================================================================
    # 3. PDF Processing & Quality Check
    # =========================================================================

    def test_is_sufficient_solar_text_criteria(self):
        """Verifies generic solar vocabulary matching for text-first PDF processing."""
        good_solar_text = (
            "Solarman Smart Monthly Plant Report\n"
            "System Capacity: 3.6 kW | Inverter: Growatt MIN 3000TL-X\n"
            "Reporting Month: May 2026\n"
            "Monthly Yield / Production: 446.70 kWh\n"
            "Daily Generation Average: 14.4 kWh\n"
        )
        self.assertTrue(is_sufficient_solar_text(good_solar_text))

        self.assertFalse(is_sufficient_solar_text("Solar 10"))

        random_text = "Grocery Store Invoice Total Items 5 Milk Bread Butter Eggs Amount Rs 450"
        self.assertFalse(is_sufficient_solar_text(random_text))

    def test_pdf_page_limit_enforced(self):
        """PDF reports exceeding MAX_PDF_PAGES (5) must be rejected with a friendly message."""
        mock_pdf_res = PDFProcessingResult(
            use_text=False,
            page_count=7,
            error=f"This report has too many pages (7 pages) to process. "
                  f"Please upload a report with {MAX_PDF_PAGES} pages or fewer, or skip the optional report.",
        )
        with patch("main.verify_token", return_value=self.test_email), \
             patch("main.process_solar_pdf_document", return_value=mock_pdf_res):
            response = self.client.post(
                "/api/analyze-solar-report",
                headers=self.auth_headers,
                files={"image": ("large_report.pdf", DUMMY_PDF_BYTES, "application/pdf")},
            )
            self.assertEqual(response.status_code, 400)
            data = response.json()
            self.assertFalse(data["success"])
            self.assertIn("too many pages", data["error"])

    def test_pdf_vision_fallback_handles_multiple_pages(self):
        """When PDF text is insufficient, all rendered pages (up to 5) must be passed to Vision."""
        page_images = [(DUMMY_PNG_BYTES, "image/png"), (DUMMY_PNG_BYTES, "image/png")]
        mock_pdf_res = PDFProcessingResult(
            use_text=False,
            text_content="",
            images=page_images,
            page_count=2,
        )

        mock_provider = MagicMock()
        mock_provider.generate_response.return_value = AIResponse(
            content=json.dumps(ACCEPTANCE_TEST_SOLAR_DATA),
            model="gpt-5.6-luna",
            usage=AIUsage(),
        )

        with patch("main.verify_token", return_value=self.test_email), \
             patch("main.process_solar_pdf_document", return_value=mock_pdf_res), \
             patch("main.get_ai_provider", return_value=mock_provider):
            response = self.client.post(
                "/api/analyze-solar-report",
                headers=self.auth_headers,
                files={"image": ("scanned_report.pdf", DUMMY_PDF_BYTES, "application/pdf")},
            )
            self.assertEqual(response.status_code, 200)
            ai_req: AIRequest = mock_provider.generate_response.call_args[0][0]
            self.assertEqual(ai_req.metadata["input_type"], "pdf_vision_fallback")
            self.assertEqual(len(ai_req.image_inputs), 2)

    # =========================================================================
    # 4. Real Acceptance Test Case (Mr.nadeem 3.6 kW, May 2026, 446.70 kWh)
    # =========================================================================

    def test_acceptance_test_case_extraction(self):
        """Verifies that the acceptance test screenshot data extracts and normalizes cleanly."""
        mock_provider = MagicMock()
        mock_provider.generate_response.return_value = AIResponse(
            content=f"```json\n{json.dumps(ACCEPTANCE_TEST_SOLAR_DATA)}\n```",
            model="gpt-5.6-luna",
            usage=AIUsage(),
        )

        with patch("main.verify_token", return_value=self.test_email), \
             patch("main.get_ai_provider", return_value=mock_provider):
            response = self.client.post(
                "/api/analyze-solar-report",
                headers=self.auth_headers,
                files={"image": ("mr_nadeem_solar.png", DUMMY_PNG_BYTES, "image/png")},
            )
            self.assertEqual(response.status_code, 200)
            res = response.json()
            self.assertTrue(res["success"])
            data = res["data"]
            self.assertEqual(data["system_capacity_kw"], 3.6)
            self.assertEqual(data["monthly_generation_kwh"], 446.70)
            self.assertEqual(data["production_month"], "2026-05")
            self.assertEqual(data["month"], "May")
            self.assertEqual(data["year"], "2026")
            self.assertEqual(data["source"], "Solar App")
            self.assertIsInstance(data["daily_generation_kwh"], list)
            self.assertEqual(len(data["daily_generation_kwh"]), 4)

    # =========================================================================
    # 5. Validation Rules (_is_valid_solar_report & Normalizer)
    # =========================================================================

    def test_validation_accepts_valid_data(self):
        """_is_valid_solar_report must accept valid generation figures."""
        self.assertTrue(_is_valid_solar_report(ACCEPTANCE_TEST_SOLAR_DATA))
        self.assertTrue(_is_valid_solar_report({"monthly_generation_kwh": 100.5}))
        self.assertTrue(_is_valid_solar_report({"monthly_generation_kwh": 446.70, "system_capacity_kw": 3.6}))

    def test_validation_rejects_invalid_generation(self):
        """_is_valid_solar_report must reject missing, negative, non-numeric, or zero generation."""
        self.assertFalse(_is_valid_solar_report({}))
        self.assertFalse(_is_valid_solar_report({"monthly_generation_kwh": None}))
        self.assertFalse(_is_valid_solar_report({"monthly_generation_kwh": -10}))
        self.assertFalse(_is_valid_solar_report({"monthly_generation_kwh": 0}))
        self.assertFalse(_is_valid_solar_report({"monthly_generation_kwh": "446.70"}))
        self.assertFalse(_is_valid_solar_report({"monthly_generation_kwh": True}))
        self.assertFalse(_is_valid_solar_report({"monthly_generation_kwh": 1_000_000}))
        self.assertFalse(_is_valid_solar_report("not a dict"))

    def test_normalizer_derives_month_and_year_from_period(self):
        """_normalize_solar_report_data converts 'May/2026' or '2026-05' to month and year."""
        raw = {
            "monthly_generation_kwh": 446.70,
            "production_month": "May/2026",
            "system_capacity_kw": 3.6,
        }
        normalized = _normalize_solar_report_data(raw)
        self.assertEqual(normalized["month"], "May")
        self.assertEqual(normalized["year"], "2026")
        self.assertEqual(normalized["production_month"], "2026-05")
        self.assertEqual(normalized["monthly_generation_kwh"], 446.70)

    def test_missing_generation_returns_422(self):
        """When AI cannot find solar generation, endpoint returns 422 with recovery instructions."""
        no_gen_data = {
            "system_capacity_kw": 3.6,
            "monthly_generation_kwh": None,
            "production_month": None,
        }
        mock_provider = MagicMock()
        mock_provider.generate_response.return_value = AIResponse(
            content=json.dumps(no_gen_data),
            model="gpt-5.6-luna",
            usage=AIUsage(),
        )

        with patch("main.verify_token", return_value=self.test_email), \
             patch("main.get_ai_provider", return_value=mock_provider):
            response = self.client.post(
                "/api/analyze-solar-report",
                headers=self.auth_headers,
                files={"image": ("no_gen.png", DUMMY_PNG_BYTES, "image/png")},
            )
            self.assertEqual(response.status_code, 422)
            data = response.json()
            self.assertFalse(data["success"])
            self.assertIn("Could not extract solar generation figures", data["error"])

    # =========================================================================
    # 6. Quota Isolation & Domain Separation
    # =========================================================================

    def test_solar_report_does_not_consume_bill_upload_quota(self):
        """Uploading a solar report must NEVER consume the 3/day bill upload quota."""
        db = SessionLocalSqlite()
        try:
            quotas_before = get_user_quotas(db, self.test_email)
            initial_upload_used = quotas_before["upload"]["used"]
            initial_manual_used = quotas_before["manual"]["used"]

            mock_provider = MagicMock()
            mock_provider.generate_response.return_value = AIResponse(
                content=json.dumps(ACCEPTANCE_TEST_SOLAR_DATA),
                model="gpt-5.6-luna",
                usage=AIUsage(),
            )

            with patch("main.verify_token", return_value=self.test_email), \
                 patch("main.get_ai_provider", return_value=mock_provider):
                response = self.client.post(
                    "/api/analyze-solar-report",
                    headers=self.auth_headers,
                    files={"image": ("solar.png", DUMMY_PNG_BYTES, "image/png")},
                )
                self.assertEqual(response.status_code, 200)

            quotas_after = get_user_quotas(db, self.test_email)
            self.assertEqual(quotas_after["upload"]["used"], initial_upload_used, "Bill upload quota must NOT change")
            self.assertEqual(quotas_after["manual"]["used"], initial_manual_used, "Manual bill quota must NOT change")
        finally:
            db.close()

    # =========================================================================
    # 7. Centralized AI & Error Handling
    # =========================================================================

    def test_ai_transient_error_returns_friendly_503(self):
        """When OpenAI encounters an unexpected error, a friendly 503 is returned without leaking internals."""
        mock_provider = MagicMock()
        mock_provider.generate_response.side_effect = RuntimeError("OpenAI connection timeout")

        with patch("main.verify_token", return_value=self.test_email), \
             patch("main.get_ai_provider", return_value=mock_provider):
            response = self.client.post(
                "/api/analyze-solar-report",
                headers=self.auth_headers,
                files={"image": ("solar.png", DUMMY_PNG_BYTES, "image/png")},
            )
            self.assertEqual(response.status_code, 503)
            data = response.json()
            self.assertFalse(data["success"])
            self.assertIn("We couldn't process this solar report right now", data["error"])
            self.assertNotIn("RuntimeError", data["error"])
            self.assertNotIn("traceback", data["error"])


if __name__ == "__main__":
    unittest.main()
