/* ============================================================================
   COSMOS Studio — fal.ai adapter
   ----------------------------------------------------------------------------
   Pay-per-call client. FAL_KEY comes from Infisical at runtime (never inline).
   Every generation MUST go through estimate() first — cost-guard enforces the
   $10/task and $50/day circuit breakers on the numbers this returns.
   ========================================================================== */

'use strict';

const FAL_BASE = 'https://fal.run';

// Per-generation cost table (USD). Budgeting figures — reconciled against
// fal.ai invoices monthly; drift > 20% is a `cost_spike` lesson.
const PRICES = {
  'fal-ai/flux-pro/v1.1-ultra': 0.06,
  'fal-ai/bytedance/seedance-2.0-mini': 0.15,
  'fal-ai/bytedance/seedance-2.0': 0.60,
  'fal-ai/bytedance/seedance-2.0/reference-to-video': 0.75,
};

/** Dry-run cost estimate. Always call before generate(). */
function estimate(model, count = 1) {
  const unit = PRICES[model];
  if (unit == null) throw new Error(`fal-client: unknown model "${model}" — add it to PRICES before calling`);
  return { model, count, unitCost: unit, totalCost: +(unit * count).toFixed(2) };
}

/**
 * Run a generation. Returns { url, model, cost, durationMs, stub? }.
 * Without FAL_KEY this returns a labeled stub so pipelines keep flowing in dev.
 */
async function generate(model, input, { timeoutMs = 300000 } = {}) {
  const est = estimate(model, 1);
  const started = Date.now();

  if (!process.env.FAL_KEY) {
    // STUB: replace with live call after .env is configured
    return {
      url: `https://example.invalid/stub/${encodeURIComponent(model)}/${Date.now()}.${model.includes('flux') ? 'webp' : 'mp4'}`,
      model, cost: est.totalCost, durationMs: 0, stub: true,
      note: 'FAL_KEY not set — returned mock asset URL',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${FAL_BASE}/${model}`, {
      method: 'POST',
      headers: { authorization: `Key ${process.env.FAL_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`fal.ai ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const url = data.video?.url || data.images?.[0]?.url || data.image?.url || data.url;
    if (!url) throw new Error('fal.ai response contained no asset URL');
    return { url, model, cost: est.totalCost, durationMs: Date.now() - started, raw: data };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { estimate, generate, PRICES };
