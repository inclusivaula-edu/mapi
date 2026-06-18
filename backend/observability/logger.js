/**
 * LOGGER ESTRUTURADO
 *
 * Substitui todos os console.log/error do projeto por logs JSON.
 * Em produção, cada linha de log é um objeto JSON — pronto para
 * ingerir no Datadog, Loki, ou qualquer agregador de logs.
 *
 * Níveis: debug < info < warn < error
 * Em produção (NODE_ENV=production) descarta debug automaticamente.
 */

const LEVEL_NUM = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = process.env.NODE_ENV === "production" ? 1 : 0; // info em prod, debug em dev

function log(level, message, meta = {}) {
  if (LEVEL_NUM[level] < MIN_LEVEL) return;

  const entry = {
    ts:      new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const line = JSON.stringify(entry);

  if (level === "error" || level === "warn") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

export const logger = {
  debug: (message, meta)  => log("debug", message, meta),
  info:  (message, meta)  => log("info",  message, meta),
  warn:  (message, meta)  => log("warn",  message, meta),
  error: (message, meta)  => log("error", message, meta),

  /** Loga início + fim de uma operação com duração automática. */
  async timed(label, fn, meta = {}) {
    const start = Date.now();
    try {
      const result = await fn();
      log("info", `${label} completed`, { ...meta, durationMs: Date.now() - start });
      return result;
    } catch (err) {
      log("error", `${label} failed`, { ...meta, durationMs: Date.now() - start, error: err.message });
      throw err;
    }
  },
};
