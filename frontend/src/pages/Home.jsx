import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import API from "../api/axios";

// ─── 3D TIRANGA LIGHT BACKGROUND COMPONENT ──────────────────────────────────────
function Tiranga3DBackground() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-300, 300], [3, -3]), { stiffness: 150, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-300, 300], [-3, 3]), { stiffness: 150, damping: 25 });

  function handleMouseMove(e) {
    x.set(e.clientX - window.innerWidth / 2);
    y.set(e.clientY - window.innerHeight / 2);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
        rotateX,
        rotateY,
        perspective: 1200
      }}
    >
      {/* 🟧 Saffron Upper Ribbon Wave */}
      <motion.div
        animate={{
          y: [0, -12, 0],
          skewY: [-1.5, 1.5, -1.5]
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "-12%",
          left: "-10%",
          width: "120vw",
          height: "42vh",
          background: "linear-gradient(135deg, rgba(255, 107, 0, 0.09) 0%, rgba(255, 140, 0, 0.04) 70%, rgba(255, 255, 255, 0) 100%)",
          filter: "blur(36px)",
          transform: "rotate(-3deg)"
        }}
      />

      {/* ⚪ Glowing Center & Rotating Ashoka Chakra Wheel */}
      <div style={{
        position: "absolute",
        top: "32vh",
        left: "50%",
        transform: "translateX(-50%)",
        width: "280px",
        height: "280px",
        opacity: 0.045
      }}>
        <motion.svg
          viewBox="0 0 100 100"
          animate={{ rotate: 360 }}
          transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
          style={{ width: "100%", height: "100%" }}
        >
          <circle cx="50" cy="50" r="44" fill="none" stroke="#000080" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="9" fill="#000080" />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * 15) * Math.PI / 180;
            return (
              <line
                key={i}
                x1={50 + 9 * Math.cos(a)}
                y1={50 + 9 * Math.sin(a)}
                x2={50 + 43 * Math.cos(a)}
                y2={50 + 43 * Math.sin(a)}
                stroke="#000080"
                strokeWidth="1.2"
              />
            );
          })}
        </motion.svg>
      </div>

      {/* 🟩 India Green Lower Ribbon Wave */}
      <motion.div
        animate={{
          y: [0, 12, 0],
          skewY: [1.5, -1.5, 1.5]
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: "-12%",
          left: "-10%",
          width: "120vw",
          height: "42vh",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0) 0%, rgba(19, 136, 8, 0.04) 30%, rgba(19, 136, 8, 0.09) 100%)",
          filter: "blur(36px)",
          transform: "rotate(2.5deg)"
        }}
      />

      {/* 🇮🇳 Floating Tricolor Micro Particles */}
      {Array.from({ length: 12 }).map((_, idx) => (
        <motion.div
          key={idx}
          animate={{
            y: [0, -35, 0],
            x: [0, idx % 2 === 0 ? 15 : -15, 0],
            opacity: [0.04, 0.12, 0.04]
          }}
          transition={{
            duration: 9 + (idx % 4),
            repeat: Infinity,
            delay: idx * 0.8,
            ease: "easeInOut"
          }}
          style={{
            position: "absolute",
            top: `${(idx * 8 + 8) % 88}%`,
            left: `${(idx * 14 + 6) % 88}%`,
            width: `${10 + (idx % 3) * 5}px`,
            height: `${10 + (idx % 3) * 5}px`,
            borderRadius: "50%",
            background: idx % 3 === 0 ? "#FF6B00" : idx % 3 === 1 ? "#ffffff" : "#138808",
            filter: "blur(4px)"
          }}
        />
      ))}
    </motion.div>
  );
}

const POPULAR_SCHEMES = [
  {
    name: "PM Kisan Samman Nidhi",
    category: "🌾 Agriculture",
    benefit: "₹6,000 / year",
    desc: "Direct income support for farmer families paid in three equal installments of ₹2,000 directly to bank accounts.",
    badge: "Most Popular",
    color: "#138808"
  },
  {
    name: "Ayushman Bharat PM-JAY",
    category: "🏥 Healthcare",
    benefit: "₹5 Lakhs Cover",
    desc: "World's largest health assurance scheme providing ₹5 Lakhs free hospital coverage per family every year.",
    badge: "Health Protection",
    color: "#FF6B00"
  },
  {
    name: "PM Ujjwala Yojana 2.0",
    category: "🏠 Social Welfare",
    benefit: "Free LPG Connection",
    desc: "Provides deposit-free LPG gas connections along with first refill and stove for low-income households.",
    badge: "Welfare Grant",
    color: "#059669"
  }
];

