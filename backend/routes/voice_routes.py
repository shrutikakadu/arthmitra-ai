from fastapi import APIRouter
from nlp.voice_processor import process_voice_text

router = APIRouter()

@router.post("/voice")
def voice_input(data: dict):
    text = data.get("text", "")
    parsed_profile = process_voice_text(text)
    return {
        "status": "ok",
        "text": text,
        "profile": parsed_profile
    }