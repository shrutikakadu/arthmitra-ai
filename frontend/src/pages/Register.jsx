import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useLanguage } from "../LanguageContext";

const STATES = [
  "Maharashtra", "Uttar Pradesh", "Tamil Nadu", "West Bengal", "Rajasthan",
  "Karnataka", "Gujarat", "Madhya Pradesh", "Bihar", "Andhra Pradesh",
  "Punjab", "Haryana", "Kerala", "Odisha", "Assam", "Other"
];

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !mobile || !password || !state) {
      setError(t("reg_error_fill"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/register", { name, mobile, password, state, language });
      if (res.data.status === "success") {
        const loginRes = await API.post("/auth/login", { mobile, password });
        if (loginRes.data.status === "success" && loginRes.data.user) {
          localStorage.setItem("user", JSON.stringify(loginRes.data.user));
          navigate("/dashboard");
        } else {
          navigate("/login");
        }
      } else {
        setError(res.data.message || t("err_generic"));
      }
    } catch (err) {
      console.error("Register error:", err);
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (detail === "Mobile already registered") {
          setError(t("reg_error_mobile_exists"));
        } else {
          setError(detail);
        }
      } else if (err.message) {
        setError(`Error: ${err.message}`);
      } else {
        setError(t("err_generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0b1f14 0%, #132a1c 50%, #0d1a12 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "480px", background: "rgba(18, 38, 25, 0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(74, 222, 128, 0.2)", borderRadius: "20px", padding: "36px 32px", boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "42px", marginBottom: "8px" }}>📜</div>
          <h1 style={{ color: "#ffffff", fontSize: "26px", fontWeight: "700", margin: "0 0 6px 0" }}>{t("reg_title")}</h1>
          <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>{t("reg_subtitle")}</p>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#fca5a5", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", marginBottom: "20px" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: "#d1d5db", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>{t("reg_name_label")}</label>
            <input type="text" placeholder={t("reg_name_placeholder")} value={name} onChange={(e) => setName(e.target.value)} required
              style={{ width: "100%", padding: "12px 14px", background: "rgba(10, 25, 16, 0.7)", border: "1px solid rgba(74, 222, 128, 0.25)", borderRadius: "10px", color: "#ffffff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: "#d1d5db", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>{t("reg_mobile_label")}</label>
            <input type="text" placeholder={t("reg_mobile_placeholder")} value={mobile} onChange={(e) => setMobile(e.target.value)} required
              style={{ width: "100%", padding: "12px 14px", background: "rgba(10, 25, 16, 0.7)", border: "1px solid rgba(74, 222, 128, 0.25)", borderRadius: "10px", color: "#ffffff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: "#d1d5db", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>{t("reg_state_label")}</label>
            <select value={state} onChange={(e) => setState(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", background: "rgba(10, 25, 16, 0.9)", border: "1px solid rgba(74, 222, 128, 0.25)", borderRadius: "10px", color: "#ffffff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}>
              {STATES.map((s) => (<option key={s} value={s} style={{ background: "#0d1a12", color: "#ffffff" }}>{s}</option>))}
            </select>
          </div>

          <div style={{ marginBottom: "22px" }}>
            <label style={{ display: "block", color: "#d1d5db", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>{t("reg_password_label")}</label>
            <input type="password" placeholder={t("reg_password_placeholder")} value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ width: "100%", padding: "12px 14px", background: "rgba(10, 25, 16, 0.7)", border: "1px solid rgba(74, 222, 128, 0.25)", borderRadius: "10px", color: "#ffffff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "13px", background: loading ? "#2e7d32" : "linear-gradient(90deg, #ff6b00 0%, #f97316 100%)", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)", transition: "transform 0.1s ease" }}>
            {loading ? t("reg_submitting") : t("reg_submit")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "14px", color: "#9ca3af" }}>
          {t("reg_have_account")}{" "}
          <Link to="/login" style={{ color: "#ff6b00", fontWeight: "600", textDecoration: "none" }}>{t("reg_login_link")}</Link>
        </div>
      </div>
    </div>
  );
}