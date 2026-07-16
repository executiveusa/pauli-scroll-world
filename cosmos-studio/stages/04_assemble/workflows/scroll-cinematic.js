/* ============================================================================
   COSMOS Studio — workflow: scroll-cinematic (P3-A)
   ----------------------------------------------------------------------------
   The scrub engine itself is REUSED from pauli-scroll-world
   (skills/scroll-world/references/scrub-engine.js) — this module only WIRES it:
   it turns a world bible + stage 03 assets into a mountScrollWorld() config and
   a self-contained deliverable page with a bilingual toggle per market.

   Every word in title/body/cta runs through krug-checker BEFORE wiring —
   failing copy never reaches the page.
   Usage: node scroll-cinematic.js <scene-list.json> <brief-validated.json> <assetsDir> [outDir]
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { run: krugRun } = require('../../05_quality/krug-checker');

const ENGINE = path.join(__dirname, '..', '..', '..', '..', 'skills', 'scroll-world', 'references', 'scrub-engine.js');
const MARKET_LANGS = { 'us-en': ['en'], 'puerto-rico': ['es', 'en'], mexico: ['es'], spain: ['es'], 'serbia-balkans': ['sr', 'en'] };
const ACCENTS = ['#8a7bb5', '#5b8a72', '#b5837b', '#7b93b5', '#a89a5b', '#8a5b7f', '#5b7f8a'];

/** scene-list.json + assets → mountScrollWorld() config */
function buildConfig(beats, brief, assetsDir) {
  const vid = rel => `assets/vid/${rel}`;
  const still = rel => `assets/stills/${rel}`;
  const has = rel => fs.existsSync(path.join(assetsDir, rel));

  const sections = beats.map((b, i) => ({
    id: b.id,
    label: b.name,
    still: still(`${b.id}.webp`),
    clip: has(`vid/${b.id}_final_enc.mp4`) ? vid(`${b.id}_final_enc.mp4`) : vid(`${b.id}_draft_enc.mp4`),
    clipMobile: has(`vid/${b.id}_final_mobile.mp4`) ? vid(`${b.id}_final_mobile.mp4`) : vid(`${b.id}_draft_mobile.mp4`),
    accent: (brief.palette && brief.palette[i % brief.palette.length]) || ACCENTS[i % ACCENTS.length],
    eyebrow: b.eyebrow, title: b.headline, body: b.body,
    ...(b.cta ? { cta: { primary: { label: b.cta.label, href: b.cta.href } } } : {}),
  }));

  const connectors = beats.slice(0, -1).map((b, i) => {
    const next = beats[i + 1];
    const rel = `vid/conn_${b.id}_${next.id}_enc.mp4`;
    return has(rel) ? vid(`conn_${b.id}_${next.id}_enc.mp4`) : null; // null → engine crossfades
  });

  return {
    brand: { name: brief.brand_name, href: '#top' },
    diveScroll: 1.3, connScroll: 0.9,
    hint: 'scroll to fly in',
    nav: true, atmosphere: true,
    sections, connectors,
  };
}

function pageHtml(config, langs, brief) {
  // Self-contained deliverable: engine inlined, config embedded, bilingual toggle.
  const engine = fs.readFileSync(ENGINE, 'utf8');
  const toggle = langs.length > 1
    ? `<div class="lang-toggle" role="group" aria-label="Language">${langs.map((l, i) =>
        `<button data-lang="${l}" ${i === 0 ? 'class="on"' : ''}>${l.toUpperCase()}</button>`).join('')}</div>`
    : '';
  return `<!doctype html>
<html lang="${langs[0]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${brief.brand_name}</title>
<style>
  .lang-toggle{position:fixed;right:16px;bottom:16px;z-index:200;display:flex;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.7);backdrop-filter:blur(8px);}
  .lang-toggle button{font:600 .8rem/1 system-ui;border:0;background:transparent;padding:8px 12px;border-radius:999px;cursor:pointer;}
  .lang-toggle button.on{background:#241d2b;color:#fff;}
  @media (prefers-reduced-motion:reduce){.lang-toggle{transition:none;}}
</style>
</head>
<body>
<main id="world" aria-label="${brief.brand_name}"></main>
${toggle}
<script>
${engine}
</script>
<script>
const CONFIGS = ${JSON.stringify({ [langs[0]]: config })/* per-lang copy variants are added by the translation pass (qa tier) */};
let mounted = false;
function mount(lang){
  document.documentElement.lang = lang;
  const host = document.getElementById('world');
  if (mounted) { host.innerHTML = ''; }
  mountScrollWorld(host, CONFIGS[lang] || CONFIGS['${langs[0]}']);
  mounted = true;
}
document.querySelectorAll('.lang-toggle button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.lang-toggle button').forEach(x => x.classList.toggle('on', x === b));
  mount(b.dataset.lang);
}));
mount('${langs[0]}');
</script>
</body>
</html>`;
}

function assemble(sceneListPath, briefPath, assetsDir, outDir) {
  const beats = JSON.parse(fs.readFileSync(sceneListPath, 'utf8'));
  const brief = JSON.parse(fs.readFileSync(briefPath, 'utf8'));
  const langs = brief.languages?.length ? brief.languages : (MARKET_LANGS[brief.market_id] || ['en']);

  // Krug gate BEFORE wiring: write copy to a temp json and audit it.
  const tmp = path.join(require('os').tmpdir(), `krug-copy-${Date.now()}.json`);
  fs.writeFileSync(tmp, JSON.stringify(beats));
  const findings = krugRun(tmp);
  fs.rmSync(tmp);
  if (findings.length) {
    throw new Error(`scroll-cinematic: copy failed Krug audit — ${findings.map(f => `${f.element}: ${f.problem}`).join('; ')}`);
  }

  const config = buildConfig(beats, brief, assetsDir);
  const deliverable = path.join(outDir, 'deliverable');
  fs.mkdirSync(deliverable, { recursive: true });
  if (fs.existsSync(assetsDir)) fs.cpSync(assetsDir, path.join(deliverable, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(deliverable, 'index.html'), pageHtml(config, langs, brief));
  fs.writeFileSync(path.join(outDir, 'scroll-config.json'), JSON.stringify(config, null, 2));
  return deliverable;
}

if (require.main === module) {
  const [scenes, brief, assets, out] = process.argv.slice(2);
  if (!scenes || !brief || !assets) { console.error('usage: node scroll-cinematic.js <scene-list.json> <brief-validated.json> <assetsDir> [outDir]'); process.exit(1); }
  const d = assemble(scenes, brief, assets, out || path.join(__dirname, '..', 'output'));
  console.log(`scroll-cinematic: deliverable → ${d}`);
}

module.exports = { assemble, buildConfig };
