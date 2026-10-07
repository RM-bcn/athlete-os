/**
 * Genereert de screenshots voor de repo.
 *
 *   node tools/screenshots.mjs
 *
 * Vereist een Chromium die op dit systeem draait (Alpine → /usr/bin/chromium).
 * Volledige pagina's + per-sectie shots, desktop (1440) en mobiel (390 @2x).
 * Resultaat komt in screenshots/.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// playwright mag lokaal of elders geïnstalleerd zijn; via PLAYWRIGHT_MODULE wijs je
// naar een absoluut pad als het niet in de repo staat.
const pwSpec = process.env.PLAYWRIGHT_MODULE;
const pwMod = pwSpec ? await import(pathToFileURL(pwSpec).href) : await import('playwright');
// CJS-vs-ESM: de named export kan onder .default zitten
const chromium = pwMod.chromium || pwMod.default?.chromium;
if (!chromium) throw new Error('playwright niet gevonden — zet PLAYWRIGHT_MODULE naar het pad van playwright/index.js');
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'screenshots');
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium';

const PAGES = [
  { file: 'index.html', slug: 'index', title: 'Voorstel (pitch deck)' },
  { file: 'science.html', slug: 'science', title: 'Wetenschap' },
  { file: 'strength.html', slug: 'strength', title: 'Kracht & doel' },
  { file: 'backend.html', slug: 'backend', title: 'Backend / architectuur' },
  { file: 'frontend.html', slug: 'frontend', title: 'Interface' },
];

// secties waar de uitlijning het meest kritisch is
const SECTIONS = {
  index: ['hero', 'probleem', 'kernvondst', 'setup', 'brein', 'skills', 'doelen', 'fasen', 'keuzes', 'opbrengst', 'grenzen', 'kosten', 'beslispunten'],
  science: ['verdeling', 'periodisering', 'loadmodel', 'niet', 'stabiliteit', 'evidentie'],
  strength: ['doelen', 'interferentie', 'krachtwetenschap', 'samenstellen', 'bibliotheek', 'hevy', 'weegschaal', 'beschikbaarheid', 'anderesporten'],
  backend: ['architectuur', 'opslag', 'schrijfwegen', 'lagen', 'structuur', 'datamodel', 'skills-io', 'regels', 'planning'],
  frontend: ['oppervlakken', 'telefoon', 'kaart', 'herstel', 'kracht-beschikbaarheid', 'desktop', 'ontwerp'],
};

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000, scale: 1 },
  { name: 'mobile', width: 390, height: 844, scale: 2 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shoot(page, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await page.screenshot({ path: dest });
}

async function ready(page, file) {
  await page.goto('file://' + path.join(ROOT, file), { waitUntil: 'load' });
  // wacht tot de fonts geladen zijn en de draw-animatie klaar is
  try {
    await page.evaluate(() => document.fonts && document.fonts.ready);
  } catch {}
  await sleep(2900);
}

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const report = [];

for (const vp of VIEWPORTS) {
  for (const p of PAGES) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.scale,
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    await ready(page, p.file);

    // volledige pagina
    const full = path.join(OUT, vp.name, `${p.slug}-full.png`);
    await shoot(page, full);
    const dims = await page.evaluate(() => ({
      h: document.body.scrollHeight,
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));

    // per sectie
    for (const id of SECTIONS[p.slug]) {
      const el = await page.$('#' + id);
      if (!el) continue;
      await el.scrollIntoViewIfNeeded();
      await sleep(650);
      await shoot(page, path.join(OUT, vp.name, 'sections', `${p.slug}--${id}.png`));
    }

    report.push({
      viewport: vp.name,
      page: p.slug,
      height: dims.h,
      overflow: dims.sw > dims.cw ? `⚠ ${dims.sw} > ${dims.cw}` : 'geen',
      errors: errors.length ? errors.slice(0, 3).join(' | ') : 'geen',
    });
    await page.close();
  }
}

await browser.close();

// rapport
console.log('\n=== screenshot rapport ===');
const w1 = 9, w2 = 9;
console.log('viewport'.padEnd(w1), 'pagina'.padEnd(w2), 'hoogte'.padStart(8), '  overflow'.padEnd(18), 'js-fouten');
for (const r of report) {
  console.log(r.viewport.padEnd(w1), r.page.padEnd(w2), String(r.height).padStart(8), '  ' + r.overflow.padEnd(16), r.errors);
}
const n = (await fs.readdir(OUT, { recursive: true })).filter((f) => f.endsWith('.png')).length;
console.log('\n' + n + ' screenshots geschreven naar screenshots/');
