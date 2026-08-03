"""
Phase 3 (extension) - AI Troubleshooting Assistant
Creates its own Gemini client (same GEMINI_API_KEY as main.py) rather than
importing main.py's client directly, to avoid a circular import (main.py
imports this router).
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from google import genai
from google.genai import types
from database import get_db
from technician_models import Technician
from ai_troubleshoot_models import AIConversationLog
from technician_auth import get_current_technician
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/technician/ai", tags=["AI Troubleshooting"])

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are the GET Solar Energy Technician AI Assistant — a practical,
safety-first troubleshooting helper for field technicians working on residential
solar installations in India.

Your style:
- Direct, technical, step-by-step. No sales language, no fluff.
- Prioritize safety warnings (electrical shock, working at height, fire risk) before any repair steps.
- If a fault could be dangerous to diagnose without proper equipment/training, say so clearly
  and recommend escalation instead of guessing.

Your knowledge areas:
- Rooftop solar inverters (string inverters, micro-inverters), MPPT, common fault/error codes
- Panel wiring, MC4 connectors, junction boxes, earthing/grounding faults
- Net metering and DISCOM-side connection issues
- Common causes of underperformance: shading, dust/soiling, panel degradation, loose connections
- Basic multimeter/clamp-meter diagnostic steps
"""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


class ImageDiagnoseRequest(BaseModel):
    file_url: str            # returned by POST /api/upload
    question: Optional[str] = None


class DiagnoseRequest(BaseModel):
    symptom_description: str
    error_code: Optional[str] = None
    inverter_brand: Optional[str] = None


def _log_conversation(db: Session, technician_id: int, interaction_type: str, user_message: str, ai_response: str):
    db.add(AIConversationLog(
        technician_id=technician_id,
        interaction_type=interaction_type,
        user_message=user_message,
        ai_response=ai_response
    ))
    db.commit()


def _call_gemini_text(prompt: str) -> str:
    try:
        response = client.models.generate_content(model="gemini-2.5-flash-lite", contents=prompt)
        return response.text.strip()
    except Exception as e:
        logger.error("Gemini call failed: %s", str(e))
        raise HTTPException(status_code=503, detail="AI assistant is currently unavailable. Please try again shortly.")


@router.post("/chat")
def ai_chat(data: ChatRequest, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    history_text = "\n".join(f"{m.role.capitalize()}: {m.content}" for m in data.history[-10:])
    prompt = f"{SYSTEM_PROMPT}\n\n{history_text}\nTechnician: {data.message}\nAssistant:"

    answer = _call_gemini_text(prompt)
    _log_conversation(db, current_technician.id, "chat", data.message, answer)

    return {"success": True, "response": answer}


@router.post("/image")
def ai_image_diagnose(
    data: ImageDiagnoseRequest,
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician)
):
    local_path = data.file_url.lstrip("/")   # "/uploads/xxx.jpg" -> "uploads/xxx.jpg"
    if not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail="Uploaded file not found. Upload it via /api/upload first.")

    with open(local_path, "rb") as f:
        image_bytes = f.read()

    question = data.question or "What fault or issue do you see in this photo, and what should the technician check first?"
    prompt = f"{SYSTEM_PROMPT}\n\nA technician has shared a photo from a solar site. Question: {question}"

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                        types.Part.from_text(text=prompt)
                    ]
                )
            ]
        )
        answer = response.text.strip()
    except Exception as e:
        logger.error("Gemini image call failed: %s", str(e))
        raise HTTPException(status_code=503, detail="AI assistant is currently unavailable. Please try again shortly.")

    _log_conversation(db, current_technician.id, "image", question, answer)
    return {"success": True, "response": answer}


@router.post("/diagnose")
def ai_structured_diagnose(
    data: DiagnoseRequest,
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician)
):
    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"A technician reports the following issue:\n"
        f"Symptom: {data.symptom_description}\n"
        f"Error code: {data.error_code or 'None provided'}\n"
        f"Inverter brand: {data.inverter_brand or 'Not specified'}\n\n"
        f"Give: 1) Likely cause(s), 2) Safety warnings if any, 3) Step-by-step checks, "
        f"in plain numbered steps."
    )

    answer = _call_gemini_text(prompt)
    _log_conversation(db, current_technician.id, "diagnose", data.symptom_description, answer)

    return {"success": True, "diagnosis": answer}


@router.get("/history")
def ai_history(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    logs = db.query(AIConversationLog).filter(
        AIConversationLog.technician_id == current_technician.id
    ).order_by(AIConversationLog.created_at.desc()).limit(50).all()

    return {
        "success": True,
        "history": [
            {
                "id": l.id, "interaction_type": l.interaction_type,
                "user_message": l.user_message, "ai_response": l.ai_response,
                "created_at": l.created_at.isoformat()
            } for l in logs
        ]
    }