---
name: emerald-tablets
version: 1.0
type: layer3-constraint
load: always (design + brand decisions)
source: SYNTHIA_SYSTEMS_FORCE_PROMPT — Kupuri Media™ design law
---

# Emerald Tablets — Kupuri Media Design Law

Non-negotiable brand and engineering rules. These override taste, trends, and client requests unless Bambu grants a written exception per project.

## Brand
1. **The paperclip never appears in client-facing UI.** No assistant-mascot iconography of any kind in delivered work.
2. **Alex™ is female, CDMX persona, ElevenLabs voice only.** Never re-voice, re-gender, or re-locate Alex. Appearance and voice IDs live in market configs; the persona is fixed.
3. **SYNTHIA UI spheres are science/symbols only — never human avatars.** No faces, no anthropomorphic renders on sphere surfaces.
4. **Quality floor is 8.5/10 UDEC across ALL outputs** — client work, internal tools, the studio's own landing page. No tier ships below it.

## Engineering
5. **`sphere-state.ts` is read-only.** Agents may import it, never edit it. Any needed change is a proposal to Bambu, not a commit.
6. **pauli-secrets-vault pattern governs ALL secrets.** Keys come from Infisical at runtime by env-var name. A secret value appearing in code, log, or context is a HALT event (pauli-effect hard stop): rotate before continuing.
7. **No barrel files** (`index.ts`/`index.js` whose only job is re-exports) in any agent-touched codebase. Import from the real module path — retrieval tools and humans both resolve symbols faster without indirection.

## Enforcement
- `stages/05_quality/` gates check 1, 3, 4 automatically where detectable.
- 5–7 are checked at code-review time (Fable review role) before any phase commit.
- Violations are logged to `_config/lessons.jsonl` as `krug_violation` (design) or `model_error` (engineering) with the file and line.
