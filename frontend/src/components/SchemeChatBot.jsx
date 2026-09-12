import { useState, useRef, useEffect } from "react";
import API from "../api/axios";
import { useLanguage } from "../LanguageContext";

const CHAT_STORAGE_KEY = "arthmitra_chat_history";

export default function SchemeChatBot({ schemeName }) {
  const { lang, t } = useLanguage();
  const langKey = lang === "mr" ? "mr" : lang === "hi" ? "hi" : "en";

  const quickQuestions = [
    t("chatbot_quick_1"),
    t("chatbot_quick_2"),
    t("chatbot_quick_3"),
    t("chatbot_quick_4"),
    t("chatbot_quick_5"),
  ];

  const getUserContext = () => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  };

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [{ role: "bot", text: t("chatbot_greeting"), time: new Date().toISOString() }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Synchronize messages with sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Update default greeting if language changes and only greeting is present
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === "bot") {
        return [{ ...prev[0], text: t("chatbot_greeting") }];
      }
      return prev;
    });
  }, [lang, t]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, messages, loading]);

  const clearChat = () => {
    try {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setMessages([{ role: "bot", text: t("chatbot_greeting"), time: new Date().toISOString() }]);
  };

  const sendMessage = async (question) => {
    const q = (question || input).trim();
    if (!q) {
      return;
    }
    if (loading) return;
    setInput("");

    const userMsg = { role: "user", text: q, time: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await API.post("/schemes/chat", {
        scheme_name: schemeName || "",
        question: q,
        language: langKey,
        user_context: getUserContext(),
      });

      const botMsg = {
        role: "bot",
        text: res.data.answer || t("err_invalid_response"),
        confidence: res.data.confidence,
        sources: res.data.sources || [],
        time: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      let errorMsg = t("err_generic");
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        errorMsg = t("err_timeout");
      } else if (!err.response) {
        errorMsg = t("err_backend_offline");
      } else if (err.response.status === 422 || err.response.status === 500) {
        errorMsg = t("err_invalid_response");
      }

      setMessages(prev => [
        ...prev,
        {
          role: "bot",
          text: errorMsg,
          confidence: "low",
          time: new Date().toISOString(),
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

  const formatTime = (isoOrDate) => {
    try {
      const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const confidenceBadge = (conf) => {
    const map = {
      high: { color: "#16A34A", bg: "#DCFCE7", label: "✓ Verified" },
      medium: { color: "#D97706", bg: "#FEF3C7", label: "~ Approximate" },
      low: { color: "#9CA3AF", bg: "#F3F4F6", label: "i General" }
    };
    const c = map[conf] || map.medium;
    return <span style={{ fontSize: 10, color: c.color, background: c.bg, padding: "1px 6px", borderRadius: 10, fontWeight: 600, marginLeft: 6 }}>{c.label}</span>;
  };

  return (
    <>
      {/* ─── FLOATING BUTTON ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title={t("chatbot_title")}
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
              {t("chatbot_title")}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", marginTop: 1 }}>
              {schemeName || t("chatbot_subtitle")}
            </div>
          </div>
          <button
            onClick={clearChat}
            title={t("chatbot_clear_chat")}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              transition: "background 0.2s",
            }}
            onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.35)"}
            onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.2)"}
          >
            🗑️
          </button>
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
          {quickQuestions.map((q, i) => (
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
                maxWidth: "84%",
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
                <span style={{ fontSize: 11, color: "#94A3B8" }}>{t("chatbot_thinking")}</span>
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
            placeholder={t("chatbot_placeholder")}
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

      {/* Keyframe animations */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
