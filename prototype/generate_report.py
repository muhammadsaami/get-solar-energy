"""
Tool 2 — Prototype Report Generator
Phase 16.0B.0D — Final Validation Review

Transforms the Gemini evaluation output (summary.json + report.csv) into
production-quality Markdown and HTML evaluation reports.

Usage:
    python generate_report.py --results results/gemini-2-5-flash/
    python generate_report.py --results results/gemini-2-5-flash/ --output my_report

Output:
    my_report.md
    my_report.html
    (default: validation_report.md / .html)
"""

import os
import sys
import json
import csv
import argparse
from pathlib import Path
from datetime import datetime

FRAMEWORK_VERSION = "1.1.0"


# ─── KPI Definitions (mirrors validate_satellite.py) ──────────────────
KPI_DEFINITIONS = {
    "roof_type_accuracy":         {"label": "Roof Type Accuracy",             "target": 80.0, "minimum": 70.0, "critical": True,  "higher_is_better": True},
    "facing_direction_accuracy":  {"label": "Facing Direction Accuracy",      "target": 80.0, "minimum": 75.0, "critical": True,  "higher_is_better": True},
    "obstacle_detection_recall":  {"label": "Obstacle Detection Recall",      "target": 60.0, "minimum": 50.0, "critical": True,  "higher_is_better": True},
    "shading_accuracy":           {"label": "Shading Accuracy",               "target": 70.0, "minimum": 60.0, "critical": True,  "higher_is_better": True},
    "analysis_success_rate":      {"label": "Analysis Success Rate",          "target": 95.0, "minimum": 90.0, "critical": True,  "higher_is_better": True},
    "hallucination_rate":         {"label": "Hallucination Rate",             "target": 10.0, "minimum": 15.0, "critical": True,  "higher_is_better": False},
    "fpr_obstacles":              {"label": "False Positive Rate (Obstacles)","target": 20.0, "minimum": 30.0, "critical": False, "higher_is_better": False},
    "response_consistency":       {"label": "Response Consistency",           "target": 80.0, "minimum": 70.0, "critical": False, "higher_is_better": True},
    "prompt_stability":           {"label": "Prompt Stability",               "target": 90.0, "minimum": 85.0, "critical": False, "higher_is_better": True},
    "solar_potential_accuracy":   {"label": "Solar Potential Accuracy",       "target": 80.0, "minimum": 70.0, "critical": False, "higher_is_better": True},
}

CRITICAL_KEYS = {k for k, v in KPI_DEFINITIONS.items() if v["critical"]}


# ─── Data Loader ──────────────────────────────────────────────────────
class ValidationData:
    def __init__(self, results_dir: str):
        self.dir = Path(results_dir)
        self.summary = self._load_json("summary.json")
        self.rows = self._load_csv("report.csv")
        self.metrics = self.summary.get("kpi_results", {})
        self.decision = self.summary.get("decision", "UNKNOWN")
        self.decision_reason = self.summary.get("decision_reason", "")
        self.decision_details = self.summary.get("decision_details", [])

    def _load_json(self, name: str) -> dict:
        path = self.dir / name
        if not path.exists():
            print(f"Warning: {path} not found", file=sys.stderr)
            return {}
        with open(path) as f:
            return json.load(f)

    def _load_csv(self, name: str) -> list[dict]:
        path = self.dir / name
        if not path.exists():
            return []
        with open(path, newline="") as f:
            return list(csv.DictReader(f))


# ─── Report Sections ──────────────────────────────────────────────────
def build_executive_summary(data: ValidationData) -> str:
    total = data.summary.get("total_images", 0)
    successful = data.summary.get("successful_images", 0)
    model = data.summary.get("model", "unknown")
    date = data.summary.get("validation_date", "unknown")
    dec = data.decision
    dec_icon = {"GO": "✅", "GO WITH CONDITIONS": "⚠️", "NO GO": "❌"}.get(dec, "❓")
    return f"""\
# Prototype Validation Report

**Date:** {date}
**Model:** {model}
**Dataset:** {total} images ({successful} successful)
**Framework:** v{data.summary.get('framework_version', '?')}

## Executive Summary

**Decision: {dec_icon} {dec}**

{data.decision_reason}

"""


def _kpi_status(value: float, kdef: dict) -> str:
    higher = kdef.get("higher_is_better", True)
    target = kdef["target"]
    minimum = kdef["minimum"]
    if higher:
        if value >= target:
            return "✅ PASS"
        elif value >= minimum:
            return "⬇ BELOW TARGET"
        else:
            return "❌ FAIL"
    else:
        if value <= target:
            return "✅ PASS"
        elif value <= minimum:
            return "⬇ BELOW TARGET"
        else:
            return "❌ FAIL"


