import parseEdital from "./workflows/parseEdital.js";
import gerarProposta from "./workflows/gerarProposta.js";
import gerarMemorial from "./workflows/gerarMemorial.js";
import gerarPlanilha from "./workflows/gerarPlanilha.js";
import gerarDeclaracao from "./workflows/gerarDeclaracao.js";
import assistenteLicitacao from "./workflows/assistenteLicitacao.js";
import gerarPDFLicitacao from "./workflows/gerarPDFLicitacao.js";

export default {
  name: "licitacoes",

  workflows: {
    "parse-edital":           parseEdital,
    "gerar-proposta":         gerarProposta,
    "gerar-memorial":         gerarMemorial,
    "gerar-planilha":         gerarPlanilha,
    "gerar-declaracao":       gerarDeclaracao,
    "assistente-licitacao":   assistenteLicitacao,
    "gerar-pdf-licitacao":    gerarPDFLicitacao,
  },
};
