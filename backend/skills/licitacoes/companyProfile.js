import { supabase } from "../../services/dbService.js";
import { logger } from "../../observability/logger.js";

/**
 * getCompanyProfile — busca perfil da empresa da organização
 */
export async function getCompanyProfile(orgId) {
  if (!orgId) return null;
  const { data, error } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("organization_id", orgId)
    .single();
  if (error) {
    logger.warn("company_profile.not_found", { orgId });
    return null;
  }
  return data;
}

/**
 * saveCompanyProfile — cria ou atualiza perfil da empresa
 */
export async function saveCompanyProfile(orgId, userId, profile) {
  const existing = await getCompanyProfile(orgId);

  if (existing) {
    const { data, error } = await supabase
      .from("company_profiles")
      .update({ ...profile, updated_at: new Date().toISOString() })
      .eq("organization_id", orgId)
      .select()
      .single();
    if (error) throw new Error(`company_profile.update.error: ${error.message}`);
    return data;
  }

  const { data, error } = await supabase
    .from("company_profiles")
    .insert({ ...profile, organization_id: orgId, created_by: userId })
    .select()
    .single();
  if (error) throw new Error(`company_profile.insert.error: ${error.message}`);
  return data;
}

/**
 * getCompanyCertidoes — lista certidões com status de validade
 */
export async function getCompanyCertidoes(orgId) {
  const { data, error } = await supabase
    .from("company_certidoes")
    .select("*")
    .eq("organization_id", orgId)
    .order("data_validade", { ascending: true });
  if (error) return [];

  const today = new Date().toISOString().split("T")[0];
  return (data ?? []).map(c => ({
    ...c,
    status: c.data_validade && c.data_validade < today ? "vencida" : c.status,
  }));
}

/**
 * saveCertidao — adiciona ou atualiza certidão
 */
export async function saveCertidao(orgId, certidao) {
  const { data, error } = await supabase
    .from("company_certidoes")
    .insert({ ...certidao, organization_id: orgId })
    .select()
    .single();
  if (error) throw new Error(`certidao.save.error: ${error.message}`);
  return data;
}

/**
 * injectCompanyContext — monta string de contexto para injetar nos prompts do agente
 */
export function injectCompanyContext(profile) {
  if (!profile) return "";
  return `
DADOS DA EMPRESA (use estes dados para preencher automaticamente todos os documentos):
- Razão Social: ${profile.razao_social}
- Nome Fantasia: ${profile.nome_fantasia ?? "—"}
- CNPJ: ${profile.cnpj}
- Inscrição Estadual: ${profile.inscricao_estadual ?? "—"}
- Endereço: ${profile.endereco ?? "—"}, ${profile.cidade ?? "—"}/${profile.uf ?? "—"} — CEP ${profile.cep ?? "—"}
- Representante Legal: ${profile.representante_nome ?? "—"} — ${profile.representante_cargo ?? "—"} — CPF ${profile.representante_cpf ?? "—"} — RG ${profile.representante_rg ?? "—"}
- Telefone: ${profile.telefone ?? "—"} | E-mail: ${profile.email ?? "—"}
- Porte: ${profile.porte ?? "geral"} | CNAE: ${profile.cnae_principal ?? "—"} | Ramo: ${profile.ramo_atividade ?? "—"}
${profile.atestados_capacidade?.length ? `- Atestados: ${profile.atestados_capacidade.map(a => a.descricao ?? a).join("; ")}` : ""}
${profile.certificacoes?.length ? `- Certificações: ${profile.certificacoes.join(", ")}` : ""}
${profile.equipe_tecnica?.length ? `- Equipe técnica: ${profile.equipe_tecnica.map(e => `${e.nome} (${e.cargo})`).join(", ")}` : ""}
${profile.banco ? `- Dados bancários: ${profile.banco} — Ag ${profile.agencia} — CC ${profile.conta}` : ""}`.trim();
}
