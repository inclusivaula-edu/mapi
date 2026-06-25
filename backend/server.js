import { logger } from "./observability/logger.js";
import "dotenv/config";
import Fastify        from "fastify";
import cors           from "@fastify/cors";
import staticFiles    from "@fastify/static";
import helmet         from "@fastify/helmet";
import rateLimit      from "@fastify/rate-limit";
import multipart      from "@fastify/multipart";
import fs             from "fs";
import path           from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── VALIDAÇÕES DE STARTUP ────────────────────────────────────
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY é obrigatório");
}
if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL é obrigatório em produção");
}
if (process.env.NODE_ENV === "production" && !process.env.WEBHOOK_SECRET) {
  throw new Error("WEBHOOK_SECRET é obrigatório em produção");
}

const isDev = process.env.NODE_ENV !== "production";

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

// ── SEGURANÇA: HEADERS HTTP ──────────────────────────────────
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// ── SEGURANÇA: RATE LIMITING ─────────────────────────────────
await app.register(rateLimit, {
  global:      true,
  max:         200,
  timeWindow:  "1 minute",
  keyGenerator: (req) => req.ip,
  errorResponseBuilder: (_req, ctx) => ({
    error:      "RATE_LIMIT_EXCEEDED",
    retryAfter: ctx.after,
  }),
});

// ── CORS ────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:5173")
  .split(",").map((s) => s.trim());

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin
    cb(null, allowedOrigins.includes(origin));
  },
  methods:        ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Organization-Id"],
});

// ── FRONTEND ESTÁTICO ───────────────────────────────────────
const frontendPath = path.join(__dirname, "../frontend");
if (fs.existsSync(frontendPath)) {
  await app.register(staticFiles, {
    root:          frontendPath,
    prefix:        "/",
    decorateReply: false,
  });
  app.setNotFoundHandler((_req, reply) => {
    reply.sendFile("index.html");
  });
  app.log.info({ message: "Frontend estático servido em /" });
}

// ── ROTAS ABERTAS ────────────────────────────────────────────
// AUTH_OPEN: sem JWT obrigatório
const AUTH_OPEN_ROUTES   = ["/webhooks/", "/health", "/auth/login", "/favicon.ico", "/assets/"];
// TENANT_OPEN: JWT obrigatório mas sem tenant resolvido (usuário sem org ainda)
const TENANT_OPEN_ROUTES = [...AUTH_OPEN_ROUTES, "/org/register"];

