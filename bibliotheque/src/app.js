/* Orchestrateur : entrée, Grande salle (poses de caméra sur rails), pièces centrales, passage vers un univers
   (transition narrative), rails de stations, points d'accès clavier, modes Exploration / Pitch guidé, repli sans WebGL.
   Les contenus viennent des modules (catalogue, rome, vision, sheet, selection, pitch) : ce fichier ne contient ni texte
   commercial ni donnée produit. */

(function () {
  'use strict';
  const L = window.LDC, S = L.S, T = L.tex, cat = L.cat, PI = Math.PI;
  const $ = L.$, $$ = L.$$, esc = L.esc, clamp = L.clamp, lerp = L.lerp, ease = L.ease, mod = L.mod;
  THREE.ColorManagement.legacyMode = false;
  const STEP = PI / 3, MONDES = cat.mondes;

  /* ---------- modules d'interface ---------- */
  L.cognitio.init(); L.transition.init(); L.vision.init(); L.sheet.init(); L.selection.init(); L.pitch.init();
  const BR = L.content('brand');
  const setBrand = (mark, text) => {
    if (BR.logo && BR.logo.disponible) { text.innerHTML = `<img src="${esc(BR.logo.svg)}" alt="${esc(BR.nom)}" style="height:2.2rem;display:block">`; mark.hidden = true; }
    else if (BR.symbole && BR.symbole.disponible) mark.innerHTML = `<img src="${esc(BR.symbole.svg)}" alt="" style="width:100%">`;
    else mark.innerHTML = L.ICON_SVG;
  };
  setBrand($('#brandMark'), $('#brandText')); setBrand($('#introMark'), $('#introText'));

  /* ---------- petits outils ---------- */
  let hintT = 0; const hinted = {};
  const hint = (txt, key) => { const h = $('#hint'); if (key && hinted[key]) return; if (key) hinted[key] = 1; clearTimeout(hintT); if (!txt) { h.classList.remove('on'); return; } h.textContent = txt; h.classList.add('on'); hintT = setTimeout(() => h.classList.remove('on'), 6500); };
  const veil = (on) => $('#veil').classList.toggle('on', on);
  const wait = (ms) => new Promise((r) => setTimeout(r, L.reduced() ? Math.min(ms, 30) : ms));
  const tw = [];
  const tween = (ms, fn) => new Promise((res) => { if (L.reduced()) ms = Math.min(ms, 60); tw.push({ t: 0, d: ms / 1000, fn, res }); });

  /* ====================================================================================== */
  /*  Repli sans WebGL : version statique simplifiée                                         */
  /* ====================================================================================== */

  const canvas = $('#gl');
  let renderer = null;
  if (!L.params.noGL) {
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
  }
  const staticMode = () => {
    canvas.hidden = true; $('#top').hidden = false; $('#intro').classList.remove('show'); $('#bottom').hidden = false; $('#dock').hidden = true;
    $('#modeExplore').hidden = true;
    const root = $('#static'); root.hidden = false;
    root.innerHTML = `<h1 id="staticTitle">Bibliothèque des compétences</h1>
      <p class="lead">Version simplifiée sans 3D : votre navigateur n'affiche pas WebGL. Toutes les fonctions de présentation restent disponibles.</p>
      <div class="chips"><button class="btn btn-primary btn-sm" type="button" data-s="vision">Découvrir notre vision</button><button class="btn btn-ghost btn-sm" type="button" data-s="pitch">Pitch guidé</button></div>
      <div class="grid">${MONDES.map((m) => `<article class="mc" style="--c:${m.accentCfg.main}"><h2>${esc(m.nom)}</h2><p class="u">${esc(m.univers)}</p><p>${esc(m.promesse)}</p><p class="note">${m.n.toLocaleString('fr-FR')} produits · ${m.stations.length} ${L.plural(m.stations.length, 'station')}</p><div class="sts">${m.stations.map((s, i) => `<button class="chip" type="button" data-m="${m.k}" data-st="${i}">${esc(s.code)} · ${esc(s.nom)}</button>`).join('')}</div></article>`).join('')}</div>`;
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.s === 'vision') L.vision.open(0); else if (b.dataset.s === 'pitch') { L.pitch.open(1); setModeUI('pitch'); }
      else if (b.dataset.m) { const st = MONDES[+b.dataset.m].stations[+b.dataset.st]; L.cognitio.setImage(L.cognitio.imageFor(MONDES[+b.dataset.m], st)); L.sheet.openStation(st); }
    });
    L.vision.onCta = (c) => { if (c.cible === 'pitch') { L.vision.close(); L.pitch.open(1); setModeUI('pitch'); } else if (c.cible === 'etape:vision') L.vision.go(1); else { L.vision.close(); const m = c.cible.startsWith('monde:') ? cat.mondeById[c.cible.slice(6)] : null; if (m) L.sheet.openStation(m.stations[0]); } };
    L.pitch.hooks.quit = () => { L.pitch.close(); setModeUI('explore'); };
    L.pitch.hooks.code = () => L.vision.open(0);
    L.pitch.hooks.enter = (id) => L.sheet.openStation(cat.mondeById[id].stations[0]);
    L.pitch.hooks.station = (id, i) => L.sheet.openStation(cat.mondeById[id].stations[i]);
    $('#crumbs').innerHTML = '<span class="crumb cur">Version simplifiée</span>';
    L.cognitio.say('hall.accueil');
    $('#modePitch').addEventListener('click', () => { if (L.pitch.isOpen()) { L.pitch.close(); setModeUI('explore'); } else { L.pitch.open(1); setModeUI('pitch'); } });
  };
  const setModeUI = (m) => { $('#modeExplore').setAttribute('aria-pressed', m === 'explore'); $('#modePitch').setAttribute('aria-pressed', m === 'pitch'); };
  L.pitch.onMode = (on) => setModeUI(on ? 'pitch' : 'explore');
  if (!renderer) { staticMode(); L.debug = L.params.debug ? { static: true } : undefined; return; }

  /* ====================================================================================== */
  /*  Rendu                                                                                  */
  /* ====================================================================================== */

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = false;
  T.aniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#3B1A16'); scene.environment = S.makeEnv(renderer);
  const camera = new THREE.PerspectiveCamera(48, 1, .1, 120); camera.rotation.order = 'YXZ'; scene.add(camera);
  const dimPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#2A0A08', transparent: true, opacity: 0, depthWrite: false })); dimPlane.position.z = -4.5; dimPlane.visible = false; camera.add(dimPlane);

  let hall = null, world = null, cur = null;
  let view = 'boot', busy = false, time = 0, camOverride = null, hallMode = 'home', piece = null, curK = 0;
  let lastPose = { x: 0, y: 2.4, z: 7, yaw: 0, pitch: 0 }, retPose = null, retMode = 'home';
  const H = { a: 0, tgt: 0 }, X = { x: 0, tgt: 0 }, par = { x: 0, y: 0, tx: 0, ty: 0 };
  const portrait = () => camera.aspect < .9;
  const hallIdx = () => mod(Math.round((S.DOOR0 - H.tgt) / STEP), 6);
  const angFor = (k) => { const b = S.doorPhi(k); return b + Math.round((H.tgt - b) / (PI * 2)) * PI * 2; };
  const angDiff = (a, b) => ((b - a + PI * 3) % (PI * 2)) - PI;
  const railIdx = () => { let b = 0; world.P.forEach((x, i) => { if (Math.abs(x - X.tgt) < Math.abs(world.P[b] - X.tgt)) b = i; }); return b; };

  /* ---------- poses de caméra ---------- */
  const HOME = () => (portrait() ? { x: 0, y: 2.6, z: 9.6, yaw: 0, pitch: -.02 } : { x: 0, y: 2.3, z: 7.0, yaw: 0, pitch: -.04 });
  const orbitPose = (t) => { const a = t * .08 + 2.6; return { x: 6.6 * Math.sin(a), y: 2.4, z: 6.6 * Math.cos(a), yaw: a, pitch: -.03 }; };
  /* Porte vue du même côté de la salle, de biais : les pièces centrales restent derrière la caméra. */
  const doorPose = (a) => { const ang = a + .5, x = 6.6 * Math.sin(ang), z = 6.6 * Math.cos(ang), y = 2.4, dx = S.HR * Math.sin(a) - x, dz = S.HR * Math.cos(a) - z; return { x, y, z, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(3.0 - y, Math.hypot(dx, dz)) }; };
  const lerpPose = (a, b, e) => ({ x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e), yaw: a.yaw + angDiff(a.yaw, b.yaw) * e, pitch: lerp(a.pitch, b.pitch, e) });
  /* Trajet en arc de cercle autour des pièces centrales (jamais à travers). */
  const orbitLerp = (a, b, e) => { const ra = Math.hypot(a.x, a.z), rb = Math.hypot(b.x, b.z), ta = Math.atan2(a.x, a.z), tb = ta + angDiff(ta, Math.atan2(b.x, b.z)), r = lerp(ra, rb, e), t = lerp(ta, tb, e); return { x: r * Math.sin(t), y: lerp(a.y, b.y, e), z: r * Math.cos(t), yaw: a.yaw + angDiff(a.yaw, b.yaw) * e, pitch: lerp(a.pitch, b.pitch, e) }; };
  const piecePose = (B, big) => {
    const cp = lastPose; let dx = cp.x - B.x, dz = cp.z - B.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const narrow = innerWidth < 900, d = (portrait() ? 5.6 : 3.6) + (big ? 1.2 : 0), P = { x: B.x + dx * d, y: B.y - .1, z: B.z + dz * d }, sh = narrow ? 0 : 1.1;
    const A = { x: B.x + dz * sh, y: B.y + (narrow ? -1.0 : 0), z: B.z - dx * sh }, ddx = A.x - P.x, ddz = A.z - P.z;
    return { x: P.x, y: P.y, z: P.z, yaw: Math.atan2(-ddx, -ddz), pitch: Math.atan2(A.y - P.y, Math.hypot(ddx, ddz)) };
  };
  const camDist = () => (portrait() ? 9.2 : 6.6);
  const baseFov = () => (portrait() ? (cur && cur.kind === 'hall' ? 72 : 66) : 48);
  const placeCamera = () => {
    let p;
    if (camOverride) p = camOverride;
    else if (cur.kind === 'hall') p = view === 'intro' ? (L.reduced() ? HOME() : orbitPose(time)) : hallMode === 'home' ? HOME() : doorPose(H.a);
    else { const b = L.clamp01(X.x / S.WORLD_SP), a = ease(b); p = { x: X.x, y: lerp(2.9, 1.5, a), z: S.WORLD_Z0 + camDist() + lerp(portrait() ? 3.2 : 2.6, 0, a), yaw: 0, pitch: lerp(-.28, .04, a) }; }
    lastPose = p; const k = L.reduced() ? 0 : 1;
    camera.position.set(p.x, p.y, p.z); camera.rotation.set(p.pitch - par.y * .02 * k, p.yaw - par.x * .03 * k, 0);
  };

  /* ====================================================================================== */
  /*  Lieux : fil d'Ariane, carte du lieu (dock), points d'accès                              */
  /* ====================================================================================== */

  const crumbs = () => {
    const el = $('#crumbs'), parts = [];
    if (view === 'world' || (view === 'trans' && world && cur === world)) { const m = world.monde, i = railIdx(); parts.push({ t: 'Grande salle', fn: leaveWorld }); if (i === 0) parts.push({ t: m.nom, cur: true }); else parts.push({ t: m.nom, fn: () => goRail(0) }, { t: world.stations[i - 1].st.nom, cur: true }); }
    else if (piece) parts.push({ t: 'Grande salle', fn: () => returnFromPiece() }, { t: piece === 'code' ? 'Le premier Code civil' : 'Le Grand Livre du Chiffre', cur: true });
    else if (hallMode === 'doors') parts.push({ t: 'Grande salle', fn: () => hallTo('home') }, { t: MONDES[hallIdx()].nom, cur: true });
    else parts.push({ t: 'Grande salle', cur: true });
    el.innerHTML = ''; parts.forEach((p, i) => { if (i) { const s = document.createElement('span'); s.className = 'sep'; s.setAttribute('aria-hidden', 'true'); s.textContent = '›'; el.appendChild(s); } const b = document.createElement(p.fn ? 'button' : 'span'); if (p.fn) b.type = 'button'; b.className = 'crumb' + (p.cur ? ' cur' : '') + (p.fn ? ' lk' : ''); if (p.cur) b.setAttribute('aria-current', 'page'); b.textContent = p.t; if (p.fn) b.addEventListener('click', p.fn); el.appendChild(b); });
  };

  const dock = $('#dock'), railEl = $('#rail');
  const dockKey = () => [view, hallMode, piece, view === 'hall' ? hallIdx() : '', world ? railIdx() : '', L.selection.count()].join('|');
  let lastDock = '';
  const renderDock = () => {
    lastDock = dockKey(); const acts = (h) => `<div class="acts">${h}</div>`; railEl.hidden = true;
    const btn = (a, label, cls = 'btn-ghost') => `<button class="btn ${cls}" type="button" data-d="${a}">${label}</button>`;
    let h = '';
    if (piece === 'chiffre') {
      const c = L.content('vision-offre').chiffre || {};
      h = `<p class="kicker">Installation · ${esc(c.sousTitre || '')}</p><h2>${esc(c.designation || 'Le Grand Livre du Chiffre')}</h2><p class="meta">${esc(c.legende || '')} ${L.tagAV('intitulé provisoire')}</p>${acts(btn('chiffre', 'Découvrir l\'offre Chiffre', 'btn-primary') + btn('back', '← Retour à la salle'))}`;
    } else if (piece) {
      h = '';
    } else if (view === 'hall' && hallMode === 'home') {
      h = `<p class="kicker">Grande salle</p><h2>Droit, édition, chiffre</h2><p class="meta">Au centre : le premier Code civil et le Grand Livre du Chiffre. Six portes ouvrent six univers.</p>${acts(btn('vision', 'Découvrir notre vision', 'btn-primary') + btn('doors', 'Explorer les univers →'))}`;
    } else if (view === 'hall' && hallMode === 'doors') {
      const k = hallIdx(), m = MONDES[k];
      h = `<div class="dots" role="group" aria-label="Les six univers">${MONDES.map((x, i) => `<button type="button" data-d="door" data-k="${i}" style="--c:${x.accentCfg.main}" aria-label="${esc(x.nom)}" ${i === k ? 'aria-current="true"' : ''}></button>`).join('')}</div>
        <p class="kicker">Univers ${String(m.ordre).padStart(2, '0')} · ${esc(m.univers)}</p><h2>${esc(m.nom)}</h2><p class="meta">${esc(m.promesse)} ${m.n.toLocaleString('fr-FR')} produits · ${m.stations.length} ${L.plural(m.stations.length, 'station')}.</p>${acts(btn('enter', 'Entrer dans l\'univers', 'btn-primary') + btn('home', '← Les deux pièces centrales'))}`;
    } else if (view === 'world' && world) {
      const m = world.monde, i = railIdx(), st = i ? world.stations[i - 1].st : null;
      railEl.innerHTML = `<button class="st" type="button" data-d="rail" data-i="0" ${i === 0 ? 'aria-current="true"' : ''}><i>↩</i>Accueil</button>${world.stations.map((s, j) => `<button class="st" type="button" data-d="rail" data-i="${j + 1}" ${i === j + 1 ? 'aria-current="true"' : ''}><i>${esc(s.st.code)}</i>${esc(s.st.nom)}</button>`).join('')}`; railEl.hidden = false;
      h = i === 0
        ? `<p class="kicker">Univers ${String(m.ordre).padStart(2, '0')} · ${esc(m.univers)}</p><h2>${esc(m.nom)}</h2><p class="meta">${esc(m.promesse)}</p>${acts(btn('rail+', 'Explorer les stations →', 'btn-primary') + btn('leave', '← Grande salle'))}`
        : `<p class="kicker">${esc(st.code)} · ${esc(m.nom)}</p><h2>${esc(st.nom)}</h2><p class="meta">${st.n} ${L.plural(st.n, 'produit')} au catalogue${st.nBest ? ` · ${st.nBest} marqué${st.nBest > 1 ? 's' : ''} BEST` : ''}. Vitrine : ${st.vitrine.length} ${L.plural(st.vitrine.length, 'produit')}.</p>${acts(btn('list', `Voir les ${st.n} produits`, 'btn-primary') + btn('leave', '← Grande salle'))}`;
    }
    const af = document.activeElement && dock.contains(document.activeElement) ? document.activeElement : null, fk = af ? `[data-d="${af.dataset.d}"]${af.dataset.i != null ? `[data-i="${af.dataset.i}"]` : ''}${af.dataset.k != null ? `[data-k="${af.dataset.k}"]` : ''}` : null;
    dock.innerHTML = h; dock.hidden = !h || view === 'trans' || view === 'intro';
    if (fk) { const nf = $(fk, dock); if (nf) nf.focus({ preventScroll: true }); }
    const on = $('[aria-current]', railEl); if (on && !railEl.hidden) railEl.scrollTo({ left: on.offsetLeft - railEl.clientWidth / 2 + on.offsetWidth / 2, behavior: L.reduced() ? 'auto' : 'smooth' });
  };
  const dockClick = (e) => {
    const b = e.target.closest('[data-d]'); if (!b) return; const a = b.dataset.d;
    if (a === 'vision') openPiece('code'); else if (a === 'doors') hallTo('doors', hallIdx(), false);
    else if (a === 'door') goHall(+b.dataset.k); else if (a === 'enter') enterWorld(hallIdx()); else if (a === 'home') hallTo('home');
    else if (a === 'chiffre') returnFromPiece(() => hallTo('doors', 1, false, () => enterWorld(1)));
    else if (a === 'back') returnFromPiece(); else if (a === 'rail') goRail(+b.dataset.i); else if (a === 'rail+') goRail(1);
    else if (a === 'leave') leaveWorld(); else if (a === 'list') L.sheet.openStation(world.stations[railIdx() - 1].st);
  };
  dock.addEventListener('click', dockClick); railEl.addEventListener('click', dockClick);

  /* ---------- points d'accès clavier sur la scène ---------- */
  const hsBox = $('#hotspots'); let HS = [];
  const hsClear = () => { hsBox.innerHTML = ''; HS = []; };
  const hsAdd = (o) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hs ' + (o.cls || ''); b.setAttribute('aria-label', o.label); b.innerHTML = `<span class="cap">${esc(o.cap || o.label)}</span>`;
    b.addEventListener('click', () => { if (!busy || o.always) o.act(); }); b.addEventListener('mouseenter', () => { hoverCard = o.card || null; }); b.addEventListener('mouseleave', () => { hoverCard = null; });
    hsBox.appendChild(b); HS.push({ el: b, o }); return b;
  };
  let hoverCard = null;
  const hsBuild = () => {
    hsClear(); if (view === 'intro' || view === 'trans' || view === 'boot') return;
    if (view === 'hall' && !piece) {
      hsAdd({ cls: 'hall lbl cap-top', label: 'Le premier Code civil : découvrir notre vision', cap: 'Le premier Code civil · Droit, Édition', pts: () => boxPts(new THREE.Vector3(S.CODE_X, 0, 0), 1.35, 0, 3.3), act: () => openPiece('code'), show: () => hallMode === 'home' });
      hsAdd({ cls: 'hall lbl cap-top', label: 'Le Grand Livre du Chiffre : la table des décisions', cap: 'Le Grand Livre du Chiffre', pts: () => boxPts(new THREE.Vector3(S.CHIFFRE_X, 0, 0), 1.35, 0, 3.5), act: () => openPiece('chiffre'), show: () => hallMode === 'home' });
      MONDES.forEach((m, k) => hsAdd({ cls: 'hall', label: `Univers ${m.ordre} : ${m.nom}, ${m.univers}`, cap: m.nom, pts: () => doorPts(k), act: () => (hallMode === 'doors' && hallIdx() === k ? enterWorld(k) : goHall(k)), show: () => hallMode === 'doors' }));
    } else if (view === 'world' && world) {
      const i = railIdx(); if (!i) return; const r = world.stations[i - 1];
      hsAdd({ cls: 'hall', label: `Voir les ${r.st.n} produits : ${r.st.nom}`, cap: `${r.st.code} · ${r.st.nom}`, pts: () => objPts(r.group, 1.8, 3.45, 1.125, .08), act: () => L.sheet.openStation(r.st) });
      r.cards.forEach((c) => hsAdd({ cls: 'cap-top', label: `Ouvrir la fiche : ${c.p.t}, ${c.p.f || ''}, ${cat.duree(c.p)}`, cap: c.p.t, card: c, pts: () => objPts(c.group, .475, 0, .65, .05), act: () => L.sheet.openProduct(c.p, { back: false }) }));
    }
  };
  const V = new THREE.Vector3();
  const boxPts = (c, hw, y0, y1) => [[-hw, y0], [hw, y0], [-hw, y1], [hw, y1]].map(([dx, y]) => new THREE.Vector3(c.x + dx, y, c.z));
  const doorPts = (k) => { const d = hall.doors[k]; return [[-1.6, 0], [1.6, 0], [-1.6, 4.9], [1.6, 4.9]].map(([x, y]) => d.group.localToWorld(new THREE.Vector3(x, y, .6))); };
  const objPts = (g, hw, cy, hh, z) => { g.updateWorldMatrix(true, false); return [[-hw, cy - hh], [hw, cy - hh], [-hw, cy + hh], [hw, cy + hh]].map(([x, y]) => g.localToWorld(new THREE.Vector3(x, y, z))); };
  const hsUpdate = () => {
    camera.updateMatrixWorld(); const w = innerWidth, h = innerHeight;
    HS.forEach(({ el, o }) => {
      let ok = (!o.show || o.show()) && !busy; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      if (ok) {
        o.pts().forEach((p) => { V.copy(p).project(camera); if (V.z > 1 || V.z < -1) ok = false; x0 = Math.min(x0, V.x); x1 = Math.max(x1, V.x); y0 = Math.min(y0, V.y); y1 = Math.max(y1, V.y); });
        if (ok && (x1 < -1 || x0 > 1 || y1 < -1 || y0 > 1)) ok = false;
      }
      if (!ok) { el.hidden = true; return; }
      el.hidden = false; const X0 = (x0 * .5 + .5) * w, Y0 = (-y1 * .5 + .5) * h, W = (x1 - x0) * .5 * w, Hh = (y1 - y0) * .5 * h;
      el.style.transform = `translate(${X0}px,${Y0}px)`; el.style.width = W + 'px'; el.style.height = Hh + 'px';
    });
  };

  /* ====================================================================================== */
  /*  Grande salle                                                                           */
  /* ====================================================================================== */

  const hallTo = (mode, k, force, cb) => {
    if (!force && (busy || view !== 'hall')) return;
    const from = { ...lastPose }; let to; if (mode === 'home') to = HOME(); else { H.tgt = angFor(k); to = doorPose(H.tgt); }
    busy = true; hallMode = mode; refreshUI();
    if (mode === 'doors') { L.cognitio.say(hinted.doors ? 'hall.porte' : 'hall.portes', { univers: MONDES[k].univers, promesse: MONDES[k].promesse }); hinted.doors = 1; }
    return tween(1400, (t) => { camOverride = orbitLerp(from, to, ease(t)); }).then(() => { camOverride = null; if (mode === 'doors') H.a = H.tgt; busy = false; refreshUI(); cb && cb(); });
  };
  const goHall = (k) => { if (busy || view !== 'hall') return; if (hallMode === 'home') hallTo('doors', mod(k, 6)); else { H.tgt = angFor(mod(k, 6)); L.cognitio.say('hall.porte', { univers: MONDES[mod(k, 6)].univers, promesse: MONDES[mod(k, 6)].promesse }); } };
  const stepHall = (dir) => { if (busy || view !== 'hall' || piece) return; if (hallMode === 'home') return hallTo('doors', dir > 0 ? 0 : 5); const k = hallIdx() + dir; if (k < 0 || k > 5) hallTo('home'); else goHall(k); };

  const refreshUI = () => {
    const hallOn = view === 'hall' || view === 'code', worldOn = view === 'world';
    $('#top').hidden = view === 'intro' || view === 'boot'; $('#bottom').hidden = view === 'intro' || view === 'boot' || view === 'trans';
    $('#navPrev').hidden = $('#navNext').hidden = !((view === 'hall' && !piece) || worldOn);
    crumbs(); renderDock(); hsBuild();
  };

  /* ---------- pièces centrales : Code civil (vision) et Grand Livre du Chiffre ---------- */
  const openPiece = (which) => {
    if (busy || view !== 'hall') return; piece = which; retPose = { ...lastPose }; retMode = hallMode; busy = true; hint('');
    const B = which === 'code' ? hall.codeCenter : hall.chiffreCenter, from = { ...lastPose }, to = piecePose(B, which === 'chiffre'); dimPlane.visible = true; refreshUI();
    tween(1200, (t) => { camOverride = lerpPose(from, to, ease(t)); dimPlane.material.opacity = .32 * ease(t); }).then(() => {
      busy = false; refreshUI();
      if (which === 'code') L.vision.open(0); else L.cognitio.say('hall.chiffre');
    });
  };
  const returnFromPiece = (cb) => {
    if (!piece || busy) return; busy = true; const from = { ...lastPose }, to = retPose || HOME(); if (L.vision.isOpen()) { L.vision.onClose = null; L.vision.close(); }
    tween(1000, (t) => { camOverride = lerpPose(from, to, ease(t)); dimPlane.material.opacity = .32 * (1 - ease(t)); }).then(() => { camOverride = null; dimPlane.visible = false; piece = null; view = 'hall'; hallMode = retMode; busy = false; refreshUI(); L.vision.onClose = visionClosed; cb && cb(); });
  };
  const visionClosed = () => { if (piece === 'code' && !busy) returnFromPiece(); };
  L.vision.onClose = visionClosed;
  L.vision.onCta = (c) => {
    const t = c.cible;
    if (t === 'etape:vision') return L.vision.go(1);
    if (t === 'pitch') return returnFromPiece(() => startPitch());
    if (t === 'salle') return returnFromPiece(() => hallTo('doors', 0));
    if (t.startsWith('monde:')) { const k = cat.mondeById[t.slice(6)].k; return returnFromPiece(() => hallTo('doors', k, false, () => enterWorld(k))); }
  };

  /* ====================================================================================== */
  /*  Passage vers un univers, rails de stations, retour                                      */
  /* ====================================================================================== */

  const buildWorld = (monde) => {
    if (world) { scene.remove(world.group); S.disposeGroup(world.group); T.disposeOwned(); }
    world = S.buildWorld(monde); world.group.visible = false; scene.add(world.group); world.syncSelection(L.selection.has);
  };

  const enterWorld = async (k, stationIdx = 0) => {
    if (busy || view !== 'hall' || piece) return;
    if (hallMode !== 'doors' || hallIdx() !== k) await hallTo('doors', k);   // on rejoint d'abord la porte par l'arc de cercle
    if (busy || view !== 'hall') return;
    const mo = MONDES[k]; busy = true; view = 'trans'; curK = k; hsClear(); L.panels.stack.slice().forEach((p) => { if (p.id !== 'pitch') L.panels.close(p, true); }); $('#bottom').hidden = true; hint('');
    const door = hall.doors[k]; door.target = 1; const from = { ...lastPose }, x1 = (S.HR - 1.3) * Math.sin(door.phi), z1 = (S.HR - 1.3) * Math.cos(door.phi), yawEnd = door.phi + PI;
    await tween(1100, (t) => { const e = ease(t); camOverride = { x: lerp(from.x, x1, e), y: lerp(from.y, 1.75, e), z: lerp(from.z, z1, e), yaw: from.yaw + angDiff(from.yaw, yawEnd) * e, pitch: lerp(from.pitch, .03, e) }; });
    await L.transition.run(mo, null, () => buildWorld(mo));
    hall.group.visible = false; world.group.visible = true; cur = world; camOverride = null; camera.fov = baseFov(); camera.updateProjectionMatrix();
    const i0 = stationIdx ? stationIdx : 0; X.tgt = world.P[i0]; X.x = X.tgt - (L.reduced() ? 0 : 2.6); world.focus(X.x); world.ensure(X.x); par.x = par.y = 0;
    L.cognitio.setImage(L.cognitio.imageFor(mo, i0 ? world.stations[i0 - 1].st : null));
    view = 'world'; hallMode = 'doors'; $('#bottom').hidden = false; refreshUI();
    await L.transition.hide(); busy = false;
    L.cognitio.say('monde.arrivee', { univers: mo.univers, promesse: mo.promesse });
    hint('Faites glisser ou utilisez ‹ › pour passer d\'une station à l\'autre · cliquez un produit pour ouvrir sa fiche', 'world');
  };

  const goRail = (i) => {
    if (busy || view !== 'world') return; const n = world.stations.length; i = clamp(i, 0, n); X.tgt = world.P[i];
    L.cognitio.setImage(L.cognitio.imageFor(world.monde, i ? world.stations[i - 1].st : null));
    if (i) L.cognitio.say('monde.station', { domaine: world.stations[i - 1].st.nom, n: world.stations[i - 1].st.n });
    refreshUI();
  };

  const leaveWorld = async () => {
    if (busy || view !== 'world') return; busy = true; hsClear(); veil(true); await wait(450);
    L.sheet.close(); scene.remove(world.group); S.disposeGroup(world.group); T.disposeOwned(); world = null;
    hall.group.visible = true; cur = hall; camera.fov = baseFov(); camera.updateProjectionMatrix(); H.tgt = H.a = angFor(curK); const d = hall.doors[curK]; d.state = d.target = .16; d.apply();
    hall.doors.forEach((x, i) => { if (i !== curK) { x.state = x.target = 0; x.apply(); } });
    view = 'hall'; hallMode = 'doors'; L.cognitio.setImage('assets/cognitio/cognitio-neutre.webp'); refreshUI(); veil(false); await wait(450); busy = false;
    L.cognitio.say('hall.porte', { univers: MONDES[curK].univers, promesse: MONDES[curK].promesse });
  };

  /* ====================================================================================== */
  /*  Entrée, modes Exploration / Pitch guidé                                                 */
  /* ====================================================================================== */

  const startExplore = () => {
    $('#intro').classList.remove('show'); view = 'hall'; hallMode = 'home'; L.state.seenIntro = true; L.persist();
    refreshUI(); L.cognitio.say('hall.accueil'); hint('Cliquez le Code civil ou le Grand Livre du Chiffre · ‹ › pour parcourir les six portes', 'hall');
    const f = $('#dock .btn-primary'); if (f) f.focus({ preventScroll: true });
  };
  const startPitch = () => { if (view === 'intro') startExplore(); setModeUI('pitch'); L.pitch.open(1); };
  $('#goExplore').addEventListener('click', startExplore);
  $('#goPitch').addEventListener('click', startPitch);
  $('#modeExplore').addEventListener('click', () => { L.pitch.close(); setModeUI('explore'); });
  $('#modePitch').addEventListener('click', () => { if (!L.pitch.isOpen()) startPitch(); });

  const toHallThen = (fn) => {
    if (view === 'world') { leaveWorld().then(() => fn()); return; }
    if (piece) return returnFromPiece(fn); fn();
  };
  L.pitch.hooks.quit = () => { L.pitch.close(); setModeUI('explore'); };
  L.pitch.hooks.code = () => toHallThen(() => { if (hallMode === 'home') openPiece('code'); else hallTo('home', 0, false, () => openPiece('code')); });
  L.pitch.hooks.enter = (id) => { const k = cat.mondeById[id].k; if (view === 'world' && world.monde.id === id) return goRail(0); toHallThen(() => { if (hallMode === 'home') hallTo('doors', k, false, () => enterWorld(k)); else { H.tgt = angFor(k); enterWorld(k); } }); };
  L.pitch.hooks.station = (id, i) => { const k = cat.mondeById[id].k; if (view === 'world' && world.monde.id === id) return goRail(i + 1); toHallThen(() => { const go = () => enterWorld(k, i + 1); if (hallMode === 'home') hallTo('doors', k, false, go); else { H.tgt = angFor(k); go(); } }); };

  /* ====================================================================================== */
  /*  Pointeur, clavier                                                                      */
  /* ====================================================================================== */

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const ptr = { down: false, moved: false, x: 0, y: 0, sx: 0, sy: 0, t: 0, v: 0, tot: 0 };
  const pick = (x, y) => { ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); const hits = ray.intersectObjects(cur.pickables, false); return hits.length ? hits[0].object.userData.pick : null; };
  const railOk = () => !busy && !camOverride && !piece && (view === 'hall' || view === 'world') && !L.transition.active;
  canvas.addEventListener('pointerdown', (e) => { ptr.down = true; ptr.moved = false; ptr.sx = ptr.x = e.clientX; ptr.sy = e.clientY; ptr.t = performance.now(); ptr.v = 0; ptr.tot = 0; try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* ignoré */ } });
  canvas.addEventListener('pointermove', (e) => {
    par.tx = e.clientX / innerWidth * 2 - 1; par.ty = e.clientY / innerHeight * 2 - 1;
    if (ptr.down) {
      const dx = e.clientX - ptr.x, now = performance.now(), dt = Math.max(8, now - ptr.t) / 1000; ptr.x = e.clientX; ptr.t = now; ptr.tot += dx;
      if (!ptr.moved && Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 6) { ptr.moved = true; canvas.classList.add('drag'); }
      if (ptr.moved && railOk()) {
        if (view === 'hall') { if (hallMode === 'doors') { const d = dx * .0017; H.tgt += d; ptr.v = .7 * ptr.v + .3 * d / dt; } }
        else { const d = -dx * (2 * camDist() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect) / innerWidth; X.tgt = clamp(X.tgt + d, world.P[0] - 1.5, world.P[world.P.length - 1] + 1.5); ptr.v = .7 * ptr.v + .3 * d / dt; }
      }
    } else updateHover(e.clientX, e.clientY);
  });
  const release = () => {
    canvas.classList.remove('drag'); if (!ptr.down) return; ptr.down = false;
    if (!ptr.moved || !railOk()) return;
    if (view === 'hall') { if (hallMode === 'doors') { H.tgt = Math.round((H.tgt + clamp(ptr.v, -4, 4) * .22 - S.DOOR0) / STEP) * STEP + S.DOOR0; refreshUI(); } else if (Math.abs(ptr.tot) > 70) stepHall(ptr.tot < 0 ? 1 : -1); }
    else { let b = 0; const tx = X.tgt + clamp(ptr.v, -30, 30) * .2; world.P.forEach((x, i) => { if (Math.abs(x - tx) < Math.abs(world.P[b] - tx)) b = i; }); goRail(b); }
  };
  canvas.addEventListener('pointerup', (e) => { const click = ptr.down && !ptr.moved; release(); if (click) onClick(e.clientX, e.clientY); });
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { par.tx = par.ty = 0; hoverCard = null; });
  let wheelLock = false;
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); if (!railOk() || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 8 || wheelLock) return; const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; wheelLock = true; setTimeout(() => { wheelLock = false; }, 450); if (view === 'hall') stepHall(d > 0 ? 1 : -1); else goRail(railIdx() + (d > 0 ? 1 : -1)); }, { passive: false });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const updateHover = (x, y) => {
    if (!railOk() || !cur) { canvas.classList.remove('hot'); hoverCard = null; return; }
    const p = pick(x, y); hoverCard = null;
    if (p && p.kind === 'product' && world) { const r = world.stations[railIdx() - 1]; if (r) hoverCard = r.cards.find((c) => c.p === p.p) || null; }
    canvas.classList.toggle('hot', !!p && ['door', 'code', 'chiffre', 'product', 'station'].includes(p.kind));
  };
  const onClick = (x, y) => {
    if (piece) { if (!busy && piece) { /* clic dans le décor : on reste sur la pièce */ } return; }
    if (!railOk()) return; const p = pick(x, y); if (!p) return;
    if (p.kind === 'door') { if (hallMode === 'doors' && p.k === hallIdx()) enterWorld(p.k); else goHall(p.k); }
    else if (p.kind === 'code') openPiece('code'); else if (p.kind === 'chiffre') openPiece('chiffre');
    else if (p.kind === 'station') { const i = world.stations.findIndex((s) => s.st === p.st) + 1; if (i === railIdx()) L.sheet.openStation(p.st); else goRail(i); }
    else if (p.kind === 'product') { const i = world.stations.findIndex((s) => s.st === p.st) + 1; if (i === railIdx()) L.sheet.openProduct(p.p, { back: false }); else goRail(i); }
  };

  $('#navPrev').addEventListener('click', () => (view === 'hall' ? stepHall(-1) : goRail(railIdx() - 1)));
  $('#navNext').addEventListener('click', () => (view === 'hall' ? stepHall(1) : goRail(railIdx() + 1)));

  addEventListener('keydown', (e) => {
    const tag = (e.target || {}).tagName;
    if (e.key === 'Escape') return escape(e);
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || e.target.closest('[role=tablist],.panel')) return;
    if (e.key === 'ArrowLeft') { if (railOk()) (view === 'hall' ? stepHall(-1) : goRail(railIdx() - 1)); }
    else if (e.key === 'ArrowRight') { if (railOk()) (view === 'hall' ? stepHall(1) : goRail(railIdx() + 1)); }
  });
  const escape = (e) => {
    if (L.transition.active) return L.transition.skip();
    const top = L.panels.top();
    if (top && top.id !== 'pitch') { if (top.id === 'vision') L.vision.close(); else if (top.id === 'sheet') L.sheet.close(); else if (top.id === 'selection') L.selection.close(); return; }
    if (view === 'intro') return;
    if (piece) return returnFromPiece();
    if (view === 'world') return leaveWorld();
    if (view === 'hall' && hallMode === 'doors') hallTo('home');
  };
  $('#intro').addEventListener('keydown', (e) => { if (e.key === 'Escape') e.stopPropagation(); });

  /* ====================================================================================== */
  /*  Boucle                                                                                 */
  /* ====================================================================================== */

  const resize = () => { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = baseFov(); camera.updateProjectionMatrix(); const ph = 2 * 4.5 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.2; dimPlane.scale.set(ph * camera.aspect, ph, 1); if (view !== 'boot') { lastDock = ''; } };
  addEventListener('resize', resize);

  let last = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000) * (L.params.fast || 1); last = now; time += dt; const red = L.reduced();
    par.x += (par.tx - par.x) * Math.min(1, dt * 3); par.y += (par.ty - par.y) * Math.min(1, dt * 3);
    if (cur.kind === 'hall') { if (hallMode === 'doors' && view !== 'intro') H.a += (H.tgt - H.a) * (1 - Math.exp(-dt * 6.5)); }
    else { X.x += (X.tgt - X.x) * (1 - Math.exp(-dt * 6.5)); cur.focus(X.x); cur.ensure(X.x); }
    for (let i = tw.length - 1; i >= 0; i--) { const q = tw[i]; q.t += dt; const k = L.clamp01(q.t / q.d); q.fn(k); if (k >= 1) { tw.splice(i, 1); q.res(); } }
    placeCamera(); if (cur.kind === 'hall') cur.camPos.copy(camera.position); cur.update(dt, time, red);
    if (cur.kind === 'world') cur.stations.forEach((r) => r.cards.forEach((c) => { const hv = hoverCard === c ? 1 : 0; c.hv += (hv - c.hv) * Math.min(1, dt * 10); c.group.position.y = c.home.y + c.hv * .05; c.group.scale.setScalar(1 + c.hv * .04); }));
    if (view !== 'intro' && view !== 'boot' && dockKey() !== lastDock && !busy) refreshUI();
    renderer.render(scene, camera);
    if (view !== 'intro') hsUpdate();
  };

  /* ====================================================================================== */
  /*  Démarrage                                                                              */
  /* ====================================================================================== */

  const fonts = () => { if (!document.fonts || !document.fonts.load) return Promise.resolve(); return Promise.race([Promise.all(['500 24px "IBM Plex Serif"', 'italic 400 24px "IBM Plex Serif"', '400 24px "IBM Plex Sans"', '500 24px "IBM Plex Mono"'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]); };
  const boot = () => {
    hall = S.buildHall(MONDES); scene.add(hall.group); cur = hall; H.a = H.tgt = S.doorPhi(0); resize(); view = 'intro';
    $('#intro').classList.add('show'); $('#goExplore').focus({ preventScroll: true });
    L.onChange(() => { if (world) world.syncSelection(L.selection.has); });
    requestAnimationFrame((t) => { last = t; frame(t); });
    const go = L.params.debug && new URLSearchParams(location.search).get('go');
    if (go === 'explore') startExplore(); else if (go === 'pitch') startPitch();
    document.documentElement.dataset.ready = '1';
  };
  fonts().then(boot);

  if (L.params.debug) L.debug = { L, S, scene, camera, renderer, view: () => view, busy: () => busy, hall: () => hall, world: () => world, X, H, hallTo, openPiece, returnFromPiece, enterWorld, leaveWorld, goRail, goHall, startExplore, startPitch, hallMode: () => hallMode, piece: () => piece, lastPose: () => lastPose, railIdx: () => railIdx() };
})();
