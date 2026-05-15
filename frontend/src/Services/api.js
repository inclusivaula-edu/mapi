const API_URL = "http://localhost:3000";

// ===============================
// 🚀 EXECUTAR MAPI
// ===============================
export async function runMAPI({
  module,
  workflow,
  input,
  tenantId,
  token,
}) {
  try {
    const res = await fetch(`${API_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({
        module,
        workflow,
        input,
        tenantId,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        error: data?.error || "Erro no servidor",
      };
    }

    return data;
  } catch (error) {
    return { error: "Erro de conexão com API" };
  }
}

// ===============================
// 📜 HISTÓRICO
// ===============================
export async function getHistory(tenantId, token) {
  try {
    const res = await fetch(
      `${API_URL}/history/${tenantId}`,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );

    const data = await res.json().catch(() => []);

    if (!res.ok) return [];

    return data;
  } catch (error) {
    return [];
  }
}

// ===============================
// 💳 DASHBOARD BILLING
// ===============================
export async function getBillingDashboard(token) {
  const res = await fetch(`${API_URL}/billing/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}