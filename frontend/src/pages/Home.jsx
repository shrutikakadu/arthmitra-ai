import { Link } from "react-router-dom";
import { useState } from "react";

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
    { icon: "🎯", title: "Scheme Matcher", desc: "Random Forest ML matches you to 50+ eligible government schemes, ranked by highest rupee benefit.", tag: "ML · Random Forest", green: false },
    { icon: "📊", title: "Financial Health Score", desc: "AI-generated score out of 100 with a personalised roadmap to improve your family's welfare coverage.", tag: "AI Scoring", green: true },
    { icon: "🐷", title: "Micro-Savings Planner", desc: "Post Office RD, KVP, Jan Dhan SIPs — with 1, 3 and 5-year projected savings for your income level.", tag: "Decision Tree", green: false },
    { icon: "🎙️", title: "Voice Input", desc: "No typing needed. Speak in any of 12 Indian languages. Google Speech-to-Text powered.", tag: "12 Languages", green: true },
    { icon: "🧠", title: "NLP Ranking Engine", desc: "TF-IDF + Cosine Similarity ranks schemes by maximum benefit — not just eligibility.", tag: "NLP · TF-IDF", green: false },
    { icon: "📍", title: "How to Apply Guide", desc: "Direct links, documents required, and nearest CSC centre for every matched scheme.", tag: "myscheme.gov.in", green: true },
];

const STEPS = [
    { n: "1", title: "Enter details", desc: "Income, state, caste, occupation, family size — by form or voice in your language.", saffron: true },
    { n: "2", title: "AI matches schemes", desc: "Our model scans 500+ schemes and ranks by your highest benefit first.", saffron: true },
    { n: "3", title: "See health score", desc: "Get your Family Financial Health Score with a clear improvement plan.", saffron: false },
    { n: "4", title: "Save smarter", desc: "Personalised micro-savings plan with 5-year projections.", saffron: false },
];

const TESTIMONIALS = [
    { init: "RK", name: "Ramesh Khedkar", place: "Farmer · Vidarbha, Maharashtra", quote: '"Mujhe pata hi nahi tha ki PM Kisan aur Ujjwala dono ke liye eligible hoon. ArthMitra ne 2 minute mein bata diya."', green: false, highlight: false },
    { init: "SP", name: "Sunita Pawar", place: "Daily Wage Worker · Nashik", quote: '"Voice feature bada kaam aaya. Hindi mein bola, sab samajh gaya. Mera health score 41 se 79 ho gaya."', green: true, highlight: true },
    { init: "BJ", name: "Bharat Jadhav", place: "Small Farmer · Aurangabad", quote: '"8 schemes matched. ₹2.1 lakh total benefit per year. I had no idea this money existed for my family."', green: false, highlight: false },
];

