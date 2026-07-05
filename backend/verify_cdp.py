import os
import sys
from fastapi.testclient import TestClient

# Ensure backend directory is in path
sys.path.append(os.path.dirname(__file__))

from main import app
from database_sqlite import engine_sqlite, BaseSqlite, SessionLocalSqlite, CustomerModel, BillModel
from customer_service import import_csv_if_empty

def run_tests():
    print("════════════════════════════════════════════════")
    print("RUNNING CUSTOMER DATA PLATFORM (CDP) TESTS")
    print("════════════════════════════════════════════════")
    
    # 1. Initialize DB and seed
    BaseSqlite.metadata.create_all(bind=engine_sqlite)
    db = SessionLocalSqlite()
    try:
        import_csv_if_empty(db)
    finally:
        db.close()
        
    db = SessionLocalSqlite()
    try:
        cust_count = db.query(CustomerModel).count()
        bill_count = db.query(BillModel).count()
        print(f"Database row counts:")
        print(f" - Unique Customers: {cust_count}")
        print(f" - Total Bills: {bill_count}")
        
        assert cust_count == 9, f"Expected 9 customers, got {cust_count}"
        assert bill_count == 14, f"Expected 14 bills, got {bill_count}"
        print("✅ Seeding counts verified successfully!")
    except Exception as e:
        print(f"❌ Seeding verification failed: {e}")
        db.close()
        sys.exit(1)
        
    # 2. Test API client
    client = TestClient(app)
    
    # A. Stats check
    print("\nTesting GET /api/dashboard/stats...")
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200, f"Stats failed: {response.text}"
    stats = response.json()
    print("Dashboard Stats Response:")
    print(stats)
    
    assert stats["customers"] == 9, "Expected 9 customers"
    assert stats["bills_analyzed"] == 14, "Expected 14 bills analyzed"
    assert stats["cities"] == 1, "Expected 1 city (Lucknow)"
    print("✅ Stats check passed!")
    
    # B. Recent bills check
    print("\nTesting GET /api/dashboard/recent-bills...")
    response = client.get("/api/dashboard/recent-bills")
    assert response.status_code == 200
    recent = response.json()
    assert len(recent) > 0
    print(f"Recent bills returned: {len(recent)} items")
    print("✅ Recent bills check passed!")
    
    # C. Customers list check
    print("\nTesting GET /api/customers...")
    response = client.get("/api/customers")
    assert response.status_code == 200
    customers = response.json()
    assert len(customers) == 9
    print("✅ Customer list check passed!")
    
    # D. Search check
    print("\nTesting GET /api/customers/search?q=AMRIT...")
    response = client.get("/api/customers/search?q=AMRIT")
    assert response.status_code == 200
    search_results = response.json()
    assert len(search_results) == 1
    assert "AMRIT" in search_results[0]["customer_name"]
    print("✅ Search check passed!")
    
    # E. Single Customer profile check
    print("\nTesting GET /api/customers/{id}...")
    cust_id = customers[0]["id"]
    response = client.get(f"/api/customers/{cust_id}")
    assert response.status_code == 200
    profile = response.json()
    assert "bills" in profile
    print(f"Profile: {profile['customer_name']}, Bills count: {len(profile['bills'])}")
    print("✅ Profile retrieve check passed!")
    
    # F. CRUD Check (Create, Update, Delete)
    print("\nTesting CRUD on /api/customers...")
    # Create
    new_customer = {
        "consumer_number": "9999999999",
        "customer_name": "Test Customer",
        "discom": "BESCOM",
        "city": "Bangalore",
        "phone": "9000000000",
        "email": "test@getsolar.in"
    }
    response = client.post("/api/customers", json=new_customer)
    assert response.status_code == 201
    created = response.json()
    new_id = created["id"]
    print(f"Created customer with ID: {new_id}")
    
    # Update
    update_data = {
        "customer_name": "Updated Test Customer"
    }
    response = client.put(f"/api/customers/{new_id}", json=update_data)
    assert response.status_code == 200
    updated = response.json()
    assert updated["customer_name"] == "Updated Test Customer"
    print("Updated customer successfully")
    
    # Delete
    response = client.delete(f"/api/customers/{new_id}")
    assert response.status_code == 200
    print("Deleted customer successfully")
    
    # Confirm deletion
    response = client.get(f"/api/customers/{new_id}")
    assert response.status_code == 404
    print("✅ CRUD checks passed!")
    
    print("\n════════════════════════════════════════════════")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("════════════════════════════════════════════════")
    db.close()

if __name__ == "__main__":
    run_tests()
