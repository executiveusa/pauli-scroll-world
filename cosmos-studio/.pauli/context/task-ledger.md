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
