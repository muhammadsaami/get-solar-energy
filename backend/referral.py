from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import json
import os
from datetime import datetime

router = APIRouter()

USERS_FILE = "users.json"
REFERRALS_FILE = "referrals.json"
REWARDS_FILE = "rewards.json"
REDEMPTIONS_FILE = "redemptions.json"

# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------

def load_json(path, default=None):
    """Generic JSON loader with a sensible default."""
    if default is None:
        default = {} if path == USERS_FILE else []
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default


def save_json(path, data):
    """Atomically-ish write JSON back to disk."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_users():
    return load_json(USERS_FILE, {})


def save_users(users):
    save_json(USERS_FILE, users)


def load_referrals():
    return load_json(REFERRALS_FILE, [])


def save_referrals(referrals):
    save_json(REFERRALS_FILE, referrals)


def load_rewards():
    return load_json(REWARDS_FILE, [])


def load_redemptions():
    return load_json(REDEMPTIONS_FILE, [])


def save_redemptions(redemptions):
    save_json(REDEMPTIONS_FILE, redemptions)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ReferralRequest(BaseModel):
    referral_code: str
    new_user_email: str


class PointsRequest(BaseModel):
    email: str


class RedeemRequest(BaseModel):
    email: str
    reward_id: str


# =====================================================================
# 1. EXISTING ENDPOINTS — kept backward-compatible
# =====================================================================

@router.post("/api/referral/apply")
async def apply_referral(data: ReferralRequest):
    try:
        users = load_users()
        referrals = load_referrals()

        referrer = None
        for email, user in users.items():
            if user["referral_code"] == data.referral_code:
                referrer = email
                break

        if not referrer:
            return {"success": False, "error": "Invalid referral code"}

        if data.new_user_email not in users:
            return {"success": False, "error": "New user not found"}

        for r in referrals:
            if r["referred_email"] == data.new_user_email:
                return {"success": False, "error": "Referral already applied"}

        users[referrer]["points"] += 100
        users[data.new_user_email]["points"] += 50
        save_users(users)

        referrals.append({
            "referrer_email": referrer,
            "referred_email": data.new_user_email,
            "referrer_points": 100,
            "referred_points": 50,
            "status": "completed",
            "created_at": datetime.utcnow().isoformat()
        })
        save_referrals(referrals)

        return {
            "success": True,
            "message": "Referral applied!",
            "referrer_points_earned": 100,
            "new_user_points_earned": 50
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/api/referral/points/{email}")
async def get_points(email: str):
    try:
        users = load_users()
        if email not in users:
            return {"success": False, "error": "User not found"}

        return {
            "success": True,
            "email": email,
            "points": users[email]["points"],
            "referral_code": users[email]["referral_code"]
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


# =====================================================================
# 2. NEW: Referral Summary  —  GET /api/referral/summary/{email}
# =====================================================================

@router.get("/api/referral/summary/{email}")
async def get_referral_summary(email: str):
    """Dashboard KPI cards & overview for the referral programme."""
    try:
        users = load_users()
        if email not in users:
            return {"success": False, "error": "User not found"}

        user = users[email]
        referrals = load_referrals()

        # Count referrals where *this* user is the referrer
        my_referrals = [r for r in referrals if r["referrer_email"] == email]
        total = len(my_referrals)
        completed = sum(1 for r in my_referrals if r.get("status") == "completed")
        pending = sum(1 for r in my_referrals if r.get("status") in ("pending", "registered", "qualified"))

        return {
            "success": True,
            "email": email,
            "referral_code": user["referral_code"],
            "total_referrals": total,
            "completed_referrals": completed,
            "pending_referrals": pending,
            "total_points": user.get("points", 0)
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


# =====================================================================
# 3. NEW: Referral History  —  GET /api/referral/history/{email}
# =====================================================================

@router.get("/api/referral/history/{email}")
async def get_referral_history(email: str):
    """Chronological log of all referrals made by a user."""
    try:
        users = load_users()
        if email not in users:
            return {"success": False, "error": "User not found"}

        referrals = load_referrals()
        my_referrals = [r for r in referrals if r["referrer_email"] == email]

        history = []
        for r in my_referrals:
            referred_user = users.get(r["referred_email"], {})
            history.append({
                "referred_email": r["referred_email"],
                "referred_name": referred_user.get("name", "Unknown"),
                "points_earned": r.get("referrer_points", 100),
                "status": r.get("status", "completed"),
                "date": r.get("created_at", None)
            })

        # Most-recent first
        history.sort(key=lambda h: h.get("date") or "", reverse=True)

        return {
            "success": True,
            "email": email,
            "referral_history": history
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


# =====================================================================
# 4. NEW: Leaderboard  —  GET /api/referral/leaderboard
# =====================================================================

@router.get("/api/referral/leaderboard")
async def get_leaderboard():
    """Top-10 users ranked by total points."""
    try:
        users = load_users()

        board = []
        for email, user in users.items():
            board.append({
                "name": user.get("name", "Unknown"),
                "email": email,
                "points": user.get("points", 0),
                "referral_code": user.get("referral_code", "")
            })

        board.sort(key=lambda u: u["points"], reverse=True)
        top_10 = board[:10]

        # Attach rank
        for idx, entry in enumerate(top_10, start=1):
            entry["rank"] = idx

        return {
            "success": True,
            "leaderboard": top_10
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


# =====================================================================
# 5. NEW: Wallet  —  GET /api/referral/wallet/{email}
# =====================================================================

@router.get("/api/referral/wallet/{email}")
async def get_wallet(email: str):
    """Points balance, ₹-equivalent, and recent transactions."""
    try:
        users = load_users()
        if email not in users:
            return {"success": False, "error": "User not found"}

        user = users[email]
        total_points = user.get("points", 0)
        wallet_value = round(total_points / 10, 2)  # ₹1 per 10 points

        # Build transaction list from referrals + redemptions
        referrals = load_referrals()
        redemptions = load_redemptions()

        transactions = []

        # Credits: points earned from referring
        for r in referrals:
            if r["referrer_email"] == email:
                transactions.append({
                    "type": "credit",
                    "description": f"Referral bonus — {r['referred_email']}",
                    "points": r.get("referrer_points", 100),
                    "date": r.get("created_at")
                })
            elif r["referred_email"] == email:
                transactions.append({
                    "type": "credit",
                    "description": "Sign-up referral bonus",
                    "points": r.get("referred_points", 50),
                    "date": r.get("created_at")
                })

        # Debits: points spent on redemptions
        for rd in redemptions:
            if rd.get("email") == email:
                transactions.append({
                    "type": "debit",
                    "description": f"Redeemed — {rd.get('reward_name', rd.get('reward_id', 'Reward'))}",
                    "points": -rd.get("points_spent", 0),
                    "date": rd.get("redeemed_at")
                })

        transactions.sort(key=lambda t: t.get("date") or "", reverse=True)

        return {
            "success": True,
            "email": email,
            "total_points": total_points,
            "wallet_balance_rs": wallet_value,
            "transactions": transactions
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


# =====================================================================
# 6. NEW: Rewards Catalog  —  GET /api/referral/rewards
# =====================================================================

@router.get("/api/referral/rewards")
async def get_rewards():
    """List available rewards that users can redeem points for."""
    try:
        rewards = load_rewards()
        return {
            "success": True,
            "rewards": rewards
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


# =====================================================================
# 7. NEW: Redeem  —  POST /api/referral/redeem
# =====================================================================

@router.post("/api/referral/redeem")
async def redeem_reward(data: RedeemRequest):
    """Spend points to claim a reward from the catalog."""
    try:
        users = load_users()
        if data.email not in users:
            return {"success": False, "error": "User not found"}

        rewards = load_rewards()
        reward = next((r for r in rewards if r["id"] == data.reward_id), None)
        if not reward:
            return {"success": False, "error": "Reward not found"}

        user = users[data.email]
        current_points = user.get("points", 0)
        required = reward["points_required"]

        if current_points < required:
            return {
                "success": False,
                "error": "Insufficient points",
                "current_points": current_points,
                "required_points": required
            }

        # Deduct points
        user["points"] = current_points - required
        save_users(users)

        # Record redemption
        redemptions = load_redemptions()
        redemption_entry = {
            "email": data.email,
            "reward_id": reward["id"],
            "reward_name": reward["name"],
            "points_spent": required,
            "status": "processing",
            "redeemed_at": datetime.utcnow().isoformat()
        }
        redemptions.append(redemption_entry)
        save_redemptions(redemptions)

        return {
            "success": True,
            "message": f"Redeemed {reward['name']} successfully!",
            "points_spent": required,
            "remaining_points": user["points"],
            "wallet_balance_rs": round(user["points"] / 10, 2)
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


# =====================================================================
# 8. NEW: Analytics (unified)  —  GET /api/referral/analytics/{email}
# =====================================================================

@router.get("/api/referral/analytics/{email}")
async def get_analytics(email: str):
    """Single-call endpoint that hydrates the entire Rewards dashboard."""
    try:
        users = load_users()
        if email not in users:
            return {"success": False, "error": "User not found"}

        user = users[email]
        referrals = load_referrals()
        redemptions = load_redemptions()
        rewards = load_rewards()

        # --- KPI Summary ---
        my_referrals = [r for r in referrals if r["referrer_email"] == email]
        total_referrals = len(my_referrals)
        completed_referrals = sum(1 for r in my_referrals if r.get("status") == "completed")
        pending_referrals = sum(1 for r in my_referrals if r.get("status") in ("pending", "registered", "qualified"))

        total_points = user.get("points", 0)
        wallet_balance = round(total_points / 10, 2)

        # --- Referral history ---
        history = []
        for r in my_referrals:
            referred_user = users.get(r["referred_email"], {})
            history.append({
                "referred_email": r["referred_email"],
                "referred_name": referred_user.get("name", "Unknown"),
                "points_earned": r.get("referrer_points", 100),
                "status": r.get("status", "completed"),
                "date": r.get("created_at")
            })
        history.sort(key=lambda h: h.get("date") or "", reverse=True)

        # --- Leaderboard (top 10) ---
        board = []
        for em, u in users.items():
            board.append({
                "name": u.get("name", "Unknown"),
                "email": em,
                "points": u.get("points", 0)
            })
        board.sort(key=lambda u: u["points"], reverse=True)
        top_10 = board[:10]
        for idx, entry in enumerate(top_10, start=1):
            entry["rank"] = idx

        # Current user's rank
        user_rank = next(
            (idx for idx, b in enumerate(board, start=1) if b["email"] == email),
            None
        )

        # --- Recent redemptions ---
        my_redemptions = [rd for rd in redemptions if rd.get("email") == email]
        my_redemptions.sort(key=lambda rd: rd.get("redeemed_at") or "", reverse=True)

        return {
            "success": True,
            "email": email,
            "referral_code": user["referral_code"],
            "summary": {
                "total_referrals": total_referrals,
                "completed_referrals": completed_referrals,
                "pending_referrals": pending_referrals,
                "total_points": total_points,
                "wallet_balance_rs": wallet_balance
            },
            "referral_history": history,
            "leaderboard": top_10,
            "user_rank": user_rank,
            "rewards_catalog": rewards,
            "redemption_history": my_redemptions
        }

    except Exception as e:
        return {"success": False, "error": str(e)}