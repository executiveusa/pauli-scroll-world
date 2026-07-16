/* ============================================================================
   COSMOS Studio — Stripe + Creem.io dual payment handler (P1-B)
   ----------------------------------------------------------------------------
   Primary: Stripe. Alternative: Creem.io (no monthly fee) — same interface.
   Provider chosen per call; on Stripe failure we fail over to Creem when it's
   configured. Amounts are integer cents. Webhook verification lives here so
   server/routes never touches raw signatures.
   ========================================================================== */

'use strict';

const crypto = require('crypto');

const STRIPE_BASE = 'https://api.stripe.com/v1';
const CREEM_BASE = 'https://api.creem.io/v1';

function pickProvider(preferred) {
  if (preferred === 'creem' && process.env.CREEM_API_KEY) return 'creem';
  if (process.env.STRIPE_SECRET_KEY) return 'stripe';
  if (process.env.CREEM_API_KEY) return 'creem';
  return null;
}

/**
 * Create a checkout link for one payment-plan installment (or the down payment).
 * @param {object} p { amountCents, currency, description, jobId, installment, successUrl, cancelUrl }
 * @returns {{provider, url, sessionId, stub?}}
 */
async function createCheckout(p, preferred) {
  const provider = pickProvider(preferred);
  if (!provider) {
    // STUB: replace with live call after .env is configured
    return {
      provider: 'stub', stub: true,
      url: `https://example.invalid/checkout/${p.jobId}/${p.installment}`,
      sessionId: `stub_${crypto.randomUUID()}`,
      note: 'STRIPE_SECRET_KEY / CREEM_API_KEY not set — returned mock checkout link',
    };
  }

  if (provider === 'stripe') {
    const body = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price_data][currency]': p.currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(p.amountCents),
      'line_items[0][price_data][product_data][name]': p.description,
      'line_items[0][quantity]': '1',
      'metadata[job_id]': p.jobId,
      'metadata[installment]': String(p.installment),
      success_url: p.successUrl,
      cancel_url: p.cancelUrl,
    });
    const res = await fetch(`${STRIPE_BASE}/checkout/sessions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      if (process.env.CREEM_API_KEY) return createCheckout(p, 'creem'); // fail over
      throw new Error(`stripe ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const s = await res.json();
    return { provider: 'stripe', url: s.url, sessionId: s.id };
  }

  // creem
  const res = await fetch(`${CREEM_BASE}/checkouts`, {
    method: 'POST',
    headers: { 'x-api-key': process.env.CREEM_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      amount: p.amountCents, currency: p.currency,
      product_name: p.description,
      metadata: { job_id: p.jobId, installment: p.installment },
      success_url: p.successUrl, cancel_url: p.cancelUrl,
    }),
  });
  if (!res.ok) throw new Error(`creem ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const c = await res.json();
  return { provider: 'creem', url: c.checkout_url || c.url, sessionId: c.id };
}

/**
 * Verify a payment webhook and normalize the event.
 * Returns { ok, event: {type, jobId, installment, amountCents} } or { ok:false }.
 */
function verifyWebhook(rawBody, headers) {
  const sig = headers['stripe-signature'];
  if (sig && process.env.STRIPE_WEBHOOK_SECRET) {
    // Stripe signature scheme: t=<ts>,v1=<hmac-sha256(ts + '.' + body)>
    const parts = Object.fromEntries(sig.split(',').map(kv => kv.split('=')));
    const expected = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
      .update(`${parts.t}.${rawBody}`).digest('hex');
    let match = false;
    try { match = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1 || '')); } catch { match = false; }
    if (!match) return { ok: false, reason: 'bad stripe signature' };
    const evt = JSON.parse(rawBody);
    const meta = evt.data?.object?.metadata || {};
    return {
      ok: true,
      event: {
        type: evt.type === 'checkout.session.completed' ? 'payment_succeeded' : evt.type,
        jobId: meta.job_id, installment: Number(meta.installment),
        amountCents: evt.data?.object?.amount_total,
        provider: 'stripe',
      },
    };
  }
  if (headers['creem-signature'] && process.env.CREEM_API_KEY) {
    const expected = crypto.createHmac('sha256', process.env.CREEM_API_KEY).update(rawBody).digest('hex');
    let match = false;
    try { match = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(headers['creem-signature'])); } catch { match = false; }
    if (!match) return { ok: false, reason: 'bad creem signature' };
    const evt = JSON.parse(rawBody);
    return {
      ok: true,
      event: {
        type: evt.event === 'checkout.completed' ? 'payment_succeeded' : evt.event,
        jobId: evt.metadata?.job_id, installment: Number(evt.metadata?.installment),
        amountCents: evt.amount, provider: 'creem',
      },
    };
  }
  return { ok: false, reason: 'no verifiable signature' };
}

module.exports = { createCheckout, verifyWebhook };
