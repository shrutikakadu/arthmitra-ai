import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import SavingsChart from "../components/SavingsChart";
import Loader from "../components/Loader";
import Footer from "../components/Footer";
import { useLanguage } from "../LanguageContext";

export default function SavingsPlanner({ embedded = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // Inputs for profile/manual adjustment
  const [form, setForm] = useState({
    income: "60000",
    age: 35,
    family_size: 4,
    occupation: "Farmer"
  });

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
        const initialForm = {
          income: u.income ? String(u.income) : "60000",
          age: u.age ? Number(u.age) : 35,
          family_size: u.family_size ? Number(u.family_size) : 4,
          occupation: u.occupation || "Farmer"
        };
        setForm(initialForm);
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [navigate, embedded]);

  useEffect(() => {
    if (user || embedded) {
      fetchSavingsPlan();
    }
  }, [user, embedded]);

  const fetchSavingsPlan = async (overrideForm = null) => {
    setLoading(true);
    try {
      const currentForm = overrideForm || form;
      const res = await API.post("/savings-plan", {
        income: currentForm.income || "60000",
        age: Number(currentForm.age) || 35,
        family_size: Number(currentForm.family_size) || 4,
        occupation: currentForm.occupation || "Farmer"
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    fetchSavingsPlan();
  };

  // ─── IF VISITOR (NOT LOGGED IN & NOT EMBEDDED): PUBLIC DEMO SHOWCASE ─────────
  if (!user && !embedded) {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, #0b192c 0%, #1e293b 100%)", color: "#ffffff", padding: "50px 24px", textAlign: "center" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(37, 99, 235, 0.15)", border: "1px solid rgba(37, 99, 235, 0.3)", padding: "4px 14px", borderRadius: 20, color: "#60a5fa", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              {t("savings_vis_badge")}
            </div>
            <h1 style={{ fontSize: "36px", fontWeight: 900, marginBottom: 10 }}>
              {t("savings_vis_title_1")}<span style={{ color: "#60a5fa" }}>{t("savings_vis_title_hl")}</span>{t("savings_vis_title_2")}
            </h1>
            <p style={{ fontSize: "16px", color: "#94a3b8", maxWidth: 650, margin: "0 auto", lineHeight: 1.6 }}>
              {t("savings_vis_subtitle")}
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px", flex: 1, width: "100%", boxSizing: "border-box" }}>
          
          {/* Example Demo Cards */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", background: "#fef2f2", border: "1px solid #fca5a5", padding: "4px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ⚠️ Demo Projections
              </span>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginTop: 8 }}>{t("savings_vis_sample_title")}</h3>
            </div>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "8px 16px", fontSize: 13, color: "#1e40af" }}>
              {t("savings_vis_sample_income")}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{t("savings_vis_plan1_title")}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>{t("savings_vis_plan1_desc")}</div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#138808" }}>{t("savings_vis_plan2_title")}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>{t("savings_vis_plan2_desc")}</div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#2563eb" }}>{t("savings_vis_plan3_title")}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>{t("savings_vis_plan3_desc")}</div>
            </div>
          </div>

          {/* 5-Year Growth Projections Chart */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: 36 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>{t("savings_vis_sample_title")}</h3>
                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>{t("savings_vis_subtitle")}</p>
              </div>
              <span style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: 6, fontWeight: 700 }}>{t("demo_chart_badge")}</span>
            </div>

            <SavingsChart title="Sample Growth Projections" />
          </div>

          {/* CTA Banner */}
          <div style={{ background: "linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)", color: "#ffffff", padding: "36px 28px", borderRadius: 16, textAlign: "center" }}>
            <h3 style={{ fontSize: "24px", fontWeight: 800, marginBottom: 8 }}>{t("savings_vis_cta_title")}</h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", maxWidth: 600, margin: "0 auto 20px auto" }}>
              {t("savings_vis_cta_desc")}
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
              {t("savings_vis_cta_title")} →
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ─── CITIZEN MODE / EMBEDDED IN DASHBOARD: REAL INTERACTIVE SAVINGS PLANNER ──
  return (
    <div
      style={{
        background: embedded ? "transparent" : "#f8fafc",
        minHeight: embedded ? "auto" : "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: embedded ? "0" : "0 auto",
          padding: embedded ? "0" : "40px 24px",
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        {/* Header */}
        {!embedded && (
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(59, 130, 246, 0.08)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                padding: "4px 14px",
                borderRadius: 20,
                color: "#2563eb",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 12
              }}
            >
              {t("savings_badge") || "🐷 Micro-Savings Planner"}
            </div>
            <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>
              {t("savings_title") || "Personalised"} <span style={{ color: "#2563eb" }}>{t("savings_title_hl") || "Government Micro-Savings"}</span>
            </h1>
            <p style={{ fontSize: "16px", color: "#64748b", maxWidth: 600, margin: "0 auto" }}>
              {t("savings_subtitle") || "Secure your family's future with Post Office RD, Jan Dhan SIPs, and Kisan Vikas Patra tailored to your monthly capacity."}
            </p>
          </div>
        )}

        {/* Profile / Manual Input Form */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "20px 24px",
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
            {t("savings_params_title")}
          </div>
          <form onSubmit={handleCalculate} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
                {t("field_income")}
              </label>
              <input
                type="number"
                value={form.income}
                onChange={(e) => setForm({ ...form, income: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
                {t("field_age")}
              </label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
                {t("field_occupation")}
              </label>
              <input
                type="text"
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
                {t("field_family_size")}
              </label>
              <input
                type="number"
                value={form.family_size}
                onChange={(e) => setForm({ ...form, family_size: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {t("btn_recalculate")}
            </button>
          </form>
        </div>

        {loading ? (
          <Loader textKey="savings_loader" />
        ) : data ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Overview Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px" }}>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{t("savings_monthly_capacity") || "Monthly Savings Capacity"}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#138808", marginTop: 4 }}>
                  ₹{data.monthly_savings_capacity?.toLocaleString()}{" "}
                  <span style={{ fontSize: 13, color: "#64748b" }}>{t("savings_per_month") || "/mo"}</span>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px" }}>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{t("savings_total_commitment") || "Total Recommended Commitment"}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#ff6b00", marginTop: 4 }}>
                  ₹{data.total_monthly_commitment?.toLocaleString()}{" "}
                  <span style={{ fontSize: 13, color: "#64748b" }}>{t("savings_per_month") || "/mo"}</span>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px" }}>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{t("savings_top_plan") || "Top Recommended Plan"}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#2563eb", marginTop: 4 }}>{data.best_plan}</div>
              </div>
            </div>

            {/* Chart */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
              }}
            >
              <SavingsChart title={t("chart_5yr_projections")} />
            </div>

            {/* Instruments */}
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "12px 0 0 0" }}>
              {t("savings_instruments_title") || "Recommended Savings Instruments"}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
              {(data.plans || []).map((plan, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>{plan.icon}</span>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{plan.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {plan.type} • <strong style={{ color: "#138808" }}>{plan.risk}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, color: "#2563eb", margin: "12px 0 8px 0" }}>
                      {plan.monthly_amount > 0
                        ? `₹${plan.monthly_amount}/month`
                        : `Lump sum: ₹${plan.lump_sum?.toLocaleString()}`}
                      {plan.interest_rate > 0 && (
                        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                          {" "}
                          ({plan.interest_rate}% p.a.)
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginBottom: 12 }}>
                      <strong>{t("savings_best_for") || "Best For:"}</strong> {plan.best_for}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "#fafaf8",
                      border: "1px solid #f1f5f9",
                      borderRadius: 8,
                      padding: "10px",
                      fontSize: 12,
                      color: "#334155"
                    }}
                  >
                    💡 <strong>{t("savings_how_to") || "How to Open:"}</strong> {plan.how_to}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {!embedded && <Footer />}
    </div>
  );
}