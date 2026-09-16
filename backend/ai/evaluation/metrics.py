"""
backend/ai/evaluation/metrics.py
================================
GET Solar Energy — AI Evaluation Metrics Data Model
Phase 3.0: Controlled Staging Pilot & Comparative Evaluation

Defines metric collection structures and summary aggregation utilities.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class CaseMetric:
    """Metrics recorded for a single evaluation prompt execution."""
    case_id: str
    category: str
    provider_name: str
    model_name: str
    success: bool
    latency_ms: float = 0.0
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    usage_available: bool = False
    error_category: Optional[str] = None
    error_message: Optional[str] = None
    response_length: int = 0
    is_empty: bool = False
    required_fallback: bool = False
    structure_valid: bool = True
    checks_passed: List[str] = field(default_factory=list)
    checks_failed: List[str] = field(default_factory=list)
    is_mock: bool = True
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "case_id": self.case_id,
            "category": self.category,
            "provider_name": self.provider_name,
            "model_name": self.model_name,
            "success": self.success,
            "latency_ms": round(self.latency_ms, 2),
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "usage_available": self.usage_available,
            "error_category": self.error_category,
            "error_message": self.error_message,
            "response_length": self.response_length,
            "is_empty": self.is_empty,
            "required_fallback": self.required_fallback,
            "structure_valid": self.structure_valid,
            "checks_passed": self.checks_passed,
            "checks_failed": self.checks_failed,
            "is_mock": self.is_mock,
        }


@dataclass
class EvaluationSummary:
    """Aggregated evaluation results across a test run."""
    provider_name: str
    model_name: str
    total_cases: int
    successful_cases: int
    failed_cases: int
    success_rate: float
    avg_latency_ms: float
    p50_latency_ms: float
    p95_latency_ms: float
    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int
    rule_checks_pass_rate: float
    is_mock: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "provider_name": self.provider_name,
            "model_name": self.model_name,
            "total_cases": self.total_cases,
            "successful_cases": self.successful_cases,
            "failed_cases": self.failed_cases,
            "success_rate": round(self.success_rate, 2),
            "avg_latency_ms": round(self.avg_latency_ms, 2),
            "p50_latency_ms": round(self.p50_latency_ms, 2),
            "p95_latency_ms": round(self.p95_latency_ms, 2),
            "total_prompt_tokens": self.total_prompt_tokens,
            "total_completion_tokens": self.total_completion_tokens,
            "total_tokens": self.total_tokens,
            "rule_checks_pass_rate": round(self.rule_checks_pass_rate, 2),
            "is_mock": self.is_mock,
        }


def aggregate_metrics(
    provider_name: str,
    model_name: str,
    case_metrics: List[CaseMetric],
    is_mock: bool = True,
) -> EvaluationSummary:
    """Aggregate individual case metrics into a summary report."""
    total = len(case_metrics)
    if total == 0:
        return EvaluationSummary(
            provider_name=provider_name,
            model_name=model_name,
            total_cases=0,
            successful_cases=0,
            failed_cases=0,
            success_rate=0.0,
            avg_latency_ms=0.0,
            p50_latency_ms=0.0,
            p95_latency_ms=0.0,
            total_prompt_tokens=0,
            total_completion_tokens=0,
            total_tokens=0,
            rule_checks_pass_rate=0.0,
            is_mock=is_mock,
        )

    successes = sum(1 for m in case_metrics if m.success)
    latencies = sorted([m.latency_ms for m in case_metrics if m.success] or [0.0])

    p50 = latencies[len(latencies) // 2] if latencies else 0.0
    p95_idx = int(len(latencies) * 0.95)
    p95 = latencies[min(p95_idx, len(latencies) - 1)] if latencies else 0.0
    avg_lat = sum(latencies) / len(latencies) if latencies else 0.0

    prompt_toks = sum(m.prompt_tokens or 0 for m in case_metrics)
    comp_toks = sum(m.completion_tokens or 0 for m in case_metrics)
    tot_toks = sum(m.total_tokens or 0 for m in case_metrics)

    all_passed_checks = sum(len(m.checks_passed) for m in case_metrics)
    all_failed_checks = sum(len(m.checks_failed) for m in case_metrics)
    total_checks = all_passed_checks + all_failed_checks
    checks_rate = (all_passed_checks / total_checks * 100.0) if total_checks > 0 else 100.0

    return EvaluationSummary(
        provider_name=provider_name,
        model_name=model_name,
        total_cases=total,
        successful_cases=successes,
        failed_cases=total - successes,
        success_rate=round(successes / total * 100.0, 2),
        avg_latency_ms=round(avg_lat, 2),
        p50_latency_ms=round(p50, 2),
        p95_latency_ms=round(p95, 2),
        total_prompt_tokens=prompt_toks,
        total_completion_tokens=comp_toks,
        total_tokens=tot_toks,
        rule_checks_pass_rate=round(checks_rate, 2),
        is_mock=is_mock,
    )
