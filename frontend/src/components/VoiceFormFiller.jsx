import { useState, useRef, useCallback } from "react";

const LANG_PROMPTS = {
  en: {
    name:        "What is your full name?",
    age:         "How old are you?",
    occupation:  "What is your occupation?",
    income:      "What is your annual family income in rupees?",
    state:       "Which state do you live in?",
    caste:       "What is your caste category? For example: General, OBC, SC, ST, or EWS.",
    family_size: "How many members are in your family?",
    gender:      "What is your gender?",
    education:   "What is your highest education level?",
  },
  hi: {
    name:        "आपका पूरा नाम क्या है?",
    age:         "आपकी उम्र कितनी है?",
    occupation:  "आपका व्यवसाय क्या है?",
    income:      "आपकी वार्षिक पारिवारिक आय कितनी है?",
    state:       "आप किस राज्य में रहते हैं?",
    caste:       "आपकी जाति श्रेणी क्या है? जैसे: सामान्य, ओबीसी, एससी, एसटी, या ईडब्ल्यूएस।",
    family_size: "आपके परिवार में कितने सदस्य हैं?",
    gender:      "आपका लिंग क्या है?",
    education:   "आपकी सर्वोच्च शैक्षिक योग्यता क्या है?",
  },
  mr: {
    name:        "तुमचे पूर्ण नाव काय आहे?",
    age:         "तुमचे वय किती आहे?",
    occupation:  "तुमचा व्यवसाय काय आहे?",
    income:      "तुमचे वार्षिक कौटुंबिक उत्पन्न किती आहे?",
    state:       "तुम्ही कोणत्या राज्यात राहता?",
    caste:       "तुमची जात प्रवर्ग कोणती आहे? उदा: खुला, ओबीसी, SC, ST, किंवा EWS.",
    family_size: "तुमच्या कुटुंबात किती सदस्य आहेत?",
    gender:      "तुमचे लिंग काय आहे?",
    education:   "तुमची सर्वोच्च शैक्षणिक पात्रता काय आहे?",
  },
};

const LANG_CODES = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

const VOICE_BTN_STYLE = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "2px 6px",
  borderRadius: 6,
  fontSize: 18,
  lineHeight: 1,
  transition: "all 0.2s",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

/**
 * VoiceFormFiller — per-field voice input component.
 *
 * Usage (per-field mic button):
 *   <VoiceFormFiller fieldKey="income" lang="mr" onResult={(val) => setProfile(p => ({...p, income: val}))} />
 *
 * Usage (guided sequential mode — pass fieldKeys and onFieldUpdate):
 *   <VoiceFormFiller
 *     mode="guided"
 *     fieldKeys={["name","age","income","caste","state"]}
 *     lang="hi"
 *     onFieldUpdate={(key, val) => setProfile(p => ({...p, [key]: val}))}
 *   />
 */
