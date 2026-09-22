"""
backend/ai/client.py
=====================
GET Solar Energy — Enterprise AI Assistant LLM Client
Phase 1: AI Provider Abstraction Foundation

Backward-compatible helper module.
For new code, prefer using `get_ai_provider()` from `backend.ai.provider_factory`.
"""

import os
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Configurable model default (OpenAI canonical default)
ASSISTANT_MODEL = os.getenv("OPENAI_MODEL", os.getenv("ASSISTANT_MODEL", "gpt-5.6-luna"))

_client_instance = None


def get_genai_client():
    """Lazily create a genai.Client singleton on explicit demand (legacy compatibility wrapper)."""
    global _client_instance
    if _client_instance is None:
        from google import genai
        api_key = os.getenv("GEMINI_API_KEY") or "offline-placeholder"
        _client_instance = genai.Client(api_key=api_key)
        logger.info("Explicit Gemini client initialized (model=%s)", os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite"))
    return _client_instance
