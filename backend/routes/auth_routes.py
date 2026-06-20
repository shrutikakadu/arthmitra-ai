from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db, User, Notification
import bcrypt

router = APIRouter()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


class RegisterData(BaseModel):
    name: str
    mobile: str
    password: str
    state: str
    language: str = "English"


class LoginData(BaseModel):
    mobile: str
    password: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    income: Optional[str] = None
    caste: Optional[str] = None
    family_size: Optional[int] = None
    gender: Optional[str] = None
    education: Optional[str] = None
    state: Optional[str] = None
    language: Optional[str] = None


@router.post("/auth/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.mobile == data.mobile).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mobile already registered")
    user = User(
        name=data.name,
        mobile=data.mobile,
        password=hash_password(data.password),
        state=data.state,
        language=data.language,
        role="user"
    )
    db.add(user)
    db.commit()

    # Welcome notification
    notif = Notification(
        user_id=user.id,
        message=f"Welcome to ArthMitra AI, {data.name}! Complete your profile to get matched with government schemes.",
        category="success"
    )
    db.add(notif)
    db.commit()

    return {"status": "success", "message": f"Welcome {data.name}!", "user_id": user.id}


@router.post("/auth/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.mobile == data.mobile).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid mobile or password")
    return {
        "status": "success",
        "message": f"Welcome back {user.name}!",
        "user": {
            "id": user.id,
            "name": user.name,
            "mobile": user.mobile,
            "state": user.state,
            "language": user.language,
            "role": user.role
        }
    }


@router.get("/auth/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "name": user.name,
        "mobile": user.mobile,
        "state": user.state,
        "language": user.language,
        "role": user.role,
        "age": user.age,
        "occupation": user.occupation,
        "income": user.income,
        "caste": user.caste,
        "family_size": user.family_size,
        "gender": user.gender,
        "education": user.education
    }


@router.put("/auth/profile/{user_id}")
def update_profile(user_id: int, data: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return {"status": "success", "message": "Profile updated successfully"}


@router.get("/auth/users")
def list_users(db: Session = Depends(get_db)):
    """Admin endpoint: list all users"""
    users = db.query(User).filter(User.role == "user").all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "mobile": u.mobile,
            "state": u.state,
            "role": u.role,
            "occupation": u.occupation,
            "income": u.income
        }
        for u in users
    ]