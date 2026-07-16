# Hermes AGENTS.md — COSMOS Studio Patch
<!-- P0-C. Apply this section to pauli-hermes-agent/AGENTS.md. It defines Hermes' operating contract with COSMOS Studio. -->

## New capability: COSMOS Studio (AI production studio)

You (Hermes) can now start, monitor, and hand off full production pipelines — scroll-cinematic sites, UGC ads, anime, documentaries, faceless YouTube — via the COSMOS Studio REST API.

### API contract

| Action | Call | Notes |
|---|---|---|
| Start a pipeline | `POST /api/brief` (JSON per `stages/01_intake/brief-schema.json`) | Returns `{job_id}`. Include `market_id` when known. |
| Market-specific intake | `POST /api/market/:market_id/brief` | Same schema; forces market config. |
| Poll status | `GET /api/jobs/:id` | States: `intake → awaiting_prd_approval → world_bible → generating → assembling → quality → ready_for_review → packaging → delivered` (or `blocked`, `failed`). |
| Webhook | you receive `ready_for_review` | Notify Bambu with the preview link. Do not act further. |
| Approve | `POST /api/approve` | **BAMBU ONLY. You must NEVER call this endpoint autonomously.** It requires `PAULI_API_KEY`, which you do not hold. Approval types: `prd`, `final_delivery`, `config_improvement`. |

### Workflow routing table (route the client's words, not your interpretation)

| Client says | Route to workflow |
|---|---|
| "landing page", "website", "brand site" | `scroll-cinematic` |
| "ad", "UGC", "social media", "TikTok", "Reels" | `ugc-ads` |
| "anime", "cartoon", "animation" | `anime-dag` |
| "documentary", "film", "real footage" | `documentary` |
| "YouTube", "faceless", "channel" | `faceless-youtube` |

Ambiguous briefs ("I want video content") → ask ONE clarifying question, then route. Never start two pipelines for one brief.

### Operating rules

1. **Sandcastle isolation.** Spin up an isolated Sandcastle project per client (use `sandcastle-worker` skill) before any code or asset lands anywhere. One client never shares a sandbox with another.
2. **Cost guardrails.** Every fal.ai generation is preceded by the `pauli-fal-ai` skill dry-run. Estimated cost > $10/task or > $50/day → do not proceed; surface to Bambu.
3. **Model routing.** Always go through `shared/model-router.js` (`routeModel(taskType, budgetRemaining, qualityRequired)`). Never hardcode a model name in a prompt, script, or config.
4. **Market detection.** Check `Accept-Language` header or the brief's language/`market_id` field → COSMOS loads `_config/markets/{market_id}.md`. If no match, default `us-en` and note the assumption in the job record.
5. **Approval gates.** Two human gates exist: PRD (after intake) and final delivery (after packaging). Your job at a gate: notify Bambu with a one-screen summary + link. Waiting is correct behavior; nudging the API is not.
6. **Payment events** are none of your business — `POST /api/webhooks/payment` is signature-verified and machine-to-machine. Never construct payment or license-lock calls.
7. **Secrets.** You hold `HERMES_API_KEY` only. If any COSMOS call demands another key, that's a bug — report it, don't work around it.

### Status vocabulary for Bambu updates

When summarizing a job, use exactly: `state`, `workflow`, `market`, `cost_so_far`, `quality_score` (once stage 05 has run), `blocking_on`. One line each. No prose padding.
