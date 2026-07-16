/* ============================================================================
   COSMOS Studio — REST API (P1-D)
   ----------------------------------------------------------------------------
   The surface Hermes calls. Express, no other framework.

   Auth model:
     HERMES_API_KEY → brief intake, job polling, metrics
     PAULI_API_KEY  → /api/approve ONLY (Bambu). Hermes never holds this key,
                      so it structurally cannot approve.
     Payment webhook → provider signature verification (no API key).
   ========================================================================== */

'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const jobStore = require('../shared/job-store');
const licenseLock = require('../shared/payment/license-lock');
const { verifyWebhook } = require('../shared/payment/stripe');
const { notifyBambu } = require('../shared/payment/lightning');

const briefRoute = require('./routes/brief');
const jobsRoute = require('./routes/jobs');
const approveRoute = require('./routes/approve');

const app = express();

// Raw body ONLY for the payment webhook (signature is computed over raw bytes).
app.use('/api/webhooks/payment', express.raw({ type: '*/*' }));
app.use(express.json({ limit: '1mb' }));

// ---- auth middlewares -------------------------------------------------------
function requireKey(envName) {
  return (req, res, next) => {
    const expected = process.env[envName];
    if (!expected) {
      // Dev without keys: allow, but tag the response so it can't be mistaken for prod.
      res.set('x-cosmos-auth', `stub:${envName} not set`); // STUB: replace with live call after .env is configured
      return next();
    }
    const got = req.get('authorization')?.replace(/^Bearer\s+/i, '') || req.get('x-api-key');
    if (got !== expected) return res.status(401).json({ error: `unauthorized (${envName} required)` });
    next();
  };
}
const hermesAuth = requireKey('HERMES_API_KEY');
const pauliAuth = requireKey('PAULI_API_KEY');

// ---- license enforcement on generation-triggering routes --------------------
app.use(['/api/brief', '/api/market'], (req, res, next) => {
  const { mode, reason } = licenseLock.enforce();
  if (mode === 'read_only') return res.status(402).json({ error: 'license suspended — read-only mode', reason });
  next();
});

// ---- routes -----------------------------------------------------------------
app.post('/api/brief', hermesAuth, briefRoute.postBrief);
app.post('/api/market/:market_id/brief', hermesAuth, briefRoute.postMarketBrief);
app.get('/api/jobs/:id', hermesAuth, jobsRoute.getJob);
app.post('/api/approve', pauliAuth, approveRoute.postApprove);

app.get('/api/metrics', hermesAuth, (req, res) => {
  const jobs = jobStore.list();
  let lessonCount = 0;
  try { lessonCount = fs.readFileSync(path.join(__dirname, '..', '_config', 'lessons.jsonl'), 'utf8').split('\n').filter(Boolean).length; } catch {}
  let tokenTelemetry = [];
  try {
    tokenTelemetry = fs.readFileSync(path.join(__dirname, '..', '.pauli', 'metrics', 'token-efficiency.jsonl'), 'utf8')
      .split('\n').filter(Boolean).slice(-20).map(JSON.parse);
  } catch {}
  res.json({
    jobs: { total: jobs.length, by_state: jobs.reduce((m, j) => (m[j.state] = (m[j.state] || 0) + 1, m), {}) },
    spend_usd: +jobs.reduce((s, j) => s + (j.cost_so_far || 0), 0).toFixed(2),
    quality_scores: jobs.filter(j => j.quality_score != null).map(j => ({ id: j.id, score: j.quality_score })),
    lesson_count: lessonCount,
    token_telemetry_tail: tokenTelemetry,
  });
});

// Payment webhook: Stripe/Creem (Lightning settlements are polled by the LN
// service and POSTed here in the same normalized shape with an HMAC header).
app.post('/api/webhooks/payment', async (req, res) => {
  const raw = req.body.toString('utf8');
  const check = verifyWebhook(raw, req.headers);
  if (!check.ok) return res.status(400).json({ error: check.reason });
  const evt = check.event;
  if (evt.type === 'payment_succeeded' && evt.installment) {
    const result = licenseLock.recordPayment({ installment: evt.installment });
    if (evt.jobId) jobStore.update(evt.jobId, { last_payment: evt });
    await notifyBambu(
      result.fullyOwned
        ? `Job ${evt.jobId}: final payment received — permanent unlock key released. Client fully owns the system.`
        : `Job ${evt.jobId}: installment ${evt.installment} received — key for this period released (${result.license.paid_pct}% paid).`,
      { jobId: evt.jobId }
    );
    return res.json({ received: true, paid_pct: result.license.paid_pct });
  }
  res.json({ received: true, ignored: evt.type });
});

app.get('/healthz', (req, res) => res.json({ ok: true, service: 'cosmos-studio', ts: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`COSMOS Studio API listening on :${PORT}`));
}

module.exports = app;
