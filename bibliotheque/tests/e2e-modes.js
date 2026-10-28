/* Mouvement réduit, « Passer », version courte, repli sans WebGL. */
const { launch, open, idle, watchTrans, trRecords, worldReady } = require('./lib'); const { ok, done } = require('./check');
const fs = require('fs'); const out = process.argv[2] || '/tmp/e2e-modes'; fs.mkdirSync(out, { recursive: true });
(async () => {
  /* 1. prefers-reduced-motion */
  { const { browser, page, log } = await launch({ viewport: { width: 1100, height: 650 }, reducedMotion: 'reduce' });
    await open(page, '?debug=1'); await idle(page);
    ok('prefers-reduced-motion : détecté', await page.evaluate(() => LDC.reduced() === true));
    await page.evaluate(() => LDC.debug.hallTo('doors', 2)); await idle(page);
    await watchTrans(page); await page.evaluate(() => LDC.debug.enterWorld(2)); await worldReady(page);
    const rr = await trRecords(page), still = rr.find((r) => /still/.test(r.cls));
    ok('mouvement réduit : image fixe de Cognitio (classe « still », durée ≤ 1 s)', !!still && still.td <= 1, JSON.stringify(still && { td: still.td }));
    ok('mouvement réduit : première visite non comptée comme « vue »', await page.evaluate(() => JSON.parse(localStorage.getItem('ldc-bibliotheque-v4') || '{}').seenTransition !== true));
    process.exitCode = done(log) || process.exitCode; await browser.close(); }

  /* 2. Passer + version courte */
  { const { browser, page, log } = await launch({ viewport: { width: 1100, height: 650 } });
    await open(page, '?debug=1&fast=6'); await idle(page);
    await page.evaluate(() => LDC.debug.hallTo('doors', 0)); await idle(page);
    /* « Passer » est cliqué par le navigateur dès que la séquence démarre (pas de course avec les à-coups du rendu logiciel) */
    await watchTrans(page);
    await page.evaluate(() => { const el = document.getElementById('trans'); const o = new MutationObserver(() => { if (el.classList.contains('play')) { o.disconnect(); document.getElementById('transSkip').click(); } }); o.observe(el, { attributes: true, attributeFilter: ['class'] }); });
    await page.evaluate(() => LDC.debug.enterWorld(0)); await worldReady(page);
    const sk = await trRecords(page), p0 = sk.find((r) => /play/.test(r.cls)), p1 = sk.find((r) => r.t >= (p0 ? p0.t : 0) && !/\bon\b/.test(r.cls));
    ok('« Passer » : la séquence s\'arrête sans attendre les 3,8 s', !!p0 && !!p1 && (p1.t - p0.t) < 3000, p0 && p1 ? (p1.t - p0.t) + ' ms entre le début de la séquence et la sortie' : 'séquence non observée');
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
    await page.click('#sheet .x, #sheet [data-a="close"]'); await page.waitForTimeout(500);
    await page.click('#static [data-s="vision"]'); await page.waitForSelector('#vision.show');
    ok('sans WebGL : « Découvrir notre vision » ouvre le Code civil en trois étapes', await page.evaluate(() => document.querySelectorAll('#vision .vsteps button').length === 3));
    ok('sans WebGL : ni Pitch guidé ni bascule de mode', await page.evaluate(() => !document.getElementById('modePitch') && !document.getElementById('pitch') && !/pitch/i.test(document.getElementById('static').innerText)));
    process.exitCode = done(log) || process.exitCode; await browser.close(); }
})();
