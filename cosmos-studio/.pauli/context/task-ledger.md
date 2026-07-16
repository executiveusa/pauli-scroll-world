# Task Ledger — COSMOS Studio v1.0 Build

objective: Build the complete COSMOS Studio autonomous AI production studio (7 phases) per FABLE_BUILD_PROMPT.md
criteria: completion checklist in FABLE_BUILD_PROMPT.md — all files exist and non-empty, quality gates ≥ 8.5, no secrets in code
files: cosmos-studio/** (new), skills/scroll-world/** (reused, read-only)
symbols: mountScrollWorld (skills/scroll-world/references/scrub-engine.js), routeModel (shared/model-router.js, phase 1)

## Phase 0 — Foundation ✅
facts:
  - jCodeMunch available via uvx; repo indexed at pre-flight. ast-grep MCP not installed; ripgrep fallback registered.
  - Sandcastle not installed in this environment; session's isolated ephemeral container is the sandbox — recorded in tool-registry.md.
  - Existing repo asset reused: skills/scroll-world (scrub-engine.js 448 lines, SKILL.md pipeline docs).
decisions:
  - Studio lives under cosmos-studio/ at repo root (matches the zip's own root layout); repo root README untouched, studio README at cosmos-studio/README.md.
  - Added tbd-slot-2.md (CONTEXT.md promises 2 TBD slots; architecture map showed only slot 1).
  - MXN/RSD pricing set to round local figures anchored to the USD-equivalents in FABLE_BUILD_PROMPT Phase 4.
  - One commit per phase on the designated branch claude/fable-build-seven-phases-2ci7dd; local branch markers cosmos/phase-N tag each phase (remote push restricted to the designated branch by session policy).
changed: docs/agent-system/{tool-registry,api-registry,hermes-AGENTS,pauli-effect-full}.md, _config/{krug-laws,udec-axes,emerald-tablets}.md, _config/lessons.jsonl, _config/markets/*.md (7), copied Layer 0-2 files
tests: n/a (docs phase) — quality gate scripts arrive in Phase 2; retroactive gate run scheduled at Phase 7 verification
risks: none blocking
next: Phase 1 — shared/ infrastructure + server API + .env.example + docker-compose

## Phase 1 — Core infrastructure ✅
facts:
  - routeModel() covers 7 tiers / 3+ providers with error-failover, budget downgrade, quality upgrade; dry-run route returned (with missing keyEnv named) when no keys configured.
  - All paid calls stub cleanly without keys, marked "// STUB: replace with live call after .env is configured".
  - license-lock: HMAC-derived rotating keys (no key material on disk), AES-256-GCM zip encryption verified round-trip, 7-day grace → read-only (never deletes data).
  - Server verified live: /healthz, POST /api/brief (validates against brief-schema.json, names missing fields), market forcing, workflow keyword routing, /api/jobs/:id, /api/approve state transitions, /api/metrics.
  - self-improve verified: 4 synthetic lessons → 2 targeted proposals; never auto-applies; n8n notify stubs without key.
decisions:
  - brief-schema.json written in this phase (server boot dependency) though architecture lists it under stage 01.
  - /api/approve auth = PAULI_API_KEY; Hermes structurally excluded (holds HERMES_API_KEY only). Missing keys in dev → route allowed but response tagged x-cosmos-auth: stub.
  - Payment webhook is the only raw-body route (signature over raw bytes); Stripe + Creem HMAC verification with timingSafeEqual.
changed: shared/{model-router,fal-client,hf-client,job-store,self-improve}.js, shared/payment/{stripe,lightning,license-lock}.js, server/{index.js,package.json,routes/*}, stages/01_intake/brief-schema.json, .env.example, Dockerfile, docker-compose.yml, .gitignore
tests: router unit checks, license encrypt/decrypt roundtrip, live server smoke (6 routes), self-improve run with synthetic lessons — all passed
risks: Stripe/Creem/LND calls are schema-correct but unexercised against live APIs (no keys by design); reconcile PRICES vs invoices after first live month
next: Phase 2 — six stage CONTEXT.md contracts + stage scripts (incl. quality gate tooling)
