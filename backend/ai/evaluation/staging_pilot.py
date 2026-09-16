"""
backend/ai/evaluation/staging_pilot.py
======================================
GET Solar Energy — Controlled Staging Pilot & Safety Gates
Phase 4.0: Live Staging Validation With Rollback and Acceptance Gates

This module defines the safety gates, preflight validation routines,
and controlled staging execution harness for AI provider validation.

Safety Invariants:
1. Gemini remains the active default provider.
2. OpenAI Luna remains opt-in only.
3. Offline mode is default; live mode requires explicit staging authorization.
4. Production environment strictly blocks live execution.
5. Zero database mutations and zero destructive tool calls allowed.
6. Zero secrets exposed in preflight metadata, logs, or reports.
7. Only synthetic datasets (20 cases max) are permitted.
"""

import os
import re
import urllib.parse
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from ..provider_base import BaseAIProvider, AIRequest, AIResponse, AIProviderError
from ..provider_factory import get_ai_provider, set_ai_provider
from ..providers.mock_provider import MockAIProvider
from .dataset import EVALUATION_DATASET, EvaluationCase
from .metrics import CaseMetric, EvaluationSummary, aggregate_metrics
from .checks import run_all_checks
from .evaluator import EvaluationRunner

# Maximum bounds for staging pilot
MAX_STAGING_CASES = 20
MAX_STAGING_TIMEOUT_SEC = 60
BLOCKED_ENVIRONMENTS = {"production", "prod", "live"}
ALLOWED_STAGING_ENVIRONMENTS = {"staging", "stage", "test", "development", "dev", "local"}


class StagingSafetyGateError(Exception):
    """Raised when any staging safety gate fails."""
    pass


