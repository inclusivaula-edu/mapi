import generateLesson from "./workflows/generateLesson.js";
import generateReport, { generateReportPDF } from "./workflows/generateReport.js";
import generatePEI from "./workflows/generatePEI.js";
import assistant from "./workflows/assistant.js";
import studentTimeline from "./workflows/studentTimeline.js";
import relatorioConformidade from "./workflows/relatorioConformidade.js";
import relatorioConformidadePDF from "./workflows/relatorioConformidadePDF.js";

export default {
  name: "education",

  workflows: {
    "gerar-aula":                 generateLesson,
    "gerar-pei":                  generatePEI,
    "gerar-relatorio":            generateReport,
    "gerar-pdf":                  generateReportPDF,
    "assistente":                 assistant,
    "historico-aluno":            studentTimeline,
    "relatorio-conformidade":     relatorioConformidade,
    "relatorio-conformidade-pdf": relatorioConformidadePDF,
  },
};
