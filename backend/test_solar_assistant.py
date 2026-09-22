"""
backend/test_solar_assistant.py
===============================
GET Solar Energy — Focused AI Assistant & AssistantService Tests
OpenAI-First Architecture & Controlled Error Handling Tests

Tests:
1. Unauthenticated request rejected (401)
2. Authenticated request with empty message rejected (400)
3. OpenAI success path with mocked provider (200 with response and reply)
4. Missing/invalid OpenAI credentials returns controlled 503
5. Provider rate limit/quota returns controlled 429
6. Provider timeout returns controlled 504
7. Missing customer data does not crash the assistant
8. General questions execute zero unnecessary tools
9. No secrets or tokens leaked in responses
10. Provider selection maintains OpenAI as primary
11. Enterprise AssistantService is used by /api/solar-assistant
"""

import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app
from security import create_access_token
from ai.provider_factory import get_ai_provider, set_ai_provider
from ai.provider_base import (
    BaseAIProvider,
    AIRequest,
    AIResponse,
    AIProviderError,
    AIProviderAuthError,
    AIProviderRateLimitError,
    AIProviderTimeoutError,
)
from ai.assistant_service import get_assistant_service
from ai.providers.luna_provider import OpenAIProvider
from ai.provider_selector import FallbackProviderWrapper, ProviderConfig, ProviderSelector


class MockProviderForTest(BaseAIProvider):
    """Deterministic mock provider for automated tests (no network calls)."""

    def __init__(self, response_text="Solar net metering allows crediting excess generation to the DISCOM grid."):
        self.response_text = response_text
        self.last_request = None
        self.simulate_error = None

    def get_model_name(self) -> str:
        return "gpt-5.6-luna"

    def generate_response(self, request: AIRequest) -> AIResponse:
        self.last_request = request
        if self.simulate_error:
            raise self.simulate_error
        return AIResponse(
            content=self.response_text,
            model="gpt-5.6-luna",
            latency_ms=45.0,
            metadata={"provider": "openai", "model": "gpt-5.6-luna"},
        )


