/* « Ma sélection client » : le besoin exprimé, les produits retenus, la durée, les formats, les compétences ROME 4,
   l'argument principal et les produits complémentaires. Copie, impression, persistance locale, réinitialisation.
   Aucune donnée client sensible n'est demandée : tout reste dans ce navigateur (localStorage). */

(function () {
  'use strict';
  const L = window.LDC, $ = L.$, esc = L.esc, cat = L.cat, R = L.rome;
  const Se = L.selection = {};
  const el = () => $('#selection');
  const COM = L.content('produits-commercial').produits || {};
  const codes = () => L.state.client.produits;

  Se.has = (c) => codes().includes(c);
  Se.count = () => codes().length;
  Se.items = () => codes().map((c) => cat.byCode.get(c)).filter(Boolean);
  Se.add = (c) => { if (!cat.byCode.has(c) || Se.has(c)) return; codes().push(c); L.persist(); L.toast('Ajouté à la sélection client'); };
  Se.remove = (c) => { const i = codes().indexOf(c); if (i < 0) return; codes().splice(i, 1); L.persist(); L.toast('Retiré de la sélection client'); };
  Se.toggle = (c) => (Se.has(c) ? Se.remove(c) : Se.add(c));

  /* ---------- besoin exprimé : lignes lisibles ---------- */
  Se.besoinLignes = () => {
    const b = L.state.client.besoin, rows = [];
    if (b.texte && b.texte.trim()) rows.push(['Contexte', b.texte.trim()]);
    if (b.metier) rows.push(['Métier (ROME 4.0)', `${b.metier.libelle} (${b.metier.code})`]);
    if (b.competences.length) rows.push(['Compétences visées (ROME 4.0)', b.competences.map((c) => c.libelle).join(' ; ')]);
    if (b.mondes.length) rows.push(['Univers', b.mondes.map((id) => (cat.mondeById[id] || {}).nom || id).join(', ')]);
    if (b.niveau) rows.push(['Niveau', b.niveau]);
    if (b.formats.length) rows.push(['Formats', b.formats.join(', ')]);
    if (b.dureeMax) rows.push(['Durée maximale', `${b.dureeMax} ${b.dureeMax > 1 ? 'jours' : 'jour'}`]);
    return rows;
  };

  /* ---------- synthèse ---------- */
  Se.synthese = () => {
    const items = Se.items(), jours = cat.jours(items), inconnus = cat.joursInconnus(items), fm = {}, mo = {};
    items.forEach((p) => { fm[p.f || 'Format non renseigné'] = (fm[p.f || 'Format non renseigné'] || 0) + 1; const m = cat.mondeOf(p); if (m) mo[m.nom] = (mo[m.nom] || 0) + 1; });
    const comp = R.synthese(items);
    const compl = new Map(); items.forEach((p) => cat.associes(p.c).forEach((a) => { if (!Se.has(a.c)) compl.set(a.c, a); }));
    const argus = items.map((p) => ({ p, a: (COM[p.c] || {}).arguments_vente })).filter((x) => x.a && (Array.isArray(x.a) ? x.a.length : String(x.a).trim()));
    return { items, jours, inconnus, formats: fm, mondes: mo, competences: comp, complementaires: [...compl.values()].slice(0, 8), arguments: argus, besoin: Se.besoinLignes(), argument: L.state.client.argument, etape: L.state.client.etape, rome: R.meta ? R.meta.version : '', source: cat.meta.source };
  };

  Se.toText = () => {
    const s = Se.synthese(), out = [];
    out.push('PROPOSITION CLIENT — Lefebvre Dalloz Compétences · catalogue 2027', '');
    out.push('BESOIN EXPRIMÉ'); out.push(...(s.besoin.length ? s.besoin.map(([k, v]) => `- ${k} : ${v}`) : ['- (non renseigné)'])); out.push('');
    out.push(`PRODUITS RETENUS (${s.items.length})`);
    s.items.forEach((p, i) => out.push(`${i + 1}. ${p.t} — ${p.f || 'format non renseigné'} · ${cat.duree(p)}${p.n ? ' · ' + p.n : ''} [${p.ob || p.c}]`));
    if (!s.items.length) out.push('- (aucun produit)');
    out.push('', `DURÉE CUMULÉE : ${s.items.length ? cat.fmtJours(s.jours) : '—'}${s.inconnus ? ` (hors ${s.inconnus} produit${s.inconnus > 1 ? 's' : ''} sans durée en jours)` : ''}`);
    out.push(`FORMATS : ${Object.entries(s.formats).map(([k, n]) => `${k} (${n})`).join(', ') || '—'}`, '');
    out.push('COMPÉTENCES ROME 4 MOBILISÉES');
    out.push(...(s.competences.length ? s.competences.map((c) => `- ${c.libelle} — ${c.type} · ${c.importance === 'coeur' ? 'cœur' : 'support'} · ID ${c.id}`) : ['- À VALIDER : aucun rattachement ROME 4 validé pour les produits retenus.']));
    out.push('', 'ARGUMENT PRINCIPAL', s.argument && s.argument.trim() ? s.argument.trim() : '- (à renseigner)');
    if (s.arguments.length) { out.push('', 'ARGUMENTS DE VENTE (catalogue enrichi)'); s.arguments.forEach((x) => out.push(`- ${x.p.t} : ${[].concat(x.a).join(' ; ')}`)); }
    out.push('', 'PRODUITS COMPLÉMENTAIRES (associés dans les lots du catalogue)');
    out.push(...(s.complementaires.length ? s.complementaires.map((p) => `- ${p.t} [${p.ob || p.c}]`) : ['- (aucun)']));
    out.push('', `PROCHAINE ÉTAPE : ${s.etape || '(à convenir)'}`, '', `Sources : ${s.source} · ROME ${s.rome}. Document de travail ; les rubriques « À VALIDER » attendent une validation de l'offre.`);
    return out.join('\n');
  };

  Se.printHTML = () => {
    const s = Se.synthese(), e = esc;
    return `<h1>Proposition client</h1><p>Lefebvre Dalloz Compétences · catalogue 2027 · ${e(new Date().toLocaleDateString('fr-FR'))}</p>
      <h2>Besoin exprimé</h2>${s.besoin.length ? `<table>${s.besoin.map(([k, v]) => `<tr><th>${e(k)}</th><td>${e(v)}</td></tr>`).join('')}</table>` : '<p>Non renseigné.</p>'}
      <h2>Produits retenus (${s.items.length})</h2><table><tr><th>Produit</th><th>Format</th><th>Durée</th><th>Niveau</th></tr>${s.items.map((p) => `<tr><td>${e(p.t)}<br><small>${e(p.ob || p.c)}</small></td><td>${e(p.f || '—')}</td><td>${e(cat.duree(p))}</td><td>${e(p.n || '—')}</td></tr>`).join('')}</table>
      <p><b>Durée cumulée :</b> ${s.items.length ? e(cat.fmtJours(s.jours)) : '—'}${s.inconnus ? ` (hors ${s.inconnus} sans durée en jours)` : ''}</p>
      <h2>Compétences ROME 4 mobilisées</h2>${s.competences.length ? `<table>${s.competences.map((c) => `<tr><td>${e(c.libelle)}</td><td>${e(c.type)}</td><td>${c.importance === 'coeur' ? 'Cœur' : 'Support'}</td><td>ID ${c.id}</td></tr>`).join('')}</table>` : '<p><span class="av">À VALIDER</span> Aucun rattachement ROME 4 validé pour les produits retenus.</p>'}
      <h2>Argument principal</h2><p>${s.argument && s.argument.trim() ? e(s.argument) : '—'}</p>
      <h2>Produits complémentaires</h2>${s.complementaires.length ? `<ul>${s.complementaires.map((p) => `<li>${e(p.t)}</li>`).join('')}</ul>` : '<p>—</p>'}
      <h2>Prochaine étape</h2><p>${e(s.etape || 'À convenir')}</p>
      <p><small>Sources : ${e(s.source)} · ROME ${e(s.rome)}.</small></p>`;
  };
  Se.print = () => { $('#print').innerHTML = Se.printHTML(); window.print(); };

  /* ---------- panneau ---------- */
  let confirmReset = 0;
  const render = () => {
    const s = Se.synthese(), root = el(), sc = $('.pb', root) ? $('.pb', root).scrollTop : 0, keepArg = document.activeElement && document.activeElement.id === 'selArg';
    root.innerHTML = `
      <div class="ph"><span class="ico" aria-hidden="true">${L.MARK}</span><p class="kicker">Proposition client</p><button class="x" type="button" data-a="close" aria-label="Fermer la sélection">✕</button></div>
      <div class="pb">
        <h2 id="selTitle" data-autofocus>Ma sélection client</h2>
        <p class="lead">${s.items.length ? `${s.items.length} ${L.plural(s.items.length, 'produit')} · ${cat.fmtJours(s.jours)}` : 'Aucun produit pour le moment.'}</p>
        ${s.besoin.length ? `<div class="sec"><h4>Besoin exprimé</h4><dl class="kv">${s.besoin.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>` : ''}
        <div class="sec"><h4>Produits retenus</h4>
          ${s.items.length ? `<ul class="sel-items">${s.items.map((p) => { const m = cat.mondeOf(p); return `<li class="sel-item" style="--c:${m ? m.accentCfg.main : '#D71635'}"><span class="bar"></span><div class="tx"><button class="link" type="button" data-open="${esc(p.c)}" style="text-align:left;text-decoration:none"><b>${esc(p.t)}</b></button><small>${esc(m ? m.nom : '')} · ${esc(p.f || '')} · ${esc(cat.duree(p))}${p.n ? ' · ' + esc(p.n) : ''}</small></div><button class="rm" type="button" data-rm="${esc(p.c)}" aria-label="Retirer : ${esc(p.t)}">✕</button></li>`; }).join('')}</ul>` : '<p class="note">Ouvrez une fiche produit et choisissez « Ajouter à la sélection client ».</p>'}
        </div>
        ${s.items.length ? `<div class="sec"><h4>Durée et formats</h4><dl class="kv"><dt>Durée cumulée</dt><dd>${cat.fmtJours(s.jours)}${s.inconnus ? ` <span class="note">(hors ${s.inconnus} sans durée en jours)</span>` : ''}</dd><dt>Formats</dt><dd>${Object.entries(s.formats).map(([k, n]) => `${esc(k)} (${n})`).join(', ')}</dd><dt>Univers</dt><dd>${Object.entries(s.mondes).map(([k, n]) => `${esc(k)} (${n})`).join(', ')}</dd></dl></div>
        <div class="sec"><h4>Compétences ROME 4 mobilisées</h4>${s.competences.length ? `<ul class="rome">${s.competences.map((c) => `<li><span class="meta">${esc(c.type)} · ${c.importance === 'coeur' ? 'Cœur' : 'Support'} · ID ${c.id}</span><b>${esc(c.libelle)}</b></li>`).join('')}</ul>` : `<div class="empty-av"><b>Rattachement ROME 4 ${L.tagAV()}</b>Aucun rattachement validé pour les produits retenus. Aucune compétence n'est déduite des titres.</div>`}</div>` : ''}
        <div class="sec"><h4>Argument principal</h4><label class="sr" for="selArg">Argument principal</label><textarea id="selArg" class="input" placeholder="En une phrase : pourquoi cette sélection répond au besoin (texte libre, conservé sur cet ordinateur)">${esc(s.argument || '')}</textarea>
          ${s.arguments.length ? `<ul class="list" style="margin-top:.5rem">${s.arguments.map((x) => `<li><b>${esc(x.p.t)}</b> : ${esc([].concat(x.a).join(' ; '))}</li>`).join('')}</ul>` : `<p class="note">Arguments de vente par produit : ${L.tagAV('non renseignés')}</p>`}</div>
        ${s.items.length ? `<div class="sec"><h4>Produits complémentaires</h4>${s.complementaires.length ? `<ul class="plist">${s.complementaires.map((p) => Se.compRow(p)).join('')}</ul><p class="note">Associés aux produits retenus dans les lots du catalogue.</p>` : '<p class="note">Aucun produit associé dans les lots du catalogue.</p>'}</div>` : ''}
        <p class="note">Aucune donnée client sensible n'est nécessaire. Tout est conservé uniquement dans ce navigateur.</p>
      </div>
      <div class="pf"><button class="btn btn-primary btn-sm" type="button" data-a="copy" ${s.items.length ? '' : 'disabled'}>Copier la synthèse</button>${L.env.artifact ? '' : `<button class="btn btn-ghost btn-sm" type="button" data-a="print" ${s.items.length ? '' : 'disabled'}>Imprimer</button>`}<button class="btn btn-ghost btn-sm" type="button" data-a="reset">${confirmReset ? 'Confirmer la réinitialisation' : 'Réinitialiser'}</button></div>`;
    $('.pb', root).scrollTop = sc;
    if (keepArg) { const t = $('#selArg', root); t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
  };
  Se.compRow = (p) => `<li class="prow"><button class="t" type="button" data-open="${esc(p.c)}"><b>${esc(p.t)}</b><small>${esc(p.f || '')} · ${esc(cat.duree(p))}</small></button><button class="add" type="button" data-add="${esc(p.c)}" aria-pressed="false" aria-label="Ajouter à la sélection client : ${esc(p.t)}">+</button></li>`;

  Se.open = () => { confirmReset = 0; render(); L.panels.open(el(), { focus: '[data-autofocus]' }); if (!Se.count()) L.cognitio.say('selection.vide'); };
  Se.close = () => { if (L.panels.isOpen(el())) L.panels.close(el()); };
  Se.isOpen = () => L.panels.isOpen(el());

  Se.init = () => {
    const root = el();
    $('#btnSel').addEventListener('click', () => (Se.isOpen() ? Se.close() : Se.open()));
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a],[data-open],[data-add],[data-rm]'); if (!b) return;
      if (b.dataset.rm) return Se.remove(b.dataset.rm);
      if (b.dataset.add) return Se.toggle(b.dataset.add);
      if (b.dataset.open) { const p = cat.byCode.get(b.dataset.open); if (p) L.sheet.openProduct(p, { back: false }); return; }
      const a = b.dataset.a;
      if (a === 'close') Se.close();
      else if (a === 'copy') L.copy(Se.toText()).then((ok) => L.toast(ok ? 'Synthèse copiée' : 'Copie impossible : sélectionnez le texte à la main'));
      else if (a === 'print') Se.print();
      else if (a === 'reset') { if (!confirmReset) { confirmReset = setTimeout(() => { confirmReset = 0; if (Se.isOpen()) render(); }, 4000); render(); } else { clearTimeout(confirmReset); confirmReset = 0; L.resetClient(); L.toast('Sélection réinitialisée'); } }
    });
    let t = 0;
    root.addEventListener('input', (e) => { if (e.target.id === 'selArg') { L.state.client.argument = e.target.value; clearTimeout(t); t = setTimeout(() => L.store.save({ seenTransition: L.state.seenTransition, client: L.state.client }), 300); } });
    const upd = () => { const n = Se.count(), c = $('#selCount'); c.textContent = n; c.hidden = !n; if (Se.isOpen()) render(); };
    L.onChange(upd); upd();
  };
})();
