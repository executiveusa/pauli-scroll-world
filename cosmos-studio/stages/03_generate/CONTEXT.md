# Stage 03 — Generate (Layer 2 contract)

## Inputs
- Layer 4 (working): `../02_world_bible/output/world-bible.md` · `output/style-preamble.txt` · `output/scene-list.json`
- Layer 3 (reference): `../../_config/pauli-effect.md` (hard stops) · `cost-guard.js`

## Process
1. Load `pauli-fal-ai` skill → **dry-run cost estimate** for the full scene list → log through `cost-guard.js`.
2. Estimated cost > $10 for the task → **HALT**, report to Bambu, await approval. (Daily > $50 → HALT regardless of approval.)
3. **Draft pass first, always**: `seedance-2.0-mini` at 480p (`fal-pipeline.sh --draft`). Never final-render an unapproved scene.
4. Bambu reviews draft clips via preview link → approves/rejects per scene.
5. Final render approved scenes: `seedance-2.0` standard at 720p; hero scenes 1080p.
6. **Seam lock (mandatory)**: ffmpeg extracts the last frame of each dive and the first frame of the next (`fal-pipeline.sh --extract-frames`).
7. Connectors are generated from those EXTRACTED frames as start/end images — never from the original stills. This is what makes cuts invisible.
8. Encode: GOP 8, `+faststart`, strip audio, crf 20 (mobile variants: 720p, GOP 4).
9. Log EVERY generation call to `output/generation-log.jsonl`: `{ts, model, cost, durationMs, url, scene, pass}`.
10. fal.ai failure on a scene → `hf-fallback.sh` (FLUX.1-dev still + warm video model); connector failure → skip it (engine crossfades — degradation is graceful, not fatal).

## Outputs
- `output/stills/*.webp` → scene posters
- `output/vid/*.mp4` → dives + connectors (desktop + mobile encodes)
- `output/generation-log.jsonl` → complete cost/provenance trail
