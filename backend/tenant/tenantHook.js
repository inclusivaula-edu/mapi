import { resolvetenant } from "./tenantService.js";

/**
 * TENANT HOOK — Fastify preHandler
 *
 * Resolve e injeta req.tenant após a autenticação.
 * Deve ser registrado DEPOIS do hook de auth.
 *
 * Injeta em req:
 *   req.tenant.org         — organização completa
 *   req.tenant.orgId       — atalho para o ID (usado em todo lugar)
 *   req.tenant.role        — papel do usuário nesta org
 *   req.tenant.isAdmin     — atalho booleano
 *
 * Suporta multi-org via header opcional X-Organization-Id.
 * Sem o header, usa a primeira organização ativa do usuário.
 */
export async function tenantHook(req, reply) {
  if (!req.user) return; // auth hook já rejeitou — não precisa tratar aqui

  // Header opcional para usuários em múltiplas organizações
  const requestedOrgId = req.headers["x-organization-id"] ?? null;

  const resolved = await resolvetenant(req.user.id, requestedOrgId);

  if (!resolved) {
    return reply.code(403).send({
      error: "NO_ORGANIZATION",
      message: "Usuário não pertence a nenhuma organização ativa. Contate o administrador da escola.",
    });
  }

  req.tenant = {
    org:     resolved.org,
    orgId:   resolved.org.id,
    role:    resolved.member.role,
    isAdmin: resolved.member.role === "admin",
  };
}

/**
 * Guard de papel mínimo — factory que retorna um preHandler.
 *
 * Uso: { preHandler: [billingGuard, requireRole("admin")] }
 */
export function requireRole(role) {
  return async function roleGuard(req, reply) {
    const hierarchy = { admin: 3, teacher: 2, viewer: 1 };
    const userLevel = hierarchy[req.tenant?.role] ?? 0;
    const required  = hierarchy[role] ?? 0;

    if (userLevel < required) {
      return reply.code(403).send({
        error: "INSUFFICIENT_ROLE",
        required: role,
        current: req.tenant?.role ?? "none",
      });
    }
  };
}
