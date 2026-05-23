import { preApprovalClient } from "../../services/payment.service.js";

export async function createSubscription(req, reply) {
  const { email } = req.body || {};

  if (!email) {
    return reply.code(400).send({ error: "Email obrigatório" });
  }

  try {
    const response = await preApprovalClient.create({
      body: {
        reason: "Plano PRO MAPI",
        payer_email: email,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 29.9,
          currency_id: "BRL",
        },
        back_url: "http://localhost:3000/payment/success",
      },
    });

    return reply.send({
      checkout_url: response.init_point,
    });
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ error: "Erro ao criar assinatura" });
  }
}