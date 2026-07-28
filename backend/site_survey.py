from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os, json, time
import logging
from datetime import datetime

from security import verify_token
from auth import auth_rate_limiter
from database_sqlite import get_sqlite_db
from crm_models import CRMInstallationModel
from crm_service import add_timeline_event
from site_survey_service import (
    create_survey, get_survey, get_surveys, update_survey,
    update_survey_status, assign_surveyor, delete_survey,
    add_photo, get_photos, delete_photo, get_dashboard_stats,
    update_checklist, to_dict,
)
from utils.responses import ok, created, not_found, server_error, bad_request, ok_paginated
from utils.logger import log_api_request, log_api_response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
router = APIRouter(dependencies=[Depends(verify_token)])

DEMO_SITE_SURVEY_DATA = {
    "customer_name": "Demo Customer",
    "usable_area_sqft": 850,
    "area_required_sqft": 500,
    "feasibility_score": 85,
    "feasibility_status": "Highly Feasible",
    "mounting_structure_type": "Elevated Tilt Structure",
    "cable_run_estimate_meters": 13,
    "estimated_additional_cost_rs": 0,
    "site_assessment_summary": "The site has excellent solar potential with a flat RCC roof providing adequate usable area. No significant shading obstructions detected. The structure is in good condition requiring no reinforcement. The proposed 5kW system is well within the available roof area.",
    "identified_risks": [
        "Roof age of 8 years may require waterproofing before installation",
        "Distance to electrical panel is moderate; cable routing needs proper conduit",
        "Ensure structural load assessment for elevated mounting structure"
    ],
    "recommendations": [
        "Proceed with 5kW system installation using elevated tilt structure",
        "Use 10mm2 DC cable with proper UV-rated conduit for cable run",
        "Schedule waterproofing treatment for roof penetration points",
        "Install bird mesh around panel array perimeter"
    ],
    "shading_impact_note": "No significant shading impact detected. The roof has clear southern exposure ideal for maximum generation."
}


class SiteSurveyRequest(BaseModel):
    customer_name: str
    city: str
    roof_type: str
    roof_age_years: int
    total_roof_area_sqft: float
    shading_present: bool
    shading_details: str
    obstacles: str
    electrical_panel_distance_m: float
    structure_condition: str
    proposed_system_kw: float


class CreateSurveyRequest(BaseModel):
    customer_id: Optional[int] = None
    customer_name: str
    assigned_to: Optional[str] = None
    assigned_name: Optional[str] = None
    priority: Optional[str] = "normal"
    scheduled_date: Optional[str] = None
    city: Optional[str] = None
    roof_type: Optional[str] = None
    roof_age_years: Optional[int] = None
    total_roof_area_sqft: Optional[float] = None
    shading_present: Optional[bool] = False
    shading_details: Optional[str] = None
    obstacles: Optional[str] = None
    electrical_panel_distance_m: Optional[float] = None
    structure_condition: Optional[str] = None
    proposed_system_kw: Optional[float] = None


class UpdateSurveyRequest(BaseModel):
    customer_name: Optional[str] = None
    city: Optional[str] = None
    roof_type: Optional[str] = None
    roof_age_years: Optional[int] = None
    total_roof_area_sqft: Optional[float] = None
    shading_present: Optional[bool] = None
    shading_details: Optional[str] = None
    obstacles: Optional[str] = None
    electrical_panel_distance_m: Optional[float] = None
    structure_condition: Optional[str] = None
    proposed_system_kw: Optional[float] = None
    surveyor_notes: Optional[str] = None
    customer_notes: Optional[str] = None
    scheduled_date: Optional[str] = None
    priority: Optional[str] = None
    usable_area_sqft: Optional[float] = None
    area_required_sqft: Optional[float] = None
    feasibility_score: Optional[int] = None
    feasibility_status: Optional[str] = None
    mounting_structure_type: Optional[str] = None
    cable_run_estimate_meters: Optional[float] = None
    estimated_additional_cost_rs: Optional[float] = None
    site_assessment_summary: Optional[str] = None
    identified_risks: Optional[list] = None
    recommendations: Optional[list] = None
    shading_impact_note: Optional[str] = None


