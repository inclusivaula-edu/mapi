import { licitacaoAgent } from "../../../agents/licitacoes/LicitacaoAgent.js";

export default async function gerarARP({ input, context }) {
  const { objeto, orgaoGerenciador, validade, itens } = context;

  const descricao = `Gere uma Ata de Registro de Preços (ARP) completa conforme Decreto 11.462/2023 e Lei 14.133/2021.

Dados:
- Objeto: ${objeto ?? input}
- Órgão gerenciador: ${orgaoGerenciador ?? "Ministério/Órgão a identificar"}
- Validade: ${validade ?? "12 meses"}
- Itens registrados: ${itens ?? "a detalhar"}

A ARP deve conter:
1. Identificação do órgão gerenciador e do fornecedor
2. Objeto e especificação dos itens registrados (descrição, unidade, quantidade e preço unitário)
3. Prazo de validade (máximo 12 meses — Decreto 11.462/2023 Art. 5º)
4. Condições de fornecimento (prazo de entrega, local, embalagem)
5. Obrigações do órgão gerenciador e do fornecedor registrado
6. Hipóteses de cancelamento do registro (Art. 22 Decreto 11.462/2023)
7. Cláusula de possibilidade de adesão por órgãos participantes
8. Foro e legislação aplicável
9. Assinaturas e data`;

  return licitacaoAgent.run({
    tipo: "ARP — Ata de Registro de Preços",
    descricao,
    context,
  });
}
