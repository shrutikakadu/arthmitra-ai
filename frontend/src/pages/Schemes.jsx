import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { useLanguage } from "../LanguageContext";

const PUBLIC_SCHEMES = [
  {
    name: "PM-Kisan Samman Nidhi",
    category: "🌾 Agriculture & Farmers",
    benefit: "₹6,000 / year",
    target: "Small & Marginal Farmer Families",
    icon: "🌾",
    color: "#138808",
    desc: "Provides direct financial support of ₹6,000 per year in three equal quarterly installments transferred directly into Aadhaar-seeded bank accounts."
  },
  {
    name: "Ayushman Bharat PM-JAY",
    category: "🏥 Healthcare & Insurance",
    benefit: "₹5 Lakhs Cover / Family / Year",
    target: "Low Income & Vulnerable Families",
    icon: "🏥",
    color: "#ff6b00",
    desc: "World's largest health assurance scheme offering secondary and tertiary hospitalization cover up to ₹5 Lakhs per family across empaneled hospitals."
  },
  {
    name: "PM Ujjwala Yojana 2.0",
    category: "🏠 Clean Fuel & Social Welfare",
    benefit: "Free LPG Connection + First Refill",
    target: "Women from BPL Households",
    icon: "🔥",
    color: "#0d9488",
    desc: "Deposit-free LPG gas connections with first cylinder refill and stove free of cost to women from low-income households to promote clean cooking fuel."
  },
  {
    name: "PM Awas Yojana (PMAY)",
    category: "🏗️ Housing for All",
    benefit: "Up to ₹2.67 Lakh Subsidy",
    target: "EWS, LIG, & Middle Income Groups",
    icon: "🏡",
    color: "#2563eb",
    desc: "Provides interest subsidies and financial aid for building durable pucca houses with basic amenities like water, electricity, and sanitation."
  },
  {
    name: "Sukanya Samriddhi Yojana",
    category: "👧 Girl Child Welfare & Savings",
    benefit: "8.2% Interest Rate (Tax Free)",
    target: "Parents of Girl Child below 10 Years",
    icon: "💎",
    color: "#ec4899",
    desc: "Government-backed high-interest savings scheme designed exclusively to build higher education and marriage funds for girl children."
  },
  {
    name: "Atal Pension Yojana (APY)",
    category: "👵 Old Age Social Security",
    benefit: "Guaranteed Pension ₹1,000 to ₹5,000/mo",
    target: "Unorganized Sector Workers (18-40 Yrs)",
    icon: "👴",
    color: "#8b5cf6",
    desc: "Guaranteed monthly pension scheme for workers in the unorganized sector, co-contributed by the Government of India upon retirement at age 60."
  },
  {
    name: "National Pension Scheme (NPS)",
    category: "📈 Retirement & Investment",
    benefit: "Market-linked Returns + Tax Benefits",
    target: "All Indian Citizens (18-70 Yrs)",
    icon: "📊",
    color: "#0284c7",
    desc: "Voluntary long-term investment plan regulated by PFRDA offering systematic pension accumulation with additional tax deductions under Sec 80CCD."
  },
  {
    name: "PM Mudra Loan Yojana",
    category: "💼 MSME & Micro Finance",
    benefit: "Loans up to ₹10 Lakhs (No Collateral)",
    target: "Micro Enterprises & Small Vendors",
    icon: "💳",
    color: "#16a34a",
    desc: "Collateral-free business loans under Shishu (up to ₹50k), Kishor (up to ₹5L), and Tarun (up to ₹10L) categories to foster entrepreneurship."
  }
];

export default function Schemes() {
  const { t } = useLanguage();

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Hero / Header Banner */}
      <section style={{
        background: "linear-gradient(135deg, #0b192c 0%, #1e293b 100%)",
        color: "#ffffff",
        padding: "60px 24px 50px 24px",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255, 107, 0, 0.15)",
            border: "1px solid rgba(255, 107, 0, 0.3)",
            padding: "6px 16px",
            borderRadius: 20,
            color: "#ff6b00",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16
          }}>
            🏛️ Public Information Portal
          </div>

          <h1 style={{ fontSize: "40px", fontWeight: 900, marginBottom: 12, letterSpacing: "-0.5px" }}>
            Government <span style={{ color: "#4ade80" }}>Welfare Schemes</span> Directory
          </h1>

          <p style={{ fontSize: "16px", color: "#94a3b8", maxWidth: 700, margin: "0 auto", lineHeight: 1.6 }}>
            Explore flagship Central and State welfare programs designed to provide direct financial assistance, healthcare, housing, pension, and employment support.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px", flex: 1, width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, marginBottom: 48 }}>
          {PUBLIC_SCHEMES.map((scheme, idx) => (
            <div
              key={idx}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                transition: "transform 0.2s ease, boxShadow 0.2s ease"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: "28px" }}>{scheme.icon}</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: scheme.color,
                    background: `${scheme.color}12`,
                    border: `1px solid ${scheme.color}30`,
                    padding: "4px 10px",
                    borderRadius: 20
                  }}>
                    {scheme.category}
                  </span>
                </div>

                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: 8, lineHeight: 1.3 }}>
                  {scheme.name}
                </h3>

                <div style={{ fontSize: "17px", fontWeight: 800, color: scheme.color, marginBottom: 12 }}>
                  {scheme.benefit}
                </div>

                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                  background: "#f1f5f9",
                  padding: "6px 12px",
                  borderRadius: 8,
                  marginBottom: 12,
                  display: "inline-block"
                }}>
                  🎯 Target Audience: <strong>{scheme.target}</strong>
                </div>

                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5, margin: 0 }}>
                  {scheme.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div style={{
          background: "linear-gradient(135deg, #0b192c 0%, #0f172a 100%)",
          border: "1px solid rgba(74, 222, 128, 0.2)",
          borderRadius: 20,
          padding: "40px 32px",
          textAlign: "center",
          color: "#ffffff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
        }}>
          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: 12 }}>
            Want to know which schemes match your profile?
          </h2>
          <p style={{ fontSize: 16, color: "#94a3b8", maxWidth: 650, margin: "0 auto 28px auto", lineHeight: 1.6 }}>
            Sign in or register for an account to run our AI Scheme Matcher and check your exact eligibility, financial health score, and personalized savings options.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <Link
              to="/login"
              style={{
                background: "linear-gradient(90deg, #ff6b00 0%, #138808 100%)",
                color: "#ffffff",
                textDecoration: "none",
                padding: "14px 32px",
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 700,
                boxShadow: "0 6px 20px rgba(255, 107, 0, 0.35)"
              }}
            >
              🔒 Login to Check Your Scheme Eligibility →
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
