from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes import scheme_routes, health_routes, savings_routes, voice_routes, internal_routes
from routes import auth_routes, document_routes, notification_routes, dc_routes
from database import create_tables
from message_bus import notification_worker
from db_replicator import start_replication
import os
import asyncio
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start Replication Thread (Fault Tolerance / WAL Replication)
    start_replication()
    # Startup: Start Message Queue Workers (Multi-topic Message Passing)
    from message_bus import doc_submitted_worker
    asyncio.create_task(notification_worker())
    asyncio.create_task(doc_submitted_worker())
    yield
    # Shutdown logic can go here


app = FastAPI(title="ArthMitra AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()

# Ensure uploads directory exists
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

from routes import auth_routes, document_routes, notification_routes, dc_routes, application_routes

app.include_router(scheme_routes.router, prefix="/api")
app.include_router(health_routes.router, prefix="/api")
app.include_router(savings_routes.router, prefix="/api")
app.include_router(voice_routes.router, prefix="/api")
app.include_router(auth_routes.router, prefix="/api")
app.include_router(document_routes.router, prefix="/api")
app.include_router(notification_routes.router, prefix="/api")
app.include_router(dc_routes.router, prefix="/api")
app.include_router(internal_routes.router, prefix="/api")
app.include_router(application_routes.router, prefix="/api")



@app.get("/")
def root():
    return {"message": "ArthMitra AI Backend Running ✅"}
    