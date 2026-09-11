import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from "recharts";
import API from "../api/axios";
import "./Dashboard.css";
import { useLanguage } from "../LanguageContext";

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
  { key: "overview", icon: "🏠", labelKey: "dash_overview" },
  { key: "profile", icon: "👤", labelKey: "dash_profile" },
  { key: "schemes", icon: "🎯", labelKey: "dash_schemes" },
  { key: "applications", icon: "📋", labelKey: "dash_applications" },
  { key: "documents", icon: "📄", labelKey: "dash_documents" },
  { key: "verification", icon: "✅", labelKey: "dash_verification" },
  { key: "notifications", icon: "🔔", labelKey: "dash_notifications" },
  { key: "settings", icon: "⚙️", labelKey: "dash_settings" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const { lang, setLang, t } = useLanguage();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);

  // =========================
  // PROFILE STATE
  // =========================
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    occupation: "",
    income: "",
    caste: "",
    family_size: "",
    gender: "",
    education: "",
    state: "",
    language: ""
  });

  const [profileSaved, setProfileSaved] = useState(false);

  // =========================
  // DOCUMENT STATE
  // =========================
  const [documents, setDocuments] = useState([]);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [uploading, setUploading] = useState(false);

  // =========================
  // APPLICATION STATE
  // =========================
  const [applications, setApplications] = useState([]);

  // =========================
  // NOTIFICATION STATE
  // =========================
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // =========================
  // SCHEME FINDER STATE
  // =========================
  const [schemeForm, setSchemeForm] = useState({
    name: "",
    age: "",
    occupation: "",
    income: "",
    state: "",
    caste: "",
    family_size: ""
  });

  const [schemeResults, setSchemeResults] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    const stored = localStorage.getItem("user");

    if (!stored) {
      navigate("/");
      return;
    }

    const parsed = JSON.parse(stored);

    if (parsed.role && parsed.role !== "user") {
      navigate("/admin", { replace: true });
      return;
    }

    setUser(parsed);

    loadProfile(parsed.id);
    loadDocuments(parsed.id);
    loadApplications(parsed.id);
    loadNotifications(parsed.id);
  }, [navigate]);

  // =========================
  // LOAD PROFILE
  // =========================
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
        name: res.data.name || "",
        age: res.data.age || "",
        occupation: res.data.occupation || "",
        income: res.data.income || "",
        state: res.data.state || "",
        caste: res.data.caste || "",
        family_size: res.data.family_size || ""
      });
    } catch (e) {
      console.error("Profile load error:", e);
    }
  };

  // =========================
  // LOAD DOCUMENTS
  // =========================
  const loadDocuments = async (userId) => {
    try {
      const res = await API.get(`/documents/my/${userId}`);
      setDocuments(res.data);
    } catch (e) {
      console.error("Docs load error:", e);
    }
  };

  // =========================
  // LOAD APPLICATIONS
  // =========================
  const loadApplications = async (userId) => {
    try {
      const res = await API.get(`/applications/my/${userId}`);
      setApplications(res.data || []);
    } catch (e) {
      console.error("Applications load error:", e);
    }
  };

  // =========================
  // LOAD NOTIFICATIONS
  // =========================
  const loadNotifications = async (userId) => {
    try {
      const res = await API.get(`/notifications/${userId}`);

      setNotifications(res.data);

      const uc = await API.get(
        `/notifications/${userId}/unread-count`
      );

      setUnreadCount(uc.data.count);
    } catch (e) {
      console.error("Notif load error:", e);
    }
  };

  // =========================
  // SAVE PROFILE
  // =========================
  const saveProfile = async () => {
    try {
      const payload = { ...profile };

      if (payload.age) {
        payload.age = parseInt(payload.age);
      }

      if (payload.family_size) {
        payload.family_size = parseInt(payload.family_size);
      }

      await API.put(`/auth/profile/${user.id}`, payload);

      setProfileSaved(true);

      setTimeout(() => {
        setProfileSaved(false);
      }, 3000);
    } catch (e) {
      console.error("Profile save error:", e);
      alert("Failed to save profile");
    }
  };

  // =========================
  // FILE UPLOAD
  // =========================
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];

    if (!file || !selectedDocType) {
      alert("Please select a document type first");
      return;
    }

    setUploading(true);

    try {
      const fd = new FormData();

      fd.append("file", file);
      fd.append("user_id", user.id);
      fd.append("doc_type", selectedDocType);

      await API.post("/documents/upload", fd, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setSelectedDocType("");

      loadDocuments(user.id);
      loadNotifications(user.id);
    } catch (e) {
      console.error("Upload error:", e);
      alert("Upload failed");
    }

    setUploading(false);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  // =========================
  // MARK NOTIFICATION READ
  // =========================
  const markNotifRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      loadNotifications(user.id);
    } catch (e) {
      console.error(e);
    }
  };

  // =========================
  // MARK ALL READ
  // =========================
  const markAllRead = async () => {
    try {
      await API.put(`/notifications/${user.id}/read-all`);
      loadNotifications(user.id);
    } catch (e) {
      console.error(e);
    }
  };

  // =========================
  // FIND SCHEMES
  // =========================
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

  // =========================
  // VOICE SEARCH
  // =========================
  const startVoiceListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice speech recognition is not supported in this browser. Please try Chrome or Edge."
      );
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
      setSpeechTranscript(
        "Error occurred: " + event.error
      );
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = async (event) => {
      const transcript =
        event.results[0][0].transcript;

      setSpeechTranscript(transcript);
      setIsListening(false);

      try {
        const res = await API.post("/voice", {
          text: transcript
        });

        if (
          res.data.status === "ok" &&
          res.data.profile
        ) {
          const parsed = res.data.profile;

          const newForm = {
            ...schemeForm
          };

          Object.keys(parsed).forEach((k) => {
            if (
              parsed[k] !== undefined &&
              parsed[k] !== ""
            ) {
              newForm[k] = parsed[k];
            }
          });

          setSchemeForm(newForm);
          findSchemes(newForm);
        }
      } catch (err) {
        console.error(
          "Voice processing error:",
          err
        );
      }
    };

    recognition.start();
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        {t("loading")}
      </div>
    );
  }

  const initials = user.name
    ? user.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "U";

  const docsVerified = documents.filter(
    (d) => d.status === "verified"
  ).length;

  const docsPending = documents.filter(
    (d) =>
      d.status === "pending" ||
      d.status === "pending_clerk" ||
      d.status === "pending_officer"
  ).length;

  const docsRejected = documents.filter(
    (d) => d.status === "rejected"
  ).length;

  const getDocLabel = (key) => {
    const map = {
      aadhaar: "doc_aadhaar",
      pan_card: "doc_pan_card",
      income_cert: "doc_income_cert",
      caste_cert: "doc_caste_cert",
      ration_card: "doc_ration_card",
      bank_passbook: "doc_bank_passbook",
      land_record: "doc_land_record",
      voter_id: "doc_voter_id"
    };
    if (map[key]) return t(map[key]);
    return DOC_TYPES.find((d) => d.key === key)?.label || key;
  };

  const getDocIcon = (key) =>
    DOC_TYPES.find((d) => d.key === key)?.icon ||
    "📄";

  // ============================================================
  // TAB RENDERERS
  // ============================================================

  // =========================
  // OVERVIEW
  // =========================
  const renderOverview = () => {
    const benefitData = [
      {
        year: "2026",
        schemes: 12000,
        direct_benefit: 5000
      },
      {
        year: "2027",
        schemes: 25000,
        direct_benefit: 12000
      },
      {
        year: "2028",
        schemes: 38000,
        direct_benefit: 21000
      },
      {
        year: "2029",
        schemes: 52000,
        direct_benefit: 32000
      },
      {
        year: "2030",
        schemes: 68000,
        direct_benefit: 45000
      }
    ];

    const pieData = [
      {
        name: t("cat_agri"),
        value: 45
      },
      {
        name: t("cat_health"),
        value: 30
      },
      {
        name: t("cat_edu"),
        value: 15
      },
      {
        name: t("cat_housing"),
        value: 10
      }
    ];

    const COLORS = [
      "#FF6B00",
      "#138808",
      "#3b82f6",
      "#8b5cf6"
    ];

    // ── Dynamic Financial Profile Progress ──
    // Profile completeness: count non-empty profile fields (9 total)
    const PROFILE_FIELDS = ["name", "age", "income", "occupation", "state", "caste", "family_size", "gender", "education"];
    const filledFields = PROFILE_FIELDS.filter(k => profile[k] && String(profile[k]).trim() !== "").length;
    // Docs score: each uploaded doc = 5pts, each verified doc = 10pts bonus (max 100 total)
    const docUploadPts = Math.min(documents.length * 5, 30);
    const docVerifyPts = Math.min(docsVerified * 10, 30);
    const profilePct = Math.round((filledFields / PROFILE_FIELDS.length) * 40); // 40% weight
    const computedScore = Math.min(profilePct + docUploadPts + docVerifyPts, 100);

    const scoreLabel =
      computedScore === 0 ? t("standing_needs_attention") :
        computedScore < 30 ? t("standing_needs_attention") :
          computedScore < 60 ? t("standing_moderate") :
            computedScore < 80 ? t("standing_good") : t("standing_excellent");
    const scoreColor =
      computedScore < 30 ? "#EF4444" :
        computedScore < 60 ? "#F59E0B" :
          computedScore < 80 ? "#10B981" : "#2563EB";

    const healthScore = [{ name: "Score", value: computedScore || 1, fill: scoreColor }];

    // ── Profile completion % shown in onboarding ──
    const profileCompletionPct = Math.round((filledFields / PROFILE_FIELDS.length) * 100);

    return (
      <div className="animate-in">

        <div className="stat-grid">

          <div className="stat-card saffron animate-in">
            <div className="stat-icon saffron">
              🎯
            </div>

            <div className="stat-value">
              {schemeResults
                ? schemeResults.total_schemes
                : "15"}
            </div>

            <div className="stat-label">
              {t("dash_eligible_schemes")}
            </div>
          </div>

          <div className="stat-card green animate-in">
            <div className="stat-icon green">
              📄
            </div>

            <div className="stat-value">
              {documents.length}
            </div>

            <div className="stat-label">
              {t("dash_documents_uploaded")}
            </div>
          </div>

          <div className="stat-card blue animate-in">
            <div className="stat-icon blue">
              ✅
            </div>

            <div className="stat-value">
              {docsVerified}
            </div>

            <div className="stat-label">
              {t("admin_status_approved")}
            </div>
          </div>

          <div className="stat-card purple animate-in">
            <div className="stat-icon purple">
              🔔
            </div>

            <div className="stat-value">
              {unreadCount}
            </div>

            <div className="stat-label">
              {t("dash_notifications")}
            </div>
          </div>

        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "1.25rem",
            marginBottom: "1.25rem"
          }}
        >

          <div className="dash-card">

            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">
                  {t("dash_projected_welfare")}
                </div>

                <div className="dash-card-subtitle">
                  {t("dash_projected_welfare_sub")}
                </div>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                height: 280,
                minHeight: 250,
                position: "relative"
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={100}
                minHeight={200}
              >
                <BarChart
                  data={benefitData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#ede8e1"
                  />

                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 12,
                      fill: "#666"
                    }}
                    dy={10}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 12,
                      fill: "#666"
                    }}
                  />

                  <RechartsTooltip
                    cursor={{
                      fill: "#f8f4ef"
                    }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #ede8e1"
                    }}
                  />

                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: 12,
                      paddingTop: 10
                    }}
                  />

                  <Bar
                    dataKey="schemes"
                    name={t("cat_subsidies")}
                    stackId="a"
                    fill="#FF6B00"
                    radius={[
                      0,
                      0,
                      4,
                      4
                    ]}
                    barSize={32}
                  />

                  <Bar
                    dataKey="direct_benefit"
                    name={t("cat_dbt")}
                    stackId="a"
                    fill="#138808"
                    radius={[
                      4,
                      4,
                      0,
                      0
                    ]}
                  />

                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            className="dash-card"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}
          >

            <div
              className="dash-card-header"
              style={{
                width: "100%",
                marginBottom: 0
              }}
            >
              <div>

                <div className="dash-card-title">
                  {t("dash_health")}
                </div>

                <div className="dash-card-subtitle">
                  {t("dash_health_sub")}
                </div>

              </div>
            </div>

            <div
              style={{
                width: "100%",
                height: 200,
                minHeight: 180,
                position: "relative"
              }}
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={100}
                minHeight={160}
              >

                <RadialBarChart
                  cx="50%"
                  cy="60%"
                  innerRadius="70%"
                  outerRadius="100%"
                  barSize={16}
                  data={healthScore}
                  startAngle={180}
                  endAngle={0}
                >

                  <RadialBar
                    minAngle={15}
                    background={{
                      fill: "#f0fdf4"
                    }}
                    clockWise
                    dataKey="value"
                    cornerRadius={10}
                  />

                </RadialBarChart>

              </ResponsiveContainer>

              <div
                style={{
                  position: "absolute",
                  top: "55%",
                  left: "50%",
                  transform:
                    "translate(-50%, -50%)",
                  textAlign: "center"
                }}
              >

                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 800,
                    color: scoreColor,
                    fontFamily:
                      "'Playfair Display', serif"
                  }}
                >
                  {computedScore}%
                </div>

                <div
                  style={{
                    fontSize: "0.75rem",
                    color: scoreColor,
                    fontWeight: 600,
                    textTransform:
                      "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  {scoreLabel}
                </div>

              </div>

            </div>

            <button
              className="btn btn-outline btn-sm"
              style={{
                width: "100%"
              }}
              onClick={() => navigate("/health")}
              type="button"
            >
              {t("dash_view_plan")}
            </button>

          </div>

        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem"
          }}
        >

          <div className="dash-card">

            <div className="dash-card-header">
              <div>

                <div className="dash-card-title">
                  {t("dash_eligibility_category")}
                </div>

                <div className="dash-card-subtitle">
                  {t("dash_eligibility_category_sub")}
                </div>

              </div>
            </div>

            <div
              style={{
                width: "100%",
                height: 220,
                minHeight: 200,
                display: "flex",
                alignItems: "center"
              }}
            >

              <ResponsiveContainer
                width="50%"
                height="100%"
                minWidth={100}
                minHeight={160}
              >

                <PieChart>

                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >

                    {pieData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            COLORS[
                            index %
                            COLORS.length
                            ]
                          }
                        />
                      )
                    )}

                  </Pie>

                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: 8,
                      border:
                        "1px solid #ede8e1",
                      fontSize: 12
                    }}
                  />

                </PieChart>

              </ResponsiveContainer>

              <div
                style={{
                  width: "50%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >

                {pieData.map(
                  (entry, index) => (
                    <div
                      key={entry.name}
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 8
                      }}
                    >

                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background:
                            COLORS[
                            index %
                            COLORS.length
                            ]
                        }}
                      />

                      <span
                        style={{
                          fontSize: 13,
                          color: "#444",
                          flex: 1
                        }}
                      >
                        {entry.name}
                      </span>

                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#1a1a1a"
                        }}
                      >
                        {entry.value}%
                      </span>

                    </div>
                  )
                )}

              </div>

            </div>

          </div>

          <div className="dash-card">

            <div className="dash-card-header">

              <div>

                <div className="dash-card-title">
                  {t("dash_pending_tasks")}
                </div>

                <div className="dash-card-subtitle">
                  {t("dash_pending_tasks_sub")}
                </div>

              </div>

            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10
              }}
            >

              {[
                {
                  icon: "📄",
                  text: t("task_upload_income"),
                  tab: "documents",
                  done: documents.some(
                    (d) =>
                      d.doc_type ===
                      "income_cert"
                  )
                },
                {
                  icon: "✅",
                  text: t("task_verify_aadhaar"),
                  tab: "verification",
                  done: documents.some(
                    (d) =>
                      d.doc_type ===
                      "aadhaar" &&
                      d.status ===
                      "verified"
                  )
                },
                {
                  icon: "🎯",
                  text: t("task_apply_pmkisan"),
                  tab: "schemes",
                  done: false
                }
              ].map((a, i) => (

                <div
                  key={i}
                  onClick={() =>
                    setActiveTab(a.tab)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 8,
                    border:
                      "1.5px solid #ede8e1",
                    cursor: "pointer",
                    transition:
                      "all 0.2s",
                    background: a.done
                      ? "#f0fdf4"
                      : "#fafaf8"
                  }}
                >

                  <span
                    style={{
                      fontSize: 18
                    }}
                  >
                    {a.icon}
                  </span>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: a.done
                        ? "#166534"
                        : "#333",
                      flex: 1,
                      textDecoration:
                        a.done
                          ? "line-through"
                          : "none"
                    }}
                  >
                    {a.text}
                  </span>

                  <span
                    style={{
                      fontSize: 14
                    }}
                  >
                    {a.done
                      ? "✓"
                      : "→"}
                  </span>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>
    );
  };

  // =========================
  // PROFILE
  // =========================
  const renderProfile = () => {
    const profileFields = [
      { label: t("prof_name"), key: "name", type: "text", placeholder: t("name_placeholder") },
      { label: t("prof_age"), key: "age", type: "number", placeholder: t("age_placeholder") },
      {
        label: t("prof_gender"),
        key: "gender",
        type: "select",
        options: [
          { value: "", label: t("select_gender") },
          { value: "Male", label: t("gender_male") },
          { value: "Female", label: t("gender_female") },
          { value: "Other", label: t("gender_other") }
        ]
      },
      {
        label: t("prof_edu"),
        key: "education",
        type: "select",
        options: [
          { value: "", label: t("select_edu") },
          { value: "Below 10th Pass", label: t("edu_below_10") },
          { value: "10th Pass (SSC)", label: t("edu_10th") },
          { value: "12th Pass (HSC)", label: t("edu_12th") },
          { value: "Graduate / Bachelor's", label: t("edu_grad") },
          { value: "Post Graduate & Above", label: t("edu_postgrad") }
        ]
      },
      { label: t("prof_occ"), key: "occupation", type: "text", placeholder: t("occ_placeholder") },
      { label: t("prof_income"), key: "income", type: "text", placeholder: t("income_placeholder") },
      {
        label: t("match_caste_label"),
        key: "caste",
        type: "select",
        options: [
          { value: "", label: t("select_caste") },
          { value: "General", label: t("caste_general") },
          { value: "OBC", label: t("caste_obc") },
          { value: "SC", label: t("caste_sc") },
          { value: "ST", label: t("caste_st") },
          { value: "EWS", label: t("caste_ews") }
        ]
      },
      { label: t("prof_family"), key: "family_size", type: "number", placeholder: t("family_placeholder") },
      {
        label: t("prof_state"),
        key: "state",
        type: "select",
        options: [
          { value: "", label: t("select_state") },
          ...["Maharashtra", "Uttar Pradesh", "Rajasthan", "Madhya Pradesh", "Bihar", "Gujarat", "West Bengal", "Tamil Nadu", "Karnataka", "Andhra Pradesh", "Kerala", "Odisha", "Punjab", "Haryana", "Jharkhand", "Chhattisgarh", "Assam", "Telangana"].map(s => ({ value: s, label: s }))
        ]
      },
      {
        label: t("prof_lang"),
        key: "language",
        type: "select",
        options: [
          { value: "", label: t("select_lang") },
          { value: "English", label: "English" },
          { value: "Hindi", label: "हिन्दी (Hindi)" },
          { value: "Marathi", label: "मराठी (Marathi)" }
        ]
      }
    ];

    return (
      <div className="dash-card animate-in">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">{t("dash_profile")}</div>
            <div className="dash-card-subtitle">{t("dash_profile_sub")}</div>
          </div>

          {profileSaved && (
            <span
              style={{
                background: "#f0fdf4",
                color: "#166534",
                padding: "5px 14px",
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid #bbf7d0"
              }}
            >
              ✅ {t("dash_saved")}
            </span>
          )}
        </div>

        <div className="form-grid">
          {profileFields.map((field) => (
            <div className="form-group" key={field.key}>
              <label className="form-label">{field.label}</label>

              {field.type === "select" ? (
                <select
                  className="form-select"
                  value={
                    field.key === "language"
                      ? (lang === "mr" ? "Marathi" : lang === "hi" ? "Hindi" : "English")
                      : (profile[field.key] || "")
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile({ ...profile, [field.key]: val });
                    if (field.key === "language") {
                      if (val === "English" || val === "en") setLang("en");
                      else if (val === "Hindi" || val === "hi" || val.includes("Hindi")) setLang("hi");
                      else if (val === "Marathi" || val === "mr" || val.includes("Marathi")) setLang("mr");
                    }
                  }}
                >
                  {field.options.map((opt) => (
                    <option key={opt.value || opt.label} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="form-input"
                  type={field.type}
                  placeholder={field.placeholder}
                  value={profile[field.key] || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      [field.key]: e.target.value
                    })
                  }
                />
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            gap: 12
          }}
        >
          <button className="btn btn-primary" onClick={saveProfile}>
            💾 {t("prof_save_btn")}
          </button>

          <button
            className="btn btn-outline"
            onClick={() => loadProfile(user.id)}
          >
            ↩️ {t("prof_reset_btn")}
          </button>
        </div>
      </div>
    );
  };

  // =========================
  // SCHEME FINDER
  // =========================
  const renderSchemes = () => (
    <div className="animate-in">

      <div
        className="dash-card"
        style={{
          marginBottom: "1.25rem"
        }}
      >

        <div
          className="dash-card-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >

          <div>

            <div className="dash-card-title">
              🎯 {t("dash_tab_schemes")}
            </div>

            <div className="dash-card-subtitle">
              {t("dash_tab_schemes_sub")}
            </div>

          </div>

          <button
            className={`btn ${isListening
                ? "btn-danger"
                : "btn-outline"
              }`}
            onClick={
              startVoiceListening
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition:
                "all 0.3s"
            }}
          >

            {isListening ? (
              <>
                <span
                  className="voice-pulse-ring"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background:
                      "#ef4444",
                    display:
                      "inline-block",
                    animation:
                      "pulse 1s infinite"
                  }}
                />

                🛑 {t("voice_listening")}
              </>
            ) : (
              `🎙️ ${t("nav_voice")}`
            )}

          </button>

        </div>

        {speechTranscript && (
          <div
            style={{
              background: "#f8f9fa",
              border:
                "1.5px solid #ede8e1",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              marginBottom:
                "1.25rem",
              color: "#444"
            }}
          >
            <strong>
              {t("voice_transcript_label")}:
            </strong>{" "}
            "{speechTranscript}"
          </div>
        )}

        <div className="form-grid">

          {[
            [
              t("prof_name"),
              "name",
              "text",
              t("name_placeholder")
            ],
            [
              t("prof_age"),
              "age",
              "number",
              t("age_placeholder")
            ],
            [
              t("prof_occ"),
              "occupation",
              "text",
              t("occ_placeholder")
            ],
            [
              t("prof_income"),
              "income",
              "text",
              t("income_placeholder")
            ],
            [
              t("prof_state"),
              "state",
              "text",
              t("select_state")
            ],
            [
              t("match_caste_label"),
              "caste",
              "text",
              t("select_caste")
            ],
            [
              t("prof_family"),
              "family_size",
              "number",
              t("family_placeholder")
            ]
          ].map(
            ([
              label,
              key,
              type,
              ph
            ]) => (

              <div
                className="form-group"
                key={key}
              >

                <label className="form-label">
                  {label}
                </label>

                <input
                  className="form-input"
                  type={type}
                  placeholder={ph}
                  value={
                    schemeForm[key] || ""
                  }
                  onChange={(e) =>
                    setSchemeForm({
                      ...schemeForm,
                      [key]:
                        e.target.value
                    })
                  }
                />

              </div>

            )
          )}

        </div>

        <div
          style={{
            marginTop: "1.5rem"
          }}
        >

          <button
            className="btn btn-green"
            onClick={() =>
              findSchemes()
            }
          >
            🔍 {t("match_btn")}
          </button>

        </div>

      </div>

      {schemeResults && (

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1.5fr 1fr",
            gap: "1.25rem",
            alignItems: "start"
          }}
        >

          <div className="dash-card">

            <div className="dash-card-header">

              <div>

                <div className="dash-card-title">
                  {t("match_results_title")}
                </div>

                <div className="dash-card-subtitle">
                  {schemeResults.total_schemes} {t("match_results_label")}
                </div>

              </div>

              <span
                style={{
                  background:
                    "#f0fdf4",
                  color:
                    "#166534",
                  padding:
                    "4px 12px",
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 700,
                  border:
                    "1px solid #bbf7d0"
                }}
              >
                {schemeResults.schemes
                  ?.length || 0}{" "}
                {t("top_matches")}
              </span>

            </div>

            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: 12
              }}
            >

              {(
                schemeResults.schemes ||
                []
              ).map((s, i) => (

                <div
                  key={i}
                  onClick={() =>
                    navigate(
                      `/scheme/${encodeURIComponent(
                        s.scheme_name
                      )}`
                    )
                  }
                  style={{
                    padding:
                      "1.25rem",
                    border:
                      "1.5px solid #ede8e1",
                    borderLeft: `5px solid ${s.match_probability >=
                        85
                        ? "#138808"
                        : "#FF6B00"
                      }`,
                    borderRadius: 12,
                    background:
                      "#fafaf8",
                    cursor: "pointer",
                    transition:
                      "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                  className="scheme-card-interactive"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-3px)";

                    e.currentTarget.style.boxShadow =
                      "0 8px 20px rgba(0,0,0,0.04)";

                    e.currentTarget.style.borderColor =
                      s.match_probability >=
                        85
                        ? "#bbf7d0"
                        : "#ffd4b8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(0)";

                    e.currentTarget.style.boxShadow =
                      "none";

                    e.currentTarget.style.borderColor =
                      "#ede8e1";
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      marginBottom: 6
                    }}
                  >

                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color:
                          "#1a1a1a"
                      }}
                    >
                      {s.scheme_name}
                    </div>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color:
                          s.match_probability >=
                            85
                            ? "#138808"
                            : "#FF6B00",
                        background:
                          s.match_probability >=
                            85
                            ? "#f0fdf4"
                            : "#fff3ed",
                        padding:
                          "2px 8px",
                        borderRadius:
                          100,
                        border: `1px solid ${s.match_probability >=
                            85
                            ? "#bbf7d0"
                            : "#ffd4b8"
                          }`
                      }}
                    >
                      {s.match_probability}%
                      {" "}{t("card_match")}
                    </span>

                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#666",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.05em",
                      marginBottom: 6
                    }}
                  >
                    {t("card_category")}:{" "}
                    {s.category} • {t("card_benefit")}:{" "}
                    <strong>
                      {s.benefit}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap:
                        "wrap",
                      marginTop: 8
                    }}
                  >

                    {(s.reasons || []).map(
                      (
                        reason,
                        idx
                      ) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 10,
                            background:
                              "#fff",
                            border:
                              "1px solid #ede8e1",
                            borderRadius: 4,
                            padding:
                              "2px 6px",
                            color:
                              "#666"
                          }}
                        >
                          ✓ {reason}
                        </span>
                      )
                    )}

                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 11,
                      color: "#999",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: 4
                    }}
                  >
                    <span>
                      {t("click_to_open_scheme")}
                    </span>{" "}
                    ➔
                  </div>

                </div>

              ))}

            </div>

          </div>

          {schemeResults.model_report && (

            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                gap: "1.25rem"
              }}
            >

              <div className="dash-card">

                <div
                  className="dash-card-header"
                  style={{
                    marginBottom:
                      "1rem"
                  }}
                >

                  <div>

                    <div className="dash-card-title">
                      🤖 {t("ai_match_report")}
                    </div>

                    <div className="dash-card-subtitle">
                      Classifier details & performance
                    </div>

                  </div>

                </div>

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: 10,
                    marginBottom:
                      "1.25rem"
                  }}
                >

                  <div
                    style={{
                      padding: 10,
                      background:
                        "#f8f9fa",
                      borderRadius: 8,
                      border:
                        "1px solid #ede8e1"
                    }}
                  >

                    <div
                      style={{
                        fontSize: 10,
                        color: "#999"
                      }}
                    >
                      {t("accuracy")}
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color:
                          "#138808"
                      }}
                    >
                      {
                        schemeResults
                          .model_report
                          .accuracy
                      }%
                    </div>

                  </div>

                  <div
                    style={{
                      padding: 10,
                      background:
                        "#f8f9fa",
                      borderRadius: 8,
                      border:
                        "1px solid #ede8e1"
                    }}
                  >

                    <div
                      style={{
                        fontSize: 10,
                        color: "#999"
                      }}
                    >
                      {t("trained_samples")}
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color:
                          "#FF6B00"
                      }}
                    >
                      {
                        schemeResults
                          .model_report
                          .training_samples
                      }
                    </div>

                  </div>

                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "#666",
                    marginBottom:
                      "0.75rem"
                  }}
                >
                  <strong>
                    Model:
                  </strong>{" "}
                  {
                    schemeResults
                      .model_report
                      .model_name
                  }
                </div>

                <div
                  style={{
                    marginTop: 14
                  }}
                >

                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#444",
                      marginBottom: 8
                    }}
                  >
                    {t("feature_importance")}:
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap: 8
                    }}
                  >

                    {schemeResults
                      .model_report
                      .feature_importances
                      .map(
                        (
                          item,
                          idx
                        ) => (

                          <div
                            key={idx}
                          >

                            <div
                              style={{
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                                fontSize: 11,
                                color:
                                  "#555",
                                marginBottom: 2
                              }}
                            >

                              <span>
                                {
                                  item.feature
                                }
                              </span>

                              <span>
                                {
                                  item.importance
                                }%
                              </span>

                            </div>

                            <div
                              style={{
                                height: 5,
                                background:
                                  "#eee",
                                borderRadius:
                                  10,
                                overflow:
                                  "hidden"
                              }}
                            >

                              <div
                                style={{
                                  height:
                                    "100%",
                                  width: `${item.importance}%`,
                                  background:
                                    idx %
                                      2 ===
                                      0
                                      ? "#FF6B00"
                                      : "#138808",
                                  borderRadius:
                                    10
                                }}
                              />

                            </div>

                          </div>

                        )
                      )}

                  </div>

                </div>

              </div>

              {schemeResults
                .schemes?.[0]
                ?.decision_path && (

                  <div className="dash-card">

                    <div className="dash-card-header">

                      <div>

                        <div className="dash-card-title">
                          🌳 Matching Decision Path
                        </div>

                        <div className="dash-card-subtitle">
                          Stepping logic for top match:{" "}
                          {
                            schemeResults
                              .schemes[0]
                              .scheme_name
                          }
                        </div>

                      </div>

                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        gap: 10,
                        paddingLeft: 8
                      }}
                    >

                      {schemeResults
                        .schemes[0]
                        .decision_path
                        .map(
                          (
                            path,
                            idx
                          ) => (

                            <div
                              key={idx}
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: 8,
                                position:
                                  "relative"
                              }}
                            >

                              <div
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius:
                                    "50%",
                                  background:
                                    path.includes(
                                      "NO"
                                    )
                                      ? "#fde2e2"
                                      : "#f0fdf4",
                                  border: `1.5px solid ${path.includes(
                                    "NO"
                                  )
                                      ? "#fca5a5"
                                      : "#bbf7d0"
                                    }`,
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color:
                                    path.includes(
                                      "NO"
                                    )
                                      ? "#b91c1c"
                                      : "#166534"
                                }}
                              >
                                {path.includes(
                                  "NO"
                                )
                                  ? "✗"
                                  : "✓"}
                              </div>

                              <span
                                style={{
                                  fontSize: 11,
                                  color:
                                    "#444",
                                  fontWeight:
                                    500
                                }}
                              >
                                {path}
                              </span>

                              {idx <
                                schemeResults
                                  .schemes[0]
                                  .decision_path
                                  .length -
                                1 && (
                                  <div
                                    style={{
                                      position:
                                        "absolute",
                                      left: 9,
                                      top: 20,
                                      width: 2,
                                      height: 12,
                                      background:
                                        "#ede8e1"
                                    }}
                                  />
                                )}

                            </div>

                          )
                        )}

                    </div>

                  </div>

                )}

            </div>

          )}

        </div>

      )}

    </div>
  );

  // ============================================================
  // MY APPLICATIONS - NEW
  // ============================================================
  const renderApplications = () => (
    <div className="animate-in">

      <div className="dash-card">

        <div className="dash-card-header">

          <div>

            <div className="dash-card-title">
              📋 {t("apps_title")}
            </div>

            <div className="dash-card-subtitle">
              {t("apps_sub")}
            </div>

          </div>

          <button
            className="btn btn-outline btn-sm"
            onClick={() =>
              loadApplications(user.id)
            }
          >
            🔄 {t("admin_refresh")}
          </button>

        </div>

        {applications.length === 0 ? (

          <div
            style={{
              textAlign: "center",
              padding: "3rem 0"
            }}
          >

            <div
              style={{
                fontSize: 48,
                marginBottom: 12
              }}
            >
              📋
            </div>

            <p
              style={{
                fontSize: 14,
                color: "#666",
                marginBottom: 12
              }}
            >
              {t("apps_no_apps")}
            </p>

            <button
              className="btn btn-green btn-sm"
              onClick={() =>
                setActiveTab("schemes")
              }
            >
              🎯 {t("dash_schemes")}
            </button>

          </div>

        ) : (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14
            }}
          >

            {applications.map(
              (app) => {

                const isRejected =
                  app.status ===
                  "rejected";

                const isVerified =
                  app.status ===
                  "verified";

                let rejectionReason =
                  app.review_note || "";

                // Backend stores:
                // "Rejected by Department Secretary at Department Secretary Stage. Reason: Review docs."
                //
                // We only display the actual reason after "Reason:"
                if (
                  rejectionReason.includes(
                    "Reason:"
                  )
                ) {
                  rejectionReason =
                    rejectionReason
                      .split(
                        "Reason:"
                      )[1]
                      .trim();
                }

                return (
                  <div
                    key={app.id}
                    style={{
                      padding:
                        "1.25rem",
                      border:
                        "1.5px solid #ede8e1",
                      borderRadius: 12,
                      background:
                        "#fafaf8"
                    }}
                  >

                    {/* APPLICATION HEADER */}
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: 12
                      }}
                    >

                      <div>

                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color:
                              "#1a1a1a"
                          }}
                        >
                          {
                            app.scheme_name
                          }
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color:
                              "#666",
                            marginTop: 5
                          }}
                        >
                          Category:{" "}
                          {
                            app.category ||
                            "Welfare"
                          }
                        </div>

                      </div>

                      <span
                        className={`status-badge status-${app.status}`}
                        style={{
                          whiteSpace:
                            "nowrap"
                        }}
                      >
                        {isRejected
                          ? t("status_REJECTED")
                          : isVerified
                            ? t("status_APPROVED")
                            : app.status === "pending_clerk"
                              ? t("status_PENDING_CLERK")
                              : app.status === "pending_officer"
                                ? t("status_PENDING_OFFICER")
                                : app.status === "pending_secretary"
                                  ? t("status_PENDING_SECRETARY")
                                  : app.status === "pending_minister"
                                    ? t("status_PENDING_MINISTER")
                                    : t("status_PENDING_CLERK")}
                      </span>

                    </div>

                    {/* REJECTION DETAILS */}
                    {isRejected && (
                      <div
                        style={{
                          marginTop: 14,
                          padding:
                            "14px 16px",
                          background:
                            "#fde2e2",
                          border:
                            "1px solid #fca5a5",
                          borderRadius: 8
                        }}
                      >

                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color:
                              "#b91c1c",
                            marginBottom:
                              8
                          }}
                        >
                          ❌ Application Rejected
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            color:
                              "#7f1d1d",
                            marginBottom:
                              5
                          }}
                        >
                          <strong>
                            Rejected by:
                          </strong>{" "}
                          {app.current_handler
                            ? app.current_handler.replace(
                              "Rejected by ",
                              ""
                            )
                            : "Administrator"}
                        </div>

                        {rejectionReason && (
                          <div
                            style={{
                              fontSize: 13,
                              color:
                                "#7f1d1d"
                            }}
                          >
                            <strong>
                              Reason:
                            </strong>{" "}
                            {rejectionReason}
                          </div>
                        )}

                      </div>
                    )}

                    {/* APPROVED */}
                    {isVerified && (
                      <div
                        style={{
                          marginTop: 14,
                          padding:
                            "12px 14px",
                          background:
                            "#f0fdf4",
                          border:
                            "1px solid #bbf7d0",
                          borderRadius: 8,
                          color:
                            "#166534",
                          fontSize: 13
                        }}
                      >
                        ✅{" "}
                        <strong>
                          Application Approved
                        </strong>
                        <div
                          style={{
                            marginTop: 4
                          }}
                        >
                          Your application has completed all verification stages.
                        </div>
                      </div>
                    )}

                    {/* CURRENT STAGE */}
                    {!isRejected &&
                      !isVerified &&
                      app.current_handler && (
                        <div
                          style={{
                            marginTop: 12,
                            padding:
                              "10px 12px",
                            background:
                              "#f8fafc",
                            border:
                              "1px solid #e2e8f0",
                            borderRadius: 8,
                            fontSize: 12,
                            color:
                              "#475569"
                          }}
                        >
                          <strong>
                            Current Stage:
                          </strong>{" "}
                          {
                            app.current_handler
                          }
                        </div>
                      )}

                    {/* ATTACHED DOCUMENTS FOR THIS APPLICATION */}
                    {app.documents && app.documents.length > 0 && (
                      <div style={{ marginTop: 12, borderTop: "1px solid #ede8e1", paddingTop: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>
                          📄 Attached Documents ({app.documents.length}):
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {app.documents.map((d) => (
                            <span key={d.id} style={{
                              fontSize: 11, background: "#fff", border: "1px solid #e2e8f0",
                              padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 6
                            }}>
                              <span>{getDocIcon(d.doc_type)}</span>
                              <span>{getDocLabel(d.doc_type)}: {d.original_name}</span>
                              <span style={{
                                fontSize: 10, fontWeight: 700,
                                color: d.status === "verified" ? "#16a34a" : d.status === "rejected" ? "#dc2626" : "#d97706"
                              }}>
                                ({d.status})
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DRAFT RESUME BUTTON */}
                    {app.status === "draft" && (
                      <div style={{ marginTop: 12 }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: "#FF6B00", color: "#fff", border: "none", cursor: "pointer" }}
                          onClick={() => navigate(`/scheme/${encodeURIComponent(app.scheme_name)}`)}
                        >
                          📋 Upload Documents & Finalize Draft
                        </button>
                      </div>
                    )}

                    {/* APPLICATION DATE */}
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 11,
                        color: "#999"
                      }}
                    >
                      Applied:{" "}
                      {app.applied_at
                        ?.split(
                          "T"
                        )[0] ||
                        app.applied_at
                          ?.split(
                            " "
                          )[0] ||
                        "N/A"}
                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

    </div>
  );

  // =========================
  // DOCUMENTS
  // =========================
  const renderDocuments = () => (
    <div className="animate-in">

      <div
        className="dash-card"
        style={{
          marginBottom:
            "1.25rem"
        }}
      >

        <div className="dash-card-header">

          <div>

            <div className="dash-card-title">
              {t("docs_upload_title")}
            </div>

            <div className="dash-card-subtitle">
              Personal locker documents. To apply for a scheme and verify documents, start a scheme application.
            </div>

          </div>

        </div>

        <div className="doc-type-grid">

          {DOC_TYPES.map(
            (dt) => (

              <div
                key={dt.key}
                className={`doc-type-chip ${selectedDocType ===
                    dt.key
                    ? "selected"
                    : ""
                  }`}
                onClick={() =>
                  setSelectedDocType(
                    dt.key
                  )
                }
              >
                {dt.icon}{" "}
                {getDocLabel(dt.key)}
              </div>

            )
          )}

        </div>

        <input
          type="file"
          ref={fileRef}
          onChange={
            handleFileUpload
          }
          accept=".pdf,.jpg,.jpeg,.png"
          style={{
            display: "none"
          }}
        />

        <div
          className="upload-zone"
          onClick={() => {

            if (
              !selectedDocType
            ) {
              alert(
                t("docs_select_file_err")
              );
              return;
            }

            fileRef.current?.click();
          }}
        >

          <div className="upload-zone-icon">
            {uploading
              ? "⏳"
              : "📤"}
          </div>

          <div className="upload-zone-text">
            {uploading
              ? t("docs_uploading")
              : selectedDocType
                ? `${t("dash_upload_doc")} ${getDocLabel(
                  selectedDocType
                )}`
                : t("docs_select_type")}
          </div>

          <div className="upload-zone-sub">
            {t("docs_file_limit")}
          </div>

        </div>

      </div>

      <div className="dash-card">

        <div className="dash-card-header">

          <div>

            <div className="dash-card-title">
              {t("docs_my_files")}
            </div>

            <div className="dash-card-subtitle">
              {documents.length} {t("dash_documents_uploaded")}
            </div>

          </div>

        </div>

        {documents.length ===
          0 ? (

          <p
            style={{
              textAlign:
                "center",
              color: "#999",
              padding:
                "2rem 0",
              fontSize: 13
            }}
          >
            {t("docs_no_files")}
          </p>

        ) : (

          <div className="doc-list">

            {documents.map(
              (d) => (

                <div
                  className="doc-item"
                  key={d.id}
                >

                  <div className="doc-item-left">

                    <div className="doc-icon">
                      {getDocIcon(
                        d.doc_type
                      )}
                    </div>

                    <div>

                      <div className="doc-name">
                        {getDocLabel(
                          d.doc_type
                        )}
                      </div>

                      <div className="doc-meta">
                        {
                          d.original_name
                        }{" "}
                        •{" "}
                        {d.uploaded_at
                          ?.split(
                            "T"
                          )[0] ||
                          d.uploaded_at
                            ?.split(
                              " "
                            )[0]}
                      </div>

                    </div>

                  </div>

                  <span
                    className={`status-badge status-${d.status}`}
                  >
                    {d.status}
                  </span>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  );

  // =========================
  // VERIFICATION
  // =========================
  const renderVerification = () => (
    <div className="dash-card animate-in">

      <div className="dash-card-header">

        <div>

          <div className="dash-card-title">
            {t("dash_verification")}
          </div>

          <div className="dash-card-subtitle">
            {t("dash_tab_verify_sub")}
          </div>

        </div>

      </div>

      {documents.length ===
        0 ? (

        <div
          style={{
            textAlign:
              "center",
            padding:
              "3rem 0"
          }}
        >

          <div
            style={{
              fontSize: 48,
              marginBottom: 12
            }}
          >
            📋
          </div>

          <p
            style={{
              fontSize: 14,
              color: "#666",
              marginBottom: 8
            }}
          >
            {t("docs_no_files")}
          </p>

          <button
            className="btn btn-outline btn-sm"
            onClick={() =>
              setActiveTab(
                "documents"
              )
            }
          >
            {t("dash_upload_doc")} →
          </button>

        </div>

      ) : (

        <>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: "1.25rem",
              marginBottom:
                "1.5rem"
            }}
          >

            <div
              style={{
                textAlign:
                  "center",
                padding:
                  "1rem",
                background:
                  "#fef3cd",
                border:
                  "1px solid #ffc107",
                borderRadius: 12
              }}
            >

              <div
                style={{
                  fontSize:
                    "1.5rem",
                  fontWeight: 700,
                  color:
                    "#856404"
                }}
              >
                {docsPending}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color:
                    "#856404",
                  fontWeight: 600
                }}
              >
                {t("docs_pending")}
              </div>

            </div>

            <div
              style={{
                textAlign:
                  "center",
                padding:
                  "1rem",
                background:
                  "#f0fdf4",
                border:
                  "1px solid #bbf7d0",
                borderRadius: 12
              }}
            >

              <div
                style={{
                  fontSize:
                    "1.5rem",
                  fontWeight: 700,
                  color:
                    "#166534"
                }}
              >
                {docsVerified}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color:
                    "#166534",
                  fontWeight: 600
                }}
              >
                {t("status_VERIFIED")}
              </div>

            </div>

            <div
              style={{
                textAlign:
                  "center",
                padding:
                  "1rem",
                background:
                  "#fde2e2",
                border:
                  "1px solid #fca5a5",
                borderRadius: 12
              }}
            >

              <div
                style={{
                  fontSize:
                    "1.5rem",
                  fontWeight: 700,
                  color:
                    "#b91c1c"
                }}
              >
                {docsRejected}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color:
                    "#b91c1c",
                  fontWeight: 600
                }}
              >
                {t("status_REJECTED")}
              </div>

            </div>

          </div>

          <div className="verify-timeline">

            {documents.map(
              (d) => (

                <div
                  className={`verify-step ${d.status ===
                      "verified"
                      ? "done"
                      : ""
                    }`}
                  key={d.id}
                >

                  <div
                    className={`verify-dot ${d.status ===
                        "verified"
                        ? "done"
                        : d.status ===
                          "pending"
                          ? "pending"
                          : "waiting"
                      }`}
                  >
                    {d.status ===
                      "verified"
                      ? "✓"
                      : d.status ===
                        "rejected"
                        ? "✗"
                        : "⏳"}
                  </div>

                  <div className="verify-info">

                    <h4>
                      {getDocLabel(
                        d.doc_type
                      )}
                    </h4>

                    <p>
                      {d.status ===
                        "verified" &&
                        t("docs_verified_msg")}

                      {d.status ===
                        "pending" &&
                        t("docs_awaiting_admin")}

                      {d.status ===
                        "pending_clerk" &&
                        t("docs_awaiting_clerk")}

                      {d.status ===
                        "pending_officer" &&
                        t("docs_awaiting_officer")}

                      {d.status ===
                        "rejected" &&
                        `${t("status_REJECTED")}${d.review_note
                          ? `: ${d.review_note}`
                          : ""
                        }`}
                    </p>

                    <p
                      style={{
                        fontSize: 11,
                        color: "#bbb",
                        marginTop: 2
                      }}
                    >
                      Uploaded:{" "}
                      {d.uploaded_at
                        ?.split(
                          "T"
                        )[0] ||
                        d.uploaded_at
                          ?.split(
                            " "
                          )[0]}
                    </p>

                  </div>

                </div>

              )
            )}

          </div>

        </>

      )}

    </div>
  );

  // =========================
  // NOTIFICATIONS
  // =========================
  const renderNotifications = () => (
    <div className="dash-card animate-in">

      <div className="dash-card-header">

        <div>

          <div className="dash-card-title">
            {t("dash_notifications")}
          </div>

          <div className="dash-card-subtitle">
            {unreadCount} {t("notif_sub")}
          </div>

        </div>

        {unreadCount > 0 && (
          <button
            className="btn btn-outline btn-sm"
            onClick={
              markAllRead
            }
          >
            {t("notif_mark_read")}
          </button>
        )}

      </div>

      {notifications.length ===
        0 ? (

        <div
          style={{
            textAlign:
              "center",
            padding:
              "3rem 0"
          }}
        >

          <div
            style={{
              fontSize: 48,
              marginBottom: 12
            }}
          >
            🔔
          </div>

          <p
            style={{
              fontSize: 14,
              color: "#666"
            }}
          >
            {t("notif_no_notif")}
          </p>

        </div>

      ) : (

        <div className="notif-list">

          {notifications.map(
            (n) => (

              <div
                key={n.id}
                className={`notif-item ${!n.read
                    ? "unread"
                    : ""
                  }`}
                onClick={() =>
                  !n.read &&
                  markNotifRead(
                    n.id
                  )
                }
              >

                <div
                  className={`notif-dot ${n.category}`}
                />

                <div
                  style={{
                    flex: 1
                  }}
                >

                  <div className="notif-text">
                    {n.message}
                  </div>

                  <div className="notif-time">
                    {n.created_at
                      ?.split(
                        "T"
                      )[0] ||
                      n.created_at
                        ?.split(
                          " "
                        )[0]}
                  </div>

                </div>

                {!n.read && (
                  <span
                    style={{
                      fontSize: 10,
                      color:
                        "#FF6B00",
                      fontWeight: 700
                    }}
                  >
                    {t("notif_new")}
                  </span>
                )}

              </div>

            )
          )}

        </div>

      )}

    </div>
  );

  // =========================
  // SETTINGS
  // =========================
  const renderSettings = () => (
    <div className="dash-card animate-in">

      <div className="dash-card-header">

        <div>

          <div className="dash-card-title">
            {t("dash_settings")}
          </div>

          <div className="dash-card-subtitle">
            {t("dash_tab_settings_sub")}
          </div>

        </div>

      </div>

      <div
        style={{
          display: "flex",
          flexDirection:
            "column",
          gap: "1.25rem"
        }}
      >

        <div
          style={{
            padding:
              "1.25rem",
            border:
              "1.5px solid #ede8e1",
            borderRadius: 12,
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between"
          }}
        >

          <div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color:
                  "#1a1a1a"
              }}
            >
              🌐 {t("prof_lang")}
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#999",
                marginTop: 2
              }}
            >
              {t("currently")}:{" "}
              {lang === "mr" ? "मराठी" : lang === "hi" ? "हिन्दी" : "English"}
            </div>

          </div>

          <select
            className="form-select"
            style={{
              width: 200
            }}
            value={
              lang === "mr" ? "Marathi" : lang === "hi" ? "Hindi" : "English"
            }
            onChange={(e) => {
              const val = e.target.value;
              setProfile({
                ...profile,
                language: val
              });
              if (val === "English" || val === "en") setLang("en");
              else if (val === "Hindi" || val.includes("Hindi")) setLang("hi");
              else if (val === "Marathi" || val.includes("Marathi")) setLang("mr");
            }}
          >

            {[
              { val: "English", label: "English" },
              { val: "Hindi", label: "हिन्दी (Hindi)" },
              { val: "Marathi", label: "मराठी (Marathi)" }
            ].map((l) => (
              <option
                key={l.val}
                value={l.val}
              >
                {l.label}
              </option>
            ))}

          </select>

        </div>

        <div
          style={{
            padding:
              "1.25rem",
            border:
              "1.5px solid #ede8e1",
            borderRadius: 12,
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between"
          }}
        >

          <div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color:
                  "#1a1a1a"
              }}
            >
              👤 {t("account_info")}
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#999",
                marginTop: 2
              }}
            >
              {t("login_mobile_label")}:{" "}
              {user.mobile} |{" "}
              {t("role_citizen")}:{" "}
              {user.role}
            </div>

          </div>

        </div>

        <div
          style={{
            padding:
              "1.25rem",
            border:
              "1.5px solid #fca5a5",
            borderRadius: 12,
            background:
              "#fde2e2",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between"
          }}
        >

          <div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color:
                  "#b91c1c"
              }}
            >
              🚪 {t("dash_logout")}
            </div>

            <div
              style={{
                fontSize: 12,
                color:
                  "#b91c1c",
                marginTop: 2
              }}
            >
              {t("dash_logout")}
            </div>

          </div>

          <button
            className="btn btn-danger btn-sm"
            onClick={
              handleLogout
            }
          >
            {t("dash_logout")}
          </button>

        </div>

      </div>

    </div>
  );

  // ============================================================
  // TAB CONTENT
  // ============================================================
  const tabContent = {
    overview: renderOverview,
    profile: renderProfile,
    schemes: renderSchemes,
    applications: renderApplications,
    documents: renderDocuments,
    verification: renderVerification,
    notifications: renderNotifications,
    settings: renderSettings
  };

  const tabTitles = {
    overview: [
      t("dash_tab_overview"),
      t("dash_tab_overview_sub")
    ],

    profile: [
      t("dash_profile"),
      t("dash_profile_sub")
    ],

    schemes: [
      t("dash_tab_schemes"),
      t("dash_tab_schemes_sub")
    ],

    applications: [
      t("dash_applications"),
      t("dash_tab_apps_sub")
    ],

    documents: [
      t("dash_tab_docs"),
      t("dash_tab_docs_sub")
    ],

    verification: [
      t("dash_verification"),
      t("dash_tab_verify_sub")
    ],

    notifications: [
      t("dash_notifications"),
      t("dash_tab_notif_sub")
    ],

    settings: [
      t("dash_settings"),
      t("dash_tab_settings_sub")
    ]
  };

  // ============================================================
  // RETURN
  // ============================================================
  return (
    <div className="dash-layout">

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`dash-sidebar ${collapsed
            ? "collapsed"
            : ""
          }`}
      >

        <div className="sidebar-brand">

          <div className="sidebar-brand-icon">
            AM
          </div>

          <div className="sidebar-brand-text">

            <h3>
              Arth<span>
                Mitra
              </span>{" "}
              AI
            </h3>

            <p>
              Welfare Intelligence
            </p>

          </div>

        </div>

        <div className="sidebar-user">

          <div className="sidebar-avatar">
            {initials}
          </div>

          <div className="sidebar-user-info">

            <div className="name">
              {user.name}
            </div>

            <div className="role">
              {t("dash_beneficiary")}
            </div>

          </div>

        </div>

        <nav className="sidebar-nav">

          <div className="sidebar-section-label">
            {t("dash_main_menu")}
          </div>

          {SIDEBAR_ITEMS.slice(
            0,
            4
          ).map((item) => (

            <div
              key={item.key}
              className={`sidebar-item ${activeTab ===
                  item.key
                  ? "active"
                  : ""
                }`}
              onClick={() =>
                setActiveTab(
                  item.key
                )
              }
            >

              <span className="sidebar-item-icon">
                {item.icon}
              </span>

              <span className="sidebar-item-text">
                {t(item.labelKey) || item.labelKey}
              </span>

              {item.key ===
                "notifications" &&
                unreadCount >
                0 && (
                  <span className="sidebar-badge">
                    {unreadCount}
                  </span>
                )}

            </div>

          ))}

          <div className="sidebar-section-label">
            {t("dash_documents")}
          </div>

          {SIDEBAR_ITEMS.slice(
            4,
            6
          ).map((item) => (

            <div
              key={item.key}
              className={`sidebar-item ${activeTab ===
                  item.key
                  ? "active"
                  : ""
                }`}
              onClick={() =>
                setActiveTab(
                  item.key
                )
              }
            >

              <span className="sidebar-item-icon">
                {item.icon}
              </span>

              <span className="sidebar-item-text">
                {t(item.labelKey) || item.labelKey}
              </span>

            </div>

          ))}

          <div className="sidebar-section-label">
            {t("dash_account")}
          </div>

          {SIDEBAR_ITEMS.slice(
            6
          ).map((item) => (

            <div
              key={item.key}
              className={`sidebar-item ${activeTab ===
                  item.key
                  ? "active"
                  : ""
                }`}
              onClick={() =>
                setActiveTab(
                  item.key
                )
              }
            >

              <span className="sidebar-item-icon">
                {item.icon}
              </span>

              <span className="sidebar-item-text">
                {t(item.labelKey) || item.labelKey}
              </span>

              {item.key ===
                "notifications" &&
                unreadCount >
                0 && (
                  <span className="sidebar-badge">
                    {unreadCount}
                  </span>
                )}

            </div>

          ))}

        </nav>

        <div
          className="sidebar-toggle"
          onClick={() =>
            setCollapsed(
              !collapsed
            )
          }
        >

          <span>
            {collapsed
              ? "▶"
              : "◀"}
          </span>

          <span className="sidebar-item-text">
            {collapsed
              ? ""
              : "Collapse"}
          </span>

        </div>

      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <main
        className={`dash-main ${collapsed
            ? "expanded"
            : ""
          }`}
      >

        <div className="dash-header">

          <div className="dash-header-left">

            <h2>
              {
                tabTitles[
                activeTab
                ]?.[0] ||
                "Dashboard"
              }
            </h2>

            <p>
              {
                tabTitles[
                activeTab
                ]?.[1] || ""
              }
            </p>

          </div>

          <div className="dash-header-actions">

            <button
              className="header-notif-btn"
              onClick={() =>
                setActiveTab(
                  "notifications"
                )
              }
            >
              🔔

              {unreadCount >
                0 && (
                  <span className="header-notif-dot" />
                )}

            </button>

            <button
              className="header-logout-btn"
              onClick={
                handleLogout
              }
            >
              {t("dash_logout") || "Logout"}
            </button>

          </div>

        </div>

        <div className="dash-content">

          {tabContent[
            activeTab
          ]?.() || (
              <p>
                Tab not found
              </p>
            )}

        </div>

      </main>

    </div>
  );
}