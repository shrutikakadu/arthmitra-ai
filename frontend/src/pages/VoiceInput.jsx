import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import SchemeCard from "../components/SchemeCard";
import Loader from "../components/Loader";
import Footer from "../components/Footer";
import { useLanguage } from "../LanguageContext";

export default function VoiceInput() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);

  // Authenticated state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedProfile, setParsedProfile] = useState(null);
  const [matchedSchemes, setMatchedSchemes] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.role && u.role !== "user") {
          navigate(u.role === "minister" ? "/minister" : "/admin");
          return;
        }
        setUser(u);
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [navigate]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript((t("voice_listening") || "Listening...") + " — " + (t("voice_example_text") || "Speak your details"));
    };

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
      setTranscript("Error occurred during speech recognition: " + event.error);
    };

    recognition.onend = () => { setIsListening(false); };

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      await processVoiceText(text);
    };

    recognition.start();
  };

  const processVoiceText = async (text) => {
    setLoading(true);
    try {
      const res = await API.post("/voice", { text });
      if (res.data.status === "ok" && res.data.profile) {
        setParsedProfile(res.data.profile);
        const matchRes = await API.post("/match-schemes", res.data.profile);
        setMatchedSchemes(matchRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── IF VISITOR (NOT LOGGED IN): PUBLIC DEMO SHOWCASE ─────────────────────────
  if (!user) {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, #0b192c 0%, #1e293b 100%)", color: "#ffffff", padding: "50px 24px", textAlign: "center" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)", padding: "4px 14px", borderRadius: 20, color: "#c084fc", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              🎙️ Voice Assistant Showcase
            </div>
            <h1 style={{ fontSize: "36px", fontWeight: 900, marginBottom: 10 }}>
              Multilingual <span style={{ color: "#c084fc" }}>Voice-Assisted Form Filling</span>
            </h1>
            <p style={{ fontSize: "16px", color: "#94a3b8", maxWidth: 650, margin: "0 auto", lineHeight: 1.6 }}>
              No typing required. Speak naturally in your native language to let ArthMitra's AI automatically extract profile fields and find your schemes.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px", flex: 1, width: "100%", boxSizing: "border-box" }}>
          
          {/* Supported Languages Showcase */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Supported Indian Languages</h2>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              <span style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "10px 20px", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "#0f172a", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                🇬🇧 English (en-IN)
              </span>
              <span style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "10px 20px", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "#ff6b00", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                🇮🇳 हिन्दी (hi-IN)
              </span>
              <span style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "10px 20px", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "#0284c7", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                🚩 मराठी (mr-IN)
              </span>
            </div>
          </div>

          {/* Example Conversation & UI Mockup */}
          <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 20, padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", marginBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#a855f7", background: "#f3e8ff", border: "1px solid #d8b4fe", padding: "4px 12px", borderRadius: 20, textTransform: "uppercase" }}>
                  💡 Interactive Voice Flow Mockup
                </span>
                <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginTop: 8 }}>How Voice Form Filling Works</h3>
              </div>
            </div>

            {/* Chat Mockup */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 750, margin: "0 auto 32px auto" }}>
              {/* AI Bubble 1 */}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ background: "#a855f7", color: "#fff", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                  AI
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: "0 16px 16px 16px", padding: "14px 18px", fontSize: 14, color: "#0f172a", lineHeight: 1.5 }}>
                  "Hello! What is your name, state, income, and occupation?"
                </div>
              </div>

              {/* User Voice Bubble */}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexDirection: "row-reverse" }}>
                <div style={{ background: "#2563eb", color: "#fff", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                  👤
                </div>
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "16px 0 16px 16px", padding: "14px 18px", fontSize: 14, color: "#1e40af", lineHeight: 1.5 }}>
                  🎙️ <em>"Main Sunita Pawar hoon, Maharashtra se, kheti karti hoon aur meri aamdani 60,000 rupaye hai."</em>
                </div>
              </div>

              {/* AI Bubble 2 - Form Extracted */}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ background: "#138808", color: "#fff", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                  ✓
                </div>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0 16px 16px 16px", padding: "16px 20px", fontSize: 14, color: "#166534", width: "100%" }}>
                  <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 15 }}>🧠 Form Fields Extracted Automatically:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                    <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: 8, border: "1px solid #dcfce7" }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>NAME</span>
                      <div style={{ fontWeight: 700 }}>Sunita Pawar</div>
                    </div>
                    <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: 8, border: "1px solid #dcfce7" }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>STATE</span>
                      <div style={{ fontWeight: 700 }}>Maharashtra</div>
                    </div>
                    <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: 8, border: "1px solid #dcfce7" }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>OCCUPATION</span>
                      <div style={{ fontWeight: 700 }}>Farmer</div>
                    </div>
                    <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: 8, border: "1px solid #dcfce7" }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>INCOME</span>
                      <div style={{ fontWeight: 700 }}>₹60,000</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Banner */}
          <div style={{ background: "linear-gradient(90deg, #a855f7 0%, #6366f1 100%)", color: "#ffffff", padding: "36px 28px", borderRadius: 16, textAlign: "center" }}>
            <h3 style={{ fontSize: "24px", fontWeight: 800, marginBottom: 8 }}>Try multilingual voice-assisted form filling</h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", maxWidth: 600, margin: "0 auto 20px auto" }}>
              Sign in to use your microphone and let our real NLP engine parse your spoken words into scheme applications.
            </p>
            <Link
              to="/login"
              style={{
                background: "#ffffff",
                color: "#0f172a",
                textDecoration: "none",
                padding: "12px 28px",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                display: "inline-block",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)"
              }}
            >
              Login to Use Multilingual Voice Assistant →
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ─── CITIZEN MODE: REAL VOICE ASSISTANT ───────────────────────────────────────
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", width: "100%", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.2)", padding: "4px 14px", borderRadius: 20, color: "#a855f7", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {t("voice_badge") || "🎙️ Voice-Enabled NLP Assistant"}
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>
            {t("voice_title") || "Speak in Your"} <span style={{ color: "#a855f7" }}>{t("voice_title_hl") || "Language"}</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#64748b", maxWidth: 600, margin: "0 auto" }}>
            {t("voice_subtitle") || "No typing required. Speak naturally in English, Hindi, or regional accents to extract your profile and discover eligible government schemes."}
          </p>
        </div>

        {/* Voice Trigger Card */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "36px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", textAlign: "center", marginBottom: 32 }}>
          <button onClick={startListening}
            style={{ width: 90, height: 90, borderRadius: "50%", background: isListening ? "linear-gradient(135deg, #ef4444, #f97316)" : "linear-gradient(135deg, #a855f7, #6366f1)", border: "none", color: "#ffffff", fontSize: 36, cursor: "pointer", boxShadow: isListening ? "0 0 0 12px rgba(239, 68, 68, 0.2)" : "0 8px 24px rgba(168, 85, 247, 0.35)", transition: "all 0.3s ease", marginBottom: 20 }}>
            🎙️
          </button>

          <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
            {isListening ? (t("voice_listening") || "Listening... Speak Now") : (t("voice_tap") || "Tap Microphone to Start Speaking")}
          </div>

          <p style={{ fontSize: 14, color: "#64748b", maxWidth: 450, margin: "0 auto" }}>
            {t("voice_example") || "Example:"} <em>{t("voice_example_text") || "\"I am a 35 years old farmer from Maharashtra, OBC category, income 60000 rupees and 4 family members\""}</em>
          </p>
        </div>

        {/* Transcript Box */}
        {transcript && (
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px", marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              {t("voice_transcript_label") || "Transcribed Voice Text:"}
            </div>
            <div style={{ fontSize: 16, color: "#1e293b", fontStyle: "italic", lineHeight: 1.5 }}>
              "{transcript}"
            </div>
          </div>
        )}

        {/* Parsed Profile */}
        {parsedProfile && (
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px", marginBottom: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 14px 0" }}>{t("voice_profile_label") || "🧠 NLP Extracted Profile Fields"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              {Object.entries(parsedProfile).map(([key, val]) => (
                val ? (
                  <div key={key} style={{ background: "#fafaf8", border: "1px solid #f1f5f9", padding: "10px", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>{key}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>{String(val)}</div>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}

        {loading && <Loader textKey="voice_loader" />}

        {/* Matched Schemes */}
        {matchedSchemes && (
          <div>
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
              {t("voice_matched_title") || "Matched Schemes"} ({matchedSchemes.total_schemes})
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {(matchedSchemes.schemes || []).map((s, idx) => (<SchemeCard key={idx} scheme={s} />))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}