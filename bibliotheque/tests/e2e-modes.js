/* Mouvement réduit, « Passer », version courte, repli sans WebGL. */
const { launch, open, idle, watchTrans, trRecords, worldReady } = require('./lib'); const { ok, done } = require('./check');
const fs = require('fs'); const out = process.argv[2] || '/tmp/e2e-modes'; fs.mkdirSync(out, { recursive: true });
(async () => {
  /* 1. prefers-reduced-motion */
  { const { browser, page, log } = await launch({ viewport: { width: 1100, height: 650 }, reducedMotion: 'reduce' });
    await open(page, '?debug=1&go=explore'); await idle(page);
    ok('prefers-reduced-motion : détecté', await page.evaluate(() => LDC.reduced() === true));
    await page.evaluate(() => LDC.debug.hallTo('doors', 2)); await idle(page);
    await watchTrans(page); await page.evaluate(() => LDC.debug.enterWorld(2)); await worldReady(page);
    const rr = await trRecords(page), still = rr.find((r) => /still/.test(r.cls));
    ok('mouvement réduit : image fixe de Cognitio (classe « still », durée ≤ 1 s)', !!still && still.td <= 1, JSON.stringify(still && { td: still.td }));
    ok('mouvement réduit : première visite non comptée comme « vue »', await page.evaluate(() => JSON.parse(localStorage.getItem('ldc-bibliotheque-v4') || '{}').seenTransition !== true));
    process.exitCode = done(log) || process.exitCode; await browser.close(); }

  /* 2. Passer + version courte */
  { const { browser, page, log } = await launch({ viewport: { width: 1100, height: 650 } });
    await open(page, '?debug=1&fast=6&go=explore'); await idle(page);
    await page.evaluate(() => LDC.debug.hallTo('doors', 0)); await idle(page);
    await watchTrans(page); await page.evaluate(() => LDC.debug.enterWorld(0));
    await page.waitForFunction(() => document.getElementById('trans').classList.contains('on'), null, { timeout: 60000 });
    const t0 = Date.now(); await page.click('#transSkip', { force: true, timeout: 10000 });
    await worldReady(page);
    ok('« Passer » : la séquence se termine sans attendre la fin', Date.now() - t0 < 12000, (Date.now() - t0) + ' ms');
    ok('« Passer » : visite enregistrée comme vue', await page.evaluate(() => JSON.parse(localStorage.getItem('ldc-bibliotheque-v4')).seenTransition === true));
    await page.evaluate(() => LDC.debug.leaveWorld()); await page.waitForTimeout(500); await idle(page);
    ok('retour à la Grande salle (porte entrouverte)', await page.evaluate(() => LDC.debug.view() === 'hall' && /Grande salle/.test(document.getElementById('crumbs').innerText)));
    await watchTrans(page); await page.evaluate(() => LDC.debug.enterWorld(0)); await worldReady(page);
    const sh = (await trRecords(page)).find((r) => /play/.test(r.cls));
    ok('visite suivante : version courte (≈1,4 s)', !!sh && /short/.test(sh.cls) && sh.td < 2, JSON.stringify(sh && { cls: sh.cls, td: sh.td }));
    await page.keyboard.press('Escape'); await page.waitForTimeout(800); await idle(page);
    ok('Échap dans un univers : retour à la Grande salle', await page.evaluate(() => LDC.debug.view() === 'hall'));
    process.exitCode = done(log) || process.exitCode; await browser.close(); }

  /* 3. sans WebGL */
  { const { browser, page, log } = await launch({ viewport: { width: 1100, height: 700 } });
    await open(page, '?nogl=1&debug=1');
    ok('sans WebGL : version statique affichée, canvas masqué', await page.evaluate(() => !document.getElementById('static').hidden && document.getElementById('gl').hidden));
    ok('sans WebGL : six univers, stations listées', await page.evaluate(() => document.querySelectorAll('#static .mc').length === 6 && document.querySelectorAll('#static [data-st]').length >= 30));
    await page.screenshot({ path: out + '/static.png' });
    await page.click('#static [data-m="1"][data-st="0"]'); await page.waitForSelector('#sheet.show');
    ok('sans WebGL : liste de produits d\'une station', await page.evaluate(() => document.querySelectorAll('#sheet .prow').length === 102));
    await page.click('#sheet .pgrp > summary'); await page.click('#sheet .pgrp[open] .prow .t'); await page.waitForSelector('#sheet [role=tablist]'); await page.click('#sheet .pf .btn-primary'); await page.waitForTimeout(200);
    ok('sans WebGL : ajout à la sélection client', await page.evaluate(() => LDC.selection.count() === 1));
    await page.click('#modePitch'); await page.waitForSelector('#pitch.show');
    ok('sans WebGL : Pitch guidé disponible', await page.evaluate(() => /étape 1 sur 6/.test(document.querySelector('#pitch .kicker').innerText)));
    ok('sans WebGL : Cognitio présente', await page.evaluate(() => document.getElementById('cgText').innerText.length > 10));
    process.exitCode = done(log) || process.exitCode; await browser.close(); }
})();
