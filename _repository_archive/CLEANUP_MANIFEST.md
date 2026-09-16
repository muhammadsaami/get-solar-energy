# GET Solar Energy — Cleanup & Archive Manifest
**Date:** 2026-09-17
**Scope:** Pre-Reconciliation Cleanliness & Organization
**Objective:** Maintain a professional repository layout while strictly preserving all active project work and historical data.

---

## 1. Moved Files & Directories

### Screenshots (Moved to `_repository_archive/screenshots/`)
- `bill_1_mvvnl.png` -> `_repository_archive/screenshots/bill_1_mvvnl.png` (Verification test screenshot)
- `bill_2_tpddl.png` -> `_repository_archive/screenshots/bill_2_tpddl.png` (Verification test screenshot)
- `bill_3_msedcl.png` -> `_repository_archive/screenshots/bill_3_msedcl.png` (Verification test screenshot)
- `customer_dashboard_verified.png` -> `_repository_archive/screenshots/customer_dashboard_verified.png` (Verification test screenshot)
- `frontend_customer_login_verified.png` -> `_repository_archive/screenshots/frontend_customer_login_verified.png` (Verification test screenshot)
- `real_sample_bill.png` -> `_repository_archive/screenshots/real_sample_bill.png` (Verification test screenshot)
- `session_security_settings.png` -> `_repository_archive/screenshots/session_security_settings.png` (Verification test screenshot)
- `test_roof_sample.png` -> `_repository_archive/screenshots/test_roof_sample.png` (Verification test screenshot)

### Generated Proposal PDFs (Moved to `_repository_archive/generated-pdfs/`)
- `frontend/consumer-app/GET-Solar-Energy-Proposal-*.pdf` (62 files) -> `_repository_archive/generated-pdfs/` (Generated during automated end-to-end and unit testing of proposal PDF generation)

### Audit JSON Reports & Directories (Moved to `_repository_archive/audits/`)
- `admin_cross_portal_results.json` -> `_repository_archive/audits/admin_cross_portal_results.json` (Automated portal audit output)
- `api_matching_audit.json` -> `_repository_archive/audits/api_matching_audit.json` (Route matching report)
- `backend_all_resolved_routes.json` -> `_repository_archive/audits/backend_all_resolved_routes.json` (Backend route discovery log)
- `backend_api_inventory.json` -> `_repository_archive/audits/backend_api_inventory.json` (Backend endpoint inventory)
- `backend_verification_results.json` -> `_repository_archive/audits/backend_verification_results.json` (Backend health check log)
- `banner_cleanup_verification_results.json` -> `_repository_archive/audits/banner_cleanup_verification_results.json` (UI banner cleanup verification report)
- `frontend_api_inventory.json` -> `_repository_archive/audits/frontend_api_inventory.json` (Frontend API calls inventory)
- `frontend_backend_connectivity_report.json` -> `_repository_archive/audits/frontend_backend_connectivity_report.json` (Full-stack connectivity audit report)
- `live_session_verification_results.json` -> `_repository_archive/audits/live_session_verification_results.json` (Session auth verification output)
- `mock_data_audit.json` -> `_repository_archive/audits/mock_data_audit.json` (Mock dataset validation log)
- `phase27c_results.json` -> `_repository_archive/audits/phase27c_results.json` (Phase 27 verification output)
- `phase28_1_verification_results.json` -> `_repository_archive/audits/phase28_1_verification_results.json` (Phase 28.1 verification output)
- `phase28_2_verification_results.json` -> `_repository_archive/audits/phase28_2_verification_results.json` (Phase 28.2 verification output)
- `phase28_4_verification_results.json` -> `_repository_archive/audits/phase28_4_verification_results.json` (Phase 28.4 verification output)
- `unreferenced_files_audit.json` -> `_repository_archive/audits/unreferenced_files_audit.json` (Asset reference audit log)
- `independent_landing_page_audit/` -> `_repository_archive/audits/independent_landing_page_audit/` (Landing page audit artifacts)
- `independent_phase29_audit/` -> `_repository_archive/audits/independent_phase29_audit/` (Phase 29 audit artifacts)

