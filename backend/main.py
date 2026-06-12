from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import scheme_routes, health_routes, savings_routes, voice_routes
from routes import auth_routes
from database import create_tables

app = FastAPI(title="ArthMitra AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()

app.include_router(scheme_routes.router, prefix="/api")
app.include_router(health_routes.router, prefix="/api")
app.include_router(savings_routes.router, prefix="/api")
app.include_router(voice_routes.router, prefix="/api")
app.include_router(auth_routes.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "ArthMitra AI Backend Running ✅"}