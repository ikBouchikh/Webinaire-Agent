/* Catalogue 2027 : index produits, six mondes, stations, vitrines, lots, certifications.
   Source unique : data/catalogue.js (généré depuis la base produits) + content/domaines.json.
   Aucun produit, aucun libellé n'est écrit à la main ici. */

(function () {
  'use strict';
  const L = window.LDC, D = window.LDC_CATALOGUE, CFG = L.content('domaines');
  const cat = L.cat = { meta: D.meta, produits: D.produits, certifs: D.certifications || {}, lots: D.lots || {} };

  cat.byCode = new Map(D.produits.map((p, i) => { p.i = i; return [p.c, p]; }));
  cat.total = D.produits.length;
  cat.niveaux = ['Fondamentaux', 'Perfectionnement', 'Expertise'];

  /* Teintes de la charte (PDF) : rouge par défaut, bleu et ocre en touches. */
  /* `text` : nuance profonde de la même teinte, pour du texte (contraste ≥ 4,5:1 sur le fond clay-1). */
  L.ACCENT = {
    red: { main: '#D71635', deep: '#4B0000', soft: '#F6D7D3', ink: '#3B0000', text: '#D71635' },
    blue: { main: '#1E87BE', deep: '#081F2C', soft: '#D6E8F1', ink: '#081F2C', text: '#1773A0' },
    ocre: { main: '#FA914B', deep: '#CD5008', soft: '#FBE1CC', ink: '#7A3003', text: '#B8470A' },
  };

  const split = (lab) => { const m = /^([A-Z0-9_]+)\s*-\s*(.+)$/.exec(lab || ''); return m ? { code: m[1], nom: m[2] } : { code: lab || '—', nom: lab || 'Sans thème' }; };
  const natural = (a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true });
  cat.split = split;

  const cfgSel = CFG.selection || { nbVitrine: 4, exclureVenduSeul: [] };

  /* Vitrine d'une station : d'abord les produits marqués BEST, puis l'ordre du catalogue ;
     on varie les thèmes avant de répéter, on écarte les produits non vendus seuls. */
  const vitrine = (prods) => {
    const ok = prods.filter((p) => !(cfgSel.exclureVenduSeul || []).includes(p.vs) && !(cfgSel.exclureMarques || []).includes(p.mq));
    const ranked = ok.filter((p) => p.best === 1).concat(ok.filter((p) => p.best !== 1));
    const out = [], themes = new Set(), titles = new Set();
    for (const p of ranked) { if (out.length >= cfgSel.nbVitrine) break; if (themes.has(p.th) || titles.has(p.t)) continue; out.push(p); themes.add(p.th); titles.add(p.t); }
    for (const p of ranked) { if (out.length >= cfgSel.nbVitrine) break; if (!out.includes(p) && !titles.has(p.t)) { out.push(p); titles.add(p.t); } }
    return out;
  };

  const station = (id, nom, code, prods, monde) => {
    const th = new Map();
    prods.forEach((p) => { const k = p.th || '—'; if (!th.has(k)) th.set(k, { ...split(p.th), produits: [] }); th.get(k).produits.push(p); });
    const themes = [...th.values()].sort(natural);
    return { id, code, nom, produits: prods, n: prods.length, themes, vitrine: vitrine(prods), monde, nBest: prods.filter((p) => p.best === 1).length };
  };

  cat.mondes = (CFG.mondes || []).slice().sort((a, b) => a.ordre - b.ordre).map((m, k) => {
    const prods = D.produits.filter((p) => m.domaines.includes(p.dom));
    const monde = { ...m, k, accentCfg: L.ACCENT[m.accent] || L.ACCENT.red, produits: prods, n: prods.length };
    if (m.stationNiveau === 'theme') {
      const th = new Map(); prods.forEach((p) => { const k2 = p.th || '—'; if (!th.has(k2)) th.set(k2, []); th.get(k2).push(p); });
      monde.stations = [...th.entries()].map(([lab, ps]) => { const s = split(lab); return station(lab, s.nom, s.code, ps, monde); }).sort(natural);
    } else {
      monde.stations = m.domaines.map((lab) => { const s = split(lab); return station(lab, s.nom, s.code, prods.filter((p) => p.dom === lab), monde); }).filter((s) => s.n);
    }
    monde.stations.forEach((s, i) => { s.index = i; });
    return monde;
  });
  cat.mondeById = Object.fromEntries(cat.mondes.map((m) => [m.id, m]));
  cat.mondeOfDom = {}; cat.mondes.forEach((m) => m.domaines.forEach((d) => { cat.mondeOfDom[d] = m; }));
  cat.mondeOf = (p) => cat.mondeOfDom[p.dom] || null;
  cat.stationOf = (p) => { const m = cat.mondeOf(p); return m ? m.stations.find((s) => s.produits.includes(p)) || null : null; };
  cat.orphelins = D.produits.filter((p) => !cat.mondeOf(p));

  /* ---------- lots (composition factuelle : « produits associés ») ---------- */
  cat.lotsOf = (code) => Object.entries(cat.lots).filter(([k, v]) => k === code || (v.membres || []).includes(code)).map(([k, v]) => ({ code: k, produit: cat.byCode.get(k) || null, membres: (v.membres || []).map((c) => cat.byCode.get(c)).filter(Boolean) }));
  cat.associes = (code) => {
    const out = new Map();
    cat.lotsOf(code).forEach((l) => { [l.produit].concat(l.membres).forEach((p) => { if (p && p.c !== code) out.set(p.c, p); }); });
    return [...out.values()];
  };

  /* ---------- certification (France compétences, RS / RNCP) : séparée des compétences ---------- */
  cat.certif = (code) => cat.certifs[code] || null;

  /* ---------- recherche et libellés ---------- */
  cat.search = (qs, list) => {
    const t = L.norm(qs).split(/\s+/).filter(Boolean); if (!t.length) return [];
    return (list || cat.produits).filter((p) => { const h = L.norm(p.t + ' ' + (p.th || '') + ' ' + (p.dom || '')); return t.every((w) => h.includes(w)); });
  };
  const fc = {}; D.produits.forEach((p) => { if (p.f) fc[p.f] = (fc[p.f] || 0) + 1; });
  cat.formats = Object.entries(fc).sort((a, b) => b[1] - a[1]).map(([f, n]) => ({ f, n }));
  cat.jours = (list) => list.reduce((a, p) => a + (typeof p.dj === 'number' ? p.dj : 0), 0);
  cat.joursInconnus = (list) => list.filter((p) => typeof p.dj !== 'number').length;
  cat.fmtJours = (j) => { const r = Math.round(j * 10) / 10; return (r % 1 ? String(r).replace('.', ',') : String(r)) + ' ' + (r > 1 ? 'jours' : 'jour'); };
  cat.duree = (p) => p.dl || p.dh || 'Durée non renseignée';
})();
