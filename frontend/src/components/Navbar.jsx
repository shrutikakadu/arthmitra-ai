import { Link } from "react-router-dom";

function Navbar() {
    return (
        <nav className="bg-green-700 text-white px-6 py-4 flex gap-6 items-center shadow-md">
            <span className="font-bold text-xl mr-4">🌿 ArthMitra AI</span>
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/match" className="hover:underline">Scheme Matcher</Link>
            <Link to="/health" className="hover:underline">Health Score</Link>
            <Link to="/savings" className="hover:underline">Savings</Link>
            <Link to="/voice" className="hover:underline">Voice</Link>
        </nav>
    );
}
export default Navbar;