import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import "./DCControlPanel.css";

// ─── Static trace steps (illustrative distributed trace) ───────────────────
const TRACE_STEPS = [
  { span: "span-001", op: "HTTP POST /api/match",      service: "gateway-node-01",   dur: 2,   pct: 2  },
  { span: "span-002", op: "JWT Verify + Auth Check",   service: "auth-node-01",      dur: 12,  pct: 8  },
  { span: "span-003", op: "Cache Lookup (Redis)",      service: "cache-node-01",     dur: 1,   pct: 0.7},
  { span: "span-004", op: "DB Query — User Profile",   service: "db-node-01",        dur: 6,   pct: 4  },
  { span: "span-005", op: "ML Model Inference",        service: "ml-node-01",        dur: 85,  pct: 57 },
  { span: "span-006", op: "NLP Ranking (TF-IDF)",      service: "nlp-node-01",       dur: 45,  pct: 30 },
  { span: "span-007", op: "Fetch Scheme Registry",     service: "scheme-node-01",    dur: 18,  pct: 12 },
  { span: "span-008", op: "Cache Write (result)",      service: "cache-node-01",     dur: 1,   pct: 0.7},
  { span: "span-009", op: "Log DC Event",              service: "notif-node-01",     dur: 3,   pct: 2  },
  { span: "span-010", op: "HTTP Response → Client",    service: "gateway-node-01",   dur: 2,   pct: 1.3},
];

// ─── MapReduce data for scheme matching ────────────────────────────────────
const MR_MAP_ITEMS = [
  { icon: "👤", label: "User Profile → Farmer" },
  { icon: "📍", label: "State → Maharashtra" },
  { icon: "💰", label: "Income → <1L/yr" },
  { icon: "🎂", label: "Age → 35, Male" },
  { icon: "🏠", label: "Family → 4 members" },
  { icon: "📚", label: "Education → 10th pass" },
];
const MR_SHUFFLE_ITEMS = [
  { icon: "🌾", label: "Agriculture Schemes (12)" },
  { icon: "🏥", label: "Health Schemes (8)" },
  { icon: "👩", label: "Women Welfare (5)" },
  { icon: "🏦", label: "Finance Schemes (9)" },
  { icon: "🎓", label: "Education Schemes (4)" },
];
const MR_REDUCE_ITEMS = [
  { icon: "🥇", label: "PM Kisan — ₹6,000/yr", score: 98 },
  { icon: "🥈", label: "Ayushman Bharat — ₹5L", score: 95 },
  { icon: "🥉", label: "Ujjwala 2.0 — ₹1,600",  score: 91 },
  { icon: "4️⃣", label: "Jan Dhan — Account+",   score: 87 },
  { icon: "5️⃣", label: "Kisan Credit Card",      score: 83 },
];

const LB_COLORS = [
  "linear-gradient(90deg,#00d4ff,#22d3ee)",
  "linear-gradient(90deg,#c084fc,#a855f7)",
  "linear-gradient(90deg,#00ff88,#4ade80)",
  "linear-gradient(90deg,#fbbf24,#f59e0b)",
  "linear-gradient(90deg,#fb923c,#f97316)",
];

const NAV_TABS = [
  { key: "overview",   icon: "⬡",   label: "OVERVIEW"    },
  { key: "nodes",      icon: "○",   label: "NODE GRID"   },
  { key: "topology",   icon: "◈",   label: "TOPOLOGY"    },
  { key: "mapreduce",  icon: "⟳",   label: "MAP-REDUCE"  },
  { key: "events",     icon: "≡",   label: "EVENT BUS"   },
  { key: "shards",     icon: "◫",   label: "SHARDS"      },
  { key: "consensus",  icon: "⊞",   label: "CONSENSUS"   },
  { key: "trace",      icon: "↻",   label: "DIST TRACE"  },
  { key: "cap",        icon: "△",   label: "CAP THEOREM" },
];

// ─── Utility ───────────────────────────────────────────────────────────────
function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour12: false });
}

function colorForStatus(s) {
  return s === "online" ? "var(--dc-green)" : s === "degraded" ? "var(--dc-amber)" : "var(--dc-red)";
}

