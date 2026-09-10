"""
Raft Consensus Engine — DC Concept #8
====================================
Implements a Raft consensus cluster for sensitive state changes (e.g. final scheme approval & verification).
Provides Leader election, heartbeats, log replication (AppendEntries), and Quorum commitment (2/3 majority).

Raft Roles:
  - LEADER: Manages log replication and receives updates.
  - FOLLOWER: Responds to requests from leaders and candidates.
  - CANDIDATE: Used to elect a new leader.
"""

import time
import threading
import random
import uuid
from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any


class RaftRole(str, Enum):
    FOLLOWER = "FOLLOWER"
    CANDIDATE = "CANDIDATE"
    LEADER = "LEADER"


@dataclass
class LogEntry:
    term: int
    index: int
    command: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)


class RaftNode:
    """Represents a virtual node participating in the Raft consensus cluster."""

    def __init__(self, node_id: str, cluster: "RaftCluster"):
        self.node_id = node_id
        self.cluster = cluster
        
        # Persistent state on all servers
        self.current_term = 0
        self.voted_for: Optional[str] = None
        self.log: List[LogEntry] = []
        
        # Volatile state on all servers
        self.commit_index = 0
        self.last_applied = 0
        self.role = RaftRole.FOLLOWER
        
        # Volatile state on leaders
        self.next_index: Dict[str, int] = {}
        self.match_index: Dict[str, int] = {}

        self.last_heartbeat = time.time()
        self.election_timeout = random.uniform(1.5, 3.0)  # Seconds

    def reset_election_timeout(self):
        self.last_heartbeat = time.time()
        self.election_timeout = random.uniform(1.5, 3.0)

    def request_vote(self, term: int, candidate_id: str, last_log_index: int, last_log_term: int) -> Dict[str, Any]:
        """RPC: Request Vote from Candidates."""
        if term > self.current_term:
            self.current_term = term
            self.role = RaftRole.FOLLOWER
            self.voted_for = None

        vote_granted = False
        if term == self.current_term and (self.voted_for is None or self.voted_for == candidate_id):
            last_term = self.log[-1].term if self.log else 0
            last_idx = self.log[-1].index if self.log else 0
            
            if last_log_term > last_term or (last_log_term == last_term and last_log_index >= last_idx):
                vote_granted = True
                self.voted_for = candidate_id
                self.reset_election_timeout()

        return {
            "term": self.current_term,
            "vote_granted": vote_granted,
            "node_id": self.node_id
        }

    def append_entries(self, term: int, leader_id: str, prev_log_index: int, 
                       prev_log_term: int, entries: List[LogEntry], leader_commit: int) -> Dict[str, Any]:
        """RPC: AppendEntries for Log Replication and Heartbeats."""
        if term < self.current_term:
            return {"term": self.current_term, "success": False, "node_id": self.node_id}

        self.reset_election_timeout()
        if term > self.current_term or self.role == RaftRole.CANDIDATE:
            self.current_term = term
            self.role = RaftRole.FOLLOWER
            self.voted_for = None

        # Check log consistency
        if prev_log_index > 0:
            if len(self.log) < prev_log_index or self.log[prev_log_index - 1].term != prev_log_term:
                return {"term": self.current_term, "success": False, "node_id": self.node_id}

        # Append new entries not already in log
        for entry in entries:
            idx = entry.index - 1
            if idx < len(self.log):
                if self.log[idx].term != entry.term:
                    self.log = self.log[:idx]
                    self.log.append(entry)
            else:
                self.log.append(entry)

        if leader_commit > self.commit_index:
            self.commit_index = min(leader_commit, len(self.log))

        return {"term": self.current_term, "success": True, "node_id": self.node_id}


