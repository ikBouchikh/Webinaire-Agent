/* Parcours complet avec captures : accueil → portes → Code civil → Chiffre → entrée dans un univers → fiche. */
const { launch, open } = require('./lib');
const fs = require('fs'); const out = process.argv[2] || '/tmp/shots'; fs.mkdirSync(out, { recursive: true });
const shot = async (page, n) => { await page.screenshot({ path: `${out}/${n}.png` }); };
(async () => {
  const { browser, page, log } = await launch();
  await open(page, '?debug=1&fast=5&go=explore');
  await page.waitForTimeout(800); await shot(page, '10-home');
  await page.evaluate(() => LDC.debug.hallTo('doors', 0)); await page.waitForTimeout(1500); await shot(page, '11-door-droit');
  await page.evaluate(() => LDC.debug.goHall(1)); await page.waitForTimeout(1500); await shot(page, '12-door-chiffre');
  await page.evaluate(() => LDC.debug.hallTo('home')); await page.waitForTimeout(1600);
  await page.evaluate(() => LDC.debug.openPiece('code')); await page.waitForTimeout(2200); await shot(page, '13-code-vision1');
  await page.click('[data-a="next"]'); await page.waitForTimeout(500); await shot(page, '14-code-vision2');
  await page.click('[data-a="next"]'); await page.waitForTimeout(500); await shot(page, '15-code-vision3');
  await page.click('#vision [data-a="close"]'); await page.waitForTimeout(1800);
  await page.evaluate(() => LDC.debug.openPiece('chiffre')); await page.waitForTimeout(2200); await shot(page, '16-chiffre');
  await page.click('#dock [data-d="back"]'); await page.waitForTimeout(1600);
  console.log('errors:', log.errors.join('\n') || 'none'); console.log('network:', log.network.join('\n') || 'none');
  await browser.close();
})();
