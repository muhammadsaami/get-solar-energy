"""
Phase 16.0B.0 — Prototype Validation
Free Satellite Roof Locator — Gemini Vision Accuracy Evaluator

This is a STANDALONE validation tool. It does NOT import or modify any production code.
It exists solely to answer: "Can Gemini Vision accurately analyze Indian satellite roof
imagery at a level acceptable for production?"

Usage:
    python validate_satellite.py --labels labels.json --images images/

Output:
    - Console summary with GO / GO WITH CONDITIONS / NO GO recommendation
    - Detailed CSV report at prototype/results/report.csv
    - JSON summary at prototype/results/summary.json
"""

import os
import sys
import json
import csv
import time
import argparse
import logging
from pathlib import Path
from datetime import datetime
from collections import defaultdict

FRAMEWORK_VERSION = "1.1.0"

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("satellite_val")

try:
    from google import genai
    from google.genai import types
except ImportError:
    sys.exit("google-genai package required. Run: pip install google-genai")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


# ─── Compass Directions ───────────────────────────────────────────────
COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
COMPASS_IDX = {d: i for i, d in enumerate(COMPASS)}


def compass_distance(a: str, b: str) -> int:
    a = a.strip().upper()
    b = b.strip().upper()
    if a not in COMPASS_IDX or b not in COMPASS_IDX:
        return 99
    diff = abs(COMPASS_IDX[a] - COMPASS_IDX[b])
    return min(diff, 8 - diff)


# ─── Obstacle Token Matching ──────────────────────────────────────────
_OBSTACLE_STOP = {"a", "an", "the", "unit", "on", "in", "at", "of", "for", "and", "or", "to", "with"}

def _obstacle_tokens(desc: str) -> set:
    s = desc.lower().strip()
    tokens = set()
    current = ""
    for ch in s + " ":
        if ch.isalnum():
            current += ch
        elif current:
            if current not in _OBSTACLE_STOP and len(current) > 1:
                tokens.add(current)
            current = ""
    return tokens

def obstacle_matches(a: str, b: str) -> bool:
    ta = _obstacle_tokens(a)
    tb = _obstacle_tokens(b)
    if not ta or not tb:
        return a[:4].lower() in b.lower() or b[:4].lower() in a.lower()
    return len(ta & tb) >= 1


# ─── KPI Thresholds ──────────────────────────────────────────────────
KPI_DEFINITIONS = {
    "roof_type_accuracy": {
        "label": "Roof Type Accuracy",
        "target": 80.0,
        "minimum": 70.0,
        "critical": True,
    },
    "facing_direction_accuracy": {
        "label": "Facing Direction Accuracy",
        "target": 80.0,
        "minimum": 75.0,
        "critical": True,
    },
    "obstacle_detection_recall": {
        "label": "Obstacle Detection Recall",
        "target": 60.0,
        "minimum": 50.0,
        "critical": True,
    },
    "shading_accuracy": {
        "label": "Shading Accuracy",
        "target": 70.0,
        "minimum": 60.0,
        "critical": True,
    },
    "analysis_success_rate": {
        "label": "Analysis Success Rate",
        "target": 95.0,
        "minimum": 90.0,
        "critical": True,
    },
    "hallucination_rate": {
        "label": "Hallucination Rate",
        "target": 10.0,
        "minimum": 15.0,
        "critical": True,
        "higher_is_better": False,
    },
    "fpr_obstacles": {
        "label": "False Positive Rate (Obstacles)",
        "target": 20.0,
        "minimum": 30.0,
        "critical": False,
        "higher_is_better": False,
    },
    "response_consistency": {
        "label": "Response Consistency",
        "target": 80.0,
        "minimum": 70.0,
        "critical": False,
    },
    "prompt_stability": {
        "label": "Prompt Stability",
        "target": 90.0,
        "minimum": 85.0,
        "critical": False,
    },
    "solar_potential_accuracy": {
        "label": "Solar Potential Accuracy",
        "target": 80.0,
        "minimum": 70.0,
        "critical": False,
    },
}


