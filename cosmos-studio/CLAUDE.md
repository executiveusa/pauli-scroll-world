# COSMOS STUDIO — Layer 0 Global Identity
# ICM Workspace v1.0 | Read this file FIRST and ONCE

## What this workspace is
COSMOS Studio is the master AI production studio for Kupuri Media™.
One API call → Hollywood-quality videos, websites, UGC ads, anime, documentaries.
Sells as owned software (down payment → monthly → own it forever). No subscription lock-in.
Six markets: US-English, Puerto Rico (USD), Mexico, Spain, Serbia/Balkans, + 2 TBD.
Built on ICM architecture — folder structure IS the orchestration. No framework required.

## Where things live
```
CLAUDE.md          ← YOU ARE HERE (Layer 0 — read once)
CONTEXT.md         ← workspace router (Layer 1 — read next)
_config/           ← stable brand/design/payment config (Layer 3)
shared/            ← reusable skills, API clients, model router (Layer 3)
skills/            ← lazy-loaded skill files (Layer 3, load by trigger only)
stages/
  01_intake/       ← brief → PRD → client approval gate
  02_world_bible/  ← PRD → style preamble + scene list
  03_generate/     ← world bible → stills + video clips (fal.ai / HF)
  04_assemble/     ← clips → scroll-scrubbed site or production output
  05_quality/      ← Steve Krug laws + UDEC 8.5/10 gate
  06_package/      ← final delivery + proposal + payment unlock
docs/agent-system/ ← tool registry, API map, Hermes AGENTS.md updates
.pauli/            ← context ledger, handoffs, token telemetry
```

## Non-negotiable laws (read these, internalize, never repeat in context)
1. INDEX → MAP → SEARCH → RETRIEVE → PLAN → EDIT → VERIFY → COMPRESS → HAND OFF
2. jCodeMunch before cat. ast-grep before grep. OpenSrc before guessing deps.
3. Load skills by trigger only — never inject all skills into every stage.
4. Every stage output is a plain markdown/JSON file a human can edit before next stage runs.
5. Human approval gates: START (PRD) and END (final output). Nothing else requires a human.
6. Steve Krug laws are mandatory on ALL visual output. UDEC floor 8.5/10 blocks delivery.
7. Secrets via Infisical (pauli-secrets-vault pattern). Never in code or .env files.
8. Under $500 auto-proceed. Over $500 → notify Bambu → wait for approve signal.
9. Model router: Fable 5 (plan/review) → Grok (build) → Haiku (QA/repetitive). Auto-switch.
10. Self-improvement loop: every pipeline run writes a lesson to _config/lessons.jsonl.

## Token budget (enforce silently)
repo_map: 1500 | task_evidence: 3000 | code_per_step: 2500 | tool_output: 1500
active_context: 12000 | verification: 2000 | response: 800 | handoff: 1200

## Read next
→ CONTEXT.md (what to build, which stage to run)
