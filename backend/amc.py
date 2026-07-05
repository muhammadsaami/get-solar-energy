from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os, json

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
router = APIRouter()


class AMCRequest(BaseModel):
    customer_name: str
    city: str
    system_size_kw: float
    installation_date: str        # e.g. "2022-03-15"
    last_service_date: str        # e.g. "2024-01-10"
    current_generation_units: float   # last month actual generation
    expected_generation_units: float  # what it should generate
    inverter_error_codes: str     # e.g. "E04, E07" or "None"
    panel_cleaning_done: bool
    physical_damage_observed: bool
    damage_details: str           # e.g. "One panel micro-crack visible" or "None"


@router.post("/api/amc-recommendation")
async def amc_recommendation(data: AMCRequest):
    try:
        generation_drop_pct = round(
            ((data.expected_generation_units - data.current_generation_units)
             / data.expected_generation_units) * 100, 1
        ) if data.expected_generation_units > 0 else 0

        prompt = f"""
        You are a senior solar O&M (Operations & Maintenance) engineer in India.

        Analyze this real solar system data and provide a professional AMC service report:

        Customer: {data.customer_name}
        City: {data.city}
        System Size: {data.system_size_kw} kW
        Installation Date: {data.installation_date}
        Last Service Date: {data.last_service_date}
        Last Month Actual Generation: {data.current_generation_units} units
        Expected Generation: {data.expected_generation_units} units
        Generation Drop: {generation_drop_pct}%
        Inverter Error Codes: {data.inverter_error_codes}
        Panel Cleaning Done: {data.panel_cleaning_done}
        Physical Damage Observed: {data.physical_damage_observed}
        Damage Details: {data.damage_details}

        Assess and calculate:
        - health_score: 0-100 based on generation drop, errors, damage, cleaning status
          (100 = perfect, deduct points: generation drop >10% = -20, >20% = -35,
           inverter errors present = -15, physical damage = -25, cleaning not done = -10)
        - system_status: "Healthy" (80-100), "Needs Attention" (50-79), "Critical" (below 50)
        - monthly_loss_rs: (expected - actual) units * 8 (average Rs per unit)
        - next_service_due: recommend next service date based on last_service_date
          (quarterly service = 3 months after last service)
        - urgent_action_required: true if health_score < 50 or physical damage observed

        Then write:
        - diagnosis_summary: 3-4 sentence professional summary of system health
        - fault_analysis: array of 3-5 specific identified issues based on the data
          (inverter errors explanation, generation drop cause, cleaning impact, etc.)
        - recommended_actions: array of 5-6 specific actionable maintenance tasks
          ordered by priority (urgent first)
        - preventive_measures: array of 3-4 preventive tips for this specific system
        - estimated_service_cost_rs: realistic AMC visit cost estimate
          (base Rs 1500 + Rs 500 per kW + Rs 2000 if inverter error + Rs 3000 if physical damage)

        Return ONLY valid JSON, no markdown, no extra text:
        {{
            "customer_name": "{data.customer_name}",
            "system_size_kw": {data.system_size_kw},
            "health_score": <number 0-100>,
            "system_status": "<text>",
            "generation_drop_pct": {generation_drop_pct},
            "monthly_loss_rs": <number>,
            "next_service_due": "<date string>",
            "urgent_action_required": <true/false>,
            "diagnosis_summary": "<text>",
            "fault_analysis": ["<issue1>", "<issue2>", "<issue3>"],
            "recommended_actions": ["<action1>", "<action2>", "<action3>", "<action4>", "<action5>"],
            "preventive_measures": ["<tip1>", "<tip2>", "<tip3>"],
            "estimated_service_cost_rs": <number>
        }}
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Content(role="user", parts=[types.Part.from_text(text=prompt)])
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