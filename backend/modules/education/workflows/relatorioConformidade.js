import { supabase } from "../../../services/dbService.js";
import { chat } from "../../../services/aiService.js";
import { currentSemester } from "../../../skills/studentHistory.js";

export default async function relatorioConformidade({ input, context }) {
  const { organizationId } = context;
  const semester = currentSemester();
  const semesterStart = new Date(`${semester.split("-")[0]}-${semester.endsWith("1") ? "01" : "07"}-01`).toISOString();

  const { data: students } = await supabase
    .from("students")
    .select("id, name, grade, diagnosis, age")
    .eq("organization_id", organizationId)
    .not("diagnosis", "is", null)
    .neq("diagnosis", "");

  if (!students?.length) {
    return {
      semester,
      total: 0,
      compliant: 0,
      nonCompliant: 0,
      rate: "N/A",
      students: [],
      summary: "Nenhum aluno com diagnóstico cadastrado nesta organização.",
    };
  }

  const { data: recentPEIs } = await supabase
    .from("reports")
    .select("student_name, created_at")
    .eq("organization_id", organizationId)
    .eq("type", "PEI")
    .gte("created_at", semesterStart);

  const peiByName = new Set(
    (recentPEIs ?? []).map((p) => p.student_name?.toLowerCase().trim())
  );

  const studentStatus = students.map((s) => {
    const hasPEI = peiByName.has(s.name?.toLowerCase().trim());
    const lastPEI = (recentPEIs ?? []).find(
      (p) => p.student_name?.toLowerCase().trim() === s.name?.toLowerCase().trim()
    );
    return {
      name: s.name,
      grade: s.grade,
      diagnosis: s.diagnosis,
      has_pei_this_semester: hasPEI,
      last_pei_date: lastPEI?.created_at ?? null,
      status: hasPEI ? "CONFORME" : "NÃO CONFORME",
    };
  });

  const compliant = studentStatus.filter((s) => s.has_pei_this_semester).length;
  const nonCompliant = studentStatus.length - compliant;
  const rate = ((compliant / studentStatus.length) * 100).toFixed(1);

  const analysis = await chat({
    system: `Você é especialista em educação inclusiva e legislação brasileira (Lei 13.146/2015 — LBI).
Analise o relatório de conformidade abaixo e produza um resumo executivo com:
1. Situação geral de conformidade
2. Riscos jurídicos para a escola (artigos da LBI aplicáveis)
3. Recomendações de ação imediata
Retorne texto puro, sem JSON.`,
    user: `SEMESTRE: ${semester}
TOTAL DE ALUNOS COM DIAGNÓSTICO: ${studentStatus.length}
CONFORMES (com PEI atualizado): ${compliant}
NÃO CONFORMES (sem PEI no semestre): ${nonCompliant}
TAXA DE CONFORMIDADE: ${rate}%

ALUNOS NÃO CONFORMES:
${studentStatus.filter((s) => !s.has_pei_this_semester).map((s) => `- ${s.name} (${s.diagnosis}, ${s.grade})`).join("\n") || "Nenhum"}`,
    temperature: 0.3,
  });

  return {
    semester,
    total: studentStatus.length,
    compliant,
    nonCompliant,
    rate: `${rate}%`,
    students: studentStatus,
    summary: analysis,
    law_reference: "Lei 13.146/2015 — Lei Brasileira de Inclusão (Estatuto da Pessoa com Deficiência)",
  };
}
