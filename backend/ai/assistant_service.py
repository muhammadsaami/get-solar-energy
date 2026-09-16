"""
backend/ai/assistant_service.py
================================
GET Solar Energy — Enterprise AI Assistant Orchestration Service
Phase 13.0D

Central orchestration service. Receives chat requests, builds context,
delegates to intent router → planner → tool executor → LLM → response
formatter → memory update.

No HTTP logic — only business orchestration.
"""

import time
import uuid
import logging
from typing import Any, Dict, List, Optional

from .client import get_genai_client, ASSISTANT_MODEL
from .conversation_memory import get_memory_store, _empty_session, _new_session_id
from .intent_router import get_intent_router
from .assistant_planner import get_planner
from .tool_executor import get_tool_executor
from .tool_registry import get_tool_registry
from .prompt_builder import get_prompt_builder
from .response_formatter import format_response

logger = logging.getLogger(__name__)


class AssistantService:
    """Singleton orchestration service for the Enterprise AI Assistant."""

    _instance: Optional["AssistantService"] = None

    def __new__(cls) -> "AssistantService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._memory = get_memory_store()
        self._client = None
        self._intent_router = get_intent_router()
        self._planner = get_planner()
        self._executor = get_tool_executor()
        self._registry = get_tool_registry()
        self._prompt_builder = get_prompt_builder()
        self._initialized = True

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def chat(
        self,
        message: str,
        *,
        user_email: str,
        user_role: str,
        user_name: str = "",
        session_id: Optional[str] = None,
        frontend_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Process a chat message and return the structured assistant response.

        Parameters
        ----------
        message : str
            User's message text.
        user_email : str
            Authenticated user's email (from verify_token).
        user_role : str
            User's role string (Administrator / Premium User / Free User).
        user_name : str
            Display name.
        session_id : str | None
            Existing session to continue, or None for a new session.
        frontend_context : dict | None
            Optional context injected from the frontend (lastBillAnalysis,
            lastRoofAnalysis, etc.).
        """
        t0 = time.time()
        request_id = uuid.uuid4().hex
        conversation_id = session_id or _new_session_id()

        # 1. Load or create session
        state = self._memory.get(conversation_id)
        if state is None:
            state = _empty_session()
            self._memory.save(conversation_id, state)

        # 2. Merge frontend-provided context
        if frontend_context:
            ctx = state["conversation_context"]
            for key in ("bill", "roof", "roi", "customer", "customer360",
                        "predictions", "recommendations"):
                if key in frontend_context and frontend_context[key] is not None:
                    ctx[key] = frontend_context[key]

        # 3. Record user turn
        self._memory.add_turn(conversation_id, "user", message)

        # 4. Classify intent (placeholder — wired in Milestone 2)
        intent_result = self._classify_intent(message, state)

        # 5. Build execution plan (placeholder — wired in Milestone 2)
        plan = self._build_plan(intent_result, state, user_role)

        # 6. Execute plan (placeholder — wired in Milestone 3)
        tool_results = self._execute_plan(plan, state, user_role)

        # 7. Build system prompt
        system_prompt = self._build_prompt(
            message, state, intent_result, tool_results, user_role, user_name
        )

        # 8. Generate LLM response
        llm_response = self._generate_response(
            system_prompt, state["conversation_history"]
        )

        # 9. Format response
        response = self._format_response(
            llm_response=llm_response,
            tool_results=tool_results,
            intent=intent_result,
            conversation_id=conversation_id,
            request_id=request_id,
            elapsed_ms=(time.time() - t0) * 1000,
        )

        # 10. Record assistant turn + update memory
        self._memory.add_turn(conversation_id, "assistant", llm_response)
        if tool_results:
            self._memory.update_context(
                conversation_id,
                last_tools=[r.get("tool") for r in tool_results],
                last_actions=[r.get("summary") for r in tool_results],
            )

        # 11. Audit + log
        self._audit_log(
            request_id=request_id,
            user_email=user_email,
            intent=intent_result.get("intent"),
            tools_called=[r.get("tool") for r in tool_results],
            elapsed_ms=(time.time() - t0) * 1000,
        )

        return response

    def execute_tool(
        self,
        tool_name: str,
        params: Dict[str, Any],
        *,
        user_email: str,
        user_role: str,
        db=None,
    ) -> Dict[str, Any]:
        """Execute a single tool explicitly via POST /api/assistant/tool."""
        return self._executor.execute(
            tool_name, params,
            user_role=user_role, user_email=user_email, db=db,
        )

    def get_tools(self, user_role: str) -> List[Dict[str, Any]]:
        """List tools visible to the given role."""
        return self._registry.list_for_role(user_role)

    def get_history(self, session_id: str) -> Dict[str, Any]:
        """Return conversation history for a session."""
        state = self._memory.get(session_id)
        if state is None:
            return {"session_id": session_id, "history": [], "context": {}}
        return {
            "session_id": session_id,
            "history": state["conversation_history"],
            "context": state["conversation_context"],
        }

    def clear_history(self, session_id: str) -> bool:
        """Clear conversation history for a session."""
        return self._memory.clear(session_id)

    # ------------------------------------------------------------------
    # Internal helpers — wired to Milestone 2-3 components
    # ------------------------------------------------------------------

    def _classify_intent(self, message: str, state: Dict) -> Dict[str, Any]:
        return self._intent_router.classify(message, state.get("conversation_context"))

    def _build_plan(self, intent_result: Dict, state: Dict, user_role: str):
        return self._planner.build_plan(intent_result, state["conversation_context"], user_role)

    def _execute_plan(self, plan, state: Dict, user_role: str, db=None) -> List[Dict]:
        if not plan or not plan.steps:
            return []
        return self._executor.execute_plan(
            plan.steps, user_role=user_role, user_email="", db=db,
        )

    def _build_prompt(
        self,
        message: str,
        state: Dict,
        intent_result: Dict,
        tool_results: List[Dict],
        user_role: str,
        user_name: str,
    ) -> str:
        return self._prompt_builder.build(
            message=message,
            context=state.get("conversation_context", {}),
            intent=intent_result,
            tool_results=tool_results,
            user_role=user_role,
            user_name=user_name,
            tools=self._registry.list_for_role(user_role),
            conversation_history=state.get("conversation_history", []),
        )

    def _generate_response(self, system_prompt: str, history: List[Dict]) -> str:
        """Call the LLM (gemini-2.5-flash-lite) with retry/backoff."""
        if self._client is None:
            self._client = get_genai_client()

        from .client import ASSISTANT_MODEL

        history_text = ""
        for turn in history[-10:]:
            prefix = "User" if turn["role"] == "user" else "Assistant"
            history_text += f"{prefix}: {turn['content']}\n"

        full_prompt = f"{system_prompt}\n\n{history_text}"

        max_attempts = 3
        last_error = None
        for attempt in range(max_attempts):
            try:
                response = self._client.models.generate_content(
                    model=ASSISTANT_MODEL,
                    contents=full_prompt,
                )
                return response.text.strip()
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if any(t in err_str for t in ["503", "429", "unavailable", "exhausted", "demand"]):
                    time.sleep(2 ** (attempt + 1))
                else:
                    break

        logger.warning("LLM call failed after %d attempts: %s", max_attempts, last_error)
        return "I'm currently experiencing high demand. Please try again in a moment."

    def _format_response(
        self,
        *,
        llm_response: str,
        tool_results: List[Dict],
        intent: Dict,
        conversation_id: str,
        request_id: str,
        elapsed_ms: float,
    ) -> Dict[str, Any]:
        return format_response(
            llm_response=llm_response,
            tool_results=tool_results,
            intent=intent,
            conversation_id=conversation_id,
            request_id=request_id,
            elapsed_ms=elapsed_ms,
        )

    def _audit_log(
        self,
        *,
        request_id: str,
        user_email: str,
        intent: Optional[str],
        tools_called: List[str],
        elapsed_ms: float,
    ) -> None:
        """Audit the request via ml.audit + monitoring."""
        try:
            from ml.audit import get_audit_logger
            get_audit_logger().log(
                model=ASSISTANT_MODEL,
                version="1.0.0",
                endpoint="assistant_chat",
                latency_ms=elapsed_ms,
                success=True,
                input_data={"request_id": request_id, "user": user_email, "intent": intent, "tools": tools_called},
                request_id=request_id,
            )
        except Exception:
            pass

        try:
            from ml.monitoring import get_monitoring
            get_monitoring().record(elapsed_ms, True)
        except Exception:
            pass


def get_assistant_service() -> AssistantService:
    """Factory for the AssistantService singleton."""
    return AssistantService()
