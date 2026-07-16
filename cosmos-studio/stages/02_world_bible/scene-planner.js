/* ============================================================================
   COSMOS Studio — stage 02: scene planner
   ----------------------------------------------------------------------------
   Derives 5-7 scene beats from a validated brief/PRD. The model (plan tier via
   model-router) writes the creative beats; this module owns structure,
   validation, and the Krug word-limit gate so bad copy never reaches stage 03.
   Usage: node scene-planner.js <path/to/brief-validated.json> [outDir]
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { callModel } = require('../../shared/model-router');

const KRUG = { headline: 9, body: 30, cta: 3, minBeats: 5, maxBeats: 7 };

function krugCheckBeat(beat, i) {
  const problems = [];
  const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  if (words(beat.headline) > KRUG.headline) problems.push(`beat ${i} headline ${words(beat.headline)} words (max ${KRUG.headline})`);
  if (words(beat.body) > KRUG.body) problems.push(`beat ${i} body ${words(beat.body)} words (max ${KRUG.body})`);
  if (beat.cta && words(beat.cta.label) > KRUG.cta) problems.push(`beat ${i} CTA label ${words(beat.cta.label)} words (max ${KRUG.cta})`);
  return problems;
}

/** Deterministic beat skeleton by industry archetype — the model call refines it;
    without keys (stub mode) this skeleton IS the output, so pipelines stay runnable. */
function skeletonBeats(brief) {
  const b = brief.brand_name;
  return [
    { id: 'arrival', name: 'Arrival', eyebrow: 'Welcome', headline: `Enter the world of ${b}`, body: `${brief.pitch}`.split('.')[0] + '.', },
    { id: 'craft', name: 'Craft', eyebrow: 'What we do', headline: 'Made with intent', body: `Every detail serves ${brief.audience}.` },
    { id: 'proof', name: 'Proof', eyebrow: 'Why it works', headline: 'Results you can see', body: 'Real outcomes, shown not told.' },
    { id: 'world', name: 'World', eyebrow: 'Look around', headline: 'This is your space', body: 'Scroll deeper — the camera keeps moving.' },
    { id: 'begin', name: 'Begin', eyebrow: 'Next step', headline: 'Start your story', body: 'One conversation. Then we build.', cta: { label: 'Start now', href: '#contact' } },
  ];
}

async function planScenes(brief) {
  const skeleton = skeletonBeats(brief);
  const { text, stub } = await callModel('plan', [{
    role: 'user',
    content: `Refine these scene beats for a ${brief.workflow} piece for "${brief.brand_name}" (${brief.industry}, audience: ${brief.audience}, tone: ${(brief.tone || []).join(', ')}). ` +
      `Return JSON array of 5-7 beats {id,name,eyebrow,headline,body,cta?}. Krug limits: headline<=9 words, body<=30, cta.label<=3, CTA only on last beat.\n` +
      JSON.stringify(skeleton),
  }]);

  let beats = skeleton;
  if (!stub) {
    try { beats = JSON.parse(text.match(/\[[\s\S]*\]/)[0]); }
    catch { /* model returned prose — keep the validated skeleton rather than fail */ }
  }

  if (beats.length < KRUG.minBeats || beats.length > KRUG.maxBeats) beats = skeleton;
  const problems = beats.flatMap(krugCheckBeat);
  if (problems.length) throw new Error(`scene-planner: Krug limits violated — ${problems.join('; ')}`);
  return beats;
}

async function main() {
  const briefPath = process.argv[2];
  if (!briefPath) { console.error('usage: node scene-planner.js <brief-validated.json> [outDir]'); process.exit(1); }
  const brief = JSON.parse(fs.readFileSync(briefPath, 'utf8'));
  const outDir = process.argv[3] || path.join(__dirname, 'output');
  const beats = await planScenes(brief);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'scene-list.json'), JSON.stringify(beats, null, 2));
  console.log(`scene-planner: ${beats.length} beats → ${path.join(outDir, 'scene-list.json')}`);
}

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });

module.exports = { planScenes, krugCheckBeat, skeletonBeats, KRUG };
