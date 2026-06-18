# MAPI v6 — Multi-Agent Platform for Inclusive Education & Legal Assistance

Plataforma SaaS B2B com IA multi-agente para educação inclusiva e assistência jurídica.

---

## Estrutura do projeto

```
mapi/
├── backend/               ← API Fastify (Node.js 22+)
│   ├── server.js          ← entrada única
│   ├── config/plans.js    ← planos B2B (fonte única)
│   ├── services/          ← Supabase + OpenAI (instâncias únicas)
│   ├── tenant/            ← multi-tenant: resolve org pelo JWT
│   ├── billing/           ← engine, guard, ledger, webhook
│   ├── ai/router.js       ← classifica intenção → módulo/workflow
│   ├── core/              ← orchestrator, moduleLoader, memory, RAG
│   ├── agents/            ← TeacherAgent, ReviewerAgent, PEIOrchestrator
│   │   └── juridico/      ← JuridicoAgent, ContratoOrchestrator
│   ├── skills/            ← searchBNCC, searchDiagnosis, validateOutput...
│   │   └── juridico/      ← searchLegislacao, searchJurisprudencia...
│   ├── modules/
│   │   ├── education/     ← aula, PEI, relatório, PDF, assistente
│   │   └── juridico/      ← contrato, parecer, petição, legislação, PDF
│   ├── observability/     ← logger, tracer, metrics
│   ├── routes/            ← org.routes, dashboard.routes
│   └── harness/           ← lessonHarness, juridicoHarness
│
├── frontend/
│   └── index.html         ← SPA completo (sem build, sem dependências)
│
├── supabase/
│   ├── migration_multitenant.sql  ← schema completo com RLS
│   └── seeds/
│       ├── bncc_codes.sql         ← 40+ códigos BNCC reais
│       └── diagnosis_strategies.sql ← 8 diagnósticos com estratégias
│
└── legal/
    ├── TERMOS_DE_USO.md
    └── POLITICA_DE_PRIVACIDADE.md
```

---

## Implantação — passo a passo

### 1. Pré-requisito
```bash
node --version   # deve ser >= 22
```

### 2. Instalar dependências
```bash
cd backend
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite .env com suas chaves do Supabase e OpenAI
```

### 4. Rodar migrations no Supabase
No painel do Supabase → SQL Editor:
1. Cole e execute `supabase/migration_multitenant.sql`
2. Cole e execute `supabase/seeds/bncc_codes.sql`
3. Cole e execute `supabase/seeds/diagnosis_strategies.sql`

### 5. Subir o servidor
```bash
npm run dev      # desenvolvimento
npm start        # produção
```

### 6. Acessar
- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:3000/health
- **Dashboard**: http://localhost:3000/admin/dashboard (requer JWT admin)

### 7. Criar primeira organização
```bash
curl -X POST http://localhost:3000/org/register \
  -H "Content-Type: application/json" \
  -d '{ "orgName": "Escola Teste", "userId": "UUID_DO_USUARIO_NO_SUPABASE" }'
```

### 8. Rodar harness antes de cada deploy
```bash
npm run harness:all
```

---

## Rotas da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/health` | ❌ | Health check |
| POST | `/auth/login` | ❌ | Login (proxy Supabase) |
| POST | `/org/register` | ❌ | Cadastro de escola (trial) |
| GET | `/org/me` | ✅ | Perfil da organização |
| GET | `/org/members` | ✅ | Listar professores |
| POST | `/org/members` | ✅ admin | Convidar professor |
| DELETE | `/org/members/:id` | ✅ admin | Remover professor |
| GET | `/org/students` | ✅ | Listar alunos |
| POST | `/org/students` | ✅ | Cadastrar aluno |
| GET | `/org/usage` | ✅ | Uso do mês |
| GET | `/org/lessons` | ✅ | Histórico de aulas |
| POST | `/ai/run` | ✅ | Roteamento semântico |
| POST | `/ai/lesson` | ✅ | Gerar aula inclusiva |
| POST | `/ai/pei` | ✅ | Gerar PEI completo |
| POST | `/ai/report/pdf` | ✅ | Relatório AEE em PDF |
| POST | `/ai/juridico` | ✅ | Todas as skills jurídicas |
| GET | `/admin/dashboard` | ✅ admin | Dashboard HTML |
| GET | `/admin/metrics` | ✅ admin | Métricas JSON |
| GET | `/admin/orgs` | 🔑 secret | Todos os clientes |
| POST | `/webhooks/billing` | ❌ | Webhook pagamento |

---

## Planos B2B

| Plano | Preço/mês | Requests | Membros |
|-------|-----------|----------|---------|
| Trial | Grátis | 100 | 3 |
| Starter | R$ 199,90 | 2.000 | 10 |
| Professional | R$ 499,90 | 10.000 | 50 |
| Enterprise | Negociado | Ilimitado | Ilimitado |

---

## Scripts disponíveis

```bash
npm start              # produção
npm run dev            # desenvolvimento (hot reload)
npm run harness        # testa módulo education
npm run harness:bail   # para no primeiro erro
npm run harness:juridico      # testa módulo jurídico
npm run harness:juridico:bail
npm run harness:all    # testa tudo
```

---

## Tecnologias

- **Runtime**: Node.js 22 (ESModules)
- **HTTP**: Fastify 5
- **Banco**: Supabase (PostgreSQL + pgvector + Auth)
- **IA**: OpenAI API (gpt-4o-mini, text-embedding-3-small)
- **PDF**: pdfkit
- **Frontend**: HTML/CSS/JS vanilla (sem build, sem frameworks)

---

*MAPI v6.0 — Junho 2026*
