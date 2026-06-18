import { logger } from "./observability/logger.js";
import "dotenv/config";
import Fastify        from "fastify";
import cors           from "@fastify/cors";
import staticFiles    from "@fastify/static";
import fs             from "fs";
import path           from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { supabase }           from "./services/dbService.js";
import { billingGuard }       from "./billing/billing.guard.js";
import { writeLedger }        from "./billing/ledger.engine.js";
import { EVENTS }             from "./billing/events/billing.events.js";
import webhookController      from "./billing/webhook.controller.js";
import { loadModules }        from "./core/moduleLoader.js";
import { runMAPI }            from "./core/orchestrator.js";
import { routeTask }          from "./ai/router.js";
import { tenantHook }         from "./tenant/tenantHook.js";
import { registerOrgRoutes }       from "./routes/org.routes.js";
import { registerDashboardRoutes } from "./routes/dashboard.routes.js";

const app = Fastify({ logger: true, trustProxy: true });

// ── BOOT ────────────────────────────────────────────────────
const modules = await loadModules();

// ── CORS ────────────────────────────────────────────────────
await app.register(cors, {
  origin:         process.env.FRONTEND_URL || "http://localhost:5173",
  methods:        ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Organization-Id"],
});

// ── FRONTEND ESTÁTICO ───────────────────────────────────────
// Serve o index.html do frontend a partir de ../frontend
const frontendPath = path.join(__dirname, "../frontend");
if (fs.existsSync(frontendPath)) {
  await app.register(staticFiles, {
    root:       frontendPath,
    prefix:     "/",
    decorateReply: false,
  });
  app.setNotFoundHandler((_req, reply) => {
    reply.sendFile("index.html");
  });
  app.log.info({ message: "Frontend estático servido em /" });
}

// ── ROTAS ABERTAS (sem auth) ─────────────────────────────────
const OPEN_ROUTES = ["/webhooks/", "/health", "/org/register", "/auth/login", "/favicon.ico", "/assets/"];

