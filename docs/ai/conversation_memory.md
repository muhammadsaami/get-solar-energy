# Conversation Memory

## Interface

`ConversationMemoryStore` (ABC in `backend/ai/conversation_memory.py`) defines the persistence contract:

```python
class ConversationMemoryStore(ABC):
    def get(session_id: str) -> Optional[Dict]
    def save(session_id: str, state: Dict) -> None
    def clear(session_id: str) -> bool
    def add_turn(session_id: str, role: str, content: str) -> None
    def update_context(session_id: str, **updates) -> None
```

## Session State Structure

```python
{
    "conversation_context": {
        "customer": {...},           # Current customer record
        "customer360": {...},        # Full Customer360 view
        "bill": {...},               # Latest bill analysis
        "roof": {...},               # Latest roof analysis
        "roi": {...},                # Latest ROI calculation
        "predictions": {...},        # ML predictions
        "recommendations": [...],    # AI recommendations
        "last_tools": [...],         # Tools called in last turn
        "last_actions": [...],       # Action summaries
        "pending_actions": [...]     # Confirmation-gated actions
    },
    "conversation_history": [
        {"role": "user", "content": "..."},
        {"role": "assistant", "content": "..."}
    ],
    "created_at": 1234567890.0,
    "updated_at": 1234567890.0
}
```

## Implementation

### InMemoryConversationMemory

- Backed by a plain `dict`
- History capped at 50 turns (configurable)
- Suitable for single-process deployments

### Swapping to Redis/PostgreSQL

1. Implement `ConversationMemoryStore` ABC:
```python
class RedisConversationMemory(ConversationMemoryStore):
    def __init__(self, redis_client):
        self._redis = redis_client

    def get(self, session_id):
        data = self._redis.get(f"ai:session:{session_id}")
        return json.loads(data) if data else None

    def save(self, session_id, state):
        self._redis.setex(
            f"ai:session:{session_id}",
            3600,  # 1 hour TTL
            json.dumps(state)
        )
    # ... etc
```

2. Swap the factory:
```python
def get_memory_store() -> ConversationMemoryStore:
    if os.getenv("REDIS_URL"):
        import redis
        return RedisConversationMemory(redis.from_url(os.getenv("REDIS_URL")))
    return InMemoryConversationMemory()
```

No other code changes required — all consumers call `get_memory_store()`.

## Conversation Lifecycle

1. **New session**: `chat()` creates an empty session via `_empty_session()`
2. **Context merge**: Frontend-provided context (lastBillAnalysis, etc.) is merged
3. **User turn**: `add_turn("user", message)` appended
4. **Intent classify**: `IntentRouter.classify(message)` → intent + confidence
5. **Plan build**: `AssistantPlanner.build_plan(intent, context, role)` → ordered steps
6. **Plan execute**: `ToolExecutor.execute_plan(steps)` → results
7. **LLM generate**: Prompt assembled from context + tools + history → Gemini
8. **Response format**: Structured envelope via `response_formatter.format_response`
9. **Assistant turn**: `add_turn("assistant", response)` appended
10. **Context update**: `last_tools`, `last_actions` updated from tool results

## API

| Endpoint | Description |
|---|---|
| `GET /api/assistant/history?session_id=X` | Load history + context |
| `DELETE /api/assistant/history?session_id=X` | Clear session |

The `session_id` is returned in the chat response and stored in `localStorage` on the frontend.
