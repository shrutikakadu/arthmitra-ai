from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, User, Document, DCEvent, Notification
from datetime import datetime, timedelta
import random
import json

router = APIRouter()

# ─── Virtual Node Definitions ───────────────────────────────────────────────
NODES = [
    {"id": "auth-node-01",    "service": "Authentication Service",  "region": "us-central",  "port": 8001, "replicas": 3},
    {"id": "ml-node-01",      "service": "ML Scheme Matcher",       "region": "us-east",     "port": 8002, "replicas": 2},
    {"id": "scheme-node-01",  "service": "Scheme Registry",         "region": "us-west",     "port": 8003, "replicas": 2},
    {"id": "nlp-node-01",     "service": "NLP Ranking Engine",      "region": "eu-west",     "port": 8004, "replicas": 2},
    {"id": "doc-node-01",     "service": "Document Verification",   "region": "ap-south",    "port": 8005, "replicas": 3},
    {"id": "notif-node-01",   "service": "Notification Bus",        "region": "ap-southeast","port": 8006, "replicas": 1},
    {"id": "savings-node-01", "service": "Savings Planner",         "region": "us-central",  "port": 8007, "replicas": 1},
    {"id": "gateway-node-01", "service": "API Gateway / LB",        "region": "us-central",  "port": 8000, "replicas": 2},
    {"id": "db-node-01",      "service": "Database Shard Primary",  "region": "ap-south",    "port": 5432, "replicas": 3},
    {"id": "cache-node-01",   "service": "Distributed Cache",       "region": "us-central",  "port": 6379, "replicas": 2},
]

# ─── Topology edges (service communication links) ──────────────────────────
TOPOLOGY_EDGES = [
    {"from": "gateway-node-01", "to": "auth-node-01",    "protocol": "REST",    "weight": 95},
    {"from": "gateway-node-01", "to": "ml-node-01",      "protocol": "gRPC",    "weight": 80},
    {"from": "gateway-node-01", "to": "scheme-node-01",  "protocol": "REST",    "weight": 85},
    {"from": "gateway-node-01", "to": "doc-node-01",     "protocol": "REST",    "weight": 70},
    {"from": "ml-node-01",      "to": "nlp-node-01",     "protocol": "gRPC",    "weight": 75},
    {"from": "ml-node-01",      "to": "scheme-node-01",  "protocol": "gRPC",    "weight": 90},
    {"from": "ml-node-01",      "to": "cache-node-01",   "protocol": "Redis",   "weight": 60},
    {"from": "doc-node-01",     "to": "notif-node-01",   "protocol": "MQ",      "weight": 55},
    {"from": "auth-node-01",    "to": "db-node-01",      "protocol": "SQL",     "weight": 88},
    {"from": "doc-node-01",     "to": "db-node-01",      "protocol": "SQL",     "weight": 72},
    {"from": "savings-node-01", "to": "db-node-01",      "protocol": "SQL",     "weight": 45},
    {"from": "notif-node-01",   "to": "db-node-01",      "protocol": "SQL",     "weight": 40},
    {"from": "cache-node-01",   "to": "db-node-01",      "protocol": "Sync",    "weight": 30},
]

# ─── Indian State Shards ───────────────────────────────────────────────────
STATE_SHARDS = [
    {"state": "Maharashtra",     "shard": "shard-west-01",  "region": "West",       "color": "#ff6b35"},
    {"state": "Uttar Pradesh",   "shard": "shard-north-01", "region": "North",      "color": "#4ecdc4"},
    {"state": "Tamil Nadu",      "shard": "shard-south-01", "region": "South",      "color": "#45b7d1"},
    {"state": "West Bengal",     "shard": "shard-east-01",  "region": "East",       "color": "#96ceb4"},
    {"state": "Rajasthan",       "shard": "shard-north-02", "region": "North-West", "color": "#ffeaa7"},
    {"state": "Karnataka",       "shard": "shard-south-01", "region": "South",      "color": "#fd79a8"},
    {"state": "Gujarat",         "shard": "shard-west-01",  "region": "West",       "color": "#fdcb6e"},
    {"state": "Madhya Pradesh",  "shard": "shard-central-01","region": "Central",   "color": "#6c5ce7"},
    {"state": "Bihar",           "shard": "shard-east-01",  "region": "East",       "color": "#00b894"},
    {"state": "Andhra Pradesh",  "shard": "shard-south-02", "region": "South",      "color": "#e17055"},
    {"state": "Other",           "shard": "shard-central-01","region": "Central",   "color": "#a29bfe"},
]

