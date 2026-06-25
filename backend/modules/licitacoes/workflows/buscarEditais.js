import { searchPNCP } from "../../../skills/licitacoes/searchPNCP.js";

export default async function buscarEditais({ input, context }) {
  const palavraChave = context.palavraChave ?? input;
  if (!palavraChave) throw new Error("MISSING_CONTEXT: palavraChave é obrigatório");

  return searchPNCP({
    palavraChave,
    modalidade: context.modalidade,
    uf: context.uf,
    pagina: context.pagina ?? 1,
  });
}
