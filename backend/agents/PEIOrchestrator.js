import { logger } from "../observability/logger.js";
import { chat } from "../services/aiService.js";
import { searchDiagnosis } from "../skills/searchDiagnosis.js";
import { searchBNCC } from "../skills/searchBNCC.js";
import { logUsage } from "../billing/ledger.engine.js";
import { supabase } from "../services/dbService.js";
import { getStudentHistory, saveStudentSnapshot } from "../skills/studentHistory.js";

/**
 * PEI ORCHESTRATOR — Subagentes em paralelo para relatório PEI completo
 *
 * Um PEI (Plano Educacional Individualizado) tem seções independentes
 * entre si. Isso é o caso ideal para subagentes paralelos:
 *
 *   ┌─────────────────────────────────────────┐
 *   │           PEIOrchestrator               │
 *   │                                         │
 *   │  ┌──────────┐  ┌──────────┐  ┌───────┐ │
 *   │  │Diagnóstico│  │Objetivos │  │Estrat.│ │  ← rodam em paralelo
 *   │  └──────────┘  └──────────┘  └───────┘ │
 *   │                                         │
 *   │           ┌──────────┐                  │
 *   │           │ Síntese  │                  │  ← une os resultados
 *   │           └──────────┘                  │
 *   └─────────────────────────────────────────┘
 *
 * Tempo com subagentes sequenciais: ~30s
 * Tempo com subagentes paralelos:   ~10s (o tempo do mais lento)
 */
export class PEIOrchestrator {

  // ── Subagente 1: Diagnóstico e perfil funcional ──────────────────────────
  async runDiagnosticoAgent({ student }) {
    const strategies = await searchDiagnosis(student.diagnosis);

    return chat({
      system: `Você escreve a seção de diagnóstico e perfil funcional de um PEI.
Seja técnico, objetivo e baseado em evidências da neuropsicologia educacional.
Retorne APENAS JSON puro:
{
  "name": "Diagnóstico e Perfil Funcional",
  "content": "texto detalhado da seção"
}`,
      user: `ALUNO: ${JSON.stringify(student)}
ESTRATÉGIAS DO DIAGNÓSTICO: ${JSON.stringify(strategies)}${student._history ?? ""}
Escreva a seção de Diagnóstico e Perfil Funcional do PEI.`,
      temperature: 0.3,
    }).then((raw) => JSON.parse(raw.replace(/```json|```/g, "").trim()));
  }

  // ── Subagente 2: Objetivos pedagógicos ──────────────────────────────────
  async runObjetivosAgent({ student }) {
    const bncc = await searchBNCC(student.mainDifficulty ?? "conteúdo básico", student.grade);

    return chat({
      system: `Você define objetivos pedagógicos de curto, médio e longo prazo para um PEI.
Use os códigos BNCC quando relevante. Seja específico e mensurável (critérios SMART).
Se houver histórico de semestres anteriores, REFERENCIE os objetivos passados e indique quais foram atingidos.
Retorne APENAS JSON puro:
{
  "name": "Objetivos Pedagógicos",
  "content": "texto detalhado com objetivos de curto, médio e longo prazo"
}`,
      user: `ALUNO: ${JSON.stringify(student)}
BNCC RELEVANTE: ${JSON.stringify(bncc)}${student._history ?? ""}
Defina os objetivos pedagógicos do PEI.`,
      temperature: 0.3,
    }).then((raw) => JSON.parse(raw.replace(/```json|```/g, "").trim()));
  }

  // ── Subagente 3: Estratégias e adaptações curriculares ───────────────────
  async runEstrategiasAgent({ student }) {
    const strategies = await searchDiagnosis(student.diagnosis);

    return chat({
      system: `Você define estratégias pedagógicas e adaptações curriculares para um PEI.
Inclua: metodologias, recursos, tecnologias assistivas e adaptações de avaliação.
Retorne APENAS JSON puro:
{
  "name": "Estratégias e Adaptações Curriculares",
  "content": "texto detalhado com estratégias e adaptações"
}`,
      user: `ALUNO: ${JSON.stringify(student)}
ESTRATÉGIAS DO DIAGNÓSTICO: ${JSON.stringify(strategies)}${student._history ?? ""}
Defina estratégias e adaptações curriculares do PEI. Se houver histórico, indique quais estratégias foram eficazes e quais precisam ser ajustadas.`,
      temperature: 0.3,
    }).then((raw) => JSON.parse(raw.replace(/```json|```/g, "").trim()));
  }

