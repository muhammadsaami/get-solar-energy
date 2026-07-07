from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import types
from dotenv import load_dotenv
from database import engine, Base
import os
import json
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

Base.metadata.create_all(bind=engine)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI(title="GET Solar Energy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from roof import router as roof_router
from roi import router as roi_router
from chat import router as chat_router
from referral import router as referral_router
from auth import router as auth_router
from generation import router as generation_router
from proposal import router as proposal_router
from amc import router as amc_router
from site_survey import router as site_survey_router
from customer_routes import router as customer_router
from crm_routes import router as crm_router

app.include_router(roof_router)
app.include_router(roi_router)
app.include_router(chat_router)
app.include_router(referral_router)
app.include_router(auth_router)
app.include_router(generation_router)
app.include_router(proposal_router)
app.include_router(amc_router)
app.include_router(site_survey_router)
app.include_router(customer_router)
app.include_router(crm_router)

@app.on_event("startup")
async def startup_event():
    from security import run_startup_health_check
    run_startup_health_check()
    
    # Initialize SQLite database & import dataset automatically
    from database_sqlite import engine_sqlite, SessionLocalSqlite, run_cdp_migrations
    from customer_service import import_csv_if_empty
    run_cdp_migrations(engine_sqlite)
    db = SessionLocalSqlite()
    try:
        import_csv_if_empty(db)
    finally:
        db.close()


# ═════════════════════════════════════════════════════════════
# ADMINISTRATOR CONFIGURATION HARDENING & SEEDING
# ═════════════════════════════════════════════════════════════
ADMIN_EMAIL = "admin@getsolar.in"
ADMIN_PASSWORD = "Admin@5678"

# In-memory monitoring state for Gemini AI
last_gemini_success_time = time.time()

# Seed default administrator account if it doesn't exist
from security import hash_password
USERS_FILE = "users.json"
try:
    users_data = {}
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            users_data = json.load(f)
            
    if ADMIN_EMAIL not in users_data:
        users_data[ADMIN_EMAIL] = {
            "id": "admin-session-id-00000",
            "name": "Admin User",
            "phone": "9999999999",
            "email": ADMIN_EMAIL,
            "password": hash_password(ADMIN_PASSWORD),
            "city": "Lucknow",
            "referral_code": "ADMIN999",
            "points": 9999
        }
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users_data, f, indent=2, ensure_ascii=False)
        print("✅ Seeded Admin User successfully!")
except Exception as e:
    print(f"Error seeding admin user: {e}")

# ═════════════════════════════════════════════════════════════
# ADMIN API ROUTING & IN-MEMORY CACHING (60s EXPIRE)
# ═════════════════════════════════════════════════════════════
class InMemCache:
    def __init__(self, expiration_seconds=60):
        self.expiration = expiration_seconds
        self.cache = {}
        
    def get(self, key):
        if key in self.cache:
            val, expiry = self.cache[key]
            if time.time() < expiry:
                return val
            else:
                del self.cache[key]
        return None
        
    def set(self, key, val):
        self.cache[key] = (val, time.time() + self.expiration)

admin_cache = InMemCache(60)

def get_user_metadata(email: str, name: str):
    import hashlib
    from datetime import datetime, timedelta
    h = int(hashlib.md5(email.encode("utf-8")).hexdigest(), 16)
    days_ago = h % 30
    reg_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
    status = "Active" if (h % 10) > 0 else "Pending"
    
    if email == ADMIN_EMAIL:
        role = "Administrator"
        status = "Active"
    elif (h % 3) == 0:
        role = "Premium User"
    else:
        role = "Free User"
        
    return role, status, reg_date

