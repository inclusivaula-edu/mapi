import { logger } from "../../../observability/logger.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { openai } from "../../../services/aiService.js";
import { supabase } from "../../../services/dbService.js";
import { logUsage } from "../../../billing/ledger.engine.js";

/**
 * Estruturas de relatório por tipo.
 * Cada tipo mapeia para as seções obrigatórias do documento MEC.
 */
const REPORT_STRUCTURES = {
  ANAMNESE: [
    "Identificação", "Histórico Gestacional", "Nascimento",
    "Saúde", "Desenvolvimento", "Comportamento", "Aprendizagem",
    "Autonomia", "Observações",
  ],
  PEI: [
    "Diagnóstico", "Objetivos", "Estratégias Pedagógicas",
    "Adaptações Curriculares", "Avaliação e Monitoramento",
  ],
  PAEE: [
    "Perfil do Estudante", "Plano de Atendimento Educacional",
    "Recursos e Apoios", "Evolução do Atendimento",
  ],
};

/**
 * WORKFLOW: gerar-relatorio
 *
 * Gera um relatório pedagógico MEC (ANAMNESE, PEI ou PAEE) para um aluno,
 * utilizando o histórico de aulas salvo no Supabase como base de evidências.
 *
 * Context esperado: { student, type, userId }
 *   - student: { name, age?, grade?, diagnosis? }
 *   - type: "ANAMNESE" | "PEI" | "PAEE"
 */
export default async function generateReport({ input, context }) {
  const { student, type, userId, organizationId } = context;

  if (!student?.name || !type) {
    throw new Error("MISSING_CONTEXT: student.name e type são obrigatórios");
  }

  const sections = REPORT_STRUCTURES[type];
  if (!sections) {
    throw new Error(`INVALID_TYPE: tipo de relatório "${type}" desconhecido. Use: ${Object.keys(REPORT_STRUCTURES).join(", ")}`);
  }

  // Busca o histórico de aulas para embasar o relatório
  const { data: lessons } = await supabase
    .from("lessons")
    .select("topic, bncc_code, content, created_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const lessonSummary = (lessons ?? [])
    .map((l) => `- ${l.topic} (BNCC: ${l.bncc_code ?? "N/A"})`)
    .join("\n") || "Nenhuma aula registrada ainda.";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `Você é um especialista em documentação pedagógica inclusiva (AEE/MEC).
Gere o relatório do tipo ${type} para o aluno abaixo.
Retorne APENAS JSON puro com esta estrutura:
{
  "header": {
    "institution": { "name": "string", "department": "string" },
    "student": { "name": "string", "age": "string", "grade": "string", "diagnosis": "string" }
  },
  "sections": [
    { "name": "nome da seção", "content": "conteúdo detalhado" }
  ]
}
As seções obrigatórias são: ${sections.join(", ")}.`,
      },
      {
        role: "user",
        content: `ALUNO:
Nome: ${student.name}
Idade: ${student.age ?? "não informada"}
Série: ${student.grade ?? "não informada"}
Diagnóstico: ${student.diagnosis ?? "não informado"}

HISTÓRICO DE AULAS:
${lessonSummary}

Gere o relatório completo ${type}.`,
      },
    ],
  });

  const raw = response.choices[0].message.content ?? "";
  const tokensUsed = response.usage?.total_tokens ?? 0;

  let report;
  try {
    report = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("PARSE_ERROR: relatório não retornou JSON válido.");
  }

  // Loga uso em background
  logUsage({ userId, organizationId, tokensUsed, model: "gpt-4o-mini" }).catch((e) => logger.error(e.message));

  return report;
}

/**
 * WORKFLOW: gerar-pdf
 *
 * Gera o relatório e o converte para PDF usando pdfkit.
 * Retorna { filePath, fileName } para o server.js servir como download.
 */
export async function generateReportPDF({ input, context }) {
  const report = await generateReport({ input, context });

  const fileName = `relatorio_${context.type}_${Date.now()}.pdf`;
  const dir = path.resolve("./tmp");
  const filePath = path.join(dir, fileName);

  fs.mkdirSync(dir, { recursive: true });

  await buildPDF(report, filePath);

  return { filePath, fileName };
}

/** Renderiza o objeto `report` em um arquivo PDF via pdfkit. */
function buildPDF(report, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Cabeçalho da instituição
    doc.fontSize(14).text(
      report.header?.institution?.name ?? "SECRETARIA DE EDUCAÇÃO",
      { align: "center" }
    );
    doc.fontSize(12).text(
      report.header?.institution?.department ?? "AEE — Atendimento Educacional Especializado",
      { align: "center" }
    );
    doc.moveDown();

    // Dados do aluno
    const s = report.header?.student ?? {};
    doc.fontSize(11);
    doc.text(`Aluno: ${s.name ?? "-"}`);
    doc.text(`Idade: ${s.age ?? "-"}`);
    doc.text(`Série: ${s.grade ?? "-"}`);
    doc.text(`Diagnóstico: ${s.diagnosis ?? "-"}`);
    doc.moveDown();

    // Seções do relatório
    for (const section of report.sections ?? []) {
      doc.fontSize(12).text(section.name ?? "", { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).text(section.content ?? "Não informado", { align: "justify" });
      doc.moveDown();
    }

    // Rodapé
    doc.moveDown();
    doc.fontSize(10).text(
      `Gerado automaticamente pelo MAPI em ${new Date().toLocaleDateString("pt-BR")}`,
      { align: "center", color: "gray" }
    );

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}
