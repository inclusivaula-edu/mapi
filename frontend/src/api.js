const API_URL = "http://localhost:3000";

// ===============================
// 🚀 EXECUTAR MAPI
// ===============================
export async function runMAPI({ module, workflow, input, tenantId }) {
  try {
    const res = await fetch(`${API_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        module,
        workflow,
        input,
        tenantId
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Erro HTTP:", errorText);
      return { error: "Erro no servidor" };
    }

    const data = await res.json();

    return data;

  } catch (error) {
    console.error("❌ Erro ao conectar com backend:", error);
    return { error: "Erro de conexão" };
  }
}

// ===============================
// 📜 BUSCAR HISTÓRICO
// ===============================
export async function getHistory(tenantId) {
  try {
    const res = await fetch(`${API_URL}/history/${tenantId}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Erro ao buscar histórico:", errorText);
      return [];
    }

    const data = await res.json();

    return data;

  } catch (error) {
    console.error("❌ Erro de conexão:", error);
    return [];
  }
}