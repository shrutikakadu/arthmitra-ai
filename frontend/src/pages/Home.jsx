import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import API from "../api/axios";

// ─── DATA ───────────────────────────────────────────────────────────────────────
const LANGUAGES = [
    { native: "English", english: "English", code: "EN" },
    { native: "हिंदी", english: "Hindi", code: "HI" },
    { native: "मराठी", english: "Marathi", code: "MR" },
    { native: "বাংলা", english: "Bengali", code: "BN" },
    { native: "தமிழ்", english: "Tamil", code: "TA" },
    { native: "తెలుగు", english: "Telugu", code: "TE" },
    { native: "ಕನ್ನಡ", english: "Kannada", code: "KN" },
    { native: "ਪੰਜਾਬੀ", english: "Punjabi", code: "PA" },
    { native: "ગુજરાતી", english: "Gujarati", code: "GU" },
    { native: "ଓଡ଼ିଆ", english: "Odia", code: "OR" },
    { native: "മലയാളം", english: "Malayalam", code: "ML" },
    { native: "অসমীয়া", english: "Assamese", code: "AS" },
];

const SCHEMES = [
    { name: "PM Kisan Samman Nidhi", meta: "Farmer · 98% match", pct: 98, amt: "₹6,000/yr", color: "#138808" },
    { name: "Ayushman Bharat PM-JAY", meta: "Health · 95% match", pct: 95, amt: "₹5L cover", color: "#FF6B00" },
    { name: "PM Ujjwala Yojana 2.0", meta: "Women · 91% match", pct: 91, amt: "₹1,600", color: "#138808" },
];

const FEATURES = [
    { icon: "🎯", title: "Scheme Matcher", desc: "Random Forest ML matches you to 50+ eligible government schemes, ranked by highest rupee benefit.", tag: "ML · Random Forest", accent: "saffron" },
    { icon: "📊", title: "Financial Health Score", desc: "AI-generated score out of 100 with a personalised roadmap to improve your family's welfare coverage.", tag: "AI Scoring", accent: "green" },
    { icon: "🐷", title: "Micro-Savings Planner", desc: "Post Office RD, KVP, Jan Dhan SIPs — with 1, 3 and 5-year projected savings for your income level.", tag: "Decision Tree", accent: "saffron" },
    { icon: "🎙️", title: "Voice Input", desc: "No typing needed. Speak in any of 12 Indian languages. Google Speech-to-Text powered.", tag: "12 Languages", accent: "green" },
    { icon: "🧠", title: "NLP Ranking Engine", desc: "TF-IDF + Cosine Similarity ranks schemes by maximum benefit — not just eligibility.", tag: "NLP · TF-IDF", accent: "saffron" },
    { icon: "📍", title: "How to Apply Guide", desc: "Direct links, documents required, and nearest CSC centre for every matched scheme.", tag: "myscheme.gov.in", accent: "green" },
];

const STEPS = [
    { n: "1", title: "Enter details", desc: "Income, state, caste, occupation, family size — by form or voice in your language.", saffron: true },
    { n: "2", title: "AI matches schemes", desc: "Our model scans 500+ schemes and ranks by your highest benefit first.", saffron: true },
    { n: "3", title: "See health score", desc: "Get your Family Financial Health Score with a clear improvement plan.", saffron: false },
    { n: "4", title: "Save smarter", desc: "Personalised micro-savings plan with 5-year projections.", saffron: false },
];

const TESTIMONIALS = [
    { init: "RK", name: "Ramesh Khedkar", place: "Farmer · Vidarbha, Maharashtra", quote: '"Mujhe pata hi nahi tha ki PM Kisan aur Ujjwala dono ke liye eligible hoon. ArthMitra ne 2 minute mein bata diya."', highlight: false },
    { init: "SP", name: "Sunita Pawar", place: "Daily Wage Worker · Nashik", quote: '"Voice feature bada kaam aaya. Hindi mein bola, sab samajh gaya. Mera health score 41 se 79 ho gaya."', highlight: true },
    { init: "BJ", name: "Bharat Jadhav", place: "Small Farmer · Aurangabad", quote: '"8 schemes matched. ₹2.1 lakh total benefit per year. I had no idea this money existed for my family."', highlight: false },
];

// ─── Flag stripe shapes for background — FULL SCREEN, BIG ──────────────────
const FLAG_STRIPES = [
    // Saffron stripes — wide and tall, spread across full viewport
    { id: 0,  w: "70vw", h: 40, x: -5,  y: 4,   rot: -5,  color: "#FF6B00", opacity: 0.13, dur: 24, dx: 120 },
    { id: 1,  w: "55vw", h: 32, x: 30,  y: 22,  rot: 4,   color: "#FF6B00", opacity: 0.10, dur: 28, dx: -90 },
    { id: 2,  w: "45vw", h: 26, x: 50,  y: 48,  rot: -3,  color: "#FF6B00", opacity: 0.09, dur: 22, dx: 80  },
    { id: 3,  w: "60vw", h: 35, x: -10, y: 72,  rot: 6,   color: "#FF6B00", opacity: 0.08, dur: 30, dx: 100 },
    { id: 4,  w: "50vw", h: 28, x: 40,  y: 92,  rot: -4,  color: "#FF6B00", opacity: 0.07, dur: 26, dx: -70 },
    // Green stripes — equally large
    { id: 5,  w: "65vw", h: 38, x: 20,  y: 14,  rot: 3,   color: "#138808", opacity: 0.11, dur: 26, dx: -100 },
    { id: 6,  w: "50vw", h: 30, x: 45,  y: 35,  rot: -6,  color: "#138808", opacity: 0.09, dur: 20, dx: 85  },
    { id: 7,  w: "60vw", h: 34, x: -8,  y: 58,  rot: 5,   color: "#138808", opacity: 0.10, dur: 28, dx: -75 },
    { id: 8,  w: "55vw", h: 30, x: 35,  y: 80,  rot: -2,  color: "#138808", opacity: 0.08, dur: 24, dx: 95  },
    { id: 9,  w: "40vw", h: 22, x: 60,  y: 96,  rot: 7,   color: "#138808", opacity: 0.07, dur: 32, dx: -60 },
    // White / faint stripes for depth
    { id: 10, w: "80vw", h: 50, x: 5,   y: 30,  rot: -2,  color: "#FF6B00", opacity: 0.04, dur: 35, dx: 60  },
    { id: 11, w: "75vw", h: 45, x: 10,  y: 62,  rot: 3,   color: "#138808", opacity: 0.04, dur: 32, dx: -55 },
];

