# Inference Engine — `backend/ml/inference.py`

Phase 13.0B (Batch 1)

## Responsibility

`InferenceEngine` is a thin orchestrator over the Phase 13.0A
infrastructure. It **never touches model files directly**; it always uses
`ModelLoader`. It does **not** alter prediction logic, feature engineering,
or model weights.

## Lifecycle (per prediction)

```
request
  │
  ├─ _ensure_ready()        → rediscover registry if empty
  ├─ _validate_payload()    → numeric + positive checks
  ├─ ModelLoader.load_encoder("city_encoder")
  ├─ _build_feature_row()   → {monthly_units, city_encoded, month_num, per_unit_rate}
  ├─ DataFrame[FEATURES_BILL / FEATURES_SAVINGS]
  ├─ ModelLoader.load(model) → model.predict(df)[0]
  ├─ postprocessing.build_response()  → standardized envelope
  ├─ audit.log()            → immutable audit event (hashes only)
  └─ monitoring.record()     → latency + success counters
```

## Canonical asset names

| Constant        | Value           | Purpose                     |
|----------------|-----------------|-----------------------------|
| `MODEL_BILL`   | `bill_model`    | Bill amount regressor       |
| `MODEL_SAVINGS`| `savings_model` | Solar savings regressor     |
| `ENCODER_CITY` | `city_encoder`  | City `LabelEncoder`         |

## Feature construction

`_build_feature_row` mirrors `ml.preprocessing.bill_features.transform_bill_input`:

* `city_encoded` — `encoder.transform([city])[0]`, falls back to `0` for
  unknown cities (identical to training behaviour).
* `month_num` — month index extracted from the billing period
  (`JAN→1 … DEC→12`); unknown → `0`.
* Feature columns are selected in the **exact canonical order**
  (`FEATURES_BILL` / `FEATURES_SAVINGS` from `config.py`) so the
  DataFrame handed to `model.predict` matches training.

Because the produced features are byte-for-byte equivalent to the
`train_models.py` sample, **predictions are drift-free** (verified in
Batch 7).

## Latency & errors

* Latency is measured with `time.perf_counter()` around the whole call.
* Any exception is caught, recorded as `success=False` with the error
  message in the response `error` field, and is still audited/monitored.
  The engine never raises to the caller — it returns a standardized
  response.

## Singleton

`get_inference_engine()` returns the shared singleton so the loader
cache, monitoring counters, and audit logger are reused across requests.
