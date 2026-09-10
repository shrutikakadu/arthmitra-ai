import { useNavigate } from "react-router-dom";

export default function SchemeCard({ scheme, onClick }) {
  const navigate = useNavigate();
  if (!scheme) return null;

  const schemeName = scheme.scheme_name || scheme.name || "Government Scheme";
  const category = scheme.category || "Welfare";
  const benefit = scheme.benefit || "Financial Aid";
  const match = scheme.match_probability || scheme.match || 80;
  const reasons = scheme.reasons || [];

  const handleClick = () => {
    if (onClick) {
      onClick(scheme);
    } else {
      navigate(`/scheme/${encodeURIComponent(schemeName)}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: "#ffffff",
        border: "1.5px solid #ede8e1",
        borderLeft: `5px solid ${match >= 85 ? "#138808" : "#FF6B00"}`,
        borderRadius: "12px",
        padding: "20px",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
      }}
    >
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 12 }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
            {schemeName}
          </div>
          <span style={{
            fontSize: "12px",
            fontWeight: 700,
            color: match >= 85 ? "#138808" : "#FF6B00",
            background: match >= 85 ? "rgba(19, 136, 8, 0.08)" : "rgba(255, 107, 0, 0.08)",
            padding: "3px 10px",
            borderRadius: "100px",
            whiteSpace: "nowrap"
          }}>
            {match}% Match
          </span>
        </div>

        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: 8 }}>
          Category: <span style={{ fontWeight: 600, color: "#334155" }}>{category}</span> • Benefit: <strong style={{ color: "#138808" }}>{benefit}</strong>
        </div>

        {reasons.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {reasons.slice(0, 3).map((r, i) => (
              <span key={i} style={{ fontSize: "11px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "2px 8px", borderRadius: 4, color: "#475569" }}>
                ✓ {r}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#ff6b00", fontWeight: 600 }}>
        <span>View Details & Requirements</span>
        <span>→</span>
      </div>
    </div>
  );
}
