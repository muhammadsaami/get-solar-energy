from fastapi import APIRouter, File, UploadFile
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import json
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter()

@router.post("/api/analyze-roof")
async def analyze_roof(image: UploadFile = File(...)):
    try:
        image_data = await image.read()

        prompt = """
        Analyze this rooftop image and extract:
        1. Estimated total roof area in square feet
        2. Usable area for solar panels (excluding AC units, water tanks, obstructions)
        3. Roof type (flat/sloped)
        4. Shading issues if any

        Then calculate:
        - Recommended solar system size in kW (usable_sqft / 100)
        - Number of solar panels needed (each panel = 20 sqft)
        - Estimated monthly generation in units (kW x 4.5 x 30)

        Return ONLY a JSON response like this:
        {
            "total_area_sqft": 1200,
            "usable_area_sqft": 900,
            "roof_type": "flat",
            "shading_issues": "none",
            "recommended_kw": 9,
            "number_of_panels": 45,
            "monthly_generation_units": 1215
        }
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

                result = json.loads(text.strip())
                return {"success": True, "data": result}
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if "503" in err_str or "429" in err_str or "unavailable" in err_str or "exhausted" in err_str or "demand" in err_str:
                    wait_time = 2 ** (attempt + 1)
                    print(f"Transient error on attempt {attempt+1}/{max_attempts}: {e}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise e
        raise last_error

    except Exception as e:
        err_str = str(e).lower()
        if any(term in err_str for term in ["resource_exhausted", "quota exceeded", "rate limit", "exhausted", "429", "503", "unavailable"]):
            logger.warning("Gemini quota exhausted. Returning demo fallback response.")
            return {
                "success": True,
                "fallback": True,
                "data": {
                    "total_area_sqft": 1200,
                    "usable_area_sqft": 900,
                    "roof_type": "flat",
                    "shading_issues": "none",
                    "recommended_kw": 9,
                    "number_of_panels": 45,
                    "monthly_generation_units": 1215
                }
            }
        return {"success": False, "error": str(e)}