// ── HOOK 1: AUTH — valida JWT do Supabase ────────────────────
app.addHook("preHandler", async (req, reply) => {
  // Libera rotas abertas e arquivos estáticos (html, css, js, ico, png, etc.)
  const isOpenRoute = OPEN_ROUTES.some((r) => req.url.startsWith(r));
  const isStaticFile = /\.(html|css|js|ico|png|jpg|svg|woff|woff2|ttf)(\?.*)?$/.test(req.url);
  const isRootPath = req.url === "/" || req.url === "";

  if (isOpenRoute || isStaticFile || isRootPath) return;

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return reply.code(401).send({ error: "TOKEN_NAO_ENVIADO" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return reply.code(401).send({ error: "USUARIO_INVALIDO" });

  req.user = data.user;
});

// ── HOOK 2: TENANT — resolve organização pelo JWT ────────────
// Roda depois do auth. Injeta req.tenant com org, orgId, role, isAdmin.
// tenantId NUNCA vem do body — sempre resolvido aqui.
app.addHook("preHandler", async (req, reply) => {
  if (OPEN_ROUTES.some((r) => req.url.startsWith(r))) return;
  if (!req.user) return; // auth já rejeitou
  await tenantHook(req, reply);
});

// ── HOOK 3: LEDGER — registra uso após resposta ──────────────
app.addHook("onResponse", async (req) => {
  if (!req.user || !req.tenant?.orgId) return;
  writeLedger({
    organizationId: req.tenant.orgId,
    userId:         req.user.id,
    eventType:      EVENTS.USAGE_REGISTERED,
    metadata:       { endpoint: req.url, method: req.method },
  }).catch((e) => logger.error(e.message));
});

// ── AUTH: LOGIN ─────────────────────────────────────────────
// Proxy para o Supabase Auth — o frontend chama /auth/login
// e recebe o JWT sem precisar expor a URL do Supabase
app.post("/auth/login", async (req, reply) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return reply.code(400).send({ error: "MISSING_CREDENTIALS" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data?.session) {
      return reply.code(401).send({ error: "INVALID_CREDENTIALS" });
    }

    return reply.send({
      access_token: data.session.access_token,
      user: {
        id:    data.user.id,
        email: data.user.email,
      },
    });
  } catch (err) {
    app.log.error({ route: "/auth/login", err: err.message });
    return reply.code(500).send({ error: "AUTH_ERROR" });
  }
});

// ── HEALTH ──────────────────────────────────────────────────
app.get("/health", async (_req, reply) =>
  reply.send({ status: "ok", version: "3.0.0", timestamp: new Date().toISOString() })
);

// ── CADASTRO DE ORGANIZAÇÃO (onboarding da escola) ───────────
// Rota aberta — cria org + primeiro admin + subscription trial
app.post("/org/register", async (req, reply) => {
  const { orgName, userId } = req.body ?? {};

  if (!orgName?.trim() || !userId) {
    return reply.code(400).send({ error: "MISSING_FIELDS", required: ["orgName", "userId"] });
  }

  const slug = orgName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // Cria organização
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({ name: orgName, slug, plan_id: "trial" })
    .select().single();

  if (orgErr) {
    const code = orgErr.code === "23505" ? 409 : 500; // 23505 = unique violation
    return reply.code(code).send({ error: orgErr.message });
  }

  // Cria subscription trial
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  await supabase.from("subscriptions").insert({
    organization_id:      org.id,
    plan_id:              "trial",
    status:               "active",
    current_period_start: new Date().toISOString(),
    current_period_end:   trialEnd.toISOString(),
  });

  // Cria o primeiro membro como admin
  await supabase.from("members").insert({
    organization_id: org.id,
    user_id:         userId,
    role:            "admin",
  });

  return reply.code(201).send({ org, trialEndsAt: trialEnd });
});

// ── ROTAS DE ORGANIZAÇÃO (painel admin) ──────────────────────
registerOrgRoutes(app);
registerDashboardRoutes(app);

// ── AI: ROTEAMENTO SEMÂNTICO ─────────────────────────────────
app.post("/ai/run", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { input } = req.body ?? {};

    if (!input?.trim())        return reply.code(400).send({ error: "MISSING_INPUT" });
    if (input.length > 5000)   return reply.code(400).send({ error: "INPUT_TOO_LONG" });

    const { moduleName, workflowName } = await routeTask(input);
    const result = await runMAPI({
      moduleName, workflowName, input, modules,
      context: {
        userId:         req.user.id,
        organizationId: req.tenant.orgId,
      },
    });

    return reply.send(result);
  } catch (err) {
    app.log.error({ route: "/ai/run", err: err.message });
    return reply.code(500).send({ error: "MAPI_ERROR", detail: err.message });
  }
});

// ── AI: GERAR AULA ───────────────────────────────────────────
app.post("/ai/lesson", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { student, studentId, topic, chatId } = req.body ?? {};

    if (!topic?.trim())  return reply.code(400).send({ error: "MISSING_INPUT", required: ["topic"] });
    if (!student?.name && !studentId) return reply.code(400).send({ error: "MISSING_INPUT", required: ["student.name or studentId"] });
    if (topic.length > 500) return reply.code(400).send({ error: "TOPIC_TOO_LONG" });

    // Se veio studentId, busca o perfil do aluno da organização
    let resolvedStudent = student;
    if (studentId) {
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .eq("organization_id", req.tenant.orgId)  // garante que o aluno pertence à org
        .single();

      if (!data) return reply.code(404).send({ error: "STUDENT_NOT_FOUND" });
      resolvedStudent = data;
    }

    const result = await runMAPI({
      moduleName: "education", workflowName: "gerar-aula",
      input: topic, modules,
      context: {
        student:        resolvedStudent,
        topic,
        userId:         req.user.id,
        organizationId: req.tenant.orgId,
        chatId,
      },
    });

    return reply.send(result);
  } catch (err) {
    app.log.error({ route: "/ai/lesson", err: err.message });
    return reply.code(500).send({ error: "LESSON_ERROR", detail: err.message });
  }
});

