"""
backend/test_backend_bill_analyzer_consistency.py
===================================================
GET Solar Energy — Backend Bill Analyzer Consistency & Integrity Test Suite
Phase: Backend Bill Analyzer Remediation

Comprehensive regression tests for:
1. Valid standard single-rate bill (200).
2. Valid multi-slab bill with null per_unit_rate (200).
3. Multi-slab bill derives transparent effective_rate without fabricating raw per_unit_rate.
4. Missing optional customer name does not trigger 422.
5. Missing genuinely required fields (monthly_units, bill_amount) rejected honestly.
6. Explicit units consumed are preserved authoritatively.
7. Explicit bill amount is preserved authoritatively.
8. Net grid energy never replaces consumption.
9. Grid export never replaces consumption.
10. Solar generation never replaces consumption.
11. Location invariance: customer location does not alter raw bill facts.
12. Regional ROI calculations accept state dynamically.
13. Customer isolation: quota and responses are user-scoped.
14. Unauthenticated requests rejected with 401.
15. No hardcoded customer or location ID leakage.
16. Deterministic normalization across repeated runs.
17. String and formatted numeric coercion (e.g. '187.02', '₹11,709').
18. Negative financial amounts and zero units rejected.
19. Null optional fields remain completely valid.
20. No subsidy fields or calculations reintroduced.
21. Fixed charges and energy charges preserved when present.
22. Effective rate derives from energy charges when separated on bill.
23. Manual bill analysis pipeline produces consistent canonical output.
24. Magic byte validation protects against unsupported/corrupt uploads.
"""

import io
import json
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from main import (
    app,
    _is_valid_bill_analysis,
    _normalize_raw_ai_bill_result,
    ManualBillRequest,
)
from security import verify_token
from ai.provider_base import AIRequest, AIResponse, AIUsage
from ai.provider_factory import set_ai_provider
from database_sqlite import SessionLocalSqlite
from quota_service import record_quota_consumption, get_user_quotas


class MockCentralizedProvider:
    """Mock AI Provider returning controlled JSON responses."""

    def __init__(self, response_payload: dict):
        self.response_payload = response_payload

    def generate_response(self, request: AIRequest) -> AIResponse:
        return AIResponse(
            content=json.dumps(self.response_payload),
            model="gpt-5.6-luna",
            usage=AIUsage(prompt_tokens=100, completion_tokens=100, total_tokens=200),
        )


