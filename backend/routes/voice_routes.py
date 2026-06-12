from fastapi import APIRouter
router = APIRouter()

@router.post("/voice")
def voice_input():
    return {"status": "ok", "text": ""}