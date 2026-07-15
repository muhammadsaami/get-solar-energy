from fastapi import APIRouter, Depends, File, UploadFile, Form, Request
from google import genai
from google.genai import types
from dotenv import load_dotenv
from security import verify_token
from auth import auth_rate_limiter
import os
import json
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
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
        
        max_attempts = 4
        last_error = None
        
        for attempt in range(max_attempts):
            try:
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
                
                return {"success": True, "data": result}
                
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if "503" in err_str or "429" in err_str or "unavailable" in err_str or "exhausted" in err_str or "demand" in err_str:
                    wait_time = 2 ** (attempt + 1)
                    print(f"Attempt {attempt+1}/{max_attempts} failed: {e}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise e
        
        raise last_error
        
    except Exception as e:
        err_str = str(e).lower()
        if any(term in err_str for term in ["resource_exhausted", "quota", "rate limit", "exhausted", "429", "503", "unavailable"]):
            logger.warning("Gemini quota exhausted. Returning fallback response.")
            return {
                "success": True,
                "fallback": True,
                "data": {
                    "location": city if 'city' in dir() else "Unknown",
                    "roof_length_ft": length_ft if 'length_ft' in dir() else 0,
                    "roof_width_ft": width_ft if 'width_ft' in dir() else 0,
                    "roof_area_sqft": roof_area_sqft if 'roof_area_sqft' in dir() else 0,
                    "facing_direction": "South",
                    "compass_angle": "180",
                    "roof_condition": "Good",
                    "shading_issues": "None",
                    "roof_type": "Flat",
                    "solar_potential": "High",
                    "plant_fits": True,
                    "recommended_system": "3 kW",
                    "system_size_kw": 3,
                    "total_panels": 6,
                    "panel_rows": 2,
                    "panels_per_row": 3,
                    "total_legs": 4,
                    "front_legs": 2,
                    "back_legs": 2,
                    "front_leg_height_ft": 5,
                    "back_leg_height_ft": 7,
                    "monthly_generation_units": 360,
                    "annual_generation_units": 4320
                }
            }
        return {"success": False, "error": str(e)}