"""
Service Registry & Health Check — DC Concept #6 (Service Discovery)
===================================================================
Provides dynamic service registration, health check pings, and service discovery.
Simulates HashiCorp Consul / Eureka.
"""

import time
import threading
from typing import Dict, List, Optional, Any


class ServiceInstance:
    def __init__(self, node_id: str, service_name: str, region: str, host: str, port: int, replicas: int = 1):
        self.node_id = node_id
        self.service_name = service_name
        self.region = region
        self.host = host
        self.port = port
        self.replicas = replicas
        self.status = "online"  # "online", "degraded", "offline"
        self.last_heartbeat = time.time()
        self.latency_ms = 10.0
        self.cpu_pct = 15.0
        self.memory_pct = 30.0

    def touch(self):
        self.last_heartbeat = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.node_id,
            "service": self.service_name,
            "region": self.region,
            "host": self.host,
            "port": self.port,
            "replicas": self.replicas,
            "status": self.status,
            "latency_ms": round(self.latency_ms, 1),
            "cpu_pct": round(self.cpu_pct, 1),
            "memory_pct": round(self.memory_pct, 1),
            "last_heartbeat": self.last_heartbeat
        }


class ServiceRegistry:
    def __init__(self):
        self._services: Dict[str, ServiceInstance] = {}
        self._lock = threading.RLock()

        # Pre-register default ArthMitra virtual nodes
        self._init_defaults()

    def _init_defaults(self):
        defaults = [
            ("auth-node-01",    "Authentication Service",  "us-central", "127.0.0.1", 8001, 3),
            ("ml-node-01",      "ML Scheme Matcher",       "us-east",    "127.0.0.1", 8002, 2),
            ("scheme-node-01",  "Scheme Registry",         "us-west",    "127.0.0.1", 8003, 2),
            ("nlp-node-01",     "NLP Ranking Engine",      "eu-west",    "127.0.0.1", 8004, 2),
            ("doc-node-01",     "Document Verification",   "ap-south",   "127.0.0.1", 8005, 3),
            ("notif-node-01",   "Notification Bus",        "ap-southeast","127.0.0.1",8006, 1),
            ("savings-node-01", "Savings Planner",         "us-central", "127.0.0.1", 8007, 1),
            ("gateway-node-01", "API Gateway / LB",        "us-central", "127.0.0.1", 8000, 2),
            ("db-node-01",      "Database Shard Primary",  "ap-south",   "127.0.0.1", 5432, 3),
            ("cache-node-01",   "Distributed Cache",       "us-central", "127.0.0.1", 6379, 2),
        ]
        for nid, name, reg, host, port, reps in defaults:
            self._services[nid] = ServiceInstance(nid, name, reg, host, port, reps)

    def register(self, instance: ServiceInstance):
        with self._lock:
            self._services[instance.node_id] = instance

    def deregister(self, node_id: str):
        with self._lock:
            if node_id in self._services:
                del self._services[node_id]

    def discover(self, service_name: str) -> List[ServiceInstance]:
        with self._lock:
            return [
                inst for inst in self._services.values()
                if inst.service_name.lower() == service_name.lower() and inst.status != "offline"
            ]

    def get_all_nodes(self) -> List[Dict[str, Any]]:
        with self._lock:
            return [inst.to_dict() for inst in self._services.values()]

    def set_status(self, node_id: str, status: str):
        with self._lock:
            if node_id in self._services:
                self._services[node_id].status = status


# Singleton instance
service_registry = ServiceRegistry()

def get_service_registry() -> ServiceRegistry:
    return service_registry
