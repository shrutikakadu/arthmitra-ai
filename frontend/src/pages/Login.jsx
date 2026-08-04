import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!mobile || !password) {
      setError("Please fill in both mobile number and password.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { mobile, password });
      if (res.data.status === "success" && res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        if (res.data.user.role && res.data.user.role !== "user") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }

      } else {
        setError(res.data.message || "Login failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || "Invalid mobile number or password.");
    } finally {
      setLoading(false);
    }
  };

  const prefillRole = (mob, pw) => {
    setMobile(mob);
    setPassword(pw);
    setError("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0b1f14 0%, #132a1c 50%, #0d1a12 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "520px",
        background: "rgba(18, 38, 25, 0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(74, 222, 128, 0.2)",
        borderRadius: "20px",
        padding: "36px 32px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "42px", marginBottom: "8px" }}>🏛️</div>
          <h1 style={{ color: "#ffffff", fontSize: "26px", fontWeight: "700", margin: "0 0 6px 0" }}>
            GovTech Portal Authentication
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>
            Government Scheme Lifecycle & Administration Portal
          </p>
        </div>

        {/* 5-Tier Government Hierarchy Quick Login */}
        <div style={{
          background: "rgba(255, 107, 0, 0.06)",
          border: "1px dashed rgba(255, 107, 0, 0.35)",
          borderRadius: "12px",
          padding: "14px",
          marginBottom: "24px"
        }}>
          <div style={{ fontWeight: "700", color: "#ff6b00", marginBottom: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>⚡ Demo Quick Role Selector:</span>
            <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 400 }}>Click to prefill credentials</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              onClick={() => prefillRole("9876543210", "pass123")}
              style={{
                padding: "8px 10px",
                background: "rgba(19, 136, 8, 0.2)",
                border: "1px solid rgba(74, 222, 128, 0.4)",
                color: "#4ade80",
                borderRadius: "8px",
                fontSize: "12px",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              👤 Citizen User
              <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 400 }}>ROLE_USER (Applicant)</div>
            </button>

            <button
              type="button"
              onClick={() => prefillRole("1111111111", "clerk123")}
              style={{
                padding: "8px 10px",
                background: "rgba(245, 158, 11, 0.2)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                color: "#fbbf24",
                borderRadius: "8px",
                fontSize: "12px",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              📋 Section Officer / Clerk
              <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 400 }}>ROLE_VERIFIER (Docs)</div>
            </button>

            <button
              type="button"
              onClick={() => prefillRole("2222222222", "officer123")}
              style={{
                padding: "8px 10px",
                background: "rgba(59, 130, 246, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                color: "#60a5fa",
                borderRadius: "8px",
                fontSize: "12px",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              🏛️ District Collector (DM)
              <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 400 }}>ROLE_DISTRICT_ADMIN</div>
            </button>

            <button
              type="button"
              onClick={() => prefillRole("3333333333", "secretary123")}
              style={{
                padding: "8px 10px",
                background: "rgba(168, 85, 247, 0.2)",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                color: "#c084fc",
                borderRadius: "8px",
                fontSize: "12px",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              🏢 Department Secretary
              <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 400 }}>ROLE_STATE_ADMIN (State)</div>
            </button>
          </div>

          <button
            type="button"
            onClick={() => prefillRole("9999999999", "admin123")}
            style={{
              width: "100%",
              marginTop: "8px",
              padding: "9px 12px",
              background: "linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%)",
              border: "1px solid rgba(249, 115, 22, 0.5)",
              color: "#ff8c00",
              borderRadius: "8px",
              fontSize: "12px",
              textAlign: "center",
              cursor: "pointer",
              fontWeight: "700"
            }}
          >
            👑 Cabinet Minister / System Super Admin (ROLE_SUPER_ADMIN)
          </button>
        </div>


        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#fca5a5",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            marginBottom: "20px"
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", color: "#d1d5db", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>
              Mobile Number
            </label>
            <input
              type="text"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "rgba(10, 25, 16, 0.7)",
                border: "1px solid rgba(74, 222, 128, 0.25)",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", color: "#d1d5db", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "rgba(10, 25, 16, 0.7)",
                border: "1px solid rgba(74, 222, 128, 0.25)",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading ? "#2e7d32" : "linear-gradient(90deg, #138808 0%, #16a34a 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(19, 136, 8, 0.4)",
              transition: "transform 0.1s ease"
            }}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "14px", color: "#9ca3af" }}>
          New to ArthMitra?{" "}
          <Link to="/register" style={{ color: "#4ade80", fontWeight: "600", textDecoration: "none" }}>
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
}
