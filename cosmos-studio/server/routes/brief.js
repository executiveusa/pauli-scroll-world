/* COSMOS Studio — POST /api/brief and POST /api/market/:market_id/brief
   Validates against stages/01_intake/brief-schema.json, detects market,
   routes workflow, creates the job. Stage 01 does the heavy lifting. */

'use strict';

const fs = require('fs');
const path = require('path');
const jobStore = require('../../shared/job-store');

const SCHEMA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'stages', '01_intake', 'brief-schema.json'), 'utf8'));
const MARKETS_DIR = path.join(__dirname, '..', '..', '_config', 'markets');

// Workflow routing table — mirror of docs/agent-system/hermes-AGENTS.md
const WORKFLOW_KEYWORDS = [
  { workflow: 'scroll-cinematic', words: ['landing page', 'website', 'brand site', 'web'] },
  { workflow: 'ugc-ads', words: ['ugc', 'ad', 'ads', 'social media', 'tiktok', 'reels'] },
  { workflow: 'anime-dag', words: ['anime', 'cartoon', 'animation'] },
  { workflow: 'documentary', words: ['documentary', 'film', 'real footage'] },
  { workflow: 'faceless-youtube', words: ['youtube', 'faceless', 'channel'] },
];

function validateBrief(body) {
  const missing = SCHEMA.required.filter(f => body[f] == null || body[f] === '');
  if (missing.length) return { ok: false, error: `missing required field(s): ${missing.join(', ')}` };
  for (const [field, spec] of Object.entries(SCHEMA.properties)) {
    if (body[field] == null) continue;
    const t = Array.isArray(body[field]) ? 'array' : typeof body[field];
    if (spec.type && spec.type !== t) return { ok: false, error: `field "${field}" must be ${spec.type}, got ${t}` };
    if (spec.enum && !spec.enum.includes(body[field])) return { ok: false, error: `field "${field}" must be one of: ${spec.enum.join(', ')}` };
  }
  return { ok: true };
}

function detectMarket(body, req) {
  if (body.market_id && fs.existsSync(path.join(MARKETS_DIR, `${body.market_id}.md`))) return body.market_id;
  const lang = (req.get('accept-language') || '').toLowerCase();
  if (lang.startsWith('es-mx')) return 'mexico';
  if (lang.startsWith('es-pr')) return 'puerto-rico';
  if (lang.startsWith('es')) return 'spain';
  if (lang.startsWith('sr') || lang.startsWith('bs') || lang.startsWith('hr')) return 'serbia-balkans';
  return 'us-en'; // default; assumption recorded on the job
}

function detectWorkflow(body) {
  if (body.workflow) return body.workflow;
  const text = `${body.pitch || ''} ${(body.add_ons || []).join(' ')}`.toLowerCase();
  for (const { workflow, words } of WORKFLOW_KEYWORDS) {
    if (words.some(w => text.includes(w))) return workflow;
  }
  return 'scroll-cinematic';
}

function createJob(body, req, forcedMarket) {
  const valid = validateBrief(body);
  if (!valid.ok) return { status: 400, payload: { error: valid.error } };
  const market_id = forcedMarket || detectMarket(body, req);
  const workflow = detectWorkflow(body);
  const job = jobStore.create({ brief: body, workflow, market_id });
  if (!forcedMarket && !body.market_id) {
    jobStore.update(job.id, { assumptions: [`market defaulted to ${market_id} (no market_id in brief)`] });
  }
  // Stage 01 runs next: PRD generation then HALT at awaiting_prd_approval.
  jobStore.update(job.id, { state: 'awaiting_prd_approval', blocking_on: 'bambu:prd' });
  return { status: 202, payload: { job_id: job.id, state: 'awaiting_prd_approval', workflow, market_id } };
}

function postBrief(req, res) {
  const { status, payload } = createJob(req.body || {}, req, null);
  res.status(status).json(payload);
}

function postMarketBrief(req, res) {
  const market = req.params.market_id;
  if (!fs.existsSync(path.join(MARKETS_DIR, `${market}.md`))) {
    return res.status(404).json({ error: `unknown market "${market}"` });
  }
  const { status, payload } = createJob(req.body || {}, req, market);
  res.status(status).json(payload);
}

module.exports = { postBrief, postMarketBrief, validateBrief, detectMarket, detectWorkflow };
