# COSMOS Studio — API Registry
<!-- P0-A. Every external API this system calls. NO secret values here — env-var NAMES only. -->
<!-- All keys are served by Infisical at runtime (pauli-secrets-vault pattern). `.env` is a local dev convenience only. -->

| API | Env var(s) | Used for | Called from | Cost model | Fallback |
|---|---|---|---|---|---|
| fal.ai | `FAL_KEY` | Stills: FLUX 1.1 Pro Ultra · Video: Seedance 2.0 / 2.5 / Mini | `shared/fal-client.js`, `stages/03_generate/fal-pipeline.sh` | pay-per-call (dry-run estimate first, mandatory) | Hugging Face |
| Hugging Face | `HF_TOKEN` | FLUX.1-dev image fallback, 3D models, warm video models (CogVideo class) | `shared/hf-client.js`, `stages/03_generate/hf-fallback.sh` | free tier / dedicated endpoints | queue + retry fal.ai |
| Anthropic | `ANTHROPIC_API_KEY` | Fable 5 (plan/review), Sonnet (code), Haiku (QA/translation) | `shared/model-router.js` | per-token | MuAPI (Fable at discount) |
| OpenRouter / LiteLLM | `OPENROUTER_API_KEY` (LiteLLM proxy needs no key of its own) | Model routing layer — no lock-in | `shared/model-router.js` | pass-through | direct provider SDKs |
| Grok | `GROK_API_KEY` | Primary build model (cost-efficient) | `shared/model-router.js` | per-token | Sonnet via Anthropic |
| MuAPI | `MUAPI_KEY` | Fable 5 at 20% discount, Seedance 2.5, Veo 3.1 | `shared/model-router.js` | per-token / per-call | Anthropic direct / fal.ai |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Primary card payments, checkout links, payment webhooks | `shared/payment/stripe.js`, `server/routes` webhook | 2.9% + 30¢ | Creem.io |
| Creem.io | `CREEM_API_KEY` | Stripe alternative, no monthly fee | `shared/payment/stripe.js` (dual handler) | per-transaction | Stripe |
| Lightning (LND REST / Breez) | `LN_MACAROON`, `LN_CERT`, `LN_REST_URL` | Bitcoin Lightning — auto-proceed < $500, Bambu gate ≥ $500 | `shared/payment/lightning.js` | ~free | BTCPay on-chain |
| BTCPay | `BTCPAY_URL`, `BTCPAY_API_KEY` | On-chain Bitcoin fallback | `shared/payment/lightning.js` | self-hosted | manual invoice |
| Infisical | `INFISICAL_TOKEN` | Secrets vault — ALL keys above are fetched through it in prod | process bootstrap (`infisical run`) | free self-host | `.env` (dev only) |
| RunPod | `RUNPOD_API_KEY` | GPU compute for Blender renders — affiliate: `runpod.io/?ref=kupuri` | 3D/Blender workflow | per-GPU-hour | Vast.ai |
| Vast.ai | `VASTAI_API_KEY` | GPU compute fallback — affiliate link in client pitch | 3D/Blender workflow | per-GPU-hour | RunPod |
| ElevenLabs | `ELEVENLABS_API_KEY` | Narration + UGC character voices (market-language voices; Alex™ voice) | ugc-ads.js, faceless-youtube.js | per-character | market default TTS off — HALT |
| n8n | `N8N_WEBHOOK_URL` | Workflow automation + lead nurturing + Bambu notifications | `shared/self-improve.js`, approval gates | self-hosted | direct webhook POST |
| StoryToolkitAI (fork, local) | — (local subprocess) | Documentary AI editing: transcription, timeline, b-roll markers | `stages/04_assemble/workflows/documentary.js` | local compute | manual EDL |

## Internal API (what Hermes calls)

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/brief` | POST | `HERMES_API_KEY` | Start a pipeline job |
| `/api/market/:market_id/brief` | POST | `HERMES_API_KEY` | Market-specific intake |
| `/api/jobs/:id` | GET | `HERMES_API_KEY` | Poll job status |
| `/api/approve` | POST | `PAULI_API_KEY` (**Bambu only — Hermes must never call**) | Approve PRD / delivery / config improvement |
| `/api/metrics` | GET | `HERMES_API_KEY` | Token spend, quality scores, lesson count |
| `/api/webhooks/payment` | POST | Stripe/LN signature verification | Payment events → license-lock update |

## Rules
1. Secret VALUES never appear in code, config, logs, or agent context — env-var names only.
2. Every generation call is preceded by a dry-run cost estimate logged through `stages/03_generate/cost-guard.js`.
3. Hard stops (pauli-effect.md): > $10/task or > $50/day → HALT + notify Bambu.
4. New API additions require a row here plus a security note in `tool-registry.md` before first call.
