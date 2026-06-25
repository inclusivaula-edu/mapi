import diagnosticoLGPD from "./workflows/diagnosticoLGPD.js";
import gerarPoliticaPrivacidade from "./workflows/gerarPoliticaPrivacidade.js";
import gerarROPA from "./workflows/gerarROPA.js";
import gerarDPA from "./workflows/gerarDPA.js";
import gerarPlanoAdequacao from "./workflows/gerarPlanoAdequacao.js";
import gerarRIPD from "./workflows/gerarRIPD.js";
import assistenteLGPD from "./workflows/assistenteLGPD.js";
import gerarPDFLGPD from "./workflows/gerarPDFLGPD.js";

export default {
  name: "lgpd",

  workflows: {
    "diagnostico-lgpd":           diagnosticoLGPD,
    "gerar-politica-privacidade": gerarPoliticaPrivacidade,
    "gerar-ropa":                 gerarROPA,
    "gerar-dpa":                  gerarDPA,
    "gerar-plano-adequacao":      gerarPlanoAdequacao,
    "gerar-ripd":                 gerarRIPD,
    "assistente-lgpd":            assistenteLGPD,
    "gerar-pdf-lgpd":             gerarPDFLGPD,
  },
};
