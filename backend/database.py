import os
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MAIN_DB_PATH = os.path.join(BASE_DIR, "arthmitra.db")
REPLICA_DB_PATH = os.path.join(BASE_DIR, "arthmitra_replica.db")

DATABASE_URL = f"sqlite:///{MAIN_DB_PATH}"
REPLICA_URL = f"sqlite:///{REPLICA_DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

replica_engine = create_engine(REPLICA_URL, connect_args={"check_same_thread": False})
ReplicaSessionLocal = sessionmaker(bind=replica_engine)


Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    mobile = Column(String, unique=True, index=True)
    password = Column(String)
    state = Column(String)
    language = Column(String, default="English")
    role = Column(String, default="user")  # "user", "clerk", "officer", "admin"

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
    applications = relationship("SchemeApplication", back_populates="user")



class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)
    status = Column(String, default="pending_clerk")  # pending_clerk, pending_officer, verified, rejected
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by = Column(Integer, nullable=True)
    review_note = Column(String, nullable=True)
    version = Column(Integer, default=1)  # Optimistic Locking version

    owner = relationship("User", back_populates="documents")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    category = Column(String, default="info")
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class DCEvent(Base):
    """Distributed Computing event log — records every significant system event across virtual nodes."""
    __tablename__ = "dc_events"
    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    payload = Column(Text, nullable=True)
    latency_ms = Column(Float, nullable=True)
    status = Column(String, default="success")
    created_at = Column(DateTime, default=datetime.utcnow)


class SchemeApplication(Base):
    """Scheme lifecycle application record tracking hierarchical approval pipeline."""
    __tablename__ = "scheme_applications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheme_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    benefit = Column(String, nullable=True)
    reason_for_applying = Column(Text, nullable=True)
    status = Column(String, default="pending_clerk")  # pending_clerk, pending_officer, verified, rejected
    current_handler = Column(String, default="Local Admin (Clerk)")  # Local Admin (Clerk), Super Admin (Officer), System Admin
    applied_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by = Column(Integer, nullable=True)
    review_note = Column(String, nullable=True)
    version = Column(Integer, default=1)  # Optimistic concurrency version
    raft_term = Column(Integer, nullable=True)
    raft_index = Column(Integer, nullable=True)

    user = relationship("User", back_populates="applications")



def get_db():
    db = SessionLocal()
    try:
        # Simple fault tolerance check: if main DB file is missing or locked, fallback to replica
        if not os.path.exists(MAIN_DB_PATH) and os.path.exists(REPLICA_DB_PATH):
            print("WARNING: Main DB unavailable. Falling back to Replica DB.")
            db.close()
            db = ReplicaSessionLocal()
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
    if not os.path.exists(REPLICA_DB_PATH):
        Base.metadata.create_all(bind=replica_engine)

        
    # Seed default demo users if users table is empty
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            import bcrypt
            def _hash(pw):
                return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            demo_user = User(
                name="Ramesh Khedkar", mobile="9876543210", password=_hash("pass123"),
                state="Maharashtra", language="English", role="user", age=35, occupation="Farmer",
                income="₹50,000 - ₹1,000,000", caste="OBC", family_size=4, gender="Male", education="10th Pass"
            )
            clerk_user = User(
                name="Section Officer / Front Desk Clerk", mobile="1111111111", password=_hash("clerk123"),
                state="Maharashtra", language="English", role="clerk", occupation="ROLE_VERIFIER (Clerk)"
            )
            officer_user = User(
                name="District Collector / DM", mobile="2222222222", password=_hash("officer123"),
                state="Maharashtra", language="English", role="officer", occupation="ROLE_DISTRICT_ADMIN (DM)"
            )
            secretary_user = User(
                name="Department Secretary", mobile="3333333333", password=_hash("secretary123"),
                state="Maharashtra", language="English", role="state_admin", occupation="ROLE_STATE_ADMIN (Secretary)"
            )
            admin_user = User(
                name="Cabinet Minister", mobile="9999999999", password=_hash("admin123"),
                state="Maharashtra", language="English", role="admin", occupation="ROLE_SUPER_ADMIN (Minister)"
            )
            db.add_all([demo_user, clerk_user, officer_user, secretary_user, admin_user])
            db.commit()
            print("Database seeded with default 5-tier government hierarchy roles (Citizen, Clerk, DM, Secretary, Cabinet Minister).")


        if db.query(SchemeApplication).count() == 0:
            user = db.query(User).filter(User.role == "user").first()
            if user:
                app1 = SchemeApplication(
                    user_id=user.id,
                    scheme_name="PM Kisan Samman Nidhi",
                    category="Farmer",
                    benefit="₹6,000/year direct transfer",
                    reason_for_applying="Landholding farmer seeking agricultural subsidy for seeds & fertilizer.",
                    status="pending_clerk",
                    current_handler="Local Admin (Clerk)"
                )
                app2 = SchemeApplication(
                    user_id=user.id,
                    scheme_name="Ayushman Bharat PM-JAY",
                    category="Health",
                    benefit="₹5 Lakhs medical coverage",
                    reason_for_applying="Family medical insurance for secondary hospital care.",
                    status="pending_officer",
                    current_handler="Super Admin (Officer)"
                )
                app3 = SchemeApplication(
                    user_id=user.id,
                    scheme_name="PM Ujjwala Yojana 2.0",
                    category="Social Welfare",
                    benefit="Free LPG Gas Connection",
                    reason_for_applying="Clean cooking energy assistance.",
                    status="verified",
                    current_handler="Approved & Disbursed",
                    review_note="Verified via Raft Consensus Quorum (Term 1, Index 3)",
                    raft_term=1,
                    raft_index=3
                )
                db.add_all([app1, app2, app3])
                db.commit()
                print("Database seeded with demo scheme applications.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()