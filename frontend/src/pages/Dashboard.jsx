import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import API from "../api/axios";
import "./Dashboard.css";

const DOC_TYPES = [
  { key: "aadhaar", label: "Aadhaar Card", icon: "🪪" },
  { key: "income_cert", label: "Income Certificate", icon: "💰" },
  { key: "caste_cert", label: "Caste Certificate", icon: "📜" },
  { key: "ration_card", label: "Ration Card", icon: "🏠" },
  { key: "bank_passbook", label: "Bank Passbook", icon: "🏦" },
  { key: "land_record", label: "Land Record", icon: "🌾" },
  { key: "pan_card", label: "PAN Card", icon: "💳" },
  { key: "voter_id", label: "Voter ID", icon: "🗳️" },
];

const SIDEBAR_ITEMS = [
  { key: "overview", icon: "🏠", label: "Overview" },
  { key: "profile", icon: "👤", label: "My Profile" },
  { key: "schemes", icon: "🎯", label: "Scheme Finder" },
  { key: "documents", icon: "📄", label: "Documents" },
  { key: "verification", icon: "✅", label: "Verification" },
  { key: "notifications", icon: "🔔", label: "Notifications" },
  { key: "settings", icon: "⚙️", label: "Settings" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    name: "", age: "", occupation: "", income: "", caste: "",
    family_size: "", gender: "", education: "", state: "", language: ""
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [uploading, setUploading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Scheme finder state
  const [schemeForm, setSchemeForm] = useState({
    name: "", age: "", occupation: "", income: "", state: "", caste: "", family_size: ""
  });
  const [schemeResults, setSchemeResults] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role && parsed.role !== "user") {
      navigate("/admin", { replace: true });
      return;
    }

    setUser(parsed);
    loadProfile(parsed.id);
    loadDocuments(parsed.id);
    loadNotifications(parsed.id);
  }, [navigate]);

  const loadProfile = async (userId) => {
    try {
      const res = await API.get(`/auth/profile/${userId}`);
      setProfile({
        name: res.data.name || "",
        age: res.data.age || "",
        occupation: res.data.occupation || "",
        income: res.data.income || "",
        caste: res.data.caste || "",
        family_size: res.data.family_size || "",
        gender: res.data.gender || "",
        education: res.data.education || "",
        state: res.data.state || "",
        language: res.data.language || ""
      });
      setSchemeForm({
        name: res.data.name || "", age: res.data.age || "",
        occupation: res.data.occupation || "", income: res.data.income || "",
        state: res.data.state || "", caste: res.data.caste || "",
        family_size: res.data.family_size || ""
      });
    } catch (e) { console.error("Profile load error:", e); }
  };

  const loadDocuments = async (userId) => {
    try {
      const res = await API.get(`/documents/my/${userId}`);
      setDocuments(res.data);
    } catch (e) { console.error("Docs load error:", e); }
  };

  const loadNotifications = async (userId) => {
    try {
      const res = await API.get(`/notifications/${userId}`);
      setNotifications(res.data);
      const uc = await API.get(`/notifications/${userId}/unread-count`);
      setUnreadCount(uc.data.count);
    } catch (e) { console.error("Notif load error:", e); }
  };

  const saveProfile = async () => {
    try {
      const payload = { ...profile };
      if (payload.age) payload.age = parseInt(payload.age);
      if (payload.family_size) payload.family_size = parseInt(payload.family_size);
      await API.put(`/auth/profile/${user.id}`, payload);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e) {
      console.error("Profile save error:", e);
      alert("Failed to save profile");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedDocType) { alert("Please select a document type first"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("user_id", user.id);
      fd.append("doc_type", selectedDocType);
      await API.post("/documents/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSelectedDocType("");
      loadDocuments(user.id);
      loadNotifications(user.id);
    } catch (e) {
      console.error("Upload error:", e);
      alert("Upload failed");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const markNotifRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      loadNotifications(user.id);
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      await API.put(`/notifications/${user.id}/read-all`);
      loadNotifications(user.id);
    } catch (e) { console.error(e); }
  };

  const findSchemes = async (overrideForm = null) => {
    try {
      const payload = overrideForm || schemeForm;
      const res = await API.post("/match-schemes", payload);
      setSchemeResults(res.data);
    } catch (e) {
      console.error(e);
      alert("Error finding schemes");
    }
  };

  const startVoiceListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechTranscript("Listening... Speak now.");
    };

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
      setSpeechTranscript("Error occurred: " + event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setSpeechTranscript(transcript);
      setIsListening(false);
      
      try {
        const res = await API.post("/voice", { text: transcript });
        if (res.data.status === "ok" && res.data.profile) {
          const parsed = res.data.profile;
          const newForm = { ...schemeForm };
          Object.keys(parsed).forEach(k => {
            if (parsed[k] !== undefined && parsed[k] !== "") {
              newForm[k] = parsed[k];
            }
          });
          setSchemeForm(newForm);
          findSchemes(newForm);
        }
      } catch (err) {
        console.error("Voice processing error:", err);
      }
    };

    recognition.start();
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  if (!user) return <div style={{ padding: 40 }}>Loading...</div>;

  const initials = user.name ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "U";
  const docsVerified = documents.filter(d => d.status === "verified").length;
  const docsPending = documents.filter(d => d.status === "pending").length;
  const docsRejected = documents.filter(d => d.status === "rejected").length;

  const getDocLabel = (key) => DOC_TYPES.find(d => d.key === key)?.label || key;
  const getDocIcon = (key) => DOC_TYPES.find(d => d.key === key)?.icon || "📄";

  // ===== TAB RENDERERS =====

  const renderOverview = () => {
    // Mock Data for Charts
    const benefitData = [
      { year: '2026', schemes: 12000, direct_benefit: 5000 },
      { year: '2027', schemes: 25000, direct_benefit: 12000 },
      { year: '2028', schemes: 38000, direct_benefit: 21000 },
      { year: '2029', schemes: 52000, direct_benefit: 32000 },
      { year: '2030', schemes: 68000, direct_benefit: 45000 },
    ];

    const pieData = [
      { name: 'Agriculture', value: 45 },
      { name: 'Healthcare', value: 30 },
      { name: 'Education', value: 15 },
      { name: 'Housing', value: 10 },
    ];
    const COLORS = ['#FF6B00', '#138808', '#3b82f6', '#8b5cf6'];

    const healthScore = [{ name: 'Score', value: 74, fill: '#138808' }];

    return (
      <div className="animate-in">
        <div className="stat-grid">
          <div className="stat-card saffron animate-in">
            <div className="stat-icon saffron">🎯</div>
            <div className="stat-value">{schemeResults ? schemeResults.total_schemes : "15"}</div>
            <div className="stat-label">Eligible Schemes</div>
          </div>
          <div className="stat-card green animate-in">
            <div className="stat-icon green">📄</div>
            <div className="stat-value">{documents.length}</div>
            <div className="stat-label">Docs Uploaded</div>
          </div>
          <div className="stat-card blue animate-in">
            <div className="stat-icon blue">✅</div>
            <div className="stat-value">{docsVerified}</div>
            <div className="stat-label">Verified</div>
          </div>
          <div className="stat-card purple animate-in">
            <div className="stat-icon purple">🔔</div>
            <div className="stat-value">{unreadCount}</div>
            <div className="stat-label">Notifications</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
          {/* Projected Benefits Chart */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Projected Welfare Benefits (5 Years)</div>
                <div className="dash-card-subtitle">Estimated financial impact of your matched schemes in ₹</div>
              </div>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={benefitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede8e1" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                  <RechartsTooltip cursor={{ fill: '#f8f4ef' }} contentStyle={{ borderRadius: 8, border: '1px solid #ede8e1' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="schemes" name="Subsidies & Exemptions" stackId="a" fill="#FF6B00" radius={[0, 0, 4, 4]} barSize={32} />
                  <Bar dataKey="direct_benefit" name="Direct Benefit Transfer" stackId="a" fill="#138808" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Health Score Gauge */}
          <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="dash-card-header" style={{ width: '100%', marginBottom: 0 }}>
              <div>
                <div className="dash-card-title">Financial Health</div>
                <div className="dash-card-subtitle">Your AI generated score</div>
              </div>
            </div>
            <div style={{ width: '100%', height: 200, position: 'relative' }}>
              <ResponsiveContainer>
                <RadialBarChart cx="50%" cy="60%" innerRadius="70%" outerRadius="100%" barSize={16} data={healthScore} startAngle={180} endAngle={0}>
                  <RadialBar minAngle={15} background={{ fill: '#f0fdf4' }} clockWise dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#138808', fontFamily: "'Playfair Display', serif" }}>74</div>
                <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Good Standing</div>
              </div>
            </div>
            <button className="btn btn-outline btn-sm" style={{ width: '100%' }}>View Improvement Plan</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          {/* Scheme Distribution Pie Chart */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Eligibility by Category</div>
                <div className="dash-card-subtitle">Breakdown of schemes you qualify for</div>
              </div>
            </div>
            <div style={{ width: '100%', height: 220, display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: '1px solid #ede8e1', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pieData.map((entry, index) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                    <span style={{ fontSize: 13, color: '#444', flex: 1 }}>{entry.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions (condensed) */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Pending Tasks</div>
                <div className="dash-card-subtitle">Next steps to maximize your benefits</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "📄", text: "Upload Income Certificate", tab: "documents", done: documents.some(d => d.doc_type === 'income_cert') },
                { icon: "✅", text: "Get Aadhaar Verified", tab: "verification", done: documents.some(d => d.doc_type === 'aadhaar' && d.status === 'verified') },
                { icon: "🎯", text: "Apply for PM-Kisan", tab: "schemes", done: false },
              ].map((a, i) => (
                <div key={i} onClick={() => setActiveTab(a.tab)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8,
                    border: "1.5px solid #ede8e1", cursor: "pointer", transition: "all 0.2s",
                    background: a.done ? "#f0fdf4" : "#fafaf8" }}>
                  <span style={{ fontSize: 18 }}>{a.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: a.done ? "#166534" : "#333", flex: 1, textDecoration: a.done ? "line-through" : "none" }}>{a.text}</span>
                  <span style={{ fontSize: 14 }}>{a.done ? "✓" : "→"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="dash-card animate-in">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">My Profile</div>
          <div className="dash-card-subtitle">Complete your details to get matched with best schemes</div>
        </div>
        {profileSaved && (
          <span style={{ background: "#f0fdf4", color: "#166534", padding: "5px 14px", borderRadius: 100,
            fontSize: 12, fontWeight: 600, border: "1px solid #bbf7d0" }}>✅ Saved!</span>
        )}
      </div>
      <div className="form-grid">
        {[
          ["Full Name", "name", "text", "Enter your full name"],
          ["Age", "age", "number", "Enter age"],
          ["Gender", "gender", "select", ["Select Gender", "Male", "Female", "Other"]],
          ["Education", "education", "select", ["Select Education", "No Formal Education", "Primary School", "High School", "Graduate", "Post Graduate"]],
          ["Occupation", "occupation", "text", "e.g. Farmer, Labour, Self-employed"],
          ["Annual Income (₹)", "income", "text", "e.g. 120000"],
          ["Caste Category", "caste", "select", ["Select Category", "General", "OBC", "SC", "ST", "EWS"]],
          ["Family Size", "family_size", "number", "Number of family members"],
          ["State", "state", "select", ["Select State", "Maharashtra", "Uttar Pradesh", "Rajasthan", "Madhya Pradesh", "Bihar", "Gujarat", "West Bengal", "Tamil Nadu", "Karnataka", "Andhra Pradesh", "Kerala", "Odisha", "Punjab", "Haryana", "Jharkhand", "Chhattisgarh", "Assam", "Telangana"]],
          ["Preferred Language", "language", "select", ["Select Language", "English", "हिंदी (Hindi)", "मराठी (Marathi)", "বাংলা (Bengali)", "தமிழ் (Tamil)", "తెలుగు (Telugu)"]],
        ].map(([label, key, type, placeholder]) => (
          <div className="form-group" key={key}>
            <label className="form-label">{label}</label>
            {type === "select" ? (
              <select className="form-select" value={profile[key] || ""}
                onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}>
                {placeholder.map(opt => <option key={opt} value={opt.startsWith("Select") ? "" : opt}>{opt}</option>)}
              </select>
            ) : (
              <input className="form-input" type={type} placeholder={placeholder}
                value={profile[key] || ""}
                onChange={(e) => setProfile({ ...profile, [key]: e.target.value })} />
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: "1.5rem", display: "flex", gap: 12 }}>
        <button className="btn btn-primary" onClick={saveProfile}>💾 Save Profile</button>
        <button className="btn btn-outline" onClick={() => loadProfile(user.id)}>↩️ Reset</button>
      </div>
    </div>
  );

  const renderSchemes = () => (
    <div className="animate-in">
      <div className="dash-card" style={{ marginBottom: "1.25rem" }}>
        <div className="dash-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="dash-card-title">🎯 Scheme Eligibility Finder</div>
            <div className="dash-card-subtitle">AI-powered matching from 500+ government schemes</div>
          </div>
          <button
            className={`btn ${isListening ? "btn-danger" : "btn-outline"}`}
            onClick={startVoiceListening}
            style={{ display: "flex", alignItems: "center", gap: 6, transition: "all 0.3s" }}
          >
            {isListening ? (
              <>
                <span className="voice-pulse-ring" style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "pulse 1s infinite" }} />
                🛑 Listening...
              </>
            ) : (
              "🎙️ Try Voice Search"
            )}
          </button>
        </div>

        {speechTranscript && (
          <div style={{ background: "#f8f9fa", border: "1.5px solid #ede8e1", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: "1.25rem", color: "#444" }}>
            <strong>Voice Input:</strong> "{speechTranscript}"
          </div>
        )}

        <div className="form-grid">
          {[
            ["Name", "name", "text", "Your name"],
            ["Age", "age", "number", "Age"],
            ["Occupation", "occupation", "text", "Occupation (e.g. Farmer, Student, Labour)"],
            ["Annual Income (₹)", "income", "text", "Income (e.g. 150000)"],
            ["State", "state", "text", "State (e.g. Maharashtra)"],
            ["Caste Category", "caste", "text", "Category (e.g. General, OBC, SC, ST, EWS)"],
            ["Family Size", "family_size", "number", "Members"],
          ].map(([label, key, type, ph]) => (
            <div className="form-group" key={key}>
              <label className="form-label">{label}</label>
              <input className="form-input" type={type} placeholder={ph} value={schemeForm[key] || ""}
                onChange={(e) => setSchemeForm({ ...schemeForm, [key]: e.target.value })} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1.5rem" }}>
          <button className="btn btn-green" onClick={() => findSchemes()}>🔍 Find Eligible Schemes</button>
        </div>
      </div>

      {schemeResults && (
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.25rem", alignItems: "start" }}>
          {/* Matched Schemes List */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Matched Schemes</div>
                <div className="dash-card-subtitle">{schemeResults.total_schemes} schemes matched using AI ranking</div>
              </div>
              <span style={{ background: "#f0fdf4", color: "#166534", padding: "4px 12px", borderRadius: 100,
                fontSize: 11, fontWeight: 700, border: "1px solid #bbf7d0" }}>
                {schemeResults.schemes?.length || 0} TOP MATCHES
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(schemeResults.schemes || []).map((s, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/scheme/${encodeURIComponent(s.scheme_name)}`)}
                  style={{
                    padding: "1.25rem",
                    border: "1.5px solid #ede8e1",
                    borderLeft: `5px solid ${s.match_probability >= 85 ? "#138808" : "#FF6B00"}`,
                    borderRadius: 12,
                    background: "#fafaf8",
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                  className="scheme-card-interactive"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.04)";
                    e.currentTarget.style.borderColor = s.match_probability >= 85 ? "#bbf7d0" : "#ffd4b8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#ede8e1";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>
                      {s.scheme_name}
                    </div>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: s.match_probability >= 85 ? "#138808" : "#FF6B00",
                      background: s.match_probability >= 85 ? "#f0fdf4" : "#fff3ed",
                      padding: "2px 8px",
                      borderRadius: 100,
                      border: `1px solid ${s.match_probability >= 85 ? "#bbf7d0" : "#ffd4b8"}`
                    }}>
                      {s.match_probability}% Match
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                    Category: {s.category} • Benefit: <strong>{s.benefit}</strong>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {(s.reasons || []).map((reason, idx) => (
                      <span key={idx} style={{ fontSize: 10, background: "#fff", border: "1px solid #ede8e1", borderRadius: 4, padding: "2px 6px", color: "#666" }}>
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 11, color: "#999", display: "flex", alignItems: "center", gap: 4 }}>
                    <span>Click scheme to open detailed dashboard & apply</span> ➔
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Matching Analysis & Specs */}
          {schemeResults.model_report && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Model info */}
              <div className="dash-card">
                <div className="dash-card-header" style={{ marginBottom: "1rem" }}>
                  <div>
                    <div className="dash-card-title">🤖 AI Match Report</div>
                    <div className="dash-card-subtitle">Classifier details & performance</div>
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.25rem" }}>
                  <div style={{ padding: 10, background: "#f8f9fa", borderRadius: 8, border: "1px solid #ede8e1" }}>
                    <div style={{ fontSize: 10, color: "#999" }}>ACCURACY</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#138808" }}>{schemeResults.model_report.accuracy}%</div>
                  </div>
                  <div style={{ padding: 10, background: "#f8f9fa", borderRadius: 8, border: "1px solid #ede8e1" }}>
                    <div style={{ fontSize: 10, color: "#999" }}>TRAINED SAMPLES</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#FF6B00" }}>{schemeResults.model_report.training_samples}</div>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: "#666", marginBottom: "0.75rem" }}>
                  <strong>Model:</strong> {schemeResults.model_report.model_name}
                </div>

                {/* Feature Importance Bars */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 8 }}>Feature Importance weights:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {schemeResults.model_report.feature_importances.map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555", marginBottom: 2 }}>
                          <span>{item.feature}</span>
                          <span>{item.importance}%</span>
                        </div>
                        <div style={{ height: 5, background: "#eee", borderRadius: 10, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${item.importance}%`, background: idx % 2 === 0 ? "#FF6B00" : "#138808", borderRadius: 10 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Decision Tree Trace for Top Match */}
              {schemeResults.schemes?.[0]?.decision_path && (
                <div className="dash-card">
                  <div className="dash-card-header">
                    <div>
                      <div className="dash-card-title">🌳 Matching Decision Path</div>
                      <div className="dash-card-subtitle">Stepping logic for top match: {schemeResults.schemes[0].scheme_name}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 8 }}>
                    {schemeResults.schemes[0].decision_path.map((path, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: path.includes("NO") ? "#fde2e2" : "#f0fdf4",
                          border: `1.5px solid ${path.includes("NO") ? "#fca5a5" : "#bbf7d0"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: path.includes("NO") ? "#b91c1c" : "#166534"
                        }}>
                          {path.includes("NO") ? "✗" : "✓"}
                        </div>
                        <span style={{ fontSize: 11, color: "#444", fontWeight: 500 }}>{path}</span>
                        {idx < schemeResults.schemes[0].decision_path.length - 1 && (
                          <div style={{ position: "absolute", left: 9, top: 20, width: 2, height: 12, background: "#ede8e1" }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div className="animate-in">
      <div className="dash-card" style={{ marginBottom: "1.25rem" }}>
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Upload Document</div>
            <div className="dash-card-subtitle">Select document type then upload your file</div>
          </div>
        </div>

        <div className="doc-type-grid">
          {DOC_TYPES.map((dt) => (
            <div key={dt.key} className={`doc-type-chip ${selectedDocType === dt.key ? "selected" : ""}`}
              onClick={() => setSelectedDocType(dt.key)}>
              {dt.icon} {dt.label}
            </div>
          ))}
        </div>

        <input type="file" ref={fileRef} onChange={handleFileUpload}
          accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} />

        <div className="upload-zone" onClick={() => {
          if (!selectedDocType) { alert("Please select a document type first"); return; }
          fileRef.current?.click();
        }}>
          <div className="upload-zone-icon">{uploading ? "⏳" : "📤"}</div>
          <div className="upload-zone-text">
            {uploading ? "Uploading..." : selectedDocType ? `Upload ${getDocLabel(selectedDocType)}` : "Select a document type above"}
          </div>
          <div className="upload-zone-sub">PDF, JPG, PNG — Max 5MB</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">My Documents</div>
            <div className="dash-card-subtitle">{documents.length} document(s) uploaded</div>
          </div>
        </div>
        {documents.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999", padding: "2rem 0", fontSize: 13 }}>
            No documents uploaded yet. Start by selecting a type and uploading.
          </p>
        ) : (
          <div className="doc-list">
            {documents.map((d) => (
              <div className="doc-item" key={d.id}>
                <div className="doc-item-left">
                  <div className="doc-icon">{getDocIcon(d.doc_type)}</div>
                  <div>
                    <div className="doc-name">{getDocLabel(d.doc_type)}</div>
                    <div className="doc-meta">{d.original_name} • {d.uploaded_at?.split("T")[0] || d.uploaded_at?.split(" ")[0]}</div>
                  </div>
                </div>
                <span className={`status-badge status-${d.status}`}>{d.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderVerification = () => (
    <div className="dash-card animate-in">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Verification Status</div>
          <div className="dash-card-subtitle">Track the progress of your document verification</div>
        </div>
      </div>

      {documents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>No documents to verify</p>
          <button className="btn btn-outline btn-sm" onClick={() => setActiveTab("documents")}>Upload Documents →</button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ textAlign: "center", padding: "1rem", background: "#fef3cd", borderRadius: 12, border: "1px solid #ffc107" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#856404" }}>{docsPending}</div>
              <div style={{ fontSize: 11, color: "#856404", fontWeight: 600 }}>PENDING</div>
            </div>
            <div style={{ textAlign: "center", padding: "1rem", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#166534" }}>{docsVerified}</div>
              <div style={{ fontSize: 11, color: "#166534", fontWeight: 600 }}>VERIFIED</div>
            </div>
            <div style={{ textAlign: "center", padding: "1rem", background: "#fde2e2", borderRadius: 12, border: "1px solid #fca5a5" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#b91c1c" }}>{docsRejected}</div>
              <div style={{ fontSize: 11, color: "#b91c1c", fontWeight: 600 }}>REJECTED</div>
            </div>
          </div>

          <div className="verify-timeline">
            {documents.map((d) => (
              <div className={`verify-step ${d.status === "verified" ? "done" : ""}`} key={d.id}>
                <div className={`verify-dot ${d.status === "verified" ? "done" : d.status === "pending" ? "pending" : "waiting"}`}>
                  {d.status === "verified" ? "✓" : d.status === "rejected" ? "✗" : "⏳"}
                </div>
                <div className="verify-info">
                  <h4>{getDocLabel(d.doc_type)}</h4>
                  <p>
                    {d.status === "verified" && "Document has been verified successfully ✅"}
                    {d.status === "pending" && "Awaiting admin review..."}
                    {d.status === "rejected" && `Rejected${d.review_note ? `: ${d.review_note}` : ""}`}
                  </p>
                  <p style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>
                    Uploaded: {d.uploaded_at?.split("T")[0] || d.uploaded_at?.split(" ")[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="dash-card animate-in">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Notifications</div>
          <div className="dash-card-subtitle">{unreadCount} unread notification(s)</div>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark all read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <p style={{ fontSize: 14, color: "#666" }}>No notifications yet</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map((n) => (
            <div key={n.id} className={`notif-item ${!n.read ? "unread" : ""}`}
              onClick={() => !n.read && markNotifRead(n.id)}>
              <div className={`notif-dot ${n.category}`} />
              <div style={{ flex: 1 }}>
                <div className="notif-text">{n.message}</div>
                <div className="notif-time">{n.created_at?.split("T")[0] || n.created_at?.split(" ")[0]}</div>
              </div>
              {!n.read && <span style={{ fontSize: 10, color: "#FF6B00", fontWeight: 700 }}>NEW</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="dash-card animate-in">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Settings</div>
          <div className="dash-card-subtitle">Manage your account preferences</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ padding: "1.25rem", border: "1.5px solid #ede8e1", borderRadius: 12, display: "flex",
          alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>🌐 Language Preference</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>Currently: {profile.language || "English"}</div>
          </div>
          <select className="form-select" style={{ width: 200 }} value={profile.language || "English"}
            onChange={(e) => setProfile({ ...profile, language: e.target.value })}>
            {["English", "हिंदी (Hindi)", "मराठी (Marathi)", "বাংলা (Bengali)", "தமிழ் (Tamil)"].map(l =>
              <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div style={{ padding: "1.25rem", border: "1.5px solid #ede8e1", borderRadius: 12, display: "flex",
          alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>👤 Account Info</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>Mobile: {user.mobile} | Role: {user.role}</div>
          </div>
        </div>

        <div style={{ padding: "1.25rem", border: "1.5px solid #fca5a5", borderRadius: 12, background: "#fde2e2",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#b91c1c" }}>🚪 Logout</div>
            <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>Sign out of your account</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );

  const tabContent = {
    overview: renderOverview,
    profile: renderProfile,
    schemes: renderSchemes,
    documents: renderDocuments,
    verification: renderVerification,
    notifications: renderNotifications,
    settings: renderSettings,
  };

  const tabTitles = {
    overview: ["Dashboard Overview", "Welcome back! Here's your activity summary."],
    profile: ["My Profile", "Keep your information updated for best scheme matching."],
    schemes: ["Scheme Finder", "AI-powered government scheme eligibility matching."],
    documents: ["Document Management", "Upload and manage your verification documents."],
    verification: ["Verification Status", "Track your document verification progress."],
    notifications: ["Notifications", "Stay updated with your latest alerts."],
    settings: ["Settings", "Manage your account and preferences."],
  };

  return (
    <div className="dash-layout">
      {/* SIDEBAR */}
      <aside className={`dash-sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">AM</div>
          <div className="sidebar-brand-text">
            <h3>Arth<span>Mitra</span> AI</h3>
            <p>Welfare Intelligence</p>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="name">{user.name}</div>
            <div className="role">{user.role === "admin" ? "Administrator" : "Beneficiary"}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {SIDEBAR_ITEMS.slice(0, 3).map((item) => (
            <div key={item.key} className={`sidebar-item ${activeTab === item.key ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}>
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-text">{item.label}</span>
              {item.key === "notifications" && unreadCount > 0 && (
                <span className="sidebar-badge">{unreadCount}</span>
              )}
            </div>
          ))}

          <div className="sidebar-section-label">Documents</div>
          {SIDEBAR_ITEMS.slice(3, 5).map((item) => (
            <div key={item.key} className={`sidebar-item ${activeTab === item.key ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}>
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-text">{item.label}</span>
            </div>
          ))}

          <div className="sidebar-section-label">Account</div>
          {SIDEBAR_ITEMS.slice(5).map((item) => (
            <div key={item.key} className={`sidebar-item ${activeTab === item.key ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}>
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-text">{item.label}</span>
              {item.key === "notifications" && unreadCount > 0 && (
                <span className="sidebar-badge">{unreadCount}</span>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          <span>{collapsed ? "▶" : "◀"}</span>
          <span className="sidebar-item-text">{collapsed ? "" : "Collapse"}</span>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`dash-main ${collapsed ? "expanded" : ""}`}>
        <div className="dash-header">
          <div className="dash-header-left">
            <h2>{tabTitles[activeTab]?.[0] || "Dashboard"}</h2>
            <p>{tabTitles[activeTab]?.[1] || ""}</p>
          </div>
          <div className="dash-header-actions">
            <button className="header-notif-btn" onClick={() => setActiveTab("notifications")}>
              🔔
              {unreadCount > 0 && <span className="header-notif-dot" />}
            </button>
            <button className="header-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="dash-content">
          {tabContent[activeTab]?.() || <p>Tab not found</p>}
        </div>
      </main>
    </div>
  );
}