# ─── Satellite Prompt (mirrors production intent) ────────────────────
SATELLITE_PROMPT = """You are analyzing a SATELLITE or overhead image of a rooftop.

IMPORTANT — Satellite-specific rules:
1. Roof condition CANNOT be assessed from satellite. Always set roof_condition to "Not Available (satellite estimate)".
2. Shading from nearby trees/structures may be visible from above.
3. Roof type (Flat/Sloped/Mixed) is clearly visible from overhead.
4. Obstacles visible from above may include AC units, water tanks, solar panels, tree overhang.

Analyze this rooftop satellite image and provide:
1. Roof facing direction/compass (North, South, East, West, NE, NW, SE, SW)
2. Roof condition — must be "Not Available (satellite estimate)" for satellite imagery
3. Shading issues (None, Partial, Heavy)
4. Roof type (Flat, Sloped, Mixed)
5. Solar potential based on direction (High, Medium, Low)
6. Obstacles visible (comma-separated list, or "None" if no obstacles visible)
7. Analysis notes — brief one-line summary of solar suitability

Return ONLY valid JSON with no extra text:
{
    "facing_direction": "South",
    "compass_angle": "180",
    "roof_condition": "Not Available (satellite estimate)",
    "shading_issues": "None",
    "roof_type": "Flat",
    "solar_potential": "High",
    "obstacles": "AC unit, water tank",
    "analysis_notes": "Good south facing roof ideal for solar"
}"""


# ─── Gemini Interface ─────────────────────────────────────────────────
class GeminiEvaluator:
    def __init__(self, model: str = "gemini-2.5-flash", prompt: str = SATELLITE_PROMPT):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            sys.exit("GEMINI_API_KEY environment variable not set")
        self.client = genai.Client(api_key=api_key)
        self.model = model
        self.prompt = prompt

    def analyze(self, image_path: str, attempt: int = 1) -> dict:
        with open(image_path, "rb") as f:
            image_data = f.read()

        mime_map = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
        }
        ext = Path(image_path).suffix.lower()
        mime_type = mime_map.get(ext, "image/png")

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_bytes(data=image_data, mime_type=mime_type),
                            types.Part.from_text(text=self.prompt),
                        ],
                    )
                ],
            )
            text = response.text.strip()
            parsed = self._parse_json(text)
            return {"success": True, "data": parsed, "raw": text, "attempt": attempt}
        except Exception as e:
            return {"success": False, "error": str(e), "raw": "", "attempt": attempt}

    def _parse_json(self, text: str) -> dict | None:
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            return None


