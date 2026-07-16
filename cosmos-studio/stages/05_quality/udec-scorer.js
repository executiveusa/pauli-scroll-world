/* ============================================================================
   COSMOS Studio — stage 05: 14-axis UDEC scorer (heuristic pass)
   ----------------------------------------------------------------------------
   Scores a deliverable on the axes defined in _config/udec-axes.md. This is
   the automatable half of the gate; a model review pass scores the same axes
   from rendered output and the LOWER score governs. Heuristics start each
   axis at 10 and subtract per detected defect — absence of signal is not
   penalized (docs/MD targets simply score on fewer axes).

   Floor: overall ≥ 8.5, every axis ≥ 7.0, ACC ≥ 7.0 unconditional.
   Usage: node udec-scorer.js --target=<file|dir> [--json] [--out=<scores.json>]
   Exit 0 PASS | 1 FAIL
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { run: krugRun } = require('./krug-checker');

const AXES = ['CLA', 'HIE', 'CON', 'TYP', 'SPA', 'COL', 'MOT', 'ACC', 'CPY', 'CVR', 'MOB', 'PRF', 'TRS', 'DLT'];
const FLOOR_OVERALL = 8.5, FLOOR_AXIS = 7.0;

function collectFiles(target, exts) {
  const st = fs.statSync(target);
  if (st.isFile()) return [target];
  const out = [];
  for (const e of fs.readdirSync(target, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(target, e.name);
    if (e.isDirectory()) out.push(...collectFiles(p, exts));
    else if (exts.test(e.name)) out.push(p);
  }
  return out;
}

function scoreHtml(html, file, notes) {
  const s = Object.fromEntries(AXES.map(a => [a, 10]));
  const ding = (axis, pts, why) => { s[axis] = Math.max(0, +(s[axis] - pts).toFixed(2)); notes.push({ axis, file, why }); };

  // HIE — heading order
  const headings = [...html.matchAll(/<h([1-6])/gi)].map(m => +m[1]);
  if (!headings.includes(1)) ding('HIE', 2, 'no h1');
  for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i - 1] > 1) { ding('HIE', 1, `heading jump h${headings[i - 1]}→h${headings[i]}`); break; }

  // TYP — font families
  const fonts = new Set([...html.matchAll(/font-family:\s*([^;}"']+)/gi)].map(m => m[1].split(',')[0].trim().toLowerCase()));
  if (fonts.size > 3) ding('TYP', 1.5, `${fonts.size} font families (target ≤ 2 + mono)`);

  // MOT — reduced motion
  if (/animation|transition|requestAnimationFrame/i.test(html) && !/prefers-reduced-motion/i.test(html)) ding('MOT', 3, 'motion without prefers-reduced-motion handling');

  // ACC — alt, lang, focus, semantics
  const imgsNoAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length;
  if (imgsNoAlt) ding('ACC', Math.min(3, imgsNoAlt), `${imgsNoAlt} img(s) missing alt`);
  if (/<html(?![^>]*\blang=)/i.test(html)) ding('ACC', 2, 'missing lang attribute');
  if (!/aria-|<nav|<main|<header|<section/i.test(html)) ding('ACC', 1.5, 'no semantic/ARIA structure detected');
  if (/onclick/i.test(html) && !/<button|tabindex/i.test(html)) ding('ACC', 1.5, 'click handlers without focusable elements');

  // CVR — CTA presence and restraint
  const ctas = (html.match(/class="[^"]*(?:btn|cta)[^"]*"/gi) || []).length;
  if (ctas === 0) ding('CVR', 2.5, 'no CTA found');

  // MOB — viewport + media queries + touch targets
  if (!/<meta[^>]*viewport/i.test(html)) ding('MOB', 3, 'no viewport meta');
  if (!/@media/i.test(html)) ding('MOB', 2, 'no responsive media queries');

  // PRF — weight & external deps
  const kb = Buffer.byteLength(html) / 1024;
  if (kb > 600) ding('PRF', 2, `page source ${kb.toFixed(0)}KB (> 600KB)`);
  const extScripts = (html.match(/<script[^>]*src="https?:\/\//gi) || []).length;
  if (extScripts) ding('PRF', Math.min(3, extScripts * 1.5), `${extScripts} external framework script(s) — vanilla required`);
  if (!/loading="lazy"|decoding="async"|preload/i.test(html)) ding('PRF', 1, 'no lazy-loading hints');

  // TRS — pricing honesty / dark patterns
  if (/only\s+\d+\s+left|hurry|act now|expires in/i.test(html)) ding('TRS', 3, 'fake-urgency language');

  // CON — inline hex contrast sample (rough: flag very-low-contrast pairs declared together)
  for (const m of html.matchAll(/color:\s*#([0-9a-f]{6})[^}]*background(?:-color)?:\s*#([0-9a-f]{6})/gi)) {
    if (contrastRatio(m[1], m[2]) < 3) { ding('CON', 2, `low contrast pair #${m[1]}/#${m[2]}`); break; }
  }

  // COL — distinct declared colors
  const colors = new Set([...html.matchAll(/#([0-9a-f]{6})\b/gi)].map(m => m[1].toLowerCase()));
  if (colors.size > 24) ding('COL', 1.5, `${colors.size} distinct hex colors — tighten the palette`);

  // DLT — heuristics can't measure delight; model pass owns it. Neutral 9.
  s.DLT = Math.min(s.DLT, 9);
  return s;
}

function contrastRatio(hex1, hex2) {
  const lum = h => {
    const c = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
      .map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [a, b] = [lum(hex1), lum(hex2)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function score(target) {
  const notes = [];
  const htmlFiles = collectFiles(target, /\.html?$/i);
  const perFile = htmlFiles.map(f => scoreHtml(fs.readFileSync(f, 'utf8'), f, notes));

  // CPY axis: driven by krug-checker findings across the whole target
  const krugFindings = krugRun(target);
  const cpyScore = Math.max(0, 10 - krugFindings.length * 0.75);

  // Aggregate: min across files per axis (a failure anywhere is a failure)
  const s = Object.fromEntries(AXES.map(a => [a, perFile.length ? Math.min(...perFile.map(p => p[a])) : 10]));
  s.CPY = Math.min(s.CPY, +cpyScore.toFixed(2));
  if (krugFindings.length) notes.push({ axis: 'CPY', file: target, why: `${krugFindings.length} krug finding(s) — run krug-checker.js for the list` });

  const overall = +(AXES.reduce((t, a) => t + s[a], 0) / AXES.length).toFixed(2);
  const failingAxes = AXES.filter(a => s[a] < FLOOR_AXIS);
  const pass = overall >= FLOOR_OVERALL && failingAxes.length === 0;
  return { target, overall, pass, floor: { overall: FLOOR_OVERALL, axis: FLOOR_AXIS }, axes: s, failing_axes: failingAxes, notes, files_scored: htmlFiles.length };
}

if (require.main === module) {
  const targetArg = process.argv.find(a => a.startsWith('--target='));
  if (!targetArg) { console.error('usage: node udec-scorer.js --target=<file|dir> [--json] [--out=<file>]'); process.exit(1); }
  const result = score(targetArg.split('=')[1]);
  const outArg = process.argv.find(a => a.startsWith('--out='));
  if (outArg) fs.writeFileSync(outArg.split('=')[1], JSON.stringify(result, null, 2));
  if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`UDEC: ${result.pass ? 'PASS' : 'FAIL'} — overall ${result.overall}/10 (${result.files_scored} html file(s))`);
    for (const a of AXES) console.log(`  ${a}: ${result.axes[a]}${result.axes[a] < FLOOR_AXIS ? '  ← BELOW FLOOR' : ''}`);
    for (const n of result.notes) console.log(`  note [${n.axis}] ${n.file}: ${n.why}`);
  }
  process.exit(result.pass ? 0 : 1);
}

module.exports = { score, AXES, FLOOR_OVERALL, FLOOR_AXIS };
