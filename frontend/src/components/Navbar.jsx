import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch (e) { setUser(null); }
        } else {
            setUser(null);
        }
    }, [location.pathname]);

    // Hide navbar on pages that have their own custom sidebar/header layout
    if (location.pathname === "/dashboard" || location.pathname === "/admin" || location.pathname.startsWith("/scheme") || location.pathname === "/dc-panel") {
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    return (
        <nav style={{
            background: "#0d2818",
            borderBottom: "1px solid rgba(74, 222, 128, 0.2)",
            color: "#ffffff",
            padding: "14px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            fontFamily: "'Inter', system-ui, sans-serif"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <Link to="/" style={{ textDecoration: "none", color: "#ffffff", fontWeight: "800", fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🌿</span>
                    <span style={{ background: "linear-gradient(90deg, #ff6b00, #4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        ArthMitra AI
                    </span>
                </Link>

                <div style={{ display: "flex", gap: "18px", fontSize: "14px", fontWeight: "500" }}>
                    <Link to="/" style={{ color: "#d1d5db", textDecoration: "none" }}>Home</Link>
                    <Link to="/match" style={{ color: "#d1d5db", textDecoration: "none" }}>Scheme Matcher</Link>
                    <Link to="/health" style={{ color: "#d1d5db", textDecoration: "none" }}>Health Score</Link>
                    <Link to="/savings" style={{ color: "#d1d5db", textDecoration: "none" }}>Savings</Link>
                    <Link to="/voice" style={{ color: "#d1d5db", textDecoration: "none" }}>Voice</Link>
                </div>

            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {user ? (
                    <>
                        <span style={{ fontSize: "13px", color: "#4ade80", background: "rgba(74, 222, 128, 0.1)", padding: "4px 10px", borderRadius: "20px" }}>
                            👤 {user.name} ({user.role})
                        </span>
                        <Link to={user.role === "admin" ? "/admin" : "/dashboard"}
                            style={{
                                background: "#138808", color: "#ffffff", textDecoration: "none",
                                padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600"
                            }}>
                            Dashboard
                        </Link>
                        <button onClick={handleLogout}
                            style={{
                                background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.4)",
                                padding: "6px 12px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontWeight: "600"
                            }}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login"
                            style={{
                                background: "#138808", color: "#ffffff", textDecoration: "none",
                                padding: "7px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600"
                            }}>
                            Sign In
                        </Link>
                        <Link to="/register"
                            style={{
                                background: "#ff6b00", color: "#ffffff", textDecoration: "none",
                                padding: "7px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600"
                            }}>
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
export default Navbar;