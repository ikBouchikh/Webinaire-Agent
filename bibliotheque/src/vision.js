/* Le Code civil, en trois temps : Notre origine · Notre vision · Notre offre.
   « De l'expertise éditoriale à l'action professionnelle ».
   Textes : content/vision-offre.json (statut À VALIDER). L'étape « offre » est calculée à partir du catalogue ;
   aucun produit, aucune promesse commerciale n'est inventé. */

(function () {
  'use strict';
  const L = window.LDC, $ = L.$, esc = L.esc, cat = L.cat;
  const V = L.vision = { step: 0 };
  const el = () => $('#vision');
  const DATA = () => L.content('vision-offre');

  const nbCertif = () => cat.produits.filter((p) => cat.certif(p.c)).length;

  const body = (i) => {
    const e = DATA().etapes[i], av = e.statut === 'A_VALIDER';
    if (e.id === 'origine') {
      const cc = DATA().codeCivil || {};
      return `<p class="kicker">${esc(e.kicker)}</p><h3 class="vtitle">${esc(e.titre)}</h3>
        <div class="vbody">${e.corps.map((t, k) => `<p${k === 0 ? ' class="big"' : ''}>${esc(t)}</p>`).join('')}</div>
        <div class="sec"><h4>L'ouvrage au centre de la salle</h4><p>${esc(cc.designation || '')}.<br>${esc(cc.acquisition || '')}.</p>
          <details class="note"><summary>Éléments de la fiche de l'ouvrage ${L.tagAV()}</summary><p>Non fournis à ce jour : ${(cc.champsAValider || []).map(esc).join(', ')}. Aucun fait historique n'est affiché tant qu'il n'est pas validé.</p></details></div>
        ${av ? `<p class="note">Texte ${L.tagAV()} · source : ${esc(e.source)}</p>` : ''}`;
    }
    if (e.id === 'vision') {
      const chain = ['Savoirs humains', 'Patrimoine éditorial', 'Compétences professionnelles', 'Intelligence artificielle'];
      return `<p class="kicker">${esc(e.kicker)}</p><h3 class="vtitle">${esc(e.titre)}</h3>
        <div class="vbody"><p class="big">${esc(e.corps[0])}</p>${e.corps.slice(1).map((t) => `<p>${esc(t)}</p>`).join('')}</div>
        <ol class="rome" aria-label="Ce que Cognitio relie" style="margin-top:.8rem">${chain.map((c, k) => `<li style="border-left:5px solid ${['#D71635', '#4B0000', '#1E87BE', '#FA914B'][k]}"><b>${esc(c)}</b></li>`).join('')}</ol>
        ${av ? `<p class="note">Texte ${L.tagAV()} · source : ${esc(e.source)}</p>` : ''}`;
    }
    const mo = cat.mondes;
    return `<p class="kicker">${esc(e.kicker)}</p><h3 class="vtitle">Six univers, ${cat.total.toLocaleString('fr-FR')} produits au catalogue 2027</h3>
      <div class="stats"><div><b>${cat.total.toLocaleString('fr-FR')}</b><span>produits au catalogue 2027</span></div><div><b>${mo.length}</b><span>univers de compétences</span></div><div><b>${nbCertif()}</b><span>produits certifiants (RS / RNCP)</span></div><div><b>${Object.keys(cat.lots).length}</b><span>lots, packs et parcours</span></div></div>
      <div class="stats s3">${mo.map((m) => `<div class="m" style="--c:${m.accentCfg.main}"><b>${m.n.toLocaleString('fr-FR')}</b><span>${esc(m.nom)}</span></div>`).join('')}</div>
      <p class="note">Comptages calculés à partir de la base produits (${esc(cat.meta.source)}). Regroupement en six univers : ${L.tagAV('à valider')}</p>`;
  };

  const render = () => {
    const d = DATA(), n = d.etapes.length, i = V.step, last = i === n - 1;
    el().innerHTML = `
      <div class="ph"><span class="ico" aria-hidden="true">${L.MARK}</span><p class="kicker">Le premier Code civil</p><button class="x" type="button" data-a="close" aria-label="Fermer et revenir à la salle">✕</button></div>
      <div class="pb">
        <h2 id="visionTitle" data-autofocus>${esc(d.titre)}</h2>
        <nav class="vsteps" aria-label="Étapes">${d.etapes.map((e, k) => `<button type="button" data-step="${k}" ${k === i ? 'aria-current="step"' : ''}><i>${k + 1}</i>${esc(e.kicker)}</button>`).join('')}</nav>
        <div class="vbody-wrap">${body(i)}</div>
      </div>
      <div class="pf ${last ? 'cta' : ''}">${last ? `<div class="cta-grid">${d.cta.map((c, k) => `<button class="btn ${k === 1 ? 'btn-primary' : 'btn-soft'} btn-sm" type="button" data-cta="${esc(c.id)}">${esc(c.libelle)} <span aria-hidden="true">→</span></button>`).join('')}</div>` : ''}${i > 0 ? '<button class="btn btn-ghost btn-sm" type="button" data-a="prev">‹ Précédent</button>' : ''}${!last ? '<button class="btn btn-primary btn-sm" type="button" data-a="next">Suite ›</button>' : ''}<button class="btn btn-ghost btn-sm" type="button" data-a="close">Retour à la salle</button></div>`;
  };

  V.go = (i, silent) => {
    V.step = L.clamp(i, 0, DATA().etapes.length - 1); render();
    const t = $('#visionTitle', el()); if (!silent && t) { /* focus conservé sur le panneau */ }
    L.cognitio.say('vision.' + DATA().etapes[V.step].id, { n: cat.total.toLocaleString('fr-FR') });
    const pb = $('.pb', el()); if (pb) pb.scrollTop = 0;
  };
  V.open = (step = 0) => { V.step = step; render(); L.panels.open(el(), { focus: '[data-autofocus]', onClose: () => { if (V.onClose) V.onClose(); } }); L.cognitio.say('vision.' + DATA().etapes[V.step].id, { n: cat.total.toLocaleString('fr-FR') }); };
  V.close = () => { if (L.panels.isOpen(el())) L.panels.close(el()); };
  V.isOpen = () => L.panels.isOpen(el());

  V.init = () => {
    el().addEventListener('click', (e) => {
      const b = e.target.closest('[data-a],[data-step],[data-cta]'); if (!b) return;
      if (b.dataset.step) return V.go(+b.dataset.step);
      if (b.dataset.cta) { const c = DATA().cta.find((x) => x.id === b.dataset.cta); return V.onCta && V.onCta(c); }
      const a = b.dataset.a; if (a === 'close') V.close(); else if (a === 'next') V.go(V.step + 1); else if (a === 'prev') V.go(V.step - 1);
    });
  };
})();
