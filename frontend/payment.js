import { loadMercadoPago } from "@mercadopago/sdk-js";

export async function iniciarPagamento(token) {
  const mp = await loadMercadoPago();

  const cardForm = mp.cardForm({
    amount: "59.90",
    autoMount: true,
    form: {
      id: "form-checkout",
      cardholderName: { id: "cardholderName" },
      cardNumber: { id: "cardNumber" },
      expirationDate: { id: "expirationDate" },
      securityCode: { id: "securityCode" },
    },
    callbacks: {
      onSubmit: async (event) => {
        event.preventDefault();

        const data = cardForm.getCardFormData();

        await fetch("http://localhost:3000/create-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            plan: "pro",
            email: data.cardholderEmail,
            cardToken: data.token,
          }),
        });

        alert("Assinatura criada 🚀");
      },
    },
  });
}