/* ============================================================================
   COSMOS Studio — stage 02: style preamble generator
   ----------------------------------------------------------------------------
   Produces the ONE locked sentence prefixed verbatim to every scene prompt in
   stage 03. Cohesion across scenes lives or dies on this sentence, so it is
   generated once, written to style-preamble.txt, and never re-generated
   mid-project (edits go through the world-bible edit surface).
   Usage: node style-preamble.js <brief-validated.json> [outDir]
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { callModel } = require('../../shared/model-router');

function fallbackPreamble(brief) {
  const palette = (brief.palette || []).slice(0, 3).join(', ') || 'brand-neutral warm tones';
  const tone = (brief.tone || ['premium']).join(', ');
  return `Cinematic ${brief.industry} world for ${brief.brand_name}: ${tone} mood, palette of ${palette}, volumetric natural light, cohesive miniature-diorama depth, no text, no logos, no people unless specified.`;
}

async function generatePreamble(brief) {
  const fallback = fallbackPreamble(brief);
  const { text, stub } = await callModel('plan', [{
    role: 'user',
    content: `Write ONE sentence (max 45 words) art-direction preamble for AI scene generation. Brand: ${brief.brand_name} (${brief.industry}), tone: ${(brief.tone || []).join(', ')}, palette: ${(brief.palette || []).join(', ') || 'unspecified'}. ` +
      `Must end with: "no text, no logos". Style reference: "${fallback}"`,
  }]);
  if (stub) return fallback;
  const line = String(text || '').trim().split('\n').find(l => l.trim()) || fallback;
  // The preamble is a hard contract: single line, bounded length.
  return line.replace(/^["']|["']$/g, '').slice(0, 400);
}

async function main() {
  const briefPath = process.argv[2];
  if (!briefPath) { console.error('usage: node style-preamble.js <brief-validated.json> [outDir]'); process.exit(1); }
  const brief = JSON.parse(fs.readFileSync(briefPath, 'utf8'));
  const outDir = process.argv[3] || path.join(__dirname, 'output');
  const preamble = await generatePreamble(brief);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'style-preamble.txt'), preamble + '\n');
  console.log(`style-preamble: ${preamble}`);
}

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });

module.exports = { generatePreamble, fallbackPreamble };
