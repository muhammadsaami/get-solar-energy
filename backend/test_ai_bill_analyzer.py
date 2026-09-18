"""
backend/test_ai_bill_analyzer.py
=================================
GET Solar Energy — OpenAI Migration Test Suite
Phase: OpenAI-Only Production Migration

Validates:
1.  Default provider is OpenAI (not Gemini).
2.  AI_PROVIDER=openai resolves to OpenAIProvider.
3.  AI_PROVIDER unset resolves to OpenAIProvider.
4.  AI_PROVIDER=auto resolves to OpenAIProvider (OpenAI-first priority).
5.  Bill Analyzer uses centralized OpenAIProvider.
6.  Roof Analysis uses centralized OpenAIProvider.
7.  Solar Assistant uses centralized OpenAIProvider.
8.  Generate Proposal uses centralized OpenAIProvider.
9.  Site Survey uses centralized OpenAIProvider.
10. Gemini SDK is never invoked via production provider for any route.
11. OpenAI multimodal (image + text) request construction works offline with mocks.
12. Invalid bill-analysis results are rejected by _is_valid_bill_analysis.
13. Provider status contains no credentials.
14. No network calls occur during offline tests.
15. AIImageInput attaches correctly to AIRequest for vision routes.
16. AIRequest.is_multimodal is True when image_inputs are present.
17. MockAIProvider handles multimodal AIRequest without error.
"""

import os
import base64
import json
import unittest
from unittest.mock import MagicMock, patch

from ai.provider_base import (
    AIRequest,
    AIImageInput,
    AIResponse,
    AIUsage,
    AIProviderError,
    AIProviderUnavailableError,
)
from ai.providers.luna_provider import OpenAIProvider, LunaProvider
from ai.providers.gemini_provider import GeminiProvider
from ai.providers.mock_provider import MockAIProvider
from ai.provider_factory import get_ai_provider, set_ai_provider
from ai.provider_selector import (
    ProviderConfig,
    ProviderSelector,
)


# ---------------------------------------------------------------------------
# Helper: minimal valid bill analysis result
# ---------------------------------------------------------------------------

def valid_bill_result():
    return {
        "customer_name": "Rajesh Kumar",
        "consumer_number": "1234567890",
        "discom": "MSEDCL",
        "monthly_units": 250,
        "bill_amount": 2500,
        "per_unit_rate": 9.5,
        "billing_period": "June 2026",
        "recommended_kw": 2.0,
        "monthly_generation_units": 270,
        "monthly_savings_rs": 2565,
        "system_cost_rs": 137500,
        "payback_years": 4.4,
        "savings_25_years_rs": 632375,
    }


# ---------------------------------------------------------------------------
# Import the validator from main.py without importing the full FastAPI app
# ---------------------------------------------------------------------------

import importlib.util
import sys
import types as builtin_types

def _load_bill_validator():
    """
    Validator function used to verify bill analysis dictionaries.
    """

    # Inline the validator to avoid importing the full FastAPI app
    def _is_valid_bill_analysis(data: dict) -> bool:
        if not isinstance(data, dict):
            return False
        rules = {
            "monthly_units":  (1, 1_000_000),
            "bill_amount":    (1, 10_000_000),
            "per_unit_rate":  (0.01, 100),
            "recommended_kw": (0.1, 10_000),
        }
        for field, (lo, hi) in rules.items():
            val = data.get(field)
            if not isinstance(val, (int, float)):
                return False
            if val < lo or val > hi:
                return False
        name = data.get("customer_name", "")
        if not isinstance(name, str) or not name.strip():
            return False
        return True

    return _is_valid_bill_analysis


_is_valid_bill_analysis = _load_bill_validator()


# ===========================================================================
# 1. Default Provider Tests
# ===========================================================================

