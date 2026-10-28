/* Moteur de correspondance ROME 4 : exécuté sur la COPIE avec mapping de test (LDC_ROOT). */
const { launch, open } = require('./lib');
let fails = 0; const ok = (label, cond, extra = '') => { console.log((cond ? 'OK   ' : 'ÉCHEC'), label, extra); if (!cond) fails++; };
(async () => {
  const { browser, page, log } = await launch({ viewport: { width: 1200, height: 700 } });
  await open(page, '?debug=1&fast=6');
  const r = await page.evaluate(() => {
    const R = LDC.rome, cat = LDC.cat, out = {};
    out.comp = R.competence(400878);
    out.cover = R.couverture();
    out.mapOne = R.competencesDe('600013').map((c) => ({ id: c.id, lib: c.libelle, imp: c.importance, type: c.type }));
    out.mapNone = R.competencesDe('1470').length;
    const need = { competences: [{ id: 400878 }] };
    const res = R.match(need, cat.produits);
    out.top = res.slice(0, 4).map((x) => ({ c: x.produit.c, niveau: x.niveau, points: x.points, why: x.raisons.map((y) => y.critere) }));
    out.nbRes = res.length;
    out.onlyMapped = res.every((x) => x.rattache);
    const needM = { momentId: 'M-TEST' };
    out.moment = R.match(needM, cat.produits).slice(0, 3).map((x) => ({ c: x.produit.c, niveau: x.niveau, why: x.raisons.map((y) => y.critere) }));
    out.cadre = R.match({ niveau: 'Fondamentaux', formats: ['Inter standard'], dureeMax: 1, mondes: ['droit'] }, cat.produits).slice(0, 3).map((x) => ({ c: x.produit.c, niveau: x.niveau, why: x.raisons.map((y) => y.critere) }));
    out.syn = R.synthese([cat.byCode.get('600013'), cat.byCode.get('521038')]).map((c) => ({ id: c.id, imp: c.importance, n: c.produits.length }));
    out.search = R.search('marchés publics', 3).map((c) => c.id);
    out.metiers = R.searchMetiers('comptable', 2);
    out.fc = !!cat.certif('701276') && R.competencesDe('701276').length === 0;
    return out;
  });
  ok('compétence ROME exacte (id 400878)', r.comp && r.comp.libelle === 'Appliquer le cadre juridique des marchés publics' && r.comp.type === 'Savoir-faire', JSON.stringify(r.comp && { type: r.comp.type, nature: r.comp.nature }));
  ok('couverture : 3 produits rattachés (fixture), 1 moment', r.cover.produitsRattaches === 3 && r.cover.momentsDefinis === 1, JSON.stringify(r.cover));
  ok('mapping validé relu dans le référentiel (libellé exact)', r.mapOne.length === 1 && r.mapOne[0].lib === 'Appliquer le cadre juridique des marchés publics' && r.mapOne[0].imp === 'coeur');
  ok('produit sans mapping : aucune compétence déduite', r.mapNone === 0);
  ok('besoin « 400878 » : 600013 en tête, 521038 ensuite', r.top[0].c === '600013' && r.top[1].c === '521038', JSON.stringify(r.top.slice(0, 2)));
  ok('600013 : correspondance de fond et raison ROME', ['forte', 'moyenne', 'partielle'].includes(r.top[0].niveau) && r.top[0].why.includes('rome'), JSON.stringify(r.top[0]));
  ok('seuls les produits rattachés ressortent pour un besoin ROME', r.nbRes === 2 && r.onlyMapped, 'n=' + r.nbRes);
  ok('moment de vie : 600013 ressort avec la raison « moment »', r.moment[0].c === '600013' && r.moment[0].why.includes('moment'), JSON.stringify(r.moment));
  ok('cadre seul (niveau/format/durée/univers) : niveau « cadre », jamais « forte »', r.cadre.length > 0 && r.cadre.every((x) => x.niveau === 'cadre'), JSON.stringify(r.cadre[0]));
  ok('synthèse : 400878 couvert par 2 produits, importance cœur', r.syn.find((c) => c.id === 400878).n === 2 && r.syn.find((c) => c.id === 400878).imp === 'coeur');
  ok('recherche de compétences par libellé', r.search.length === 3 && r.search.includes(400878));
  ok('recherche de métiers (ROME)', r.metiers.length === 2 && /^[A-N]\d{4}$/.test(r.metiers[0].code), JSON.stringify(r.metiers[0]));
  ok('France compétences séparé de ROME (produit certifiant sans compétence ROME)', r.fc);

  // fiche : onglet ROME avec compétence validée, puis produit sans mapping
  await page.evaluate(() => LDC.sheet.openProduct(LDC.cat.byCode.get('600013'), { tab: 'rome' })); await page.waitForTimeout(500);
  const t1 = await page.evaluate(() => document.getElementById('sheet').innerText);
  ok('fiche 600013 · onglet ROME : libellé exact + type + importance', t1.includes('Appliquer le cadre juridique des marchés publics') && /savoir-faire/i.test(t1) && /cœur/i.test(t1));
  await page.evaluate(() => LDC.sheet.openProduct(LDC.cat.byCode.get('1470'), { tab: 'rome' })); await page.waitForTimeout(500);
  const t2 = await page.evaluate(() => document.getElementById('sheet').innerText);
  ok('fiche 1470 · onglet ROME : encart « À VALIDER »', /À VALIDER/i.test(t2) && /Aucune compétence n.est déduite/.test(t2));
  await page.evaluate(() => LDC.sheet.openProduct(LDC.cat.byCode.get('701276'), { tab: 'reponse' })); await page.waitForTimeout(500);
  const t3 = await page.evaluate(() => document.getElementById('sheet').innerText);
  ok('fiche certifiante · bloc France compétences distinct de ROME', /France compétences/.test(t3) && /RS6490/.test(t3) && /distinct des compétences ROME 4/.test(t3));
  console.log('console:', log.errors.join('\n') || 'propre'); if (log.errors.length) fails++;
  await browser.close(); process.exit(fails ? 1 : 0);
})();
