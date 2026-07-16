# Stage 02 — World Bible (Layer 2 contract)

## Inputs
- Layer 4 (working): `../01_intake/output/prd.md` · `../01_intake/output/brief-validated.json`
- Layer 3 (reference): `../../_config/markets/{market_id}.md` · `../../_config/emerald-tablets.md`

## Process
1. Derive the **style preamble**: ONE sentence locked to brand palette + art direction (`style-preamble.js`). It is reused VERBATIM at the head of every scene prompt in stage 03 — this is what keeps scenes cohesive.
2. Propose 5–7 scene beats (`scene-planner.js`): each beat = `{id, name, eyebrow, headline, body, cta?}`. Copy obeys Krug limits (headline ≤ 9 words, body ≤ 30, CTA on the last beat only).
3. Identify workflow: `scroll-cinematic | ugc-ads | anime | documentary | faceless-youtube` (already routed at intake; confirm or correct with a stated reason).
4. For scroll-cinematic: choose camera architecture **A** (continuous forward flight) or **B** (dive + connector). Default B — it survives a failed connector (engine crossfades).
5. Write dive prompt + connector prompt for each scene pair (connector endpoints described as the neighboring scenes' actual first/last frames — seam-lock contract with stage 03).
6. Write `output/world-bible.md`. **This is an EDIT SURFACE**: Bambu/client can edit scenes, copy, and prompts before stage 03 runs. Plain markdown, human-editable (CLAUDE.md law 4).

## Outputs
- `output/world-bible.md` → full bible: preamble, beats, prompts, camera plan (edit surface)
- `output/scene-list.json` → machine-readable beats for stages 03/04
- `output/style-preamble.txt` → the one locked sentence
