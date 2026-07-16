<!-- COSMOS STUDIO — FABLE 5 ONE-SHOT BUILD PROMPT -->
<!-- ICM Architecture: folder structure = orchestration. No framework. -->
<!-- Token protocol: _config/pauli-effect.md (internalize as constraints before reading this) -->
<!-- Fable model role: PLAN + REVIEW. Grok: BUILD. Haiku: QA. Router: shared/model-router.js -->

# COSMOS STUDIO — Fable 5 Build Prompt

## Pre-flight (run ONCE before anything else)

```bash
# 1. Internalize constraints — read these files, do not re-read them mid-build
#    CLAUDE.md → CONTEXT.md → _config/pauli-effect.md → _config/krug-laws.md

# 2. Bootstrap tools (skip if already installed — check docs/agent-system/tool-registry.md)
uvx jcodemunch-mcp          # symbol retrieval — primary repo exploration tool
npx skills add oso95/scroll-world    # scroll-cinematic engine
npx @ast-grep/mcp           # structural search
# remaining tools install lazily per trigger table in pauli-effect.md

# 3. Index this repo
jcodemunch index .

# 4. Create ledger
mkdir -p .pauli/{context,handoffs,metrics}
touch .pauli/context/task-ledger.md
```

---

## What you are building

**COSMOS Studio** — an autonomous AI production studio that:
- Takes a brand/project brief (API or conversational)
- Produces Hollywood/Pixar-quality scroll-cinematic websites, UGC ads, anime, documentaries, faceless YouTube — in the client's native language
- Sells as owned software: down payment → monthly payments (3-4 months max) → client owns it forever
- System stays black-box (locked ZIP, encrypted config) until fully paid off
- Runs on cron + autonomous sub-agents, human approval only at PRD start and final delivery
- Callable by Hermes agent via REST API (`POST /api/brief` → poll → webhook → Bambu approves)
- Self-improving: every run logs a lesson; weekly cron proposes _config improvements
- Six markets: US-English, Puerto Rico (USD), Mexico, Spain, Serbia/Balkans + 2 TBD
- Compute: RunPod/Vast.ai for Blender GPU renders (affiliate revenue built into client pitch)

---

## Architecture map (build this folder structure exactly)