// ─── Network Topology SVG ─────────────────────────────────────────────────
function TopologySVG({ nodes, edges }) {
  // Position nodes in a rough circular + center layout
  const POSITIONS = {
    "gateway-node-01": { x: 50, y: 50 },
    "auth-node-01":    { x: 20, y: 20 },
    "ml-node-01":      { x: 80, y: 20 },
    "scheme-node-01":  { x: 80, y: 50 },
    "nlp-node-01":     { x: 90, y: 75 },
    "doc-node-01":     { x: 20, y: 75 },
    "notif-node-01":   { x: 35, y: 88 },
    "savings-node-01": { x: 65, y: 88 },
    "db-node-01":      { x: 50, y: 80 },
    "cache-node-01":   { x: 50, y: 30 },
  };

  const W = 800, H = 450;
  const toXY = (id) => ({
    x: ((POSITIONS[id]?.x ?? 50) / 100) * W,
    y: ((POSITIONS[id]?.y ?? 50) / 100) * H,
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dc-topology-svg" style={{ minHeight: 350 }}>
      <defs>
        <filter id="glow-g">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(0,212,255,0.5)" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((e, i) => {
        const from = toXY(e.from), to = toXY(e.to);
        const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
        return (
          <g key={i}>
            <line
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke="rgba(0,212,255,0.18)" strokeWidth="1.5"
              markerEnd="url(#arrow)"
              strokeDasharray="5 4"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-18"
                dur={`${1.5 + (i % 4) * 0.3}s`} repeatCount="indefinite" />
            </line>
            <text x={mx} y={my - 6} fontSize="7" fill="rgba(0,212,255,0.4)"
              textAnchor="middle" fontFamily="JetBrains Mono">
              {e.protocol}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const { x, y } = toXY(node.id);
        const color = colorForStatus(node.status);
        const short = node.id.replace("-node-01", "").replace("-node-02", "");
        return (
          <g key={node.id} filter="url(#glow-g)">
            <circle cx={x} cy={y} r={28} fill="rgba(10,20,50,0.9)"
              stroke={color} strokeWidth="1.5" />
            <circle cx={x} cy={y} r={28} fill="transparent"
              stroke={color} strokeWidth="0.5" opacity="0.3">
              <animate attributeName="r" from="28" to="38"
                dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.3" to="0"
                dur="2s" repeatCount="indefinite" />
            </circle>
            <text x={x} y={y - 6} fontSize="9" fill={color}
              textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="700">
              {short.toUpperCase()}
            </text>
            <text x={x} y={y + 6} fontSize="7" fill="rgba(226,232,240,0.5)"
              textAnchor="middle" fontFamily="JetBrains Mono">
              {node.latency_ms}ms
            </text>
            <circle cx={x + 20} cy={y - 20} r={5} fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function DCControlPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const [nodes,     setNodes]     = useState([]);
  const [topology,  setTopology]  = useState({ nodes: [], edges: [] });
  const [events,    setEvents]    = useState([]);
  const [shards,    setShards]    = useState([]);
  const [metrics,   setMetrics]   = useState(null);
  const [consensus, setConsensus] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [time,      setTime]      = useState(new Date());
  const eventTimerRef = useRef(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const [nodesR, topoR, eventsR, shardsR, metricsR, consensusR] = await Promise.allSettled([
        API.get("/dc/nodes"),
        API.get("/dc/topology"),
        API.get("/dc/events?limit=30"),
        API.get("/dc/shards"),
        API.get("/dc/metrics"),
        API.get("/dc/consensus"),
      ]);
      if (nodesR.status === "fulfilled")    setNodes(nodesR.value.data);
      if (topoR.status === "fulfilled")     setTopology(topoR.value.data);
      if (eventsR.status === "fulfilled")   setEvents(eventsR.value.data);
      if (shardsR.status === "fulfilled")   setShards(shardsR.value.data);
      if (metricsR.status === "fulfilled")  setMetrics(metricsR.value.data);
      if (consensusR.status === "fulfilled")setConsensus(consensusR.value.data);
    } catch (e) { console.error("DC fetch error:", e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh events every 4s
  useEffect(() => {
    eventTimerRef.current = setInterval(() => fetchAll(true), 4000);
    return () => clearInterval(eventTimerRef.current);
  }, [fetchAll]);

  const handleToggleNode = async (nodeId) => {
    try {
      await API.post(`/dc/nodes/${nodeId}/toggle`);
      fetchAll(true);
    } catch (e) { console.error("Toggle error:", e); }
  };

  const handleExecuteVote = async (docId) => {
    try {
      await API.post(`/dc/consensus/vote?doc_id=${docId}`);
      fetchAll(true);
    } catch (e) { console.error("Vote error:", e); }
  };

  const handleRebalanceShards = async () => {
    try {
      await API.post(`/dc/shard/rebalance`);
      fetchAll(true);
    } catch (e) { console.error("Rebalance error:", e); }
  };

  const onlineCount = nodes.filter(n => n.status === "online").length;
  const degradedCount = nodes.filter(n => n.status === "degraded").length;

  // ─── Render Tabs ──────────────────────────────────────────────────────────
  function renderOverview() {
    if (!metrics) return <div className="dc-skeleton" style={{ height: 200 }} />;
    const m = metrics;
    return (
      <>
        {/* Top Metrics */}
        <div className="dc-metrics-grid">
          {[
            { label: "Active Nodes",         value: `${m.active_nodes}/${m.total_nodes}`, unit: "",     color: "var(--dc-green)",  trend: "↑ All healthy" },
            { label: "Avg Latency",          value: m.avg_latency_ms,   unit: "ms",   color: "var(--dc-cyan)",   trend: "↓ p99: "+m.p99_latency_ms+"ms" },
            { label: "Throughput",           value: m.throughput_rps,   unit: "rps",  color: "var(--dc-purple)", trend: "↑ 12% vs avg" },
            { label: "Error Rate",           value: m.error_rate_pct,   unit: "%",    color: m.error_rate_pct < 1 ? "var(--dc-green)" : "var(--dc-red)", trend: m.error_rate_pct < 1 ? "✓ Within SLA" : "⚠ Above target" },
            { label: "Cache Hit Rate",       value: m.cache_hit_rate_pct,unit: "%",   color: "var(--dc-green)",  trend: "↑ Good" },
            { label: "Replication Lag",      value: m.replication_lag_ms,unit: "ms",  color: "var(--dc-amber)",  trend: "Eventual consistency" },
            { label: "Pending Verifications",value: m.pending_verifications,unit: "",  color: "var(--dc-amber)", trend: "Awaiting consensus" },
            { label: "Uptime",               value: m.uptime_pct,       unit: "%",    color: "var(--dc-green)",  trend: "SLA target: 99.9%" },
          ].map((item, i) => (
            <div className="dc-metric-card" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="dc-metric-label">{item.label}</div>
              <div className="dc-metric-value" style={{ color: item.color }}>
                {item.value}<span className="dc-metric-unit"> {item.unit}</span>
              </div>
              <div className="dc-metric-trend trend-up">{item.trend}</div>
            </div>
          ))}
        </div>

        {/* System Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div className="dc-card">
            <div className="dc-section-title">CONSISTENCY MODEL</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--dc-cyan)", margin: "8px 0 4px" }}>{m.consistency_level}</div>
            <div style={{ fontSize: 12, color: "var(--dc-muted)" }}>Trades strict consistency for high availability across all nodes (AP mode per CAP theorem)</div>
          </div>
          <div className="dc-card">
            <div className="dc-section-title">CONSENSUS ALGORITHM</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--dc-purple)", margin: "8px 0 4px" }}>{m.consensus_algorithm}</div>
            <div style={{ fontSize: 12, color: "var(--dc-muted)" }}>Leader election + log replication for document verification quorum (⌈N/2⌉ + 1 votes required)</div>
          </div>
          <div className="dc-card">
            <div className="dc-section-title">SHARDING STRATEGY</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--dc-green)", margin: "8px 0 4px" }}>{m.shard_count} Shards</div>
            <div style={{ fontSize: 12, color: "var(--dc-muted)" }}>Geographic sharding by Indian state/region. Range-based partition key: user.state</div>
          </div>
        </div>

        {/* Load Balancer */}
        <div className="dc-card" style={{ marginTop: 16 }}>
          <div className="dc-section-header">
            <div>
              <div className="dc-section-title">LOAD BALANCER — WEIGHTED ROUND ROBIN</div>
              <div className="dc-section-subtitle" style={{ fontSize: 16 }}>Traffic Distribution across Nodes</div>
            </div>
          </div>
          <div className="dc-lb-bar-container">
            {nodes.slice(0, 6).map((node, i) => {
              const rps = node.requests_per_sec || 0;
              const total = nodes.slice(0, 6).reduce((s, n) => s + (n.requests_per_sec || 0), 1);
              const pct = Math.round((rps / total) * 100);
              return (
                <div className="dc-lb-row" key={node.id}>
                  <div className="dc-lb-label">{node.id}</div>
                  <div className="dc-lb-track">
                    <div className="dc-lb-fill" style={{ width: `${pct}%`, background: LB_COLORS[i % LB_COLORS.length] }}>
                      {pct > 10 && `${rps} rps`}
                    </div>
                  </div>
                  <div className="dc-lb-pct">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Snapshot time */}
        <div style={{ textAlign: "center", marginTop: 16, fontFamily: "var(--dc-mono)", fontSize: 10, color: "var(--dc-muted)" }}>
          SNAPSHOT AT {m.snapshot_at} UTC · AUTO-REFRESH 10s
        </div>
      </>
    );
  }

  function renderNodes() {
    if (loading) return <div className="dc-skeleton" style={{ height: 300 }} />;
    return (
      <div className="dc-node-grid">
        {nodes.map(node => (
          <div className={`dc-node-card ${node.status}`} key={node.id}>
            <div className="dc-node-header">
              <div>
                <div className="dc-node-id">{node.id}</div>
                <div className="dc-node-service">{node.service}</div>
                <div className="dc-node-region">📡 {node.region} · {node.replicas} replicas</div>
              </div>
              <div className={`dc-node-badge ${node.status}`}>
                <span className="badge-dot" />
                {node.status.toUpperCase()}
              </div>
            </div>

            <div className="dc-node-stats">
              <div className="dc-node-stat">
                <div className="dc-node-stat-label">Latency</div>
                <div className="dc-node-stat-value" style={{ color: node.latency_ms < 50 ? "var(--dc-green)" : node.latency_ms < 100 ? "var(--dc-amber)" : "var(--dc-red)" }}>
                  {node.latency_ms}<span style={{ fontSize: 10, color: "var(--dc-muted)" }}>ms</span>
                </div>
              </div>
              <div className="dc-node-stat">
                <div className="dc-node-stat-label">Req/s</div>
                <div className="dc-node-stat-value" style={{ color: "var(--dc-cyan)" }}>{node.requests_per_sec}</div>
              </div>
              <div className="dc-node-stat">
                <div className="dc-node-stat-label">CPU %</div>
                <div className="dc-node-stat-value">{node.cpu_pct}%</div>
                <div className="dc-progress-bar">
                  <div className="dc-progress-fill fill-cyan" style={{ width: `${node.cpu_pct}%` }} />
                </div>
              </div>
              <div className="dc-node-stat">
                <div className="dc-node-stat-label">Memory %</div>
                <div className="dc-node-stat-value">{node.memory_pct}%</div>
                <div className="dc-progress-bar">
                  <div className={`dc-progress-fill ${node.memory_pct > 80 ? "fill-red" : "fill-purple"}`} style={{ width: `${node.memory_pct}%` }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--dc-mono)", fontSize: 10, color: "var(--dc-muted)" }}>
              <span>Uptime: {node.uptime_pct}%</span>
              <span>Port :{node.port}</span>
              <button
                onClick={() => handleToggleNode(node.id)}
                style={{
                  background: "rgba(0,212,255,0.1)",
                  border: "1px solid rgba(0,212,255,0.3)",
                  color: "#00d4ff",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "9px",
                  cursor: "pointer",
                  fontFamily: "var(--dc-mono)"
                }}
              >
                🔄 Toggle State
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderTopology() {
    if (loading) return <div className="dc-skeleton" style={{ height: 400 }} />;
    return (
      <div className="dc-topology-container">
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--dc-border)", fontFamily: "var(--dc-mono)", fontSize: 11, color: "var(--dc-muted)" }}>
          NODES: {topology.nodes.length} · EDGES: {topology.edges.length} · PROTOCOLS: REST / gRPC / Redis / MQ / SQL
        </div>
        <TopologySVG nodes={topology.nodes} edges={topology.edges} />
        <div style={{ padding: "12px 24px", borderTop: "1px solid var(--dc-border)", display: "flex", gap: 24, flexWrap: "wrap" }}>
          {["online", "degraded", "offline"].map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--dc-mono)", fontSize: 11 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: colorForStatus(s), display: "inline-block" }} />
              <span style={{ color: "var(--dc-muted)", textTransform: "uppercase", letterSpacing: 1 }}>{s}</span>
              <strong style={{ color: colorForStatus(s) }}>{topology.nodes.filter(n => n.status === s).length}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderMapReduce() {
    return (
      <div>
        <div style={{ background: "rgba(0,212,255,0.06)", border: "1px solid var(--dc-border)", borderRadius: 12, padding: "16px 24px", marginBottom: 24, fontFamily: "var(--dc-mono)", fontSize: 12, color: "var(--dc-cyan)" }}>
          💡 MapReduce Pipeline — Scheme Matching for a User Profile<br />
          <span style={{ color: "var(--dc-muted)", fontSize: 11 }}>
            When you submit your profile, the ML engine executes a distributed MapReduce job: Map phase spreads user attributes to worker nodes, Shuffle phase groups by scheme category, Reduce phase aggregates and ranks by benefit value.
          </span>
        </div>

        <div className="dc-mapreduce">
          {/* MAP */}
          <div className="dc-mr-phase map">
            <div className="dc-mr-phase-label">⚡ MAP PHASE</div>
            <div style={{ fontSize: 11, color: "var(--dc-muted)", marginBottom: 12 }}>Emit (key, value) pairs from input record</div>
            {MR_MAP_ITEMS.map((item, i) => (
              <div className="dc-mr-item" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <span>{item.icon}</span>
                <span style={{ color: "var(--dc-text)" }}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="dc-mr-arrow">→</div>

          {/* SHUFFLE */}
          <div className="dc-mr-phase shuffle">
            <div className="dc-mr-phase-label">🔀 SHUFFLE + SORT</div>
            <div style={{ fontSize: 11, color: "var(--dc-muted)", marginBottom: 12 }}>Group by scheme category key</div>
            {MR_SHUFFLE_ITEMS.map((item, i) => (
              <div className="dc-mr-item" key={i} style={{ animationDelay: `${i * 0.12}s`, borderColor: "rgba(192,132,252,0.2)" }}>
                <span>{item.icon}</span>
                <span style={{ color: "var(--dc-text)" }}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="dc-mr-arrow">→</div>

          {/* REDUCE */}
          <div className="dc-mr-phase reduce">
            <div className="dc-mr-phase-label">📊 REDUCE PHASE</div>
            <div style={{ fontSize: 11, color: "var(--dc-muted)", marginBottom: 12 }}>Aggregate + rank by benefit score</div>
            {MR_REDUCE_ITEMS.map((item, i) => (
              <div className="dc-mr-item" key={i} style={{ animationDelay: `${i * 0.12}s`, borderColor: "rgba(0,255,136,0.2)" }}>
                <span>{item.icon}</span>
                <span style={{ flex: 1, color: "var(--dc-text)" }}>{item.label}</span>
                <span style={{ fontFamily: "var(--dc-mono)", color: "var(--dc-green)", fontSize: 10 }}>{item.score}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Complexity Info */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 24 }}>
          {[
            { label: "Input Records",     value: "1",        unit: "user profile" },
            { label: "Scheme Corpus",     value: "500+",     unit: "schemes scanned" },
            { label: "Worker Nodes",      value: "3",        unit: "ml-node shards" },
            { label: "Map Output Pairs",  value: "~1,800",   unit: "key-value pairs" },
            { label: "Shuffle Groups",    value: "12",       unit: "categories" },
            { label: "Reduce Time",       value: "85",       unit: "ms avg" },
          ].map((item, i) => (
            <div className="dc-metric-card" key={i}>
              <div className="dc-metric-label">{item.label}</div>
              <div className="dc-metric-value" style={{ color: "var(--dc-purple)", fontSize: 20 }}>{item.value}</div>
              <div style={{ fontFamily: "var(--dc-mono)", fontSize: 10, color: "var(--dc-muted)" }}>{item.unit}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderEvents() {
    if (loading) return <div className="dc-skeleton" style={{ height: 300 }} />;
    return (
      <div className="dc-card">
        <div style={{ fontFamily: "var(--dc-mono)", fontSize: 10, letterSpacing: 2, color: "var(--dc-muted)", marginBottom: 8, display: "grid", gridTemplateColumns: "20px 120px 1fr 80px 60px", gap: 12, padding: "0 12px" }}>
          <span>#</span><span>NODE</span><span>EVENT</span><span>LATENCY</span><span>STATUS</span>
        </div>
        <div className="dc-event-feed">
          {events.map((ev, i) => (
            <div className="dc-event-row" key={ev.id || i}>
              <span style={{ color: ev.color, fontSize: 14 }}>{ev.icon}</span>
              <span className="dc-event-node">{ev.node_id}</span>
              <span className="dc-event-type">
                <span style={{ fontFamily: "var(--dc-mono)", color: ev.color, fontSize: 10 }}>[{ev.event_type}]</span>
                <span style={{ color: "var(--dc-muted)", fontSize: 10, marginLeft: 6 }}>{fmtTime(ev.timestamp)}</span>
              </span>
              <span className="dc-event-lat">{ev.latency_ms}ms</span>
              <span className={ev.status === "success" ? "dc-event-status-ok" : "dc-event-status-err"}>
                {ev.status === "success" ? "✓ OK" : "✗ ERR"}
              </span>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: "var(--dc-mono)", fontSize: 10, color: "var(--dc-muted)", marginTop: 12, textAlign: "center" }}>
          {events.length} events · Real DB events mixed with synthetic heartbeats · Live feed auto-refreshes every 10s
        </div>
      </div>
    );
  }

  function renderShards() {
    if (loading) return <div className="dc-skeleton" style={{ height: 300 }} />;
    const maxCount = Math.max(...shards.map(s => s.user_count));
    return (
      <>
        <div style={{ background: "rgba(0,255,136,0.05)", border: "1px solid var(--dc-border2)", borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, fontFamily: "var(--dc-mono)", fontSize: 11, color: "var(--dc-green)" }}>
          <div>📊 Range-based Geographic Sharding — Partition key: <strong>user.state</strong> → routed to regional shard node</div>
          <button
            onClick={handleRebalanceShards}
            style={{
              background: "linear-gradient(90deg, #ff6b00, #f97316)",
              color: "#ffffff",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            🔄 Trigger Shard Rebalance
          </button>
        </div>
        <div className="dc-shard-grid">
          {shards.map((shard, i) => (
            <div className="dc-shard-card" key={i}>
              <div className="dc-shard-accent" style={{ background: shard.color }} />
              <div className="dc-shard-state">{shard.state}</div>
              <div className="dc-shard-id">{shard.shard} · {shard.region}</div>
              <div className="dc-shard-bar-wrap">
                <div className="dc-shard-bar" style={{ width: `${(shard.user_count / maxCount) * 100}%`, background: shard.color }} />
              </div>
              <div className="dc-shard-counts">
                <span>👤 {shard.user_count} users</span>
                <span>📄 {shard.doc_count} docs</span>
                <span>{shard.pct}%</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { label: "Sharding Strategy", value: "Range-based" },
            { label: "Partition Key",     value: "user.state" },
            { label: "Rebalance Policy",  value: "Auto (consistent hash)" },
            { label: "Cross-shard Queries", value: "Scatter-gather" },
          ].map((item, i) => (
            <div className="dc-card" key={i} style={{ padding: 16 }}>
              <div className="dc-metric-label">{item.label}</div>
              <div style={{ fontFamily: "var(--dc-mono)", fontSize: 14, color: "var(--dc-cyan)", marginTop: 4 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </>
    );
  }

  function renderConsensus() {
    if (loading || !consensus) return <div className="dc-skeleton" style={{ height: 300 }} />;
    return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Algorithm",     value: consensus.algorithm,    color: "var(--dc-purple)" },
            { label: "Leader Node",   value: consensus.leader,       color: "var(--dc-cyan)" },
            { label: "Total Nodes",   value: consensus.total_nodes,  color: "var(--dc-text)" },
            { label: "Quorum Size",   value: consensus.quorum_size,  color: "var(--dc-green)" },
            { label: "Current Term",  value: `#${consensus.term}`,   color: "var(--dc-amber)" },
            { label: "Pending Items", value: consensus.pending_items.length, color: "var(--dc-amber)" },
          ].map((item, i) => (
            <div className="dc-metric-card" key={i}>
              <div className="dc-metric-label">{item.label}</div>
              <div style={{ fontFamily: "var(--dc-mono)", fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {consensus.pending_items.length === 0 ? (
          <div className="dc-empty">✓ No pending consensus items — all documents resolved</div>
        ) : (
          consensus.pending_items.map((item) => (
            <div className="dc-consensus-item" key={item.doc_id}>
              <div className="dc-consensus-header">
                <div>
                  <div className="dc-consensus-doc">📄 {item.original_name} · <span style={{ color: "var(--dc-cyan)", fontFamily: "var(--dc-mono)", fontSize: 11 }}>{item.doc_type}</span></div>
                  <div className="dc-consensus-term">Raft Term #{item.term} · Leader: {item.leader_node} · User #{item.user_id}</div>
                </div>
                <div style={{ padding: "4px 12px", borderRadius: 20, fontFamily: "var(--dc-mono)", fontSize: 10,
                  background: item.quorum_reached ? "rgba(0,255,136,0.1)" : "rgba(251,191,36,0.1)",
                  color: item.quorum_reached ? "var(--dc-green)" : "var(--dc-amber)",
                  border: `1px solid ${item.quorum_reached ? "rgba(0,255,136,0.3)" : "rgba(251,191,36,0.3)"}` }}>
                  {item.quorum_reached ? "✓ QUORUM" : "⏳ PENDING"}
                </div>
              </div>
              <div className="dc-vote-row">
                {item.votes.map((vote, vi) => (
                  <div key={vi} className={`dc-vote-chip ${vote.vote}`}>
                    🖧 {vote.node} · {vote.vote.toUpperCase()} · {vote.latency_ms}ms
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div style={{ fontFamily: "var(--dc-mono)", fontSize: 10, color: "var(--dc-muted)" }}>
                  Votes: {item.approve_count}/{item.quorum_required} needed for quorum
                </div>
                <button
                  onClick={() => handleExecuteVote(item.doc_id)}
                  style={{
                    background: "linear-gradient(90deg, #00ff88, #00d4ff)",
                    color: "#030812",
                    border: "none",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  🗳️ Force Quorum Vote & Verify
                </button>
              </div>
              <div className="dc-quorum-bar" style={{ marginTop: 8 }}>
                <div className="dc-quorum-fill" style={{ width: `${(item.approve_count / item.quorum_required) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </>
    );
  }

  function renderTrace() {
    const totalMs = TRACE_STEPS.reduce((s, t) => s + t.dur, 0);
    return (
      <div>
        <div style={{ background: "rgba(0,212,255,0.06)", border: "1px solid var(--dc-border)", borderRadius: 12, padding: "14px 20px", marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--dc-mono)", fontSize: 11, color: "var(--dc-cyan)" }}>
            TRACE ID: f2a8c3d1-9e4b-4f7a-b8c2-1d3e5f6a7b8c · Total: <strong>{totalMs}ms</strong> · Spans: {TRACE_STEPS.length}
          </div>
          <div style={{ fontFamily: "var(--dc-mono)", fontSize: 10, color: "var(--dc-muted)", marginTop: 4 }}>
            Distributed trace of a single scheme-matching request through all ArthMitra microservices
          </div>
        </div>
        <div className="dc-trace-timeline">
          {TRACE_STEPS.map((step, i) => (
            <div className="dc-trace-step" key={i} style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="dc-trace-step-card">
                <span className="dc-trace-span">{step.span}</span>
                <span className="dc-trace-op">{step.op}</span>
                <span className="dc-trace-service">{step.service}</span>
                <span className="dc-trace-dur">{step.dur}ms</span>
              </div>
              <div className="dc-trace-bar-wrap">
                <div className="dc-trace-bar-fill" style={{ width: `${step.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, fontFamily: "var(--dc-mono)", fontSize: 10, color: "var(--dc-muted)", textAlign: "center" }}>
          Bottleneck: ml-node-01 (85ms) · Optimization target: model caching (estimated -60ms with warm cache)
        </div>
      </div>
    );
  }

  function renderCAP() {
    const props = [
      { key: "C", label: "Consistency",          desc: "Every read gets the most recent write or an error. Achievable in strongly consistent DB modes.", color: "#00d4ff",  active: false },
      { key: "A", label: "Availability",          desc: "Every request gets a (non-error) response, though it may not be the latest write.", color: "#00ff88",  active: true  },
      { key: "P", label: "Partition Tolerance",   desc: "System operates despite network partitions between nodes. Always required in distributed systems.", color: "#c084fc",  active: true  },
    ];

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <div className="dc-section-title" style={{ marginBottom: 12 }}>CAP THEOREM</div>
          <div style={{ fontSize: 13, color: "var(--dc-muted)", marginBottom: 20, lineHeight: 1.7 }}>
            In any distributed system, you can only guarantee <strong style={{ color: "var(--dc-cyan)" }}>two of three</strong> properties simultaneously. ArthMitra runs in <strong style={{ color: "var(--dc-green)" }}>AP mode</strong> — prioritising availability and partition tolerance, accepting eventual consistency.
          </div>

          <svg viewBox="0 0 300 260" style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }}>
            {/* Triangle */}
            <polygon points="150,30 280,230 20,230" fill="rgba(0,212,255,0.04)"
              stroke="rgba(0,212,255,0.2)" strokeWidth="1.5" strokeDasharray="6 4" />

            {/* Vertices */}
            <circle cx="150" cy="30"  r="22" fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="1.5" />
            <text x="150" y="35" textAnchor="middle" fontSize="12" fill="#00d4ff" fontWeight="700" fontFamily="JetBrains Mono">C</text>

            <circle cx="280" cy="230" r="22" fill="rgba(0,255,136,0.15)" stroke="#00ff88" strokeWidth="2.5" />
            <text x="280" y="235" textAnchor="middle" fontSize="12" fill="#00ff88" fontWeight="700" fontFamily="JetBrains Mono">A</text>

            <circle cx="20" cy="230" r="22" fill="rgba(192,132,252,0.15)" stroke="#c084fc" strokeWidth="2.5" />
            <text x="20" y="235" textAnchor="middle" fontSize="12" fill="#c084fc" fontWeight="700" fontFamily="JetBrains Mono">P</text>

            {/* Current mode highlight */}
            <polygon points="280,230 20,230 150,130" fill="rgba(0,255,136,0.08)"
              stroke="rgba(0,255,136,0.3)" strokeWidth="1" />
            <text x="150" y="195" textAnchor="middle" fontSize="9" fill="#00ff88" fontFamily="JetBrains Mono">ArthMitra</text>
            <text x="150" y="206" textAnchor="middle" fontSize="8" fill="rgba(0,255,136,0.6)" fontFamily="JetBrains Mono">AP Mode</text>

            {/* Labels */}
            <text x="150" y="15"  textAnchor="middle" fontSize="8" fill="#00d4ff" fontFamily="JetBrains Mono">CONSISTENCY</text>
            <text x="292" y="248" textAnchor="middle" fontSize="8" fill="#00ff88" fontFamily="JetBrains Mono">AVAIL.</text>
            <text x="8"  y="248" textAnchor="middle" fontSize="8" fill="#c084fc" fontFamily="JetBrains Mono">PARTITION</text>
          </svg>
        </div>

        <div>
          <div className="dc-section-title" style={{ marginBottom: 16 }}>PROPERTY STATUS</div>
          {props.map(p => (
            <div key={p.key} className={`dc-cap-property ${p.active ? "active" : ""}`}>
              <div className="dc-cap-dot" style={{ background: p.active ? p.color : "rgba(255,255,255,0.2)", boxShadow: p.active ? `0 0 8px ${p.color}` : "none" }} />
              <div>
                <div className="dc-cap-label" style={{ color: p.active ? p.color : "var(--dc-muted)" }}>
                  {p.key}: {p.label} {p.active ? "✓" : "✗"}
                </div>
                <div className="dc-cap-desc">{p.desc}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 20 }}>
            <div className="dc-section-title" style={{ marginBottom: 12 }}>OTHER DC PATTERNS IN USE</div>
            {[
              { icon: "🔁", title: "Circuit Breaker",     desc: "Prevents cascade failures when ml-node is slow" },
              { icon: "🏥", title: "Health Checks",       desc: "Heartbeat every 30s from gateway-node-01" },
              { icon: "📥", title: "Backpressure",        desc: "Queue depth limits on the notification bus" },
              { icon: "🎯", title: "Service Discovery",   desc: "Registry-based lookup for all microservices" },
              { icon: "⚡", title: "Caching (Redis)",      desc: "LRU cache for ML inference results (TTL: 1h)" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: "var(--dc-muted)" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const TAB_RENDERERS = {
    overview:  renderOverview,
    nodes:     renderNodes,
    topology:  renderTopology,
    mapreduce: renderMapReduce,
    events:    renderEvents,
    shards:    renderShards,
    consensus: renderConsensus,
    trace:     renderTrace,
    cap:       renderCAP,
  };

  return (
    <div className="dc-root">
      {/* Header */}
      <header className="dc-header">
        <div className="dc-logo">
          <div className="dc-logo-icon">🖧</div>
          <div>
            <div className="dc-logo-text">ArthMitra DC Control Panel</div>
            <div className="dc-logo-sub">Distributed Computing Command Center</div>
          </div>
        </div>
        <div className="dc-header-right">
          <div className="dc-live-badge">
            <div className="dc-live-dot" />
            LIVE · {onlineCount}/{nodes.length} NODES
          </div>
          <div className="dc-time">
            {time.toLocaleTimeString("en-IN", { hour12: false })}
          </div>
          <button className="dc-refresh-btn" onClick={() => fetchAll(true)} disabled={refreshing}>
            <span className={refreshing ? "dc-spinning" : ""}>⟳</span>
            REFRESH
          </button>
          <Link to="/" className="dc-back-btn">← HOME</Link>
        </div>
      </header>

      {/* Nav */}
      <nav className="dc-nav">
        {NAV_TABS.map(tab => (
          <button key={tab.key} className={`dc-nav-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </nav>

      {/* Page Content */}
      <div className="dc-page">
        <div className="dc-section-header">
          <div>
            <div className="dc-section-title">ARTHMITRA AI / DISTRIBUTED SYSTEMS</div>
            <div className="dc-section-subtitle">{NAV_TABS.find(t => t.key === activeTab)?.label}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {degradedCount > 0 && (
              <div style={{ padding: "6px 14px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 20, fontFamily: "var(--dc-mono)", fontSize: 10, color: "var(--dc-amber)" }}>
                ⚠ {degradedCount} NODE{degradedCount > 1 ? "S" : ""} DEGRADED
              </div>
            )}
          </div>
        </div>

        {TAB_RENDERERS[activeTab]?.()}
      </div>
    </div>
  );
}
