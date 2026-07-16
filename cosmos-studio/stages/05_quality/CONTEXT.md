# Stage 05 — Quality Gate (Layer 2 contract)

## Inputs
- Layer 4 (working): `../04_assemble/output/deliverable/`
- Layer 3 (reference): `../../_config/krug-laws.md` · `../../_config/udec-axes.md` · `../../_config/emerald-tablets.md`

## Process
1. Run `krug-checker.js --target=<deliverable>` — automated audit of every user-facing text element (word limits, verb CTAs, ambiguous links, unlabeled controls).
2. Run `udec-scorer.js --target=<deliverable>` — heuristic scores for all 14 axes; a model review pass scores the same axes; the LOWER governs.
3. ANY axis < 7.0 → **BLOCK**: write the specific failure (axis, element/file, fix) to the report, return the job to stage 04. ACC < 7.0 blocks unconditionally.
4. Overall < 8.5 → **BLOCK**: write improvement tasks, return to stage 04.
5. Overall ≥ 8.5 and all axes ≥ 7.0 → write **PASS** to `output/quality-report.md`, set job `quality_score`, state → `ready_for_review`.
6. Log a lesson either way: append `{ts, type: quality_fail|quality_pass, job, scores, failing_axes[], reason}` to `../../_config/lessons.jsonl`.

"Make it better" is not a finding. Every FAIL line names the axis, the element, and the fix.

## Outputs
- `output/quality-report.md` → PASS, or FAIL + specific fixes
- `output/udec-scores.json` → per-axis scores + overall
