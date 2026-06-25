/**
 * Extrai o primeiro objeto JSON válido de uma string que pode conter
 * texto, markdown, code fences, etc.
 */
export function extractJson(raw) {
  if (!raw) return null;

  // 1. Tenta parse direto
  const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(clean); } catch {}

  // 2. Procura o primeiro { ... } balanceado
  const start = raw.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === "{") depth++;
    else if (raw[i] === "}") {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(raw.slice(start, i + 1)); } catch {}
      }
    }
  }

  return null;
}
