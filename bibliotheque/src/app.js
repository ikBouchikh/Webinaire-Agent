/* Application : navigation guidée (glisser, flèches, clics), entrée / filtre, transitions porte → rayon,
   ouverture d'un livre, fiche produit et passerelle France compétences, parcours. */

(function () {
  'use strict';
  const L = window.LDC, S = L.S, T = L.tex, PI = Math.PI;
  THREE.ColorManagement.legacyMode = false;

  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), clamp01 = (v) => clamp(v, 0, 1), lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const mod = (a, n) => ((a % n) + n) % n;
  const STEP = PI / 3;

  /* ---------- état du lecteur ---------- */
  const KEY = 'ldc-bibliotheque-v2', ALL = L.DOMAINES.map((d) => d.id);
  const st = L.state = { sel: new Set(ALL), persona: null, reco: new Set(), recoQ: '', parcours: new Set(), matched: new Set() };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw) {
      st.persona = raw.persona || null;
      if (Array.isArray(raw.sel) && raw.sel.length) st.sel = new Set(raw.sel.filter((x) => ALL.includes(x)));
      st.parcours = new Set((raw.parcours || []).filter((id) => L.byId[id])); st.matched = new Set((raw.matched || []).filter((id) => L.byId[id]));
    }
  } catch (e) { /* stockage indisponible */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ sel: [...st.sel], persona: st.persona, parcours: [...st.parcours], matched: [...st.matched] })); } catch (e) { /* ignoré */ } };

  /* ---------- rendu ---------- */
  const canvas = $('#gl');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) {
    $('.gate-card').insertAdjacentHTML('afterbegin', '<p>Votre navigateur ne permet pas l\'affichage 3D (WebGL). Essayez Chrome, Edge ou Firefox récents.</p>'); $('#gate').classList.add('show'); return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  T.aniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2A0F16'); scene.environment = S.makeEnv(renderer);
  const camera = new THREE.PerspectiveCamera(48, 1, .1, 120); camera.rotation.order = 'YXZ'; scene.add(camera);
  const dimPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#2A0A14', transparent: true, opacity: 0, depthWrite: false })); dimPlane.position.z = -4.5; dimPlane.visible = false; camera.add(dimPlane);

  let hall = S.buildHall(), rayon = null, cur = hall; scene.add(hall.group);
  let view = 'gate', busy = false, time = 0, camOverride = null, curDom = 0, hallMode = 'home', lastPose = { x: 0, y: 2.4, z: 6.8, yaw: 0, pitch: 0 }, codeOpen = false, codeRet = null;
  const H = { a: 0, tgt: 0, vel: 0 }, X = { x: S.BAY_X[0], tgt: S.BAY_X[0], vel: 0 }, par = { x: 0, y: 0, tx: 0, ty: 0 };
  const hallIdx = () => mod(Math.round(-H.tgt / STEP), 6);
  const angFor = (k) => { const b = -k * STEP; return b + Math.round((H.tgt - b) / (PI * 2)) * PI * 2; };
  const angDiff = (a, b) => ((b - a + PI * 3) % (PI * 2)) - PI;
  const bayOf = (x) => { let b = 0; S.BAY_X.forEach((bx, i) => { if (Math.abs(bx - x) < Math.abs(S.BAY_X[b] - x)) b = i; }); return b; };

  /* ---------- poses de caméra de la Grande salle ---------- */
  const HOME = { x: 0, y: 2.3, z: 7.0, yaw: 0, pitch: -.04 };
  const orbitPose = (t) => { const a = t * .1 + 2.2; return { x: 6.8 * Math.sin(a), y: 2.4, z: 6.8 * Math.cos(a), yaw: a, pitch: -.03 }; };
  const doorPose = (a) => { const ang = a + .6, x = -6.5 * Math.sin(ang), z = -6.5 * Math.cos(ang), y = 2.4, dx = S.HR * Math.sin(a) - x, dz = S.HR * Math.cos(a) - z; return { x, y, z, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(2.3 - y, Math.hypot(dx, dz)) }; };
  const lerpPose = (a, b, e) => ({ x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e), yaw: a.yaw + angDiff(a.yaw, b.yaw) * e, pitch: lerp(a.pitch, b.pitch, e) });

  /* ---------- tweens ---------- */
  const tw = [];
  const tween = (ms, fn, done) => tw.push({ t: 0, d: ms / 1000, fn, done });

  /* ---------- petits outils d'interface ---------- */
  const veil = (on) => $('#veil').classList.toggle('on', on);
  let toastT = 0;
  const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); };
  let hintT = 0; const hinted = {};
  const hint = (txt, key) => { const h = $('#hint'); if (key && hinted[key]) return; if (key) hinted[key] = 1; clearTimeout(hintT); if (!txt) { h.classList.remove('on'); return; } h.textContent = txt; h.classList.add('on'); hintT = setTimeout(() => h.classList.remove('on'), 6500); };
  const formatTag = (f) => `<em class="ftag" style="--f:${L.FORMATS[f].col}">${esc(L.FORMATS[f].nom)}</em>`;

  const ui = (mode) => {
    const hallOn = mode === 'hall', rayOn = mode === 'rayon';
    $('#top').hidden = mode === 'gate' || mode === 'none'; $('#hallCard').hidden = !hallOn; $('#rayonBar').hidden = !rayOn;
    $('#navPrev').hidden = $('#navNext').hidden = !(hallOn || rayOn);
    requestAnimationFrame(() => { const d = hallOn ? $('#hallCard') : rayOn ? $('#rayonBar') : null; document.documentElement.style.setProperty('--dock-h', (d ? d.offsetHeight : 0) + 'px'); });
  };
  const crumbs = () => {
    const el = $('#crumbs'), parts = [];
    if (cur.kind === 'hall') { if (hallMode === 'doors') parts.push({ t: 'Grande salle', fn: () => hallTo('home') }, { t: L.DOMAINES[hallIdx()].nom, cur: true }); else parts.push({ t: 'Grande salle', cur: true }); }
    else { const d = rayon.dom, b = bayOf(X.tgt); parts.push({ t: 'Grande salle', fn: leaveRayon }, { t: d.nom, cur: view === 'rayon' && false }, { t: `Travée ${b + 1} · ${d.themes[b].nom}`, cur: true }); }
    el.innerHTML = ''; parts.forEach((p, i) => { if (i) { const s = document.createElement('span'); s.className = 'sep'; s.textContent = '›'; el.appendChild(s); } const b = document.createElement(p.fn ? 'button' : 'span'); b.className = 'crumb' + (p.cur ? ' cur' : '') + (p.fn ? ' link-c' : ''); b.textContent = p.t; if (p.fn) b.addEventListener('click', p.fn); el.appendChild(b); });
  };

  /* ---------- carte de la Grande salle ---------- */
  const dotsEl = $('#hallDots');
  { const b = document.createElement('button'); b.className = 'home'; b.setAttribute('aria-label', 'Le premier Code civil'); b.addEventListener('click', () => hallTo('home')); dotsEl.appendChild(b); }
  L.DOMAINES.forEach((d, k) => { const b = document.createElement('button'); b.style.setProperty('--c', d.couleur); b.setAttribute('aria-label', d.nom); b.addEventListener('click', () => goHall(k)); dotsEl.appendChild(b); });
  let lastKey = '';
  const hallCard = () => {
    const doors = hallMode === 'doors', k = hallIdx(), d = L.DOMAINES[k], open = st.sel.has(d.id), nReco = [...st.reco].filter((id) => L.byId[id].dom === d).length, enter = $('#hcEnter'), alt = $('#hcAlt');
    $$('button', dotsEl).forEach((b, i) => b.classList.toggle('on', doors ? i === k + 1 : i === 0));
    if (!doors) {
      $('#hcKicker').textContent = 'À la une'; $('#hcTitle').textContent = 'Le premier Code civil'; $('#hcMeta').textContent = 'Édition originale de 1804, récemment entrée dans les collections du groupe Lefebvre Dalloz.';
      enter.textContent = 'Découvrir l\'ouvrage'; enter.className = 'btn btn-primary'; alt.hidden = false;
    } else {
      $('#hcKicker').textContent = d.court; $('#hcTitle').textContent = d.nom;
      $('#hcMeta').innerHTML = open ? `${d.themes.length} thématiques · ${d.nbLivres} formations` + (nReco ? ` · <b style="color:var(--framboise)">★ ${nReco} pour vous</b>` : '') : 'Ce rayon est fermé : vous l\'avez filtré.';
      enter.textContent = open ? 'Entrer dans le rayon' : 'Rouvrir ce rayon'; enter.className = 'btn ' + (open ? 'btn-primary' : 'btn-soft'); alt.hidden = true;
    }
    lastKey = hallMode + k; if (cur.kind === 'hall') crumbs();
  };
  /* de la vue d'ensemble (le Code civil) aux portes, et retour */
  const hallTo = (mode, k, force, cb) => {
    if (!force && (busy || view !== 'hall')) return;
    const from = { ...lastPose }; let to;
    if (mode === 'home') to = HOME; else { H.tgt = angFor(k); to = doorPose(H.tgt); }
    busy = true; hallMode = mode; hallCard();
    tween(1400, (t) => { camOverride = lerpPose(from, to, ease(t)); }, () => { camOverride = null; if (mode === 'doors') H.a = H.tgt; busy = false; hallCard(); cb && cb(); });
  };
  const goHall = (k) => { if (busy || view !== 'hall') return; if (hallMode === 'home') hallTo('doors', mod(k, 6)); else H.tgt = angFor(mod(k, 6)); };
  const stepHall = (dir) => { if (busy || view !== 'hall') return; if (hallMode === 'home') return hallTo('doors', dir > 0 ? 0 : 5); const k = hallIdx() + dir; if (k < 0 || k > 5) hallTo('home'); else H.tgt = angFor(k); };
  $('#hcEnter').addEventListener('click', () => (hallMode === 'home' ? openCode() : activateDoor(hallIdx())));
  $('#hcAlt').addEventListener('click', () => stepHall(1));
  const activateDoor = (k) => {
    const d = L.DOMAINES[k]; if (busy || view !== 'hall' || hallMode !== 'doors') return;
    if (!st.sel.has(d.id)) { st.sel.add(d.id); save(); hall.setSelection(st.sel); refreshGate(); hallCard(); toast('Rayon rouvert : ' + d.court); return; }
    enterRayon(k);
  };

  /* ---------- le premier Code civil (pupitre central) ---------- */
  const codePose = () => {
    const B = hall.hubCenter, cp = lastPose; let dx = cp.x - B.x, dz = cp.z - B.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const narrow = innerWidth < 900, P = { x: B.x + dx * 3.4, y: B.y - .1, z: B.z + dz * 3.4 }, sh = narrow ? 0 : 1.05;
    const A = { x: B.x + dz * sh, y: B.y + (narrow ? -.95 : 0), z: B.z - dx * sh }, ddx = A.x - P.x, ddz = A.z - P.z;
    return { x: P.x, y: P.y, z: P.z, yaw: Math.atan2(-ddx, -ddz), pitch: Math.atan2(A.y - P.y, Math.hypot(ddx, ddz)) };
  };
  const openCode = () => {
    if (busy || view !== 'hall') return; hint(''); codeRet = { ...lastPose }; busy = true; view = 'code'; codeOpen = true; ui('none'); $('#top').hidden = false; dimPlane.visible = true;
    const from = { ...lastPose }, to = codePose();
    tween(1300, (t) => { camOverride = lerpPose(from, to, ease(t)); dimPlane.material.opacity = .4 * ease(t); }, () => { busy = false; showCode(); });
  };
  const closeCode = (cb) => {
    if (view !== 'code' || busy) return; busy = true; hidePanel(); const from = { ...lastPose }, to = codeRet;
    tween(1100, (t) => { camOverride = lerpPose(from, to, ease(t)); dimPlane.material.opacity = .4 * (1 - ease(t)); }, () => { camOverride = null; codeOpen = false; dimPlane.visible = false; view = 'hall'; busy = false; ui('hall'); hallCard(); cb && cb(); });
  };
  const showCode = () => {
    panel.style.setProperty('--dom', '#5A0B27');
    panel.innerHTML = `
      <div class="p-head"><span class="fmt" style="--f:#C9962E">À la une</span><span class="p-meta">Collections du groupe</span><button class="p-x" data-a="code-close" aria-label="Fermer">✕</button></div>
      <p class="p-path">Édition originale · 1804</p>
      <h2>Le premier Code civil</h2>
      <p class="p-pitch">Le « Code Napoléon », socle du droit civil français.</p>
      <dl class="p-grid"><div><dt>Promulgué</dt><dd>21 mars 1804</dd></div><div><dt>Articles</dt><dd>2 281</dd></div><div><dt>Rédigé par</dt><dd>4 juristes</dd></div></dl>
      <h3 class="p-h">Un monument du droit</h3>
      <p>Promulgué sous le Consulat, le Code civil des Français réunit en un seul texte les règles de la famille, de la propriété et des contrats. Rebaptisé « Code Napoléon » en 1807, il demeure le socle du droit civil.</p>
      <h3 class="p-h">Une pièce rare chez Lefebvre Dalloz</h3>
      <p>Ce premier Code civil vient de rejoindre les collections du groupe Lefebvre Dalloz. Éditeur du droit, nous continuons de l'annoter, de l'enseigner et de le faire vivre, dans nos ouvrages comme dans nos formations.</p>
      <div class="p-actions"><button class="btn btn-primary" data-a="code-droit">Découvrir les formations en droit</button><button class="btn btn-ghost" data-a="code-close">Retour à la salle</button></div>
      <p class="p-note">Texte de présentation à valider avec l'éditorial.</p>`;
    panel.hidden = false; panel.scrollTop = 0; requestAnimationFrame(() => panel.classList.add('show'));
  };

  /* ---------- étiquettes des livres et stepper des travées ---------- */
  const labelsEl = $('#labels'), labelEls = [0, 1, 2, 3].map((i) => { const e = document.createElement('div'); e.className = 'label'; e.addEventListener('click', () => { const b = curBay(); if (b) openBook(b.books[i]); }); e.addEventListener('mouseenter', () => { hoverRef = (curBay() || {}).books ? curBay().books[i] : null; }); e.addEventListener('mouseleave', () => { hoverRef = null; }); labelsEl.appendChild(e); return e; });
  let hoverRef = null, labelBay = -1;
  const curBay = () => (rayon ? rayon.bays[bayOf(X.tgt)] : null);
  const fillLabels = () => {
    const b = curBay(); if (!b) return; labelBay = b.ti;
    b.books.forEach((ref, i) => { const l = ref.livre, e = labelEls[i]; e.style.setProperty('--c', L.FORMATS[l.fmt].col); e.innerHTML = `<b>${esc(l.titre)}</b><span><i class="f" style="--c:${L.FORMATS[l.fmt].col}">${esc(L.FORMATS[l.fmt].nom)}</i>${esc(l.duree)}${st.reco.has(l.id) ? ' <i class="star">★</i>' : ''}</span>`; });
  };
  const stepperEl = $('#stepper');
  const buildStepper = () => { stepperEl.innerHTML = ''; rayon.dom.themes.forEach((t, i) => { const b = document.createElement('button'); b.className = 'step'; b.innerHTML = `<i>${i + 1}</i>${esc(t.nom)}`; b.addEventListener('click', () => goBay(i)); stepperEl.appendChild(b); }); };
  const stepperSync = () => { $$('.step', stepperEl).forEach((b, i) => b.classList.toggle('on', i === bayOf(X.tgt))); const on = $('.step.on', stepperEl); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' }); };
  const goBay = (i) => { if (busy || view !== 'rayon') return; X.tgt = S.BAY_X[clamp(i, 0, 4)]; syncBay(); };
  const syncBay = () => { fillLabels(); stepperSync(); crumbs(); };
  $('#navPrev').addEventListener('click', () => (view === 'hall' ? stepHall(-1) : goBay(bayOf(X.tgt) - 1)));
  $('#navNext').addEventListener('click', () => (view === 'hall' ? stepHall(1) : goBay(bayOf(X.tgt) + 1)));
  $('#btnBack').addEventListener('click', () => leaveRayon());

  /* ---------- caméra sur rails ---------- */
  const camDist = () => (camera.aspect < .9 ? 9.2 : 6.6), baseFov = () => (camera.aspect < .9 ? 66 : 48);
  const placeCamera = () => {
    let p;
    if (camOverride) p = camOverride;
    else if (cur.kind === 'hall') p = view === 'gate' ? orbitPose(time) : hallMode === 'home' ? HOME : doorPose(H.a);
    else p = { x: X.x, y: 1.7, z: S.RAY_Z + camDist(), yaw: 0, pitch: .045 };
    lastPose = p; camera.position.set(p.x, p.y, p.z); camera.rotation.set(p.pitch - par.y * .02, p.yaw - par.x * .03, 0);
  };

  /* ---------- pointeur : glisser, cliquer ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const ptr = { down: false, moved: false, x: 0, y: 0, sx: 0, sy: 0, t: 0, v: 0, tot: 0 };
  const pick = (x, y) => { ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); const hits = ray.intersectObjects(cur.pickables, false); return hits.length ? hits[0].object.userData.pick : null; };
  const railOk = () => !busy && !SC.on && !camOverride && (view === 'hall' || view === 'rayon');
  canvas.addEventListener('pointerdown', (e) => { ptr.down = true; ptr.moved = false; ptr.sx = ptr.x = e.clientX; ptr.sy = e.clientY; ptr.t = performance.now(); ptr.v = 0; ptr.tot = 0; try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* ignoré */ } });
  canvas.addEventListener('pointermove', (e) => {
    par.tx = e.clientX / innerWidth * 2 - 1; par.ty = e.clientY / innerHeight * 2 - 1;
    if (ptr.down) {
      const dx = e.clientX - ptr.x, now = performance.now(), dt = Math.max(8, now - ptr.t) / 1000; ptr.x = e.clientX; ptr.t = now; ptr.tot += dx;
      if (!ptr.moved && Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 6) { ptr.moved = true; canvas.classList.add('drag'); }
      if (ptr.moved && railOk()) {
        if (view === 'hall') { if (hallMode === 'doors') { const d = dx * .0017; H.tgt += d; ptr.v = .7 * ptr.v + .3 * d / dt; } }
        else { const d = -dx * (2 * camDist() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect) / innerWidth; X.tgt = clamp(X.tgt + d, S.BAY_X[0] - 1.5, S.BAY_X[4] + 1.5); ptr.v = .7 * ptr.v + .3 * d / dt; }
      }
    } else updateHover(e.clientX, e.clientY);
  });
  const release = () => {
    canvas.classList.remove('drag'); if (!ptr.down) return; ptr.down = false;
    if (!ptr.moved || !railOk()) return;
    if (view === 'hall') { if (hallMode === 'doors') H.tgt = Math.round((H.tgt + clamp(ptr.v, -4, 4) * .22) / STEP) * STEP; else if (Math.abs(ptr.tot) > 70) stepHall(ptr.tot < 0 ? 1 : -1); }
    else { X.tgt = S.BAY_X[bayOf(X.tgt + clamp(ptr.v, -30, 30) * .2)]; syncBay(); }
  };
  canvas.addEventListener('pointerup', (e) => { const click = ptr.down && !ptr.moved; release(); if (click) onClick(e.clientX, e.clientY); });
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { par.tx = par.ty = 0; hoverRef = null; });
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); if (!railOk() || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 8) return; const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (wheelLock) return; wheelLock = true; setTimeout(() => { wheelLock = false; }, 450); if (view === 'hall') stepHall(d > 0 ? 1 : -1); else goBay(bayOf(X.tgt) + (d > 0 ? 1 : -1)); }, { passive: false });
  let wheelLock = false;
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const updateHover = (x, y) => {
    if (!railOk()) { canvas.classList.remove('hot'); hoverRef = null; return; }
    const p = pick(x, y); hoverRef = p && p.kind === 'book' && bayOf(X.tgt) === p.ref.bay.ti ? p.ref : null;
    canvas.classList.toggle('hot', !!p && (p.kind !== 'bay'));
  };
  const onClick = (x, y) => {
    if (view === 'code') { if (!busy) closeCode(); return; }
    if (SC.on) { if (SC.phase === 'idle') { const p = pick(x, y); if (!(p && p.kind === 'book' && p.ref === SC.ref)) closeBook(); } return; }
    if (!railOk()) return; const p = pick(x, y); if (!p) return;
    if (p.kind === 'door') { if (hallMode === 'doors' && p.k === hallIdx()) activateDoor(p.k); else goHall(p.k); }
    else if (p.kind === 'code') openCode();
    else if (p.kind === 'bay') goBay(p.bay.ti);
    else if (p.kind === 'book') { if (p.ref.bay.ti === bayOf(X.tgt)) openBook(p.ref); else goBay(p.ref.bay.ti); }
  };

  /* ---------- clavier ---------- */
  addEventListener('keydown', (e) => {
    if (/^(INPUT|TEXTAREA)$/.test((e.target || {}).tagName)) return;
    if (e.key === 'Escape') return escape();
    if (e.key === 'ArrowLeft') { if (railOk()) (view === 'hall' ? stepHall(-1) : goBay(bayOf(X.tgt) - 1)); }
    else if (e.key === 'ArrowRight') { if (railOk()) (view === 'hall' ? stepHall(1) : goBay(bayOf(X.tgt) + 1)); }
    else if (e.key === 'Enter' && view === 'hall' && railOk() && !gateOpen()) (hallMode === 'doors' ? activateDoor(hallIdx()) : openCode());
  });
  const escape = () => {
    if (gateOpen() && $('#gate').dataset.mode === 'filter') return closeGate();
    if (journeyOpen()) return drawer(false);
    if (view === 'code') return closeCode();
    if (SC.on) return closeBook();
    if (view === 'rayon') leaveRayon();
    else if (view === 'hall' && hallMode === 'doors') hallTo('home');
  };

  /* ====================================================================================== */
  /*  Entrer dans un rayon / en sortir                                                       */
  /* ====================================================================================== */

  const enterRayon = (k, after) => {
    if (busy) return; const dom = L.DOMAINES[k]; busy = true; view = 'trans'; curDom = k; ui('none'); $('#top').hidden = false; hint('');
    const door = hall.doors[k]; door.target = 1;
    const from = { ...lastPose }, x1 = (S.HR - 1.3) * Math.sin(door.phi), z1 = (S.HR - 1.3) * Math.cos(door.phi), yawEnd = door.phi + PI; let veiled = false;
    setTimeout(() => { if (!rayon) { rayon = S.buildRayon(dom); rayon.group.visible = false; scene.add(rayon.group); buildStepper(); } }, 250);
    tween(2000, (t) => {
      const e = ease(t); camOverride = { x: lerp(from.x, x1, e), y: lerp(from.y, 1.75, e), z: lerp(from.z, z1, e), yaw: from.yaw + angDiff(from.yaw, yawEnd) * e, pitch: lerp(from.pitch, .03, e) }; camera.fov = baseFov() + 8 * e; camera.updateProjectionMatrix();
      if (t > .6 && !veiled) { veiled = true; veil(true); }
    }, () => {
      if (!rayon) { rayon = S.buildRayon(dom); scene.add(rayon.group); buildStepper(); }
      hall.group.visible = false; rayon.group.visible = true; cur = rayon; camOverride = null; camera.fov = baseFov(); camera.updateProjectionMatrix();
      const b0 = after ? after.bay : 0; X.x = S.BAY_X[b0] - 4.5; X.tgt = S.BAY_X[b0]; rayon.focus(X.x); par.x = par.y = 0;
      view = 'rayon'; syncBay(); ui('rayon'); applyReco(); veil(false);
      setTimeout(() => { busy = false; hint('Glissez ou utilisez ‹ › pour passer d\'une travée à l\'autre · cliquez un livre pour l\'ouvrir', 'ray'); if (after && after.ref) { after.ref.flash = 3; } }, 650);
    });
  };
  const leaveRayon = () => {
    if (busy || view !== 'rayon') return; busy = true; hoverRef = null; labelEls.forEach((e) => e.classList.remove('on')); veil(true);
    setTimeout(() => {
      scene.remove(rayon.group); S.disposeGroup(rayon.group); T.disposeOwned(); rayon = null;
      hall.group.visible = true; cur = hall; H.tgt = H.a = angFor(curDom); hall.doors[curDom].state = hall.doors[curDom].target = .16; hall.doors[curDom].apply(); hall.setSelection(st.sel, true);
      view = 'hall'; hallMode = 'doors'; ui('hall'); hallCard(); applyReco(); veil(false); setTimeout(() => { busy = false; }, 500);
    }, 650);
  };
  const applyReco = () => { if (rayon) fillLabels(); if (view === 'hall') hallCard(); };

  /* ====================================================================================== */
  /*  Le livre qui s'ouvre                                                                   */
  /* ====================================================================================== */

  const SC = { on: false, ref: null, phase: '', t: 0, magic: null, light: null, dim: 0 };
  const V = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler() };
  const worldHome = (ref) => { const bg = ref.bay.group; bg.updateMatrixWorld(true); const p = ref.home.p.clone(); bg.localToWorld(p); const bq = new THREE.Quaternion(); bg.getWorldQuaternion(bq); return { p, q: bq.multiply(new THREE.Quaternion().setFromEuler(ref.home.r)) }; };

  const makeMagic = (ref, u) => {
    const g = new THREE.Group();
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow(), color: ref.livre.dom.lueur, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.set(4.4 * u, 3.4 * u, 1); halo.position.z = -.35; g.add(halo);
    const n = 70, pos = new Float32Array(n * 3), life = new Float32Array(n), vel = new Float32Array(n * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: T.spark(), color: '#FFE2A8', size: .05 * u, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); pts.frustumCulled = false; g.add(pts);
    for (let i = 0; i < n; i++) life[i] = Math.random();
    scene.add(g); return { g, halo, pts, pos, life, vel, u, fade: 0 };
  };
  const disposeMagic = (m) => { if (!m) return; scene.remove(m.g); m.halo.material.dispose(); m.pts.geometry.dispose(); m.pts.material.dispose(); };

  const openBook = (ref) => {
    if (SC.on || busy) return; SC.on = true; SC.ref = ref; SC.phase = 'fly'; SC.t = 0; view = 'book'; hoverRef = null; hint(''); ui('none'); $('#top').hidden = false;
    labelEls.forEach((e) => e.classList.remove('on'));
    const root = ref.bk.root; scene.attach(root); root.scale.setScalar(1);
    SC.from = { p: root.position.clone(), q: root.quaternion.clone(), s: 1 };
    camera.updateMatrixWorld(); const fwd = V.a.set(0, 0, -1).applyQuaternion(camera.quaternion), right = V.b.set(1, 0, 0).applyQuaternion(camera.quaternion), up = V.c.set(0, 1, 0).applyQuaternion(camera.quaternion);
    const dist = 3.4, vh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), vw = vh * camera.aspect, narrow = innerWidth < 900, panelFrac = narrow ? 0 : Math.min(.4, 430 / innerWidth + .05);
    const s = clamp(Math.min(((1 - panelFrac) * vw * .72) / (2 * ref.bk.w), (narrow ? .3 : .56) * vh / ref.bk.h), .9, 1.8);
    const to = camera.position.clone().addScaledVector(fwd, dist).addScaledVector(right, -(panelFrac / 2) * vw).addScaledVector(up, narrow ? vh * .17 : .02);
    SC.to = { p: to, q: camera.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-.1, 0, 0))), s }; SC.base = { p: to.clone(), q: SC.to.q.clone() }; SC.u = s / 1.5;
    SC.magic = makeMagic(ref, SC.u); SC.light = new THREE.PointLight('#FFE6C0', 0, 9, 1.2); scene.add(SC.light);
  };
  const closeBook = () => { if (!SC.on || SC.phase !== 'idle') return; hidePanel(); SC.phase = 'close'; SC.t = 0; };

  const stepShowcase = (dt, t) => {
    if (!SC.on) { if (!codeOpen) dimPlane.visible = false; return; }
    const ref = SC.ref, root = ref.bk.root, m = SC.magic; SC.t += dt;
    if (SC.phase === 'fly') {
      const k = clamp01(SC.t / .85), e = ease(k);
      root.position.lerpVectors(SC.from.p, SC.to.p, e); root.position.y += Math.sin(k * PI) * .22; root.quaternion.slerpQuaternions(SC.from.q, SC.to.q, e); root.scale.setScalar(lerp(1, SC.to.s, e));
      SC.dim = e; if (k >= 1) { SC.phase = 'open'; SC.t = 0; setTimeout(() => { if (SC.on && SC.phase !== 'close' && SC.phase !== 'return') showBook(ref); }, 200); }
    } else if (SC.phase === 'open') {
      const k = clamp01(SC.t / 1.1); ref.bk.setOpen(k); m.fade = ease(k); if (k >= 1) { SC.phase = 'idle'; }
    } else if (SC.phase === 'idle') { m.fade = 1; ref.bk.setOpen(1); }
    else if (SC.phase === 'close') {
      const k = clamp01(SC.t / .8); ref.bk.setOpen(1 - ease(k)); m.fade = 1 - ease(k);
      if (k >= 1) { SC.phase = 'return'; SC.t = 0; const h = worldHome(ref); SC.from = { p: root.position.clone(), q: root.quaternion.clone(), s: root.scale.x }; SC.to = { p: h.p, q: h.q, s: 1 }; disposeMagic(SC.magic); SC.magic = null; }
    } else if (SC.phase === 'return') {
      const k = clamp01(SC.t / .85), e = ease(k);
      root.position.lerpVectors(SC.from.p, SC.to.p, e); root.position.y += Math.sin(k * PI) * .16; root.quaternion.slerpQuaternions(SC.from.q, SC.to.q, e); root.scale.setScalar(lerp(SC.from.s, 1, e)); SC.dim = 1 - e;
      if (k >= 1) { ref.bay.group.attach(root); root.position.copy(ref.home.p); root.rotation.copy(ref.home.r); root.scale.setScalar(1); scene.remove(SC.light); SC.light = null; SC.dim = 0; SC.on = false; SC.ref = null; view = 'rayon'; ui('rayon'); syncBay(); }
    }
    dimPlane.material.opacity = .62 * SC.dim; dimPlane.visible = SC.dim > .01;
    if (!SC.on || !m) return;
    if (SC.phase === 'idle' || SC.phase === 'open') { V.e.set(par.y * .06, par.x * .1, 0); V.q.setFromEuler(V.e); root.quaternion.slerp(SC.base.q.clone().multiply(V.q), Math.min(1, dt * 4)); root.position.copy(SC.base.p); root.position.y += Math.sin(t * 1.3) * .012 * SC.u; }
    m.g.position.copy(root.position); m.g.quaternion.copy(camera.quaternion);
    SC.light.position.copy(root.position).addScaledVector(V.a.set(0, 0, 1).applyQuaternion(camera.quaternion), 1.2); SC.light.position.y += .4; SC.light.intensity = .5 * SC.dim;
    m.halo.material.opacity = .38 * m.fade; m.pts.material.opacity = m.fade;
    const { pos, life, vel } = m, n = life.length;
    for (let i = 0; i < n; i++) {
      life[i] += dt * .3; if (life[i] >= 1) { life[i] = 0; pos[i * 3] = (Math.random() - .5) * 1.2 * m.u; pos[i * 3 + 1] = (Math.random() - .5) * .3 * m.u; pos[i * 3 + 2] = .05; vel[i * 3] = (Math.random() - .5) * .2; vel[i * 3 + 1] = .3 + Math.random() * .5; vel[i * 3 + 2] = 0; }
      pos[i * 3] += vel[i * 3] * dt * m.u; pos[i * 3 + 1] += vel[i * 3 + 1] * dt * m.u;
    }
    m.pts.geometry.attributes.position.needsUpdate = true;
  };

  /* ---------- fiche produit ---------- */
  const panel = $('#bookPanel');
  const EXTRA = { IL: 'Repartir avec les points d\'attention essentiels', WS: 'Repartir avec un outil prêt à l\'emploi', MC: 'Bénéficier du retour d\'expérience d\'un expert', FO: 'S\'exercer sur des cas pratiques', CE: 'Valider ses acquis par une évaluation finale' };
  const inJourney = (l) => st.parcours.has(l.id);
  const showBook = (ref) => {
    const l = ref.livre, f = L.FORMATS[l.fmt];
    panel.style.setProperty('--dom', l.dom.couleur);
    panel.innerHTML = `
      <div class="p-head"><span class="fmt" style="--f:${f.col}">${esc(f.nom)}</span><span class="p-meta">${esc(l.duree)} · ${esc(l.niveau)}</span><button class="p-x" data-a="close" aria-label="Refermer le livre">✕</button></div>
      <p class="p-path">${esc(l.dom.court)} › ${esc(l.theme.nom)}</p>
      <h2>${esc(l.titre)}</h2>
      <div class="tabs" role="tablist"><button class="tab on" data-tab="fiche">Fiche</button><button class="tab" data-tab="fc">France compétences</button></div>
      <div id="tabBody"></div>`;
    panel.hidden = false; panel.scrollTop = 0; requestAnimationFrame(() => panel.classList.add('show')); renderTab('fiche');
  };
  const hidePanel = () => { panel.classList.remove('show'); setTimeout(() => { if (!panel.classList.contains('show')) panel.hidden = true; }, 420); };
  const renderTab = (tab) => {
    const ref = SC.ref; if (!ref) return; const l = ref.livre, f = L.FORMATS[l.fmt], body = $('#tabBody', panel);
    $$('.tab', panel).forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    if (tab === 'fiche') {
      body.innerHTML = `<p class="p-pitch">${esc(f.desc)}</p>
        <dl class="p-grid"><div><dt>Durée</dt><dd>${esc(l.duree)}</dd></div><div><dt>Niveau</dt><dd>${esc(l.niveau)}</dd></div><div><dt>Format</dt><dd>${esc(f.nom)}</dd></div></dl>
        <h3 class="p-h">À l'issue, vous saurez</h3><ul class="p-list">${l.objectifs.concat(EXTRA[l.fmt]).map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
        <h3 class="p-h">Pour qui ?</h3><p>${esc(l.dom.public)}.</p>
        <div class="p-actions"><button class="btn btn-primary" data-a="journey">${inJourney(l) ? 'Retirer de mon parcours' : 'Ajouter à mon parcours'}</button><button class="btn btn-ghost" data-tab="fc">Voir le lien France compétences</button></div>
        <p class="p-note">Fiche de démonstration, à remplacer par la fiche du catalogue 2027.</p>`;
    } else {
      const th = l.theme, fc = th.fc, miss = fc.c.map((x, j) => j).filter((j) => !l.fc.couverts[j]);
      const sugg = th.livres.filter((o) => o !== l).map((o) => ({ o, gain: miss.filter((j) => o.fc.couverts[j]).length })).filter((x) => x.gain).sort((a, b) => b.gain - a.gain).slice(0, 2);
      body.innerHTML = `<div class="fc-head"><small>${esc(L.fcLabel(fc))}</small><b>${esc(fc.titre)}</b><span>${esc(fc.bloc)}</span></div>
        <div class="fc-gauge"><svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="30" class="bg"/><circle cx="36" cy="36" r="30" class="fg" id="fcRing"/></svg><div><b>${l.fc.score} %</b><span>${l.fc.nb} compétence${l.fc.nb > 1 ? 's' : ''} du bloc sur ${l.fc.total} couverte${l.fc.nb > 1 ? 's' : ''} par ce livre</span></div></div>
        <ul class="fc-list">${fc.c.map(([t], j) => `<li class="${l.fc.couverts[j] ? 'ok' : 'ko'}"><i>${l.fc.couverts[j] ? '✓' : ''}</i><span>${esc(t)}</span></li>`).join('')}</ul>
        ${sugg.length ? `<h3 class="p-h">Pour couvrir le reste du bloc</h3>${sugg.map(({ o, gain }) => `<button class="sug" data-a="sug" data-id="${o.id}" ${inJourney(o) ? 'disabled' : ''}><span>+ ${esc(o.titre)}</span><em>+${Math.round(100 * gain / l.fc.total)} %</em></button>`).join('')}` : '<p class="p-h">Ce livre couvre à lui seul tout le bloc.</p>'}
        <p class="p-note">Correspondance indicative, à rattacher aux fiches RNCP / RS officielles.</p>`;
      const ring = $('#fcRing'), C = 188.5; ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C; requestAnimationFrame(() => requestAnimationFrame(() => { ring.style.strokeDashoffset = C * (1 - l.fc.score / 100); }));
      if (!st.matched.has(l.id)) { st.matched.add(l.id); save(); }
    }
  };
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a],[data-tab]'); if (!b) return;
    if (b.dataset.a === 'code-close') return closeCode();
    if (b.dataset.a === 'code-droit') return closeCode(() => hallTo('doors', 1));
    if (!SC.ref) return;
    if (b.dataset.tab) return renderTab(b.dataset.tab);
    const a = b.dataset.a, l = SC.ref.livre;
    if (a === 'close') closeBook(); else if (a === 'journey') { toggleJourney(l); b.textContent = inJourney(l) ? 'Retirer de mon parcours' : 'Ajouter à mon parcours'; }
    else if (a === 'sug') { toggleJourney(L.byId[b.dataset.id]); b.disabled = true; }
  });

  /* ---------- parcours ---------- */
  const journey = $('#journey'); let jOpen = false;
  const journeyOpen = () => jOpen;
  const coverage = () => { const map = new Map(); st.parcours.forEach((id) => { const l = L.byId[id], key = l.dom.id + ':' + l.theme.index; if (!map.has(key)) map.set(key, { theme: l.theme, dom: l.dom, cov: new Set() }); l.fc.couverts.forEach((c, i) => { if (c) map.get(key).cov.add(i); }); }); return [...map.values()].map((e) => ({ ...e, pct: Math.round(100 * e.cov.size / e.theme.fc.c.length) })); };
  const toggleJourney = (l) => { if (st.parcours.has(l.id)) { st.parcours.delete(l.id); toast('Retiré de votre parcours'); } else { st.parcours.add(l.id); toast('Ajouté à votre parcours'); } save(); countJ(); if (jOpen) renderJourney(); };
  const countJ = () => { const c = $('#jCount'); c.textContent = st.parcours.size; c.hidden = !st.parcours.size; };
  const renderJourney = () => {
    const items = [...st.parcours].map((id) => L.byId[id]), cov = coverage(), h = items.reduce((a, l) => a + l.heures, 0);
    journey.innerHTML = `<div class="dr-head"><h3>Mon parcours</h3><button class="p-x" data-a="x" aria-label="Fermer">✕</button></div>` + (items.length ? `
      <p class="dr-sum"><b>${items.length}</b> formation${items.length > 1 ? 's' : ''} · environ <b>${L.formatHeures(h)}</b></p>
      <ul class="j-list">${items.map((l) => `<li><i style="background:${l.dom.couleur}"></i><span><b>${esc(l.titre)}</b><small>${esc(l.dom.court)} › ${esc(l.theme.nom)} · ${esc(L.FORMATS[l.fmt].nom)} · ${esc(l.duree)}</small></span><button data-a="rm" data-id="${l.id}" aria-label="Retirer">✕</button></li>`).join('')}</ul>
      <h4>Couverture des blocs France compétences</h4>${cov.map((c) => `<div class="cov"><div><b>${esc(c.theme.fc.titre)}</b><small>${esc(c.theme.fc.bloc)}</small></div><div class="cov-bar"><i style="width:${c.pct}%"></i></div><span class="cov-p">${c.pct} %</span></div>`).join('')}
      <div class="dr-actions"><button class="btn btn-primary" data-a="copy">Copier le parcours</button><button class="btn btn-ghost" data-a="clear">Vider</button></div>` : '<p class="dr-empty">Votre parcours est vide. Ouvrez un livre et choisissez « Ajouter à mon parcours » : les blocs de compétences que vous couvrez s\'afficheront ici.</p>');
  };
  const drawer = (on) => { jOpen = on; if (on) { renderJourney(); journey.hidden = false; requestAnimationFrame(() => journey.classList.add('show')); } else { journey.classList.remove('show'); setTimeout(() => { if (!jOpen) journey.hidden = true; }, 380); } };
  journey.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
    if (a === 'x') drawer(false); else if (a === 'rm') toggleJourney(L.byId[b.dataset.id]); else if (a === 'clear') { st.parcours.clear(); save(); countJ(); renderJourney(); }
    else if (a === 'copy') {
      const txt = 'Mon parcours · Lefebvre Dalloz Compétences, catalogue 2027\n' + [...st.parcours].map((id) => { const l = L.byId[id]; return `- ${l.titre} (${L.FORMATS[l.fmt].nom}, ${l.duree}) · ${l.dom.court} › ${l.theme.nom}`; }).join('\n') + '\n' + coverage().map((c) => `Bloc « ${c.theme.fc.bloc} » (${c.theme.fc.titre}) : ${c.pct} % couvert`).join('\n');
      const ok = () => toast('Parcours copié'); const fb = () => { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (er) { toast('Copie impossible'); } ta.remove(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fb); else fb();
    }
  });
  $('#btnJourney').addEventListener('click', () => drawer(!jOpen));

  /* ====================================================================================== */
  /*  Entrée / filtre (« Bibliothécaire »)                                                   */
  /* ====================================================================================== */

  const gate = $('#gate'), personasEl = $('#personas'), domsEl = $('#doms'), needQ = $('#needQ'), needRes = $('#needRes');
  L.PERSONAS.forEach((p) => { const b = document.createElement('button'); b.className = 'chip'; b.dataset.id = p.id; b.textContent = p.nom; personasEl.appendChild(b); });
  L.DOMAINES.forEach((d) => {
    const b = document.createElement('button'); b.className = 'dom'; b.dataset.id = d.id; b.style.setProperty('--c', d.couleur);
    b.innerHTML = `<span class="dglyph${d.glyph.length > 2 ? ' s3' : d.glyph.length > 1 ? ' s2' : ''}">${esc(d.glyph)}</span><span class="dname"><b>${esc(d.court)}</b><small>${esc(d.nom)}</small></span><span class="dstate"></span>`; domsEl.appendChild(b);
  });
  const gateOpen = () => gate.classList.contains('show');
  const computeReco = (q) => { const res = L.search(q).filter((r) => st.sel.has(r.livre.dom.id)); if (!res.length) return []; const top = res[0].score; return res.filter((r) => r.score >= Math.max(3, top * .4)).slice(0, 12); };
  const setReco = (q) => { st.recoQ = q; st.reco = new Set(q ? computeReco(q).map((r) => r.livre.id) : []); };
  const refreshGate = () => {
    $$('.dom', domsEl).forEach((b) => { const on = st.sel.has(b.dataset.id), d = L.domById[b.dataset.id]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); $('.dstate', b).textContent = (on ? 'Ouvert' : 'Fermé') + ' · ' + d.nbLivres + ' formations'; });
    $$('.chip', personasEl).forEach((b) => b.classList.toggle('on', b.dataset.id === st.persona));
    const n = st.sel.size, m = [...st.sel].reduce((a, id) => a + L.domById[id].nbLivres, 0);
    $('#gateSum').innerHTML = n ? `<b>${n}</b> rayon${n > 1 ? 's' : ''} ouvert${n > 1 ? 's' : ''} · <b>${m}</b> formations` + (st.reco.size ? ` · <span class="star">★</span> ${st.reco.size} livre${st.reco.size > 1 ? 's' : ''} repéré${st.reco.size > 1 ? 's' : ''}` : '') : 'Ouvrez au moins un rayon';
    $('#enter').disabled = !n;
  };
  const changed = () => { save(); hall.setSelection(st.sel); refreshGate(); };
  personasEl.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; const p = L.PERSONAS.find((x) => x.id === b.dataset.id); st.persona = p.id; st.sel = new Set(p.domaines); needQ.value = ''; needRes.innerHTML = ''; setReco(p.q); changed(); });
  domsEl.addEventListener('click', (e) => { const b = e.target.closest('.dom'); if (!b) return; const id = b.dataset.id; if (st.sel.has(id)) st.sel.delete(id); else st.sel.add(id); st.persona = null; if (st.recoQ) setReco(st.recoQ); changed(); });
  $('#selAll').addEventListener('click', () => { st.sel = new Set(ALL); st.persona = null; changed(); });
  $('#selNone').addEventListener('click', () => { st.sel = new Set(); st.persona = null; changed(); });
  let needT = 0;
  needQ.addEventListener('input', () => {
    clearTimeout(needT); needT = setTimeout(() => {
      const q = needQ.value.trim(); st.persona = null;
      if (!q) { needRes.innerHTML = ''; setReco(''); refreshGate(); return; }
      const res = L.search(q); needRes.innerHTML = res.slice(0, 5).map((r) => `<li data-id="${r.livre.id}"><i style="background:${r.livre.dom.couleur}"></i><span><b>${esc(r.livre.titre)}</b><small>${esc(r.livre.dom.court)} › ${esc(r.livre.theme.nom)}</small></span>${formatTag(r.livre.fmt)}</li>`).join('') || '<li style="cursor:default"><span><small>Aucun livre ne correspond. Essayez « paie », « bail », « IA »…</small></span></li>';
      const score = {}; res.slice(0, 20).forEach((r) => { score[r.livre.dom.id] = (score[r.livre.dom.id] || 0) + r.score; });
      const top = Object.entries(score).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]); if (top.length) st.sel = new Set(top);
      setReco(q); changed();
    }, 160);
  });
  needQ.addEventListener('keydown', (e) => e.stopPropagation());
  needRes.addEventListener('click', (e) => { const li = e.target.closest('li[data-id]'); if (!li) return; const l = L.byId[li.dataset.id]; st.sel.add(l.dom.id); st.reco = new Set([l.id]); changed(); startFromGate({ goto: l }); });
  $('#enter').addEventListener('click', () => startFromGate());
  $('#gateClose').addEventListener('click', () => closeGate());
  $('#btnFilter').addEventListener('click', () => openFilter());

  const showGate = (mode) => { gate.dataset.mode = mode; $('#gateTitle').textContent = mode === 'intro' ? 'Bibliothèque des compétences' : 'Mes rayons'; $('#gateLead').textContent = mode === 'intro' ? 'Un rayon par domaine, une travée par thématique, un grand livre par formation. Choisissez vos rayons : les portes s\'ouvrent.' : 'Fermez les rayons qui ne vous concernent pas, ou décrivez un besoin : je repère les livres pour vous.'; $('#enter').textContent = mode === 'intro' ? 'Entrer' : 'Appliquer'; $('#gateClose').hidden = mode === 'intro'; refreshGate(); gate.classList.add('show'); };
  const openFilter = () => { if (busy || SC.on) return; drawer(false); showGate('filter'); };
  const closeGate = () => { gate.classList.remove('show'); save(); if (rayon && !st.sel.has(rayon.dom.id)) leaveRayon(); else { applyReco(); if (view === 'hall') hallCard(); } };
  const startFromGate = (opts = {}) => {
    if (!st.sel.size) return;
    if (view === 'gate') {
      gate.classList.remove('show'); view = 'hall'; hallMode = 'home'; ui('hall'); hallCard();
      if (opts.goto) hallTo('doors', opts.goto.dom.index, true, () => goTo(opts.goto));
      else hallTo('home', 0, true, () => hint('Cliquez le livre pour le découvrir · ‹ › pour explorer les rayons', 'hall'));
    } else { closeGate(); if (opts.goto) goTo(opts.goto); }
  };
  /* Aller droit à un livre repéré : ouvrir le rayon, centrer la travée, mettre le livre en évidence. */
  const goTo = (l) => {
    const go = () => { const ref = rayon.books.find((b) => b.id === l.id); X.tgt = S.BAY_X[l.theme.index]; syncBay(); ref.flash = 3; };
    if (rayon && rayon.dom === l.dom) go(); else if (view === 'hall') { if (hallMode === 'home') hallTo('doors', l.dom.index, false, () => goTo(l)); else { H.tgt = angFor(l.dom.index); enterRayon(l.dom.index, { bay: l.theme.index, ref: null }); } } else if (view === 'rayon') { leaveRayon(); setTimeout(() => goTo(l), 1500); }
  };

  /* ====================================================================================== */
  /*  Boucle                                                                                 */
  /* ====================================================================================== */

  const v3 = new THREE.Vector3();
  const resize = () => { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = baseFov(); camera.updateProjectionMatrix(); const ph = 2 * 4.5 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.2; dimPlane.scale.set(ph * camera.aspect, ph, 1); };
  addEventListener('resize', resize);

  let last = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000) * (L.debug ? L.debug.fast : 1); last = now; time += dt;
    par.x += (par.tx - par.x) * Math.min(1, dt * 3); par.y += (par.ty - par.y) * Math.min(1, dt * 3);
    if (cur.kind === 'hall') { if (hallMode === 'doors' && view !== 'gate') H.a += (H.tgt - H.a) * (1 - Math.exp(-dt * 6.5)); }
    else if (cur.kind === 'rayon') { X.x += (X.tgt - X.x) * (1 - Math.exp(-dt * 6.5)); cur.focus(X.x); }
    for (let i = tw.length - 1; i >= 0; i--) { const q = tw[i]; q.t += dt; const k = clamp01(q.t / q.d); q.fn(k); if (k >= 1) { tw.splice(i, 1); q.done && q.done(); } }
    placeCamera(); if (cur.kind === 'hall') cur.camPos.copy(camera.position); cur.update(dt, time);
    if (cur.kind === 'hall' && view === 'hall' && hallMode + hallIdx() !== lastKey) hallCard();
    if (cur.kind === 'rayon') {
      cur.books.forEach((b) => { if (SC.ref === b) return; const hv = hoverRef === b ? 1 : 0; b.hv += (hv - b.hv) * Math.min(1, dt * 10); b.bk.root.position.y = b.home.p.y + b.hv * .05; b.bk.root.scale.setScalar(1 + b.hv * .03); if (b.flash > 0) b.flash -= dt; });
      const bay = curBay(), settled = view === 'rayon' && !busy && Math.abs(X.x - bay.xc) < .5 && !ptr.moved;
      if (bay.ti !== labelBay) fillLabels();
      bay.books.forEach((ref, i) => { const e = labelEls[i]; v3.copy(ref.anchor).project(camera); e.style.transform = `translate(${(v3.x * .5 + .5) * innerWidth - e.offsetWidth / 2}px,${(-v3.y * .5 + .5) * innerHeight + 12}px)`; e.classList.toggle('on', settled); e.classList.toggle('hv', hoverRef === ref || ref.flash > 0); });
      if (view === 'rayon') { stepperSync(); }
    }
    stepShowcase(dt, time);
    renderer.render(scene, camera);
  };

  /* ---------- démarrage ---------- */
  hall.setSelection(st.sel, true); resize(); countJ(); showGate('intro'); requestAnimationFrame((t) => { last = t; frame(t); });
  L.debug = { fast: 1, st, view: () => view, busy: () => busy, enterRayon, leaveRayon, openBook, closeBook, startFromGate, rayon: () => rayon, hall, X, H, camera, renderer, scene, goBay, goHall, SC, hallTo, openCode, closeCode, hallMode: () => hallMode, lastPose: () => lastPose };
})();
