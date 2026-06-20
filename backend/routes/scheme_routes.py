from fastapi import APIRouter
from ml_models.scheme_matcher import match_user_schemes

router = APIRouter()

@router.post("/match-schemes")
def match_schemes(data: dict):
    return match_user_schemes(data)