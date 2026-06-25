import OpenAI from "openai";
import { searchLegislacaoLicitacao } from "../../skills/licitacoes/searchLegislacaoLicitacao.js";
import { validateProposta }          from "../../skills/licitacoes/validateProposta.js";
import { parseEdital }               from "../../skills/licitacoes/parseEditalSkill.js";
import { validateETP }               from "../../skills/licitacoes/validateETP.js";
import { validateTR }                from "../../skills/licitacoes/validateTR.js";
import { checklistSICAF }            from "../../skills/licitacoes/checklistSICAF.js";
import { getCompanyProfile, injectCompanyContext } from "../../skills/licitacoes/companyProfile.js";
import { getBidHistory, getBidStats, injectHistoryContext } from "../../skills/licitacoes/bidHistory.js";
import { startTrace }                from "../../observability/tracer.js";
import { recordRequest, recordError, recordLatency, recordTokens } from "../../observability/metrics.js";
import { logger }                    from "../../observability/logger.js";
import { supabase }                  from "../../services/dbService.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TOOLS = {
  parse_edital: {
    handler: ({ texto_edital }) => parseEdital(texto_edital),
    definition: {
      type: "function",
      function: {
        name: "parse_edital",
        description: "Extrai requisitos, itens, prazos e documentação do texto de um edital de licitação.",
        parameters: {
          type: "object",
          properties: {
            texto_edital: { type: "string", description: "Texto completo ou parcial do edital" },
          },
          required: ["texto_edital"],
        },
      },
    },
  },

  buscar_legislacao_licitacao: {
    handler: ({ tema, area, orgId }) => searchLegislacaoLicitacao(tema, area, orgId),
    definition: {
      type: "function",
      function: {
        name: "buscar_legislacao_licitacao",
        description: "Busca legislação de licitações (Lei 14.133/2021, Lei 8.666/1993, LC 123/2006). Use SEMPRE antes de gerar documentos.",
        parameters: {
          type: "object",
          properties: {
            tema:  { type: "string", description: "Tema da busca (ex: habilitação técnica, pregão eletrônico)" },
            area:  { type: "string", description: "Área específica: pregão | concorrência | dispensa | habilitação | contratos" },
            orgId: { type: "string", description: "ID da organização" },
          },
          required: ["tema"],
        },
      },
    },
  },

  validar_proposta: {
    handler: ({ proposta, requisitos_edital }) => validateProposta(proposta, requisitos_edital),
    definition: {
      type: "function",
      function: {
        name: "validar_proposta",
        description: "Valida se a proposta técnica atende todos os requisitos do edital. Use SEMPRE após gerar a proposta.",
        parameters: {
          type: "object",
          properties: {
            proposta:          { type: "object", description: "Proposta técnica gerada" },
            requisitos_edital: { type: "object", description: "Requisitos extraídos do edital" },
          },
          required: ["proposta", "requisitos_edital"],
        },
      },
    },
  },

  validar_etp: {
    handler: ({ etp }) => validateETP(etp),
    definition: {
      type: "function",
      function: {
        name: "validar_etp",
        description: "Valida o ETP contra IN SEGES/ME nº 67/2021. Use SEMPRE após gerar o ETP para verificar conformidade.",
        parameters: {
          type: "object",
          properties: {
            etp: { type: "object", description: "Estudo Técnico Preliminar gerado" },
          },
          required: ["etp"],
        },
      },
    },
  },

  validar_tr: {
    handler: ({ tr }) => validateTR(tr),
    definition: {
      type: "function",
      function: {
        name: "validar_tr",
        description: "Valida o Termo de Referência contra IN SEGES/ME nº 65/2021. Use SEMPRE após gerar o TR.",
        parameters: {
          type: "object",
          properties: {
            tr: { type: "object", description: "Termo de Referência gerado" },
          },
          required: ["tr"],
        },
      },
    },
  },

  checklist_sicaf: {
    handler: ({ objeto, tipoEmpresa, modalidade }) => checklistSICAF({ objeto, tipoEmpresa, modalidade }),
    definition: {
      type: "function",
      function: {
        name: "checklist_sicaf",
        description: "Gera checklist completo de documentos de habilitação para licitação federal conforme SICAF e Lei 14.133/2021.",
        parameters: {
          type: "object",
          properties: {
            objeto:      { type: "string", description: "Objeto da licitação" },
            tipoEmpresa: { type: "string", description: "Tipo: geral | me-epp" },
            modalidade:  { type: "string", description: "Modalidade: pregao-eletronico | concorrencia | dispensa" },
          },
          required: ["objeto"],
        },
      },
    },
  },
};

export class LicitacaoAgent {

