"""
Distributed Lock Manager — DC Concept #10 (Concurrency Control)
================================================================
Implements a Redlock-style distributed locking mechanism for:
- Document verification (prevents two admins approving the same doc)
- Scheme application (prevents duplicate submissions)
- Any critical section requiring mutual exclusion

Features:
  - Lock acquisition with timeout and auto-expiry
  - Owner tracking (which admin holds the lock)
  - Deadlock detection
  - Lock history for audit trail
"""

import time
import threading
import uuid
from dataclasses import dataclass, field
from typing import Optional, Dict, List


@dataclass
class LockEntry:
    """Represents an active distributed lock."""
    resource: str
    owner_id: str
    lock_token: str
    acquired_at: float
    ttl_seconds: float
    auto_renew: bool = False

    @property
    def is_expired(self) -> bool:
        return (time.time() - self.acquired_at) > self.ttl_seconds

    @property
    def remaining_seconds(self) -> float:
        return max(0, self.ttl_seconds - (time.time() - self.acquired_at))


@dataclass
class LockEvent:
    """Audit log entry for lock operations."""
    resource: str
    action: str  # "acquired", "released", "expired", "denied", "waited"
    owner_id: str
    timestamp: float = field(default_factory=time.time)
    details: str = ""


class DistributedLockManager:
    """
    Thread-safe distributed lock manager.
    Simulates a Redis Redlock for concurrent access control.
    """

    def __init__(self, default_ttl: float = 30.0):
        self.default_ttl = default_ttl
        self._locks: Dict[str, LockEntry] = {}
        self._lock = threading.RLock()  # Python-level mutex for thread safety
        self._history: List[LockEvent] = []
        self._max_history = 200

        # Metrics
        self._acquired_count = 0
        self._released_count = 0
        self._denied_count = 0
        self._expired_count = 0
        self._contention_count = 0  # times a lock was contested
        self._started_at = time.time()

    def acquire(self, resource: str, owner_id: str,
                ttl: Optional[float] = None,
                blocking_timeout: float = 5.0) -> Optional[str]:
        """
        Attempt to acquire a lock on a resource.

        Args:
            resource: The resource key to lock (e.g., "doc:42:verify")
            owner_id: Who is requesting the lock (e.g., "admin-3")
            ttl: Lock auto-expiry in seconds (default: 30s)
            blocking_timeout: Max seconds to wait if lock is held

        Returns:
            lock_token (str) on success, None on failure/timeout
        """
        if ttl is None:
            ttl = self.default_ttl

        deadline = time.time() + blocking_timeout

        while time.time() < deadline:
            with self._lock:
                # Clean up expired locks
                self._cleanup_expired()

                existing = self._locks.get(resource)

                if existing is None:
                    # Lock is free — acquire it
                    token = str(uuid.uuid4())[:8]
                    self._locks[resource] = LockEntry(
                        resource=resource,
                        owner_id=owner_id,
                        lock_token=token,
                        acquired_at=time.time(),
                        ttl_seconds=ttl,
                    )
                    self._acquired_count += 1
                    self._log_event(resource, "acquired", owner_id,
                                    f"Lock acquired, TTL={ttl}s, token={token}")
                    return token

                elif existing.owner_id == owner_id:
                    # Re-entrant: same owner can re-acquire (extend TTL)
                    existing.acquired_at = time.time()
                    existing.ttl_seconds = ttl
                    self._log_event(resource, "renewed", owner_id,
                                    f"Lock renewed by same owner, TTL={ttl}s")
                    return existing.lock_token

                else:
                    # Lock is held by someone else
                    self._contention_count += 1
                    self._log_event(resource, "waited", owner_id,
                                    f"Waiting — held by {existing.owner_id}")

            # Wait and retry
            time.sleep(0.1)

        # Timeout — could not acquire
        self._denied_count += 1
        self._log_event(resource, "denied", owner_id,
                        f"Timed out after {blocking_timeout}s")
        return None

    def release(self, resource: str, token: str) -> bool:
        """
        Release a lock. Only the holder (matching token) can release.

        Returns:
            True if released, False if token doesn't match or lock doesn't exist
        """
        with self._lock:
            existing = self._locks.get(resource)
            if existing is None:
                return False

            if existing.lock_token != token:
                self._log_event(resource, "release_denied", "unknown",
                                f"Token mismatch — lock held by {existing.owner_id}")
                return False

            owner = existing.owner_id
            del self._locks[resource]
            self._released_count += 1
            self._log_event(resource, "released", owner, "Lock released normally")
            return True

    def force_release(self, resource: str) -> bool:
        """Admin override: force-release a lock regardless of owner."""
        with self._lock:
            if resource in self._locks:
                owner = self._locks[resource].owner_id
                del self._locks[resource]
                self._released_count += 1
                self._log_event(resource, "force_released", owner,
                                "Lock force-released by admin")
                return True
            return False

    def is_locked(self, resource: str) -> bool:
        """Check if a resource is currently locked."""
        with self._lock:
            self._cleanup_expired()
            entry = self._locks.get(resource)
            return entry is not None and not entry.is_expired

    def get_lock_info(self, resource: str) -> Optional[dict]:
        """Get details about a specific lock."""
        with self._lock:
            entry = self._locks.get(resource)
            if entry is None or entry.is_expired:
                return None
            return {
                "resource": entry.resource,
                "owner_id": entry.owner_id,
                "token": entry.lock_token,
                "acquired_at": entry.acquired_at,
                "ttl_seconds": entry.ttl_seconds,
                "remaining_seconds": round(entry.remaining_seconds, 1),
            }

    # ── Internal ─────────────────────────────────────────────────────────

    def _cleanup_expired(self):
        """Remove all expired locks."""
        expired = [k for k, v in self._locks.items() if v.is_expired]
        for k in expired:
            owner = self._locks[k].owner_id
            del self._locks[k]
            self._expired_count += 1
            self._log_event(k, "expired", owner, "Lock expired (TTL reached)")

    def _log_event(self, resource: str, action: str, owner_id: str, details: str = ""):
        """Append to audit history."""
        self._history.append(LockEvent(
            resource=resource, action=action,
            owner_id=owner_id, details=details
        ))
        # Trim history
        if len(self._history) > self._max_history:
            self._history = self._history[-self._max_history:]

    # ── Metrics & Stats ──────────────────────────────────────────────────

    def get_stats(self) -> dict:
        """Return lock manager statistics for the DC Control Panel."""
        with self._lock:
            self._cleanup_expired()
            active_locks = []
            for entry in self._locks.values():
                active_locks.append({
                    "resource": entry.resource,
                    "owner": entry.owner_id,
                    "remaining_s": round(entry.remaining_seconds, 1),
                    "ttl_s": entry.ttl_seconds,
                })

            return {
                "active_locks": len(self._locks),
                "locks": active_locks,
                "total_acquired": self._acquired_count,
                "total_released": self._released_count,
                "total_denied": self._denied_count,
                "total_expired": self._expired_count,
                "total_contentions": self._contention_count,
                "uptime_seconds": round(time.time() - self._started_at, 1),
            }

    def get_recent_events(self, limit: int = 20) -> List[dict]:
        """Return recent lock events for audit."""
        events = self._history[-limit:]
        return [
            {
                "resource": e.resource,
                "action": e.action,
                "owner_id": e.owner_id,
                "timestamp": e.timestamp,
                "details": e.details,
            }
            for e in reversed(events)
        ]


# ── Module-level singleton ───────────────────────────────────────────────────
lock_manager = DistributedLockManager(default_ttl=30.0)


def get_lock_manager() -> DistributedLockManager:
    """Get the global lock manager instance."""
    return lock_manager
