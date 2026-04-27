import './App.css'
import BillingDashboard from "./BillingDashboard";
import FinancialDashboard from "./FinancialDashboard";
import { useState } from "react";

function App() {
  const [view, setView] = useState("financial");

  return (
    <div>
      {/* 🔥 NAVBAR SIMPLES */}
      <div style={{ display: "flex", gap: 10, padding: 20 }}>
        <button onClick={() => setView("billing")}>
          Billing
        </button>

        <button onClick={() => setView("financial")}>
          Financial
        </button>
      </div>

      {/* 🔥 DASHBOARD */}
      {view === "billing" && <BillingDashboard />}
      {view === "financial" && <FinancialDashboard />}
    </div>
  );
}

export default App;