import { Link } from "react-router-dom";
import { useLanguage } from "../LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer style={{ background: "#090d16", color: "#94a3b8", padding: "32px 24px 24px 24px", marginTop: "auto", borderTop: "1px solid rgba(255, 255, 255, 0.08)", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 24 }}>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: "20px" }}>🌿</span>
            <span style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff" }}>
              Arth<span style={{ color: "#ff6b00" }}>Mitra</span>{" "}
              <span style={{ fontSize: 11, background: "rgba(19, 136, 8, 0.2)", color: "#4ade80", padding: "2px 6px", borderRadius: 10, fontWeight: 600 }}>AI</span>
            </span>
          </div>
          <p style={{ color: "#64748b", lineHeight: 1.5, margin: 0 }}>{t("footer_tagline")}</p>
        </div>

        <div>
          <h4 style={{ color: "#ffffff", fontSize: "14px", fontWeight: 700, margin: "0 0 12px 0" }}>{t("footer_project")}</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, color: "#64748b" }}>
            <div><strong>{t("footer_team_label")}</strong> {t("footer_team_val")}</div>
            <div><strong>{t("footer_engineer_label")}</strong> {t("footer_engineer_val")}</div>
            <div><strong>{t("footer_guide_label")}</strong> {t("footer_guide_val")}</div>
            <div><strong>{t("footer_domain_label")}</strong> {t("footer_domain_val")}</div>
          </div>
        </div>

        <div>
          <h4 style={{ color: "#ffffff", fontSize: "14px", fontWeight: 700, margin: "0 0 12px 0" }}>{t("footer_quick_links")}</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Link to="/match" style={{ color: "#94a3b8", textDecoration: "none" }}>{t("footer_scheme_matcher")}</Link>
            <Link to="/health" style={{ color: "#94a3b8", textDecoration: "none" }}>{t("footer_health")}</Link>
            <Link to="/savings" style={{ color: "#94a3b8", textDecoration: "none" }}>{t("footer_savings")}</Link>
            <Link to="/voice" style={{ color: "#94a3b8", textDecoration: "none" }}>{t("footer_voice")}</Link>
            <Link to="/dc-panel" style={{ color: "#ff6b00", textDecoration: "none", fontWeight: 600 }}>🖧 {t("footer_dc_panel")}</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", paddingTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, color: "#64748b", fontSize: "12px" }}>
        <div>© 2026 <strong>ArthMitra AI</strong> — {t("footer_rights")}</div>
        <div>{t("footer_built")}</div>
      </div>
    </footer>
  );
}
