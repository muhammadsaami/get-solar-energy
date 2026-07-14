import json
import logging
from datetime import date, timedelta
from sqlalchemy.orm import Session

from project_models import ProjectModel

logger = logging.getLogger(__name__)

STAGES = [
    "initiation", "design", "documentation", "approval",
    "pre-installation", "installation", "commissioning", "completed"
]

CUSTOMERS = [
    {"name": "Rajesh Sharma", "city": "Jaipur", "state": "Rajasthan"},
    {"name": "Priya Patel", "city": "Ahmedabad", "state": "Gujarat"},
    {"name": "Amit Verma", "city": "Lucknow", "state": "Uttar Pradesh"},
    {"name": "Sunita Reddy", "city": "Hyderabad", "state": "Telangana"},
    {"name": "Vikram Singh", "city": "Chandigarh", "state": "Punjab"},
    {"name": "Ananya Gupta", "city": "Indore", "state": "Madhya Pradesh"},
    {"name": "Rohit Joshi", "city": "Pune", "state": "Maharashtra"},
    {"name": "Meera Nair", "city": "Kochi", "state": "Kerala"},
    {"name": "Arjun Desai", "city": "Surat", "state": "Gujarat"},
    {"name": "Kavita Mishra", "city": "Bhopal", "state": "Madhya Pradesh"},
    {"name": "Deepak Kumar", "city": "Patna", "state": "Bihar"},
    {"name": "Neha Kapoor", "city": "Nagpur", "state": "Maharashtra"},
    {"name": "Suresh Iyer", "city": "Coimbatore", "state": "Tamil Nadu"},
    {"name": "Pooja Malhotra", "city": "Lucknow", "state": "Uttar Pradesh"},
    {"name": "Manoj Tiwari", "city": "Varanasi", "state": "Uttar Pradesh"},
    {"name": "Divya Sharma", "city": "Jaipur", "state": "Rajasthan"},
    {"name": "Rahul Mehta", "city": "Mumbai", "state": "Maharashtra"},
    {"name": "Shweta Rao", "city": "Bangalore", "state": "Karnataka"},
]

ENGINEERS = ["Amit Verma", "Sneha Patel", "Raj Kumar", "Priya Singh", "Vikram Bhardwaj"]
TEAMS = ["Team Alpha", "Team Beta", "Team Gamma", "Team Delta"]
INVERTERS = ["Huawei SUN2000-10KTL", "Delta M10A", "Fronius Symo 10kW", "Sungrow SG10K"]
BATTERIES = ["Tesla Powerwall 2", "LG Chem RESU10", "None", "None", "None"]
PRIORITIES = ["low", "medium", "high", "critical"]

