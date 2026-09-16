"""
backend/test_ai_evaluation.py
=============================
GET Solar Energy — AI Evaluation & Fallback Test Suite
Phase 3.0: Controlled Staging Pilot & Comparative Evaluation

Covers:
  1. Evaluation dataset integrity (20 cases, required fields, categorization)
  2. Rule-based quality check functions
  3. Offline evaluation runner and summary aggregation
  4. Staging-mode security gating and authorization checks
  5. Multi-provider comparative evaluation harness
  6. Comprehensive 20-scenario fallback and error matrix
"""

import os
import unittest
from unittest.mock import MagicMock, patch

from ai.provider_base import (
    BaseAIProvider,
    AIRequest,
    AIResponse,
    AIUsage,
    AIProviderError,
    AIProviderAuthError,
    AIProviderRateLimitError,
    AIProviderTimeoutError,
    AIProviderUnavailableError,
    AIProviderResponseError,
)
from ai.providers.gemini_provider import GeminiProvider
from ai.providers.luna_provider import LunaProvider
from ai.providers.mock_provider import MockAIProvider
from ai.provider_factory import get_ai_provider, set_ai_provider
from ai.assistant_service import AssistantService, get_assistant_service
from ai.evaluation.dataset import EVALUATION_DATASET, EvaluationCase
from ai.evaluation.metrics import CaseMetric, EvaluationSummary, aggregate_metrics
from ai.evaluation.checks import (
    check_non_empty,
    check_no_secret_leak,
    check_length_bounds,
    check_prohibited_patterns,
    check_uncertainty_markers,
    run_all_checks,
)
from ai.evaluation.evaluator import EvaluationRunner, compare_providers, HUMAN_REVIEW_RUBRIC


class TestEvaluationDataset(unittest.TestCase):
    """Test the evaluation dataset structure, count, and category coverage."""

    def test_dataset_contains_twenty_cases(self):
        self.assertEqual(len(EVALUATION_DATASET), 20)

    def test_unique_case_ids(self):
        case_ids = [c.case_id for c in EVALUATION_DATASET]
        self.assertEqual(len(case_ids), len(set(case_ids)))

    def test_case_fields_non_empty(self):
        for c in EVALUATION_DATASET:
            self.assertTrue(bool(c.case_id.strip()))
            self.assertTrue(bool(c.category.strip()))
            self.assertTrue(bool(c.user_prompt.strip()))
            self.assertTrue(bool(c.expected_behavior.strip()))
            self.assertIn(c.risk_level, ("low", "medium", "high"))


class TestEvaluationQualityChecks(unittest.TestCase):
    """Test deterministic rule-based evaluation checks."""

    def test_check_non_empty(self):
        self.assertTrue(check_non_empty("Valid solar advice"))
        self.assertFalse(check_non_empty(""))
        self.assertFalse(check_non_empty("   \n\t"))

    def test_check_no_secret_leak(self):
        self.assertTrue(check_no_secret_leak("The estimated savings are ₹30,000."))
        self.assertFalse(check_no_secret_leak("Leak: AIzaSyD987fakegooglekey"))
        self.assertFalse(check_no_secret_leak("Leak: sk-proj-123456789fakekey"))
        self.assertFalse(check_no_secret_leak("Normal text", error_text="Error with DATABASE_URL exposed"))

    def test_check_length_bounds(self):
        self.assertTrue(check_length_bounds("Short response", max_len=100))
        self.assertFalse(check_length_bounds("A" * 150, max_len=100))

    def test_check_prohibited_patterns(self):
        case = EvaluationCase(
            case_id="TEST-01",
            category="Test",
            user_prompt="Test",
            expected_behavior="Test",
            risk_level="high",
            prohibited_patterns=["100% free", "zero bill guaranteed"],
        )
        violations = check_prohibited_patterns(case, "Solar panels are 100% FREE under our offer.")
        self.assertEqual(len(violations), 1)
        self.assertIn("100% free", violations[0])

        clean_violations = check_prohibited_patterns(case, "Solar panels receive up to ₹78,000 subsidy.")
        self.assertEqual(len(clean_violations), 0)

    def test_check_uncertainty_markers(self):
        case = EvaluationCase(
            case_id="TEST-02",
            category="Test",
            user_prompt="Test",
            expected_behavior="Test",
            risk_level="medium",
            required_uncertainty_markers=["estimate", "approx", "depends on"],
        )
        self.assertTrue(check_uncertainty_markers(case, "Annual savings are an estimate based on sunlight."))
        self.assertFalse(check_uncertainty_markers(case, "You will save exactly ₹25,000."))


