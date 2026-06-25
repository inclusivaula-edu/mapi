import { checklistSICAF } from "../../../skills/licitacoes/checklistSICAF.js";

export default async function checklistSICAFWorkflow({ input, context }) {
  const { objeto, tipoEmpresa, modalidade } = context;

  const result = await checklistSICAF({
    objeto:     objeto ?? input ?? "",
    tipoEmpresa: tipoEmpresa ?? "geral",
    modalidade:  modalidade  ?? "pregao-eletronico",
  });

  return {
    titulo: "Checklist de Habilitação — SICAF",
    tipo: "checklist-sicaf",
    ...result,
    instrucoes: [
      "Acesse o SICAF em: https://www.comprasgovernamentais.gov.br/index.php/sicaf",
      "Verifique seu nível de cadastramento (mínimo Nível II para pregão federal)",
      "Documentos com prazo 'emitir no dia' devem ser baixados no dia da sessão",
      "Regularidade fiscal pode ser comprovada via SICAF para MEs/EPPs mesmo com pendências (LC 123/2006 Art. 43)",
      "Acesse o Painel de Preços em: https://paineldeprecos.planejamento.gov.br",
    ],
    disclaimer: "Este checklist é orientativo. Verifique sempre as exigências específicas do edital.",
  };
}