export default function VoiceFormFiller({
  // Single-field mode
  fieldKey,
  onResult,
  // Guided mode
  mode = "single",
  fieldKeys = [],
  onFieldUpdate,
  // Shared
  lang = "en",
  className = "",
  style = {},
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [guidedIdx, setGuidedIdx] = useState(0);
  const recognitionRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = !!SpeechRecognition;

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_CODES[lang] || "en-IN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [lang]);

  const startSingleField = useCallback(() => {
    if (!supported) {
      setError("Voice not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    setError("");
    setTranscript("");

    const prompt = LANG_PROMPTS[lang]?.[fieldKey];
    if (prompt) speak(prompt);

    const rec = new SpeechRecognition();
    rec.lang = LANG_CODES[lang] || "en-IN";
    rec.continuous = false;
    rec.interimResults = false;
    recognitionRef.current = rec;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e) => { setListening(false); setError("Error: " + e.error); };
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setTranscript(t);
      if (onResult) onResult(t);
    };

    rec.start();
  }, [fieldKey, lang, onResult, speak, supported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    window.speechSynthesis?.cancel();
  }, []);

  const startGuidedMode = useCallback(async () => {
    if (!supported || !fieldKeys.length || !onFieldUpdate) {
      setError("Guided voice mode requires browser support and field configuration.");
      return;
    }
    setError("");

    const processField = (idx) => {
      if (idx >= fieldKeys.length) {
        speak(lang === "hi" ? "धन्यवाद! सभी जानकारी भर दी गई है।" :
              lang === "mr" ? "धन्यवाद! सर्व माहिती भरली गेली आहे." :
              "Thank you! All fields have been filled.");
        setGuidedIdx(0);
        return;
      }

      const key = fieldKeys[idx];
      const prompt = LANG_PROMPTS[lang]?.[key] || `Please provide your ${key}`;
      setGuidedIdx(idx);

      speak(prompt);

      // Wait for speech to finish before listening
      const waitAndListen = () => {
        if (window.speechSynthesis.speaking) {
          setTimeout(waitAndListen, 200);
          return;
        }

        const rec = new SpeechRecognition();
        rec.lang = LANG_CODES[lang] || "en-IN";
        rec.continuous = false;
        rec.interimResults = false;
        recognitionRef.current = rec;

        rec.onstart = () => setListening(true);
        rec.onend = () => { setListening(false); };
        rec.onerror = () => { setListening(false); processField(idx + 1); };
        rec.onresult = (e) => {
          const t = e.results[0][0].transcript;
          setTranscript(`${key}: ${t}`);
          onFieldUpdate(key, t);
          setTimeout(() => processField(idx + 1), 800);
        };

        rec.start();
      };

      setTimeout(waitAndListen, 600);
    };

    processField(0);
  }, [fieldKeys, lang, onFieldUpdate, speak, supported]);

  // ─── SINGLE-FIELD MODE ────────────────────────────────────────────────────
  if (mode === "single") {
    return (
      <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 2, ...style }}>
        <button
          type="button"
          title={LANG_PROMPTS[lang]?.[fieldKey] || "Click to speak"}
          onClick={listening ? stopListening : startSingleField}
          style={{
            ...VOICE_BTN_STYLE,
            color: listening ? "#EF4444" : "#FF6B00",
            animation: listening ? "pulse 1s infinite" : "none",
          }}
        >
          {listening ? "🛑" : "🎙️"}
        </button>
        {transcript && (
          <span style={{ fontSize: 10, color: "#888", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            "{transcript.slice(0, 30)}"
          </span>
        )}
        {error && <span style={{ fontSize: 10, color: "#EF4444" }}>⚠️</span>}
      </span>
    );
  }

  // ─── GUIDED MODE ─────────────────────────────────────────────────────────
  return (
    <div style={{ marginBottom: 16, ...style }}>
      <button
        type="button"
        onClick={listening ? stopListening : startGuidedMode}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          borderRadius: 10,
          border: `2px solid ${listening ? "#EF4444" : "#FF6B00"}`,
          background: listening ? "#FEF2F2" : "linear-gradient(135deg, #fff3ed, #fff)",
          color: listening ? "#DC2626" : "#FF6B00",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          boxShadow: listening ? "0 0 0 4px rgba(239,68,68,0.15)" : "0 0 0 4px rgba(255,107,0,0.08)",
          transition: "all 0.2s",
        }}
      >
        <span style={{ fontSize: 20, animation: listening ? "pulse 1s infinite" : "none" }}>
          {listening ? "🛑" : "🎙️"}
        </span>
        {listening
          ? (lang === "hi" ? "बोलें... (रोकने के लिए क्लिक करें)" :
             lang === "mr" ? "बोला... (थांबण्यासाठी क्लिक करा)" :
             "Listening... (click to stop)")
          : (lang === "hi" ? "🎙️ आवाज़ से फॉर्म भरें" :
             lang === "mr" ? "🎙️ आवाजाने फॉर्म भरा" :
             "🎙️ Fill Form by Voice")}
      </button>

      {listening && fieldKeys[guidedIdx] && (
        <div style={{
          marginTop: 10,
          padding: "8px 14px",
          background: "#FFF3ED",
          border: "1px solid #FED7AA",
          borderRadius: 8,
          fontSize: 13,
          color: "#92400E",
          animation: "fadeIn 0.3s ease",
        }}>
          <span style={{ fontWeight: 600 }}>
            {lang === "hi" ? "अभी पूछ रहा है: " : lang === "mr" ? "आत्ता विचारत आहे: " : "Now asking: "}
          </span>
          {LANG_PROMPTS[lang]?.[fieldKeys[guidedIdx]] || fieldKeys[guidedIdx]}
        </div>
      )}

      {transcript && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#64748B", padding: "4px 8px", background: "#F8FAFC", borderRadius: 6 }}>
          ✓ {transcript}
        </div>
      )}

      {!supported && (
        <p style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>
          ⚠️ Voice input is not supported in this browser. Please use Chrome or Edge.
        </p>
      )}
    </div>
  );
}
