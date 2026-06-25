import { timingSafeEqual } from "crypto";
import { getSnapshot } from "../observability/metrics.js";
import { supabase }    from "../services/dbService.js";
import { requireRole } from "../tenant/tenantHook.js";

const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * DASHBOARD ROUTES
 *
 * /admin/dashboard  — HTML visual (abre no browser)
 * /admin/metrics    — JSON raw (para integrar com Grafana, etc.)
 * /admin/orgs       — resumo de todas as organizações (super-admin)
 *
 * Protegido: requer role "admin" na organização.
 * Super-admin (/admin/orgs): requer ADMIN_SECRET no header.
 */
export function registerDashboardRoutes(app) {

  // ── GET /admin/metrics — JSON para ferramentas externas ────
  app.get("/admin/metrics", { preHandler: requireRole("admin") }, async (req, reply) => {
    return reply.send(getSnapshot());
  });

  // ── GET /admin/org-stats — stats da org do usuário ─────────
  app.get("/admin/org-stats", { preHandler: requireRole("admin") }, async (req, reply) => {
    const orgId = req.tenant.orgId;
    const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);

    const [membersRes, studentsRes, lessonsRes, usageRes, tracesRes] = await Promise.all([
      supabase.from("members").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "active"),
      supabase.from("students").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
      supabase.from("lessons").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
      supabase.from("usage_logs").select("tokens_used").eq("organization_id", orgId).gte("created_at", start.toISOString()),
      supabase.from("traces").select("workflow, duration_ms, quality_score, error").eq("organization_id", orgId).gte("created_at", start.toISOString()).order("created_at", { ascending: false }).limit(200),
    ]);

    const usage    = usageRes.data ?? [];
    const traces   = tracesRes.data ?? [];
    const tokens   = usage.reduce((s, r) => s + (r.tokens_used ?? 0), 0);
    const errors   = traces.filter((t) => t.error).length;
    const scores   = traces.filter((t) => t.quality_score != null).map((t) => t.quality_score);
    const avgScore = scores.length ? (scores.reduce((a,b) => a+b,0) / scores.length).toFixed(1) : null;
    const avgLat   = traces.length ? Math.round(traces.reduce((a,b) => a + (b.duration_ms ?? 0), 0) / traces.length) : 0;

    return reply.send({
      org:            req.tenant.org,
      period:         start.toISOString().slice(0, 7),
      members:        membersRes.count ?? 0,
      students:       studentsRes.count ?? 0,
      lessons:        lessonsRes.count ?? 0,
      requests:       traces.length,
      errors,
      errorRate:      traces.length ? ((errors / traces.length) * 100).toFixed(1) + "%" : "0%",
      tokensUsed:     tokens,
      avgQualityScore: avgScore,
      avgLatencyMs:   avgLat,
      billing:        req.billing,
    });
  });

  // ── GET /admin/dashboard — HTML visual ─────────────────────
  app.get("/admin/dashboard", { preHandler: requireRole("admin") }, async (req, reply) => {
    const orgId = req.tenant.orgId;
    const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);

    const [membersRes, studentsRes, lessonsRes, usageRes, tracesRes] = await Promise.all([
      supabase.from("members").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "active"),
      supabase.from("students").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
      supabase.from("lessons").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
      supabase.from("usage_logs").select("tokens_used").eq("organization_id", orgId).gte("created_at", start.toISOString()),
      supabase.from("traces").select("workflow, duration_ms, quality_score, error, created_at").eq("organization_id", orgId).gte("created_at", start.toISOString()).order("created_at", { ascending: false }).limit(100),
    ]);

    const traces   = tracesRes.data ?? [];
    const tokens   = (usageRes.data ?? []).reduce((s, r) => s + (r.tokens_used ?? 0), 0);
    const errors   = traces.filter((t) => t.error).length;
    const scores   = traces.filter((t) => t.quality_score != null).map((t) => t.quality_score);
    const avgScore = scores.length ? (scores.reduce((a,b) => a+b,0) / scores.length).toFixed(1) : "—";
    const avgLat   = traces.length ? Math.round(traces.reduce((a,b) => a + (b.duration_ms ?? 0), 0) / traces.length) : 0;
    const plan     = req.billing ?? {};

    const workflowCounts = {};
    for (const t of traces) {
      workflowCounts[t.workflow] = (workflowCounts[t.workflow] ?? 0) + 1;
    }
    const workflowRows = Object.entries(workflowCounts)
      .map(([wf, count]) => `<tr><td>${escapeHtml(wf)}</td><td>${count}</td></tr>`).join("");

    const recentRows = traces.slice(0, 15).map((t) => `
      <tr class="${t.error ? "err" : ""}">
        <td>${new Date(t.created_at).toLocaleTimeString("pt-BR")}</td>
        <td>${escapeHtml(t.workflow)}</td>
        <td>${Number.isFinite(t.duration_ms) ? t.duration_ms + "ms" : "—"}</td>
        <td>${t.quality_score ?? "—"}</td>
        <td>${t.error ? "&#10060; " + escapeHtml(t.error.slice(0, 40)) : "&#9989;"}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MAPI Dashboard — ${req.tenant.org.name}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    header { background: #1e293b; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
    header h1 { font-size: 1.1rem; font-weight: 600; color: #f1f5f9; }
    header span { font-size: 0.8rem; color: #64748b; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; padding: 1.5rem 2rem 0; }
    .card { background: #1e293b; border-radius: 10px; padding: 1.25rem; border: 1px solid #334155; }
    .card .label { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .5rem; }
    .card .value { font-size: 2rem; font-weight: 700; color: #f1f5f9; line-height: 1; }
    .card .sub   { font-size: 0.75rem; color: #94a3b8; margin-top: .35rem; }
    .card.green .value { color: #4ade80; }
    .card.amber .value { color: #fbbf24; }
    .card.red   .value { color: #f87171; }
    .card.blue  .value { color: #60a5fa; }
    section { margin: 1.5rem 2rem; }
    section h2 { font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .75rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    th, td { text-align: left; padding: .55rem .75rem; border-bottom: 1px solid #1e293b; }
    th { color: #64748b; font-weight: 500; background: #1e293b; }
    tr:hover td { background: #1e293b44; }
    tr.err td { color: #f87171; }
    .badge { display: inline-block; padding: .15rem .5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
    .badge.active { background: #14532d; color: #4ade80; }
    .badge.trial  { background: #1c3552; color: #60a5fa; }
    footer { padding: 1.5rem 2rem; color: #334155; font-size: 0.72rem; }
    @media (max-width: 600px) { .grid { grid-template-columns: 1fr 1fr; } header { flex-direction: column; gap: .5rem; } }
  </style>
</head>
<body>
<header>
  <h1>📊 MAPI — ${req.tenant.org.name}</h1>
  <span>
    Plano: <strong>${plan.planId ?? "—"}</strong>
    &nbsp;|&nbsp; Uso: <strong>${plan.usage ?? 0} / ${plan.plan?.maxRequests === Infinity ? "∞" : (plan.plan?.maxRequests ?? "—")}</strong> req
    &nbsp;|&nbsp; ${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
    &nbsp;|&nbsp; <a href="/admin/metrics" style="color:#60a5fa">JSON</a>
  </span>
</header>

<div class="grid">
  <div class="card blue">
    <div class="label">Professores</div>
    <div class="value">${membersRes.count ?? 0}</div>
    <div class="sub">membros ativos</div>
  </div>
  <div class="card blue">
    <div class="label">Alunos</div>
    <div class="value">${studentsRes.count ?? 0}</div>
    <div class="sub">cadastrados</div>
  </div>
  <div class="card blue">
    <div class="label">Aulas geradas</div>
    <div class="value">${lessonsRes.count ?? 0}</div>
    <div class="sub">total acumulado</div>
  </div>
  <div class="card ${errors === 0 ? "green" : errors < 5 ? "amber" : "red"}">
    <div class="label">Erros no mês</div>
    <div class="value">${errors}</div>
    <div class="sub">${traces.length} requisições</div>
  </div>
  <div class="card ${Number(avgScore) >= 8 ? "green" : Number(avgScore) >= 6 ? "amber" : "red"}">
    <div class="label">Score médio</div>
    <div class="value">${avgScore}</div>
    <div class="sub">qualidade pedagógica /10</div>
  </div>
  <div class="card ${avgLat < 8000 ? "green" : avgLat < 15000 ? "amber" : "red"}">
    <div class="label">Latência média</div>
    <div class="value">${avgLat < 1000 ? avgLat + "ms" : (avgLat/1000).toFixed(1) + "s"}</div>
    <div class="sub">por requisição de IA</div>
  </div>
  <div class="card">
    <div class="label">Tokens usados</div>
    <div class="value">${(tokens / 1000).toFixed(1)}k</div>
    <div class="sub">no período atual</div>
  </div>
  <div class="card ${plan.planId === "trial" ? "amber" : "green"}">
    <div class="label">Plano</div>
    <div class="value" style="font-size:1.2rem">${plan.planId ?? "—"}</div>
    <div class="sub"><span class="badge ${plan.planId === "trial" ? "trial" : "active"}">${plan.status ?? "active"}</span></div>
  </div>
</div>

<section>
  <h2>Uso por skill (mês atual)</h2>
  <table>
    <thead><tr><th>Workflow</th><th>Requisições</th></tr></thead>
    <tbody>${workflowRows || "<tr><td colspan='2' style='color:#475569'>Nenhuma atividade ainda</td></tr>"}</tbody>
  </table>
</section>

<section>
  <h2>Últimas requisições</h2>
  <table>
    <thead><tr><th>Hora</th><th>Workflow</th><th>Latência</th><th>Score</th><th>Status</th></tr></thead>
    <tbody>${recentRows || "<tr><td colspan='5' style='color:#475569'>Nenhuma requisição ainda</td></tr>"}</tbody>
  </table>
</section>

<footer>MAPI v4.0 B2B &nbsp;·&nbsp; Atualizado em ${new Date().toLocaleString("pt-BR")} &nbsp;·&nbsp; <a href="/health" style="color:#334155">health</a></footer>

<script>
  // Auto-refresh a cada 60 segundos
  setTimeout(() => location.reload(), 60_000);
</script>
</body>
</html>`;

    return reply.type("text/html").send(html);
  });

  // ── GET /admin/orgs — visão geral de todos os clientes (super-admin) ──
  app.get("/admin/orgs", async (req, reply) => {
    const given  = Buffer.from(req.headers["x-admin-secret"] ?? "");
    const stored = Buffer.from(process.env.ADMIN_SECRET ?? "");
    const valid  =
      given.length > 0 &&
      given.length === stored.length &&
      timingSafeEqual(given, stored);
    if (!valid) {
      return reply.code(403).send({ error: "FORBIDDEN" });
    }

    const { data: orgs } = await supabase
      .from("organizations")
      .select(`
        id, name, slug, plan_id, status, created_at,
        subscriptions ( status, current_period_end ),
        members ( count )
      `)
      .order("created_at", { ascending: false });

    return reply.send({ orgs: orgs ?? [] });
  });
}