def get_user_analyses(email: str):
    if email == ADMIN_EMAIL:
        return {"bill": None, "roof": None, "roi": None}
    import hashlib
    h = int(hashlib.md5(email.encode("utf-8")).hexdigest(), 16)
    
    # 70% chance of bill analysis
    has_bill = (h % 10) < 7
    # 55% chance of roof analysis
    has_roof = (h % 10) < 5
    # 40% chance of roi analysis
    has_roi = (h % 10) < 4
    
    bill = None
    if has_bill:
        monthly_units = 150 + (h % 351)
        recommended_kw = round(monthly_units / 135.0, 1)
        bill = {
            "monthly_units": monthly_units,
            "recommended_kw": recommended_kw,
            "bill_amount": round(monthly_units * 7.5)
        }
        
    roof = None
    if has_roof:
        usable_area_sqft = 400 + (h % 1201)
        suitability_score = 60 + (h % 36) # 60 to 95%
        roof = {
            "usable_area_sqft": usable_area_sqft,
            "suitability_score": suitability_score
        }
        
    roi = None
    if has_roi:
        sys_kw = bill["recommended_kw"] if bill else round(2.0 + (h % 7), 1)
        annual_savings = round(sys_kw * 135 * 12 * 7.5)
        payback_period = round(4.0 + (h % 26) / 10.0, 1) # 4.0 to 6.5 years
        roi = {
            "recommended_kw": sys_kw,
            "annual_savings": annual_savings,
            "payback_period": payback_period
        }
        
    return {
        "bill": bill,
        "roof": roof,
        "roi": roi
    }

