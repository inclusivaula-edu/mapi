import { requireRole } from "../tenant/tenantHook.js";
import {
  getOrgMembers,
  inviteMember,
  removeMember,
} from "../tenant/tenantService.js";
import { supabase } from "../services/dbService.js";

/**
 * ROTAS DE ORGANIZAÇÃO
 *
 * Registra rotas do painel admin da escola.
 * Todas exigem autenticação + tenant resolvido.
 *
 * Uso no server.js:
 *   import { registerOrgRoutes } from "./routes/org.routes.js";
 *   registerOrgRoutes(app);
 */
export function registerOrgRoutes(app) {

  // ── GET /org/me — perfil da organização atual ──────────────
  app.get("/org/me", async (req, reply) => {
    return reply.send({
      org:     req.tenant.org,
      role:    req.tenant.role,
      billing: req.billing ?? null,
    });
  });

  // ── GET /org/members — lista membros (admin ou teacher) ────
  app.get("/org/members", async (req, reply) => {
    try {
      const members = await getOrgMembers(req.tenant.orgId);
      return reply.send({ members });
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // ── POST /org/members — convida membro (só admin) ──────────
  app.post("/org/members", { preHandler: requireRole("admin") }, async (req, reply) => {
    const { userId, role = "teacher" } = req.body ?? {};

    if (!userId) {
      return reply.code(400).send({ error: "MISSING_FIELD", required: ["userId"] });
    }

    try {
      await inviteMember({
        organizationId: req.tenant.orgId,
        userId,
        role,
        invitedBy: req.user.id,
      });
      return reply.code(201).send({ ok: true });
    } catch (err) {
      const code = err.message === "MEMBER_LIMIT_REACHED" ? 403 : 500;
      return reply.code(code).send({ error: err.message });
    }
  });

  // ── DELETE /org/members/:userId — remove membro (só admin) ─
  app.delete("/org/members/:userId", { preHandler: requireRole("admin") }, async (req, reply) => {
    const { userId } = req.params;

    // Impede que admin remova a si mesmo
    if (userId === req.user.id) {
      return reply.code(400).send({ error: "CANNOT_REMOVE_SELF" });
    }

    try {
      await removeMember({ organizationId: req.tenant.orgId, userId });
      return reply.send({ ok: true });
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // ── GET /org/students — alunos da escola ───────────────────
  app.get("/org/students", async (req, reply) => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("organization_id", req.tenant.orgId)
      .order("name");

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ students: data });
  });

  // ── POST /org/students — cadastra aluno ────────────────────
  app.post("/org/students", async (req, reply) => {
    const { name, age, grade, diagnosis, notes } = req.body ?? {};

    if (!name?.trim()) {
      return reply.code(400).send({ error: "MISSING_FIELD", required: ["name"] });
    }

    const { data, error } = await supabase
      .from("students")
      .insert({
        organization_id: req.tenant.orgId,
        name,
        age,
        grade,
        diagnosis,
        notes,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return reply.code(201).send({ student: data });
  });

  // ── GET /org/usage — consumo da organização no mês ─────────
  app.get("/org/usage", async (req, reply) => {
    const start = new Date();
    start.setDate(1); start.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("usage_logs")
      .select("user_id, tokens_used, model, endpoint, created_at")
      .eq("organization_id", req.tenant.orgId)
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) return reply.code(500).send({ error: error.message });

    // Agrega por usuário
    const byUser = {};
    let totalTokens = 0;
    for (const row of data ?? []) {
      byUser[row.user_id] = (byUser[row.user_id] ?? 0) + 1;
      totalTokens += row.tokens_used ?? 0;
    }

    return reply.send({
      period:       start.toISOString().slice(0, 7),
      totalRequests: data?.length ?? 0,
      totalTokens,
      byUser,
      billing:      req.billing ?? null,
    });
  });

  // ── GET /org/lessons — histórico de aulas da escola ────────
  app.get("/org/lessons", async (req, reply) => {
    const { studentId, limit = 50 } = req.query ?? {};

    let query = supabase
      .from("lessons")
      .select("id, topic, bncc_code, student_id, user_id, created_at")
      .eq("organization_id", req.tenant.orgId)
      .order("created_at", { ascending: false })
      .limit(Number(limit));

    if (studentId) query = query.eq("student_id", studentId);

    const { data, error } = await query;
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ lessons: data });
  });
}