# ─── KPI Calculator ──────────────────────────────────────────────────
class KPICalculator:
    def __init__(self, results: list):
        self.results = results
        self.metrics = {}

    def compute_all(self) -> dict:
        self._roof_type_accuracy()
        self._facing_direction_accuracy()
        self._obstacle_recall()
        self._shading_accuracy()
        self._analysis_success_rate()
        self._hallucination_rate()
        self._false_positive_rate()
        self._response_consistency()
        self._prompt_stability()
        self._solar_potential_accuracy()
        return self.metrics

    # ── helpers ─────────────────────────────────────────────────
    def _normalize(self, val: str) -> str:
        return val.strip().lower() if val else ""

    def _parse_obstacles(self, val) -> list:
        if not val:
            return []
        if isinstance(val, list):
            return [str(v).strip().lower() for v in val if v]
        val_str = str(val).strip().lower()
        if val_str in ("none", "", "no obstacles", "nil", "na"):
            return []
        return [v.strip() for v in val_str.split(",") if v.strip()]

    def _safe_get(self, data: dict, key: str, default=""):
        v = data.get(key, default)
        return str(v) if v is not None else default

    def _success_count(self) -> int:
        return sum(1 for r in self.results if r["run1_success"])

    # ── KPI 1: Roof Type Accuracy (Critical) ──────────────────
    def _roof_type_accuracy(self):
        correct = 0
        total = self._success_count()
        for r in self.results:
            if not r["run1_success"]:
                continue
            pred = self._normalize(self._safe_get(r["run1_data"], "roof_type"))
            truth = self._normalize(r["ground_truth"].get("roof_type", ""))
            if pred == truth:
                correct += 1
        self.metrics["roof_type_accuracy"] = (correct / total * 100) if total else 0.0

    # ── KPI 2: Facing Direction Accuracy (Critical) ───────────
    def _facing_direction_accuracy(self):
        within_1 = 0
        total = self._success_count()
        for r in self.results:
            if not r["run1_success"]:
                continue
            pred = self._normalize(self._safe_get(r["run1_data"], "facing_direction"))
            truth = self._normalize(r["ground_truth"].get("facing_direction", ""))
            if compass_distance(pred, truth) <= 1:
                within_1 += 1
        self.metrics["facing_direction_accuracy"] = (within_1 / total * 100) if total else 0.0

    # ── KPI 3: Obstacle Detection Recall (Critical) ───────────
    def _obstacle_recall(self):
        tp = 0
        fn = 0
        for r in self.results:
            if not r["run1_success"]:
                continue
            truth_obs = self._parse_obstacles(r["ground_truth"].get("obstacles", []))
            pred_obs = self._parse_obstacles(r["run1_data"].get("obstacles", ""))
            for t_ob in truth_obs:
                found = any(obstacle_matches(t_ob, p_ob) for p_ob in pred_obs)
                if found:
                    tp += 1
                else:
                    fn += 1
        self.metrics["obstacle_detection_recall"] = (tp / (tp + fn) * 100) if (tp + fn) else 0.0

    # ── KPI 4: Shading Accuracy (Critical) ────────────────────
    def _shading_accuracy(self):
        correct = 0
        total = self._success_count()
        for r in self.results:
            if not r["run1_success"]:
                continue
            pred = self._normalize(self._safe_get(r["run1_data"], "shading_issues"))
            truth = self._normalize(r["ground_truth"].get("shading", ""))
            if pred == truth:
                correct += 1
        self.metrics["shading_accuracy"] = (correct / total * 100) if total else 0.0

    # ── KPI 5: Analysis Success Rate (Critical) ───────────────
    def _analysis_success_rate(self):
        success = self._success_count()
        self.metrics["analysis_success_rate"] = (success / len(self.results) * 100) if self.results else 0.0

    # ── KPI 6: Hallucination Rate (Critical) ──────────────────
    def _hallucination_rate(self):
        hallucinated = 0
        total = self._success_count()
        for r in self.results:
            if not r["run1_success"]:
                continue
            data = r["run1_data"]
            # Check 1: roof_condition should be "Not Available" for satellite
            rc = self._normalize(self._safe_get(data, "roof_condition"))
            rc_hallucinated = bool(rc and "not available" not in rc)
            # Check 2: obstacle false positives
            truth_obs = self._parse_obstacles(r["ground_truth"].get("obstacles", []))
            pred_obs = self._parse_obstacles(data.get("obstacles", ""))
            obs_hallucinated = False
            for p_ob in pred_obs:
                if not any(obstacle_matches(p_ob, t_ob) for t_ob in truth_obs):
                    obs_hallucinated = True
                    break
            if rc_hallucinated or obs_hallucinated:
                hallucinated += 1
        self.metrics["hallucination_rate"] = (hallucinated / total * 100) if total else 0.0

    # ── KPI 7: False Positive Rate — Obstacles (Non-Critical) ─
    def _false_positive_rate(self):
        fp_images = 0
        tn_images = 0
        for r in self.results:
            if not r["run1_success"]:
                continue
            truth_obs = self._parse_obstacles(r["ground_truth"].get("obstacles", []))
            pred_obs = self._parse_obstacles(r["run1_data"].get("obstacles", ""))

            has_truth = len(truth_obs) > 0
            has_pred = len(pred_obs) > 0

            if not has_truth and not has_pred:
                tn_images += 1
            elif not has_truth and has_pred:
                fp_images += 1
            elif has_truth:
                # Count predicted obstacles that don't match any truth obstacle
                fp = sum(1 for p_ob in pred_obs if not any(obstacle_matches(p_ob, t_ob) for t_ob in truth_obs))
                if fp > 0:
                    fp_images += 1
        total = fp_images + tn_images
        self.metrics["fpr_obstacles"] = (fp_images / total * 100) if total else 0.0

    # ── KPI 8: Response Consistency (Non-Critical) ────────────
    def _response_consistency(self):
        agree = 0
        total_pairs = 0
        fields = ["roof_type", "facing_direction", "shading_issues", "solar_potential"]
        for r in self.results:
            if r["run1_success"] and r["run2_success"]:
                for field in fields:
                    total_pairs += 1
                    v1 = self._normalize(self._safe_get(r["run1_data"], field))
                    v2 = self._normalize(self._safe_get(r["run2_data"], field))
                    if v1 == v2:
                        agree += 1
        self.metrics["response_consistency"] = (agree / total_pairs * 100) if total_pairs else 0.0

    # ── KPI 9: Prompt Stability (Non-Critical) ────────────────
    def _prompt_stability(self):
        total = self._success_count()
        stable = sum(1 for r in self.results if r["run1_success"] and r["run2_success"])
        self.metrics["prompt_stability"] = (stable / total * 100) if total else 0.0

    # ── KPI 10: Solar Potential Accuracy (Non-Critical) ───────
    def _solar_potential_accuracy(self):
        correct = 0
        total = self._success_count()
        # Map both directions: "high"→"high", "medium"→"medium", "low"→"low"
        valid = {"high", "medium", "low"}
        for r in self.results:
            if not r["run1_success"]:
                continue
            pred = self._normalize(self._safe_get(r["run1_data"], "solar_potential"))
            if pred not in valid:
                continue
            truth = self._normalize(r["ground_truth"].get("solar_potential", ""))
            if pred == truth:
                correct += 1
        self.metrics["solar_potential_accuracy"] = (correct / total * 100) if total else 0.0