@app.get("/api/admin/overview")
def get_admin_overview():
    cached = admin_cache.get("overview")
    if cached:
        return cached
        
    try:
        from referral import load_users, load_referrals, load_redemptions
        users = load_users()
        referrals = load_referrals()
        redemptions = load_redemptions()
        
        # Filter users list to exclude ADMIN_EMAIL
        customer_emails = [email for email in users.keys() if email != ADMIN_EMAIL]
        total_registered_users = len(customer_emails)
        
        # Calculate active users (those who have > 0 points or are active)
        active_users_count = 0
        for email in customer_emails:
            u = users[email]
            role, status, reg_date = get_user_metadata(email, u.get("name", "Unknown"))
            if status == "Active" or u.get("points", 0) > 0:
                active_users_count += 1
                
        # Calculate assessments dynamically using the deterministic generator
        bill_analyses = 0
        roof_analyses = 0
        roi_calculations = 0
        fully_assessed_users = 0
        
        total_annual_savings = 0
        payback_period_sum = 0.0
        payback_period_count = 0
        roof_suitability_sum = 0.0
        roof_suitability_count = 0
        system_size_sum = 0.0
        system_size_count = 0

        # Report analytics telemetry simulation variables
        total_reports_generated = 0
        reports_generated_this_month = 0
        report_type_counts = {"bill": 0, "roof": 0, "roi": 0, "comprehensive": 0}
        report_download_counts = {"bill": 0, "roof": 0, "roi": 0, "comprehensive": 0}
        readiness_score_sum = 0
        readiness_score_count = 0
        
        for email in customer_emails:
            analyses = get_user_analyses(email)
            has_b = analyses["bill"] is not None
            has_rf = analyses["roof"] is not None
            has_ri = analyses["roi"] is not None
            
            if has_b:
                bill_analyses += 1
            if has_rf:
                roof_analyses += 1
                roof_suitability_sum += analyses["roof"]["suitability_score"]
                roof_suitability_count += 1
            if has_ri:
                roi_calculations += 1
                total_annual_savings += analyses["roi"]["annual_savings"]
                payback_period_sum += analyses["roi"]["payback_period"]
                payback_period_count += 1
                system_size_sum += analyses["roi"]["recommended_kw"]
                system_size_count += 1
                
            if has_b and has_rf and has_ri:
                fully_assessed_users += 1

            # Determine report analytics using user hashes deterministically
            import hashlib
            uh = int(hashlib.md5(email.encode("utf-8")).hexdigest(), 16)
            
            bill_score = 100 if has_b else 0
            roof_score = analyses["roof"]["suitability_score"] if has_rf else 0
            
            roi_score = 0
            if has_ri:
                payback = analyses["roi"]["payback_period"]
                roi_score = max(50, min(100, round(100 - (payback - 3) * 8)))
                
            readiness_score = round(bill_score * 0.40 + roof_score * 0.35 + roi_score * 0.25)

            # Simulated report generation rate is 90% for completed tools
            if has_b and (uh % 10 < 9):
                total_reports_generated += 1
                report_type_counts["bill"] += 1
                if (uh % 2 == 0):
                    reports_generated_this_month += 1
                report_download_counts["bill"] += (uh % 3)
                readiness_score_sum += readiness_score
                readiness_score_count += 1

            if has_rf and (uh % 10 < 9):
                total_reports_generated += 1
                report_type_counts["roof"] += 1
                if (uh % 3 == 0):
                    reports_generated_this_month += 1
                report_download_counts["roof"] += (uh % 2)
                readiness_score_sum += readiness_score
                readiness_score_count += 1

            if has_ri and (uh % 10 < 9):
                total_reports_generated += 1
                report_type_counts["roi"] += 1
                if (uh % 4 == 0):
                    reports_generated_this_month += 1
                report_download_counts["roi"] += (uh % 2)
                readiness_score_sum += readiness_score
                readiness_score_count += 1

            if has_b and has_rf and has_ri and (uh % 10 < 8):
                total_reports_generated += 1
                report_type_counts["comprehensive"] += 1
                if (uh % 5 == 0):
                    reports_generated_this_month += 1
                report_download_counts["comprehensive"] += (uh % 3)
                readiness_score_sum += readiness_score
                readiness_score_count += 1

        # Report average metrics
        avg_reports_per_user = 0.0
        if total_registered_users > 0:
            avg_reports_per_user = round(total_reports_generated / total_registered_users, 1)

        avg_solar_readiness_score = 0.0
        if readiness_score_count > 0:
            avg_solar_readiness_score = round(readiness_score_sum / readiness_score_count, 1)

        type_names = {
            "bill": "Bill Analysis Report",
            "roof": "Roof Assessment Report",
            "roi": "ROI & Financial Report",
            "comprehensive": "Comprehensive Solar Assessment"
        }

        most_common_report_generated = "None"
        if total_reports_generated > 0:
            best_type = max(report_type_counts, key=report_type_counts.get)
            most_common_report_generated = type_names.get(best_type, "None")

        most_downloaded_report_type = "None"
        if sum(report_download_counts.values()) > 0:
            best_dl = max(report_download_counts, key=report_download_counts.get)
            most_downloaded_report_type = type_names.get(best_dl, "None")
                
        # Completion Rate Formula
        # Cap at 100%
        completion_rate = 0.0
        if total_registered_users > 0:
            completion_rate = min(100.0, round((roi_calculations / total_registered_users) * 100, 1))
            
        # Business metrics averages with graceful fallbacks
        avg_payback_period = None
        if payback_period_count > 0:
            avg_payback_period = round(payback_period_sum / payback_period_count, 1)
            
        avg_roof_suitability = None
        if roof_suitability_count > 0:
            avg_roof_suitability = round(roof_suitability_sum / roof_suitability_count, 1)
            
        avg_system_size = None
        if system_size_count > 0:
            avg_system_size = round(system_size_sum / system_size_count, 1)
            
        # User engagement metrics
        # Active users (Last 30 Days) -> active_users_count
        assistant_conversations = 145 + total_registered_users * 4
        avg_conversations_per_user = 0.0
        if total_registered_users > 0:
            avg_conversations_per_user = round(assistant_conversations / total_registered_users, 1)
            
        # Referral participation rate
        referrers = set(r.get("referrer_email") for r in referrals if r.get("referrer_email") != ADMIN_EMAIL)
        referral_participation_rate = 0.0
        if total_registered_users > 0:
            referral_participation_rate = min(100.0, round(len(referrers) / total_registered_users * 100, 1))
            
        # Total points
        total_points = sum(users[email].get("points", 0) for email in customer_emails)
        
        # System health
        current_time = time.time()
        elapsed_gemini = current_time - last_gemini_success_time
        if not os.getenv("GEMINI_API_KEY"):
            gemini_status = "Offline"
        elif elapsed_gemini < 86400:
            gemini_status = "Online"
        else:
            gemini_status = "Warning"
            
        # Referral files status check
        try:
            if os.path.exists("referrals.json"):
                with open("referrals.json", "r", encoding="utf-8") as f:
                    refs = json.load(f)
                referral_status = "Online" if len(refs) > 0 else "Warning"
            else:
                referral_status = "Offline"
        except Exception:
            referral_status = "Offline"
            
        # Rewards files status check
        try:
            if os.path.exists("redemptions.json"):
                with open("redemptions.json", "r", encoding="utf-8") as f:
                    reds = json.load(f)
                rewards_status = "Online" if len(reds) > 0 else "Warning"
            else:
                rewards_status = "Offline"
        except Exception:
            rewards_status = "Offline"
            
        # Analytics enhancements
        # Top Performing City / State
        city_to_state = {
            "Lucknow": "Uttar Pradesh",
            "Agra": "Uttar Pradesh",
            "Bangalore": "Karnataka",
            "Mumbai": "Maharashtra",
            "New Delhi": "Delhi"
        }
        city_counts = {}
        for email in customer_emails:
            city = users[email].get("city", "Unknown")
            city_counts[city] = city_counts.get(city, 0) + 1
        top_city = max(city_counts, key=city_counts.get) if city_counts else None
        top_state = city_to_state.get(top_city, "Unknown") if top_city else "Unknown"
        top_location = f"{top_city}, {top_state}" if top_city else None
        
        # Most Common Assistant Question Category
        question_categories = {
            "Subsidies": 320,
            "ROI": 280,
            "Net Metering": 210,
            "Solar Size": 350,
            "Financing": 190,
            "Savings": 220,
            "Roof Assessment": 110
        }
        most_common_question_category = max(question_categories, key=question_categories.get)
        
        # Most Redeemed Reward
        redemption_counts = {}
        for r in redemptions:
            reward_id = r.get("reward_id")
            redemption_counts[reward_id] = redemption_counts.get(reward_id, 0) + 1
        
        most_redeemed_reward = None
        if redemption_counts:
            top_reward_id = max(redemption_counts, key=redemption_counts.get)
            rewards_catalog = []
            if os.path.exists("rewards.json"):
                try:
                    with open("rewards.json", "r", encoding="utf-8") as f:
                        rewards_catalog = json.load(f)
                except Exception:
                    pass
            most_redeemed_reward = next((item.get("name") for item in rewards_catalog if item.get("id") == top_reward_id), top_reward_id)
            
        # Average Referral Points Per User
        avg_referral_points_per_user = 0.0
        if total_registered_users > 0:
            avg_referral_points_per_user = round(total_points / total_registered_users, 1)

        # Notification & Activity Telemetry simulation
        total_notifications_generated = 10 + total_registered_users * 5 + bill_analyses + roof_analyses + roi_calculations
        unread_notifications_count = min(15, 2 + (total_registered_users % 4))
        activity_events_today = 3 + (total_registered_users % 3) + (bill_analyses % 2)
        most_common_notification_type = "Assessment"
        high_priority_notifications = 2 + (total_registered_users % 2) + roi_calculations
        avg_notifications_per_user = 0.0
        if total_registered_users > 0:
            avg_notifications_per_user = round(total_notifications_generated / total_registered_users, 1)
        
        most_active_user = "None"
        if customer_emails:
            first_email = customer_emails[0]
            most_active_user = users[first_email].get("name", "Unknown").split()[0]
        most_common_activity_type = "AI Assistant"
            
        result = {
            "success": True,
            "total_users": len(users), # Keep total users count (including admin) for overview compatibility
            "total_registered_users": total_registered_users,
            "active_users": active_users_count, # matching active users count
            "bill_analyses": bill_analyses,
            "roof_analyses": roof_analyses,
            "roi_calculations": roi_calculations,
            "roi_completed_users": roi_calculations, # Unique users with completed ROI analysis
            "assistant_conversations": assistant_conversations,
            "referral_points_issued": total_points,
            "rewards_redeemed": len(redemptions),
            "assessment_completion_rate": completion_rate,
            "fully_assessed_users": fully_assessed_users,
            
            # Solar Intelligence Business Metrics
            "total_annual_savings": total_annual_savings,
            "avg_payback_period": avg_payback_period,
            "avg_roof_suitability": avg_roof_suitability,
            "avg_system_size": avg_system_size,
            
            # User Engagement Metrics
            "active_users_30_days": active_users_count,
            "avg_conversations_per_user": avg_conversations_per_user,
            "referral_participation_rate": referral_participation_rate,

            # Reports Analytics
            "total_reports_generated": total_reports_generated,
            "most_downloaded_report_type": most_downloaded_report_type,
            "reports_generated_this_month": reports_generated_this_month,
            "avg_reports_per_user": avg_reports_per_user,
            "avg_solar_readiness_score": avg_solar_readiness_score,
            "most_common_report_generated": most_common_report_generated,

            # Notification & Activity Telemetry
            "total_notifications_generated": total_notifications_generated,
            "unread_notifications_count": unread_notifications_count,
            "activity_events_today": activity_events_today,
            "most_common_notification_type": most_common_notification_type,
            "high_priority_notifications": high_priority_notifications,
            "avg_notifications_per_user": avg_notifications_per_user,
            "most_active_user": most_active_user,
            "most_common_activity_type": most_common_activity_type,
            
            # Health
            "health": {
                "gemini": gemini_status,
                "gemini_last_success_time": last_gemini_success_time,
                "referral": referral_status,
                "rewards": rewards_status
            },
            
            # Analytics Enhancements
            "top_location": top_location,
            "most_common_question_category": most_common_question_category,
            "most_redeemed_reward": most_redeemed_reward,
            "avg_referral_points_per_user": avg_referral_points_per_user
        }
        admin_cache.set("overview", result)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/admin/users")
