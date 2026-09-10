import { useLanguage } from "../LanguageContext";

export default function Loader({ textKey, text }) {
  const { t } = useLanguage();
  // Allow either a direct text prop (for static strings) or a translation key
  const label = textKey ? t(textKey) : (text || t("loading_arthmitra"));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 16, color: "#475569", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: 44, height: 44, border: "3.5px solid rgba(255, 107, 0, 0.15)", borderTop: "3.5px solid #ff6b00", borderRight: "3.5px solid #138808", borderRadius: "50%", animation: "arthmitra-spin 0.8s linear infinite" }} />
      <style>{`
        @keyframes arthmitra-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>{label}</div>
    </div>
  );
}
