/* Panneau « Station » (liste des produits d'un domaine) et fiche produit à quatre onglets :
   Pour quel besoin ? · Notre réponse · Compétences ROME 4 · Argumentaire commercial.
   Tout élément commercial vient de content/produits-commercial.json ; s'il manque, un emplacement « À VALIDER »
   s'affiche à sa place. Rien n'est déduit du titre d'un produit. */

(function () {
  'use strict';
  const L = window.LDC, $ = L.$, esc = L.esc, cat = L.cat, R = L.rome;
  const COM = L.content('produits-commercial').produits || {};
  const Sh = L.sheet = { cur: null, st: null };
  const el = () => $('#sheet');
  const TABS = [['besoin', 'Pour quel besoin ?'], ['reponse', 'Notre réponse'], ['rome', 'Compétences ROME 4'], ['argu', 'Argumentaire commercial']];

  /* ---------- besoin exprimé (pitch, étape 2) ---------- */
  const need = () => { const b = L.state.client.besoin; return { competences: b.competences, metier: b.metier, momentId: b.momentId, niveau: b.niveau, formats: b.formats, dureeMax: b.dureeMax, mondes: [] }; };
  const needActive = () => { const b = L.state.client.besoin; return !!(b.competences.length || b.metier || b.momentId || b.niveau || b.formats.length || b.dureeMax); };
  Sh.needActive = needActive; Sh.need = need;

  const av = (titre, msg) => `<div class="empty-av"><b>${esc(titre)} ${L.tagAV()}</b>${esc(msg || 'Non renseigné dans la base produits fournie : à compléter par l\'offre. Rien n\'est généré automatiquement.')}</div>`;
  const textOrAV = (v, titre) => { if (Array.isArray(v) && v.length) return `<ul class="list">${v.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`; if (typeof v === 'string' && v.trim()) return `<p>${esc(v)}</p>`; return av(titre); };

  const matchHTML = (res) => !res ? '' : `<p style="margin:.2rem 0"><span class="lvl ${res.niveau}">${esc(res.libelle)}</span></p>` + (res.raisons.length ? `<ul class="why">${res.raisons.map((r) => `<li>${esc(r.texte)}</li>`).join('')}</ul>` : '<p class="note">Aucun critère du besoin exprimé ne correspond à ce produit.</p>') + (res.rattache ? '' : '<p class="note">Aucun rattachement ROME 4 validé pour ce produit : la correspondance ne porte que sur le cadre (niveau, format, durée).</p>');
  const matchOne = (p) => (needActive() ? R.match(need(), [p], { garderTout: true })[0] : null);

  /* ---------- ligne produit ---------- */
  const tags = (p) => (p.best === 1 ? '<span class="tag best">BEST</span> ' : '') + (cat.certif(p.c) ? '<span class="tag rn">Certifiant</span> ' : '');
  const rowHTML = (p, res) => {
    const on = L.selection.has(p.c);
    return `<li class="prow"><button class="t" type="button" data-open="${esc(p.c)}"><b>${esc(p.t)}</b><small>${tags(p)}${esc(p.f || '')} · ${esc(cat.duree(p))}${p.n ? ' · ' + esc(p.n) : ''}</small>${res ? `<small><span class="lvl ${res.niveau}">${esc(res.libelle)}</span>${res.raisons.filter((r) => r.points).slice(0, 2).map((r) => esc(r.texte)).join(' ')}</small>` : ''}</button><button class="add" type="button" data-add="${esc(p.c)}" aria-pressed="${on}" aria-label="${on ? 'Retirer de' : 'Ajouter à'} la sélection client : ${esc(p.t)}">${on ? '✓' : '+'}</button></li>`;
  };
  Sh.rowHTML = rowHTML;

  /* ====================================================================================== */
  /*  Station                                                                                */
  /* ====================================================================================== */

  const stationList = () => {
    const s = Sh.st, st = s.station, q = L.norm(s.q);
    let list = st.produits.filter((p) => (!s.niveau || p.n === s.niveau) && (!s.format || p.f === s.format) && (!s.best || p.best === 1) && (!q || L.norm(p.t + ' ' + (p.th || '')).includes(q)));
    let results = null;
    if (s.sort === 'match' && needActive()) { results = new Map(R.match(need(), list, { garderTout: true }).map((r) => [r.produit.c, r])); list = [...results.values()].map((r) => r.produit); }
    if (!list.length) return '<p class="note">Aucun produit ne correspond à ces critères.</p>';
    if (results) return `<ul class="plist">${list.map((p) => rowHTML(p, results.get(p.c))).join('')}</ul>`;
    const groups = new Map(); list.forEach((p) => { const k = p.th || '—'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); });
    const open = groups.size <= 3 || s.q || s.niveau || s.format || s.best;
    return [...groups.entries()].sort((a, b) => cat.split(a[0]).code.localeCompare(cat.split(b[0]).code, 'fr', { numeric: true })).map(([k, ps]) => { const t = cat.split(k); return `<details class="pgrp" ${open ? 'open' : ''}><summary><span class="mono" style="color:var(--accent)">${esc(t.code)}</span> ${esc(t.nom)}<span class="n">${ps.length}</span></summary><ul class="plist">${ps.map((p) => rowHTML(p)).join('')}</ul></details>`; }).join('');
  };
  const refreshList = () => { const box = $('#plist', el()); if (box) box.innerHTML = stationList(); };

  Sh.openStation = (st, keep) => {
    const mo = st.monde; Sh.cur = { type: 'station' }; if (!keep || !Sh.st || Sh.st.station !== st) Sh.st = { station: st, q: '', niveau: null, format: null, best: false, sort: 'catalogue' };
    const s = Sh.st, fmts = cat.formats.filter((f) => st.produits.some((p) => p.f === f.f)).slice(0, 5);
    el().style.setProperty('--accent', mo.accentCfg.text);
    el().setAttribute('aria-label', `Produits : ${st.nom}`);
    el().innerHTML = `
      <div class="ph"><span class="ico" aria-hidden="true">${L.ICON_SVG}</span><p class="kicker">${esc(mo.nom)} · ${esc(st.code)}</p><button class="x" type="button" data-a="close" aria-label="Fermer le panneau">✕</button></div>
      <div class="pb">
        <h2 data-autofocus>${esc(st.nom)}</h2>
        <p class="lead">${st.n} ${L.plural(st.n, 'produit')} au catalogue 2027${st.nBest ? ` · ${st.nBest} marqué${st.nBest > 1 ? 's' : ''} BEST` : ''}.</p>
        <div class="field"><label for="stQ">Rechercher dans ce domaine</label><input id="stQ" class="input" type="search" autocomplete="off" placeholder="Un mot du titre ou du thème" value="${esc(s.q)}"></div>
        <div class="fbar" role="group" aria-label="Filtres">
          ${cat.niveaux.filter((n) => st.produits.some((p) => p.n === n)).map((n) => `<button class="chip" type="button" data-f="niveau" data-v="${esc(n)}" aria-pressed="${s.niveau === n}">${esc(n)}</button>`).join('')}
          ${fmts.map((f) => `<button class="chip" type="button" data-f="format" data-v="${esc(f.f)}" aria-pressed="${s.format === f.f}">${esc(f.f)}</button>`).join('')}
          ${st.nBest ? `<button class="chip" type="button" data-f="best" aria-pressed="${s.best}">BEST</button>` : ''}
        </div>
        ${needActive() ? `<div class="fbar"><button class="chip" type="button" data-f="sort" aria-pressed="${s.sort === 'match'}">Trier par correspondance au besoin exprimé</button></div>` : ''}
        <div id="plist">${stationList()}</div>
      </div>
      <div class="pf"><button class="btn btn-primary btn-sm" type="button" data-a="sel">Ma sélection client (${L.selection.count()})</button><button class="btn btn-ghost btn-sm" type="button" data-a="close">Fermer</button></div>`;
    L.panels.open(el(), { focus: '[data-autofocus]' });
    L.cognitio.say('monde.station', { domaine: st.nom, n: st.n });
  };

  /* ====================================================================================== */
  /*  Fiche produit                                                                          */
  /* ====================================================================================== */

  const tabBesoin = (p) => {
    const c = COM[p.c] || {}, mo = cat.mondeOf(p), res = matchOne(p);
    return `
      ${needActive() ? `<div class="sec"><h4>Correspondance avec le besoin exprimé</h4>${matchHTML(res)}</div>` : ''}
      <div class="sec"><h4>Problème client traité</h4>${textOrAV(c.probleme_client, 'Problème client traité')}</div>
      <div class="sec"><h4>Repères du catalogue</h4>
        <dl class="kv"><dt>Univers</dt><dd>${esc(mo ? mo.nom : '—')}</dd><dt>Domaine</dt><dd>${esc(p.dom || '—')}</dd><dt>Thème</dt><dd>${esc(p.th || '—')}</dd><dt>Niveau</dt><dd>${esc(p.n || '—')}</dd></dl></div>`;
  };
  const tabReponse = (p) => {
    const c = COM[p.c] || {}, cert = cat.certif(p.c), lot = cat.lots[p.c];
    const mem = lot ? (lot.membres || []).map((k) => cat.byCode.get(k)).filter(Boolean) : [];
    return `
      <div class="sec"><h4>Ce que le participant saura mieux faire</h4>${textOrAV(c.savoir_faire_participant, 'Ce que le participant saura mieux faire')}</div>
      <dl class="grid3"><div><dt>Durée</dt><dd>${esc(cat.duree(p))}</dd></div><div><dt>Format</dt><dd>${esc(p.f || '—')}</dd></div><div><dt>Type</dt><dd>${esc(p.pl === 'Lot' ? 'Lot' : p.tp || 'Produit')}</dd></div></dl>
      <p class="note">${p.cpf ? 'Éligible CPF (catalogue). ' : ''}${p.dh && p.dh !== p.dl ? 'Durée : ' + esc(p.dh) + '. ' : ''}Code ${esc(p.ob || p.c)}.</p>
      ${mem.length ? `<div class="sec"><h4>Ce lot réunit</h4><ul class="plist">${mem.map((m) => `<li class="prow"><button class="t" type="button" data-open="${esc(m.c)}"><b>${esc(m.t)}</b><small>${esc(m.f || '')} · ${esc(cat.duree(m))}</small></button></li>`).join('')}</ul></div>` : ''}
      ${cert ? `<div class="sec"><h4>Certification · France compétences</h4>
        <ul class="rome"><li><span class="meta">${esc(cert.bpf || 'Certification')} · ${esc(cert.rsRncp || '')}</span><b>${esc(cert.rsRncp || 'Code non renseigné')}</b>
        <small>${cert.statut ? 'Statut : ' + esc(cert.statut) + '. ' : ''}${cert.echeance ? 'Échéance : ' + esc(cert.echeance) + '. ' : ''}${cert.modalite ? esc(cert.modalite) : ''}</small>
        <small>${cert.urlFc ? `<a href="${esc(cert.urlFc)}" target="_blank" rel="noopener noreferrer">Fiche France compétences</a>` : ''}${cert.urlFc && cert.urlLdc ? ' · ' : ''}${cert.urlLdc ? `<a href="${esc(cert.urlLdc)}" target="_blank" rel="noopener noreferrer">Fiche sur le site LDC</a>` : ''}</small></li></ul>
        <p class="note">Référentiel France compétences (RS / RNCP), distinct des compétences ROME 4.</p></div>` : ''}`;
  };
  const tabRome = (p) => {
    const cs = R.competencesDe(p.c), m = R.mappingDe(p.c), res = matchOne(p);
    return `
      ${needActive() ? `<div class="sec"><h4>Correspondance avec le besoin exprimé</h4>${matchHTML(res)}</div>` : ''}
      <div class="sec"><h4>Compétences ROME 4 mobilisées</h4>
      ${cs.length ? `<ul class="rome">${cs.map((c) => `<li><span class="meta">${esc(c.type)} · ${esc(c.nature)} · ${c.importance === 'coeur' ? 'Cœur' : 'Support'} · ID ${c.id}</span><b>${esc(c.libelle)}</b>${c.explication ? `<small>${esc(c.explication)}</small>` : '<small>Explication contextuelle non renseignée.</small>'}</li>`).join('')}</ul>
        <p class="note">Rattachement validé${m.validePar ? ' par ' + esc(m.validePar) : ''}${m.date ? ' le ' + esc(m.date) : ''}. Libellés et types : référentiel ${esc(R.meta.version)}.</p>`
      : av('Rattachement ROME 4 à valider', 'Aucun mapping validé entre ce produit et le référentiel ROME 4.0 n\'a été fourni. Aucune compétence n\'est déduite du titre du produit.')}
      </div>`;
  };
  const tabArgu = (p) => {
    const c = COM[p.c] || {}, ass = cat.associes(p.c).slice(0, 8);
    const obj = c.objection_reponse;
    return `
      <div class="sec"><h4>Arguments de vente</h4>${textOrAV(c.arguments_vente, 'Arguments de vente')}</div>
      <div class="sec"><h4>Preuve ou différenciateur</h4>${textOrAV(c.preuve_differenciateur, 'Preuve ou différenciateur')}</div>
      <div class="sec"><h4>Objection fréquente et réponse</h4>${obj && (obj.objection || obj.reponse) ? `<p><b>${esc(obj.objection || '')}</b></p><p>${esc(obj.reponse || '')}</p>` : av('Objection fréquente et réponse commerciale')}</div>
      <div class="sec"><h4>Produits complémentaires</h4>${textOrAV(c.produits_complementaires, 'Produits complémentaires')}
        ${ass.length ? `<p class="note" style="margin-top:.5rem">Associés à ce produit dans les lots du catalogue (information factuelle) :</p><ul class="plist">${ass.map((a) => `<li class="prow"><button class="t" type="button" data-open="${esc(a.c)}"><b>${esc(a.t)}</b><small>${esc(a.f || '')} · ${esc(cat.duree(a))}</small></button><button class="add" type="button" data-add="${esc(a.c)}" aria-pressed="${L.selection.has(a.c)}" aria-label="Ajouter à la sélection client : ${esc(a.t)}">${L.selection.has(a.c) ? '✓' : '+'}</button></li>`).join('')}</ul>` : ''}</div>`;
  };
  const BODY = { besoin: tabBesoin, reponse: tabReponse, rome: tabRome, argu: tabArgu };

  const renderProduct = () => {
    const c = Sh.cur, p = c.p, mo = cat.mondeOf(p), st = cat.stationOf(p), on = L.selection.has(p.c);
    el().style.setProperty('--accent', mo ? mo.accentCfg.text : '#D71635');
    el().setAttribute('aria-label', `Fiche produit : ${p.t}`);
    el().innerHTML = `
      <div class="ph"><span class="ico" aria-hidden="true">${L.ICON_SVG}</span><p class="kicker">${esc(mo ? mo.nom : '')}${st ? ' · ' + esc(st.code) : ''}</p><button class="x" type="button" data-a="close" aria-label="Fermer la fiche">✕</button></div>
      <div class="pb">
        <p style="margin:.1rem 0 .3rem">${tags(p)}<span class="tag">${esc(p.f || p.tp || '')}</span> <span class="tag">${esc(cat.duree(p))}</span>${p.n ? ` <span class="tag">${esc(p.n)}</span>` : ''}</p>
        <h2 data-autofocus>${esc(p.t)}</h2>
        <div class="tabs" role="tablist" aria-label="Sections de la fiche">${TABS.map(([k, t]) => `<button type="button" role="tab" id="tab-${k}" aria-controls="tp-${k}" aria-selected="${c.tab === k}" tabindex="${c.tab === k ? 0 : -1}" data-tab="${k}">${t}</button>`).join('')}</div>
        <div id="tp-${c.tab}" role="tabpanel" aria-labelledby="tab-${c.tab}" tabindex="0">${BODY[c.tab](p)}</div>
      </div>
      <div class="pf"><button class="btn btn-primary" type="button" data-a="toggle" aria-pressed="${on}">${on ? '✓ Dans la sélection client' : 'Ajouter à la sélection client'}</button>${c.back ? '<button class="btn btn-ghost" type="button" data-a="back">‹ Retour à la liste</button>' : ''}<button class="btn btn-ghost" type="button" data-a="sel">Ma sélection (${L.selection.count()})</button></div>`;
  };

  Sh.openProduct = (p, opts = {}) => {
    const back = !!(Sh.cur && Sh.cur.type === 'station' && L.panels.isOpen(el())) || !!opts.back;
    Sh.cur = { type: 'product', p, tab: opts.tab || 'besoin', back };
    renderProduct(); L.panels.open(el(), { focus: '[data-autofocus]' });
    L.cognitio.say('fiche.ouverte');
  };
  Sh.refresh = () => { if (!L.panels.isOpen(el())) return; if (Sh.cur && Sh.cur.type === 'product') { const sc = $('.pb', el()).scrollTop; renderProduct(); $('.pb', el()).scrollTop = sc; } else if (Sh.cur && Sh.cur.type === 'station' && Sh.st) { refreshList(); const b = $('[data-a="sel"]', el()); if (b) b.textContent = `Ma sélection client (${L.selection.count()})`; } };
  Sh.close = () => { if (L.panels.isOpen(el())) L.panels.close(el()); Sh.cur = null; };

  const setTab = (tab, focus) => { Sh.cur.tab = tab; const sc = 0; renderProduct(); $('.pb', el()).scrollTop = sc; if (tab === 'rome' && !R.competencesDe(Sh.cur.p.c).length) L.cognitio.say('fiche.rome.vide'); if (focus) { const t = $(`#tab-${tab}`, el()); if (t) t.focus(); } };

  Sh.init = () => {
    const root = el();
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a],[data-tab],[data-open],[data-add],[data-f]'); if (!b) return;
      if (b.dataset.tab) return setTab(b.dataset.tab);
      if (b.dataset.open) { const p = cat.byCode.get(b.dataset.open); if (p) { const wasStation = Sh.cur && Sh.cur.type === 'station'; Sh.openProduct(p, { back: wasStation || (Sh.cur && Sh.cur.back) }); } return; }
      if (b.dataset.add) { L.selection.toggle(b.dataset.add); return; }
      if (b.dataset.f) {
        const s = Sh.st, f = b.dataset.f, v = b.dataset.v;
        if (f === 'best') s.best = !s.best; else if (f === 'sort') s.sort = s.sort === 'match' ? 'catalogue' : 'match'; else s[f] = s[f] === v ? null : v;
        L.$$('[data-f]', root).forEach((x) => { const k = x.dataset.f; x.setAttribute('aria-pressed', k === 'best' ? s.best : k === 'sort' ? s.sort === 'match' : s[k] === x.dataset.v); });
        return refreshList();
      }
      const a = b.dataset.a;
      if (a === 'close') Sh.close();
      else if (a === 'sel') L.selection.open();
      else if (a === 'toggle') L.selection.toggle(Sh.cur.p.c);
      else if (a === 'back') { const st = Sh.st && Sh.st.station; if (st) Sh.openStation(st, true); else Sh.close(); }
    });
    root.addEventListener('input', (e) => { if (e.target.id === 'stQ') { Sh.st.q = e.target.value; refreshList(); } });
    root.addEventListener('keydown', (e) => {
      if (e.target.matches('[role=tab]') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { const ks = TABS.map((t) => t[0]), i = ks.indexOf(Sh.cur.tab), n = ks[L.mod(i + (e.key === 'ArrowRight' ? 1 : -1), ks.length)]; e.preventDefault(); setTab(n, true); }
    });
    L.onChange(() => Sh.refresh());
  };
})();
