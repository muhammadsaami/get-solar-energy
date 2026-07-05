from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os, json

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
router = APIRouter()


class SiteSurveyRequest(BaseModel):
    customer_name: str
    city: str
    roof_type: str               # e.g. "RCC Flat", "Sloped Tin", "Tiled"
    roof_age_years: int
    total_roof_area_sqft: float
    shading_present: bool
    shading_details: str         # e.g. "Tree shadow on west side 2-3 hours"
    obstacles: str                # e.g. "Water tank, 2 ACs on roof"
    electrical_panel_distance_m: float   # distance from roof to main electrical panel
    structure_condition: str     # e.g. "Good", "Needs reinforcement"
    proposed_system_kw: float


@router.post("/api/site-survey")
async def site_survey(data: SiteSurveyRequest):
    try:
        prompt = f"""
        You are a senior solar installation site surveyor for an Indian solar EPC company.

        Analyze this real site survey data and produce a professional feasibility report:

        Customer: {data.customer_name}
        City: {data.city}
        Roof Type: {data.roof_type}
        Roof Age: {data.roof_age_years} years
        Total Roof Area: {data.total_roof_area_sqft} sq ft
        Shading Present: {data.shading_present}
        Shading Details: {data.shading_details}
        Obstacles on Roof: {data.obstacles}
        Distance from Roof to Electrical Panel: {data.electrical_panel_distance_m} meters
        Structure Condition: {data.structure_condition}
        Proposed System Size: {data.proposed_system_kw} kW

        Calculate and assess:
        - usable_area_sqft: total_roof_area_sqft minus area lost to obstacles and shading (estimate realistically based on obstacles described)
        - area_required_sqft: proposed_system_kw * 100 (approx 100 sq ft per kW including spacing)
        - feasibility_score: 0-100 score based on roof condition, shading, age, and usable area vs required area
        - feasibility_status: "Highly Feasible" (80-100), "Feasible with Conditions" (50-79), or "Not Recommended" (below 50)
        - mounting_structure_type: recommend based on roof_type (e.g. "RCC Flat" -> "Elevated Tilt Structure", "Sloped Tin" -> "Direct Mount with Hooks", "Tiled" -> "Tile Replacement Mount")
        - cable_run_estimate_meters: electrical_panel_distance_m * 1.3 (extra for routing)
        - estimated_additional_cost_rs: if structure_condition is not "Good", add reinforcement cost (roof_area_sqft * 50), else 0

        Then write:
        - site_assessment_summary: 3-4 sentence professional assessment of the site
        - identified_risks: array of 3-5 specific risks or concerns based on the data given (shading, obstacles, structure condition, roof age)
        - recommendations: array of 4-5 specific actionable recommendations for the installation team
        - shading_impact_note: 1-2 sentences on how the described shading will affect generation, or note "No significant shading impact" if shading_present is false

        Return ONLY valid JSON, no markdown, no extra text:
        {{
            "customer_name": "{data.customer_name}",
            "usable_area_sqft": <number>,
            "area_required_sqft": <number>,
            "feasibility_score": <number 0-100>,
            "feasibility_status": "<text>",
            "mounting_structure_type": "<text>",
            "cable_run_estimate_meters": <number>,
            "estimated_additional_cost_rs": <number>,
            "site_assessment_summary": "<text>",
            "identified_risks": ["<risk1>", "<risk2>", "<risk3>"],
            "recommendations": ["<rec1>", "<rec2>", "<rec3>", "<rec4>"],
            "shading_impact_note": "<text>"
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