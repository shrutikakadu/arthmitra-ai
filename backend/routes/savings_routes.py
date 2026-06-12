from fastapi import APIRouter
router = APIRouter()

@router.post("/savings-plan")
def savings_plan(data: dict):
    return {"status": "ok", "plans": []}