class RaftCluster:
    """Manages the cluster of Raft nodes for scheme document approvals."""

    def __init__(self, node_ids: Optional[List[str]] = None):
        if not node_ids:
            node_ids = ["admin-node-01", "admin-node-02", "admin-node-03"]
        self.nodes: Dict[str, RaftNode] = {nid: RaftNode(nid, self) for nid in node_ids}
        self.leader_id: Optional[str] = "admin-node-01"
        self.nodes["admin-node-01"].role = RaftRole.LEADER
        self._lock = threading.RLock()
        self._stopped = False
        self._worker_thread = threading.Thread(target=self._run_loop, daemon=True)
        self._worker_thread.start()

    def _run_loop(self):
        """Background heartbeat and election ticker."""
        while not self._stopped:
            time.sleep(0.5)
            with self._lock:
                now = time.time()
                for node in list(self.nodes.values()):
                    if node.role == RaftRole.LEADER:
                        # Send periodic heartbeats
                        self._send_heartbeats(node)
                    elif now - node.last_heartbeat > node.election_timeout:
                        # Start election
                        self._start_election(node)

    def _send_heartbeats(self, leader: RaftNode):
        for nid, follower in self.nodes.items():
            if nid == leader.node_id:
                continue
            prev_idx = len(follower.log)
            prev_term = follower.log[-1].term if follower.log else 0
            follower.append_entries(
                term=leader.current_term,
                leader_id=leader.node_id,
                prev_log_index=prev_idx,
                prev_log_term=prev_term,
                entries=[],
                leader_commit=leader.commit_index
            )

    def _start_election(self, candidate: RaftNode):
        candidate.role = RaftRole.CANDIDATE
        candidate.current_term += 1
        candidate.voted_for = candidate.node_id
        candidate.reset_election_timeout()

        votes = 1
        last_idx = len(candidate.log)
        last_term = candidate.log[-1].term if candidate.log else 0

        for nid, node in self.nodes.items():
            if nid == candidate.node_id:
                continue
            res = node.request_vote(candidate.current_term, candidate.node_id, last_idx, last_term)
            if res.get("vote_granted"):
                votes += 1

        quorum = (len(self.nodes) // 2) + 1
        if votes >= quorum:
            candidate.role = RaftRole.LEADER
            self.leader_id = candidate.node_id
            for nid in self.nodes:
                candidate.next_index[nid] = len(candidate.log) + 1
                candidate.match_index[nid] = 0

    def propose_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
        """Submits a state change proposal (e.g. document verification) through Raft consensus."""
        with self._lock:
            if not self.leader_id or self.nodes[self.leader_id].role != RaftRole.LEADER:
                # Elect a leader if none available
                first_node = next(iter(self.nodes.values()))
                self._start_election(first_node)

            leader = self.nodes[self.leader_id]
            entry_idx = len(leader.log) + 1
            entry = LogEntry(term=leader.current_term, index=entry_idx, command=command)
            leader.log.append(entry)

            acks = 1
            for nid, follower in self.nodes.items():
                if nid == leader.node_id:
                    continue
                prev_idx = entry_idx - 1
                prev_term = leader.log[prev_idx - 1].term if prev_idx > 0 else 0
                res = follower.append_entries(
                    term=leader.current_term,
                    leader_id=leader.node_id,
                    prev_log_index=prev_idx,
                    prev_log_term=prev_term,
                    entries=[entry],
                    leader_commit=leader.commit_index
                )
                if res.get("success"):
                    acks += 1

            quorum = (len(self.nodes) // 2) + 1
            quorum_reached = acks >= quorum

            if quorum_reached:
                leader.commit_index = entry_idx
                return {
                    "status": "success",
                    "quorum_reached": True,
                    "term": leader.current_term,
                    "index": entry_idx,
                    "acks": acks,
                    "leader": leader.node_id,
                    "message": f"Proposal committed by Raft Quorum ({acks}/{len(self.nodes)})"
                }
            else:
                return {
                    "status": "failed",
                    "quorum_reached": False,
                    "term": leader.current_term,
                    "index": entry_idx,
                    "acks": acks,
                    "leader": leader.node_id,
                    "message": "Quorum not reached"
                }

    def get_status(self) -> Dict[str, Any]:

        """Return consensus state metrics for DC Panel."""
        with self._lock:
            leader = self.nodes.get(self.leader_id) if self.leader_id else None
            return {
                "algorithm": "Raft",
                "total_nodes": len(self.nodes),
                "quorum_size": (len(self.nodes) // 2) + 1,
                "leader": self.leader_id,
                "current_term": leader.current_term if leader else 0,
                "nodes": [
                    {
                        "node_id": n.node_id,
                        "role": n.role.value,
                        "term": n.current_term,
                        "log_length": len(n.log),
                        "commit_index": n.commit_index
                    } for n in self.nodes.values()
                ]
            }


# Singleton instance
raft_cluster = RaftCluster()

def get_raft_cluster() -> RaftCluster:
    return raft_cluster
