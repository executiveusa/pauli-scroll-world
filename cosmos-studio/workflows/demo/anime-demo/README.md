# Anime demo — Foxies Casino 2056

The anime pipeline demo, pre-filled and ready to run. Partially reuses yappyverse assets (the original scroll-world pipeline this studio grew from); stills here are lightweight SVG placeholders so the package is self-contained without credentials.

## Contents
- `world-bible.md` — locked preamble, 5 beats, routing + continuity plan
- `brief.json` — the intake brief that produced this bible
- `stills/` — placeholder scene posters (replaced by FLUX renders in stage 03)
- `dag-params.json` — parameter block for `stages/04_assemble/workflows/anime-dag.yaml`

## Run
```bash
# dry-run (no keys): every generation stubs, assembly still produces final.mp4 from test sources
bash ../../../stages/03_generate/fal-pipeline.sh --draft scene-list.json style-preamble.txt
# live: set FAL_KEY (and friends) in cosmos-studio/.env first
```
Cost gates apply: the DAG halts and notifies Bambu if the estimate crosses $10.
