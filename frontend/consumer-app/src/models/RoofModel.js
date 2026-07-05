// src/models/RoofModel.js

export class RoofModel {
  constructor(raw) {
    this.location = raw.location || '';
    this.roofLengthFt = raw.roof_length_ft || 0;
    this.roofWidthFt = raw.roof_width_ft || 0;
    this.roofAreaSqFt = raw.roof_area_sqft || 0;
    this.facingDirection = raw.facing_direction || 'South';
    this.compassAngle = raw.compass_angle || '180';
    this.roofCondition = raw.roof_condition || 'Good';
    this.shadingIssues = raw.shading_issues || 'None';
    this.roofType = raw.roof_type || 'Flat';
    this.solarPotential = raw.solar_potential || 'High';
    this.obstacles = raw.obstacles || 'None';
    this.plantFits = raw.plant_fits !== undefined ? raw.plant_fits : false;
    this.recommendedSystem = raw.recommended_system || '';
    this.systemSizeKw = raw.system_size_kw || 0.0;
    this.totalPanels = raw.total_panels || 0;
    this.panelRows = raw.panel_rows || 0;
    this.panelsPerRow = raw.panels_per_row || 0;
    this.totalLegs = raw.total_legs || 0;
    this.frontLegs = raw.front_legs || 0;
    this.backLegs = raw.back_legs || 0;
    this.frontLegHeightFt = raw.front_leg_height_ft || 0;
    this.backLegHeightFt = raw.back_leg_height_ft || 0;
    this.monthlyGenerationUnits = raw.monthly_generation_units || 0;
    this.annualGenerationUnits = raw.annual_generation_units || 0;
    this.analysisNotes = raw.analysis_notes || '';
  }
}
