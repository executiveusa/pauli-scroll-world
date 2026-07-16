# Stage 04 — Assemble (Layer 2 contract)

## Inputs
- Layer 4 (working): `../03_generate/output/` (stills, vid, generation-log) · `../02_world_bible/output/world-bible.md` + `scene-list.json`
- Layer 3 (reference): `workflows/*` (sub-pipeline definitions) · `../../_config/markets/{market_id}.md`

## Process
Route to the sub-pipeline named by the world bible's `workflow` field — each is defined in `workflows/`:

| workflow | entry | what it does |
|---|---|---|
| scroll-cinematic | `workflows/scroll-cinematic.js` | Wires `mountScrollWorld()` (skills/scroll-world scrub engine — REUSED, never rebuilt) with brand sections, bilingual toggle per market, Krug-checked copy |
| ugc-ads | `workflows/ugc-ads.js` | 4 formats × ≥2 A/B hook variants, market character defaults, `generate_audio: true` |
| anime | `workflows/anime-dag.yaml` | Forge-film CPM DAG: per-scene-type model routing + cross-model continuity |
| documentary | `workflows/documentary.js` | StoryToolkitAI fork: transcription → voice-driven timeline → AI b-roll at markers |
| faceless-youtube | `workflows/faceless-youtube.js` | script → narration → visuals → captions → thumbnail → assembled MP4 + Short |

Common rules:
1. Every user-facing word passes `../05_quality/krug-checker.js` BEFORE it is wired into a deliverable (fail here = cheap; fail at stage 05 = a full return trip).
2. Deliverables are self-contained in `output/deliverable/` — no references back into stages.
3. Browser-harness render check on anything with a DOM before handing to stage 05.

## Outputs
- `output/deliverable/` → all final files for the workflow
- `output/preview-url.txt` → if a preview was deployed (Vercel/Cloudflare)