// ── HOOK 1: AUTH — valida JWT do Supabase ────────────────────
app.addHook("preHandler", async (req, reply) => {
  const isOpenRoute  = AUTH_OPEN_ROUTES.some((r) => req.url.startsWith(r));
  const isStaticFile = /\.(html|css|js|ico|png|jpg|svg|woff|woff2|ttf)(\?.*)?$/.test(req.url);
  const isRootPath   = req.url === "/" || req.url === "";

  if (isOpenRoute || isStaticFile || isRootPath) return;

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return reply.code(401).send({ error: "TOKEN_NAO_ENVIADO" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return reply.code(401).send({ error: "USUARIO_INVALIDO" });

  req.user = data.user;
});

// ── HOOK 2: TENANT — resolve organização pelo JWT ────────────
app.addHook("preHandler", async (req, reply) => {
  if (TENANT_OPEN_ROUTES.some((r) => req.url.startsWith(r))) return;
  if (!req.user) return;
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
app.post("/auth/login", {
  config: { rateLimit: { max: 10, timeWindow: "5 minutes" } },
}, async (req, reply) => {
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
      user: { id: data.user.id, email: data.user.email },
    });
  } catch (err) {
    app.log.error({ route: "/auth/login", err: err.message });
    return reply.code(500).send({ error: "AUTH_ERROR" });
  }
});

// ── HEALTH ──────────────────────────────────────────────────
app.get("/health", async (_req, reply) => {
  const { error: dbErr } = await supabase.from("organizations").select("id").limit(1);
  if (dbErr) {
    return reply.code(503).send({ status: "degraded", db: "unreachable" });
  }
  return reply.send({
    status:    "ok",
    version:   process.env.npm_package_version ?? "6.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── CADASTRO DE ORGANIZAÇÃO ──────────────────────────────────
// Requer JWT (usuário já autenticado no Supabase), mas sem tenant.
app.post("/org/register", {
  config: { rateLimit: { max: 5, timeWindow: "1 hour" } },
}, async (req, reply) => {
  const { orgName } = req.body ?? {};

  if (!orgName?.trim()) {
    return reply.code(400).send({ error: "MISSING_FIELDS", required: ["orgName"] });
  }

  const slug = orgName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (slug.length < 2) {
    return reply.code(400).send({ error: "INVALID_ORG_NAME" });
  }

  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({ name: orgName.trim(), slug, plan_id: "trial" })
    .select().single();

  if (orgErr) {
    const code = orgErr.code === "23505" ? 409 : 500;
    return reply.code(code).send({ error: code === 409 ? "ORG_ALREADY_EXISTS" : "ORG_CREATE_ERROR" });
  }

  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await supabase.from("subscriptions").insert({
    organization_id:      org.id,
    plan_id:              "trial",
    status:               "active",
    current_period_start: new Date().toISOString(),
    current_period_end:   trialEnd.toISOString(),
  });

  // userId vem do JWT verificado, não do body
  await supabase.from("members").insert({
    organization_id: org.id,
    user_id:         req.user.id,
    role:            "admin",
  });

  return reply.code(201).send({ org, trialEndsAt: trialEnd });
});

// ── ROTAS DE ORGANIZAÇÃO ─────────────────────────────────────
registerOrgRoutes(app);
registerDashboardRoutes(app);

// ── HISTÓRICO DO ALUNO ──────────────────────────────────────
import { getStudentHistory, saveStudentSnapshot, currentSemester } from "./skills/studentHistory.js";

app.get("/api/students/:studentId/timeline", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { studentId } = req.params;
    const result = await runMAPI({
      moduleName: "education", workflowName: "historico-aluno",
      input: studentId, modules,
      context: { studentId, userId: req.user.id, organizationId: req.tenant.orgId },
    });
    return reply.send(result);
  } catch (err) {
    app.log.error({ route: "/api/students/:studentId/timeline", err: err.message });
    return reply.code(500).send({ error: "TIMELINE_ERROR", ...(isDev && { detail: err.message }) });
  }
});

app.post("/api/students/:studentId/snapshot", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { studentId } = req.params;
    const { objectives, strategies, evolutionNotes } = req.body ?? {};

    const { data: student } = await supabase
      .from("students").select("*")
      .eq("id", studentId)
      .eq("organization_id", req.tenant.orgId)
      .single();
    if (!student) return reply.code(404).send({ error: "STUDENT_NOT_FOUND" });

    const snapshot = await saveStudentSnapshot({
      studentId,
      orgId: req.tenant.orgId,
      userId: req.user.id,
      student: { name: student.name, age: student.age, grade: student.grade, diagnosis: student.diagnosis },
      objectives,
      strategies,
      evolutionNotes,
    });

    return reply.code(201).send({ snapshot, semester: currentSemester() });
  } catch (err) {
    app.log.error({ route: "/api/students/:studentId/snapshot", err: err.message });
    return reply.code(500).send({ error: "SNAPSHOT_ERROR", ...(isDev && { detail: err.message }) });
  }
});

// ── AI: CONFORMIDADE LBI ─────────────────────────────────────
app.post("/ai/report/conformidade", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const result = await runMAPI({
      moduleName: "education", workflowName: "relatorio-conformidade",
      input: "conformidade", modules,
      context: { userId: req.user.id, organizationId: req.tenant.orgId },
    });
    return reply.send(result);
  } catch (err) {
    app.log.error({ route: "/ai/report/conformidade", err: err.message });
    return reply.code(500).send({ error: "CONFORMIDADE_ERROR", ...(isDev && { detail: err.message }) });
  }
});

