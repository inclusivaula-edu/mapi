import { useEffect, useState } from "react";
import { supabase } from "../auth";

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    subscriptions: 0,
    revenue: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { data: users } = await supabase
        .from("user_tenants")
        .select("*");

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*");

      const prices = {
        basic: 29.9,
        pro: 59.9,
        enterprise: 99.9,
      };

      const revenue =
        (subs || []).reduce((acc, s) => {
          if (s.status === "active") {
            return acc + (prices[s.plan] || 0);
          }
          return acc;
        }, 0) || 0;

      setStats({
        users: users?.length || 0,
        subscriptions: subs?.length || 0,
        revenue,
      });
    } catch (err) {
      console.error("Erro ao carregar stats:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1>📊 Dashboard</h1>

      <div style={{ display: "flex", gap: 20 }}>
        <Card title="Usuários" value={stats.users} />
        <Card title="Assinaturas" value={stats.subscriptions} />
        <Card title="MRR" value={`R$ ${stats.revenue}`} />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <h3>{title}</h3>
      <h2>{value}</h2>
    </div>
  );
}

const styles = {
  card: {
    background: "#111",
    color: "#fff",
    padding: 20,
    borderRadius: 12,
    minWidth: 200,
  },
};