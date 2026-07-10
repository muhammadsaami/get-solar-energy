"""
backend/ai/intent_router.py
============================
GET Solar Energy — Enterprise AI Assistant Intent Router
Phase 13.0D

Two-stage intent classification:
  Stage 1: Deterministic keyword routing (fast, zero tokens)
  Stage 2: Gemini classification when confidence is low (saves tokens)
"""

import logging
import re
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class Intent(str, Enum):
    CRM = "CRM"
    CUSTOMER360 = "CUSTOMER360"
    BILL = "BILL"
    ROOF = "ROOF"
    ROI = "ROI"
    AI_ANALYSIS = "AI_ANALYSIS"
    RECOMMENDATION = "RECOMMENDATION"
    EXPLAINABILITY = "EXPLAINABILITY"
    CUSTOMER_SCORE = "CUSTOMER_SCORE"
    SOLAR_READINESS = "SOLAR_READINESS"
    INSTALLATION = "INSTALLATION"
    AMC = "AMC"
    PAYMENTS = "PAYMENTS"
    REPORTS = "REPORTS"
    GENERAL = "GENERAL"


# Keyword groups for Stage 1 deterministic routing
_KEYWORD_MAP: Dict[Intent, List[str]] = {
    Intent.CRM: [
        "create task", "new task", "add task", "meeting", "follow-up",
        "follow up", "crm", "schedule", "contact", "lead",
    ],
    Intent.CUSTOMER360: [
        "customer 360", "customer360", "customer profile", "customer view",
        "customer detail", "show customer", "open customer", "full view",
    ],
    Intent.BILL: [
        "bill analysis", "analyze bill", "electricity bill", "bill review",
        "upload bill", "bill amount", "monthly units", "bill image",
    ],
    Intent.ROOF: [
        "roof analysis", "analyze roof", "roof area", "roof assessment",
        "roof survey", "roof type", "shading", "roof inspection",
    ],
    Intent.ROI: [
        "roi", "return on investment", "payback", "savings calculation",
        "financial analysis", "cost benefit", "lifetime savings",
        "annual savings", "monthly savings",
    ],
    Intent.AI_ANALYSIS: [
        "ai analysis", "analyze customer", "run analysis", "full analysis",
        "prediction", "infer", "ai predict", "ai analyze",
    ],
    Intent.RECOMMENDATION: [
        "recommendation", "recommend", "suggestions", "what should",
        "best action", "next step", "advise", "advice",
    ],
    Intent.EXPLAINABILITY: [
        "explain", "why", "reason", "interpret", "explainability",
        "breakdown", "contribution", "factor",
    ],
    Intent.CUSTOMER_SCORE: [
        "customer score", "lead score", "scoring", "score customer",
        "how good is", "customer value",
    ],
    Intent.SOLAR_READINESS: [
        "solar readiness", "readiness", "is my home ready", "ready for solar",
        "suitable for solar",
    ],
    Intent.INSTALLATION: [
        "installation", "install", "panel install", "inverter", "system install",
        "installation status", "installation stage", "engineer",
    ],
    Intent.AMC: [
        "amc", "annual maintenance", "maintenance contract", "service contract",
        "warranty", "system health", "maintenance visit", "servicing",
    ],
    Intent.PAYMENTS: [
        "payment", "invoice", "bill payment", "outstanding", "paid",
        "payment status", "due date", "billing",
    ],
    Intent.REPORTS: [
        "report", "generate report", "csv", "export", "sales report",
        "pipeline report", "activity report", "crm report",
    ],
}

# Priority order: more specific intents first to resolve overlaps
_PRIORITY = [
    Intent.CUSTOMER_SCORE, Intent.SOLAR_READINESS, Intent.EXPLAINABILITY,
    Intent.RECOMMENDATION, Intent.AI_ANALYSIS, Intent.CUSTOMER360,
    Intent.INSTALLATION, Intent.AMC, Intent.PAYMENTS, Intent.REPORTS,
    Intent.BILL, Intent.ROOF, Intent.ROI, Intent.CRM, Intent.GENERAL,
]


class IntentRouter:
    """Two-stage intent classifier."""

    _instance: Optional["IntentRouter"] = None

    def __new__(cls) -> "IntentRouter":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._client = None  # lazy Gemini client
        self._initialized = True

    def classify(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Classify a user message into an intent.

        Stage 1: keyword matching (fast, free).
        Stage 2: Gemini fallback if confidence < 0.6 (rare).
        """
        intent, confidence, entities = self._stage1_keywords(message)

        if confidence < 0.6:
            intent, confidence, entities = self._stage2_gemini(message, intent, confidence, context)

        return {
            "intent": intent.value if isinstance(intent, Intent) else intent,
            "confidence": confidence,
            "entities": entities,
        }

    def _stage1_keywords(self, message: str) -> Tuple[Intent, float, Dict[str, Any]]:
        """Deterministic keyword matching."""
        text = message.lower().strip()
        scores: Dict[Intent, float] = {}

        for intent, keywords in _KEYWORD_MAP.items():
            for kw in keywords:
                if kw in text:
                    # Longer keywords → higher confidence
                    scores[intent] = scores.get(intent, 0) + len(kw.split())

        if not scores:
            return Intent.GENERAL, 0.2, {}

        # Pick highest score, break ties by priority
        best_intent = max(scores, key=lambda i: (scores[i], -_PRIORITY.index(i)))
        max_possible = max(len(kw.split()) for kws in _KEYWORD_MAP.values() for kw in kws)
        confidence = min(0.95, scores[best_intent] / max_possible * 1.5 + 0.4)

        return best_intent, round(confidence, 2), {}

    def _stage2_gemini(
        self,
        message: str,
        fallback_intent: Intent,
        fallback_confidence: float,
        context: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Intent, float, Dict[str, Any]]:
        """Gemini-based intent classification (token cost — used sparingly)."""
        if self._client is None:
            from .client import get_genai_client
            self._client = get_genai_client()

        intents_list = ", ".join(i.value for i in Intent)
        prompt = f"""Classify the user message into exactly ONE of these intents: {intents_list}

User message: "{message}"

Return ONLY valid JSON:
{{"intent": "<INTENT>", "confidence": <0.0-1.0>, "entities": {{}}}}"""

        try:
            response = self._client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt,
            )
            import json
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            result = json.loads(text.strip())
            intent_str = result.get("intent", fallback_intent.value).upper()
            try:
                intent = Intent(intent_str)
            except ValueError:
                intent = fallback_intent
            confidence = float(result.get("confidence", 0.7))
            return intent, confidence, result.get("entities", {})
        except Exception as e:
            logger.warning("Gemini intent classification failed: %s", e)
            return fallback_intent, fallback_confidence, {}


def get_intent_router() -> IntentRouter:
    return IntentRouter()
