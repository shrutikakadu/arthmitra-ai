from fastapi import APIRouter
router = APIRouter()

@router.post("/health-score")
def health_score(data: dict):
    return {"status": "ok", "score": 0}