const FEATURES = [
  {
    icon: "🎯",
    title: "AI Scheme Matcher",
    desc: "Smart matching algorithm checks your profile against 500+ central & state welfare schemes, ranked by maximum financial benefit."
  },
  {
    icon: "📊",
    title: "Financial Health Score",
    desc: "Get an instant score out of 100 analyzing your family's social security coverage, with step-by-step guidance to improve it."
  },
  {
    icon: "🐷",
    title: "Micro-Savings Planner",
    desc: "Personalized savings recommendations for Post Office RD, Jan Dhan SIPs, and Sukanya Samriddhi with 1 to 5 year projections."
  },
  {
    icon: "🎙️",
    title: "Voice-Enabled Support",
    desc: "No typing required. Speak naturally in Hindi, Marathi, Bengali, Tamil, Telugu, or 7 other Indian languages to find schemes."
  }
];

const STEPS = [
  {
    number: "01",
    title: "Enter Basic Details",
    desc: "Provide basic profile information like state, income range, and occupation using text or voice."
  },
  {
    number: "02",
    title: "AI Matches Eligible Schemes",
    desc: "Our model scans government databases and ranks schemes by highest cash benefit for your family."
  },
  {
    number: "03",
    title: "Apply & Track Status",
    desc: "Submit your application online and track verification status through the multi-stage government pipeline."
  }
];

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (e) { setUser(null); }
    }
  }, []);

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: "#fcfdfd",
      color: "#0f172a",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      position: "relative"
    }}>
      {/* 🇮🇳 3D Tiranga Background */}
      <Tiranga3DBackground />

      {/* ── MINIMAL TOP BAR ── */}
      <header style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e2e8f0",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "24px" }}>🌿</span>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
            Arth<span style={{ color: "#ff6b00" }}>Mitra</span> <span style={{ fontSize: 13, background: "rgba(19, 136, 8, 0.1)", color: "#138808", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>AI</span>
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14, fontWeight: 500 }}>
          <Link to="/match" style={{ color: "#334155", textDecoration: "none" }}>Scheme Matcher</Link>
          <Link to="/health" style={{ color: "#334155", textDecoration: "none" }}>Health Score</Link>
          <Link to="/savings" style={{ color: "#334155", textDecoration: "none" }}>Savings Planner</Link>
          <Link to="/voice" style={{ color: "#334155", textDecoration: "none" }}>Voice Search</Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <Link
              to={user.role === "user" ? "/dashboard" : "/admin"}
              style={{
                background: "#138808",
                color: "#ffffff",
                padding: "8px 18px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600
              }}
            >
              Go to Dashboard ({user.name})
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  color: "#334155",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "8px 14px"
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                style={{
                  background: "#ff6b00",
                  color: "#ffffff",
                  padding: "8px 18px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(255, 107, 0, 0.25)"
                }}
              >
                Get Started →
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section style={{
        padding: "72px 24px 60px 24px",
        maxWidth: 1100,
        margin: "0 auto",
        textAlign: "center",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255, 107, 0, 0.08)",
          border: "1px solid rgba(255, 107, 0, 0.2)",
          padding: "6px 16px",
          borderRadius: 20,
          color: "#ff6b00",
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 24
        }}>
          <span>🇮🇳</span> Official Government Welfare & Financial Support Platform
        </div>

        <h1 style={{
          fontSize: "48px",
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: "-1px",
          color: "#0f172a",
          marginBottom: 20
        }}>
          Find Government Schemes You Are <span style={{ background: "linear-gradient(90deg, #ff6b00 0%, #138808 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Eligible For in 2 Minutes</span>.
        </h1>

        <p style={{
          fontSize: "18px",
          color: "#475569",
          maxWidth: 720,
          margin: "0 auto 36px auto",
          lineHeight: 1.6
        }}>
          Discover financial aid, health insurance, agricultural subsidies, and micro-savings tailored specifically to your family's income, occupation, and location.
        </p>

        {/* Primary Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 48 }}>
          <button
            onClick={() => navigate(user ? "/match" : "/register")}
            style={{
              padding: "14px 28px",
              background: "linear-gradient(90deg, #ff6b00 0%, #f97316 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(255, 107, 0, 0.35)",
              transition: "transform 0.15s ease"
            }}
          >
            🎯 Find My Schemes Now
          </button>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "14px 28px",
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            🔑 Member / Official Login
          </button>
        </div>

        {/* Trust & Metric Highlights */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 20,
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(12px)",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
        }}>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#138808" }}>₹50,000+ Cr</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Welfare Benefits Tracked</div>
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#ff6b00" }}>500+</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Government Schemes</div>
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0284c7" }}>12</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Indian Languages Supported</div>
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#16a34a" }}>99.4%</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Matching Accuracy</div>
          </div>
        </div>
      </section>

      {/* ── POPULAR SCHEMES PREVIEW ── */}
      <section style={{ background: "rgba(248, 250, 252, 0.85)", backdropFilter: "blur(8px)", padding: "64px 24px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "30px", fontWeight: 800, color: "#0f172a" }}>Popular Central & State Welfare Schemes</h2>
            <p style={{ fontSize: 15, color: "#64748b", marginTop: 6 }}>Key financial aid programs available for eligible Indian households</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {POPULAR_SCHEMES.map((s, idx) => (
              <div key={idx} style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
              }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: 6 }}>
                      {s.category}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color, background: "rgba(19,136,8,0.08)", padding: "4px 8px", borderRadius: 6 }}>
                      {s.badge}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{s.name}</h3>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: s.color, marginBottom: 12 }}>{s.benefit}</div>
                  <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}>{s.desc}</p>
                </div>
                <button
                  onClick={() => navigate(`/scheme/${encodeURIComponent(s.name)}`)}
                  style={{
                    marginTop: 20,
                    width: "100%",
                    padding: "10px",
                    background: "#f1f5f9",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  View Scheme Details & Apply →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE CAPABILITIES ── */}
      <section style={{ padding: "64px 24px", maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h2 style={{ fontSize: "30px", fontWeight: 800, color: "#0f172a" }}>Designed for Every Indian Household</h2>
          <p style={{ fontSize: 15, color: "#64748b", marginTop: 6 }}>Intelligent tools that make financial security accessible to all</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {FEATURES.map((f, idx) => (
            <div key={idx} style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "24px",
              textAlign: "left"
            }}>
              <div style={{ fontSize: "36px", marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS (3 SIMPLE STEPS) ── */}
      <section style={{ background: "#0f172a", color: "#ffffff", padding: "64px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 800, marginBottom: 12 }}>How ArthMitra Works in 3 Simple Steps</h2>
          <p style={{ fontSize: 15, color: "#94a3b8", marginBottom: 48 }}>Zero complicated paperwork or manual search needed</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
            {STEPS.map((step, idx) => (
              <div key={idx} style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 14,
                padding: "28px 24px",
                textAlign: "left"
              }}>
                <div style={{ fontSize: "28px", fontWeight: 900, color: "#ff6b00", marginBottom: 12 }}>{step.number}</div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: "#090d16",
        color: "#64748b",
        padding: "24px 32px",
        marginTop: "auto",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
        fontSize: 13,
        position: "relative",
        zIndex: 1
      }}>
        <div>
          © 2026 <strong>ArthMitra AI</strong> — Government Scheme Finder & Welfare Lifecycle Management Engine.
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <Link to="/match" style={{ color: "#94a3b8", textDecoration: "none" }}>Scheme Matcher</Link>
          <Link to="/health" style={{ color: "#94a3b8", textDecoration: "none" }}>Health Score</Link>
          <Link to="/login" style={{ color: "#ff6b00", textDecoration: "none", fontWeight: 600 }}>Portal Login</Link>
        </div>
      </footer>
    </div>
  );
}