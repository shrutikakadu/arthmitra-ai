# 🌿 ArthMitra AI — Full Technical Architecture & Distributed Systems Guide

> **Intelligent Citizen Financial Inclusion & Multi-Tier Government Welfare Platform**
> Powered by FastAPI, React, Multilingual NLP, Web Speech API, Raft Consensus, and Distributed Ledger Caching.

---

## 📌 Table of Contents
1. [System Architecture Overview](#-1-system-architecture-overview)
2. [Deep-Dive Tech Stack](#-2-deep-dive-tech-stack)
3. [Distributed Systems Architecture & Connection Terms](#-3-distributed-systems-architecture--connection-terms)
   - [Raft Consensus Protocol](#31-raft-consensus-protocol-quorum-verification)
   - [Master-Replica Database Replication](#32-master-replica-database-replication)
   - [State-Based Database Sharding](#33-state-based-geographical-sharding)
   - [Distributed Cache & Sliding-Window Rate Limiter](#34-distributed-cache--sliding-window-rate-limiter)
   - [Virtual Microservices Mesh Topology](#35-virtual-microservices-mesh-topology)
   - [Immutable Audit Ledger & Telemetry](#36-immutable-audit-ledger--telemetry)
4. [5-Tier Government Governance Hierarchy](#-4-5-tier-government-governance-hierarchy)
5. [AI, NLP & Voice Processing Pipeline](#-5-ai-nlp--voice-processing-pipeline)
6. [Installation & Local Setup](#-6-installation--local-setup)

---

## 🏗️ 1. System Architecture Overview

ArthMitra AI is designed as a distributed, multi-tier civic-tech application that connects citizens with government welfare schemes. It eliminates information asymmetry, language barriers, and bureaucratic corruption using artificial intelligence, voice recognition, and fault-tolerant distributed consensus.

```
                               ┌────────────────────────────────────────┐
                               │   Client Browser / Mobile Web (React)  │
                               └──────────────────┬─────────────────────┘
                                                  │ REST / WebSockets
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │     API Gateway / Load Balancer        │
                               │           (Port: 8000)                 │
                               └──────────────────┬─────────────────────┘
                                                  │
             ┌────────────────────────────────────┼────────────────────────────────────┐
             ▼                                    ▼                                    ▼
┌──────────────────────────┐         ┌──────────────────────────┐         ┌──────────────────────────┐
│   Auth & RBAC Service    │         │  ML Scheme Matcher & NLP │         │  Document Verification   │
│     (auth-node-01)       │         │    (ml-node-01 / NLP)    │         │      (doc-node-01)       │
└────────────┬─────────────┘         └────────────┬─────────────┘         └────────────┬─────────────┘
             │                                    │                                    │
             └────────────────────────────────────┼────────────────────────────────────┘
                                                  │
                                                  ▼
                          ┌────────────────────────────────────────────────┐
                          │   Distributed Cache (In-Memory Redis Simulation)│
                          │            (Cache-Aside / LRU)                 │
                          └───────────────────────┬────────────────────────┘
                                                  │
                                                  ▼
                          ┌────────────────────────────────────────────────┐
                          │    Primary Database Shard (SQLAlchemy / SQLite) │
                          └───────────────────────┬────────────────────────┘
                                                  │ Real-Time Replication Log
                                                  ▼
                          ┌────────────────────────────────────────────────┐
                          │     Replica DB Shard (Read-Only Secondary)     │
                          └───────────────────────┬────────────────────────┘
                                                  │
                                                  ▼
                          ┌────────────────────────────────────────────────┐
                          │  Raft Consensus Cluster (Quorum Approval Node) │
                          │             (Term 1, Index 3)                  │
                          └────────────────────────────────────────────────┘
```

---

## 🛠️ 2. Deep-Dive Tech Stack

### 🔹 Frontend Layer
- **Framework**: React 18 (Vite Build Engine for sub-second HMR)
- **Styling Architecture**: Vanilla CSS with Design Tokens (`:root` CSS variables, dark/light green themes, glassmorphism, dynamic animations)
- **State Management & Routing**: React Router v6, React Context API (`LanguageContext` supporting English `en`, Hindi `hi`, Marathi `mr`)
- **Interactive Visualizations**: Recharts Library (Radial Bar Charts, Pie Charts, Stacked Bar Graphs for Financial Health)
- **Speech Recognition Engine**: Browser-native Web Speech API (`webkitSpeechRecognition`) for real-time speech-to-text input in regional accents
- **HTTP Client**: Axios with centralized error interceptors and dynamic Base URL handling

### 🔹 Backend & API Layer
- **Framework**: Python 3.10+ FastAPI (High-concurrency ASGI Framework)
- **ASGI Web Server**: Uvicorn with auto-reloading worker threads
- **Database ORM**: SQLAlchemy ORM with connection pooling and session management (`SessionLocal`)
- **Security & Cryptography**: Bcrypt password hashing (`bcrypt.hashpw`), Session caching, Role-Based Access Control (RBAC) guards

### 🔹 AI, NLP & Knowledge Base
- **RAG Knowledge Engine**: Automated scheme scraper and chunk parser (`scheme_ingestion.py`)
- **Semantic Matcher Engine**: Multi-attribute weighted probability scoring algorithm matching income, caste, age, state, and occupation
- **Voice-to-Intent NLP Processor**: Speech-to-Intent translation parser mapping spoken phrases to profile form fields (`voice_processor.py`)

---

## ⚡ 3. Distributed Systems Architecture & Connection Terms

### 3.1 Raft Consensus Protocol (Quorum Verification)
To prevent corruption, unauthorized benefit disbursement, or single-point failure in high-value welfare applications, ArthMitra AI implements a **Raft Consensus Protocol**:
- **Terms & Indices**: Every major transaction (e.g., Cabinet Minister final approval) increments the `raft_term` and `raft_index`.
- **Quorum Approval**: An application cannot be marked `verified` (disbursed) without receiving vote confirmations across a 3-node consensus quorum.
- **Raft State Verification**: Audit logs verify quorum signatures: `Verified via Raft Consensus Quorum (Term 1, Index 3)`.

### 3.2 Master-Replica Database Replication
- **Primary Database Engine**: Handles all write transactions (`INSERT`, `UPDATE`, `DELETE`) for user registration, scheme submission, and document uploads (`arthmitra.db`).
- **Replica Database Engine**: Synchronizes data asynchronously from the primary database logs. Read workloads (such as scheme catalog queries and analytics) can be served from the replica (`arthmitra_replica.db`), reducing load on the primary node.

### 3.3 State-Based Geographical Sharding
Data is logically sharded across 10 virtual regional clusters based on citizen state metadata to optimize query performance and emulate distributed state data centers:
- `shard-west-01`: Maharashtra, Gujarat
- `shard-north-01`: Uttar Pradesh, Haryana, Punjab
- `shard-south-01`: Tamil Nadu, Karnataka
- `shard-east-01`: West Bengal, Bihar, Odisha
- `shard-central-01`: Madhya Pradesh, Rajasthan, Other States

### 3.4 Distributed Cache & Sliding-Window Rate Limiter
Implemented via a thread-safe in-memory cache engine (`distributed_cache.py`) supporting the **Cache-Aside Pattern**:
- **Namespaces**:
  - `schemes:*`: Government scheme catalog and state-filtered search results
  - `match:*`: Pre-computed ML match results per citizen profile
  - `session:*`: User and administrative active session tokens
  - `ratelimit:*`: Sliding-window rate limit counters
- **LRU Eviction & TTL**: Automatically evicts Least Recently Used keys when cache size exceeds 1,000 entries or when TTL expires.
- **Rate Limiting**: Enforces a strict sliding-window limit of 20 authentication requests/minute per mobile number (`check_rate_limit`).

### 3.5 Virtual Microservices Mesh Topology
The platform models a 10-node microservice mesh interacting via REST, gRPC, and Message Queue (MQ) protocols:
1. `gateway-node-01` (Port 8000) — API Gateway / Load Balancer
2. `auth-node-01` (Port 8001) — Authentication & Authorization
3. `ml-node-01` (Port 8002) — ML Scheme Eligibility Matcher
4. `scheme-node-01` (Port 8003) — Central Scheme Registry
5. `nlp-node-01` (Port 8004) — NLP Semantic Ranking Engine
6. `doc-node-01` (Port 8005) — Document Hash & Verification Service
7. `notif-node-01` (Port 8006) — Notification Event Bus
8. `savings-node-01` (Port 8007) — Financial Health & Savings Calculator
9. `db-node-01` (Port 5432) — Primary Database Shard
10. `cache-node-01` (Port 6379) — Distributed Cache Cluster

### 3.6 Immutable Audit Ledger & Telemetry
Every action in the system generates a distributed telemetry event (`DCEvent`) and audit log entry (`ApplicationAudit`):
- **Metrics Logged**: Microsecond latency (`latency_ms`), source node ID, event type (`scheme_query`, `doc_verify`, `consensus_vote`, `db_write`, `cache_hit`), and execution timestamp.
- **Transparency**: Citizens and administrators can inspect the exact timeline of who reviewed an application, when it was verified, and the reason for any action.

---

## 🏛️ 4. 5-Tier Government Governance Hierarchy

The platform implements strict Role-Based Access Control (RBAC) across 5 distinct tiers:

| Tier | Role Title | System Role (`user.role`) | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Tier 0** | **Citizen** | `user` | Fills profile, matches schemes, uploads documents, tracks status. |
| **Tier 1** | **Section Officer / Clerk** | `clerk` | Verifies uploaded documents (Aadhaar, Income, Caste, Land records). |
| **Tier 2** | **District Collector / DM** | `officer` | Administrative district review, quota clearance, district monitoring. |
| **Tier 3** | **Department Secretary** | `state_admin` | State ministry oversight, budget allocation check, policy compliance. |
| **Tier 4** | **Cabinet Minister** | `minister` | Apex sanction, triggers Raft Consensus vote, final fund disbursement. |
| **Admin** | **System Administrator** | `admin` | System-wide observability, Raft node monitoring (`/dc-panel`). |

---

## 🗣️ 5. AI, NLP & Voice Processing Pipeline

1. **Voice Input Capture**: Web Speech API captures user audio in English (`en-IN`), Hindi (`hi-IN`), or Marathi (`mr-IN`).
2. **Intent Parsing**: `voice_processor.py` analyzes the transcript and extracts entities such as Income (e.g. *"साठ हजार"* ➔ `60000`), Caste (*"OBC"*), Age, State, and Occupation.
3. **Automated Field Injection**: Extracted values are injected directly into form state controls.
4. **RAG Scheme Chatbot**: When users query `SchemeChatBot`, the engine searches index chunks from `LiveScheme` knowledge bases and generates localized answers with confidence badges (*✓ Verified*, *~ Approximate*).

---

## 🚀 6. Installation & Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# Install requirements:
pip install fastapi uvicorn sqlalchemy bcrypt pydantic
# Start backend server:
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Demo Accounts for Testing
- **Citizen**: Mobile `9876543210` / Password `pass123`
- **Section Officer (Clerk)**: Mobile `1111111111` / Password `clerk123`
- **District Collector (DM)**: Mobile `2222222222` / Password `officer123`
- **Department Secretary**: Mobile `3333333333` / Password `secretary123`
- **Cabinet Minister**: Mobile `9999999999` / Password `minister123`
- **System Administrator (DC Monitor)**: Mobile `5555555555` / Password `sysadmin123`
