/* ============================================================================
   COSMOS Studio — Lightning Network handler (P1-B)
   ----------------------------------------------------------------------------
   LND REST (macaroon auth). Law (CLAUDE.md 8 / pauli-effect hard stops):
     amount < $500  → auto-proceed, invoice immediately
     amount ≥ $500  → HALT: notify Bambu, return awaiting_approval — the invoice
                      is only created after POST /api/approve confirms.
   BTCPay is the on-chain fallback when LND is unreachable.
   ========================================================================== */

'use strict';

const APPROVAL_THRESHOLD_USD = 500;

async function notifyBambu(message, payload = {}) {
  if (!process.env.N8N_WEBHOOK_URL) {
    console.log(`[notify-bambu:stub] ${message}`, payload); // STUB: replace with live call after .env is configured
    return { stub: true };
  }
  const res = await fetch(process.env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ channel: 'payments', message, ...payload }),
  });
  return { ok: res.ok };
}

/**
 * Request a Lightning payment.
 * @param {object} p { amountUsd, amountSats, memo, jobId, approved }
 *   `approved: true` is only set by the /api/approve flow (Bambu).
 * @returns invoice { bolt11, rHash } | { awaiting_approval: true } | stub
 */
async function requestPayment(p) {
  if (p.amountUsd >= APPROVAL_THRESHOLD_USD && !p.approved) {
    await notifyBambu(`Lightning payment $${p.amountUsd} for job ${p.jobId} needs approval (≥ $${APPROVAL_THRESHOLD_USD}).`, { jobId: p.jobId });
    return { awaiting_approval: true, threshold: APPROVAL_THRESHOLD_USD };
  }

  if (!process.env.LN_REST_URL || !process.env.LN_MACAROON) {
    if (process.env.BTCPAY_URL && process.env.BTCPAY_API_KEY) return btcpayInvoice(p);
    // STUB: replace with live call after .env is configured
    return {
      bolt11: `lnbc_stub_${p.jobId}_${p.amountSats || 0}`,
      rHash: 'stub', stub: true,
      note: 'LN_REST_URL/LN_MACAROON not set — returned mock invoice',
    };
  }

  const res = await fetch(`${process.env.LN_REST_URL}/v1/invoices`, {
    method: 'POST',
    headers: {
      'grpc-metadata-macaroon': process.env.LN_MACAROON, // hex macaroon; LN_CERT pins TLS at the agent proxy layer
      'content-type': 'application/json',
    },
    body: JSON.stringify({ value: String(p.amountSats), memo: p.memo }),
  });
  if (!res.ok) {
    if (process.env.BTCPAY_URL && process.env.BTCPAY_API_KEY) return btcpayInvoice(p); // on-chain fallback
    throw new Error(`lnd ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const inv = await res.json();
  return { bolt11: inv.payment_request, rHash: inv.r_hash };
}

/** BTCPay on-chain fallback invoice. */
async function btcpayInvoice(p) {
  const res = await fetch(`${process.env.BTCPAY_URL}/api/v1/stores/default/invoices`, {
    method: 'POST',
    headers: { authorization: `token ${process.env.BTCPAY_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ amount: p.amountUsd, currency: 'USD', metadata: { jobId: p.jobId, memo: p.memo } }),
  });
  if (!res.ok) throw new Error(`btcpay ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const inv = await res.json();
  return { provider: 'btcpay', checkoutLink: inv.checkoutLink, invoiceId: inv.id };
}

module.exports = { requestPayment, notifyBambu, APPROVAL_THRESHOLD_USD };