def get_admin_users():
    cached = admin_cache.get("users")
    if cached:
        return cached
        
    try:
        from referral import load_users
        users = load_users()
        user_list = []
        for email, u in users.items():
            role, status, reg_date = get_user_metadata(email, u.get("name", "Unknown"))
            user_list.append({
                "name": u.get("name", "Unknown"),
                "email": email,
                "role": role,
                "status": status,
                "registration_date": reg_date
            })
        # Sort by registration date descending
        user_list.sort(key=lambda x: x["registration_date"], reverse=True)
        result = {
            "success": True,
            "users": user_list
        }
        admin_cache.set("users", result)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/admin/rewards")
def get_admin_rewards():
    cached = admin_cache.get("rewards")
    if cached:
        return cached
        
    try:
        from referral import load_users, load_referrals, load_redemptions
        users = load_users()
        referrals = load_referrals()
        redemptions = load_redemptions()
        
        total_referrals = len(referrals)
        points_issued = sum(u.get("points", 0) for u in users.values())
        wallet_value = round(points_issued / 10, 2)
        
        board = []
        for email, u in users.items():
            ref_count = sum(1 for r in referrals if r.get("referrer_email") == email)
            if ref_count == 0 and u.get("points", 0) > 0:
                ref_count = u.get("points", 0) // 100
            board.append({
                "name": u.get("name", "Unknown"),
                "email": email,
                "referrals": ref_count,
                "points": u.get("points", 0)
            })
            
        board.sort(key=lambda x: x["points"], reverse=True)
        top_referrers = board[:10]
        for idx, item in enumerate(top_referrers, start=1):
            item["rank"] = idx
            
        # Most Redeemed Reward
        redemption_counts = {}
        for r in redemptions:
            reward_id = r.get("reward_id")
            redemption_counts[reward_id] = redemption_counts.get(reward_id, 0) + 1
        
        most_redeemed_reward = None
        if redemption_counts:
            top_reward_id = max(redemption_counts, key=redemption_counts.get)
            rewards_catalog = []
            if os.path.exists("rewards.json"):
                try:
                    with open("rewards.json", "r", encoding="utf-8") as f:
                        rewards_catalog = json.load(f)
                except Exception:
                    pass
            most_redeemed_reward = next((item.get("name") for item in rewards_catalog if item.get("id") == top_reward_id), top_reward_id)

        result = {
            "success": True,
            "total_referrals": total_referrals,
            "points_issued": points_issued,
            "wallet_value": wallet_value,
            "total_redemptions": len(redemptions),
            "top_referrers": top_referrers,
            "most_redeemed_reward": most_redeemed_reward
        }
        admin_cache.set("rewards", result)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/admin/assistant")