// ── AI: PEI ──────────────────────────────────────────────────
app.post("/ai/pei", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { student, studentId } = req.body ?? {};

    let resolvedStudent = student;
    if (studentId) {
      const { data } = await supabase
        .from("students").select("*")
        .eq("id", studentId)
        .eq("organization_id", req.tenant.orgId)
        .single();
      if (!data) return reply.code(404).send({ error: "STUDENT_NOT_FOUND" });
      resolvedStudent = data;
    }

    if (!resolvedStudent?.name || !resolvedStudent?.diagnosis) {
      return reply.code(400).send({ error: "MISSING_INPUT", required: ["student.name", "student.diagnosis"] });
    }

    const result = await runMAPI({
      moduleName: "education", workflowName: "gerar-pei",
      input: resolvedStudent.name, modules,
      context: { student: resolvedStudent, userId: req.user.id, organizationId: req.tenant.orgId },
    });

    return reply.send(result);
  } catch (err) {
    app.log.error({ route: "/ai/pei", err: err.message });
    return reply.code(500).send({ error: "PEI_ERROR", detail: err.message });
  }
});

// ── AI: RELATÓRIO PDF ────────────────────────────────────────
app.post("/ai/report/pdf", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { type, student, studentId } = req.body ?? {};

    if (!type) return reply.code(400).send({ error: "MISSING_INPUT", required: ["type"] });

    let resolvedStudent = student;
    if (studentId) {
      const { data } = await supabase
        .from("students").select("*")
        .eq("id", studentId)
        .eq("organization_id", req.tenant.orgId)
        .single();
      if (!data) return reply.code(404).send({ error: "STUDENT_NOT_FOUND" });
      resolvedStudent = data;
    }

    if (!resolvedStudent?.name) {
      return reply.code(400).send({ error: "MISSING_INPUT", required: ["student.name or studentId"] });
    }

    const result = await runMAPI({
      moduleName: "education", workflowName: "gerar-pdf",
      input: type, modules,
      context: { type, student: resolvedStudent, userId: req.user.id, organizationId: req.tenant.orgId },
    });

    const { filePath, fileName } = result.response;
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="${fileName}"`);

    const stream = fs.createReadStream(filePath);
    stream.on("close", () => fs.unlink(filePath, () => {}));
    return reply.send(stream);
  } catch (err) {
    app.log.error({ route: "/ai/report/pdf", err: err.message });
    return reply.code(500).send({ error: "PDF_ERROR", detail: err.message });
  }
});

// ── AI: JURÍDICO ─────────────────────────────────────────────
//
//    Rota unificada para todas as skills do módulo jurídico.
//    O tipo de documento vem em context.tipo / context.docTipo.
// ─────────────────────────────────────────────────────────────
app.post("/ai/juridico", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { skill, area, descricao, tipo, partes, questao, fatos,
            pedidos, tipoPeticao, tema, nivelDetalhe, contrato,
            docTipo } = req.body ?? {};

    if (!skill) {
      return reply.code(400).send({
        error: "MISSING_INPUT",
        required: ["skill"],
        options: [
          "analisar-contrato", "gerar-contrato", "gerar-parecer",
          "gerar-peticao", "resumir-legislacao", "assistente-juridico",
          "gerar-pdf-juridico",
        ],
      });
    }

    const result = await runMAPI({
      moduleName:   "juridico",
      workflowName: skill,
      input:        descricao ?? tema ?? questao ?? fatos ?? "",
      modules,
      context: {
        userId:         req.user.id,
        organizationId: req.tenant.orgId,
        area, tipo, tipoPeticao, descricao, partes,
        questao, fatos, pedidos, tema, nivelDetalhe,
        contrato, docTipo,
      },
    });

    // Se for PDF, serve como download
    if (skill === "gerar-pdf-juridico" && result.response?.filePath) {
      const { filePath, fileName } = result.response;
      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", `attachment; filename="${fileName}"`);
      const stream = fs.createReadStream(filePath);
      stream.on("close", () => fs.unlink(filePath, () => {}));
      return reply.send(stream);
    }

    return reply.send(result);
  } catch (err) {
    app.log.error({ route: "/ai/juridico", err: err.message });
    return reply.code(500).send({ error: "JURIDICO_ERROR", detail: err.message });
  }
});

// ── WEBHOOK BILLING ──────────────────────────────────────────
app.post("/webhooks/billing", webhookController);

// ── START ────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3000;
app.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  app.log.info(`🔥 MAPI v3.0 (B2B) rodando na porta ${PORT}`);
});
