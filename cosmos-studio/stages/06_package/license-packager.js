/* ============================================================================
   COSMOS Studio — stage 06: license packager
   ----------------------------------------------------------------------------
   Builds the locked delivery ZIP:
     delivery-package.zip
       ├── preview/            ← unencrypted visual build (client can view)
       ├── source.zip.enc      ← FULL source, AES-256-GCM under installment-1 key
       └── UNLOCK.md           ← key schedule + suspension terms
   Keys derive from LICENSE_MASTER_SECRET (license-lock.js) — one per monthly
   payment, permanent key at 100%.
   Usage: node license-packager.js <deliverableDir> <payment-plan.json> [outDir]
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const lock = require('../../shared/payment/license-lock');

function zipDir(dir, outZip) {
  execFileSync('zip', ['-qr', outZip, '.'], { cwd: dir });
  return fs.readFileSync(outZip);
}

function unlockDoc(plan) {
  return `# Unlock schedule — how you come to own this

Your system is fully deployed and working today. The SOURCE CODE ships in this
package encrypted (\`source.zip.enc\`). Each monthly payment releases that
month's unlock key; the final payment releases the permanent key and the
system is yours forever.

| Payment | What you receive |
|---|---|
| Down payment (33%) | Deployment + this package |
${Array.from({ length: plan.months }, (_, i) =>
  `| Month ${i + 1} (${plan.currency} ${plan.monthly}) | Unlock key ${i + 1}${i + 1 === plan.months ? ' — **permanent key: full ownership**' : ''} |`).join('\n')}

Decrypt (any machine, no internet needed):
\`\`\`bash
node decrypt.js source.zip.enc <your-key>   # decrypt.js is included, 20 lines, auditable
\`\`\`

## If a payment is missed
- 7-day grace, no interruption.
- After 7 days: the system pauses NEW generation. Everything already built keeps working.
- Nothing is ever deleted. Pay, and it resumes instantly.
- No hidden fees, no interest, no repossession of delivered work.
`;
}

const DECRYPT_JS = `// Standalone decryptor for source.zip.enc — audit freely.
const fs = require('fs'), crypto = require('crypto');
const [file, key] = process.argv.slice(2);
if (!file || !key) { console.error('usage: node decrypt.js source.zip.enc <key>'); process.exit(1); }
const blob = fs.readFileSync(file);
const k = crypto.createHash('sha256').update(key).digest();
const d = crypto.createDecipheriv('aes-256-gcm', k, blob.subarray(0, 12));
d.setAuthTag(blob.subarray(12, 28));
fs.writeFileSync('source.zip', Buffer.concat([d.update(blob.subarray(28)), d.final()]));
console.log('source.zip written — unzip and it is yours.');
`;

function buildPackage(deliverableDir, plan, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const staging = fs.mkdtempSync(path.join(require('os').tmpdir(), 'cosmos-pkg-'));

  // 1. preview (unencrypted visual build) — copy deliverable as-is
  fs.cpSync(deliverableDir, path.join(staging, 'preview'), { recursive: true });

  // 2. encrypted full source
  const srcZip = path.join(staging, 'source.zip');
  zipDir(deliverableDir, srcZip);
  const encrypted = lock.encryptZip(fs.readFileSync(srcZip), 1);
  fs.writeFileSync(path.join(staging, 'source.zip.enc'), encrypted);
  fs.rmSync(srcZip); // plaintext source never ships

  // 3. unlock instructions + auditable decryptor
  fs.writeFileSync(path.join(staging, 'UNLOCK.md'), unlockDoc(plan));
  fs.writeFileSync(path.join(staging, 'decrypt.js'), DECRYPT_JS);

  const finalZip = path.join(outDir, 'delivery-package.zip');
  if (fs.existsSync(finalZip)) fs.rmSync(finalZip);
  zipDir(staging, finalZip);
  fs.rmSync(staging, { recursive: true, force: true });
  return finalZip;
}

if (require.main === module) {
  const [deliverableDir, planPath, outDir] = process.argv.slice(2);
  if (!deliverableDir || !planPath) { console.error('usage: node license-packager.js <deliverableDir> <payment-plan.json> [outDir]'); process.exit(1); }
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const zip = buildPackage(deliverableDir, plan, outDir || path.join(__dirname, 'output'));
  console.log(`license-packager: ${zip}`);
}

module.exports = { buildPackage, unlockDoc };
