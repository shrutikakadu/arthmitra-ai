from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
)

from sqlalchemy.orm import Session

from typing import Optional

from database import (
    get_db,
    Document,
    User,
    DCEvent,
    SchemeApplication,
)

from message_bus import notification_queue

from datetime import datetime

import os
import uuid
import time


router = APIRouter()


UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "uploads",
)

os.makedirs(UPLOAD_DIR, exist_ok=True)


DOC_LABELS = {
    "aadhaar": "Aadhaar Card",
    "income_cert": "Income Certificate",
    "caste_cert": "Caste Certificate",
    "ration_card": "Ration Card",
    "bank_passbook": "Bank Passbook",
    "land_record": "Land Record",
    "pan_card": "PAN Card",
    "voter_id": "Voter ID",
}


# ============================================================
# UPLOAD DOCUMENT
# ============================================================

@router.post("/documents/upload")
async def upload_document(
    user_id: int = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    application_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    t0 = time.time()

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    scheme_app = None

    # ========================================================
    # APPLICATION DOCUMENT
    # ========================================================

    if application_id is not None:

        scheme_app = (
            db.query(SchemeApplication)
            .filter(SchemeApplication.id == application_id)
            .first()
        )

        if not scheme_app:
            raise HTTPException(
                status_code=404,
                detail="Application not found",
            )

        if scheme_app.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You do not have permission to attach "
                    "documents to this application."
                ),
            )

        # Documents can only be uploaded while application
        # is still being prepared/submitted.
        if scheme_app.status not in ["draft", "SUBMITTED"]:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Documents cannot be uploaded because "
                    f"application is currently {scheme_app.status}."
                ),
            )

    # ========================================================
    # SAVE FILE
    # ========================================================

    ext = os.path.splitext(file.filename or "")[1]

    app_prefix = (
        f"app{application_id}_"
        if application_id is not None
        else "profile_"
    )

    unique_name = (
        f"{user_id}_"
        f"{app_prefix}"
        f"{doc_type}_"
        f"{uuid.uuid4().hex[:8]}"
        f"{ext}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        unique_name,
    )

    content = await file.read()

    with open(file_path, "wb") as f:
        f.write(content)

    label = DOC_LABELS.get(
        doc_type,
        doc_type,
    )

    # ========================================================
    # APPLICATION DOCUMENT
    # ========================================================

    if scheme_app is not None:

        doc_status = (
            "draft"
            if scheme_app.status == "draft"
            else "pending_clerk"
        )

        doc = Document(
            user_id=user_id,
            application_id=application_id,
            filename=unique_name,
            original_name=file.filename,
            doc_type=doc_type,
            status=doc_status,
            uploaded_at=datetime.utcnow(),
        )

        db.add(doc)

        db.flush()

        message = (
            f"Your {label} was attached to "
            f"application #{application_id}."
        )

        if doc_status == "pending_clerk":
            message += (
                " It is now pending Clerk verification."
            )
        else:
            message += (
                " Please upload all required documents "
                "and submit the application."
            )

        await notification_queue.put({
            "user_id": user_id,
            "message": message,
            "category": "info",
        })

        db.add(
            DCEvent(
                node_id="doc-node-01",
                event_type="doc_upload",
                latency_ms=round(
                    (time.time() - t0) * 1000,
                    2,
                ),
                status=doc_status,
                payload=(
                    f"Uploaded {label} "
                    f"({file.filename}) linked to "
                    f"Application #{application_id}"
                ),
            )
        )

        db.commit()
        db.refresh(doc)

        return {
            "status": "success",
            "message": (
                f"{label} uploaded and linked to "
                f"Application #{application_id}"
            ),
            "document": {
                "id": doc.id,
                "application_id": doc.application_id,
                "doc_type": doc.doc_type,
                "original_name": doc.original_name,
                "status": doc.status,
                "uploaded_at": str(doc.uploaded_at),
            },
        }

    # ========================================================
    # PROFILE / PERSONAL LOCKER DOCUMENT
    # ========================================================

    doc = Document(
        user_id=user_id,
        application_id=None,
        filename=unique_name,
        original_name=file.filename,
        doc_type=doc_type,
        status="uploaded",
        uploaded_at=datetime.utcnow(),
    )

    db.add(doc)

    db.flush()

    await notification_queue.put({
        "user_id": user_id,
        "message": (
            f"Your {label} has been uploaded "
            "to your profile locker."
        ),
        "category": "info",
    })

    db.add(
        DCEvent(
            node_id="doc-node-01",
            event_type="doc_upload",
            latency_ms=round(
                (time.time() - t0) * 1000,
                2,
            ),
            status="uploaded",
            payload=(
                f"Uploaded standalone {label} "
                f"({file.filename}) for User #{user_id}. "
                "Profile locker only."
            ),
        )
    )

    db.commit()
    db.refresh(doc)

    return {
        "status": "success",
        "message": f"{label} uploaded to profile locker",
        "document": {
            "id": doc.id,
            "application_id": None,
            "doc_type": doc.doc_type,
            "original_name": doc.original_name,
            "status": doc.status,
            "uploaded_at": str(doc.uploaded_at),
        },
    }


# ============================================================
# MY DOCUMENTS
# ============================================================

@router.get("/documents/my/{user_id}")
def get_my_documents(
    user_id: int,
    db: Session = Depends(get_db),
):
    docs = (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )

    return [
        {
            "id": d.id,
            "application_id": d.application_id,
            "doc_type": d.doc_type,
            "original_name": d.original_name,
            "filename": d.filename,
            "status": d.status,
            "uploaded_at": str(d.uploaded_at),
            "review_note": d.review_note,
        }
        for d in docs
    ]


