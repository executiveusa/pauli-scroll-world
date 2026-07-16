/* ============================================================================
   COSMOS Studio — workflow: documentary (P3-D)
   ----------------------------------------------------------------------------
   Built around a fork of StoryToolkitAI (https://github.com/octimot/StoryToolkitAI.git)
   run as a local subprocess. Fork additions (tracked in the fork repo, not here):
     - voice control interface: Whisper STT → command parser
   This module orchestrates:
     real footage (MP4/MOV uploads) → StoryToolkitAI transcription + edit →
     AI b-roll (fal.ai Seedance) inserted at detected b-roll markers →
     documentary-cut.mp4 + edit-decision-list.json
   Usage: node documentary.js <footageDir> <brief-validated.json> [outDir]
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const fal = require('../../../shared/fal-client');
const { check, record } = require('../../03_generate/cost-guard');

const STK_DIR = process.env.STORYTOOLKIT_DIR || path.join(__dirname, '..', '..', '..', 'vendor', 'StoryToolkitAI');
const BROLL_MODEL = 'fal-ai/bytedance/seedance-2.0';

/** Transcribe + segment footage via the StoryToolkitAI fork (CLI mode). */
function transcribe(footageDir, workDir) {
  const clips = fs.readdirSync(footageDir).filter(f => /\.(mp4|mov)$/i.test(f));
  if (!clips.length) throw new Error(`documentary: no MP4/MOV footage in ${footageDir}`);

  if (!fs.existsSync(STK_DIR)) {
    // STUB: replace with live call after .env is configured (clone the StoryToolkitAI fork to vendor/)
    return clips.map((clip, i) => ({
      clip, start: 0, end: 30,
      transcript: `[stub transcript for ${clip}]`,
      // heuristic marker: every clip gets one b-roll opportunity mid-clip
      broll_markers: [{ at: 15, hint: 'cutaway: subject context' }],
      stub: true,
    }));
  }

  const segments = [];
  for (const clip of clips) {
    const r = spawnSync('python3', [path.join(STK_DIR, 'storytoolkitai'), '--mode', 'cli',
      '--transcribe', path.join(footageDir, clip), '--output-dir', workDir], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`StoryToolkitAI failed on ${clip}: ${r.stderr?.slice(0, 200)}`);
    const json = path.join(workDir, clip.replace(/\.\w+$/, '.transcription.json'));
    const t = JSON.parse(fs.readFileSync(json, 'utf8'));
    segments.push({ clip, ...t });
  }
  return segments;
}

/** Generate AI b-roll for each marker and build the EDL. */
async function buildCut(segments, brief, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const brolls = segments.flatMap(s => s.broll_markers || []);
  const est = fal.estimate(BROLL_MODEL, brolls.length || 0);
  if (brolls.length) {
    const gate = check(est.totalCost);
    if (!gate.ok) throw new Error(`documentary: ${gate.message}`);
  }

  const edl = [];
  let brollIdx = 0;
  for (const seg of segments) {
    edl.push({ type: 'footage', src: seg.clip, in: seg.start, out: seg.end, transcript: seg.transcript });
    for (const marker of seg.broll_markers || []) {
      const res = await fal.generate(BROLL_MODEL, {
        prompt: `Documentary b-roll for ${brief.brand_name} (${brief.industry}): ${marker.hint}. Natural light, observational, no text.`,
      });
      const name = `broll_${String(brollIdx++).padStart(2, '0')}.mp4`;
      if (!res.stub) fs.writeFileSync(path.join(outDir, name), Buffer.from(await (await fetch(res.url)).arrayBuffer()));
      record(res.stub ? 0 : res.cost, BROLL_MODEL, name);
      edl.push({ type: 'broll', src: name, insert_at: marker.at, duration: 4, stub: !!res.stub });
    }
  }
  fs.writeFileSync(path.join(outDir, 'edit-decision-list.json'), JSON.stringify(edl, null, 2));
  return edl;
}

/** Render the EDL to documentary-cut.mp4 (footage-only concat when b-roll is stubbed). */
function renderCut(edl, footageDir, outDir) {
  const parts = edl.filter(e => e.type === 'footage').map(e => path.join(footageDir, e.src));
  const list = path.join(outDir, 'concat.txt');
  fs.writeFileSync(list, parts.map(p => `file '${path.resolve(p)}'`).join('\n'));
  const out = path.join(outDir, 'documentary-cut.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-f', 'concat', '-safe', '0', '-i', list,
    '-c:v', 'libx264', '-g', '8', '-crf', '20', '-movflags', '+faststart', '-y', out]);
  fs.rmSync(list);
  return out;
}

async function main() {
  const [footageDir, briefPath, outDirArg] = process.argv.slice(2);
  if (!footageDir || !briefPath) { console.error('usage: node documentary.js <footageDir> <brief-validated.json> [outDir]'); process.exit(1); }
  const brief = JSON.parse(fs.readFileSync(briefPath, 'utf8'));
  const outDir = outDirArg || path.join(__dirname, '..', 'output', 'deliverable');
  fs.mkdirSync(outDir, { recursive: true });
  const segments = transcribe(footageDir, outDir);
  const edl = await buildCut(segments, brief, outDir);
  const cut = renderCut(edl, footageDir, outDir);
  console.log(`documentary: ${cut} + edit-decision-list.json (${edl.filter(e => e.stub).length} stubbed b-roll slots)`);
}

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });

module.exports = { transcribe, buildCut, renderCut };
