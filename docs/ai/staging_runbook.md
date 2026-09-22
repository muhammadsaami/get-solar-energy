# GET Solar Energy — Gemini Staging Pilot Runbook
### Phase 9.0: Operational Preparation & Authorized Staging Protocol

---

## 1. Scope and Objective

This runbook defines the formal operational procedure for preparing, authorizing, executing, and monitoring a bounded staging pilot for **Google Gemini** (`gemini-2.5-flash-lite`).

### Core Invariants
- **Google Gemini** is the sole approved production AI provider.
- **OpenAI Luna** remains strictly **`OPT_IN_BLOCKED`** and **`UNVERIFIED`**. No automatic fallback, routing, or staging pilot to Luna is permitted.
- **Fail-Closed Default:** If any credential, environment identifier, or authorization check fails, the pilot halts immediately.

---

## 2. Preconditions for Authorized Pilot Execution

Live staging execution may only proceed when **all** of the following conditions are satisfied:

1. **Environment Designation:**
   - The runtime environment must be explicitly non-production (`ENVIRONMENT=staging`, `stage`, `test`, or `dev`).
   - Production environments (`production`, `prod`, `live`) are strictly hard-blocked.
2. **Secret Management:**
   - Staging API key (`GEMINI_API_KEY`) must be supplied via backend `.env` or secure CI/CD vault injection.
   - **NEVER** commit credentials to Git or paste keys into chat, source files, or terminal logs.
3. **Explicit Authorization:**
   - Explicit staging authorization must be active: `AI_EVAL_ALLOW_STAGING=1` or `allow_staging=True` passed to the runner.
4. **Bounded Dataset Limit:**
   - Maximum 20 synthetic scenarios (`MAX_STAGING_CASES=20`). Real customer records are strictly prohibited.
5. **Bounded Timeout Limit:**
   - Maximum 60 seconds per request (`MAX_STAGING_TIMEOUT_SEC=60`).
6. **Non-Destructive Guard:**
   - Database mutations must remain disabled (`db_mutations=False`).
   - Destructive tools must remain disabled (`tools_enabled=False`).

---

## 3. Step-by-Step Pilot Protocol

### Step 1: Configuration Hygiene Check
Verify that `.env` is ignored and that placeholders are used:
```powershell
git status --ignored
# Verify .env is listed in Ignored files
```

### Step 2: Preflight Inspection (Zero Network Calls)
Execute preflight to inspect sanitized metadata and verify all 16 safety gates pass:
```python
import sys
sys.path.insert(0, "backend")
from ai.evaluation import run_preflight

report = run_preflight(provider_name="gemini", allow_staging=True)
print(report)
```
- **Expected Verification:** `safety_gates_passed: True` (when credentials are present).
- If `credentials_present: False` or `safety_gates_passed: False`, halt immediately.

### Step 3: Preflight Dry-Run
Execute the staging harness in dry-run mode:
```python
from ai.evaluation import run_staging_pilot

result = run_staging_pilot(provider_name="gemini", allow_staging=True, dry_run=True)
print(result["status"])  # PREFLIGHT_PASSED_DRY_RUN
```
- Confirms safety gates without making external network calls.

### Step 4: Explicit Live Staging Execution
*Only when authorized by operational management with verified staging credentials:*
```python
from ai.evaluation import run_staging_pilot

result = run_staging_pilot(provider_name="gemini", allow_staging=True, dry_run=False)
print("Pilot summary:", result["summary"])
```

---

## 4. Immediate Abort Conditions

Halt the pilot immediately and fail closed if any of the following occur:

1. `StagingSafetyGateError` is raised.
2. Environment is detected as `production`, `prod`, or `live`.
3. An unredacted API key signature (`AIzaSy...`) appears in logs or error traces.
4. Latency exceeds 15,000ms on 3 consecutive cases.
5. DISCOM tariff hallucinations occur without uncertainty disclaimers, or any subsidy provision/calculation is offered.
6. Any request attempts to route toward Luna or an unverified endpoint.

---

## 5. Rollback Procedure

- **Default Invariant:** `get_ai_provider()` without arguments strictly resolves to `GeminiProvider`.
- **Zero-Downtime Rollback:** If any staging experiment is active, setting `AI_PROVIDER=gemini` or unsetting `AI_PROVIDER` immediately resets all assistant traffic to the verified Google Gemini production configuration.
- **Zero Core Changes:** Rollback requires zero code modifications and zero database schema changes.

---

## 6. Luna Extension Point Status

- **Status:** `OPT_IN_BLOCKED` and `UNVERIFIED`.
- **Reason:** Model identifier `luna-v1` does not exist in the official public OpenAI model catalog, and no verified internal enterprise gateway URL is commissioned.
- **Policy:** Retained as an inactive extension point only. Live network calls to Luna remain blocked by `StagingSafetyGates`.
