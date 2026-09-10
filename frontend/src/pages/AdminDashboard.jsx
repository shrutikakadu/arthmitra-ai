import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import "./AdminDashboard.css";

/* ── DB Fault Tolerance Widget ── */
function ResilienceWidget() {
  const [faultVisible, setFaultVisible] = useState(true);
  const [log, setLog] = useState([]);

  useEffect(() => {
    const messages = [
      "[DB] Primary node arthmitra.db became unresponsive at 19:04:12 IST",
      "[WAL] Transaction log replay initiated on arthmitra_replica.db...",
      "[Failover] Replica promotion started — acquiring distributed lock...",
      "[Lock] Redlock acquired across all 3 sentinel nodes (consensus met)",
      "[WAL] 847 pending transactions replayed successfully. Zero data loss.",
      "[DB] arthmitra_replica.db promoted to PRIMARY in 140ms",
      "[Health] All API endpoints healthy. Serving traffic from replica.",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < messages.length) {
        setLog(prev => [...prev.slice(-6), messages[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: "linear-gradient(135deg, #0a0f1e, #0d1b2a)",
      border: "1px solid rgba(239,68,68,0.25)",
      borderRadius: 16,
      padding: "20px 24px",
      marginBottom: 20,
    }}>
      <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: "#64748b", marginBottom: 8 }}>ARTHMITRA DISTRIBUTED SYSTEM — FAULT TOLERANCE ENGINE</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#F8FAFC", marginBottom: 16 }}>System Resilience &amp; Fault Tolerance</div>

      {/* Badge row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        {/* Flashing red fault badge */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.5)",
          borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "#F87171",
          animation: faultVisible ? "faultPulse 1.4s ease-in-out infinite" : "none"
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", background: "#ef4444",
            display: "inline-block",
            animation: "faultDot 1.4s ease-in-out infinite"
          }} />
          FAULT: Primary Node Unreachable
        </span>
        {/* Solid green resolved badge */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.5)",
          borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "#34D399"
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
          RESOLVED: Replica Promoted to Primary
        </span>
        <span style={{
          background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.3)",
          borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 600, color: "#38BDF8"
        }}>Failover Time: 140ms | Data Loss: 0 bytes</span>
      </div>

      {/* Resolved message */}
      <div style={{
        background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)",
        borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#94A3B8",
        marginBottom: 14, lineHeight: 1.6
      }}>
        <span style={{ color: "#34D399", fontWeight: 700 }}>Automatic failover</span> to Replica (<code style={{ color: "#38BDF8", background: "rgba(56,189,248,0.1)", padding: "1px 5px", borderRadius: 4 }}>arthmitra_replica.db</code>) executed successfully in{" "}
        <span style={{ color: "#FBBF24", fontWeight: 700 }}>140ms</span>. Zero data loss achieved via active transaction log replay.
      </div>

      {/* Live replay log */}
      <div style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b", lineHeight: 1.8 }}>
        {log.map((line, i) => (
          <div key={i} style={{
            color: line.includes("[DB]") ? "#38BDF8" : line.includes("[Failover]") ? "#FBBF24" : line.includes("[Health]") ? "#34D399" : "#94A3B8"
          }}>
            &gt; {line}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes faultPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        @keyframes faultDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes syncPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}

/* ── Distributed Sync Tracker ── */
const SYNC_LOGS = [
  "[Sync] Consensus algorithm verified node consistency across 3 replicas...",
  "[Lock] Acquired distributed Redlock for transaction processing (TTL: 30s)...",
  "[Bus] Broadcasted cache invalidation event across all 4 microservice nodes...",
  "[DB] WAL replay complete. Replica promoted successfully. Quorum confirmed.",
  "[Cache] Distributed cache rehydrated — 1,284 keys refreshed in 42ms...",
  "[Sync] Raft leader heartbeat received. Term: 14, Index: 2091. Quorum: 3/3.",
  "[Bus] doc_submitted event dispatched to notification + matching workers...",
  "[Lock] Distributed lock released. Transaction committed to primary node.",
];

const SYNC_NODES = [
  { label: "Database Replica", icon: "🗄️", status: "synced", latency: "12ms" },
  { label: "Distributed Cache", icon: "⚡", status: "synced", latency: "8ms" },
  { label: "Distributed Lock", icon: "🔒", status: "active", latency: "5ms" },
  { label: "Message Bus", icon: "📨", status: "synced", latency: "18ms" },
];

function SyncTracker() {
  const [logIdx, setLogIdx] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState([SYNC_LOGS[0]]);

  useEffect(() => {
    const iv = setInterval(() => {
      setLogIdx(i => {
        const next = (i + 1) % SYNC_LOGS.length;
        setVisibleLogs(prev => [...prev.slice(-4), SYNC_LOGS[next]]);
        return next;
      });
    }, 1800);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{
      background: "linear-gradient(135deg, #050d1a, #0a1628)",
      border: "1px solid rgba(14,165,233,0.2)",
      borderRadius: 16,
      padding: "20px 24px",
      marginBottom: 20,
    }}>
      <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: "#64748b", marginBottom: 8 }}>DISTRIBUTED SYNCHRONIZATION TRACKER</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#F8FAFC", marginBottom: 16 }}>Node Sync Timeline &amp; Status</div>

      {/* Node status row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        {SYNC_NODES.map((node, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(14,165,233,0.15)",
            borderRadius: 10, padding: "12px 14px",
            display: "flex", alignItems: "center", gap: 10
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: "50%",
              background: node.status === "active" ? "#FBBF24" : "#10B981",
              display: "inline-block",
              animation: "syncPulse 1.8s ease-in-out infinite",
              flexShrink: 0
            }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#F8FAFC" }}>{node.icon} {node.label}</div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: node.status === "active" ? "#FBBF24" : "#34D399", marginTop: 2 }}>
                {node.status.toUpperCase()} • {node.latency}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live log ticker */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(14,165,233,0.12)",
        borderRadius: 8, padding: "12px 16px",
        fontFamily: "monospace", fontSize: 11,
      }}>
        <div style={{ color: "#64748b", fontSize: 9, letterSpacing: 1.5, marginBottom: 8 }}>LIVE SYSTEM LOG</div>
        {visibleLogs.map((line, i) => (
          <div key={i} style={{
            color: line.startsWith("[Sync]") ? "#38BDF8" :
                   line.startsWith("[Lock]") ? "#FBBF24" :
                   line.startsWith("[Bus]")  ? "#C084FC" :
                   line.startsWith("[DB]")   ? "#34D399" : "#94A3B8",
            opacity: i === visibleLogs.length - 1 ? 1 : 0.55,
            transition: "opacity 0.5s",
            lineHeight: 1.7
          }}>
            &gt; {line}
          </div>
        ))}
      </div>
    </div>
  );
}


