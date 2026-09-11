from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from database import (
    get_db,
    User,
    SchemeApplication,
    Document,
    ApplicationAudit,
    DCEvent,
)

from message_bus import notification_queue

router = APIRouter(prefix="/applications", tags=["Applications"])


# ============================================================
# CONSTANTS
# ============================================================

DRAFT = "draft"
SUBMITTED = "SUBMITTED"
CLERK_APPROVED = "CLERK_APPROVED"
OFFICER_APPROVED = "OFFICER_APPROVED"
FINAL_VERIFICATION = "FINAL_VERIFICATION"
APPROVED = "APPROVED"
REJECTED = "REJECTED"

ACTIVE_STATUSES = [
    DRAFT,
    SUBMITTED,
    CLERK_APPROVED,
    OFFICER_APPROVED,
    FINAL_VERIFICATION,
]

SCHEME_REQUIRED_DOCUMENT_TYPES = {
    "PM Kisan Samman Nidhi": {"aadhaar", "land_record", "bank_passbook"},
    "Ayushman Bharat PM-JAY": {"aadhaar", "ration_card", "income_cert"},
    "PM Ujjwala Yojana 2.0": {"aadhaar", "ration_card", "caste_cert", "bank_passbook"},
}

DEFAULT_REQUIRED_DOCUMENT_TYPES = {"aadhaar", "income_cert", "ration_card"}


# ============================================================
# PYDANTIC MODELS
# ============================================================

class ApplySchemeData(BaseModel):
    user_id: int
    scheme_name: str
    category: str
    benefit: Optional[str] = None
    reason_for_applying: Optional[str] = (
        "Applicant eligible based on income & occupation criteria"
    )


class SubmitApplicationData(BaseModel):
    user_id: int


# ============================================================
# HELPERS
# ============================================================

def serialize_document(doc: Document):
    return {
        "id": doc.id,
        "application_id": doc.application_id,
        "doc_type": doc.doc_type,
        "original_name": doc.original_name,
        "filename": doc.filename,
        "status": doc.status,
        "uploaded_at": str(doc.uploaded_at),
        "review_note": doc.review_note,
    }


def serialize_docs(docs):
    return [serialize_document(d) for d in docs]


def serialize_audit(audit: ApplicationAudit):
    return {
        "id": audit.id,
        "application_id": audit.application_id,
        "actor_id": audit.actor_id,
        "actor_name": audit.actor_name,
        "role": audit.role,
        "action": audit.action,
        "from_status": audit.from_status,
        "to_status": audit.to_status,
        "notes": audit.notes,
        "timestamp": str(audit.timestamp),
    }


def add_audit(
    db: Session,
    app: SchemeApplication,
    actor_id: Optional[int],
    action: str,
    from_status: Optional[str],
    to_status: str,
    notes: str = "",
):
    actor = None

    if actor_id:
        actor = db.query(User).filter(User.id == actor_id).first()

    audit = ApplicationAudit(
        application_id=app.id,
        actor_id=actor_id,
        actor_name=actor.name if actor else "System",
        role=actor.role if actor else "system",
        action=action,
        from_status=from_status,
        to_status=to_status,
        notes=notes,
        timestamp=datetime.utcnow(),
    )

    db.add(audit)
    return audit


def handler_for_status(status: str):
    mapping = {
        DRAFT: "Applicant",
        SUBMITTED: "Local Admin (Clerk)",
        CLERK_APPROVED: "District Officer / DM",
        OFFICER_APPROVED: "Department Secretary",
        FINAL_VERIFICATION: "Cabinet Minister (Final Approval)",
        APPROVED: "Approved & Disbursed",
        REJECTED: "Rejected",
    }

    return mapping.get(status, "Local Admin (Clerk)")


def required_documents_for_scheme(scheme_name: str):
    return SCHEME_REQUIRED_DOCUMENT_TYPES.get(
        scheme_name,
        DEFAULT_REQUIRED_DOCUMENT_TYPES,
    )


def required_documents_present(app: SchemeApplication, docs):
    uploaded_types = {
        d.doc_type
        for d in docs
        if d.status != "rejected"
    }

    required = required_documents_for_scheme(app.scheme_name)
    return required - uploaded_types


# ============================================================
# APPLY FOR SCHEME
# ============================================================

