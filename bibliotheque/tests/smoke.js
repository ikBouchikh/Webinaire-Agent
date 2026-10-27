const { launch, open, ROOT } = require('./lib');
const fs = require('fs'); const out = process.argv[2] || '/tmp/shots'; fs.mkdirSync(out, { recursive: true });
(async () => {
  const { browser, page, log } = await launch();
  await open(page, '?debug=1&fast=4');
  await page.screenshot({ path: out + '/01-intro.png' });
  await page.click('#goExplore'); await page.waitForTimeout(1500);
  await page.screenshot({ path: out + '/02-home.png' });
  console.log('errors:', log.errors.join('\n') || 'none'); console.log('network:', log.network.join('\n') || 'none');
  await browser.close();
})();
