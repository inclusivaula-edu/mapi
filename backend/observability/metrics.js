/**
 * METRICS
 *
 * Contadores leves em memória para o dashboard em tempo real.
 * Não substitui um sistema de métricas externo (Prometheus, Datadog) —
 * é uma camada simples que funciona sem dependências extras.
 *
 * Reset automático a cada hora para evitar consumo crescente de memória.
 */

const store = {
  requests:   {},   // { "workflow:gerar-aula": count }
  errors:     {},   // { "workflow:gerar-aula": count }
  latencies:  {},   // { "workflow:gerar-aula": [ms, ms, ms] }
  tokens:     {},   // { "orgId": totalTokens }
  scores:     [],   // [{ workflow, score, ts }] — últimos 500
};

// Reset a cada hora
setInterval(() => {
  store.requests  = {};
  store.errors    = {};
  store.latencies = {};
  store.tokens    = {};
  store.scores    = store.scores.slice(-100); // mantém os 100 mais recentes
}, 60 * 60 * 1000);

// ── CONTADORES ───────────────────────────────────────────────

export function recordRequest(workflow) {
  store.requests[workflow] = (store.requests[workflow] ?? 0) + 1;
}

export function recordError(workflow) {
  store.errors[workflow] = (store.errors[workflow] ?? 0) + 1;
}

export function recordLatency(workflow, ms) {
  if (!store.latencies[workflow]) store.latencies[workflow] = [];
  store.latencies[workflow].push(ms);
  // Mantém apenas as últimas 200 amostras por workflow
  if (store.latencies[workflow].length > 200) {
    store.latencies[workflow] = store.latencies[workflow].slice(-200);
  }
}

export function recordTokens(organizationId, count) {
  store.tokens[organizationId] = (store.tokens[organizationId] ?? 0) + count;
}

export function recordScore(workflow, score) {
  store.scores.push({ workflow, score, ts: Date.now() });
  if (store.scores.length > 500) store.scores = store.scores.slice(-500);
}

// ── SNAPSHOT (para o dashboard) ──────────────────────────────

export function getSnapshot() {
  const workflows = new Set([
    ...Object.keys(store.requests),
    ...Object.keys(store.errors),
  ]);

  const byWorkflow = {};
  for (const wf of workflows) {
    const lats = store.latencies[wf] ?? [];
    const sorted = [...lats].sort((a, b) => a - b);

    byWorkflow[wf] = {
      requests: store.requests[wf] ?? 0,
      errors:   store.errors[wf]   ?? 0,
      errorRate: store.requests[wf]
        ? ((store.errors[wf] ?? 0) / store.requests[wf] * 100).toFixed(1) + "%"
        : "0%",
      latency: {
        avg: lats.length ? Math.round(lats.reduce((a, b) => a + b, 0) / lats.length) : 0,
        p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
        p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
        p99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
      },
    };
  }

  const avgScore = store.scores.length
    ? (store.scores.reduce((a, b) => a + b.score, 0) / store.scores.length).toFixed(1)
    : null;

  return {
    uptime:        Math.floor(process.uptime()),
    memoryMB:      Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    byWorkflow,
    tokensByOrg:   store.tokens,
    avgQualityScore: avgScore,
    recentScores:  store.scores.slice(-20),
    generatedAt:   new Date().toISOString(),
  };
}
