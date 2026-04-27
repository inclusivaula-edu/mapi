import { useEffect, useState } from "react";
import { supabase } from "../auth";

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    subscriptions: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    // usuários
    const { data: users } = await supabase
      .from("user_tenants")
      .select("*");

    // assinaturas
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("*");

    const prices = {
      basic: 29.9,
      pro: 59.9,
      enterprise: 99.9,
    };

    const revenue =
      subs?.reduce(
        (acc, s) =>
          s.status === "active" ? acc + (prices[s.plan] || 0) : acc,
        0
      ) || 0;

    setStats({
      users: users?.length || 0,
      subscriptions: subs?.length || 0,
      revenue,
    });
  }

  return (
    <div>
      <h1>📊 Dashboard</h1>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Usuários</h3>
          <h2>{stats.users}</h2>
        </div>

        <div style={styles.card}>
          <h3>Assinaturas</h3>
          <h2>{stats.subscriptions}</h2>
        </div>

        <div style={styles.card}>
          <h3>Receita (MRR)</h3>
          <h2>R$ {stats.revenue}</h2>
        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: "flex",
    gap: 20,
    marginTop: 20,
  },
  card: {
    background: "#111",
    color: "#fff",
    padding: 20,
    borderRadius: 12,
    minWidth: 200,
  },
};