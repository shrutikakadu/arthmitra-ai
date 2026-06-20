from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes import scheme_routes, health_routes, savings_routes, voice_routes
from routes import auth_routes, document_routes, notification_routes
from database import create_tables
import os

app = FastAPI(title="ArthMitra AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()

# Ensure uploads directory exists
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(scheme_routes.router, prefix="/api")
app.include_router(health_routes.router, prefix="/api")
app.include_router(savings_routes.router, prefix="/api")
app.include_router(voice_routes.router, prefix="/api")
app.include_router(auth_routes.router, prefix="/api")
app.include_router(document_routes.router, prefix="/api")
app.include_router(notification_routes.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "ArthMitra AI Backend Running ✅"}