app.post("/ai/report/conformidade/pdf", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const result = await runMAPI({
      moduleName: "education", workflowName: "relatorio-conformidade-pdf",
      input: "conformidade", modules,
      context: { userId: req.user.id, organizationId: req.tenant.orgId },
    });
    const { filePath, fileName } = result.response;
    const safeDir = path.resolve("./tmp");
    if (!filePath.startsWith(safeDir)) return reply.code(500).send({ error: "INTERNAL_ERROR" });
    const safeName = path.basename(fileName).replace(/[^\w.\-]/g, "_");
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="${safeName}"`);
    const stream = fs.createReadStream(filePath);
    stream.on("close", () => fs.unlink(filePath, () => {}));
    return reply.send(stream);
  } catch (err) {
    app.log.error({ route: "/ai/report/conformidade/pdf", err: err.message });
    return reply.code(500).send({ error: "CONFORMIDADE_PDF_ERROR", ...(isDev && { detail: err.message }) });
  }
});

// ── AI: ROTEAMENTO SEMÂNTICO ─────────────────────────────────
app.post("/ai/run", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { input } = req.body ?? {};
    if (!input?.trim())      return reply.code(400).send({ error: "MISSING_INPUT" });
    if (input.length > 5000) return reply.code(400).send({ error: "INPUT_TOO_LONG" });

    const { moduleName, workflowName } = await routeTask(input);
    const result = await runMAPI({
      moduleName, workflowName, input, modules,
      context: { userId: req.user.id, organizationId: req.tenant.orgId },
    });
    return reply.send(result);
  } catch (err) {
    app.log.error({ route: "/ai/run", err: err.message });
    return reply.code(500).send({ error: "MAPI_ERROR", ...(isDev && { detail: err.message }) });
  }
});

// ── AI: GERAR AULA ───────────────────────────────────────────
app.post("/ai/lesson", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { student, studentId, topic, chatId } = req.body ?? {};
    if (!topic?.trim())  return reply.code(400).send({ error: "MISSING_INPUT", required: ["topic"] });
    if (!student?.name && !studentId) return reply.code(400).send({ error: "MISSING_INPUT", required: ["student.name or studentId"] });
    if (topic.length > 500) return reply.code(400).send({ error: "TOPIC_TOO_LONG" });

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

    const result = await runMAPI({
      moduleName: "education", workflowName: "gerar-aula",
      input: topic, modules,
      context: { student: resolvedStudent, topic, userId: req.user.id, organizationId: req.tenant.orgId, chatId },
    });
    return reply.send(result);
  } catch (err) {
    app.log.error({ route: "/ai/lesson", err: err.message });
    return reply.code(500).send({ error: "LESSON_ERROR", ...(isDev && { detail: err.message }) });
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
    return reply.code(500).send({ error: "PEI_ERROR", ...(isDev && { detail: err.message }) });
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
    const safeDir = path.resolve("./tmp");
    if (!filePath.startsWith(safeDir)) {
      return reply.code(500).send({ error: "INTERNAL_ERROR" });
    }
    const safeName = path.basename(fileName).replace(/[^\w.\-]/g, "_");
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="${safeName}"`);
    const stream = fs.createReadStream(filePath);
    stream.on("close", () => fs.unlink(filePath, () => {}));
    return reply.send(stream);
  } catch (err) {
    app.log.error({ route: "/ai/report/pdf", err: err.message });
    return reply.code(500).send({ error: "PDF_ERROR", ...(isDev && { detail: err.message }) });
  }
});

// ── AI: JURÍDICO ─────────────────────────────────────────────
app.post("/ai/juridico", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { skill, area, descricao, tipo, partes, questao, fatos,
            pedidos, tipoPeticao, tema, nivelDetalhe, contrato, docTipo } = req.body ?? {};

    if (!skill) {
      return reply.code(400).send({
        error: "MISSING_INPUT", required: ["skill"],
        options: ["analisar-contrato", "gerar-contrato", "gerar-parecer",
                  "gerar-peticao", "resumir-legislacao", "assistente-juridico", "gerar-pdf-juridico"],
      });
    }

    const result = await runMAPI({
      moduleName: "juridico", workflowName: skill,
      input: descricao ?? tema ?? questao ?? fatos ?? "",
      modules,
      context: {
        userId: req.user.id, organizationId: req.tenant.orgId,
        area, tipo, tipoPeticao, descricao, partes,
        questao, fatos, pedidos, tema, nivelDetalhe, contrato, docTipo,
      },
    });

    if (skill === "gerar-pdf-juridico" && result.response?.filePath) {
      const { filePath, fileName } = result.response;
      const safeDir = path.resolve("./tmp");
      if (!filePath.startsWith(safeDir)) {
        return reply.code(500).send({ error: "INTERNAL_ERROR" });
      }
      const safeName = path.basename(fileName).replace(/[^\w.\-]/g, "_");
      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", `attachment; filename="${safeName}"`);
      const stream = fs.createReadStream(filePath);
      stream.on("close", () => fs.unlink(filePath, () => {}));
      return reply.send(stream);
    }

    return reply.send(result);
  } catch (err) {
    app.log.error({ route: "/ai/juridico", err: err.message });
    return reply.code(500).send({ error: "JURIDICO_ERROR", ...(isDev && { detail: err.message }) });
  }
});

