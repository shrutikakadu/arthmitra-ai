from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db, Document, Notification, User
from datetime import datetime
import os
import uuid

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
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{user_id}_{doc_type}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    # Save file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Create document record
    doc = Document(
        user_id=user_id,
        filename=unique_name,
        original_name=file.filename,
        doc_type=doc_type,
        status="pending",
        uploaded_at=datetime.utcnow()
    )
    db.add(doc)

    # Create notification
    doc_labels = {
        "aadhaar": "Aadhaar Card",
        "income_cert": "Income Certificate",
        "caste_cert": "Caste Certificate",
        "ration_card": "Ration Card",
        "bank_passbook": "Bank Passbook",
        "land_record": "Land Record",
        "pan_card": "PAN Card",
        "voter_id": "Voter ID"
    }
    label = doc_labels.get(doc_type, doc_type)
    notif = Notification(
        user_id=user_id,
        message=f"Your {label} has been uploaded successfully and is pending verification.",
        category="info"
    )
    db.add(notif)
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
    return [
        {
            "id": d.id,
            "doc_type": d.doc_type,
            "original_name": d.original_name,
            "filename": d.filename,
            "status": d.status,
            "uploaded_at": str(d.uploaded_at),
            "review_note": d.review_note
        }
        for d in docs
    ]


@router.get("/documents/all")
def get_all_documents(db: Session = Depends(get_db)):
    """Admin endpoint: get all documents with user info"""
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    result = []
    for d in docs:
        user = db.query(User).filter(User.id == d.user_id).first()
        result.append({
            "id": d.id,
            "doc_type": d.doc_type,
            "original_name": d.original_name,
            "filename": d.filename,
            "status": d.status,
            "uploaded_at": str(d.uploaded_at),
            "review_note": d.review_note,
            "user_id": d.user_id,
            "user_name": user.name if user else "Unknown",
            "user_mobile": user.mobile if user else ""
        })
    return result


@router.put("/documents/{doc_id}/verify")
def verify_document(doc_id: int, action: str, note: str = "", admin_id: int = 0, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if action not in ["verified", "rejected"]:
        raise HTTPException(status_code=400, detail="Action must be 'verified' or 'rejected'")

    doc.status = action
    doc.reviewed_by = admin_id
    doc.review_note = note

    # Notify user
    doc_labels = {
        "aadhaar": "Aadhaar Card", "income_cert": "Income Certificate",
        "caste_cert": "Caste Certificate", "ration_card": "Ration Card",
        "bank_passbook": "Bank Passbook", "land_record": "Land Record",
        "pan_card": "PAN Card", "voter_id": "Voter ID"
    }
    label = doc_labels.get(doc.doc_type, doc.doc_type)
    status_msg = "verified ✅" if action == "verified" else "rejected ❌"
    notif_cat = "success" if action == "verified" else "warning"

    notif = Notification(
        user_id=doc.user_id,
        message=f"Your {label} has been {status_msg}." + (f" Note: {note}" if note else ""),
        category=notif_cat
    )
    db.add(notif)
    db.commit()

    return {"status": "success", "message": f"Document {action}"}
