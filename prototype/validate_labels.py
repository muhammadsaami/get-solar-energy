"""
Tool 1 — Label Validation Checker
Phase 16.0B.0A — Dataset Quality Gate

Validates human-created ground truth labels BEFORE running Gemini evaluation.
Prevents wasted API calls due to malformed, incomplete, or inconsistent labels.

Usage:
    python validate_labels.py --labels labels.json --images images/
    python validate_labels.py --labels labels.json                    # skip image checks
    python validate_labels.py --labels labels.json --strict           # all checks including cross-field
    python validate_labels.py --labels labels.json --checks orphan    # only orphan checks

Exit code: 0 = PASS, 1 = FAIL
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from collections import Counter

FRAMEWORK_VERSION = "1.1.0"

logger = None  # will be set up per-run


# ─── Schema Definition ────────────────────────────────────────────────
REQUIRED_FIELDS = [
    "filename", "city", "roof_type", "facing_direction",
    "shading", "obstacles", "solar_potential", "zoom_level",
    "weather", "urban_rural", "residential_commercial",
    "source", "labeler", "label_date",
]

OPTIONAL_FIELDS = ["notes"]

ENUMS = {
    "roof_type": {"flat", "sloped", "mixed"},
    "facing_direction": {"n", "ne", "e", "se", "s", "sw", "w", "nw"},
    "shading": {"none", "partial", "heavy"},
    "solar_potential": {"high", "medium", "low"},
    "weather": {"clear", "partial_cloud", "overcast"},
    "urban_rural": {"urban", "rural"},
    "residential_commercial": {"residential", "commercial"},
}

ZOOM_RANGE = (10, 19)


def setup_logger(verbose: bool = False):
    global logger
    import logging
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=level, format="%(message)s")
    logger = logging.getLogger("label_val")
    return logger


# ─── Validation Issue ─────────────────────────────────────────────────
class Issue:
    ERROR = "ERROR"
    WARNING = "WARNING"
    INFO = "INFO"

    def __init__(self, severity: str, check: str, message: str, sample_idx: int = None, filename: str = None):
        self.severity = severity
        self.check = check
        self.message = message
        self.sample_idx = sample_idx
        self.filename = filename

    def __str__(self):
        prefix = f"[{self.severity}]"
        loc = ""
        if self.filename:
            loc = f" ({self.filename})"
        elif self.sample_idx is not None:
            loc = f" (sample #{self.sample_idx})"
        return f"{prefix:10s} {self.check:40s} {self.message}{loc}"


# ─── Validator ────────────────────────────────────────────────────────
class LabelValidator:
    def __init__(self, labels_path: str, images_dir: str = None, strict: bool = False):
        self.labels_path = Path(labels_path)
        self.images_dir = Path(images_dir) if images_dir else None
        self.strict = strict
        self.issues: list[Issue] = []

    def validate(self) -> bool:
        self._check_file_exists()
        if self._has_errors():
            return False

        self._check_json_schema()
        if self._has_errors():
            return False

        self._check_samples_not_empty()
        if self._has_errors():
            return False

        self._check_required_fields()
        self._check_enum_values()
        self._check_zoom_range()
        self._check_date_format()
        self._check_duplicate_filenames()
        self._check_obstacles_field()
        self._check_solar_potential_consistency()

        if self.images_dir:
            self._check_missing_image_files()
            if self.strict:
                self._check_orphan_images()

        return not self._has_errors(severity=Issue.ERROR)

    # ── individual checks ─────────────────────────────────
    def _file_path(self, name: str) -> Path:
        return self.labels_path.parent / name if not Path(name).is_absolute() else Path(name)

    def _report(self, severity: str, check: str, msg: str, idx: int = None, fn: str = None):
        self.issues.append(Issue(severity, check, msg, idx, fn))
        if severity == Issue.ERROR:
            logger.error(str(self.issues[-1]))
        elif severity == Issue.WARNING:
            logger.warning(str(self.issues[-1]))
        else:
            logger.info(str(self.issues[-1]))

    def _has_errors(self, severity: str = Issue.ERROR) -> bool:
        return any(i.severity == severity for i in self.issues)

    # ── 1. File exists ────────────────────────────────────
    def _check_file_exists(self):
        if not self.labels_path.exists():
            self._report(Issue.ERROR, "file_exists", f"Labels file not found: {self.labels_path}")

    # ── 2. JSON parseable + schema ────────────────────────
    def _check_json_schema(self):
        try:
            with open(self.labels_path) as f:
                self.data = json.load(f)
        except json.JSONDecodeError as e:
            self._report(Issue.ERROR, "json_parse", f"Invalid JSON: {e}")
            return

        if "_schema_version" not in self.data:
            self._report(Issue.WARNING, "schema_version", "Missing _schema_version field")
        if "_framework_version" in self.data:
            logger.info(f"   Labels use framework v{self.data['_framework_version']}")

    # ── 3. Samples non-empty ─────────────────────────────
    def _check_samples_not_empty(self):
        samples = self.data.get("samples", [])
        if not isinstance(samples, list):
            self._report(Issue.ERROR, "samples_type", "samples must be an array")
            return
        if len(samples) == 0:
            self._report(Issue.ERROR, "samples_empty", "No samples found in labels file")

    # ── 4. Required fields ───────────────────────────────
    def _check_required_fields(self):
        samples = self.data.get("samples", [])
        for i, sample in enumerate(samples):
            if not isinstance(sample, dict):
                self._report(Issue.ERROR, "sample_type", f"Sample #{i} is not a dict, got {type(sample).__name__}")
                continue
            fn = sample.get("filename", f"#sample_{i}")
            for field in REQUIRED_FIELDS:
                if field not in sample:
                    self._report(Issue.ERROR, "missing_field", f"Missing required field: '{field}'", i, fn)
                elif sample[field] is None:
                    self._report(Issue.ERROR, "null_field", f"Field '{field}' is null", i, fn)
                elif isinstance(sample[field], str) and not sample[field].strip():
                    self._report(Issue.WARNING, "empty_field", f"Field '{field}' is empty string", i, fn)

    # ── 5. Enum validation ──────────────────────────────
    def _check_enum_values(self):
        samples = self.data.get("samples", [])
        for i, sample in enumerate(samples):
            if not isinstance(sample, dict):
                continue
            fn = sample.get("filename", f"#sample_{i}")
            for field, valid_values in ENUMS.items():
                val = sample.get(field)
                if val is not None and str(val).strip().lower() not in valid_values:
                    self._report(
                        Issue.ERROR, "enum_value",
                        f"'{field}' = '{val}' not in {sorted(valid_values)}",
                        i, fn,
                    )

    # ── 6. Zoom range ──────────────────────────────────
    def _check_zoom_range(self):
        samples = self.data.get("samples", [])
        for i, sample in enumerate(samples):
            if not isinstance(sample, dict):
                continue
            fn = sample.get("filename", f"#sample_{i}")
            zoom = sample.get("zoom_level")
            if zoom is not None:
                try:
                    z = int(zoom)
                    if z < ZOOM_RANGE[0] or z > ZOOM_RANGE[1]:
                        self._report(Issue.WARNING, "zoom_range", f"zoom_level {z} outside recommended range {ZOOM_RANGE}", i, fn)
                except (ValueError, TypeError):
                    self._report(Issue.ERROR, "zoom_type", f"zoom_level '{zoom}' is not an integer", i, fn)

    # ── 7. Date format ─────────────────────────────────
    def _check_date_format(self):
        samples = self.data.get("samples", [])
        for i, sample in enumerate(samples):
            if not isinstance(sample, dict):
                continue
            fn = sample.get("filename", f"#sample_{i}")
            ld = sample.get("label_date")
            if ld:
                try:
                    datetime.fromisoformat(ld)
                except (ValueError, TypeError):
                    self._report(Issue.WARNING, "date_format", f"label_date '{ld}' is not ISO format (YYYY-MM-DD)", i, fn)

    # ── 8. Duplicate filenames ─────────────────────────
    def _check_duplicate_filenames(self):
        samples = self.data.get("samples", [])
        filenames = [s.get("filename") for s in samples if isinstance(s, dict)]
        dupes = [(fn, count) for fn, count in Counter(filenames).items() if count > 1]
        for fn, count in dupes:
            self._report(Issue.ERROR, "duplicate", f"Filename '{fn}' appears {count} times")

    # ── 9. Image files exist ───────────────────────────
    def _check_missing_image_files(self):
        samples = self.data.get("samples", [])
        if not self.images_dir.exists():
            self._report(Issue.ERROR, "images_dir", f"Images directory not found: {self.images_dir}")
            return
        for i, sample in enumerate(samples):
            if not isinstance(sample, dict):
                continue
            fn = sample.get("filename")
            if not fn:
                continue
            img_path = self.images_dir / fn
            if not img_path.exists():
                self._report(Issue.ERROR, "missing_image", f"Image file not found", i, fn)

    # ── 10. Orphan images ─────────────────────────────
    def _check_orphan_images(self):
        if not self.images_dir or not self.images_dir.exists():
            return
        samples = self.data.get("samples", [])
        labeled = {s.get("filename") for s in samples if isinstance(s, dict) and s.get("filename")}
        orphans = []
        for f in self.images_dir.iterdir():
            if f.is_file() and f.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
                if f.name not in labeled:
                    orphans.append(f.name)
        if orphans:
            for o in sorted(orphans)[:20]:
                self._report(Issue.WARNING, "orphan_image", f"Image has no label entry", fn=o)
            if len(orphans) > 20:
                self._report(Issue.INFO, "orphan_image", f"... and {len(orphans) - 20} more orphans")
            self._report(Issue.INFO, "orphan_image", f"Total orphan images: {len(orphans)}")

    # ── 11. Obstacles field ──────────────────────────────
    def _check_obstacles_field(self):
        samples = self.data.get("samples", [])
        for i, sample in enumerate(samples):
            if not isinstance(sample, dict):
                continue
            fn = sample.get("filename", f"#sample_{i}")
            obs = sample.get("obstacles")
            if obs is None:
                continue
            if isinstance(obs, str):
                self._report(Issue.WARNING, "obstacles_type", "obstacles should be an array, not a string", i, fn)
            elif not isinstance(obs, list):
                self._report(Issue.WARNING, "obstacles_type", f"obstacles should be a list, got {type(obs).__name__}", i, fn)

    # ── 12. Solar potential consistency (strict only) ──
    def _check_solar_potential_consistency(self):
        if not self.strict:
            return
        samples = self.data.get("samples", [])
        for i, sample in enumerate(samples):
            if not isinstance(sample, dict):
                continue
            fn = sample.get("filename", f"#sample_{i}")
            shading = str(sample.get("shading", "")).lower()
            solar = str(sample.get("solar_potential", "")).lower()
            direction = str(sample.get("facing_direction", "")).lower()
            # Heavy shading should not have High solar potential
            if shading == "heavy" and solar == "high":
                self._report(Issue.WARNING, "consistency",
                    f"Heavy shading but solar_potential=High — likely inconsistent", i, fn)
            # North-facing in northern hemisphere should not be High
            if direction == "n" and solar == "high" and shading == "none":
                self._report(Issue.INFO, "consistency",
                    "North-facing roof with High solar potential — verify orientation ground truth", i, fn)


# ─── Report Output ────────────────────────────────────────────────────
def print_summary(validator: LabelValidator):
    errors = [i for i in validator.issues if i.severity == Issue.ERROR]
    warnings = [i for i in validator.issues if i.severity == Issue.WARNING]
    infos = [i for i in validator.issues if i.severity == Issue.INFO]

    print()
    print("=" * 70)
    print("  LABEL VALIDATION REPORT")
    print("=" * 70)
    samples = validator.data.get("samples", [])
    total = len(samples)
    print(f"  File:        {validator.labels_path.name}")
    print(f"  Samples:     {total}")
    if hasattr(validator, 'images_dir') and validator.images_dir:
        existing = sum(1 for s in samples if validator.images_dir and (validator.images_dir / s.get("filename", "")).exists())
        print(f"  Images:      {existing}/{total} found")
    print(f"  Errors:      {len(errors)}")
    print(f"  Warnings:    {len(warnings)}")
    print("-" * 70)

    if errors:
        print("  ❌ FAILED — Errors must be resolved before evaluation")
        for e in errors:
            print(f"     {e}")
    elif warnings or infos:
        print("  ⚠️  PASS WITH WARNINGS — Review recommendations below")
        for w in warnings:
            print(f"     {w}")
        for n in infos:
            print(f"     {n}")
    else:
        print("  ✅ PASS — No issues found")
    print("=" * 70)
    print()


# ─── JSON Summary ─────────────────────────────────────────────────────
def write_json_summary(validator: LabelValidator, output_path: str):
    summary = {
        "framework_version": FRAMEWORK_VERSION,
        "validation_date": datetime.now().isoformat(),
        "labels_file": str(validator.labels_path),
        "total_samples": len(validator.data.get("samples", [])),
        "error_count": sum(1 for i in validator.issues if i.severity == Issue.ERROR),
        "warning_count": sum(1 for i in validator.issues if i.severity == Issue.WARNING),
        "passed": not validator._has_errors(),
        "issues": [
            {"severity": i.severity, "check": i.check, "message": i.message, "sample_idx": i.sample_idx, "filename": i.filename}
            for i in validator.issues
        ],
        "checks_performed": [
            "file_exists", "json_parse", "samples_not_empty",
            "required_fields", "enum_values", "zoom_range",
            "date_format", "duplicate_filenames", "obstacles_field",
        ],
    }
    if validator.images_dir:
        summary["checks_performed"].append("missing_images")
        if validator.strict:
            summary["checks_performed"].append("orphan_images")
            summary["checks_performed"].append("cross_field_consistency")

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(summary, f, indent=2)
    return output_path


# ─── CLI ───────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Tool 1 — Label Validation Checker (Phase 16.0B.0A)"
    )
    parser.add_argument("--labels", default="labels.json", help="Path to ground truth labels JSON (default: labels.json)")
    parser.add_argument("--images", default=None, help="Images directory for file-existence checks (default: skip)")
    parser.add_argument("--strict", action="store_true", help="Enable cross-field consistency checks (slower, more thorough)")
    parser.add_argument("--output", default=None, help="Write JSON validation report to this path")
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging")
    args = parser.parse_args()

    setup_logger(args.verbose)

    script_dir = Path(__file__).parent
    labels_path = Path(args.labels)
    if not labels_path.is_absolute():
        labels_path = script_dir / labels_path
    images_dir = Path(args.images) if args.images else None
    if images_dir and not images_dir.is_absolute():
        images_dir = script_dir / images_dir

    validator = LabelValidator(str(labels_path), str(images_dir) if images_dir else None, strict=args.strict)
    passed = validator.validate()
    print_summary(validator)

    if args.output:
        out_path = write_json_summary(validator, args.output)
        print(f"  JSON report: {out_path}")

    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