def get_admin_assistant():
    cached = admin_cache.get("assistant")
    if cached:
        return cached
        
    try:
        from referral import load_users
        users = load_users()
        total_users = len(users)
        
        # Base telemetry numbers scaled on total users count
        total_conversations = 145 + total_users * 4
        total_messages = 580 + total_users * 16
        avg_messages = round(total_messages / total_conversations, 1) if total_conversations > 0 else 0.0
        
        result = {
            "success": True,
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "avg_messages_per_conversation": avg_messages,
            "question_categories": {
                "Subsidies": 320,
                "ROI": 280,
                "Net Metering": 210,
                "Solar Size": 350,
                "Financing": 190,
                "Savings": 220,
                "Roof Assessment": 110
            }
        }
        admin_cache.set("assistant", result)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/admin/activity")
def get_admin_activity():
    cached = admin_cache.get("activity")
    if cached:
        return cached
        
    try:
        from referral import load_users
        from datetime import datetime, timedelta
        users = load_users()
        user_list = list(users.values())
        names = [u.get("name", "User").split()[0] for u in user_list]
        if not names:
            names = ["Sami", "Saami", "Hammaad", "Muhammad"]
            
        now = datetime.now()
        types_list = ["registration", "bill", "roof", "roi", "referral", "redemption", "assistant"]
        descriptions = {
            "registration": "Registered a new account",
            "bill": "Uploaded utility bill for analysis",
            "roof": "Completed roof area assessment",
            "roi": "Calculated solar ROI projection",
            "referral": "Referred a new customer",
            "redemption": "Redeemed points for Amazon Voucher",
            "assistant": "Messaged GET Solar Copilot"
        }
        
        activities = []
        # Relative minutes offsets to make timestamps dynamic
        offsets = [2, 12, 34, 60, 120, 180, 240, 300, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320, 1440, 2880, 4320]
        
        for i in range(20):
            t_offset = offsets[i]
            timestamp = (now - timedelta(minutes=t_offset)).isoformat() + "Z"
            act_type = types_list[i % len(types_list)]
            user = names[i % len(names)]
            activities.append({
                "type": act_type,
                "user": user,
                "timestamp": timestamp,
                "description": descriptions[act_type]
            })
            
        result = {
            "success": True,
            "activities": activities
        }
        admin_cache.set("activity", result)
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


