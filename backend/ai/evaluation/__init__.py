"""
backend/ai/evaluation/__init__.py
=================================
GET Solar Energy — AI Evaluation Package
Phase 3.0: Controlled Staging Pilot & Comparative Evaluation
"""

from .dataset import EVALUATION_DATASET, EvaluationCase
from .metrics import CaseMetric, EvaluationSummary, aggregate_metrics
from .checks import run_all_checks, check_non_empty, check_no_secret_leak, check_uncertainty_markers
from .evaluator import EvaluationRunner, compare_providers, HUMAN_REVIEW_RUBRIC
from .staging_pilot import (
    StagingSafetyGates,
    StagingSafetyGateError,
    PreflightReport,
    run_preflight,
    run_staging_pilot,
    MAX_STAGING_CASES,
    MAX_STAGING_TIMEOUT_SEC,
)

__all__ = [
    "EVALUATION_DATASET",
    "EvaluationCase",
    "CaseMetric",
    "EvaluationSummary",
    "aggregate_metrics",
    "run_all_checks",
    "check_non_empty",
    "check_no_secret_leak",
    "check_uncertainty_markers",
    "EvaluationRunner",
    "compare_providers",
    "HUMAN_REVIEW_RUBRIC",
    "StagingSafetyGates",
    "StagingSafetyGateError",
    "PreflightReport",
    "run_preflight",
    "run_staging_pilot",
    "MAX_STAGING_CASES",
    "MAX_STAGING_TIMEOUT_SEC",
]
