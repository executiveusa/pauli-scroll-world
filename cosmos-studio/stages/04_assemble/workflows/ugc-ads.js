/* ============================================================================
   COSMOS Studio — workflow: UGC ads (P3-B)
   ----------------------------------------------------------------------------
   Four formats × ≥2 A/B hook variants per format. Character defaults come
   from the market config; video via fal.ai reference-to-video with
   generate_audio: true. Output naming: {format}_{variant}_{market}.mp4
   Usage: node ugc-ads.js <brief-validated.json> [outDir]
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const fal = require('../../../shared/fal-client');
const { check, record } = require('../../03_generate/cost-guard');

const MODEL = 'fal-ai/bytedance/seedance-2.0/reference-to-video';
const FORMATS = [
  { id: 'podcast_16x9', aspect: '16:9', scene: 'two-person podcast studio, speaker mid-conversation, warm desk light' },
  { id: 'ugc_9x16', aspect: '9:16', scene: 'selfie-style direct to camera, natural handheld movement' },
  { id: 'lifestyle_9x16', aspect: '9:16', scene: 'product in daily use, candid framing, ambient sound' },
  { id: 'greenscreen_9x16', aspect: '9:16', scene: 'speaker in front of animated screen showing the product' },
];
// A/B hook styles — problem-agitation-solution family (ad-strategy.md carries per-market lines)
const HOOKS = [
  { id: 'authority', template: b => `I've tried every ${b.industry} option out there. Here's the one I kept.` },
  { id: 'story', template: b => `Last month I almost gave up on ${b.industry}. Then this happened.` },
];

function marketDefaults(marketId) {
  const md = fs.readFileSync(path.join(__dirname, '..', '..', '..', '_config', 'markets', `${marketId}.md`), 'utf8');
  return {
    voice: (md.match(/voice_model:\s*(\S+)/) || [])[1] || 'eleven_labs_en_us_default',
    appearance: (md.match(/appearance_prompt:\s*"([^"]+)"/) || [])[1] || 'Young professional, authentic, relatable',
    setting: (md.match(/setting_prompt:\s*"([^"]+)"/) || [])[1] || 'bright natural setting',
  };
}

async function generateAds(brief, outDir) {
  const market = brief.market_id || 'us-en';
  const character = marketDefaults(market);
  const jobs = [];
  for (const format of FORMATS) for (const hook of HOOKS) jobs.push({ format, hook });

  // Circuit breaker before any spend: 4 formats × 2 variants
  const est = fal.estimate(MODEL, jobs.length);
  const gate = check(est.totalCost);
  if (!gate.ok) throw new Error(`ugc-ads: ${gate.message}`);

  fs.mkdirSync(outDir, { recursive: true });
  const manifest = [];
  for (const { format, hook } of jobs) {
    const prompt = `${character.appearance}. ${character.setting}. ${format.scene}. ` +
      `Speaking (${character.voice} voice): "${hook.template(brief)}" — then one-line pitch for ${brief.brand_name}: ${brief.pitch}`;
    const res = await fal.generate(MODEL, {
      prompt, aspect_ratio: format.aspect, generate_audio: true,
      reference_image_url: brief.character_reference_url || undefined,
    });
    const name = `${format.id}_${hook.id}_${market}.mp4`;
    if (res.stub) {
      // STUB: replace with live call after .env is configured
      fs.writeFileSync(path.join(outDir, name + '.stub.json'), JSON.stringify({ prompt, would_call: MODEL, ...res }, null, 2));
    } else {
      const buf = Buffer.from(await (await fetch(res.url)).arrayBuffer());
      fs.writeFileSync(path.join(outDir, name), buf);
    }
    record(res.stub ? 0 : res.cost, MODEL, name);
    manifest.push({ file: name, format: format.id, hook: hook.id, market, cost: res.stub ? 0 : res.cost, stub: !!res.stub });
  }
  fs.writeFileSync(path.join(outDir, 'ugc-manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

if (require.main === module) {
  const [briefPath, outDir] = process.argv.slice(2);
  if (!briefPath) { console.error('usage: node ugc-ads.js <brief-validated.json> [outDir]'); process.exit(1); }
  const brief = JSON.parse(fs.readFileSync(briefPath, 'utf8'));
  generateAds(brief, outDir || path.join(__dirname, '..', 'output', 'deliverable'))
    .then(m => console.log(`ugc-ads: ${m.length} variants (${m.filter(x => x.stub).length} stubbed) → manifest written`))
    .catch(e => { console.error(e.message); process.exit(1); });
}

module.exports = { generateAds, FORMATS, HOOKS };
