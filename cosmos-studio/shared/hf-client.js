/* ============================================================================
   COSMOS Studio — Hugging Face fallback client
   ----------------------------------------------------------------------------
   Used when fal.ai fails or the budget is exceeded (model-router downgrades
   here). HF_TOKEN from Infisical. Inference API models can be cold — we retry
   through the 503 warm-up window instead of failing the pipeline.
   ========================================================================== */

'use strict';

const HF_BASE = 'https://api-inference.huggingface.co/models';

/**
 * Generate an image (or warm-video-model output) via the HF Inference API.
 * Returns { buffer, contentType, model, stub? }. Stubs when HF_TOKEN is unset.
 */
async function generate(model, inputs, { parameters = {}, maxWarmupRetries = 4 } = {}) {
  if (!process.env.HF_TOKEN) {
    // STUB: replace with live call after .env is configured
    return {
      buffer: Buffer.from('stub-image-bytes'),
      contentType: 'image/webp',
      model, stub: true,
      note: 'HF_TOKEN not set — returned mock bytes',
    };
  }

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${HF_BASE}/${model}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.HF_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ inputs, parameters }),
    });
    if (res.status === 503 && attempt < maxWarmupRetries) {
      // Model is cold-loading; HF reports estimated_time. Wait it out (cap 60s).
      const body = await res.json().catch(() => ({}));
      const waitS = Math.min(Number(body.estimated_time) || 20, 60);
      await new Promise(r => setTimeout(r, waitS * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`HF ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return {
      buffer: Buffer.from(await res.arrayBuffer()),
      contentType: res.headers.get('content-type') || 'application/octet-stream',
      model,
    };
  }
}

module.exports = { generate };