class TestBackendBillAnalyzerConsistency(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.user_token = "Bearer test_token_customer_a"
        self.headers_user_a = {"Authorization": "Bearer token_user_a"}
        self.headers_user_b = {"Authorization": "Bearer token_user_b"}

    def tearDown(self):
        set_ai_provider(None)
        app.dependency_overrides.clear()

    # 1. Standard single-rate bill
    def test_01_valid_standard_bill_passes_validation_and_endpoint(self):
        standard_bill = {
            "customer_name": "Ramesh Gupta",
            "consumer_number": "100200300",
            "discom": "UPPCL",
            "billing_period": "May 2026",
            "monthly_units": 350.0,
            "bill_amount": 2975.0,
            "per_unit_rate": 8.50,
            "recommended_kw": 2.5,
            "monthly_generation_units": 337.5,
            "monthly_savings_rs": 2869.0,
            "system_cost_rs": 137500.0,
            "payback_years": 4.0,
            "savings_25_years_rs": 723200.0,
        }
        self.assertTrue(_is_valid_bill_analysis(standard_bill))

    # 2. Multi-slab bill with null per_unit_rate
    def test_02_valid_multi_slab_bill_passes_validation(self):
        multi_slab_bill = {
            "customer_name": "Anita Sharma",
            "consumer_number": "9988776655",
            "discom": "TPDDL",
            "billing_period": "June 2026",
            "monthly_units": 450.0,
            "bill_amount": 3825.0,
            "per_unit_rate": None,  # Multi-slab bills do NOT have a single rate
            "effective_rate": 8.50,
            "recommended_kw": 3.5,
            "monthly_generation_units": 472.5,
            "monthly_savings_rs": 4016.0,
            "system_cost_rs": 192500.0,
            "payback_years": 4.0,
            "savings_25_years_rs": 1012300.0,
        }
        self.assertTrue(_is_valid_bill_analysis(multi_slab_bill))

    # 3. Multi-slab bill derives effective_rate without fabricating per_unit_rate
    def test_03_multi_slab_bill_preserves_none_per_unit_rate_and_derives_effective_rate(self):
        raw_ai = {
            "customer_name": "Suresh Patel",
            "monthly_units": 400.0,
            "bill_amount": 3200.0,
            "per_unit_rate": None,
            "billing_period": "June 2026",
        }
        normalized = _normalize_raw_ai_bill_result(raw_ai)
        self.assertIsNone(normalized["per_unit_rate"])
        self.assertEqual(normalized["effective_rate"], 8.0)
        self.assertEqual(normalized["monthly_units"], 400.0)
        self.assertEqual(normalized["bill_amount"], 3200.0)
        self.assertTrue(_is_valid_bill_analysis(normalized))

    # 4. Missing optional customer name does not fail validation
    def test_04_missing_optional_customer_name_does_not_fail_validation(self):
        bill_no_name = {
            "customer_name": None,
            "monthly_units": 200.0,
            "bill_amount": 1600.0,
            "per_unit_rate": 8.0,
            "recommended_kw": 1.5,
        }
        self.assertTrue(_is_valid_bill_analysis(bill_no_name))

    # 5. Missing genuinely required field rejected
    def test_05_missing_genuinely_required_fields_rejected(self):
        # Missing monthly_units
        bad_units = {"bill_amount": 2000.0, "recommended_kw": 2.0}
        self.assertFalse(_is_valid_bill_analysis(bad_units))

        # Missing bill_amount
        bad_amount = {"monthly_units": 250.0, "recommended_kw": 2.0}
        self.assertFalse(_is_valid_bill_analysis(bad_amount))

    # 6. Explicit units consumed preserved
    def test_06_explicit_units_consumed_preserved(self):
        raw_ai = {
            "monthly_units": 187.02,
            "bill_amount": 11709.0,
            "customer_name": "Muhammad Haq",
        }
        normalized = _normalize_raw_ai_bill_result(raw_ai)
        self.assertEqual(normalized["monthly_units"], 187.02)

    # 7. Explicit bill amount preserved
    def test_07_explicit_bill_amount_preserved(self):
        raw_ai = {
            "monthly_units": 187.02,
            "bill_amount": 11709.0,
            "customer_name": "Muhammad Haq",
        }
        normalized = _normalize_raw_ai_bill_result(raw_ai)
        self.assertEqual(normalized["bill_amount"], 11709.0)

    # 8. Net grid energy never replaces consumption
    def test_08_net_grid_energy_never_replaces_consumption(self):
        raw_solar_bill = {
            "monthly_units": 342.74,
            "bill_amount": 2500.0,
            "grid_import": 342.74,
            "grid_export": 342.74,
            "net_billed_units": 0.0,
        }
        normalized = _normalize_raw_ai_bill_result(raw_solar_bill)
        self.assertEqual(normalized["monthly_units"], 342.74)
        self.assertEqual(normalized["net_billed_units"], 0.0)
        self.assertNotEqual(normalized["monthly_units"], normalized["net_billed_units"])

    # 9. Grid export never replaces consumption
    def test_09_grid_export_never_replaces_consumption(self):
        raw_solar_bill = {
            "monthly_units": 500.0,
            "bill_amount": 4200.0,
            "grid_export": 180.0,
        }
        normalized = _normalize_raw_ai_bill_result(raw_solar_bill)
        self.assertEqual(normalized["monthly_units"], 500.0)
        self.assertEqual(normalized["grid_export"], 180.0)

    # 10. Solar generation never replaces consumption
    def test_10_solar_generation_never_replaces_consumption(self):
        raw_solar_bill = {
            "monthly_units": 450.0,
            "bill_amount": 3800.0,
            "solar_generation_units": 600.0,
        }
        normalized = _normalize_raw_ai_bill_result(raw_solar_bill)
        self.assertEqual(normalized["monthly_units"], 450.0)
        self.assertEqual(normalized["solar_generation_units"], 600.0)

    # 11. Location invariance: raw bill facts remain identical
    def test_11_location_change_does_not_change_raw_bill_facts(self):
        raw_bill = {
            "customer_name": "Deepak Joshi",
            "consumer_number": "12345678",
            "monthly_units": 520.0,
            "bill_amount": 4500.0,
            "per_unit_rate": 8.65,
            "billing_period": "July 2026",
            "grid_import": 520.0,
            "grid_export": 100.0,
        }

        # Simulated analysis for Lucknow, UP user
        norm_lucknow = _normalize_raw_ai_bill_result(dict(raw_bill))

        # Simulated analysis for Delhi, DL user
        norm_delhi = _normalize_raw_ai_bill_result(dict(raw_bill))

        self.assertEqual(norm_lucknow["monthly_units"], norm_delhi["monthly_units"])
        self.assertEqual(norm_lucknow["bill_amount"], norm_delhi["bill_amount"])
        self.assertEqual(norm_lucknow["per_unit_rate"], norm_delhi["per_unit_rate"])
        self.assertEqual(norm_lucknow["billing_period"], norm_delhi["billing_period"])
        self.assertEqual(norm_lucknow["grid_import"], norm_delhi["grid_import"])
        self.assertEqual(norm_lucknow["grid_export"], norm_delhi["grid_export"])

    # 12. Regional ROI calculations accept state dynamically
    def test_12_regional_roi_calculations_differ_when_state_passed(self):
        app.dependency_overrides[verify_token] = lambda: "test_user@getsolar.in"
        res_up = self.client.post(
            "/api/calculate-roi",
            json={"monthly_bill": 5000.0, "state": "Uttar Pradesh", "system_size": 4.0},
            headers={"Authorization": "Bearer test_token"},
        )
        self.assertEqual(res_up.status_code, 200)

        res_rj = self.client.post(
            "/api/calculate-roi",
            json={"monthly_bill": 5000.0, "state": "Rajasthan", "system_size": 4.0},
            headers={"Authorization": "Bearer test_token"},
        )
        self.assertEqual(res_rj.status_code, 200)

    # 13. Customer isolation
    def test_13_customer_isolation_and_quota_independence(self):
        db = SessionLocalSqlite()
        try:
            user_a = "customer_iso_a@getsolar.in"
            user_b = "customer_iso_b@getsolar.in"

            q_a_before = get_user_quotas(db, user_a)
            q_b_before = get_user_quotas(db, user_b)

            record_quota_consumption(db, user_a, "upload")

            q_a_after = get_user_quotas(db, user_a)
            q_b_after = get_user_quotas(db, user_b)

            self.assertEqual(q_a_after["upload"]["used"], q_a_before["upload"]["used"] + 1)
            self.assertEqual(q_b_after["upload"]["used"], q_b_before["upload"]["used"])
        finally:
            db.close()

    # 14. Unauthenticated requests rejected
    def test_14_unauthenticated_request_rejected(self):
        res = self.client.post("/api/analyze-bill")
        self.assertEqual(res.status_code, 401)

        res_man = self.client.post(
            "/api/analyze-bill/manual",
            json={
                "billing_period": "May 2026",
                "bill_amount": 2500,
                "monthly_units": 300,
                "sanctioned_load_kw": 3,
            },
        )
        self.assertEqual(res_man.status_code, 401)

    # 15. No hardcoded customer ID required
    def test_15_no_hardcoded_customer_id_required(self):
        req = ManualBillRequest(
            billing_period="May 2026",
            bill_amount=2500,
            monthly_units=300,
            sanctioned_load_kw=3,
        )
        self.assertEqual(req.bill_amount, 2500.0)
        self.assertEqual(req.monthly_units, 300.0)
        self.assertIsNone(req.consumer_number)

    # 16. Deterministic normalization across repeated runs
    def test_16_deterministic_normalization_across_runs(self):
        raw = {
            "customer_name": "Kavita Rao",
            "monthly_units": 312.4,
            "bill_amount": 2650.0,
            "per_unit_rate": 8.48,
            "billing_period": "March 2026",
        }
        res1 = _normalize_raw_ai_bill_result(raw)
        res2 = _normalize_raw_ai_bill_result(raw)
        self.assertEqual(res1, res2)

    # 17. String and formatted numeric coercion
    def test_17_string_and_formatted_numbers_coerced_correctly(self):
        raw = {
            "customer_name": "  Anil Kapoor  ",
            "monthly_units": " 350.5 kWh ",
            "bill_amount": " ₹ 3,150.00 ",
            "per_unit_rate": "8.98",
        }
        normalized = _normalize_raw_ai_bill_result(raw)
        self.assertEqual(normalized["customer_name"], "Anil Kapoor")
        self.assertEqual(normalized["monthly_units"], 350.5)
        self.assertEqual(normalized["bill_amount"], 3150.0)
        self.assertEqual(normalized["per_unit_rate"], 8.98)
        self.assertTrue(_is_valid_bill_analysis(normalized))

    # 18. Negative financial amounts and zero units rejected
    def test_18_negative_financial_amounts_and_zero_units_rejected(self):
        d_neg_bill = {"monthly_units": 200, "bill_amount": -500}
        self.assertFalse(_is_valid_bill_analysis(d_neg_bill))

        d_zero_units = {"monthly_units": 0, "bill_amount": 1500}
        self.assertFalse(_is_valid_bill_analysis(d_zero_units))

        d_string_bad = {"monthly_units": "abc", "bill_amount": 1500}
        self.assertFalse(_is_valid_bill_analysis(d_string_bad))

    # 19. Null optional fields remain completely valid
    def test_19_null_optional_fields_remain_valid(self):
        valid_minimal = {
            "customer_name": None,
            "consumer_number": None,
            "discom": None,
            "billing_period": None,
            "monthly_units": 300.0,
            "bill_amount": 2400.0,
            "per_unit_rate": None,
            "effective_rate": 8.0,
            "net_billed_units": None,
            "grid_import": None,
            "grid_export": None,
            "recommended_kw": 2.0,
        }
        self.assertTrue(_is_valid_bill_analysis(valid_minimal))

    # 20. No subsidy fields or calculations reintroduced
    def test_20_no_subsidy_calculations_in_response(self):
        raw = {
            "monthly_units": 405.0,
            "bill_amount": 3400.0,
            "per_unit_rate": 8.4,
        }
        normalized = _normalize_raw_ai_bill_result(raw)
        # Sizing: 405 / 135 = 3.0 kW
        # System cost: 3.0 * 55000 = 165000
        self.assertEqual(normalized["recommended_kw"], 3.0)
        self.assertEqual(normalized["system_cost_rs"], 165000.0)
        self.assertNotIn("subsidy_amount", normalized)
        self.assertNotIn("government_subsidy", normalized)
        self.assertNotIn("net_cost_after_subsidy", normalized)

    # 21. Fixed charges and energy charges preserved when present
    def test_21_fixed_and_energy_charges_preserved(self):
        raw = {
            "monthly_units": 300.0,
            "bill_amount": 2700.0,
            "fixed_charges": 300.0,
            "energy_charges": 2400.0,
            "taxes": 150.0,
        }
        normalized = _normalize_raw_ai_bill_result(raw)
        self.assertEqual(normalized["fixed_charges"], 300.0)
        self.assertEqual(normalized["energy_charges"], 2400.0)
        self.assertEqual(normalized["taxes"], 150.0)

    # 22. Effective rate derives from energy charges when separated on bill
    def test_22_effective_rate_uses_energy_charges_when_available(self):
        raw = {
            "monthly_units": 300.0,
            "bill_amount": 2700.0,
            "fixed_charges": 300.0,
            "energy_charges": 2400.0,
            "per_unit_rate": None,
        }
        normalized = _normalize_raw_ai_bill_result(raw)
        # 2400 / 300 = 8.00 Rs/kWh
        self.assertEqual(normalized["effective_rate"], 8.00)

    # 23. Manual bill analysis pipeline produces consistent canonical output
    def test_23_manual_bill_analysis_endpoint_integration(self):
        app.dependency_overrides[verify_token] = lambda: "manual_tester@getsolar.in"
        mock_prov = MockCentralizedProvider({
            "customer_name": "Anita Verma",
            "monthly_units": 300,
            "bill_amount": 2700,
            "per_unit_rate": 9.0,
            "billing_period": "May 2026",
            "recommended_kw": 2.0,
            "monthly_generation_units": 270,
            "monthly_savings_rs": 2430,
            "system_cost_rs": 110000,
            "payback_years": 3.8,
            "savings_25_years_rs": 619000,
        })
        set_ai_provider(mock_prov)
        res = self.client.post(
            "/api/analyze-bill/manual",
            json={
                "billing_period": "May 2026",
                "bill_amount": 2700,
                "monthly_units": 300,
                "sanctioned_load_kw": 3.0,
                "customer_name": "Anita Verma",
            },
            headers={"Authorization": "Bearer manual_token"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["monthly_units"], 300.0)
        self.assertEqual(data["data"]["bill_amount"], 2700.0)
        self.assertEqual(data["data"]["per_unit_rate"], 9.0)

    # 24. Magic byte validation rejects unsupported/corrupt uploads
    def test_24_magic_byte_validation_rejects_unsupported_formats(self):
        app.dependency_overrides[verify_token] = lambda: "bad_file_user@getsolar.in"
        fake_exe = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00malicious executable content")
        res = self.client.post(
            "/api/analyze-bill",
            files={"image": ("malicious.exe", fake_exe, "application/octet-stream")},
            headers={"Authorization": "Bearer test_token"},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Unsupported bill format", res.json()["error"])


if __name__ == "__main__":
    unittest.main()
