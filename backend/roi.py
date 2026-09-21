from fastapi import APIRouter, Depends, HTTPException
from security import verify_token
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(dependencies=[Depends(verify_token)])

class ROIRequest(BaseModel):
    monthly_bill: float
    state: str = "Uttar Pradesh"
    roof_type: str = "flat"
    system_size: float

@router.post("/api/calculate-roi")
async def calculate_roi(data: ROIRequest):
    if data.monthly_bill <= 0 or data.system_size <= 0:
        raise HTTPException(
            status_code=400,
            detail="Monthly bill and target system capacity must be greater than zero."
        )

    try:
        system_size = data.system_size
        recommended_kw = system_size

        # Cost: ₹55,000 per kW (aligned cross-platform)
        system_cost = system_size * 55000

        # Subsidy rules under PM-Surya Ghar Scheme:
        # Capped at ₹78,000 max.
        # - Up to 2kW: ₹30,000 per kW
        # - 2kW to 3kW: ₹60,000 + ₹18,000 * (size - 2)
        # - 3kW and above: ₹78,000
        government_subsidy = 0.0
        if system_size >= 3.0:
            government_subsidy = 78000.0
        elif system_size >= 2.0:
            government_subsidy = 60000.0 + (system_size - 2.0) * 18000.0
        else:
            government_subsidy = system_size * 30000.0

        net_cost = system_cost - government_subsidy
        
        # Monthly savings: solar offsets 90% of electricity bill
        monthly_savings = data.monthly_bill * 0.9
        annual_savings = monthly_savings * 12
        
        # Generation: system_size * 4.5 kWh/kW/day * 30 days * 12 months
        monthly_generation = system_size * 4.5 * 30
        annual_generation = monthly_generation * 12

        payback_period = round(net_cost / annual_savings, 1) if annual_savings > 0 else 0.0
        lifetime_savings = round((annual_savings * 25) - net_cost, 0)
        
        # ROI % calculated using lifetime savings: ((lifetime_savings - net_cost) / net_cost) * 100
        roi_percentage = round(((lifetime_savings - net_cost) / net_cost) * 100, 1) if net_cost > 0 else 0.0
        
        # CO2 reduction in Tons per year: annual_generation * 0.82 kg/kWh / 1000
        co2_reduction = round(annual_generation * 0.82 / 1000, 2)

        return {
            "success": True,
            "data": {
                "recommended_kw": recommended_kw,
                "system_cost": system_cost,
                "government_subsidy": government_subsidy,
                "net_cost": net_cost,
                "monthly_savings": round(monthly_savings, 0),
                "annual_savings": round(annual_savings, 0),
                "annual_generation": round(annual_generation, 0),
                "payback_period": payback_period,
                "lifetime_savings": lifetime_savings,
                "roi_percentage": roi_percentage,
                "co2_reduction": co2_reduction
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ROI calculation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to calculate ROI. Please verify inputs."
        )