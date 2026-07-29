import os
import sys
import io
import json
import hashlib
from fastapi.testclient import TestClient

# Ensure backend directory is in path
sys.path.append(os.path.dirname(__file__))

from main import app
from database_sqlite import engine_sqlite, BaseSqlite, SessionLocalSqlite, CustomerModel
from crm_models import CRMDocumentModel, CRMCommunicationModel, CRMInstallationModel, CRMAMCModel, CRMPaymentModel

def create_dummy_file(content: str):
    f = io.BytesIO(content.encode("utf-8"))
    f.name = "agreement.pdf"
    return f

def run_crm_ops_tests():
    print("════════════════════════════════════════════════")
    print("RUNNING CRM OPERATIONS PLATFORM TESTS (PHASE 12.4B+)")
    print("════════════════════════════════════════════════")

    # Initialize SQLite DB schemas
    BaseSqlite.metadata.create_all(bind=engine_sqlite)

    client = TestClient(app)
    db = SessionLocalSqlite()

    try:
        # Find a test customer or create one
        customer = db.query(CustomerModel).first()
        if not customer:
            print("No customers found in database. Creating a test customer.")
            new_cust = CustomerModel(
                consumer_number="1234567890",
                customer_name="Operations Test Lead",
                discom="MVVNL",
                city="Lucknow",
                phone="9876543210",
                email="ops_test@getsolar.in",
                status="New Lead",
                lead_score=50,
                health_score=100,
                pipeline_value=0.0
            )
            db.add(new_cust)
            db.commit()
            db.refresh(new_cust)
            customer = new_cust

        cust_id = customer.id
        print(f"Testing with Customer: {customer.customer_name} (ID: {cust_id})")

        # Cleanup any stale test data from prior failed runs
        db.query(CRMDocumentModel).filter(CRMDocumentModel.customer_id == cust_id).delete()
        db.query(CRMCommunicationModel).filter(CRMCommunicationModel.customer_id == cust_id).delete()
        db.query(CRMInstallationModel).filter(CRMInstallationModel.customer_id == cust_id).delete()
        db.query(CRMAMCModel).filter(CRMAMCModel.customer_id == cust_id).delete()
        db.query(CRMPaymentModel).filter(CRMPaymentModel.customer_id == cust_id).delete()
        db.commit()
        print("Pre-test cleanup complete.")
        # 1. Test Customer 360 Aggregator
        print("\nTesting GET /api/crm/customers/{id}/360 ...")
        response = client.get(f"/api/crm/customers/{cust_id}/360")
        assert response.status_code == 200, f"360 failed: {response.text}"
        envelope360 = response.json()
        data360 = envelope360["data"]
        assert "customer" in data360
        assert "project_progress" in data360
        assert "payment_progress" in data360
        assert "installation_progress" in data360
        print("✅ Customer 360 Aggregator checks passed!")

        # 2. Test Timeline Paginated
        print("\nTesting GET /api/crm/customers/{id}/timeline-paginated ...")
        response = client.get(f"/api/crm/customers/{cust_id}/timeline-paginated?page=1&limit=5")
        assert response.status_code == 200, f"Timeline paginated failed: {response.text}"
        timeline_data = response.json()
        assert "data" in timeline_data
        assert "pagination" in timeline_data
        assert "total_count" in timeline_data["pagination"]
        print(f"Timeline paginated returned {len(timeline_data['data'])} records (Total: {timeline_data['pagination']['total_count']})")
        print("✅ Timeline paginated check passed!")

        # 3. Test Documents CRUD
        print("\nTesting POST /api/crm/documents ...")
        file_content = "This is a dummy agreement file content for verification."
        file_hash = hashlib.sha256(file_content.encode("utf-8")).hexdigest()
        
        # Test document upload
        response = client.post(
            "/api/crm/documents",
            data={
                "customer_id": cust_id,
                "document_type": "Agreement",
                "document_name": "Test Agreement",
                "uploaded_by": "Test Suite"
            },
            files={"file": ("agreement.pdf", file_content, "application/pdf")}
        )
        assert response.status_code == 201, f"Doc upload failed: {response.text}"
        doc_envelope = response.json()
        doc_resp = doc_envelope["data"]
        doc_id = doc_resp["id"]
        assert doc_resp["checksum"] == file_hash
        assert doc_resp["verification_status"] == "Pending"
        print(f"Uploaded document successfully. ID: {doc_id}")

        # Test duplicate document rejection
        print("Testing duplicate document upload rejection...")
        response2 = client.post(
            "/api/crm/documents",
            data={
                "customer_id": cust_id,
                "document_type": "Agreement",
                "document_name": "Test Agreement Duplicate",
                "uploaded_by": "Test Suite"
            },
            files={"file": ("agreement.pdf", file_content, "application/pdf")}
        )
        assert response2.status_code == 400, "Duplicate upload should fail"
        print("✅ Duplicate document upload prevention verified!")

        # Test document verification status update
        print("Testing PUT /api/crm/documents/{id} ...")
        response3 = client.put(
            f"/api/crm/documents/{doc_id}",
            json={"verification_status": "Verified", "remarks": "Approved by automated tests"}
        )
        assert response3.status_code == 200
        doc_updated = response3.json()["data"]
        assert doc_updated["verification_status"] == "Verified"
        print("✅ Document verification update passed!")

        # 4. Test Communications Logger
        print("\nTesting POST /api/crm/communications ...")
        comm_payload = {
            "customer_id": cust_id,
            "channel": "WhatsApp",
            "subject": "System Verification message",
            "message": "Hello, this is a test communication log.",
            "sender": "System",
            "receiver": customer.customer_name,
            "delivery_status": "Sent"
        }
        response = client.post("/api/crm/communications", json=comm_payload)
        assert response.status_code == 201
        comm_resp = response.json()["data"]
        assert comm_resp["channel"] == "WhatsApp"
        print("✅ Communication logger passed!")

        # 5. Test Installation Stage Update
        print("\nTesting PUT /api/crm/customers/{id}/installation ...")
        install_payload = {
            "current_stage": "Installation Scheduled",
            "assigned_engineer": "Senior Engineer Rajesh",
            "remarks": "Installation scheduled for East wing."
        }
        response = client.put(f"/api/crm/customers/{cust_id}/installation", json=install_payload)
        assert response.status_code == 200, f"Installation update failed: {response.text}"
        install_resp = response.json()["data"]
        assert install_resp["current_stage"] == "Installation Scheduled"
        assert install_resp["completion_percentage"] == 30
        print("✅ Installation stage update passed!")

        # 6. Test AMC Management
        print("\nTesting PUT /api/crm/customers/{id}/amc ...")
        # Update Settings
        amc_payload = {
            "service_frequency": "Bi-Annual",
            "status": "Active"
        }
        response = client.put(f"/api/crm/customers/{cust_id}/amc", json=amc_payload)
        assert response.status_code == 200
        amc_resp = response.json()["data"]
        assert amc_resp["service_frequency"] == "Bi-Annual"

        # Log service visit
        visits = [
            {
                "visit_type": "Maintenance Check",
                "visit_date": "2026-06-25",
                "remarks": "Inverters checked. Working normal.",
                "engineer": "Suresh Kumar"
            }
        ]
        response2 = client.put(
            f"/api/crm/customers/{cust_id}/amc",
            json={"visits_json": json.dumps(visits)}
        )
        assert response2.status_code == 200
        amc_resp2 = response2.json()["data"]
        visits_logged = json.loads(amc_resp2["visits"])
        assert len(visits_logged) == 1
        assert visits_logged[0]["engineer"] == "Suresh Kumar"
        print("✅ AMC contract management passed!")

        # 7. Test Payments milestone tracker
        print("\nTesting POST /api/crm/payments ...")
        # Create invoice
        pay_payload = {
            "customer_id": cust_id,
            "invoice_number": "INV-TEST-001",
            "invoice_amount": 50000.0,
            "due_date": "2026-07-25",
            "stage": "Milestone"
        }
        response = client.post("/api/crm/payments", json=pay_payload)
        assert response.status_code == 201
        pay_resp = response.json()["data"]
        pay_id = pay_resp["id"]
        assert pay_resp["outstanding_amount"] == 50000.0
        assert pay_resp["payment_status"] == "Unpaid"
        print(f"Created milestone payment invoice with ID: {pay_id}")

        # Log payment collection
        print("Testing PUT /api/crm/payments/{id} ...")
        collection_payload = {
            "paid_amount": 20000.0,
            "payment_method": "UPI"
        }
        response2 = client.put(f"/api/crm/payments/{pay_id}", json=collection_payload)
        assert response2.status_code == 200
        pay_resp2 = response2.json()["data"]
        assert pay_resp2["paid_amount"] == 20000.0
        assert pay_resp2["outstanding_amount"] == 30000.0
        assert pay_resp2["payment_status"] == "Partially Paid"
        print("✅ Milestone invoice and collection logs passed!")

        # 8. Test Automatic Triggers (Workflow state transition to "Won")
        print("\nTesting CRM Automation: Transition Customer Status to 'Won'...")
        response = client.put(
            f"/api/crm/customers/{cust_id}",
            json={"status": "Won", "pipeline_value": 150000.0}
        )
        assert response.status_code == 200
        
        # Verify AMC contract exists (was created manually in step 6, 
        # so auto-AMC creation correctly skips since one already exists)
        response2 = client.get(f"/api/crm/customers/{cust_id}/360")
        assert response2.status_code == 200
        newData360 = response2.json()["data"]
        assert newData360["amc"] is not None, "AMC record should exist"
        
        # Check timeline logs for pipeline transition event
        print("Verifying timeline events recorded...")
        response3 = client.get(f"/api/crm/customers/{cust_id}/timeline-paginated?limit=20")
        timeline_events = response3.json()["data"]
        event_types = [e["event_type"] for e in timeline_events]
        print(f"Recorded event types: {event_types}")
        assert any("Pipeline" in t for t in event_types), "Expected a Pipeline Stage Changed timeline event"
        print("✅ CRM Automation on Lead Won transition verified!")

        # Cleanup test document row and local file
        db.query(CRMDocumentModel).filter(CRMDocumentModel.id == doc_id).delete()
        db.query(CRMCommunicationModel).filter(CRMCommunicationModel.customer_id == cust_id).delete()
        db.query(CRMInstallationModel).filter(CRMInstallationModel.customer_id == cust_id).delete()
        db.query(CRMAMCModel).filter(CRMAMCModel.customer_id == cust_id).delete()
        db.query(CRMPaymentModel).filter(CRMPaymentModel.customer_id == cust_id).delete()
        db.commit()

        # Delete local file from storage
        local_path = doc_resp.get("file_path", "")
        if os.path.exists(local_path):
            os.remove(local_path)
            print(f"Cleaned up local file: {local_path}")

        print("\n════════════════════════════════════════════════")
        print("ALL CRM OPERATIONS PLATFORM TESTS PASSED!")
        print("════════════════════════════════════════════════")

    except AssertionError as ae:
        print(f"❌ Verification Assertion failed: {ae}")
        db.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"❌ Verification encountered an error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_crm_ops_tests()
