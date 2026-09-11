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
    role = Column(String, default="user")  # "user", "clerk", "officer", "state_admin", "minister", "admin"

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
    application_id = Column(Integer, ForeignKey("scheme_applications.id"), nullable=True, index=True)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)
    status = Column(String, default="uploaded")  # uploaded, draft, pending_clerk, pending_officer, verified, rejected
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by = Column(Integer, nullable=True)
    review_note = Column(String, nullable=True)
    version = Column(Integer, default=1)  # Optimistic Locking version

    owner = relationship("User", back_populates="documents")
    application = relationship("SchemeApplication", back_populates="documents")


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
    status = Column(String, default="SUBMITTED")  # SUBMITTED, CLERK_APPROVED, OFFICER_APPROVED, FINAL_VERIFICATION, APPROVED, REJECTED
    current_handler = Column(String, default="Local Admin (Clerk)")
    applied_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by = Column(Integer, nullable=True)
    review_note = Column(String, nullable=True)
    version = Column(Integer, default=1)  # Optimistic concurrency version
    raft_term = Column(Integer, nullable=True)
    raft_index = Column(Integer, nullable=True)

    user = relationship("User", back_populates="applications")
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    audits = relationship("ApplicationAudit", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationAudit.timestamp.asc()")


class LiveScheme(Base):
    """Live curated government scheme catalog — updated by the ingestion pipeline."""
    __tablename__ = "live_schemes"
    id = Column(Integer, primary_key=True, index=True)
    scheme_name = Column(String, nullable=False, index=True)
    sponsoring_body = Column(String, nullable=False)
    category = Column(String, nullable=False)          # Agriculture, Health, Education, Housing, Social Welfare
    state = Column(String, nullable=True)              # None = Central / All India
    eligibility_caste = Column(String, nullable=True)  # ALL | OBC | SC | ST | EWS | SC,ST | OBC,EWS
    eligibility_income_max = Column(Float, nullable=True)   # Annual income ceiling in INR
    eligibility_education = Column(String, nullable=True)   # e.g. "10th Pass", "Graduate"
    eligibility_gender = Column(String, nullable=True)      # ALL | Male | Female
    eligibility_age_min = Column(Integer, nullable=True)
    eligibility_age_max = Column(Integer, nullable=True)
    eligibility_occupation = Column(String, nullable=True)  # Farmer, Student, etc.
    benefit_amount = Column(String, nullable=True)     # Human-readable e.g. "₹6,000/year"
    benefit_type = Column(String, nullable=True)       # DBT | Insurance | Scholarship | Subsidy | Loan
    deadline = Column(String, nullable=True)           # "Ongoing" or "DD-MMM-YYYY"
    official_link = Column(String, nullable=True)
    source_portal = Column(String, nullable=True)      # "NSP" | "MahaDBT" | "Central"
    description = Column(Text, nullable=True)
    required_docs = Column(Text, nullable=True)        # JSON-encoded list
    faq_json = Column(Text, nullable=True)             # JSON-encoded [{q,a}] list
    last_synced = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class ApplicationAudit(Base):
    """Immutable audit/history log for scheme application verification transitions."""
    __tablename__ = "application_audits"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("scheme_applications.id"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # citizen, clerk, officer, state_admin, admin, minister
    action = Column(String, nullable=False)  # SUBMITTED, CLERK_APPROVED, OFFICER_APPROVED, SECRETARY_APPROVED, APPROVED, REJECTED
    from_status = Column(String, nullable=True)
    to_status = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    application = relationship("SchemeApplication", back_populates="audits")
    actor = relationship("User", foreign_keys=[actor_id])


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


def _migrate_documents_table(target_engine):
    """Safe SQLite migration: ensures application_id column exists without deleting data."""
    try:
        with target_engine.connect() as conn:
            cursor = conn.connection.cursor()
            cursor.execute("PRAGMA table_info(documents)")
            columns = [row[1] for row in cursor.fetchall()]
            if columns and "application_id" not in columns:
                cursor.execute("ALTER TABLE documents ADD COLUMN application_id INTEGER REFERENCES scheme_applications(id)")
                conn.connection.commit()
                print(f"Migrated {target_engine.url}: added application_id column to documents table.")
    except Exception as e:
        print(f"Migration note for {target_engine.url}: {e}")



def _migrate_government_roles(target_session_factory):
    """Repair and sync all demo government accounts & passwords without deleting data."""
    import bcrypt
    db = target_session_factory()
    demo_accounts = [
        {
            "mobile": "9876543210",
            "name": "Ramesh Khedkar",
            "password": "pass123",
            "role": "user",
            "occupation": "Farmer",
            "age": 35,
            "caste": "OBC",
            "income": "₹50,000 - ₹1,000,000",
            "family_size": 4,
            "gender": "Male",
            "education": "10th Pass",
        },
        {
            "mobile": "1111111111",
            "name": "Section Officer / Front Desk Clerk",
            "password": "clerk123",
            "role": "clerk",
            "occupation": "ROLE_VERIFIER (Clerk)",
        },
        {
            "mobile": "2222222222",
            "name": "District Collector / DM",
            "password": "officer123",
            "role": "officer",
            "occupation": "ROLE_DISTRICT_ADMIN (DM)",
        },
        {
            "mobile": "3333333333",
            "name": "Department Secretary",
            "password": "secretary123",
            "role": "state_admin",
            "occupation": "ROLE_STATE_ADMIN (Secretary)",
        },
        {
            "mobile": "9999999999",
            "name": "Cabinet Minister",
            "password": "minister123",
            "role": "minister",
            "occupation": "ROLE_MINISTER (Apex Approver)",
        },
        {
            "mobile": "5555555555",
            "name": "System Administrator",
            "password": "sysadmin123",
            "role": "admin",
            "occupation": "ROLE_SYSADMIN (DC Monitor)",
        },
    ]

    try:
        for acc in demo_accounts:
            u = db.query(User).filter(User.mobile == acc["mobile"]).first()
            hashed_pw = bcrypt.hashpw(acc["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            if u:
                u.password = hashed_pw
                u.role = acc["role"]
                u.name = acc["name"]
                if "occupation" in acc:
                    u.occupation = acc["occupation"]
            else:
                new_u = User(
                    mobile=acc["mobile"],
                    name=acc["name"],
                    password=hashed_pw,
                    role=acc["role"],
                    state="Maharashtra",
                    language="English",
                    occupation=acc.get("occupation", ""),
                    age=acc.get("age"),
                    caste=acc.get("caste"),
                    income=acc.get("income"),
                    family_size=acc.get("family_size"),
                    gender=acc.get("gender"),
                    education=acc.get("education"),
                )
                db.add(new_u)
        db.commit()
        print("Demo accounts and government hierarchy roles synced successfully.")
    except Exception as e:
        db.rollback()
        print(f"Government role migration note: {e}")
    finally:
        db.close()



def create_tables():
    Base.metadata.create_all(bind=engine)
    _migrate_documents_table(engine)
    if not os.path.exists(REPLICA_DB_PATH):
        Base.metadata.create_all(bind=replica_engine)
    else:
        _migrate_documents_table(replica_engine)
    _migrate_live_schemes_table(engine)


def _migrate_live_schemes_table(target_engine):
    """Ensure live_schemes table exists (non-destructive)."""
    try:
        Base.metadata.create_all(bind=target_engine, tables=[LiveScheme.__table__], checkfirst=True)
    except Exception as e:
        print(f"LiveScheme migration note: {e}")

        
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
                name="Cabinet Minister", mobile="9999999999", password=_hash("minister123"),
                state="Maharashtra", language="English", role="minister", occupation="ROLE_MINISTER (Apex Approver)"
            )
            db.add_all([demo_user, clerk_user, officer_user, secretary_user, admin_user])
            db.commit()
            print("Database seeded with default 5-tier government hierarchy roles (Citizen, Clerk, DM, Secretary, Cabinet Minister).")

        # Always repair the minister demo account, including existing databases
        # that were created by an older version of the project.
        _migrate_government_roles(SessionLocal)

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