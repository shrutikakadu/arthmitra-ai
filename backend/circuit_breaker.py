"""
Circuit Breaker — DC Concept #6 (Fault Tolerance)
===================================================
Prevents cascading failures by monitoring downstream service health.

States:
  CLOSED    → Normal operation, requests pass through
  OPEN      → Service is down, requests fast-fail with cached fallback
  HALF_OPEN → After recovery timeout, allow 1 probe request

Transitions:
  CLOSED  → OPEN      : failure_count >= failure_threshold within window
  OPEN    → HALF_OPEN : after recovery_timeout seconds
  HALF_OPEN → CLOSED  : probe request succeeds
  HALF_OPEN → OPEN    : probe request fails
"""

import time
import threading
from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Callable


class CircuitState(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


@dataclass
class CircuitEvent:
    """Log entry for circuit breaker state changes."""
    service: str
    event: str  # "failure", "success", "state_change", "fallback"
    old_state: Optional[str] = None
    new_state: Optional[str] = None
    timestamp: float = field(default_factory=time.time)
    details: str = ""


class CircuitBreaker:
    """
    Circuit breaker for a single downstream service.
    """

    def __init__(self, service_name: str,
                 failure_threshold: int = 5,
                 recovery_timeout: float = 30.0,
                 success_threshold: int = 2):
        self.service_name = service_name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = 0.0
        self._last_state_change = time.time()
        self._lock = threading.Lock()

        # Metrics
        self._total_calls = 0
        self._total_failures = 0
        self._total_successes = 0
        self._total_rejected = 0
        self._total_fallbacks = 0

    @property
    def state(self) -> CircuitState:
        with self._lock:
            if self._state == CircuitState.OPEN:
                # Check if recovery timeout has elapsed → transition to HALF_OPEN
                if (time.time() - self._last_failure_time) >= self.recovery_timeout:
                    self._transition(CircuitState.HALF_OPEN)
            return self._state

    @property
    def is_open(self) -> bool:
        return self.state == CircuitState.OPEN

    def record_success(self):
        """Record a successful call to the downstream service."""
        with self._lock:
            self._total_calls += 1
            self._total_successes += 1

            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.success_threshold:
                    self._transition(CircuitState.CLOSED)
            else:
                self._failure_count = 0  # Reset consecutive failures

    def record_failure(self):
        """Record a failed call to the downstream service."""
        with self._lock:
            self._total_calls += 1
            self._total_failures += 1
            self._failure_count += 1
            self._last_failure_time = time.time()

            if self._state == CircuitState.HALF_OPEN:
                # Probe failed — back to OPEN
                self._transition(CircuitState.OPEN)
            elif self._state == CircuitState.CLOSED:
                if self._failure_count >= self.failure_threshold:
                    self._transition(CircuitState.OPEN)

    def record_rejected(self):
        """Record a rejected call (circuit was OPEN)."""
        with self._lock:
            self._total_calls += 1
            self._total_rejected += 1
            self._total_fallbacks += 1

    def _transition(self, new_state: CircuitState):
        """Internal state transition."""
        old_state = self._state
        self._state = new_state
        self._last_state_change = time.time()

        if new_state == CircuitState.CLOSED:
            self._failure_count = 0
            self._success_count = 0
        elif new_state == CircuitState.HALF_OPEN:
            self._success_count = 0

    def get_info(self) -> dict:
        """Return current circuit breaker status."""
        current_state = self.state  # triggers OPEN→HALF_OPEN check
        return {
            "service": self.service_name,
            "state": current_state.value,
            "failure_count": self._failure_count,
            "failure_threshold": self.failure_threshold,
            "recovery_timeout_s": self.recovery_timeout,
            "total_calls": self._total_calls,
            "total_successes": self._total_successes,
            "total_failures": self._total_failures,
            "total_rejected": self._total_rejected,
            "total_fallbacks": self._total_fallbacks,
            "last_state_change": self._last_state_change,
            "seconds_in_state": round(time.time() - self._last_state_change, 1),
        }


class CircuitBreakerRegistry:
    """
    Registry of circuit breakers for all downstream services.
    """

    def __init__(self):
        self._breakers: Dict[str, CircuitBreaker] = {}
        self._events: List[CircuitEvent] = []
        self._lock = threading.Lock()
        self._started_at = time.time()

    def get_or_create(self, service_name: str,
                      failure_threshold: int = 5,
                      recovery_timeout: float = 30.0) -> CircuitBreaker:
        """Get existing or create new circuit breaker for a service."""
        with self._lock:
            if service_name not in self._breakers:
                self._breakers[service_name] = CircuitBreaker(
                    service_name=service_name,
                    failure_threshold=failure_threshold,
                    recovery_timeout=recovery_timeout,
                )
            return self._breakers[service_name]

    def get_all_status(self) -> List[dict]:
        """Return status of all circuit breakers."""
        with self._lock:
            return [cb.get_info() for cb in self._breakers.values()]

    def get_stats(self) -> dict:
        """Return aggregate circuit breaker stats."""
        with self._lock:
            breakers_status = [cb.get_info() for cb in self._breakers.values()]
            open_count = sum(1 for b in breakers_status if b["state"] == "OPEN")
            half_open_count = sum(1 for b in breakers_status if b["state"] == "HALF_OPEN")

            return {
                "total_breakers": len(self._breakers),
                "open_circuits": open_count,
                "half_open_circuits": half_open_count,
                "closed_circuits": len(self._breakers) - open_count - half_open_count,
                "breakers": breakers_status,
                "uptime_seconds": round(time.time() - self._started_at, 1),
            }


# ── Module-level singleton ───────────────────────────────────────────────────
breaker_registry = CircuitBreakerRegistry()


def get_breaker(service_name: str) -> CircuitBreaker:
    """Get or create a circuit breaker for the named service."""
    return breaker_registry.get_or_create(service_name)


def get_breaker_registry() -> CircuitBreakerRegistry:
    """Get the global circuit breaker registry."""
    return breaker_registry
