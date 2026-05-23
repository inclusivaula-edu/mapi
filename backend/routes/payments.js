import axios from "axios";

export async function createPayment(req, reply) {
  try {
    const { tenantId, plan } = req.body;

    const preference = {
      items: [
        {
          title: "Plano MAPI - " + plan,
          quantity: 1,
          currency_id: "BRL",
          unit_price: plan === "pro" ? 49.9 : 19.9,
        },
      ],
      notification_url: "https://SEU_BACKEND/webhook",
    };

    const response = await axios.post(
      "https://api.mercadopago.com/checkout/preferences",
      preference,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    return { url: response.data.init_point };

  } catch (err) {
    console.error(err);
    reply.code(500).send({ error: "Erro ao criar pagamento" });
  }
}