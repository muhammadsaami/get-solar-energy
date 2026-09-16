# GET Solar Energy — AI Provider Abstraction

## 1. Overview and Purpose

GET Solar Energy uses an Enterprise AI Assistant to deliver solar intelligence, customer insights, and operational guidance.

The platform employs a **provider-neutral abstraction layer** (`BaseAIProvider`) that decouples business orchestration, intent routing, and tool execution from any specific LLM SDK.

- **Phase 1** established the base contracts, `GeminiProvider` (active default), and `MockAIProvider`.
- **Phase 2.0** implements the production-oriented **`LunaProvider`** adapter for OpenAI Luna models.

---

## 2. Architecture Diagram

```text
[ API Route: POST /api/assistant/chat ]
                  │
                  ▼
      [ AssistantService (Orchestrator) ]
                  │
        ┌─────────┴────────────────────────┐
        ▼                                  ▼
[ Session Memory ]                [ Tool Registry / Executor ]
                                  (16 Deterministic Tools)
                                           │
                                           ▼
                                [ BaseAIProvider (Interface) ]
                                           │
        ┌──────────────────────────────────┼──────────────────────────────────┐
        ▼                                  ▼                                  ▼
[ GeminiProvider ]                [ MockAIProvider ]                 [ LunaProvider ]
(Default Production Adapter)      (Offline Unit/Integration Tests)   (OpenAI Luna Adapter)
```

---

## 3. Core Provider Contracts

