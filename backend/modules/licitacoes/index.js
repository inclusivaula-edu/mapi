import parseEdital         from "./workflows/parseEdital.js";
import gerarProposta       from "./workflows/gerarProposta.js";
import gerarMemorial       from "./workflows/gerarMemorial.js";
import gerarPlanilha       from "./workflows/gerarPlanilha.js";
import gerarDeclaracao     from "./workflows/gerarDeclaracao.js";
import assistenteLicitacao from "./workflows/assistenteLicitacao.js";
import gerarPDFLicitacao   from "./workflows/gerarPDFLicitacao.js";
import gerarETP            from "./workflows/gerarETP.js";
import gerarTR             from "./workflows/gerarTR.js";
import checklistSICAF      from "./workflows/checklistSICAF.js";
import gerarARP            from "./workflows/gerarARP.js";
import gerarMinutaContrato from "./workflows/gerarMinutaContrato.js";
import buscarEditais       from "./workflows/buscarEditais.js";
import pesquisarPrecos     from "./workflows/pesquisarPrecos.js";

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
    "gerar-etp":              gerarETP,
    "gerar-tr":               gerarTR,
    "checklist-sicaf":        checklistSICAF,
    "gerar-arp":              gerarARP,
    "gerar-minuta-contrato":  gerarMinutaContrato,
    "buscar-editais":         buscarEditais,
    "pesquisar-precos":       pesquisarPrecos,
  },
};
