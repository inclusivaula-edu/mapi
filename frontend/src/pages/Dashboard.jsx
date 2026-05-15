import { useState } from "react";
import { getToken } from "../services/auth";
import { useUsage } from "../hooks/useUsage";
import UpgradeModal from "../components/UpgradeModal";

const API_URL = "http://localhost:3000";

export default function Dashboard() {
  const [loadingBasic, setLoadingBasic] = useState(false);
  const [loadingAdvanced, setLoadingAdvanced] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [error, setError] = useState(null);

  const { usage, reload } = useUsage();

  async function callAI(endpoint, setLoading) {
    setError(null);

    try {
      setLoading(true);

      const token = await getToken();

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      // 💳 bloqueio de billing (Stripe-style)
      if (res.status === 402 || res.status === 403) {
        setShowUpgrade(true);
        return;
      }

      if (!res.ok) {
        setError(data?.error || "Erro inesperado");
        return;
      }

      console.log("AI Response:", data);

      reload();
    } catch (err) {
      console.error("Erro:", err);
      setError("Falha de conexão com servidor");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade() {
    try {
      const token = await getToken();

      const res = await fetch(`${API_URL}/create-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: usage?.email || "",
        }),
      });

      const data = await res.json();

      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError("Falha ao gerar checkout");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao iniciar assinatura");
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-2">🤖 IA Dashboard</h1>

      {/* STATUS PLAN */}
      {usage && (
        <div className="mb-6 text-sm text-gray-600">
          Plano: <b>{usage.plan}</b> | Uso: {usage.usage} / {usage.limit}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="mb-4 text-red-600 text-sm">
          ⚠ {error}
        </div>
      )}

      {/* BUTTONS */}
      <div className="flex gap-4">
        <button
          onClick={() => callAI("/ai/basic", setLoadingBasic)}
          disabled={loadingBasic}
          className="bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loadingBasic ? "Carregando..." : "IA Básica"}
        </button>

        <button
          onClick={() => callAI("/ai/advanced", setLoadingAdvanced)}
          disabled={loadingAdvanced}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loadingAdvanced ? "Carregando..." : "IA Avançada (PRO)"}
        </button>
      </div>

      {/* MODAL UPGRADE */}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}