import { licitacaoAgent } from "../../../agents/licitacoes/LicitacaoAgent.js";

export default async function gerarMinutaContrato({ input, context }) {
  const { objeto, contratante, contratada, valor, prazo, modalidade, numeroLicitacao } = context;

  const descricao = `Gere uma Minuta de Contrato Administrativo completa conforme Lei 14.133/2021 Arts. 92-132.

Dados:
- Objeto: ${objeto ?? input}
- Contratante (órgão): ${contratante ?? "Órgão da Administração Pública Federal"}
- Contratada (empresa): ${contratada ?? "empresa vencedora"}
- Valor global: ${valor ?? "a definir"}
- Prazo de execução/vigência: ${prazo ?? "a definir"}
- Modalidade de licitação: ${modalidade ?? "Pregão Eletrônico"}
- Número da licitação: ${numeroLicitacao ?? "a informar"}

A minuta deve incluir OBRIGATORIAMENTE (Art. 92 Lei 14.133/2021):
1. Qualificação das partes (contratante e contratada)
2. Objeto com descrição detalhada
3. Regime de execução (empreitada por preço global/unitário, tarefa etc.)
4. Valor total e forma de pagamento (cronograma financeiro)
5. Critérios de reajustamento (índice IPCA ou setorial)
6. Prazo de vigência e condições de prorrogação (Art. 107)
7. Garantia contratual (Art. 104) — modalidade e percentual
8. Obrigações da contratada (inclusive trabalhistas e previdenciárias)
9. Obrigações da contratante
10. Gestão e fiscalização do contrato (Art. 117)
11. Recebimento provisório e definitivo (Art. 131)
12. Sanções administrativas (Art. 155-163)
13. Hipóteses de rescisão unilateral (Art. 137-139)
14. Declaração de habilitação e cumprimento das exigências do edital
15. Foro da Seção Judiciária competente e legislação aplicável`;

  return licitacaoAgent.run({
    tipo: "Minuta de Contrato Administrativo",
    descricao,
    context,
  });
}
