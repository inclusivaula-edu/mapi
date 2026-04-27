import { useEffect, useState } from "react";
import { supabase } from "./auth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

export default function FinancialDashboard() {
  const [data, setData] = useState([]);
  const [mrr, setMrr] = useState(0);
  const [churn, setChurn] = useState(0);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    loadFinancials();

    // 🔥 tempo real
    const channel = supabase
      .channel("realtime-finance")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions" },
        () => loadFinancials()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadFinancials() {
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("*");

    if (!subs) return;

    // =====================
    // 💰 MRR
    // =====================
    const prices = {
      basic: 29.9,
      pro: 59.9,
      enterprise: 99.9,
    };

    const activeSubs = subs.filter((s) => s.status === "active");

    const totalMRR = activeSubs.reduce(
      (acc, s) => acc + (prices[s.plan] || 0),
      0
    );

    setMrr(totalMRR);

    // =====================
    // ❌ CHURN
    // =====================
    const inactive = subs.filter((s) => s.status !== "active").length;

    const churnRate =
      subs.length > 0 ? ((inactive / subs.length) * 100).toFixed(2) : 0;

    setChurn(churnRate);

    // =====================
    // 📊 POR PLANO
    // =====================
    const grouped = {};

    subs.forEach((s) => {
      if (!grouped[s.plan]) grouped[s.plan] = 0;
      grouped[s.plan]++;
    });

    const planData = Object.keys(grouped).map((plan) => ({
      plan,
      total: grouped[plan],
    }));

    setPlans(planData);

    // =====================
    // 📈 HISTÓRICO (FAKE REALTIME)
    // =====================
    const chartData = activeSubs.map((s, i) => ({
      name: `Sub ${i + 1}`,
      revenue: prices[s.plan] || 0,
    }));

    setData(chartData);
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>🔥 Financial Dashboard</h1>

      {/* ================= KPI ================= */}
      <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
        <div className="card">
          <h3>MRR</h3>
          <h2>R$ {mrr}</h2>
        </div>

        <div className="card">
          <h3>Churn</h3>
          <h2>{churn}%</h2>
        </div>
      </div>

      {/* ================= GRÁFICO RECEITA ================= */}
      <h3>Receita por Assinatura</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" />
        </LineChart>
      </ResponsiveContainer>

      {/* ================= PLANOS ================= */}
      <h3 style={{ marginTop: 40 }}>Distribuição de Planos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={plans}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="plan" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}