import asyncio
from database import SessionLocal, Notification, DCEvent
from datetime import datetime
import json
import time

# Multi-Topic Message Broker simulation (Kafka/RabbitMQ)
# Topics: doc.submitted, doc.state-change, scheme.applied, notification.dispatch
topics = {
    "doc.submitted": asyncio.Queue(),
    "doc.state-change": asyncio.Queue(),
    "scheme.applied": asyncio.Queue(),
    "notification.dispatch": asyncio.Queue(),
    "dlq": asyncio.Queue(),  # Dead Letter Queue
}

# Legacy export for backwards compatibility
notification_queue = topics["notification.dispatch"]

# Audit message count
processed_stats = {
    "doc.submitted": 0,
    "doc.state-change": 0,
    "scheme.applied": 0,
    "notification.dispatch": 0,
    "dlq": 0
}

async def publish_message(topic: str, payload: dict):
    """Publish a message to a specific topic."""
    if topic in topics:
        await topics[topic].put(payload)
        print(f"[MessageBus] Published message to topic '{topic}'")
    else:
        print(f"[MessageBus] Unknown topic '{topic}', sending to DLQ")
        await topics["dlq"].put({"original_topic": topic, "payload": payload})


async def notification_worker():
    """Background worker that consumes messages from notification.dispatch and writes to DB."""
    print("Started Notification Queue Worker (Multi-Topic Message Bus)")
    while True:
        try:
            payload = await topics["notification.dispatch"].get()
            
            db = SessionLocal()
            notif = Notification(
                user_id=payload["user_id"],
                message=payload["message"],
                category=payload.get("category", "info"),
                created_at=datetime.utcnow()
            )
            db.add(notif)
            db.commit()
            db.close()

            processed_stats["notification.dispatch"] += 1
            print(f"[MessageBus] Persisted notification for user {payload['user_id']}")
            topics["notification.dispatch"].task_done()
        except Exception as e:
            print(f"Error in notification worker: {e}")
            await asyncio.sleep(1)


async def doc_submitted_worker():
    """Consumes doc.submitted events."""
    while True:
        try:
            payload = await topics["doc.submitted"].get()
            processed_stats["doc.submitted"] += 1
            print(f"[MessageBus] Processed doc.submitted event for doc #{payload.get('doc_id')}")
            topics["doc.submitted"].task_done()
        except Exception as e:
            print(f"Error in doc_submitted worker: {e}")
            await asyncio.sleep(1)


def get_mq_stats():
    return {
        "topics": {
            t: {"queue_depth": q.qsize(), "processed_count": processed_stats[t]}
            for t, q in topics.items()
        }
    }
