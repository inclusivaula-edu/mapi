# MAPI Backend v2.0

API multi-agente para educação inclusiva.

## Estrutura canônica

```
backend/
├── server.js                        ← entrada única da aplicação
├── config/
│   └── plans.js                     ← FONTE ÚNICA dos planos e limites
├── services/
│   ├── dbService.js                 ← cliente Supabase único
│   └── aiService.js                 ← wrapper OpenAI único
├── billing/
│   ├── billing.engine.js            ← isAllowed() — verificação de uso
│   ├── billing.guard.js             ← preHandler do Fastify
│   ├── ledger.engine.js             ← writeLedger() + logUsage()
│   ├── subscriptions.service.js     ← activate / suspend / cancel
│   ├── webhook.controller.js        ← Mercado Pago / Stripe
│   └── events/billing.events.js     ← constantes de eventos
├── ai/
│   └── router.js                    ← classifica intenção → { moduleName, workflowName }
├── core/
│   ├── orchestrator.js              ← runMAPI() — delega para módulo/workflow
│   ├── moduleLoader.js              ← carrega /modules/* dinamicamente
│   ├── memory/memoryBuilder.js      ← histórico + resumo + RAG
│   └── rag/ragService.js            ← busca e salva documentos vetoriais
└── modules/
    └── education/
        ├── index.js                 ← registra as skills do módulo
        └── workflows/
            ├── generateLesson.js    ← skill: gerar-aula
            ├── generateReport.js    ← skill: gerar-relatorio + gerar-pdf
            └── assistant.js         ← skill: assistente

```

## Como adicionar um novo módulo

1. Crie a pasta `modules/seu-modulo/`
2. Crie `index.js` com `export default { name, workflows: { "skill-nome": fn } }`
3. Adicione a chave no `SKILL_MAP` de `ai/router.js`
4. Pronto — o `moduleLoader` detecta e carrega automaticamente no boot

## Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check (aberta) |
| POST | `/ai/run` | Roteamento semântico automático |
| POST | `/ai/lesson` | Gerar aula inclusiva |
| POST | `/ai/report/pdf` | Gerar relatório PDF (ANAMNESE/PEI/PAEE) |
| POST | `/webhooks/billing` | Webhook de pagamento (aberta) |

## Tabelas esperadas no Supabase

| Tabela | Colunas principais |
|--------|-------------------|
| `subscriptions` | user_id, plan_id, status |
| `usage_logs` | user_id, tokens_used, model, created_at |
| `ledger` | user_id, event_type, metadata, created_at |
| `lessons` | user_id, topic, bncc_code, content, created_at |
| `messages` | chat_id, role, content, created_at |
| `memory_summaries` | chat_id, tenant_id, summary, updated_at |
| `documents` | content, embedding, tenant_id, chat_id |

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores.

## Executar

```bash
npm install
npm run dev   # desenvolvimento (hot reload)
npm start     # produção
```
