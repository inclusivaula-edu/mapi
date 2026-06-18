/**
 * HARNESS: juridicoHarness
 *
 * Testa o módulo jurídico antes de qualquer deploy.
 * 6 fixtures cobrindo os documentos mais críticos.
 *
 * Uso:
 *   node backend/harness/juridicoHarness.js
 *   node backend/harness/juridicoHarness.js --fixture contrato
 *   node backend/harness/juridicoHarness.js --bail
 */

import "dotenv/config";
import { juridicoAgent }       from "../agents/juridico/JuridicoAgent.js";
import { contratoOrchestrator } from "../agents/juridico/ContratoOrchestrator.js";
import assistenteJuridico      from "../modules/juridico/workflows/assistenteJuridico.js";
import resumirLegislacao       from "../modules/juridico/workflows/resumirLegislacao.js";

const CTX = { userId: "harness-test", organizationId: "harness-org" };

const FIXTURES = [
  {
    name: "contrato_prestacao_servicos",
    label: "Contrato — Prestação de Serviços",
    run: () => contratoOrchestrator.run({
      tipo: "prestacao-servicos",
      area: "civil",
      descricao: "Desenvolvimento de software sob medida para empresa de e-commerce",
      partes: [
        { papel: "Contratante", nome: "Empresa X Ltda", cpfCnpj: "00.000.000/0001-00" },
        { papel: "Contratado",  nome: "Dev Y",           cpfCnpj: "000.000.000-00" },
      ],
      context: CTX,
    }),
    checks: {
      hasTitulo:      (r) => typeof r.titulo === "string" && r.titulo.length > 5,
      hasClausulas:   (r) => Array.isArray(r.clausulas) && r.clausulas.length >= 4,
      hasDisclaimer:  (r) => typeof r.disclaimer === "string" && r.disclaimer.length > 10,
      hasLegislacao:  (r) => Array.isArray(r.legislacao_aplicada) && r.legislacao_aplicada.length > 0,
      hasValidation:  (r) => r.validation?.score >= 6,
      hasAssinaturas: (r) => !!(r.assinaturas || r.clausulas?.some(c => c.titulo?.toLowerCase().includes("foro"))),
    },
  },
  {
    name: "contrato_nda",
    label: "Contrato — NDA (Confidencialidade)",
    run: () => contratoOrchestrator.run({
      tipo: "nda",
      area: "empresarial",
      descricao: "Acordo de confidencialidade entre duas startups para negociação de parceria",
      partes: [
        { papel: "Parte A", nome: "Startup Alpha" },
        { papel: "Parte B", nome: "Startup Beta"  },
      ],
      context: CTX,
    }),
    checks: {
      hasTitulo:     (r) => typeof r.titulo === "string",
      hasClausulas:  (r) => Array.isArray(r.clausulas) && r.clausulas.length >= 3,
      hasDisclaimer: (r) => typeof r.disclaimer === "string",
      hasConfidencialidadeClause: (r) =>
        r.clausulas?.some(c =>
          c.titulo?.toLowerCase().includes("confidencial") ||
          c.conteudo?.toLowerCase().includes("confidencial")
        ),
    },
  },
  {
    name: "parecer_trabalhista",
    label: "Parecer — Direito Trabalhista (rescisão)",
    run: () => juridicoAgent.run({
      tipo: "parecer-juridico",
      area: "trabalhista",
      descricao: `Parecer sobre: funcionário demitido por justa causa após 8 anos de empresa,
alega que a demissão foi arbitrária. Quais são os direitos do trabalhador
e qual a responsabilidade da empresa neste caso?`,
      partes: [],
      context: CTX,
    }),
    checks: {
      hasTitulo:      (r) => typeof r.titulo === "string",
      hasSecoes:      (r) => Array.isArray(r.secoes) && r.secoes.length >= 3,
      hasLegislacao:  (r) => Array.isArray(r.legislacao_aplicada) && r.legislacao_aplicada.length > 0,
      hasDisclaimer:  (r) => typeof r.disclaimer === "string" && r.disclaimer.length > 10,
      mentionsCLT:    (r) => JSON.stringify(r).toLowerCase().includes("clt") ||
                             JSON.stringify(r).toLowerCase().includes("consolidação"),
    },
  },
  {
    name: "parecer_consumidor",
    label: "Parecer — Direito do Consumidor (produto defeituoso)",
    run: () => juridicoAgent.run({
      tipo: "parecer-juridico",
      area: "consumidor",
      descricao: "Consumidor comprou eletrodoméstico com defeito, loja se recusa a trocar. Quais os direitos?",
      partes: [],
      context: CTX,
    }),
    checks: {
      hasSecoes:     (r) => Array.isArray(r.secoes) && r.secoes.length >= 2,
      hasLegislacao: (r) => Array.isArray(r.legislacao_aplicada) && r.legislacao_aplicada.length > 0,
      hasDisclaimer: (r) => typeof r.disclaimer === "string",
      mentionsCDC:   (r) => JSON.stringify(r).toLowerCase().includes("cdc") ||
                            JSON.stringify(r).toLowerCase().includes("8.078"),
    },
  },
  {
    name: "resumo_lgpd",
    label: "Resumo — LGPD (Lei Geral de Proteção de Dados)",
    run: () => resumirLegislacao({
      input: "LGPD",
      context: { tema: "LGPD proteção de dados pessoais", area: "digital", nivelDetalhe: "executivo", ...CTX },
    }),
    checks: {
      hasResumo:        (r) => typeof r.resumo_executivo === "string" && r.resumo_executivo.length > 20,
      hasPontosChave:   (r) => Array.isArray(r.pontos_chave) && r.pontos_chave.length >= 2,
      hasLegislacao:    (r) => Array.isArray(r.legislacao_principal) && r.legislacao_principal.length > 0,
      hasAcoes:         (r) => Array.isArray(r.o_que_voce_pode_fazer) || Array.isArray(r.o_que_voce_nao_pode_fazer),
      hasDisclaimer:    (r) => typeof r.disclaimer === "string",
      mentionsLGPD:     (r) => JSON.stringify(r).toLowerCase().includes("13.709") ||
                               JSON.stringify(r).toLowerCase().includes("lgpd"),
    },
  },
  {
    name: "assistente_direito_trabalhista",
    label: "Assistente — Dúvida trabalhista",
    run: () => assistenteJuridico({
      input: "Tenho direito a horas extras se trabalho de home office?",
      context: CTX,
    }),
    checks: {
      hasContent:    (r) => typeof r.content === "string" && r.content.length > 50,
      hasDisclaimer: (r) => typeof r.disclaimer === "string",
      hasType:       (r) => r.type === "assistente-juridico",
    },
  },
];