### Runtime Database Files (Moved to `_repository_archive/runtime-data/`)
- `solar.db` -> `_repository_archive/runtime-data/solar.db` (Local SQLite database created during root command execution)
- `customer_platform.db` (0-byte file in root) -> `_repository_archive/runtime-data/customer_platform.db` (Zero-byte orphan SQLite database file in repository root)

---

## 2. Deleted Files
- **None.** Following the non-negotiable rule "If there is any uncertainty, MOVE rather than DELETE", zero files were permanently deleted. All generated artifacts, logs, and screenshots were preserved in `_repository_archive/`.

---

## 3. Left Untouched (Deliberately Preserved Project Work)

### Active Uncommitted Backend Work
- `backend/ai/providers/` (`luna_provider.py`, `gemini_provider.py`, `mock_provider.py`, `__init__.py`) — Dual-provider AI architecture.
- `backend/ai/provider_base.py`, `backend/ai/provider_factory.py`, `backend/ai/provider_selector.py` — Core provider abstraction interfaces.
- `backend/ai/evaluation/` (`evaluator.py`, `dataset.py`, `metrics.py`, `staging_pilot.py`, `checks.py`) — AI evaluation framework.
- `backend/bill_document_service.py` — PDF & image document parsing service for bills & solar production reports.
- `backend/quota_service.py` — Tiered daily quota enforcement for bill analysis.
- `backend/uploads.py` — File upload handling utility.
- `backend/test_ai_*.py` (7 test suites, 204 passing tests) — Full AI regression test suite.
- `backend/main.py`, `backend/database_sqlite.py`, `backend/direct_analyze.py`, `backend/proposal.py`, `backend/roof.py`, `backend/security.py`, `backend/site_survey.py`, `backend/requirements.txt` — Core backend modules with AI provider integration and quota endpoints.
- `backend/customer_platform.db` — Active SQLite database referenced directly by `backend/database_sqlite.py` (`sqlite:///./customer_platform.db`).

### Active Uncommitted Frontend Work (Legacy Portal)
- `frontend/app.js` — Dual-input manual bill form and quota UI logic for the legacy customer portal.
- `frontend/dashboard.html` — Dual-input and manual bill card markup for the legacy customer portal.

### MLOps Runtime Telemetry & Metadata
- `ml-models/audit/predictions.jsonl` — Appended telemetry actively read by `backend/ml/audit.py`.
- `ml-models/mlops/drift.jsonl`, `health.jsonl`, `metrics.jsonl` — Real-time telemetry read and written by `backend/mlops/storage.py`.
- `ml-models/metadata/bill_model.metadata.json`, `savings_model.metadata.json` — Model metadata definitions.

### Project & Architecture Documentation
- `docs/ai/evaluation.md`, `docs/ai/provider_abstraction.md`, `docs/ai/staging_runbook.md` — AI architecture docs.
- `PHASE-17-REACT-MIGRATION-ARCHITECTURE.md`, `PHASE-23-LAUNCH-READINESS-REPORT.md`, `README.md` — High-level project specifications.

---

## 4. Ignored Patterns Added to `.gitignore`
Added to repository root `.gitignore`:
```gitignore
# ==========================================================
# Repository Archive (Generated & Historical Artifacts)
# ==========================================================
_repository_archive/
!_repository_archive/CLEANUP_MANIFEST.md

# Test Generated Artifacts
GET-Solar-Energy-Proposal-*.pdf
**/GET-Solar-Energy-Proposal-*.pdf
```
**Reason:**
1. `_repository_archive/`: Ensures all archived audit reports, test screenshots, and generated PDFs remain safely archived locally without cluttering Git tracking, while tracking this manifest file for team reference.
2. `GET-Solar-Energy-Proposal-*.pdf`: Prevents test-generated PDF artifacts produced during automated frontend test runs from cluttering `frontend/consumer-app/`.

---

## 5. Uncertain Items
- None. All candidate files were verified against codebase references before determining archive destinations.
