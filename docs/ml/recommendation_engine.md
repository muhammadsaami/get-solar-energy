# Recommendation Engine — Architecture

**Phase 13.0C — GET Solar Energy**

## Overview

The Recommendation Engine is a business-rule layer that consumes ML predictions and CRM data to produce actionable recommendations. It contains **no ML inference** — all logic is deterministic and rule-based.

## Module

`backend/ml/recommendation_engine.py`

## Recommendation Categories

| Category | Trigger | Priority |
|----------|---------|----------|
| `solar_sizing` | Monthly units > 0 | High |
| `battery` | Monthly units >= 500 | Medium |
| `roof_inspection` | No roof analysis or low suitability | High |
| `subsidy` | System size <= 3 kW | High |
| `financing` | Net cost > 200,000 INR | Medium |
| `lead_priority` | Project value >= 300,000 INR | High |
| `followup` | No activity recorded | High |
| `upsell` | Monthly units >= 600 | Medium |
| `amc` | Installation completed | Medium |

## Data Flow

```
Customer Data + Predictions + CRM Context
           │
           ▼
  RecommendationEngine.generate_recommendations()
           │
           ├─ _solar_size_recommendation()
           ├─ _battery_recommendation()
           ├─ _roof_inspection_recommendation()
           ├─ _subsidy_recommendation()
           ├─ _financing_recommendation()
           ├─ _high_value_customer()
           ├─ _followup_priority()
           ├─ _upsell_opportunity()
           └─ _amc_recommendation()
           │
           ▼
  Sorted List[Recommendation]
```

## API Usage

```python
from ml.recommendation_engine import get_recommendation_engine

engine = get_recommendation_engine()
recommendations = engine.generate_recommendations(
    customer_data={"monthly_units": 350, "city": "Lucknow", ...},
    predictions={"bill": {...}, "savings": {...}},
    crm_context=customer_360_data,
)

for rec in recommendations:
    print(f"[{rec.priority}] {rec.title}: {rec.description}")
```

## Extension Points

- Add new `_category_recommendation()` methods to `RecommendationEngine`
- Register them in `generate_recommendations()`
- Each method returns `List[Recommendation]`
- Priority ordering: high > medium > low, then by confidence descending