# ─── Decision Engine ──────────────────────────────────────────────────
def evaluate_decision(metrics: dict) -> dict:
    violations = []
    critical_failures = []
    noncritical_below_target = []

    for key, kdef in KPI_DEFINITIONS.items():
        value = metrics.get(key, 0.0)
        label = kdef["label"]
        higher = kdef.get("higher_is_better", True)
        threshold_min = kdef["minimum"]
        threshold_target = kdef["target"]

        if higher:
            failed = value < threshold_min
            below_target = value >= threshold_min and value < threshold_target
        else:
            failed = value > threshold_min
            below_target = value <= threshold_min and value > threshold_target

        if kdef["critical"]:
            if failed:
                op = ">" if not higher else "<"
                critical_failures.append(f"{label}: {value:.1f}% {op} maximum {threshold_min:.0f}%")
                violations.append(f"CRITICAL FAIL: {label}")
            elif below_target:
                violations.append(f"CRITICAL BELOW TARGET: {label}")
        else:
            if failed:
                op = ">" if not higher else "<"
                violations.append(f"NON-CRITICAL FAIL: {label}")
                noncritical_below_target.append(f"{label}: {value:.1f}% {op} {'maximum' if not higher else 'minimum'} {threshold_min:.0f}%")
            elif below_target:
                noncritical_below_target.append(f"{label}: {value:.1f}% {'>' if not higher else '<'} target {threshold_target:.0f}% (above {'minimum' if not higher else 'minimum'})")

    if critical_failures:
        return {"decision": "NO GO", "reason": "Critical KPI(s) below minimum threshold", "details": critical_failures}

    if noncritical_below_target:
        return {
            "decision": "GO WITH CONDITIONS",
            "reason": "All Critical KPIs pass, but non-critical KPI(s) below target",
            "details": noncritical_below_target,
        }

    return {"decision": "GO", "reason": "All KPIs meet or exceed targets", "details": []}


