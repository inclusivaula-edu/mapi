import { logger } from "../observability/logger.js";
import OpenAI from "openai";
import { buildMemory } from "../core/memory/memoryBuilder.js";
import { searchBNCC } from "../skills/searchBNCC.js";
import { searchDiagnosis } from "../skills/searchDiagnosis.js";
import { validateOutput } from "../skills/validateOutput.js";
import { saveLesson } from "../skills/saveLesson.js";
import { startTrace } from "../observability/tracer.js";
import { recordRequest, recordError, recordLatency, recordTokens } from "../observability/metrics.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─────────────────────────────────────────────────────────────
// FERRAMENTAS — o que o modelo pode chamar durante o raciocínio
//
// Cada ferramenta tem três partes:
//   handler:    a skill real que executa a lógica
//   definition: o contrato que o modelo vê (nome + parâmetros)
//
// O modelo não vê o handler — só vê a definition.
// Quando ele escolhe uma ferramenta, o agente executa o handler.
// ─────────────────────────────────────────────────────────────
const TOOLS = {
  buscar_bncc: {
    handler: ({ topic, grade }) => searchBNCC(topic, grade),
    definition: {
      type: "function",
      function: {
        name: "buscar_bncc",
        description:
          "Busca objetivos de aprendizagem da BNCC para um tema e série específicos. " +
          "Use sempre antes de criar qualquer aula para garantir alinhamento curricular.",
        parameters: {
          type: "object",
          properties: {
            topic: { type: "string", description: "Tema da aula (ex: frações, interpretação de texto)" },
            grade: { type: "string", description: "Série do aluno (ex: 3º ano, 5º ano EF)" },
          },
          required: ["topic"],
        },
      },
    },
  },

  buscar_estrategias_diagnostico: {
    handler: ({ diagnosis }) => searchDiagnosis(diagnosis),
    definition: {
      type: "function",
      function: {
        name: "buscar_estrategias_diagnostico",
        description:
          "Busca estratégias pedagógicas adaptadas para um diagnóstico específico (TEA, TDAH, Down, etc.). " +
          "Use quando o aluno tem diagnóstico informado para personalizar as atividades.",
        parameters: {
          type: "object",
          properties: {
            diagnosis: {
              type: "string",
              description: "Diagnóstico do aluno (ex: TEA, TDAH, Síndrome de Down, deficiência visual)",
            },
          },
          required: ["diagnosis"],
        },
      },
    },
  },

  validar_aula: {
    handler: ({ lesson, student }) => validateOutput(lesson, student),
    definition: {
      type: "function",
      function: {
        name: "validar_aula",
        description:
          "Valida se a aula criada está adequada para o perfil do aluno. " +
          "Use depois de montar a aula para verificar qualidade pedagógica antes de entregar.",
        parameters: {
          type: "object",
          properties: {
            lesson: { type: "object", description: "Objeto da aula gerada" },
            student: { type: "object", description: "Perfil do aluno" },
          },
          required: ["lesson", "student"],
        },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────
// TEACHER AGENT
// ─────────────────────────────────────────────────────────────
export class TeacherAgent {
  /**
   * Identidade persistente do agente.
   * Quanto mais específica for a persona, melhor o modelo se comporta —
   * "professor" é vago; "Ana, especialista em AEE com foco em diagnósticos
   * neurológicos seguindo BNCC e LBI" é um contrato comportamental.
   */
  get identity() {
    return `Você é Professora Ana, especialista em Atendimento Educacional Especializado (AEE)
com 15 anos de experiência em educação inclusiva no Brasil.

FLUXO OBRIGATÓRIO — siga sempre nesta ordem:
PASSO 1: Chame buscar_bncc para obter os objetivos BNCC do tema e série.
PASSO 2: Se o aluno tem diagnóstico, chame buscar_estrategias_diagnostico para obter estratégias pedagógicas.
PASSO 3: USE as informações retornadas pelos passos 1 e 2 para CRIAR A AULA. NÃO devolva os dados das ferramentas como resposta — use-os como insumo para escrever a aula.
PASSO 4: Chame validar_aula com a aula criada. Se score < 7, reescreva.
PASSO 5: Retorne o JSON final da aula.

ATENÇÃO CRÍTICA: Os resultados das ferramentas (strategies, sensoryChannel, alerts, etc.)
são INFORMAÇÕES PARA VOCÊ USAR, não são a resposta final. Você deve escrever uma AULA
completa usando essas informações como base pedagógica.

FORMATO DE SAÍDA FINAL — JSON puro, sem markdown, sem texto fora do JSON:
{
  "title": "título claro e motivador da aula",
  "bncc": "código BNCC (ex: EF03MA07)",
  "objective": "o que o aluno vai aprender hoje",
  "explanation": "explicação didática simples, do concreto para o abstrato",
  "example": "exemplo prático do cotidiano real do aluno",
  "activities": ["atividade 1 adaptada ao diagnóstico", "atividade 2 adaptada ao diagnóstico"],
  "adaptations": "como as estratégias do diagnóstico foram aplicadas nesta aula",
  "validation": { "score": 8, "issues": [] }
}`;
  }

  /**
   * Executa o agente com loop de tool use.
   *
   * O loop funciona assim:
   *   1. Envia mensagens + ferramentas disponíveis para o modelo
   *   2. Se o modelo retornar tool_calls: executa as skills e devolve os resultados
   *   3. Repete até o modelo não pedir mais ferramentas (stop_reason = "stop")
   *   4. O último conteúdo texto é a resposta final
   *
   * Isso é o padrão ReAct (Reason + Act) — o modelo raciocina, age, observa
   * o resultado da ação, e raciocina novamente até ter resposta suficiente.
   *
   * @param {string} topic    - Tema da aula
   * @param {object} student  - { name, age, grade, diagnosis }
   * @param {object} context  - { userId, chatId, tenantId }
   */
  async run({ topic, student, context }) {
    const trace = startTrace({
      organizationId: context.organizationId,
      userId:         context.userId,
      workflow:       "gerar-aula",
      input:          topic,
    });
    const startMs = Date.now();
    recordRequest("gerar-aula");

    try {
    // 1. Constrói o histórico de memória + RAG para dar contexto ao agente
    const history = await buildMemory({
      module:         "education",
      input:          topic,
      chatId:         context.chatId,
      organizationId: context.organizationId,
    });

    // 2. Monta as mensagens iniciais — system + histórico + pedido do usuário
    const messages = [
      { role: "system", content: this.identity },
      ...history.filter((m) => m.role !== "system"),
      {
        role: "user",
        content: `Crie uma aula sobre "${topic}" para o seguinte aluno:
Nome: ${student.name}
Idade: ${student.age ?? "não informada"}
Série: ${student.grade ?? "não informada"}
Diagnóstico: ${student.diagnosis ?? "não informado"}`,
      },
    ];

    const toolDefinitions = Object.values(TOOLS).map((t) => t.definition);
    let tokensUsed = 0;
    let iterations = 0;
    const MAX_ITERATIONS = 6; // proteção contra loops infinitos

    // 3. Loop de raciocínio — continua até o modelo parar de pedir ferramentas
    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools: toolDefinitions,
        tool_choice: "auto",
        temperature: 0.6,
      });

      const message = response.choices[0].message;
      tokensUsed += response.usage?.total_tokens ?? 0;

      // Adiciona a resposta do modelo ao histórico de mensagens
      messages.push(message);

      // 4. Se não há mais tool_calls: o agente chegou à resposta final
      if (!message.tool_calls?.length) break;

      // 5. Executa cada ferramenta que o modelo pediu
      for (const call of message.tool_calls) {
        const toolName = call.function.name;
        const toolArgs = JSON.parse(call.function.arguments);
        const tool = TOOLS[toolName];

        let toolResult;
        if (tool) {
          try {
            toolResult = await tool.handler(toolArgs);
          } catch (err) {
            // Erro na ferramenta não derruba o agente — retorna erro descritivo
            toolResult = { error: err.message };
            logger.error(`TeacherAgent: ferramenta "${toolName}" falhou:`, err.message);
          }
        } else {
          toolResult = { error: `Ferramenta "${toolName}" não encontrada` };
        }

        // Retorna o resultado da ferramenta para o modelo continuar o raciocínio
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(toolResult),
        });
      }
    }

    // 6. Extrai e parseia a resposta final
    const lastMessage = messages[messages.length - 1];
    const raw = lastMessage?.content ?? "";

    let lesson;
    try {
      lesson = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      throw new Error(`TeacherAgent: resposta final não é JSON válido.\nRaw: ${raw.slice(0, 300)}`);
    }

    // 7. Salva em background — não bloqueia a resposta ao usuário
    saveLesson(lesson, { ...context, topic, student }, tokensUsed).catch((e) => logger.error(e.message));

    // 8. Observabilidade
    const durationMs = Date.now() - startMs;
    recordLatency("gerar-aula", durationMs);
    recordTokens(context.organizationId, tokensUsed);
    await trace.finish({ tokensUsed, iterations });

    return { ...lesson, _meta: { iterations, tokensUsed, durationMs } };

    } catch (err) {
      recordError("gerar-aula");
      await trace.finish({ error: err.message });
      throw err;
    }
  }
}

// Exporta instância singleton — um agente por processo, não um por requisição
export const teacherAgent = new TeacherAgent();
