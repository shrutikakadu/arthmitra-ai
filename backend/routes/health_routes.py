from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, DCEvent
from ml_models.health_scorer import calculate_health_score
import time, json

router = APIRouter()

@router.post("/health-score")
def health_score(data: dict, db: Session = Depends(get_db)):
    start = time.time()
    result = calculate_health_score(data)
    latency = round((time.time() - start) * 1000, 1)

    # Log DC event
    try:
        db.add(DCEvent(
            node_id="ml-node-01",
            event_type="ml_inference",
            latency_ms=latency,
            status="success",
            payload=json.dumps({"type": "health_score", "score": result.get("score")})
        ))
        db.commit()
    except Exception:
        pass

    result["latency_ms"] = latency
    result["processed_by"] = "ml-node-01"
    return result