def build_kpi_scorecard(data: ValidationData) -> str:
    lines = [
        "## KPI Scorecard",
        "",
        "| KPI | Result | Target | Minimum | Status | Critical? |",
        "|-----|--------|--------|---------|--------|-----------|",
    ]
    for key, kdef in KPI_DEFINITIONS.items():
        value = data.metrics.get(key, 0.0)
        label = kdef["label"]
        target = kdef["target"]
        minimum = kdef["minimum"]
        critical = "Yes" if kdef["critical"] else "No"
        status = _kpi_status(value, kdef)

        lines.append(f"| {label} | {value:.1f}% | {target:.0f}% | {minimum:.0f}% | {status} | {critical} |")

    lines.append("")
    return "\n".join(lines)


def build_error_analysis(data: ValidationData) -> str:
    rows = data.rows
    if not rows:
        return "## Error Analysis\n\nNo per-image data available.\n\n"

    failures = [r for r in rows if r.get("run1_success", "").lower() != "true"]
    lines = [
        "## Error Analysis",
        "",
        f"**Total failures:** {len(failures)} / {len(rows)}",
        "",
    ]
    if failures:
        lines.append("### Failed Images")
        lines.append("")
        lines.append("| Filename | City | Error |")
        lines.append("|----------|------|-------|")
        for f in failures:
            lines.append(f"| {f.get('filename','?')} | {f.get('city','?')} | Gemini returned no parseable JSON |")
        lines.append("")

    # Breakdown by roof type
    lines.append("### Failure Distribution")
    lines.append("")
    by_type = {}
    for r in rows:
        t = r.get("truth_roof_type", "unknown")
        f = r.get("filename", "?")
        failed = r.get("run1_success", "").lower() != "true"
        by_type.setdefault(t, {"total": 0, "failed": 0})
        by_type[t]["total"] += 1
        if failed:
            by_type[t]["failed"] += 1
    lines.append("| Roof Type | Total | Failed | Failure Rate |")
    lines.append("|-----------|-------|--------|-------------|")
    for t, counts in sorted(by_type.items()):
        rate = counts["failed"] / counts["total"] * 100 if counts["total"] else 0
        lines.append(f"| {t} | {counts['total']} | {counts['failed']} | {rate:.1f}% |")
    lines.append("")
    return "\n".join(lines)


def build_hallucination_analysis(data: ValidationData) -> str:
    rows = data.rows
    hall_rate = data.metrics.get("hallucination_rate", 0.0)
    fpr = data.metrics.get("fpr_obstacles", 0.0)

    lines = [
        "## Hallucination Analysis",
        "",
        f"**Hallucination Rate:** {hall_rate:.1f}%",
        f"**Obstacle False Positive Rate:** {fpr:.1f}%",
        "",
    ]

    # Find specific hallucination examples from CSV
    if rows:
        hall_examples = []
        for r in rows:
            pred_rc = r.get("pred_roof_condition", "").strip().lower()
            if pred_rc and "not available" not in pred_rc:
                hall_examples.append((r.get("filename", "?"), f"roof_condition = '{pred_rc}'"))
            pred_obs = r.get("pred_obstacles", "").strip().lower()
            truth_obs = r.get("truth_obstacles", "").strip().lower()
            if pred_obs and pred_obs != "none" and (not truth_obs or truth_obs == ""):
                hall_examples.append((r.get("filename", "?"), f"false obstacles = '{pred_obs}'"))

        if hall_examples:
            lines.append("### Specific Hallucinations Detected")
            lines.append("")
            lines.append("| Filename | Hallucination |")
            lines.append("|----------|--------------|")
            for fn, desc in hall_examples[:10]:
                lines.append(f"| {fn} | {desc} |")
            if len(hall_examples) > 10:
                lines.append(f"| ... | ({len(hall_examples) - 10} more) |")
            lines.append("")

    return "\n".join(lines)