export default function Home() {
    const [langOpen, setLangOpen] = useState(false);
    const [curLang, setCurLang] = useState("English");
    const [activeTab, setActiveTab] = useState("login");

    const s = {
        page: { fontFamily: "'Inter',sans-serif", background: "#fff", color: "#1a1a1a", overflowX: "hidden" },
        topBar: { background: "#f8f4ef", borderBottom: "1px solid #e8e0d5", padding: "6px 2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
        topBarLeft: { fontSize: 11, color: "#666", display: "flex", gap: "1.5rem", alignItems: "center" },
        navbar: { background: "#fff", borderBottom: "2px solid #f0ece6", padding: "0 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100 },
        logoText: { fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 700, color: "#1a1a1a" },
        navLink: { padding: "0 1rem", height: 64, display: "flex", alignItems: "center", fontSize: 13, color: "#444", textDecoration: "none", fontWeight: 500, cursor: "pointer", borderBottom: "2px solid transparent" },
        btnLogin: { padding: "7px 18px", border: "1.5px solid #FF6B00", borderRadius: 7, color: "#FF6B00", fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#fff" },
        btnSignup: { padding: "7px 18px", background: "#FF6B00", border: "none", borderRadius: 7, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" },
        hero: { padding: "4rem 2.5rem 3rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center", background: "linear-gradient(180deg,#fff8f3 0%,#fff 100%)", position: "relative" },
        heroH1: { fontFamily: "'Playfair Display',serif", fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 1.15, color: "#1a1a1a", fontWeight: 900, marginBottom: "1.25rem" },
        secH2: { fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 700, color: "#1a1a1a", marginBottom: "0.75rem", lineHeight: 1.25 },
    };

    return (
        <div style={s.page}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .pulse { width: 7px; height: 7px; border-radius: 50%; background: #138808; display: inline-block; animation: blink 2s infinite; }
        .voice-dot { width: 8px; height: 8px; border-radius: 50%; background: #138808; animation: blink 1.5s infinite; flex-shrink: 0; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .score-ring::before { content:''; position:absolute; inset:-4px; border-radius:50%; border:4px solid transparent; border-top-color:#138808; border-right-color:#138808; border-bottom-color:#138808; }
        .fcard:hover { border-color: #FF6B00 !important; box-shadow: 0 2px 12px rgba(255,107,0,0.08); }
        .navlnk:hover { color: #FF6B00 !important; border-bottom-color: #FF6B00 !important; }
        .lang-btn:hover { border-color: #FF6B00; color: #FF6B00; background: #fff8f5; }
        .lang-btn.active { border-color: #FF6B00; background: #fff3ed; color: #FF6B00; font-weight: 600; }
      `}</style>

            {/* TOP BAR */}
            <div style={s.topBar}>
                <div style={s.topBarLeft}>
                    <span>📞 Helpline: 1800-XXX-XXXX</span>
                    <span>🕐 Mon–Sat 9AM–6PM</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
                    <span style={{ fontSize: 11, color: "#888" }}>Select Language / भाषा चुनें:</span>
                    <div onClick={() => setLangOpen(!langOpen)} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#333", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        🌐 {curLang} ▾
                    </div>
                    {langOpen && (
                        <div style={{ position: "absolute", right: 0, top: 32, background: "#fff", border: "1.5px solid #ede8e1", borderRadius: 12, padding: "1.25rem", width: 360, zIndex: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Choose your language</div>
                            <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>अपनी भाषा चुनें · तुमची भाषा निवडा</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                                {LANGUAGES.map((l) => (
                                    <div key={l.code} className={`lang-btn ${curLang === l.native ? "active" : ""}`}
                                        onClick={() => { setCurLang(l.native); setLangOpen(false); }}
                                        style={{ padding: "7px 6px", border: "1px solid #e0e0e0", borderRadius: 7, textAlign: "center", fontSize: 12, cursor: "pointer", background: "#fafafa", transition: "all 0.15s" }}>
                                        <span style={{ display: "block", fontSize: 13, fontWeight: 500 }}>{l.native}</span>
                                        <span style={{ display: "block", fontSize: 10, color: "#999", marginTop: 1 }}>{l.english}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* NAVBAR */}
            <nav style={s.navbar}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#FF6B00,#FF8C00)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>AM</div>
                    <div>
                        <div style={s.logoText}>Arth<span style={{ color: "#FF6B00" }}>Mitra</span> AI</div>
                        <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.05em" }}>Welfare Intelligence Platform</div>
                    </div>
                </div>
                <div style={{ display: "flex" }}>
                    {["Home", "Schemes", "Health Score", "Savings", "About"].map((item) => (
                        <div key={item} className="navlnk" style={s.navLink}>{item}</div>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button style={s.btnLogin}>Login</button>
                    <Link to="/match" style={{ ...s.btnSignup, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Register Free</Link>
                </div>
            </nav>

            {/* HERO */}
            <div style={s.hero}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg,#FF6B00 33%,#fff 33%,#fff 66%,#138808 66%)" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FF6B00", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="pulse" /> AI-Powered · Government Verified Data
                    </div>
                    <h1 style={s.heroH1}>
                        Har parivaar ko<br /><span style={{ color: "#FF6B00" }}>unka haq,</span><br /><span style={{ color: "#138808" }}>ab aasaan hai.</span>
                    </h1>
                    <p style={{ fontSize: "0.95rem", color: "#555", lineHeight: 1.75, marginBottom: "2rem", maxWidth: 480 }}>
                        Over <strong>₹1.5 lakh crore</strong> in government welfare benefits go unclaimed every year. ArthMitra AI finds every scheme your family qualifies for — in your language, in seconds.
                    </p>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "2rem" }}>
                        <Link to="/match" style={{ background: "#FF6B00", color: "#fff", padding: "12px 28px", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>🔍 Find My Schemes</Link>
                        <Link to="/voice" style={{ background: "#fff", color: "#138808", padding: "12px 28px", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", border: "2px solid #138808", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>🎙️ Try Voice Input</Link>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", paddingTop: "1.5rem", borderTop: "1px solid #ece8e1" }}>
                        {[["500+", "#FF6B00", "Schemes"], ["12+", "#138808", "Languages"], ["₹2.4L", "#FF6B00", "Avg. Benefit/yr"]].map(([n, c, l]) => (
                            <div key={l} style={{ textAlign: "center", padding: "0.75rem" }}>
                                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", fontWeight: 700, color: c }}>{n}</div>
                                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{l}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DASHBOARD CARD */}
                <div style={{ background: "#fff", border: "1.5px solid #ede8e1", borderRadius: 16, padding: "1.5rem", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Your Family Dashboard</span>
                        <span style={{ background: "#fff3ed", color: "#FF6B00", fontSize: 10, padding: "3px 10px", borderRadius: 100, fontWeight: 700, border: "1px solid #ffd4b8" }}>LIVE PREVIEW</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", padding: "1rem", background: "#f9f6f2", borderRadius: 10 }}>
                        <div className="score-ring" style={{ width: 64, height: 64, borderRadius: "50%", border: "4px solid #ede8e1", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "#138808" }}>74</span>
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 3 }}>Financial Health Score</div>
                            <div style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>Good standing · 3 improvements available<br />Welfare coverage: 68% · Savings: Low risk</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
                        <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Top Matched Schemes</div>
                        {SCHEMES.map((sc) => (
                            <div key={sc.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", border: "1px solid #ede8e1", borderRadius: 8, background: "#fafafa" }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: "#333" }}>{sc.name}</div>
                                    <div style={{ fontSize: 10, color: "#999", marginTop: 1 }}>{sc.meta}</div>
                                    <div style={{ height: 3, borderRadius: 2, marginTop: 3, width: `${sc.pct}%`, background: sc.color }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#138808" }}>{sc.amt}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                        <div className="voice-dot" />
                        <span style={{ fontSize: 11, color: "#166534" }}>Voice input active — speak in हिंदी, मराठी or English</span>
                    </div>
                </div>
            </div>

            {/* FEATURES */}
            <div style={{ padding: "4rem 2.5rem", background: "#fafaf8" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FF6B00", fontWeight: 600, marginBottom: "0.75rem" }}>What we offer</div>
                <h2 style={s.secH2}>Four powerful tools. One <span style={{ color: "#FF6B00" }}>mission.</span></h2>
                <p style={{ fontSize: "0.9rem", color: "#666", lineHeight: 1.7, maxWidth: 540, marginBottom: "2.5rem" }}>Built for every Indian — from farmers in Vidarbha to daily wage workers in Bengal.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem" }}>
                    {FEATURES.map((f) => (
                        <div key={f.title} className="fcard" style={{ border: `1.5px solid ${f.green ? "#bbf7d0" : "#ede8e1"}`, borderRadius: 12, padding: "1.5rem", background: "#fff", transition: "all 0.2s", cursor: "default" }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: f.green ? "#f0fdf4" : "#fff8f3", border: `1px solid ${f.green ? "#bbf7d0" : "#ffd4b8"}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.875rem", fontSize: 20 }}>{f.icon}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 6 }}>{f.title}</div>
                            <div style={{ fontSize: 12, color: "#777", lineHeight: 1.6, marginBottom: 10 }}>{f.desc}</div>
                            <span style={{ fontSize: 10, color: f.green ? "#166534" : "#FF6B00", background: f.green ? "#f0fdf4" : "#fff3ed", padding: "3px 8px", borderRadius: 100, border: `1px solid ${f.green ? "#bbf7d0" : "#ffd4b8"}`, fontWeight: 600 }}>{f.tag}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* HOW IT WORKS */}
            <div style={{ padding: "4rem 2.5rem" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FF6B00", fontWeight: 600, marginBottom: "0.75rem" }}>Simple process</div>
                <h2 style={s.secH2}>Benefits in <span style={{ color: "#138808" }}>60 seconds.</span></h2>
                <p style={{ fontSize: "0.9rem", color: "#666", lineHeight: 1.7, maxWidth: 540, marginBottom: "2.5rem" }}>Four steps from your details to your complete welfare picture.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.5rem", position: "relative" }}>
                    <div style={{ position: "absolute", top: 26, left: "8%", right: "8%", height: 1, background: "repeating-linear-gradient(90deg,#FF6B00 0,#FF6B00 6px,transparent 6px,transparent 14px)" }} />
                    {STEPS.map((st) => (
                        <div key={st.n} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
                            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fff", border: `2px solid ${st.saffron ? "#FF6B00" : "#138808"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 700, color: st.saffron ? "#FF6B00" : "#138808", position: "relative", zIndex: 1 }}>{st.n}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{st.title}</div>
                            <div style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>{st.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* TESTIMONIALS */}
            <div style={{ padding: "4rem 2.5rem", background: "#fafaf8" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FF6B00", fontWeight: 600, marginBottom: "0.75rem" }}>Real stories</div>
                <h2 style={s.secH2}>Families who found what was <span style={{ color: "#FF6B00" }}>always theirs.</span></h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem", marginTop: "2rem" }}>
                    {TESTIMONIALS.map((t) => (
                        <div key={t.name} style={{ border: `1.5px solid ${t.highlight ? "#ffd4b8" : "#ede8e1"}`, borderRadius: 12, padding: "1.5rem", background: "#fff" }}>
                            <div style={{ color: "#FF6B00", fontSize: 13, marginBottom: 10 }}>★★★★★</div>
                            <p style={{ fontSize: 12, color: "#555", lineHeight: 1.7, fontStyle: "italic", marginBottom: "1rem" }}>{t.quote}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: t.green ? "#f0fdf4" : "#fff3ed", border: `1.5px solid ${t.green ? "#bbf7d0" : "#ffd4b8"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: t.green ? "#138808" : "#FF6B00", flexShrink: 0 }}>{t.init}</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{t.name}</div>
                                    <div style={{ fontSize: 11, color: "#888" }}>{t.place}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* LOGIN / REGISTER */}
            <div id="loginSection" style={{ padding: "4rem 2.5rem", background: "#fff" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FF6B00", fontWeight: 600, marginBottom: "0.75rem" }}>Join ArthMitra AI</div>
                    <h2 style={{ ...s.secH2, textAlign: "center" }}>Create your free account</h2>
                    <p style={{ fontSize: 13, color: "#888" }}>Save your profile, track your schemes, get personalised alerts</p>
                </div>
                <div style={{ background: "#f8f4ef", borderRadius: 16, padding: "3rem 2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "#fff", border: "1.5px solid #ede8e1", borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 400 }}>
                        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700 }}>Arth<span style={{ color: "#FF6B00" }}>Mitra</span> AI</div>
                            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Welfare Intelligence Platform</div>
                        </div>
                        <div style={{ display: "flex", border: "1.5px solid #ede8e1", borderRadius: 8, overflow: "hidden", marginBottom: "1.5rem" }}>
                            {["login", "signup"].map((tab) => (
                                <div key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: 9, textAlign: "center", fontSize: 13, fontWeight: 600, cursor: "pointer", background: activeTab === tab ? "#FF6B00" : "#fafafa", color: activeTab === tab ? "#fff" : "#888" }}>
                                    {tab === "login" ? "Login" : "Register"}
                                </div>
                            ))}
                        </div>
                        {activeTab === "login" ? (
                            <>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#444", marginBottom: 5 }}>Mobile Number / Email</label>
                                    <input type="text" placeholder="+91 98765 43210" style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e0e0", borderRadius: 7, fontSize: 13, color: "#333" }} />
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#444", marginBottom: 5 }}>Password</label>
                                    <input type="password" placeholder="Enter password" style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e0e0", borderRadius: 7, fontSize: 13, color: "#333" }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                    <label style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 5 }}><input type="checkbox" /> Remember me</label>
                                    <span style={{ fontSize: 11, color: "#FF6B00", cursor: "pointer" }}>Forgot password?</span>
                                </div>
                                <button style={{ width: "100%", background: "#FF6B00", color: "#fff", padding: 11, borderRadius: 8, fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer", marginBottom: "1rem" }}>Login to ArthMitra</button>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "1rem 0", fontSize: 11, color: "#bbb" }}>
                                    <div style={{ flex: 1, height: 1, background: "#ede8e1" }} /> or continue with <div style={{ flex: 1, height: 1, background: "#ede8e1" }} />
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <div style={{ flex: 1, padding: 9, border: "1.5px solid #e0e0e0", borderRadius: 7, fontSize: 12, textAlign: "center", cursor: "pointer", color: "#444", background: "#fafafa" }}>🌐 Google</div>
                                    <div style={{ flex: 1, padding: 9, border: "1.5px solid #e0e0e0", borderRadius: 7, fontSize: 12, textAlign: "center", cursor: "pointer", color: "#444", background: "#fafafa" }}>📱 OTP Login</div>
                                </div>
                            </>
                        ) : (
                            <>
                                {[["Full Name", "text", "Ramesh Kumar"], ["Mobile Number", "text", "+91 98765 43210"]].map(([label, type, ph]) => (
                                    <div key={label} style={{ marginBottom: "1rem" }}>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#444", marginBottom: 5 }}>{label}</label>
                                        <input type={type} placeholder={ph} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e0e0", borderRadius: 7, fontSize: 13, color: "#333" }} />
                                    </div>
                                ))}
                                <div style={{ marginBottom: "1rem" }}>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#444", marginBottom: 5 }}>State</label>
                                    <select style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e0e0", borderRadius: 7, fontSize: 13, color: "#333" }}>
                                        {["Select State", "Maharashtra", "Uttar Pradesh", "Rajasthan", "Madhya Pradesh", "Bihar", "Gujarat"].map(st => <option key={st}>{st}</option>)}
                                    </select>
                                </div>
                                <div style={{ marginBottom: "1rem" }}>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#444", marginBottom: 5 }}>Preferred Language</label>
                                    <select style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e0e0", borderRadius: 7, fontSize: 13, color: "#333" }}>
                                        {["English", "हिंदी (Hindi)", "मराठी (Marathi)", "বাংলা (Bengali)", "தமிழ் (Tamil)"].map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                                <button style={{ width: "100%", background: "#138808", color: "#fff", padding: 11, borderRadius: 8, fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}>Create Free Account</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div style={{ background: "#FF6B00", padding: "4rem 2.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "#fff", fontWeight: 900, marginBottom: "0.75rem" }}>Your family's benefits<br />are waiting. Check now.</h2>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", marginBottom: "2rem" }}>Free · No registration required · Works in 12 Indian languages</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <Link to="/match" style={{ background: "#fff", color: "#FF6B00", padding: "13px 32px", borderRadius: 8, fontWeight: 700, fontSize: "0.95rem", textDecoration: "none" }}>🔍 Check My Eligibility</Link>
                    <Link to="/voice" style={{ background: "transparent", color: "#fff", padding: "13px 32px", borderRadius: 8, fontWeight: 600, fontSize: "0.95rem", border: "2px solid rgba(255,255,255,0.6)", textDecoration: "none" }}>🎙️ Try Voice Input</Link>
                </div>
            </div>

            {/* FOOTER */}
            <footer style={{ background: "#1a1a1a", color: "#ccc", padding: "3rem 2.5rem 1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                    <div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: "#fff", marginBottom: "0.5rem" }}>Arth<span style={{ color: "#FF6B00" }}>Mitra</span> AI</div>
                        <p style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>AI-powered welfare intelligence for rural India. Data sourced from myscheme.gov.in, data.gov.in and Ministry of Rural Development.</p>
                        <div style={{ marginTop: 12, fontSize: 11, color: "#555" }}>SPIT CE Mini Project 2026–27<br />Guide: Dr. Surekha Dholay</div>
                    </div>
                    {[["Platform", ["Scheme Matcher", "Health Score", "Savings Planner", "Voice Input"]], ["Resources", ["myscheme.gov.in", "data.gov.in", "Rural Dev Portal", "CSC Locator"]], ["Languages", ["हिंदी · English", "मराठी · বাংলা", "தமிழ் · తెలుగు", "+6 more"]]].map(([heading, links]) => (
                        <div key={heading}>
                            <h4 style={{ fontSize: 12, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>{heading}</h4>
                            {links.map(l => <div key={l} style={{ fontSize: 12, color: "#888", marginBottom: 5, cursor: "pointer" }}>{l}</div>)}
                        </div>
                    ))}
                </div>
                <div style={{ borderTop: "1px solid #333", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: 11, color: "#555" }}>© 2026 ArthMitra AI · SPIT Mumbai · CE Department</p>
                    <p style={{ fontSize: 11, color: "#555" }}>Built with Python · FastAPI · React · Scikit-learn</p>
                </div>
            </footer>
            <div style={{ height: 3, background: "linear-gradient(90deg,#FF6B00 33%,#fff 33%,#fff 66%,#138808 66%)" }} />
        </div>
    );
}