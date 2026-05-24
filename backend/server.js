import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fs from "fs";

import { supabase } from "./services/dbService.js";
import { billingGuard } from "./billing/billing.guard.js";
import { writeLedger } from "./billing/ledger.engine.js";
import { EVENTS } from "./billing/events/billing.events.js";
import webhookController from "./billing/webhook.controller.js";
import { loadModules } from "./core/moduleLoader.js";
import { runMAPI } from "./core/orchestrator.js";
import { routeTask } from "./ai/router.js";

const app = Fastify({ logger: true, trustProxy: true });

// =============================
// 📦 MÓDULOS
// =============================
const modules = await loadModules();

// =============================
// 🌐 CORS
// =============================
await app.register(cors, {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// =============================
// 🔐 AUTH
// =============================
app.addHook("preHandler", async (req, reply) => {
  const openRoutes = ["/create-subscription", "/webhooks/billing", "/health"];
  if (openRoutes.some((r) => req.url.startsWith(r))) return;

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return reply.code(401).send({ error: "TOKEN_NAO_ENVIADO" });

  const { data } = await supabase.auth.getUser(token);
  if (!data?.user) return reply.code(401).send({ error: "USUARIO_INVALIDO" });

  req.user = data.user;
});

// =============================
// 📊 LEDGER
// =============================
app.addHook("onResponse", async (req) => {
  try {
    if (!req.user) return;
    await writeLedger({
      userId: req.user.id,
      eventType: EVENTS.USAGE_REGISTERED,
      metadata: { endpoint: req.url },
    });
  } catch (err) {
    console.error("LEDGER ERROR:", err.message);
  }
});

// =============================
// 🧠 ROTA PRINCIPAL — MAPI
// =============================
app.post("/ai/run", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { input, context } = req.body || {};

    if (!input) return reply.code(400).send({ error: "MISSING_INPUT" });

    const { moduleName, workflowName } = await routeTask(input);

    const result = await runMAPI({
      moduleName,
      workflowName,
      input,
      modules,
      context: { ...context, userId: req.user.id },
    });

    return reply.send(result);
  } catch (err) {
    console.error(err);
    return reply.code(500).send({ error: "MAPI_ERROR", detail: err.message });
  }
});

// =============================
// 🎓 GERAR AULA (InclusivAula)
// =============================
app.post("/ai/lesson", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { student, topic, chatId, tenantId } = req.body || {};

    if (!student || !topic) {
      return reply.code(400).send({ error: "MISSING_INPUT" });
    }

    const result = await runMAPI({
      moduleName: "education",
      workflowName: "gerar-aula",
      input: topic,
      modules,
      context: {
        student,
        topic,
        userId: req.user.id,
        chatId,
        tenantId,
      },
    });

    return reply.send(result);
  } catch (err) {
    console.error(err);
    return reply.code(500).send({ error: "LESSON_ERROR", detail: err.message });
  }
});

// =============================
// 📄 RELATÓRIO + PDF
// =============================
app.post("/ai/report/pdf", { preHandler: billingGuard }, async (req, reply) => {
  try {
    const { type, student } = req.body || {};

    if (!type || !student?.name) {
      return reply.code(400).send({ error: "INVALID_INPUT" });
    }

    const result = await runMAPI({
      moduleName: "education",
      workflowName: "gerar-pdf",
      input: type,
      modules,
      context: { type, student, userId: req.user.id },
    });

    const { filePath, fileName } = result;

    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="${fileName}"`);

    const stream = fs.createReadStream(filePath);

    // ✅ limpa arquivo após download
    stream.on("close", () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error("PDF CLEANUP ERROR:", err.message);
      });
    });

    return reply.send(stream);
  } catch (err) {
    console.error(err);
    return reply.code(500).send({ error: "PDF_ERROR", detail: err.message });
  }
});

// =============================
// 💳 WEBHOOK BILLING
// =============================
app.post("/webhooks/billing", webhookController);

// =============================
// 🚀 START
// =============================
app.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" }).then(() => {
  console.log(`🔥 MAPI rodando na porta ${process.env.PORT || 3000}`);
});

