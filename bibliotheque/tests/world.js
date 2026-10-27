/* Entrée dans un univers, rails de stations, liste, fiche produit, sélection. */
const { launch, open, idle } = require('./lib');
const fs = require('fs'); const out = process.argv[2] || '/tmp/shots'; const k = +(process.argv[3] || 0); fs.mkdirSync(out, { recursive: true });
const shot = async (page, n) => { await page.screenshot({ path: `${out}/${n}.png` }); };
(async () => {
  const { browser, page, log } = await launch();
  await open(page, '?debug=1&fast=5&go=explore');
  await page.waitForTimeout(500);
  await idle(page); await page.evaluate((k) => { LDC.debug.hallTo('doors', k); }, k); await page.waitForTimeout(300); await idle(page); await shot(page, `w${k}-d-door`);
  await page.evaluate((k) => { LDC.debug.enterWorld(k); }, k);
  await page.waitForTimeout(2500); await shot(page, `w${k}-0-transition`);
  await page.waitForFunction(() => LDC.debug.view() === 'world' && !LDC.debug.busy(), null, { timeout: 30000 });
  await page.waitForTimeout(1200); await shot(page, `w${k}-1-accueil`);
  await page.evaluate(() => LDC.debug.goRail(1)); await page.waitForTimeout(2500); await shot(page, `w${k}-2-station1`);
  await page.evaluate(() => LDC.debug.goRail(2)); await page.waitForTimeout(2500); await shot(page, `w${k}-3-station2`);
  console.log('errors:', log.errors.join('\n') || 'none'); console.log('network:', log.network.join('\n') || 'none');
  await browser.close();
})();
