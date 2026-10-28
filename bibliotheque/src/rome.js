/* ROME 4.0 : accès aux compétences officielles et correspondance « besoin client → produits ».

   Règles (brief) :
   - identifiants, libellés et types ROME affichés tels quels, jamais reformulés ;
   - aucune compétence déduite du titre d'un produit : seuls les rattachements VALIDÉS
     (content/mapping-produits-rome.json) sont utilisés ;
   - France compétences (RS / RNCP) reste un référentiel distinct : ce module ne le lit jamais ;
   - le navigateur ne charge que data/rome4-compact.js (jamais la base SQLite). */

(function () {
  'use strict';
  const L = window.LDC, D = window.LDC_ROME4, M = window.LDC_MATCHING;
  const R = L.rome = { ok: !!D, meta: D ? D.meta : null };
  if (!D) return;

  /* ---------- accès aux compétences ---------- */
  const macroByCode = new Map(D.macro.map((m) => [m[0], { code: m[0], id: m[1], libelle: m[2], objectif: m[4] }]));
  const objByCode = new Map(D.objectifs.map((o) => [o[0], { code: o[0], libelle: o[1], enjeu: o[2] }]));
  const enjByCode = new Map(D.enjeux.map((e) => [e[0], { code: e[0], libelle: e[1], domaine: e[2] }]));
  const domByCode = new Map(D.domainesCompetence.map((d) => [d[0], { code: d[0], libelle: d[1] }]));
  const byId = new Map();
  D.competences.forEach((c) => byId.set(c[0], c));

  const hydrate = (c) => {
    if (!c) return null;
    const macro = macroByCode.get(c[5]) || null, obj = macro ? objByCode.get(macro.objectif) : null, enj = obj ? enjByCode.get(obj.enjeu) : null, dom = enj ? domByCode.get(enj.domaine) : null;
    return { id: c[0], libelle: c[1], type: D.types[c[2]], nature: D.natures[c[3]], sousCategorie: D.sousCategories[c[4]], macro, objectif: obj, enjeu: enj, domaine: dom };
  };
  R.competence = (id) => hydrate(byId.get(+id));
  R.has = (id) => byId.has(+id);

  /* Recherche plein texte sur les libellés (tous les mots, sans accents). */
  let idx = null;
  const index = () => idx || (idx = D.competences.map((c) => [c[0], L.norm(c[1])]));
  R.search = (qs, limit = 12) => {
    const t = L.norm(qs).split(/\s+/).filter(Boolean); if (!t.length) return [];
    const hits = [];
    for (const [id, h] of index()) {
      if (!t.every((w) => h.includes(w))) continue;
      const pre = h.startsWith(t[0]) ? 0 : h.includes(' ' + t[0]) ? 1 : 2;
      hits.push([pre, h.length, id]);
    }
    hits.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return hits.slice(0, limit).map((h) => hydrate(byId.get(h[2])));
  };

  /* Métiers (fiches ROME) : identification du client uniquement. Le lien métier → compétences n'est pas
     dans la vue consolidée fournie : il n'entre pas dans le calcul tant qu'il n'est pas validé. */
  const metiers = D.metiers.map((m) => ({ code: m[0], libelle: m[1], grandDomaine: m[2], domaine: m[3], n: L.norm(m[0] + ' ' + m[1]) }));
  const metierByCode = new Map(metiers.map((m) => [m.code, m]));
  R.metier = (code) => { const m = metierByCode.get(code); return m ? { code: m.code, libelle: m.libelle, grandDomaine: m.grandDomaine, domaine: m.domaine } : null; };
  R.searchMetiers = (qs, limit = 8) => {
    const t = L.norm(qs).split(/\s+/).filter(Boolean); if (!t.length) return [];
    return metiers.filter((m) => t.every((w) => m.n.includes(w))).slice(0, limit).map((m) => ({ code: m.code, libelle: m.libelle }));
  };

  /* ---------- rattachements validés (produit → compétences) ---------- */
  const MAP = L.content('mapping-produits-rome').produits || {};
  const MOM = (L.content('moments-de-vie').moments || []);
  const validEntry = (code) => { const e = MAP[code]; return e && e.statut === 'VALIDE' ? e : null; };

  /* Compétences ROME 4 d'un produit : uniquement les rattachements validés, libellés relus dans le référentiel. */
  R.competencesDe = (code) => {
    const e = validEntry(code); if (!e) return [];
    return (e.competences || []).map((x) => {
      const c = R.competence(x.id); if (!c) return null;
      return { ...c, importance: x.importance === 'support' ? 'support' : 'coeur', explication: x.explication || null };
    }).filter(Boolean);
  };
  R.mappingDe = (code) => { const e = validEntry(code); return e ? { valide: true, validePar: e.validePar || null, date: e.date || null, metiers: e.metiers || [], momentsDeVie: e.momentsDeVie || [] } : { valide: false }; };
  R.moments = () => MOM.slice();
  R.moment = (id) => MOM.find((m) => m.id === id) || null;
  R.couverture = () => { const n = Object.keys(MAP).filter((k) => validEntry(k)).length; return { produitsRattaches: n, total: L.cat.total, momentsDefinis: MOM.length }; };

  /* ---------- correspondance explicable ---------- */
  /* besoin : { competences:[{id}], momentId, metier:{code}, niveau, formats:[f], dureeMax (jours), mondes:[id] } */
  R.match = (besoin, produits, opts = {}) => {
    const W = M.poids, imp = M.importance, need = besoin || {};
    const ids = (need.competences || []).map((c) => +c.id).filter((id) => R.has(id));
    const moment = need.momentId ? R.moment(need.momentId) : null;
    const momentIds = moment ? (moment.competences || []).map(Number) : [];
    const out = [];
    for (const p of produits) {
      const raisons = []; let pts = 0, fond = 0;
      if (need.mondes && need.mondes.length) {
        const mo = L.cat.mondeOf(p); if (!mo || !need.mondes.includes(mo.id)) continue;
        raisons.push({ critere: 'domaine', texte: `Dans l'univers « ${mo.nom} » (${p.dom}).`, points: 0 });
      }
      const mine = R.competencesDe(p.c), mineIds = new Map(mine.map((c) => [c.id, c]));
      if (ids.length) {
        let w = 0; const got = [];
        ids.forEach((id) => { const c = mineIds.get(id); if (c) { w += imp[c.importance] || 1; got.push(c); } });
        if (got.length) {
          const v = W.romeValide * Math.min(1, w / ids.length); pts += v; fond += v;
          got.forEach((c) => raisons.push({ critere: 'rome', texte: `Mobilise la compétence ROME 4 « ${c.libelle} » (${c.importance === 'coeur' ? 'cœur' : 'support'}).`, points: Math.round(v / got.length) }));
        }
      }
      if (moment) {
        const e = validEntry(p.c); let v = 0;
        if (e && (e.momentsDeVie || []).includes(moment.id)) v = W.momentDeVie;   // rattachement explicite validé : poids plein
        else if (momentIds.length) { const w = momentIds.reduce((a, id) => a + (mineIds.has(id) ? imp[mineIds.get(id).importance] || 1 : 0), 0); if (w) v = W.momentDeVie * Math.min(1, w / momentIds.length) * .9; }   // couverture des compétences du moment, légèrement sous le rattachement explicite
        if (v) { pts += v; fond += v; raisons.push({ critere: 'moment', texte: `Répond au moment de vie « ${moment.libelle} ».`, points: Math.round(v) }); }
      }
      if (need.metier && need.metier.code) {
        const e = validEntry(p.c);
        if (e && (e.metiers || []).includes(need.metier.code)) { pts += W.metier; fond += W.metier; raisons.push({ critere: 'metier', texte: `Rattaché au métier ROME « ${need.metier.libelle || need.metier.code} ».`, points: W.metier }); }
      }
      if (need.niveau && p.n === need.niveau) { pts += W.niveau; raisons.push({ critere: 'niveau', texte: `Niveau « ${p.n} » comme demandé.`, points: W.niveau }); }
      if (need.formats && need.formats.length && need.formats.includes(p.f)) { pts += W.format; raisons.push({ critere: 'format', texte: `Format « ${p.f} » comme demandé.`, points: W.format }); }
      if (need.dureeMax && typeof p.dj === 'number' && p.dj <= need.dureeMax) { pts += W.duree; raisons.push({ critere: 'duree', texte: `Durée (${L.cat.duree(p)}) dans la limite demandée.`, points: W.duree }); }
      const cadre = !!(need.niveau || (need.formats && need.formats.length) || need.dureeMax || (need.mondes && need.mondes.length));
      if (!raisons.length && !(opts.garderTout)) { if (cadre || ids.length || moment || need.metier) continue; }
      const total = Math.min(100, Math.round(pts));
      let niveau = 'cadre';
      if (fond > 0) niveau = total >= M.seuils.forte ? 'forte' : total >= M.seuils.moyenne ? 'moyenne' : 'partielle';
      out.push({ produit: p, points: total, niveau, libelle: M.libelles[niveau], raisons, rattache: mine.length > 0 });
    }
    const rang = { forte: 0, moyenne: 1, partielle: 2, cadre: 3 };
    out.sort((a, b) => rang[a.niveau] - rang[b.niveau] || b.points - a.points || (b.produit.best || 0) - (a.produit.best || 0) || a.produit.i - b.produit.i);
    return out;
  };

  /* Synthèse des compétences ROME 4 d'un ensemble de produits (synthèse client). */
  R.synthese = (produits) => {
    const map = new Map();
    produits.forEach((p) => R.competencesDe(p.c).forEach((c) => {
      if (!map.has(c.id)) map.set(c.id, { ...c, produits: [], importance: c.importance });
      const e = map.get(c.id); e.produits.push(p); if (c.importance === 'coeur') e.importance = 'coeur';
    }));
    return [...map.values()].sort((a, b) => (a.importance === 'coeur' ? 0 : 1) - (b.importance === 'coeur' ? 0 : 1) || b.produits.length - a.produits.length || a.libelle.localeCompare(b.libelle, 'fr'));
  };
})();
