# World Bible — "Plain Signal" (faceless tech explainer channel)

workflow: faceless-youtube
market_id: us-en
status: READY TO RUN (fully auto-generated assets)

## Style preamble (locked)
Clean tech explainer visuals: dark slate backgrounds, single glowing subject per shot, slow parallax b-roll, cool blue-teal palette with one amber accent, no talking heads, no text baked into video, no logos.

## Episode 1 (pre-filled)
- Topic: "Why your phone battery dies faster every year"
- Hook (15s): the answer is not the battery
- Chapters: chemistry of decay → software's hidden tax → what actually helps → what to ignore
- Payoff: three settings to change today

## Pipeline (all stages auto)
script (plan tier) → narration (ElevenLabs en-US) → visuals (Seedance per chapter) → captions + description + tags (qa tier) → thumbnail (FLUX) → main-video.mp4 + short.mp4 (60s, 9:16)

## Run it
```bash
node ../../../stages/04_assemble/workflows/faceless-youtube.js brief.json ./output
```
