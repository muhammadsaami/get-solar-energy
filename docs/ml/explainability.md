# Explainability Engine — Architecture

**Phase 13.0C — GET Solar Energy**

## Overview

The Explainability Engine generates human-readable explanations for ML predictions. It is **model-agnostic** — works with any prediction output without accessing model internals.

## Module

`backend/ml/explainability.py`

## Explanation Structure

Each `Explanation` contains:

| Field | Description |
|-------|-------------|
| `prediction_type` | Model name (bill_model, savings_model) |
| `prediction_value` | Raw numeric prediction |
| `prediction_formatted` | Human-readable format (e.g., "₹2,625.00") |
| `confidence` | Confidence score (None if unavailable) |
| `confidence_label` | High / Medium / Low / N/A |
| `contributing_factors` | List of `Factor` objects |
| `business_interpretation` | Plain-English business meaning |
| `recommended_action` | What to do next |
| `risk_indicators` | List of `RiskIndicator` objects |

## Factor

```python
Factor(
    name="Monthly Consumption",
    value="350 kWh",
    impact="positive",  # positive | negative | neutral
    weight=0.40,        # relative importance 0.0-1.0
    description="Monthly consumption of 350 kWh is the primary cost driver."
)
```

## RiskIndicator

```python
RiskIndicator(
    severity="high",     # high | medium | low
    category="consumption",
    message="Very high consumption indicates possible commercial use.",
    mitigation="Verify customer type; commercial tariffs may differ."
)
```

## Model-Specific Explanations

### Bill Model
- Factors: consumption, per-unit rate, billing period
- Risks: high consumption, unusual rates
- Interpretation: bill estimate with solar ROI context

### Savings Model
- Factors: consumption, rate, solar offset
- Risks: savings exceeding bill (verify assumptions)
- Interpretation: savings vs. current bill, ROI hint

## Future Integration

The `Factor` dataclass is designed for SHAP/LIME integration:

```python
# Future: SHAP-based factors
Factor(
    name=shap_feature_name,
    value=shap_feature_value,
    impact="positive" if shap_value > 0 else "negative",
    weight=abs(shap_value) / max_shap_value,
    description=generate_natural_language(shap_feature_name, shap_value),
)
```

## API Usage

```python
from ml.explainability import get_explainability_engine

engine = get_explainability_engine()
explanation = engine.explain_prediction(
    model_name="bill_model",
    prediction=2625.0,
    features_used={"monthly_units": 350, "per_unit_rate": 7.5, "month_num": 6},
    success=True,
)

print(explanation.business_interpretation)
for factor in explanation.contributing_factors:
    print(f"  {factor.name}: {factor.description}")
```
