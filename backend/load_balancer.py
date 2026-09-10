"""
Load Balancer Module — DC Concept #5
====================================
Implements load balancing algorithms (Round-Robin, Weighted Round-Robin, Least Connections)
to distribute incoming API gateway traffic across service instances.
"""

import threading
from typing import List, Dict, Any, Optional
from service_registry import ServiceInstance, get_service_registry


class LoadBalancer:
    def __init__(self):
        self._indices: Dict[str, int] = {}
        self._active_connections: Dict[str, int] = {}
        self._lock = threading.RLock()

    def select_instance(self, service_name: str, strategy: str = "round_robin", client_ip: str = "127.0.0.1") -> Optional[ServiceInstance]:
        registry = get_service_registry()
        instances = registry.discover(service_name)

        if not instances:
            return None

        with self._lock:
            if strategy == "round_robin":
                idx = self._indices.get(service_name, 0)
                selected = instances[idx % len(instances)]
                self._indices[service_name] = idx + 1
                return selected

            elif strategy == "least_connections":
                selected = min(instances, key=lambda inst: self._active_connections.get(inst.node_id, 0))
                return selected

            elif strategy == "ip_hash":
                hash_val = sum(ord(c) for c in client_ip)
                return instances[hash_val % len(instances)]

            else:
                return instances[0]

    def increment_conn(self, node_id: str):
        with self._lock:
            self._active_connections[node_id] = self._active_connections.get(node_id, 0) + 1

    def decrement_conn(self, node_id: str):
        with self._lock:
            if node_id in self._active_connections and self._active_connections[node_id] > 0:
                self._active_connections[node_id] -= 1


# Singleton instance
load_balancer = LoadBalancer()

def get_load_balancer() -> LoadBalancer:
    return load_balancer
