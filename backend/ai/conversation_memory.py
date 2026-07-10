"""
backend/ai/conversation_memory.py
==================================
GET Solar Energy — Enterprise AI Assistant Conversation Memory
Phase 13.0D

Stores conversation context and history behind a swappable interface.
In-memory implementation now; Redis/PostgreSQL-backed store can replace
it later without changing the public API.
"""

import time
import logging
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Default history cap per session
DEFAULT_MAX_HISTORY = 50


def _new_session_id() -> str:
    return uuid.uuid4().hex[:16]


class ConversationMemoryStore(ABC):
    """Abstract interface for conversation memory persistence."""

    @abstractmethod
    def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Load a full session state dict, or None if not found."""
        ...

    @abstractmethod
    def save(self, session_id: str, state: Dict[str, Any]) -> None:
        """Persist a full session state dict (overwrites)."""
        ...

    @abstractmethod
    def clear(self, session_id: str) -> bool:
        """Delete a session. Returns True if it existed."""
        ...

    @abstractmethod
    def add_turn(self, session_id: str, role: str, content: str) -> None:
        """Append a turn to conversation_history, enforcing history cap."""
        ...

    @abstractmethod
    def update_context(self, session_id: str, **updates) -> None:
        """Merge keys into the session's conversation_context."""
        ...


def _empty_session(conversation_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Build a fresh session state dict."""
    return {
        "conversation_context": conversation_context or {
            "customer": None,
            "customer360": None,
            "bill": None,
            "roof": None,
            "roi": None,
            "predictions": None,
            "recommendations": None,
            "last_tools": [],
            "last_actions": [],
            "pending_actions": [],
        },
        "conversation_history": [],
        "created_at": time.time(),
        "updated_at": time.time(),
    }


class InMemoryConversationMemory(ConversationMemoryStore):
    """In-memory implementation backed by a plain dict."""

    def __init__(self, max_history: int = DEFAULT_MAX_HISTORY):
        self._store: Dict[str, Dict[str, Any]] = {}
        self._max_history = max_history

    def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self._store.get(session_id)

    def save(self, session_id: str, state: Dict[str, Any]) -> None:
        state["updated_at"] = time.time()
        self._store[session_id] = state

    def clear(self, session_id: str) -> bool:
        if session_id in self._store:
            del self._store[session_id]
            return True
        return False

    def add_turn(self, session_id: str, role: str, content: str) -> None:
        session = self._store.get(session_id)
        if session is None:
            return
        history = session["conversation_history"]
        history.append({"role": role, "content": content})
        if len(history) > self._max_history:
            history[:] = history[-self._max_history:]
        session["updated_at"] = time.time()

    def update_context(self, session_id: str, **updates) -> None:
        session = self._store.get(session_id)
        if session is None:
            return
        session["conversation_context"].update(updates)
        session["updated_at"] = time.time()


_memory_store: Optional[ConversationMemoryStore] = None


def get_memory_store() -> ConversationMemoryStore:
    """Factory for the memory store singleton."""
    global _memory_store
    if _memory_store is None:
        _memory_store = InMemoryConversationMemory()
        logger.info("ConversationMemoryStore initialised (InMemoryConversationMemory)")
    return _memory_store
