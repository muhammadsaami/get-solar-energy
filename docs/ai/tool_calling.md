# Tool Calling

## Tool Registry

All tools are registered in `backend/ai/tool_registry.py` via the `ToolRegistry` singleton.

### Tool Spec

Each tool has:
- `name` — unique identifier (e.g. `c360_get`)
- `description` — human-readable purpose
- `category` — grouping (CRM, Customer360, AI, Analysis, Operations, Reports)
- `permissions` — allowed roles (`Administrator`, `Premium User`, `Free User`)
- `input_schema` — Pydantic-style field definitions with types + required flags
- `requires_confirmation` — if `true`, the planner flags it for user approval
- `supports_streaming` — reserved for future SSE support
- `execute_fn` — callable (defaults to `ToolExecutor._dispatch`)

### Registered Tools

| Tool | Category | Permissions | Confirmation |
|---|---|---|---|
| `c360_get` | Customer360 | All | No |
| `bill_analyze` | Analysis | All | No |
| `roof_analyze` | Analysis | All | No |
| `roi_calculate` | Analysis | All | No |
| `ai_analyze` | AI | All | No |
| `ai_recommend` | AI | All | No |
| `ai_explain` | AI | All | No |
| `ai_customer_score` | AI | All | No |
| `ai_solar_readiness` | AI | All | No |
| `crm_create_task` | CRM | All | Yes |
| `crm_update_customer` | CRM | Admin/Premium | Yes |
| `crm_get_customer` | CRM | All | No |
| `crm_installation` | Operations | All | No |
| `crm_amc` | Operations | All | No |
| `crm_payments` | Operations | All | No |
| `reports_generate` | Reports | Admin/Premium | Yes |

### How to Add a New Tool

1. **Define the tool** in `ToolRegistry._register_defaults()`:
```python
self.register(Tool(
    name="my_new_tool",
    description="What it does",
    category="Custom",
    permissions=["Administrator", "Premium User"],
    input_schema={"param1": {"type": "string", "required": True}},
))
```

2. **Implement the dispatch** in `ToolExecutor._dispatch()`:
```python
if tool_name == "my_new_tool":
    return self._call_my_tool(params, db)
```

3. **Add the service call** method:
```python
def _call_my_tool(self, params: Dict, db) -> Dict:
    from my_module import my_service_function
    return my_service_function(params["param1"])
```

4. **Wire the plan** in `AssistantPlanner._make_step()` if it should be part of a default intent chain.

### Execution Flow

```
ToolExecutor.execute(tool_name, params, user_role, db)
  → ToolRegistry.get(tool_name)
  → Guardrails.sanitize_input(params)
  → Guardrails.validate_input(params, schema)
  → Guardrails.check_permissions(permissions, role)
  → ToolExecutor._dispatch(tool_name, params, db)
      → Existing service function
  → Audit + Monitor
  → Standardized result dict
```
