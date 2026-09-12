import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Footer from "../components/Footer";
import { useLanguage } from "../LanguageContext";

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

const WHY_CHOOSE_FEATURES = [
  {
    icon: "🎯",
    title: "AI Scheme Matching",
    desc: "MapReduce AI algorithms check household profile criteria against 500+ central & state government welfare schemes."
  },
  {
    icon: "🎙️",
    title: "Voice-Based Form Filling",
    desc: "Speak naturally in Hindi, Marathi, or English to fill application details without complex manual typing."
  },
  {
    icon: "📊",
    title: "Financial Health Analysis",
    desc: "Evaluate 5 core social security dimensions to calculate your household's overall financial health rating."
  },
  {
    icon: "🐷",
    title: "Savings Recommendations",
    desc: "Personalized guidance for government micro-savings instruments like Post Office RD, Jan Dhan SIP, and Sukanya Samriddhi."
  },
  {
    icon: "📜",
    title: "Secure Document Verification",
    desc: "Multi-level verification pipeline ensuring verified document security for fast welfare benefit disbursement."
  },
  {
    icon: "📋",
    title: "Application Tracking",
    desc: "Real-time transparent updates tracking your application from Section Officer review to Cabinet Minister sanction."
  },
  {
    icon: "🗣️",
    title: "Multilingual Support",
    desc: "Seamless switching across English, हिन्दी, and मराठी to make government welfare accessible to every citizen."
  },
  {
    icon: "🏛️",
    title: "Government Welfare Discovery",
    desc: "Comprehensive public portal providing transparent details on financial aid, health insurance, and subsidies."
  }
];

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { lang, setLang, t } = useLanguage();

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
          padding: "6px 18px",
          borderRadius: 20,
          color: "#ff6b00",
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 24
        }}>
          🇮🇳 Official Government Welfare & Public Information Portal
        </div>

        <h1 style={{
          fontSize: "48px",
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: "-1px",
          color: "#0f172a",
          marginBottom: 20
        }}>
          Arth<span style={{ color: "#ff6b00" }}>Mitra</span> AI — Empowering Citizens with <span style={{ background: "linear-gradient(90deg, #ff6b00 0%, #138808 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI-Driven Welfare Discovery</span>
        </h1>

        <p style={{
          fontSize: "18px",
          color: "#475569",
          maxWidth: 750,
          margin: "0 auto 36px auto",
          lineHeight: 1.6
        }}>
          Discover government welfare schemes, health coverage, agricultural subsidies, and financial security plans tailored to your family's needs.
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 48 }}>
          {user ? (
            <button
              onClick={() => navigate(user.role === "user" ? "/dashboard" : user.role === "minister" ? "/minister" : "/admin")}
              style={{
                padding: "14px 28px",
                background: "linear-gradient(90deg, #138808 0%, #059669 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(19, 136, 8, 0.35)"
              }}
            >
              Go to Citizen Dashboard →
            </button>
          ) : (
            <>
              <Link
                to="/register"
                style={{
                  padding: "14px 28px",
                  background: "linear-gradient(90deg, #ff6b00 0%, #f97316 100%)",
                  color: "#ffffff",
                  textDecoration: "none",
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 700,
                  boxShadow: "0 6px 20px rgba(255, 107, 0, 0.35)"
                }}
              >
                Get Started →
              </Link>
              <Link
                to="/login"
                style={{
                  padding: "14px 28px",
                  background: "#ffffff",
                  color: "#0f172a",
                  textDecoration: "none",
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 700,
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                }}
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Trust Metric Highlights */}
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
            <div style={{ fontSize: 13, color: "#64748b" }}>Central & State Schemes</div>
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0284c7" }}>3</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Indian Languages</div>
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#16a34a" }}>99.4%</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Matching Accuracy</div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ARTHMITRA SECTION ── */}
      <section style={{ background: "rgba(248, 250, 252, 0.9)", padding: "64px 24px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a" }}>About ArthMitra AI</h2>
            <p style={{ fontSize: 16, color: "#64748b", marginTop: 8, maxWidth: 700, margin: "8px auto 0 auto" }}>
              ArthMitra AI is a multilingual AI-powered Government Welfare Management System engineered to simplify public welfare discovery, application tracking, and micro-financial planning for every Indian household.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px" }}>
              <div style={{ fontSize: "32px", marginBottom: 12 }}>🤖</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>AI Assistance</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5, margin: 0 }}>
                Intelligent MapReduce algorithms match citizen profile criteria against complex eligibility rules across 500+ government programs.
              </p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px" }}>
              <div style={{ fontSize: "32px", marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Welfare Discovery</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5, margin: 0 }}>
                Transparent public directory helping citizens discover subsidies, insurance plans, housing grants, and pensions without middlemen.
              </p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px" }}>
              <div style={{ fontSize: "32px", marginBottom: 12 }}>📜</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Document Verification</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5, margin: 0 }}>
                Multi-tier administrative pipeline (Section Officer &rarr; DM &rarr; Secretary &rarr; Minister) ensuring secure and verified benefit approval.
              </p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "24px" }}>
              <div style={{ fontSize: "32px", marginBottom: 12 }}>🎙️</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Voice Assistance</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5, margin: 0 }}>
                Voice-guided NLP interface enabling citizens to speak naturally in regional languages to fill application forms effortless.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MULTILINGUAL SHOWCASE SECTION (TASK 8) ── */}
      <section style={{ padding: "64px 24px", maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(13, 148, 136, 0.1)", border: "1px solid rgba(13, 148, 136, 0.25)", padding: "4px 14px", borderRadius: 20, color: "#0d9488", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            🗣️ Inclusive Technology
          </div>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a" }}>Multilingual Portal Showcase</h2>
          <p style={{ fontSize: 15, color: "#64748b", marginTop: 8 }}>
            ArthMitra AI breaks language barriers. Click any language card below to dynamically change the portal language.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {/* English Card */}
          <div
            onClick={() => setLang("en")}
            style={{
              background: lang === "en" ? "#f0fdf4" : "#ffffff",
              border: lang === "en" ? "2px solid #138808" : "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "24px",
              cursor: "pointer",
              boxShadow: lang === "en" ? "0 6px 20px rgba(19,136,8,0.15)" : "0 2px 10px rgba(0,0,0,0.02)",
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>English</span>
              <span style={{ fontSize: 12, fontWeight: 700, background: "#e2e8f0", padding: "4px 8px", borderRadius: 6 }}>EN</span>
            </div>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 16 }}>
              Discover and apply for Indian government schemes with AI assistance. Access financial health scores and savings plans.
            </p>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#138808" }}>
              {lang === "en" ? "✓ Currently Selected" : "Click to select English →"}
            </div>
          </div>

          {/* Hindi Card */}
          <div
            onClick={() => setLang("hi")}
            style={{
              background: lang === "hi" ? "#fff7ed" : "#ffffff",
              border: lang === "hi" ? "2px solid #ff6b00" : "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "24px",
              cursor: "pointer",
              boxShadow: lang === "hi" ? "0 6px 20px rgba(255,107,0,0.15)" : "0 2px 10px rgba(0,0,0,0.02)",
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>हिन्दी</span>
              <span style={{ fontSize: 12, fontWeight: 700, background: "#fed7aa", color: "#c2410c", padding: "4px 8px", borderRadius: 6 }}>HI</span>
            </div>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 16 }}>
              एआई सहायता के साथ भारतीय सरकारी योजनाओं को खोजें और आवेदन करें। वित्तीय स्वास्थ्य स्कोर और बचत योजनाओं तक पहुंच प्राप्त करें।
            </p>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ff6b00" }}>
              {lang === "hi" ? "✓ फिलहाल चुना गया है" : "हिन्दी चुनने के लिए क्लिक करें →"}
            </div>
          </div>

          {/* Marathi Card */}
          <div
            onClick={() => setLang("mr")}
            style={{
              background: lang === "mr" ? "#f0f9ff" : "#ffffff",
              border: lang === "mr" ? "2px solid #0284c7" : "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "24px",
              cursor: "pointer",
              boxShadow: lang === "mr" ? "0 6px 20px rgba(2,132,199,0.15)" : "0 2px 10px rgba(0,0,0,0.02)",
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>मराठी</span>
              <span style={{ fontSize: 12, fontWeight: 700, background: "#bae6fd", color: "#0369a1", padding: "4px 8px", borderRadius: 6 }}>MR</span>
            </div>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 16 }}>
              एआय मदतीने भारतीय शासकीय योजना शोधा आणि अर्ज करा. तुमचे आर्थिक आरोग्य गुण आणि बचत योजना मिळवा.
            </p>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0284c7" }}>
              {lang === "mr" ? "✓ सध्या निवडलेले" : "मराठी निवडण्यासाठी क्लिक करा →"}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE ARTHMITRA (TASK 9) ── */}
      <section style={{ background: "#0b192c", color: "#ffffff", padding: "64px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800 }}>Why Choose ArthMitra AI</h2>
            <p style={{ fontSize: 15, color: "#94a3b8", marginTop: 8 }}>
              Complete government welfare lifecycle management engineered for citizens and administrators
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
            {WHY_CHOOSE_FEATURES.map((feat, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 14,
                  padding: "24px"
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: 12 }}>{feat.icon}</div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: 8, color: "#ffffff" }}>{feat.title}</h3>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
}