/* ============================================================================
   COSMOS Studio — self-improvement loop (P1-C)
   ----------------------------------------------------------------------------
   Cron: every Sunday 03:00 UTC  →  `node shared/self-improve.js`
   (docker-compose wires this via the `cron` service; crontab: 0 3 * * 0)

   Reads the last 30 days of _config/lessons.jsonl, groups by lesson type,
   and PROPOSES specific _config edits as a diff. It never auto-applies —
   Bambu approves via POST /api/approve?type=config_improvement.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '..', '_config');
const LESSONS = path.join(CONFIG_DIR, 'lessons.jsonl');
const PROPOSALS_DIR = path.join(CONFIG_DIR, 'improvement-proposals');
const LESSON_TYPES = ['quality_fail', 'cost_spike', 'model_error', 'client_revision', 'krug_violation'];
const WINDOW_DAYS = 30;

function readRecentLessons() {
  let lines = [];
  try { lines = fs.readFileSync(LESSONS, 'utf8').split('\n').filter(Boolean); } catch { return []; }
  const cutoff = Date.now() - WINDOW_DAYS * 86400000;
  return lines
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(l => l && new Date(l.ts).getTime() >= cutoff);
}

function groupByType(lessons) {
  const groups = Object.fromEntries(LESSON_TYPES.map(t => [t, []]));
  for (const l of lessons) (groups[l.type] || (groups.other = groups.other || [])).push(l);
  return groups;
}

/* Turn a lesson group into a concrete config-edit proposal. Heuristics are
   deliberately conservative: repeated evidence (≥3 similar lessons) before
   any proposal is emitted. */
function propose(groups) {
  const proposals = [];

  const axisFails = {};
  for (const l of groups.quality_fail) for (const ax of l.failing_axes || []) axisFails[ax] = (axisFails[ax] || 0) + 1;
  for (const [axis, n] of Object.entries(axisFails)) if (n >= 3) {
    proposals.push({
      target: '_config/udec-axes.md',
      change: `Axis ${axis} failed ${n}× in ${WINDOW_DAYS}d — add a pre-flight check for ${axis} to stage 04 assembly (catch before the quality gate).`,
    });
  }

  const spikes = groups.cost_spike;
  if (spikes.length >= 3) {
    const models = [...new Set(spikes.map(l => l.model).filter(Boolean))];
    proposals.push({
      target: 'shared/fal-client.js PRICES',
      change: `${spikes.length} cost spikes (models: ${models.join(', ') || 'unrecorded'}) — reconcile price table against invoices; consider defaulting drafts to the cheaper tier in model-router DOWNGRADE map.`,
    });
  }

  const errsByProvider = {};
  for (const l of groups.model_error) if (l.provider) errsByProvider[l.provider] = (errsByProvider[l.provider] || 0) + 1;
  for (const [provider, n] of Object.entries(errsByProvider)) if (n >= 3) {
    proposals.push({
      target: 'shared/model-router.js CATALOG',
      change: `Provider "${provider}" errored ${n}× — demote it below its fallback in every chain it appears in.`,
    });
  }

  if (groups.client_revision.length >= 3) {
    const stages = [...new Set(groups.client_revision.map(l => l.stage).filter(Boolean))];
    proposals.push({
      target: stages.length === 1 ? `stages/${stages[0]}/CONTEXT.md` : 'stages/*/CONTEXT.md',
      change: `${groups.client_revision.length} client revisions in ${WINDOW_DAYS}d (stages: ${stages.join(', ') || 'various'}) — tighten the affected stage's Process checklist with the recurring revision reason: ${summarizeReasons(groups.client_revision)}.`,
    });
  }

  if (groups.krug_violation.length >= 1) { // design-law violations propose at first occurrence
    proposals.push({
      target: '_config/krug-laws.md',
      change: `${groups.krug_violation.length} Krug/design-law violations — add the violated pattern(s) to krug-checker.js automated checks: ${summarizeReasons(groups.krug_violation)}.`,
    });
  }

  return proposals;
}

function summarizeReasons(lessons) {
  const reasons = lessons.map(l => l.reason || l.detail || '').filter(Boolean);
  return [...new Set(reasons)].slice(0, 3).join('; ') || 'see lesson entries';
}

async function notifyBambu(proposalPath, count) {
  if (!process.env.N8N_WEBHOOK_URL) {
    console.log(`[notify-bambu:stub] ${count} improvement proposal(s) → ${proposalPath}`); // STUB: replace with live call after .env is configured
    return;
  }
  await fetch(process.env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      channel: 'self-improve',
      message: `COSMOS weekly self-review: ${count} proposal(s). Approve via POST /api/approve?type=config_improvement`,
      proposalPath,
    }),
  });
}

async function run() {
  const lessons = readRecentLessons();
  const groups = groupByType(lessons);
  const proposals = propose(groups);
  const date = new Date().toISOString().slice(0, 10);
  const outPath = path.join(PROPOSALS_DIR, `${date}.md`);

  const md = [
    `# Improvement Proposals — ${date}`,
    ``,
    `Window: last ${WINDOW_DAYS} days · Lessons read: ${lessons.length}`,
    `Counts: ${LESSON_TYPES.map(t => `${t}=${groups[t].length}`).join(' | ')}`,
    ``,
    proposals.length ? `## Proposed edits (diff-style — NOT applied)` : `## No proposals this week — thresholds not met.`,
    ...proposals.map((p, i) => `\n### ${i + 1}. ${p.target}\n\`\`\`diff\n+ ${p.change}\n\`\`\``),
    ``,
    `_Approve via \`POST /api/approve?type=config_improvement&proposal=${date}\` (PAULI_API_KEY / Bambu only)._`,
  ].join('\n');

  fs.mkdirSync(PROPOSALS_DIR, { recursive: true });
  fs.writeFileSync(outPath, md);
  await notifyBambu(outPath, proposals.length);
  console.log(`self-improve: ${lessons.length} lessons → ${proposals.length} proposals → ${outPath}`);
  return { outPath, proposals };
}

if (require.main === module) run().catch(e => { console.error(e); process.exit(1); });

module.exports = { run, readRecentLessons, propose, LESSON_TYPES };
