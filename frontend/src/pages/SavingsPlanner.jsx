import { useState, useEffect } from "react";
import API from "../api/axios";
import SavingsChart from "../components/SavingsChart";
import Loader from "../components/Loader";
import Footer from "../components/Footer";
import { useLanguage } from "../LanguageContext";

export default function SavingsPlanner() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => { fetchSavingsPlan(); }, []);

  const fetchSavingsPlan = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : {};
      const res = await API.post("/savings-plan", {
        income: user.income || "60000",
        age: user.age || 35,
        family_size: user.family_size || 4,
        occupation: user.occupation || "Farmer"
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
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "4px 14px", borderRadius: 20, color: "#2563eb", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {t("savings_badge")}
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>
            {t("savings_title")} <span style={{ color: "#2563eb" }}>{t("savings_title_hl")}</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#64748b", maxWidth: 600, margin: "0 auto" }}>{t("savings_subtitle")}</p>
        </div>

        {loading ? (
          <Loader textKey="savings_loader" />
        ) : data ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Overview Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px" }}>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{t("savings_monthly_capacity")}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#138808", marginTop: 4 }}>
                  ₹{data.monthly_savings_capacity?.toLocaleString()} <span style={{ fontSize: 13, color: "#64748b" }}>{t("savings_per_month")}</span>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px" }}>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{t("savings_total_commitment")}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#ff6b00", marginTop: 4 }}>
                  ₹{data.total_monthly_commitment?.toLocaleString()} <span style={{ fontSize: 13, color: "#64748b" }}>{t("savings_per_month")}</span>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px" }}>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{t("savings_top_plan")}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#2563eb", marginTop: 4 }}>{data.best_plan}</div>
              </div>
            </div>

            {/* Chart */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <SavingsChart title="1, 3, and 5 Year Growth Projections across Recommended Instruments" />
            </div>

            {/* Instruments */}
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "12px 0 0 0" }}>{t("savings_instruments_title")}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
              {(data.plans || []).map((plan, idx) => (
                <div key={idx} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>{plan.icon}</span>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{plan.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{plan.type} • <strong style={{ color: "#138808" }}>{plan.risk}</strong></div>
                      </div>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, color: "#2563eb", margin: "12px 0 8px 0" }}>
                      {plan.monthly_amount > 0 ? `₹${plan.monthly_amount}/month` : `Lump sum: ₹${plan.lump_sum?.toLocaleString()}`}
                      {plan.interest_rate > 0 && <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}> ({plan.interest_rate}% p.a.)</span>}
                    </div>

                    <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginBottom: 12 }}>
                      <strong>{t("savings_best_for")}</strong> {plan.best_for}
                    </p>
                  </div>

                  <div style={{ background: "#fafaf8", border: "1px solid #f1f5f9", borderRadius: 8, padding: "10px", fontSize: 12, color: "#334155" }}>
                    💡 <strong>{t("savings_how_to")}</strong> {plan.how_to}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <Footer />
    </div>
  );
}