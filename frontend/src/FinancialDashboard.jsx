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
  const [mrr, setMrr] = useState(0);
  const [growth, setGrowth] = useState(0);
  const [churn, setChurn] = useState(0);
  const [ltv, setLtv] = useState(0);
  const [risk, setRisk] = useState(0);
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadFinancials();

    const channel = supabase
      .channel("realtime-finance")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions" },
        () => loadFinancials()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadFinancials() {
    const { data: subs } = await supabase.from("subscriptions").select("*");
    const { data: invoices } = await supabase.from("invoices").select("*");

    if (!subs) return;

    const prices = {
      basic: 29.9,
      pro: 59.9,
      enterprise: 99.9,
    };

    // ======================
    // 💰 MRR
    // ======================
    const activeSubs = subs.filter((s) => s.status === "active");

    const totalMRR = activeSubs.reduce(
      (acc, s) => acc + (prices[s.plan] || 0),
      0
    );

    setMrr(totalMRR);

    // ======================
    // 📉 CHURN
    // ======================
    const canceled = subs.filter((s) => s.status !== "active").length;

    const churnRate =
      subs.length > 0 ? (canceled / subs.length) * 100 : 0;

    setChurn(churnRate.toFixed(2));

    // ======================
    // 💎 LTV
    // ======================
    const avgTicket =
      activeSubs.length > 0 ? totalMRR / activeSubs.length : 0;

    const churnDecimal = churnRate / 100;

    const ltvValue =
      churnDecimal > 0 ? avgTicket / churnDecimal : avgTicket;

    setLtv(ltvValue.toFixed(2));

    // ======================
    // 📈 GROWTH (simples)
    // ======================
    const lastMRR = history.length > 0 ? history[history.length - 1].mrr : 0;

    const growthRate =
      lastMRR > 0 ? ((totalMRR - lastMRR) / lastMRR) * 100 : 0;

    setGrowth(growthRate.toFixed(2));

    // ======================
    // ⚠️ RECEITA EM RISCO
    // ======================
    const riskValue = invoices
      ?.filter((i) => i.status !== "paid")
      .reduce((acc, i) => acc + (i.amount || 0), 0);

    setRisk(riskValue || 0);

    // ======================
    // 📊 PLANOS
    // ======================
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

    // ======================
    // 📈 HISTÓRICO SIMPLES
    // ======================
    const newHistory = [
      ...history,
      {
        name: new Date().toLocaleTimeString(),
        mrr: totalMRR,
      },
    ];

    setHistory(newHistory.slice(-10)); // últimos 10 pontos
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>🔥 Stripe-Level Dashboard</h1>

      {/* ================= KPI ================= */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <Card title="MRR" value={`R$ ${mrr}`} />
        <Card title="Growth" value={`${growth}%`} />
        <Card title="Churn" value={`${churn}%`} />
        <Card title="LTV" value={`R$ ${ltv}`} />
        <Card title="Em Risco" value={`R$ ${risk}`} />
      </div>

      {/* ================= MRR HISTÓRICO ================= */}
      <h3 style={{ marginTop: 40 }}>MRR em Tempo Real</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={history}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="mrr" />
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

// ================= COMPONENTE CARD =================
function Card({ title, value }) {
  return (
    <div
      style={{
        background: "#111",
        color: "#fff",
        padding: 20,
        borderRadius: 12,
        minWidth: 150,
      }}
    >
      <h4>{title}</h4>
      <h2>{value}</h2>
    </div>
  );
}