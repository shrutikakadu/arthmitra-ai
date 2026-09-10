from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db, Document, User, DCEvent
from message_bus import notification_queue
from datetime import datetime
import os
import uuid
import time
import asyncio

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/documents/upload")
async def upload_document(
    user_id: int = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    t0 = time.time()
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{user_id}_{doc_type}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Note: Default status in DB is "pending_clerk"
    doc = Document(
        user_id=user_id,
        filename=unique_name,
        original_name=file.filename,
        doc_type=doc_type,
        uploaded_at=datetime.utcnow()
    )
    db.add(doc)

    doc_labels = {
        "aadhaar": "Aadhaar Card", "income_cert": "Income Certificate",
        "caste_cert": "Caste Certificate", "ration_card": "Ration Card",
        "bank_passbook": "Bank Passbook", "land_record": "Land Record",
        "pan_card": "PAN Card", "voter_id": "Voter ID"
    }
    label = doc_labels.get(doc_type, doc_type)
    
    # Message Passing: Push to background queue instead of direct DB insert
    await notification_queue.put({
        "user_id": user_id,
        "message": f"Your {label} has been uploaded successfully and is pending Clerk verification.",
        "category": "info"
    })

    dc_evt = DCEvent(
        node_id="doc-node-01",
        event_type="doc_upload",
        latency_ms=round((time.time() - t0) * 1000, 2),
        status="pending_clerk",
        payload=f"Uploaded {label} ({file.filename}) for User #{user_id}"
    )
    db.add(dc_evt)
    db.commit()

    return {
        "status": "success",
        "message": f"{label} uploaded successfully",
        "document": {
            "id": doc.id,
            "doc_type": doc.doc_type,
            "original_name": doc.original_name,
            "status": doc.status,
            "uploaded_at": str(doc.uploaded_at)
        }
    }


@router.get("/documents/my/{user_id}")
def get_my_documents(user_id: int, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.user_id == user_id).order_by(Document.uploaded_at.desc()).all()
    return [{
        "id": d.id, "doc_type": d.doc_type, "original_name": d.original_name,
        "filename": d.filename, "status": d.status, "uploaded_at": str(d.uploaded_at), "review_note": d.review_note
    } for d in docs]


@router.get("/documents/all")
def get_all_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    result = []
    for d in docs:
        user = db.query(User).filter(User.id == d.user_id).first()
        result.append({
            "id": d.id, "doc_type": d.doc_type, "original_name": d.original_name,
            "filename": d.filename, "status": d.status, "uploaded_at": str(d.uploaded_at),
            "review_note": d.review_note, "user_id": d.user_id,
            "user_name": user.name if user else "Unknown", "user_mobile": user.mobile if user else ""
        })
    return result


@router.put("/documents/{doc_id}/verify")
async def verify_document(doc_id: int, action: str, note: str = "", admin_id: int = 0, db: Session = Depends(get_db)):
    t0 = time.time()
    
    # Acquire Distributed Lock (DC Concept #10)
    from distributed_lock import get_lock_manager
    lock_mgr = get_lock_manager()
    resource_key = f"doc:{doc_id}:verify"
    token = lock_mgr.acquire(resource_key, owner_id=f"admin-{admin_id}", blocking_timeout=3.0)

    if not token:
        raise HTTPException(status_code=409, detail="Document is currently locked by another admin/officer for verification.")

    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
            
        admin_user = db.query(User).filter(User.id == admin_id).first()
        admin_role = admin_user.role if admin_user else "admin"

        # Hierarchical State Machine
        if action == "rejected":
            doc.status = "rejected"
        elif action == "verified":
            if admin_role == "clerk" and doc.status == "pending_clerk":
                doc.status = "pending_officer"
            elif admin_role == "officer" and doc.status == "pending_officer":
                doc.status = "verified"
            elif admin_role == "admin":
                doc.status = "verified" # Admins can bypass hierarchy
            else:
                raise HTTPException(status_code=400, detail="Invalid status transition for your role")
        else:
            raise HTTPException(status_code=400, detail="Action must be 'verified' or 'rejected'")

        doc.reviewed_by = admin_id
        doc.review_note = note
        doc.version = (doc.version or 1) + 1  # Optimistic concurrency version bump

        doc_labels = {
            "aadhaar": "Aadhaar Card", "income_cert": "Income Certificate",
            "caste_cert": "Caste Certificate", "ration_card": "Ration Card",
            "bank_passbook": "Bank Passbook", "land_record": "Land Record",
            "pan_card": "PAN Card", "voter_id": "Voter ID"
        }
        label = doc_labels.get(doc.doc_type, doc.doc_type)
        
        status_msg = f"updated to {doc.status.replace('_', ' ').title()}"
        notif_cat = "success" if doc.status == "verified" else "warning" if doc.status == "rejected" else "info"
    finally:
        lock_mgr.release(resource_key, token)


    msg = f"Your {label} status was {status_msg}."
    if note:
        msg += f" Note: {note}"

    # Message Passing
    await notification_queue.put({
        "user_id": doc.user_id,
        "message": msg,
        "category": notif_cat
    })

    dc_evt = DCEvent(
        node_id="doc-node-01",
        event_type="doc_verify",
        latency_ms=round((time.time() - t0) * 1000, 2),
        status=doc.status,
        payload=f"Role {admin_role} (ID #{admin_id}) set {label} to {doc.status} for User #{doc.user_id}"
    )
    db.add(dc_evt)
    db.commit()

    return {"status": "success", "message": f"Document {doc.status}", "doc_status": doc.status}