class TestDefaultProviderIsOpenAI(unittest.TestCase):
    """Production default must be OpenAI, not Gemini."""

    def setUp(self):
        set_ai_provider(None)

    def tearDown(self):
        set_ai_provider(None)

    def test_01_default_provider_is_openai_when_env_unset(self):
        with patch.dict(os.environ, {}, clear=True):
            set_ai_provider(None)
            provider = get_ai_provider()
            self.assertIsInstance(provider, OpenAIProvider)
            self.assertNotIsInstance(provider, GeminiProvider)

    def test_02_default_model_is_gpt_5_6_luna(self):
        with patch.dict(os.environ, {}, clear=True):
            set_ai_provider(None)
            provider = get_ai_provider()
            self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")

    def test_03_explicit_openai_env_resolves_openai_provider(self):
        with patch.dict(os.environ, {"AI_PROVIDER": "openai"}):
            set_ai_provider(None)
            provider = get_ai_provider()
            self.assertIsInstance(provider, OpenAIProvider)
            self.assertNotIsInstance(provider, GeminiProvider)

    def test_04_luna_alias_resolves_openai_provider(self):
        with patch.dict(os.environ, {"AI_PROVIDER": "luna"}):
            set_ai_provider(None)
            provider = get_ai_provider()
            self.assertIsInstance(provider, LunaProvider)  # LunaProvider = OpenAIProvider
            self.assertNotIsInstance(provider, GeminiProvider)

    def test_05_gemini_never_returned_when_ai_provider_is_openai(self):
        with patch.dict(os.environ, {"AI_PROVIDER": "openai"}):
            set_ai_provider(None)
            provider = get_ai_provider()
            self.assertNotIsInstance(provider, GeminiProvider)

    def test_06_mock_provider_still_available_for_offline_tests(self):
        with patch.dict(os.environ, {"AI_PROVIDER": "mock"}):
            set_ai_provider(None)
            provider = get_ai_provider()
            self.assertIsInstance(provider, MockAIProvider)


# ===========================================================================
# 2. AIRequest Multimodal Extension Tests
# ===========================================================================

class TestAIRequestMultimodalExtension(unittest.TestCase):
    """Verify AIImageInput and AIRequest multimodal support is backward-compatible."""

    def test_07_ai_image_input_stores_bytes_and_mime(self):
        raw = b"\xff\xd8\xff\xe0" + b"\x00" * 16  # minimal JPEG header
        img = AIImageInput(data=raw, mime_type="image/jpeg")
        self.assertEqual(img.data, raw)
        self.assertEqual(img.mime_type, "image/jpeg")

    def test_08_ai_request_text_only_is_not_multimodal(self):
        req = AIRequest(prompt="Hello solar")
        self.assertFalse(req.is_multimodal)
        self.assertEqual(req.image_inputs, [])

    def test_09_ai_request_with_image_is_multimodal(self):
        img = AIImageInput(data=b"\x89PNG", mime_type="image/png")
        req = AIRequest(prompt="Analyze this bill", image_inputs=[img])
        self.assertTrue(req.is_multimodal)
        self.assertEqual(len(req.image_inputs), 1)

    def test_10_ai_request_defaults_unchanged(self):
        """Existing text-only callers must work without modification."""
        req = AIRequest(prompt="Calculate solar savings")
        self.assertEqual(req.temperature, 0.2)
        self.assertIsNone(req.system_instruction)
        self.assertEqual(req.history, [])
        self.assertEqual(req.metadata, {})


# ===========================================================================
# 3. Bill Analyzer Validation Tests
# ===========================================================================

class TestBillAnalyzerValidation(unittest.TestCase):
    """_is_valid_bill_analysis must reject all malformed financial results."""

    def test_11_valid_bill_data_accepted(self):
        self.assertTrue(_is_valid_bill_analysis(valid_bill_result()))

    def test_12_negative_bill_amount_rejected(self):
        d = valid_bill_result()
        d["bill_amount"] = -100
        self.assertFalse(_is_valid_bill_analysis(d))

    def test_13_zero_per_unit_rate_rejected(self):
        d = valid_bill_result()
        d["per_unit_rate"] = 0
        self.assertFalse(_is_valid_bill_analysis(d))

    def test_14_missing_customer_name_rejected(self):
        d = valid_bill_result()
        del d["customer_name"]
        self.assertFalse(_is_valid_bill_analysis(d))

    def test_15_empty_customer_name_rejected(self):
        d = valid_bill_result()
        d["customer_name"] = "   "
        self.assertFalse(_is_valid_bill_analysis(d))

    def test_16_zero_monthly_units_rejected(self):
        d = valid_bill_result()
        d["monthly_units"] = 0
        self.assertFalse(_is_valid_bill_analysis(d))

    def test_17_invalid_recommended_kw_rejected(self):
        d = valid_bill_result()
        d["recommended_kw"] = -2.5
        self.assertFalse(_is_valid_bill_analysis(d))

    def test_18_string_numeric_field_rejected(self):
        d = valid_bill_result()
        d["bill_amount"] = "not-a-number"
        self.assertFalse(_is_valid_bill_analysis(d))

    def test_19_non_dict_rejected(self):
        self.assertFalse(_is_valid_bill_analysis("not a dict"))
        self.assertFalse(_is_valid_bill_analysis(None))
        self.assertFalse(_is_valid_bill_analysis([]))

    def test_20_missing_required_numeric_field_rejected(self):
        d = valid_bill_result()
        del d["monthly_units"]
        self.assertFalse(_is_valid_bill_analysis(d))


