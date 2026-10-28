/* Parcours de base : lancement par double-clic (file://), démarrage direct dans la Grande salle (sans écran d'intro,
   sans Pitch guidé), Code civil central, touches de Chiffre dans le décor, échelle des six portes alignées sur le site,
   charte bleue et logo officiel, Code civil, transition, univers, changement de porte, fiche produit, sélection, persistance. */
const { launch, open, idle, watchTrans, trRecords, worldReady } = require('./lib'); const { ok, done } = require('./check');
const fs = require('fs'); const out = process.argv[2] || '/tmp/e2e'; fs.mkdirSync(out, { recursive: true });
(async () => {
  const { browser, ctx, page, log } = await launch({ viewport: { width: 1100, height: 650 } });
  const t0 = Date.now(); await open(page, '?debug=1&fast=6'); await idle(page);
  ok('lancement file:// : application prête', await page.evaluate(() => document.documentElement.dataset.ready === '1'), `${Date.now() - t0} ms`);
  ok('fichiers du catalogue chargés (2 027 produits)', await page.evaluate(() => LDC.cat.total === 2027));

  /* ---- entrée : directement la Grande salle ---- */
  ok('aucun écran d\'introduction, aucun Pitch guidé, aucune bascule de mode', await page.evaluate(() => !document.getElementById('intro') && !document.getElementById('goPitch') && !document.getElementById('pitch') && !document.getElementById('modePitch') && !document.getElementById('goExplore')));
  ok('démarrage dans la Grande salle', await page.evaluate(() => LDC.debug.view() === 'hall' && LDC.debug.hallMode() === 'home' && document.getElementById('crumbs').innerText.includes('Grande salle')));
  ok('Code civil au centre de la salle (x = 0), un seul objet central', await page.evaluate(() => LDC.S.CODE_X === 0 && !LDC.debug.hall().chiffre && !LDC.debug.hall().chiffreCenter));
  ok('carte du bas : Code civil à la une', await page.evaluate(() => /Le premier Code civil/.test(document.getElementById('dock').innerText) && /Découvrir notre vision/.test(document.getElementById('dock').innerText)));
  const lad = await page.evaluate(() => [...document.querySelectorAll('#dock .lad[data-k]')].map((b) => b.innerText.replace(/\s+/g, ' ').trim()));
  ok('échelle des six portes : I à VI alignés sur les domaines du site', JSON.stringify(lad) === JSON.stringify(['I Droit', 'II Chiffre', 'III Gestion RH', 'IV Numérique', 'V Soft Skills', 'VI QSE']), lad.join(' | '));
  ok('en-tête : logo officiel chargé, aucun repère générique', await page.evaluate(() => { const i = document.getElementById('brandLogo'); return i.complete && i.naturalWidth > 500 && /Lefebvre Dalloz Compétences/.test(i.alt) && !document.querySelector('.brand .ico, .brand svg'); }));
  ok('Cognitio n\'apparaît pas dans la Grande salle (ancien monde)', await page.evaluate(() => getComputedStyle(document.getElementById('cognitio')).display === 'none'));
  ok('charte : action principale en bleu, pastille de compteur seule en rouge', await page.evaluate(() => { const bg = (el) => getComputedStyle(el).backgroundColor; return bg(document.querySelector('#dock .btn-primary')) === 'rgb(23, 115, 160)' && bg(document.getElementById('btnSel')) === 'rgb(23, 115, 160)'; }));
  const cues = await page.evaluate(() => { const c = {}; LDC.debug.hall().group.traverse((o) => { if (o.userData.cue) c[o.userData.cue] = (c[o.userData.cue] || 0) + 1; }); return c; });
  ok('touches de Chiffre dans le décor : frise de registre, cadran de bronze, six plaques numérotées, poussière de chiffres', cues.frise === 1 && cues.cadran === 1 && cues.plaque === 6 && cues.poussiere === 6, JSON.stringify(cues));
  ok('plaques des portes : chiffre romain et nombre de produits issu du catalogue', await page.evaluate(() => LDC.cat.mondes.every((m) => LDC.roman(m.ordre) && m.n > 0) && LDC.cat.mondes.map((m) => LDC.roman(m.ordre)).join(',') === 'I,II,III,IV,V,VI'));
  await page.waitForFunction(() => [...document.querySelectorAll('#hotspots button')].some((b) => !b.hidden), null, { timeout: 60000 });
  ok('un seul point d\'accès clavier sur la scène : le Code civil', await page.evaluate(() => { const l = [...document.querySelectorAll('#hotspots button')].filter((b) => !b.hidden).map((b) => b.getAttribute('aria-label')); return l.length === 1 && /Code civil/.test(l[0]) && !l.some((x) => /Chiffre/.test(x)); }));
  await page.screenshot({ path: out + '/01-hall.png' });

  /* ---- Code civil au clavier ---- */
  await page.evaluate(() => { [...document.querySelectorAll('#hotspots button')].find((b) => /Code civil/.test(b.getAttribute('aria-label'))).focus(); });
  await page.keyboard.press('Enter'); await page.waitForSelector('#vision.show', { timeout: 20000 }); await idle(page);
  ok('Code civil (Entrée) : trois étapes, titre attendu', await page.evaluate(() => /De l.expertise éditoriale à l.action professionnelle/.test(document.getElementById('visionTitle').innerText) && document.querySelectorAll('#vision .vsteps button').length === 3));
  await page.screenshot({ path: out + '/02-vision-origine.png' });
  await page.click('#vision [data-step="2"]');
  const cta = await page.evaluate(() => [...document.querySelectorAll('#vision [data-cta]')].map((b) => b.innerText.replace(/\s*→/, '').trim()));
  ok('étape « offre » : quatre CTA, sans « Pitch »', JSON.stringify(cta) === JSON.stringify(['Découvrir notre approche', 'Explorer les portes', 'Découvrir l\'offre Droit', 'Découvrir l\'offre Chiffre']), cta.join(' | '));
  ok('étape « offre » : comptages par porte issus du catalogue (2 027 ; 495, 599, 325, 197, 251, 160)', await page.evaluate(() => { const t = document.getElementById('vision').innerText.replace(/[\s  ]/g, ''); return /2027/.test(t) && ['495', '599', '325', '197', '251', '160'].every((n) => t.includes(n)); }));
  await page.screenshot({ path: out + '/03-vision-offre.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300); await idle(page);
  ok('Échap ferme la vision et revient dans la salle', await page.evaluate(() => !document.getElementById('vision').classList.contains('show') && LDC.debug.piece() === null));

  /* ---- échelle : changer de porte d'un clic ---- */
  const want = ['Droit', 'Chiffre', 'Gestion RH', 'Technologies numériques', 'Soft Skills', 'QSE'], names = [];
  for (let k = 0; k < 6; k++) {
    await page.click(`#dock [data-d="door"][data-k="${k}"]`);
    await page.waitForFunction((n) => { const h = document.querySelector('#dock h2'); return h && h.innerText === n; }, want[k], { timeout: 60000 }).catch(() => {});
    await idle(page); names.push(await page.evaluate(() => document.querySelector('#dock h2').innerText));
  }
  ok('échelle : six clics, six portes distinctes (Droit, Chiffre, Gestion RH, Technologies numériques, Soft Skills, QSE)', JSON.stringify(names) === JSON.stringify(['Droit', 'Chiffre', 'Gestion RH', 'Technologies numériques', 'Soft Skills', 'QSE']), names.join(' | '));
  ok('échelle : la porte courante est signalée (aria-current)', await page.evaluate(() => document.querySelectorAll('#dock .lad[aria-current="true"]').length === 1 && /QSE/.test(document.querySelector('#dock .lad[aria-current="true"]').innerText)));
  await page.screenshot({ path: out + '/04-door.png' });

  /* ---- première transition (complète), Chiffre ---- */
  await page.click('#dock [data-d="door"][data-k="1"]'); await page.waitForFunction(() => document.querySelector('#dock h2').innerText === 'Chiffre', null, { timeout: 60000 }); await idle(page);
  await watchTrans(page); await page.click('#dock [data-d="enter"]'); await worldReady(page);
  const rec = await trRecords(page), play = rec.find((r) => /play/.test(r.cls));
  ok('première transition : séquence complète (≈3,8 s), phrase de Cognitio, bouton « Passer »', !!play && !/short|still/.test(play.cls) && play.td > 3 && /entrons dans l.observatoire/i.test(play.say) && await page.evaluate(() => !!document.getElementById('transSkip')), JSON.stringify(play && { td: play.td, say: play.say }));
  ok('univers Chiffre : Cognitio apparaît (accessoire du Chiffre) après la porte', await page.evaluate(() => /Chiffre/.test(document.getElementById('crumbs').innerText) && /chiffre/.test(document.getElementById('cgImg').src) && getComputedStyle(document.getElementById('cognitio')).display !== 'none'));
  ok('transition vue enregistrée (visites suivantes courtes)', await page.evaluate(() => JSON.parse(localStorage.getItem('ldc-bibliotheque-v4')).seenTransition === true));
  ok('l\'échelle des six portes reste en bas dans l\'univers (porte II active, retour Grande salle)', await page.evaluate(() => document.querySelectorAll('#dock .lad[data-k]').length === 6 && /Chiffre/.test(document.querySelector('#dock .lad[aria-current="true"]').innerText) && !!document.querySelector('#dock .lad.home[data-d="leave"]')));
  await page.screenshot({ path: out + '/05-world-accueil.png' });

  /* ---- rail, station, liste, fiche ---- */
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(600); await idle(page);
  ok('flèche → : première station (CA Comptabilité)', await page.evaluate(() => /CA/.test(document.querySelector('#dock h2').parentElement.innerText) && /Comptabilité/.test(document.getElementById('crumbs').innerText)));
  const hs = await page.evaluate(() => [...document.querySelectorAll('#hotspots button')].filter((b) => !b.hidden).map((b) => b.getAttribute('aria-label')));
  ok('station : en-tête + quatre produits de la vitrine atteignables au clavier', hs.length === 5, hs.length + ' éléments');
  await page.screenshot({ path: out + '/06-station.png' });
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
  for (const [i, k] of ['besoin', 'reponse', 'rome', 'argu'].entries()) { await page.click(`#tab-${k}`); await page.waitForTimeout(150); bodies[k] = await page.evaluate(() => document.getElementById('sheet').innerText); if (i === 3) await page.screenshot({ path: out + '/07-fiche-argu.png' }); }
  ok('fiche : champs commerciaux absents → « À VALIDER » (aucun texte inventé)', /À VALIDER/i.test(bodies.besoin) && /À VALIDER/i.test(bodies.reponse) && /À VALIDER/i.test(bodies.argu));
  ok('fiche : onglet ROME 4 sans mapping → encart « À VALIDER »', /Rattachement ROME 4 à valider/i.test(bodies.rome));
  ok('fiche : action principale « Ajouter à la sélection client »', await page.evaluate(() => /Ajouter à la sélection client/.test(document.querySelector('#sheet .pf .btn-primary').innerText)));
  await page.click('#sheet .pf .btn-primary'); await page.waitForTimeout(200);
  ok('ajout : compteur de l\'en-tête = 1, coche posée sur le produit', await page.evaluate(() => document.getElementById('selCount').innerText === '1' && LDC.selection.count() === 1));

  /* ---- sélection client ---- */
  await page.click('#btnSel'); await page.waitForSelector('#selection.show');
  const sel = await page.evaluate(() => document.getElementById('selection').innerText);
  ok('sélection client : produit, durée, formats, ROME « À VALIDER », argument principal', /Produits retenus/i.test(sel) && /Durée cumulée/i.test(sel) && /Formats/i.test(sel) && /Argument principal/i.test(sel) && /ROME 4/i.test(sel));
  ok('sélection client : plus de renvoi vers le Pitch guidé', !/pitch/i.test(sel));
  await page.fill('#selArg', 'Test : sécuriser la clôture des comptes.');
  const txt = await page.evaluate(() => LDC.selection.toText());
  ok('synthèse texte : sections et argument saisi', /PROPOSITION CLIENT/.test(txt) && /PRODUITS RETENUS \(1\)/.test(txt) && /Test : sécuriser la clôture/.test(txt) && /COMPÉTENCES ROME 4 MOBILISÉES/.test(txt) && /À VALIDER/.test(txt));
  ok('synthèse : aucun tarif ni nom de collaborateur', !/€|tarif|prix/i.test(txt));
  const pr = await page.evaluate(() => { LDC.selection.print = () => {}; document.getElementById('print').innerHTML = LDC.selection.printHTML(); return document.getElementById('print').innerText; });
  ok('version imprimable : tableau des produits et sources', /Proposition client/.test(pr) && /Produits retenus/.test(pr) && /Base_produits/.test(pr));
  await page.screenshot({ path: out + '/08-selection.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);

  /* ---- changer de porte depuis l'univers : Chiffre → Technologies numériques ---- */
  await page.click('#dock [data-d="door"][data-k="3"]'); await worldReady(page);
  ok('changement de porte dans l\'univers : on arrive dans Technologies numériques (accessoire « technologies »)', await page.evaluate(() => /Technologies numériques/.test(document.getElementById('crumbs').innerText) && /technologies/.test(document.getElementById('cgImg').src) && /Numérique/.test(document.querySelector('#dock .lad[aria-current="true"]').innerText)));
  await page.screenshot({ path: out + '/09-world-tech.png' });

  /* ---- persistance ---- */
  await page.waitForTimeout(500);
  await page.reload(); await page.waitForFunction(() => document.documentElement.dataset.ready === '1'); await page.waitForTimeout(300);
  ok('persistance locale : sélection et argument conservés après rechargement', await page.evaluate(() => LDC.selection.count() === 1 && /clôture des comptes/.test(LDC.state.client.argument)));
  await page.evaluate(() => { LDC.resetClient(); });
  ok('réinitialisation : sélection vidée', await page.evaluate(() => LDC.selection.count() === 0 && LDC.state.client.argument === ''));
  process.exitCode = done(log); await browser.close();
})();
