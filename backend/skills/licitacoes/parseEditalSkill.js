import { chat } from "../../services/aiService.js";

export async function parseEdital(editalText) {
  try {
    const raw = await chat({
      system: `Você é especialista em licitações públicas brasileiras.
Extraia informações estruturadas do texto do edital abaixo.
Retorne APENAS JSON puro:
{
  "numero_edital": "string",
  "orgao": "string",
  "modalidade": "pregão eletrônico | concorrência | tomada de preços | convite | outro",
  "objeto": "descrição resumida do objeto",
  "valor_estimado": "string ou null",
  "data_abertura": "string ou null",
  "data_limite_propostas": "string ou null",
  "criterio_julgamento": "menor preço | melhor técnica | técnica e preço",
  "requisitos_habilitacao": {
    "juridica": ["req1"],
    "tecnica": ["req1"],
    "fiscal": ["req1"],
    "economica": ["req1"]
  },
  "itens": [{ "numero": 1, "descricao": "...", "quantidade": "...", "unidade": "..." }],
  "documentos_exigidos": ["doc1", "doc2"],
  "declaracoes_obrigatorias": ["decl1", "decl2"],
  "observacoes": "string"
}`,
      user: editalText.slice(0, 15000),
      model: "gpt-4o",
      temperature: 0,
    });
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return { error: "Não foi possível extrair dados do edital. Verifique o texto enviado." };
  }
}