// Ashoka Chakra wheels — BIG, spread full screen
const CHAKRAS = [
    { id: 0, size: 180, x: 3,   y: 8,   opacity: 0.06, dur: 40, delay: 0 },
    { id: 1, size: 140, x: 72,  y: 20,  opacity: 0.05, dur: 35, delay: -10 },
    { id: 2, size: 200, x: 40,  y: 45,  opacity: 0.04, dur: 50, delay: -20 },
    { id: 3, size: 120, x: 85,  y: 65,  opacity: 0.05, dur: 38, delay: -5 },
    { id: 4, size: 160, x: 15,  y: 75,  opacity: 0.04, dur: 45, delay: -15 },
    { id: 5, size: 100, x: 55,  y: 88,  opacity: 0.05, dur: 42, delay: -8 },
    { id: 6, size: 220, x: 30,  y: 5,   opacity: 0.03, dur: 55, delay: -25 },
    { id: 7, size: 90,  x: 92,  y: 42,  opacity: 0.05, dur: 30, delay: -12 },
];

// Floating tricolor dots — bigger, more spread
const DOTS = Array.from({ length: 35 }, (_, i) => ({
    id: i,
    size: ((i * 7 + 5) % 14) + 6,
    x: (i * 13 + 3) % 100,
    y: (i * 17 + 7) % 100,
    colorIdx: i % 3,
    opacity: 0.10 + (i % 4) * 0.05,
    dur: 12 + (i * 3) % 16,
    delay: -((i * 2.3) % 16),
}));

// ─── 3D TILT CARD ───────────────────────────────────────────────────────────────
function TiltCard({ children, style, className }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useTransform(y, [-80, 80], [6, -6]), { stiffness: 400, damping: 28 });
    const rotateY = useSpring(useTransform(x, [-80, 80], [-6, 6]), { stiffness: 400, damping: 28 });

    function onMouseMove(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
    }
    function onMouseLeave() { x.set(0); y.set(0); }

    return (
        <motion.div
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{ ...style, rotateX, rotateY, transformStyle: "preserve-3d" }}
            whileHover={{ scale: 1.025 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ─── ANIMATION VARIANTS ─────────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 48 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};
const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.13 } },
};

// ─── COLORS ─────────────────────────────────────────────────────────────────────
const C = {
    saffron: "#FF6B00",
    green: "#138808",
    white: "#ffffff",
    bg: "#FFFCF8",
    bgSec: "#FFF9F2",
    bgThird: "#F7FAF4",
    text: "#1a1a1a",
    textSoft: "#555",
    textMuted: "#888",
    border: "#ede8e1",
    borderLight: "#f0ece6",
};