  // ── Subagente 4: Avaliação e monitoramento ───────────────────────────────
  async runAvaliacaoAgent({ student }) {
    return chat({
      system: `Você define critérios de avaliação e monitoramento para um PEI.
Inclua: instrumentos de avaliação adaptados, frequência de revisão do plano,
indicadores de progresso e envolvimento da família.
Retorne APENAS JSON puro:
{
  "name": "Avaliação e Monitoramento",
  "content": "texto detalhado com critérios e instrumentos de avaliação"
}`,
      user: `ALUNO: ${JSON.stringify(student)}
Defina critérios de avaliação e monitoramento do PEI.`,
      temperature: 0.3,
    }).then((raw) => JSON.parse(raw.replace(/```json|```/g, "").trim()));
  }

  // ── Agente de síntese: integra as 4 seções em um PEI coeso ───────────────
  async runSynthesisAgent({ student, sections }) {
    return chat({
      system: `Você é o redator final de documentos pedagógicos oficiais (PEI/MEC).
Recebe 4 seções geradas por especialistas diferentes e as integra em um documento
coeso, consistente e sem repetições.
Retorne APENAS JSON puro:
{
  "header": {
    "institution": { "name": "Secretaria Municipal de Educação", "department": "AEE" },
    "student": {
      "name": "string", "age": "string", "grade": "string", "diagnosis": "string"
    },
    "date": "string"
  },
  "sections": [
    { "name": "string", "content": "string" }
  ],
  "type": "PEI"
}`,
      user: `ALUNO: ${JSON.stringify(student)}
SEÇÕES: ${JSON.stringify(sections)}
Integre as seções em um PEI completo e coeso.`,
      temperature: 0.2,
    }).then((raw) => JSON.parse(raw.replace(/```json|```/g, "").trim()));
  }

  /**
   * Executa o PEI completo com 4 subagentes em paralelo + síntese.
   *
   * @param {object} student  - Perfil completo do aluno
   * @param {object} context  - { userId }
   */
  async run({ student, context }) {
    const startTime = Date.now();

    // ── HISTÓRICO: busca evolução de semestres anteriores ─────────────────
    let studentHistory = [];
    if (student.id && context.organizationId) {
      studentHistory = await getStudentHistory(student.id, context.organizationId);
    }
    const historyContext = studentHistory.length > 0
      ? `\n\nHISTÓRICO DO ALUNO (semestres anteriores):\n${JSON.stringify(studentHistory.slice(0, 4), null, 2)}`
      : "";

    // Injeta histórico no perfil do aluno para os subagentes
    const enrichedStudent = { ...student, _history: historyContext };

    // ── FORK: 4 subagentes rodando em paralelo ────────────────────────────
    const [diagnostico, objetivos, estrategias, avaliacao] = await Promise.all([
      this.runDiagnosticoAgent({ student: enrichedStudent }),
      this.runObjetivosAgent({ student: enrichedStudent }),
      this.runEstrategiasAgent({ student: enrichedStudent }),
      this.runAvaliacaoAgent({ student: enrichedStudent }),
    ]);

    // ── JOIN: síntese integra os 4 resultados ─────────────────────────────
    const pei = await this.runSynthesisAgent({
      student,
      sections: [diagnostico, objetivos, estrategias, avaliacao],
    });

    const elapsed = Date.now() - startTime;

    // Persiste o PEI em background
    supabase.from("reports").insert({
      organization_id: context.organizationId,
      user_id:         context.userId,
      type:            "PEI",
      student_name:    student.name,
      content:         pei,
      created_at:      new Date().toISOString(),
    }).catch((e) => logger.error(e.message));

    // Salva snapshot do aluno no histórico longitudinal
    if (student.id && context.organizationId) {
      const objectives = pei.sections
        ?.find((s) => s.name?.toLowerCase().includes("objetivo"))
        ?.content;
      const strategies = pei.sections
        ?.find((s) => s.name?.toLowerCase().includes("estratégia"))
        ?.content;

      saveStudentSnapshot({
        studentId: student.id,
        orgId: context.organizationId,
        userId: context.userId,
        student: { name: student.name, age: student.age, grade: student.grade, diagnosis: student.diagnosis },
        objectives: objectives ? [{ semester_objective: objectives, achieved: null }] : [],
        strategies: strategies ? [{ semester_strategy: strategies, effective: null }] : [],
      }).catch((e) => logger.error("pei.snapshot.error", { error: e.message }));
    }

    return {
      ...pei,
      _meta: {
        generatedIn: `${(elapsed / 1000).toFixed(1)}s`,
        subagents: 4,
        pattern: "fork-join",
        historyUsed: studentHistory.length > 0,
      },
    };
  }
}

export const peiOrchestrator = new PEIOrchestrator();
