# World Bible — Café Cometa (UGC ad pack, bilingual EN/ES)

workflow: ugc-ads
market_id: mexico (bilingual deliverable: ES primary, EN variant)
status: READY TO RUN

## Style preamble (locked)
Handheld authenticity for Café Cometa specialty coffee: warm morning light, real kitchens and cafés, terracotta-and-cream palette, natural skin texture, no studio gloss, no text, no logos.

## Character (from _config/markets/mexico.md — Alex™ persona rules apply)
Chilanga professional, contemporary CDMX style, warm, direct-to-camera confidence. Voice: eleven_labs_es_mx_default (EN variant: eleven_labs_en_us_default).

## Formats × hooks (8 videos per language)
| format | aspect | hook A (authority) | hook B (story) |
|---|---|---|---|
| podcast_16x9 | 16:9 | "Probé todos los cafés de especialidad de la ciudad." | "El mes pasado casi dejo el café." |
| ugc_9x16 | 9:16 | same, selfie framing | same, selfie framing |
| lifestyle_9x16 | 9:16 | product-in-use, VO | product-in-use, VO |
| greenscreen_9x16 | 9:16 | speaker + animated brew screen | speaker + animated brew screen |

## Run it
```bash
node ../../../stages/04_assemble/workflows/ugc-ads.js brief.json ./output
# outputs: {format}_{variant}_mexico.mp4 (+ .stub.json manifests when FAL_KEY is unset)
```
