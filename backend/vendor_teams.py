"""
Phase 5 - Vendor Teams
CRUD APIs for a vendor's team roster (site supervisors, installers, sales
staff, etc.). Same pattern as vendor_inventory.py / vendor_payments.py -
vendor_email identifies the vendor directly since there's no vendor login
system yet. Swap to a real auth dependency once vendor auth exists.

Does NOT touch: auth.py, session_auth.py, technician_auth.py, Customer
APIs, Plant Monitoring, CRM, AI, Admin. Real PostgreSQL table only - no
mock/in-memory data.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from vendor_teams_models import VendorTeamMember
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/vendor/team", tags=["Vendor Teams"])


# ==============================================================================
# SCHEMAS
# ==============================================================================
class TeamMemberCreateRequest(BaseModel):
    vendor_email: str
    name: str
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None


class TeamMemberUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    is_active: Optional[bool] = None


def _serialize(m: VendorTeamMember) -> dict:
    return {
        "id": m.id,
        "vendor_email": m.vendor_email,
        "name": m.name,
        "role": m.role,
        "phone": m.phone,
        "email": m.email,
        "city": m.city,
        "is_active": m.is_active,
        "created_at": m.created_at.isoformat() if m.created_at else None,
        "updated_at": m.updated_at.isoformat() if m.updated_at else None,
    }


# ==============================================================================
# ROUTES
# ==============================================================================
@router.post("")
def add_team_member(data: TeamMemberCreateRequest, db: Session = Depends(get_db)):
    try:
        member = VendorTeamMember(
            vendor_email=data.vendor_email,
            name=data.name,
            role=data.role,
            phone=data.phone,
            email=data.email,
            city=data.city,
            is_active=True,
        )
        db.add(member)
        db.commit()
        db.refresh(member)
        logger.info("Vendor team member added: id=%s vendor=%s name=%s", member.id, member.vendor_email, member.name)
        return {"success": True, "message": "Team member added.", "member": _serialize(member)}
    except Exception as e:
        db.rollback()
        logger.error("Failed to add team member: %s", str(e))
        raise HTTPException(status_code=500, detail="Could not add team member.")


@router.get("")
def list_team(vendor_email: str, active_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(VendorTeamMember).filter(VendorTeamMember.vendor_email == vendor_email)
    if active_only:
        query = query.filter(VendorTeamMember.is_active == True)  # noqa: E712
    members = query.order_by(VendorTeamMember.created_at.desc()).all()
    return {"success": True, "count": len(members), "members": [_serialize(m) for m in members]}


@router.get("/{member_id}")
def get_team_member(member_id: int, db: Session = Depends(get_db)):
    member = db.query(VendorTeamMember).filter(VendorTeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found.")
    return {"success": True, "member": _serialize(member)}


@router.put("/{member_id}")
def update_team_member(member_id: int, data: TeamMemberUpdateRequest, db: Session = Depends(get_db)):
    member = db.query(VendorTeamMember).filter(VendorTeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found.")

    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(member, field, value)

    db.commit()
    db.refresh(member)
    logger.info("Vendor team member updated: id=%s", member.id)
    return {"success": True, "message": "Team member updated.", "member": _serialize(member)}


@router.delete("/{member_id}")
def remove_team_member(member_id: int, db: Session = Depends(get_db)):
    member = db.query(VendorTeamMember).filter(VendorTeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found.")
    db.delete(member)
    db.commit()
    logger.info("Vendor team member deleted: id=%s", member_id)
    return {"success": True, "message": "Team member removed."}