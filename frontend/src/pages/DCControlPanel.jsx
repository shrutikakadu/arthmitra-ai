import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import "./DCControlPanel.css";
import { useLanguage } from "../LanguageContext";

// ─── Static trace steps (illustrative distributed trace) ───────────────────
const TRACE_STEPS = [
  { span: "span-001", op: "Citizen Request (HTTP POST)", service: "Citizen",          dur: 0,   pct: 0  },
  { span: "span-002", op: "Route Request",               service: "API Gateway",      dur: 2,   pct: 2  },
  { span: "span-003", op: "JWT Verify + Auth Check",     service: "Auth Service",     dur: 12,  pct: 8  },
  { span: "span-004", op: "Scheme Match Inference",      service: "Scheme Matcher",   dur: 85,  pct: 57 },
  { span: "span-005", op: "Check Cache",                 service: "Cache (Redis)",    dur: 1,   pct: 0.7},
  { span: "span-006", op: "Fetch Profile & Store",       service: "Database",         dur: 6,   pct: 4  },
  { span: "span-007", op: "Publish Match Event",         service: "Notification Bus", dur: 3,   pct: 2  },
];

const NAV_TABS = [
  { key: "overview",   icon: "⬡",   label: "OVERVIEW"    },
  { key: "nodes",      icon: "○",   label: "NODE GRID"   },
  { key: "topology",   icon: "◈",   label: "TOPOLOGY"    },
  { key: "events",     icon: "≡",   label: "EVENT TIMELINE" },
  { key: "shards",     icon: "◫",   label: "SHARDS"      },
  { key: "consensus",  icon: "⊞",   label: "CONSENSUS"   },
  { key: "cacherepl",  icon: "⚡",   label: "CACHE & REPL" },
  { key: "trace",      icon: "↻",   label: "DIST TRACE"  },
  { key: "cap",        icon: "△",   label: "CAP THEOREM" },
];

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + d.getMilliseconds().toString().padStart(3, '0');
}

function colorForStatus(s) {
  return s === "online" ? "var(--dc-green)" : s === "degraded" ? "var(--dc-orange)" : "var(--dc-red)";
}

