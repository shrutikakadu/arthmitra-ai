import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    // Hide navbar on home, dashboard, admin, and scheme dashboard pages
    if (location.pathname === "/" || location.pathname === "/dashboard" || location.pathname === "/admin" || location.pathname.startsWith("/scheme")) {
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        alert("Logged out successfully");
        navigate("/");
        window.location.reload();
    };

    return (
        <nav className="bg-green-700 text-white px-6 py-4 flex gap-6 items-center justify-between shadow-md">
            <div className="flex gap-6 items-center">
                <span className="font-bold text-xl mr-4">🌿 ArthMitra AI</span>
                <Link to="/" className="hover:underline">Home</Link>
                <Link to="/match" className="hover:underline">Scheme Matcher</Link>
                <Link to="/health" className="hover:underline">Health Score</Link>
                <Link to="/savings" className="hover:underline">Savings</Link>
                <Link to="/voice" className="hover:underline">Voice</Link>
            </div>
            <div className="flex gap-4 items-center">
                {user ? (
                    <>
                        <span className="text-sm font-medium">👤 {user.name}</span>
                        <Link to={user.role === "admin" ? "/admin" : "/dashboard"}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors">
                            Dashboard
                        </Link>
                        <button onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors">
                            Logout
                        </button>
                    </>
                ) : (
                    <Link to="/"
                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors">
                        Login / Sign Up
                    </Link>
                )}
            </div>
        </nav>
    );
}
export default Navbar;