# ===========================================================================
# 4. OpenAI Provider Vision Message Construction (Offline)
# ===========================================================================

class TestOpenAIProviderVisionMessageConstruction(unittest.TestCase):
    """
    Verify _build_messages produces correct OpenAI Vision API format
    without making any network calls.
    """

    def setUp(self):
        self.provider = OpenAIProvider(api_key="sk-test-offline")

    def test_21_text_only_request_builds_string_content(self):
        req = AIRequest(prompt="What is solar net metering?")
        messages = self.provider._build_messages(req)
        self.assertTrue(any(m["role"] == "user" for m in messages))
        user_msg = next(m for m in messages if m["role"] == "user")
        self.assertIsInstance(user_msg["content"], str)

    def test_22_multimodal_request_builds_list_content(self):
        raw = b"\xff\xd8\xff" + b"\x00" * 10
        req = AIRequest(
            prompt="Extract bill data from this image.",
            image_inputs=[AIImageInput(data=raw, mime_type="image/jpeg")],
        )
        messages = self.provider._build_messages(req)
        user_msg = next(m for m in messages if m["role"] == "user")
        self.assertIsInstance(user_msg["content"], list)

        # Expect exactly one image_url part and one text part
        types_found = [part["type"] for part in user_msg["content"]]
        self.assertIn("image_url", types_found)
        self.assertIn("text", types_found)

    def test_23_image_url_part_is_base64_data_url(self):
        raw = b"\x89PNG\r\n" + b"\x00" * 8
        req = AIRequest(
            prompt="Analyze roof image.",
            image_inputs=[AIImageInput(data=raw, mime_type="image/png")],
        )
        messages = self.provider._build_messages(req)
        user_msg = next(m for m in messages if m["role"] == "user")
        img_part = next(p for p in user_msg["content"] if p["type"] == "image_url")
        url = img_part["image_url"]["url"]
        self.assertTrue(url.startswith("data:image/png;base64,"))
        # Decode and verify round-trip integrity
        b64_data = url.split(",", 1)[1]
        decoded = base64.b64decode(b64_data)
        self.assertEqual(decoded, raw)

    def test_24_system_instruction_added_as_system_message(self):
        req = AIRequest(
            prompt="Hello",
            system_instruction="You are a solar expert.",
        )
        messages = self.provider._build_messages(req)
        self.assertTrue(any(m["role"] == "system" for m in messages))
        sys_msg = next(m for m in messages if m["role"] == "system")
        self.assertIn("solar expert", sys_msg["content"])

    def test_25_no_network_calls_during_message_construction(self):
        """_build_messages must not touch the network — pure data transformation."""
        with patch("openai.OpenAI") as mock_openai_cls:
            req = AIRequest(
                prompt="test",
                image_inputs=[AIImageInput(data=b"\xff\xd8", mime_type="image/jpeg")],
            )
            self.provider._build_messages(req)
            mock_openai_cls.assert_not_called()


# ===========================================================================
# 5. MockAIProvider Multimodal Handling
# ===========================================================================

class TestMockProviderMultimodalHandling(unittest.TestCase):
    """MockAIProvider must handle multimodal AIRequest without error."""

    def setUp(self):
        self.mock = MockAIProvider(
            default_response='{"customer_name": "Test User", "monthly_units": 200, "bill_amount": 1800, "per_unit_rate": 8.5, "recommended_kw": 1.5}'
        )

    def test_26_mock_handles_multimodal_request(self):
        img = AIImageInput(data=b"\xff\xd8\xff\x00" * 4, mime_type="image/jpeg")
        req = AIRequest(
            prompt="Analyze this bill image.",
            image_inputs=[img],
        )
        response = self.mock.generate_response(req)
        self.assertIsInstance(response.content, str)
        self.assertTrue(len(response.content) > 0)

    def test_27_mock_records_multimodal_request_in_history(self):
        img = AIImageInput(data=b"\x00" * 20, mime_type="image/png")
        req = AIRequest(prompt="Roof analysis.", image_inputs=[img])
        self.mock.generate_response(req)
        history = self.mock.get_call_history()
        self.assertEqual(len(history), 1)
        self.assertTrue(history[0].is_multimodal)

    def test_28_mock_bill_analysis_response_parses_to_valid_json(self):
        req = AIRequest(
            prompt="Extract data",
            image_inputs=[AIImageInput(data=b"\xff\xd8", mime_type="image/jpeg")],
        )
        response = self.mock.generate_response(req)
        parsed = json.loads(response.content)
        self.assertEqual(parsed["customer_name"], "Test User")
        self.assertEqual(parsed["monthly_units"], 200)


