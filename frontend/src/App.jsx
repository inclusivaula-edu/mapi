import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import FinancialDashboard from "./pages/FinancialDashboard";
import Modules from "./pages/Modules";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}>
        <Sidebar />

        <div style={{ flex: 1, padding: 20 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/modules" element={<Modules />} /> 🔥
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;