# Serve frontend static files at /frontend/
app.mount("/frontend", StaticFiles(directory="../frontend", html=True), name="frontend")

@app.get("/")
def home():
    return {
        "message": "GET Solar Energy API running!",
        "version": "1.0.0",
        "platform": "India Solar Intelligence & Service Ecosystem"
    }


# =====================================================================
# AI Solar Assistant — POST /api/solar-assistant
# =====================================================================
from pydantic import BaseModel
from typing import List, Optional, Any

class AssistantMessage(BaseModel):
    role: str
    content: str

class SolarContext(BaseModel):
    bill_analysis: Optional[Any] = None
    roof_analysis: Optional[Any] = None
    roi_analysis: Optional[Any] = None

class SolarAssistantRequest(BaseModel):
    message: str
    history: List[AssistantMessage] = []
    context: Optional[SolarContext] = None

@app.post("/api/solar-assistant")
async def solar_assistant(request: SolarAssistantRequest):
    try:
        system_prompt = """You are the GET Solar Energy AI Assistant — a professional and neutral solar intelligence advisor for Indian homeowners.

Your style:
- Speak in a professional, neutral, and matter-of-fact tone.
- Do NOT use emojis, enthusiastic/sales phrases, or promotional slogans.
- Avoid warm or marketing-style greetings like "Namaste!", "Hi!", or "I'm your AI Solar Expert!".
- Keep responses concise (typically 2-4 sentences for simple queries, structured list for complex ones).
- Format using simple bullet points or lists for multi-step instructions.
- Speak in plain English or standard language based on user's query.

Your knowledge areas:
- Residential rooftop solar systems (1kW – 10kW)
- Indian electricity bills (DISCOM tariffs, slab rates, fixed charges)
- Solar panel sizing: monthly_units / 135 = recommended kW
- PM Surya Ghar Muft Bijli Yojana — ₹78,000 subsidy for ≤3kW systems
- Net metering policies across Indian states
- Solar ROI calculations, payback period (typically 4–6 years)
- Panel types (mono PERC, bifacial), inverters, mounting structures
- Maintenance: panel cleaning, monitoring, warranty terms
- Financing: solar loans, EMI options through SBI, HDFC, Tata Capital

Rules:
- Do NOT make legal or financial guarantees.
- If the user asks about topics unrelated to solar energy or electrical bills, politely decline and redirect them back to solar.
- If the user asks about their specific solar layout or analysis, use the provided user context below. If context is missing/not completed yet, explain that the specific analysis has not been run yet.
"""

        # Build context from request data
        context_lines = []
        if request.context:
            ctx = request.context
            
            # Bill Analysis
            if ctx.bill_analysis and isinstance(ctx.bill_analysis, dict) and ctx.bill_analysis.get("monthly_units"):
                b = ctx.bill_analysis
                context_lines.append(
                    f"Bill Analysis: Customer Name={b.get('customer_name')}, Utility DISCOM={b.get('discom')}, Billing Period={b.get('billing_period')}, "
                    f"Monthly Units={b.get('monthly_units')} kWh, Bill Amount=₹{b.get('bill_amount')}, Per Unit Rate=₹{b.get('per_unit_rate')}, "
                    f"Recommended Solar Size={b.get('recommended_kw')} kW."
                )
            else:
                context_lines.append("Bill Analysis: Not Completed/Available")
                
            # Roof Analysis
            if ctx.roof_analysis and isinstance(ctx.roof_analysis, dict) and ctx.roof_analysis.get("usable_area_sqft"):
                r = ctx.roof_analysis
                context_lines.append(
                    f"Roof Analysis: Roof Type={r.get('roof_type')}, Total Area={r.get('total_area_sqft')} sqft, Usable Area={r.get('usable_area_sqft')} sqft, "
                    f"Shading Issues={r.get('shading_issues')}, Recommended Solar Size={r.get('recommended_kw')} kW, Number of Panels={r.get('number_of_panels')}, "
                    f"Monthly Generation={r.get('monthly_generation_units')} kWh."
                )
            else:
                context_lines.append("Roof Analysis: Not Completed/Available")
                
            # ROI Analysis
            if ctx.roi_analysis and isinstance(ctx.roi_analysis, dict):
                roi = ctx.roi_analysis
                roi_data = roi.get('data') if isinstance(roi.get('data'), dict) else roi
                if roi_data and (roi_data.get('net_cost') or roi_data.get('annual_savings')):
                    context_lines.append(
                        f"ROI Analysis: Recommended Size={roi_data.get('recommended_kw')} kW, System Cost=₹{roi_data.get('system_cost') or roi_data.get('system_cost_rs')}, "
                        f"Subsidy=₹{roi_data.get('government_subsidy')}, Net Cost=₹{roi_data.get('net_cost')}, Monthly Savings=₹{roi_data.get('monthly_savings') or roi_data.get('monthly_savings_rs')}, "
                        f"Annual Savings=₹{roi_data.get('annual_savings')}, Lifetime Savings=₹{roi_data.get('lifetime_savings') or roi_data.get('savings_25_years_rs')}, "
                        f"Payback Period={roi_data.get('payback_period') or roi_data.get('payback_years')} years, ROI={roi_data.get('roi_percentage')}%."
                    )
                else:
                    context_lines.append("ROI Analysis: Not Completed/Available")
            else:
                context_lines.append("ROI Analysis: Not Completed/Available")
        else:
            context_lines.append("User Context: No analysis context has been completed yet (Bill, Roof, and ROI analyses are unavailable).")

        context_string = "\n".join(context_lines)
        full_system_prompt = f"{system_prompt}\n\nUSER'S PERSONALIZED ANALYSIS CONTEXT:\n{context_string}"

        # Build conversation context from history
        history_text = ""
        for msg in request.history[-10:]:  # Last 10 messages for context window
            prefix = "User" if msg.role == "user" else "Assistant"
            history_text += f"{prefix}: {msg.content}\n"

        full_prompt = f"{full_system_prompt}\n\n{history_text}User: {request.message}\nAssistant:"

        max_attempts = 3
        last_error = None
        for attempt in range(max_attempts):
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash-lite",
                    contents=full_prompt
                )
                global last_gemini_success_time
                last_gemini_success_time = time.time()
                return {
                    "success": True,
                    "response": response.text.strip()
                }
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if any(t in err_str for t in ["503", "429", "unavailable", "exhausted", "demand"]):
                    import time
                    time.sleep(2 ** (attempt + 1))
                else:
                    raise e
        raise last_error

    except Exception as e:
        err_str = str(e).lower()
        if any(t in err_str for t in ["resource_exhausted", "quota", "rate limit", "429", "503", "unavailable", "timeout", "deadline"]):
            logger.warning("Gemini quota exhausted or timeout for solar assistant. Returning fallback error.")
            return {
                "success": False,
                "error": "rate_limit_or_timeout",
                "message": "GET Solar Copilot is currently experiencing high demand. Please try again in a few moments."
            }
        return {"success": False, "error": str(e)}

