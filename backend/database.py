from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./arthmitra.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    mobile = Column(String, unique=True, index=True)
    password = Column(String)
    state = Column(String)
    language = Column(String, default="English")
    role = Column(String, default="user")  # "user" or "admin"

    # Profile fields
    age = Column(Integer, nullable=True)
    occupation = Column(String, nullable=True)
    income = Column(String, nullable=True)
    caste = Column(String, nullable=True)
    family_size = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    education = Column(String, nullable=True)

    documents = relationship("Document", back_populates="owner")
    notifications = relationship("Notification", back_populates="user")


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)  # aadhaar, income_cert, caste_cert, ration_card, etc.
    status = Column(String, default="pending")  # pending, verified, rejected
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by = Column(Integer, nullable=True)
    review_note = Column(String, nullable=True)

    owner = relationship("User", back_populates="documents")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    category = Column(String, default="info")  # info, success, warning, error
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)