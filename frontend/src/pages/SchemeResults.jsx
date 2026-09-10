import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import SchemeCard from "../components/SchemeCard";
import Loader from "../components/Loader";
import Footer from "../components/Footer";

export default function SchemeResults() {
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await API.post("/match-schemes", {
        age: 35, income: "60000", occupation: "Farmer", state: "Maharashtra", caste: "OBC"
      });
      if (res.data.schemes) {
        setSchemes(res.data.schemes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", ...new Set(schemes.map(s => s.category).filter(Boolean))];
  const filteredSchemes = filterCategory === "All" ? schemes : schemes.filter(s => s.category === filterCategory);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>
            Recommended <span style={{ color: "#138808" }}>Welfare Benefits</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#64748b", maxWidth: 600, margin: "0 auto" }}>
            Explore schemes ranked by maximum eligibility and financial assistance.
          </p>
        </div>

        {/* Category Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: "1px solid #cbd5e1",
                background: filterCategory === cat ? "#0f172a" : "#ffffff",
                color: filterCategory === cat ? "#ffffff" : "#334155",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <Loader text="Fetching scheme results..." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {filteredSchemes.map((s, idx) => (
              <SchemeCard key={idx} scheme={s} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}