import generateLesson from "./workflows/generateLesson.js";
import generateReport, { generateReportPDF } from "./workflows/generateReport.js";
import generatePEI from "./workflows/generatePEI.js";
import assistant from "./workflows/assistant.js";

/**
 * MÓDULO: education
 *
 * Catálogo de skills de educação inclusiva do MAPI.
 *
 * Para adicionar uma nova skill:
 *   1. Crie o arquivo em ./workflows/
 *   2. Importe e registre abaixo
 *   3. Adicione a chave no SKILL_MAP de backend/ai/router.js
 */
export default {
  name: "education",

  workflows: {
    "gerar-aula":      generateLesson,
    "gerar-pei":       generatePEI,
    "gerar-relatorio": generateReport,
    "gerar-pdf":       generateReportPDF,
    "assistente":      assistant,
  },
};
