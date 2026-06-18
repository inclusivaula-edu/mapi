import { chat }                 from "../../services/aiService.js";
import { searchLegislacao }    from "../../skills/juridico/searchLegislacao.js";
import { validateJuridico }    from "../../skills/juridico/validateJuridico.js";
import { saveDocumento }       from "../../skills/juridico/saveDocumento.js";
import { logger }              from "../../observability/logger.js";
import { supabase }            from "../../services/dbService.js";

/**
 * CONTRATO ORCHESTRATOR — subagentes paralelos para contratos completos
 *
 * Contratos têm cláusulas independentes entre si — caso ideal para paralelo.
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │              ContratoOrchestrator                      │
 *   │                                                        │
 *   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
 *   │  │ Qualific.│ │ Objeto   │ │ Obrigações│ │ Rescisão │ │  ← paralelo
 *   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
 *   │               ┌──────────┐                            │
 *   │               │ Síntese  │                            │  ← une tudo
 *   │               └──────────┘                            │
 *   └────────────────────────────────────────────────────────┘
 *
 * Tipos suportados: prestacao-servicos | compra-venda | locacao |
 *   parceria-empresarial | trabalho-autonomo | nda | franquia
 */

const CLAUSULAS_POR_TIPO = {
  "prestacao-servicos":   ["Qualificação das Partes", "Objeto", "Obrigações", "Pagamento", "Prazo", "Rescisão", "Confidencialidade", "Foro"],
  "compra-venda":         ["Qualificação das Partes", "Objeto e Preço", "Forma de Pagamento", "Entrega", "Garantia", "Rescisão", "Foro"],
  "locacao":              ["Qualificação das Partes", "Objeto", "Prazo", "Aluguel e Encargos", "Obrigações do Locador", "Obrigações do Locatário", "Rescisão", "Foro"],
  "parceria-empresarial": ["Qualificação das Partes", "Objeto", "Obrigações de Cada Parte", "Divisão de Resultados", "Propriedade Intelectual", "Exclusividade", "Rescisão", "Foro"],
  "trabalho-autonomo":    ["Qualificação das Partes", "Objeto", "Remuneração", "Autonomia e Independência", "Confidencialidade", "Duração", "Rescisão", "Foro"],
  "nda":                  ["Qualificação das Partes", "Definição de Informação Confidencial", "Obrigações de Confidencialidade", "Exceções", "Prazo", "Penalidades", "Foro"],
};

export class ContratoOrchestrator {

  /** Gera uma cláusula específica com embasamento legal. */
  async runClausulaAgent({ clausula, tipo, area, descricao, partes, legislacao }) {
    const raw = await chat({
      system: `Você redige cláusulas contratuais para contratos brasileiros do tipo ${tipo}.
Use a legislação fornecida para embasar juridicamente a cláusula.
Seja preciso, técnico e claro.
Retorne APENAS JSON puro:
{
  "titulo": "número e nome da cláusula",
  "conteudo": "texto completo da cláusula com parágrafos numerados"
}`,
      user: `CLÁUSULA: ${clausula}
TIPO DE CONTRATO: ${tipo}
DESCRIÇÃO DO NEGÓCIO: ${descricao}
PARTES: ${JSON.stringify(partes)}
LEGISLAÇÃO APLICÁVEL: ${JSON.stringify(legislacao)}
Redija a cláusula "${clausula}" completa.`,
      temperature: 0.2,
    });

    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  }

  /** Une todas as cláusulas em um contrato coeso e formalmente correto. */
  async runSynthesisAgent({ tipo, area, partes, clausulas, legislacao }) {
    const raw = await chat({
      system: `Você é o redator final de contratos empresariais brasileiros.
Recebe cláusulas geradas por especialistas e monta o contrato final completo.
O contrato deve ser formalmente correto, seguindo as normas do Código Civil (Lei 10.406/2002).
Retorne APENAS JSON puro:
{
  "tipo": "string",
  "area": "string",
  "titulo": "CONTRATO DE [TIPO]",
  "preambulo": "texto de abertura com qualificação das partes",
  "partes": [{ "papel": "Contratante", "nome": "...", "qualificacao": "..." }],
  "clausulas": [{ "titulo": "string", "conteudo": "string" }],
  "assinaturas": "bloco de assinaturas com campos para data e local",
  "legislacao_aplicada": [{ "lei": "...", "artigo": "...", "ementa": "..." }],
  "disclaimer": "Este contrato foi gerado por IA e deve ser revisado por advogado habilitado antes de assinatura."
}`,
      user: `TIPO: ${tipo} | ÁREA: ${area}
PARTES: ${JSON.stringify(partes)}
CLÁUSULAS: ${JSON.stringify(clausulas)}
LEGISLAÇÃO: ${JSON.stringify(legislacao)}
Monte o contrato completo.`,
      temperature: 0.1,
    });

    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  }

  /**
   * Gera contrato completo com cláusulas em paralelo.
   *
   * @param {string} tipo        - Tipo de contrato (ver CLAUSULAS_POR_TIPO)
   * @param {string} area        - Área do direito
   * @param {string} descricao   - Descrição do negócio/serviço
   * @param {Array}  partes      - [{ papel, nome, cpfCnpj, endereco }]
   * @param {object} context     - { userId, organizationId }
   */
  async run({ tipo, area = "civil", descricao, partes, context }) {
    const start = Date.now();

    const clausulas = CLAUSULAS_POR_TIPO[tipo] ?? CLAUSULAS_POR_TIPO["prestacao-servicos"];

    // 1. Busca legislação aplicável (uma vez, compartilhada entre cláusulas)
    const legislacao = await searchLegislacao(descricao, area, context.organizationId);

    // 2. FORK — todas as cláusulas em paralelo
    const clausulasGeradas = await Promise.all(
      clausulas.map((clausula) =>
        this.runClausulaAgent({ clausula, tipo, area, descricao, partes, legislacao })
          .catch((err) => {
            logger.error("ContratoOrchestrator clausula error", { clausula, error: err.message });
            return { titulo: clausula, conteudo: "Cláusula não pôde ser gerada automaticamente." };
          })
      )
    );

    // 3. JOIN — síntese do contrato
    const contrato = await this.runSynthesisAgent({
      tipo, area, partes, clausulas: clausulasGeradas, legislacao,
    });

    // 4. Validação final
    const validation = await validateJuridico(contrato, tipo, area);
    contrato.validation = validation;

    // 5. Persiste em background
    const elapsed = Date.now() - start;
    saveDocumento(contrato, { ...context, tipo, area }, 0)
      .catch((e) => logger.error(e.message));

    return {
      ...contrato,
      _meta: {
        clausulasGeradas:  clausulasGeradas.length,
        pattern:           "fork-join",
        generatedIn:       `${(elapsed / 1000).toFixed(1)}s`,
        validationScore:   validation.score,
      },
    };
  }
}

export const contratoOrchestrator = new ContratoOrchestrator();
