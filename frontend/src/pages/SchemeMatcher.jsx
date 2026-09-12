import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import SchemeCard from "../components/SchemeCard";
import Loader from "../components/Loader";
import Footer from "../components/Footer";
import { useLanguage } from "../LanguageContext";
import SchemeChatBot from "../components/SchemeChatBot";

export default function SchemeMatcher() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);

  // Authenticated Citizen State
  const [form, setForm] = useState({
    name: "", age: "", occupation: "",
    income: "", state: "", caste: "", family_size: "", gender: ""
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [appliedSchemeNames, setAppliedSchemeNames] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.role && u.role !== "user") {
          navigate(u.role === "minister" ? "/minister" : "/admin");
          return;
        }
        setUser(u);
        setForm(prev => ({
          ...prev,
          name: u.name || "",
          state: u.state || "",
          occupation: u.occupation || "",
          income: u.income || "",
          age: u.age ? String(u.age) : "",
          caste: u.caste || "",
          family_size: u.family_size ? String(u.family_size) : "",
          gender: u.gender || ""
        }));
        if (u.id) {
          API.get(`/applications/my/${u.id}`)
            .then(res => {
              const names = (res.data || []).map(a => (a.scheme_name || "").toLowerCase());
              setAppliedSchemeNames(names);
            })
            .catch(e => console.error("Error loading applied schemes:", e));
        }
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [navigate]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, age: parseInt(form.age) || 30, income: parseFloat(form.income) || 0, family_size: parseInt(form.family_size) || 4 };
      const res = await API.post("/match-schemes", payload);
      setResults(res.data);
    } catch (err) {
      console.error("Match error:", err);
      alert(t("err_network") || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // ─── IF VISITOR (NOT LOGGED IN): RENDER PUBLIC DEMO SHOWCASE ───────────────────
  if (!user) {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0b192c 0%, #1e293b 100%)", color: "#ffffff", padding: "50px 24px", textAlign: "center" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255, 107, 0, 0.15)", border: "1px solid rgba(255, 107, 0, 0.3)", padding: "4px 14px", borderRadius: 20, color: "#ff6b00", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              🎯 AI Scheme Matcher Showcase
            </div>
            <h1 style={{ fontSize: "36px", fontWeight: 900, marginBottom: 10 }}>
              How <span style={{ color: "#ff6b00" }}>ArthMitra AI</span> Ranks Your Eligibility
            </h1>
            <p style={{ fontSize: "16px", color: "#94a3b8", maxWidth: 650, margin: "0 auto", lineHeight: 1.6 }}>
              Discover how our intelligent MapReduce decision engine evaluates 500+ government programs to recommend maximum financial and social security benefits.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px", flex: 1, width: "100%", boxSizing: "border-box" }}>
          
          {/* SECTION 1: HOW AI WORKS (4 STEPS) */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a" }}>How AI Works</h2>
              <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>4 simple automated steps to find your welfare benefits</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px", position: "relative" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#ff6b00", background: "rgba(255,107,0,0.1)", padding: "4px 10px", borderRadius: 6, display: "inline-block", marginBottom: 12 }}>STEP 1</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>User Creates Profile</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: 0 }}>Input basic details like state, age, and occupation using text or voice.</p>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#2563eb", background: "rgba(37,99,235,0.1)", padding: "4px 10px", borderRadius: 6, display: "inline-block", marginBottom: 12 }}>STEP 2</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>AI Analyzes Criteria</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: 0 }}>AI evaluates Age, Income, Occupation, Gender, Caste, State, and Family Size.</p>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#138808", background: "rgba(19,136,8,0.1)", padding: "4px 10px", borderRadius: 6, display: "inline-block", marginBottom: 12 }}>STEP 3</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>AI Matches Schemes</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: 0 }}>MapReduce engine ranks schemes by match confidence and cash benefit impact.</p>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#8b5cf6", background: "rgba(139,92,246,0.1)", padding: "4px 10px", borderRadius: 6, display: "inline-block", marginBottom: 12 }}>STEP 4</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>User Applies Direct</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: 0 }}>Submit application directly to Section Officer & DM verification pipeline.</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: DEMO EXAMPLE */}
          <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 16, padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", marginBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", background: "#fef2f2", border: "1px solid #fca5a5", padding: "4px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ⚠️ Sample AI Output (Demo Only)
                </span>
                <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginTop: 8 }}>Sample Citizen Profile Analysis</h3>
              </div>
              <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#334155" }}>
                <strong>Farmer</strong> • Maharashtra • Income: <strong>₹60,000/yr</strong>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {/* Card 1 */}
              <div style={{ background: "#fafaf8", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#138808" }}>🌾 Agriculture</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#138808", background: "#f0fdf4", padding: "3px 10px", borderRadius: 12, border: "1px solid #bbf7d0" }}>95% Match</span>
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>PM-Kisan Samman Nidhi</h4>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#138808", marginBottom: 8 }}>₹6,000 / year</div>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Direct income support transferred to eligible small & marginal landholder farmers.</p>
              </div>

              {/* Card 2 */}
              <div style={{ background: "#fafaf8", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ff6b00" }}>🏥 Healthcare</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#ff6b00", background: "#fff7ed", padding: "3px 10px", borderRadius: 12, border: "1px solid #fed7aa" }}>88% Match</span>
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Ayushman Bharat PM-JAY</h4>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#ff6b00", marginBottom: 8 }}>₹5 Lakhs Hospital Cover</div>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Cashless secondary & tertiary hospital treatment coverage for vulnerable households.</p>
              </div>

              {/* Card 3 */}
              <div style={{ background: "#fafaf8", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0d9488" }}>🏠 Social Welfare</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#0d9488", background: "#f0fdfa", padding: "3px 10px", borderRadius: 12, border: "1px solid #99f6e4" }}>74% Match</span>
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>PM Ujjwala Yojana 2.0</h4>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0d9488", marginBottom: 8 }}>Free LPG Connection</div>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Deposit-free gas connection with first refill and stove for low-income families.</p>
              </div>
            </div>
          </div>

          {/* CTA Banner */}
          <div style={{ background: "linear-gradient(90deg, #ff6b00 0%, #138808 100%)", color: "#ffffff", padding: "36px 28px", borderRadius: 16, textAlign: "center" }}>
            <h3 style={{ fontSize: "24px", fontWeight: 800, marginBottom: 8 }}>Ready to find your actual scheme eligibility?</h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", maxWidth: 600, margin: "0 auto 20px auto" }}>
              Log in to run the real AI Scheme Matcher model against your exact family income, state, caste category, and age.
            </p>
            <Link
              to="/login"
              style={{
                background: "#ffffff",
                color: "#0f172a",
                textDecoration: "none",
                padding: "12px 28px",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                display: "inline-block",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)"
              }}
            >
              Login to Generate Personalized Recommendations →
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ─── IF CITIZEN (AUTHENTICATED USER): RENDER INTERACTIVE REAL MATCHER ─────────
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", width: "100%", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255, 107, 0, 0.08)", border: "1px solid rgba(255, 107, 0, 0.2)", padding: "4px 14px", borderRadius: 20, color: "#ff6b00", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {t("match_badge") || "🎯 AI Scheme Matcher"}
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>
            {t("match_title") || "Find Your Eligible"} <span style={{ color: "#ff6b00" }}>{t("match_title_hl") || "Welfare Schemes"}</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#64748b", maxWidth: 600, margin: "0 auto", lineHeight: 1.5 }}>
            {t("match_subtitle") || "Our MapReduce AI model checks your household criteria against 500+ government programs to rank maximum cash & subsidy benefits."}
          </p>
        </div>

        {/* Form */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: 32 }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 20px 0" }}>{t("match_form_title") || "Enter Profile Criteria"}</h3>
          <form onSubmit={handleSearch}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{t("match_state_label") || "State of Residence"}</label>
                <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", fontSize: 14 }}>
                  {["Maharashtra","Uttar Pradesh","Tamil Nadu","West Bengal","Rajasthan","Karnataka","Gujarat","Madhya Pradesh","Bihar","Andhra Pradesh","Punjab","Haryana","Kerala","Odisha","Assam"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{t("match_occupation_label") || "Occupation"}</label>
                <input type="text" value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} placeholder={t("match_occupation_placeholder") || "Farmer, Labour, Student"} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{t("match_income_label") || "Annual Income (₹)"}</label>
                <input type="number" value={form.income} onChange={e => setForm({ ...form, income: e.target.value })} placeholder="60000" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{t("match_caste_label") || "Caste Category"}</label>
                <select value={form.caste} onChange={e => setForm({ ...form, caste: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", fontSize: 14 }}>
                  {[
                    { key: "General", label: t("caste_general") || "General" },
                    { key: "OBC", label: t("caste_obc") || "OBC" },
                    { key: "SC", label: t("caste_sc") || "SC" },
                    { key: "ST", label: t("caste_st") || "ST" },
                    { key: "EWS", label: t("caste_ews") || "EWS" }
                  ].map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{t("match_age_label") || "Age"}</label>
                <input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="35" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{t("match_family_label") || "Family Size"}</label>
                <input type="number" value={form.family_size} onChange={e => setForm({ ...form, family_size: e.target.value })} placeholder="4" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", fontSize: 14, boxSizing: "border-box" }} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ background: "linear-gradient(90deg, #ff6b00 0%, #f97316 100%)", color: "#ffffff", border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)" }}>
              {loading ? (t("match_btn_loading") || "Searching Schemes...") : (t("match_btn") || "🎯 Run AI Scheme Matcher")}
            </button>
          </form>
        </div>

        {loading && <Loader textKey="match_loader" />}

        {results && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {t("match_results_title") || "Matched Schemes"} ({results.total_schemes})
              </h3>
              <span style={{ fontSize: 13, background: "#f0fdf4", color: "#166534", padding: "4px 12px", borderRadius: 20, fontWeight: 700, border: "1px solid #bbf7d0" }}>
                {t("match_results_label") || "Top Matched Results"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {(results.schemes || []).map((s, idx) => {
                const sName = (s.scheme_name || s.name || "").toLowerCase();
                const isApplied = appliedSchemeNames.includes(sName);
                return <SchemeCard key={idx} scheme={s} isApplied={isApplied} />;
              })}
            </div>
          </div>
        )}
      </div>
      <SchemeChatBot />
      <Footer />
    </div>
  );
}