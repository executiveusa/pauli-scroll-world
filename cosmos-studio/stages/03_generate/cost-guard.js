/* ============================================================================
   COSMOS Studio — stage 03: cost guard (circuit breaker)
   ----------------------------------------------------------------------------
   Enforces the pauli-effect hard stops:
     single task  > $10 → HALT, needs Bambu approval
     daily spend  > $50 → HALT, notify Bambu, no override
   State: output/cost-ledger.jsonl (one line per charge). fal-pipeline.sh calls
     node cost-guard.js check <estimatedUsd>   → exit 0 ok | exit 2 task gate | exit 3 daily gate
     node cost-guard.js record <usd> <model> <scene>
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const TASK_LIMIT_USD = 10;
const DAILY_LIMIT_USD = 50;
const LEDGER = process.env.COST_LEDGER_PATH || path.join(__dirname, 'output', 'cost-ledger.jsonl');

function readLedger() {
  try { return fs.readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean).map(JSON.parse); }
  catch { return []; }
}

function spentToday() {
  const today = new Date().toISOString().slice(0, 10);
  return readLedger().filter(e => e.ts.slice(0, 10) === today).reduce((s, e) => s + e.usd, 0);
}

function check(estimatedUsd) {
  const daily = spentToday();
  if (daily + estimatedUsd > DAILY_LIMIT_USD) {
    return { ok: false, gate: 'daily', message: `HALT: $${(daily + estimatedUsd).toFixed(2)} would exceed the $${DAILY_LIMIT_USD}/day limit (spent today: $${daily.toFixed(2)}). Notify Bambu; no override.` };
  }
  if (estimatedUsd > TASK_LIMIT_USD) {
    return { ok: false, gate: 'task', message: `HALT: task estimate $${estimatedUsd.toFixed(2)} exceeds $${TASK_LIMIT_USD}/task. Await Bambu approval (POST /api/approve).` };
  }
  return { ok: true, dailySpent: daily };
}

function record(usd, model, scene) {
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  const entry = { ts: new Date().toISOString(), usd: +usd, model, scene };
  fs.appendFileSync(LEDGER, JSON.stringify(entry) + '\n');
  return entry;
}

if (require.main === module) {
  const [cmd, a, b, c] = process.argv.slice(2);
  if (cmd === 'check') {
    const r = check(parseFloat(a));
    console.log(r.ok ? `OK (today: $${r.dailySpent.toFixed(2)})` : r.message);
    process.exit(r.ok ? 0 : r.gate === 'task' ? 2 : 3);
  } else if (cmd === 'record') {
    console.log(JSON.stringify(record(parseFloat(a), b, c)));
  } else {
    console.error('usage: cost-guard.js check <usd> | record <usd> <model> <scene>');
    process.exit(1);
  }
}

module.exports = { check, record, spentToday, TASK_LIMIT_USD, DAILY_LIMIT_USD };