def build_failure_patterns(data: ValidationData) -> str:
    rows = data.rows
    if not rows:
        return "## Failure Patterns\n\nNo per-image data available.\n\n"

    # Count correct/incorrect per field
    fields = [
        ("roof_type_correct", "Roof Type"),
        ("shading_correct", "Shading"),
    ]
    lines = [
        "## Failure Patterns",
        "",
        "### Field-Level Accuracy Breakdown",
        "",
        "| Field | Correct | Incorrect | Accuracy |",
        "|-------|---------|-----------|----------|",
    ]
    for col, label in fields:
        correct = sum(1 for r in rows if r.get(col, "").lower() == "true" and r.get("run1_success", "").lower() == "true")
        total = sum(1 for r in rows if r.get("run1_success", "").lower() == "true")
        pct = correct / total * 100 if total else 0
        lines.append(f"| {label} | {correct} | {total - correct} | {pct:.1f}% |")
    lines.append("")

    # Facing direction confusion matrix
    lines.append("### Facing Direction Confusion")
    lines.append("")
    lines.append("| Truth \\ Pred | Agreement | Off by 1 | Off by ≥2 |")
    lines.append("|-------------|-----------|----------|-----------|")
    facing_rows = [r for r in rows if r.get("run1_success", "").lower() == "true"]
    agreements = sum(1 for r in facing_rows if r.get("facing_within_1", "").lower() == "true")
    total_f = len(facing_rows)
    off_by_1 = agreements  # "within_1" includes exact matches
    off_by_2 = total_f - off_by_1
    lines.append(f"| All | {agreements} | {off_by_1 - (total_f - off_by_2)} | {off_by_2} |")
    lines.append("")

    return "\n".join(lines)


def build_consistency_analysis(data: ValidationData) -> str:
    consistency = data.metrics.get("response_consistency", 0.0)
    stability = data.metrics.get("prompt_stability", 0.0)
    return f"""\
## Prompt & Response Stability

| Metric | Value | Target | Minimum | Status |
|--------|-------|--------|---------|--------|
| Response Consistency | {consistency:.1f}% | 80% | 70% | {"✅" if consistency >= 70 else "❌"} |
| Prompt Stability | {stability:.1f}% | 90% | 85% | {"✅" if stability >= 85 else "❌"} |

"""


def build_recommendation(data: ValidationData) -> str:
    critical_fails = []
    near_misses = []
    for key in CRITICAL_KEYS:
        v = data.metrics.get(key, 0.0)
        kdef = KPI_DEFINITIONS[key]
        m = kdef["minimum"]
        t = kdef["target"]
        higher = kdef.get("higher_is_better", True)
        label = kdef["label"]

        if higher:
            if v < m:
                critical_fails.append(f"- **{label}**: {v:.1f}% < minimum {m:.0f}%")
            elif v < t:
                near_misses.append(f"- {label}: {v:.1f}% (target {t:.0f}%, minimum {m:.0f}%)")
        else:
            if v > m:
                critical_fails.append(f"- **{label}**: {v:.1f}% > maximum {m:.0f}%")
            elif v > t:
                near_misses.append(f"- {label}: {v:.1f}% (target ≤{t:.0f}%, maximum {m:.0f}%)")

    lines = [
        "## Recommendation",
        "",
        f"### Final Decision: **{data.decision}**",
        "",
        f"**Reason:** {data.decision_reason}",
        "",
    ]

    if critical_fails:
        lines.append("### ❌ Critical Failures Blocking Production")
        lines.append("")
        lines.extend(critical_fails)
        lines.append("")
        lines.append("**Verdict:** Do NOT proceed to Phase 16.0B.1. Feature must be redesigned or cancelled.")
        lines.append("")

    elif near_misses:
        lines.append("### ⚠️ Critical KPIs Near Minimum Threshold")
        lines.append("")
        lines.extend(near_misses)
        lines.append("")
        lines.append("**Verdict:** Proceed with caution. Monitor these metrics in production.")
        lines.append("")

    else:
        lines.append("### ✅ All Critical KPIs Pass")
        lines.append("")
        lines.append("**Verdict:** Proceed to Phase 16.0B.1 (Production Implementation).")
        lines.append("")

    if data.decision_details:
        lines.append("### Details")
        for d in data.decision_details:
            lines.append(f"- {d}")

    lines.append("")
    return "\n".join(lines)


# ─── Report Builders ──────────────────────────────────────────────────
def build_markdown(data: ValidationData) -> str:
    sections = [
        build_executive_summary(data),
        build_kpi_scorecard(data),
        build_error_analysis(data),
        build_hallucination_analysis(data),
        build_failure_patterns(data),
        build_consistency_analysis(data),
        build_recommendation(data),
    ]
    return "\n".join(sections)


