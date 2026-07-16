/* COSMOS Studio — GET /api/jobs/:id — the poll surface Hermes uses. */

'use strict';

const jobStore = require('../../shared/job-store');

function getJob(req, res) {
  const job = jobStore.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  // Hermes status vocabulary (hermes-AGENTS.md): one line each, no prose.
  res.json({
    id: job.id,
    state: job.state,
    workflow: job.workflow,
    market: job.market_id,
    cost_so_far: job.cost_so_far,
    quality_score: job.quality_score,
    blocking_on: job.blocking_on,
    events: job.events,
  });
}

module.exports = { getJob };
