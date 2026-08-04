from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db, User, Notification, DCEvent
import time
import bcrypt

router = APIRouter()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    try:
        if bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8')):
            return True
        return bcrypt.checkpw(password.strip().encode('utf-8'), hashed.encode('utf-8'))
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
    t0 = time.time()
    clean_mobile = data.mobile.strip()
    clean_password = data.password.strip()

    existing = db.query(User).filter(User.mobile == clean_mobile).first()
    if existing:
        # Log failed DC Event
        dc_evt = DCEvent(
            node_id="auth-node-01",
            event_type="user_register",
            payload=f"Mobile {clean_mobile} duplicate attempt",
            latency_ms=round((time.time() - t0) * 1000, 2),
            status="failed"
        )
        db.add(dc_evt)
        db.commit()
        raise HTTPException(status_code=400, detail="Mobile already registered")

    user = User(
        name=data.name.strip(),
        mobile=clean_mobile,
        password=hash_password(clean_password),
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

    # Log successful DC Event
    dc_evt = DCEvent(
        node_id="auth-node-01",
        event_type="user_register",
        payload=f"Registered user: {user.name} ({user.mobile}), Shard: {user.state}",
        latency_ms=round((time.time() - t0) * 1000, 2),
        status="success"
    )
    db.add(dc_evt)
    db.commit()

    return {"status": "success", "message": f"Welcome {data.name}!", "user_id": user.id}


@router.post("/auth/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    t0 = time.time()
    clean_mobile = data.mobile.strip()
    clean_password = data.password.strip()

    from distributed_cache import get_cache
    cache = get_cache()

    # Rate Limiting check (DC Concept #1 & #10) — 20 attempts / min
    rate_res = cache.check_rate_limit(f"login:{clean_mobile}", max_requests=20, window=60)
    if not rate_res["allowed"]:
        raise HTTPException(status_code=429, detail="Too many login attempts. Please wait 1 minute.")

    user = db.query(User).filter(User.mobile == clean_mobile).first()
    if not user or not verify_password(clean_password, user.password):
        # Log failed auth event
        dc_evt = DCEvent(
            node_id="auth-node-01",
            event_type="login",
            payload=f"Failed auth for mobile: {clean_mobile}",
            latency_ms=round((time.time() - t0) * 1000, 2),
            status="failed"
        )
        db.add(dc_evt)
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid mobile or password")


    # Cache user session token in distributed cache (DC Concept #11)
    session_data = {"id": user.id, "name": user.name, "role": user.role, "state": user.state}
    cache.set(f"session:user:{user.id}", session_data, ttl=86400)

    # Log successful auth event
    dc_evt = DCEvent(
        node_id="auth-node-01",
        event_type="login",
        payload=f"User authenticated: {user.name} (Role: {user.role})",
        latency_ms=round((time.time() - t0) * 1000, 2),
        status="success"
    )
    db.add(dc_evt)
    db.commit()


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