// ── RUNNER ────────────────────────────────────────────────────

async function runFixture(fixture) {
  const start  = Date.now();
  const result = { name: fixture.name, label: fixture.label, checks: {}, passed: false, error: null };

  try {
    const output = await fixture.run();

    result.elapsed = ((Date.now() - start) / 1000).toFixed(1) + "s";
    result.validationScore = output.validation?.score ?? output._meta?.validationScore ?? null;

    let passCount = 0;
    for (const [checkName, checkFn] of Object.entries(fixture.checks)) {
      try {
        const ok = checkFn(output);
        result.checks[checkName] = ok;
        if (ok) passCount++;
      } catch {
        result.checks[checkName] = false;
      }
    }

    const total      = Object.keys(fixture.checks).length;
    result.score     = passCount / total;
    result.passed    = result.score >= 0.8;

  } catch (err) {
    result.error   = err.message;
    result.passed  = false;
    result.elapsed = ((Date.now() - start) / 1000).toFixed(1) + "s";
  }

  return result;
}

function printResult(r) {
  const icon      = r.passed ? "✅" : "❌";
  const scoreStr  = r.score != null ? ` (${(r.score * 100).toFixed(0)}%)` : "";
  const valStr    = r.validationScore != null ? ` | jurídico: ${r.validationScore}/10` : "";

  console.log(`\n${icon} ${r.label}${scoreStr}${valStr} — ${r.elapsed ?? "erro"}`);
  if (r.error) { console.log(`   💥 ERRO: ${r.error}`); return; }

  for (const [name, ok] of Object.entries(r.checks)) {
    console.log(`   ${ok ? "✓" : "✗"} ${name}`);
  }
}

async function main() {
  const args          = process.argv.slice(2);
  const fixtureFilter = args.find((a) => a.startsWith("--fixture="))?.split("=")[1];
  const bail          = args.includes("--bail");

  const fixtures = fixtureFilter
    ? FIXTURES.filter((f) => f.name.includes(fixtureFilter))
    : FIXTURES;

  if (!fixtures.length) {
    console.error(`Nenhum fixture encontrado: ${fixtureFilter}`);
    process.exit(1);
  }

  console.log(`\n⚖️  MAPI Juridico Harness — ${fixtures.length} fixture(s)\n${"─".repeat(52)}`);

  const results = [];
  for (const fixture of fixtures) {
    process.stdout.write(`⏳ ${fixture.label}...`);
    const result = await runFixture(fixture);
    results.push(result);
    printResult(result);
    if (bail && !result.passed) {
      console.log("\n⛔ --bail ativado. Parando.");
      break;
    }
  }

  const passed   = results.filter((r) => r.passed).length;
  const total    = results.length;
  const avgScore = results
    .filter((r) => r.score != null)
    .reduce((s, r) => s + r.score, 0) / (results.filter((r) => r.score != null).length || 1);

  console.log(`\n${"─".repeat(52)}`);
  console.log(`📊 Resultado: ${passed}/${total} passaram | score médio: ${(avgScore * 100).toFixed(0)}%`);
  console.log(passed < total ? "❌ Harness FALHOU — não faça deploy." : "✅ Harness OK — seguro para deploy.");

  process.exit(passed < total ? 1 : 0);
}

main().catch((err) => { console.error("Harness crash:", err.message); process.exit(1); });
