# UGC demo — Café Cometa (bilingual EN/ES)

Generic coffee brand demo for the UGC ads workflow: 4 formats × 2 A/B hook styles × 2 languages. Character and voice defaults come from `_config/markets/mexico.md`.

## Contents
- `world-bible.md` — preamble, character, format/hook matrix
- `brief.json` — intake brief
- `stills/` — placeholder character/setting boards

## Run
```bash
node ../../../stages/04_assemble/workflows/ugc-ads.js brief.json ./output
```
Without `FAL_KEY` each variant writes a labeled `.stub.json` (prompt + model + cost) instead of an MP4 — review the prompts, add keys, re-run.
