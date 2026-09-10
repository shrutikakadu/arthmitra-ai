import { useState, useEffect } from "react";
import API from "../api/axios";
import ScoreGauge from "../components/ScoreGauge";
import Loader from "../components/Loader";
import Footer from "../components/Footer";
import { useLanguage } from "../LanguageContext";

export default function FinancialHealth() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => { fetchHealthScore(); }, []);

  const fetchHealthScore = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : {};
      const res = await API.post("/health-score", {
        age: user.age || 35,
        income: user.income || "60000",
        occupation: user.occupation || "Farmer",
        caste: user.caste || "OBC",
        family_size: user.family_size || 4,
        gender: user.gender || "Male",
        education: user.education || "10th Pass"
      });
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", width: "100%", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(19, 136, 8, 0.08)", border: "1px solid rgba(19, 136, 8, 0.2)", padding: "4px 14px", borderRadius: 20, color: "#138808", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {t("health_badge")}
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>
            {t("health_title")} <span style={{ color: "#138808" }}>{t("health_title_hl")}</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#64748b", maxWidth: 600, margin: "0 auto" }}>{t("health_subtitle")}</p>
        </div>

        {loading ? (
          <Loader textKey="health_loader" />
        ) : data ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, alignItems: "start" }}>

            {/* Gauge */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", textAlign: "center" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 12px 0" }}>{t("health_rating_label")}</h3>
              <ScoreGauge score={data.score} grade={data.grade} label={data.score >= 70 ? t("health_standing_good") : t("health_standing_moderate")} />
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginTop: 12 }}>{data.summary}</p>
            </div>

            {/* Breakdown & Roadmap */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 16px 0" }}>{t("health_breakdown_title")}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {Object.entries(data.dimensions || {}).map(([key, dim]) => (
                    <div key={key}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#334155", marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{dim.label}</span>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{dim.score} / {dim.max} pts</span>
                      </div>
                      <div style={{ height: 8, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(dim.score / dim.max) * 100}%`, background: "linear-gradient(90deg, #ff6b00 0%, #138808 100%)", borderRadius: 10 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {data.roadmap && data.roadmap.length > 0 && (
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 16px 0" }}>{t("health_roadmap_title")}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {data.roadmap.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 8, border: "1px solid #f1f5f9", background: "#fafaf8" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: item.priority === "HIGH" ? "#fef2f2" : "#f0fdf4", color: item.priority === "HIGH" ? "#ef4444" : "#166534" }}>{item.priority}</span>
                          <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{item.action}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#138808", background: "rgba(19, 136, 8, 0.08)", padding: "2px 8px", borderRadius: 12 }}>{item.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
      <Footer />
    </div>
  );
}