class AddPhotoRequest(BaseModel):
    uploaded_by: Optional[str] = None
    file_name: str
    file_path: str
    caption: Optional[str] = None
    photo_category: Optional[str] = "other"
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    timestamp: Optional[str] = None
    file_size: Optional[int] = None


class StatusUpdateRequest(BaseModel):
    status: str


class AssignRequest(BaseModel):
    assigned_to: str
    assigned_name: str


class ChecklistUpdateRequest(BaseModel):
    checklist: list


@router.post("/api/site-survey")
async def ai_site_survey(data: SiteSurveyRequest, req: Request = None, user_email: str = Depends(verify_token)):
    client_ip = req.client.host if req else "unknown"
    if not auth_rate_limiter.is_allowed(user_email, client_ip):
        return {"success": False, "error": "Rate limit exceeded. Please try again later."}
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
        - usable_area_sqft: total_roof_area_sqft minus area lost to obstacles and shading
        - area_required_sqft: proposed_system_kw * 100
        - feasibility_score: 0-100 score based on roof condition, shading, age, and usable area vs required area
        - feasibility_status: "Highly Feasible" (80-100), "Feasible with Conditions" (50-79), or "Not Recommended" (below 50)
        - mounting_structure_type: recommend based on roof_type
        - cable_run_estimate_meters: electrical_panel_distance_m * 1.3
        - estimated_additional_cost_rs: if structure_condition is not "Good", add reinforcement cost (roof_area_sqft * 50), else 0

        Then write:
        - site_assessment_summary: 3-4 sentence professional assessment
        - identified_risks: array of 3-5 specific risks
        - recommendations: array of 4-5 specific actionable recommendations
        - shading_impact_note: 1-2 sentences on shading impact

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

        max_attempts = 4
        last_error = None
        for attempt in range(max_attempts):
            try:
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
                last_error = e
                err_str = str(e).lower()
                if "503" in err_str or "429" in err_str or "unavailable" in err_str or "exhausted" in err_str or "demand" in err_str:
                    wait_time = 2 ** (attempt + 1)
                    time.sleep(wait_time)
                else:
                    raise e

        raise last_error

    except Exception as e:
        err_str = str(e).lower()
        if any(term in err_str for term in ["resource_exhausted", "quota", "rate limit", "exhausted", "429", "503", "unavailable"]):
            logger.warning("Gemini quota exhausted for site survey. Returning fallback response.")
            return {"success": True, "fallback": True, "data": DEMO_SITE_SURVEY_DATA}
        return {"success": False, "error": str(e)}


@router.get("/api/site-surveys/dashboard")
def dashboard_stats(
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_sqlite_db),
):
    log_api_request(logger, "GET", "/api/site-surveys/dashboard")
    try:
        from permissions import has_admin_access
        is_admin = has_admin_access(user_email)
        stats = get_dashboard_stats(db, user_email, is_admin)
        return ok(data=stats, message="Dashboard stats retrieved")
    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        return server_error()


@router.post("/api/site-surveys")
def create_survey_endpoint(
    data: CreateSurveyRequest,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "POST", "/api/site-surveys")
    try:
        survey = create_survey(db, data.model_dump(), user=user_email)
        return created(data=to_dict(survey), message="Survey created")
    except Exception as e:
        logger.error(f"Create survey error: {e}")
        return server_error()


