# Enterprise AI Assistant

## Architecture

The Enterprise AI Assistant (Phase 13.0D) is an orchestration layer on top of existing platform services. It never duplicates business logic — every tool delegates to an existing service function.

### Flow

```
User → Conversation Memory → Intent Router → Assistant Planner
→ Tool Registry → Tool Executor → Existing Services
→ LLM (Gemini) → Response Formatter → Conversation Memory Update → Frontend
```

### Package: `backend/ai/`

| Module | Responsibility |
|---|---|
| `conversation_memory.py` | Generic context store (in-memory, swappable) |
| `client.py` | LLM client (`genai.Client`) + `ASSISTANT_MODEL` constant |
| `intent_router.py` | 2-stage intent classification (keywords → Gemini fallback) |
| `assistant_planner.py` | Builds execution plans from intents (does NOT execute) |
| `tool_registry.py` | Centralized tool definitions with schemas + permissions |
| `tool_executor.py` | Validates, permissions-checks, executes via existing services |
| `guardrails.py` | Permission checks, input validation, unsafe action blocking |
| `prompt_builder.py` | Dynamic system prompt assembly |
| `response_formatter.py` | Structured response envelope |
| `assistant_service.py` | Central orchestration (connects all components) |
| `routes.py` | FastAPI router (`/api/assistant/*`) with auth |

### Key Design Decisions

1. **No direct DB access** — CRM tools receive a `db` session from FastAPI dependency injection.
2. **No route handler calls** — tools call service-layer functions directly.
3. **Reusable Gemini client** — `genai.Client` with `ASSISTANT_MODEL` constant for future model swaps.
4. **Swappable memory** — `ConversationMemoryStore` ABC can be backed by Redis/PostgreSQL later.
5. **Auth via `verify_token`** — all endpoints protected; `AssistantContext` threaded through layers.

### API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/assistant/chat` | Process a chat message |
| POST | `/api/assistant/tool` | Execute a single tool |
| GET | `/api/assistant/tools` | List available tools |
| GET | `/api/assistant/history` | Get conversation history |
| DELETE | `/api/assistant/history` | Clear conversation history |

### Response Shape

```json
{
  "success": true,
  "data": {
    "response": "LLM text response",
    "tool_results": [...],
    "recommendations": [...],
    "next_actions": [...],
    "context": {...},
    "confidence": 0.95,
    "conversation_id": "...",
    "request_id": "...",
    "timestamp": 1234567890.0,
    "elapsed_ms": 150.0,
    "warnings": [],
    "errors": []
  }
}
```

### Extension Points

- Add a new tool: register in `tool_registry.py` + implement in `tool_executor.py._dispatch`
- Add a new intent: add keyword group in `intent_router.py._KEYWORD_MAP`
- Add a new tool chain: update `_DEFAULT_CHAINS` in `assistant_planner.py`
- Swap memory backend: implement `ConversationMemoryStore` ABC
