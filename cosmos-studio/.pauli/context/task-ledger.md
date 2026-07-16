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

## Phase 2 — Stage contracts ✅
facts:
  - All six CONTEXT.md contracts follow the ICM Inputs/Process/Outputs format; 01 and 06 carry explicit HALT gates (Bambu approval).
  - E2E stub-mode chain verified: scene-planner (5 beats, Krug limits enforced at generation) → style-preamble (one locked sentence) → fal-pipeline --draft (stub testsrc renders) → --extract-frames (seam lock) → --encode (GOP8 + mobile GOP4) → proposal-es.md (Spanish, MXN) → delivery-package.zip (encrypted source + preview + auditable decrypt.js) → client-side decrypt roundtrip OK.
  - cost-guard verified: $15 estimate → exit 2 (task gate); ledger-based daily accounting.
  - krug-checker + udec-scorer runnable; both PASS on stage tree; ffmpeg + zip installed in container (already in Dockerfile).
decisions:
  - CPY axis of UDEC is driven directly by krug-checker findings (single source of copy truth).
  - udec-scorer is the heuristic half; model review pass scores same axes, LOWER governs (documented in udec-axes.md).
  - Stub video = ffmpeg testsrc2 so downstream (frames/encode/assembly) exercises real files, not empty placeholders.
changed: stages/01_intake/{CONTEXT.md,prd-template.md}, stages/02_world_bible/{CONTEXT.md,scene-planner.js,style-preamble.js}, stages/03_generate/{CONTEXT.md,fal-pipeline.sh,hf-fallback.sh,cost-guard.js}, stages/04_assemble/CONTEXT.md, stages/05_quality/{CONTEXT.md,krug-checker.js,udec-scorer.js}, stages/06_package/{CONTEXT.md,proposal-generator.js,license-packager.js}
tests: full stub-mode pipeline run stages 02→03→06 + decrypt roundtrip + both quality gates PASS
risks: udec-scorer heuristics are conservative; model review pass (not runnable offline) is the second half of the gate by design
next: Phase 3 — five workflow sub-pipelines under stages/04_assemble/workflows/
