"""
backend/ai/client.py
=====================
GET Solar Energy — Enterprise AI Assistant LLM Client
Phase 13.0D

Reuses the existing genai.Client + gemini-2.5-flash-lite.
Configurable ASSISTANT_MODEL constant for future model swaps
(e.g. MiMo V2.5 Free) without architectural changes.
"""

import os
import logging
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Configurable model — swap to any genai-compatible model without changing architecture
ASSISTANT_MODEL = os.getenv("ASSISTANT_MODEL", "gemini-2.5-flash-lite")

_client_instance = None


def get_genai_client():
    """Lazily create a genai.Client singleton (mirrors main.py, avoids circular import)."""
    global _client_instance
    if _client_instance is None:
        from google import genai
        api_key = os.getenv("GEMINI_API_KEY")
        _client_instance = genai.Client(api_key=api_key)
        logger.info("Enterprise AI Assistant genai client initialized (model=%s)", ASSISTANT_MODEL)
    return _client_instance