# ============================================================
# ALL DOCUMENTS
# ============================================================

@router.get("/documents/all")
def get_all_documents(
    db: Session = Depends(get_db),
):
    docs = (
        db.query(Document)
        .order_by(Document.uploaded_at.desc())
        .all()
    )

    result = []

    for d in docs:

        user = (
            db.query(User)
            .filter(User.id == d.user_id)
            .first()
        )

        scheme_app = None

        if d.application_id:
            scheme_app = (
                db.query(SchemeApplication)
                .filter(
                    SchemeApplication.id
                    == d.application_id
                )
                .first()
            )

        result.append({
            "id": d.id,
            "application_id": d.application_id,
            "scheme_name": (
                scheme_app.scheme_name
                if scheme_app
                else None
            ),
            "doc_type": d.doc_type,
            "original_name": d.original_name,
            "filename": d.filename,
            "status": d.status,
            "uploaded_at": str(d.uploaded_at),
            "review_note": d.review_note,
            "user_id": d.user_id,
            "user_name": (
                user.name
                if user
                else "Unknown"
            ),
            "user_mobile": (
                user.mobile
                if user
                else ""
            ),
        })

    return result


# ============================================================
# VERIFY DOCUMENT
# ============================================================

@router.put("/documents/{doc_id}/verify")
async def verify_document(
    doc_id: int,
    action: str,
    note: str = "",
    admin_id: int = 0,
    db: Session = Depends(get_db),
):
    t0 = time.time()

    if action not in ["verified", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail=(
                "Action must be 'verified' "
                "or 'rejected'"
            ),
        )

    doc = (
        db.query(Document)
        .filter(Document.id == doc_id)
        .first()
    )

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    # ========================================================
    # PROFILE DOCUMENTS CAN NEVER ENTER SCHEME VERIFICATION
    # ========================================================

    if doc.application_id is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "This is a profile document and is not "
                "associated with a scheme application."
            ),
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

    # ========================================================
    # ONLY CLERK VERIFIES APPLICATION DOCUMENTS
    # ========================================================

    if role != "clerk":
        raise HTTPException(
            status_code=403,
            detail=(
                "Only the Clerk can verify scheme "
                "application documents."
            ),
        )

    if doc.status != "pending_clerk":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only documents pending Clerk verification "
                f"can be processed. Current status: {doc.status}"
            ),
        )

    app = (
        db.query(SchemeApplication)
        .filter(
            SchemeApplication.id
            == doc.application_id
        )
        .first()
    )

    if not app:
        raise HTTPException(
            status_code=404,
            detail="Parent application not found",
        )

    # ========================================================
    # REJECT DOCUMENT
    # ========================================================

    if action == "rejected":

        doc.status = "rejected"
        doc.reviewed_by = admin_id
        doc.review_note = note
        doc.version = (doc.version or 1) + 1

        app.status = "REJECTED"
        app.current_handler = "Rejected by Clerk"
        app.reviewed_by = admin_id
        app.review_note = (
            f"Document '{doc.doc_type}' rejected."
            + (f" Reason: {note}" if note else "")
        )
        app.version = (app.version or 1) + 1

        db.commit()

        await notification_queue.put({
            "user_id": doc.user_id,
            "message": (
                f"Your {DOC_LABELS.get(doc.doc_type, doc.doc_type)} "
                f"for application #{app.id} was rejected."
                + (f" Reason: {note}" if note else "")
            ),
            "category": "warning",
        })

        return {
            "status": "success",
            "message": "Document rejected",
            "doc_status": doc.status,
            "application_status": app.status,
            "application_handler": app.current_handler,
        }

    # ========================================================
    # VERIFY DOCUMENT
    # ========================================================

    doc.status = "verified"
    doc.reviewed_by = admin_id
    doc.review_note = note
    doc.version = (doc.version or 1) + 1

    # --------------------------------------------------------
    # Check all documents for this application.
    # --------------------------------------------------------

    all_app_docs = (
        db.query(Document)
        .filter(
            Document.application_id == app.id
        )
        .all()
    )

    all_verified = (
        len(all_app_docs) > 0
        and all(
            d.status == "verified"
            for d in all_app_docs
        )
    )

    # --------------------------------------------------------
    # IMPORTANT:
    # Document verification does NOT itself approve the
    # application.
    #
    # Once all docs are verified, the application remains
    # SUBMITTED and becomes ready for Clerk application
    # approval.
    # --------------------------------------------------------

    if all_verified and app.status == "SUBMITTED":

        app.review_note = (
            "All application documents have been "
            "verified by Clerk. Application is ready "
            "for Clerk approval."
        )

    app.reviewed_by = admin_id
    app.version = (app.version or 1) + 1

    label = DOC_LABELS.get(
        doc.doc_type,
        doc.doc_type,
    )

    db.add(
        DCEvent(
            node_id="doc-node-01",
            event_type="doc_verify",
            latency_ms=round(
                (time.time() - t0) * 1000,
                2,
            ),
            status=doc.status,
            payload=(
                f"Clerk #{admin_id} verified "
                f"{label} for Application #{app.id}"
            ),
        )
    )

    db.commit()
    db.refresh(doc)
    db.refresh(app)

    message = (
        f"Your {label} for application #{app.id} "
        "has been verified by the Clerk."
    )

    if all_verified:
        message += (
            " All application documents are now verified."
        )

    await notification_queue.put({
        "user_id": doc.user_id,
        "message": message,
        "category": "success",
    })

    return {
        "status": "success",
        "message": "Document verified",
        "doc_status": doc.status,
        "application_status": app.status,
        "application_handler": app.current_handler,
        "all_documents_verified": all_verified,
    }