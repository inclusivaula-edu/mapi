import { searchPrecosReferencia } from "../../../skills/licitacoes/searchPNCP.js";

export default async function pesquisarPrecos({ input, context }) {
  const palavraChave = context.palavraChave ?? input;
  if (!palavraChave) throw new Error("MISSING_CONTEXT: palavraChave é obrigatório");

  return searchPrecosReferencia({ palavraChave });
}
