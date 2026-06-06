from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from dotenv import load_dotenv
from database import engine, Base
import os
import json

load_dotenv()

Base.metadata.create_all(bind=engine)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI(title="GET Solar Energy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from roof import router as roof_router
from roi import router as roi_router
from chat import router as chat_router
from referral import router as referral_router
from auth import router as auth_router

app.include_router(roof_router)
app.include_router(roi_router)
app.include_router(chat_router)
app.include_router(referral_router)
app.include_router(auth_router)

@app.get("/")
def home():
    return {
        "message": "GET Solar Energy API running!",
        "version": "1.0.0",
        "platform": "India Solar Intelligence & Service Ecosystem"
    }

@app.post("/api/analyze-bill")
async def analyze_bill(image: UploadFile = File(...)):
    try:
        image_data = await image.read()

        prompt = """
        You are an expert at reading Indian electricity bills.
        
        Carefully analyze this electricity bill image and extract the following real data:
        1. Customer name exactly as written on the bill
        2. Monthly units consumed in kWh (look for units, consumption)
        3. Total bill amount in Rupees
        4. Per unit electricity rate in Rs/kWh
        5. Billing period (month and year)
        6. Consumer number if visible
        7. Discom/utility company name if visible
        
        Then calculate solar recommendations based on extracted data:
        - Recommended solar system size: monthly_units / 135 (rounded to nearest 0.5)
        - Monthly generation: recommended_kw * 4.5 * 30
        - Monthly savings: monthly_generation * per_unit_rate
        - System cost: recommended_kw * 50000
        - Payback years: system_cost / (monthly_savings * 12)
        - 25 year savings: (monthly_savings * 12 * 25) - system_cost
        
        Return ONLY valid JSON with real extracted values, no extra text:
        {
            "customer_name": "<exact name from bill>",
            "consumer_number": "<consumer number from bill>",
            "discom": "<electricity company name>",
            "monthly_units": <actual units from bill>,
            "bill_amount": <actual amount from bill>,
            "per_unit_rate": <actual rate from bill>,
            "billing_period": "<actual month year from bill>",
            "recommended_kw": <calculated>,
            "monthly_generation_units": <calculated>,
            "monthly_savings_rs": <calculated>,
            "system_cost_rs": <calculated>,
            "payback_years": <calculated>,
            "savings_25_years_rs": <calculated>
        }
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(
                            data=image_data,
                            mime_type=image.content_type
                        ),
                        types.Part.from_text(text=prompt)
                    ]
                )
            ]
        )

        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        result = json.loads(text.strip())
        return {"success": True, "data": result}

    except Exception as e:
        return {"success": False, "error": str(e)}