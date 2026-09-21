"""
OAuth 2.0 / OpenID Connect Authentication Module for GET Solar Energy.
Provides production-grade, hardened social authentication for Customers
via Google.

Endpoints:
  GET  /api/auth/oauth/{provider}/url       -> Returns authorization URL with state, PKCE, and nonce
  POST /api/auth/oauth/{provider}/callback  -> Exchanges code, verifies OIDC claims, creates/links customer session
"""

import os
import uuid
import secrets
import hashlib
import base64
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Set
from urllib.parse import urlencode

import httpx
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from technician_models import Technician
from auth import load_users, save_users, log_auth_audit
from session_auth import (
    UserSession,
    _create_access_token,
    _new_refresh_token,
    _set_refresh_cookie,
    _device_info,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS_REMEMBER,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth/oauth", tags=["OAuth"])

# Secret key and algorithm for state signing
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or "get-solar-oauth-state-secret-change-in-prod"
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# In-memory consumed state tracker for one-time use / replay protection
_consumed_states: Set[str] = set()
_active_states: Dict[str, float] = {}

STATE_TTL_SECONDS = 600  # 10 minutes


def _clean_expired_states():
    """Purge expired states from memory."""
    now = datetime.utcnow().timestamp()
    expired = [s for s, exp in _active_states.items() if exp < now]
    for s in expired:
        _active_states.pop(s, None)
        _consumed_states.discard(s)


class OAuthCallbackRequest(BaseModel):
    code: str
    state: str


def _get_provider_config(provider: str) -> Dict[str, str]:
    """Retrieve and validate provider environment configuration."""
    p = provider.lower().strip()
    if p == "google":
        client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "").strip()
        if not client_id or not client_secret or not redirect_uri:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google authentication is not configured in this environment. Please configure provider credentials in .env or sign in with your email/password.",
            )
        return {
            "provider": "google",
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "auth_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_endpoint": "https://oauth2.googleapis.com/token",
            "userinfo_endpoint": "https://www.googleapis.com/oauth2/v3/userinfo",
            "scope": "openid email profile",
            "issuer_aliases": ["https://accounts.google.com", "accounts.google.com"],
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider '{provider}'. Supported providers: google.",
        )


def _generate_state_and_pkce(provider: str) -> Dict[str, str]:
    """Generate cryptographically secure state, PKCE challenge/verifier, and nonce."""
    _clean_expired_states()

    raw_state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    code_verifier = secrets.token_urlsafe(64)

    # S256 PKCE Code Challenge
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    code_challenge = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")

    exp_timestamp = datetime.utcnow().timestamp() + STATE_TTL_SECONDS
    payload = {
        "provider": provider.lower(),
        "raw_state": raw_state,
        "nonce": nonce,
        "code_verifier": code_verifier,
        "role": "customer",
        "exp": datetime.utcnow() + timedelta(seconds=STATE_TTL_SECONDS),
        "iat": datetime.utcnow(),
    }

    signed_state = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    _active_states[raw_state] = exp_timestamp

    return {
        "signed_state": signed_state,
        "raw_state": raw_state,
        "nonce": nonce,
        "code_verifier": code_verifier,
        "code_challenge": code_challenge,
    }


def _verify_and_consume_state(signed_state: str, expected_provider: str) -> Dict[str, Any]:
    """Validate signed state, verify expiration, ensure one-time usage, and return payload."""
    _clean_expired_states()
    try:
        payload = jwt.decode(signed_state, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth state has expired. Please try again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state signature.")

    provider = payload.get("provider")
    if provider != expected_provider.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth state provider mismatch. Expected '{expected_provider}', got '{provider}'.",
        )

    raw_state = payload.get("raw_state")
    if not raw_state:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed OAuth state payload.")

    if raw_state in _consumed_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth state has already been used. Please initiate a new login.",
        )

    # Mark consumed
    _consumed_states.add(raw_state)
    _active_states.pop(raw_state, None)

    return payload


