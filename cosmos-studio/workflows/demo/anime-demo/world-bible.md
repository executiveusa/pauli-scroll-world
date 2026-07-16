# World Bible — Yappyverse: Foxies Casino, Las Vegas 2056

workflow: anime
market_id: us-en
status: READY TO RUN (assets: placeholder stills included; run stage 03 to generate real clips)

## Style preamble (locked — verbatim on every scene prompt)
Neo-noir anime, Las Vegas 2056: fox-eared characters in a holographic casino strip, teal-and-magenta neon on wet chrome, anamorphic glow, hand-drawn linework over painted light, no text, no logos.

## Scene beats
| # | id | type | beat |
|---|---|---|---|
| 1 | strip | establishing | Aerial glide down the 2056 Strip toward the Foxies marquee |
| 2 | doors | action | Doors burst open; chip-cascade slow-motion through the lobby |
| 3 | vex | dialogue | Vex (fox dealer) deals a hand, one ear twitching at a cheat |
| 4 | heist | action | Vault corridor chase — tails, lasers, a rolling lucky chip |
| 5 | dawn | landscape | Dawn over the desert; the casino powers down, one light stays on |

## Model routing (per anime-dag.yaml — task types, not model names)
establishing → image + animate · dialogue/action → video_final · landscape → video_draft (HF warm)

## Continuity
Last frame of each scene → histogram match → i2v seed of the next. The lucky chip appears in every scene (prop continuity anchor).

## Run it
```bash
node ../../../stages/02_world_bible/scene-planner.js brief.json .   # regenerate beats (optional)
# then execute the DAG: stages/04_assemble/workflows/anime-dag.yaml with Forge-film
```
