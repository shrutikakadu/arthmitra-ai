import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SchemeMatcher from "./pages/SchemeMatcher";
import SchemeResults from "./pages/SchemeResults";
import FinancialHealth from "./pages/FinancialHealth";
import SavingsPlanner from "./pages/SavingsPlanner";
import VoiceInput from "./pages/VoiceInput";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SchemeDashboard from "./pages/SchemeDashboard";
import DCControlPanel from "./pages/DCControlPanel";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/match" element={<SchemeMatcher />} />
        <Route path="/results" element={<SchemeResults />} />
        <Route path="/health" element={<FinancialHealth />} />
        <Route path="/savings" element={<SavingsPlanner />} />
        <Route path="/voice" element={<VoiceInput />} />
        <Route path="/scheme/:schemeName" element={<SchemeDashboard />} />
        <Route path="/dc-panel" element={<DCControlPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;