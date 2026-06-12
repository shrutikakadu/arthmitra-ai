from fastapi import APIRouter
router = APIRouter()

@router.post("/match-schemes")
def match_schemes(data: dict):
    return {"status": "ok", "schemes": []}