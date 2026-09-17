# Phase 16.0B.0 — Prototype Validation

This directory contains a standalone validation framework for the Free Satellite Roof Locator feature.

**It answers one question:** *Can Gemini Vision accurately analyze Indian satellite roof imagery at a level acceptable for production?*

## Prerequisites

- Python 3.10+
- `pip install google-genai python-dotenv`
- A valid `GEMINI_API_KEY` in your environment or `.env` file
- 100+ satellite roof images from Indian cities (see Dataset Design below)

## Dataset Design

| Dimension | Target |
|---|---|
| Total images | 100 |
| Cities | 10 (Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad, Jaipur, Lucknow) |
| Residential:Commercial | 70:30 |
| Flat:Sloped | 60:40 |
| Urban:Rural | 70:30 |
| Zoom levels | Z16 (50%), Z17 (30%), Z18 (20%) |
| Weather | Clear (70%), Partial cloud (20%), Overcast (10%) |

## Usage

### 1. Prepare images

Place satellite roof images in the `images/` directory. Supported formats: PNG, JPG, JPEG, WEBP.

### 2. Prepare labels

Edit `labels.json` (copy from `sample_labels.json`). Each image needs ground truth labels:

```json
{
  "filename": "delhi_flat_01.png",
  "city": "Delhi",
  "roof_type": "Flat",
  "facing_direction": "S",
  "shading": "None",
  "obstacles": ["AC unit", "water tank"],
  "solar_potential": "High",
  "zoom_level": 16,
  "weather": "clear",
  "urban_rural": "urban",
  "residential_commercial": "residential",
  "source": "ESRI World Imagery",
  "labeler": "your_name",
  "label_date": "2026-06-01",
  "notes": "Any context"
}
```

### 3. Run validation

```bash
cd prototype
pip install google-genai python-dotenv
python validate_satellite.py --labels labels.json --images images/
```

### 4. Read the output

The script prints a summary table with all 10 KPIs and outputs:

- `results/{model}/report.csv` — per-image detailed results (model name in path supports multi-model comparison)
- `results/{model}/summary.json` — machine-readable summary with GO / GO WITH CONDITIONS / NO GO decision

## KPI Definitions

| KPI | Target | Minimum | Critical |
|---|---|---|---|---|
| Roof Type Accuracy | 80% | 70% | Yes |
| Facing Direction Accuracy (within 1 compass step) | 80% | 75% | Yes |
| Obstacle Detection Recall | 60% | 50% | Yes |
| Shading Accuracy | 70% | 60% | Yes |
| Analysis Success Rate (first attempt) | 95% | 90% | Yes |
| Hallucination Rate | ≤10% | ≤15% | Yes |
| False Positive Rate (Obstacles) | ≤20% | ≤30% | No |
| Response Consistency (image×2 agreement) | 80% | 70% | No |
| Prompt Stability (parseable on repeat) | 90% | 85% | No |
| Solar Potential Accuracy | 80% | 70% | No |

## Decision Rules

**GO**: Every Critical KPI meets or exceeds its Minimum Threshold. No blocking architectural or licensing issues remain.

**GO WITH CONDITIONS**: Every Critical KPI meets its Minimum Threshold. One or more Non-Critical KPIs are below Target but above Minimum. Mitigations are documented and accepted.

**NO GO**: Any Critical KPI falls below its Minimum Threshold. AI reliability is insufficient for production. Feature cancelled.

## What This Script Does NOT Do

- Does NOT modify any production code
- Does NOT import from `backend/` or `frontend/`
- Does NOT require a running server
- Does NOT connect to a database
- Does NOT modify `users.json`, `referrals.json`, or any production data
