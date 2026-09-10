"""
Distributed Cache — DC Concept #11
===================================
In-memory cache implementing the Cache-Aside pattern.
Simulates a Redis Cluster with TTL-based expiration, LRU eviction,
namespace support, hit/miss tracking, and cache invalidation.

Namespaces:
  schemes:*        — Government scheme catalog & state-filtered results
  match:*          — ML scheme match results per user profile
  session:*        — User/admin session tokens
  ratelimit:*      — Sliding-window rate-limit counters
"""

import time
import threading
import hashlib
import json
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Any, Optional, Dict, List


@dataclass
class CacheEntry:
    """A single cached value with TTL metadata."""
    key: str
    value: Any
    ttl_seconds: float
    created_at: float = field(default_factory=time.time)
    last_accessed: float = field(default_factory=time.time)
    access_count: int = 0

    @property
    def is_expired(self) -> bool:
        return (time.time() - self.created_at) > self.ttl_seconds

    def touch(self):
        """Update access time and count (LRU tracking)."""
        self.last_accessed = time.time()
        self.access_count += 1


class DistributedCache:
    """
    Thread-safe in-memory cache with TTL, LRU eviction, and metrics.
    Simulates a Redis-like distributed cache for the ArthMitra system.
    """

    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        self.max_size = max_size
        self.default_ttl = default_ttl  # 5 minutes default
        self._store: OrderedDict[str, CacheEntry] = OrderedDict()
        self._lock = threading.RLock()

        # Metrics
        self._hits = 0
        self._misses = 0
        self._evictions = 0
        self._sets = 0
        self._deletes = 0
        self._started_at = time.time()

        # Namespace TTL overrides
        self._namespace_ttl = {
            "schemes": 300,      # 5 min — scheme catalog
            "match": 300,        # 5 min — ML match results
            "session": 86400,    # 24 hours — user sessions
            "ratelimit": 60,     # 60 seconds — rate limit windows
            "lock": 30,          # 30 seconds — distributed locks
        }

    # ── Core Operations ──────────────────────────────────────────────────

    def get(self, key: str) -> Optional[Any]:
        """Get a value by key. Returns None on miss or expiry."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                self._misses += 1
                return None

            if entry.is_expired:
                # Lazy expiration
                del self._store[key]
                self._misses += 1
                return None

            # Cache hit — move to end (LRU) and update stats
            entry.touch()
            self._store.move_to_end(key)
            self._hits += 1
            return entry.value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a key-value pair with optional TTL override."""
        with self._lock:
            # Determine TTL from namespace or default
            if ttl is None:
                namespace = key.split(":")[0] if ":" in key else ""
                ttl = self._namespace_ttl.get(namespace, self.default_ttl)

            # Evict if at capacity (LRU — remove oldest accessed)
            while len(self._store) >= self.max_size:
                self._evict_lru()

            self._store[key] = CacheEntry(key=key, value=value, ttl_seconds=ttl)
            self._store.move_to_end(key)
            self._sets += 1

    def setex(self, key: str, ttl: int, value: Any) -> None:
        """Set with explicit TTL (Redis-compatible signature)."""
        self.set(key, value, ttl=ttl)

    def delete(self, key: str) -> bool:
        """Delete a key. Returns True if it existed."""
        with self._lock:
            if key in self._store:
                del self._store[key]
                self._deletes += 1
                return True
            return False

    def exists(self, key: str) -> bool:
        """Check if key exists and is not expired."""
        return self.get(key) is not None

    def incr(self, key: str, amount: int = 1) -> int:
        """Atomic increment. Creates key with value=amount if missing."""
        with self._lock:
            current = self.get(key)
            if current is None:
                self.set(key, amount)
                return amount
            new_val = int(current) + amount
            # Preserve existing TTL
            entry = self._store.get(key)
            if entry:
                entry.value = new_val
            return new_val

    def keys(self, pattern: str = "*") -> List[str]:
        """Return keys matching a pattern (supports prefix:* patterns)."""
        with self._lock:
            if pattern == "*":
                return list(self._store.keys())
            prefix = pattern.rstrip("*")
            return [k for k in self._store.keys() if k.startswith(prefix)]

    # ── Bulk Operations ──────────────────────────────────────────────────

    def invalidate_namespace(self, namespace: str) -> int:
        """Delete all keys in a namespace. Returns count deleted."""
        with self._lock:
            to_delete = [k for k in self._store if k.startswith(f"{namespace}:")]
            for k in to_delete:
                del self._store[k]
                self._deletes += 1
            return len(to_delete)

    def flush_all(self) -> int:
        """Clear the entire cache. Returns count flushed."""
        with self._lock:
            count = len(self._store)
            self._store.clear()
            self._deletes += count
            return count

    # ── LRU Eviction ─────────────────────────────────────────────────────

    def _evict_lru(self):
        """Evict the least recently used (first) item."""
        if self._store:
            evicted_key, _ = self._store.popitem(last=False)
            self._evictions += 1

    def _cleanup_expired(self):
        """Remove all expired entries (called periodically)."""
        with self._lock:
            expired = [k for k, v in self._store.items() if v.is_expired]
            for k in expired:
                del self._store[k]
                self._evictions += 1
            return len(expired)

    # ── Rate Limiting ────────────────────────────────────────────────────

    def check_rate_limit(self, identifier: str, max_requests: int = 100, window: int = 60) -> dict:
        """
        Sliding window rate limiter using cache counters.
        Returns dict with 'allowed', 'current', 'limit', 'remaining'.
        """
        key = f"ratelimit:{identifier}"
        current = self.incr(key)

        # Set TTL on first request in window
        if current == 1:
            self.set(key, current, ttl=window)

        allowed = current <= max_requests
        return {
            "allowed": allowed,
            "current": current,
            "limit": max_requests,
            "remaining": max(0, max_requests - current),
            "window_seconds": window,
        }

    # ── Metrics & Stats ──────────────────────────────────────────────────

    def get_stats(self) -> dict:
        """Return comprehensive cache statistics for the DC Control Panel."""
        with self._lock:
            total_requests = self._hits + self._misses
            hit_rate = round((self._hits / max(total_requests, 1)) * 100, 1)

            # Namespace breakdown
            namespaces = {}
            for key in self._store:
                ns = key.split(":")[0] if ":" in key else "default"
                namespaces[ns] = namespaces.get(ns, 0) + 1

            return {
                "node_id": "cache-node-01",
                "status": "online",
                "total_keys": len(self._store),
                "max_size": self.max_size,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate_pct": hit_rate,
                "sets": self._sets,
                "deletes": self._deletes,
                "evictions": self._evictions,
                "namespaces": namespaces,
                "uptime_seconds": round(time.time() - self._started_at, 1),
                "memory_usage_pct": round(len(self._store) / max(self.max_size, 1) * 100, 1),
            }


# ── Module-level singleton ───────────────────────────────────────────────────
cache = DistributedCache(max_size=2000, default_ttl=300)


def get_cache() -> DistributedCache:
    """Get the global cache instance."""
    return cache


def cache_key_for_profile(profile: dict) -> str:
    """Generate a deterministic cache key from a user profile dict."""
    relevant = {k: profile.get(k) for k in sorted(["age", "occupation", "income", "caste", "state", "gender", "education"])}
    raw = json.dumps(relevant, sort_keys=True)
    return f"match:{hashlib.md5(raw.encode()).hexdigest()}"