@router.post("/apply")
async def apply_scheme(
    data: ApplySchemeData,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == data.user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # --------------------------------------------------------
    # Find an existing application for the same scheme
    # --------------------------------------------------------

    existing = (
        db.query(SchemeApplication)
        .filter(
            SchemeApplication.user_id == data.user_id,
            SchemeApplication.scheme_name == data.scheme_name,
            SchemeApplication.status.in_(ACTIVE_STATUSES),
        )
        .order_by(SchemeApplication.id.desc())
        .first()
    )

    if existing:
        return {
            "status": "success",
            "message": "Application already exists",
            "application_id": existing.id,
            "application_status": existing.status,
            "current_handler": existing.current_handler,
            "required_documents": sorted(required_documents_for_scheme(existing.scheme_name)),
        }

    # --------------------------------------------------------
    # IMPORTANT:
    # New application starts as DRAFT.
    #
    # We DO NOT attach standalone profile documents here.
    # --------------------------------------------------------

    app = SchemeApplication(
        user_id=data.user_id,
        scheme_name=data.scheme_name,
        category=data.category,
        benefit=data.benefit,
        reason_for_applying=data.reason_for_applying,
        status=DRAFT,
        current_handler="Applicant",
        applied_at=datetime.utcnow(),
        version=1,
    )

    db.add(app)
    db.flush()

    add_audit(
        db=db,
        app=app,
        actor_id=data.user_id,
        action="APPLICATION_CREATED",
        from_status=None,
        to_status=DRAFT,
        notes="Scheme application created as draft.",
    )

    db.add(
        DCEvent(
            node_id="application-node-01",
            event_type="application_created",
            latency_ms=0,
            status=DRAFT,
            payload=(
                f"Created Application #{app.id} "
                f"for User #{data.user_id}"
            ),
        )
    )

    db.commit()
    db.refresh(app)

    await notification_queue.put({
        "user_id": data.user_id,
        "message": (
            f"Your application #{app.id} for "
            f"{app.scheme_name} has been created as a draft. "
            "Please upload the required documents and submit it."
        ),
        "category": "info",
    })

    return {
        "status": "success",
        "message": "Application created as draft",
        "application_id": app.id,
        "application_status": app.status,
        "current_handler": app.current_handler,
        "required_documents": sorted(required_documents_for_scheme(app.scheme_name)),
    }


# ============================================================
# FINAL SUBMIT BY CITIZEN
# ============================================================

@router.post("/{app_id}/submit")
async def submit_application(
    app_id: int,
    data: SubmitApplicationData,
    db: Session = Depends(get_db),
):
    app = (
        db.query(SchemeApplication)
        .filter(SchemeApplication.id == app_id)
        .first()
    )

    if not app:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    if app.user_id != data.user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not own this application",
        )

    if app.status != DRAFT:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Only draft applications can be submitted. "
                f"Current status: {app.status}"
            ),
        )

    # --------------------------------------------------------
    # ONLY documents explicitly linked to this application
    # are considered.
    #
    # Profile documents with application_id=NULL are ignored.
    # --------------------------------------------------------

    docs = (
        db.query(Document)
        .filter(Document.application_id == app.id)
        .all()
    )

    if not docs:
        raise HTTPException(
            status_code=400,
            detail=(
                "Please upload the required documents "
                "for this application before submitting."
            ),
        )

    missing = required_documents_present(app, docs)

    if missing:
        raise HTTPException(
            status_code=400,
            detail=(
                "Missing required documents: "
                + ", ".join(sorted(missing))
            ),
        )

    rejected_docs = [
        d for d in docs
        if d.status == "rejected"
    ]

    if rejected_docs:
        raise HTTPException(
            status_code=400,
            detail=(
                "One or more application documents were rejected. "
                "Please upload replacement documents."
            ),
        )

    old_status = app.status

    # --------------------------------------------------------
    # Submit to Clerk
    # --------------------------------------------------------

    app.status = SUBMITTED
    app.current_handler = "Local Admin (Clerk)"
    app.reviewed_by = None
    app.review_note = None
    app.version = (app.version or 1) + 1

    for doc in docs:
        if doc.status != "rejected":
            doc.status = "pending_clerk"

    add_audit(
        db=db,
        app=app,
        actor_id=data.user_id,
        action="APPLICATION_SUBMITTED",
        from_status=old_status,
        to_status=SUBMITTED,
        notes="Citizen submitted application for Clerk verification.",
    )

    db.add(
        DCEvent(
            node_id="application-node-01",
            event_type="application_submitted",
            latency_ms=0,
            status=SUBMITTED,
            payload=(
                f"Application #{app.id} submitted "
                f"by User #{data.user_id} to Clerk"
            ),
        )
    )

    db.commit()
    db.refresh(app)

    await notification_queue.put({
        "user_id": data.user_id,
        "message": (
            f"Application #{app.id} has been submitted "
            "and sent to the Clerk for verification."
        ),
        "category": "success",
    })

    return {
        "status": "success",
        "message": "Application submitted to Clerk",
        "application_id": app.id,
        "application_status": app.status,
        "current_handler": app.current_handler,
        "documents": serialize_docs(docs),
    }


