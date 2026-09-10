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

    // Hide navbar on pages that already have their own custom layout
    if (
        location.pathname === "/" ||
        location.pathname === "/dashboard" ||
        location.pathname === "/admin" ||
        location.pathname.startsWith("/scheme") ||
        location.pathname === "/dc-panel"
    ) {
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        navigate("/");
    };

    return (
        <nav
            style={{
                background: "#0d2818",
                borderBottom: "1px solid rgba(74, 222, 128, 0.2)",
                color: "#ffffff",
                padding: "14px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                fontFamily: "'Inter', system-ui, sans-serif"
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "24px"
                }}
            >
                <Link
                    to="/"
                    style={{
                        textDecoration: "none",
                        color: "#ffffff",
                        fontWeight: "800",
                        fontSize: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <span>🌿</span>

                    <span
                        style={{
                            background:
                                "linear-gradient(90deg, #ff6b00, #4ade80)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}
                    >
                        ArthMitra AI
                    </span>
                </Link>

                <div
                    style={{
                        display: "flex",
                        gap: "18px",
                        fontSize: "14px",
                        fontWeight: "500",
                        alignItems: "center"
                    }}
                >
                    <Link
                        to="/"
                        style={{
                            color: "#d1d5db",
                            textDecoration: "none"
                        }}
                    >
                        {t("nav_home")}
                    </Link>

                    <Link
                        to="/match"
                        style={{
                            color: "#d1d5db",
                            textDecoration: "none"
                        }}
                    >
                        {t("nav_scheme_matcher")}
                    </Link>

                    <Link
                        to="/health"
                        style={{
                            color: "#d1d5db",
                            textDecoration: "none"
                        }}
                    >
                        {t("nav_health_score")}
                    </Link>

                    <Link
                        to="/savings"
                        style={{
                            color: "#d1d5db",
                            textDecoration: "none"
                        }}
                    >
                        {t("nav_savings")}
                    </Link>

                    <Link
                        to="/voice"
                        style={{
                            color: "#d1d5db",
                            textDecoration: "none"
                        }}
                    >
                        {t("nav_voice")}
                    </Link>

                    {user?.role === "admin" && (
                        <Link
                            to="/dc-panel"
                            style={{
                                color: "#818cf8",
                                textDecoration: "none",
                                fontWeight: "600"
                            }}
                        >
                            {t("nav_dc_monitor")}
                        </Link>
                    )}

                    {/* LANGUAGE PICKER */}
                    <select
                        id="navbar-lang-picker"
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        style={{
                            background: "rgba(255,255,255,0.07)",
                            border: "1px solid rgba(74,222,128,0.25)",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#d1d5db",
                            cursor: "pointer",
                            fontFamily: "'Inter', sans-serif"
                        }}
                    >
                       <option value="en">EN</option>
                       <option value="hi">हिं</option>
                       <option value="mr">मरा</option>
                    </select>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                }}
            >
                {user ? (
                    <>
                        <span
                            style={{
                                fontSize: "13px",
                                color: "#4ade80",
                                background: "rgba(74, 222, 128, 0.1)",
                                padding: "4px 10px",
                                borderRadius: "20px"
                            }}
                        >
                            👤 {user.name} ({user.role})
                        </span>

                        <Link
                            to={
                                user.role === "user"
                                    ? "/dashboard"
                                    : "/admin"
                            }
                            style={{
                                background: "#138808",
                                color: "#ffffff",
                                textDecoration: "none",
                                padding: "6px 14px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: "600"
                            }}
                        >
                            {t("nav_dashboard")}
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
                            {t("nav_logout")}
                        </button>
                    </>
                ) : (
                    <Link
                        to="/login"
                        style={{
                            background:
                                "linear-gradient(90deg, #ff6b00 0%, #138808 100%)",
                            color: "#ffffff",
                            textDecoration: "none",
                            padding: "8px 18px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: "600",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
                        }}
                    >
                        {t("nav_signin_register")} →
                    </Link>
                )}
            </div>
        </nav>
    );
}

export default Navbar;