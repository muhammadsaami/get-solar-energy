# Prediction Audit Logging — `backend/ml/audit.py`

Phase 13.0B (Batch 3)

## Purpose
Persist an immutable, privacy-safe audit trail of every prediction
request so predictions can be traced without exposing customer data.

## Storage
* File: `<ml-models>/audit/predictions.jsonl` (one JSON object per line).
* Appended via `AuditLogger.log(...)`, a singleton.
* Failures to write are swallowed — **audit logging never breaks inference**.

## Stored fields (per event)

| Field           | Source                                  |
|-----------------|-----------------------------------------|
| `timestamp`     | UTC ISO-8601 (`Z`)                     |
| `model`         | `bill_model` / `savings_model`         |
| `version`       | from model metadata                     |
| `endpoint`      | `/api/ml/predict/bill`, etc.          |
| `latency_ms`    | measured call latency                   |
| `success`       | boolean                                |
| `prediction_hash` | sha256 of `{model, prediction}`, truncated to 16 hex chars |
| `input_hash`    | sha256 of `{model, input features}`, truncated to 16 hex chars |
| `request_id`    | uuid4 hex (auto-generated if absent)   |

## Privacy guarantee
**No raw customer information is ever written.** Only deterministic
short hashes of the prediction value and the (non-PII) feature payload
are stored. The `input_hash` is computed over
`{"model", "input": features_used}` — strictly numeric/categorical model
features, never names, addresses, or identifiers.

## Reading the trail
```python
from ml import get_audit_logger
entries = get_audit_logger().read(limit=100)   # most-recent 100
```

## Example line
```json
{"timestamp":"2026-07-09T15:26:19.337853Z","model":"savings_model","version":"1.0.0","endpoint":"/api/ml/batch-predict","latency_ms":32.291,"success":true,"prediction_hash":"79254f639c75d7f9","input_hash":"4a21c871ff9e278b","request_id":"test-batch"}
```
