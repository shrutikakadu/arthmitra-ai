from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, User
from passlib.context import CryptContext

router = APIRouter()
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

class RegisterData(BaseModel):
    name: str
    mobile: str
    password: str
    state: str
    language: str = "English"

class LoginData(BaseModel):
    mobile: str
    password: str

@router.post("/auth/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.mobile == data.mobile).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mobile already registered")
    user = User(
        name=data.name,
        mobile=data.mobile,
        password=pwd.hash(data.password),
        state=data.state,
        language=data.language
    )
    db.add(user)
    db.commit()
    return {"status": "success", "message": f"Welcome {data.name}!", "user_id": user.id}

@router.post("/auth/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.mobile == data.mobile).first()
    if not user or not pwd.verify(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid mobile or password")
    return {
        "status": "success",
        "message": f"Welcome back {user.name}!",
        "user": {
            "id": user.id,
            "name": user.name,
            "mobile": user.mobile,
            "state": user.state,
            "language": user.language
        }
    }