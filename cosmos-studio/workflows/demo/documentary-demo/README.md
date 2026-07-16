# Documentary demo — Isla Adentro (Puerto Rico)

Documentary workflow demo, Spanish primary / English secondary. Real-footage-first: drop MP4/MOV into `footage/` and the StoryToolkitAI fork transcribes and builds the timeline; AI b-roll fills detected markers only.

## Contents
- `world-bible.md` — preamble, structure, shooting prompt
- `brief.json` — intake brief
- `footage/` — put real clips here (empty placeholder note included)
- `stills/` — placeholder boards

## Run
```bash
node ../../../stages/04_assemble/workflows/documentary.js ./footage brief.json ./output
```
Without the StoryToolkitAI fork (`STORYTOOLKIT_DIR`), transcription stubs and the cut still assembles from footage order — the EDL marks every stubbed slot.
