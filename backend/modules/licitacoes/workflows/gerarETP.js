import { licitacaoAgent } from "../../../agents/licitacoes/LicitacaoAgent.js";

export default async function gerarETP({ input, context }) {
  const { objeto, necessidade, estimativaValor, prazo, orgao } = context;

  const descricao = `Gere um Estudo Técnico Preliminar (ETP) completo conforme IN SEGES/ME nº 67/2021 e Lei 14.133/2021.

Dados fornecidos:
- Objeto: ${objeto ?? input}
- Necessidade: ${necessidade ?? "a ser identificada pelo ETP"}
- Estimativa de valor: ${estimativaValor ?? "a ser pesquisada"}
- Prazo previsto: ${prazo ?? "a definir"}
- Órgão: ${orgao ?? context.orgName ?? "Administração Pública Federal"}

O ETP deve conter OBRIGATORIAMENTE (Art. 7º IN SEGES 67/2021):
1. Descrição da necessidade da contratação
2. Estimativa das quantidades a serem contratadas
3. Levantamento de mercado (mínimo 3 fornecedores)
4. Estimativa do valor da contratação (Painel de Preços gov.br)
5. Descrição da solução como um todo
6. Justificativas para o parcelamento ou não da solução
7. Contratações correlatas e interdependentes
8. Impactos ambientais e medidas mitigadoras
9. Posicionamento conclusivo sobre a viabilidade da contratação`;

  return licitacaoAgent.run({
    tipo: "ETP — Estudo Técnico Preliminar",
    descricao,
    context,
  });
}
