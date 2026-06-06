from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []

@router.post("/api/chat")
async def chat(request: ChatRequest):
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

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt
        )

        return {
            "success": True,
            "reply": response.text.strip()
        }

    except Exception as e:
        return {"success": False, "error": str(e)}