```
cosmos-studio/
├── CLAUDE.md                          ← Layer 0 (already written — DO NOT MODIFY)
├── CONTEXT.md                         ← Layer 1 (already written — DO NOT MODIFY)
├── FABLE_BUILD_PROMPT.md              ← this file (Layer 2 for Fable's build task)
│
├── _config/                           ← Layer 3 (stable, configure once)
│   ├── pauli-effect.md               ← token protocol (already written)
│   ├── krug-laws.md                  ← Steve Krug usability laws (BUILD THIS)
│   ├── udec-axes.md                  ← 14-axis UDEC quality scoring (BUILD THIS)
│   ├── emerald-tablets.md            ← Kupuri Media design law (BUILD THIS)
│   ├── lessons.jsonl                 ← self-improvement log (create empty)
│   └── markets/
│       ├── us-en.md                  ← US English market config
│       ├── puerto-rico.md            ← Puerto Rico (USD, Spanish + English)
│       ├── mexico.md                 ← Mexico (Spanish, MXN pricing)
│       ├── spain.md                  ← Spain (Spanish, EUR pricing)
│       ├── serbia-balkans.md         ← Serbia/Balkans (Serbian Ekavian, RSD/EUR)
│       └── tbd-slot-1.md            ← placeholder for market 6
│
├── shared/                            ← Layer 3 (reusable across all stages)
│   ├── model-router.js               ← LiteLLM smart switcher (BUILD THIS)
│   ├── fal-client.js                 ← fal.ai adapter (BUILD THIS)
│   ├── hf-client.js                  ← Hugging Face fallback (BUILD THIS)
│   ├── job-store.js                  ← in-memory → swap Redis in prod
│   ├── self-improve.js               ← reads lessons, proposes config edits
│   └── payment/
│       ├── stripe.js                 ← Stripe + Creem.io
│       ├── lightning.js              ← Lightning Network (<$500 auto, >$500 gate)
│       └── license-lock.js           ← black-box enforcer (payment progress check)
│
├── server/                            ← REST API (Hermes calls this)
│   ├── index.js                      ← Express app
│   ├── routes/
│   │   ├── brief.js                  ← POST /api/brief
│   │   ├── jobs.js                   ← GET /api/jobs/:id
│   │   └── approve.js                ← POST /api/approve (Bambu only)
│   └── package.json
│
├── stages/
│   ├── 01_intake/
│   │   ├── CONTEXT.md                ← Layer 2 stage contract (BUILD THIS)
│   │   ├── brief-schema.json         ← JSON schema for API intake
│   │   ├── prd-template.md           ← PRD output template
│   │   └── output/                   ← Layer 4 (per-run artifacts)
│   │
│   ├── 02_world_bible/
│   │   ├── CONTEXT.md                ← Layer 2 stage contract (BUILD THIS)
│   │   ├── scene-planner.js          ← derives scene list from PRD
│   │   ├── style-preamble.js         ← generates locked style preamble
│   │   └── output/
│   │
│   ├── 03_generate/
│   │   ├── CONTEXT.md                ← Layer 2 stage contract (BUILD THIS)
│   │   ├── fal-pipeline.sh           ← generalized fal.ai generation (from yappyverse)
│   │   ├── hf-fallback.sh            ← HF fallback when fal fails
│   │   ├── cost-guard.js             ← circuit breaker ($10/task, $50/day)
│   │   └── output/
│   │
│   ├── 04_assemble/
│   │   ├── CONTEXT.md                ← Layer 2 stage contract (BUILD THIS)
│   │   ├── workflows/
│   │   │   ├── scroll-cinematic.js   ← scrub engine wiring
│   │   │   ├── ugc-ads.js            ← 4 format UGC variants
│   │   │   ├── anime-dag.yaml        ← forge-film style DAG
│   │   │   ├── documentary.js        ← StoryToolkitAI integration
│   │   │   └── faceless-youtube.js   ← automated faceless channel
│   │   └── output/
│   │
│   ├── 05_quality/
│   │   ├── CONTEXT.md                ← Layer 2 stage contract (BUILD THIS)
│   │   ├── krug-checker.js           ← automated Krug law audit
│   │   ├── udec-scorer.js            ← 14-axis UDEC scoring
│   │   └── output/
│   │
│   └── 06_package/
│       ├── CONTEXT.md                ← Layer 2 stage contract (BUILD THIS)
│       ├── proposal-generator.js     ← fills proposal-template.md
│       ├── license-packager.js       ← creates locked ZIP with payment enforcer
│       └── output/
│
├── landing/                           ← The studio's own marketing site
│   ├── index.html                    ← Awwwards-tier bilingual EN/ES/SR landing page
│   │                                    with scroll-world demo built in
│   └── locales/
│       ├── en.json
│       ├── es.json
│       └── sr.json                   ← Serbian
│
├── workflows/demo/                    ← Pre-built demos (Fable builds these)
│   ├── anime-demo/                   ← anime pipeline demo (ready to run)
│   ├── ugc-demo/                     ← UGC ad demo
│   ├── documentary-demo/             ← documentary demo
│   └── faceless-youtube-demo/        ← faceless YouTube demo
│
└── docs/agent-system/
    ├── tool-registry.md              ← all installed tools (BUILD THIS FIRST)
    ├── api-registry.md               ← every external API (BUILD THIS)
    ├── hermes-AGENTS.md              ← Hermes' updated AGENTS.md (BUILD THIS)
    ├── pricing.md                    ← 3-tier + payment plan structure
    ├── ad-strategy.md                ← 6-month ad plan, 6 markets, UGC scripts
    └── pauli-effect-full.md          ← full Pauli Effect doc (copy from source)
```

---

## Build order (Fable executes these in sequence)

### Phase 0 — Foundation (no human gate)
Build in this exact order. Do not skip to Phase 1 until all pass.

**P0-A: Tool registry + API registry**
File: `docs/agent-system/tool-registry.md`
Content: every tool from pauli-effect.md tool table + Hermes existing skills.
Format: name | purpose | version/commit | invoke | context-cost | trigger | license | security | fallback