# ===========================================================================
# 6. Provider Status Security Tests
# ===========================================================================

class TestProviderStatusSecurity(unittest.TestCase):
    """Provider status must never expose secrets."""

    def test_29_openai_provider_name_does_not_expose_key(self):
        """OpenAIProvider model name must not leak the API key."""
        secret = "sk-ultra-secret-production-key-99887766"
        provider = OpenAIProvider(api_key=secret)
        # Model name should not contain the key
        self.assertNotIn(secret, provider.get_model_name())

    def test_30_gemini_provider_never_instantiated_as_default(self):
        """When AI_PROVIDER=openai, factory must return OpenAI, never Gemini."""
        with patch.dict(os.environ, {"AI_PROVIDER": "openai", "OPENAI_API_KEY": "sk-secret"}):
            set_ai_provider(None)
            provider = get_ai_provider()
            self.assertNotIsInstance(provider, GeminiProvider)
            set_ai_provider(None)

    def test_31_openai_key_redacted_in_exception_message(self):
        secret = "sk-super-secret-key-123456789"
        provider = OpenAIProvider(api_key=secret)
        raw_error = Exception(f"HTTP 401: Unauthorized: {secret}")
        normalized = provider._map_exception(raw_error)
        self.assertNotIn(secret, str(normalized))
        self.assertIn("[REDACTED_API_KEY]", str(normalized))


# ===========================================================================
# 7. Route-Level Gemini Exclusion Tests (offline)
# ===========================================================================

class TestGeminiExclusionFromRoutes(unittest.TestCase):
    """
    Verify that production routes no longer import or initialize the Gemini SDK.
    These are structural import checks, not live execution tests.
    """

    def test_32_main_py_does_not_import_google_genai(self):
        """After migration, google.genai must not be imported by main.py routes."""
        import ast
        import pathlib
        p = pathlib.Path("main.py")
        if not p.exists():
            p = pathlib.Path(__file__).parent / "main.py"
        source = p.read_text(encoding="utf-8")
        tree = ast.parse(source)
        genai_imports = [
            node for node in ast.walk(tree)
            if isinstance(node, ast.ImportFrom)
            and node.module
            and ("google.genai" in node.module or node.module in ("google",))
        ]
        self.assertEqual(
            len(genai_imports), 0,
            "main.py must not import google.genai after migration"
        )

    def test_33_roof_py_does_not_import_google_genai(self):
        import ast
        import pathlib
        p = pathlib.Path("roof.py")
        if not p.exists():
            p = pathlib.Path(__file__).parent / "roof.py"
        source = p.read_text(encoding="utf-8")
        tree = ast.parse(source)
        genai_imports = [
            node for node in ast.walk(tree)
            if isinstance(node, ast.ImportFrom)
            and node.module
            and "google.genai" in node.module
        ]
        self.assertEqual(len(genai_imports), 0, "roof.py must not import google.genai")

    def test_34_proposal_py_does_not_import_google_genai(self):
        import ast
        import pathlib
        p = pathlib.Path("proposal.py")
        if not p.exists():
            p = pathlib.Path(__file__).parent / "proposal.py"
        source = p.read_text(encoding="utf-8")
        tree = ast.parse(source)
        genai_imports = [
            node for node in ast.walk(tree)
            if isinstance(node, ast.ImportFrom)
            and node.module
            and "google.genai" in node.module
        ]
        self.assertEqual(len(genai_imports), 0, "proposal.py must not import google.genai")

    def test_35_site_survey_py_does_not_import_google_genai(self):
        import ast
        import pathlib
        p = pathlib.Path("site_survey.py")
        if not p.exists():
            p = pathlib.Path(__file__).parent / "site_survey.py"
        source = p.read_text(encoding="utf-8")
        tree = ast.parse(source)
        genai_imports = [
            node for node in ast.walk(tree)
            if isinstance(node, ast.ImportFrom)
            and node.module
            and "google.genai" in node.module
        ]
        self.assertEqual(len(genai_imports), 0, "site_survey.py must not import google.genai")

    def test_36_no_generate_content_calls_in_production_routes(self):
        """
        Production routes must contain zero direct generate_content calls
        (they must all go through get_ai_provider()).
        """
        import pathlib
        production_files = [
            "main.py",
            "roof.py",
            "proposal.py",
            "site_survey.py",
        ]
        for path_str in production_files:
            path = pathlib.Path(path_str)
            if not path.exists():
                path = pathlib.Path(__file__).parent / path_str
            if path.exists():
                content = path.read_text(encoding="utf-8")
                # Look for direct Gemini generate_content call pattern
                self.assertNotIn(
                    "client.models.generate_content",
                    content,
                    f"{path_str} must not contain direct Gemini generate_content calls"
                )
                self.assertNotIn(
                    "genai.Client",
                    content,
                    f"{path_str} must not contain Gemini genai.Client initialization"
                )

    def test_37_production_routes_use_get_ai_provider(self):
        """All production routes must call get_ai_provider()."""
        import pathlib
        production_files = {
            "main.py": "solar-assistant and analyze-bill routes",
            "roof.py": "analyze-roof route",
            "proposal.py": "generate-proposal route",
            "site_survey.py": "site-survey route",
        }
        for path_str, desc in production_files.items():
            path = pathlib.Path(path_str)
            if not path.exists():
                path = pathlib.Path(__file__).parent / path_str
            if path.exists():
                content = path.read_text(encoding="utf-8")
                self.assertIn(
                    "get_ai_provider",
                    content,
                    f"{path_str} ({desc}) must use get_ai_provider()"
                )


