import { useState, useEffect } from "react";
import API from "../api/axios";
import SchemeCard from "../components/SchemeCard";
import Loader from "../components/Loader";
import Footer from "../components/Footer";
import { useLanguage } from "../LanguageContext";
import SchemeChatBot from "../components/SchemeChatBot";

export default function SchemeMatcher() {
  const { t } = useLanguage();
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
      } catch (e) {}
    }
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, age: parseInt(form.age) || 30, income: parseFloat(form.income) || 0, family_size: parseInt(form.family_size) || 4 };
      const res = await API.post("/match-schemes", payload);
      setResults(res.data);
    } catch (err) {
      console.error("Match error:", err);
      alert(t("err_network"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", width: "100%", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255, 107, 0, 0.08)", border: "1px solid rgba(255, 107, 0, 0.2)", padding: "4px 14px", borderRadius: 20, color: "#ff6b00", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {t("match_badge")}
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>
            {t("match_title")} <span style={{ color: "#ff6b00" }}>{t("match_title_hl")}</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#64748b", maxWidth: 600, margin: "0 auto", lineHeight: 1.5 }}>{t("match_subtitle")}</p>
        </div>

        {/* Form */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: 32 }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 20px 0" }}>{t("match_form_title")}</h3>
          <form onSubmit={handleSearch}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{t("match_state_label")}</label>
                <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", fontSize: 14 }}>
                  {["Maharashtra","Uttar Pradesh","Tamil Nadu","West Bengal","Rajasthan","Karnataka","Gujarat","Madhya Pradesh","Bihar","Andhra Pradesh","Punjab","Haryana","Kerala","Odisha","Assam"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{t("match_occupation_label")}</label>
                <input type="text" value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} placeholder={t("match_occupation_placeholder")} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{t("match_income_label")}</label>
                <input type="number" value={form.income} onChange={e => setForm({ ...form, income: e.target.value })} placeholder="60000" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{t("match_caste_label")}</label>
                <select value={form.caste} onChange={e => setForm({ ...form, caste: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", fontSize: 14 }}>
                  {[
                    { key: "General", label: t("caste_general") },
                    { key: "OBC", label: t("caste_obc") },
                    { key: "SC", label: t("caste_sc") },
                    { key: "ST", label: t("caste_st") },
                    { key: "EWS", label: t("caste_ews") }
                  ].map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{t("match_age_label")}</label>
                <input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="35" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{t("match_family_label")}</label>
                <input type="number" value={form.family_size} onChange={e => setForm({ ...form, family_size: e.target.value })} placeholder="4" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", fontSize: 14, boxSizing: "border-box" }} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ background: "linear-gradient(90deg, #ff6b00 0%, #f97316 100%)", color: "#ffffff", border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)" }}>
              {loading ? t("match_btn_loading") : t("match_btn")}
            </button>
          </form>
        </div>

        {loading && <Loader textKey="match_loader" />}

        {results && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {t("match_results_title")} ({results.total_schemes})
              </h3>
              <span style={{ fontSize: 13, background: "#f0fdf4", color: "#166534", padding: "4px 12px", borderRadius: 20, fontWeight: 700, border: "1px solid #bbf7d0" }}>
                {t("match_results_label")}
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