File: `docs/agent-system/api-registry.md`
All APIs this system calls:
- fal.ai (FAL_KEY) — stills: FLUX 1.1 Pro Ultra | video: Seedance 2.0/2.5/Mini
- Hugging Face (HF_TOKEN) — FLUX.1-dev fallback, 3D models, warm video models
- Anthropic (ANTHROPIC_API_KEY) — Fable 5 (plan/review), Sonnet (code), Haiku (QA)
- OpenRouter or LiteLLM — model routing layer (free to use, no lock-in)
- Grok API (GROK_API_KEY) — primary build model (cost-efficient)
- MuAPI (MUAPI_KEY) — Fable 5 access at 20% discount, Seedance 2.5, Veo 3.1
- Stripe (STRIPE_SECRET_KEY) — primary payments
- Creem.io (CREEM_API_KEY) — Stripe alternative, no monthly fee
- Lightning (LN_MACAROON + LN_CERT) — Bitcoin Lightning under $500
- Infisical (INFISICAL_TOKEN) — secrets vault (ALL keys come from here)
- RunPod (RUNPOD_API_KEY) — GPU compute for Blender renders (affiliate link)
- Vast.ai (VASTAI_API_KEY) — GPU compute fallback (affiliate link)
- BTCPay (BTCPAY_URL + BTCPAY_API_KEY) — on-chain Bitcoin fallback
- n8n (N8N_WEBHOOK_URL) — workflow automation + lead nurturing
- StoryToolkitAI (fork — local) — documentary AI editing

**P0-B: Config files**
Build `_config/krug-laws.md` — extract and compress Steve Krug's laws from:
"Don't Make Me Think, Revisited" (Krug, 2014). Key laws for agent enforcement:
1. Don't make me think — every choice = cognitive load = bad
2. How we really use the web — scanning not reading; satisficing not optimizing
3. Billboard design 101 — clear visual hierarchy, obvious clickables, noise reduction
4. Animal, vegetable, or mineral — eliminate all unnecessary words
5. Omit needless words — half the words → twice the usability
6. Street signs and breadcrumbs — always know where you are, one click to home
7. The big bang theory of web design — nail the home page; first impression = trust
8. The farmer and the cowman — resolve stakeholder debates with usability data not opinion
9. Usability testing on 10 cents a day — test early, test often, test with real users
10. Usability as common courtesy — don't create unnecessary obstacles

Build `_config/udec-axes.md` — the 14-axis UDEC scoring framework (from SYNTHIA system):
Axes: Clarity | Hierarchy | Contrast | Typography | Spacing | Color | Motion |
      Accessibility | Copy | Conversion | Mobile | Performance | Trust | Delight
Floor: 8.5/10. Any axis below 7.0 blocks delivery. ACC axis below 7.0 = immediate block.

Build `_config/emerald-tablets.md` — Kupuri Media design law (from SYNTHIA_SYSTEMS_FORCE_PROMPT):
- Paperclip never appears in client-facing UI
- Sphere-state.ts is read-only
- Alex™ = female, CDMX persona, ElevenLabs voice only
- SYNTHIA UI spheres = science/symbols only, never human avatars
- pauli-secrets-vault pattern governs ALL secrets
- No barrel files (index.ts re-exports) in any agent-touched codebase
- Quality floor: 8.5/10 UDEC across all outputs

Build `_config/markets/` — one file per market:
Format per market file:
```yaml
market_id: us-en
language: English
locale: en-US
currency: USD
pricing:
  starter: 1800
  growth: 3500
  flagship: 6500
  payment_plan_months: 3
  down_payment_pct: 0.33
wealthy_targets: [Manhattan NY, Silicon Valley CA, Miami Beach FL, Austin TX, Scottsdale AZ]
ugc_character_defaults:
  voice_model: eleven_labs_en_us_default
  appearance_prompt: "Young professional, diverse, authentic, relatable"
ad_platforms: [Meta, Instagram, TikTok, YouTube]
affiliate_compute: runpod.io/?ref=kupuri
local_competitor_gap: "Most scroll-cinematic studios charge $10K-50K and take 3-6 months"
hook_line: "Your brand deserves a website that feels like a movie."
```

**P0-C: Hermes AGENTS.md update**
File: `docs/agent-system/hermes-AGENTS.md`
This file patches `pauli-hermes-agent/AGENTS.md` with the new COSMOS Studio capabilities.
Hermes must know:
- `POST /api/brief` → start a COSMOS pipeline job
- `GET /api/jobs/:id` → poll status
- `POST /api/approve` → Bambu only, do NOT call autonomously
- Sandcastle: spin up isolated project for each client (use sandcastle-worker skill)
- When to call which workflow: see workflow routing table below
- Cost guardrails: fal-ai skill dry-run before every generation call
- Model routing: always use model-router.js, never hardcode a model
- Market detection: check `Accept-Language` or client brief for locale → load market config

