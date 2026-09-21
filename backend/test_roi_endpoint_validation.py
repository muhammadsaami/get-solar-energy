"""
backend/test_roi_endpoint_validation.py
=======================================
Verification for /api/calculate-roi endpoint input validation:
- Rejects non-positive monthly_bill (HTTP 400)
- Rejects non-positive system_size (HTTP 400)
- Does not return fake fallback defaults (such as 3.0 kW or 6500 bill)
- Computes accurate PM-Surya Ghar subsidies and ROI for valid inputs
"""

import unittest
from fastapi.testclient import TestClient
from main import app
from security import create_access_token

class TestROIEndpointValidation(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.token = create_access_token({
            "sub": "test.roi@getsolar.in",
            "email": "test.roi@getsolar.in",
            "role": "customer"
        })
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def test_01_zero_monthly_bill_rejected_with_400(self):
        payload = {
            "monthly_bill": 0,
            "system_size": 3.0,
            "state": "Uttar Pradesh",
            "roof_type": "flat"
        }
        res = self.client.post("/api/calculate-roi", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 400)
        data = res.json()
        self.assertIn("greater than zero", data.get("detail", ""))

    def test_02_negative_system_size_rejected_with_400(self):
        payload = {
            "monthly_bill": 5000,
            "system_size": -1.5,
            "state": "Uttar Pradesh",
            "roof_type": "flat"
        }
        res = self.client.post("/api/calculate-roi", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 400)
        data = res.json()
        self.assertIn("greater than zero", data.get("detail", ""))

    def test_03_valid_inputs_calculate_exact_pm_surya_ghar_subsidy(self):
        payload = {
            "monthly_bill": 6500,
            "system_size": 3.0,
            "state": "Uttar Pradesh",
            "roof_type": "flat"
        }
        res = self.client.post("/api/calculate-roi", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body.get("success"))
        data = body.get("data", {})
        
        # System cost: 3 * 55000 = 165000
        self.assertEqual(data.get("system_cost"), 165000)
        # 3kW subsidy capped at 78000
        self.assertEqual(data.get("government_subsidy"), 78000.0)
        # Net cost: 165000 - 78000 = 87000
        self.assertEqual(data.get("net_cost"), 87000.0)
        # Monthly savings: 6500 * 0.9 = 5850
        self.assertEqual(data.get("monthly_savings"), 5850.0)
        # Annual savings: 5850 * 12 = 70200
        self.assertEqual(data.get("annual_savings"), 70200.0)

    def test_04_no_fake_fallback_data_on_invalid_parameters(self):
        payload = {
            "monthly_bill": -500,
            "system_size": 0,
            "state": "Uttar Pradesh",
            "roof_type": "flat"
        }
        res = self.client.post("/api/calculate-roi", json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 400)
        body = res.json()
        # Must not contain fallback success payload
        self.assertNotIn("fallback", body)
        self.assertNotIn("data", body)