@router.get("/api/site-surveys")
def list_surveys(
    status: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_desc: bool = Query(True),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "GET", "/api/site-surveys")
    try:
        from permissions import has_admin_access
        is_admin = has_admin_access(user_email)
        if not is_admin and not assigned_to:
            assigned_to = user_email
        surveys, total = get_surveys(
            db, status, assigned_to, customer_id, search,
            sort_by, sort_desc, page, limit
        )
        return ok_paginated(
            data=[to_dict(s) for s in surveys],
            page=page, limit=limit, total_count=total,
            message="Surveys retrieved"
        )
    except Exception as e:
        logger.error(f"List surveys error: {e}")
        return server_error()


@router.get("/api/site-surveys/{survey_id}")
def get_survey_endpoint(
    survey_id: int,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "GET", f"/api/site-surveys/{survey_id}")
    try:
        survey = get_survey(db, survey_id)
        if not survey:
            return not_found("Survey", survey_id)
        return ok(data=to_dict(survey), message="Survey retrieved")
    except Exception as e:
        logger.error(f"Get survey error: {e}")
        return server_error()


@router.put("/api/site-surveys/{survey_id}")
def update_survey_endpoint(
    survey_id: int,
    data: UpdateSurveyRequest,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "PUT", f"/api/site-surveys/{survey_id}")
    try:
        filtered = {k: v for k, v in data.model_dump().items() if v is not None}
        if not filtered:
            return bad_request("No fields to update")
        survey = update_survey(db, survey_id, filtered)
        if not survey:
            return not_found("Survey", survey_id)
        return ok(data=to_dict(survey), message="Survey updated")
    except Exception as e:
        logger.error(f"Update survey error: {e}")
        return server_error()


@router.patch("/api/site-surveys/{survey_id}/status")
def update_status_endpoint(
    survey_id: int,
    data: StatusUpdateRequest,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "PATCH", f"/api/site-surveys/{survey_id}/status")
    try:
        survey = update_survey_status(db, survey_id, data.status, user=user_email)
        if not survey:
            return not_found("Survey", survey_id)
        return ok(data=to_dict(survey), message=f"Status changed to {data.status}")
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        logger.error(f"Status update error: {e}")
        return server_error()


@router.patch("/api/site-surveys/{survey_id}/assign")
def assign_surveyor_endpoint(
    survey_id: int,
    data: AssignRequest,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "PATCH", f"/api/site-surveys/{survey_id}/assign")
    try:
        survey = assign_surveyor(db, survey_id, data.assigned_to, data.assigned_name, user=user_email)
        if not survey:
            return not_found("Survey", survey_id)
        return ok(data=to_dict(survey), message="Survey assigned")
    except Exception as e:
        logger.error(f"Assign error: {e}")
        return server_error()


@router.delete("/api/site-surveys/{survey_id}")
def delete_survey_endpoint(
    survey_id: int,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "DELETE", f"/api/site-surveys/{survey_id}")
    try:
        if not delete_survey(db, survey_id, user=user_email):
            return not_found("Survey", survey_id)
        return ok(message="Survey deleted")
    except Exception as e:
        logger.error(f"Delete survey error: {e}")
        return server_error()


@router.get("/api/site-surveys/{survey_id}/proposal-prefill")
def proposal_prefill(
    survey_id: int,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "GET", f"/api/site-surveys/{survey_id}/proposal-prefill")
    try:
        survey = get_survey(db, survey_id)
        if not survey:
            return not_found("Survey", survey_id)
        prefill = {
            "survey_id": survey.id,
            "customer_name": survey.customer_name,
            "customer_id": survey.customer_id,
            "site_address": survey.city,
            "roof_type": survey.roof_type,
            "roof_area_sqft": survey.total_roof_area_sqft,
            "roof_age_years": survey.roof_age_years,
            "shading_present": survey.shading_present,
            "shading_details": survey.shading_details,
            "obstacles": survey.obstacles,
            "structure_condition": survey.structure_condition,
            "proposed_system_kw": survey.proposed_system_kw,
            "electrical_panel_distance_m": survey.electrical_panel_distance_m,
            "checklist_completion": survey.checklist_completion,
            "survey_date": survey.scheduled_date,
            "survey_status": survey.status,
        }
        return ok(data=prefill, message="Proposal prefill data retrieved")
    except Exception as e:
        logger.error(f"Proposal prefill error: {e}")
        return server_error()