Workflow routing table (Hermes must have this):
| Client says | Route to workflow |
|---|---|
| "landing page", "website", "brand site" | scroll-cinematic |
| "ad", "UGC", "social media", "TikTok", "Reels" | ugc-ads |
| "anime", "cartoon", "animation" | anime-dag |
| "documentary", "film", "real footage" | documentary |
| "YouTube", "faceless", "channel" | faceless-youtube |

---

### Phase 1 — Core infrastructure (no human gate)

**P1-A: Model router**
File: `shared/model-router.js`
LiteLLM-based smart switcher. Logic:
- Fable 5 (via MuAPI, `claude-fable-5`): planning, review, quality gate analysis
- Grok (`grok-beta` via OpenRouter): primary build model — cost-efficient, fast
- Claude Haiku 4.5: QA, repetitive tasks, translation, caption generation
- FLUX.1-dev (HF): image fallback when fal.ai fails or budget exceeded
- Seedance 2.0 Mini (fal.ai): draft/previz video (25% cost of standard)
- Seedance 2.0 Standard: production video
- Auto-switch triggers: API error → next provider; cost threshold → downgrade; quality fail → upgrade
Export: `routeModel(taskType, budgetRemaining, qualityRequired)` → `{provider, model, endpoint, costEstimate}`

**P1-B: Payment system**
File: `shared/payment/stripe.js` — Stripe + Creem.io dual handler
File: `shared/payment/lightning.js` — Lightning (Breez SDK or LND REST): auto-proceed under $500, notify over $500
File: `shared/payment/license-lock.js` — payment progress enforcer:
- On deploy: reads `_config/license.json` (payment %, months remaining)
- If `paid_pct < 100`: serve the system BUT encrypt the source ZIP with a rotating key
- Rotating key released per successful monthly payment
- On `paid_pct === 100`: release permanent unlock key, system is fully owned
- Suspension: if payment missed by >7 days, system enters read-only mode (shows existing output, no new generation)
- Suspension does NOT delete client data
- Suspension lifts immediately on payment resume

**P1-C: Self-improvement loop**
File: `shared/self-improve.js`
Cron: runs every Sunday 03:00 UTC
- Reads `_config/lessons.jsonl` (last 30 days)
- Groups lessons by type: quality_fail | cost_spike | model_error | client_revision | krug_violation
- Proposes specific _config edits as a diff (never auto-applies)
- Writes proposal to `_config/improvement-proposals/YYYY-MM-DD.md`
- Notifies Bambu via webhook (configurable channel)
- Bambu reviews, approves via `POST /api/approve?type=config_improvement`

**P1-D: Server API**
File: `server/index.js` + routes
Same structure as pauli-scroll-world server (already in Hermes memory), add:
- `POST /api/approve?type=config_improvement` — Bambu config approval
- `GET /api/metrics` — token spend, quality scores, lesson count
- `POST /api/market/:market_id/brief` — market-specific brief intake
- Webhook: `POST /api/webhooks/payment` — Stripe/Lightning payment events → license-lock update

---

### Phase 2 — Stage contracts (build each CONTEXT.md)

Each stage CONTEXT.md follows ICM format exactly:
```markdown
## Inputs
- Layer 4 (working): ../[prev_stage]/output/[file]
- Layer 3 (reference): ../../_config/[file]

## Process
[what the agent does — specific, testable, not vague]

## Outputs
- [filename] → output/
```

**Stage 01_intake CONTEXT.md**
Inputs: raw brief (text, API JSON, or conversational)
Process:
1. Extract: brand_name, pitch, industry, audience, tone[], budget_tier, languages[], palette?, scenes?, add_ons[], market_id
2. Validate against brief-schema.json — reject if required fields missing, return error with specific missing field
3. Route to correct market config: detect language → load `_config/markets/{market_id}.md`
4. Generate PRD from prd-template.md (fill all fields — no blanks, no "TBD")
5. Generate payment plan: down_payment = price * 0.33 | monthly = (price * 0.67) / months | total_months = 3 max
6. HALT — write PRD to output/prd.md — await Bambu approval signal before stage 02 runs
Outputs: `output/prd.md` | `output/payment-plan.json` | `output/brief-validated.json`

