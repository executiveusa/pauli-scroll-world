/* ============================================================================
   COSMOS Studio — job store
   ----------------------------------------------------------------------------
   In-memory job registry with JSON snapshot persistence so a restart doesn't
   lose state. Swap for Redis in prod: keep this exact interface and back it
   with HSET/HGETALL — the server and stages only speak through these five
   functions.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SNAPSHOT = process.env.JOB_STORE_PATH || path.join(__dirname, '..', '.pauli', 'jobs.json');

const STATES = [
  'intake', 'awaiting_prd_approval', 'world_bible', 'generating', 'assembling',
  'quality', 'ready_for_review', 'packaging', 'delivered', 'blocked', 'failed',
];

const jobs = new Map();

function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
    for (const j of raw) jobs.set(j.id, j);
  } catch { /* first boot: no snapshot yet */ }
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
    fs.writeFileSync(SNAPSHOT, JSON.stringify([...jobs.values()], null, 2));
  } catch (e) { console.error('job-store: snapshot failed:', e.message); }
}

function create({ brief, workflow, market_id }) {
  const id = crypto.randomUUID();
  const job = {
    id, workflow, market_id,
    state: 'intake',
    brief,
    cost_so_far: 0,
    quality_score: null,
    blocking_on: null,
    events: [{ ts: new Date().toISOString(), state: 'intake' }],
    created_at: new Date().toISOString(),
  };
  jobs.set(id, job);
  persist();
  return job;
}

function get(id) { return jobs.get(id) || null; }

function update(id, patch) {
  const job = jobs.get(id);
  if (!job) return null;
  if (patch.state) {
    if (!STATES.includes(patch.state)) throw new Error(`job-store: invalid state "${patch.state}"`);
    job.events.push({ ts: new Date().toISOString(), state: patch.state });
  }
  Object.assign(job, patch);
  persist();
  return job;
}

function list() { return [...jobs.values()]; }

load();

module.exports = { create, get, update, list, STATES };