# ─── Event type labels ─────────────────────────────────────────────────────
EVENT_LABELS = {
    "scheme_query":    {"icon": "🎯", "color": "#00d4ff"},
    "doc_verify":      {"icon": "📄", "color": "#00ff88"},
    "user_register":   {"icon": "👤", "color": "#ffd700"},
    "health_check":    {"icon": "💚", "color": "#00ff88"},
    "ml_inference":    {"icon": "🧠", "color": "#c084fc"},
    "cache_hit":       {"icon": "⚡", "color": "#4ade80"},
    "db_write":        {"icon": "💾", "color": "#fb923c"},
    "consensus_vote":  {"icon": "🗳️", "color": "#22d3ee"},
    "shard_sync":      {"icon": "🔄", "color": "#a78bfa"},
}


NODE_OVERRIDES = {}


def _simulated_node_status(node_id: str) -> dict:
    """Generate realistic simulated metrics for a node, respecting manual overrides."""
    seed = sum(ord(c) for c in node_id) + datetime.utcnow().minute
    rng = random.Random(seed)

    if node_id in NODE_OVERRIDES:
        status = NODE_OVERRIDES[node_id]
    else:
        statuses = ["online"] * 8 + ["degraded"] * 1 + ["offline"] * 1
        status = rng.choice(statuses)

    base_latency = {"auth-node-01": 12, "ml-node-01": 85, "scheme-node-01": 18,
                    "nlp-node-01": 45, "doc-node-01": 22, "notif-node-01": 8,
                    "savings-node-01": 15, "gateway-node-01": 5, "db-node-01": 6,
                    "cache-node-01": 1}.get(node_id, 20)

    jitter = rng.uniform(-5, 15) if status == "online" else rng.uniform(50, 200)
    latency = max(1, base_latency + jitter) if status != "offline" else 0
    cpu = rng.uniform(10, 45) if status == "online" else (rng.uniform(70, 95) if status == "degraded" else 0)
    memory = rng.uniform(20, 60) if status == "online" else (rng.uniform(75, 95) if status == "degraded" else 0)
    uptime_pct = rng.uniform(99.0, 99.99) if status == "online" else (rng.uniform(85, 98) if status == "degraded" else 0)

    return {
        "status": status,
        "latency_ms": round(latency, 1),
        "cpu_pct": round(cpu, 1),
        "memory_pct": round(memory, 1),
        "uptime_pct": round(uptime_pct, 3),
        "requests_per_sec": round(rng.uniform(5, 120), 1) if status == "online" else 0,
        "error_rate_pct": round(rng.uniform(0, 0.5) if status == "online" else rng.uniform(5, 25), 2),
        "last_heartbeat": (datetime.utcnow() - timedelta(seconds=rng.randint(1, 30))).isoformat(),
    }


# ══════════════════════════════════════════════════════════════════════════════
# API Endpoints
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/dc/nodes")
def get_nodes():
    """Return status of all virtual DC nodes with live-simulated metrics."""
    result = []
    for node in NODES:
        metrics = _simulated_node_status(node["id"])
        result.append({**node, **metrics})
    return result


@router.post("/dc/nodes/{node_id}/toggle")
def toggle_node(node_id: str, db: Session = Depends(get_db)):
    """Toggle node status (online -> degraded -> offline -> online) for DC simulation."""
    current = _simulated_node_status(node_id)["status"]
    next_status = "degraded" if current == "online" else ("offline" if current == "degraded" else "online")
    NODE_OVERRIDES[node_id] = next_status

    # Log event
    event = DCEvent(
        node_id=node_id,
        event_type="consensus_vote",
        latency_ms=random.uniform(5, 25),
        status="success" if next_status == "online" else "failed",
        payload=f"Node {node_id} state changed from {current} to {next_status}"
    )
    db.add(event)
    db.commit()
    return {"node_id": node_id, "status": next_status, "previous_status": current}


