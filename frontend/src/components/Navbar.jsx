import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLanguage } from "../LanguageContext";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const { lang, setLang, t } = useLanguage();

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                setUser(null);
            }
        } else {
            setUser(null);
        }
    }, [location.pathname]);

    // Hide navbar ONLY on full dashboard views that have their own custom sidebar header
    if (
        location.pathname === "/dashboard" ||
        location.pathname === "/admin" ||
        location.pathname === "/minister" ||
        location.pathname === "/dc-panel"
    ) {
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        navigate("/");
    };

    const navItems = [
        { path: "/", label: t("nav_home") || "Home" },
        { path: "/schemes", label: t("nav_schemes") || "Schemes" },
        { path: "/match", label: t("nav_scheme_matcher") || "AI Scheme Matcher" },
        { path: "/health", label: t("nav_health_score") || "Financial Health" },
        { path: "/savings", label: t("nav_savings") || "Savings Planner" },
        { path: "/voice", label: t("nav_voice") || "Voice Assistant" },
    ];

    return (
        <nav
            style={{
                position: "sticky",
                top: 0,
                zIndex: 100,
                background: "rgba(11, 25, 44, 0.95)",
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                padding: "12px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                fontFamily: "'Inter', system-ui, sans-serif"
            }}
        >
            {/* LEFT: Logo */}
            <Link
                to="/"
                style={{
                    textDecoration: "none",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0
                }}
            >
                <span style={{ fontSize: "22px" }}>🌿</span>
                <span
                    style={{
                        background: "linear-gradient(90deg, #ff6b00 0%, #4ade80 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        letterSpacing: "-0.3px"
                    }}
                >
                    ArthMitra AI
                </span>
            </Link>

            {/* CENTER: Navigation Links */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    fontSize: "14px",
                    fontWeight: "500"
                }}
            >
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                color: isActive ? "#4ade80" : "#e2e8f0",
                                textDecoration: "none",
                                fontWeight: isActive ? "700" : "500",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                background: isActive ? "rgba(74, 222, 128, 0.1)" : "transparent",
                                transition: "all 0.2s ease"
                            }}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            {/* RIGHT: Language Selector + Auth Buttons */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexShrink: 0
                }}
            >
                {/* Language Picker */}
                <select
                    id="navbar-lang-picker"
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#ffffff",
                        cursor: "pointer",
                        outline: "none",
                        fontFamily: "'Inter', sans-serif"
                    }}
                >
                    <option value="en" style={{ background: "#0b192c", color: "#fff" }}>English</option>
                    <option value="hi" style={{ background: "#0b192c", color: "#fff" }}>हिन्दी</option>
                    <option value="mr" style={{ background: "#0b192c", color: "#fff" }}>मराठी</option>
                </select>

                {user ? (
                    <>
                        <span
                            style={{
                                fontSize: "12px",
                                color: "#4ade80",
                                background: "rgba(74, 222, 128, 0.12)",
                                border: "1px solid rgba(74, 222, 128, 0.25)",
                                padding: "5px 12px",
                                borderRadius: "20px",
                                fontWeight: "600"
                            }}
                        >
                            👤 {user.name} ({user.role})
                        </span>

                        <Link
                            to={user.role === "user" ? "/dashboard" : user.role === "minister" ? "/minister" : "/admin"}
                            style={{
                                background: "#138808",
                                color: "#ffffff",
                                textDecoration: "none",
                                padding: "7px 16px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: "600"
                            }}
                        >
                            {t("nav_dashboard") || "Dashboard"}
                        </Link>

                        <button
                            onClick={handleLogout}
                            style={{
                                background: "rgba(239, 68, 68, 0.2)",
                                color: "#fca5a5",
                                border: "1px solid rgba(239, 68, 68, 0.4)",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                cursor: "pointer",
                                fontWeight: "600"
                            }}
                        >
                            {t("nav_logout") || "Logout"}
                        </button>
                    </>
                ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Link
                            to="/login"
                            style={{
                                color: "#e2e8f0",
                                textDecoration: "none",
                                padding: "7px 14px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: "600",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                background: "rgba(255, 255, 255, 0.05)"
                            }}
                        >
                            {t("nav_signin") || "Sign In"}
                        </Link>
                        <Link
                            to="/register"
                            style={{
                                background: "linear-gradient(90deg, #ff6b00 0%, #138808 100%)",
                                color: "#ffffff",
                                textDecoration: "none",
                                padding: "7px 16px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: "600",
                                boxShadow: "0 2px 10px rgba(255, 107, 0, 0.25)"
                            }}
                        >
                            {t("nav_register") || "Register"} →
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;