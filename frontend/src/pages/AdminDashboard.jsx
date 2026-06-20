import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./AdminDashboard.css";

const NAV_ITEMS = [
  { key: "overview", icon: "📊", label: "Overview" },
  { key: "documents", icon: "📄", label: "Document Review" },
  { key: "users", icon: "👥", label: "All Users" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [allDocs, setAllDocs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "admin") { navigate("/dashboard"); return; }
    setUser(parsed);
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [docsRes, usersRes] = await Promise.all([
        API.get("/documents/all"),
        API.get("/auth/users"),
      ]);
      setAllDocs(docsRes.data);
      setAllUsers(usersRes.data);
    } catch (e) { console.error("Admin load error:", e); }
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  if (!user) return <div style={{ padding: 40, color: "#fff" }}>Loading...</div>;

  const pendingDocs = allDocs.filter(d => d.status === "pending");
  const verifiedDocs = allDocs.filter(d => d.status === "verified");
  const rejectedDocs = allDocs.filter(d => d.status === "rejected");

  const docLabels = {
    aadhaar: "Aadhaar Card", income_cert: "Income Certificate",
    caste_cert: "Caste Certificate", ration_card: "Ration Card",
    bank_passbook: "Bank Passbook", land_record: "Land Record",
    pan_card: "PAN Card", voter_id: "Voter ID"
  };

  const renderOverview = () => (
    <>
      <div className="admin-stat-grid">
        <div className="admin-stat purple">
          <div className="admin-stat-icon purple">👥</div>
          <div className="admin-stat-value">{allUsers.length}</div>
          <div className="admin-stat-label">Total Users</div>
        </div>
        <div className="admin-stat amber">
          <div className="admin-stat-icon amber">⏳</div>
          <div className="admin-stat-value">{pendingDocs.length}</div>
          <div className="admin-stat-label">Pending Review</div>
        </div>
        <div className="admin-stat green">
          <div className="admin-stat-icon green">✅</div>
          <div className="admin-stat-value">{verifiedDocs.length}</div>
          <div className="admin-stat-label">Verified Docs</div>
        </div>
        <div className="admin-stat red">
          <div className="admin-stat-icon red">❌</div>
          <div className="admin-stat-value">{rejectedDocs.length}</div>
          <div className="admin-stat-label">Rejected</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <div className="admin-card-title">Recent Pending Documents</div>
            <div className="admin-card-sub">Documents awaiting your review</div>
          </div>
          {pendingDocs.length > 0 && (
            <button className="admin-btn admin-btn-outline" onClick={() => setActiveTab("documents")}>
              View All →
            </button>
          )}
        </div>
        {pendingDocs.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666", padding: "2rem 0", fontSize: 13 }}>
            🎉 No pending documents! All caught up.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Document</th>
                <th>File</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingDocs.slice(0, 5).map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.user_name}</td>
                  <td>{docLabels[d.doc_type] || d.doc_type}</td>
                  <td style={{ fontSize: 12, color: "#888" }}>{d.original_name}</td>
                  <td style={{ fontSize: 12, color: "#666" }}>{d.uploaded_at?.split("T")[0] || d.uploaded_at?.split(" ")[0]}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="admin-btn admin-btn-approve" onClick={() => handleVerify(d.id, "verified")}>✓ Approve</button>
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
                <tr key={u.id}>
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

  const tabTitles = {
    overview: ["Admin Dashboard", "System overview and pending actions"],
    documents: ["Document Review", "Review and verify user documents"],
    users: ["User Management", "View all registered users"],
  };

  const tabContent = {
    overview: renderOverview,
    documents: renderDocuments,
    users: renderUsers,
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">🛡️</div>
          <div>
            <h3>Arth<span>Mitra</span> AI</h3>
            <p>Admin Panel</p>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-label">Administration</div>
          {NAV_ITEMS.map((item) => (
            <div key={item.key} className={`admin-nav-item ${activeTab === item.key ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.key === "documents" && pendingDocs.length > 0 && (
                <span className="admin-nav-badge">{pendingDocs.length}</span>
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
            <span style={{ fontSize: 13, color: "#888" }}>🛡️ {user.name}</span>
            <button className="admin-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <div className="admin-content">
          {tabContent[activeTab]?.()}
        </div>
      </main>
    </div>
  );
}
