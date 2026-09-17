from fastapi import APIRouter, Depends, Request
from security import verify_token
from auth import auth_rate_limiter
from pydantic import BaseModel
from typing import List
from ai.provider_factory import get_ai_provider
from ai.provider_base import AIRequest

router = APIRouter(dependencies=[Depends(verify_token)])

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []

@router.post("/api/chat")
async def chat(request: ChatRequest, req: Request = None, user_email: str = Depends(verify_token)):
    client_ip = req.client.host if req else "unknown"
    if not auth_rate_limiter.is_allowed(user_email, client_ip):
        return {"success": False, "error": "Rate limit exceeded. Please try again later."}
    try:
        system_prompt = """You are a helpful solar energy assistant for Indian consumers. 
        You help with:
        - Solar panel sizing and installation questions
        - Cost, savings and ROI queries
        - Government subsidies (PM Surya Ghar Yojana - 78000 Rs subsidy)
        - After sales service and maintenance
        - Net metering and electricity bill queries
        
        Always answer in the same language the user uses (Hindi or English).
        Keep answers simple, helpful and concise.
        Always mention government subsidies when relevant."""

        history_text = ""
        for msg in request.history:
            if msg.role == "user":
                history_text += f"User: {msg.content}\n"
            else:
                history_text += f"Assistant: {msg.content}\n"

        full_prompt = f"{system_prompt}\n\n{history_text}User: {request.message}\nAssistant:"

        provider = get_ai_provider()
        ai_request = AIRequest(
            prompt=full_prompt,
            temperature=0.2,
            metadata={"route": "chat"},
        )
        ai_response = provider.generate_response(ai_request)

        return {
            "success": True,
            "reply": ai_response.content.strip()
        }

    except Exception as e:
        return {"success": False, "error": str(e)}