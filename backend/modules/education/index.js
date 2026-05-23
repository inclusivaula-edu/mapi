import generateLesson from "./workflows/generateLesson.js";
import generateReport, { generateReportPDF } from "./workflows/generateReport.js";
import assistant from "./workflows/assistant.js";

export default {
  name: "education",

  workflows: {
    "gerar-aula":       generateLesson,
    "gerar-relatorio":  generateReport,
    "gerar-pdf":        generateReportPDF,
    "assistente":       assistant,
  },
};
