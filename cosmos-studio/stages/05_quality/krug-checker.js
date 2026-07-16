/* ============================================================================
   COSMOS Studio — stage 05: automated Krug law audit
   ----------------------------------------------------------------------------
   Checks every user-facing text element in a target (HTML/MD/JSON files or a
   directory) against the enforceable Krug laws (_config/krug-laws.md, items
   marked ⚙). Exit 0 = PASS, exit 1 = FAIL with specific findings.
   Usage: node krug-checker.js --target=<file|dir> [--json]
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const LIMITS = { headline: 9, sectionBody: 60, buttonLabel: 3, heroBody: 30 };
const BANNED_LINK_TEXT = ['click here', 'here', 'read more', 'learn more', 'more', 'link', 'this'];
const words = s => String(s || '').replace(/\{\{[^}]*\}\}/g, 'X').trim().split(/\s+/).filter(Boolean).length;
const strip = html => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

function collectFiles(target) {
  const st = fs.statSync(target);
  if (st.isFile()) return [target];
  const out = [];
  for (const e of fs.readdirSync(target, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(target, e.name);
    if (e.isDirectory()) out.push(...collectFiles(p));
    else if (/\.(html?|md|json|txt)$/i.test(e.name)) out.push(p);
  }
  return out;
}

function checkHtml(file, html, findings) {
  // Law 5 ⚙ — omit needless words: headings and buttons
  for (const m of html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)) {
    const t = strip(m[1]);
    if (words(t) > LIMITS.headline) findings.push({ file, law: 5, element: `h1 "${t.slice(0, 40)}…"`, problem: `${words(t)} words (max ${LIMITS.headline})`, fix: 'Cut to the core claim — half the words, twice the usability.' });
  }
  for (const m of html.matchAll(/<(?:button|a)[^>]*class="[^"]*(?:btn|cta)[^"]*"[^>]*>([\s\S]*?)<\/(?:button|a)>/gi)) {
    const t = strip(m[1]);
    if (t && words(t) > LIMITS.buttonLabel) findings.push({ file, law: 5, element: `button "${t}"`, problem: `${words(t)} words (max ${LIMITS.buttonLabel})`, fix: 'Verb + object, nothing else.' });
  }
  // Law 1 ⚙ — ambiguous link text
  for (const m of html.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)) {
    const t = strip(m[1]).toLowerCase();
    if (BANNED_LINK_TEXT.includes(t)) findings.push({ file, law: 1, element: `link "${t}"`, problem: 'ambiguous link text', fix: 'Name the destination action: a verb that says exactly what happens.' });
  }
  // Law 2 ⚙ — scanning not reading: overlong paragraphs
  for (const m of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const t = strip(m[1]);
    if (words(t) > LIMITS.sectionBody) findings.push({ file, law: 2, element: `p "${t.slice(0, 40)}…"`, problem: `${words(t)} words (max ${LIMITS.sectionBody})`, fix: 'Break up or cut — users scan, they do not read.' });
  }
  // Law 3/6 ⚙ — accessibility-adjacent billboard checks
  for (const m of html.matchAll(/<img(?![^>]*\balt=)[^>]*>/gi)) {
    findings.push({ file, law: 3, element: m[0].slice(0, 60), problem: 'img without alt', fix: 'Add alt text (empty alt="" only if purely decorative).' });
  }
  if (/<html(?![^>]*\blang=)/i.test(html)) {
    findings.push({ file, law: 6, element: '<html>', problem: 'missing lang attribute', fix: 'Set lang (and update it on locale toggle).' });
  }
}

function checkStructured(file, text, findings) {
  // JSON locale files / scene lists: headline & body & cta fields
  let data; try { data = JSON.parse(text); } catch { return; }
  (function walk(node, trail) {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${trail}[${i}]`));
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === 'string') {
          if (/headline|title/i.test(k) && words(v) > LIMITS.headline) findings.push({ file, law: 5, element: `${trail}.${k}`, problem: `${words(v)} words (max ${LIMITS.headline})`, fix: 'Cut the headline to one scannable claim.' });
          if (/^body$/i.test(k) && words(v) > LIMITS.heroBody) findings.push({ file, law: 5, element: `${trail}.${k}`, problem: `${words(v)} words (max ${LIMITS.heroBody})`, fix: 'Beat copy must read in 3 seconds at scroll speed.' });
          if (/label$/i.test(k) && /cta|button/i.test(trail + k) && words(v) > LIMITS.buttonLabel) findings.push({ file, law: 5, element: `${trail}.${k}`, problem: `${words(v)} words (max ${LIMITS.buttonLabel})`, fix: 'Verb + object.' });
        } else walk(v, `${trail}.${k}`);
      }
    }
  })(data, path.basename(file));
}

function run(target) {
  const findings = [];
  for (const file of collectFiles(target)) {
    const text = fs.readFileSync(file, 'utf8');
    if (/\.html?$/i.test(file)) checkHtml(file, text, findings);
    else if (/\.json$/i.test(file)) checkStructured(file, text, findings);
    // .md/.txt: template/docs surfaces — headline law only on H1s (fenced code blocks excluded:
    // a "# comment" inside ```bash``` is shell, not a heading)
    else {
      const prose = text.replace(/```[\s\S]*?```/g, '');
      for (const m of prose.matchAll(/^# (.+)$/gm)) {
        if (words(m[1]) > LIMITS.headline + 3) findings.push({ file, law: 5, element: `H1 "${m[1].slice(0, 40)}"`, problem: `${words(m[1])} words`, fix: 'Tighten the title.' });
      }
    }
  }
  return findings;
}

if (require.main === module) {
  const targetArg = process.argv.find(a => a.startsWith('--target='));
  if (!targetArg) { console.error('usage: node krug-checker.js --target=<file|dir> [--json]'); process.exit(1); }
  const findings = run(targetArg.split('=')[1]);
  if (process.argv.includes('--json')) console.log(JSON.stringify(findings, null, 2));
  else if (findings.length) {
    console.log(`KRUG: FAIL — ${findings.length} finding(s)`);
    for (const f of findings) console.log(`  [law ${f.law}] ${f.file} :: ${f.element} — ${f.problem}. Fix: ${f.fix}`);
  } else console.log('KRUG: PASS');
  process.exit(findings.length ? 1 : 0);
}

module.exports = { run, LIMITS };