@router.post("/dc/consensus/vote")
def trigger_consensus_vote(doc_id: int, db: Session = Depends(get_db)):
    """Execute Raft quorum voting for document verification."""
    from consensus import get_raft_cluster
    cluster = get_raft_cluster()

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        return {"status": "error", "message": "Document not found"}

    # Propose approval command to Raft consensus cluster
    proposal = {
        "action": "verify_document",
        "doc_id": doc_id,
        "original_name": doc.original_name
    }
    res = cluster.propose_command(proposal)

    if res.get("quorum_reached"):
        doc.status = "verified"
        doc.reviewed_by = 1
        doc.review_note = f"Verified via Raft consensus (Term {res['term']}, Index {res['index']})"
        
        # Add notification for document owner
        notif = Notification(
            user_id=doc.user_id,
            message=f"Your document '{doc.original_name}' was verified via Raft Consensus quorum.",
            category="success"
        )
        db.add(notif)

        # Log DC Event
        evt = DCEvent(
            node_id="doc-node-01",
            event_type="consensus_vote",
            latency_ms=18.4,
            status="success",
            payload=f"Raft Consensus Quorum reached ({res['acks']} votes) for Document ID #{doc_id}"
        )
        db.add(evt)
        db.commit()
        return {"status": "success", "doc_id": doc_id, "doc_status": "verified", "raft": res}
    else:
        return {"status": "error", "message": "Raft quorum failed", "raft": res}



@router.post("/dc/shard/rebalance")
def rebalance_shards(db: Session = Depends(get_db)):
    """Trigger simulated geographic shard load rebalancing."""
    evt = DCEvent(
        node_id="db-node-01",
        event_type="shard_sync",
        latency_ms=42.1,
        status="success",
        payload="Geographic database shard rebalance completed across 5 regions"
    )
    db.add(evt)
    db.commit()
    return {"status": "rebalanced", "timestamp": datetime.utcnow().isoformat()}


@router.get("/dc/topology")
def get_topology():
    """Return the service communication graph (nodes + directed edges)."""
    nodes_with_status = []
    for node in NODES:
        metrics = _simulated_node_status(node["id"])
        nodes_with_status.append({
            "id": node["id"],
            "service": node["service"],
            "region": node["region"],
            "status": metrics["status"],
            "latency_ms": metrics["latency_ms"],
        })
    return {"nodes": nodes_with_status, "edges": TOPOLOGY_EDGES}


@router.get("/dc/shards")
def get_shards(db: Session = Depends(get_db)):
    """Return user distribution across geographic shards (by state)."""
    users = db.query(User).all()
    state_counts = {}
    for u in users:
        s = u.state or "Other"
        state_counts[s] = state_counts.get(s, 0) + 1

    result = []
    for shard_info in STATE_SHARDS:
        state = shard_info["state"]
        count = state_counts.get(state, random.randint(12, 340))  # fallback seed for demo
        result.append({**shard_info, "user_count": count, "doc_count": count * random.randint(1, 4)})

    total = sum(r["user_count"] for r in result)
    for r in result:
        r["pct"] = round(r["user_count"] / max(total, 1) * 100, 1)

    return result


@router.get("/dc/events")
def get_events(limit: int = 25, db: Session = Depends(get_db)):
    """Return recent distributed events (real DB events + synthetic heartbeats)."""
    db_events = db.query(DCEvent).order_by(DCEvent.created_at.desc()).limit(limit).all()

    # Build from real events
    events = []
    for e in db_events:
        meta = EVENT_LABELS.get(e.event_type, {"icon": "📡", "color": "#ffffff"})
        events.append({
            "id": e.id,
            "node_id": e.node_id,
            "event_type": e.event_type,
            "icon": meta["icon"],
            "color": meta["color"],
            "latency_ms": e.latency_ms,
            "status": e.status,
            "payload": e.payload or "",
            "timestamp": e.created_at.isoformat(),
            "synthetic": False,
        })

    # Pad with synthetic events to always show a live feed
    now = datetime.utcnow()
    synthetic_pool = [
        ("cache-node-01",   "cache_hit",    random.uniform(0.5, 3),   "Cache lookup hit for user profile"),
        ("ml-node-01",      "ml_inference", random.uniform(60, 120),  "RandomForest model executed scheme match"),
        ("gateway-node-01", "health_check", random.uniform(2, 8),     "Health check ping HTTP 200 OK"),
        ("db-node-01",      "shard_sync",   random.uniform(10, 40),   "WAL replication sync shard-west-01"),
        ("notif-node-01",   "consensus_vote", random.uniform(5, 20),  "MQ Event published to notification queue"),
    ]
    while len(events) < min(limit, 20):
        node, ev_type, lat, payload = random.choice(synthetic_pool)
        meta = EVENT_LABELS[ev_type]
        events.append({
            "id": f"syn-{random.randint(1000, 9999)}",
            "node_id": node,
            "event_type": ev_type,
            "icon": meta["icon"],
            "color": meta["color"],
            "latency_ms": round(lat, 1),
            "status": "success",
            "payload": payload,
            "timestamp": (now - timedelta(seconds=random.randint(1, 120))).isoformat(),
            "synthetic": True,
        })

    events.sort(key=lambda x: x["timestamp"], reverse=True)
    return events[:limit]


