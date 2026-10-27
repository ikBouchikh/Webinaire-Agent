/* Mode PITCH GUIDÉ (3 à 5 minutes) : 1 ADN et vision · 2 besoin client · 3 domaine ou situation ·
   4 compétences mobilisées · 5 sélection de produits · 6 prochaine étape.
   Le besoin saisi alimente le moteur de correspondance (src/rome.js) ; aucune donnée sensible n'est demandée. */

(function () {
  'use strict';
  const L = window.LDC, $ = L.$, esc = L.esc, cat = L.cat, R = L.rome;
  const SCRIPT = L.content('pitch-script');
  const P = L.pitch = { step: 1, hooks: {} };
  const el = () => $('#pitch');
  const B = () => L.state.client.besoin;
  const save = () => L.persist();
  const STEPS = SCRIPT.etapes;

  const needObj = () => { const b = B(); return { competences: b.competences, metier: b.metier, momentId: b.momentId, niveau: b.niveau, formats: b.formats, dureeMax: b.dureeMax, mondes: b.mondes }; };
  const hasNeed = () => { const b = B(); return !!(b.competences.length || b.metier || b.momentId || b.niveau || b.formats.length || b.dureeMax || b.mondes.length); };

  const chip = (n, v, label, on) => `<button class="chip" type="button" data-n="${n}" data-v="${esc(v)}" aria-pressed="${!!on}">${esc(label)}</button>`;
  const compItem = (c) => `<div class="it"><span><b>${esc(c.libelle)}</b><br><small>${esc(c.type)} · ID ${c.id}</small></span><button type="button" data-rmcomp="${c.id}" aria-label="Retirer la compétence : ${esc(c.libelle)}">✕</button></div>`;
  const compSugg = (c) => `<li><button type="button" data-addcomp="${c.id}"><b>${esc(c.libelle)}</b><br><small>${esc(c.type)}${c.objectif ? ' · ' + esc(c.objectif.libelle) : ''}</small></button></li>`;

  /* ====================================================================================== */
  /*  Étapes                                                                                  */
  /* ====================================================================================== */

  const s1 = () => {
    const d = L.content('vision-offre'), e = d.etapes;
    return `<p class="lead">${esc(d.titre)}</p>
      <div class="sec"><h4>${esc(e[0].kicker)}</h4><p>${esc(e[0].corps[0])}</p></div>
      <div class="sec"><h4>${esc(e[1].kicker)}</h4><p class="big" style="font:500 1.15rem/1.35 var(--serif);color:var(--red-ink)">${esc(e[1].corps[0])}</p></div>
      <div class="sec"><h4>${esc(e[2].kicker)}</h4><p>${cat.total.toLocaleString('fr-FR')} produits au catalogue 2027, répartis en ${cat.mondes.length} univers : ${cat.mondes.map((m) => esc(m.nom)).join(', ')}.</p></div>
      <p class="note">Textes ${L.tagAV()} — à remplacer par les formulations validées (content/vision-offre.json).</p>
      <button class="btn btn-soft btn-sm" type="button" data-act="code">Voir le Code civil et le récit complet</button>`;
  };

  const s2 = () => {
    const b = B(), fmts = cat.formats.slice(0, 6), moms = R.moments();
    return `<p class="lead">Quelques repères suffisent. Tout est facultatif ; rien ne quitte cet ordinateur. Ne saisissez aucune donnée personnelle sensible.</p>
      <div class="field"><label for="pTexte">Situation ou besoin du client</label><textarea id="pTexte" class="input" placeholder="Ex. : équipe paie à former avant la bascule d'un outil…">${esc(b.texte)}</textarea></div>
      <div class="field"><label for="pMet">Métier du client (fiches ROME 4.0)</label><input id="pMet" class="input" type="search" autocomplete="off" placeholder="Rechercher un métier, un code ROME…" aria-controls="pMetS"><ul class="sugg" id="pMetS" hidden></ul>
        <div class="pick" id="pMetSel">${b.metier ? `<div class="it"><span><b>${esc(b.metier.libelle)}</b><br><small>ROME ${esc(b.metier.code)}</small></span><button type="button" data-rmmet aria-label="Retirer le métier">✕</button></div>` : ''}</div>
        <p class="note">Le lien métier → compétences n'est pas dans les données fournies : le métier figure dans la synthèse sans influencer le calcul ${L.tagAV()}</p></div>
      <div class="field"><label for="pComp">Compétences à développer (ROME 4.0)</label><input id="pComp" class="input" type="search" autocomplete="off" placeholder="Ex. : animer une réunion, analyser un bilan…" aria-controls="pCompS"><ul class="sugg" id="pCompS" hidden></ul>
        <div class="pick" id="pCompSel">${b.competences.map(compItem).join('')}</div></div>
      <div class="field"><span class="lab">Moment de vie</span>${moms.length ? `<div class="chips">${moms.map((m) => chip('moment', m.id, m.libelle, b.momentId === m.id)).join('')}</div>` : `<div class="empty-av"><b>Moments de vie ${L.tagAV()}</b>Aucune définition fournie : la notion existe dans le brief mais n'est pas inventée ici.</div>`}</div>
      <div class="field"><span class="lab">Univers</span><div class="chips">${cat.mondes.map((m) => chip('monde', m.id, m.nom, b.mondes.includes(m.id))).join('')}</div></div>
      <div class="field"><span class="lab">Niveau</span><div class="chips">${cat.niveaux.map((n) => chip('niveau', n, n, b.niveau === n)).join('')}</div></div>
      <div class="field"><span class="lab">Format</span><div class="chips">${fmts.map((f) => chip('format', f.f, f.f, b.formats.includes(f.f))).join('')}</div></div>
      <div class="field"><span class="lab">Durée maximale</span><div class="chips">${SCRIPT.formatsDurees.map((d) => chip('duree', d.jours, d.libelle, b.dureeMax === d.jours)).join('')}</div></div>`;
  };

  const stationRows = (m) => m.stations.map((st) => {
    const n = hasNeed() ? R.match({ ...needObj(), mondes: [] }, st.produits, {}).length : null;
    return `<li class="prow"><span class="tag">${esc(st.code)}</span><span class="t" style="padding:0"><b>${esc(st.nom)}</b><small>${st.n} produits${n != null ? ` · ${n} dans le cadre demandé` : ''}</small></span><button class="btn btn-ghost btn-sm" type="button" data-act="station" data-m="${esc(m.id)}" data-s="${st.index}">Voir</button></li>`;
  }).join('');
  const s3 = () => {
    const b = B(), cur = b.mondes[0] ? cat.mondeById[b.mondes[0]] : null;
    return `<p class="lead">Choisissez l'univers qui illustre le mieux la situation.</p>
      <div class="pick">${cat.mondes.map((m) => `<button class="mode ${cur === m ? 'main' : ''}" type="button" data-act="monde" data-m="${esc(m.id)}" style="border-left:6px solid ${m.accentCfg.main}"><b>${esc(m.nom)}</b><span>${esc(m.univers)} — ${esc(m.promesse)}</span></button>`).join('')}</div>
      ${cur ? `<div class="sec"><h4>Stations de l'univers « ${esc(cur.nom)} »</h4><ul class="plist">${stationRows(cur)}</ul><div style="margin-top:.6rem"><button class="btn btn-primary btn-sm" type="button" data-act="enter" data-m="${esc(cur.id)}">Entrer dans l'univers en 3D</button></div></div>` : ''}`;
  };

  const s4 = () => {
    const b = B(), cov = R.couverture(), res = R.match(needObj(), cat.produits, {}).slice(0, 6);
    return `<p class="lead">Les compétences viennent du référentiel ROME 4.0 (libellés exacts). Les produits n'y sont rattachés que si un rattachement a été validé.</p>
      <div class="sec"><h4>Compétences visées par le client</h4>${b.competences.length ? `<ul class="rome">${b.competences.map((c) => { const h = R.competence(c.id) || c; return `<li><span class="meta">${esc(h.type || '')} · ${esc(h.nature || '')} · ID ${c.id}</span><b>${esc(c.libelle)}</b>${h.objectif ? `<small>${esc(h.domaine ? h.domaine.libelle : '')} › ${esc(h.enjeu ? h.enjeu.libelle : '')} › ${esc(h.objectif.libelle)}</small>` : ''}</li>`; }).join('')}</ul>` : '<p class="note">Aucune compétence saisie à l\'étape 2.</p>'}</div>
      <div class="sec"><h4>Rattachement des produits</h4>
        ${cov.produitsRattaches ? `<p>${cov.produitsRattaches} produit${cov.produitsRattaches > 1 ? 's' : ''} sur ${cov.total.toLocaleString('fr-FR')} ${cov.produitsRattaches > 1 ? 'ont' : 'a'} un rattachement ROME 4 validé.</p>` : `<div class="empty-av"><b>Rattachement ROME 4 ${L.tagAV()}</b>Aucun des ${cov.total.toLocaleString('fr-FR')} produits n'a encore de rattachement validé. La correspondance porte donc sur le cadre (univers, niveau, format, durée), jamais sur une compétence déduite d'un titre.</div>`}
        ${res.length && cov.produitsRattaches ? `<ul class="plist" style="margin-top:.6rem">${res.map((r) => { const cs = R.competencesDe(r.produit.c); return `<li class="prow"><span class="t" style="padding:0"><b>${esc(r.produit.t)}</b><small><span class="lvl ${r.niveau}">${esc(r.libelle)}</span>${cs.slice(0, 3).map((c) => esc(c.libelle)).join(' · ')}</small></span></li>`; }).join('')}</ul>` : ''}</div>`;
  };

  const s5 = () => {
    const res = hasNeed() ? R.match(needObj(), cat.produits, {}).slice(0, 12) : [], n = L.selection.count(), items = L.selection.items();
    return `<p class="lead">Les produits sont classés selon la correspondance avec le besoin exprimé. Chaque raison est affichée : ce n'est pas un score scientifique.</p>
      ${!hasNeed() ? '<div class="empty-av"><b>Besoin à préciser</b>Renseignez au moins un critère (étape 2 ou 3) pour obtenir des propositions.</div>' : ''}
      ${res.length ? `<ul class="plist">${res.map((r) => L.sheet.rowHTML(r.produit, r)).join('')}</ul>` : hasNeed() ? '<p class="note">Aucun produit ne correspond à tous les critères : assouplissez le besoin (étape 2).</p>' : ''}
      <div class="sec"><h4>Sélection en cours</h4><p>${n ? `${n} ${L.plural(n, 'produit')} · ${cat.fmtJours(cat.jours(items))}` : 'Aucun produit retenu.'}</p><button class="btn btn-soft btn-sm" type="button" data-act="sel">Voir ma sélection client</button></div>`;
  };

  const s6 = () => {
    const s = L.selection.synthese(), cur = L.state.client.etape || '';
    return `<p class="lead">La synthèse à laisser au client.</p>
      <div class="sec"><h4>Besoin</h4>${s.besoin.length ? `<dl class="kv">${s.besoin.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '<p class="note">Non renseigné.</p>'}</div>
      <div class="sec"><h4>Produits retenus</h4>${s.items.length ? `<ul class="list">${s.items.map((p) => `<li>${esc(p.t)} <span class="note">(${esc(cat.duree(p))})</span></li>`).join('')}</ul><p><b>${cat.fmtJours(s.jours)}</b>${s.inconnus ? ` <span class="note">(hors ${s.inconnus} sans durée en jours)</span>` : ''}</p>` : '<p class="note">Aucun produit retenu.</p>'}</div>
      <div class="sec"><h4>Compétences ROME 4</h4><p>${s.competences.length ? `${s.competences.length} compétence${s.competences.length > 1 ? 's' : ''} mobilisée${s.competences.length > 1 ? 's' : ''} (rattachements validés).` : `Rattachement non validé ${L.tagAV()}`}</p></div>
      <div class="sec"><h4>Prochaine étape</h4><div class="chips">${SCRIPT.prochainesEtapes.map((t) => chip('etape', t, t, cur === t)).join('')}</div><div class="field"><label for="pEtape">Ou en vos mots</label><input id="pEtape" class="input" type="text" value="${esc(SCRIPT.prochainesEtapes.includes(cur) ? '' : cur)}" placeholder="Ex. : rendez-vous le …"></div></div>
      <div class="chips"><button class="btn btn-primary btn-sm" type="button" data-act="copy">Copier la synthèse</button>${L.env.artifact ? '' : '<button class="btn btn-ghost btn-sm" type="button" data-act="print">Imprimer</button>'}<button class="btn btn-soft btn-sm" type="button" data-act="sel">Ma sélection client</button></div>`;
  };
  const BODY = { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6 };

  /* ====================================================================================== */

  const render = () => {
    const st = STEPS[P.step - 1], root = el(), sc = $('.pb', root) ? $('.pb', root).scrollTop : 0;
    root.innerHTML = `
      <div class="ph"><span class="ico" aria-hidden="true">${L.ICON_SVG}</span><p class="kicker">Pitch guidé · étape ${st.id} sur ${STEPS.length} · ${esc(st.duree)}</p><button class="x" type="button" data-act="quit" aria-label="Quitter le pitch guidé">✕</button></div>
      <div class="pb">
        <h2 id="pitchTitle" data-autofocus>${esc(st.titre)}</h2>
        <nav class="steps" aria-label="Étapes du pitch">${STEPS.map((s) => `<button type="button" data-go="${s.id}" ${s.id === P.step ? 'aria-current="step"' : ''} class="${s.id < P.step ? 'done' : ''}"><i>${s.id}</i>${esc(s.court)}</button>`).join('')}</nav>
        <p class="note" style="margin:0 0 .5rem">${esc(st.consigne)}</p>
        <div id="pbody">${BODY[P.step]()}</div>
      </div>
      <div class="pf">${P.step > 1 ? '<button class="btn btn-ghost btn-sm" type="button" data-act="prev">‹ Précédent</button>' : ''}${P.step < STEPS.length ? '<button class="btn btn-primary btn-sm" type="button" data-act="next">Suivant ›</button>' : '<button class="btn btn-primary btn-sm" type="button" data-act="quit">Terminer</button>'}</div>`;
    $('.pb', root).scrollTop = sc;
  };

  P.open = (step) => {
    if (step) P.step = L.clamp(step, 1, STEPS.length);
    document.body.classList.add('pitch-mode'); render(); L.panels.open(el(), { focus: '[data-autofocus]' });
    L.cognitio.say(STEPS[P.step - 1].cognitio); L.pitch.onMode && L.pitch.onMode(true);
    if (P.hooks.step) P.hooks.step(P.step);
  };
  P.go = (n) => { P.step = L.clamp(n, 1, STEPS.length); render(); const pb = $('.pb', el()); if (pb) pb.scrollTop = 0; L.cognitio.say(STEPS[P.step - 1].cognitio); if (P.hooks.step) P.hooks.step(P.step); };
  P.close = () => { if (L.panels.isOpen(el())) L.panels.close(el(), true); document.body.classList.remove('pitch-mode'); L.pitch.onMode && L.pitch.onMode(false); };
  P.isOpen = () => L.panels.isOpen(el());

  /* ---------- événements ---------- */
  const relist = (ul, items, fn) => { ul.innerHTML = items.map(fn).join(''); ul.hidden = !items.length; };
  P.init = () => {
    const root = el();
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act],[data-go],[data-n],[data-addcomp],[data-rmcomp],[data-rmmet],[data-met],[data-add],[data-open]'); if (!b) return;
      const d = b.dataset;
      if (d.go) return P.go(+d.go);
      if (d.add) return L.selection.toggle(d.add);
      if (d.open) { const p = cat.byCode.get(d.open); if (p) L.sheet.openProduct(p, { back: false }); return; }
      if (d.addcomp) { const c = R.competence(d.addcomp); if (c && !B().competences.some((x) => x.id === c.id)) { B().competences.push({ id: c.id, libelle: c.libelle, type: c.type }); save(); $('#pCompSel', root).innerHTML = B().competences.map(compItem).join(''); $('#pCompS', root).hidden = true; $('#pComp', root).value = ''; } return; }
      if (d.rmcomp) { B().competences = B().competences.filter((c) => String(c.id) !== d.rmcomp); save(); $('#pCompSel', root).innerHTML = B().competences.map(compItem).join(''); return; }
      if (d.met) { const m = R.metier(d.met); if (m) { B().metier = { code: m.code, libelle: m.libelle }; save(); $('#pMetSel', root).innerHTML = `<div class="it"><span><b>${esc(m.libelle)}</b><br><small>ROME ${esc(m.code)}</small></span><button type="button" data-rmmet aria-label="Retirer le métier">✕</button></div>`; $('#pMetS', root).hidden = true; $('#pMet', root).value = ''; } return; }
      if (d.rmmet !== undefined) { B().metier = null; save(); $('#pMetSel', root).innerHTML = ''; return; }
      if (d.n) {
        const b0 = B(), n = d.n, v = d.v;
        if (n === 'monde') b0.mondes = b0.mondes.includes(v) ? b0.mondes.filter((x) => x !== v) : b0.mondes.concat(v);
        else if (n === 'niveau') b0.niveau = b0.niveau === v ? null : v;
        else if (n === 'format') b0.formats = b0.formats.includes(v) ? b0.formats.filter((x) => x !== v) : b0.formats.concat(v);
        else if (n === 'duree') b0.dureeMax = b0.dureeMax === +v ? null : +v;
        else if (n === 'moment') b0.momentId = b0.momentId === v ? null : v;
        else if (n === 'etape') L.state.client.etape = L.state.client.etape === v ? '' : v;
        save();
        L.$$(`[data-n="${n}"]`, root).forEach((x) => { const val = x.dataset.v; x.setAttribute('aria-pressed', n === 'monde' ? b0.mondes.includes(val) : n === 'niveau' ? b0.niveau === val : n === 'format' ? b0.formats.includes(val) : n === 'duree' ? b0.dureeMax === +val : n === 'moment' ? b0.momentId === val : L.state.client.etape === val); });
        return;
      }
      switch (d.act) {
        case 'next': return P.go(P.step + 1);
        case 'prev': return P.go(P.step - 1);
        case 'quit': return P.hooks.quit ? P.hooks.quit() : P.close();
        case 'code': return P.hooks.code && P.hooks.code();
        case 'sel': return L.selection.open();
        case 'monde': B().mondes = [d.m]; save(); render(); return;
        case 'enter': return P.hooks.enter && P.hooks.enter(d.m);
        case 'station': return P.hooks.station && P.hooks.station(d.m, +d.s);
        case 'copy': return L.copy(L.selection.toText()).then((ok) => L.toast(ok ? 'Synthèse copiée' : 'Copie impossible'));
        case 'print': return L.selection.print();
        default:
      }
    });
    root.addEventListener('input', (e) => {
      const t = e.target;
      if (t.id === 'pTexte') { B().texte = t.value; L.store.save({ seenTransition: L.state.seenTransition, seenIntro: L.state.seenIntro, client: L.state.client }); }
      else if (t.id === 'pEtape') { L.state.client.etape = t.value; L.store.save({ seenTransition: L.state.seenTransition, seenIntro: L.state.seenIntro, client: L.state.client }); }
      else if (t.id === 'pMet') relist($('#pMetS', root), t.value.trim().length > 1 ? R.searchMetiers(t.value, 8) : [], (m) => `<li><button type="button" data-met="${esc(m.code)}"><b>${esc(m.libelle)}</b><br><small>ROME ${esc(m.code)}</small></button></li>`);
      else if (t.id === 'pComp') relist($('#pCompS', root), t.value.trim().length > 2 ? R.search(t.value, 8) : [], compSugg);
    });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && e.target.matches('input[type=search]') && e.target.value) { e.stopPropagation(); e.target.value = ''; L.$$('.sugg', root).forEach((u) => { u.hidden = true; }); } });
    L.onChange(() => { if (P.isOpen() && (P.step === 5 || P.step === 6 || P.step === 3) && !(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) render(); });
  };
})();
