from fastapi import APIRouter, Depends, File, UploadFile, Form, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from security import verify_token
from auth import auth_rate_limiter
from ai.provider_factory import get_ai_provider
from ai.provider_base import AIRequest, AIImageInput
import os
import json
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()

router = APIRouter(dependencies=[Depends(verify_token)])

# 3kW Fixed Layout (Ahmed Bhai Requirements)
SOLAR_3KW_LAYOUT = {
    "system_size_kw": 3,
    "total_panels": 6,
    "panel_rows": 2,
    "panels_per_row": 3,
    "total_legs": 4,
    "front_legs": 2,
    "back_legs": 2,
    "front_leg_height_ft": 5,
    "back_leg_height_ft": 7,
    "min_area_required_sqft": 192,
    "panel_size_sqft": 20,
    "monthly_generation_units": 360,
    "annual_generation_units": 4320
}

@router.post("/api/analyze-roof")
async def analyze_roof(
    image: UploadFile = File(...),
    length_ft: float = Form(...),
    width_ft: float = Form(...),
    city: str = Form(...),
    source: str = Form("camera"),
    req: Request = None,
    user_email: str = Depends(verify_token)
):
    client_ip = req.client.host if req else "unknown"
    if not auth_rate_limiter.is_allowed(user_email, client_ip):
        return {"success": False, "error": "Rate limit exceeded. Please try again later."}
    try:
        image_data = await image.read()
        
        # Calculate area
        roof_area_sqft = length_ft * width_ft
        
        # Check if 3kW plant fits
        plant_fits = roof_area_sqft >= SOLAR_3KW_LAYOUT["min_area_required_sqft"]
        
        prompt = f"""
        Analyze this rooftop image and provide:
        1. Roof facing direction/compass (North, South, East, West, NE, NW, SE, SW)
        2. Roof condition (Good, Average, Poor)
        3. Shading issues (None, Partial, Heavy)
        4. Roof type (Flat, Sloped, Mixed)
        5. Solar potential based on direction (High, Medium, Low)
        
        City: {city}
        Roof Length: {length_ft} ft
        Roof Width: {width_ft} ft
        Roof Area: {roof_area_sqft} sq ft
        
        Return ONLY this JSON:
        {{
            "facing_direction": "South",
            "compass_angle": "180",
            "roof_condition": "Good",
            "shading_issues": "None",
            "roof_type": "Flat",
            "solar_potential": "High",
            "obstacles": "None",
            "analysis_notes": "Good south facing roof ideal for solar"
        }}
        """

        # Determine mime type from uploaded file
        mime_type = image.content_type or "image/jpeg"
        if not mime_type or mime_type == "application/octet-stream":
            ext = (image.filename or "").split(".")[-1].lower()
            if ext == "pdf":
                mime_type = "application/pdf"
            elif ext in ["jpg", "jpeg"]:
                mime_type = "image/jpeg"
            elif ext == "webp":
                mime_type = "image/webp"
            else:
                mime_type = "image/png"
        
        max_attempts = 4
        last_error = None
        
        for attempt in range(max_attempts):
            try:
                provider = get_ai_provider()
                ai_request = AIRequest(
                    prompt=prompt,
                    temperature=0.2,
                    image_inputs=[AIImageInput(data=image_data, mime_type=mime_type)],
                    metadata={"route": "analyze-roof"},
                )
                ai_response = provider.generate_response(ai_request)
                
                text = ai_response.content
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0]
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0]
                
                ai_result = json.loads(text.strip())
                
                # Build complete result
                result = {
                    # User Input
                    "location": city,
                    "roof_length_ft": length_ft,
                    "roof_width_ft": width_ft,
                    "roof_area_sqft": roof_area_sqft,
                    
                    # AI Analysis
                    "facing_direction": ai_result.get("facing_direction", "South"),
                    "compass_angle": ai_result.get("compass_angle", "180"),
                    "roof_condition": ai_result.get("roof_condition", "Good"),
                    "shading_issues": ai_result.get("shading_issues", "None"),
                    "roof_type": ai_result.get("roof_type", "Flat"),
                    "solar_potential": ai_result.get("solar_potential", "High"),
                    "obstacles": ai_result.get("obstacles", "None"),
                    
                    # 3kW Plant Check
                    "plant_fits": plant_fits,
                    "recommended_system": "3 kW" if plant_fits else "Roof too small for 3kW",
                    
                    # Fixed 3kW Layout
                    "system_size_kw": SOLAR_3KW_LAYOUT["system_size_kw"],
                    "total_panels": SOLAR_3KW_LAYOUT["total_panels"],
                    "panel_rows": SOLAR_3KW_LAYOUT["panel_rows"],
                    "panels_per_row": SOLAR_3KW_LAYOUT["panels_per_row"],
                    "total_legs": SOLAR_3KW_LAYOUT["total_legs"],
                    "front_legs": SOLAR_3KW_LAYOUT["front_legs"],
                    "back_legs": SOLAR_3KW_LAYOUT["back_legs"],
                    "front_leg_height_ft": SOLAR_3KW_LAYOUT["front_leg_height_ft"],
                    "back_leg_height_ft": SOLAR_3KW_LAYOUT["back_leg_height_ft"],
                    "monthly_generation_units": SOLAR_3KW_LAYOUT["monthly_generation_units"],
                    "annual_generation_units": SOLAR_3KW_LAYOUT["annual_generation_units"],
                    "analysis_notes": ai_result.get("analysis_notes", "")
                }
                
                if source == "satellite":
                    result["satellite_analysis"] = True
                    disclaimer = (
                        "BETA - Satellite-based estimate. "
                        "Results are estimated from satellite imagery and should be confirmed "
                        "through an on-site survey before installation or purchasing decisions. "
                    )
                    result["analysis_notes"] = disclaimer + result.get("analysis_notes", "")
                else:
                    result["satellite_analysis"] = False
                
                return {"success": True, "data": result}
                
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if "503" in err_str or "429" in err_str or "unavailable" in err_str or "exhausted" in err_str or "demand" in err_str:
                    wait_time = 2 ** (attempt + 1)
                    logger.warning("Attempt %d/%d failed: %s. Retrying in %ds...", attempt + 1, max_attempts, e, wait_time)
                    time.sleep(wait_time)
                else:
                    raise e
        
        raise last_error
        
    except Exception as e:
        err_str = str(e).lower()
        if any(term in err_str for term in ["resource_exhausted", "quota", "rate limit", "exhausted", "429", "503", "unavailable"]):
            logger.warning("AI quota exhausted for roof analysis. Returning honest unavailable error.")
            if any(term in err_str for term in ["rate limit", "429"]):
                return JSONResponse(
                    status_code=429,
                    content={"success": False, "error": "Rate limit exceeded. Please try again later."},
                )
            return JSONResponse(
                status_code=503,
                content={"success": False, "error": "Roof analysis is temporarily unavailable. Please try again later."},
            )
        return {"success": False, "error": str(e)}