**Stage 02_world_bible CONTEXT.md**
Inputs: `../01_intake/output/prd.md` | `../../_config/markets/{market_id}.md`
Process:
1. Derive style preamble: one sentence locked to brand palette + art direction — reused verbatim on every scene prompt
2. Propose 5-7 scene beats: each beat = {id, name, eyebrow, headline, body, cta?}
3. Identify workflow: scroll-cinematic | ugc-ads | anime | documentary | faceless-youtube
4. For scroll-cinematic: propose camera architecture A (continuous forward) or B (dive+connector)
5. Write dive prompt + connector prompt for each scene pair
6. Write world bible to output/world-bible.md — this is an EDIT SURFACE: Bambu/client can edit scenes before stage 03 runs
Outputs: `output/world-bible.md` | `output/scene-list.json` | `output/style-preamble.txt`

**Stage 03_generate CONTEXT.md**
Inputs: `../02_world_bible/output/world-bible.md` | style-preamble.txt | scene-list.json
Process:
1. Load pauli-fal-ai skill → dry-run cost estimate → log to cost-guard.js
2. If estimated cost > $10: HALT, report to Bambu, await approval
3. Draft pass first (seedance-2.0-mini, 480p) — always before final render
4. Human (Bambu) reviews draft clips via preview link → approve/reject scenes
5. Final render approved scenes (seedance-2.0 standard, 720p; hero scenes 1080p)
6. Frame extraction: ffmpeg extracts last/first frames of neighboring clips (seam lock — mandatory)
7. Connector generation: use extracted frames as start/end image (NOT original stills)
8. Encode: GOP 8, faststart, strip audio, crf 20
9. Log generation: every call → `output/generation-log.jsonl` with model, cost, duration, url
Outputs: `output/stills/*.webp` | `output/vid/*.mp4` | `output/generation-log.jsonl`

**Stage 04_assemble CONTEXT.md**
Inputs: `../03_generate/output/` | `../02_world_bible/output/world-bible.md`
Process: route to workflow sub-pipeline based on world-bible.workflow field.
Each sub-pipeline is defined in `stages/04_assemble/workflows/` — see files.
For scroll-cinematic: wire scrub-engine.js with brand sections, bilingual toggle, Krug-compliant copy.
For ugc-ads: generate 4 format variants, write to output/ugc-{format}.mp4.
For anime: run forge-film DAG with model routing per scene type.
For documentary: StoryToolkitAI integration — voice-driven timeline + AI b-roll.
For faceless-youtube: generate narration audio + visuals + captions + thumbnail.
Outputs: `output/deliverable/` (all final files) | `output/preview-url.txt` (if deployed)

**Stage 05_quality CONTEXT.md**
Inputs: `../04_assemble/output/deliverable/`
Process:
1. Run krug-checker.js — automated audit of every user-facing text element
2. Run udec-scorer.js — score all 14 axes
3. If ANY axis < 7.0: BLOCK delivery, write specific failure report, return to stage 04
4. If overall < 8.5: BLOCK delivery, write improvement tasks, return to stage 04
5. If score ≥ 8.5 and all axes ≥ 7.0: write PASS to output/quality-report.md
6. Log lesson: write pass/fail + scores to `_config/lessons.jsonl`
Outputs: `output/quality-report.md` (PASS or FAIL + specific fixes) | `output/udec-scores.json`

**Stage 06_package CONTEXT.md**
Inputs: `../05_quality/output/` | `../01_intake/output/payment-plan.json` | `../../_config/markets/{market_id}.md`
Process:
1. Fill proposal from market-specific template (language = market language)
2. Generate payment link: Stripe checkout or Lightning invoice based on client location
3. Create delivery ZIP: encrypt source code with rotating key (license-lock.js)
4. Write unlock instructions (one key per monthly payment, final key = full ownership)
5. Deploy preview to Vercel/Cloudflare (preview = unencrypted visual, source = locked)
6. HALT — write delivery package to output/ — await Bambu final approval
7. On Bambu approval: send to client via configured channel
Outputs: `output/proposal-{lang}.md` | `output/payment-link.txt` | `output/delivery-package.zip`

---

### Phase 3 — Workflow sub-pipelines

**P3-A: Scroll-cinematic workflow**
File: `stages/04_assemble/workflows/scroll-cinematic.js`
Already built in pauli-scroll-world — REUSE, do not rebuild.
Wire: `mountScrollWorld()` config generated from world-bible.json.
Bilingual toggle: EN/ES/SR depending on market_id.
Krug compliance: every word in title/body/cta runs through krug-checker before wiring.

