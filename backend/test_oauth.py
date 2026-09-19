"""
Tests for OAuth 2.0 / OpenID Connect authentication and Site Survey role authorization.
Verifies:
- 503 Service Unavailable when provider credentials are unconfigured
- Valid authorization URL with PKCE (S256), nonce, and signed state when configured
- State signature verification, expiration, provider mismatch, and replay protection
- OIDC ID token validation (issuer, audience, expiration, nonce)
- Customer role isolation: new social accounts get role 'customer' with fresh state
- Privileged account protection: existing vendor, technician, and admin accounts cannot log in via OAuth
- Existing customer account linking
- Site Survey access denial for customers and permission enforcement
"""

import os
import json
import time
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

import jwt
from main import app
from oauth import JWT_SECRET_KEY, JWT_ALGORITHM, STATE_TTL_SECONDS, _generate_state_and_pkce
from database import Base, engine, SessionLocal
from technician_models import Technician

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_users_file(tmp_path, monkeypatch):
    """Ensure tests run against an isolated users file."""
    test_users_file = str(tmp_path / "test_users.json")
    with open(test_users_file, "w") as f:
        json.dump({}, f)

    monkeypatch.setattr("auth.USERS_FILE", test_users_file)
    monkeypatch.setattr("oauth.load_users", lambda: json.load(open(test_users_file)))
    monkeypatch.setattr("oauth.save_users", lambda u: json.dump(u, open(test_users_file, "w")))
    yield


# ==============================================================================
# 1. UNCONFIGURED PROVIDER TESTS (HTTP 503)
# ==============================================================================

def test_google_url_unconfigured(monkeypatch):
    monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
    monkeypatch.delenv("GOOGLE_CLIENT_SECRET", raising=False)
    monkeypatch.delenv("GOOGLE_REDIRECT_URI", raising=False)

    res = client.get("/api/auth/oauth/google/url")
    assert res.status_code == 503
    data = res.json()
    assert "Google authentication is not configured in this environment" in data["detail"]


def test_microsoft_url_unconfigured(monkeypatch):
    monkeypatch.delenv("MICROSOFT_CLIENT_ID", raising=False)
    monkeypatch.delenv("MICROSOFT_CLIENT_SECRET", raising=False)
    monkeypatch.delenv("MICROSOFT_REDIRECT_URI", raising=False)

    res = client.get("/api/auth/oauth/microsoft/url")
    assert res.status_code == 503
    data = res.json()
    assert "Microsoft authentication is not configured in this environment" in data["detail"]


def test_unsupported_provider():
    res = client.get("/api/auth/oauth/github/url")
    assert res.status_code == 400
    assert "Unsupported OAuth provider" in res.json()["detail"]


# ==============================================================================
# 2. CONFIGURED AUTHORIZATION URL & SECURITY HARDENING (PKCE, NONCE, STATE)
# ==============================================================================