class TestSolarAssistantEndpoint(unittest.TestCase):
    """Comprehensive test suite for POST /api/solar-assistant."""

    def setUp(self):
        self.client = TestClient(app)
        self.token = create_access_token({"sub": "customer@getsolar.in", "role": "customer"})
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}
        self.mock_provider = MockProviderForTest()
        set_ai_provider(self.mock_provider)

        # Ensure assistant service uses our mock provider
        self.service = get_assistant_service()
        self.service.set_provider(self.mock_provider)

        from auth import auth_rate_limiter
        self._orig_rate_limiter_allowed = auth_rate_limiter.is_allowed
        auth_rate_limiter.is_allowed = lambda email, ip: True

    def tearDown(self):
        set_ai_provider(None)
        self.service.set_provider(None)
        from auth import auth_rate_limiter
        auth_rate_limiter.is_allowed = self._orig_rate_limiter_allowed

    def test_01_unauthenticated_request_rejected(self):
        """Unauthenticated requests to /api/solar-assistant must return 401."""
        resp = self.client.post("/api/solar-assistant", json={"message": "Hello"})
        self.assertEqual(resp.status_code, 401)

    def test_02_empty_message_rejected(self):
        """Empty messages must return 400 Bad Request."""
        resp = self.client.post(
            "/api/solar-assistant",
            json={"message": "   "},
            headers=self.auth_headers,
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Message cannot be empty", resp.json().get("detail", ""))

    def test_03_openai_success_path_with_mocked_provider(self):
        """Valid authenticated request returns 200 with response and reply matching."""
        payload = {
            "message": "How does net metering work in India?",
            "history": [],
            "context": None,
        }
        resp = self.client.post("/api/solar-assistant", json=payload, headers=self.auth_headers)
        self.assertEqual(resp.status_code, 200)

        data = resp.json()
        self.assertTrue(data.get("success"))
        # Both response and reply keys must be present and identical
        self.assertIn("response", data)
        self.assertIn("reply", data)
        self.assertEqual(data["response"], data["reply"])
        self.assertIn("Solar net metering allows crediting", data["response"])
        self.assertIn("conversation_id", data)

    def test_04_missing_or_invalid_openai_credentials_returns_503(self):
        """When OpenAI provider raises AIProviderAuthError, return controlled HTTP 503."""
        self.mock_provider.simulate_error = AIProviderAuthError(
            "OPENAI_API_KEY is not configured.", provider="openai"
        )
        payload = {"message": "How does net metering work?"}
        resp = self.client.post("/api/solar-assistant", json=payload, headers=self.auth_headers)

        self.assertEqual(resp.status_code, 503)
        detail = resp.json().get("detail", "")
        self.assertIn("not configured", detail.lower())
        # Must not be a 500
        self.assertNotEqual(resp.status_code, 500)

    def test_05_provider_rate_limit_returns_429(self):
        """When provider quota or rate limit is exhausted, return controlled HTTP 429."""
        self.mock_provider.simulate_error = AIProviderRateLimitError(
            "429 Resource Exhausted: Rate limit exceeded", provider="openai"
        )
        payload = {"message": "How does net metering work?"}
        resp = self.client.post("/api/solar-assistant", json=payload, headers=self.auth_headers)

        self.assertEqual(resp.status_code, 429)
        detail = resp.json().get("detail", "")
        self.assertIn("high demand", detail.lower())
        self.assertNotEqual(resp.status_code, 500)

    def test_06_provider_timeout_returns_504(self):
        """When provider times out, return controlled HTTP 504."""
        self.mock_provider.simulate_error = AIProviderTimeoutError(
            "Request deadline exceeded", provider="openai"
        )
        payload = {"message": "How does net metering work?"}
        resp = self.client.post("/api/solar-assistant", json=payload, headers=self.auth_headers)

        self.assertEqual(resp.status_code, 504)
        detail = resp.json().get("detail", "")
        self.assertIn("timed out", detail.lower())
        self.assertNotEqual(resp.status_code, 500)

    def test_07_missing_customer_data_does_not_crash(self):
        """Missing customer data and context=None does not crash the assistant."""
        payload = {
            "message": "How does net metering work?",
            "history": [],
            "context": None,
        }
        resp = self.client.post("/api/solar-assistant", json=payload, headers=self.auth_headers)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json().get("success"))

    def test_08_general_question_executes_no_unnecessary_tools(self):
        """General questions like 'How does net metering work?' execute zero tools."""
        payload = {
            "message": "How does net metering work?",
            "history": [],
            "context": None,
        }
        resp = self.client.post("/api/solar-assistant", json=payload, headers=self.auth_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        tool_results = data.get("tool_results", [])
        self.assertEqual(len(tool_results), 0)

    def test_09_no_secrets_in_responses(self):
        """API responses never leak internal keys, JWT tokens, or passwords."""
        self.mock_provider.simulate_error = AIProviderAuthError(
            "sk-proj-SUPERSECRETKEY12345 is invalid", provider="openai"
        )
        payload = {"message": "Hello"}
        resp = self.client.post("/api/solar-assistant", json=payload, headers=self.auth_headers)
        resp_text = resp.text
        self.assertNotIn("SUPERSECRETKEY12345", resp_text)
        self.assertNotIn("sk-proj", resp_text)

    def test_10_provider_selection_keeps_openai_as_primary(self):
        """In auto mode, OpenAI is always primary provider."""
        config = ProviderConfig.from_env({"AI_PROVIDER": "auto", "AI_PROVIDER_PRIORITY": "openai,gemini"})
        self.assertEqual(config.priority[0], "openai")
        self.assertEqual(config.openai_model, "gpt-5.6-luna")

    def test_11_enterprise_assistant_service_is_used(self):
        """Verify AssistantService singleton is invoked by /api/solar-assistant."""
        with patch.object(self.service, "chat", wraps=self.service.chat) as spy_chat:
            payload = {"message": "What is PM Surya Ghar Yojana?"}
            resp = self.client.post("/api/solar-assistant", json=payload, headers=self.auth_headers)
            self.assertEqual(resp.status_code, 200)
            self.assertTrue(spy_chat.called)
            args, kwargs = spy_chat.call_args
            self.assertEqual(kwargs.get("message"), "What is PM Surya Ghar Yojana?")
            self.assertEqual(kwargs.get("user_email"), "customer@getsolar.in")


if __name__ == "__main__":
    unittest.main()