# ============================================================
# GET MY APPLICATIONS
# ============================================================

@router.get("/my/{user_id}")
def get_my_applications(
    user_id: int,
    db: Session = Depends(get_db),
):
    apps = (
        db.query(SchemeApplication)
        .filter(SchemeApplication.user_id == user_id)
        .order_by(SchemeApplication.applied_at.desc())
        .all()
    )

    result = []

    for app in apps:
        docs = (
            db.query(Document)
            .filter(Document.application_id == app.id)
            .order_by(Document.uploaded_at.desc())
            .all()
        )

        audits = (
            db.query(ApplicationAudit)
            .filter(ApplicationAudit.application_id == app.id)
            .order_by(ApplicationAudit.timestamp.asc())
            .all()
        )

        result.append({
            "id": app.id,
            "user_id": app.user_id,
            "scheme_name": app.scheme_name,
            "category": app.category,
            "benefit": app.benefit,
            "reason_for_applying": app.reason_for_applying,
            "status": app.status,
            "current_handler": app.current_handler,
            "applied_at": str(app.applied_at),
            "reviewed_by": app.reviewed_by,
            "review_note": app.review_note,
            "version": app.version,
            "required_documents": sorted(required_documents_for_scheme(app.scheme_name)),
            "documents": serialize_docs(docs),
            "audits": [
                serialize_audit(a)
                for a in audits
            ],
        })

    return result



# ============================================================
# GET ALL APPLICATIONS
# ============================================================

@router.get("/all")
def get_all_applications(
    db: Session = Depends(get_db),
):
    apps = (
        db.query(SchemeApplication)
        .order_by(SchemeApplication.applied_at.desc())
        .all()
    )

    result = []

    for app in apps:
        docs = (
            db.query(Document)
            .filter(Document.application_id == app.id)
            .order_by(Document.uploaded_at.desc())
            .all()
        )

        result.append({
            "id": app.id,
            "user_id": app.user_id,
            "scheme_name": app.scheme_name,
            "category": app.category,
            "benefit": app.benefit,
            "reason_for_applying": app.reason_for_applying,
            "status": app.status,
            "current_handler": app.current_handler,
            "applied_at": str(app.applied_at),
            "reviewed_by": app.reviewed_by,
            "review_note": app.review_note,
            "version": app.version,
            "required_documents": sorted(required_documents_for_scheme(app.scheme_name)),
            "documents": serialize_docs(docs),
        })

    return result




# ============================================================
# MASTER METRICS
# ============================================================

@router.get("/master-metrics")
def master_metrics(
    db: Session = Depends(get_db),
):
    def count(status):
        return (
            db.query(SchemeApplication)
            .filter(SchemeApplication.status == status)
            .count()
        )

    return {
        "draft": count(DRAFT),
        "submitted": count(SUBMITTED),
        "pending_clerk": count(SUBMITTED),
        "clerk_approved": count(CLERK_APPROVED),
        "pending_district": count(CLERK_APPROVED),
        "officer_approved": count(OFFICER_APPROVED),
        "pending_state": count(OFFICER_APPROVED),
        "final_verification": count(FINAL_VERIFICATION),
        "pending_minister": count(FINAL_VERIFICATION),
        "approved": count(APPROVED),
        "verified": count(APPROVED),
        "rejected": count(REJECTED),
    }

