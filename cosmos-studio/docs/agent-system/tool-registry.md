# COSMOS Studio — Tool Registry
<!-- P0-A. Every tool the studio's agents may load. Load by trigger ONLY (pauli-effect.md law 3). -->
<!-- Security column: what the tool can touch. Anything marked NETWORK or SECRETS gets reviewed before a version bump. -->

| Name | Purpose | Version/Commit | Invoke | Context cost | Trigger | License | Security | Fallback |
|---|---|---|---|---|---|---|---|---|
| jcodemunch | Symbol-level repo retrieval + index | `uvx jcodemunch-mcp` (latest, verified in-session) | `jcodemunch index <path>` / MCP `serve` | ~200 tok/query | Large repo scan (>20 files) | proprietary-free tier | LOCAL FS read only | `Grep` narrow glob |
| ast-grep | Structural (AST) code search | `@ast-grep/cli` via npx | `ast-grep run -p '<pattern>'` | ~150 tok/query | Structural search before text search | MIT | LOCAL FS read only | ripgrep |
| scroll-world | Scroll-scrubbed cinematic engine + pipeline | `oso95/scroll-world` v0.3.0 (vendored in `skills/scroll-world/`) | load SKILL.md; engine at `references/scrub-engine.js` | ~2.5k tok (SKILL) | UI: video scrub / scroll site | MIT | none (static JS) | static hero + stills |
| taste-skill + uncodixfy + native-feel | UI/design quality skills | per skills marketplace | Skill loader | ~2k tok | UI / design / frontend | varies | none | manual UDEC review |
| no-ai-slop-writing-rules | Editorial copy constraints | per skills marketplace | Skill loader | ~1k tok | Marketing / editorial copy | varies | none | krug-checker.js |
| GSAP + cinematic-site-components | Animation/motion library patterns | GSAP 3.x | `import gsap` | ~1k tok | Animation / motion | GSAP std license | none | CSS transitions |
| hyperframes-helper | Frame extraction/seam-lock helper | local (`stages/03_generate/fal-pipeline.sh` embeds ffmpeg calls) | shell | ~300 tok | Video scrub / seams | MIT | LOCAL FS | raw ffmpeg |
| agent-media | Social content / UGC generation helpers | per skills marketplace | Skill loader | ~1.5k tok | Social content / UGC | varies | NETWORK (fal.ai) | ugc-ads.js direct |
| browser-harness | Browser validation of built pages | Playwright + bundled Chromium | `node` + playwright | ~1k tok | Browser validation | Apache-2.0 | LOCAL browser, no ext. network needed | manual review |
| e2e-harness | End-to-end product flow tests | Playwright | `npx playwright test` | ~1k tok | E2E product flow | Apache-2.0 | LOCAL | curl-based smoke test |
| blender-mcp + dreamcraft3d | 3D scene + asset generation | per registry | MCP | ~2k tok | 3D / Blender | GPL (Blender) | NETWORK (RunPod GPU) | FLUX still + parallax |
| A2A protocol | Agent-to-agent messaging | spec v0.x | HTTP JSON | ~500 tok | Agent-to-agent | Apache-2.0 | NETWORK | REST `POST /api/brief` |
| pauli-fal-ai | fal.ai generation w/ dry-run cost gate | local skill | Skill loader | ~1k tok | fal.ai generation | internal | NETWORK + SECRETS (FAL_KEY) | hf-client.js |
| sandcastle-worker | Isolated sandbox for all code changes | **not installed in this environment** — the session's isolated ephemeral container fulfills the same contract (fresh clone, no host access, discarded after run) | n/a here; in prod: `sandcastle run <task>` | ~800 tok | Any code change | internal | ISOLATION boundary | session container (current) |
| ffmpeg | Encode, frame extraction, assembly | 6.x system | `ffmpeg` | 0 | Any video output | LGPL | LOCAL FS | none (hard dep) |
| Infisical CLI | Secrets injection at runtime | `infisical` latest | `infisical run -- node …` | 0 | Any process needing secrets | MIT | SECRETS broker — never logs values | `.env` (dev only, gitignored) |

## Hermes existing skills (registered so COSMOS never double-loads them)

| Name | Purpose | Trigger | Fallback |
|---|---|---|---|
| hermes-intake | Conversational brief capture | client chat | `POST /api/brief` raw JSON |
| hermes-notify | Bambu notification channel | approval gates, cost halts | n8n webhook |
| hermes-scheduler | Cron orchestration | weekly self-improve, job polling | system cron |

## Security review notes
- Tools marked SECRETS (`pauli-fal-ai`, Infisical CLI) may only read keys by env-var name; values never enter agent context or logs.
- Tools marked NETWORK are subject to cost-guard circuit breakers ($10/task, $50/day — pauli-effect hard stops).
- No tool may write outside the repo or `stages/*/output/`. Sandcastle/session-container is the enforcement boundary.
- Version bumps of NETWORK/SECRETS tools require a lesson entry in `_config/lessons.jsonl` and Bambu sign-off.
