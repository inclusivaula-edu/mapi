import { eventQueue } from "../../core/queue/queue.js";

// ===============================
// 📊 LOG DE EVENTOS (FILA)
// ===============================
export async function logEvent({ tenantId, module, type, payload }) {
  try {
    await eventQueue.add("event_log", {
      tenantId,
      module,
      type,
      payload,
      createdAt: new Date(),
    });

    console.log(`📊 Evento enviado: ${type}`);
  } catch (err) {
    console.error("❌ Erro ao logar evento:", err);
  }
}