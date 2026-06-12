import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import SchemeMatcher from "./pages/SchemeMatcher";
import SchemeResults from "./pages/SchemeResults";
import FinancialHealth from "./pages/FinancialHealth";
import SavingsPlanner from "./pages/SavingsPlanner";
import VoiceInput from "./pages/VoiceInput";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/match" element={<SchemeMatcher />} />
        <Route path="/results" element={<SchemeResults />} />
        <Route path="/health" element={<FinancialHealth />} />
        <Route path="/savings" element={<SavingsPlanner />} />
        <Route path="/voice" element={<VoiceInput />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;