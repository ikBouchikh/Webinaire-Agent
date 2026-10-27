/* Parcours de base : lancement par double-clic (file://), Grande salle, Code civil, six portes, transition,
   univers, retour, fiche produit, sélection, persistance. */
const { launch, open, idle, watchTrans, trRecords, worldReady } = require('./lib'); const { ok, done } = require('./check');
const fs = require('fs'); const out = process.argv[2] || '/tmp/e2e'; fs.mkdirSync(out, { recursive: true });
(async () => {
  const { browser, ctx, page, log } = await launch({ viewport: { width: 1100, height: 650 } });
  const t0 = Date.now(); await open(page, '?debug=1&fast=6');
  ok('lancement file:// : application prête', await page.evaluate(() => document.documentElement.dataset.ready === '1'), `${Date.now() - t0} ms`);
  ok('fichiers du catalogue chargés (2 027 produits)', await page.evaluate(() => LDC.cat.total === 2027));
  ok('écran d\'accueil visible, deux modes proposés', await page.evaluate(() => document.getElementById('intro').classList.contains('show') && !!document.getElementById('goPitch')));
  await page.screenshot({ path: out + '/01-intro.png' });

  /* ---- Exploration : Grande salle ---- */
  await page.click('#goExplore'); await idle(page);
  ok('Grande salle : crumb et carte du lieu', await page.evaluate(() => document.getElementById('crumbs').innerText.includes('Grande salle') && document.getElementById('dock').innerText.includes('Droit, édition, chiffre')));
  ok('Cognitio affiche une réplique et son image', await page.evaluate(() => document.getElementById('cgText').innerText.length > 20 && document.getElementById('cgImg').complete));
  ok('deux pièces centrales atteignables au clavier (Code civil, Grand Livre du Chiffre)', await page.evaluate(() => [...document.querySelectorAll('#hotspots button')].filter((b) => !b.hidden && /Code civil|Grand Livre du Chiffre/.test(b.getAttribute('aria-label'))).length === 2));
  await page.screenshot({ path: out + '/02-hall.png' });

  /* ---- Code civil au clavier ---- */
  await page.evaluate(() => { [...document.querySelectorAll('#hotspots button')].find((b) => /Code civil/.test(b.getAttribute('aria-label'))).focus(); });
  await page.keyboard.press('Enter'); await page.waitForSelector('#vision.show', { timeout: 20000 }); await idle(page);
  ok('Code civil (Entrée) : trois étapes, titre attendu', await page.evaluate(() => /De l.expertise éditoriale à l.action professionnelle/.test(document.getElementById('visionTitle').innerText) && document.querySelectorAll('#vision .vsteps button').length === 3));
  await page.click('#vision [data-step="2"]');
  const cta = await page.evaluate(() => [...document.querySelectorAll('#vision [data-cta]')].map((b) => b.innerText.replace(/\s*→/, '').trim()));
  ok('étape « offre » : quatre CTA du brief', JSON.stringify(cta) === JSON.stringify(['Découvrir notre approche', 'Explorer nos domaines', 'Construire une réponse client', 'Découvrir l\'offre Droit']), cta.join(' | '));
  ok('étape « offre » : comptages issus du catalogue', await page.evaluate(() => /2\s?027/.test(document.getElementById('vision').innerText) && /56/.test(document.getElementById('vision').innerText)));
  await page.screenshot({ path: out + '/03-vision-offre.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300); await idle(page);
  ok('Échap ferme la vision et revient dans la salle', await page.evaluate(() => !document.getElementById('vision').classList.contains('show') && LDC.debug.piece() === null));

  /* ---- Grand Livre du Chiffre ---- */
  await page.evaluate(() => LDC.debug.openPiece('chiffre')); await idle(page);
  ok('Grand Livre du Chiffre : carte dédiée avec l\'intitulé du client', await page.evaluate(() => /Le Grand Livre du Chiffre/i.test(document.getElementById('dock').innerText) && /La table des décisions/i.test(document.getElementById('dock').innerText)));
  await page.screenshot({ path: out + '/04-chiffre.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300); await idle(page);

  /* ---- six portes ---- */
  const names = [];
  for (let k = 0; k < 6; k++) {
    await page.evaluate((k) => LDC.debug.hallTo('doors', k), k); await page.waitForTimeout(200); await idle(page);
    names.push(await page.evaluate(() => document.querySelector('#dock h2').innerText));
  }
  ok('six portes : six univers distincts', new Set(names).size === 6, names.join(' | '));
  await page.screenshot({ path: out + '/05-door.png' });

  /* ---- première transition (complète), univers Chiffre ---- */
  await page.evaluate(() => LDC.debug.hallTo('doors', 1)); await page.waitForTimeout(200); await idle(page);
  await watchTrans(page); await page.evaluate(() => LDC.debug.enterWorld(1)); await worldReady(page);
  const rec = await trRecords(page), play = rec.find((r) => /play/.test(r.cls));
  ok('première transition : séquence complète (≈3,8 s), phrase de Cognitio, bouton « Passer »', !!play && !/short|still/.test(play.cls) && play.td > 3 && /entrons dans l.observatoire/i.test(play.say) && await page.evaluate(() => !!document.getElementById('transSkip')), JSON.stringify(play && { td: play.td, say: play.say }));
  ok('univers Chiffre : accueil avec promesse et accessoire de Cognitio', await page.evaluate(() => /Chiffre/.test(document.getElementById('crumbs').innerText) && /chiffre/.test(document.getElementById('cgImg').src)));
  ok('transition vue enregistrée (visites suivantes courtes)', await page.evaluate(() => JSON.parse(localStorage.getItem('ldc-bibliotheque-v4')).seenTransition === true));
  await page.screenshot({ path: out + '/07-world-accueil.png' });

  /* ---- rail, station, liste, fiche ---- */
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(600); await idle(page);
  ok('flèche → : première station (CA Comptabilité)', await page.evaluate(() => /CA/.test(document.querySelector('#dock h2').parentElement.innerText) && /Comptabilité/.test(document.getElementById('crumbs').innerText)));
  const hs = await page.evaluate(() => [...document.querySelectorAll('#hotspots button')].filter((b) => !b.hidden).map((b) => b.getAttribute('aria-label')));
  ok('station : en-tête + quatre produits de la vitrine atteignables au clavier', hs.length === 5, hs.length + ' éléments');
  await page.screenshot({ path: out + '/08-station.png' });
  await page.click('#dock [data-d="list"]'); await page.waitForSelector('#sheet.show'); 
  const nRows = await page.evaluate(() => document.querySelectorAll('#sheet .prow').length);
  ok('liste complète de la station (102 produits CA)', nRows === 102, 'lignes: ' + nRows);
  await page.fill('#stQ', 'comptes'); await page.waitForTimeout(200);
  ok('recherche dans la station filtre la liste', await page.evaluate(() => { const n = document.querySelectorAll('#sheet .prow').length; return n > 0 && n < 102; }));
  await page.fill('#stQ', '');
  await page.click('#sheet .pgrp > summary'); await page.click('#sheet .pgrp[open] .prow .t'); await page.waitForSelector('#sheet [role=tablist]');
  const tabs = await page.evaluate(() => [...document.querySelectorAll('#sheet [role=tab]')].map((b) => b.innerText));
  ok('fiche produit : quatre onglets du brief', JSON.stringify(tabs) === JSON.stringify(['Pour quel besoin ?', 'Notre réponse', 'Compétences ROME 4', 'Argumentaire commercial']), tabs.join(' | '));
  const bodies = {};
  for (const [i, k] of ['besoin', 'reponse', 'rome', 'argu'].entries()) { await page.click(`#tab-${k}`); await page.waitForTimeout(150); bodies[k] = await page.evaluate(() => document.getElementById('sheet').innerText); if (i === 3) await page.screenshot({ path: out + '/09-fiche-argu.png' }); }
  ok('fiche : champs commerciaux absents → « À VALIDER » (aucun texte inventé)', /À VALIDER/i.test(bodies.besoin) && /À VALIDER/i.test(bodies.reponse) && /À VALIDER/i.test(bodies.argu));
  ok('fiche : onglet ROME 4 sans mapping → encart « À VALIDER »', /Rattachement ROME 4 à valider/i.test(bodies.rome));
  await page.screenshot({ path: out + '/10-fiche-rome.png' });
  ok('fiche : action principale « Ajouter à la sélection client »', await page.evaluate(() => /Ajouter à la sélection client/.test(document.querySelector('#sheet .pf .btn-primary').innerText)));
  await page.click('#sheet .pf .btn-primary'); await page.waitForTimeout(200);
  ok('ajout : compteur de l\'en-tête = 1, coche posée sur le produit', await page.evaluate(() => document.getElementById('selCount').innerText === '1' && LDC.selection.count() === 1));

  /* ---- sélection client ---- */
  await page.click('#btnSel'); await page.waitForSelector('#selection.show');
  const sel = await page.evaluate(() => document.getElementById('selection').innerText);
  ok('sélection client : produit, durée, formats, ROME « À VALIDER », argument principal', /Produits retenus/i.test(sel) && /Durée cumulée/i.test(sel) && /Formats/i.test(sel) && /Argument principal/i.test(sel) && /ROME 4/i.test(sel));
  await page.fill('#selArg', 'Test : sécuriser la clôture des comptes.');
  const txt = await page.evaluate(() => LDC.selection.toText());
  ok('synthèse texte : sections et argument saisi', /PROPOSITION CLIENT/.test(txt) && /PRODUITS RETENUS \(1\)/.test(txt) && /Test : sécuriser la clôture/.test(txt) && /COMPÉTENCES ROME 4 MOBILISÉES/.test(txt) && /À VALIDER/.test(txt));
  ok('synthèse : aucun tarif ni nom de collaborateur', !/€|tarif|prix/i.test(txt));
  const pr = await page.evaluate(() => { LDC.selection.print = () => {}; document.getElementById('print').innerHTML = LDC.selection.printHTML(); return document.getElementById('print').innerText; });
  ok('version imprimable : tableau des produits et sources', /Proposition client/.test(pr) && /Produits retenus/.test(pr) && /Base_produits/.test(pr));
  await page.screenshot({ path: out + '/11-selection.png' });
  await page.waitForTimeout(500);
  await page.reload(); await page.waitForFunction(() => document.documentElement.dataset.ready === '1'); await page.waitForTimeout(300);
  ok('persistance locale : sélection et argument conservés après rechargement', await page.evaluate(() => LDC.selection.count() === 1 && /clôture des comptes/.test(LDC.state.client.argument)));
  await page.evaluate(() => { LDC.resetClient(); });
  ok('réinitialisation : sélection vidée', await page.evaluate(() => LDC.selection.count() === 0 && LDC.state.client.argument === ''));
  process.exitCode = done(log); await browser.close();
})();
