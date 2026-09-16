"""
GET Solar Energy — Technician AI Troubleshooting API
Provides AI-assisted field diagnostic responses, error code lookup,
and safety step-by-step resolution guidance for field engineers.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/technician/ai", tags=["Technician AI Troubleshooting"])


class TroubleshootingRequest(BaseModel):
    query: str
    error_code: Optional[str] = None
    equipment_type: Optional[str] = None


@router.post("/troubleshoot")
def troubleshoot_issue(req: TroubleshootingRequest):
    query_lower = req.query.lower()
    error_code = (req.error_code or "").upper()

    if "e04" in query_lower or error_code == "E04":
        return {
            "success": True,
            "diagnosis": {
                "error_code": "E04",
                "title": "Grid Overvoltage Protection Tripped",
                "severity": "High",
                "cause": "AC Grid line voltage spiked above 270V threshold, triggering inverter safety shutdown.",
                "steps": [
                  "1. Connect calibrated True-RMS Multimeter to inverter AC disconnect terminals.",
                  "2. Measure Phase-to-Neutral AC voltage under load and no-load conditions.",
                  "3. Inspect DISCOM distribution line transformer tap settings.",
                  "4. Update grid voltage protection window parameters via Inverter Setup App if DISCOM approved."
                ],
                "safety_warning": "⚡ HIGH VOLTAGE WARNING: Wear Class 0 1000V insulated gloves and follow LOTO procedures before opening AC combiner box.",
                "suggested_kb_title": "Grid Overvoltage & Voltage Drop Troubleshooting Guide",
                "recommended_training_module": "Level 2: String Inverter Commissioning & Grid Interconnection"
            }
        }
    elif "earth" in query_lower or "leakage" in query_lower or "riso" in query_lower or error_code == "E01":
        return {
            "success": True,
            "diagnosis": {
                "error_code": "E01",
                "title": "Low Insulation Resistance (Riso Fault)",
                "severity": "Critical",
                "cause": "DC cable insulation degradation or water ingress in rooftop MC4 connectors causing leakage to ground.",
                "steps": [
                  "1. Disconnect DC isolator and isolate String 1 and String 2 arrays.",
                  "2. Use 1000V Megohmmeter (Megger) to test Insulation Resistance between PV+ to Ground and PV- to Ground.",
                  "3. Minimum acceptable reading is 1.0 MΩ. If reading < 1.0 MΩ, inspect array MC4 connectors for moisture.",
                  "4. Replace damaged DC cable or re-crimp IP68 weather-sealed MC4 connectors."
                ],
                "safety_warning": "⚡ DC HIGH VOLTAGE RISK: Solar arrays remain energized under sunlight even when disconnected from inverter.",
                "suggested_kb_title": "Rooftop Cable Management & Weather-Sealing Best Practices",
                "recommended_training_module": "Level 1: Solar PV Rooftop Mounting & Cable Routing"
            }
        }

    return {
        "success": True,
        "diagnosis": {
            "error_code": req.error_code or "DIAG-GEN",
            "title": "Solar Array Field Diagnostic Guide",
            "severity": "Medium",
            "cause": f"Field query: '{req.query}'. General operational anomaly detected.",
            "steps": [
              "1. Perform visual inspection of DC array wiring, AC breaker trip status, and inverter display LED codes.",
              "2. Verify string VOC voltages using DC Voltmeter under open-circuit conditions.",
              "3. Check thermal imaging camera for hot spots on PV panel junction boxes and AC breaker contacts.",
              "4. If anomaly persists, escalate case to Level 3 Senior System Engineer via GET Solar Portal."
            ],
            "safety_warning": "⚠️ ALWAYS FOLLOW SITE SAFETY PROTOCOLS: Personal Protective Equipment (PPE) is mandatory.",
            "suggested_kb_title": "Standard Field Inspection Checklists & Troubleshooting",
            "recommended_training_module": "Level 2: High-Voltage Safety & System Audits"
        }
    }