Defined in [backend/ai/provider_base.py](file:///e:/GET%20SOLAR%20ENERGY/get-solar-energy/backend/ai/provider_base.py):

### `AIRequest`
Normalized request structure passed from the orchestrator to the provider:
- `prompt: str`: Main formatted prompt or instruction payload.
- `system_instruction: Optional[str]`: Optional system-level instructions.
- `history: List[Dict[str, str]]`: Conversation history turns (`role`, `content`).
- `temperature: float`: Generation temperature (default: `0.2`).
- `max_tokens: Optional[int]`: Token limit.
- `metadata: Dict[str, Any]`: Additional telemetry or routing context.

### `AIResponse`
Normalized response returned to the orchestrator:
- `content: str`: Generated text response.
- `model: str`: Active model identifier.
- `usage: Optional[AIUsage]`: Token counts (`prompt_tokens`, `completion_tokens`, `total_tokens`).
- `finish_reason: Optional[str]`: Stop reason (`STOP`, `LENGTH`, etc.).
- `latency_ms: float`: Request execution duration in milliseconds.
- `metadata: Dict[str, Any]`: Provider-specific metadata.

### `AIProviderError` Hierarchy
Standardized exceptions preventing provider SDK leakages:
- `AIProviderError` (Base)
  - `AIProviderAuthError` (401/403, invalid API keys, permission denied)
  - `AIProviderRateLimitError` (429, quota exhaustion)
  - `AIProviderTimeoutError` (Deadline exceeded)
  - `AIProviderUnavailableError` (500/502/503/504, service overload)
  - `AIProviderResponseError` (Blocked or empty response)

---

## 4. Provider Adapters

### 4.1 GeminiProvider (`backend/ai/providers/gemini_provider.py`)
- **Active Default Provider:** Selected when `AI_PROVIDER=gemini` (or unset).
- **Model:** Configurable via `ASSISTANT_MODEL` (default: `gemini-2.5-flash-lite`).
- **Resilience:** Implements 3-attempt exponential backoff on 503, 429, and service exhaustion.
- **Safety:** Automatically redacts API keys from exception messages and logs.
- **SDK Isolation:** Maps Google GenAI responses into `AIResponse` without leaking SDK structures.

### 4.2 LunaProvider (`backend/ai/providers/luna_provider.py`)
- **OpenAI Luna Provider Adapter:** Selected when `AI_PROVIDER=luna`, `AI_PROVIDER=openai`, or `AI_PROVIDER=openai_luna`.
- **Model:** Configurable via `LUNA_MODEL` or `OPENAI_MODEL` (default: `luna-v1`).
- **API Key:** Read from `LUNA_API_KEY` or `OPENAI_API_KEY`.
- **Base URL:** Configurable via `LUNA_API_BASE` or `OPENAI_API_BASE` for custom endpoints / proxies.
- **Timeout:** Configurable via `LUNA_TIMEOUT_SECONDS` (default: `30.0`s).
- **Lazy Initialization:** SDK client is instantiated on first generation call, avoiding network requests during import.
- **Error Mapping:** Normalizes OpenAI `AuthenticationError`, `RateLimitError`, `APITimeoutError`, and `InternalServerError` into standard `AIProviderError` hierarchy with key redaction.

### 4.3 MockAIProvider (`backend/ai/providers/mock_provider.py`)
- **Testing & Offline Development:** Selected when `AI_PROVIDER=mock`.
- **Zero Network Calls:** Runs without external API keys or internet connection.
- **Deterministic:** Returns reproducible responses or user-configured response queues.
- **Error Simulation:** Supports testing application resilience against simulated provider outages.

---

## 5. Provider Factory and Configuration

Selected dynamically via [backend/ai/provider_factory.py](file:///e:/GET%20SOLAR%20ENERGY/get-solar-energy/backend/ai/provider_factory.py):

```python
from ai.provider_factory import get_ai_provider

# Automatically selects provider based on AI_PROVIDER environment variable
provider = get_ai_provider()
response = provider.generate_response(request)
```

### Environment Variables
Configured in `backend/.env` (documented in `backend/.env.example`):
- `AI_PROVIDER`: `gemini` (default), `mock`, `luna`, `openai`, `openai_luna`.
- `ASSISTANT_MODEL`: `gemini-2.5-flash-lite` (default Gemini model).
- `GEMINI_API_KEY`: Google GenAI API key.
- `LUNA_API_KEY`: OpenAI Luna API key.
- `LUNA_MODEL`: OpenAI Luna model identifier (`luna-v1`).
- `LUNA_API_BASE`: Optional custom endpoint URL.
- `LUNA_TIMEOUT_SECONDS`: Generation timeout in seconds (`30.0`).

---

## 6. Direct Gemini Integrations Remaining Outside Scope

The following auxiliary endpoints intentionally remain separate and were not migrated in Phase 2 to isolate risk:
1. **`backend/roof.py` (`analyze_roof_image`)**: Uses Gemini Multimodal Vision API for satellite image roof analysis.
2. **`backend/proposal.py` (`generate_proposal_summary`)**: Standalone proposal executive summary generator.
3. **`backend/site_survey.py` (`generate_survey_notes`)**: Site survey report generator.
4. **`backend/amc.py` (`generate_amc_advice`)**: AMC maintenance contract advisor.
5. **`backend/ai_troubleshoot.py` (`diagnose_fault`)**: Inverter / system troubleshooting chat.
6. **`backend/chat.py` & `backend/generation.py`**: Legacy standalone prototypes (superseded by `/api/assistant/chat`).

---

## 7. Testing and Verification

A dedicated test suite is provided in [backend/test_ai_provider.py](file:///e:/GET%20SOLAR%20ENERGY/get-solar-energy/backend/test_ai_provider.py):

To execute tests:
```powershell
# Using pytest:
python -m pytest backend/test_ai_provider.py -v

# Using standard unittest:
python -m unittest backend/test_ai_provider.py
```

All 34 test cases cover:
1. Normalized data contracts and error hierarchy.
2. Deterministic mock provider and simulated error handling.
3. Mocked Gemini adapter normalization, retry backoff, and key redaction.
4. Mocked Luna adapter normalization, message translation, parameter handling, error mapping, and key redaction.
5. Provider factory selection (Gemini default, Mock, Luna aliases, environment overrides, unsupported rejection).
6. Enterprise AI Assistant regression tests with Mock and Luna providers.

---

## 8. Provider Governance & Architecture

1. **Google Gemini (`PRODUCTION_DEFAULT`):**
   - Active default production provider across all platform workloads.
   - Preserves existing prompts, retry behavior, audit logging, monitoring, guardrails, and response formatting.
   - Code-level and SDK contracts are verified (`google-genai`, model `gemini-2.5-flash-lite`).

2. **OpenAI GPT-5.6 Luna (`OFFICIAL_OPENAI_MODEL`):**
   - **Provider:** `openai`
   - **Model:** `gpt-5.6-luna` (official OpenAI model identifier)
   - **Base URL:** `https://api.openai.com/v1`
   - **Credential:** `OPENAI_API_KEY` (with legacy `LUNA_API_KEY` supported as fallback)
   - **Alias:** Legacy `luna` provider name is internally normalized to `openai`.
   - **Offline Readiness:** Eligible when credentials, valid base URL, and approved model are configured.
   - **Live Access Status:** An API key does not prove live model access. If not live-validated, reported safely as:
     `OPENAI LUNA STATUS: CONFIGURED — MODEL ACCESS NOT LIVE-VALIDATED`.

3. **Deterministic Mock (`OFFLINE_ONLY`):**
   - Strictly in-memory provider for unit, integration, and CI/CD evaluation test runs.

---

## 9. Safe Dual-AI-Provider Architecture & Selection Engine

### 9.1 Supported Environment Variables
- `AI_PROVIDER`: Provider selection mode (`auto` [default], `openai`, `gemini`, `luna` [alias], `mock`).
- `AI_PROVIDER_PRIORITY`: Priority ordering in auto mode (`openai,gemini` [default]).
- `AI_ALLOW_PROVIDER_FALLBACK`: Runtime failure fallback flag (`true` [default]).
- `OPENAI_API_KEY`: API credential for OpenAI (Primary Provider, Model: GPT-5.6 Luna).
- `OPENAI_BASE_URL`: Endpoint base URL (`https://api.openai.com/v1` [default]).
- `OPENAI_MODEL`: Official model identifier (`gpt-5.6-luna` [default]).
- `OPENAI_TIMEOUT_SECONDS`: Request timeout in seconds (`30.0` [default]).
- `GEMINI_API_KEY`: API credential for Google Gemini (Fallback Provider).
- `ASSISTANT_MODEL`: Model identifier for Gemini (`gemini-2.5-flash-lite` [default]).
- Legacy `LUNA_*` variables are supported as backward-compatible aliases.

### 9.2 Provider Selection Modes & Priority Behavior
1. **Explicit OpenAI (`AI_PROVIDER=openai` or `AI_PROVIDER=luna`):** Routes to OpenAI with model `gpt-5.6-luna`. Requires valid `OPENAI_API_KEY`, valid base URL, and approved model.
2. **Explicit Gemini (`AI_PROVIDER=gemini`):** Routes to Google Gemini. Requires valid `GEMINI_API_KEY`. If missing, raises `AIProviderConfigError`. Does not silently switch to OpenAI.
3. **Automatic (`AI_PROVIDER=auto`):** Evaluates providers in `AI_PROVIDER_PRIORITY` order (default `openai,gemini`). Selects the first independently eligible provider.
   - If both keys configured: OpenAI (GPT-5.6 Luna) is selected as primary, and Gemini is configured as eligible fallback.
   - If only Gemini key configured: Gemini is selected.
   - If only OpenAI key configured: OpenAI (GPT-5.6 Luna) is selected.
   - If no provider is eligible: returns a safe, actionable `AIProviderConfigError`.

### 9.3 Runtime Fallback Behavior
- Fallback is enabled by default (`AI_ALLOW_PROVIDER_FALLBACK=true`), and can be disabled with `AI_ALLOW_PROVIDER_FALLBACK=false`.
- When disabled, request failures raise immediately without attempting alternative providers.
- When enabled in auto mode, a primary OpenAI failure automatically attempts Gemini fallback if Gemini is independently eligible.
- Fallbacks are logged without credentials, and original error contexts are fully preserved.

### 9.4 Secret-Handling & Safe Provider Status Inspection
Query provider status without initiating network requests:
```python
from ai.provider_factory import get_provider_status

status = get_provider_status()
print(status["selected_provider"])  # "openai"
print(status["providers"]["openai"]["status"])  # "CONFIGURED" or "NOT_CONFIGURED"
print(status["providers"]["openai"]["block_reason"])  # "OPENAI LUNA STATUS: CONFIGURED — MODEL ACCESS NOT LIVE-VALIDATED"
```
All secrets, authorization headers, and sensitive payloads are completely scrubbed from outputs and logs.

### 9.5 Offline Test Execution
```powershell
python -m pytest backend/test_ai_provider.py backend/test_ai_evaluation.py backend/test_ai_staging_pilot.py backend/test_ai_dual_provider.py -v
```
All 117 tests execute strictly offline with zero live network calls.
