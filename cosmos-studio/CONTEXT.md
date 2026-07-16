# COSMOS STUDIO — Layer 1 Workspace Router

## Current task for Fable
**BUILD THE ENTIRE COSMOS STUDIO SYSTEM FROM SCRATCH.**
Execute all 6 stages in sequence. Human gates: after stage 01 (PRD approval) and after stage 06 (final delivery approval). All other stages run autonomously.

## Stage routing
| Stage | Trigger | Input | Output |
|---|---|---|---|
| 01_intake | new project brief | brief (text/API) | PRD + client approval request |
| 02_world_bible | PRD approved | PRD | style preamble + scene list + world bible |
| 03_generate | world bible approved | world bible | stills (FLUX) + video clips (Seedance 2.0) |
| 04_assemble | all clips rendered | clips + world bible | scroll site OR production video |
| 05_quality | assembly complete | deliverable | UDEC score + Krug audit + pass/fail |
| 06_package | quality gate passed | deliverable | payment-locked ZIP + proposal + unlock key |

## Production workflows (each is a sub-pipeline under stages 02-06)
- `workflow/scroll-cinematic` — Awwwards scroll-world landing pages
- `workflow/ugc-ads` — UGC character ads (4 formats: podcast/ugc/lifestyle/greenscreen)
- `workflow/anime` — Forge-film DAG → multi-model anime episode pipeline
- `workflow/documentary` — StoryToolkitAI fork → real + AI footage documentary
- `workflow/faceless-youtube` — Faceless YouTube channel + Shorts automation

## Shared resources (Layer 3 — stable across all runs)
- `shared/model-router.js` — LiteLLM/OpenRouter smart model switcher
- `shared/fal-client.js` — fal.ai pay-per-call client (FAL_KEY from Infisical)
- `shared/hf-client.js` — Hugging Face fallback client (HF_TOKEN from Infisical)
- `shared/payment/stripe.js` — Stripe + Creem.io handler
- `shared/payment/lightning.js` — Lightning Network (under $500 auto, over $500 gate)
- `shared/license-lock.js` — payment-progress enforcer (black-box until paid off)
- `shared/self-improve.js` — reads lessons.jsonl, proposes _config updates

## Market config (Layer 3)
See `_config/markets/` — one file per market with locale, currency, pricing tier,
UGC character voice/appearance defaults, ad copy language, and affiliate compute links.
Markets: us-en, puerto-rico, mexico, spain, serbia-balkans, + 2 TBD slots.

## API registry (complete — every API this system calls)
See `docs/agent-system/api-registry.md`

## Hermes integration point
Hermes calls `POST /api/brief` to start a pipeline.
Hermes polls `GET /api/jobs/:id` for status.
Hermes receives webhook on `ready_for_review`.
Hermes cannot approve — that requires Bambu.
See `docs/agent-system/hermes-AGENTS.md` for Hermes' updated operating contract.

## Read next
→ stages/01_intake/CONTEXT.md (start here for a new project)
OR
→ stages/[N]/CONTEXT.md (continue from a specific stage)
