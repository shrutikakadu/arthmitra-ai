from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import (
    get_db,
    SchemeApplication,
    User,
    DCEvent,
    Notification
)
from message_bus import publish_message
from distributed_lock import get_lock_manager
from consensus import get_raft_cluster
from datetime import datetime
import time

router = APIRouter()


class ApplySchemeData(BaseModel):
    user_id: int
    scheme_name: str
    category: str
    benefit: Optional[str] = None
    reason_for_applying: Optional[str] = (
        "Applicant eligible based on income & occupation criteria"
    )


# ============================================================
# USER SUBMITS APPLICATION
# ============================================================

@router.post("/applications/apply")
async def apply_scheme(
    data: ApplySchemeData,
    db: Session = Depends(get_db)
):
    """User submits application -> Multi-Stage Approval Queue."""

    t0 = time.time()

    user = db.query(User).filter(User.id == data.user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    app = SchemeApplication(
        user_id=data.user_id,
        scheme_name=data.scheme_name,
        category=data.category,
        benefit=data.benefit or "Standard Welfare Grant",
        reason_for_applying=data.reason_for_applying,
        status="pending_clerk",
        current_handler="Local Admin (Clerk)",
        applied_at=datetime.utcnow()
    )

    db.add(app)
    db.commit()
    db.refresh(app)

    # --------------------------------------------------------
    # Message Bus
    # --------------------------------------------------------

    await publish_message(
        "doc.submitted",
        {
            "app_id": app.id,
            "user_id": app.user_id,
            "user_name": user.name,
            "scheme_name": app.scheme_name,
            "stage": "pending_clerk"
        }
    )

    # --------------------------------------------------------
    # Notification
    # --------------------------------------------------------

    await publish_message(
        "notification.dispatch",
        {
            "user_id": app.user_id,
            "message": (
                f"Your application for '{app.scheme_name}' "
                "was submitted. Pending Local Admin (Clerk) review."
            ),
            "category": "info"
        }
    )

    # --------------------------------------------------------
    # DC Event
    # --------------------------------------------------------

    dc_evt = DCEvent(
        node_id="scheme-node-01",
        event_type="scheme_application",
        latency_ms=round((time.time() - t0) * 1000, 2),
        status="pending_clerk",
        payload=(
            f"Submitted application #{app.id} "
            f"for '{app.scheme_name}' "
            f"by User #{user.id} ({user.name})"
        )
    )

    db.add(dc_evt)
    db.commit()

    return {
        "status": "success",
        "message": (
            f"Application for '{app.scheme_name}' "
            "submitted successfully!"
        ),
        "application_id": app.id
    }


# ============================================================
# GET USER'S APPLICATIONS
# ============================================================

@router.get("/applications/my/{user_id}")
def get_my_applications(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Returns applications submitted by a specific user."""

    apps = (
        db.query(SchemeApplication)
        .filter(SchemeApplication.user_id == user_id)
        .order_by(SchemeApplication.applied_at.desc())
        .all()
    )

    return [
        {
            "id": a.id,
            "scheme_name": a.scheme_name,
            "category": a.category,
            "benefit": a.benefit,
            "reason_for_applying": a.reason_for_applying,
            "status": a.status,
            "current_handler": a.current_handler,
            "applied_at": str(a.applied_at),
            "review_note": a.review_note,
            "raft_term": a.raft_term,
            "raft_index": a.raft_index
        }
        for a in apps
    ]


# ============================================================
# GET ALL APPLICATIONS
# ============================================================

@router.get("/applications/all")
def get_all_applications(
    db: Session = Depends(get_db)
):
    """Master Admin endpoint: List all applications."""

    apps = (
        db.query(SchemeApplication)
        .order_by(SchemeApplication.applied_at.desc())
        .all()
    )

    result = []

    for a in apps:

        user = (
            db.query(User)
            .filter(User.id == a.user_id)
            .first()
        )

        result.append(
            {
                "id": a.id,
                "user_id": a.user_id,
                "user_name": (
                    user.name if user else "Unknown Applicant"
                ),
                "user_mobile": (
                    user.mobile if user else ""
                ),
                "user_state": (
                    user.state if user else "Maharashtra"
                ),
                "user_occupation": (
                    user.occupation if user else "Citizen"
                ),
                "scheme_name": a.scheme_name,
                "category": a.category,
                "benefit": a.benefit,
                "reason_for_applying": (
                    a.reason_for_applying
                    or "Eligible Applicant"
                ),
                "status": a.status,
                "current_handler": a.current_handler,
                "applied_at": str(a.applied_at),
                "reviewed_by": a.reviewed_by,
                "review_note": a.review_note,
                "version": a.version or 1,
                "raft_term": a.raft_term,
                "raft_index": a.raft_index
            }
        )

    return result


# ============================================================
# VERIFY / REJECT APPLICATION
# ============================================================

@router.put("/applications/{app_id}/verify")
async def verify_scheme_application(
    app_id: int,
    action: str,
    note: str = "",
    admin_id: int = 0,
    db: Session = Depends(get_db)
):
    """
    Hierarchical Multi-Stage Verification

    Clerk
        ↓
    District Collector
        ↓
    Department Secretary
        ↓
    Cabinet Minister / Super Admin
        ↓
    Final Approval
    """

    t0 = time.time()

    # --------------------------------------------------------
    # Validate Action
    # --------------------------------------------------------

    if action not in ["verified", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Action must be 'verified' or 'rejected'"
        )

    # --------------------------------------------------------
    # Distributed Lock
    # --------------------------------------------------------

    lock_mgr = get_lock_manager()

    lock_key = f"scheme_app:{app_id}:verify"

    token = lock_mgr.acquire(
        lock_key,
        owner_id=f"admin-{admin_id}",
        blocking_timeout=3.0
    )

    if not token:
        raise HTTPException(
            status_code=409,
            detail=(
                "Application is currently being reviewed "
                "by another admin node."
            )
        )

    try:

        # ----------------------------------------------------
        # Get Application
        # ----------------------------------------------------

        app = (
            db.query(SchemeApplication)
            .filter(SchemeApplication.id == app_id)
            .first()
        )

        if not app:
            raise HTTPException(
                status_code=404,
                detail="Application not found"
            )

        # ----------------------------------------------------
        # Get Admin
        # ----------------------------------------------------

        admin_user = (
            db.query(User)
            .filter(User.id == admin_id)
            .first()
        )

        admin_role = (
            admin_user.role
            if admin_user
            else "admin"
        )

        # ====================================================
        # REJECTION
        # ====================================================

        if action == "rejected":

            # Determine exactly who rejected the application
            if admin_role == "clerk":

                rejected_by = "Clerk"
                rejection_stage = "Clerk Verification Stage"

            elif admin_role == "officer":

                rejected_by = "District Collector"
                rejection_stage = "District Collector Stage"

            elif admin_role == "state_admin":

                rejected_by = "Department Secretary"
                rejection_stage = "Department Secretary Stage"

            elif admin_role == "admin":

                rejected_by = "Cabinet Minister"
                rejection_stage = "Cabinet Minister Stage"

            else:

                rejected_by = "Administrator"
                rejection_stage = "Administrative Review Stage"

            app.status = "rejected"

            app.current_handler = (
                f"Rejected by {rejected_by}"
            )

            # Preserve the rejecting authority and stage
            # in the existing review_note field.
            if note:

                note = (
                    f"Rejected by {rejected_by} "
                    f"at {rejection_stage}. "
                    f"Reason: {note}"
                )

            else:

                note = (
                    f"Rejected by {rejected_by} "
                    f"at {rejection_stage}."
                )

        # ====================================================
        # APPROVAL
        # ====================================================

        elif action == "verified":

            # ------------------------------------------------
            # LEVEL 1 — CLERK
            # ------------------------------------------------

            if (
                admin_role == "clerk"
                and app.status == "pending_clerk"
            ):

                app.status = "pending_district"

                app.current_handler = (
                    "District Officer / DM"
                )

            # ------------------------------------------------
            # LEVEL 2 — DISTRICT COLLECTOR
            # ------------------------------------------------

            elif (
                admin_role == "officer"
                and app.status in [
                    "pending_district",
                    "pending_clerk"
                ]
            ):

                app.status = "pending_state"

                app.current_handler = (
                    "Department Secretary"
                )

            # ------------------------------------------------
            # LEVEL 3 — DEPARTMENT SECRETARY
            # ------------------------------------------------

            elif (
                admin_role == "state_admin"
                and app.status in [
                    "pending_state",
                    "pending_district",
                    "pending_clerk"
                ]
            ):

                app.status = "pending_minister"

                app.current_handler = (
                    "Cabinet Minister "
                    "(Apex Super Admin)"
                )

            # ------------------------------------------------
            # LEVEL 4 — CABINET MINISTER / SUPER ADMIN
            # ------------------------------------------------

            elif (
                admin_role == "admin"
                or app.status in [
                    "pending_minister",
                    "pending_state",
                    "pending_district",
                    "pending_officer"
                ]
            ):

                cluster = get_raft_cluster()

                proposal = {
                    "action": "FINAL_APPROVE_SCHEME",
                    "app_id": app.id,
                    "scheme_name": app.scheme_name,
                    "user_id": app.user_id,
                    "approver_id": admin_id
                }

                raft_res = cluster.propose_command(
                    proposal
                )

                if raft_res.get("quorum_reached"):

                    app.status = "verified"

                    app.current_handler = (
                        "Approved & Disbursed"
                    )

                    app.raft_term = raft_res.get(
                        "term"
                    )

                    app.raft_index = raft_res.get(
                        "index"
                    )

                    note = (
                        note
                        or
                        "Final Approval committed by "
                        "Cabinet Minister via Raft Quorum "
                        f"(Term {app.raft_term}, "
                        f"Index {app.raft_index})"
                    )

                else:

                    raise HTTPException(
                        status_code=500,
                        detail=(
                            "Raft Consensus Quorum failed. "
                            "Approval aborted."
                        )
                    )

            # ------------------------------------------------
            # INVALID TRANSITION
            # ------------------------------------------------

            else:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Invalid state transition "
                        "for your current role."
                    )
                )

        # ====================================================
        # UPDATE REVIEW INFORMATION
        # ====================================================

        app.reviewed_by = admin_id
        app.review_note = note
        app.version = (app.version or 1) + 1

        # ====================================================
        # CORRECT NOTIFICATION STATUS
        # ====================================================

        if app.status == "verified":

            status_label = (
                "Approved & Disbursed"
            )

            notification_category = "success"

        elif app.status == "rejected":

            # The note already contains:
            # who rejected + stage + optional reason
            status_label = note

            notification_category = "warning"

        elif app.status == "pending_district":

            status_label = (
                "Approved by Clerk - "
                "Pending District Collector review"
            )

            notification_category = "info"

        elif app.status == "pending_state":

            status_label = (
                "Approved by District Collector - "
                "Pending Department Secretary review"
            )

            notification_category = "info"

        elif app.status == "pending_minister":

            status_label = (
                "Approved by Department Secretary - "
                "Pending Cabinet Minister final approval"
            )

            notification_category = "info"

        else:

            status_label = "Pending Review"

            notification_category = "info"

        # ====================================================
        # SEND NOTIFICATION
        # ====================================================

        await publish_message(
            "notification.dispatch",
            {
                "user_id": app.user_id,
                "message": (
                    f"Your application for "
                    f"'{app.scheme_name}' was updated to "
                    f"'{status_label}'."
                ),
                "category": notification_category
            }
        )

        # ====================================================
        # DC EVENT LOG
        # ====================================================

        dc_evt = DCEvent(
            node_id="doc-node-01",
            event_type="doc_verify",
            latency_ms=round(
                (time.time() - t0) * 1000,
                2
            ),
            status=app.status,
            payload=(
                f"Role '{admin_role}' "
                f"(ID #{admin_id}) set "
                f"Application #{app.id} to "
                f"'{app.status}' "
                f"(Handler: {app.current_handler})"
            )
        )

        db.add(dc_evt)

        # ====================================================
        # SAVE
        # ====================================================

        db.commit()

        # ====================================================
        # RESPONSE
        # ====================================================

        return {
            "status": "success",
            "message": (
                f"Application status updated "
                f"to {app.status}"
            ),
            "app_status": app.status,
            "current_handler": app.current_handler,
            "version": app.version
        }

    finally:

        lock_mgr.release(
            lock_key,
            token
        )


# ============================================================
# MASTER METRICS
# ============================================================

@router.get("/applications/master-metrics")
def get_master_metrics(
    db: Session = Depends(get_db)
):
    """Operational telemetry endpoint."""

    total_apps = (
        db.query(SchemeApplication).count()
    )

    pending_clerk = (
        db.query(SchemeApplication)
        .filter(
            SchemeApplication.status
            == "pending_clerk"
        )
        .count()
    )

    pending_district = (
        db.query(SchemeApplication)
        .filter(
            SchemeApplication.status
            == "pending_district"
        )
        .count()
    )

    pending_state = (
        db.query(SchemeApplication)
        .filter(
            SchemeApplication.status
            == "pending_state"
        )
        .count()
    )

    pending_minister = (
        db.query(SchemeApplication)
        .filter(
            SchemeApplication.status
            == "pending_minister"
        )
        .count()
    )

    total_approved = (
        db.query(SchemeApplication)
        .filter(
            SchemeApplication.status
            == "verified"
        )
        .count()
    )

    total_rejected = (
        db.query(SchemeApplication)
        .filter(
            SchemeApplication.status
            == "rejected"
        )
        .count()
    )

    # --------------------------------------------------------
    # State Distribution
    # --------------------------------------------------------

    apps = (
        db.query(SchemeApplication).all()
    )

    shards = {}

    for a in apps:

        u = (
            db.query(User)
            .filter(User.id == a.user_id)
            .first()
        )

        st = (
            u.state
            if u
            else "Other"
        )

        shards[st] = (
            shards.get(st, 0) + 1
        )

    # --------------------------------------------------------
    # Distributed System Metrics
    # --------------------------------------------------------

    lock_mgr = get_lock_manager()

    raft_cluster = get_raft_cluster()

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "total_applications": total_apps,

        "pending_local_admin": pending_clerk,

        "pending_district": pending_district,

        "pending_state": pending_state,

        "pending_minister": pending_minister,

        "pending_super_admin": (
            pending_minister
        ),

        "total_approved": total_approved,

        "total_rejected": total_rejected,

        "shard_distribution": shards,

        "active_distributed_locks": (
            lock_mgr
            .get_stats()
            .get("active_locks", 0)
        ),

        "raft_consensus_leader": (
            raft_cluster.leader_id
        ),

        "snapshot_at": (
            datetime.utcnow().isoformat()
        )
    }