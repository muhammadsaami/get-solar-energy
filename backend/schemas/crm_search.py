"""
backend/schemas/crm_search.py
================================
GET Solar Energy — Pydantic Schemas for Global CRM Search.
Phase 12.4A+++ Production Excellence
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class CustomerSearchResult(BaseModel):
    id:              int
    name:            str
    email:           Optional[str]
    phone:           Optional[str]
    consumer_number: str
    status:          str
    salesperson:     str


class TaskSearchResult(BaseModel):
    id:          int
    title:       str
    priority:    str
    status:      str
    assigned_to: str


class MeetingSearchResult(BaseModel):
    id:        int
    title:     str
    type:      str
    scheduled: str
    outcome:   str


class TimelineSearchResult(BaseModel):
    id:         int
    event_type: str
    notes:      str
    user:       str
    date:       str


class GlobalSearchResponseSchema(BaseModel):
    """Complete result set for /api/crm/global-search."""
    query:     str
    customers: List[CustomerSearchResult] = []
    tasks:     List[TaskSearchResult]     = []
    meetings:  List[MeetingSearchResult]  = []
    timeline:  List[TimelineSearchResult] = []
    total:     int                        = Field(0, description="Total result count across all entities")
