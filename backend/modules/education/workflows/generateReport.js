import { generateReport as genReport } from "../../../src/ai/report.engine.js";
import { generatePDF } from "../../../src/ai/pdf.engine.js";
import { getMemory } from "../../../src/ai/memory.engine.js";
import { supabase } from "../../../services/dbService.js";
import fs from "fs";
import path from "path";

export default async function generateReport({ input, context }) {
  const { student, type, userId } = context;

  if (!student || !type) {
    throw new Error("MISSING_CONTEXT: student e type são obrigatórios");
  }

  // 🧠 Memória do usuário
  const memories = await getMemory(userId);
  const memoryText = memories.map((m) => JSON.stringify(m.memory)).join("\n");

  // 📚 Últimas aulas
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("user_id", userId)
    .limit(10);

  const bncc = lessons?.[0]?.bncc_code || "";

  // 🤖 Gera relatório
  const report = await genReport({
    type,
    student,
    lessons: lessons || [],
    bncc,
    memory: memoryText,
  });

  if (!report) throw new Error("REPORT_FAILED");

  return report;
}

export async function generateReportPDF({ input, context }) {
  const report = await generateReport({ input, context });

  const fileName = `relatorio_${Date.now()}.pdf`;
  const filePath = path.resolve(`./tmp/${fileName}`);

  fs.mkdirSync("./tmp", { recursive: true });

  await generatePDF(report, filePath);

  return { filePath, fileName };
}
