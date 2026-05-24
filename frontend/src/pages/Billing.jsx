import { useEffect, useState } from "react";
import { getToken } from "../services/auth.js";
import { usePlan } from "../hooks/usePlan";

export default function Billing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);
  const [error, setError] = useState(null);

  const { refreshPlan } = usePlan(); // 🔥 NOVO

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Usuário não autenticado");
        }

        const res = await fetch("http://localhost:3000/billing/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error();

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar billing");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  async function handleUpgrade() {
    try {
      setLoadingUpgrade(true);

      const token = await getToken();

      const res = await fetch(
        "http://localhost:3000/create-subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: data?.email,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) throw new Error();

      // 🔥 redireciona pro checkout
      window.location.href = json.checkout_url;

      // ⚠️ (opcional) poderia atualizar depois do retorno do pagamento
      await refreshPlan();

    } catch (err) {
      console.error(err);
      alert("Erro ao iniciar pagamento");
    } finally {
      setLoadingUpgrade(false);
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!data) return <div className="p-6">Sem dados</div>;

  const PLAN_LIMITS = {
    basic: 100,
    pro: 1000,
    enterprise: Infinity,
  };

  const limit = PLAN_LIMITS[data.plan] || 0;
  const percent =
    limit === Infinity ? 0 : Math.min((data.usage / limit) * 100, 100);

  const getColor = () => {
    if (percent > 90) return "bg-red-500";
    if (percent > 70) return "bg-yellow-500";
    return "bg-black";
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-gray-500">Gerencie seu plano e uso</p>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {/* PLANO */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold">Plano Atual</h2>

          <div className="mt-4">
            <p className="text-2xl font-bold uppercase">{data.plan}</p>
            <p className="text-sm text-gray-500">{data.status}</p>
          </div>

          <button
            className="mt-6 w-full bg-black text-white py-2 rounded-xl disabled:opacity-50"
            onClick={handleUpgrade}
            disabled={loadingUpgrade}
          >
            {loadingUpgrade ? "Processando..." : "Upgrade de Plano"}
          </button>
        </div>

        {/* USO */}
        <div className="bg-white p-6 rounded-2xl shadow md:col-span-2">
          <h2 className="text-lg font-semibold">Uso do mês</h2>

          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`${getColor()} h-4 rounded-full transition-all`}
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>{data.usage} requests</span>
              <span>{limit === Infinity ? "∞" : limit} limite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
