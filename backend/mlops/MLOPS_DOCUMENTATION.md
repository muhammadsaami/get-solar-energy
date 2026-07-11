# GET Solar Energy - MLOps Platform Documentation

**Version:** 13.0E | **Last Updated:** July 2026

---

## Overview

Enterprise-grade model lifecycle management for the GET Solar Energy prediction system. Manages models from registration through deployment, monitoring, and retirement.

### Key Capabilities

- Model Lifecycle Management with state machine: REGISTERED -> VALIDATED -> DEPLOYED -> ACTIVE -> DEPRECATED -> ARCHIVED
- Semver Version Control with history tracking and rollback
- 6-stage Deployment Pipeline (Standard, Blue/Green, Canary strategies)
- Health Monitoring (CPU, memory, registry latency, cache hit rate)
- Metrics Collection (model usage, latency p50/p95/p99, tool/assistant usage)
- Drift Detection (baseline/sliding/current window analysis, configurable thresholds)
- Scheduled Jobs (health checks, drift analysis, metrics aggregation)
- REST API (11 endpoints, Administrator auth, Swagger)
- Frontend Dashboard (KPIs, models table, health panel, events, metrics)

### Design Principles

1. Never duplicate existing ML infrastructure
2. Repository is the sole persistence boundary
3. Optional dependencies (psutil, APScheduler) guarded
4. Idempotent operations

---

## Architecture

```
Frontend Dashboard (index.html + app.js)
        |
API Routes /api/mlops/* (routes.py, require_mlops_admin)
        |
Manager Layer
  ModelManager | DeploymentManager | RollbackManager
  VersioningService | HealthMonitor | MetricsCollector
  DriftDetector | MlopsRegistryService
        |
Repository Layer (single persistence boundary)
        |
Storage Layer (StorageBackend -> LocalJSONStorage)
        |
Existing ML Infrastructure (Registry, Loader, Validation, Metadata, Monitoring, Audit)
```

---

## Module Reference

| Module | Key Classes/Functions |
|--------|----------------------|
| storage.py | StorageBackend (ABC), LocalJSONStorage, get_storage() |
| repository.py | Repository, get_repository() - metadata, events, deployments, rollbacks, validations, health, drift, metrics, config |
| model_manager.py | ModelState (enum), LifecycleMachine, ModelManager, get_model_manager() |
| model_versioning.py | parse_semver(), compare_versions(), bump_version(), VersionRecord, VersioningService |
| deployment_manager.py | DeployStrategy (enum), DeploymentManager, get_deployment_manager() - 6-stage pipeline |
| rollback_manager.py | RollbackManager, get_rollback_manager() - rollback_to_previous(), validate_rollback() |
| health_monitor.py | HealthMonitor, get_health_monitor() - snapshot(), per_model_health() |
| metrics_collector.py | MetricsCollector, get_metrics_collector() - collect() |
| drift_detection.py | DriftDetector, get_drift_detector() - analyze() |
| scheduler.py | SchedulerInterface (ABC), APSchedulerScheduler, ManualScheduler, get_scheduler() |
| model_registry_service.py | MlopsRegistryService, get_registry_service() - search, version_lookup, active_model_lookup, metadata_lookup, health_lookup |
| routes.py | APIRouter (/api/mlops), require_mlops_admin dependency |

---

## API Endpoints

**Base URL:** `/api/mlops` | **Auth:** Bearer token (Administrator) | **Swagger:** `/docs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/mlops/status | Platform status |
| GET | /api/mlops/models | List all registered models |
| GET | /api/mlops/models/{name} | Get model details |
| GET | /api/mlops/versions | Version history |
| POST | /api/mlops/deploy | Deploy model (strategy: standard/blue_green/canary) |
| POST | /api/mlops/rollback | Rollback to previous version |
| GET | /api/mlops/health | Health snapshot |
| GET | /api/mlops/metrics | Aggregated metrics |
| GET | /api/mlops/drift | Drift analysis |
| POST | /api/mlops/validate | Validate model (checksum, structure, metadata) |
| GET | /api/mlops/events | Event history |

### Deploy Request

```json
POST /api/mlops/deploy
{
  "model_name": "bill_model",
  "version": "1.0.0",       // optional, defaults to latest
  "strategy": "standard",    // standard | blue_green | canary
  "force": false
}
```

### Rollback Request

```json
POST /api/mlops/rollback
{
  "model_name": "bill_model",
  "force": false
}
```

---

## Frontend Dashboard

**Tab:** MLOps (admin-only, `data-tab="mlops-dashboard"`)

| Component | Element ID | Data Source |
|-----------|-----------|-------------|
| Platform Status | mlopsKpiStatus | GET /api/mlops/status |
| Models Registered | mlopsKpiModels | GET /api/mlops/models |
| Active Deployments | mlopsKpiDeployed | GET /api/mlops/status |
| Avg Latency | mlopsKpiLatency | GET /api/mlops/metrics |
| Health Score | mlopsKpiHealth | GET /api/mlops/health |
| Models Table | mlopsModelsTable | GET /api/mlops/models |
| Health Panel | mlopsHealthPanel | GET /api/mlops/health |
| Events Panel | mlopsEventsPanel | GET /api/mlops/events |
| Metrics Panel | mlopsMetricsPanel | GET /api/mlops/metrics |

**JavaScript Functions:**
- `_mlopsLoadDashboard()` - Load all dashboard data
- `_mlopsLoadModels()` - Refresh models table
- `_mlopsLoadEvents()` - Refresh events panel
- `mlopsDeployModel(name)` - Deploy model
- `mlopsRollbackModel(name)` - Rollback model

---

## Data Persistence

Storage path: `ml-models/mlops/`

| Collection | Purpose | Key |
|------------|---------|-----|
| metadata | Model metadata | model name |
| events | Lifecycle events | auto-increment |
| deployments | Deployment records | auto-increment |
| rollbacks | Rollback records | auto-increment |
| validations | Validation records | auto-increment |
| health | Health snapshots | auto-increment |
| drift | Drift alerts | auto-increment |
| metrics | Metrics snapshots | auto-increment |
| config | Configuration | config key |

---

## Configuration

### Dependencies

- **Required:** fastapi, pydantic, uvicorn
- **Optional:** psutil (health monitoring), apscheduler (scheduled jobs)
- App boots without optional dependencies

### Environment

- No special environment variables required for MLOps
- Uses existing database.py and security.py infrastructure
- Admin authentication via JWT (admin@getsolar.in)

---

## Operations

### Health Check

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/mlops/health
```

### Deploy Model

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"model_name":"bill_model","strategy":"standard"}' \
  http://localhost:8000/api/mlops/deploy
```

### Rollback Model

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"model_name":"bill_model"}' \
  http://localhost:8000/api/mlops/rollback
```

### View Drift Analysis

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/mlops/drift
```
