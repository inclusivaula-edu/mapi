import { licitacaoAgent } from "../../../agents/licitacoes/LicitacaoAgent.js";

export default async function gerarTR({ input, context }) {
  const { objeto, modalidade, criterioJulgamento, prazoExecucao, valorEstimado, orgao } = context;

  const descricao = `Gere um Termo de Referência (TR) completo conforme IN SEGES/ME nº 65/2021 e Lei 14.133/2021.

Dados fornecidos:
- Objeto: ${objeto ?? input}
- Modalidade: ${modalidade ?? "Pregão Eletrônico"}
- Critério de julgamento: ${criterioJulgamento ?? "Menor Preço"}
- Prazo de execução: ${prazoExecucao ?? "a definir"}
- Valor estimado: ${valorEstimado ?? "a pesquisar"}
- Órgão: ${orgao ?? "Administração Pública Federal"}

O TR deve conter OBRIGATORIAMENTE (Art. 6º IN SEGES 65/2021):
1. Objeto (descrição detalhada)
2. Fundamentação e descrição da necessidade da contratação
3. Descrição dos requisitos da contratação (especificações técnicas mínimas)
4. Modelo de execução do objeto (obrigações, local, prazo, procedimento de recebimento)
5. Modelo de gestão do contrato (gestor, fiscal técnico, fiscal administrativo)
6. Critérios de medição e pagamento
7. Forma e critérios de seleção do fornecedor (habilitação exigida)
8. Estimativas do valor da contratação com memória de cálculo
9. Adequação orçamentária (programa de trabalho e elemento de despesa)
10. Responsável pela elaboração (nome, cargo, matrícula)`;

  return licitacaoAgent.run({
    tipo: "TR — Termo de Referência",
    descricao,
    context,
  });
}
