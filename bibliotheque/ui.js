/* Interface : écran d'entrée / Bibliothécaire (filtre intelligent), HUD, fiche livre + passerelle France compétences,
   parcours, quêtes et progression. Tout l'état du lecteur est local (localStorage), rien ne sort du navigateur. */

(function () {
  const L = window.LDC;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KEY = 'ldc-bibliotheque-v1';
  const ALL = L.DOMAINES.map((d) => d.id);
  L.$ = $; L.$$ = $$; L.esc = esc;

  /* ---------- état du lecteur ---------- */
  const st = L.state = { sel: new Set(ALL), reco: new Set(), recoQ: '', persona: null, xp: 0, opened: new Set(), xpJ: new Set(), parcours: new Set(), matched: new Set(), golds: new Set(), visited: new Set(), done: new Set(), sound: true, intro: true };
  const SETS = ['opened', 'xpJ', 'parcours', 'matched', 'golds', 'visited', 'done'];
  (function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!raw) return;
      st.xp = +raw.xp || 0; st.sound = raw.sound !== false; st.persona = raw.persona || null;
      SETS.forEach((k) => { st[k] = new Set((raw[k] || []).filter((x) => typeof x === 'string')); });
      if (Array.isArray(raw.sel) && raw.sel.length) st.sel = new Set(raw.sel.filter((x) => ALL.includes(x)));
      st.parcours = new Set([...st.parcours].filter((id) => L.byId[id]));
    } catch (e) { /* stockage indisponible : on continue sans */ }
  })();
  const save = () => { try { const o = { xp: st.xp, sound: st.sound, persona: st.persona, sel: [...st.sel] }; SETS.forEach((k) => { o[k] = [...st[k]]; }); localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* ignoré */ } };
  L.save = save;

  const ui = L.ui = {};
  const app = () => L.app || {};

  /* ---------- niveaux et quêtes ---------- */
  const LEVELS = [[0, 'Lecteur curieux'], [80, 'Apprenti archiviste'], [200, 'Archiviste'], [380, 'Bibliothécaire'], [600, 'Grand Maître des savoirs']];
  const level = () => { let i = 0; LEVELS.forEach((l, k) => { if (st.xp >= l[0]) i = k; }); const cur = LEVELS[i], nxt = LEVELS[i + 1]; return { i, name: cur[1], pct: nxt ? (st.xp - cur[0]) / (nxt[0] - cur[0]) : 1, next: nxt ? nxt[0] : null }; };

  const coverage = () => {
    const map = new Map();
    st.parcours.forEach((id) => {
      const l = L.byId[id]; const key = l.dom.id + ':' + l.theme.index;
      if (!map.has(key)) map.set(key, { theme: l.theme, dom: l.dom, livres: [], cov: new Set() });
      const e = map.get(key); e.livres.push(l); l.fc.couverts.forEach((c, i) => { if (c) e.cov.add(i); });
    });
    return [...map.values()].map((e) => ({ ...e, total: e.theme.fc.c.length, pct: Math.round(100 * e.cov.size / e.theme.fc.c.length) }));
  };
  const QUESTS = [
    { id: 'q1', t: 'Franchir le seuil', d: 'Entrer dans un premier rayon.', max: () => 1, cur: () => (st.visited.size ? 1 : 0), bonus: 20 },
    { id: 'q2', t: 'Tour des rayons', d: 'Visiter tous les rayons que vous avez ouverts.', max: () => Math.max(1, st.sel.size), cur: () => [...st.sel].filter((id) => st.visited.has(id)).length, bonus: 60 },
    { id: 'q3', t: 'Lecteur assidu', d: 'Ouvrir 5 livres.', max: () => 5, cur: () => st.opened.size, bonus: 40 },
    { id: 'q4', t: 'Chasseur d\'or', d: 'Dénicher les livres dorés cachés (un par rayon).', max: () => 6, cur: () => st.golds.size, bonus: 100 },
    { id: 'q5', t: 'Bâtisseur de parcours', d: 'Ajouter 3 formations à votre parcours.', max: () => 3, cur: () => st.parcours.size, bonus: 50 },
    { id: 'q6', t: 'Pont des compétences', d: 'Relier 3 livres à France compétences.', max: () => 3, cur: () => st.matched.size, bonus: 60 },
    { id: 'q7', t: 'Bloc complet', d: 'Couvrir 100 % d\'un bloc de compétences avec votre parcours.', max: () => 1, cur: () => (coverage().some((c) => c.pct >= 100) ? 1 : 0), bonus: 80 },
  ];

  const game = L.game = {
    award(xp, title, sub) {
      if (xp) { const before = level().i; st.xp += xp; if (level().i > before) { ui.toast('Nouveau grade : ' + level().name, 'Votre carnet de lecteur progresse.', 'level'); app().sfx && app().sfx('chime'); } }
      if (title) ui.toast(title, sub || (xp ? '+' + xp + ' XP' : ''), 'xp');
      ui.refreshHud(); save();
    },
    check() {
      QUESTS.forEach((q) => {
        if (st.done.has(q.id)) return;
        if (q.cur() >= q.max()) { st.done.add(q.id); ui.toast('Quête accomplie : ' + q.t, '+' + q.bonus + ' XP', 'quest'); st.xp += q.bonus; app().sfx && app().sfx('chime'); }
      });
      ui.refreshHud(); ui.renderQuests(); save();
    },
  };

  /* ---------- recherche et recommandation ---------- */
  const computeReco = (q, restrict = true) => {
    const res = L.search(q).filter((r) => !restrict || st.sel.has(r.livre.dom.id));
    if (!res.length) return [];
    const top = res[0].score; return res.filter((r) => r.score >= Math.max(3, top * .4)).slice(0, 12);
  };
  ui.setReco = (q) => { st.recoQ = q; st.reco = new Set(q ? computeReco(q).map((r) => r.livre.id) : []); app().onReco && app().onReco(); };

  /* ---------- écran d'entrée / Bibliothécaire ---------- */
  const personasEl = $('#personas'), domsEl = $('#doms'), needQ = $('#needQ'), needRes = $('#needRes');
  L.PERSONAS.forEach((p) => { const b = document.createElement('button'); b.className = 'chip'; b.dataset.id = p.id; b.innerHTML = `<span class="ico">${esc(p.icone)}</span>${esc(p.nom)}`; personasEl.appendChild(b); });
  L.DOMAINES.forEach((d) => {
    const b = document.createElement('button'); b.className = 'dom'; b.dataset.id = d.id; b.style.setProperty('--c', d.couleur); b.style.setProperty('--l', d.lueur);
    b.innerHTML = `<span class="dglyph${d.glyph.length > 2 ? ' s3' : d.glyph.length > 1 ? ' s2' : ''}">${esc(d.glyph)}</span><span class="dname"><b>${esc(d.court)}</b><small>${esc(d.nom)}</small></span><span class="dstate"></span>`;
    domsEl.appendChild(b);
  });

  const formatTag = (f) => `<em class="ftag" style="--f:${L.FORMATS[f].col}">${esc(L.FORMATS[f].nom)}</em>`;
  const renderNeed = (list) => {
    needRes.innerHTML = list.slice(0, 5).map((r) => `<li data-id="${r.livre.id}"><i style="background:${r.livre.dom.lueur}"></i><span><b>${esc(r.livre.titre)}</b><small>${esc(r.livre.dom.court)} › ${esc(r.livre.theme.nom)}</small></span>${formatTag(r.livre.fmt)}</li>`).join('');
  };
  ui.refreshGate = () => {
    $$('.dom', domsEl).forEach((b) => { const on = st.sel.has(b.dataset.id); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); $('.dstate', b).textContent = (on ? 'Ouvert' : 'Fermé') + ' · ' + L.domById[b.dataset.id].nbLivres + ' formations'; });
    $$('.chip', personasEl).forEach((b) => b.classList.toggle('on', b.dataset.id === st.persona));
    const n = st.sel.size, m = [...st.sel].reduce((a, id) => a + L.domById[id].nbLivres, 0);
    $('#gateSum').innerHTML = n ? `<b>${n}</b> rayon${n > 1 ? 's' : ''} ouvert${n > 1 ? 's' : ''} · <b>${m}</b> formations` + (st.reco.size ? ` · <span class="star">★</span> ${st.reco.size} livre${st.reco.size > 1 ? 's' : ''} repéré${st.reco.size > 1 ? 's' : ''} pour vous` : '') : 'Ouvrez au moins un rayon';
    $('#enter').disabled = !n;
  };
  ui.showGate = (mode) => {
    const g = $('#gate'); g.dataset.mode = mode; g.hidden = false; requestAnimationFrame(() => g.classList.add('show'));
    $('#gateTitle').innerHTML = mode === 'intro' ? 'La Bibliothèque <em>des Compétences</em>' : 'Le <em>Bibliothécaire</em>';
    $('#gateLead').textContent = mode === 'intro' ? 'Un rayon par domaine, une travée par thématique, un grand livre par formation. Ouvrez-les, reliez-les à France compétences, composez votre parcours.' : 'Dites-moi qui vous êtes ou ce que vous cherchez : je referme les rayons inutiles et je repère les livres pour vous.';
    $('#enter').textContent = mode === 'intro' ? 'Entrer dans la bibliothèque' : 'Appliquer et reprendre la visite';
    $('#gateClose').hidden = mode === 'intro';
    ui.refreshGate();
  };
  ui.hideGate = () => { const g = $('#gate'); g.classList.remove('show'); setTimeout(() => { g.hidden = true; }, 450); };
  ui.gateOpen = () => !$('#gate').hidden;

  personasEl.addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return; const p = L.PERSONAS.find((x) => x.id === b.dataset.id);
    st.persona = p.id; st.sel = new Set(p.domaines); needQ.value = ''; renderNeed([]); ui.setReco(p.q); ui.refreshGate(); save(); app().onFilter && app().onFilter();
  });
  domsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.dom'); if (!b) return; const id = b.dataset.id;
    if (st.sel.has(id)) st.sel.delete(id); else st.sel.add(id);
    st.persona = null; if (st.recoQ) ui.setReco(st.recoQ); ui.refreshGate(); save(); app().onFilter && app().onFilter();
  });
  $('#selAll').addEventListener('click', () => { st.sel = new Set(ALL); st.persona = null; ui.refreshGate(); save(); app().onFilter && app().onFilter(); });
  $('#selNone').addEventListener('click', () => { st.sel = new Set(); st.persona = null; ui.refreshGate(); save(); app().onFilter && app().onFilter(); });
  let needT = 0;
  needQ.addEventListener('input', () => {
    clearTimeout(needT); needT = setTimeout(() => {
      const q = needQ.value.trim(); st.persona = null;
      if (!q) { renderNeed([]); ui.setReco(''); ui.refreshGate(); return; }
      const res = L.search(q); renderNeed(res);
      const score = {}; res.slice(0, 20).forEach((r) => { score[r.livre.dom.id] = (score[r.livre.dom.id] || 0) + r.score; });
      const top = Object.entries(score).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]);
      if (top.length) st.sel = new Set(top);
      ui.setReco(q); ui.refreshGate(); save(); app().onFilter && app().onFilter();
    }, 160);
  });
  needRes.addEventListener('click', (e) => {
    const li = e.target.closest('li'); if (!li) return; const l = L.byId[li.dataset.id];
    st.sel.add(l.dom.id); st.reco = new Set([l.id]); ui.refreshGate(); app().enter && app().enter({ goto: l });
  });
  $('#enter').addEventListener('click', () => app().enter && app().enter());
  $('#gateClose').addEventListener('click', () => app().closeGate && app().closeGate());

  /* ---------- HUD ---------- */
  ui.refreshHud = () => {
    const lv = level(); $('#xpLevel').textContent = lv.name; $('#xpFill').style.width = Math.round(lv.pct * 100) + '%';
    $('#xpVal').textContent = st.xp + ' XP'; $('#jCount').textContent = st.parcours.size; $('#jCount').hidden = !st.parcours.size;
  };
  ui.crumbs = (parts) => {
    const el = $('#crumbs'); el.innerHTML = '';
    parts.forEach((p, i) => {
      if (i) { const s = document.createElement('span'); s.className = 'sep'; s.textContent = '›'; el.appendChild(s); }
      const b = document.createElement(p.fn ? 'button' : 'span'); b.className = 'crumb' + (p.fn ? ' link' : ''); b.textContent = p.t; if (p.c) b.style.setProperty('--c', p.c); if (p.fn) b.addEventListener('click', p.fn); el.appendChild(b);
    });
  };
  ui.hint = (txt) => { $('#hint').textContent = txt || ''; };

  const tip = $('#tip');
  ui.tip = (html, x, y) => {
    if (html == null) { tip.hidden = true; return; }
    if (tip.dataset.h !== html) { tip.innerHTML = html; tip.dataset.h = html; }
    tip.hidden = false; const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, x + 16)) + 'px'; tip.style.top = Math.max(8, Math.min(innerHeight - h - 8, y + 18)) + 'px';
  };
  ui.toast = (title, sub, kind) => {
    const t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.innerHTML = `<span class="seal"><i></i></span><span><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>`;
    $('#toasts').appendChild(t); requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 500); }, 3800);
  };
  ui.curtain = (txt, on) => { $('#curtainTxt').textContent = txt || ''; $('#curtain').classList.toggle('on', !!on); };

  /* recherche en jeu */
  const sq = $('#searchQ'), sr = $('#searchRes');
  const doSearch = () => {
    const q = sq.value.trim(); if (!q) { sr.hidden = true; return; }
    const res = L.search(q).slice(0, 6);
    sr.innerHTML = res.length ? res.map((r) => `<li data-id="${r.livre.id}"><i style="background:${r.livre.dom.lueur}"></i><span><b>${esc(r.livre.titre)}</b><small>${esc(r.livre.dom.court)} › ${esc(r.livre.theme.nom)}${st.sel.has(r.livre.dom.id) ? '' : ' · rayon fermé'}</small></span>${formatTag(r.livre.fmt)}</li>`).join('') : '<li class="none">Aucun livre ne correspond. Essayez « paie », « bail », « IA »…</li>';
    sr.hidden = false;
  };
  sq.addEventListener('input', doSearch); sq.addEventListener('focus', doSearch);
  sq.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { const li = $('li[data-id]', sr); if (li) li.click(); } if (e.key === 'Escape') { sq.blur(); sr.hidden = true; } });
  sr.addEventListener('click', (e) => { const li = e.target.closest('li[data-id]'); if (!li) return; sr.hidden = true; sq.value = ''; sq.blur(); app().goToBook && app().goToBook(L.byId[li.dataset.id]); });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.search')) sr.hidden = true; });
  needQ.addEventListener('keydown', (e) => e.stopPropagation());

  /* ---------- fiche livre + passerelle France compétences ---------- */
  const bp = $('#bookPanel');
  const inJourney = (l) => st.parcours.has(l.id);
  const EXTRA = { IL: 'Repartir avec les points d\'attention essentiels', WS: 'Repartir avec un outil prêt à l\'emploi', MC: 'Bénéficier du retour d\'expérience d\'un expert', FO: 'S\'exercer sur des cas pratiques', CE: 'Valider ses acquis par une évaluation finale' };
  ui.showBook = (ref) => {
    const l = ref.livre, f = L.FORMATS[l.fmt];
    bp.style.setProperty('--dom', l.dom.couleur); bp.style.setProperty('--lueur', l.dom.lueur);
    bp.innerHTML = `
      <div class="bp-head"><span class="fmt" style="--f:${f.col}">${esc(f.nom)}</span><span class="bp-meta">${esc(l.duree)} · ${esc(l.niveau)}</span><button class="bp-x" aria-label="Refermer le livre" data-a="close">✕</button></div>
      <p class="bp-path">${esc(l.dom.court)} › ${esc(l.theme.nom)}</p>
      <h2>${esc(l.titre)}</h2>
      <p class="bp-pitch">${esc(f.desc)}</p>
      <dl class="bp-grid"><div><dt>Durée</dt><dd>${esc(l.duree)}</dd></div><div><dt>Niveau</dt><dd>${esc(l.niveau)}</dd></div><div><dt>Format</dt><dd>${esc(f.nom)}</dd></div></dl>
      <div class="bp-blk"><h3>À l'issue, vous saurez</h3><ul class="bp-list">${l.objectifs.concat(EXTRA[l.fmt]).map((o) => `<li>${esc(o)}</li>`).join('')}</ul></div>
      <div class="bp-blk"><h3>Pour qui ?</h3><p>${esc(l.dom.public)}.</p></div>
      <div class="bp-actions">
        <button class="btn btn-secondary" data-a="journey">${inJourney(l) ? 'Retirer de mon parcours' : 'Ajouter à mon parcours'}</button>
        <button class="btn btn-primary pulse" data-a="match">Relier à France compétences</button>
      </div>
      <section class="fc" hidden></section>
      <p class="bp-note">Fiche de démonstration : à remplacer par la fiche produit du catalogue 2027.</p>`;
    bp.hidden = false; bp.scrollTop = 0; requestAnimationFrame(() => bp.classList.add('show'));
    if (st.matched.has(l.id)) { $('.btn-primary', bp).classList.remove('pulse'); }
  };
  ui.hideBook = () => { bp.classList.remove('show'); setTimeout(() => { if (!bp.classList.contains('show')) bp.hidden = true; }, 420); };
  ui.bookOpen = () => !bp.hidden && bp.classList.contains('show');
  bp.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a, ref = app().currentBook && app().currentBook();
    if (!ref) return;
    if (a === 'close') app().closeBook(); else if (a === 'journey') { ui.toggleJourney(ref.livre); b.textContent = inJourney(ref.livre) ? 'Retirer de mon parcours' : 'Ajouter à mon parcours'; } else if (a === 'match') app().match(ref);
    else if (a === 'sug') { ui.toggleJourney(L.byId[b.dataset.id]); b.classList.add('done'); b.disabled = true; }
  });

  ui.renderMatch = (ref) => {
    const l = ref.livre, th = l.theme, fc = th.fc, sec = $('.fc', bp); if (!sec) return;
    const miss = fc.c.map((x, j) => j).filter((j) => !l.fc.couverts[j]);
    const sugg = th.livres.filter((o) => o !== l).map((o) => ({ o, gain: miss.filter((j) => o.fc.couverts[j]).length })).filter((x) => x.gain).sort((a, b) => b.gain - a.gain).slice(0, 2);
    sec.hidden = false;
    sec.innerHTML = `
      <div class="fc-head"><span class="fc-badge">France compétences</span><b>${esc(fc.titre)}</b><small>${esc(L.fcLabel(fc))} · ${esc(fc.bloc)}</small></div>
      <div class="fc-bridge"><svg class="fc-svg" aria-hidden="true"></svg>
        <div class="fc-col fc-l"><h4>Ce livre travaille</h4><ul>${th.comps.map((c, i) => `<li data-i="${i}" class="${l.compIdx.includes(i) ? 'on' : ''}"><i></i>${esc(c)}</li>`).join('')}</ul></div>
        <div class="fc-col fc-r"><h4>Bloc de compétences visé</h4><ul>${fc.c.map(([t], j) => `<li data-j="${j}" class="${l.fc.couverts[j] ? 'hit' : 'miss'}"><i></i>${esc(t)}</li>`).join('')}</ul></div>
      </div>
      <div class="fc-gauge"><svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="30" class="bg"/><circle cx="36" cy="36" r="30" class="fg" id="fcRing"/></svg>
        <div><b id="fcPct">0 %</b><span>${l.fc.nb} compétence${l.fc.nb > 1 ? 's' : ''} du bloc sur ${l.fc.total} couverte${l.fc.nb > 1 ? 's' : ''} par ce livre</span></div></div>
      ${sugg.length ? `<div class="fc-next"><h4>Pour couvrir le reste du bloc</h4>${sugg.map(({ o, gain }) => `<button class="sug" data-a="sug" data-id="${o.id}" ${inJourney(o) ? 'disabled' : ''}><span>+ ${esc(o.titre)}</span><em>+${Math.round(100 * gain / l.fc.total)} %</em></button>`).join('')}</div>` : '<p class="fc-ok">Ce livre couvre à lui seul tout le bloc de compétences.</p>'}
      <p class="fc-note">Correspondance indicative construite à partir des compétences du catalogue : à rattacher aux fiches RNCP / RS officielles.</p>`;
    $('.btn-primary', bp).classList.remove('pulse');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const br = $('.fc-bridge', sec), svg = $('.fc-svg', sec), bb = br.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${bb.width} ${bb.height}`); svg.innerHTML = '';
      let n = 0;
      fc.c.forEach(([, via], j) => via.forEach((i) => {
        if (!l.compIdx.includes(i)) return;
        const a = $(`.fc-l li[data-i="${i}"] i`, sec).getBoundingClientRect(), z = $(`.fc-r li[data-j="${j}"] i`, sec).getBoundingClientRect();
        const x1 = a.left + a.width / 2 - bb.left, y1 = a.top + a.height / 2 - bb.top, x2 = z.left + z.width / 2 - bb.left, y2 = z.top + z.height / 2 - bb.top, mx = (x1 + x2) / 2;
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`); p.setAttribute('class', 'lnk');
        p.style.animationDelay = (.25 + n * .28) + 's'; svg.appendChild(p); n++;
      }));
      $$('.fc-r li.hit', sec).forEach((li, k) => { li.style.transitionDelay = (.6 + k * .28) + 's'; li.classList.add('lit'); });
      const ring = $('#fcRing'), pct = l.fc.score; const C = 188.5;
      ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C; requestAnimationFrame(() => { ring.style.strokeDashoffset = C * (1 - pct / 100); });
      const out = $('#fcPct'); const t0 = performance.now(); const tick = (t) => { const k = Math.min(1, (t - t0) / 1200); out.textContent = Math.round(pct * k) + ' %'; if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
      sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }));
  };

  /* ---------- parcours ---------- */
  const journey = $('#journey'), quests = $('#quests');
  const totalHeures = () => [...st.parcours].reduce((a, id) => a + L.byId[id].heures, 0);
  ui.toggleJourney = (l) => {
    if (st.parcours.has(l.id)) { st.parcours.delete(l.id); ui.toast('Retiré du parcours', l.titre); } else {
      st.parcours.add(l.id); ui.toast('Ajouté à votre parcours', l.titre, 'xp');
      if (!st.xpJ.has(l.id)) { st.xpJ.add(l.id); st.xp += 10; }
      app().sfx && app().sfx('page');
    }
    ui.refreshHud(); ui.renderJourney(); game.check(); save();
  };
  ui.renderJourney = () => {
    const items = [...st.parcours].map((id) => L.byId[id]); const cov = coverage();
    journey.innerHTML = `
      <div class="dr-head"><h3>Mon parcours</h3><button class="bp-x" data-a="x" aria-label="Fermer">✕</button></div>
      ${items.length ? `<p class="dr-sum"><b>${items.length}</b> formation${items.length > 1 ? 's' : ''} · environ <b>${L.formatHeures(totalHeures())}</b></p>
      <ul class="j-list">${items.map((l) => `<li><i style="background:${l.dom.lueur}"></i><span><b>${esc(l.titre)}</b><small>${esc(l.dom.court)} › ${esc(l.theme.nom)} · ${esc(L.FORMATS[l.fmt].nom)} · ${esc(l.duree)}</small></span><button data-a="rm" data-id="${l.id}" aria-label="Retirer">✕</button></li>`).join('')}</ul>
      <h4>Couverture des blocs France compétences</h4>
      ${cov.map((c) => `<div class="cov"><div class="cov-t"><b>${esc(c.theme.fc.titre)}</b><small>${esc(c.theme.fc.bloc)}</small></div><div class="cov-bar"><i style="width:${c.pct}%;background:${c.dom.lueur}"></i></div><span class="cov-p">${c.pct} %</span></div>`).join('')}
      <div class="dr-actions"><button class="btn btn-primary small" data-a="copy">Copier le parcours</button><button class="btn btn-ghost small" data-a="print">Imprimer</button><button class="btn btn-ghost small" data-a="clear">Vider</button></div>`
      : '<p class="dr-empty">Votre parcours est vide. Ouvrez un livre et choisissez « Ajouter à mon parcours » : le Bibliothécaire calculera les blocs de compétences que vous couvrez.</p>'}`;
  };
  journey.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
    if (a === 'x') ui.drawer(null); else if (a === 'rm') ui.toggleJourney(L.byId[b.dataset.id]); else if (a === 'clear') { st.parcours.clear(); ui.refreshHud(); ui.renderJourney(); save(); } else if (a === 'print') window.print();
    else if (a === 'copy') {
      const txt = 'Mon parcours · Lefebvre Dalloz Compétences, catalogue 2027\n' + [...st.parcours].map((id) => { const l = L.byId[id]; return `- ${l.titre} (${L.FORMATS[l.fmt].nom}, ${l.duree}) · ${l.dom.court} › ${l.theme.nom}`; }).join('\n') + `\nDurée totale : ${L.formatHeures(totalHeures())}\n` + coverage().map((c) => `Bloc « ${c.theme.fc.bloc} » (${c.theme.fc.titre}) : ${c.pct} % couvert`).join('\n');
      const done = () => ui.toast('Parcours copié', 'Collez-le dans un mail ou un document.');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => ui.toast('Copie impossible', 'Sélectionnez la liste à la main.')); else { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (er) { /* ignoré */ } ta.remove(); }
    }
  });

  /* ---------- carnet / quêtes ---------- */
  ui.renderQuests = () => {
    const lv = level();
    quests.innerHTML = `
      <div class="dr-head"><h3>Carnet du lecteur</h3><button class="bp-x" data-a="x" aria-label="Fermer">✕</button></div>
      <div class="q-level"><span class="seal big"><i></i></span><div><b>${esc(lv.name)}</b><small>${st.xp} XP${lv.next ? ' · prochain grade à ' + lv.next + ' XP' : ' · grade maximal'}</small></div></div>
      <ul class="q-list">${QUESTS.map((q) => { const cur = Math.min(q.cur(), q.max()), mx = q.max(), ok = st.done.has(q.id); return `<li class="${ok ? 'ok' : ''}"><span class="qcheck">${ok ? '✓' : ''}</span><span class="qbody"><b>${esc(q.t)}</b><small>${esc(q.d)}</small><span class="qbar"><i style="width:${Math.round(100 * cur / mx)}%"></i></span></span><span class="qn">${cur}/${mx}</span></li>`; }).join('')}</ul>
      <div class="dr-actions"><button class="btn btn-ghost small" data-a="reset">Recommencer l'aventure</button></div>`;
  };
  quests.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'x') ui.drawer(null);
    else if (b.dataset.a === 'reset') { try { localStorage.removeItem(KEY); } catch (er) { /* ignoré */ } location.reload(); }
  });
  ui.drawer = (which) => {
    [['journey', journey], ['quests', quests]].forEach(([n, el]) => { const on = which === n; if (on) { if (n === 'journey') ui.renderJourney(); else ui.renderQuests(); el.hidden = false; requestAnimationFrame(() => el.classList.add('show')); } else { el.classList.remove('show'); setTimeout(() => { if (!el.classList.contains('show')) el.hidden = true; }, 380); } });
    ui.current = which;
  };
  $('#xpChip').addEventListener('click', () => ui.drawer(ui.current === 'quests' ? null : 'quests'));
  $('#btnQuests').addEventListener('click', () => ui.drawer(ui.current === 'quests' ? null : 'quests'));
  $('#btnJourney').addEventListener('click', () => ui.drawer(ui.current === 'journey' ? null : 'journey'));
  $('#btnFilter').addEventListener('click', () => app().openFilter && app().openFilter());
  $('#btnHelp').addEventListener('click', () => { const h = $('#help'); h.hidden = !h.hidden; });
  $('#helpClose').addEventListener('click', () => { $('#help').hidden = true; });
  $('#btnSound').addEventListener('click', () => app().toggleSound && app().toggleSound());
  $('#btnNext').addEventListener('click', () => app().nextReco && app().nextReco());

  ui.coverage = coverage; ui.level = level; ui.QUESTS = QUESTS; ui.formatTag = formatTag;
  ui.refreshHud();
})();
