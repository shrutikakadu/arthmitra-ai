"""
ArthMitra AI — Live Scheme Catalog API Routes
Serves the curated live scheme database with filtering, search, and manual refresh.
"""
import json
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db, LiveScheme
from scheme_ingestion import run_ingestion
import asyncio

router = APIRouter(prefix="/schemes", tags=["Live Schemes"])


def serialize_scheme(s: LiveScheme):
    return {
        "id": s.id,
        "scheme_name": s.scheme_name,
        "sponsoring_body": s.sponsoring_body,
        "category": s.category,
        "state": s.state,
        "eligibility": {
            "caste": s.eligibility_caste,
            "income_max": s.eligibility_income_max,
            "education": s.eligibility_education,
            "gender": s.eligibility_gender,
            "age_min": s.eligibility_age_min,
            "age_max": s.eligibility_age_max,
            "occupation": s.eligibility_occupation,
        },
        "benefit_amount": s.benefit_amount,
        "benefit_type": s.benefit_type,
        "deadline": s.deadline,
        "official_link": s.official_link,
        "source_portal": s.source_portal,
        "description": s.description,
        "required_docs": json.loads(s.required_docs) if s.required_docs else [],
        "faq": json.loads(s.faq_json) if s.faq_json else [],
        "last_synced": str(s.last_synced) if s.last_synced else None,
        "is_active": s.is_active,
    }


@router.get("/live")
def get_live_schemes(
    db: Session = Depends(get_db),
    state: str = Query(None, description="Filter by state (e.g. Maharashtra). Leave empty for all-India schemes."),
    category: str = Query(None, description="Filter by category: Agriculture, Health, Education, Housing, Social Welfare"),
    caste: str = Query(None, description="Filter by caste eligibility: SC, ST, OBC, EWS, General"),
    benefit_type: str = Query(None, description="DBT | Scholarship | Insurance | Subsidy | Loan"),
    search: str = Query(None, description="Search by scheme name or description"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Returns paginated list of live government schemes with optional filters.
    Includes all-India schemes + state-specific schemes matching the filter.
    """
    query = db.query(LiveScheme).filter(LiveScheme.is_active == True)

    if state:
        # Include both all-India (state=None) and state-specific
        query = query.filter(
            (LiveScheme.state == None) | (LiveScheme.state == state)
        )

    if category:
        query = query.filter(LiveScheme.category.ilike(f"%{category}%"))

    if caste and caste not in ("ALL", "General"):
        # Match schemes available to ALL or specifically to the caste
        query = query.filter(
            (LiveScheme.eligibility_caste == "ALL") |
            (LiveScheme.eligibility_caste == None) |
            (LiveScheme.eligibility_caste.ilike(f"%{caste}%"))
        )

    if benefit_type:
        query = query.filter(LiveScheme.benefit_type.ilike(f"%{benefit_type}%"))

    if search:
        q = f"%{search}%"
        query = query.filter(
            (LiveScheme.scheme_name.ilike(q)) |
            (LiveScheme.description.ilike(q)) |
            (LiveScheme.sponsoring_body.ilike(q))
        )

    total = query.count()
    schemes = query.order_by(LiveScheme.category, LiveScheme.scheme_name).offset(skip).limit(limit).all()

    return {
        "total": total,
        "schemes": [serialize_scheme(s) for s in schemes],
        "skip": skip,
        "limit": limit,
    }


@router.get("/live/{scheme_id}")
def get_live_scheme_detail(scheme_id: int, db: Session = Depends(get_db)):
    """Returns full detail for a single live scheme by ID."""
    scheme = db.query(LiveScheme).filter(LiveScheme.id == scheme_id, LiveScheme.is_active == True).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return serialize_scheme(scheme)


@router.post("/refresh")
async def refresh_schemes(db: Session = Depends(get_db)):
    """Manually triggers the scheme ingestion pipeline (admin use)."""
    asyncio.create_task(run_ingestion())
    return {"status": "ok", "message": "Scheme ingestion triggered in background."}
