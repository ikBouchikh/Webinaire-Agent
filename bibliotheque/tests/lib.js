/* Aide commune aux tests Playwright : lance Chromium (WebGL logiciel), ouvre index.html en file://,
   journalise erreurs console, erreurs de page et toute requête non-file (réseau). */
const path = require('path');
const { chromium } = require('playwright');
const ROOT = process.env.LDC_ROOT || path.resolve(__dirname, '..');
exports.ROOT = ROOT;
exports.launch = async (opts = {}) => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 760 }, reducedMotion: opts.reducedMotion || 'no-preference', deviceScaleFactor: opts.dpr || 1, hasTouch: !!opts.touch });
  const page = await ctx.newPage(); const log = { errors: [], network: [], warnings: [], requests: [] };
  /* le rendu WebGL logiciel est lent : on interroge par intervalle (et non par requestAnimationFrame) */
  const wff = page.waitForFunction.bind(page); page.waitForFunction = (fn, arg, o = {}) => wff(fn, arg, { polling: 200, ...o });
  page.on('console', (m) => { if (m.type() === 'error') log.errors.push(m.text()); if (m.type() === 'warning') log.warnings.push(m.text()); });
  page.on('pageerror', (e) => log.errors.push('PAGEERROR: ' + e.message));
  page.on('request', (r) => { const u = r.url(); log.requests.push(u); if (!/^(file|data|blob):/.test(u)) log.network.push(u); });
  page.on('requestfailed', (r) => log.errors.push('REQUESTFAILED: ' + r.url()));
  return { browser, ctx, page, log };
};
exports.open = async (page, query = '') => {
  await page.goto('file://' + ROOT + '/index.html' + query);
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1' || document.getElementById('static') && !document.getElementById('static').hidden, null, { timeout: 20000 });
  await page.waitForTimeout(400);
};

/* Attend que l'application soit au repos (aucune animation en cours). */
exports.idle = (page, timeout = 40000) => page.waitForFunction(() => window.LDC && LDC.debug && !LDC.debug.busy() && !LDC.transition.active, null, { timeout });
exports.view = (page) => page.evaluate(() => LDC.debug.view());

/* Observe la transition (le rendu logiciel peut figer la page plusieurs secondes : on enregistre au lieu de scruter). */
exports.watchTrans = (page) => page.evaluate(() => { const el = document.getElementById('trans'); window.__tr = []; new MutationObserver(() => window.__tr.push({ t: Date.now(), cls: el.className, td: parseFloat(el.style.getPropertyValue('--td')), say: document.getElementById('transSay').innerText })).observe(el, { attributes: true, attributeFilter: ['class'] }); });
exports.trRecords = (page) => page.evaluate(() => window.__tr);
exports.worldReady = (page, timeout = 120000) => page.waitForFunction(() => LDC.debug.view() === 'world' && !LDC.debug.busy(), null, { timeout });
