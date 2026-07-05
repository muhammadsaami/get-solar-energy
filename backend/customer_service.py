import csv
import os
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from database_sqlite import CustomerModel, BillModel

logger = logging.getLogger(__name__)

# Tracker for import execution time
_last_import_time = None

def import_csv_if_empty(db: Session):
    global _last_import_time
    
    # Check if empty
    customer_count = db.query(func.count(CustomerModel.id)).scalar() or 0
    if customer_count > 0:
        logger.info("Database initialized.")
        print("Database initialized.")
        return

    csv_path = os.path.join(os.path.dirname(__file__), "..", "ml-models", "bills_cleaned.csv")
    if not os.path.exists(csv_path):
        logger.error(f"Seeding dataset not found at: {csv_path}")
        return

    imported_customers = {}
    bill_records = []

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            consumer_num = row["consumer_number"].strip()
            
            # Create unique customer objects if not seen
            if consumer_num not in imported_customers:
                customer = CustomerModel(
                    consumer_number=consumer_num,
                    customer_name=row["customer_name"].strip(),
                    discom=row["discom"].strip(),
                    city=row["city"].strip(),
                    phone=None,
                    email=None,
                    address=None,
                    state="Uttar Pradesh" if row["city"].strip() in ["Lucknow", "Agra"] else "Karnataka",
                    pincode=None
                )
                db.add(customer)
                db.flush() # Populate ID
                imported_customers[consumer_num] = customer.id
            
            # Numeric field parsing and clean defaults
            monthly_units = float(row.get("monthly_units", 0.0) or 0.0)
            bill_amount = float(row.get("bill_amount", 0.0) or 0.0)
            per_unit_rate = float(row.get("per_unit_rate", 0.0) or 0.0)
            recommended_kw = float(row.get("recommended_kw", 0.0) or 0.0)
            monthly_savings = float(row.get("monthly_savings", 0.0) or 0.0)
            system_cost = float(row.get("system_cost", 0.0) or 0.0)
            payback_years = float(row.get("payback_years", 0.0) or 0.0)
            savings_25yr = float(row.get("savings_25yr", 0.0) or 0.0)
            
            # O&M custom derived attributes
            annual_savings = monthly_savings * 12.0
            
            # PM Surya Ghar Yojana Subsidy Rule
            if recommended_kw <= 0:
                subsidy = 0.0
            elif recommended_kw < 2:
                subsidy = 30000.0 * recommended_kw
            elif recommended_kw < 3:
                subsidy = 60000.0
            else:
                subsidy = 78000.0
                
            net_cost = max(0.0, system_cost - subsidy)

            bill = BillModel(
                customer_id=imported_customers[consumer_num],
                file_name=row["file"].strip(),
                billing_period=row["billing_period"].strip(),
                monthly_units=monthly_units,
                bill_amount=bill_amount,
                per_unit_rate=per_unit_rate,
                recommended_kw=recommended_kw,
                monthly_savings=monthly_savings,
                annual_savings=annual_savings,
                system_cost=system_cost,
                subsidy=subsidy,
                net_cost=net_cost,
                payback_years=payback_years,
                savings_25yr=savings_25yr
            )
            db.add(bill)
            bill_records.append(bill)

    db.commit()
    _last_import_time = datetime.now()
    
    unique_cust_count = len(imported_customers)
    total_bills_count = len(bill_records)
    
    logger.info(f"Imported {unique_cust_count} customers")
    logger.info(f"Imported {total_bills_count} bills")
    print(f"Imported {unique_cust_count} customers")
    print(f"Imported {total_bills_count} bills")

# Business service functions
def get_customers(db: Session, skip: int = 0, limit: int = 50):
    return db.query(CustomerModel).offset(skip).limit(limit).all()

def get_customer_by_id(db: Session, customer_id: int):
    return db.query(CustomerModel).filter(CustomerModel.id == customer_id).first()

def search_customers(db: Session, q: str):
    search_pattern = f"%{q}%"
    return db.query(CustomerModel).filter(
        (CustomerModel.consumer_number.like(search_pattern)) |
        (CustomerModel.customer_name.like(search_pattern)) |
        (CustomerModel.city.like(search_pattern)) |
        (CustomerModel.discom.like(search_pattern))
    ).all()

def create_customer(db: Session, customer_data: dict):
    # Enforce unique consumer number check
    existing = db.query(CustomerModel).filter(CustomerModel.consumer_number == customer_data["consumer_number"]).first()
    if existing:
        raise ValueError(f"Customer with consumer number {customer_data['consumer_number']} already exists.")
        
    customer = CustomerModel(**customer_data)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

def update_customer(db: Session, customer_id: int, update_data: dict):
    customer = get_customer_by_id(db, customer_id)
    if not customer:
        return None
    for key, val in update_data.items():
        if val is not None:
            setattr(customer, key, val)
    db.commit()
    db.refresh(customer)
    return customer

def delete_customer(db: Session, customer_id: int):
    customer = get_customer_by_id(db, customer_id)
    if not customer:
        return False
    db.delete(customer)
    db.commit()
    return True

def get_dashboard_stats(db: Session):
    # Total unique customers count
    total_customers = db.query(func.count(CustomerModel.id)).scalar() or 0
    # Total bills analyzed count
    total_bills = db.query(func.count(BillModel.id)).scalar() or 0
    
    # Averages
    avg_bill = db.query(func.avg(BillModel.bill_amount)).scalar() or 0.0
    avg_units = db.query(func.avg(BillModel.monthly_units)).scalar() or 0.0
    # Average payback years (only counting non-zero systems)
    avg_payback = db.query(func.avg(BillModel.payback_years)).filter(BillModel.payback_years > 0).scalar() or 0.0
    # Average recommended kW
    avg_system_size = db.query(func.avg(BillModel.recommended_kw)).filter(BillModel.recommended_kw > 0).scalar() or 0.0
    
    # Sums
    total_system_value = db.query(func.sum(BillModel.system_cost)).scalar() or 0.0
    total_25yr_savings = db.query(func.sum(BillModel.savings_25yr)).scalar() or 0.0
    
    # Cities list/count
    cities_count = db.query(func.count(func.distinct(CustomerModel.city))).scalar() or 0
    
    # Timestamps
    last_bill_rec = db.query(BillModel).order_by(BillModel.created_at.desc()).first()
    last_bill_uploaded = last_bill_rec.created_at.isoformat() if last_bill_rec else None
    
    last_import_iso = _last_import_time.isoformat() if _last_import_time else (last_bill_rec.created_at.isoformat() if last_bill_rec else None)

    return {
        "customers": total_customers,
        "bills_analyzed": total_bills,
        "avg_bill": round(float(avg_bill), 2),
        "avg_units": round(float(avg_units), 2),
        "avg_payback": round(float(avg_payback), 2),
        "avg_system_size": round(float(avg_system_size), 2),
        "total_system_value": float(total_system_value),
        "total_25yr_savings": float(total_25yr_savings),
        "cities": cities_count,
        "last_import": last_import_iso,
        "last_bill_uploaded": last_bill_uploaded
    }

def get_recent_bills(db: Session, skip: int = 0, limit: int = 10):
    return db.query(BillModel).order_by(BillModel.created_at.desc()).offset(skip).limit(limit).all()
