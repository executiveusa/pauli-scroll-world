/* ============================================================================
   COSMOS Studio — stage 06: proposal generator
   ----------------------------------------------------------------------------
   Fills the market-language proposal from payment-plan.json + market config.
   Usage: node proposal-generator.js <payment-plan.json> <market_id> [outDir]
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const MARKETS_DIR = path.join(__dirname, '..', '..', '_config', 'markets');

// Proposal copy per language. Krug three-question gate applied: short, verb CTAs.
const COPY = {
  en: {
    lang: 'en', title: 'Proposal', ready: 'Your world is ready to preview.',
    preview: 'Watch the preview', what: 'What you get', own: 'How you own it',
    ownBody: 'Down payment starts it. {months} monthly payments finish it. Then it is yours forever — full source, no subscription.',
    miss: 'Miss a payment? After 7 days the system pauses new work. Your data stays safe. Pay, and it resumes instantly.',
    cta: 'Approve and start',
  },
  es: {
    lang: 'es', title: 'Propuesta', ready: 'Tu mundo está listo para ver.',
    preview: 'Ver el preview', what: 'Qué recibes', own: 'Cómo lo haces tuyo',
    ownBody: 'El anticipo lo inicia. {months} pagos mensuales lo completan. Después es tuyo para siempre — código completo, sin suscripción.',
    miss: '¿Un pago se retrasa? A los 7 días el sistema pausa el trabajo nuevo. Tus datos quedan a salvo. Pagas, y sigue al instante.',
    cta: 'Aprobar y empezar',
  },
  sr: {
    lang: 'sr', title: 'Ponuda', ready: 'Tvoj svet je spreman za pregled.',
    preview: 'Pogledaj pregled', what: 'Šta dobijaš', own: 'Kako postaje tvoje',
    ownBody: 'Kapara pokreće posao. {months} mesečnih rata ga završava. Posle je zauvek tvoje — ceo kod, bez pretplate.',
    miss: 'Kasni rata? Posle 7 dana sistem pauzira novi rad. Podaci ostaju bezbedni. Platiš — i odmah nastavlja.',
    cta: 'Odobri i kreni',
  },
};

function langForMarket(marketId) {
  const md = fs.readFileSync(path.join(MARKETS_DIR, `${marketId}.md`), 'utf8');
  const lang = (md.match(/language:\s*(\S+)/i) || [])[1] || 'English';
  if (/spanish|español/i.test(lang)) return 'es';
  if (/serbian|srpski/i.test(lang)) return 'sr';
  return 'en';
}

function hookForMarket(marketId) {
  const md = fs.readFileSync(path.join(MARKETS_DIR, `${marketId}.md`), 'utf8');
  return (md.match(/hook_line:\s*"([^"]+)"/) || [])[1] || '';
}

function generate(plan, marketId, deliverables = []) {
  const lang = langForMarket(marketId);
  const c = COPY[lang];
  const money = n => `${plan.currency} ${Number(n).toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'sr-RS')}`;
  return {
    lang,
    text: [
      `# ${c.title} — ${plan.brand_name || ''}`.trim(),
      '',
      `> ${hookForMarket(marketId)}`,
      '',
      c.ready,
      '',
      `**[${c.preview}](PREVIEW_URL)**`,
      '',
      `## ${c.what}`,
      ...(deliverables.length ? deliverables.map(d => `- ${d}`) : ['- ' + (plan.tier || 'growth')]),
      '',
      `## ${c.own}`,
      `| | |`,
      `|---|---|`,
      `| ${lang === 'en' ? 'Total' : lang === 'es' ? 'Total' : 'Ukupno'} | ${money(plan.price)} |`,
      `| ${lang === 'en' ? 'Down payment' : lang === 'es' ? 'Anticipo' : 'Kapara'} (33%) | ${money(plan.down_payment)} |`,
      `| ${lang === 'en' ? 'Monthly' : lang === 'es' ? 'Mensual' : 'Mesečno'} × ${plan.months} | ${money(plan.monthly)} |`,
      '',
      c.ownBody.replace('{months}', plan.months),
      '',
      c.miss,
      '',
      `**[${c.cta}](PAYMENT_LINK)**`,
      '',
    ].join('\n'),
  };
}

if (require.main === module) {
  const [planPath, marketId, outDir] = process.argv.slice(2);
  if (!planPath || !marketId) { console.error('usage: node proposal-generator.js <payment-plan.json> <market_id> [outDir]'); process.exit(1); }
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const { lang, text } = generate(plan, marketId);
  const out = path.join(outDir || path.join(__dirname, 'output'), `proposal-${lang}.md`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, text);
  console.log(`proposal-generator: ${out}`);
}

module.exports = { generate, langForMarket };
