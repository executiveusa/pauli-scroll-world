/* ============================================================================
   COSMOS Studio — workflow: faceless YouTube (P3-E)
   ----------------------------------------------------------------------------
   Pipeline: script (plan tier: Fable/Grok) → narration (ElevenLabs, market
   language voice) → visuals (Seedance) → captions (qa tier: Haiku) →
   thumbnail (FLUX) → assembled MP4 + auto 60s vertical Short.
   Outputs: main-video.mp4 | short.mp4 | thumbnail.webp | description.md | tags.json
   Usage: node faceless-youtube.js <brief-validated.json> [outDir]
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { callModel } = require('../../../shared/model-router');
const fal = require('../../../shared/fal-client');
const { check, record } = require('../../03_generate/cost-guard');

const VISUAL_MODEL = 'fal-ai/bytedance/seedance-2.0';
const THUMB_MODEL = 'fal-ai/flux-pro/v1.1-ultra';

function marketVoice(marketId) {
  try {
    const md = fs.readFileSync(path.join(__dirname, '..', '..', '..', '_config', 'markets', `${marketId}.md`), 'utf8');
    return (md.match(/voice_model:\s*(\S+)/) || [])[1] || 'eleven_labs_en_us_default';
  } catch { return 'eleven_labs_en_us_default'; }
}

async function writeScript(brief) {
  const { text, stub } = await callModel('plan', [{
    role: 'user',
    content: `Write a 6-8 minute faceless YouTube script about "${brief.pitch}" for ${brief.audience}. ` +
      `Structure: hook (15s), 4-5 chapters, payoff. Return sections split by "## ".`,
  }]);
  if (stub) {
    return `## Hook\n${brief.pitch} — and most people get it wrong.\n## Chapter 1\nWhat it is.\n## Chapter 2\nWhy it matters.\n## Chapter 3\nHow to use it.\n## Payoff\nStart today.\n`;
  }
  return text;
}

async function narrate(script, voice, outDir) {
  if (!process.env.ELEVENLABS_API_KEY) {
    // STUB: replace with live call after .env is configured — silent track keeps assembly runnable
    const out = path.join(outDir, 'narration.mp3');
    execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '30', '-q:a', '9', '-y', out]);
    return { file: out, stub: true };
  }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ text: script.replace(/^## .*$/gm, ''), model_id: 'eleven_multilingual_v2' }),
  });
  if (!res.ok) throw new Error(`elevenlabs ${res.status}`);
  const out = path.join(outDir, 'narration.mp3');
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  return { file: out };
}

async function visuals(script, brief, outDir) {
  const chapters = script.split(/^## /m).filter(Boolean);
  const est = fal.estimate(VISUAL_MODEL, chapters.length);
  const gate = check(est.totalCost);
  if (!gate.ok) throw new Error(`faceless-youtube: ${gate.message}`);

  const clips = [];
  for (let i = 0; i < chapters.length; i++) {
    const res = await fal.generate(VISUAL_MODEL, {
      prompt: `B-roll for a YouTube chapter titled "${chapters[i].split('\n')[0]}" about ${brief.pitch}. Clean, cinematic, no text, no people talking to camera.`,
    });
    const name = path.join(outDir, `chapter_${i}.mp4`);
    if (res.stub) {
      // STUB: replace with live call after .env is configured
      execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=duration=4:size=1280x720:rate=24',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-g', '8', '-crf', '20', '-movflags', '+faststart', '-an', '-y', name]);
    } else {
      fs.writeFileSync(name, Buffer.from(await (await fetch(res.url)).arrayBuffer()));
    }
    record(res.stub ? 0 : res.cost, VISUAL_MODEL, path.basename(name));
    clips.push(name);
  }
  return clips;
}

async function captionsAndMeta(script, brief) {
  const { text, stub } = await callModel('qa', [{
    role: 'user',
    content: `From this script write: (1) YouTube description (<150 words, first line = hook), (2) 12 tags as JSON array. Split with "---TAGS---".\n${script.slice(0, 2000)}`,
  }]);
  if (stub) return { description: `${brief.pitch}\n\n(chapters below)`, tags: [brief.industry, 'explainer', 'howto'] };
  const [description, tagsRaw] = text.split('---TAGS---');
  let tags = [];
  try { tags = JSON.parse(tagsRaw.match(/\[[\s\S]*\]/)[0]); } catch { tags = [brief.industry]; }
  return { description: description.trim(), tags };
}

async function thumbnail(brief, outDir) {
  const res = await fal.generate(THUMB_MODEL, {
    prompt: `YouTube thumbnail background for "${brief.pitch}" — bold single subject, high contrast, rule of thirds, space for title text on the left, no text baked in.`,
  });
  const out = path.join(outDir, 'thumbnail.webp');
  if (res.stub) fs.writeFileSync(out, Buffer.from('stub-thumbnail')); // STUB: replace with live call after .env is configured
  else fs.writeFileSync(out, Buffer.from(await (await fetch(res.url)).arrayBuffer()));
  record(res.stub ? 0 : res.cost, THUMB_MODEL, 'thumbnail');
  return out;
}

function assembleVideo(clips, narration, outDir) {
  const list = path.join(outDir, 'concat.txt');
  fs.writeFileSync(list, clips.map(c => `file '${path.resolve(c)}'`).join('\n'));
  const main = path.join(outDir, 'main-video.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-i', narration,
    '-c:v', 'libx264', '-g', '8', '-crf', '20', '-movflags', '+faststart', '-shortest', '-y', main]);
  // Shorts variant: first 60s, center-cropped to 9:16 vertical
  const short = path.join(outDir, 'short.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-i', main, '-t', '60',
    '-vf', 'crop=ih*9/16:ih,scale=1080:1920', '-c:v', 'libx264', '-g', '8', '-crf', '21', '-movflags', '+faststart', '-y', short]);
  fs.rmSync(list);
  return { main, short };
}

async function main() {
  const [briefPath, outDirArg] = process.argv.slice(2);
  if (!briefPath) { console.error('usage: node faceless-youtube.js <brief-validated.json> [outDir]'); process.exit(1); }
  const brief = JSON.parse(fs.readFileSync(briefPath, 'utf8'));
  const outDir = outDirArg || path.join(__dirname, '..', 'output', 'deliverable');
  fs.mkdirSync(outDir, { recursive: true });

  const script = await writeScript(brief);
  fs.writeFileSync(path.join(outDir, 'script.md'), script);
  const narration = await narrate(script, marketVoice(brief.market_id || 'us-en'), outDir);
  const clips = await visuals(script, brief, outDir);
  const meta = await captionsAndMeta(script, brief);
  fs.writeFileSync(path.join(outDir, 'description.md'), meta.description);
  fs.writeFileSync(path.join(outDir, 'tags.json'), JSON.stringify(meta.tags, null, 2));
  await thumbnail(brief, outDir);
  const { main: mainVid, short } = assembleVideo(clips, narration.file, outDir);
  console.log(`faceless-youtube: ${mainVid} + ${short} + thumbnail + description + tags`);
}

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });

module.exports = { writeScript, narrate, visuals, captionsAndMeta, assembleVideo };
