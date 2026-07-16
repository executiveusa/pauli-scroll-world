# THE PAULI EFFECT — Full Operating Doctrine
<!-- Source doc for the compressed runtime version at _config/pauli-effect.md. -->
<!-- Agents load the COMPRESSED version. This full doc is for humans and for regenerating the compressed one. -->

## Why this exists

Agent context is the scarcest resource in the studio. Tokens spent re-reading files, re-discovering facts, or carrying dead context are tokens not spent on judgment. The Pauli Effect is one exclusion principle applied everywhere: **no two copies of the same information may occupy the context at once.** Read once, internalize, reference by name.

## The one loop

Every task, regardless of size, follows the same nine steps:

**INDEX → MAP → SEARCH → RETRIEVE → PLAN → EDIT → VERIFY → COMPRESS → HANDOFF**

1. **INDEX** — the repo is indexed (jCodeMunch) before any file is read. Indexing is cheap; blind reading is not.
2. **MAP** — build/refresh a mental map from the index: what lives where, which symbols matter for this task.
3. **SEARCH** — locate, don't browse. Symbol search before structural search before text search.
4. **RETRIEVE** — pull the minimum evidence that answers the question, at the smallest useful granularity (symbol > range > file).
5. **PLAN** — write the plan before touching code. A plan that fits in the task ledger is the right size.
6. **EDIT** — smallest correct change. Match surrounding idiom. No drive-by refactors.
7. **VERIFY** — run the thing. A change that wasn't executed wasn't verified.
8. **COMPRESS** — after verification, collapse working context into ledger facts. Prose out, facts in.
9. **HANDOFF** — write the handoff packet (format below) so the next session/agent starts warm.

## Retrieval order (cheapest first — stop the moment the question is answered)

1. Task ledger / current state
2. Repo map / graphify graph
3. Exact path lookup
4. jCodeMunch symbol search
5. ast-grep structural search
6. Text search with a narrow glob
7. Line range from a file
8. Full file — only when materially necessary
9. Broad exploration — last resort; state why before doing it

## Tool activation (load by trigger only)

Loading every skill into every stage is the most common context leak. The trigger table in `_config/pauli-effect.md` is exhaustive: if no trigger fires, no skill loads. New tools enter via `docs/agent-system/tool-registry.md` review, never ad hoc.

## Token budgets

Soft limits, enforced silently — exceed only with a stated reason in the ledger:

| Budget | Tokens |
|---|---|
| repo_map | 1500 |
| task_evidence | 3000 |
| code_per_step | 2500 |
| tool_output | 1500 |
| active_context | 12000 |
| verification | 2000 |
| response | 800 |
| handoff | 1200 |

## The ledger

`.pauli/context/task-ledger.md` is the single source of task truth. Updated after each phase (not each command). Fields: objective | criteria | files | symbols | facts | decisions | changed | tests | risks | next.

## Handoff packet (≤ 1200 tokens)

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

## Hard stops (halt, don't improvise)

- 3 identical failures → stop retrying, re-map the problem
- Secret value detected in code/env/log → HALT, rotate the secret before anything else
- Daily API spend > $50 → HALT, notify Bambu
- Single task > $10 → HALT, get approval first
- UDEC < 8.5 → do not deliver; iterate
- Payment > $500 → never auto-proceed; wait for Bambu's signal

## Compression rules

SAFE to compress: prose docs, research notes, logs, discussion, duplicate descriptions.
NEVER compress: source code under edit, acceptance criteria, security rules, secrets handling, schemas, migrations, API contracts, error messages, any MUST/NEVER/REQUIRED text.

## Telemetry

Every session appends to `.pauli/metrics/token-efficiency.jsonl`: `{ts, phase, files_written, retrieval_calls, budget_notes}`. The weekly self-improvement cron reads this alongside `_config/lessons.jsonl`.
