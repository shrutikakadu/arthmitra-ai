import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import ScoreGauge from "../components/ScoreGauge";
import Loader from "../components/Loader";
import Footer from "../components/Footer";
import { useLanguage } from "../LanguageContext";

export default function FinancialHealth({ embedded = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.role && u.role !== "user") {
          if (!embedded) navigate(u.role === "minister" ? "/minister" : "/admin");
          return;
        }
        setUser(u);
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [navigate, embedded]);

  useEffect(() => {
    if (user || embedded) {
      fetchHealthScore();
    }
  }, [user, embedded]);

  const fetchHealthScore = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem("user");
      const u = stored ? JSON.parse(stored) : {};
      const res = await API.post("/health-score", {
        age: u.age || 35,
        income: u.income || "60000",
        occupation: u.occupation || "Farmer",
        caste: u.caste || "OBC",
        family_size: u.family_size || 4,
        gender: u.gender || "Male",
        education: u.education || "10th Pass"
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── IF VISITOR (NOT LOGGED IN & NOT EMBEDDED): PUBLIC DEMO SHOWCASE ─────────
  if (!user && !embedded) {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, #0b192c 0%, #1e293b 100%)", color: "#ffffff", padding: "50px 24px", textAlign: "center" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(19, 136, 8, 0.15)", border: "1px solid rgba(19, 136, 8, 0.3)", padding: "4px 14px", borderRadius: 20, color: "#4ade80", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              📊 Financial Health Showcase
            </div>
            <h1 style={{ fontSize: "36px", fontWeight: 900, marginBottom: 10 }}>
              Understanding Your <span style={{ color: "#4ade80" }}>Financial Health Score</span>
            </h1>
            <p style={{ fontSize: "16px", color: "#94a3b8", maxWidth: 650, margin: "0 auto", lineHeight: 1.6 }}>
              ArthMitra AI evaluates 5 key financial security dimensions to measure your household's overall social protection and economic resilience.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px", flex: 1, width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 32, alignItems: "start", marginBottom: 40 }}>
            
            {/* Radial Gauge Card */}
            <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 20, padding: "32px 24px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#fef2f2", border: "1px solid #fca5a5", padding: "4px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ⚠️ Example Health Score
              </span>
              <div style={{ margin: "24px 0 16px 0" }}>
                <ScoreGauge score={78} grade="B+" label="Good Standing" />
              </div>
              <h3 style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", margin: "8px 0 4px 0" }}>78 / 100</h3>
              <p style={{ fontSize: 14, color: "#166534", fontWeight: 700, background: "#f0fdf4", display: "inline-block", padding: "4px 14px", borderRadius: 12 }}>
                Good Social Security Protection
              </p>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 14, lineHeight: 1.5 }}>
                Sample household score based on active welfare schemes, insurance coverage, and micro-savings ratio.
              </p>
            </div>

            {/* 5 Factor Breakdown Explanation */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                5 Factors Used in Score Calculation
              </h3>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
                Our AI model evaluates your profile against these five core pillars of financial stability:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24, background: "#f0fdf4", padding: 8, borderRadius: 10, flexShrink: 0 }}>🌾</div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>1. Income Stability</h4>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0 0", lineHeight: 1.4 }}>Evaluates regularity of agricultural, labour, or salary income against household size.</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24, background: "#fff7ed", padding: 8, borderRadius: 10, flexShrink: 0 }}>🎯</div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>2. Scheme Coverage</h4>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0 0", lineHeight: 1.4 }}>Measures how many eligible central/state subsidies & direct benefit transfers you claim.</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24, background: "#eff6ff", padding: 8, borderRadius: 10, flexShrink: 0 }}>🐷</div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>3. Savings Potential</h4>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0 0", lineHeight: 1.4 }}>Checks monthly savings capacity for Post Office RD, Jan Dhan SIPs, and micro-deposits.</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24, background: "#fcf4ff", padding: 8, borderRadius: 10, flexShrink: 0 }}>🏥</div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>4. Insurance & Pension</h4>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0 0", lineHeight: 1.4 }}>Assesses Ayushman health insurance, PMJJBY life cover, and Atal pension protection.</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24, background: "#fefce8", padding: 8, borderRadius: 10, flexShrink: 0 }}>🎓</div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>5. Education & Welfare Benefits</h4>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0 0", lineHeight: 1.4 }}>Includes scholarship eligibility and girl child welfare (Sukanya Samriddhi) readiness.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Banner */}
          <div style={{ background: "linear-gradient(90deg, #138808 0%, #059669 100%)", color: "#ffffff", padding: "36px 28px", borderRadius: 16, textAlign: "center" }}>
            <h3 style={{ fontSize: "24px", fontWeight: 800, marginBottom: 8 }}>Calculate your actual Financial Health Score</h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", maxWidth: 600, margin: "0 auto 20px auto" }}>
              Login to complete your profile and calculate your family's actual score out of 100 with a personalized improvement roadmap.
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
              Login to Calculate Your Actual Financial Health Score →
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ─── CITIZEN MODE / EMBEDDED IN DASHBOARD: REAL SCORE CALCULATION ────────────
  return (
    <div style={{ background: embedded ? "transparent" : "#f8fafc", minHeight: embedded ? "auto" : "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: embedded ? "0" : "0 auto", padding: embedded ? "0" : "40px 24px", width: "100%", boxSizing: "border-box" }}>

        {/* Header */}
        {!embedded && (
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(19, 136, 8, 0.08)", border: "1px solid rgba(19, 136, 8, 0.2)", padding: "4px 14px", borderRadius: 20, color: "#138808", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              {t("health_badge") || "📊 Financial Health Intelligence"}
            </div>
            <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>
              {t("health_title") || "Family Financial"} <span style={{ color: "#138808" }}>{t("health_title_hl") || "Health Score"}</span>
            </h1>
            <p style={{ fontSize: "16px", color: "#64748b", maxWidth: 600, margin: "0 auto" }}>
              {t("health_subtitle") || "Comprehensive 5-dimension evaluation of your household's social security, scheme coverage, and savings potential."}
            </p>
          </div>
        )}

        {loading ? (
          <Loader textKey="health_loader" />
        ) : data ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, alignItems: "start" }}>

            {/* Gauge */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", textAlign: "center" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 12px 0" }}>{t("health_rating_label") || "Overall Health Rating"}</h3>
              <ScoreGauge score={data.score} grade={data.grade} label={data.score >= 70 ? (t("health_standing_good") || "Good Standing") : (t("health_standing_moderate") || "Moderate Standing")} />
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginTop: 12 }}>{data.summary}</p>
            </div>

            {/* Breakdown & Roadmap */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 16px 0" }}>{t("health_breakdown_title") || "5-Dimension Score Breakdown"}</h3>
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
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 16px 0" }}>{t("health_roadmap_title") || "🚀 Personalised Improvement Roadmap"}</h3>
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
      {!embedded && <Footer />}
    </div>
  );
}