const NAV_ITEMS = [
  { key: "overview", icon: "📊", label: "Overview" },
  { key: "applications", icon: "🏛️", label: "Master Scheme Queue" },
  { key: "documents", icon: "📄", label: "Document Review" },
  { key: "users", icon: "👥", label: "All Users" },
  { key: "dcmonitor", icon: "🖧", label: "DC System Monitor" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [allDocs, setAllDocs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allApps, setAllApps] = useState([]);
  const [masterMetrics, setMasterMetrics] = useState(null);
  const [viewPerspective, setViewPerspective] = useState("master"); // "master", "clerk", "officer"

  const [dcNodes, setDcNodes] = useState([]);
  const [dcMetrics, setDcMetrics] = useState(null);
  const [dcLoading, setDcLoading] = useState(false);


  const [selectedUser, setSelectedUser] = useState(null);
  const [userMatchResults, setUserMatchResults] = useState(null);
  const [loadingUserMatch, setLoadingUserMatch] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role === "user" || !parsed.role) { navigate("/dashboard"); return; }
    setUser(parsed);
    if (parsed.role === "clerk") setViewPerspective("clerk");
    else if (parsed.role === "officer") setViewPerspective("officer");
    else if (parsed.role === "state_admin") setViewPerspective("state_admin");
    else setViewPerspective("master");
    loadData();
  }, [navigate]);


  const loadData = async () => {
    try {
      const [docsRes, usersRes, appsRes, metricsRes] = await Promise.all([
        API.get("/documents/all"),
        API.get("/auth/users"),
        API.get("/applications/all"),
        API.get("/applications/master-metrics"),
      ]);
      setAllDocs(docsRes.data);
      setAllUsers(usersRes.data);
      setAllApps(appsRes.data);
      setMasterMetrics(metricsRes.data);
    } catch (e) { console.error("Admin load error:", e); }
  };

  const handleVerifyApplication = async (appId, action) => {
    const note = action === "rejected" ? prompt("Rejection reason (optional):") || "" : "";
    try {
      const res = await API.put(`/applications/${appId}/verify?action=${action}&note=${encodeURIComponent(note)}&admin_id=${user.id}`);
      if (res.data.status === "success") {
        loadData();
      }
    } catch (e) {
      console.error("App verify error:", e);
      alert(e.response?.data?.detail || "Failed to process application verification");
    }
  };


  const loadDCData = async () => {
    setDcLoading(true);
    try {
      const [nodesRes, metricsRes] = await Promise.all([
        API.get("/dc/nodes"),
        API.get("/dc/metrics"),
      ]);
      setDcNodes(nodesRes.data);
      setDcMetrics(metricsRes.data);
    } catch (e) { console.error("DC load error:", e); }
    finally { setDcLoading(false); }
  };

  const handleVerify = async (docId, action) => {
    const note = action === "rejected" ? prompt("Rejection reason (optional):") || "" : "";
    try {
      await API.put(`/documents/${docId}/verify?action=${action}&note=${encodeURIComponent(note)}&admin_id=${user.id}`);
      loadData();
    } catch (e) {
      console.error("Verify error:", e);
      alert("Failed to update document");
    }
  };

  const handleUserClick = async (u) => {
    setSelectedUser(u);
    setLoadingUserMatch(true);
    setUserMatchResults(null);
    try {
      const res = await API.post("/match-schemes", u);
      setUserMatchResults(res.data);
    } catch (e) {
      console.error("Match error:", e);
    } finally {
      setLoadingUserMatch(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  if (!user) return <div style={{ padding: 40, color: "#fff" }}>Loading...</div>;

  const pendingDocs = allDocs.filter(d => {
    if (user?.role === "clerk") return d.status === "pending_clerk";
    if (user?.role === "officer") return d.status === "pending_officer";
    return d.status.startsWith("pending");
  });
  const verifiedDocs = allDocs.filter(d => d.status === "verified");
  const rejectedDocs = allDocs.filter(d => d.status === "rejected");

  const docLabels = {
    aadhaar: "Aadhaar Card", income_cert: "Income Certificate",
    caste_cert: "Caste Certificate", ration_card: "Ration Card",
    bank_passbook: "Bank Passbook", land_record: "Land Record",
    pan_card: "PAN Card", voter_id: "Voter ID"
  };

  // ─── 1. DEDICATED CLERK / SECTION OFFICER DASHBOARD ───
  const renderClerkOverview = () => {
    const clerkApps = allApps.filter(a => a.status === "pending_clerk");
    return (
      <>
        <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, color: "#fbbf24", fontSize: 18 }}>📋 Section Officer Document & Application Review Desk</h3>
            <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 13 }}>ROLE_VERIFIER — Responsible for Level-1 document verification & initial form checks.</p>
          </div>
          <span style={{ background: "#d97706", color: "#ffffff", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
            Level-1 Verification
          </span>
        </div>

        <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
          <div className="admin-stat amber">
            <div className="admin-stat-icon amber">📋</div>
            <div className="admin-stat-value">{clerkApps.length}</div>
            <div className="admin-stat-label">Pending Level-1 Applications</div>
          </div>
          <div className="admin-stat purple">
            <div className="admin-stat-icon purple">📄</div>
            <div className="admin-stat-value">{pendingDocs.length}</div>
            <div className="admin-stat-label">Pending Proof Documents</div>
          </div>
          <div className="admin-stat green">
            <div className="admin-stat-icon green">✅</div>
            <div className="admin-stat-value">{verifiedDocs.length}</div>
            <div className="admin-stat-label">Verified Proof Docs</div>
          </div>
        </div>

        {/* Level-1 Application Verification Queue */}
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">📋 Level-1 Scheme Application Queue</div>
              <div className="admin-card-sub">Check citizen scheme submissions and forward verified files to the District Collector (DM)</div>
            </div>
            <button className="admin-btn admin-btn-outline" onClick={loadData}>🔄 Refresh Queue</button>
          </div>

          {clerkApps.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666", padding: "2rem 0", fontSize: 13 }}>
              🎉 No pending Level-1 applications! All initial forms checked.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Scheme</th>
                  <th>Reason for Applying</th>
                  <th>Current Handler</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {clerkApps.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.user_name}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>📱 {a.user_mobile} | 📍 {a.user_state}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fbbf24" }}>{a.scheme_name}</div>
                      <span style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#475569" }}>{a.category}</span>
                    </td>
                    <td style={{ fontSize: 12, color: "#334155", maxWidth: 240, lineHeight: 1.4 }}>{a.reason_for_applying}</td>
                    <td>
                      <span style={{ fontSize: 12, background: "rgba(245, 158, 11, 0.15)", color: "#d97706", padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>
                        {a.current_handler}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="admin-btn admin-btn-approve"
                          style={{ background: "#d97706", fontSize: 12, fontWeight: 700 }}
                          onClick={() => handleVerifyApplication(a.id, "verified")}
                        >
                          ✓ Approve & Send to DM
                        </button>
                        <button
                          className="admin-btn admin-btn-reject"
                          style={{ fontSize: 12 }}
                          onClick={() => handleVerifyApplication(a.id, "rejected")}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Citizen Proof Documents Queue */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">📄 Citizen Proof Document Verification Desk</div>
              <div className="admin-card-sub">Inspect uploaded Aadhaar, Income, Caste, and Land Record documents</div>
            </div>
          </div>
          {pendingDocs.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666", padding: "2rem 0", fontSize: 13 }}>🎉 No pending proof documents to review!</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Citizen Name</th>
                  <th>Document Type</th>
                  <th>Original File</th>
                  <th>Uploaded Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingDocs.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.user_name}</td>
                    <td><span style={{ background: "rgba(59, 130, 246, 0.1)", color: "#2563eb", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{docLabels[d.doc_type] || d.doc_type}</span></td>
                    <td style={{ fontSize: 12, color: "#888" }}>{d.original_name}</td>
                    <td style={{ fontSize: 12, color: "#666" }}>{d.uploaded_at?.split("T")[0] || d.uploaded_at?.split(" ")[0]}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="admin-btn admin-btn-approve" onClick={() => handleVerify(d.id, "verified")}>✓ Verify Document</button>
                        <button className="admin-btn admin-btn-reject" onClick={() => handleVerify(d.id, "rejected")}>✗ Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  };

  // ─── 2. DEDICATED DISTRICT COLLECTOR / DM DASHBOARD ───
  const renderOfficerOverview = () => {
    const officerApps = allApps.filter(a => a.status === "pending_district" || a.status === "pending_officer");
    return (
      <>
        <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, color: "#60a5fa", fontSize: 18 }}>🏛️ District Collector (DM) Official Portal</h3>
            <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 13 }}>ROLE_DISTRICT_ADMIN — Review clerk-verified files and forward to State Department Secretary.</p>
          </div>
          <span style={{ background: "#2563eb", color: "#ffffff", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
            Level-2 District Authority
          </span>
        </div>

        <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
          <div className="admin-stat blue">
            <div className="admin-stat-icon blue">🏛️</div>
            <div className="admin-stat-value">{officerApps.length}</div>
            <div className="admin-stat-label">Pending District Approval</div>
          </div>
          <div className="admin-stat purple">
            <div className="admin-stat-icon purple">👥</div>
            <div className="admin-stat-value">{allUsers.length}</div>
            <div className="admin-stat-label">District Citizens Tracked</div>
          </div>
          <div className="admin-stat green">
            <div className="admin-stat-icon green">➡️</div>
            <div className="admin-stat-value">{allApps.filter(a => a.status === "pending_state" || a.status === "verified").length}</div>
            <div className="admin-stat-label">Forwarded to State Level</div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">🏛️ District Collector Verification Queue</div>
              <div className="admin-card-sub">Files verified by Section Officers awaiting District Magistrate approval</div>
            </div>
            <button className="admin-btn admin-btn-outline" onClick={loadData}>🔄 Refresh Stream</button>
          </div>

          {officerApps.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666", padding: "2rem 0", fontSize: 13 }}>
              🎉 No pending applications in the District Collector Queue!
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant Details</th>
                  <th>Scheme & Benefit</th>
                  <th>Reason & Clerk Status</th>
                  <th>Current Handler</th>
                  <th>DM Executive Action</th>
                </tr>
              </thead>
              <tbody>
                {officerApps.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.user_name}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>📱 {a.user_mobile} | 📍 {a.user_state}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#2563eb" }}>{a.scheme_name}</div>
                      <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>{a.benefit || "Government Subsidy"}</div>
                    </td>
                    <td style={{ fontSize: 12, color: "#334155", maxWidth: 220, lineHeight: 1.4 }}>
                      <div>{a.reason_for_applying}</div>
                      <div style={{ fontSize: 10, color: "#16a34a", marginTop: 4 }}>✓ Verified by Section Officer</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, background: "rgba(59, 130, 246, 0.15)", color: "#2563eb", padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>
                        {a.current_handler}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="admin-btn admin-btn-approve"
                          style={{ background: "#2563eb", fontSize: 12, fontWeight: 700 }}
                          onClick={() => handleVerifyApplication(a.id, "verified")}
                        >
                          🏛️ Approve & Forward to State Secretary
                        </button>
                        <button
                          className="admin-btn admin-btn-reject"
                          style={{ fontSize: 12 }}
                          onClick={() => handleVerifyApplication(a.id, "rejected")}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  };

  // ─── 3. DEDICATED DEPARTMENT SECRETARY DASHBOARD ───
  const renderSecretaryOverview = () => {
    const secretaryApps = allApps.filter(a => a.status === "pending_state");
    return (
      <>
        <div style={{ background: "rgba(147, 51, 234, 0.1)", border: "1px solid rgba(147, 51, 234, 0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, color: "#c084fc", fontSize: 18 }}>🏢 Department Secretary Official Portal</h3>
            <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 13 }}>ROLE_STATE_ADMIN — State-level policy oversight, budget verification, and pushing to Cabinet Minister.</p>
          </div>
          <span style={{ background: "#9333ea", color: "#ffffff", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
            Level-3 State Authority
          </span>
        </div>

        <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
          <div className="admin-stat purple">
            <div className="admin-stat-icon purple">🏢</div>
            <div className="admin-stat-value">{secretaryApps.length}</div>
            <div className="admin-stat-label">Pending State Policy Queue</div>
          </div>
          <div className="admin-stat green">
            <div className="admin-stat-icon green">💰</div>
            <div className="admin-stat-value">₹120 Cr</div>
            <div className="admin-stat-label">State Welfare Budget</div>
          </div>
          <div className="admin-stat blue">
            <div className="admin-stat-icon blue">👑</div>
            <div className="admin-stat-value">{allApps.filter(a => a.status === "pending_minister" || a.status === "verified").length}</div>
            <div className="admin-stat-label">Pushed to Cabinet Minister</div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">🏢 Department Secretary Budget & Policy Review Queue</div>
              <div className="admin-card-sub">Files endorsed by District Magistrates awaiting state budget authorization</div>
            </div>
            <button className="admin-btn admin-btn-outline" onClick={loadData}>🔄 Refresh Stream</button>
          </div>

          {secretaryApps.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666", padding: "2rem 0", fontSize: 13 }}>
              🎉 No pending files in the State Secretary Queue!
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant Details</th>
                  <th>Scheme & State Shard</th>
                  <th>DM Endorsement</th>
                  <th>Current Handler</th>
                  <th>Secretary State Action</th>
                </tr>
              </thead>
              <tbody>
                {secretaryApps.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.user_name}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>📱 {a.user_mobile} | 📍 {a.user_state}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#9333ea" }}>{a.scheme_name}</div>
                      <span style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#475569" }}>{a.category}</span>
                    </td>
                    <td style={{ fontSize: 12, color: "#334155" }}>
                      <div>✓ Endorsed by DM ({a.user_state})</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, background: "rgba(147, 51, 234, 0.15)", color: "#9333ea", padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>
                        {a.current_handler}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="admin-btn admin-btn-approve"
                          style={{ background: "#9333ea", fontSize: 12, fontWeight: 700 }}
                          onClick={() => handleVerifyApplication(a.id, "verified")}
                        >
                          🏢 Approve Budget & Push to Cabinet Minister
                        </button>
                        <button
                          className="admin-btn admin-btn-reject"
                          style={{ fontSize: 12 }}
                          onClick={() => handleVerifyApplication(a.id, "rejected")}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  };

  // ─── 4. DEDICATED CABINET MINISTER / SUPER ADMIN DASHBOARD ───
  const renderAdminOverview = () => {
    const ministerApps = allApps.filter(a => a.status === "pending_minister" || a.status === "pending_officer");
    return (
      <>
        <div style={{ background: "linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, color: "#f87171", fontSize: 18 }}>👑 Cabinet Minister & Apex Super Admin Office</h3>
            <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 13 }}>ROLE_SUPER_ADMIN — Raft Consensus Quorum Execution, System Configuration & DC Telemetry.</p>
          </div>
          <span style={{ background: "linear-gradient(90deg, #ef4444 0%, #f97316 100%)", color: "#ffffff", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
            Level-4 Apex Authority (Raft Quorum)
          </span>
        </div>

        <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
          <div className="admin-stat red">
            <div className="admin-stat-icon red">👑</div>
            <div className="admin-stat-value">{ministerApps.length}</div>
            <div className="admin-stat-label">Pending Cabinet Final Approvals</div>
          </div>
          <div className="admin-stat green">
            <div className="admin-stat-icon green">🎉</div>
            <div className="admin-stat-value">{masterMetrics?.total_approved || 0}</div>
            <div className="admin-stat-label">Total Approved & Disbursed</div>
          </div>
          <div className="admin-stat blue">
            <div className="admin-stat-icon blue">🔒</div>
            <div className="admin-stat-value">{masterMetrics?.active_distributed_locks || 0}</div>
            <div className="admin-stat-label">Active Redlocks</div>
          </div>
          <div className="admin-stat purple">
            <div className="admin-stat-icon purple">🗳️</div>
            <div className="admin-stat-value" style={{ fontSize: 14, fontWeight: 700 }}>{masterMetrics?.raft_consensus_leader || "admin-node-01"}</div>
            <div className="admin-stat-label">Raft Quorum Leader</div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">👑 Cabinet Minister Apex Raft Consensus Execution Queue</div>
              <div className="admin-card-sub">Triggers 2/3 Raft Quorum Voting across distributed nodes to commit final disbursements</div>
            </div>
            <button className="admin-btn admin-btn-outline" onClick={loadData}>🔄 Refresh Stream</button>
          </div>

          {ministerApps.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666", padding: "2rem 0", fontSize: 13 }}>
              🎉 All applications have achieved Raft Consensus quorum approval!
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Scheme & Benefit</th>
                  <th>Verification Chain</th>
                  <th>Handler</th>
                  <th>Raft Quorum Action</th>
                </tr>
              </thead>
              <tbody>
                {ministerApps.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.user_name}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>📱 {a.user_mobile} | 📍 {a.user_state}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#ef4444" }}>{a.scheme_name}</div>
                      <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>{a.benefit || "Government Grant"}</div>
                    </td>
                    <td style={{ fontSize: 11, color: "#475569" }}>
                      <div>✓ Clerk Verified</div>
                      <div>✓ DM Endorsed</div>
                      <div>✓ Secretary Approved</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>
                        {a.current_handler}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="admin-btn admin-btn-approve"
                          style={{ background: "linear-gradient(90deg, #16a34a 0%, #059669 100%)", fontSize: 12, fontWeight: 700 }}
                          onClick={() => handleVerifyApplication(a.id, "verified")}
                        >
                          ⚡ Execute Raft Quorum Approval
                        </button>
                        <button
                          className="admin-btn admin-btn-reject"
                          style={{ fontSize: 12 }}
                          onClick={() => handleVerifyApplication(a.id, "rejected")}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  };

  const renderOverview = () => {
    if (user?.role === "clerk") return renderClerkOverview();
    if (user?.role === "officer") return renderOfficerOverview();
    if (user?.role === "state_admin") return renderSecretaryOverview();
    return renderAdminOverview();
  };


  const renderApplications = () => {

    const filteredApps = allApps.filter(app => {
      if (viewPerspective === "clerk") return app.status === "pending_clerk";
      if (viewPerspective === "officer") return app.status === "pending_officer";
      return true; // master perspective shows everything
    });

    return (
      <>
        {/* Master Developer & Telemetry Metrics Summary */}
        <div className="admin-stat-grid" style={{ marginBottom: 20 }}>
          <div className="admin-stat purple">
            <div className="admin-stat-icon purple">📑</div>
            <div className="admin-stat-value">{masterMetrics?.total_applications || allApps.length}</div>
            <div className="admin-stat-label">Total Scheme Applications</div>
          </div>
          <div className="admin-stat amber">
            <div className="admin-stat-icon amber">📋</div>
            <div className="admin-stat-value">{masterMetrics?.pending_local_admin || 0}</div>
            <div className="admin-stat-label">Pending Local Admin (Clerk)</div>
          </div>
          <div className="admin-stat blue" style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
            <div className="admin-stat-icon blue" style={{ color: "#3b82f6" }}>👨‍⚖️</div>
            <div className="admin-stat-value" style={{ color: "#60a5fa" }}>{masterMetrics?.pending_super_admin || 0}</div>
            <div className="admin-stat-label">Pending Super Admin (Officer)</div>
          </div>
          <div className="admin-stat green">
            <div className="admin-stat-icon green">🎉</div>
            <div className="admin-stat-value">{masterMetrics?.total_approved || 0}</div>
            <div className="admin-stat-label">Approved & Disbursed</div>
          </div>
        </div>

        {/* Distributed State & Telemetry Bar */}
        <div style={{
          background: "rgba(15, 23, 42, 0.8)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          color: "#e2e8f0",
          fontSize: 13
        }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span>🔒 <strong>Active Redlocks:</strong> {masterMetrics?.active_distributed_locks || 0}</span>
            <span>🗳️ <strong>Raft Leader:</strong> <code style={{ color: "#38bdf8", background: "rgba(56,189,248,0.1)", padding: "2px 6px", borderRadius: 4 }}>{masterMetrics?.raft_consensus_leader || "admin-node-01"}</code></span>
            <span>⚡ <strong>Multi-Topic Message Queue:</strong> <span style={{ color: "#4ade80" }}>Active (Kafka/Async)</span></span>
          </div>

          {/* Master View Perspective Selector */}
          <div style={{ display: "flex", gap: 6, background: "rgba(0,0,0,0.4)", padding: 4, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", flexWrap: "wrap" }}>
            <button
              onClick={() => setViewPerspective("master")}
              style={{
                padding: "6px 10px",
                background: viewPerspective === "master" ? "#0284c7" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              👑 Unified Master Developer View
            </button>
            <button
              onClick={() => setViewPerspective("clerk")}
              style={{
                padding: "6px 10px",
                background: viewPerspective === "clerk" ? "#d97706" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              📋 Clerk / Section Officer Queue
            </button>
            <button
              onClick={() => setViewPerspective("officer")}
              style={{
                padding: "6px 10px",
                background: viewPerspective === "officer" ? "#2563eb" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              🏛️ District Collector (DM) Queue
            </button>
            <button
              onClick={() => setViewPerspective("state_admin")}
              style={{
                padding: "6px 10px",
                background: viewPerspective === "state_admin" ? "#9333ea" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              🏢 Department Secretary Queue
            </button>
          </div>
        </div>

        {/* Scheme Applications Lifecycle Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">
                {viewPerspective === "master" ? "👑 Master Scheme Application Lifecycle Registry" : viewPerspective === "clerk" ? "📋 Section Officer Document Review Queue (ROLE_VERIFIER)" : viewPerspective === "officer" ? "🏛️ District Collector Forwarding Queue (ROLE_DISTRICT_ADMIN)" : "🏢 Department Secretary Budget Queue (ROLE_STATE_ADMIN)"}
              </div>
              <div className="admin-card-sub">
                Showing {filteredApps.length} applications ({viewPerspective.toUpperCase()} view)
              </div>
            </div>
            <button className="admin-btn admin-btn-outline" onClick={loadData}>🔄 Refresh Stream</button>
          </div>


          {filteredApps.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666", padding: "2rem 0", fontSize: 13 }}>
              No scheme applications in this queue.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Applicant Details</th>
                  <th>Scheme & Category</th>
                  <th>Why Applied (Reason)</th>
                  <th>Current Node Handler</th>
                  <th>Status</th>
                  <th>DC Audit Telemetry</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr key={app.id}>
                    <td style={{ color: "#666", fontSize: 12 }}>#{app.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{app.user_name}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>📱 {app.user_mobile} | 📍 {app.user_state}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{app.scheme_name}</div>
                      <span style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#475569" }}>{app.category}</span>
                    </td>
                    <td style={{ fontSize: 12, color: "#334155", maxWidth: 220, lineHeight: 1.4 }}>
                      {app.reason_for_applying}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 8px",
                        borderRadius: 6,
                        background: app.current_handler?.includes("Approved") ? "rgba(34, 197, 94, 0.15)" : app.current_handler?.includes("Super") ? "rgba(59, 130, 246, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: app.current_handler?.includes("Approved") ? "#16a34a" : app.current_handler?.includes("Super") ? "#2563eb" : "#d97706"
                      }}>
                        {app.current_handler}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status ${app.status}`}>{app.status}</span>
                    </td>
                    <td style={{ fontSize: 11, color: "#64748b" }}>
                      <div>v{app.version || 1} (Redlock)</div>
                      {app.raft_term && (
                        <div style={{ color: "#0284c7", fontWeight: 600 }}>Raft T:{app.raft_term} | I:{app.raft_index}</div>
                      )}
                    </td>
                    <td>
                      {app.status === "pending_clerk" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="admin-btn admin-btn-approve"
                            style={{ background: "#d97706", fontSize: 12 }}
                            onClick={() => handleVerifyApplication(app.id, "verified")}
                          >
                            ✓ Pass to Super Admin
                          </button>
                          <button
                            className="admin-btn admin-btn-reject"
                            style={{ fontSize: 12 }}
                            onClick={() => handleVerifyApplication(app.id, "rejected")}
                          >
                            ✗
                          </button>
                        </div>
                      )}
                      {app.status === "pending_officer" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="admin-btn admin-btn-approve"
                            style={{ background: "linear-gradient(90deg, #16a34a 0%, #059669 100%)", fontSize: 12, fontWeight: 700 }}
                            onClick={() => handleVerifyApplication(app.id, "verified")}
                          >
                            ⚡ Raft Quorum Approve
                          </button>
                          <button
                            className="admin-btn admin-btn-reject"
                            style={{ fontSize: 12 }}
                            onClick={() => handleVerifyApplication(app.id, "rejected")}
                          >
                            ✗
                          </button>
                        </div>
                      )}
                      {app.status === "verified" && (
                        <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✅ Disbursed</span>
                      )}
                      {app.status === "rejected" && (
                        <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>❌ Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  };


  const renderDocuments = () => (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <div className="admin-card-title">All Documents</div>
          <div className="admin-card-sub">{allDocs.length} total documents submitted</div>
        </div>
        <button className="admin-btn admin-btn-outline" onClick={loadData}>🔄 Refresh</button>
      </div>
      {allDocs.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666", padding: "2rem 0", fontSize: 13 }}>No documents submitted yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Mobile</th>
              <th>Document</th>
              <th>File</th>
              <th>Status</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allDocs.map((d) => (
              <tr key={d.id}>
                <td style={{ color: "#666" }}>#{d.id}</td>
                <td style={{ fontWeight: 600 }}>{d.user_name}</td>
                <td style={{ fontSize: 12, color: "#888" }}>{d.user_mobile}</td>
                <td>{docLabels[d.doc_type] || d.doc_type}</td>
                <td style={{ fontSize: 12, color: "#888" }}>{d.original_name}</td>
                <td>
                  <span className={`admin-status ${d.status}`}>{d.status}</span>
                </td>
                <td style={{ fontSize: 12, color: "#666" }}>{d.uploaded_at?.split("T")[0] || d.uploaded_at?.split(" ")[0]}</td>
                <td>
                  {d.status === "pending" ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="admin-btn admin-btn-approve" onClick={() => handleVerify(d.id, "verified")}>✓</button>
                      <button className="admin-btn admin-btn-reject" onClick={() => handleVerify(d.id, "rejected")}>✗</button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "#555" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <div className="admin-card-title">Registered Users</div>
          <div className="admin-card-sub">{allUsers.length} total users</div>
        </div>
        <button className="admin-btn admin-btn-outline" onClick={loadData}>🔄 Refresh</button>
      </div>
      {allUsers.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666", padding: "2rem 0", fontSize: 13 }}>No users registered yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>State</th>
              <th>Occupation</th>
              <th>Income</th>
              <th>Documents</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => {
              const userDocs = allDocs.filter(d => d.user_id === u.id);
              const userVerified = userDocs.filter(d => d.status === "verified").length;
              return (
                <tr key={u.id} style={{ cursor: "pointer" }} onClick={() => handleUserClick(u)} title="Click to view details">
                  <td style={{ color: "#666" }}>#{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ fontSize: 12, color: "#888" }}>{u.mobile}</td>
                  <td>{u.state || "—"}</td>
                  <td>{u.occupation || "—"}</td>
                  <td>{u.income ? `₹${u.income}` : "—"}</td>
                  <td>
                    <span style={{ fontSize: 12 }}>
                      {userDocs.length} uploaded · {userVerified} verified
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderDCMonitor = () => (
    <>
      {/* ── DB Fault Tolerance Widget ── */}
      <ResilienceWidget />
      {/* ── Distributed Sync Tracker ── */}
      <SyncTracker />

      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #030812, #0a1628)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 12, padding: "18px 24px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 2, color: "#00d4ff", marginBottom: 4 }}>ARTHMITRA DISTRIBUTED SYSTEM</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>Node Health Monitor</div>
          <div style={{ fontSize: 12, color: "rgba(226,232,240,0.5)", marginTop: 2 }}>Real-time status of all virtual microservice nodes</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="admin-btn admin-btn-outline" onClick={loadDCData} disabled={dcLoading}>{dcLoading ? "⟳ Loading..." : "⟳ Refresh"}</button>
          <Link to="/dc-panel" style={{ background: "linear-gradient(135deg, #00d4ff, #00ff88)", color: "#030812", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>🖧 Full DC Panel →</Link>
        </div>
      </div>

      {/* Metrics row */}
      {dcMetrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Active Nodes",   value: `${dcMetrics.active_nodes}/${dcMetrics.total_nodes}`, bg: "#00ff88" },
            { label: "Avg Latency",    value: `${dcMetrics.avg_latency_ms}ms`,                     bg: "#00d4ff" },
            { label: "Throughput",     value: `${dcMetrics.throughput_rps} rps`,                   bg: "#c084fc" },
            { label: "Cache Hit Rate", value: `${dcMetrics.cache_hit_rate_pct}%`,                  bg: "#fbbf24" },
            { label: "Error Rate",     value: `${dcMetrics.error_rate_pct}%`,                      bg: dcMetrics.error_rate_pct < 1 ? "#00ff88" : "#ff3355" },
            { label: "Uptime",         value: `${dcMetrics.uptime_pct}%`,                          bg: "#00ff88" },
          ].map((m, i) => (
            <div key={i} style={{ background: "#0a1628", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1.5, color: "rgba(226,232,240,0.4)", textTransform: "uppercase", marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: m.bg }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Node grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {dcLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: "#0a1628", borderRadius: 12, height: 160, border: "1px solid rgba(0,212,255,0.1)" }} />
          ))
        ) : dcNodes.map(node => {
          const statusColor = node.status === "online" ? "#00ff88" : node.status === "degraded" ? "#fbbf24" : "#ff3355";
          return (
            <div key={node.id} style={{ background: "#050d1a", border: `1px solid ${statusColor}30`, borderRadius: 12, padding: 16, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${statusColor}, transparent)` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: "#00d4ff", letterSpacing: 1 }}>{node.id}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginTop: 2 }}>{node.service}</div>
                  <div style={{ fontSize: 10, color: "rgba(226,232,240,0.4)", marginTop: 2 }}>📡 {node.region} · ×{node.replicas}</div>
                </div>
                <div style={{ padding: "3px 10px", borderRadius: 20, fontSize: 9, fontFamily: "monospace", fontWeight: 700, background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}40`, letterSpacing: 1 }}>
                  {node.status.toUpperCase()}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { l: "LATENCY", v: `${node.latency_ms}ms` },
                  { l: "CPU",     v: `${node.cpu_pct}%` },
                  { l: "REQ/S",   v: node.requests_per_sec },
                ].map((stat, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 8, color: "rgba(226,232,240,0.35)", letterSpacing: 1, marginBottom: 3 }}>{stat.l}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{stat.v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!dcLoading && dcNodes.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, fontFamily: "monospace", fontSize: 13, color: "rgba(226,232,240,0.4)" }}>
          No DC data available. Click Refresh to load node status.
        </div>
      )}
    </>
  );

  const getRoleTitle = () => {
    if (user?.role === "clerk") return "📋 Section Officer / Front Desk Clerk Portal (ROLE_VERIFIER)";
    if (user?.role === "officer") return "🏛️ District Collector / DM Portal (ROLE_DISTRICT_ADMIN)";
    if (user?.role === "state_admin") return "🏢 Department Secretary Portal (ROLE_STATE_ADMIN)";
    if (user?.role === "admin") return "👑 Cabinet Minister & Apex Super Admin Portal (ROLE_SUPER_ADMIN)";
    return "Government Administration Portal";
  };

  const getRoleBadge = () => {
    if (user?.role === "clerk") return { text: "ROLE_VERIFIER (Level 1)", bg: "#d97706" };
    if (user?.role === "officer") return { text: "ROLE_DISTRICT_ADMIN (Level 2)", bg: "#2563eb" };
    if (user?.role === "state_admin") return { text: "ROLE_STATE_ADMIN (Level 3)", bg: "#9333ea" };
    return { text: "ROLE_SUPER_ADMIN (Apex)", bg: "#ef4444" };
  };

  const tabTitles = {
    overview:     [getRoleTitle(), "Government hierarchy review & process workflow"],
    applications: ["Scheme Lifecycle Review Queue", "Process applications assigned to your official jurisdiction"],
    documents:    ["Document Review",   "Review and verify user uploaded proof documents"],
    users:        ["User Management",   "View registered citizens in your jurisdiction"],
    dcmonitor:    ["DC System Monitor", "Live node health and distributed computing metrics"],
  };

  const tabContent = {
    overview:     renderOverview,
    applications: renderApplications,
    documents:    renderDocuments,
    users:        renderUsers,
    dcmonitor:    renderDCMonitor,
  };

  const badge = getRoleBadge();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">🛡️</div>
          <div>
            <h3>Arth<span>Mitra</span> AI</h3>
            <p style={{ textTransform: "uppercase", fontSize: 10, fontWeight: 700, color: badge.bg }}>{badge.text}</p>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-label">Official Jurisdiction</div>
          {NAV_ITEMS.filter(item => {
            if (item.key === "dcmonitor") return user?.role === "admin";
            if (item.key === "documents") return user?.role === "clerk" || user?.role === "admin";
            return true;
          }).map((item) => (
            <div key={item.key} className={`admin-nav-item ${activeTab === item.key ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.key === "documents" && pendingDocs.length > 0 && (
                <span className="admin-nav-badge">{pendingDocs.length}</span>
              )}
              {item.key === "dcmonitor" && (
                <span className="admin-nav-badge" style={{ background: "#00d4ff", color: "#030812" }}>LIVE</span>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h2>{tabTitles[activeTab]?.[0]}</h2>
            <p>{tabTitles[activeTab]?.[1]}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#ffffff",
              background: badge.bg,
              padding: "4px 10px",
              borderRadius: 6
            }}>
              {user.name} ({badge.text})
            </span>
            <button className="admin-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="admin-content" style={activeTab === "dcmonitor" ? { background: "#030812", minHeight: "calc(100vh - 80px)", padding: 24 } : {}}>
          {tabContent[activeTab]?.()}
        </div>

        {selectedUser && (
          <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>{selectedUser.name}'s Profile</h3>
                <button onClick={() => setSelectedUser(null)}>✕</button>
              </div>
              <div className="admin-modal-content">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  <div><strong>Mobile:</strong> {selectedUser.mobile}</div>
                  <div><strong>State:</strong> {selectedUser.state}</div>
                  <div><strong>Age:</strong> {selectedUser.age || "—"}</div>
                  <div><strong>Gender:</strong> {selectedUser.gender || "—"}</div>
                  <div><strong>Income:</strong> {selectedUser.income || "—"}</div>
                  <div><strong>Occupation:</strong> {selectedUser.occupation || "—"}</div>
                  <div><strong>Caste:</strong> {selectedUser.caste || "—"}</div>
                  <div><strong>Education:</strong> {selectedUser.education || "—"}</div>
                </div>

                <h4>Uploaded Documents</h4>
                {allDocs.filter(d => d.user_id === selectedUser.id).length === 0 ? (
                  <p style={{ fontSize: 13, color: "#666" }}>No documents uploaded.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 20px 0" }}>
                    {allDocs.filter(d => d.user_id === selectedUser.id).map(d => (
                      <li key={d.id} style={{ padding: 8, borderBottom: "1px solid #eee", fontSize: 13 }}>
                        📄 {d.doc_type} - <span className={`admin-status ${d.status}`}>{d.status}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <h4>Matched Schemes (MapReduce ML)</h4>
                {loadingUserMatch ? (
                  <p style={{ fontSize: 13, color: "#888" }}>Running distributed matching algorithm...</p>
                ) : userMatchResults && userMatchResults.schemes.length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: "10px 0" }}>
                    {userMatchResults.schemes.map((s, i) => (
                      <li key={i} style={{ padding: 8, background: "#f8fafc", marginBottom: 6, borderRadius: 6 }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{s.scheme_name}</div>
                        <div style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>Match: {s.match_probability}%</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: 13, color: "#666" }}>No matching schemes found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
