import OpenAI from "openai";
import { searchLegislacao }    from "../../skills/juridico/searchLegislacao.js";
import { searchJurisprudencia } from "../../skills/juridico/searchJurisprudencia.js";
import { validateJuridico }    from "../../skills/juridico/validateJuridico.js";
import { saveDocumento }       from "../../skills/juridico/saveDocumento.js";
import { startTrace }          from "../../observability/tracer.js";
import { recordRequest, recordError, recordLatency, recordTokens } from "../../observability/metrics.js";
import { logger }              from "../../observability/logger.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─────────────────────────────────────────────────────────────
// FERRAMENTAS DO AGENTE JURÍDICO
// ─────────────────────────────────────────────────────────────
const TOOLS = {
  buscar_legislacao: {
    handler: ({ tema, area, orgId }) => searchLegislacao(tema, area, orgId),
    definition: {
      type: "function",
      function: {
        name: "buscar_legislacao",
        description:
          "Busca leis, artigos e normas brasileiras aplicáveis ao tema jurídico. " +
          "Use SEMPRE antes de redigir qualquer documento para garantir embasamento legal correto.",
        parameters: {
          type: "object",
          properties: {
            tema:  { type: "string", description: "Tema jurídico (ex: rescisão por justa causa, responsabilidade civil)" },
            area:  { type: "string", description: "Área do direito: trabalhista | civil | tributário | empresarial | penal | administrativo | consumidor" },
            orgId: { type: "string", description: "ID da organização para buscar base local" },
          },
          required: ["tema"],
        },
      },
    },
  },

  buscar_jurisprudencia: {
    handler: ({ tema, tribunal, orgId }) => searchJurisprudencia(tema, tribunal, orgId),
    definition: {
      type: "function",
      function: {
        name: "buscar_jurisprudencia",
        description:
          "Busca precedentes jurisprudenciais (STF, STJ, TST, TRFs) sobre o tema. " +
          "Use quando o documento precisa de embasamento em decisões judiciais.",
        parameters: {
          type: "object",
          properties: {
            tema:     { type: "string", description: "Tema jurídico da busca" },
            tribunal: { type: "string", description: "Tribunal preferido: STF | STJ | TST | TRF | TJSP | qualquer" },
            orgId:    { type: "string", description: "ID da organização" },
          },
          required: ["tema"],
        },
      },
    },
  },

  validar_documento: {
    handler: ({ documento, tipo, area }) => validateJuridico(documento, tipo, area),
    definition: {
      type: "function",
      function: {
        name: "validar_documento",
        description:
          "Valida a qualidade técnica jurídica do documento gerado. " +
          "Use SEMPRE após redigir o documento para verificar se está correto antes de entregar.",
        parameters: {
          type: "object",
          properties: {
            documento: { type: "object", description: "Documento jurídico gerado" },
            tipo:      { type: "string", description: "Tipo do documento" },
            area:      { type: "string", description: "Área do direito" },
          },
          required: ["documento", "tipo"],
        },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────
// JURÍDICO AGENT
// ─────────────────────────────────────────────────────────────
export class JuridicoAgent {

  /**
   * Identidade do agente — define o comportamento e os limites.
   * O disclaimer obrigatório está no identity para garantir que
   * SEMPRE aparece em todos os documentos gerados.
   */
  identity(tipo, area) {
    return `Você é Dr. Carlos, advogado especialista em direito brasileiro com 20 anos de experiência.
Área de atuação atual: ${area ?? "direito geral"}.

Seu processo de trabalho OBRIGATÓRIO:
1. Buscar legislação aplicável ao tema com buscar_legislacao
2. Buscar jurisprudência relevante com buscar_jurisprudencia (quando o tipo exigir)
3. Redigir o documento ${tipo} com base nas fontes encontradas
4. Validar com validar_documento — se score < 6, reescreva

REGRAS INVIOLÁVEIS:
- Cite apenas legislação e jurisprudência real e vigente no Brasil
- Todo documento deve incluir disclaimer de revisão profissional
- Nunca afirme que o documento substitui consultoria jurídica
- Use linguagem técnica precisa, mas acessível ao cliente
- Estruture o documento com seções claras e numeradas

FORMATO DE SAÍDA FINAL (JSON puro, sem markdown):
{
  "tipo": "${tipo}",
  "area": "${area ?? "geral"}",
  "titulo": "título do documento",
  "partes": [{ "papel": "Contratante", "descricao": "..." }],
  "secoes": [{ "titulo": "1. Das Partes", "conteudo": "..." }],
  "legislacao_aplicada": [{ "lei": "...", "artigo": "...", "ementa": "..." }],
  "jurisprudencia_aplicada": [{ "tribunal": "...", "numero": "...", "ementa": "..." }],
  "disclaimer": "Este documento foi gerado por IA e deve ser revisado por advogado habilitado antes de uso. Não substitui consultoria jurídica profissional.",
  "validation": { "score": 8, "issues": [] }
}`;
  }

  /**
   * Executa o agente jurídico com loop ReAct (Reason + Act).
   *
   * @param {object} opts
   * @param {string} opts.tipo       - Tipo de documento (contrato, parecer, petição, etc.)
   * @param {string} opts.area       - Área do direito
   * @param {string} opts.descricao  - Descrição do que o usuário quer
   * @param {object} opts.partes     - Partes envolvidas (opcional)
   * @param {object} opts.context    - { userId, organizationId }
   */
  async run({ tipo, area, descricao, partes = [], context }) {
    const trace = startTrace({
      organizationId: context.organizationId,
      userId:         context.userId,
      workflow:       `juridico:${tipo}`,
      input:          descricao,
    });
    const startMs = Date.now();
    recordRequest(`juridico:${tipo}`);

    try {
      const messages = [
        { role: "system", content: this.identity(tipo, area) },
        {
          role: "user",
          content: `Preciso de: ${tipo}
Área: ${area ?? "não especificada"}
Descrição: ${descricao}
Partes envolvidas: ${partes.length ? JSON.stringify(partes) : "não informadas"}
ID da organização: ${context.organizationId}

Siga o processo obrigatório: busque a legislação, jurisprudência se necessário, redija e valide.`,
        },
      ];

      const toolDefinitions = Object.values(TOOLS).map((t) => t.definition);
      let tokensUsed = 0;
      let iterations = 0;
      const MAX_ITERATIONS = 8;

      // Loop ReAct — razão → ação → observação → repete
      while (iterations < MAX_ITERATIONS) {
        iterations++;

        const response = await openai.chat.completions.create({
          model:        "gpt-4o-mini",
          messages,
          tools:        toolDefinitions,
          tool_choice:  "auto",
          temperature:  0.3, // menor temperatura para documentos jurídicos — mais preciso
        });

        const message = response.choices[0].message;
        tokensUsed += response.usage?.total_tokens ?? 0;
        messages.push(message);

        trace.event("iteration", { iteration: iterations, hasCalls: !!message.tool_calls?.length });

        // Sem mais tool_calls = resposta final
        if (!message.tool_calls?.length) break;

        // Executa ferramentas
        for (const call of message.tool_calls) {
          const toolName = call.function.name;
          const toolArgs = JSON.parse(call.function.arguments);

          // Injeta orgId automaticamente — nunca vem do usuário
          toolArgs.orgId = context.organizationId;

          const tool = TOOLS[toolName];
          let toolResult;

          try {
            toolResult = tool
              ? await tool.handler(toolArgs)
              : { error: `Ferramenta "${toolName}" não encontrada` };
          } catch (err) {
            toolResult = { error: err.message };
            logger.error("JuridicoAgent tool error", { toolName, error: err.message });
          }

          messages.push({
            role:         "tool",
            tool_call_id: call.id,
            content:      JSON.stringify(toolResult),
          });
        }
      }

      // Parseia resposta final
      const raw = messages[messages.length - 1]?.content ?? "";
      let documento;
      try {
        documento = JSON.parse(raw.replace(/```json|```/g, "").trim());
      } catch {
        throw new Error(`JuridicoAgent: resposta não é JSON válido. Raw: ${raw.slice(0, 300)}`);
      }

      // Garante disclaimer — nunca pode faltar
      if (!documento.disclaimer) {
        documento.disclaimer =
          "Este documento foi gerado por IA e deve ser revisado por advogado habilitado " +
          "antes de uso. Não substitui consultoria jurídica profissional.";
      }

      // Persiste em background
      saveDocumento(documento, { ...context, tipo, area }, tokensUsed)
        .catch((e) => logger.error(e.message));

      // Observabilidade
      const durationMs = Date.now() - startMs;
      recordLatency(`juridico:${tipo}`, durationMs);
      recordTokens(context.organizationId, tokensUsed);
      await trace.finish({ tokensUsed, iterations, score: documento.validation?.score });

      return { ...documento, _meta: { iterations, tokensUsed, durationMs } };

    } catch (err) {
      recordError(`juridico:${tipo}`);
      await trace.finish({ error: err.message });
      throw err;
    }
  }
}

export const juridicoAgent = new JuridicoAgent();