PROJECT_DATA = [
    {"priority": "critical", "health": 45, "kw": 10.5, "panels": 26, "stage": "initiation", "value": 495000, "budget_var": 5.2, "timeline_var": 3},
    {"priority": "critical", "health": 62, "kw": 8.2, "panels": 20, "stage": "design", "value": 378000, "budget_var": -3.1, "timeline_var": -2},
    {"priority": "critical", "health": 55, "kw": 5.0, "panels": 13, "stage": "documentation", "value": 225000, "budget_var": 8.5, "timeline_var": 5},
    {"priority": "high", "health": 78, "kw": 15.0, "panels": 38, "stage": "approval", "value": 675000, "budget_var": -5.0, "timeline_var": -1},
    {"priority": "high", "health": 35, "kw": 6.8, "panels": 17, "stage": "pre-installation", "value": 310000, "budget_var": 12.3, "timeline_var": 8},
    {"priority": "high", "health": 70, "kw": 4.2, "panels": 11, "stage": "installation", "value": 195000, "budget_var": 2.1, "timeline_var": 0},
    {"priority": "high", "health": 82, "kw": 7.5, "panels": 19, "stage": "commissioning", "value": 340000, "budget_var": -1.5, "timeline_var": -3},
    {"priority": "medium", "health": 92, "kw": 3.0, "panels": 8, "stage": "completed", "value": 140000, "budget_var": -8.0, "timeline_var": -7},
    {"priority": "medium", "health": 88, "kw": 5.5, "panels": 14, "stage": "completed", "value": 250000, "budget_var": -2.5, "timeline_var": -4},
    {"priority": "medium", "health": 68, "kw": 12.0, "panels": 30, "stage": "design", "value": 540000, "budget_var": 4.5, "timeline_var": 2},
    {"priority": "medium", "health": 58, "kw": 4.8, "panels": 12, "stage": "documentation", "value": 220000, "budget_var": 6.2, "timeline_var": 4},
    {"priority": "medium", "health": 85, "kw": 6.0, "panels": 15, "stage": "approval", "value": 275000, "budget_var": -4.0, "timeline_var": -1},
    {"priority": "low", "health": 95, "kw": 3.5, "panels": 9, "stage": "completed", "value": 160000, "budget_var": -10.0, "timeline_var": -14},
    {"priority": "low", "health": 72, "kw": 9.0, "panels": 23, "stage": "installation", "value": 410000, "budget_var": 3.8, "timeline_var": 1},
    {"priority": "low", "health": 80, "kw": 5.0, "panels": 13, "stage": "pre-installation", "value": 230000, "budget_var": -1.2, "timeline_var": 0},
    {"priority": "low", "health": 90, "kw": 7.0, "panels": 18, "stage": "commissioning", "value": 320000, "budget_var": -6.5, "timeline_var": -5},
    {"priority": "medium", "health": 40, "kw": 11.0, "panels": 28, "stage": "initiation", "value": 500000, "budget_var": 15.0, "timeline_var": 10},
    {"priority": "high", "health": 50, "kw": 6.5, "panels": 16, "stage": "initiation", "value": 295000, "budget_var": 7.8, "timeline_var": 6},
]

TASK_NAMES = [
    "Site Survey", "Load Analysis", "Panel Layout Design", "Electrical Diagram Review",
    "Subsidy Application", "Customer Approval", "Material Procurement", "Roof Preparation",
    "Panel Installation", "Inverter Setup", "Wiring and Cabling", "System Testing",
    "Commissioning", "Customer Handover"
]

ACTIVITY_MESSAGES = [
    "Project moved to {stage} stage",
    "Site survey photos uploaded",
    "Customer signed agreement",
    "Installation completed - {count} panels installed",
    "Quality inspection passed",
    "Safety audit completed with {score}% score",
]


def _make_stage_dates(stage_idx: int, start: date):
    stage_start = {}
    stage_completion = {}
    for s in range(len(STAGES)):
        sid = STAGES[s]
        if s <= stage_idx:
            offset = s * timedelta(days=14)
            stage_start[sid] = (start + offset).isoformat()
            if s < stage_idx:
                stage_completion[sid] = (start + offset + timedelta(days=10)).isoformat()
            else:
                stage_completion[sid] = None
        else:
            stage_start[sid] = None
            stage_completion[sid] = None
    return stage_start, stage_completion


def _make_tasks(index: int, stage_idx: int):
    task_count = min(4 + stage_idx, len(TASK_NAMES))
    tasks = []
    for t in range(task_count):
        status = "completed" if t < task_count * (stage_idx / max(len(STAGES) - 1, 1)) else (
            "in-progress" if t == int(task_count * (stage_idx / max(len(STAGES) - 1, 1))) else "pending"
        )
        tasks.append({
            "id": f"T-{index + 1:03d}-{t:03d}",
            "name": TASK_NAMES[t % len(TASK_NAMES)],
            "status": status,
            "assignedTo": ENGINEERS[t % len(ENGINEERS)],
            "dueDate": (date.today() + timedelta(days=15 * (t + 1))).isoformat(),
            "priority": PRIORITIES[t % len(PRIORITIES)],
        })
    return tasks


def _make_activities(index: int, stage: str, stage_idx: int, start: date):
    activities = []
    activity_types = ["stage_change", "note_added", "task_completed", "document_uploaded", "milestone_reached"]
    for a in range(3 + stage_idx):
        ts = start + timedelta(days=a * 7)
        activities.append({
            "id": f"A-{index + 1:03d}-{a:03d}",
            "type": activity_types[a % len(activity_types)],
            "message": ACTIVITY_MESSAGES[a % len(ACTIVITY_MESSAGES)].format(
                stage=stage, count=5 + a * 5, score=85 + a
            ),
            "timestamp": ts.isoformat() + "T10:00:00",
            "user": ENGINEERS[a % len(ENGINEERS)],
        })
    return activities


