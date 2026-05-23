import axios from "axios";
import { supabase } from "../services/dbService.js";

export async function webhook(req, reply) {
  try {
    const { data } = req.body;

    if (!data?.id) return reply.sendStatus(200);

    // 🔎 consulta pagamento no MP
    const payment = await axios.get(
      `https://api.mercadopago.com/v1/payments/${data.id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    const status = payment.data.status;
    const paymentId = payment.data.id;

    // 🔥 se aprovado → libera plano
    if (status === "approved") {
      const tenantId = payment.data.metadata?.tenant_id;

      await supabase.from("subscriptions").insert([
        {
          tenant_id: tenantId,
          plan: "pro",
          status: "active",
          payment_id: paymentId,
        },
      ]);

      console.log("💰 Pagamento aprovado → plano liberado");
    }

    return reply.sendStatus(200);

  } catch (err) {
    console.error("Erro webhook:", err);
    return reply.sendStatus(500);
  }
}