from fastapi import APIRouter
from ml_models.scheme_matcher import match_user_schemes

router = APIRouter()

@router.post("/internal/ml/match")
def internal_match_schemes(data: dict):
    """
    Internal Microservice endpoint for ML Scheme Matching.
    This simulates a physically separated ML service node.
    """
    return match_user_schemes(data)
