# Handoff — COSMOS Studio v1.0 build

```yaml
objective: COSMOS Studio v1.0 — autonomous AI production studio
status: complete
criteria: FABLE_BUILD_PROMPT.md completion checklist — verified by script (70 files present/non-empty, no inline secrets) + KRUG/UDEC gates green on every phase output
facts:
  - model_router: routeModel() across muapi/anthropic/openrouter/grok/fal/hf — error failover, budget downgrade, quality upgrade; dry-run route (with missing keyEnv named) when unconfigured
  - payment: Stripe + Creem dual, Lightning (<$500 auto, ≥$500 Bambu gate), BTCPay fallback; license-lock = HMAC rotating keys + AES-256-GCM zip, 7-day grace → read-only, never deletes
  - markets: 6 configured (us-en, puerto-rico, mexico, spain, serbia-balkans) + 2 TBD slots with activation checklist
  - workflows: 5 production pipelines (scroll-cinematic reuses skills/scroll-world engine) + 4 pre-built demos, all runnable without keys via labeled stubs
  - hermes_api: POST /api/brief → poll GET /api/jobs/:id → webhook → Bambu approves via POST /api/approve (PAULI_API_KEY — Hermes structurally excluded)
  - landing: single-file EN/ES/SR scroll-world, 52KB total, UDEC 9.86, Playwright-verified desktop+mobile
decisions:
  - Studio rooted at cosmos-studio/ inside pauli-scroll-world; scrub engine reused, never rebuilt
  - Stubs are real encodable media (ffmpeg testsrc/anullsrc) so assembly paths execute for real in dev
  - udec heuristic + model review dual-scoring, lower governs; CPY axis driven by krug-checker
  - One commit per phase on claude/fable-build-seven-phases-2ci7dd; local cosmos/phase-N branch markers (remote push restricted to designated branch by session policy)
changed_files: cosmos-studio/** (~90 files across 8 phase commits)
tests: live server smoke (6 routes), license encrypt/decrypt + client-side decryptor roundtrip, stub-mode e2e stages 02→06, 4 workflow runs, Playwright landing tests, cost-guard gate exits, self-improve proposal run, checklist script
risks:
  - Stripe/Creem/LND/fal/HF/ElevenLabs calls schema-correct but never hit live endpoints (no keys by design) — first live run should be a $1 test job
  - anime DAG needs a Forge-film runner; documentary needs the StoryToolkitAI fork cloned (STORYTOOLKIT_DIR)
  - fal PRICES table must be reconciled against the first real invoice (cost_spike lesson otherwise)
next_action: cp .env.example .env && fill keys → docker-compose up → point Hermes at POST /api/brief (contract: docs/agent-system/hermes-AGENTS.md)
symbols: routeModel (shared/model-router.js) | enforce/recordPayment/encryptZip (shared/payment/license-lock.js) | mountScrollWorld (landing/scrub-engine.js) | score (stages/05_quality/udec-scorer.js) | check/record (stages/03_generate/cost-guard.js)
```
