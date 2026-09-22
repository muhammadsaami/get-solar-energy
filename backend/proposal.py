from fastapi import APIRouter, Depends, HTTPException, Request
from security import verify_token
from auth import auth_rate_limiter
from permissions import has_admin_access
from pydantic import BaseModel
from ai.provider_factory import get_ai_provider
from ai.provider_base import AIRequest
from dotenv import load_dotenv
import os, json

load_dotenv()
router = APIRouter(dependencies=[Depends(verify_token)])


class ProposalRequest(BaseModel):
    customer_name: str
    customer_address: str
    city: str
    monthly_units: float
    monthly_bill_rs: float
    per_unit_rate: float
    recommended_kw: float
    roof_area_sqft: float
    vendor_name: str


def build_proposal_prompt(data: ProposalRequest) -> str:
    """Shared prompt builder so admin and customer flows use identical generation logic."""
    return f"""
        You are a professional solar proposal writer for an Indian solar EPC company.

        Generate a complete, professional solar installation proposal using this real customer data:

        Customer Name: {data.customer_name}
        Address: {data.customer_address}, {data.city}
        Current Monthly Consumption: {data.monthly_units} units (kWh)
        Current Monthly Bill: Rs {data.monthly_bill_rs}
        Per Unit Rate: Rs {data.per_unit_rate}
        Recommended Solar System Size: {data.recommended_kw} kW
        Available Roof Area: {data.roof_area_sqft} sq ft
        Vendor/Company Name: {data.vendor_name}

        Calculate the following using standard Indian solar industry formulas:
        - system_cost_rs: recommended_kw * 50000
        - net_cost_rs: system_cost_rs (full system cost; no subsidy program applies)
        - monthly_generation_units: recommended_kw * 4.5 * 30 (rounded)
        - monthly_savings_rs: monthly_generation_units * per_unit_rate (rounded)
        - annual_savings_rs: monthly_savings_rs * 12
        - payback_years: net_cost_rs / annual_savings_rs (1 decimal)
        - savings_25_years_rs: (annual_savings_rs * 25) - net_cost_rs
        - co2_offset_tons_per_year: (monthly_generation_units * 12 * 0.0008) rounded to 2 decimals
        - panels_required: ceil(recommended_kw * 1000 / 540) (assuming 540W panels)

        Then write:
        - executive_summary: 2-3 sentence professional summary addressed to the customer
        - system_overview: 2-3 sentences describing the proposed system, panel type, inverter type
        - financial_highlights: 2-3 sentences summarizing cost and savings in plain language (do not mention subsidies; no subsidy program applies)
        - why_choose_us: 2-3 sentences about the vendor's value proposition (use the vendor name)
        - terms_and_conditions: array of 5 short standard terms (warranty, installation timeline, payment terms, AMC, net metering process)

        Return ONLY valid JSON, no markdown, no extra text:
        {{
            "customer_name": "{data.customer_name}",
            "vendor_name": "{data.vendor_name}",
            "system_cost_rs": <number>,
            "net_cost_rs": <number>,
            "monthly_generation_units": <number>,
            "monthly_savings_rs": <number>,
            "annual_savings_rs": <number>,
            "payback_years": <number>,
            "savings_25_years_rs": <number>,
            "co2_offset_tons_per_year": <number>,
            "panels_required": <number>,
            "executive_summary": "<text>",
            "system_overview": "<text>",
            "financial_highlights": "<text>",
            "why_choose_us": "<text>",
            "terms_and_conditions": ["<term1>", "<term2>", "<term3>", "<term4>", "<term5>"]
        }}
        """


def generate_proposal_data(data: ProposalRequest) -> dict:
    """
    Shared generation core used by customer and admin flows.

    Goes through the centralized AI provider. Raises on failure —
    callers surface honest errors and must never fabricate output.
    """
    provider = get_ai_provider()
    ai_request = AIRequest(
        prompt=build_proposal_prompt(data),
        temperature=0.3,
        metadata={"route": "generate-proposal"},
    )
    ai_response = provider.generate_response(ai_request)

    text = ai_response.content
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]

    return json.loads(text.strip())


@router.post("/api/generate-proposal")
async def generate_proposal(data: ProposalRequest, req: Request = None, user_email: str = Depends(verify_token)):
    # Admin-only capability: proposal generation must never be reachable by
    # customers, vendors, technicians, or engineers, even with a valid token.
    if not has_admin_access(user_email):
        raise HTTPException(status_code=403, detail="Admin access required")
    client_ip = req.client.host if req else "unknown"
    if not auth_rate_limiter.is_allowed(user_email, client_ip):
        return {"success": False, "error": "Rate limit exceeded. Please try again later."}
    try:
        result = generate_proposal_data(data)
        return {"success": True, "data": result}

    except Exception as e:
        return {"success": False, "error": str(e)}