**P3-B: UGC ads workflow**
File: `stages/04_assemble/workflows/ugc-ads.js`
Four formats: podcast_16x9 | ugc_9x16 | lifestyle_9x16 | greenscreen_9x16
Model: fal.ai `bytedance/seedance-2.0/reference-to-video` with `generate_audio: true`
Character: loaded from `_config/markets/{market_id}.md` ugc_character_defaults
A/B variants: 2 minimum per format (vary hook style: authority vs story vs problem-solution)
Output: one MP4 per variant, named `{format}_{variant}_{market}.mp4`

**P3-C: Anime workflow (Forge-film DAG)**
File: `stages/04_assemble/workflows/anime-dag.yaml`
Uses Forge-film's CPM parallel scheduling — fork or call Forge-film as subprocess.
Scene routing: dialogue→seedance-2.0 | landscapes→HF fallback (cogvideo or similar warm model)
action→seedance-2.0 | establishing→FLUX still → animate
Cross-model continuity: extract last frame, histogram color match, pass as i2v seed.
Output: `final.mp4` assembled by ffmpeg.

**P3-D: Documentary workflow (StoryToolkitAI)**
File: `stages/04_assemble/workflows/documentary.js`
Fork: `https://github.com/octimot/StoryToolkitAI.git`
Additions to fork: voice control interface (Whisper STR → command parser)
Real footage: accepts MP4/MOV uploads → StoryToolkitAI transcription + edit
AI b-roll: prompt → fal.ai Seedance → insert at detected b-roll markers
Output: `documentary-cut.mp4` + `edit-decision-list.json`

**P3-E: Faceless YouTube**
File: `stages/04_assemble/workflows/faceless-youtube.js`
Pipeline: script (Fable/Grok) → narration (ElevenLabs, market language voice) → visuals (Seedance) → captions (Haiku) → thumbnail (FLUX) → assembled MP4
Shorts variant: auto-generate 60s vertical clip from same script
Output: `main-video.mp4` | `short.mp4` | `thumbnail.webp` | `description.md` | `tags.json`

---

### Phase 4 — Landing page (the studio's own marketing site)

File: `landing/index.html`
This is the most important single file for generating revenue. Build it to Awwwards standard.

**Design requirements (non-negotiable):**
- Scroll-world demo is BUILT IN — visitor scrolls through a cinematic world on first load
- Three languages in ONE file: EN (default), ES toggle, SR toggle
- Frame counter (film aesthetic) — ticks with scroll position
- Each section is a scene beat from a demo project (show the product BY using it)
- Must load under 3 seconds on mobile (no external JS frameworks, vanilla + scrub-engine.js)
- Krug law: every piece of text passes the "billboard test" — readable in 3 seconds at scroll speed

**Copy requirements (per market — write all three in the file):**
EN hero: "The scroll is the camera. Your brand, as a world."
ES hero: "El scroll es la cámara. Tu marca, como un mundo."
SR hero: "Scroll je kamera. Tvoj brend, kao svet." (Serbian Ekavian)

**Pricing section (tiered — render based on market):**
- Starter: $1,800 (US) / $900 (MX) / $600 (Serbia) — 4-5 scenes, desktop, 1 language
- Growth: $3,500 (US) / $1,750 (MX) / $1,200 (Serbia) — 6-7 scenes, mobile, bilingual
- Flagship: $6,500+ (US) / $3,200+ (MX) / $2,200+ (Serbia) — full 1080p, UGC ads, deploy
Payment plan section: "Own it in 3 months. Pay as you grow. Keep it forever."
Affiliate compute section: "You'll need cloud GPU. We recommend RunPod [link] or Vast.ai [link]."

**CTAs:**
- "Start your world →" → opens intake form → `POST /api/brief`
- "Watch a demo" → plays one of the pre-built demos in a modal
- "Buy the studio" → goes to pricing + payment plan

---

### Phase 5 — Pre-built demos

Build 4 self-contained demo packages in `workflows/demo/`:
Each demo includes: world-bible.md (pre-filled) + sample stills (placeholders OK) + scrub-engine config + README

**anime-demo**: "Yappyverse — Las Vegas 2056 Foxies Casino" (already partially built — reuse yappyverse assets)
**ugc-demo**: Generic coffee brand (bilingual EN/ES, 4 UGC format variants)
**documentary-demo**: Puerto Rico tourism (Spanish primary, English secondary, real footage prompt ready)
**faceless-youtube-demo**: Tech explainer (English, auto-generated assets)

