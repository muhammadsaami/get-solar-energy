from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from security import verify_token
from auth import auth_rate_limiter
from pydantic import BaseModel
from ai.provider_factory import get_ai_provider
from ai.provider_base import AIRequest
from dotenv import load_dotenv
import os, json, time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()
router = APIRouter(dependencies=[Depends(verify_token)])


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
async def amc_recommendation(data: AMCRequest, req: Request = None, user_email: str = Depends(verify_token)):
    client_ip = req.client.host if req else "unknown"
    if not auth_rate_limiter.is_allowed(user_email, client_ip):
        return {"success": False, "error": "Rate limit exceeded. Please try again later."}
    try:
        generation_drop_pct = round(
            ((data.expected_generation_units - data.current_generation_units)
             / data.expected_generation_units) * 100, 1
        ) if data.expected_generation_units > 0 else 0.0

        prompt = f"""
        You are an expert solar system engineer and AMC specialist in India.
        Analyze this solar rooftop system and generate a comprehensive maintenance recommendation.

        System Details:
        - Customer: {data.customer_name}, {data.city}
        - System Size: {data.system_size_kw} kW
        - Installed: {data.installation_date}
        - Last Serviced: {data.last_service_date}
        - Expected Generation: {data.expected_generation_units} units/month
        - Actual Generation: {data.current_generation_units} units/month
        - Generation Drop: {generation_drop_pct}%
        - Inverter Errors: {data.inverter_error_codes}
        - Recent Panel Cleaning Done: {data.panel_cleaning_done}
        - Physical Damage Observed: {data.physical_damage_observed}
        - Damage Details: {data.damage_details}

        Calculate and determine:
        1. health_score: 0-100 score based on drop%, age, errors, damage
        2. system_status: "Excellent" (90-100), "Good" (75-89), "Needs Attention" (60-74), "Critical" (<60)
        3. monthly_loss_rs: generation drop units x Rs 7.50 per unit
        4. next_service_due: recommended date (YYYY-MM-DD) based on last service and status
        5. urgent_action_required: boolean — true if critical errors or >25% drop or physical damage
        6. diagnosis_summary: 2-3 sentences explaining what's happening and why
        7. fault_analysis: list of 2-4 specific identified or likely issues
        8. recommended_actions: list of 4-6 prioritized action items for the engineer/technician
        9. preventive_measures: list of 3-4 tips for the customer to prevent future issues
        10. estimated_service_cost_rs: estimated cost in INR for recommended service/repairs

        Return ONLY a valid JSON object, no markdown, no explanation:
        {{
            "customer_name": "{data.customer_name}",
            "system_size_kw": {data.system_size_kw},
            "health_score": <number 0-100>,
            "system_status": "<status>",
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

        max_attempts = 2
        last_error = None
        for attempt in range(max_attempts):
            try:
                provider = get_ai_provider()
                req = AIRequest(prompt=prompt, temperature=0.2, metadata={"route": "amc-recommendation"})
                response = provider.generate_response(req)

                text = response.content.strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0]
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0]

                result = json.loads(text.strip())
                return {"success": True, "data": result}

            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if "503" in err_str or "429" in err_str or "unavailable" in err_str or "exhausted" in err_str or "demand" in err_str:
                    wait_time = 1.5 * (attempt + 1)
                    time.sleep(wait_time)
                else:
                    raise e

        raise last_error

    except Exception as e:
        err_str = str(e).lower()
        if any(term in err_str for term in ["resource_exhausted", "quota", "rate limit", "exhausted", "429", "503", "unavailable"]):
            logger.warning("AI provider busy/quota exhausted for AMC recommendation. Returning honest unavailable error.")
            if any(term in err_str for term in ["rate limit", "429"]):
                return JSONResponse(
                    status_code=429,
                    content={"success": False, "error": "Rate limit exceeded. Please try again later."},
                )
            return JSONResponse(
                status_code=503,
                content={"success": False, "error": "AMC evaluation is temporarily unavailable. Please try again later."},
            )
        return {"success": False, "error": str(e)}