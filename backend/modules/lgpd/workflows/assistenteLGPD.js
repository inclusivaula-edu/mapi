import { chat } from "../../../services/aiService.js";

export default async function assistenteLGPD({ input, context }) {
  if (!input?.trim()) throw new Error("MISSING_INPUT");

  const response = await chat({
    system: `Você é uma DPO (Data Protection Officer) especialista em LGPD (Lei 13.709/2018) e proteção de dados.
Responda dúvidas sobre:
- Bases legais de tratamento (Art. 7º)
- Direitos do titular (Art. 18)
- Dados sensíveis (Art. 11)
- Transferência internacional (Art. 33)
- Medidas de segurança (Art. 46)
- Sanções (Art. 52)
- ROPA, RIPD, DPA
- Resoluções da ANPD

Cite sempre os artigos aplicáveis. Seja direta e objetiva.
DISCLAIMER: Suas respostas são informativas e não substituem assessoria jurídica profissional.`,
    user: input,
    model: "gpt-4o-mini",
    temperature: 0.4,
  });

  return {
    content: response,
    disclaimer: "Esta resposta é informativa e não substitui assessoria jurídica ou consultoria especializada em proteção de dados.",
  };
}
