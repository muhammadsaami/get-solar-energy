from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database_sqlite import BaseSqlite


class SiteSurveyModel(BaseSqlite):
    __tablename__ = "site_surveys"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    customer_name = Column(String, nullable=False)
    assigned_to = Column(String, nullable=True)
    assigned_name = Column(String, nullable=True)
    status = Column(String, default="scheduled", index=True)
    priority = Column(String, default="normal")

    scheduled_date = Column(String, nullable=True)
    completed_date = Column(String, nullable=True)

    city = Column(String, nullable=True)
    roof_type = Column(String, nullable=True)
    roof_age_years = Column(Integer, nullable=True)
    total_roof_area_sqft = Column(Float, nullable=True)
    shading_present = Column(Boolean, default=False)
    shading_details = Column(Text, nullable=True)
    obstacles = Column(Text, nullable=True)
    electrical_panel_distance_m = Column(Float, nullable=True)
    structure_condition = Column(String, nullable=True)
    proposed_system_kw = Column(Float, nullable=True)

    usable_area_sqft = Column(Float, nullable=True)
    area_required_sqft = Column(Float, nullable=True)
    feasibility_score = Column(Integer, nullable=True)
    feasibility_status = Column(String, nullable=True)
    mounting_structure_type = Column(String, nullable=True)
    cable_run_estimate_meters = Column(Float, nullable=True)
    estimated_additional_cost_rs = Column(Float, nullable=True)
    site_assessment_summary = Column(Text, nullable=True)
    identified_risks = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    shading_impact_note = Column(Text, nullable=True)

    surveyor_notes = Column(Text, nullable=True)
    customer_notes = Column(Text, nullable=True)
    completion_percentage = Column(Integer, default=0)

    checklist_items = Column(JSON, nullable=True)
    checklist_completion = Column(Integer, default=0)

    report_generated = Column(Boolean, default=False)
    report_url = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    photos = relationship("SiteSurveyPhotoModel", back_populates="survey", cascade="all, delete-orphan")


class SiteSurveyPhotoModel(BaseSqlite):
    __tablename__ = "site_survey_photos"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("site_surveys.id"), nullable=False, index=True)
    uploaded_by = Column(String, nullable=True)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    caption = Column(String, nullable=True)
    photo_category = Column(String, default="other")
    gps_lat = Column(Float, nullable=True)
    gps_lng = Column(Float, nullable=True)
    timestamp = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    survey = relationship("SiteSurveyModel", back_populates="photos")