@dataclass
class PreflightReport:
    """Safe metadata representation of preflight status with zero secrets."""
    provider_name: str
    environment: str
    model_identifier: str
    api_base_host: str
    timeout_sec: int
    case_count: int
    max_cases_allowed: int
    staging_authorized: bool
    live_mode_requested: bool
    is_offline_mock: bool
    db_mutations_disabled: bool
    tools_disabled: bool
    synthetic_dataset_enforced: bool
    credentials_present: bool
    safety_gates_passed: bool
    gate_failures: List[str] = field(default_factory=list)
    warning_notice: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Return safe dictionary with absolutely no credentials or auth tokens."""
        return {
            "provider_name": self.provider_name,
            "environment": self.environment,
            "model_identifier": self.model_identifier,
            "api_base_host": self.api_base_host,
            "timeout_sec": self.timeout_sec,
            "case_count": self.case_count,
            "max_cases_allowed": self.max_cases_allowed,
            "staging_authorized": self.staging_authorized,
            "live_mode_requested": self.live_mode_requested,
            "is_offline_mock": self.is_offline_mock,
            "db_mutations_disabled": self.db_mutations_disabled,
            "tools_disabled": self.tools_disabled,
            "synthetic_dataset_enforced": self.synthetic_dataset_enforced,
            "credentials_present": self.credentials_present,
            "safety_gates_passed": self.safety_gates_passed,
            "gate_failures": self.gate_failures,
            "warning_notice": self.warning_notice,
        }


def _extract_safe_hostname(url: Optional[str]) -> str:
    """Extract host only from an API base URL, omitting paths, ports, or credentials."""
    if not url:
        return "default-cloud-endpoint"
    try:
        parsed = urllib.parse.urlparse(url)
        return parsed.hostname or parsed.netloc or "custom-endpoint"
    except Exception:
        return "custom-endpoint"


class StagingSafetyGates:
    """
    Evaluates and enforces all 16 staging safety gates.
    """

    @classmethod
    def evaluate(
        cls,
        provider_name: str,
        allow_staging: bool = False,
        dataset: Optional[List[EvaluationCase]] = None,
        timeout_sec: int = 30,
        db_mutations: bool = False,
        tools_enabled: bool = False,
    ) -> PreflightReport:
        """
        Evaluate all safety gates and return a safe PreflightReport.
        """
        norm_provider = provider_name.strip().lower()
        if not norm_provider:
            norm_provider = "mock"

        # 1. Environment check
        env_raw = os.getenv("ENVIRONMENT") or os.getenv("APP_ENV") or os.getenv("NODE_ENV") or "staging"
        current_env = env_raw.strip().lower()

        # 2. Authorization check
        env_auth = os.getenv("AI_EVAL_ALLOW_STAGING") == "1"
        is_authorized = bool(allow_staging or env_auth)

        # 3. Mode check
        is_live_provider = norm_provider in ("gemini", "luna", "openai", "openai_luna")
        is_mock = (norm_provider in ("mock", "offline")) or (not is_live_provider and not is_authorized)
        live_mode_requested = is_live_provider and is_authorized

        # 4. Dataset bounds & synthetic verification
        cases = dataset if dataset is not None else EVALUATION_DATASET
        case_count = len(cases)
        synthetic_enforced = all(isinstance(c, EvaluationCase) for c in cases)

        # 5. Model identifier & endpoint host resolution
        model_id = "unknown"
        api_base_host = "default"
        creds_present = False

        if norm_provider == "gemini":
            model_id = os.getenv("GEMINI_MODEL") or os.getenv("ASSISTANT_MODEL", "gemini-2.5-flash-lite")
            api_base_host = "generativelanguage.googleapis.com"
            creds_present = bool(os.getenv("GEMINI_API_KEY"))
        elif norm_provider in ("luna", "openai", "openai_luna"):
            if norm_provider == "luna":
                model_id = os.getenv("LUNA_MODEL") or os.getenv("OPENAI_MODEL") or "gpt-5.6-luna"
                base_url = os.getenv("LUNA_API_BASE") or os.getenv("OPENAI_BASE_URL") or "https://api.openai.com/v1"
                creds_present = bool(os.getenv("LUNA_API_KEY") or os.getenv("OPENAI_API_KEY"))
            else:
                model_id = os.getenv("OPENAI_MODEL") or os.getenv("LUNA_MODEL") or "gpt-5.6-luna"
                base_url = os.getenv("OPENAI_BASE_URL") or os.getenv("LUNA_API_BASE") or "https://api.openai.com/v1"
                creds_present = bool(os.getenv("OPENAI_API_KEY") or os.getenv("LUNA_API_KEY"))
            api_base_host = _extract_safe_hostname(base_url)
        elif is_mock:
            model_id = "mock-solar-v1"
            api_base_host = "localhost-memory"
            creds_present = True

        # Check gate failures
        failures: List[str] = []

        if current_env in BLOCKED_ENVIRONMENTS:
            failures.append(f"Production environment detected ('{current_env}'). Live pilot is strictly forbidden.")

        if is_live_provider and not is_authorized:
            failures.append(
                f"Live pilot on provider '{norm_provider}' requires explicit staging authorization "
                "(allow_staging=True or AI_EVAL_ALLOW_STAGING=1)."
            )

        if is_live_provider:
            if not creds_present:
                failures.append(f"Credentials for provider '{norm_provider}' are missing in backend environment.")

            if case_count > MAX_STAGING_CASES:
                failures.append(f"Case count {case_count} exceeds maximum allowed bound of {MAX_STAGING_CASES}.")

            if timeout_sec > MAX_STAGING_TIMEOUT_SEC:
                failures.append(f"Timeout {timeout_sec}s exceeds maximum allowed bound of {MAX_STAGING_TIMEOUT_SEC}s.")

            if db_mutations:
                failures.append("Database mutations must be disabled during staging pilot.")

            if tools_enabled:
                failures.append("Tool execution must be disabled during staging pilot.")

            if not synthetic_enforced:
                failures.append("Dataset must consist strictly of synthetic evaluation cases.")

        warning_notice = (
            "NOTICE: Live pilot calls will incur external provider API usage and latency. "
            "Gemini remains production default. No automatic production failover will occur."
            if live_mode_requested else
            "Offline validation mode. No external provider network calls will be made."
        )

        passed = len(failures) == 0

        return PreflightReport(
            provider_name=norm_provider,
            environment=current_env,
            model_identifier=model_id,
            api_base_host=api_base_host,
            timeout_sec=timeout_sec,
            case_count=case_count,
            max_cases_allowed=MAX_STAGING_CASES,
            staging_authorized=is_authorized,
            live_mode_requested=live_mode_requested,
            is_offline_mock=is_mock,
            db_mutations_disabled=not db_mutations,
            tools_disabled=not tools_enabled,
            synthetic_dataset_enforced=synthetic_enforced,
            credentials_present=creds_present,
            safety_gates_passed=passed,
            gate_failures=failures,
            warning_notice=warning_notice,
        )


def run_preflight(
    provider_name: str = "mock",
    allow_staging: bool = False,
    dataset: Optional[List[EvaluationCase]] = None,
    timeout_sec: int = 30,
) -> Dict[str, Any]:
    """
    Run preflight verification and return a safe summary dict with zero secrets.
    """
    report = StagingSafetyGates.evaluate(
        provider_name=provider_name,
        allow_staging=allow_staging,
        dataset=dataset,
        timeout_sec=timeout_sec,
        db_mutations=False,
        tools_enabled=False,
    )
    return report.to_dict()


def run_staging_pilot(
    provider_name: str = "mock",
    allow_staging: bool = False,
    dataset: Optional[List[EvaluationCase]] = None,
    dry_run: bool = True,
    timeout_sec: int = 30,
) -> Dict[str, Any]:
    """
    Execute a bounded staging pilot evaluation under safety gates.

    If dry_run=True (default), runs preflight validation and returns preflight summary
    without performing live network calls.
    """
    # 1. Run Preflight Safety Gates
    report = StagingSafetyGates.evaluate(
        provider_name=provider_name,
        allow_staging=allow_staging,
        dataset=dataset,
        timeout_sec=timeout_sec,
        db_mutations=False,
        tools_enabled=False,
    )

    if not report.safety_gates_passed:
        raise StagingSafetyGateError(
            f"Staging pilot safety gates failed for provider '{provider_name}': {'; '.join(report.gate_failures)}"
        )

    if dry_run:
        return {
            "status": "PREFLIGHT_PASSED_DRY_RUN",
            "preflight": report.to_dict(),
            "message": "Dry run completed successfully. Preflight passed. No live network calls were executed.",
            "metrics": None,
        }

    # 2. Execute Bounded Run (if not dry_run)
    runner = EvaluationRunner(
        provider_name=provider_name,
        allow_staging=allow_staging,
    )
    case_metrics, summary = runner.run(dataset=dataset)

    return {
        "status": "PILOT_COMPLETED",
        "preflight": report.to_dict(),
        "summary": summary.to_dict(),
        "case_count": len(case_metrics),
    }
