import { createContext, useEffect, useState } from "react";
import { getToken } from "../services/auth.js";

export const PlanContext = createContext();

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  // =============================
  // 🔥 LOAD PLAN
  // =============================
  async function loadPlan() {
    try {
      const token = await getToken();

      if (!token) {
        setPlan("free");
        return;
      }

      const res = await fetch("import.meta.env.VITE_API_URL || "http://localhost:3000"/billing/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setPlan(data.plan || "free");
    } catch (err) {
      console.error("Erro ao carregar plano:", err);
      setPlan("free");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, []);

  return (
    <PlanContext.Provider
      value={{
        plan,
        loading,
        refreshPlan: loadPlan, // 🔥 importante
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}


