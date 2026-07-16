/* COSMOS Studio — POST /api/approve  (BAMBU ONLY — PAULI_API_KEY)
   Approval types:
     prd                → releases stage 02 for a job (body: {job_id})
     final_delivery     → releases packaging/delivery (body: {job_id})
     config_improvement → accepts a weekly self-improve proposal (query: proposal=YYYY-MM-DD)
   Hermes holds HERMES_API_KEY only, so it cannot reach this route. */

'use strict';

const fs = require('fs');
const path = require('path');
const jobStore = require('../../shared/job-store');

const PROPOSALS_DIR = path.join(__dirname, '..', '..', '_config', 'improvement-proposals');

function postApprove(req, res) {
  const type = req.query.type || req.body?.type;

  if (type === 'prd') {
    const job = jobStore.get(req.body?.job_id);
    if (!job) return res.status(404).json({ error: 'job not found' });
    if (job.state !== 'awaiting_prd_approval') return res.status(409).json({ error: `job is in state "${job.state}", not awaiting_prd_approval` });
    jobStore.update(job.id, { state: 'world_bible', blocking_on: null });
    return res.json({ ok: true, job_id: job.id, state: 'world_bible' });
  }

  if (type === 'final_delivery') {
    const job = jobStore.get(req.body?.job_id);
    if (!job) return res.status(404).json({ error: 'job not found' });
    if (job.state !== 'ready_for_review') return res.status(409).json({ error: `job is in state "${job.state}", not ready_for_review` });
    jobStore.update(job.id, { state: 'packaging', blocking_on: null });
    return res.json({ ok: true, job_id: job.id, state: 'packaging' });
  }

  if (type === 'config_improvement') {
    const proposal = req.query.proposal || req.body?.proposal;
    const file = path.join(PROPOSALS_DIR, `${proposal}.md`);
    if (!proposal || !fs.existsSync(file)) return res.status(404).json({ error: `proposal "${proposal}" not found` });
    // Approval marks the proposal; a human (or a supervised agent run) applies the
    // diff — self-improve never auto-applies, and neither does this endpoint.
    fs.appendFileSync(file, `\n\n---\nAPPROVED by Bambu at ${new Date().toISOString()} — apply manually or via supervised agent run.\n`);
    return res.json({ ok: true, proposal, note: 'marked approved; apply is a separate supervised step' });
  }

  res.status(400).json({ error: 'type must be prd | final_delivery | config_improvement' });
}

module.exports = { postApprove };