def build_html(data: ValidationData) -> str:
    md = build_markdown(data)

    # Convert markdown to basic HTML and wrap in styled template
    def md_to_html(text: str) -> str:
        lines = []
        in_table = False
        table_buffer = []
        for line in text.split("\n"):
            if line.startswith("|"):
                in_table = True
                table_buffer.append(line)
                continue
            if in_table:
                lines.append(_render_table(table_buffer))
                table_buffer = []
                in_table = False

            if line.startswith("### "):
                lines.append(f"<h3>{line[4:]}</h3>")
            elif line.startswith("## "):
                lines.append(f"<h2>{line[3:]}</h2>")
            elif line.startswith("# "):
                lines.append(f"<h1>{line[2:]}</h1>")
            elif line.startswith("**"):
                lines.append(f"<p><strong>{line.strip('*')}</strong></p>")
            elif line.startswith("- "):
                lines.append(f"<li>{line[2:]}</li>")
            elif line.strip() == "":
                lines.append("<br>")
            elif line.startswith("|"):
                pass
            else:
                lines.append(f"<p>{line}</p>")

        if in_table and table_buffer:
            lines.append(_render_table(table_buffer))

        return "\n".join(lines)

    def _render_table(rows):
        if not rows:
            return ""
        headers = [h.strip() for h in rows[0].split("|")[1:-1]]
        html = "<table><thead><tr>"
        for h in headers:
            html += f"<th>{h}</th>"
        html += "</tr></thead><tbody>"
        for row in rows[2:]:  # skip header separator
            cols = [c.strip() for c in row.split("|")[1:-1]]
            html += "<tr>"
            for c in cols:
                html += f"<td>{c}</td>"
            html += "</tr>"
        html += "</tbody></table>"
        return html

    body = md_to_html(md)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prototype Validation Report — {data.summary.get('model', 'unknown')}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 960px; margin: 0 auto; padding: 2rem; background: #0f172a; color: #e2e8f0; line-height: 1.6; }}
  h1 {{ color: #f7931e; border-bottom: 2px solid #f7931e; padding-bottom: 0.5rem; }}
  h2 {{ color: #38bdf8; margin-top: 2rem; }}
  h3 {{ color: #94a3b8; }}
  table {{ border-collapse: collapse; width: 100%; margin: 1rem 0; background: #1e293b; border-radius: 8px; overflow: hidden; }}
  th, td {{ padding: 0.5rem 1rem; text-align: left; border-bottom: 1px solid #334155; }}
  th {{ background: #334155; color: #f8fafc; font-weight: 600; }}
  tr:hover {{ background: #2d3a4f; }}
  .pass {{ color: #4ade80; }}
  .fail {{ color: #f87171; }}
  .warn {{ color: #fbbf24; }}
  li {{ margin: 0.25rem 0; }}
  br {{ display: block; margin: 0.5rem 0; }}
  p {{ margin: 0.5rem 0; }}
  .decision-go {{ background: #166534; border: 2px solid #4ade80; border-radius: 12px; padding: 1.5rem; text-align: center; font-size: 1.5rem; font-weight: 700; margin: 2rem 0; }}
  .decision-gwc {{ background: #713f12; border: 2px solid #fbbf24; border-radius: 12px; padding: 1.5rem; text-align: center; font-size: 1.5rem; font-weight: 700; margin: 2rem 0; }}
  .decision-nogo {{ background: #7f1d1d; border: 2px solid #f87171; border-radius: 12px; padding: 1.5rem; text-align: center; font-size: 1.5rem; font-weight: 700; margin: 2rem 0; }}
</style>
</head>
<body>
{body}
</body>
</html>"""


# ─── CLI ──────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Tool 2 — Prototype Report Generator (Phase 16.0B.0D)"
    )
    parser.add_argument("--results", required=True, help="Directory containing summary.json and report.csv")
    parser.add_argument("--output", default="validation_report", help="Output file name (without extension)")
    parser.add_argument("--format", choices=["md", "html", "both"], default="both", help="Output format")
    args = parser.parse_args()

    script_dir = Path(__file__).parent
    results_dir = Path(args.results)
    if not results_dir.is_absolute():
        results_dir = script_dir / results_dir

    if not results_dir.exists():
        print(f"Error: Results directory not found: {results_dir}", file=sys.stderr)
        sys.exit(1)

    data = ValidationData(str(results_dir))
    if not data.summary:
        print("Error: No summary.json found in results directory", file=sys.stderr)
        sys.exit(1)

    md_content = build_markdown(data)
    html_content = build_html(data)

    output_path = Path(args.output)
    if not output_path.is_absolute():
        output_path = script_dir / output_path

    if args.format in ("md", "both"):
        md_path = output_path.with_suffix(".md")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_content)
        print(f"Markdown report: {md_path}")

    if args.format in ("html", "both"):
        html_path = output_path.with_suffix(".html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"HTML report: {html_path}")

    print()
    print(f"Decision: {data.decision}")
    print(f"Reason: {data.decision_reason}")
    if data.decision_details:
        for d in data.decision_details:
            print(f"  - {d}")


if __name__ == "__main__":
    main()