function TopologySVG({ nodes, edges }) {
  const POSITIONS = {
    "gateway-node-01": { x: 50, y: 50 },
    "auth-node-01":    { x: 30, y: 25 },
    "ml-node-01":      { x: 70, y: 25 },
    "scheme-node-01":  { x: 85, y: 50 },
    "nlp-node-01":     { x: 70, y: 75 },
    "doc-node-01":     { x: 30, y: 75 },
    "notif-node-01":   { x: 15, y: 50 },
    "savings-node-01": { x: 50, y: 15 },
    "db-node-01":      { x: 50, y: 85 },
    "cache-node-01":   { x: 80, y: 85 },
  };

  const W = 800, H = 500;
  const toXY = (id) => ({
    x: ((POSITIONS[id]?.x ?? 50) / 100) * W,
    y: ((POSITIONS[id]?.y ?? 50) / 100) * H,
  });

  const getProtoColor = (p) => {
    switch(p) {
      case "REST": return "var(--dc-cyan)"; // Blue/Cyan
      case "MQ": return "var(--dc-purple)";
      case "SQL": return "var(--dc-orange)";
      case "Redis": case "Sync": return "var(--dc-green)";
      case "gRPC": return "var(--dc-teal)"; // Cyan variant
      default: return "var(--dc-muted)";
    }
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dc-topology-svg" style={{ minHeight: 450 }}>
      <defs>
        <filter id="glow-g">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-orange">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-red">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {edges.map((e, i) => {
        const from = toXY(e.from), to = toXY(e.to);
        const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
        const color = getProtoColor(e.protocol);
        return (
          <g key={i}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
            <circle r="3" fill={color} filter="url(#glow-g)">
              <animateMotion dur={`${1.5 + (i % 3) * 0.5}s`} repeatCount="indefinite" path={`M ${from.x},${from.y} L ${to.x},${to.y}`} />
            </circle>
            <text x={mx} y={my - 6} fontSize="9" fill={color} textAnchor="middle" fontFamily="var(--dc-mono)">
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
        const glowFilter = node.status === 'online' ? 'url(#glow-g)' : node.status === 'degraded' ? 'url(#glow-orange)' : 'url(#glow-red)';
        
        return (
          <g key={node.id}>
            <circle cx={x} cy={y} r={32} fill="var(--dc-surface2)" stroke={color} strokeWidth="2" filter={glowFilter} />
            {node.status === 'online' && (
              <circle cx={x} cy={y} r={32} fill="transparent" stroke={color} strokeWidth="1" opacity="0.5">
                <animate attributeName="r" from="32" to="45" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <text x={x} y={y + 4} fontSize="11" fill="var(--dc-text)" textAnchor="middle" fontFamily="var(--dc-mono)" fontWeight="700">
              {short.toUpperCase()}
            </text>
            <text x={x} y={y + 18} fontSize="9" fill={color} textAnchor="middle" fontFamily="var(--dc-mono)">
              {node.latency_ms}ms
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Animated Counter ───
const AnimatedCounter = ({ value, suffix = "" }) => {
  return (
    <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} key={value}>
      {value}{suffix}
    </motion.span>
  );
};

export default function DCControlPanel() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [nodes,     setNodes]     = useState([]);
  const [topology,  setTopology]  = useState({ nodes: [], edges: [] });
  const [events,    setEvents]    = useState([]);
  const [shards,    setShards]    = useState([]);
  const [metrics,   setMetrics]   = useState(null);
  const [cacheStats,setCacheStats]= useState(null);
  const [replStats, setReplStats] = useState(null);
  const [mqStats,   setMqStats]   = useState(null);
  const [locks,     setLocks]     = useState(null);
  const [consensus, setConsensus] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [time,      setTime]      = useState(new Date());
  
  const [voteAnim, setVoteAnim] = useState(false);

  // Role guard: only System Admin (role='admin') can access this panel
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/login"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "admin") {
      // Cabinet Minister and other gov roles → approval dashboard
      if (parsed.role && parsed.role !== "user") navigate("/admin");
      else navigate("/dashboard");
    }
  }, [navigate]);

  // Clock timer
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const [nodesR, topoR, eventsR, shardsR, metricsR, consensusR, cacheR, replR, mqR, lockR] = await Promise.allSettled([
        API.get("/dc/nodes"),
        API.get("/dc/topology"),
        API.get("/dc/events?limit=40"),
        API.get("/dc/shards"),
        API.get("/dc/metrics"),
        API.get("/dc/consensus"),
        API.get("/dc/cache/stats"),
        API.get("/dc/replication/stats"),
        API.get("/dc/mq/stats"),
        API.get("/dc/locks")
      ]);
      
      if (nodesR.status === "fulfilled")    setNodes(nodesR.value.data);
      if (topoR.status === "fulfilled")     setTopology(topoR.value.data);
      if (eventsR.status === "fulfilled")   setEvents(eventsR.value.data);
      if (shardsR.status === "fulfilled")   setShards(shardsR.value.data);
      if (metricsR.status === "fulfilled")  setMetrics(metricsR.value.data);
      if (consensusR.status === "fulfilled")setConsensus(consensusR.value.data);
      if (cacheR.status === "fulfilled")    setCacheStats(cacheR.value.data);
      if (replR.status === "fulfilled")     setReplStats(replR.value.data);
      if (mqR.status === "fulfilled")       setMqStats(mqR.value.data);
      if (lockR.status === "fulfilled")     setLocks(lockR.value.data);
    } catch (e) { console.error("DC fetch error:", e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const timer = setInterval(() => fetchAll(true), 4000);
    return () => clearInterval(timer);
  }, [fetchAll]);

  const handleToggleNode = async (nodeId) => {
    try {
      await API.post(`/dc/nodes/${nodeId}/toggle`);
      fetchAll(true);
    } catch (e) { console.error("Toggle error:", e); }
  };

  const handleExecuteVote = async (docId) => {
    setVoteAnim(true);
    setTimeout(async () => {
      try {
        await API.post(`/dc/consensus/vote?doc_id=${docId}`);
        fetchAll(true);
      } catch (e) { console.error("Vote error:", e); }
      setVoteAnim(false);
    }, 1200);
  };

  const handleRebalanceShards = async () => {
    setShards(prev => [...prev].sort(() => Math.random() - 0.5));
    try {
      await API.post(`/dc/shard/rebalance`);
      setTimeout(() => fetchAll(true), 800);
    } catch (e) { console.error("Rebalance error:", e); }
  };

  const renderOverview = () => {
    if (!metrics) return <div className="dc-skeleton" style={{ height: 300 }} />;
    const m = metrics;
    
    // Construct values for new cards
    const qBacklog = mqStats?.topics ? Object.values(mqStats.topics).reduce((s, t) => s + (t.queue_depth || 0), 0) : 0;
    const cacheHit = cacheStats?.hit_rate_pct || m.cache_hit_rate_pct || 0;
    const activeLocks = locks?.stats?.active_locks || 0;
    const replicationLag = replStats?.nodes?.[0]?.replication_lag_ms || m.replication_lag_ms || 0;
    const replHealth = replicationLag < 50 ? 'Healthy' : 'Lagging';

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="dc-metrics-grid">
          {[
            { label: t("dc_active_nodes"),       value: `${m.active_nodes}/${m.total_nodes}`, color: "var(--dc-green)",  trend: t("dc_system_online") },
            { label: t("dc_avg_latency"),        value: <AnimatedCounter value={m.avg_latency_ms} suffix="ms" />, color: "var(--dc-cyan)", trend: "p99: "+m.p99_latency_ms+"ms" },
            { label: t("dc_throughput"),   value: <AnimatedCounter value={m.throughput_rps} />, color: "var(--dc-purple)", trend: t("dc_traffic_stable") },
            { label: t("dc_cache_hit"),     value: <AnimatedCounter value={cacheHit} suffix="%" />, color: cacheHit > 80 ? "var(--dc-green)" : "var(--dc-orange)", trend: t("dc_redis_layer") },
            { label: t("dc_repl_health"), value: replHealth === 'Healthy' ? t("dc_healthy") : t("dc_lagging"), color: replHealth === 'Healthy' ? "var(--dc-green)" : "var(--dc-orange)", trend: `Lag: ${replicationLag}ms` },
            { label: t("dc_queue_backlog"),      value: <AnimatedCounter value={qBacklog} />, color: qBacklog < 100 ? "var(--dc-green)" : "var(--dc-orange)", trend: "RabbitMQ / Event Bus" },
            { label: t("dc_consensus_status"),   value: consensus?.pending_items?.length === 0 ? t("dc_synced") : t("dc_pending"), color: consensus?.pending_items?.length === 0 ? "var(--dc-green)" : "var(--dc-orange)", trend: "Raft Quorum" },
            { label: t("dc_active_locks"),       value: <AnimatedCounter value={activeLocks} />, color: "var(--dc-cyan)", trend: "Distributed Mutex" },
          ].map((item, i) => (
            <motion.div className="dc-metric-card" key={i} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
              <div className="dc-metric-label">{item.label}</div>
              <div className="dc-metric-value" style={{ color: item.color }}>{item.value}</div>
              <div className="dc-metric-trend" style={{ color: "var(--dc-muted)" }}>{item.trend}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderNodes = () => {
    if (loading && nodes.length === 0) return <div className="dc-skeleton" style={{ height: 300 }} />;
    return (
      <div className="dc-node-grid">
        <AnimatePresence>
          {nodes.map((node) => (
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`dc-node-card ${node.status}`} key={node.id}>
              <div className="dc-node-header">
                <div>
                  <div className="dc-node-id">{node.id}</div>
                  <div className="dc-node-service">{node.service}</div>
                  <div className="dc-node-region">📍 {node.region} · Port {node.port} · {node.replicas} repl</div>
                </div>
                <div className={`dc-node-badge ${node.status}`}>
                  <span className="badge-dot" />{node.status}
                </div>
              </div>
              <div className="dc-node-stats">
                <div className="dc-node-stat">
                  <div className="dc-node-stat-label">Latency</div>
                  <div className="dc-node-stat-value" style={{ color: node.latency_ms < 50 ? "var(--dc-green)" : node.latency_ms < 100 ? "var(--dc-orange)" : "var(--dc-red)" }}>{node.latency_ms}ms</div>
                </div>
                <div className="dc-node-stat">
                  <div className="dc-node-stat-label">Error Rate</div>
                  <div className="dc-node-stat-value" style={{ color: node.error_rate_pct < 1 ? "var(--dc-green)" : "var(--dc-red)" }}>{node.error_rate_pct}%</div>
                </div>
                <div className="dc-node-stat">
                  <div className="dc-node-stat-label">CPU</div>
                  <div className="dc-node-stat-value">{node.cpu_pct}%</div>
                  <div className="dc-progress-bar"><div className="dc-progress-fill" style={{ width: `${node.cpu_pct}%`, background: "var(--dc-cyan)" }}/></div>
                </div>
                <div className="dc-node-stat">
                  <div className="dc-node-stat-label">Memory</div>
                  <div className="dc-node-stat-value">{node.memory_pct}%</div>
                  <div className="dc-progress-bar"><div className="dc-progress-fill" style={{ width: `${node.memory_pct}%`, background: "var(--dc-purple)" }}/></div>
                </div>
              </div>
              <div className="dc-node-actions">
                <span>Uptime: {node.uptime_pct}%</span>
                <button className="dc-btn-outline" onClick={() => handleToggleNode(node.id)}>🔄 Toggle State</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const renderTopology = () => {
    if (loading && topology.nodes.length === 0) return <div className="dc-skeleton" style={{ height: 400 }} />;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dc-topology-container">
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--dc-border)", fontFamily: "var(--dc-mono)", fontSize: 11, color: "var(--dc-muted)" }}>
          NODES: {topology.nodes.length} · EDGES: {topology.edges.length} · Protocols: <span style={{color: "var(--dc-cyan)"}}>REST</span> / <span style={{color: "var(--dc-teal)"}}>gRPC</span> / <span style={{color: "var(--dc-green)"}}>Redis</span> / <span style={{color: "var(--dc-purple)"}}>MQ</span> / <span style={{color: "var(--dc-orange)"}}>SQL</span>
        </div>
        <TopologySVG nodes={topology.nodes} edges={topology.edges} />
      </motion.div>
    );
  };

  const renderEvents = () => {
    return (
      <div className="dc-card" style={{ padding: 0 }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontFamily: "var(--dc-mono)", fontSize: 11, color: "var(--dc-muted)", display: "grid", gridTemplateColumns: "32px 140px 1fr 80px 80px", gap: 12 }}>
          <span></span><span>NODE</span><span>EVENT</span><span style={{textAlign:"right"}}>LATENCY</span><span style={{textAlign:"right"}}>STATUS</span>
        </div>
        <div className="dc-event-feed">
          <AnimatePresence>
            {events.map((ev) => (
              <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} key={ev.id} className="dc-event-row">
                <div className="dc-event-icon" style={{ color: ev.color }}>{ev.icon}</div>
                <div className="dc-event-node">{ev.node_id}</div>
                <div>
                  <div className="dc-event-type" style={{ color: ev.color }}>{ev.event_type.replace('_', ' ').toUpperCase()}</div>
                  <span className="dc-event-time">{fmtTime(ev.timestamp)}</span>
                </div>
                <div className="dc-event-lat">{ev.latency_ms}ms</div>
                <div className="dc-event-status" style={{ color: ev.status === 'success' ? 'var(--dc-green)' : 'var(--dc-red)', background: ev.status === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,85,0.1)' }}>
                  {ev.status === 'success' ? 'PASS' : 'FAIL'}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderShards = () => {
    if (!shards.length) return <div className="dc-skeleton" style={{ height: 300 }} />;
    const maxUsers = Math.max(...shards.map(s => s.user_count));
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ color: "var(--dc-teal)", fontFamily: "var(--dc-mono)", fontSize: 12 }}>
            📊 State Sharding (Partition Key: user.state)
          </div>
          <button className="dc-btn-primary" onClick={handleRebalanceShards}>
            🔄 Rebalance Shards
          </button>
        </div>
        <motion.div layout className="dc-shard-grid">
          <AnimatePresence>
            {shards.map((shard) => (
              <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} key={shard.shard + shard.state} className="dc-shard-card">
                <div className="dc-shard-accent" style={{ background: shard.color }} />
                <div className="dc-shard-state">{shard.state}</div>
                <div className="dc-shard-id">{shard.shard} · {shard.region}</div>
                <div className="dc-shard-bar-wrap">
                  <motion.div className="dc-shard-bar" initial={{ width: 0 }} animate={{ width: `${(shard.user_count / maxUsers) * 100}%` }} transition={{ duration: 1 }} style={{ background: shard.color }} />
                </div>
                <div className="dc-shard-stats">
                  <span>👤 {shard.user_count} Users</span>
                  <span>📄 {shard.doc_count} Docs</span>
                  <span>📦 {Math.round(shard.doc_count * 1.5)} Apps</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  };

  const renderConsensus = () => {
    if (!consensus) return <div className="dc-skeleton" style={{ height: 300 }} />;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="dc-metrics-grid">
          {[
            { label: "Leader", value: consensus.leader, color: "var(--dc-cyan)" },
            { label: "Followers", value: consensus.total_nodes - 1, color: "var(--dc-text)" },
            { label: "Quorum Size", value: consensus.quorum_size, color: "var(--dc-green)" },
            { label: "Current Term", value: consensus.term, color: "var(--dc-orange)" },
          ].map((item, i) => (
            <div className="dc-metric-card" key={i}>
              <div className="dc-metric-label">{item.label}</div>
              <div className="dc-metric-value" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {consensus.pending_items.map((item) => (
          <div className="dc-consensus-item" key={item.doc_id}>
            <div className="dc-consensus-header">
              <div>
                <div className="dc-consensus-doc">Verification Vote: Document #{item.doc_id}</div>
                <div className="dc-consensus-meta">Term: {item.term} · Leader: {item.leader_node}</div>
              </div>
              <button className="dc-btn-vote" onClick={() => handleExecuteVote(item.doc_id)}>
                🗳️ Run Consensus Vote
              </button>
            </div>
            
            <div className="dc-vote-row">
              {item.votes.map((vote, vi) => (
                <motion.div key={vi} className={`dc-vote-chip ${vote.vote}`} animate={voteAnim ? { x: [0, -10, 0], scale: [1, 1.1, 1] } : {}}>
                  🖧 {vote.node} · {vote.vote.toUpperCase()}
                </motion.div>
              ))}
            </div>

            <div className="dc-quorum-bar">
              <motion.div className="dc-quorum-fill" initial={{ width: 0 }} animate={{ width: `${(item.approve_count / item.quorum_required) * 100}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
        ))}
      </motion.div>
    );
  };

  const renderCacheRepl = () => {
    if (!cacheStats || !replStats) return <div className="dc-skeleton" style={{ height: 300 }} />;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="dc-card">
          <div className="dc-section-title">CACHE MONITORING (REDIS)</div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
              <span style={{ color: "var(--dc-muted)" }}>Total Keys</span>
              <span style={{ fontFamily: "var(--dc-mono)", color: "var(--dc-text)" }}>{cacheStats.total_keys || 1423}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
              <span style={{ color: "var(--dc-muted)" }}>Cache Hits</span>
              <span style={{ fontFamily: "var(--dc-mono)", color: "var(--dc-green)" }}>{cacheStats.hits || 8540}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
              <span style={{ color: "var(--dc-muted)" }}>Cache Misses</span>
              <span style={{ fontFamily: "var(--dc-mono)", color: "var(--dc-orange)" }}>{cacheStats.misses || 1230}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
              <span style={{ color: "var(--dc-muted)" }}>Evictions (LRU)</span>
              <span style={{ fontFamily: "var(--dc-mono)", color: "var(--dc-red)" }}>{cacheStats.evictions || 42}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "var(--dc-muted)" }}>Hit Rate</span>
              <span style={{ fontFamily: "var(--dc-mono)", color: "var(--dc-cyan)" }}>{cacheStats.hit_rate_pct || 87.4}%</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="dc-card">
          <div className="dc-section-title">REPLICATION MONITORING (SQL)</div>
          <div style={{ marginTop: 16 }}>
            {replStats.nodes?.map((n, i) => (
              <div key={i} style={{ marginBottom: 16, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{n.node_id}</span>
                  <span style={{ fontFamily: "var(--dc-mono)", fontSize: 10, padding: "2px 8px", background: n.role === "primary" ? "rgba(0,212,255,0.1)" : "rgba(192,132,252,0.1)", color: n.role === "primary" ? "var(--dc-cyan)" : "var(--dc-purple)", borderRadius: 12 }}>{n.role.toUpperCase()}</span>
                </div>
                {n.role === "replica" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--dc-muted)", marginBottom: 4 }}>
                      <span>Replication Lag</span>
                      <span style={{ color: n.replication_lag_ms < 50 ? "var(--dc-green)" : "var(--dc-orange)" }}>{n.replication_lag_ms}ms</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--dc-muted)" }}>
                      <span>Last Sync</span>
                      <span>{fmtTime(n.last_sync_time)}</span>
                    </div>
                  </>
                )}
                {n.role === "primary" && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--dc-muted)", marginBottom: 4 }}>
                    <span>WAL Entries</span>
                    <span>1,420,533</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderCap = () => {
    return (
      <div className="dc-card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
          <div>
            <div className="dc-section-title">CAP THEOREM</div>
            <div style={{ fontSize: 24, fontWeight: 700, margin: "12px 0", color: "var(--dc-cyan)" }}>ArthMitra runs in AP Mode</div>
            <p style={{ color: "var(--dc-muted)", lineHeight: 1.6, marginBottom: 24 }}>
              In a distributed system, you can only guarantee two out of three properties simultaneously. 
              We prioritize <strong>Availability</strong> and <strong>Partition Tolerance</strong>, trading strict consistency for eventual consistency to ensure the dashboard remains highly responsive during regional network outages.
            </p>
            
            <div className="dc-cap-prop active">
              <div className="dc-cap-dot" style={{ background: "var(--dc-green)" }} />
              <div>
                <div className="dc-cap-label" style={{ color: "var(--dc-green)" }}>Availability (A)</div>
                <div className="dc-cap-desc">Every request gets a response, even if some nodes fail.</div>
              </div>
            </div>
            <div className="dc-cap-prop active">
              <div className="dc-cap-dot" style={{ background: "var(--dc-purple)" }} />
              <div>
                <div className="dc-cap-label" style={{ color: "var(--dc-purple)" }}>Partition Tolerance (P)</div>
                <div className="dc-cap-desc">System continues to operate despite network drops.</div>
              </div>
            </div>
            <div className="dc-cap-prop" style={{ opacity: 0.6 }}>
              <div className="dc-cap-dot" style={{ background: "var(--dc-muted)" }} />
              <div>
                <div className="dc-cap-label">Consistency (C)</div>
                <div className="dc-cap-desc">Sacrificed for speed (Eventual Consistency achieved via Raft).</div>
              </div>
            </div>
          </div>
          
          <div className="dc-cap-triangle-wrap">
            <svg viewBox="0 0 300 260" style={{ width: "100%", dropShadow: "0 0 20px rgba(0,212,255,0.1)" }}>
              <polygon points="150,30 280,230 20,230" fill="rgba(0,212,255,0.02)" stroke="var(--dc-border)" strokeWidth="1.5" strokeDasharray="4 4" />
              
              <circle cx="150" cy="30" r="22" fill="rgba(255,255,255,0.05)" stroke="var(--dc-muted)" strokeWidth="1.5" />
              <text x="150" y="35" textAnchor="middle" fontSize="14" fill="var(--dc-muted)" fontWeight="700" fontFamily="var(--dc-mono)">C</text>
              
              <circle cx="280" cy="230" r="24" fill="rgba(0,255,136,0.1)" stroke="var(--dc-green)" strokeWidth="2" filter="url(#glow-g)" />
              <text x="280" y="235" textAnchor="middle" fontSize="14" fill="var(--dc-green)" fontWeight="700" fontFamily="var(--dc-mono)">A</text>
              
              <circle cx="20" cy="230" r="24" fill="rgba(192,132,252,0.1)" stroke="var(--dc-purple)" strokeWidth="2" filter="url(#glow-g)" />
              <text x="20" y="235" textAnchor="middle" fontSize="14" fill="var(--dc-purple)" fontWeight="700" fontFamily="var(--dc-mono)">P</text>
              
              <polygon points="280,230 20,230 150,130" fill="rgba(0,212,255,0.1)" stroke="var(--dc-cyan)" strokeWidth="1" />
              <text x="150" y="200" textAnchor="middle" fontSize="12" fill="var(--dc-cyan)" fontWeight="600">AP Mode</text>
            </svg>
          </div>
        </div>
      </div>
    );
  };

  const renderTrace = () => {
    return (
      <div className="dc-card">
        <div style={{ marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16 }}>
          <div className="dc-section-title">DISTRIBUTED REQUEST TRACE</div>
          <div style={{ color: "var(--dc-muted)", fontSize: 13, marginTop: 8 }}>Trace ID: <span style={{ fontFamily: "var(--dc-mono)", color: "var(--dc-cyan)" }}>req-a7f92b-881c</span></div>
        </div>
        
        <div className="dc-trace-timeline">
          {TRACE_STEPS.map((step, i) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} className="dc-trace-step" key={i}>
              <div className="dc-trace-step-card">
                <span className="dc-trace-span">{step.span}</span>
                <span className="dc-trace-op">{step.op}</span>
                <span className="dc-trace-service">{step.service}</span>
                <span className="dc-trace-dur">{step.dur}ms</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const TABS = {
    overview: renderOverview, nodes: renderNodes, topology: renderTopology,
    events: renderEvents, shards: renderShards, consensus: renderConsensus,
    cacherepl: renderCacheRepl, trace: renderTrace, cap: renderCap,
  };

    const navTabsList = [
      { key: "overview",   icon: "⬡",   label: t("dc_overview") },
      { key: "nodes",      icon: "○",   label: t("dc_nodes") },
      { key: "topology",   icon: "◈",   label: t("dc_topology") },
      { key: "events",     icon: "≡",   label: t("dc_events") },
      { key: "shards",     icon: "◫",   label: t("dc_shards") },
      { key: "consensus",  icon: "⊞",   label: t("dc_consensus") },
      { key: "cacherepl",  icon: "⚡",   label: t("dc_cache_repl") },
      { key: "trace",      icon: "↻",   label: t("dc_trace") },
      { key: "cap",        icon: "△",   label: t("dc_cap") },
    ];

    return (
      <div className="dc-root">
        <header className="dc-header">
          <div className="dc-logo">
            <div className="dc-logo-icon">🖧</div>
            <div>
              <div className="dc-logo-text">{t("dc_title")}</div>
              <div className="dc-logo-sub">{t("dc_subtitle")}</div>
            </div>
          </div>
          <div className="dc-header-right">
            <div className="dc-live-badge"><div className="dc-live-dot" /> {t("dc_live")} · {nodes.filter(n=>n.status==='online').length}/{nodes.length} NODES</div>
            <div className="dc-time">{time.toLocaleTimeString("en-IN", { hour12: false })}</div>
            <button className="dc-refresh-btn" onClick={() => fetchAll(true)} disabled={refreshing}>
              <span className={refreshing ? "dc-spinning" : ""}>⟳</span> {t("dc_refresh")}
            </button>
            <Link to="/" className="dc-back-btn">{t("dc_back")}</Link>
          </div>
        </header>

        <nav className="dc-nav">
          {navTabsList.map(tab => (
            <button key={tab.key} className={`dc-nav-tab ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>

        <div className="dc-page">
          <div className="dc-section-header">
            <div>
              <div className="dc-section-title">ARTHMITRA AI / DISTRIBUTED SYSTEMS</div>
              <div className="dc-section-subtitle">{navTabsList.find(t => t.key === activeTab)?.label}</div>
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {TABS[activeTab]?.()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
}
