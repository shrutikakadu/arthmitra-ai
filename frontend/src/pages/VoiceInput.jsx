import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import SchemeCard from "../components/SchemeCard";
import Loader from "../components/Loader";
import Footer from "../components/Footer";
import { useLanguage } from "../LanguageContext";

export default function VoiceInput() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedProfile, setParsedProfile] = useState(null);
  const [matchedSchemes, setMatchedSchemes] = useState(null);
  const [loading, setLoading] = useState(false);

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
      setTranscript(t("voice_listening") + " — " + t("voice_example_text"));
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

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", width: "100%", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.2)", padding: "4px 14px", borderRadius: 20, color: "#a855f7", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {t("voice_badge")}
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>
            {t("voice_title")} <span style={{ color: "#a855f7" }}>{t("voice_title_hl")}</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#64748b", maxWidth: 600, margin: "0 auto" }}>{t("voice_subtitle")}</p>
        </div>

        {/* Voice Trigger Card */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "36px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", textAlign: "center", marginBottom: 32 }}>
          <button onClick={startListening}
            style={{ width: 90, height: 90, borderRadius: "50%", background: isListening ? "linear-gradient(135deg, #ef4444, #f97316)" : "linear-gradient(135deg, #a855f7, #6366f1)", border: "none", color: "#ffffff", fontSize: 36, cursor: "pointer", boxShadow: isListening ? "0 0 0 12px rgba(239, 68, 68, 0.2)" : "0 8px 24px rgba(168, 85, 247, 0.35)", transition: "all 0.3s ease", marginBottom: 20 }}>
            🎙️
          </button>

          <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
            {isListening ? t("voice_listening") : t("voice_tap")}
          </div>

          <p style={{ fontSize: 14, color: "#64748b", maxWidth: 450, margin: "0 auto" }}>
            {t("voice_example")} <em>{t("voice_example_text")}</em>
          </p>
        </div>

        {/* Transcript Box */}
        {transcript && (
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px", marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              {t("voice_transcript_label")}
            </div>
            <div style={{ fontSize: 16, color: "#1e293b", fontStyle: "italic", lineHeight: 1.5 }}>
              "{transcript}"
            </div>
          </div>
        )}

        {/* Parsed Profile */}
        {parsedProfile && (
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px", marginBottom: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 14px 0" }}>{t("voice_profile_label")}</h3>
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
              {t("voice_matched_title")} ({matchedSchemes.total_schemes})
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