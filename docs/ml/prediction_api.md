# Prediction API — `backend/ml/routes.py`

Phase 13.0B (Batch 4)

## Base path

All routes are mounted under `/api/ml` (router `prefix="/api/ml"`).

## Endpoints

### `GET /api/ml/models`
Lists registered models and encoders with version, algorithm,
framework, task, status, checksum, file size, and features.

### `GET /api/ml/status`
Health/operational status: `registry_loaded`, `total_models`,
`total_encoders`, `loader_cache_size`, `status:"operational"`.

### `GET /api/ml/metrics`
Live monitoring snapshot (see `monitoring.md`): total / successful /
failed predictions, success rate, average + p95 latency, uptime,
loader cache hits/misses, loaded model count.

### `POST /api/ml/predict/bill`
Body (`PredictionRequest`):
```json
{ "monthly_units": 300, "city": "Lucknow", "billing_period": "MAY", "per_unit_rate": 7.0 }
```
Returns standardized inference envelope (see below).

### `POST /api/ml/predict/savings`
Same request schema; runs the solar-savings regressor.

### `POST /api/ml/batch-predict`
Body:
```json
{ "items": [ { "type": "bill"|"savings", "monthly_units": 300, "city": "Lucknow", "billing_period": "MAY", "per_unit_rate": 7.0 }, ... ] }
```
Returns `{ "batch_size", "succeeded", "failed", "total_latency_ms", "results": [ ...envelopes ] }`.

## Request flow

```
1. Pydantic validates the payload (monthly_units>0, per_unit_rate>0).
   Invalid → 422 (rejected before the engine runs).
2. InferenceEngine.predict_*() is invoked with a generated request_id.
3. Engine returns a standardized dict.
4. Route wraps it in the standard envelope via utils.responses.ok()
   or utils.responses.server_error().
5. Structured log line emitted via utils.logger (request_id, inputs).
```

## Response format (standardized envelope)

```json
{
  "success": true,
  "model": "bill_model",
  "version": "1.0.0",
  "task": "regression",
  "prediction": 2040.63,
  "prediction_formatted": "₹2,040.63",
  "confidence": null,
  "units": "INR",
  "latency_ms": 12.1,
  "features_used": { "monthly_units": 300.0, "city_encoded": 0, "month_num": 5, "per_unit_rate": 7.0 },
  "explanation": "Estimated electricity bill is ₹2,040.63 based on 300.0 monthly units at ₹7.0/unit for billing period index 5.",
  "error": null
}
```

### Confidence policy
`confidence` is **always `null`**. The RandomForest regressors do
not emit a calibrated confidence for regression outputs, and the platform
**never fabricates** confidence values (see `postprocessing.md`).

## Error handling
* Invalid payload → `422` (schema validation).
* Engine failure (e.g. model missing) → `500` envelope with
  `message:"Prediction failed"`; the underlying error is captured in the
  audit trail, not leaked to the client.
* Every call is structured-logged with a `request_id` for tracing.
