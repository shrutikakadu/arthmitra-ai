import { useState, useRef, useEffect } from "react";
import API from "../api/axios";
import { useLanguage } from "../LanguageContext";

const QUICK_QUESTIONS = {
  en: [
    "How long does verification take?",
    "Am I eligible for this scheme?",
    "What documents do I need?",
    "How do I apply step by step?",
    "What is the benefit amount?",
  ],
  hi: [
    "सत्यापन में कितना समय लगता है?",
    "क्या मैं इस योजना के लिए पात्र हूं?",
    "मुझे कौन से दस्तावेज़ चाहिए?",
    "मैं चरण-दर-चरण कैसे आवेदन करूं?",
    "लाभ की राशि क्या है?",
  ],
  mr: [
    "पडताळणीला किती वेळ लागतो?",
    "मी या योजनेसाठी पात्र आहे का?",
    "मला कोणती कागदपत्रे लागतात?",
    "मी चरण-दर-चरण कसा अर्ज करू?",
    "लाभाची रक्कम किती आहे?",
  ],
};

const PLACEHOLDER = {
  en: "Ask about eligibility, documents, timelines...",
  hi: "पात्रता, दस्तावेज़, समयसीमा के बारे में पूछें...",
  mr: "पात्रता, कागदपत्रे, वेळ याबद्दल विचारा...",
};

const THINKING = {
  en: "Searching scheme knowledge base...",
  hi: "योजना की जानकारी खोज रहा है...",
  mr: "योजना माहिती शोधत आहे...",
};

const GREETING = {
  en: "👋 Hi! I'm the ArthMitra Helper AI. Ask me anything about this scheme — eligibility, documents, timelines, or how to apply.",
  hi: "👋 नमस्ते! मैं ArthMitra का सहायक AI हूं। इस योजना के बारे में कुछ भी पूछें — पात्रता, दस्तावेज़, समय, या आवेदन कैसे करें।",
  mr: "👋 नमस्कार! मी ArthMitra सहाय्यक AI आहे. या योजनेबद्दल काहीही विचारा — पात्रता, कागदपत्रे, वेळ, किंवा अर्ज कसा करायचा.",
};

export default function SchemeChatBot({ schemeName }) {
  const { lang } = useLanguage();
  const langKey = lang === "mr" ? "mr" : lang === "hi" ? "hi" : "en";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: GREETING[langKey], time: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, messages]);

  const sendMessage = async (question) => {
    const q = question || input.trim();
    if (!q || loading) return;
    setInput("");

    const userMsg = { role: "user", text: q, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await API.post("/schemes/chat", {
        scheme_name: schemeName,
        question: q,
        language: langKey,
      });
      const botMsg = {
        role: "bot",
        text: res.data.answer,
        confidence: res.data.confidence,
        sources: res.data.sources || [],
        time: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "bot",
          text: langKey === "hi"
            ? "माफ़ करें, कोई त्रुटि हुई। कृपया पुनः प्रयास करें।"
            : langKey === "mr"
            ? "माफ करा, एक त्रुटी आली. कृपया पुन्हा प्रयत्न करा."
            : "Sorry, an error occurred. Please try again.",
          confidence: "low",
          time: new Date(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const confidenceBadge = (conf) => {
    const map = { high: { color: "#16A34A", bg: "#DCFCE7", label: "✓ Verified" }, medium: { color: "#D97706", bg: "#FEF3C7", label: "~ Approximate" }, low: { color: "#9CA3AF", bg: "#F3F4F6", label: "i General" } };
    const c = map[conf] || map.medium;
    return <span style={{ fontSize: 10, color: c.color, background: c.bg, padding: "1px 6px", borderRadius: 10, fontWeight: 600, marginLeft: 6 }}>{c.label}</span>;
  };

  return (
    <>
      {/* ─── FLOATING BUTTON ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Helper AI — Ask about this scheme"
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: open ? "#1E293B" : "linear-gradient(135deg, #FF6B00, #FF8C38)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(255,107,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          zIndex: 9999,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: open ? "rotate(45deg) scale(1.05)" : "rotate(0) scale(1)",
        }}
        aria-label="Open Helper AI chatbot"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* ─── CHAT PANEL ──────────────────────────────────────────────────── */}
      <div style={{
        position: "fixed",
        bottom: 96,
        right: 28,
        width: 380,
        maxWidth: "calc(100vw - 56px)",
        height: 520,
        maxHeight: "calc(100vh - 120px)",
        background: "#FFFFFF",
        borderRadius: 20,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        zIndex: 9998,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.08)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: open ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "all" : "none",
      }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #FF6B00, #FF8C38)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
              {langKey === "hi" ? "ArthMitra सहायक" : langKey === "mr" ? "ArthMitra सहाय्यक" : "ArthMitra Helper AI"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 1 }}>
              {schemeName}
            </div>
          </div>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: "#4ADE80",
            boxShadow: "0 0 6px #4ADE80",
          }} title="Online" />
        </div>

        {/* Quick Questions */}
        <div style={{
          padding: "10px 12px 6px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex",
          gap: 6,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}>
          {QUICK_QUESTIONS[langKey].map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              style={{
                whiteSpace: "nowrap",
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 20,
                border: "1.5px solid #FF6B00",
                background: "#FFF3ED",
                color: "#C2410C",
                cursor: "pointer",
                fontWeight: 600,
                flexShrink: 0,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.target.style.background = "#FF6B00"; e.target.style.color = "#fff"; }}
              onMouseLeave={e => { e.target.style.background = "#FFF3ED"; e.target.style.color = "#C2410C"; }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          scrollbarWidth: "thin",
          scrollbarColor: "#E2E8F0 transparent",
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}>
              <div style={{
                maxWidth: "82%",
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #FF6B00, #FF8C38)"
                  : "#F8FAFC",
                color: msg.role === "user" ? "#fff" : "#1E293B",
                fontSize: 13,
                lineHeight: 1.6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                border: msg.role === "bot" ? "1px solid #E2E8F0" : "none",
                whiteSpace: "pre-wrap",
              }}>
                {msg.text}
                {msg.role === "bot" && msg.confidence && msg.confidence !== "low" && confidenceBadge(msg.confidence)}
                <div style={{ fontSize: 10, color: msg.role === "user" ? "rgba(255,255,255,0.7)" : "#94A3B8", marginTop: 4 }}>
                  {formatTime(msg.time)}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                padding: "10px 14px",
                borderRadius: "18px 18px 18px 4px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#FF6B00",
                      animation: `bounce 1.2s ${d * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>{THINKING[langKey]}</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "10px 12px",
          borderTop: "1px solid #F1F5F9",
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "#FFFFFF",
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={PLACEHOLDER[langKey]}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 24,
              border: "1.5px solid #E2E8F0",
              outline: "none",
              fontSize: 13,
              background: "#F8FAFC",
              transition: "border 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "#FF6B00"}
            onBlur={e => e.target.style.borderColor = "#E2E8F0"}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: loading || !input.trim() ? "#E2E8F0" : "linear-gradient(135deg, #FF6B00, #FF8C38)",
              border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            ➤
          </button>
        </div>
      </div>

      {/* Bounce animation keyframes injected once */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </>
  );
}
