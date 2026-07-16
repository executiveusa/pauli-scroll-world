---
name: pauli-effect
version: 1.0
type: layer3-constraint
load: always
tokens: ~400
source: THE PAULI EFFECT (full doc in docs/agent-system/pauli-effect-full.md)
---

# Pauli Effect — Compressed Runtime Constraints

## The one loop (internalize, never re-read)
INDEX→MAP→SEARCH→RETRIEVE→PLAN→EDIT→VERIFY→COMPRESS→HANDOFF

## Retrieval order (cheapest first — stop when answered)
1. task ledger / current state
2. repo map / graphify graph
3. exact path lookup
4. jCodeMunch symbol search
5. ast-grep structural search
6. text search (narrow glob)
7. line range from file
8. full file (only if materially necessary)
9. broad exploration (last resort, state why)

## Tool activation table (load by trigger only — never load all)
| Trigger | Load |
|---|---|
| UI / design / frontend | taste-skill + uncodixfy + native-feel |
| Marketing / editorial copy | no-ai-slop-writing-rules |
| Animation / motion | GSAP + cinematic-site-components |
| Video scrub / scroll | scroll-world + hyperframes-helper |
| Social content / UGC | agent-media |
| Browser validation | browser-harness |
| E2E product flow | e2e-harness |
| 3D / Blender | blender-mcp + dreamcraft3d |
| Agent-to-agent | A2A protocol |
| Large repo scan | jcodemunch (before reading >20 files) |
| fal.ai generation | pauli-fal-ai (dry-run first, paid gate) |
| Sandcastle task | sandcastle-worker (all code changes) |

## Token budgets (soft limits — expand only with stated reason)
repo_map:1500 | evidence:3000 | code_per_step:2500 | tool_output:1500
active_context:12000 | verification:2000 | response:800 | handoff:1200

## Ledger location
`.pauli/context/task-ledger.md` — update after each phase, not every command.
Fields: objective | criteria | files | symbols | facts | decisions | changed | tests | risks | next

## Handoff format (max 1200 tokens)
```yaml
objective: 
status: 
criteria: 
facts: 
decisions: 
changed_files: 
tests: 
risks: 
next_action: 
symbols: 
```

## Hard stops
- 3 identical failures → re-map, do not retry
- Secret detected in code/env → HALT, rotate before continuing
- Daily API spend >$50 → HALT, notify Bambu
- Single task >$10 → HALT, get approval
- Quality score <8.5 UDEC → do not deliver, iterate
- Over $500 payment → do not auto-proceed, wait for Bambu signal

## Compression rules
SAFE to compress: prose docs, research, logs, discussion, duplicate descriptions
NEVER compress: source code being edited | acceptance criteria | security rules |
  secrets | schemas | migrations | API contracts | error messages | MUST/NEVER/REQUIRED text