# ─── Report Generation ────────────────────────────────────────────────
def generate_report(metrics: dict, decision: dict, results: list, output_dir: str, model_name: str = "gemini-2.5-flash"):
    # Include model name in output path for multi-model comparison
    model_dir = os.path.join(output_dir, model_name.replace(".", "-"))
    os.makedirs(model_dir, exist_ok=True)

    # CSV per-image
    csv_path = os.path.join(model_dir, "report.csv")
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "filename", "city", "run1_success", "run2_success",
            "pred_roof_type", "truth_roof_type", "roof_type_correct",
            "pred_facing", "truth_facing", "facing_within_1",
            "pred_shading", "truth_shading", "shading_correct",
            "pred_obstacles", "truth_obstacles",
            "pred_roof_condition",
        ])
        for r in results:
            gt = r["ground_truth"]
            r1 = r["run1_data"] or {}
            writer.writerow([
                r["filename"],
                gt.get("city", ""),
                r["run1_success"],
                r["run2_success"],
                r1.get("roof_type", ""),
                gt.get("roof_type", ""),
                str(r1.get("roof_type", "")).lower() == gt.get("roof_type", "").lower() if r1 else "",
                r1.get("facing_direction", ""),
                gt.get("facing_direction", ""),
                compass_distance(r1.get("facing_direction", ""), gt.get("facing_direction", "")) <= 1 if r1 else "",
                r1.get("shading_issues", ""),
                gt.get("shading", ""),
                str(r1.get("shading_issues", "")).lower() == gt.get("shading", "").lower() if r1 else "",
                r1.get("obstacles", ""),
                ", ".join(gt.get("obstacles", [])),
                r1.get("roof_condition", ""),
            ])

    # JSON summary
    summary = {
        "framework_version": FRAMEWORK_VERSION,
        "validation_date": datetime.now().isoformat(),
        "total_images": len(results),
        "successful_images": sum(1 for r in results if r["run1_success"]),
        "model": model_name,
        "kpi_results": metrics,
        "kpi_definitions": KPI_DEFINITIONS,
        "decision": decision["decision"],
        "decision_reason": decision["reason"],
        "decision_details": decision["details"],
    }
    summary_path = os.path.join(model_dir, "summary.json")
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    return csv_path, summary_path


