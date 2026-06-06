from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ROIRequest(BaseModel):
    monthly_units: float
    per_unit_rate: float
    recommended_kw: float
    city: str = "India"

@router.post("/api/calculate-roi")
async def calculate_roi(data: ROIRequest):
    try:
        daily_sun_hours = 4.5
        monthly_generation = data.recommended_kw * daily_sun_hours * 30
        monthly_savings = monthly_generation * data.per_unit_rate
        system_cost = data.recommended_kw * 50000
        annual_savings = monthly_savings * 12
        payback_years = round(system_cost / annual_savings, 1)
        savings_25_years = round((annual_savings * 25) - system_cost, 0)

        return {
            "success": True,
            "data": {
                "system_cost_rs": system_cost,
                "monthly_generation_units": round(monthly_generation, 1),
                "monthly_savings_rs": round(monthly_savings, 0),
                "annual_savings_rs": round(annual_savings, 0),
                "payback_years": payback_years,
                "savings_25_years_rs": savings_25_years,
                "co2_saved_kg_per_year": round(monthly_generation * 12 * 0.82, 0)
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}