import { logger } from "./logger.js";
import { supabase } from "../services/dbService.js";

/**
 * TRACER
 *
 * Registra um trace completo de cada requisição de IA:
 *   - qual agente rodou
 *   - quantas iterações de tool use
 *   - tokens consumidos
 *   - latência total
 *   - score de qualidade (reviewer)
 *   - erros, se houver
 *
 * Persiste na tabela `traces` para análise histórica.
 * Permite responder: "por que a aula do aluno X ficou ruim na terça?"
 */

/**
 * Inicia um trace e retorna um objeto com método `finish`.
 *
 * Uso:
 *   const trace = startTrace({ orgId, userId, workflow: "gerar-aula" });
 *   // ... executa o agente ...
 *   await trace.finish({ tokensUsed, score, iterations });
 */
export function startTrace({ organizationId, userId, workflow, input = "" }) {
  const traceId  = crypto.randomUUID();
  const startedAt = Date.now();

  logger.info("trace.start", { traceId, organizationId, userId, workflow });

  return {
    traceId,

    async finish({ tokensUsed = 0, score = null, iterations = null, error = null } = {}) {
      const durationMs = Date.now() - startedAt;

      logger.info("trace.finish", {
        traceId,
        organizationId,
        userId,
        workflow,
        durationMs,
        tokensUsed,
        score,
        iterations,
        error,
      });

      // Persiste em background — não bloqueia a resposta
      supabase.from("traces").insert({
        id:              traceId,
        organization_id: organizationId,
        user_id:         userId,
        workflow,
        input_length:    input.length,
        duration_ms:     durationMs,
        tokens_used:     tokensUsed,
        quality_score:   score,
        iterations,
        error,
        created_at:      new Date().toISOString(),
      }).then(({ error: dbErr }) => {
        if (dbErr) logger.warn("trace.persist.failed", { traceId, error: dbErr.message });
      });

      return { traceId, durationMs };
    },

    /** Registra um evento intermediário dentro do trace (ex: tool call). */
    event(name, meta = {}) {
      logger.debug("trace.event", { traceId, name, ...meta });
    },
  };
}
