# World Bible — "Isla Adentro" (Puerto Rico tourism documentary)

workflow: documentary
market_id: puerto-rico (Spanish primary, English subtitles/secondary cut)
status: READY TO RUN — awaiting real footage drop-in

## Style preamble (locked)
Observational documentary of Puerto Rico beyond the resorts: golden Caribbean light, handheld but stable, colonial texture and rainforest green, real voices leading, AI b-roll only as connective tissue, no text, no logos.

## Structure
| segment | source | notes |
|---|---|---|
| Cold open — Old San Juan at dawn | REAL footage (drop into `footage/`) | street sound up |
| Voces — three locals tell it | REAL interviews | Whisper transcription drives the timeline |
| B-roll bridges | AI (Seedance) at detected markers | max 4s each, matched color |
| El Yunque / coast | REAL + AI wide establishers | AI clearly logged in EDL |
| Close — "ven a verla tú" | REAL | CTA card added in post |

## Real footage prompt (what to shoot / source)
4K 24fps, natural light only: Old San Juan streets at 6-8am, Condado seawall, El Yunque trailheads, a lechonera in Guavate, three 5-minute seated interviews (español).

## Run it
```bash
node ../../../stages/04_assemble/workflows/documentary.js ./footage brief.json ./output
# outputs: documentary-cut.mp4 + edit-decision-list.json (AI b-roll slots labeled)
```