@router.post("/api/site-surveys/{survey_id}/handoff-installation")
def handoff_installation(
    survey_id: int,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "POST", f"/api/site-surveys/{survey_id}/handoff-installation")
    try:
        survey = get_survey(db, survey_id)
        if not survey:
            return not_found("Survey", survey_id)
        if survey.status != "approved":
            return bad_request("Survey must be approved before installation handoff")
        if not survey.customer_id:
            return bad_request("Survey has no associated customer")

        existing = db.query(CRMInstallationModel).filter(CRMInstallationModel.customer_id == survey.customer_id).first()
        if existing:
            return bad_request("Installation already exists for this customer")

        installation = CRMInstallationModel(
            customer_id=survey.customer_id,
            assigned_engineer=survey.assigned_name,
            current_stage="Lead Won",
            completion_percentage=5,
            expected_completion=None,
            inspection_date=None,
            panel_status="Pending",
            inverter_status="Pending",
            net_meter_status="Pending",
            remarks=f"Handoff from Site Survey #{survey.id}. Roof: {survey.roof_type}, Proposed: {survey.proposed_system_kw}kW",
            history=json.dumps([{"stage": "Lead Won", "timestamp": datetime.now().isoformat(), "completed_by": user_email, "remarks": "Auto-created from site survey handoff", "attachments": []}]),
        )
        db.add(installation)
        db.commit()
        db.refresh(installation)

        add_timeline_event(db, survey.customer_id, "Installation Created", user=user_email, module="SiteSurvey", status="handoff", notes=f"Installation #{installation.id} created from Survey #{survey.id}")

        from utils.responses import serialise as ser
        return created(data=ser(installation), message="Installation created from survey handoff")
    except Exception as e:
        logger.error(f"Handoff installation error: {e}")
        return server_error()


@router.post("/api/site-surveys/{survey_id}/photos")
def add_photo_endpoint(
    survey_id: int,
    data: AddPhotoRequest,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "POST", f"/api/site-surveys/{survey_id}/photos")
    try:
        photo = add_photo(db, survey_id, data.model_dump())
        if not photo:
            return not_found("Survey", survey_id)
        from utils.responses import serialise as ser
        return created(data=ser(photo), message="Photo added")
    except Exception as e:
        logger.error(f"Add photo error: {e}")
        return server_error()


@router.get("/api/site-surveys/{survey_id}/photos")
def list_photos_endpoint(
    survey_id: int,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "GET", f"/api/site-surveys/{survey_id}/photos")
    try:
        photos = get_photos(db, survey_id)
        from utils.responses import serialise as ser
        return ok(data=ser(photos), message="Photos retrieved")
    except Exception as e:
        logger.error(f"List photos error: {e}")
        return server_error()


@router.delete("/api/site-surveys/photos/{photo_id}")
def delete_photo_endpoint(
    photo_id: int,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "DELETE", f"/api/site-surveys/photos/{photo_id}")
    try:
        if not delete_photo(db, photo_id):
            return not_found("Photo", photo_id)
        return ok(message="Photo deleted")
    except Exception as e:
        logger.error(f"Delete photo error: {e}")
        return server_error()


@router.put("/api/site-surveys/{survey_id}/checklist")
def update_checklist_endpoint(
    survey_id: int,
    data: ChecklistUpdateRequest,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "PUT", f"/api/site-surveys/{survey_id}/checklist")
    try:
        survey = update_checklist(db, survey_id, data.checklist)
        if not survey:
            return not_found("Survey", survey_id)
        return ok(data=to_dict(survey), message="Checklist updated")
    except Exception as e:
        logger.error(f"Checklist update error: {e}")
        return server_error()
