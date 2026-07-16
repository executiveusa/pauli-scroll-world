/* ============================================================================
   COSMOS Studio — model router (P1-A)
   ----------------------------------------------------------------------------
   LiteLLM/OpenRouter-style smart switcher. Single entry point for EVERY model
   call in the studio — nothing else may hardcode a model name (emerald-tablets
   law: routing goes through routeModel(), always).

   Routing law (CLAUDE.md law 9):
     Fable 5  → plan / review / quality-gate analysis
     Grok     → primary build model (cost-efficient)
     Haiku    → QA, repetitive tasks, translation, captions
     FLUX.1-dev (HF)        → image fallback when fal.ai fails / budget exceeded
     Seedance 2.0 Mini      → draft/previz video (~25% of standard cost)
     Seedance 2.0 Standard  → production video

   Auto-switch triggers:
     API error       → next provider in the chain
     cost threshold  → downgrade tier
     quality fail    → upgrade tier
   ========================================================================== */

'use strict';

// $ per unit: text models per 1K output tokens (blended), media per generation.
// Estimates for budgeting/circuit-breaking only — cost-guard reconciles actuals.
const CATALOG = {
  plan:    [
    { provider: 'muapi',      model: 'claude-fable-5',            endpoint: 'https://api.muapi.ai/v1/chat/completions', keyEnv: 'MUAPI_KEY',         cost: 0.060 },
    { provider: 'anthropic',  model: 'claude-fable-5',            endpoint: 'https://api.anthropic.com/v1/messages',    keyEnv: 'ANTHROPIC_API_KEY', cost: 0.075 },
  ],
  review:  [
    { provider: 'muapi',      model: 'claude-fable-5',            endpoint: 'https://api.muapi.ai/v1/chat/completions', keyEnv: 'MUAPI_KEY',         cost: 0.060 },
    { provider: 'anthropic',  model: 'claude-fable-5',            endpoint: 'https://api.anthropic.com/v1/messages',    keyEnv: 'ANTHROPIC_API_KEY', cost: 0.075 },
  ],
  build:   [
    { provider: 'openrouter', model: 'x-ai/grok-beta',            endpoint: 'https://openrouter.ai/api/v1/chat/completions', keyEnv: 'OPENROUTER_API_KEY', cost: 0.015 },
    { provider: 'grok',       model: 'grok-beta',                 endpoint: 'https://api.x.ai/v1/chat/completions',     keyEnv: 'GROK_API_KEY',      cost: 0.015 },
    { provider: 'anthropic',  model: 'claude-sonnet-5',           endpoint: 'https://api.anthropic.com/v1/messages',    keyEnv: 'ANTHROPIC_API_KEY', cost: 0.015 },
  ],
  qa:      [
    { provider: 'anthropic',  model: 'claude-haiku-4-5-20251001', endpoint: 'https://api.anthropic.com/v1/messages',    keyEnv: 'ANTHROPIC_API_KEY', cost: 0.005 },
    { provider: 'openrouter', model: 'anthropic/claude-haiku-4.5', endpoint: 'https://openrouter.ai/api/v1/chat/completions', keyEnv: 'OPENROUTER_API_KEY', cost: 0.005 },
  ],
  image:   [
    { provider: 'fal',        model: 'fal-ai/flux-pro/v1.1-ultra', endpoint: 'https://fal.run/fal-ai/flux-pro/v1.1-ultra', keyEnv: 'FAL_KEY',  cost: 0.06 },
    { provider: 'hf',         model: 'black-forest-labs/FLUX.1-dev', endpoint: 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev', keyEnv: 'HF_TOKEN', cost: 0.01 },
  ],
  video_draft: [
    { provider: 'fal',        model: 'fal-ai/bytedance/seedance-2.0-mini', endpoint: 'https://fal.run/fal-ai/bytedance/seedance-2.0-mini', keyEnv: 'FAL_KEY', cost: 0.15 },
    { provider: 'hf',         model: 'THUDM/CogVideoX-5b',        endpoint: 'https://api-inference.huggingface.co/models/THUDM/CogVideoX-5b', keyEnv: 'HF_TOKEN', cost: 0.05 },
  ],
  video_final: [
    { provider: 'fal',        model: 'fal-ai/bytedance/seedance-2.0', endpoint: 'https://fal.run/fal-ai/bytedance/seedance-2.0', keyEnv: 'FAL_KEY',  cost: 0.60 },
    { provider: 'muapi',      model: 'seedance-2.5',              endpoint: 'https://api.muapi.ai/v1/video',            keyEnv: 'MUAPI_KEY',         cost: 0.70 },
  ],
};

// taskType aliases so callers can speak in pipeline vocabulary
const ALIASES = {
  planning: 'plan', quality_gate: 'review', code: 'build', translation: 'qa',
  captions: 'qa', still: 'image', previz: 'video_draft', production_video: 'video_final',
};

// Tiers a taskType may downgrade to when budget is tight / upgrade to on quality fail
const DOWNGRADE = { plan: 'qa', review: 'qa', build: 'qa', video_final: 'video_draft', image: 'image' };
const UPGRADE   = { qa: 'build', build: 'plan', video_draft: 'video_final' };

/**
 * Pick the model for a task.
 * @param {string} taskType         plan|review|build|qa|image|video_draft|video_final (or alias)
 * @param {number} budgetRemaining  dollars left for this job (from cost-guard)
 * @param {number} qualityRequired  0..10 — the UDEC bar this output must clear
 * @param {object} [opts]           { failedProviders: [], lastQualityScore: null }
 * @returns {{provider, model, endpoint, keyEnv, costEstimate, tier, reason}}
 */
function routeModel(taskType, budgetRemaining, qualityRequired, opts = {}) {
  let tier = ALIASES[taskType] || taskType;
  if (!CATALOG[tier]) throw new Error(`routeModel: unknown taskType "${taskType}"`);
  const failed = new Set(opts.failedProviders || []);
  let reason = 'primary route';

  // quality fail → upgrade (e.g. a build that keeps failing review escalates to plan-tier)
  if (opts.lastQualityScore != null && opts.lastQualityScore < qualityRequired && UPGRADE[tier]) {
    tier = UPGRADE[tier];
    reason = `quality ${opts.lastQualityScore} < required ${qualityRequired} → upgraded tier`;
  }

  // cost threshold → downgrade (keep 20% headroom; never route a call we can't afford)
  let chain = CATALOG[tier];
  if (budgetRemaining != null && chain[0].cost > budgetRemaining * 0.8 && DOWNGRADE[tier] && DOWNGRADE[tier] !== tier) {
    tier = DOWNGRADE[tier];
    chain = CATALOG[tier];
    reason = `cost ${CATALOG[tier][0].cost} vs budget ${budgetRemaining} → downgraded tier`;
  }

  // API error → next provider: skip providers the caller reports as failed
  for (const route of chain) {
    if (failed.has(route.provider)) continue;
    if (!process.env[route.keyEnv]) continue;             // no key, no call — try the next provider
    return { ...route, costEstimate: route.cost, tier, reason };
  }

  // Nothing configured/alive: return the head of the chain as a dry-run route so
  // callers can still cost-estimate and report exactly which key is missing.
  const head = chain.find(r => !failed.has(r.provider)) || chain[0];
  return { ...head, costEstimate: head.cost, tier, reason: `no live provider (set ${head.keyEnv}) — dry-run route`, dryRun: true };
}

/** Chat-completion convenience over the routed provider. */
async function callModel(taskType, messages, { budgetRemaining = 10, qualityRequired = 8.5, ...opts } = {}) {
  const route = routeModel(taskType, budgetRemaining, qualityRequired, opts);
  if (route.dryRun) {
    // STUB: replace with live call after .env is configured
    return { route, text: `[stub:${route.model}] ${String(messages[messages.length - 1]?.content || '').slice(0, 80)}…`, stub: true };
  }
  const isAnthropic = route.provider === 'anthropic';
  const res = await fetch(route.endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(isAnthropic
        ? { 'x-api-key': process.env[route.keyEnv], 'anthropic-version': '2023-06-01' }
        : { authorization: `Bearer ${process.env[route.keyEnv]}` }),
    },
    body: JSON.stringify(isAnthropic
      ? { model: route.model, max_tokens: 4096, messages }
      : { model: route.model, messages }),
  });
  if (!res.ok) {
    const err = new Error(`${route.provider} ${res.status}`);
    err.provider = route.provider;
    throw err; // caller adds provider to failedProviders and re-routes
  }
  const data = await res.json();
  const text = isAnthropic ? data.content?.[0]?.text : data.choices?.[0]?.message?.content;
  return { route, text, usage: data.usage || null };
}

module.exports = { routeModel, callModel, CATALOG };