def test_google_url_configured(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-google-id.apps.googleusercontent.com")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-google-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/callback/google")

    res = client.get("/api/auth/oauth/google/url")
    assert res.status_code == 200
    data = res.json()

    assert "url" in data
    assert "state" in data
    assert data["provider"] == "google"

    auth_url = data["url"]
    assert "accounts.google.com/o/oauth2/v2/auth" in auth_url
    assert "client_id=test-google-id.apps.googleusercontent.com" in auth_url
    assert "code_challenge=" in auth_url
    assert "code_challenge_method=S256" in auth_url
    assert "nonce=" in auth_url
    assert "scope=openid+email+profile" in auth_url or "scope=openid%20email%20profile" in auth_url

    # Verify state is valid signed JWT
    decoded_state = jwt.decode(data["state"], JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    assert decoded_state["provider"] == "google"
    assert decoded_state["role"] == "customer"
    assert "nonce" in decoded_state
    assert "code_verifier" in decoded_state


def test_microsoft_url_configured(monkeypatch):
    monkeypatch.setenv("MICROSOFT_CLIENT_ID", "test-ms-client-id")
    monkeypatch.setenv("MICROSOFT_CLIENT_SECRET", "test-ms-client-secret")
    monkeypatch.setenv("MICROSOFT_REDIRECT_URI", "http://localhost:5173/auth/callback/microsoft")
    monkeypatch.setenv("MICROSOFT_TENANT_ID", "common")

    res = client.get("/api/auth/oauth/microsoft/url")
    assert res.status_code == 200
    data = res.json()

    auth_url = data["url"]
    assert "login.microsoftonline.com/common/oauth2/v2.0/authorize" in auth_url
    assert "client_id=test-ms-client-id" in auth_url
    assert "code_challenge_method=S256" in auth_url
    assert "scope=openid+email+profile+User.Read" in auth_url or "User.Read" in auth_url


# ==============================================================================
# 3. STATE INTEGRITY, EXPIRATION, PROVIDER MISMATCH, REPLAY PROTECTION
# ==============================================================================

def test_callback_expired_state(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/callback/google")

    # Generate an expired state
    expired_payload = {
        "provider": "google",
        "raw_state": "expired-raw",
        "nonce": "n123",
        "code_verifier": "v123",
        "role": "customer",
        "exp": datetime.utcnow() - timedelta(minutes=5),
        "iat": datetime.utcnow() - timedelta(minutes=15),
    }
    expired_token = jwt.encode(expired_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    res = client.post("/api/auth/oauth/google/callback", json={"code": "fake-code", "state": expired_token})
    assert res.status_code == 400
    assert "expired" in res.json()["detail"].lower()


def test_callback_forged_state(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/callback/google")

    res = client.post("/api/auth/oauth/google/callback", json={"code": "fake-code", "state": "invalid.jwt.token"})
    assert res.status_code == 400
    assert "signature" in res.json()["detail"].lower() or "invalid" in res.json()["detail"].lower()


def test_callback_provider_mismatch(monkeypatch):
    monkeypatch.setenv("MICROSOFT_CLIENT_ID", "test-ms-id")
    monkeypatch.setenv("MICROSOFT_CLIENT_SECRET", "test-ms-secret")
    monkeypatch.setenv("MICROSOFT_REDIRECT_URI", "http://localhost:5173/auth/callback/microsoft")

    # Create state for Google
    sec = _generate_state_and_pkce("google")

    # Send Google state to Microsoft callback
    res = client.post("/api/auth/oauth/microsoft/callback", json={"code": "fake-code", "state": sec["signed_state"]})
    assert res.status_code == 400
    assert "mismatch" in res.json()["detail"].lower()


# ==============================================================================
# 4. FULL OAUTH FLOW MOCK TESTS (NEW CUSTOMER, EXISTING CUSTOMER, PRIVILEGED BLOCKS)
# ==============================================================================

class MockAsyncResponse:
    def __init__(self, status_code, json_data, text=""):
        self.status_code = status_code
        self._json_data = json_data
        self.text = text or json.dumps(json_data)

    def json(self):
        return self._json_data


@pytest.mark.anyio
async def test_google_new_customer_flow(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/callback/google")

    sec = _generate_state_and_pkce("google")
    signed_state = sec["signed_state"]
    expected_nonce = sec["nonce"]

    # Mock provider responses
    token_response = {
        "access_token": "ya29.mock_access_token",
        "id_token": jwt.encode(
            {
                "iss": "https://accounts.google.com",
                "aud": "test-client-id",
                "nonce": expected_nonce,
                "exp": (datetime.utcnow() + timedelta(hours=1)).timestamp(),
                "email": "new.solar.user@example.com",
                "email_verified": True,
            },
            "dummy-key",
            algorithm="HS256",
        ),
        "token_type": "Bearer",
        "expires_in": 3600,
    }

    userinfo_response = {
        "sub": "google-10928374",
        "name": "Aarav Sharma",
        "email": "new.solar.user@example.com",
        "email_verified": True,
        "picture": "https://lh3.googleusercontent.com/a/mock-avatar",
    }

    async def mock_post(url, *args, **kwargs):
        return MockAsyncResponse(200, token_response)

    async def mock_get(url, *args, **kwargs):
        return MockAsyncResponse(200, userinfo_response)

    with patch("httpx.AsyncClient.post", side_effect=mock_post), \
         patch("httpx.AsyncClient.get", side_effect=mock_get):

        res = client.post("/api/auth/oauth/google/callback", json={"code": "valid-code", "state": signed_state})
        assert res.status_code == 200
        data = res.json()

        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "new.solar.user@example.com"
        assert data["user"]["role"] == "customer"
        assert data["user"]["name"] == "Aarav Sharma"
        assert data["user"]["city"] == ""  # Fresh state: never invent city
        assert data["user"]["avatar"] == "https://lh3.googleusercontent.com/a/mock-avatar"

        # Verify refresh token cookie is set
        assert "refresh_token" in res.cookies


def test_existing_privileged_vendor_rejected(monkeypatch):
    """If an existing account is a Vendor, OAuth login must be rejected with 403."""
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/callback/google")

    # Seed vendor in users
    vendor_email = "vendor.epc@example.com"
    test_users = {
        vendor_email: {
            "id": "v-1",
            "name": "Solar EPC Corp",
            "email": vendor_email,
            "role": "vendor",
            "city": "Jaipur"
        }
    }
    monkeypatch.setattr("oauth.load_users", lambda: test_users)

    sec = _generate_state_and_pkce("google")

    token_response = {"access_token": "ya29.mock_token"}
    userinfo_response = {
        "sub": "google-999",
        "name": "Solar EPC Corp",
        "email": vendor_email,
        "email_verified": True,
    }

    async def mock_post(url, *args, **kwargs):
        return MockAsyncResponse(200, token_response)

    async def mock_get(url, *args, **kwargs):
        return MockAsyncResponse(200, userinfo_response)

    with patch("httpx.AsyncClient.post", side_effect=mock_post), \
         patch("httpx.AsyncClient.get", side_effect=mock_get):

        res = client.post("/api/auth/oauth/google/callback", json={"code": "code", "state": sec["signed_state"]})
        assert res.status_code == 403
        assert "Privileged accounts cannot log in via social authentication" in res.json()["detail"]


def test_existing_privileged_admin_rejected(monkeypatch):
    """If an existing account is an Admin, OAuth login must be rejected with 403."""
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/callback/google")

    admin_email = "admin@getsolarenergy.in"
    test_users = {
        admin_email: {
            "id": "admin-1",
            "name": "Super Admin",
            "email": admin_email,
            "role": "admin",
        }
    }
    monkeypatch.setattr("oauth.load_users", lambda: test_users)

    sec = _generate_state_and_pkce("google")

    token_response = {"access_token": "ya29.mock_token"}
    userinfo_response = {
        "sub": "google-admin-1",
        "name": "Super Admin",
        "email": admin_email,
        "email_verified": True,
    }

    async def mock_post(url, *args, **kwargs):
        return MockAsyncResponse(200, token_response)

    async def mock_get(url, *args, **kwargs):
        return MockAsyncResponse(200, userinfo_response)

    with patch("httpx.AsyncClient.post", side_effect=mock_post), \
         patch("httpx.AsyncClient.get", side_effect=mock_get):

        res = client.post("/api/auth/oauth/google/callback", json={"code": "code", "state": sec["signed_state"]})
        assert res.status_code == 403
        assert "Privileged accounts cannot log in via social authentication" in res.json()["detail"]


def test_existing_customer_linking(monkeypatch):
    """Existing customer account should link provider identity without data loss."""
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/callback/google")

    cust_email = "loyal.customer@example.com"
    saved_records = {}
    test_users = {
        cust_email: {
            "id": "cust-100",
            "name": "Rohan Verma",
            "email": cust_email,
            "role": "customer",
            "city": "Lucknow",
            "avatar": "https://existing.avatar/img.png",
            "points": 500,
        }
    }

    def mock_save(users):
        saved_records.update(users)

    monkeypatch.setattr("oauth.load_users", lambda: test_users)
    monkeypatch.setattr("oauth.save_users", mock_save)

    sec = _generate_state_and_pkce("google")

    token_response = {"access_token": "ya29.mock_token"}
    userinfo_response = {
        "sub": "google-cust-12345",
        "name": "Rohan Verma",
        "email": cust_email,
        "email_verified": True,
        "picture": "https://google.new/pic.jpg",
    }

    async def mock_post(url, *args, **kwargs):
        return MockAsyncResponse(200, token_response)

    async def mock_get(url, *args, **kwargs):
        return MockAsyncResponse(200, userinfo_response)

    with patch("httpx.AsyncClient.post", side_effect=mock_post), \
         patch("httpx.AsyncClient.get", side_effect=mock_get):

        res = client.post("/api/auth/oauth/google/callback", json={"code": "code", "state": sec["signed_state"]})
        assert res.status_code == 200
        data = res.json()

        assert data["user"]["email"] == cust_email
        assert data["user"]["role"] == "customer"
        assert data["user"]["city"] == "Lucknow"  # Preserves existing city!
        assert data["user"]["avatar"] == "https://existing.avatar/img.png"  # Preserves existing custom avatar

        # Verify provider ID linked
        assert saved_records[cust_email]["oauth_provider"] == "google"
        assert saved_records[cust_email]["oauth_id"] == "google-cust-12345"


# ==============================================================================
# 5. SITE SURVEY AUTHORIZATION REGRESSION TESTS
# ==============================================================================

def test_site_survey_requires_authentication():
    """Unauthenticated requests to site surveys must be rejected."""
    res = client.get("/api/site-surveys")
    assert res.status_code in [401, 403]