---

### Phase 6 — Ad strategy (6-month plan)

File: `docs/agent-system/ad-strategy.md`
For each of the 6 markets, write:
1. Platform mix (Meta/IG/TikTok/YouTube) with budget allocation %
2. UGC character description (local-looking, local voice, local setting)
3. 3 hook lines for A/B test (problem-agitation-solution format)
4. Targeting parameters (wealthy zip codes / neighborhoods from market config)
5. Month 1-6 content calendar (what type of content, how many pieces/month)
6. KPIs: CPL (cost per lead), CVR (conversion rate), ROAS (return on ad spend)
7. Affiliate angle: "Run our system on RunPod — click our link and we both save"

---

### Phase 7 — Pricing + payment plan doc

File: `docs/agent-system/pricing.md`
Already partially in pauli-scroll-world/references/pricing.md — EXTEND IT.
Add: payment plan structure, lock/unlock mechanism description, market-adjusted pricing,
add-ons table, compute affiliate earnings estimate, reseller tier (agencies that buy the studio).

---

## Quality gate (runs after EVERY phase)

Before marking any phase complete:
```bash
# Run quality check — do not skip
node stages/05_quality/udec-scorer.js --target=./[phase-output]
node stages/05_quality/krug-checker.js --target=./[phase-output]
# Both must return PASS. If FAIL: fix the specific failing axes. Do not redeliver.
```

Steve Krug mandatory check on ALL user-facing copy:
1. Would a distracted user understand this in 3 seconds? If no → rewrite.
2. Can you cut 50% of the words without losing meaning? If yes → cut them.
3. Is every link/button name a verb that describes exactly what happens? If no → fix it.

---

## Completion criteria (Fable must verify all before declaring done)

- [ ] All files in architecture map exist and are non-empty
- [ ] `docs/agent-system/tool-registry.md` lists all tools with security review
- [ ] `docs/agent-system/api-registry.md` lists all APIs, no secrets inline
- [ ] `docs/agent-system/hermes-AGENTS.md` updated with COSMOS routing table
- [ ] All 6 stage CONTEXT.md files have Inputs/Process/Outputs tables
- [ ] `shared/model-router.js` exports `routeModel()` and handles 3 providers minimum
- [ ] `shared/payment/license-lock.js` implements black-box until payment complete
- [ ] `shared/self-improve.js` reads lessons.jsonl and writes proposals (not auto-applies)
- [ ] `server/index.js` has /api/brief, /api/jobs/:id, /api/approve routes
- [ ] `/api/approve` requires PAULI_API_KEY and cannot be called by Hermes autonomously
- [ ] `landing/index.html` passes Krug billboard test + UDEC ≥ 8.5 + loads <3s mobile
- [ ] `landing/index.html` has EN/ES/SR toggle in single file
- [ ] All 4 demo packages exist in `workflows/demo/`
- [ ] `_config/lessons.jsonl` exists (empty is fine)
- [ ] `.pauli/context/task-ledger.md` is current
- [ ] `.pauli/handoffs/current.md` exists with next_action field populated
- [ ] `docs/agent-system/ad-strategy.md` covers all 6 markets
- [ ] `docs/agent-system/pricing.md` includes payment plan + lock/unlock description
- [ ] Token telemetry written to `.pauli/metrics/token-efficiency.jsonl`
- [ ] No API keys or secrets in any file (all reference Infisical env vars by name only)
- [ ] Docker-compatible: `docker-compose.yml` exists, all services containerized
- [ ] README.md at root with: what it is, how to deploy, how Hermes calls it, how to sell it

---

## Handoff packet (write this when done)

```yaml
objective: COSMOS Studio v1.0 — autonomous AI production studio
status: [complete|partial|blocked]
criteria: [reference completion checklist above]
facts:
  - model_router: LiteLLM routing Fable5→Grok→Haiku
  - payment: Stripe + Lightning + BTCPay, license-lock on payment progress
  - markets: 6 configured, 2 TBD slots ready
  - workflows: 5 production pipelines + 4 pre-built demos
  - hermes_api: POST /api/brief → poll → webhook → Bambu approves
decisions:
  - [list key architectural decisions made during build]
changed_files: [list]
tests: [what was verified]
risks: [what still needs production hardening]
next_action: [exact next command or decision needed]
```
