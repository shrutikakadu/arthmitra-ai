from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, DCEvent
from ml_models.savings_recommender import recommend_savings
import time, json

router = APIRouter()

@router.post("/savings-plan")
def savings_plan(data: dict, db: Session = Depends(get_db)):
    start = time.time()
    result = recommend_savings(data)
    latency = round((time.time() - start) * 1000, 1)

    # Log DC event
    try:
        db.add(DCEvent(
            node_id="savings-node-01",
            event_type="ml_inference",
            latency_ms=latency,
            status="success",
            payload=json.dumps({"type": "savings_plan", "plans": len(result.get("plans", []))})
        ))
        db.commit()
    except Exception:
        pass

    result["latency_ms"] = latency
    result["processed_by"] = "savings-node-01"
    return result