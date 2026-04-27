import { useEffect, useState } from "react";

export default function BillingDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/billing/dashboard", {
      headers: {
        Authorization: "Bearer TESTE",
      },
    })
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) return <div className="p-6">Carregando...</div>;

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
    <div className="min-h-screen bg-gray-100 p-8">

      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-gray-500">Gerencie seu plano e uso</p>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">

        {/* PLANO */}
        <div className="bg-white p-6 rounded-2xl shadow col-span-1">
          <h2 className="text-lg font-semibold">Plano Atual</h2>

          <div className="mt-4">
            <p className="text-2xl font-bold uppercase">{data.plan}</p>
            <p className="text-sm text-gray-500">{data.status}</p>
          </div>

          <button
            className="mt-6 w-full bg-black text-white py-2 rounded-xl"
            onClick={() =>
              (window.location.href =
                "http://localhost:3000/create-payment")
            }
          >
            Upgrade de Plano
          </button>
        </div>

        {/* USO */}
        <div className="bg-white p-6 rounded-2xl shadow col-span-2">
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
              <span>
                {limit === Infinity ? "∞" : limit} limite
              </span>
            </div>

            {percent > 90 && (
              <p className="text-red-500 text-sm mt-2">
                ⚠️ Você está próximo do limite
              </p>
            )}
          </div>
        </div>

        {/* MÉTRICAS */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-sm text-gray-500">Requests</h2>
          <p className="text-2xl font-bold">{data.usage}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-sm text-gray-500">Plano</h2>
          <p className="text-2xl font-bold uppercase">{data.plan}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-sm text-gray-500">Expira em</h2>
          <p className="text-2xl font-bold">
            {new Date(data.expires).toLocaleDateString()}
          </p>
        </div>

        {/* HISTÓRICO */}
        <div className="bg-white p-6 rounded-2xl shadow col-span-3">
          <h2 className="text-lg font-semibold">Histórico de pagamentos</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Abril</span>
              <span className="text-green-600">✔ R$29</span>
            </div>

            <div className="flex justify-between">
              <span>Março</span>
              <span className="text-green-600">✔ R$29</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}