class TestEvaluationRunner(unittest.TestCase):
    """Test offline evaluation runner execution and metrics aggregation."""

    def test_offline_mock_runner(self):
        mock_provider = MockAIProvider(
            default_response="GET Solar rooftop evaluation response: 3kW system recommended."
        )
        runner = EvaluationRunner(provider=mock_provider, provider_name="mock")
        metrics, summary = runner.run(dataset=EVALUATION_DATASET[:5])

        self.assertEqual(len(metrics), 5)
        self.assertEqual(summary.total_cases, 5)
        self.assertEqual(summary.successful_cases, 5)
        self.assertEqual(summary.failed_cases, 0)
        self.assertEqual(summary.success_rate, 100.0)
        self.assertTrue(summary.is_mock)
        self.assertTrue(summary.avg_latency_ms >= 0.0)

    def test_staging_guard_blocks_unauthorized_live_provider(self):
        with patch.dict(os.environ, {"AI_EVAL_ALLOW_STAGING": "0"}):
            with self.assertRaises(ValueError) as ctx:
                EvaluationRunner(provider_name="gemini", allow_staging=False)
            self.assertIn("blocked by default", str(ctx.exception))

            with self.assertRaises(ValueError) as ctx:
                EvaluationRunner(provider_name="luna", allow_staging=False)
            self.assertIn("blocked by default", str(ctx.exception))

    def test_compare_providers_offline(self):
        mock1 = MockAIProvider(model_name="mock-model-a", default_response="Model A estimate.")
        mock2 = MockAIProvider(model_name="mock-model-b", default_response="Model B estimate with approx savings.")

        results = compare_providers(
            providers=[("mock_a", mock1), ("mock_b", mock2)],
            dataset=EVALUATION_DATASET[:3],
        )

        self.assertIn("mock_a", results)
        self.assertIn("mock_b", results)
        self.assertEqual(results["mock_a"].total_cases, 3)
        self.assertEqual(results["mock_b"].total_cases, 3)

    def test_human_review_rubric_structure(self):
        self.assertIn("correctness", HUMAN_REVIEW_RUBRIC)
        self.assertIn("safety", HUMAN_REVIEW_RUBRIC)
        self.assertIn("uncertainty", HUMAN_REVIEW_RUBRIC)
        self.assertIn("hallucination_risk", HUMAN_REVIEW_RUBRIC)
        total_weight = sum(r["weight"] for r in HUMAN_REVIEW_RUBRIC.values())
        self.assertAlmostEqual(total_weight, 1.0, places=2)


