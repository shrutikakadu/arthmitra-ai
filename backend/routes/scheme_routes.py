from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, DCEvent
import time
import httpx

router = APIRouter()

@router.post("/match-schemes")
async def match_schemes(data: dict, db: Session = Depends(get_db)):
    t0 = time.time()

    from distributed_cache import get_cache, cache_key_for_profile
    from circuit_breaker import get_breaker

    cache = get_cache()
    cb = get_breaker("ml-matcher")

    # 1. Distributed Cache lookup (DC Concept #11)
    ckey = cache_key_for_profile(data)
    cached_res = cache.get(ckey)
    if cached_res:
        lat = round((time.time() - t0) * 1000, 2)
        db_evt = DCEvent(
            node_id="cache-node-01",
            event_type="cache_hit",
            latency_ms=lat,
            status="success",
            payload=f"Cache HIT for user profile in state: {data.get('state', 'Unknown')}"
        )
        db.add(db_evt)
        db.commit()
        return cached_res

    # 2. Check Circuit Breaker (DC Concept #6)
    if cb.is_open:
        cb.record_rejected()
        raise HTTPException(status_code=503, detail="ML Service Circuit OPEN. Please try again shortly.")

    # 3. RPC call to internal ML microservice (DC Concept #3)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post("http://127.0.0.1:8000/api/internal/ml/match", json=data, timeout=10.0)
            response.raise_for_status()
            result = response.json()
            cb.record_success()
            
            # Cache the result for 5 minutes
            cache.set(ckey, result, ttl=300)
    except Exception as e:
        cb.record_failure()
        print(f"RPC Error calling ML service: {e}")
        raise HTTPException(status_code=503, detail="ML Service Unavailable")

    lat = round((time.time() - t0) * 1000, 2)
    
    # Log DC Event for ML Scheme Matcher & NLP Engine
    db_evt = DCEvent(
        node_id="ml-node-01",
        event_type="scheme_query",
        latency_ms=lat,
        status="success",
        payload=f"Matched {len(result.get('schemes', []))} schemes for user profile in state: {data.get('state', 'Unknown')}"
    )
    db.add(db_evt)
    db.commit()
    return result