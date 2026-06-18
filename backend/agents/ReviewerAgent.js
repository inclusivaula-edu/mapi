import { logger } from "../observability/logger.js";
import { chat } from "../services/aiService.js";
import { validateOutput } from "../skills/validateOutput.js";

/**
 * REVIEWER AGENT
 *
 * Subagente especializado em revisar e corrigir aulas geradas pelo TeacherAgent.
 *
 * Por que existe separado do TeacherAgent?
 * Porque validar é um trabalho diferente de criar. Um modelo instruído a "criar"
 * tende a ser otimista com sua própria saída. Um modelo com identidade de
 * "revisor crítico" aplica critérios mais rigorosos — é o mesmo princípio
 * de ter um editor separado do escritor.
 *
 * Fluxo de uso:
 *   TeacherAgent gera → ReviewerAgent revisa → se score < 7, reescreve → entrega
 */
export class ReviewerAgent {
  get identity() {
    return `Você é uma revisora pedagógica sênior especializada em materiais de educação inclusiva.
Sua função é avaliar e corrigir aulas geradas para alunos com necessidades especiais.

Seja crítica e direta. Não aprove conteúdo inadequado para o diagnóstico do aluno.
Ao reescrever, mantenha o JSON no mesmo formato — apenas corrija o que está errado.`;
  }

  /**
   * Revisa uma aula e a reescreve se necessário.
   *
   * @param {object} lesson   - Aula gerada pelo TeacherAgent
   * @param {object} student  - Perfil do aluno
   * @returns {Promise<{lesson: object, revised: boolean, score: number}>}
   */
  async review({ lesson, student }) {
    // 1. Valida usando a skill de validação
    const validation = await validateOutput(lesson, student);

    // 2. Se aprovado, retorna sem reescrever
    if (validation.valid) {
      return { lesson: { ...lesson, validation }, revised: false, score: validation.score };
    }

    // 3. Score insuficiente — reescreve com os problemas encontrados como guia
    const issuesList = validation.issues.join("\n- ");

    const raw = await chat({
      system: this.identity,
      user: `A aula abaixo foi reprovada (score ${validation.score}/10).

PROBLEMAS ENCONTRADOS:
- ${issuesList}

ALUNO: ${JSON.stringify(student)}
AULA ORIGINAL: ${JSON.stringify(lesson)}

Corrija os problemas e retorne a aula revisada em JSON puro, mesmo formato.`,
      temperature: 0.4,
    });

    let revised;
    try {
      revised = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      // Se a revisão falhar no parse, entrega a original com flag de aviso
      logger.warn("ReviewerAgent: falha no parse da revisão — entregando original");
      return { lesson: { ...lesson, validation }, revised: false, score: validation.score };
    }

    return {
      lesson: { ...revised, validation: { ...validation, revised: true } },
      revised: true,
      score: validation.score,
    };
  }
}

export const reviewerAgent = new ReviewerAgent();