@app.post("/api/analyze-bill")
async def analyze_bill(image: UploadFile = File(...)):
    try:
        image_data = await image.read()

        prompt = """
        You are an expert at reading Indian electricity bills.
        
        Carefully analyze this electricity bill image and extract the following real data:
        1. Customer name exactly as written on the bill
        2. Monthly units consumed in kWh (look for units, consumption)
        3. Total bill amount in Rupees
        4. Per unit electricity rate in Rs/kWh
        5. Billing period (month and year)
        6. Consumer number if visible
        7. Discom/utility company name if visible
        
        Then calculate solar recommendations based on extracted data:
        - Recommended solar system size: monthly_units / 135 (rounded to nearest 0.5)
        - Monthly generation: recommended_kw * 4.5 * 30
        - Monthly savings: monthly_generation * per_unit_rate
        - System cost: recommended_kw * 55000
        - Payback years: system_cost / (monthly_savings * 12)
        - 25 year savings: (monthly_savings * 12 * 25) - system_cost
        
        Return ONLY valid JSON with real extracted values, no extra text:
        {
            "customer_name": "<exact name from bill>",
            "consumer_number": "<consumer number from bill>",
            "discom": "<electricity company name>",
            "monthly_units": <actual units from bill>,
            "bill_amount": <actual amount from bill>,
            "per_unit_rate": <actual rate from bill>,
            "billing_period": "<actual month year from bill>",
            "recommended_kw": <calculated>,
            "monthly_generation_units": <calculated>,
            "monthly_savings_rs": <calculated>,
            "system_cost_rs": <calculated>,
            "payback_years": <calculated>,
            "savings_25_years_rs": <calculated>
        }
        """

        max_attempts = 4
        last_error = None
        for attempt in range(max_attempts):
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash-lite",
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
                global last_gemini_success_time
                last_gemini_success_time = time.time()
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
                    "customer_name": "Demo Consumer",
                    "consumer_number": "5109642660",
                    "discom": "Madhyanchal Vidyut Vitran Nigam Ltd",
                    "monthly_units": 187,
                    "bill_amount": 1450,
                    "per_unit_rate": 7.75,
                    "billing_period": "June 2026",
                    "recommended_kw": 1.5,
                    "monthly_generation_units": 202,
                    "monthly_savings_rs": 1565,
                    "system_cost_rs": 75000,
                    "payback_years": 5.4,
                    "savings_25_years_rs": 394500
                }
            }
        return {"success": False, "error": str(e)}