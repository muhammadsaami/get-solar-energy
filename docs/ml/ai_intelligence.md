# AI Intelligence Engine — Architecture

**Phase 13.0C — GET Solar Energy**

## Overview

The AI Intelligence Engine is a modular layer that sits on top of the existing ML infrastructure (Phase 13.0A/B) and CRM system (Phase 12.4A+++). It provides high-level AI services for customer analysis, recommendations, and explainability.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AI API Layer                          │
│                 (ai_routes.py)                           │
│  POST /api/ai/analyze                                   │
│  POST /api/ai/recommend                                 │
│  POST /api/ai/explain                                   │
│  POST /api/ai/customer-score                            │
│  POST /api/ai/solar-readiness                           │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  AI Service Facade                       │
│                (ai_service.py)                           │
│  Public API: analyze_customer, recommend, explain,      │
│              customer_score, solar_readiness             │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│               AI Orchestrator                            │
│             (orchestrator.py)                            │
│  Coordinates all subsystems:                            │
│    CRM → Customer 360 → Bill → Roof → ROI              │
│    → ML Inference → Recommendations → Explainability   │
│    → Unified Response                                   │
└───┬──────────┬──────────┬──────────┬────────────────────┘
    │          │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───────────────┐
│ Inference│ │ Recs │ │Explain│ │ CRM / Customer360 │
│ Engine │ │Engine│ │Engine │ │    Services       │
└───┬───┘ └───────┘ └───────┘ └───────────────────┘
    │
┌───▼───────────────────────────────┐
│      ML Infrastructure            │
│  Registry → Loader → Validation  │
│  → Preprocessing → Inference     │
│  → Postprocessing → Audit        │
│  → Monitoring                    │
└───────────────────────────────────┘
```

## Data Flow

1. **Request** → `ai_routes.py` validates input
2. **Service** → `ai_service.py` delegates to orchestrator
3. **Orchestrator** → coordinates all subsystems:
   - Runs ML inference via existing `InferenceEngine`
   - Fetches CRM data via existing services
   - Generates recommendations via `RecommendationEngine`
   - Produces explanations via `ExplainabilityEngine`
4. **Response** → Unified JSON with predictions, recommendations, explanations, scores, risks

## Module Responsibilities

| Module | Role | Depends On |
|--------|------|------------|
| `ai_routes.py` | HTTP endpoints, request validation | `ai_service`, `utils.responses` |
| `ai_service.py` | Public facade, API surface | `orchestrator`, `recommendation_engine`, `explainability` |
| `orchestrator.py` | Pipeline coordination | `inference`, `recommendation_engine`, `explainability` |
| `recommendation_engine.py` | Business rules | None (pure logic) |
| `explainability.py` | Human-readable explanations | None (pure logic) |

## Key Design Decisions

- **No HTTP logic in services** — routes handle HTTP, services handle business logic
- **Singleton pattern** — all engines use singleton for cache reuse
- **Model-agnostic explainability** — works with any prediction, future SHAP/LIME ready
- **Graceful degradation** — failures in one stage don't abort the pipeline
- **No duplicated inference** — all ML calls go through existing `InferenceEngine`
- **No duplicated preprocessing** — uses existing `ml.preprocessing`
