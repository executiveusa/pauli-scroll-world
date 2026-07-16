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

## Phase 3 — Workflow sub-pipelines ✅
facts:
  - scroll-cinematic.js REUSES the pauli-scroll-world scrub engine (inlined into the deliverable page) — engine untouched; Krug audit runs on copy BEFORE wiring (fails the assembly, not the quality stage). Deliverable scored UDEC 9.79 with gates PASS.
  - ugc-ads: 4 formats × 2 hook styles (authority/story) = 8 variants, market character defaults parsed from market config, generate_audio true, cost-gated up front. Stub run produced 8 labeled .stub.json manifests.
  - anime-dag.yaml: CPM DAG with parallel waves; route fields are ROUTER TASK TYPES (never model names); cross-model continuity = extract last frame → histogram match → i2v seed.
  - documentary.js: StoryToolkitAI fork subprocess (STORYTOOLKIT_DIR), stub transcription when fork absent; EDL + concat cut verified with real ffmpeg footage.
  - faceless-youtube.js: full chain verified in stub mode — script → silent narration stub → testsrc visuals → captions/tags → thumbnail → main-video.mp4 + 60s 9:16 short.mp4.
decisions:
  - Missing connectors are nulls in the engine config (engine crossfades) — graceful degradation over pipeline failure.
  - Stub media are real encodable files (testsrc/anullsrc), so ffmpeg assembly paths run for real in dev.
changed: stages/04_assemble/workflows/{scroll-cinematic.js,ugc-ads.js,anime-dag.yaml,documentary.js,faceless-youtube.js}
tests: all 4 runnable workflows executed stub-mode end-to-end; scroll-cinematic deliverable passed KRUG + UDEC (9.79)
risks: anime DAG needs a Forge-film runner in prod; documentary needs the StoryToolkitAI fork cloned to vendor/
next: Phase 4 — landing/index.html (EN/ES/SR single file, scroll-world demo built in)

## Phase 4 — Landing page ✅
facts:
  - Single file, EN/ES/SR toggle inline (locales/*.json mirror the inline dicts); scroll-world demo mounts on load with 5 SVG-diorama scenes (zero video weight); total page 20KB + 32KB engine → well under 3s mobile.
  - Film frame counter ticks with scroll (frame + scene number, per-locale label); hero split h1 "The scroll is the camera." + sub keeps Krug's 9-word headline law while preserving the mandated copy.
  - Gates: KRUG PASS, UDEC 9.86 (all axes ≥ 9). Browser-verified in Chromium: mount, SR/ES toggle (lang attr updates), pricing tiers per locale, frame counter, form → /api/brief with offline fallback, mobile 390px view. Two defects found and fixed via screenshots: white-on-light top CTA (dark-theme token flip), engine end-copy bleeding over pricing (ground z-index + past-world fade).
decisions:
  - Demo scenes are inline SVG stills (engine still-mode with cross-dissolve) instead of video clips — the real clips get dropped in post-generation; keeps the revenue page instant-loading.
  - Form market mapping: sr→serbia-balkans, es→mexico, en→us-en (client can override in conversation).
changed: landing/{index.html,scrub-engine.js(vendored copy),locales/{en,es,sr}.json}
tests: KRUG+UDEC gates, Playwright render tests (desktop, mobile, i18n, form)
risks: none blocking
next: Phase 5 — four pre-built demo packages

## Phase 5 — Demo packages ✅
facts:
  - Four self-contained demos under workflows/demo/: anime (Yappyverse Foxies Casino 2056, DAG params + scene-list + locked preamble), ugc (Café Cometa bilingual ES/EN, 4×2 matrix — verified: run produced 8 stub variants), documentary (Isla Adentro Puerto Rico, ES primary, footage drop-in + shooting prompt), faceless-youtube (Plain Signal tech explainer, episode 1 pre-filled).
  - Every demo: world-bible.md + brief.json + placeholder SVG stills (labeled "replaced by stage 03") + README with exact run command; all runnable without keys.
decisions:
  - krug-checker fix: markdown H1 scan now excludes fenced code blocks (bash "# comment" false positive found while gating demo READMEs).
changed: workflows/demo/** (16 files + stills), stages/05_quality/krug-checker.js (code-fence fix)
tests: ugc-ads demo executed (8 stub variants); KRUG+UDEC PASS on demo tree and re-PASS on landing
risks: none blocking
next: Phase 6 — ad strategy for 6 markets