# ============================================================
# GET SINGLE APPLICATION
# ============================================================

@router.get("/{app_id}")
def get_application(
    app_id: int,
    db: Session = Depends(get_db),
):
    app = (
        db.query(SchemeApplication)
        .filter(SchemeApplication.id == app_id)
        .first()
    )

    if not app:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    docs = (
        db.query(Document)
        .filter(Document.application_id == app.id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )

    audits = (
        db.query(ApplicationAudit)
        .filter(ApplicationAudit.application_id == app.id)
        .order_by(ApplicationAudit.timestamp.asc())
        .all()
    )

    return {
        "id": app.id,
        "user_id": app.user_id,
        "scheme_name": app.scheme_name,
        "category": app.category,
        "benefit": app.benefit,
        "reason_for_applying": app.reason_for_applying,
        "status": app.status,
        "current_handler": app.current_handler,
        "applied_at": str(app.applied_at),
        "reviewed_by": app.reviewed_by,
        "review_note": app.review_note,
        "version": app.version,
        "user": {
            "id": app.user.id if app.user else None,
            "name": app.user.name if app.user else None,
            "mobile": app.user.mobile if app.user else None,
        },
        "documents": serialize_docs(docs),
        "audits": [
            serialize_audit(a)
            for a in audits
        ],
    }



# ============================================================
# VERIFY / APPROVE APPLICATION
# ============================================================

@router.put("/{app_id}/verify")
async def verify_application(
    app_id: int,
    action: str,
    note: str = "",
    admin_id: int = 0,
    db: Session = Depends(get_db),
):
    if action not in ["verified", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Action must be 'verified' or 'rejected'",
        )

    admin_user = (
        db.query(User)
        .filter(User.id == admin_id)
        .first()
    )

    if not admin_user:
        raise HTTPException(
            status_code=404,
            detail="Authority user not found",
        )

    role = admin_user.role

    if role not in [
        "clerk",
        "officer",
        "state_admin",
        "minister",
        "admin",
    ]:
        raise HTTPException(
            status_code=403,
            detail="User is not authorized for application verification",
        )

    app = (
        db.query(SchemeApplication)
        .filter(SchemeApplication.id == app_id)
        .first()
    )

    if not app:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    old_status = app.status

    # ========================================================
    # REJECTION
    # ========================================================

    if action == "rejected":

        allowed = {
            "clerk": [SUBMITTED],
            "officer": [CLERK_APPROVED],
            "state_admin": [OFFICER_APPROVED],
            "minister": [FINAL_VERIFICATION],
            "admin": [
                SUBMITTED,
                CLERK_APPROVED,
                OFFICER_APPROVED,
                FINAL_VERIFICATION,
            ],
        }

        if app.status not in allowed.get(role, []):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{role} cannot reject an application "
                    f"in status {app.status}"
                ),
            )

        app.status = REJECTED
        app.current_handler = (
            f"Rejected by {admin_user.name or role}"
        )
        app.reviewed_by = admin_id
        app.review_note = note or "Application rejected."
        app.version = (app.version or 1) + 1

        add_audit(
            db=db,
            app=app,
            actor_id=admin_id,
            action="REJECTED",
            from_status=old_status,
            to_status=REJECTED,
            notes=note,
        )

        db.add(
            DCEvent(
                node_id="application-node-01",
                event_type="application_rejected",
                latency_ms=0,
                status=REJECTED,
                payload=(
                    f"Application #{app.id} rejected by "
                    f"{role} #{admin_id}"
                ),
            )
        )

        db.commit()

        await notification_queue.put({
            "user_id": app.user_id,
            "message": (
                f"Application #{app.id} has been rejected."
                + (f" Reason: {note}" if note else "")
            ),
            "category": "warning",
        })

        return {
            "status": "success",
            "message": "Application rejected",
            "application_id": app.id,
            "application_status": app.status,
            "current_handler": app.current_handler,
        }

    # ========================================================
    # CLERK
    # ========================================================

    if role == "clerk":

        if app.status != SUBMITTED:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Clerk can verify only submitted applications. "
                    f"Current status: {app.status}"
                ),
            )

        docs = (
            db.query(Document)
            .filter(Document.application_id == app.id)
            .all()
        )

        if not docs:
            raise HTTPException(
                status_code=400,
                detail="Application has no linked documents.",
            )

        rejected_docs = [
            d for d in docs
            if d.status == "rejected"
        ]

        if rejected_docs:
            raise HTTPException(
                status_code=400,
                detail="Application contains rejected documents.",
            )

        unverified_docs = [
            d for d in docs
            if d.status != "verified"
        ]

        if unverified_docs:
            raise HTTPException(
                status_code=400,
                detail=(
                    "All application documents must be verified "
                    "by the Clerk before approving the application."
                ),
            )

        app.status = CLERK_APPROVED
        app.current_handler = "District Officer / DM"
        app.reviewed_by = admin_id
        app.review_note = (
            "Clerk verified the application and all attached documents."
        )
        app.version = (app.version or 1) + 1

        add_audit(
            db=db,
            app=app,
            actor_id=admin_id,
            action="CLERK_APPROVED",
            from_status=old_status,
            to_status=CLERK_APPROVED,
            notes=app.review_note,
        )

    # ========================================================
    # DISTRICT OFFICER / DM
    # ========================================================

    elif role == "officer":

        if app.status != CLERK_APPROVED:
            raise HTTPException(
                status_code=400,
                detail=(
                    "District Officer can act only on "
                    f"Clerk-approved applications. Current status: "
                    f"{app.status}"
                ),
            )

        app.status = OFFICER_APPROVED
        app.current_handler = "Department Secretary"
        app.reviewed_by = admin_id
        app.review_note = (
            note or "Application approved by District Officer / DM."
        )
        app.version = (app.version or 1) + 1

        add_audit(
            db=db,
            app=app,
            actor_id=admin_id,
            action="OFFICER_APPROVED",
            from_status=old_status,
            to_status=OFFICER_APPROVED,
            notes=note,
        )

    # ========================================================
    # DEPARTMENT SECRETARY
    # ========================================================

    elif role == "state_admin":

        if app.status != OFFICER_APPROVED:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Secretary can act only on "
                    f"District-approved applications. Current status: "
                    f"{app.status}"
                ),
            )

        app.status = FINAL_VERIFICATION
        app.current_handler = (
            "Cabinet Minister (Apex Super Admin)"
        )
        app.reviewed_by = admin_id
        app.review_note = (
            note or "Application approved by Department Secretary."
        )
        app.version = (app.version or 1) + 1

        add_audit(
            db=db,
            app=app,
            actor_id=admin_id,
            action="SECRETARY_APPROVED",
            from_status=old_status,
            to_status=FINAL_VERIFICATION,
            notes=note,
        )

    # ========================================================
    # CABINET MINISTER
    # ========================================================

    elif role == "minister":

        if app.status != FINAL_VERIFICATION:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Minister can act only on applications awaiting "
                    f"final verification. Current status: {app.status}"
                ),
            )

        app.status = APPROVED
        app.current_handler = "Approved & Disbursed"
        app.reviewed_by = admin_id
        app.review_note = (
            note or "Final approval granted by Cabinet Minister."
        )
        app.version = (app.version or 1) + 1

        add_audit(
            db=db,
            app=app,
            actor_id=admin_id,
            action="APPROVED",
            from_status=old_status,
            to_status=APPROVED,
            notes=note,
        )

    # ========================================================
    # SYSTEM ADMIN
    # ========================================================

    elif role == "admin":

        raise HTTPException(
            status_code=403,
            detail=(
                "System Admin is not the welfare scheme approval "
                "authority. Cabinet Minister must provide final approval."
            ),
        )

    db.add(
        DCEvent(
            node_id="application-node-01",
            event_type="application_verified",
            latency_ms=0,
            status=app.status,
            payload=(
                f"Application #{app.id} moved from "
                f"{old_status} to {app.status} by "
                f"{role} #{admin_id}"
            ),
        )
    )

    db.commit()
    db.refresh(app)

    await notification_queue.put({
        "user_id": app.user_id,
        "message": (
            f"Application #{app.id} is now "
            f"{app.status.replace('_', ' ').title()}."
            f" Current handler: {app.current_handler}."
        ),
        "category": "success",
    })

    return {
        "status": "success",
        "message": f"Application {app.status}",
        "application_id": app.id,
        "application_status": app.status,
        "current_handler": app.current_handler,
    }