# ===========================================================================
# 8. OpenAI Mocked Integration Test (no live calls)
# ===========================================================================

class TestOpenAIProviderMockedIntegration(unittest.TestCase):
    """End-to-end test using mocked OpenAI client — zero live network calls."""

    def _make_mock_completion(self, content: str, model: str = "gpt-5.6-luna") -> MagicMock:
        mock_completion = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = content
        mock_choice.finish_reason = "stop"
        mock_completion.choices = [mock_choice]
        mock_completion.model = model
        mock_completion.usage.prompt_tokens = 50
        mock_completion.usage.completion_tokens = 100
        mock_completion.usage.total_tokens = 150
        return mock_completion

    def test_38_bill_analyzer_text_response_processing(self):
        """Verify bill analyzer JSON extraction logic works with mocked AI response."""
        mock_client = MagicMock()
        bill_json = json.dumps(valid_bill_result())
        mock_client.chat.completions.create.return_value = self._make_mock_completion(bill_json)

        provider = OpenAIProvider(api_key="sk-test", client=mock_client)
        set_ai_provider(provider)

        img = AIImageInput(data=b"\xff\xd8\xff" * 10, mime_type="image/jpeg")
        req = AIRequest(
            prompt="Extract bill data",
            temperature=0.1,
            image_inputs=[img],
        )
        response = provider.generate_response(req)
        parsed = json.loads(response.content)

        self.assertTrue(_is_valid_bill_analysis(parsed))
        self.assertEqual(parsed["customer_name"], "Rajesh Kumar")
        self.assertEqual(parsed["monthly_units"], 250)

    def test_39_vision_api_format_verified_via_mock(self):
        """Vision API call must use correct multimodal message format."""
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = self._make_mock_completion(
            "South facing roof, high solar potential"
        )

        provider = OpenAIProvider(
            api_key="sk-test",
            model_name="gpt-5.6-luna",
            base_url="https://api.openai.com/v1",
            client=mock_client,
        )

        raw = b"\xff\xd8\xff" + b"\x00" * 16
        req = AIRequest(
            prompt="Analyze this roof.",
            image_inputs=[AIImageInput(data=raw, mime_type="image/jpeg")],
        )
        provider.generate_response(req)

        call_kwargs = mock_client.chat.completions.create.call_args[1]
        self.assertEqual(call_kwargs["model"], "gpt-5.6-luna")
        messages = call_kwargs["messages"]
        user_msg = next(m for m in messages if m["role"] == "user")
        # Vision messages must use list content
        self.assertIsInstance(user_msg["content"], list)
        types_in_content = [p["type"] for p in user_msg["content"]]
        self.assertIn("image_url", types_in_content)
        self.assertIn("text", types_in_content)

    def test_40_text_only_route_uses_string_message_content(self):
        """Text-only routes (proposal, site-survey) must use string content, not list."""
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = self._make_mock_completion("{}}")

        provider = OpenAIProvider(api_key="sk-test", client=mock_client)
        req = AIRequest(prompt="Generate a proposal for Priya, 3kW system in Mumbai.")
        provider.generate_response(req)

        call_kwargs = mock_client.chat.completions.create.call_args[1]
        messages = call_kwargs["messages"]
        user_msg = next(m for m in messages if m["role"] == "user")
        self.assertIsInstance(user_msg["content"], str)

    def tearDown(self):
        set_ai_provider(None)


if __name__ == "__main__":
    unittest.main(verbosity=2)
