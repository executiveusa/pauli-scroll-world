/* ============================================================================
   COSMOS Studio — license lock: black-box until paid off (P1-B)
   ----------------------------------------------------------------------------
   The delivered system runs for the client from day one, but the SOURCE ZIP
   stays encrypted with a rotating key until the payment plan completes.

   State file: _config/license.json
     { paid_pct, months_total, months_paid, last_payment_at, suspended }

   Rules (from FABLE_BUILD_PROMPT P1-B):
     paid_pct < 100  → serve the system, source ZIP encrypted (rotating key)
     each monthly payment → release that month's key
     paid_pct === 100 → release permanent unlock key; fully owned
     payment missed > 7 days → READ-ONLY mode (existing output only, no new
       generation). Client data is NEVER deleted. Lifts immediately on resume.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LICENSE_PATH = process.env.LICENSE_PATH || path.join(__dirname, '..', '..', '_config', 'license.json');
const GRACE_DAYS = 7;

function readLicense() {
  try { return JSON.parse(fs.readFileSync(LICENSE_PATH, 'utf8')); }
  catch {
    return { paid_pct: 0, months_total: 3, months_paid: 0, last_payment_at: null, suspended: false };
  }
}

function writeLicense(lic) {
  fs.mkdirSync(path.dirname(LICENSE_PATH), { recursive: true });
  fs.writeFileSync(LICENSE_PATH, JSON.stringify(lic, null, 2));
  return lic;
}

/**
 * Derive the unlock key for a given installment. Deterministic per deployment:
 * HMAC(LICENSE_MASTER_SECRET, installment#) — so keys can be re-issued for a
 * client who loses one, without storing any key material on disk.
 */
function keyForInstallment(installment) {
  const master = process.env.LICENSE_MASTER_SECRET;
  if (!master) {
    // STUB: replace with live call after .env is configured
    return `stub-key-installment-${installment}`;
  }
  return crypto.createHmac('sha256', master).update(`installment:${installment}`).digest('hex').slice(0, 32);
}

/** Permanent key released only at 100%. */
function permanentKey() {
  const master = process.env.LICENSE_MASTER_SECRET;
  if (!master) return 'stub-permanent-unlock-key'; // STUB: replace with live call after .env is configured
  return crypto.createHmac('sha256', master).update('permanent-unlock').digest('hex');
}

/** Called by the payment webhook on every successful installment. */
function recordPayment({ installment }) {
  const lic = readLicense();
  lic.months_paid = Math.max(lic.months_paid, installment);
  lic.paid_pct = Math.min(100, Math.round((lic.months_paid / lic.months_total) * 100));
  lic.last_payment_at = new Date().toISOString();
  lic.suspended = false; // suspension lifts immediately on payment resume
  writeLicense(lic);
  return {
    license: lic,
    releasedKey: lic.paid_pct === 100 ? permanentKey() : keyForInstallment(installment),
    fullyOwned: lic.paid_pct === 100,
  };
}

/**
 * Enforcement check — the server calls this on every generation request.
 * @returns {{mode: 'full'|'read_only'|'owned', reason?: string}}
 */
function enforce() {
  const lic = readLicense();
  if (lic.paid_pct >= 100) return { mode: 'owned' };
  if (lic.last_payment_at) {
    // Next installment is due a month after the last payment; grace = 7 days past due.
    const due = new Date(lic.last_payment_at);
    due.setMonth(due.getMonth() + 1);
    const graceEnd = new Date(due.getTime() + GRACE_DAYS * 86400000);
    if (new Date() > graceEnd && lic.months_paid < lic.months_total) {
      if (!lic.suspended) { lic.suspended = true; writeLicense(lic); }
      return { mode: 'read_only', reason: `installment ${lic.months_paid + 1} overdue > ${GRACE_DAYS} days — existing output stays available, new generation paused` };
    }
  }
  return { mode: 'full' };
}

/** AES-256-GCM encrypt a source ZIP for delivery (used by license-packager). */
function encryptZip(zipBuffer, installment) {
  const key = crypto.createHash('sha256').update(keyForInstallment(installment)).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(zipBuffer), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]); // [12 iv][16 tag][ciphertext]
}

function decryptZip(blob, unlockKey) {
  const key = crypto.createHash('sha256').update(unlockKey).digest();
  const iv = blob.subarray(0, 12), tag = blob.subarray(12, 28), data = blob.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

module.exports = { readLicense, recordPayment, enforce, encryptZip, decryptZip, keyForInstallment, permanentKey };