# ─── Display ──────────────────────────────────────────────────────────
def print_report(metrics: dict, decision: dict):
    print()
    print("=" * 70)
    print("  Phase 16.0B.0 — PROTOTYPE VALIDATION RESULTS")
    print("=" * 70)
    print(f"  Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print()

    for key, kdef in KPI_DEFINITIONS.items():
        value = metrics.get(key, 0.0)
        label = kdef["label"]
        tag = "CRITICAL" if kdef["critical"] else "         "
        higher = kdef.get("higher_is_better", True)
        threshold_min = kdef["minimum"]
        threshold_target = kdef["target"]

        if higher:
            passed = value >= threshold_min
            below_target = value >= threshold_min and value < threshold_target
        else:
            passed = value <= threshold_min
            below_target = value <= threshold_min and value > threshold_target

        if passed:
            if below_target:
                status = "⬇ BELOW TARGET (above minimum)"
            else:
                status = "✅ PASS"
        else:
            status = "❌ FAIL"

        print(f"  [{tag}] {label:35s}  {value:6.1f}%  (min: {threshold_min:4.0f}%  target: {threshold_target:4.0f}%)  {status}")

    print()
    print("-" * 70)
    dec = decision["decision"]
    if dec == "GO":
        dec_display = "✅  GO"
    elif dec == "GO WITH CONDITIONS":
        dec_display = "⚠️  GO WITH CONDITIONS"
    else:
        dec_display = "❌  NO GO"
    print(f"  RECOMMENDATION: {dec_display}")
    print(f"  Reason: {decision['reason']}")
    if decision["details"]:
        for d in decision["details"]:
            print(f"    - {d}")
    print("=" * 70)
    print()


# ─── Main Validation Runner ──────────────────────────────────────────
def run_validation(labels_path: str, images_dir: str, output_dir: str) -> int:
    logger.info("Loading labels from %s", labels_path)
    with open(labels_path) as f:
        labels_data = json.load(f)

    samples = labels_data.get("samples", [])
    if not samples:
        logger.error("No samples found in labels file")
        return 1

    logger.info("Loaded %d sample labels", len(samples))

    evaluator = GeminiEvaluator()
    results = []

    for i, sample in enumerate(samples):
        filename = sample["filename"]
        image_path = os.path.join(images_dir, filename)

        if not os.path.exists(image_path):
            logger.warning("[%d/%d] Image not found: %s — skipping", i + 1, len(samples), image_path)
            continue

        logger.info("[%d/%d] Analyzing %s (%s)", i + 1, len(samples), filename, sample.get("city", "?"))

        # Run 1
        r1 = evaluator.analyze(image_path, attempt=1)
        # Run 2 (for consistency/stability)
        time.sleep(0.5)
        r2 = evaluator.analyze(image_path, attempt=2)

        result = {
            "filename": filename,
            "ground_truth": sample,
            "run1_success": r1["success"] and r1.get("data") is not None,
            "run1_data": r1.get("data"),
            "run1_raw": r1.get("raw", ""),
            "run1_error": r1.get("error", ""),
            "run2_success": r2["success"] and r2.get("data") is not None,
            "run2_data": r2.get("data"),
            "run2_raw": r2.get("raw", ""),
            "run2_error": r2.get("error", ""),
        }
        results.append(result)

        r1_status = "✅" if result["run1_success"] else "❌"
        r2_status = "✅" if result["run2_success"] else "❌"
        logger.info("  Run1: %s  Run2: %s", r1_status, r2_status)

        # Rate limit safety
        if i < len(samples) - 1:
            time.sleep(1.0)

    if not results:
        logger.error("No images were successfully processed")
        return 1

    logger.info("\nComputing KPIs...")
    calc = KPICalculator(results)
    metrics = calc.compute_all()

    logger.info("Evaluating decision...")
    decision = evaluate_decision(metrics)

    logger.info("Generating reports...")
    csv_path, summary_path = generate_report(metrics, decision, results, output_dir, model=evaluator.model)

    print_report(metrics, decision)
    logger.info("CSV report: %s", csv_path)
    logger.info("JSON summary: %s", summary_path)

    if decision["decision"] == "NO GO":
        return 1
    return 0


# ─── CLI ──────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Gemini Vision Satellite Roof Validation — Phase 16.0B.0"
    )
    parser.add_argument(
        "--labels",
        default="labels.json",
        help="Path to ground truth labels JSON file (default: labels.json)",
    )
    parser.add_argument(
        "--images",
        default="images",
        help="Directory containing satellite roof images (default: images/)",
    )
    parser.add_argument(
        "--output",
        default="results",
        help="Output directory for reports (default: results/)",
    )
    args = parser.parse_args()

    # Resolve paths relative to script location
    script_dir = Path(__file__).parent
    labels_path = Path(args.labels)
    if not labels_path.is_absolute():
        labels_path = script_dir / labels_path
    images_dir = Path(args.images)
    if not images_dir.is_absolute():
        images_dir = script_dir / images_dir
    output_dir = Path(args.output)
    if not output_dir.is_absolute():
        output_dir = script_dir / output_dir

    sys.exit(run_validation(str(labels_path), str(images_dir), str(output_dir)))


if __name__ == "__main__":
    main()