// ── AI: LICITAÇÕES ──────────────────────────────────────────
app.post("/ai/licitacao", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const body = req.body ?? {};
    const { skill } = body;
    if (!skill) {
      return reply.code(400).send({ error: "MISSING_INPUT", required: ["skill"] });
    }

    const result = await runMAPI({
      moduleName: "licitacoes", workflowName: skill,
      input: body.descricao ?? body.editalText ?? body.objeto ?? body.input ?? "", modules,
      context: {
        userId: req.user.id, organizationId: req.tenant.orgId,
        ...body,
      },
    });

    if (skill === "gerar-pdf-licitacao" && result.response?.filePath) {
      const { filePath, fileName } = result.response;
      const safeDir = path.resolve("./tmp");
      if (!filePath.startsWith(safeDir)) return reply.code(500).send({ error: "INTERNAL_ERROR" });
      const safeName = path.basename(fileName).replace(/[^\w.\-]/g, "_");
      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", `attachment; filename="${safeName}"`);
      const stream = fs.createReadStream(filePath);
      stream.on("close", () => fs.unlink(filePath, () => {}));
      return reply.send(stream);
    }

    return reply.send(result);
  } catch (err) {
    app.log.error({ route: "/ai/licitacao", err: err.message });
    return reply.code(500).send({ error: "LICITACAO_ERROR", ...(isDev && { detail: err.message }) });
  }
});

// ── LICITAÇÕES: CRUD de projetos ────────────────────────────
app.get("/api/bid-projects", { preHandler: billingGuard }, async (req, reply) => {
  const { data, error } = await supabase
    .from("bid_projects").select("*")
    .eq("organization_id", req.tenant.orgId)
    .order("created_at", { ascending: false });
  if (error) return reply.code(500).send({ error: error.message });
  return reply.send({ projects: data });
});

app.post("/api/bid-projects", { preHandler: billingGuard }, async (req, reply) => {
  const { name, editalNumber, organ, modality, deadline } = req.body ?? {};
  if (!name?.trim()) return reply.code(400).send({ error: "MISSING_FIELD", required: ["name"] });
  const { data, error } = await supabase
    .from("bid_projects")
    .insert({
      organization_id: req.tenant.orgId,
      name, edital_number: editalNumber, organ, modality, deadline,
      created_by: req.user.id,
    })
    .select().single();
  if (error) return reply.code(500).send({ error: error.message });
  return reply.code(201).send({ project: data });
});

// ── EMPRESA: Perfil e Certidões ─────────────────────────────
import { getCompanyProfile, saveCompanyProfile, getCompanyCertidoes, saveCertidao } from "./skills/licitacoes/companyProfile.js";
import { getBidHistory, saveBidHistory, getBidStats } from "./skills/licitacoes/bidHistory.js";

app.get("/api/company-profile", async (req, reply) => {
  const profile = await getCompanyProfile(req.tenant.orgId);
  if (!profile) return reply.code(404).send({ error: "PROFILE_NOT_FOUND" });
  return reply.send({ profile });
});