  identity(tipo) {
    return `Você é Dr. Roberto, especialista em licitações públicas federais com 15 anos de experiência no gov.br/compras.
Sua especialidade: Lei 14.133/2021, Decreto 10.024/2019, IN SEGES 65/2021 (TR), IN SEGES 67/2021 (ETP), SICAF, PNCP, SRP/ARP (Decreto 11.462/2023), pregão eletrônico, TCU.

Ferramentas disponíveis e quando usar:
- parse_edital: SEMPRE que receber texto de edital
- buscar_legislacao_licitacao: SEMPRE antes de gerar qualquer documento
- validar_proposta: SEMPRE após gerar proposta técnica
- validar_etp: SEMPRE após gerar ETP (verifica conformidade com IN SEGES 67/2021)
- validar_tr: SEMPRE após gerar TR (verifica conformidade com IN SEGES 65/2021)
- checklist_sicaf: quando o usuário precisar de lista de documentos de habilitação

Seu processo OBRIGATÓRIO para gerar ${tipo}:
1. Se receber texto de edital, use parse_edital para extrair requisitos
2. Busque legislação aplicável com buscar_legislacao_licitacao
3. Redija o documento ${tipo} seguindo rigorosamente as normas federais
4. Valide com a ferramenta de validação correspondente — se score < 7, reescreva

REGRAS INVIOLÁVEIS:
- Todo documento referencia os artigos da Lei 14.133/2021 e normas aplicáveis
- ETP deve seguir IN SEGES 67/2021, TR deve seguir IN SEGES 65/2021
- Pregão eletrônico segue Decreto 10.024/2019
- ARP segue Decreto 11.462/2023
- Declarações seguem modelos oficiais do PNCP/ComprasNet
- Planilha de preços inclui BDI, encargos sociais e pesquisa no Painel de Preços gov.br
- Inclua disclaimer de revisão profissional

FORMATO DE SAÍDA FINAL (JSON puro, sem markdown):
{
  "tipo": "${tipo}",
  "titulo": "título do documento",
  "edital_ref": "número do edital de referência",
  "secoes": [{ "titulo": "seção", "conteudo": "texto completo" }],
  "legislacao_aplicada": [{ "lei": "...", "artigo": "...", "ementa": "..." }],
  "disclaimer": "Este documento foi gerado por IA e deve ser revisado por profissional habilitado antes de apresentação ao órgão licitante.",
  "validation": { "score": 8, "issues": [] }
}`;
  }

  async run({ tipo, descricao, editalText, context }) {
    const trace = startTrace({
      organizationId: context.organizationId,
      userId: context.userId,
      workflow: `licitacao:${tipo}`,
      input: descricao,
    });
    const startMs = Date.now();
    recordRequest(`licitacao:${tipo}`);

    try {
      const [companyProfile, bidStats, recentHistory] = await Promise.all([
        getCompanyProfile(context.organizationId).catch(() => null),
        getBidStats(context.organizationId).catch(() => null),
        getBidHistory(context.organizationId, { limit: 5 }).catch(() => []),
      ]);

      const companyCtx = injectCompanyContext(companyProfile);
      const historyCtx = injectHistoryContext(bidStats, recentHistory);

      let userContent = editalText
        ? `Tipo de documento: ${tipo}\nDescrição: ${descricao}\n\nTEXTO DO EDITAL:\n${editalText.slice(0, 12000)}`
        : `Tipo de documento: ${tipo}\nDescrição: ${descricao}`;

      if (companyCtx) userContent += `\n\n${companyCtx}`;
      if (historyCtx) userContent += `\n\n${historyCtx}`;
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
            logger.error("LicitacaoAgent tool error", { toolName, error: err.message });
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
        throw new Error(`LicitacaoAgent: resposta não é JSON válido. Raw: ${raw.slice(0, 300)}`);
      }

      if (!documento.disclaimer) {
        documento.disclaimer = "Este documento foi gerado por IA e deve ser revisado por profissional habilitado antes de apresentação ao órgão licitante.";
      }

      // Persiste em background
      if (context.bidProjectId) {
        supabase.from("bid_documents").insert({
          bid_project_id: context.bidProjectId,
          organization_id: context.organizationId,
          tipo,
          content: documento,
          created_by: context.userId,
        }).catch((e) => logger.error("licitacao.save.error", { error: e.message }));
      }

      const durationMs = Date.now() - startMs;
      recordLatency(`licitacao:${tipo}`, durationMs);
      recordTokens(context.organizationId, tokensUsed);
      await trace.finish({ tokensUsed, iterations, score: documento.validation?.score });

      return { ...documento, _meta: { iterations, tokensUsed, durationMs } };

    } catch (err) {
      recordError(`licitacao:${tipo}`);
      await trace.finish({ error: err.message });
      throw err;
    }
  }
}

export const licitacaoAgent = new LicitacaoAgent();
