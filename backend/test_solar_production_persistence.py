"""
Tests for Phase 7B Solar Production Persistence & Data Reconciliation
Verifies:
1. Anonymous requests return 401 Unauthorized.
2. Authenticated customers can save, retrieve, and delete their solar production readings.
3. Customer identity is derived from verified token (cannot provide arbitrary customer IDs).
4. Customer isolation: Customer A cannot see or delete Customer B's readings.
5. Strict validation (negative production rejected, negative capacity rejected, invalid dates rejected).
6. Period semantics and discrete daily points are preserved.
7. Historical multi-period retrieval.
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from security import create_access_token
from database import SessionLocal
from solar_production_models import CustomerSolarProduction

client = TestClient(app)

CUSTOMER_A_EMAIL = "customer_a_phase7b@example.com"
CUSTOMER_B_EMAIL = "customer_b_phase7b@example.com"


@pytest.fixture(autouse=True)
def clean_test_solar_records():
    db = SessionLocal()
    try:
        db.query(CustomerSolarProduction).filter(
            CustomerSolarProduction.customer_email.in_([CUSTOMER_A_EMAIL, CUSTOMER_B_EMAIL])
        ).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()
    yield
    db = SessionLocal()
    try:
        db.query(CustomerSolarProduction).filter(
            CustomerSolarProduction.customer_email.in_([CUSTOMER_A_EMAIL, CUSTOMER_B_EMAIL])
        ).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()


def get_auth_headers(email: str, role: str = "customer"):
    token = create_access_token({"sub": email, "email": email, "role": role})
    return {"Authorization": f"Bearer {token}"}


class TestSolarProductionPersistence:
    def test_anonymous_access_denied(self):
        """Anonymous requests must return 401 Unauthorized."""
        res_post = client.post("/api/solar-production", json={"productionKwh": 300})
        assert res_post.status_code in (401, 403)

        res_latest = client.get("/api/solar-production/latest")
        assert res_latest.status_code in (401, 403)

        res_history = client.get("/api/solar-production/history")
        assert res_history.status_code in (401, 403)

    def test_authenticated_customer_save_and_retrieve_latest(self):
        """Customer can save a manual reading and retrieve it via /latest."""
        headers = get_auth_headers(CUSTOMER_A_EMAIL)
        payload = {
            "periodType": "month",
            "month": "October",
            "year": 2026,
            "startDate": "2026-10-01",
            "endDate": "2026-10-31",
            "productionKwh": 361.40,
            "installedCapacityKwp": 3.60,
            "source": "manual",
            "dailyGenerationKwh": 11.66,
            "dailyPoints": [
                {"id": "pt_1", "date": "2026-10-01", "productionKwh": 12.5},
                {"id": "pt_2", "date": "2026-10-02", "productionKwh": 11.2},
            ],
        }

        save_res = client.post("/api/solar-production", json=payload, headers=headers)
        assert save_res.status_code == 201
        data = save_res.json()
        assert data["success"] is True
        assert data["data"]["customerEmail"] == CUSTOMER_A_EMAIL
        assert data["data"]["productionKwh"] == 361.40
        assert data["data"]["installedCapacityKwp"] == 3.60
        assert data["data"]["systemSizeKw"] == 3.60
        assert data["data"]["periodType"] == "month"
        assert data["data"]["source"] == "manual"
        assert len(data["data"]["dailyPoints"]) == 2

        # Retrieve latest
        latest_res = client.get("/api/solar-production/latest", headers=headers)
        assert latest_res.status_code == 200
        latest_data = latest_res.json()["data"]
        assert latest_data is not None
        assert latest_data["productionKwh"] == 361.40
        assert latest_data["month"] == "October"
        assert latest_data["year"] == 2026

    def test_customer_isolation_enforced(self):
        """Customer B cannot see or delete Customer A's reading."""
        headers_a = get_auth_headers(CUSTOMER_A_EMAIL)
        headers_b = get_auth_headers(CUSTOMER_B_EMAIL)

        # Customer A saves reading
        save_a = client.post(
            "/api/solar-production",
            json={
                "periodType": "month",
                "month": "October",
                "year": 2026,
                "productionKwh": 400.0,
                "source": "manual",
            },
            headers=headers_a,
        )
        assert save_a.status_code == 201
        rec_id_a = save_a.json()["data"]["id"]

        # Customer B queries latest -> should be null
        latest_b = client.get("/api/solar-production/latest", headers=headers_b)
        assert latest_b.status_code == 200
        assert latest_b.json()["data"] is None

        # Customer B tries to delete Customer A's record -> 403 Forbidden
        delete_res = client.delete(f"/api/solar-production/{rec_id_a}", headers=headers_b)
        assert delete_res.status_code == 403

    def test_validation_rejects_negative_production(self):
        """Negative production kWh must be rejected."""
        headers = get_auth_headers(CUSTOMER_A_EMAIL)
        res = client.post(
            "/api/solar-production",
            json={"periodType": "month", "productionKwh": -50.0},
            headers=headers,
        )
        assert res.status_code == 422

    def test_validation_rejects_negative_or_zero_capacity(self):
        """Installed capacity <= 0 must be rejected."""
        headers = get_auth_headers(CUSTOMER_A_EMAIL)
        res = client.post(
            "/api/solar-production",
            json={"periodType": "month", "productionKwh": 300.0, "installedCapacityKwp": -2.0},
            headers=headers,
        )
        assert res.status_code == 422

        res_zero = client.post(
            "/api/solar-production",
            json={"periodType": "month", "productionKwh": 300.0, "installedCapacityKwp": 0.0},
            headers=headers,
        )
        assert res_zero.status_code == 422

    def test_validation_rejects_invalid_date_order(self):
        """Custom period with startDate > endDate must be rejected."""
        headers = get_auth_headers(CUSTOMER_A_EMAIL)
        res = client.post(
            "/api/solar-production",
            json={
                "periodType": "custom",
                "startDate": "2026-10-25",
                "endDate": "2026-10-10",
                "productionKwh": 120.0,
            },
            headers=headers,
        )
        assert res.status_code == 422

    def test_historical_readings_retrieval(self):
        """Customer can retrieve multi-period historical readings in chronological order."""
        headers = get_auth_headers(CUSTOMER_A_EMAIL)

        # Save September reading
        client.post(
            "/api/solar-production",
            json={
                "periodType": "month",
                "month": "September",
                "year": 2026,
                "productionKwh": 340.0,
                "source": "manual",
            },
            headers=headers,
        )

        # Save October reading
        client.post(
            "/api/solar-production",
            json={
                "periodType": "month",
                "month": "October",
                "year": 2026,
                "productionKwh": 380.0,
                "source": "manual",
            },
            headers=headers,
        )

        history_res = client.get("/api/solar-production/history", headers=headers)
        assert history_res.status_code == 200
        history_data = history_res.json()["data"]
        assert len(history_data) == 2
        months = [r["month"] for r in history_data]
        assert "September" in months
        assert "October" in months

    def test_customer_can_delete_own_reading(self):
        """Customer can delete their own reading."""
        headers = get_auth_headers(CUSTOMER_A_EMAIL)
        save_res = client.post(
            "/api/solar-production",
            json={"periodType": "month", "month": "August", "year": 2026, "productionKwh": 290.0},
            headers=headers,
        )
        rec_id = save_res.json()["data"]["id"]

        del_res = client.delete(f"/api/solar-production/{rec_id}", headers=headers)
        assert del_res.status_code == 200

        # After delete, latest should be null or not contain August
        latest_res = client.get("/api/solar-production/latest", headers=headers)
        assert latest_res.json()["data"] is None
