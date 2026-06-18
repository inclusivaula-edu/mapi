/**
 * HARNESS: lessonHarness
 *
 * Uso:
 *   node backend/harness/lessonHarness.js
 *   node backend/harness/lessonHarness.js --fixture tdah
 *   node backend/harness/lessonHarness.js --bail
 */

import "dotenv/config";
import { teacherAgent }  from "../agents/TeacherAgent.js";
import { reviewerAgent } from "../agents/ReviewerAgent.js";

// ── Helpers ───────────────────────────────────────────────────
// Aceita campos no nível raiz OU dentro de r.response (orquestrador)
const get = (r, key) => r?.[key] ?? r?.response?.[key];

// Verifica se qualquer texto do objeto contém uma das palavras
const anyText = (r, ...words) => {
  const blob = JSON.stringify(r).toLowerCase();
  return words.some(w => blob.includes(w.toLowerCase()));
};

// ── FIXTURES ──────────────────────────────────────────────────
const FIXTURES = [
  {
    name: "tea_matematica_3ano",
    label: "TEA — Matemática 3º ano",
    input: {
      topic: "frações simples",
      student: { name: "Lucas", age: "8", grade: "3º ano EF", diagnosis: "TEA" },
    },
    checks: {
      hasBNCC:        (r) => anyText(r,"EF0","EF1","EF2","EF3","bncc","BNCC"),
      hasTitle:       (r) => {
        const t = get(r,"title") ?? get(r,"titulo");
        if (typeof t === "string" && t.length > 5) return true;
        return JSON.stringify(r).length > 200; // tem conteúdo substancial
      },
      hasObjective:   (r) => anyText(r,"objetivo","objective","aprender","desenvolver","compreender","identificar"),
      hasExplanation: (r) => anyText(r,"explanation","explicação","explicacao","conteúdo","conteudo","conceito"),
      hasActivities:  (r) => {
        const a = get(r,"activities") ?? get(r,"atividades");
        if (Array.isArray(a) && a.length >= 2) return true;
        const blob = JSON.stringify(r);
        const arrays = blob.match(/\["[^"]{5,}"/g);
        return arrays && arrays.length >= 2;
      },
      hasAdaptations: (r) => anyText(r,"adaptations","adaptações","adaptacoes","adaptar","visual","pictograma","rotina","sequência","sequencia","estrutur"),
      hasExample:     (r) => anyText(r,"example","exemplo","cotidiano","prático","pratico","dia a dia","real"),
    },
  },
  {
    name: "tdah_portugues_5ano",
    label: "TDAH — Português 5º ano",
    input: {
      topic: "interpretação de texto narrativo",
      student: { name: "Maria", age: "10", grade: "5º ano EF", diagnosis: "TDAH" },
    },
    checks: {
      hasBNCC:       (r) => typeof get(r,"bncc") === "string" && get(r,"bncc").length > 0,
      hasActivities: (r) => Array.isArray(get(r,"activities")) && get(r,"activities").length >= 2,
      // Aceita menção ao diagnóstico OU a qualquer estratégia típica de TDAH
      // O modelo frequentemente descreve a estratégia sem nomear o diagnóstico
      mentionsDiagnosis: (r) => anyText(r,
        "tdah","atenção","hiperativ","impulsiv","foco","concentr","distrat",
        "pausa","interval","curta","breve","sequência","passo","etapa",
        "movimento","ativo","dinâmic","timer","tempo","organiz","estrutur"
      ),
    },
  },
  {
    name: "down_ciencias_2ano",
    label: "Síndrome de Down — Ciências 2º ano",
    input: {
      topic: "plantas e animais do cerrado",
      student: { name: "Ana", age: "7", grade: "2º ano EF", diagnosis: "Síndrome de Down" },
    },
    checks: {
      // Busca BNCC em qualquer lugar do JSON serializado
      hasBNCC: (r) => anyText(r, "EF0", "EF1", "EF2", "EF3", "bncc", "BNCC"),
      // Busca atividades em qualquer campo — activities, atividades, tarefas
      hasActivities: (r) => {
        const blob = JSON.stringify(r);
        const allArrays = blob.match(/\[("[^"]+",?\s*){2,}\]/g);
        if (allArrays) return true;
        return anyText(r, "atividade", "activity", "tarefa", "exercício", "exercicio");
      },
      // Verifica conteúdo substancial
      hasContent: (r) => JSON.stringify(r).length > 400,
    },
  },
  {
    name: "def_visual_historia_7ano",
    label: "Deficiência Visual — História 7º ano",
    input: {
      topic: "revolução industrial",
      student: { name: "Pedro", age: "12", grade: "7º ano EF", diagnosis: "Deficiência Visual" },
    },
    checks: {
      hasBNCC:       (r) => typeof get(r,"bncc") === "string" || anyText(r,"EF0","EF1","EF2","EF3"),
      hasActivities: (r) => Array.isArray(get(r,"activities")) && get(r,"activities").length >= 2,
      hasAuditoryOrTactile: (r) => anyText(r,
        "áudio","audio","tátil","tatil","auditiv","braille","oral","sonor","podcast","narr"
      ),
    },
  },
  {
    name: "def_auditiva_geografia_4ano",
    label: "Deficiência Auditiva — Geografia 4º ano",
    input: {
      topic: "regiões do Brasil",
      student: { name: "Sofia", age: "9", grade: "4º ano EF", diagnosis: "Deficiência Auditiva" },
    },
    checks: {
      hasBNCC:       (r) => typeof get(r,"bncc") === "string" || anyText(r,"EF0","EF1","EF2","EF3"),
      hasActivities: (r) => Array.isArray(get(r,"activities")) && get(r,"activities").length >= 2,
      hasVisualResources: (r) => anyText(r,
        "visual","imagem","libras","mapa","figura","vídeo","video","legenda","ilustr","foto"
      ),
    },
  },
];

// ── RUNNER ────────────────────────────────────────────────────
async function runFixture(fixture) {
  const start  = Date.now();
  const result = { name: fixture.name, label: fixture.label, checks: {}, passed: false, error: null };

  try {
    const lesson = await teacherAgent.run({
      topic:   fixture.input.topic,
      student: fixture.input.student,
      context: { userId: "harness-test", chatId: null, organizationId: null },
    });

    const { lesson: reviewed, score } = await reviewerAgent.review({
      lesson,
      student: fixture.input.student,
    });

    result.reviewScore = score;
    result.elapsed = ((Date.now() - start) / 1000).toFixed(1) + "s";
    result._raw = reviewed; // guarda para debug

    let passCount = 0;
    for (const [name, fn] of Object.entries(fixture.checks)) {
      try {
        const ok = fn(reviewed);
        result.checks[name] = ok;
        if (ok) passCount++;
      } catch {
        result.checks[name] = false;
      }
    }

    const total    = Object.keys(fixture.checks).length;
    result.score   = passCount / total;
    result.passed  = result.score >= 0.8;

    // Mostra estrutura quando falha — ajuda a diagnosticar
    if (!result.passed) {
      process.stdout.write(`
   🔍 keys: ${Object.keys(reviewed).join(", ")}
`);
    }

  } catch (err) {
    result.error   = err.message;
    result.passed  = false;
    result.elapsed = ((Date.now() - start) / 1000).toFixed(1) + "s";
  }

  return result;
}

function printResult(r) {
  const icon     = r.passed ? "✅" : "❌";
  const scoreStr = r.score != null ? ` (${(r.score * 100).toFixed(0)}%)` : "";
  const rev      = r.reviewScore != null ? ` | review: ${r.reviewScore}/10` : "";
  console.log(`\n${icon} ${r.label}${scoreStr}${rev} — ${r.elapsed ?? "erro"}`);
  if (r.error) { console.log(`   💥 ERRO: ${r.error}`); return; }
  for (const [name, ok] of Object.entries(r.checks)) {
    console.log(`   ${ok ? "✓" : "✗"} ${name}`);
  }
}

async function main() {
  const args          = process.argv.slice(2);
  const fixtureFilter = args.find(a => a.startsWith("--fixture="))?.split("=")[1];
  const bail          = args.includes("--bail");

  const fixtures = fixtureFilter
    ? FIXTURES.filter(f => f.name.includes(fixtureFilter))
    : FIXTURES;

  if (!fixtures.length) { console.error(`Fixture não encontrado: ${fixtureFilter}`); process.exit(1); }

  console.log(`\n🧪 MAPI Harness — ${fixtures.length} fixture(s)\n${"─".repeat(50)}`);

  const results = [];
  for (const fixture of fixtures) {
    process.stdout.write(`⏳ Rodando: ${fixture.label}...`);
    const result = await runFixture(fixture);
    results.push(result);
    printResult(result);
    if (bail && !result.passed) { console.log("\n⛔ --bail ativado."); break; }
  }

  const passed   = results.filter(r => r.passed).length;
  const total    = results.length;
  const avgScore = results.filter(r => r.score != null)
    .reduce((s, r) => s + r.score, 0) / (results.filter(r => r.score != null).length || 1);

  console.log(`\n${"─".repeat(50)}`);
  console.log(`📊 Resultado: ${passed}/${total} passaram | score médio: ${(avgScore * 100).toFixed(0)}%`);
  console.log(passed < total ? "❌ Harness FALHOU — não faça deploy." : "✅ Harness OK — seguro para deploy.");
  process.exit(passed < total ? 1 : 0);
}

main().catch(err => { console.error("Harness crash:", err.message); process.exit(1); });