@router.get("/{provider}/url")
def get_oauth_authorization_url(provider: str, request: Request):
    """
    Generate provider authorization URL with PKCE (S256), cryptographic nonce,
    and signed tamper-proof state.
    """
    cfg = _get_provider_config(provider)
    sec = _generate_state_and_pkce(cfg["provider"])

    params = {
        "client_id": cfg["client_id"],
        "redirect_uri": cfg["redirect_uri"],
        "response_type": "code",
        "scope": cfg["scope"],
        "state": sec["signed_state"],
        "nonce": sec["nonce"],
        "code_challenge": sec["code_challenge"],
        "code_challenge_method": "S256",
        "prompt": "select_account",
    }

    authorization_url = f"{cfg['auth_endpoint']}?{urlencode(params)}"
    logger.info("Generated %s OAuth authorization URL for client %s...", cfg["provider"], cfg["client_id"][:6])
    return {
        "url": authorization_url,
        "state": sec["signed_state"],
        "provider": cfg["provider"],
    }


@router.post("/{provider}/callback")
async def handle_oauth_callback(
    provider: str,
    data: OAuthCallbackRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Exchange authorization code server-side with the provider, verify OIDC identity claims,
    enforce customer-only role isolation, link existing or initialize fresh customer,
    and establish the application session.
    """
    cfg = _get_provider_config(provider)
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    # 1. State Verification (CSRF, Expire, Nonce, PKCE extraction)
    state_payload = _verify_and_consume_state(data.state, cfg["provider"])
    code_verifier = state_payload.get("code_verifier")
    expected_nonce = state_payload.get("nonce")

    # 2. Server-side Token Exchange
    token_params = {
        "grant_type": "authorization_code",
        "client_id": cfg["client_id"],
        "client_secret": cfg["client_secret"],
        "code": data.code,
        "redirect_uri": cfg["redirect_uri"],
        "code_verifier": code_verifier,
    }

    headers = {"Accept": "application/json"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            token_res = await client.post(cfg["token_endpoint"], data=token_params, headers=headers)
        except Exception as e:
            logger.error("Token exchange network error with %s: %s", cfg["provider"], str(e))
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unable to connect to {cfg['provider']} token service.",
            )

        if token_res.status_code != 200:
            logger.warning("Token exchange failed for %s: %s", cfg["provider"], token_res.text)
            log_auth_audit("unknown", f"{cfg['provider'].upper()}_TOKEN_EXCHANGE_FAILED", client_ip, user_agent)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to authenticate with {cfg['provider']}. Authorization code may be invalid or expired.",
            )

        token_data = token_res.json()
        access_token = token_data.get("access_token")
        id_token = token_data.get("id_token")

        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid response from {cfg['provider']}: missing access token.",
            )

        # 3. ID Token Nonce & Claims Validation (if ID token provided by OIDC provider)
        if id_token:
            try:
                # Decode unverified first to inspect claims
                unverified_claims = jwt.decode(id_token, options={"verify_signature": False})
                # Check expiration
                exp = unverified_claims.get("exp")
                if exp and exp < datetime.utcnow().timestamp():
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identity token expired.")

                # Check audience (must match client_id)
                aud = unverified_claims.get("aud")
                if aud and aud != cfg["client_id"]:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identity token audience mismatch.")

                # Check nonce
                token_nonce = unverified_claims.get("nonce")
                if token_nonce and expected_nonce and token_nonce != expected_nonce:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OIDC nonce validation failed.")

                # Check issuer prefix
                iss = unverified_claims.get("iss", "")
                if cfg["provider"] == "google" and not any(alias in iss for alias in cfg["issuer_aliases"]):
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google token issuer.")
            except jwt.InvalidTokenError as err:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid ID token: {str(err)}")

        # 4. Fetch Verified User Profile
        userinfo_headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
        try:
            userinfo_res = await client.get(cfg["userinfo_endpoint"], headers=userinfo_headers)
        except Exception as e:
            logger.error("Userinfo request failed for %s: %s", cfg["provider"], str(e))
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to fetch user profile from {cfg['provider']}.",
            )

        if userinfo_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to retrieve verified profile from {cfg['provider']}.",
            )

        profile = userinfo_res.json()

    # 5. Extract Identity Claims (Google is the only supported social provider)
    if cfg["provider"] == "google":
        email = profile.get("email", "").lower().strip()
        email_verified = profile.get("email_verified", False)
        name = profile.get("name", "").strip() or email.split("@")[0].capitalize()
        avatar = profile.get("picture", "").strip()
        provider_id = profile.get("sub", "")
        if not email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account email is not verified.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider '{cfg['provider']}'.",
        )

    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Verified email address was not provided by {cfg['provider']}.",
        )

    # 6. Privileged Account Protection & Role Boundary
    # Social authentication is strictly for CUSTOMER role.
    # Reject if an account exists with vendor, technician, or admin role.
    tech_account = db.query(Technician).filter(Technician.email == email).first()
    if tech_account:
        log_auth_audit(email, f"{cfg['provider'].upper()}_LOGIN_REJECTED_TECHNICIAN", client_ip, user_agent)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="An account with this email exists with role 'technician'. Privileged accounts cannot log in via social authentication. Please use the Technician portal.",
        )

    users = load_users()
    existing_user = users.get(email)

    if existing_user:
        existing_role = existing_user.get("role", "customer").lower()
        if existing_role in ["vendor", "admin"]:
            log_auth_audit(email, f"{cfg['provider'].upper()}_LOGIN_REJECTED_{existing_role.upper()}", client_ip, user_agent)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"An account with this email exists with role '{existing_role}'. Privileged accounts cannot log in via social authentication. Please use the designated portal.",
            )

        # Safe Account Linking for Customer
        # Link provider metadata without overwriting any existing customer data
        existing_user["oauth_provider"] = cfg["provider"]
        existing_user["oauth_id"] = provider_id
        # If customer has no avatar and provider offers a secure avatar, adopt it
        if not existing_user.get("avatar") and avatar.startswith("https://"):
            existing_user["avatar"] = avatar
        save_users(users)
        user_record = existing_user
        log_auth_audit(email, f"{cfg['provider'].upper()}_LOGIN_SUCCESS", client_ip, user_agent, {"linked": True})
    else:
        # 7. Create New Customer Account (Fresh Customer Data Guarantee)
        user_id = str(uuid.uuid4())
        referral_code = name[:3].upper() + user_id[:5].upper()
        new_customer = {
            "id": user_id,
            "name": name,
            "phone": "",
            "email": email,
            "password": "",  # Social login user has no local password
            "city": "",      # Do NOT invent city
            "referral_code": referral_code,
            "points": 0,
            "role": "customer",  # CUSTOMER ONLY
            "gst": "",
            "avatar": avatar if avatar.startswith("https://") else "",
            "oauth_provider": cfg["provider"],
            "oauth_id": provider_id,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        users[email] = new_customer
        save_users(users)
        user_record = new_customer
        log_auth_audit(email, f"{cfg['provider'].upper()}_SIGNUP_SUCCESS", client_ip, user_agent, {"new_account": True})

    # 8. Establish Application Session (Existing session architecture)
    access_token_jwt = _create_access_token(email, "customer")
    raw_refresh, hashed_refresh = _new_refresh_token()
    expires_delta = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS_REMEMBER)
    expires_at = datetime.utcnow() + expires_delta

    info = _device_info(request)
    session_row = UserSession(
        account_email=email,
        role="customer",
        refresh_token_hash=hashed_refresh,
        expires_at=expires_at,
        **info,
    )
    db.add(session_row)
    db.commit()

    _set_refresh_cookie(response, raw_refresh, expires_at)

    return {
        "access_token": access_token_jwt,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user_record["id"],
            "name": user_record["name"],
            "email": user_record["email"],
            "city": user_record.get("city", ""),
            "role": "customer",
            "avatar": user_record.get("avatar", ""),
        },
    }
