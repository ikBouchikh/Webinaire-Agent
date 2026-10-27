/* Visite chaque univers : accueil, première station, fiche d'un produit de la vitrine. */
const { launch, open, idle } = require('./lib');
const fs = require('fs'); const out = process.argv[2] || '/tmp/shots'; fs.mkdirSync(out, { recursive: true });
const ks = (process.argv[3] || '0,1,2,3,4,5').split(',').map(Number);
(async () => {
  const { browser, page, log } = await launch({ viewport: { width: 1100, height: 650 } });
  await open(page, '?debug=1&fast=6&go=explore'); await idle(page);
  for (const k of ks) {
    await page.evaluate((k) => LDC.debug.hallTo('doors', k), k); await page.waitForTimeout(300); await idle(page);
    await page.evaluate((k) => LDC.debug.enterWorld(k), k);
    await page.waitForFunction(() => LDC.debug.view() === 'world' && !LDC.debug.busy(), null, { timeout: 60000 });
    await page.waitForTimeout(1500); await page.screenshot({ path: `${out}/k${k}-a-accueil.png` });
    await page.evaluate(() => LDC.debug.goRail(1)); await page.waitForTimeout(2600); await page.screenshot({ path: `${out}/k${k}-b-station.png` });
    await page.evaluate(() => LDC.debug.leaveWorld()); await page.waitForTimeout(500); await idle(page);
  }
  console.log('errors:', log.errors.join('\n') || 'none'); console.log('network:', log.network.join('\n') || 'none');
  await browser.close();
})();