app.post("/api/company-profile", async (req, reply) => {
  try {
    const profile = await saveCompanyProfile(req.tenant.orgId, req.user.id, req.body ?? {});
    return reply.send({ profile });
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
});

app.get("/api/company-certidoes", async (req, reply) => {
  const certidoes = await getCompanyCertidoes(req.tenant.orgId);
  return reply.send({ certidoes });
});

app.post("/api/company-certidoes", async (req, reply) => {
  try {
    const certidao = await saveCertidao(req.tenant.orgId, req.body ?? {});
    return reply.send({ certidao });
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
});

// ── LICITAÇÕES: Histórico ───────────────────────────────────
app.get("/api/bid-history", async (req, reply) => {
  const history = await getBidHistory(req.tenant.orgId, { limit: 50 });
  return reply.send({ history });
});

app.post("/api/bid-history", async (req, reply) => {
  try {
    const entry = await saveBidHistory(req.tenant.orgId, req.user.id, req.body ?? {});
    return reply.send({ entry });
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
});

app.get("/api/bid-stats", async (req, reply) => {
  const stats = await getBidStats(req.tenant.orgId);
  return reply.send({ stats });
});

// ── AI: LGPD ────────────────────────────────────────────────
app.post("/ai/lgpd", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { skill, descricao, answers, companyInfo, assessmentId, tipo, docTipo } = req.body ?? {};
    if (!skill) {
      return reply.code(400).send({
        error: "MISSING_INPUT", required: ["skill"],
        options: ["diagnostico-lgpd", "gerar-politica-privacidade", "gerar-ropa", "gerar-dpa", "gerar-plano-adequacao", "gerar-ripd", "assistente-lgpd", "gerar-pdf-lgpd"],
      });
    }

    const result = await runMAPI({
      moduleName: "lgpd", workflowName: skill,
      input: descricao ?? "", modules,
      context: {
        userId: req.user.id, organizationId: req.tenant.orgId,
        descricao, answers, companyInfo, assessmentId, tipo, docTipo,
      },
    });

    if (skill === "gerar-pdf-lgpd" && result.response?.filePath) {
      const { filePath, fileName } = result.response;
      const safeDir = path.resolve("./tmp");
      if (!filePath.startsWith(safeDir)) return reply.code(500).send({ error: "INTERNAL_ERROR" });
      const safeName = path.basename(fileName).replace(/[^\w.\-]/g, "_");
      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", `attachment; filename="${safeName}"`);
      const stream = fs.createReadStream(filePath);
      stream.on("close", () => fs.unlink(filePath, () => {}));
      return reply.send(stream);
    }

    return reply.send(result);
  } catch (err) {
    app.log.error({ route: "/ai/lgpd", err: err.message });
    return reply.code(500).send({ error: "LGPD_ERROR", ...(isDev && { detail: err.message }) });
  }
});

// ── PNCP: Busca de editais e preços ────────────────────────
import { searchPNCP, searchPrecosReferencia } from "./skills/licitacoes/searchPNCP.js";

app.get("/api/pncp/editais", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { palavraChave, modalidade, uf, pagina } = req.query;
    if (!palavraChave?.trim()) return reply.code(400).send({ error: "palavraChave é obrigatório" });
    const result = await searchPNCP({ palavraChave, modalidade, uf, pagina: Number(pagina) || 1 });
    return reply.send(result);
  } catch (err) {
    return reply.code(502).send({ error: "Falha ao consultar PNCP: " + err.message });
  }
});

app.get("/api/pncp/precos", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { palavraChave } = req.query;
    if (!palavraChave?.trim()) return reply.code(400).send({ error: "palavraChave é obrigatório" });
    const result = await searchPrecosReferencia({ palavraChave });
    return reply.send(result);
  } catch (err) {
    return reply.code(502).send({ error: "Falha ao consultar preços: " + err.message });
  }
});

// ── UPLOAD EDITAL ───────────────────────────────────────────
import { parseEditalFromBuffer } from "./skills/licitacoes/parseEditalUpload.js";

await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

app.post("/api/upload-edital", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const file = await req.file();
    if (!file) return reply.code(400).send({ error: "Nenhum arquivo enviado" });

    const buffer = await file.toBuffer();
    const result = await parseEditalFromBuffer(buffer, file.mimetype, file.filename);

    return reply.send({
      text: result.text,
      pages: result.pages,
      filename: result.filename,
      method: result.method,
      chars: result.text.length,
    });
  } catch (err) {
    app.log.error({ route: "/api/upload-edital", err: err.message });
    return reply.code(400).send({ error: err.message });
  }
});

// ── WEBHOOK BILLING ──────────────────────────────────────────
app.post("/webhooks/billing", webhookController);

// ── START + GRACEFUL SHUTDOWN ────────────────────────────────
const PORT = process.env.PORT ?? 3000;
app.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  app.log.info(`MAPI v6.0 (B2B) rodando na porta ${PORT}`);
});

const shutdown = async (signal) => {
  app.log.info(`${signal} recebido — iniciando graceful shutdown`);
  await app.close();
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
