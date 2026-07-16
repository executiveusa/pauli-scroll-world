# COSMOS Studio

Autonomous AI production studio for Kupuri Media™. One API call → scroll-cinematic websites, UGC ads, anime, documentaries, faceless YouTube — in the client's language, quality-gated, sold as owned software (down payment → 3 monthly payments → the client keeps it forever).

Built on ICM architecture: **the folder structure IS the orchestration.** No framework.

## What's inside

```
_config/        brand/design/market law (Krug, UDEC, emerald tablets, 6 markets)
shared/         model router, fal/HF clients, payments (Stripe+Creem, Lightning, license-lock), self-improve
server/         REST API Hermes calls
stages/01-06    intake → world bible → generate → assemble → quality → package
landing/        the studio's own EN/ES/SR scroll-world marketing site
workflows/demo  4 ready-to-run demo packages
docs/agent-system  tool/API registries, Hermes contract, pricing, ad strategy
.pauli/         context ledger, handoffs, token telemetry
```

## Deploy

```bash
cp .env.example .env      # fill in keys — every one is documented in the file
docker-compose up         # API :3000, landing :8080, weekly self-improve cron
```

No keys yet? Everything still runs: every paid call returns a clearly-labeled stub (`// STUB: replace with live call after .env is configured`), so you can exercise the full pipeline dry.

In production, secrets come from Infisical (`infisical run -- node server/index.js`) — `.env` is a dev convenience only. Never commit it.

## How Hermes calls it

```
POST /api/brief                  start a pipeline (schema: stages/01_intake/brief-schema.json)
GET  /api/jobs/:id               poll status
POST /api/approve                Bambu ONLY (PAULI_API_KEY) — prd | final_delivery | config_improvement
GET  /api/metrics                spend, quality scores, lessons
POST /api/webhooks/payment       Stripe/Creem/LN events → license-lock
```

Full contract + workflow routing table: `docs/agent-system/hermes-AGENTS.md`. Two human gates only: PRD approval and final delivery.

## How to sell it

- Client work: tiers + payment plans in `docs/agent-system/pricing.md`; per-market prices and hooks in `_config/markets/`.
- The pitch is the product: `landing/index.html` is itself a scroll-world (open it — the demo is the page).
- Delivery is black-box until paid off: source ships encrypted, one unlock key per installment, permanent key on the last one (`shared/payment/license-lock.js`). Missed payment = read-only pause, never data loss.
- Ad plan for all six markets: `docs/agent-system/ad-strategy.md`.
- Agencies can buy the whole studio (reseller tier — see pricing doc).

## Quality law

Nothing ships below UDEC 8.5/10 (14 axes, `stages/05_quality/udec-scorer.js`), and every user-facing word passes the Krug audit (`krug-checker.js`). ACC below 7.0 blocks unconditionally. Every run logs a lesson; the Sunday cron proposes config improvements that only Bambu can approve.