class TestFallbackAndErrorMatrix(unittest.TestCase):
    """Comprehensive 20-scenario provider failure and fallback matrix."""

    # 1. Gemini Success
    def test_01_gemini_success(self):
        mock_client = MagicMock()
        mock_resp = MagicMock()
        mock_resp.text = "Gemini solar analysis complete."
        mock_resp.usage_metadata = None
        mock_client.models.generate_content.return_value = mock_resp

        p = GeminiProvider(api_key="fake-key", client=mock_client)
        resp = p.generate_response(AIRequest(prompt="Hi"))
        self.assertEqual(resp.content, "Gemini solar analysis complete.")

    # 2. Luna Success
    def test_02_luna_success(self):
        mock_client = MagicMock()
        mock_comp = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "Luna solar analysis complete."
        mock_comp.choices = [mock_choice]
        mock_comp.usage = None
        mock_client.chat.completions.create.return_value = mock_comp

        p = LunaProvider(api_key="fake-key", client=mock_client)
        resp = p.generate_response(AIRequest(prompt="Hi"))
        self.assertEqual(resp.content, "Luna solar analysis complete.")

    # 3. Gemini Auth Failure
    def test_03_gemini_auth_failure(self):
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("403 Forbidden: Invalid API Key")
        p = GeminiProvider(api_key="fake-key", client=mock_client)
        with self.assertRaises(AIProviderAuthError):
            p.generate_response(AIRequest(prompt="Hi"))

    # 4. Luna Auth Failure
    def test_04_luna_auth_failure(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("401 Unauthorized: Invalid API Key")
        p = LunaProvider(api_key="fake-key", client=mock_client)
        with self.assertRaises(AIProviderAuthError):
            p.generate_response(AIRequest(prompt="Hi"))

    # 5. Gemini Rate Limit
    def test_05_gemini_rate_limit(self):
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("429 ResourceExhausted")
        p = GeminiProvider(api_key="fake-key", client=mock_client)
        with patch("time.sleep", return_value=None):
            with self.assertRaises(AIProviderRateLimitError):
                p.generate_response(AIRequest(prompt="Hi"))

    # 6. Luna Rate Limit
    def test_06_luna_rate_limit(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("429 RateLimitError: quota exceeded")
        p = LunaProvider(api_key="fake-key", client=mock_client)
        with self.assertRaises(AIProviderRateLimitError):
            p.generate_response(AIRequest(prompt="Hi"))

    # 7. Gemini Timeout
    def test_07_gemini_timeout(self):
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("504 Gateway Timeout: Deadline exceeded")
        p = GeminiProvider(api_key="fake-key", client=mock_client)
        with self.assertRaises(AIProviderTimeoutError):
            p.generate_response(AIRequest(prompt="Hi"))

    # 8. Luna Timeout
    def test_08_luna_timeout(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("APITimeoutError: Request timed out")
        p = LunaProvider(api_key="fake-key", client=mock_client)
        with self.assertRaises(AIProviderTimeoutError):
            p.generate_response(AIRequest(prompt="Hi"))

    # 9. Gemini Unavailable
    def test_09_gemini_unavailable(self):
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("503 Service Unavailable: Overloaded")
        p = GeminiProvider(api_key="fake-key", client=mock_client)
        with patch("time.sleep", return_value=None):
            with self.assertRaises(AIProviderUnavailableError):
                p.generate_response(AIRequest(prompt="Hi"))

    # 10. Luna Unavailable
    def test_10_luna_unavailable(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("503 Service Unavailable")
        p = LunaProvider(api_key="fake-key", client=mock_client)
        with self.assertRaises(AIProviderUnavailableError):
            p.generate_response(AIRequest(prompt="Hi"))

    # 11. Malformed Gemini Response
    def test_11_gemini_malformed_response(self):
        mock_client = MagicMock()
        mock_resp = MagicMock()
        mock_resp.text = None
        mock_resp.candidates = []
        mock_client.models.generate_content.return_value = mock_resp
        p = GeminiProvider(api_key="fake-key", client=mock_client)
        with self.assertRaises(AIProviderResponseError):
            p.generate_response(AIRequest(prompt="Hi"))

    # 12. Malformed Luna Response
    def test_12_luna_malformed_response(self):
        mock_client = MagicMock()
        mock_comp = MagicMock()
        mock_comp.choices = []
        mock_client.chat.completions.create.return_value = mock_comp
        p = LunaProvider(api_key="fake-key", client=mock_client)
        with self.assertRaises(AIProviderResponseError):
            p.generate_response(AIRequest(prompt="Hi"))

    # 13. Empty Gemini Response
    def test_13_gemini_empty_response(self):
        mock_client = MagicMock()
        mock_resp = MagicMock()
        mock_resp.text = "   "
        mock_client.models.generate_content.return_value = mock_resp
        p = GeminiProvider(api_key="fake-key", client=mock_client)
        with self.assertRaises(AIProviderResponseError):
            p.generate_response(AIRequest(prompt="Hi"))

    # 14. Empty Luna Response
    def test_14_luna_empty_response(self):
        mock_client = MagicMock()
        mock_comp = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "   "
        mock_comp.choices = [mock_choice]
        mock_client.chat.completions.create.return_value = mock_comp
        p = LunaProvider(api_key="fake-key", client=mock_client)
        with self.assertRaises(AIProviderResponseError):
            p.generate_response(AIRequest(prompt="Hi"))

    # 15. Missing Usage Metadata Gemini
    def test_15_gemini_missing_usage(self):
        mock_client = MagicMock()
        mock_resp = MagicMock()
        mock_resp.text = "Solar text"
        mock_resp.usage_metadata = None
        mock_resp.candidates = []
        mock_client.models.generate_content.return_value = mock_resp
        p = GeminiProvider(api_key="fake-key", client=mock_client)
        resp = p.generate_response(AIRequest(prompt="Hi"))
        self.assertIsNone(resp.usage)

    # 16. Missing Usage Metadata Luna
    def test_16_luna_missing_usage(self):
        mock_client = MagicMock()
        mock_comp = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "Solar text"
        mock_comp.choices = [mock_choice]
        mock_comp.usage = None
        mock_client.chat.completions.create.return_value = mock_comp
        p = LunaProvider(api_key="fake-key", client=mock_client)
        resp = p.generate_response(AIRequest(prompt="Hi"))
        self.assertIsNone(resp.usage)

    # 17. Missing API Credentials Luna
    def test_17_luna_missing_credentials(self):
        with patch.dict(os.environ, {}, clear=True):
            p = LunaProvider(api_key=None)
            with self.assertRaises(AIProviderAuthError):
                p.generate_response(AIRequest(prompt="Hi"))

    # 18. Unsupported Provider Selection
    def test_18_unsupported_provider(self):
        with self.assertRaises(AIProviderError):
            get_ai_provider("nonexistent_ai")

    # 19. Mock Provider Operation
    def test_19_mock_provider_operation(self):
        p = MockAIProvider(default_response="Mock deterministic")
        resp = p.generate_response(AIRequest(prompt="Hi"))
        self.assertEqual(resp.content, "Mock deterministic")

    # 20. Assistant Fallback Without Secret Leakage
    def test_20_assistant_fallback_without_secret_leak(self):
        p = MockAIProvider()
        p.set_simulate_error(AIProviderAuthError("Auth error with secret_xyz", provider="mock"))
        set_ai_provider(p)
        service = AssistantService()
        service._provider = p

        result = service.chat(
            message="Calculate my solar savings",
            user_email="user@example.com",
            user_role="Free User",
        )

        set_ai_provider(None)

        self.assertIn("response", result)
        self.assertIn("experiencing high demand", result["response"])
        self.assertNotIn("secret_xyz", result["response"])
        self.assertNotIn("secret_xyz", str(result.get("warnings", [])))


if __name__ == "__main__":
    unittest.main()
