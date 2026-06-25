import OpenAI from "openai";
import { searchLGPDLegislation } from "../../skills/lgpd/searchLGPDLegislation.js";
import { diagnoseMaturity }      from "../../skills/lgpd/diagnoseMaturity.js";
import { validateCompliance }    from "../../skills/lgpd/validateCompliance.js";
import { startTrace }            from "../../observability/tracer.js";
import { recordRequest, recordError, recordLatency, recordTokens } from "../../observability/metrics.js";
import { logger }                from "../../observability/logger.js";
import { supabase }              from "../../services/dbService.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TOOLS = {
  buscar_legislacao_lgpd: {
    handler: ({ tema, orgId }) => searchLGPDLegislation(tema, orgId),
    definition: {
      type: "function",
      function: {
        name: "buscar_legislacao_lgpd",
        description: "Busca artigos da LGPD (Lei 13.709/2018) e resoluções da ANPD aplicáveis ao tema. Use SEMPRE antes de gerar documentos.",
        parameters: {
          type: "object",
          properties: {
            tema:  { type: "string", description: "Tema da busca (ex: consentimento, dados sensíveis, ROPA)" },
            orgId: { type: "string", description: "ID da organização" },
          },
          required: ["tema"],
        },
      },
    },
  },

  diagnosticar_maturidade: {
    handler: ({ respostas }) => diagnoseMaturity(respostas),
    definition: {
      type: "function",
      function: {
        name: "diagnosticar_maturidade",
        description: "Avalia o nível de maturidade LGPD da organização com base nas respostas do questionário diagnóstico.",
        parameters: {
          type: "object",
          properties: {
            respostas: { type: "object", description: "Respostas do questionário de maturidade LGPD" },
          },
          required: ["respostas"],
        },
      },
    },
  },

  validar_conformidade: {
    handler: ({ documento, tipo }) => validateCompliance(documento, tipo),
    definition: {
      type: "function",
      function: {
        name: "validar_conformidade",
        description: "Valida se o documento gerado atende os requisitos da LGPD. Use SEMPRE após gerar o documento.",
        parameters: {
          type: "object",
          properties: {
            documento: { type: "object", description: "Documento LGPD gerado" },
            tipo:      { type: "string", description: "Tipo: politica_privacidade | ropa | dpa | plano_adequacao | ripd" },
          },
          required: ["documento", "tipo"],
        },
      },
    },
  },
};

export class LGPDAgent {

  identity(tipo) {
    return `Você é Dra. Ana, DPO (Data Protection Officer) com 10 anos de experiência em proteção de dados.
Especialista em LGPD (Lei 13.709/2018), GDPR, e regulamentações da ANPD.

Seu processo OBRIGATÓRIO para gerar ${tipo}:
1. Busque legislação aplicável com buscar_legislacao_lgpd
2. Se for diagnóstico, use diagnosticar_maturidade com as respostas
3. Redija o documento ${tipo} com base nas fontes encontradas
4. Valide com validar_conformidade — se score < 7, reescreva

REGRAS INVIOLÁVEIS:
- Cite apenas artigos reais da Lei 13.709/2018 e resoluções da ANPD
- Política de privacidade deve cobrir: Art. 6º (princípios), Art. 7º (bases legais), Art. 11 (dados sensíveis), Art. 18 (direitos do titular), Art. 33 (transferência internacional), Art. 46 (segurança), Art. 48 (incidentes)
- ROPA deve seguir Art. 37 (registro de operações de tratamento)
- RIPD deve seguir Art. 38 (relatório de impacto)
- DPA deve cobrir obrigações de controlador e operador
- Inclua disclaimer de revisão por advogado/DPO

FORMATO DE SAÍDA FINAL (JSON puro, sem markdown):
{
  "tipo": "${tipo}",
  "titulo": "título do documento",
  "secoes": [{ "titulo": "seção", "conteudo": "texto completo" }],
  "legislacao_aplicada": [{ "lei": "...", "artigo": "...", "ementa": "..." }],
  "disclaimer": "Este documento foi gerado por IA e deve ser revisado por DPO ou advogado especializado em proteção de dados antes de uso.",
  "validation": { "score": 8, "issues": [] }
}`;
  }

  async run({ tipo, descricao, answers, context }) {
    const trace = startTrace({
      organizationId: context.organizationId,
      userId: context.userId,
      workflow: `lgpd:${tipo}`,
      input: descricao,
    });
    const startMs = Date.now();
    recordRequest(`lgpd:${tipo}`);

    try {
      let userContent = `Tipo de documento: ${tipo}\nDescrição: ${descricao ?? "Gerar documento completo"}\nID da organização: ${context.organizationId}`;
      if (answers) {
        userContent += `\n\nRESPOSTAS DO DIAGNÓSTICO:\n${JSON.stringify(answers)}`;
      }
      if (context.companyInfo) {
        userContent += `\n\nDADOS DA EMPRESA:\n${JSON.stringify(context.companyInfo)}`;
      }
      userContent += "\n\nSiga o processo obrigatório.";

      const messages = [
        { role: "system", content: this.identity(tipo) },
        { role: "user", content: userContent },
      ];

      const toolDefinitions = Object.values(TOOLS).map((t) => t.definition);
      let tokensUsed = 0;
      let iterations = 0;
      const MAX_ITERATIONS = 8;

      while (iterations < MAX_ITERATIONS) {
        iterations++;
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          tools: toolDefinitions,
          tool_choice: "auto",
          temperature: 0.3,
        });

        const message = response.choices[0].message;
        tokensUsed += response.usage?.total_tokens ?? 0;
        messages.push(message);

        if (!message.tool_calls?.length) break;

        for (const call of message.tool_calls) {
          const toolName = call.function.name;
          const toolArgs = JSON.parse(call.function.arguments);
          toolArgs.orgId = context.organizationId;

          const tool = TOOLS[toolName];
          let toolResult;
          try {
            toolResult = tool
              ? await tool.handler(toolArgs)
              : { error: `Ferramenta "${toolName}" não encontrada` };
          } catch (err) {
            toolResult = { error: err.message };
            logger.error("LGPDAgent tool error", { toolName, error: err.message });
          }

          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(toolResult),
          });
        }
      }

      const raw = messages[messages.length - 1]?.content ?? "";
      let documento;
      try {
        documento = JSON.parse(raw.replace(/```json|```/g, "").trim());
      } catch {
        throw new Error(`LGPDAgent: resposta não é JSON válido. Raw: ${raw.slice(0, 300)}`);
      }

      if (!documento.disclaimer) {
        documento.disclaimer = "Este documento foi gerado por IA e deve ser revisado por DPO ou advogado especializado em proteção de dados antes de uso.";
      }

      // Persiste em background
      supabase.from("lgpd_documents").insert({
        organization_id: context.organizationId,
        assessment_id: context.assessmentId ?? null,
        tipo,
        content: documento,
        created_by: context.userId,
      }).catch((e) => logger.error("lgpd.save.error", { error: e.message }));

      const durationMs = Date.now() - startMs;
      recordLatency(`lgpd:${tipo}`, durationMs);
      recordTokens(context.organizationId, tokensUsed);
      await trace.finish({ tokensUsed, iterations, score: documento.validation?.score });

      return { ...documento, _meta: { iterations, tokensUsed, durationMs } };

    } catch (err) {
      recordError(`lgpd:${tipo}`);
      await trace.finish({ error: err.message });
      throw err;
    }
  }
}

export const lgpdAgent = new LGPDAgent();
