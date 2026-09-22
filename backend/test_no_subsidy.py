"""
No-subsidy regression tests.

Subsidy is not a GET Solar Energy product capability. These tests lock in:
- ROI math uses full system cost with no subsidy deduction or field.
- Proposal prompts and AI instructions contain no subsidy language.
- ML ROI/recommendation outputs contain no subsidy values or categories.
- Proposal emails contain no subsidy language.
"""
import unittest
from fastapi.testclient import TestClient
from main import app
from security import create_access_token
from proposal import ProposalRequest, build_proposal_prompt
from ml.orchestrator import AIOrchestrator
from ml.recommendation_engine import RecommendationEngine
from admin_proposal import build_proposal_email


class TestNoSubsidy(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.token = create_access_token({
            "sub": "test.nosubsidy@getsolar.in",
            "email": "test.nosubsidy@getsolar.in",
            "role": "customer"
        })
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def test_roi_has_no_subsidy_field_or_deduction(self):
        res = self.client.post("/api/calculate-roi", json={
            "monthly_bill": 6500,
            "system_size": 3.0,
            "state": "Uttar Pradesh",
            "roof_type": "flat"
        }, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json().get("data", {})
        self.assertNotIn("government_subsidy", data)
        self.assertEqual(data.get("net_cost"), data.get("system_cost"))
        self.assertEqual(data.get("net_cost"), 165000.0)

    def test_proposal_prompt_has_no_subsidy(self):
        prompt = build_proposal_prompt(ProposalRequest(
            customer_name="Test User",
            customer_address="1 Solar Street",
            city="Lucknow",
            monthly_units=400,
            monthly_bill_rs=3200,
            per_unit_rate=8.0,
            recommended_kw=3.0,
            roof_area_sqft=400.0,
            vendor_name="Get Solar Energy",
        ))
        lowered = prompt.lower()
        # No subsidy provision: no slab, no subsidy response field, no
        # scheme claims. Explicit "no subsidy applies" guardrails are allowed.
        self.assertNotIn("subsidy_rs", lowered)
        self.assertNotIn("pm surya", lowered)
        self.assertNotIn("muft bijli", lowered)
        self.assertNotIn("dbt", lowered)
        self.assertNotIn("78000", lowered)
        self.assertNotIn("78,000", lowered)
        self.assertNotIn("30000", lowered)

    def test_ml_roi_has_no_subsidy(self):
        result = AIOrchestrator()._calculate_roi({
            "monthly_units": 405,
            "per_unit_rate": 7.5,
            "bill_amount": 3037.5,
        })
        self.assertNotIn("subsidy", result)
        self.assertEqual(result["net_cost"], result["system_cost"])

    def test_ml_recommendations_have_no_subsidy_category(self):
        recs = RecommendationEngine().generate_recommendations(
            {"monthly_units": 405, "bill_amount": 3037.5}, {}
        )
        categories = [r.category for r in recs]
        self.assertNotIn("subsidy", categories)
        blob = " ".join(f"{r.title} {r.description} {r.action}".lower() for r in recs)
        self.assertNotIn("subsid", blob)

    def test_proposal_email_has_no_subsidy(self):
        msg = build_proposal_email(
            customer_name="Test User",
            customer_email="test@getsolar.in",
            proposal={
                "system_size_kw": 3.0,
                "net_cost_rs": 165000,
                "annual_savings_rs": 70200,
                "payback_years": 2.4,
                "executive_summary": "Summary.",
                "financial_highlights": "Highlights.",
            },
            reference="PROP-TEST",
            smtp_from="GET Solar Support <test@getsolar.in>",
        )
        text = msg.as_string().lower()
        self.assertNotIn("subsid", text)


if __name__ == "__main__":
    unittest.main()