const inputStyle = {
    width: "100%", padding: "10px 14px",
    background: "#fff",
    border: `1.5px solid ${C.border}`,
    borderRadius: 8, fontSize: 13, color: C.text, outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
};
const labelStyle = {
    display: "block", fontSize: 12, fontWeight: 500,
    color: "#444", marginBottom: 6,
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function Home() {
    const navigate = useNavigate();

    const [langOpen, setLangOpen] = useState(false);
    const [curLang, setCurLang] = useState("English");
    const [activeTab, setActiveTab] = useState("login");

    // Login state
    const [loginMobile, setLoginMobile] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Register state
    const [registerName, setRegisterName] = useState("");
    const [registerMobile, setRegisterMobile] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [registerState, setRegisterState] = useState("");
    const [registerLanguage, setRegisterLanguage] = useState("English");

    const [currentUser, setCurrentUser] = useState(() => {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    });

    useEffect(() => {
        if (currentUser) {
            navigate(currentUser.role === "admin" ? "/admin" : "/dashboard", { replace: true });
        }
    }, [currentUser, navigate]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setCurrentUser(null);
        alert("Logged out successfully");
        navigate("/");
        window.location.reload();
    };

    const scrollToLogin = () => {
        document.getElementById("loginSection")?.scrollIntoView({ behavior: "smooth" });
        setActiveTab("login");
    };
    const scrollToSignup = () => {
        document.getElementById("loginSection")?.scrollIntoView({ behavior: "smooth" });
        setActiveTab("signup");
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post("/auth/login", { mobile: loginMobile, password: loginPassword });
            if (res.data.status === "success") {
                alert(res.data.message || "Logged in successfully!");
                localStorage.setItem("user", JSON.stringify(res.data.user));
                navigate(res.data.user.role === "admin" ? "/admin" : "/dashboard");
                window.location.reload();
            } else { alert("Login failed."); }
        } catch (err) {
            console.error("Login error:", err);
            alert(err.response?.data?.detail || "Invalid mobile or password.");
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!registerState) { alert("Please select a state."); return; }
        try {
            const registerRes = await API.post("/auth/register", {
                name: registerName, mobile: registerMobile,
                password: registerPassword, state: registerState, language: registerLanguage,
            });
            if (registerRes.data.status === "success") {
                alert("Account created successfully! Logging you in...");
                const loginRes = await API.post("/auth/login", { mobile: registerMobile, password: registerPassword });
                if (loginRes.data.status === "success") {
                    localStorage.setItem("user", JSON.stringify(loginRes.data.user));
                    navigate("/dashboard");
                    window.location.reload();
                } else {
                    setActiveTab("login");
                    setLoginMobile(registerMobile);
                }
            } else { alert("Registration failed."); }
        } catch (err) {
            console.error("Registration error:", err);
            alert(err.response?.data?.detail || "Registration failed.");
        }
    };

    return (
        <div style={{ fontFamily: "'Inter',sans-serif", background: C.bg, color: C.text, overflowX: "hidden" }}>

            {/* ── GLOBAL STYLES ── */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* Smooth scroll */
        html { scroll-behavior: smooth; }

        /* Floating animation for flag stripes */
        @keyframes flagFloat {
          0%, 100% { transform: translateX(0) rotate(var(--rot)); }
          50%      { transform: translateX(var(--dx)) rotate(calc(var(--rot) + 2deg)); }
        }

        /* Soft float for dots — bigger movement for bigger dots */
        @keyframes dotFloat {
          0%,100% { transform: translateY(0) translateX(0); }
          33%     { transform: translateY(-45px) translateX(25px); }
          66%     { transform: translateY(-18px) translateX(-20px); }
        }

        /* Ashoka Chakra slow spin */
        @keyframes chakraSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* 3D waving flag */
        @keyframes flagWave3D {
          0%   { transform: perspective(600px) rotateY(0deg)  rotateX(2deg)  skewY(0deg); }
          25%  { transform: perspective(600px) rotateY(12deg) rotateX(-1deg) skewY(2deg); }
          50%  { transform: perspective(600px) rotateY(0deg)  rotateX(2deg)  skewY(0deg); }
          75%  { transform: perspective(600px) rotateY(-12deg) rotateX(-1deg) skewY(-2deg); }
          100% { transform: perspective(600px) rotateY(0deg)  rotateX(2deg)  skewY(0deg); }
        }
        .flag-wave { animation: flagWave3D 4s ease-in-out infinite; transform-origin: left center; }

        /* Rupee coin spin */
        @keyframes rupeeSpin {
          0%   { transform: perspective(500px) rotateY(0deg)   translateY(0px);  }
          25%  { transform: perspective(500px) rotateY(90deg)  translateY(-10px); }
          50%  { transform: perspective(500px) rotateY(180deg) translateY(-16px); }
          75%  { transform: perspective(500px) rotateY(270deg) translateY(-8px); }
          100% { transform: perspective(500px) rotateY(360deg) translateY(0px);  }
        }
        .rupee-3d { animation: rupeeSpin 7s linear infinite; }

        /* Pulse ring for voice */
        @keyframes pulseRing { 0%{transform:scale(1);opacity:.7;} 100%{transform:scale(2.4);opacity:0;} }
        .pr1 { animation: pulseRing 2s ease-out infinite; }
        .pr2 { animation: pulseRing 2s ease-out infinite .65s; }
        .pr3 { animation: pulseRing 2s ease-out infinite 1.3s; }

        /* Sound wave bars */
        @keyframes wbar { 0%,100%{height:5px;} 50%{height:18px;} }
        .wb1{animation:wbar .9s ease-in-out infinite;}
        .wb2{animation:wbar .9s ease-in-out infinite .15s;}
        .wb3{animation:wbar .9s ease-in-out infinite .3s;}
        .wb4{animation:wbar .9s ease-in-out infinite .45s;}
        .wb5{animation:wbar .9s ease-in-out infinite .6s;}

        /* Logo pulse */
        @keyframes logoPulse { 0%,100%{box-shadow:0 0 8px rgba(255,107,0,0.25);} 50%{box-shadow:0 0 22px rgba(255,107,0,0.55);} }
        .logo-pulse { animation: logoPulse 2.5s ease-in-out infinite; }

        /* CTA shimmer */
        .btn-shine { position:relative; overflow:hidden; }
        .btn-shine::after { content:''; position:absolute; top:-50%; left:-120%; width:55%; height:200%; background:rgba(255,255,255,0.2); transform:skewX(-20deg); transition:left .5s; }
        .btn-shine:hover::after { left:150%; }

        /* Nav hover */
        .nl:hover { color:#FF6B00 !important; }

        /* Lang btn */
        .lb:hover { border-color:#FF6B00 !important; color:#FF6B00 !important; }
        .lb.active { border-color:#FF6B00 !important; background:#fff3ed !important; color:#FF6B00 !important; font-weight:600; }

        /* Feature card hover */
        .fc { transition:border-color .3s, box-shadow .3s, transform .3s; }
        .fc:hover { border-color:#FF6B00 !important; box-shadow:0 12px 40px rgba(255,107,0,0.1) !important; }

        /* Scheme row hover */
        .sr { transition:transform .25s, box-shadow .25s; }
        .sr:hover { transform:translateY(-4px); box-shadow:0 8px 24px rgba(0,0,0,0.08) !important; }

        /* Testimonial hover */
        .tc:hover { border-color:#FF6B00 !important; }

        /* Input focus */
        input:focus, select:focus { border-color:#FF6B00 !important; box-shadow:0 0 0 3px rgba(255,107,0,0.1) !important; outline:none !important; }

        /* India tricolor bar */
        .tc3 { background:linear-gradient(90deg,#FF6B00 33.33%,#ffffff 33.33%,#ffffff 66.66%,#138808 66.66%); }

        /* Step circle */
        .step-circ { transition:transform .2s; }
        .step-circ:hover { transform:scale(1.15); }

        /* Ashoka Chakra SVG */
        .chakra-float { animation: chakraSpin var(--dur) linear infinite; }
      `}</style>

            {/* ══════════════════════════════════════════════════════════════════════
                ANIMATED BACKGROUND: Indian Flag Elements (full-page, behind all content)
               ══════════════════════════════════════════════════════════════════════ */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
                {/* Floating saffron/green stripe ribbons */}
                {FLAG_STRIPES.filter(s => s.opacity > 0).map(s => (
                    <div key={s.id} style={{
                        position: "absolute",
                        width: s.w, height: s.h,
                        left: `${s.x}%`, top: `${s.y}%`,
                        background: s.color,
                        opacity: s.opacity,
                        borderRadius: 200,
                        filter: "blur(6px)",
                        ["--rot"]: `${s.rot}deg`,
                        ["--dx"]: `${s.dx}px`,
                        animation: `flagFloat ${s.dur}s ease-in-out infinite`,
                        transform: `rotate(${s.rot}deg)`,
                    }} />
                ))}

                {/* Ashoka Chakra wheels */}
                {CHAKRAS.map(c => (
                    <div key={c.id} style={{
                        position: "absolute",
                        left: `${c.x}%`, top: `${c.y}%`,
                        width: c.size, height: c.size, opacity: c.opacity,
                        ["--dur"]: `${c.dur}s`,
                    }} className="chakra-float">
                        <svg viewBox="0 0 100 100" width={c.size} height={c.size}>
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#000080" strokeWidth="3" />
                            <circle cx="50" cy="50" r="8" fill="#000080" />
                            {Array.from({ length: 24 }, (_, i) => {
                                const angle = (i * 15) * Math.PI / 180;
                                const x1 = 50 + 12 * Math.cos(angle);
                                const y1 = 50 + 12 * Math.sin(angle);
                                const x2 = 50 + 42 * Math.cos(angle);
                                const y2 = 50 + 42 * Math.sin(angle);
                                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000080" strokeWidth="1.5" />;
                            })}
                        </svg>
                    </div>
                ))}

                {/* Tricolor floating dots */}
                {DOTS.map(d => (
                    <div key={d.id} style={{
                        position: "absolute", borderRadius: "50%",
                        width: d.size, height: d.size,
                        background: d.colorIdx === 0 ? "#FF6B00" : d.colorIdx === 1 ? "#138808" : "#000080",
                        opacity: d.opacity,
                        left: `${d.x}%`, top: `${d.y}%`,
                        animation: `dotFloat ${d.dur}s ease-in-out ${d.delay}s infinite`,
                    }} />
                ))}
            </div>

            {/* ── ALL CONTENT (above background) ── */}
            <div style={{ position: "relative", zIndex: 1 }}>

                {/* ── TOP BAR ── */}
                <div style={{ background: "rgba(255,248,243,0.92)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.borderLight}`, padding: "5px 2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 11, color: C.textMuted, display: "flex", gap: "1.5rem", alignItems: "center" }}>
                        <span>📞 Helpline: 1800-XXX-XXXX</span>
                        <span>🕐 Mon–Sat 9AM–6PM</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
                        <span style={{ fontSize: 11, color: C.textMuted }}>Select Language / भाषा चुनें:</span>
                        <div onClick={() => setLangOpen(!langOpen)}
                            style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#333", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                            🌐 {curLang} ▾
                        </div>
                        {langOpen && (
                            <div style={{ position: "absolute", right: 0, top: 32, background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "1.25rem", width: 368, zIndex: 400, boxShadow: "0 12px 40px rgba(0,0,0,0.1)" }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: C.text }}>Choose your language</div>
                                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>अपनी भाषा चुनें · तुमची भाषा निवडा</div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                                    {LANGUAGES.map((l) => (
                                        <div key={l.code} className={`lb ${curLang === l.native ? "active" : ""}`}
                                            onClick={() => { setCurLang(l.native); setLangOpen(false); }}
                                            style={{ padding: "7px 6px", border: `1px solid ${C.border}`, borderRadius: 8, textAlign: "center", fontSize: 12, cursor: "pointer", background: "#fafafa", transition: "all 0.15s" }}>
                                            <span style={{ display: "block", fontSize: 13, fontWeight: 500 }}>{l.native}</span>
                                            <span style={{ display: "block", fontSize: 10, color: "#999", marginTop: 1 }}>{l.english}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── NAVBAR (clean, no extra links) ── */}
                <nav style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: `2px solid ${C.borderLight}`, padding: "0 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="logo-pulse" style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#FF6B00,#FF8C00)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>AM</div>
                        <div>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.25rem", fontWeight: 700, color: C.text }}>Arth<span style={{ color: C.saffron }}>Mitra</span> AI</div>
                            <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.06em" }}>Welfare Intelligence Platform</div>
                        </div>
                    </div>

                    {/* 3D Mini flag in navbar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="flag-wave" style={{ width: 42, height: 28, borderRadius: 3, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", border: "1px solid #eee" }}>
                            <div style={{ height: "33.33%", background: "#FF6B00" }} />
                            <div style={{ height: "33.33%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg viewBox="0 0 100 100" width="8" height="8"><circle cx="50" cy="50" r="42" fill="none" stroke="#000080" strokeWidth="8" /><circle cx="50" cy="50" r="12" fill="#000080" /></svg>
                            </div>
                            <div style={{ height: "33.33%", background: "#138808" }} />
                        </div>
                        <span style={{ fontSize: 12, color: C.textSoft, fontWeight: 500 }}>Digital India</span>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {currentUser ? (
                            <>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>👤 {currentUser.name}</span>
                                <button onClick={() => navigate("/dashboard")} style={{ padding: "7px 18px", border: `1.5px solid ${C.saffron}`, borderRadius: 8, color: C.saffron, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#fff" }}>Dashboard</button>
                                <button onClick={handleLogout} className="btn-shine" style={{ padding: "7px 18px", background: "linear-gradient(135deg,#FF6B00,#FF8C00)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Logout</button>
                            </>
                        ) : (
                            <>
                                <button onClick={scrollToLogin} style={{ padding: "7px 18px", border: `1.5px solid ${C.saffron}`, borderRadius: 8, color: C.saffron, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#fff" }}>Login</button>
                                <button onClick={scrollToSignup} className="btn-shine" style={{ padding: "7px 18px", background: "linear-gradient(135deg,#FF6B00,#FF8C00)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 16px rgba(255,107,0,0.3)" }}>Register Free</button>
                            </>
                        )}
                    </div>
                </nav>

                {/* ── HERO ── */}
                <div style={{ padding: "5rem 2.5rem 4rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center", background: `linear-gradient(135deg, ${C.bg} 0%, #FFF5EC 50%, ${C.bgThird} 100%)`, position: "relative", overflow: "hidden", minHeight: "85vh" }}>

                    {/* Tricolor top stripe */}
                    <div className="tc3" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4 }} />

                    {/* Large 3D waving flag behind hero — FULL SCREEN */}
                    <div className="flag-wave" style={{ position: "absolute", right: -80, top: "2%", width: "65vw", height: "70vh", borderRadius: 14, overflow: "hidden", opacity: 0.10, zIndex: 0, boxShadow: "0 12px 60px rgba(0,0,0,0.08)" }}>
                        <div style={{ height: "33.33%", background: "#FF6B00" }} />
                        <div style={{ height: "33.33%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg viewBox="0 0 100 100" width="120" height="120"><circle cx="50" cy="50" r="42" fill="none" stroke="#000080" strokeWidth="4" /><circle cx="50" cy="50" r="10" fill="#000080" />
                                {Array.from({ length: 24 }, (_, i) => {
                                    const a = (i * 15) * Math.PI / 180;
                                    return <line key={i} x1={50 + 14 * Math.cos(a)} y1={50 + 14 * Math.sin(a)} x2={50 + 40 * Math.cos(a)} y2={50 + 40 * Math.sin(a)} stroke="#000080" strokeWidth="1.5" />;
                                })}
                            </svg>
                        </div>
                        <div style={{ height: "33.33%", background: "#138808" }} />
                    </div>

                    {/* Second flag — left side, even larger, more subtle */}
                    <div className="flag-wave" style={{ position: "absolute", left: -120, bottom: "-5%", width: "50vw", height: "55vh", borderRadius: 14, overflow: "hidden", opacity: 0.06, zIndex: 0, animationDelay: "-2s" }}>
                        <div style={{ height: "33.33%", background: "#FF6B00" }} />
                        <div style={{ height: "33.33%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg viewBox="0 0 100 100" width="90" height="90"><circle cx="50" cy="50" r="42" fill="none" stroke="#000080" strokeWidth="5" /><circle cx="50" cy="50" r="10" fill="#000080" />
                                {Array.from({ length: 24 }, (_, i) => {
                                    const a = (i * 15) * Math.PI / 180;
                                    return <line key={i} x1={50 + 14 * Math.cos(a)} y1={50 + 14 * Math.sin(a)} x2={50 + 40 * Math.cos(a)} y2={50 + 40 * Math.sin(a)} stroke="#000080" strokeWidth="1.5" />;
                                })}
                            </svg>
                        </div>
                        <div style={{ height: "33.33%", background: "#138808" }} />
                    </div>

                    {/* Ambient glows — bigger */}
                    <div style={{ position: "absolute", top: "10%", left: "40%", width: 550, height: 550, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: "5%", right: "5%", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(19,136,8,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", top: "50%", left: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

                    {/* LEFT: Hero text */}
                    <motion.div style={{ position: "relative", zIndex: 2 }}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.9, ease: "easeOut" }}>

                        <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: C.saffron, fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                            <motion.span
                                style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, display: "inline-block", boxShadow: "0 0 8px rgba(19,136,8,0.5)" }}
                                animate={{ opacity: [1, 0.25, 1] }}
                                transition={{ duration: 1.8, repeat: Infinity }} />
                            AI-Powered · Government Verified Data
                        </div>

                        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2rem,4vw,3.4rem)", lineHeight: 1.15, fontWeight: 900, marginBottom: "1.3rem", color: C.text }}>
                            Har parivaar ko<br />
                            <span style={{ color: C.saffron }}>unka haq,</span><br />
                            <span style={{ color: C.green }}>ab aasaan hai.</span>
                        </h1>

                        <p style={{ fontSize: "0.95rem", color: C.textSoft, lineHeight: 1.85, marginBottom: "2rem", maxWidth: 480 }}>
                            Over <strong style={{ color: C.saffron }}>₹1.5 lakh crore</strong> in government welfare benefits go unclaimed every year. ArthMitra AI finds every scheme your family qualifies for — in your language, in seconds.
                        </p>

                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "2.5rem" }}>
                            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}>
                                <button onClick={scrollToLogin} className="btn-shine" style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C00)", color: "#fff", border: "none", padding: "13px 28px", borderRadius: 10, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 6px 24px rgba(255,107,0,0.35)" }}>🚀 Get Started</button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}>
                                <button onClick={scrollToLogin} style={{ background: "#fff", color: C.green, padding: "13px 28px", borderRadius: 10, fontWeight: 600, fontSize: "0.9rem", border: `2px solid ${C.green}`, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 4px 16px rgba(19,136,8,0.12)" }}>🎙️ Try Voice Input</button>
                            </motion.div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", paddingTop: "1.5rem", borderTop: `1px solid ${C.border}` }}>
                            {[["500+", C.saffron, "Schemes"], ["12+", C.green, "Languages"], ["₹2.4L", C.saffron, "Avg. Benefit/yr"]].map(([n, c, l], i) => (
                                <motion.div key={l} style={{ textAlign: "center", padding: "0.75rem" }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + i * 0.12, duration: 0.6 }}>
                                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.8rem", fontWeight: 700, color: c }}>{n}</div>
                                    <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{l}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* RIGHT: 3D Rupee + Dashboard card */}
                    <motion.div style={{ position: "relative", zIndex: 2 }}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}>

                        {/* 3D Rupee coin */}
                        <div style={{ position: "absolute", top: -48, right: 20, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div className="rupee-3d" style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#FFD700 0%,#FFA500 40%,#FF8C00 70%,#FFD700 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem", fontWeight: 700, color: "#7a3f00", boxShadow: "0 0 30px rgba(255,165,0,0.45), inset 0 3px 10px rgba(255,255,255,0.45), inset 0 -3px 8px rgba(0,0,0,0.25)" }}>₹</div>
                        </div>

                        {/* Dashboard Card with 3D tilt */}
                        <TiltCard className="fc" style={{ background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 20, padding: "1.6rem", boxShadow: "0 20px 60px rgba(0,0,0,0.07)", marginTop: 24 }}>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Your Family Dashboard</span>
                                <span style={{ background: "#f1f3f5", color: "#495057", fontSize: 10, padding: "3px 10px", borderRadius: 100, fontWeight: 700, border: "1px solid #dee2e6" }}>SECURE INSIDE FEATURES</span>
                            </div>

                            {/* Inside Features List with lock indicators */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {[
                                    { icon: "🎯", label: "Scheme Finder", desc: "Find government schemes matched to your profile", color: C.saffron },
                                    { icon: "📊", label: "Financial Health Scorer", desc: "Get a customized score and saving plans", color: C.green },
                                    { icon: "📄", label: "Document Verification", desc: "Upload and verify documents with authority", color: "#3b82f6" },
                                    { icon: "🎙️", label: "Multi-lingual Voice Input", desc: "Search and enter details using speech in 12 languages", color: "#8b5cf6" }
                                ].map((item, idx) => (
                                    <div key={idx} style={{ display: "flex", gap: 12, padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: 12, background: "#fafaf8", alignItems: "center" }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fff", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: item.color, flexShrink: 0 }}>{item.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{item.label}</div>
                                            <div style={{ fontSize: 10, color: C.textMuted }}>{item.desc}</div>
                                        </div>
                                        <span style={{ fontSize: 12, opacity: 0.65 }}>🔒</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: "1.5rem" }}>
                                <button onClick={scrollToLogin} className="btn-shine" style={{ width: "100%", background: "linear-gradient(135deg,#FF6B00,#FF8C00)", color: "#fff", border: "none", padding: "11px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 6px 20px rgba(255,107,0,0.25)" }}>Login to Access Dashboard</button>
                            </div>
                        </TiltCard>
                    </motion.div>
                </div>

                {/* ── FEATURES ── */}
                <motion.div style={{ padding: "5rem 2.5rem", background: C.bgSec }}
                    initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.08 }} variants={stagger}>
                    <motion.div variants={fadeUp} style={{ fontSize: 11, letterSpacing: "0.13em", textTransform: "uppercase", color: C.saffron, fontWeight: 600, marginBottom: "0.75rem" }}>What we offer</motion.div>
                    <motion.h2 variants={fadeUp} style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 700, marginBottom: "0.75rem", lineHeight: 1.25, color: C.text }}>
                        Four powerful tools. One <span style={{ color: C.saffron }}>mission.</span>
                    </motion.h2>
                    <motion.p variants={fadeUp} style={{ fontSize: "0.9rem", color: C.textSoft, lineHeight: 1.75, maxWidth: 540, marginBottom: "3rem" }}>
                        Built for every Indian — from farmers in Vidarbha to daily wage workers in Bengal.
                    </motion.p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.3rem" }}>
                        {FEATURES.map((f, i) => {
                            const isSaffron = f.accent === "saffron";
                            const ac = isSaffron ? C.saffron : C.green;
                            const bgTint = isSaffron ? "#fff8f3" : "#f0fdf4";
                            const borderTint = isSaffron ? "#ffd4b8" : "#bbf7d0";
                            return (
                                <motion.div key={f.title} variants={fadeUp} custom={i}>
                                    <TiltCard className="fc" style={{ border: `1.5px solid ${borderTint}`, borderRadius: 16, padding: "1.6rem", background: "#fff", cursor: "default", height: "100%" }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 13, background: bgTint, border: `1px solid ${borderTint}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.9rem", fontSize: 22 }}>{f.icon}</div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>{f.title}</div>
                                        <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.7, marginBottom: 12 }}>{f.desc}</div>
                                        <span style={{ fontSize: 10, color: ac, background: bgTint, padding: "3px 10px", borderRadius: 100, border: `1px solid ${borderTint}`, fontWeight: 600 }}>{f.tag}</span>
                                    </TiltCard>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* ── HOW IT WORKS ── */}
                <motion.div style={{ padding: "5rem 2.5rem", background: C.bg }}
                    initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.08 }} variants={stagger}>
                    <motion.div variants={fadeUp} style={{ fontSize: 11, letterSpacing: "0.13em", textTransform: "uppercase", color: C.saffron, fontWeight: 600, marginBottom: "0.75rem" }}>Simple process</motion.div>
                    <motion.h2 variants={fadeUp} style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 700, marginBottom: "0.75rem", lineHeight: 1.25, color: C.text }}>
                        Benefits in <span style={{ color: C.green }}>60 seconds.</span>
                    </motion.h2>
                    <motion.p variants={fadeUp} style={{ fontSize: "0.9rem", color: C.textSoft, lineHeight: 1.75, maxWidth: 540, marginBottom: "3rem" }}>
                        Four steps from your details to your complete welfare picture.
                    </motion.p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.5rem", position: "relative" }}>
                        <div style={{ position: "absolute", top: 26, left: "7%", right: "7%", height: 2, background: `repeating-linear-gradient(90deg,${C.saffron} 0,${C.saffron} 6px,transparent 6px,transparent 14px)`, opacity: 0.4 }} />
                        {STEPS.map((st, i) => (
                            <motion.div key={st.n}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, duration: 0.65 }}
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
                                <div className="step-circ" style={{ width: 52, height: 52, borderRadius: "50%", background: "#fff", border: `2px solid ${st.saffron ? C.saffron : C.green}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 700, color: st.saffron ? C.saffron : C.green, position: "relative", zIndex: 1, boxShadow: `0 4px 18px ${st.saffron ? "rgba(255,107,0,0.15)" : "rgba(19,136,8,0.15)"}` }}>{st.n}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{st.title}</div>
                                <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.65 }}>{st.desc}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── TESTIMONIALS ── */}
                <motion.div style={{ padding: "5rem 2.5rem", background: C.bgSec }}
                    initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.08 }} variants={stagger}>
                    <motion.div variants={fadeUp} style={{ fontSize: 11, letterSpacing: "0.13em", textTransform: "uppercase", color: C.saffron, fontWeight: 600, marginBottom: "0.75rem" }}>Real stories</motion.div>
                    <motion.h2 variants={fadeUp} style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 700, lineHeight: 1.25, color: C.text }}>
                        Families who found what was <span style={{ color: C.saffron }}>always theirs.</span>
                    </motion.h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.3rem", marginTop: "2.5rem" }}>
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div key={t.name} className="tc"
                                initial={{ opacity: 0, scale: 0.88, y: 24 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, duration: 0.6, ease: "easeOut" }}
                                whileHover={{ y: -6 }}
                                style={{ border: `1.5px solid ${t.highlight ? "#ffd4b8" : C.border}`, borderRadius: 16, padding: "1.6rem", background: "#fff", boxShadow: t.highlight ? "0 8px 30px rgba(255,107,0,0.07)" : "0 4px 16px rgba(0,0,0,0.03)", transition: "border-color 0.3s" }}>
                                <div style={{ color: C.saffron, fontSize: 14, marginBottom: 10 }}>★★★★★</div>
                                <p style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.85, fontStyle: "italic", marginBottom: "1rem" }}>{t.quote}</p>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: i % 2 === 0 ? "#fff3ed" : "#f0fdf4", border: `1.5px solid ${i % 2 === 0 ? "#ffd4b8" : "#bbf7d0"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: i % 2 === 0 ? C.saffron : C.green, flexShrink: 0 }}>{t.init}</div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.name}</div>
                                        <div style={{ fontSize: 11, color: C.textMuted }}>{t.place}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── LOGIN / REGISTER ── */}
                <div id="loginSection" style={{ padding: "5rem 2.5rem", background: C.bg }}>
                    {!currentUser && (
                        <>
                            <motion.div style={{ textAlign: "center", marginBottom: "2.5rem" }}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                                <div style={{ fontSize: 11, letterSpacing: "0.13em", textTransform: "uppercase", color: C.saffron, fontWeight: 600, marginBottom: "0.75rem" }}>Join ArthMitra AI</div>
                                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 700, marginBottom: "0.5rem", color: C.text }}>Create your free account</h2>
                                <p style={{ fontSize: 13, color: C.textMuted }}>Save your profile, track your schemes, get personalised alerts</p>
                            </motion.div>

                            <motion.div style={{ background: C.bgSec, borderRadius: 22, padding: "3rem 2rem", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.border}` }}
                                initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.75 }}>
                                <div style={{ background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 22, padding: "2rem", width: "100%", maxWidth: 420, boxShadow: "0 12px 40px rgba(0,0,0,0.05)" }}>
                                    <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700 }}>Arth<span style={{ color: C.saffron }}>Mitra</span> AI</div>
                                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Welfare Intelligence Platform</div>
                                    </div>

                                    <div style={{ display: "flex", border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: "1.5rem" }}>
                                        {["login", "signup"].map((tab) => (
                                            <div key={tab} onClick={() => setActiveTab(tab)}
                                                style={{ flex: 1, padding: 10, textAlign: "center", fontSize: 13, fontWeight: 600, cursor: "pointer", background: activeTab === tab ? "linear-gradient(135deg,#FF6B00,#FF8C00)" : "#fafafa", color: activeTab === tab ? "#fff" : C.textMuted, transition: "all 0.3s" }}>
                                                {tab === "login" ? "Login" : "Register"}
                                            </div>
                                        ))}
                                    </div>

                                    {activeTab === "login" ? (
                                        <form onSubmit={handleLoginSubmit}>
                                            <div style={{ marginBottom: "1rem" }}>
                                                <label style={labelStyle}>Mobile Number</label>
                                                <input type="text" placeholder="+91 98765 43210" value={loginMobile} onChange={(e) => setLoginMobile(e.target.value)} required style={inputStyle} />
                                            </div>
                                            <div style={{ marginBottom: "1rem" }}>
                                                <label style={labelStyle}>Password</label>
                                                <input type="password" placeholder="Enter password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required style={inputStyle} />
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                                                <label style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 5 }}><input type="checkbox" /> Remember me</label>
                                                <span style={{ fontSize: 11, color: C.saffron, cursor: "pointer" }}>Forgot password?</span>
                                            </div>
                                            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-shine"
                                                style={{ width: "100%", background: "linear-gradient(135deg,#FF6B00,#FF8C00)", color: "#fff", padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", marginBottom: "1rem", boxShadow: "0 6px 20px rgba(255,107,0,0.3)" }}>
                                                Login to ArthMitra
                                            </motion.button>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "1rem 0", fontSize: 11, color: "#bbb" }}>
                                                <div style={{ flex: 1, height: 1, background: C.border }} /> or continue with <div style={{ flex: 1, height: 1, background: C.border }} />
                                            </div>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                {["🌐 Google", "📱 OTP Login"].map(label => (
                                                    <div key={label} style={{ flex: 1, padding: 10, border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, textAlign: "center", cursor: "pointer", color: "#444", background: "#fafafa", transition: "border-color 0.2s" }}>{label}</div>
                                                ))}
                                            </div>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleRegisterSubmit}>
                                            {[
                                                { label: "Full Name", type: "text", ph: "Ramesh Kumar", val: registerName, set: setRegisterName },
                                                { label: "Mobile Number", type: "text", ph: "+91 98765 43210", val: registerMobile, set: setRegisterMobile },
                                                { label: "Password", type: "password", ph: "Choose a password", val: registerPassword, set: setRegisterPassword },
                                            ].map(({ label, type, ph, val, set }) => (
                                                <div key={label} style={{ marginBottom: "1rem" }}>
                                                    <label style={labelStyle}>{label}</label>
                                                    <input type={type} placeholder={ph} value={val} onChange={(e) => set(e.target.value)} required style={inputStyle} />
                                                </div>
                                            ))}
                                            <div style={{ marginBottom: "1rem" }}>
                                                <label style={labelStyle}>State</label>
                                                <select value={registerState} onChange={(e) => setRegisterState(e.target.value)} required style={inputStyle}>
                                                    {["Select State", "Maharashtra", "Uttar Pradesh", "Rajasthan", "Madhya Pradesh", "Bihar", "Gujarat"].map(st => (
                                                        <option key={st} value={st === "Select State" ? "" : st}>{st}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ marginBottom: "1.25rem" }}>
                                                <label style={labelStyle}>Preferred Language</label>
                                                <select value={registerLanguage} onChange={(e) => setRegisterLanguage(e.target.value)} required style={inputStyle}>
                                                    {["English", "हिंदी (Hindi)", "मराठी (Marathi)", "বাংলা (Bengali)", "தமிழ் (Tamil)"].map(l => (
                                                        <option key={l} value={l}>{l}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                style={{ width: "100%", background: `linear-gradient(135deg,${C.green},#16a34a)`, color: "#fff", padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(19,136,8,0.25)" }}>
                                                Create Free Account
                                            </motion.button>
                                        </form>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>

                {/* ── CTA ── */}
                <motion.div style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C00,#e55c00)", backgroundSize: "200% 200%", padding: "5rem 2.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.9 }}>
                    {/* Decorative circles */}
                    <div style={{ position: "absolute", top: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: -80, right: -40, width: 260, height: 260, borderRadius: "50%", background: "rgba(0,0,0,0.08)", pointerEvents: "none" }} />

                    <motion.h2
                        style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "#fff", fontWeight: 900, marginBottom: "0.75rem", position: "relative" }}
                        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                        Your family's benefits<br />are waiting. Check now.
                    </motion.h2>
                    <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", marginBottom: "2rem", position: "relative" }}>Free · No registration required · Works in 12 Indian languages</p>
                    <motion.div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", position: "relative" }}
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.6 }}>
                        <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}>
                            <button onClick={scrollToLogin} style={{ background: "#fff", color: C.saffron, padding: "14px 36px", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.18)", display: "inline-block" }}>🔍 Check My Eligibility</button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}>
                            <button onClick={scrollToLogin} style={{ background: "transparent", color: "#fff", padding: "14px 36px", borderRadius: 10, fontWeight: 600, fontSize: "0.95rem", border: "2px solid rgba(255,255,255,0.55)", cursor: "pointer", display: "inline-block" }}>🎙️ Try Voice Input</button>
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* ── FOOTER ── */}
                <footer style={{ background: "#1a1a1a", color: "#ccc", padding: "3rem 2.5rem 1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                        <div>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#fff", marginBottom: "0.5rem" }}>Arth<span style={{ color: C.saffron }}>Mitra</span> AI</div>
                            <p style={{ fontSize: 11, color: "#888", lineHeight: 1.7 }}>AI-powered welfare intelligence for rural India. Data sourced from myscheme.gov.in, data.gov.in and Ministry of Rural Development.</p>
                            <div style={{ marginTop: 12, fontSize: 11, color: "#555" }}>SPIT CE Mini Project 2026–27<br />Guide: Dr. Surekha Dholay</div>
                        </div>
                        {[
                            ["Platform", ["Scheme Matcher", "Health Score", "Savings Planner", "Voice Input"]],
                            ["Resources", ["myscheme.gov.in", "data.gov.in", "Rural Dev Portal", "CSC Locator"]],
                            ["Languages", ["हिंदी · English", "मराठी · বাংলা", "தமிழ் · తెలుగు", "+6 more"]],
                        ].map(([heading, links]) => (
                            <div key={heading}>
                                <h4 style={{ fontSize: 12, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>{heading}</h4>
                                {links.map(l => <div key={l} style={{ fontSize: 12, color: "#888", marginBottom: 5, cursor: "pointer", transition: "color 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.color = "#FF6B00"}
                                    onMouseLeave={e => e.currentTarget.style.color = "#888"}>{l}</div>)}
                            </div>
                        ))}
                    </div>
                    <div style={{ borderTop: "1px solid #333", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: 11, color: "#555" }}>© 2026 ArthMitra AI · SPIT Mumbai · CE Department</p>
                        <p style={{ fontSize: 11, color: "#555" }}>Built with Python · FastAPI · React · Scikit-learn</p>
                    </div>
                </footer>
                <div className="tc3" style={{ height: 4 }} />
            </div>
        </div>
    );
}