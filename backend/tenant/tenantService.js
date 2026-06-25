import { supabase } from "../services/dbService.js";
import { logger }   from "../observability/logger.js";

/**
 * TENANT SERVICE — resolve organização a partir do user_id
 */
export async function resolvetenant(userId, orgId = null) {
  try {
    // Passo 1: busca o membro
    let memberQuery = supabase
      .from("members")
      .select("role, status, organization_id")
      .eq("user_id", userId)
      .eq("status", "active");

    if (orgId) memberQuery = memberQuery.eq("organization_id", orgId);

    const { data: member, error: memberErr } = await memberQuery.maybeSingle();

    if (memberErr || !member) {
      logger.warn("tenantService: membro não encontrado", { userId, error: memberErr?.message });
      return null;
    }

    // Passo 2: busca a organização separadamente
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("id, name, slug, plan_id, status, max_members, settings")
      .eq("id", member.organization_id)
      .eq("status", "active")
      .single();

    if (orgErr || !org) {
      logger.warn("tenantService: organização não encontrada", { orgId: member.organization_id, error: orgErr?.message });
      return null;
    }

    return {
      org,
      member: {
        role:           member.role,
        status:         member.status,
        organizationId: member.organization_id,
      },
    };

  } catch (err) {
    logger.error("tenantService exception", { detail: err.message });
    return null;
  }
}

export function hasRole(memberRole, requiredRole) {
  const ROLE_HIERARCHY = { admin: 3, teacher: 2, viewer: 1 };
  return (ROLE_HIERARCHY[memberRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

export async function getOrgMembers(organizationId) {
  const { data, error } = await supabase
    .from("members")
    .select("user_id, role, status, created_at")
    .eq("organization_id", organizationId)
    .order("created_at");

  if (error) throw new Error(`getOrgMembers: ${error.message}`);
  return data ?? [];
}

export async function inviteMember({ organizationId, userId, role = "teacher", invitedBy }) {
  const { count } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "active");

  const { data: org } = await supabase
    .from("organizations")
    .select("max_members")
    .eq("id", organizationId)
    .single();

  if (count >= (org?.max_members ?? 10)) {
    throw new Error("MEMBER_LIMIT_REACHED");
  }

  const { error } = await supabase.from("members").insert({
    organization_id: organizationId,
    user_id:         userId,
    role,
    invited_by:      invitedBy,
  });

  if (error) throw new Error(`inviteMember: ${error.message}`);
}

export async function removeMember({ organizationId, userId }) {
  const { error } = await supabase
    .from("members")
    .update({ status: "suspended" })
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  if (error) throw new Error(`removeMember: ${error.message}`);
}
