from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os, json

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
router = APIRouter()


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


@router.post("/api/generate-proposal")
async def generate_proposal(data: ProposalRequest):
    try:
        prompt = f"""
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
        - subsidy_rs: based on PM Surya Ghar scheme (kw <= 2: kw*30000, kw <=3: 60000 + (kw-2)*18000, kw > 3: 78000 flat)
        - net_cost_rs: system_cost_rs - subsidy_rs
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
        - financial_highlights: 2-3 sentences summarizing cost, subsidy, and savings in plain language
        - why_choose_us: 2-3 sentences about the vendor's value proposition (use the vendor name)
        - terms_and_conditions: array of 5 short standard terms (warranty, installation timeline, payment terms, AMC, net metering process)

        Return ONLY valid JSON, no markdown, no extra text:
        {{
            "customer_name": "{data.customer_name}",
            "vendor_name": "{data.vendor_name}",
            "system_cost_rs": <number>,
            "subsidy_rs": <number>,
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