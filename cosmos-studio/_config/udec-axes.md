---
name: udec-axes
version: 1.0
type: layer3-constraint
load: on quality gate (stage 05) and after every build phase
source: SYNTHIA system — 14-axis UDEC quality scoring
---

# UDEC — 14-Axis Quality Scoring

**Floor: 8.5/10 overall. Any axis below 7.0 blocks delivery. ACC (Accessibility) below 7.0 = immediate block, no exceptions.**
Scored by `stages/05_quality/udec-scorer.js` (heuristic pass) + a model review pass (Fable role). Both scores logged; the LOWER of the two governs.

| # | Axis | Code | What 10/10 looks like | Automated signal |
|---|---|---|---|---|
| 1 | Clarity | CLA | Purpose of every element obvious in one glance | ambiguous labels, unlabeled controls |
| 2 | Hierarchy | HIE | Eye lands on the right thing first, every screen | heading order, size ratio ≥ 1.25 between levels |
| 3 | Contrast | CON | WCAG AA minimum everywhere, AAA on body copy | computed contrast ratios |
| 4 | Typography | TYP | ≤ 2 families, consistent scale, line-height 1.4–1.6 body | font count, line-height, measure ≤ 75ch |
| 5 | Spacing | SPA | Consistent rhythm, breathing room, no cramped clusters | spacing-scale variance |
| 6 | Color | COL | Palette ≤ 5 + neutrals, accent used with intent | distinct color count |
| 7 | Motion | MOT | Motion serves meaning; honors prefers-reduced-motion | reduced-motion handler present |
| 8 | Accessibility | ACC | Alt text, focus states, keyboard path, semantic HTML, lang tags | missing alt, missing lang, focusability |
| 9 | Copy | CPY | Passes all three Krug gate questions | krug-checker word/verb limits |
| 10 | Conversion | CVR | One primary CTA per view, friction-free path to action | CTA presence + count |
| 11 | Mobile | MOB | Flawless at 360px; touch targets ≥ 44px | viewport meta, media queries, target sizes |
| 12 | Performance | PRF | < 3s load on mobile 4G; assets lazy-loaded | total page weight, lazy attrs, external JS count |
| 13 | Trust | TRS | Real pricing, real contact, no dark patterns | pricing visible, no fake urgency strings |
| 14 | Delight | DLT | One memorable moment without hurting axes 1–13 | (model pass only) |

## Scoring protocol
1. `udec-scorer.js --target=<dir|file>` → per-axis heuristic scores + overall (mean, two decimals) → `udec-scores.json`.
2. Model review pass scores the same 14 axes from rendered output; disagreement > 1.5 on any axis → re-review.
3. Governing score = min(heuristic, model) per axis.
4. FAIL output must name: axis, element/file, specific fix. "Make it better" is not a finding.
5. Every run (pass or fail) appends one line to `_config/lessons.jsonl`.

## Blocks
- overall < 8.5 → BLOCK, return to stage 04 with fix list
- any axis < 7.0 → BLOCK
- ACC < 7.0 → IMMEDIATE BLOCK, logged as `krug_violation` lesson, cannot be waived by anyone including Bambu