def _make_risk_flags(index: int):
    all_risks = ["supply_delay", "weather_delay", "budget_overrun", "permitting_issue", "structural_concern", "customer_change"]
    n_risks = index % 4
    return all_risks[:n_risks]


def _make_notes(index: int):
    templates = [
        "Site visit completed. Roof structure is sound.",
        "Customer confirmed system design approval.",
        "Material delivery scheduled for next week.",
        "Grid interconnection application submitted.",
        "Post-installation training completed with customer.",
        "Final inspection passed. All safety checks cleared.",
    ]
    return templates[: (index % 4) + 1]


def seed_projects_if_empty(db: Session) -> None:
    existing = db.query(ProjectModel).count()
    if existing > 0:
        logger.info(f"Projects table already has {existing} projects — skipping seed")
        return

    base_date = date.today() - timedelta(days=90)

    for i, pd in enumerate(PROJECT_DATA):
        cust = CUSTOMERS[i % len(CUSTOMERS)]
        stage_idx = STAGES.index(pd["stage"])
        start = base_date + timedelta(days=i * 5)
        stage_start, stage_completion = _make_stage_dates(stage_idx, start)
        tasks = _make_tasks(i, stage_idx)
        activities = _make_activities(i, pd["stage"], stage_idx, start)
        risk_flags = _make_risk_flags(i)
        notes = _make_notes(i)

        project = ProjectModel(
            display_id=f"PRJ-{i + 1:03d}",
            title=f"{'Commercial' if cust['name'] in ['Rahul Mehta', 'Shweta Rao', 'Arjun Desai', 'Sunita Reddy'] else 'Residential'} {pd['kw']}kW Solar Installation" if i > 0 else f"Residential {pd['kw']}kW Solar Installation",
            project_type="commercial" if pd["kw"] >= 10 else "residential",
            description=f"Complete solar PV system for {cust['name']} at {cust['city']}. System: {pd['panels']} x 400W panels.",
            customer_name=cust["name"],
            customer_email=cust["name"].lower().replace(" ", ".") + "@example.com",
            customer_phone=f"+91{7000000000 + i * 111111}",
            address=f"{100 + i} {'Green Park' if i % 2 == 0 else 'Sunrise Avenue'}",
            city=cust["city"],
            state=cust["state"],
            pincode=f"{100000 + i * 50000:06d}"[:6],
            status=pd["stage"],
            progress=min(100, round((stage_idx / (len(STAGES) - 1)) * 100)),
            priority=pd["priority"],
            start_date=start,
            target_date=start + timedelta(days=60 + i),
            completed_date=start + timedelta(days=45 + i) if pd["stage"] == "completed" else None,
            assigned_engineer=ENGINEERS[i % len(ENGINEERS)],
            assigned_team=TEAMS[i % len(TEAMS)],
            solar_system_size=pd["kw"],
            panel_count=pd["panels"],
            panel_capacity=400,
            inverter_model=INVERTERS[i % len(INVERTERS)],
            battery_model=BATTERIES[i % len(BATTERIES)],
            total_budget=pd["value"],
            project_value=pd["value"],
            currency="INR",
            budget_variance=pd["budget_var"],
            timeline_variance=pd["timeline_var"],
            health_score=pd["health"],
            quality_score=min(100, pd["health"] + 5),
            safety_score=min(100, pd["health"] + 10),
            notes=json.dumps(notes),
            tasks=json.dumps(tasks),
            activities=json.dumps(activities),
            documents=json.dumps([]),
            risk_flags=json.dumps(risk_flags),
            stage_start_dates=json.dumps(stage_start),
            stage_completion_dates=json.dumps(stage_completion),
        )
        db.add(project)

    db.commit()
    logger.info(f"Seeded {len(PROJECT_DATA)} demo projects")