@router.get("/dc/metrics")
def get_metrics(db: Session = Depends(get_db)):
    """Return system-wide distributed metrics snapshot."""
    total_users = db.query(User).count()
    total_docs = db.query(Document).count()
    pending_docs = db.query(Document).filter(Document.status == "pending").count()
    total_notifs = db.query(Notification).count()

    # Simulated aggregates
    rng = random.Random(datetime.utcnow().minute)
    active_nodes = sum(1 for n in NODES if _simulated_node_status(n["id"])["status"] == "online")
    return {
        "total_requests_today": total_users * rng.randint(4, 12) + rng.randint(100, 500),
        "avg_latency_ms": round(rng.uniform(18, 45), 1),
        "p99_latency_ms": round(rng.uniform(80, 250), 1),
        "throughput_rps": round(rng.uniform(45, 180), 1),
        "error_rate_pct": round(rng.uniform(0.05, 0.8), 2),
        "cache_hit_rate_pct": round(rng.uniform(78, 94), 1),
        "active_nodes": active_nodes,
        "total_nodes": len(NODES),
        "total_users": total_users,
        "total_documents": total_docs,
        "pending_verifications": pending_docs,
        "total_notifications": total_notifs,
        "replication_lag_ms": round(rng.uniform(2, 25), 1),
        "shard_count": 5,
        "cap_mode": "AP",  # Availability + Partition Tolerance (real-world default)
        "consensus_algorithm": "Raft",
        "consistency_level": "Eventual",
        "uptime_pct": round(rng.uniform(99.5, 99.99), 3),
        "snapshot_at": datetime.utcnow().isoformat(),
    }


@router.get("/dc/consensus")
def get_consensus(db: Session = Depends(get_db)):
    """Return document verification items modeled as Raft consensus votes."""
    pending = db.query(Document).filter(Document.status == "pending").all()

    consensus_items = []
    admin_nodes = ["admin-node-01", "admin-node-02", "admin-node-03"]

    for doc in pending:
        # Simulate votes across admin nodes (majority needed = 2 of 3)
        rng = random.Random(doc.id)
        votes = [
            {"node": n, "vote": rng.choice(["approve", "pending", "pending"]), "latency_ms": round(rng.uniform(5, 50), 1)}
            for n in admin_nodes
        ]
        approve_count = sum(1 for v in votes if v["vote"] == "approve")
        consensus_items.append({
            "doc_id": doc.id,
            "doc_type": doc.doc_type,
            "original_name": doc.original_name,
            "user_id": doc.user_id,
            "term": doc.id,                # Raft term = doc id for demo
            "votes": votes,
            "quorum_reached": approve_count >= 2,
            "approve_count": approve_count,
            "quorum_required": 2,
            "leader_node": "admin-node-01",
            "status": "quorum_reached" if approve_count >= 2 else "awaiting_quorum",
        })

    return {
        "algorithm": "Raft",
        "total_nodes": 3,
        "quorum_size": 2,
        "leader": "admin-node-01",
        "term": db.query(Document).count(),
        "pending_items": consensus_items,
    }


@router.post("/dc/log-event")
def log_event(node_id: str, event_type: str, latency_ms: float = 0.0,
              status: str = "success", payload: str = None,
              db: Session = Depends(get_db)):
    """Log a distributed computing event to the DC event table."""
    event = DCEvent(
        node_id=node_id,
        event_type=event_type,
        latency_ms=latency_ms,
        status=status,
        payload=payload,
    )
    db.add(event)
    db.commit()
    return {"status": "logged", "id": event.id}


@router.get("/dc/cache/stats")
def get_cache_statistics():
    from distributed_cache import get_cache
    return get_cache().get_stats()


@router.get("/dc/locks")
def get_lock_statistics():
    from distributed_lock import get_lock_manager
    mgr = get_lock_manager()
    return {
        "stats": mgr.get_stats(),
        "recent_events": mgr.get_recent_events(limit=10)
    }


@router.get("/dc/circuit-breakers")
def get_circuit_breaker_stats():
    from circuit_breaker import get_breaker_registry
    return get_breaker_registry().get_stats()


@router.get("/dc/mq/stats")
def get_message_queue_stats():
    from message_bus import get_mq_stats
    return get_mq_stats()


@router.get("/dc/replication/stats")
def get_replication_statistics():
    from db_replicator import get_replication_stats
    return get_replication_stats()

