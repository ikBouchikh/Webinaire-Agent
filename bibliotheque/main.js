/* Moteur : rendu, déplacement, interactions, transitions hall ⇄ rayon, ouverture magique d'un livre, son, mini-plan. */

(function () {
  const L = window.LDC, W = L.world, T = L.tex, st = L.state, ui = L.ui, $ = L.$;
  const PI = Math.PI, ease = L.ease, clamp01 = L.clamp01;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const angDiff = (a, b) => ((b - a + PI * 3) % (PI * 2)) - PI;

  /* ---------- rendu ---------- */
  const canvas = $('#gl');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    $('#gate .gate-card').insertAdjacentHTML('afterbegin', '<p class="g-err">Votre navigateur ne permet pas l\'affichage 3D (WebGL). Essayez Chrome, Edge ou Firefox récents, avec l\'accélération matérielle activée.</p>');
    $('#enter').disabled = true; return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
  T.aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#12040a');
  scene.fog = new THREE.FogExp2('#1c0812', .026);
  const camera = new THREE.PerspectiveCamera(62, 1, .05, 90); camera.rotation.order = 'YXZ';
  scene.add(camera);
  const dimPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#14040c', transparent: true, opacity: 0, depthWrite: false, fog: false }));
  dimPlane.position.z = -2.5; dimPlane.visible = false; camera.add(dimPlane);

  /* ---------- son (WebAudio, synthétisé : aucun fichier) ---------- */
  const audio = { ctx: null, master: null };
  const initAudio = () => {
    if (audio.ctx) { if (audio.ctx.state === 'suspended') audio.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      const ctx = audio.ctx = new C(); audio.master = ctx.createGain(); audio.master.gain.value = st.sound ? .55 : 0; audio.master.connect(ctx.destination);
      const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.2; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; const g = ctx.createGain(); g.gain.value = .5;
      src.connect(lp); lp.connect(g); g.connect(audio.master); src.start();
      [110, 164.81, 220.5].forEach((f, i) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; const og = ctx.createGain(); og.gain.value = .012 / (i + 1); o.connect(og); og.connect(audio.master); o.start(); });
      const crackle = () => {
        if (st.sound && ctx.state === 'running') {
          const n = ctx.createBuffer(1, ctx.sampleRate * .03, ctx.sampleRate), nd = n.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (nd.length * .25));
          const s = ctx.createBufferSource(); s.buffer = n; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400 + Math.random() * 1500; const cg = ctx.createGain(); cg.gain.value = .05 + Math.random() * .12;
          s.connect(hp); hp.connect(cg); cg.connect(audio.master); s.start();
        }
        setTimeout(crackle, 120 + Math.random() * 1400);
      };
      crackle();
    } catch (e) { audio.ctx = null; }
  };
  const sfx = (kind) => {
    const ctx = audio.ctx; if (!ctx || !st.sound || ctx.state !== 'running') return; const now = ctx.currentTime;
    const noise = (dur, f0, f1, vol, type = 'bandpass') => {
      const b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(PI * i / d.length);
      const s = ctx.createBufferSource(); s.buffer = b; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, now); f.frequency.exponentialRampToValueAtTime(f1, now + dur); const g = ctx.createGain(); g.gain.value = vol;
      s.connect(f); f.connect(g); g.connect(audio.master); s.start(now);
    };
    const tone = (freqs, dur, vol) => freqs.forEach((f, i) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; const g = ctx.createGain(); g.gain.setValueAtTime(0, now + i * .07); g.gain.linearRampToValueAtTime(vol / (i + 1), now + i * .07 + .02); g.gain.exponentialRampToValueAtTime(.0001, now + dur + i * .07); o.connect(g); g.connect(audio.master); o.start(now + i * .07); o.stop(now + dur + .3); });
    if (kind === 'page') noise(.4, 900, 3200, .5);
    else if (kind === 'chime') tone([880, 1318.5, 1760], 1.4, .16);
    else if (kind === 'open') { noise(.5, 700, 2800, .55); tone([523.25, 783.99, 1046.5], 1.8, .12); }
    else if (kind === 'door') noise(.8, 300, 90, .9, 'lowpass');
    else if (kind === 'gold') tone([987.77, 1318.5, 1567.98, 1975.5], 2, .15);
  };

  /* ---------- monde courant ---------- */
  let hall = null, cur = null, mode = 'attract', busy = false, time = 0, elapsedQ = 0;
  const P = { x: 0, z: 6, yaw: 0, pitch: -.1, vx: 0, vz: 0, bob: 0, glide: null, frozen: true, joy: { x: 0, y: 0 }, wheel: 0 };
  const keys = {};
  const ctx3 = { found: st.golds };

  const syncPortals = (instant) => { L.DOMAINES.forEach((d) => hall.setOpen(d.id, st.sel.has(d.id), instant)); applyReco(); };
  const applyReco = () => {
    if (!cur) return;
    if (cur.kind === 'rayon') { let n = 0; cur.books.forEach((b) => { const on = st.reco.has(b.id); b.star.visible = on; if (on) n++; }); $('#btnNext').hidden = !(n && mode === 'play'); }
    else { hall.portals.forEach((p) => { p.pulse = [...st.reco].some((id) => L.byId[id].dom === p.dom) ? .16 : 0; }); $('#btnNext').hidden = true; }
  };
  const crumbHall = () => ui.crumbs([{ t: 'Grande Nef' }]);
  const crumbRayon = (bay) => { const d = cur.dom; ui.crumbs([{ t: 'Grande Nef', fn: () => leaveRayon() }, { t: d.court, c: d.lueur, fn: bay ? () => glideTo(cur.spawn, 1.4) : null }].concat(bay ? [{ t: `Travée ${bay.ti + 1} · ${bay.theme.nom}`, c: d.lueur }] : [])); };

  /* ---------- déplacements ---------- */
  const glideTo = (pose, dur = 1.2, done) => {
    P.glide = { from: { x: P.x, z: P.z, yaw: P.yaw, pitch: P.pitch }, to: { x: pose.x, z: pose.z, yaw: pose.yaw == null ? P.yaw : pose.yaw, pitch: pose.pitch == null ? 0 : pose.pitch }, t: 0, dur, done };
    P.vx = P.vz = 0;
  };
  const setPose = (p) => { P.x = p.x; P.z = p.z; P.yaw = p.yaw || 0; P.pitch = p.pitch == null ? 0 : p.pitch; P.vx = P.vz = 0; P.glide = null; };

  const constrain = () => {
    const R = cur;
    R.colliders.forEach((c) => { const dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz), m = c.r + .35; if (d < m && d > .001) { P.x = c.x + dx / d * m; P.z = c.z + dz / d * m; } });
    if (R.kind === 'hall') {
      const r = Math.hypot(P.x, P.z), a = Math.atan2(P.x, P.z); let max = R.bounds.r;
      R.portals.forEach((p) => { if (p.open && Math.abs(angDiff(a, p.phi)) < .11) max = R.bounds.portalR; });
      if (r > max) { P.x *= max / r; P.z *= max / r; }
      if (mode === 'play' && !busy && !P.glide) R.portals.forEach((p) => { if (p.open && Math.hypot(P.x - p.pos.x, P.z - p.pos.z) < 1.5) enterRayon(p.dom); });
    } else {
      const b = R.bounds; P.x = clamp(P.x, b.minX, b.maxX);
      const inExit = Math.abs(P.x) < b.exitHalf; P.z = clamp(P.z, b.minZ, inExit ? b.exitZ : b.maxZ);
      if (mode === 'play' && !busy && !P.glide && inExit && P.z > b.maxZ + .15) leaveRayon();
    }
  };

  const stepPlayer = (dt) => {
    if (P.glide) {
      const g = P.glide; g.t += dt / g.dur; const e = ease(clamp01(g.t));
      P.x = lerp(g.from.x, g.to.x, e); P.z = lerp(g.from.z, g.to.z, e); P.yaw = g.from.yaw + angDiff(g.from.yaw, g.to.yaw) * e; P.pitch = lerp(g.from.pitch, g.to.pitch, e);
      if (g.t >= 1) { const f = g.done; P.glide = null; f && f(); }
      return;
    }
    if (P.frozen) return;
    const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - P.joy.y, s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + P.joy.x;
    const turn = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0); P.yaw -= turn * dt * 1.9;
    const sp = keys.ShiftLeft || keys.ShiftRight ? 5.4 : 2.9; let len = Math.hypot(f, s); if (len > 1) len = 1;
    const ang = Math.atan2(s, f), mag = Math.min(1, Math.hypot(f, s));
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    const nf = Math.hypot(f, s) || 1, tx = ((fx * f + rx * s) / nf) * sp * mag, tz = ((fz * f + rz * s) / nf) * sp * mag;
    P.vx += (tx - P.vx) * Math.min(1, dt * 8); P.vz += (tz - P.vz) * Math.min(1, dt * 8);
    if (P.wheel) { P.vx += fx * P.wheel * 3; P.vz += fz * P.wheel * 3; P.wheel = 0; }
    P.x += P.vx * dt; P.z += P.vz * dt;
    P.bob += Math.hypot(P.vx, P.vz) * dt * 2.2;
    constrain();
  };

  /* ---------- pointeur ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const ptr = { x: innerWidth / 2, y: innerHeight / 2, down: false, sx: 0, sy: 0, moved: false, dirty: false, id: null };
  let hover = null;
  const pick = (x, y) => {
    if (!cur) return null; ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(cur.pickables, false); return hits.length ? { hit: hits[0], pick: hits[0].object.userData.pick } : null;
  };
  canvas.addEventListener('pointerdown', (e) => { initAudio(); ptr.down = true; ptr.moved = false; ptr.sx = ptr.x = e.clientX; ptr.sy = ptr.y = e.clientY; ptr.id = e.pointerId; try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* ignoré */ } });
  canvas.addEventListener('pointermove', (e) => {
    const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y; ptr.x = e.clientX; ptr.y = e.clientY; ptr.dirty = true;
    if (ptr.down) {
      if (!ptr.moved && Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 5) { ptr.moved = true; canvas.classList.add('grab'); if (P.glide && mode === 'play') P.glide = null; }
      if (ptr.moved && !SC.on && mode === 'play') { P.yaw -= dx * .0036; P.pitch = clamp(P.pitch - dy * .0032, -1.2, 1.2); }
    }
  });
  const pointerEnd = () => { ptr.down = false; canvas.classList.remove('grab'); };
  canvas.addEventListener('pointerup', (e) => { const wasClick = ptr.down && !ptr.moved; pointerEnd(); if (wasClick) click(e.clientX, e.clientY); });
  canvas.addEventListener('pointercancel', pointerEnd);
  canvas.addEventListener('wheel', (e) => { if (mode === 'play' && !SC.on && !P.glide) { P.wheel += -Math.sign(e.deltaY) * Math.min(1, Math.abs(e.deltaY) / 100) * .35; } e.preventDefault(); }, { passive: false });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const tipFor = (p, hit) => {
    if (!p) return null;
    if (p.kind === 'book') { const l = p.ref.livre; return `<b>${L.esc(l.titre)}</b><span>${ui.formatTag(l.fmt)} ${L.esc(l.duree)} · ${L.esc(l.niveau)}</span>${st.reco.has(l.id) ? '<span class="star">★ Recommandé pour vous</span>' : ''}<small>Cliquer pour ouvrir le livre</small>`; }
    if (p.kind === 'portal') { const d = p.dom, on = st.sel.has(d.id); return `<b>${L.esc(d.nom)}</b><span>${d.themes.length} travées · ${d.nbLivres} formations</span><small>${on ? 'Cliquer pour entrer dans le rayon' : 'Rayon fermé · cliquer pour le rouvrir'}</small>`; }
    if (p.kind === 'bay') { if (Math.hypot(P.x - p.bay.stand.x, P.z - p.bay.stand.z) < 1.2) return null; return `<b>Travée ${p.bay.ti + 1} · ${L.esc(p.bay.theme.nom)}</b><span>${p.bay.theme.livres.length} formations</span><small>Cliquer pour s'y rendre</small>`; }
    if (p.kind === 'hub') return '<b>Le Bibliothécaire</b><span>Filtrer les rayons selon votre métier ou votre besoin</span><small>Cliquer pour consulter le catalogue</small>';
    if (p.kind === 'gold') return '<b>Un livre doré !</b><small>Cliquer pour le saisir</small>';
    if (p.kind === 'exit') return '<b>Retour à la Grande Nef</b><small>Cliquer pour sortir du rayon</small>';
    return null;
  };
  const updateHover = () => {
    if (SC.on || mode !== 'play' || ptr.down || ui.gateOpen()) { hover = null; ui.tip(null); canvas.classList.remove('hot'); return; }
    const r = pick(ptr.x, ptr.y); hover = r ? r.pick : null;
    const html = tipFor(hover, r && r.hit); ui.tip(html, ptr.x, ptr.y); canvas.classList.toggle('hot', !!(hover && (html || hover.kind === 'bay')));
  };

  const click = (x, y) => {
    initAudio(); if (mode !== 'play') return;
    if (SC.on) { if (SC.phase === 'idle') { const r = pick(x, y); if (!(r && r.pick.kind === 'book' && r.pick.ref === SC.ref)) closeBook(); } return; }
    const r = pick(x, y); if (!r) return; const p = r.pick;
    if (p.kind === 'portal') { if (!st.sel.has(p.dom.id)) { st.sel.add(p.dom.id); ui.refreshGate(); L.save(); syncPortals(); sfx('door'); ui.toast('Rayon ouvert', p.dom.nom); } else approachPortal(hall.portals.find((q) => q.dom === p.dom)); }
    else if (p.kind === 'bay') glideTo(p.bay.stand, 1.3, () => crumbRayon(p.bay));
    else if (p.kind === 'book') { const ref = p.ref, bay = ref.bay; if (Math.hypot(P.x - bay.stand.x, P.z - bay.stand.z) > 4.2) glideTo(bay.stand, 1.2, () => openBook(ref)); else openBook(ref); }
    else if (p.kind === 'gold') foundGold();
    else if (p.kind === 'hub') app.openFilter();
    else if (p.kind === 'exit') leaveRayon();
  };
  const approachPortal = (p) => { if (!p || busy) return; glideTo(p.stand, .9, () => glideTo({ x: p.pos.x * .93, z: p.pos.z * .93, yaw: p.stand.yaw, pitch: 0 }, .9, () => enterRayon(p.dom))); };

  /* ---------- clavier ---------- */
  addEventListener('keydown', (e) => {
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    initAudio(); keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && mode === 'play') e.preventDefault();
    if (e.code.startsWith('Arrow') || /^Key[WASD]$/.test(e.code)) { if (P.glide && !busy && mode === 'play' && !SC.on) P.glide = null; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (e.key === 'Escape') return escape();
    if (mode === 'attract' && !ui.gateOpen()) return;
    if (k === 'f') app.openFilter(); else if (k === 'p') ui.drawer(ui.current === 'journey' ? null : 'journey'); else if (k === 'j') ui.drawer(ui.current === 'quests' ? null : 'quests');
    else if (k === 'n') app.nextReco(); else if (k === 'm') app.toggleSound(); else if (k === 'h' || e.key === '?') { const h = $('#help'); h.hidden = !h.hidden; }
    else if (k === 'enter' && SC.on && SC.phase === 'idle') app.match(SC.ref);
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  addEventListener('blur', () => { Object.keys(keys).forEach((k) => { keys[k] = false; }); });
  const escape = () => {
    if (!$('#help').hidden) { $('#help').hidden = true; return; }
    if (ui.gateOpen() && $('#gate').dataset.mode === 'filter') return app.closeGate();
    if (ui.current) return ui.drawer(null);
    if (SC.on) return closeBook();
    if (cur && cur.kind === 'rayon') leaveRayon();
  };

  /* joystick tactile */
  const joy = $('#joy');
  if (matchMedia('(pointer:coarse)').matches) {
    joy.hidden = false; $('#mini').classList.add('small'); let jid = null;
    const move = (e) => { const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } P.joy.x = dx; P.joy.y = -dy; $('i', joy).style.transform = `translate(${dx * 28}px,${dy * 28}px)`; };
    joy.addEventListener('pointerdown', (e) => { jid = e.pointerId; joy.setPointerCapture(jid); move(e); initAudio(); });
    joy.addEventListener('pointermove', (e) => { if (e.pointerId === jid) move(e); });
    const end = () => { jid = null; P.joy.x = P.joy.y = 0; $('i', joy).style.transform = ''; };
    joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
  }

  /* ====================================================================================== */
  /*  Transitions                                                                            */
  /* ====================================================================================== */

  const enterRayon = (dom, opts = {}) => {
    if (busy) return; busy = true; P.frozen = true; P.glide = null; sfx('door'); ui.tip(null);
    ui.curtain('Rayon · ' + dom.court, true);
    setTimeout(() => {
      if (cur && cur.kind === 'rayon') teardownRayon();
      hall.group.visible = false;
      const R = W.buildRayon(dom, ctx3); scene.add(R.group); cur = R; scene.fog.density = .022;
      setPose(R.spawn); applyReco(); crumbRayon(); ui.hint('Cliquez un grand livre pour l\'ouvrir · ★ indique un livre recommandé · la porte du fond ramène à la Grande Nef');
      if (!st.visited.has(dom.id)) { st.visited.add(dom.id); L.game.award(15, 'Rayon découvert : ' + dom.court, '+15 XP'); } L.game.check();
      setTimeout(() => { ui.curtain('', false); busy = false; P.frozen = false; opts.then && opts.then(); }, 380);
    }, 650);
  };
  const teardownRayon = () => { if (cur && cur.kind === 'rayon') { scene.remove(cur.group); W.disposeGroup(cur.group); T.disposeOwned(); } };
  const leaveRayon = (then) => {
    if (busy || !cur || cur.kind !== 'rayon') return; busy = true; P.frozen = true; P.glide = null; sfx('door'); ui.tip(null);
    const dom = cur.dom; ui.curtain('Grande Nef', true);
    setTimeout(() => {
      teardownRayon(); hall.group.visible = true; cur = hall; scene.fog.density = .026;
      const p = hall.portals.find((q) => q.dom === dom); setPose({ x: p.stand.x * .92, z: p.stand.z * .92, yaw: p.phi, pitch: -.02 });
      crumbHall(); applyReco(); ui.hint('Cliquez une porte pour entrer dans un rayon · le lutrin ouvre le Bibliothécaire · rayons fermés : grille baissée');
      setTimeout(() => { ui.curtain('', false); busy = false; P.frozen = false; then && then(); }, 380);
    }, 650);
  };

  const foundGold = () => {
    const dom = cur.dom, gd = cur.gold; if (!gd) return;
    st.golds.add(dom.id); sfx('gold'); [gd.mesh, gd.glow].forEach((o) => o.parent && o.parent.remove(o)); cur.pickables.splice(cur.pickables.indexOf(gd.mesh), 1); cur.gold = null;
    const tips = { chiffre: 'Astuce d\'or : un Instant Learning d\'actualité + une Masterclass d\'expert = une veille qui reste.', droit: 'Astuce d\'or : relire ses contrats avec une check-list réduit les litiges avant qu\'ils naissent.', rh: 'Astuce d\'or : la paie fiabilisée, c\'est un climat social apaisé.', qse: 'Astuce d\'or : une démarche de prévention vit mieux quand elle est partagée.', public: 'Astuce d\'or : un marché bien cadré se gagne dès la définition du besoin.', mgmt: 'Astuce d\'or : déléguer, c\'est faire grandir, pas se décharger.' };
    L.game.award(60, 'Livre doré trouvé !', tips[dom.id]); L.game.check();
  };

  /* ====================================================================================== */
  /*  Le livre magique                                                                       */
  /* ====================================================================================== */

  const SC = { on: false, ref: null, phase: null, t: 0, magic: null, light: null, dim: 1 };
  const V = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), e: new THREE.Euler() };

  const makeMagic = (ref, u) => {
    const g = new THREE.Group(), l = ref.livre;
    const beams = [0, PI / 2].map((ry) => { const gm = new THREE.PlaneGeometry(1.3 * u, 2.8 * u); gm.translate(0, 1.4 * u, 0); const m = new THREE.Mesh(gm, new THREE.MeshBasicMaterial({ map: T.beam(), color: '#ffd890', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.rotation.y = ry; g.add(m); return m; });
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow(), color: l.dom.lueur, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo.scale.set(4.2 * u, 3.2 * u, 1); g.add(halo);
    const n = 150, pos = new Float32Array(n * 3), life = new Float32Array(n), vel = new Float32Array(n * 3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: T.spark(), color: '#ffe6a8', size: .034 * u, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); pts.frustumCulled = false; g.add(pts);
    for (let i = 0; i < n; i++) life[i] = Math.random();
    const runes = l.comps.slice(0, 4).map((text, i) => {
      const tex = T.rune(text, '#fde3cf', false, true), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, depthTest: false, fog: false }));
      sp.renderOrder = 8; const h = .105 * u; sp.scale.set(h * tex.userData.aspect, h, 1); g.add(sp); return { sp, text, idx: l.compIdx[i], a: i * PI * 2 / 4 + .6 };
    });
    scene.add(g);
    return { g, beams, halo, pts, pos, life, vel, runes, u, burst: 0, fade: 0 };
  };
  const disposeMagic = (m) => { if (!m) return; scene.remove(m.g); m.runes.forEach((r) => { r.sp.material.map.dispose(); r.sp.material.dispose(); }); m.beams.forEach((b) => { b.geometry.dispose(); b.material.dispose(); }); m.halo.material.dispose(); m.pts.geometry.dispose(); m.pts.material.dispose(); };

  const worldHome = (ref) => { const bg = ref.bay.group; bg.updateMatrixWorld(true); const p = ref.home.p.clone(); bg.localToWorld(p); const q = new THREE.Quaternion().setFromEuler(ref.home.r); const bq = new THREE.Quaternion(); bg.getWorldQuaternion(bq); return { p, q: bq.multiply(q) }; };

  const openBook = (ref) => {
    if (SC.on || busy) return; initAudio(); sfx('page');
    SC.on = true; SC.ref = ref; SC.phase = 'fly'; SC.t = 0; P.frozen = true; P.glide = null; hover = null; ui.tip(null); $('#btnNext').hidden = true; ui.drawer(null);
    const root = ref.bk.root; scene.attach(root); root.scale.setScalar(1); ref.hv = 0; ref.star.visible = false;
    SC.from = { p: root.position.clone(), q: root.quaternion.clone(), s: 1 };
    // cible : devant la caméra, décalée à gauche (la fiche occupe la droite) ou en haut (mobile)
    camera.updateMatrixWorld(); const fwd = V.a.set(0, 0, -1).applyQuaternion(camera.quaternion), right = V.b.set(1, 0, 0).applyQuaternion(camera.quaternion), up = V.c.set(0, 1, 0).applyQuaternion(camera.quaternion);
    const dist = 1.9, vh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), vw = vh * camera.aspect, narrow = innerWidth < 820;
    const panelFrac = narrow ? 0 : Math.min(.46, 460 / innerWidth), bw = ref.bk.w, bh = ref.bk.h;
    const s = Math.max(.8, Math.min(2.0, ((1 - panelFrac) * vw * .74) / (2 * bw), (narrow ? .3 : .5) * vh / bh));
    const to = camera.position.clone().addScaledVector(fwd, dist).addScaledVector(right, -(panelFrac / 2) * vw).addScaledVector(up, narrow ? vh * .17 : .02);
    const qTilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.2, 0, 0));
    SC.to = { p: to, q: camera.quaternion.clone().multiply(qTilt), s }; SC.u = s / 1.75; SC.base = { p: to.clone(), q: SC.to.q.clone() };
    SC.magic = makeMagic(ref, SC.u);
    SC.light = new THREE.PointLight('#ffe3a8', 0, 8, 1.2); scene.add(SC.light);
    L.game.award(st.opened.has(ref.id) ? 0 : 20, st.opened.has(ref.id) ? null : 'Livre ouvert', st.opened.has(ref.id) ? null : '+20 XP'); st.opened.add(ref.id); L.game.check();
  };
  const currentBook = () => (SC.on ? SC.ref : null);

  const stepShowcase = (dt, t) => {
    if (!SC.on) return;
    const ref = SC.ref, root = ref.bk.root, m = SC.magic; SC.t += dt;
    const cam = camera.position;
    const placeMagic = () => { m.g.position.copy(root.position); m.g.position.y -= .1 * SC.u; };
    if (SC.phase === 'fly') {
      const k = clamp01(SC.t / 1.0), e = ease(k);
      root.position.lerpVectors(SC.from.p, SC.to.p, e); root.position.y += Math.sin(k * PI) * .25;
      root.quaternion.slerpQuaternions(SC.from.q, SC.to.q, e); root.scale.setScalar(lerp(1, SC.to.s, e));
      SC.dim = lerp(1, .45, e); SC.light.intensity = 2.8 * e; if (k >= 1) { SC.phase = 'open'; SC.t = 0; sfx('open'); setTimeout(() => { if (SC.on && SC.phase !== 'close' && SC.phase !== 'return') ui.showBook(ref); }, 150); }
    } else if (SC.phase === 'open') {
      const k = clamp01(SC.t / 1.25); ref.bk.setOpen(k); m.fade = ease(k); if (k >= 1) { SC.phase = 'idle'; SC.t = 0; }
    } else if (SC.phase === 'idle') {
      m.fade = 1; ref.bk.setOpen(1);
    } else if (SC.phase === 'close') {
      const k = clamp01(SC.t / .85); ref.bk.setOpen(1 - ease(k)); m.fade = 1 - ease(k); if (k >= 1) { SC.phase = 'return'; SC.t = 0; const h = worldHome(ref); SC.from = { p: root.position.clone(), q: root.quaternion.clone(), s: root.scale.x }; SC.to = { p: h.p, q: h.q, s: 1 }; disposeMagic(SC.magic); SC.magic = null; sfx('page'); }
    } else if (SC.phase === 'return') {
      const k = clamp01(SC.t / .95), e = ease(k);
      root.position.lerpVectors(SC.from.p, SC.to.p, e); root.position.y += Math.sin(k * PI) * .18; root.quaternion.slerpQuaternions(SC.from.q, SC.to.q, e); root.scale.setScalar(lerp(SC.from.s, 1, e));
      SC.dim = lerp(.45, 1, e); SC.light.intensity = 2.8 * (1 - e);
      if (k >= 1) {
        ref.bay.group.attach(root); root.position.copy(ref.home.p); root.rotation.copy(ref.home.r); root.scale.setScalar(1);
        scene.remove(SC.light); SC.light.dispose && SC.light.dispose(); SC.light = null; SC.dim = 1; SC.on = false; SC.ref = null; SC.phase = null; P.frozen = false; applyReco();
      }
    }
    W.applyDim(cur, SC.dim);
    const dk = clamp01((1 - SC.dim) / .55); dimPlane.material.opacity = .72 * dk; dimPlane.visible = dk > .01;
    if (!m) return;
    // petits mouvements : flottement + inclinaison suivant le pointeur
    if (SC.phase === 'idle' || SC.phase === 'open') {
      const px = (ptr.x / innerWidth - .5), py = (ptr.y / innerHeight - .5);
      V.e.set(py * .16, px * .28, 0); V.q.setFromEuler(V.e); root.quaternion.slerp(V.q2.copy(SC.base.q).multiply(V.q), Math.min(1, dt * 4));
      root.position.copy(SC.base.p); root.position.y += Math.sin(t * 1.3) * .012 * SC.u;
    }
    placeMagic();
    SC.light.position.copy(root.position).sub(cam).normalize().multiplyScalar(-.8).add(root.position); SC.light.position.y += .35;
    const f = m.fade; m.beams.forEach((b) => { b.material.opacity = f * (.7 + .15 * Math.sin(t * 2.4)); b.scale.y = .6 + .4 * f; });
    m.halo.material.opacity = f * .42 + m.burst * .3; m.pts.material.opacity = f; m.burst = Math.max(0, m.burst - dt * .8);
    const up = V.a.set(0, 1, 0), right = V.b.set(1, 0, 0).applyQuaternion(camera.quaternion), fwd = V.c.set(0, 0, 1).applyQuaternion(camera.quaternion);
    m.runes.forEach((r, i) => {
      r.a += dt * .45; const u = m.u, rx = 1.0 * u, ry = .62 * u;
      r.sp.position.set(0, 0, 0).addScaledVector(right, Math.cos(r.a) * rx).addScaledVector(up, .22 * u + Math.sin(r.a) * ry * .55 + Math.sin(t * 1.1 + i) * .03).addScaledVector(fwd, Math.sin(r.a) * .35 * u + .2);
      r.sp.material.opacity = f * (.55 + .45 * (Math.sin(r.a) * .5 + .5)) * (r.hit ? 1 : .92);
    });
    const { pos, life, vel, pts } = m, n = life.length, rate = 1 + m.burst * 5;
    for (let i = 0; i < n; i++) {
      life[i] += dt * .35 * rate; if (life[i] >= 1) { life[i] = 0; pos[i * 3] = (Math.random() - .5) * 1.0 * m.u; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = (Math.random() - .5) * .3 * m.u; vel[i * 3] = (Math.random() - .5) * .25; vel[i * 3 + 1] = .35 + Math.random() * .7; vel[i * 3 + 2] = (Math.random() - .5) * .2; }
      pos[i * 3] += vel[i * 3] * dt * m.u; pos[i * 3 + 1] += vel[i * 3 + 1] * dt * m.u; pos[i * 3 + 2] += vel[i * 3 + 2] * dt * m.u;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  };

  const closeBook = () => {
    if (!SC.on || SC.phase === 'close' || SC.phase === 'return' || SC.phase === 'fly') return;
    ui.hideBook(); SC.phase = 'close'; SC.t = 0; sfx('page');
  };
  const matchBook = (ref) => {
    if (!SC.on || SC.ref !== ref || !SC.magic) return; const l = ref.livre, m = SC.magic;
    ui.renderMatch(ref); sfx('chime'); m.burst = 1;
    m.runes.forEach((r, i) => { const covers = l.theme.fc.c.some(([, via]) => via.includes(r.idx)); if (covers) { setTimeout(() => { if (!SC.magic) return; r.sp.material.map.dispose(); r.sp.material.map = T.rune('✓ ' + r.text, '#ffd36a', false, true); r.sp.material.needsUpdate = true; r.hit = true; const h = .105 * m.u, a = r.sp.material.map.userData.aspect; r.sp.scale.set(h * a, h, 1); m.burst = Math.max(m.burst, .6); }, 700 + i * 350); } });
    if (!st.matched.has(l.id)) { st.matched.add(l.id); L.game.award(30, 'Passerelle établie', 'Livre relié à France compétences · +30 XP'); L.game.check(); }
  };

  /* ====================================================================================== */
  /*  API de l'application                                                                   */
  /* ====================================================================================== */

  const app = L.app = {
    sfx, currentBook, closeBook, match: matchBook,
    onFilter() { if (hall) syncPortals(); },
    onReco() { applyReco(); },
    openFilter() { if (busy || SC.on || mode === 'attract') return; ui.drawer(null); ui.showGate('filter'); P.frozen = true; ui.tip(null); },
    closeGate() { ui.hideGate(); if (!SC.on) P.frozen = false; L.save(); syncPortals(); if (cur.kind === 'rayon' && !st.sel.has(cur.dom.id)) leaveRayon(); applyReco(); },
    enter(opts = {}) {
      if (!st.sel.size) return; initAudio(); sfx('chime');
      if (mode === 'attract') {
        mode = 'play'; ui.hideGate(); $('#hud').hidden = false; camera.clearViewOffset(); syncPortals(); busy = true;
        glideTo(hall.spawn, 2.2, () => { busy = false; P.frozen = false; crumbHall(); ui.hint('Cliquez une porte pour entrer dans un rayon · le lutrin ouvre le Bibliothécaire'); ui.toast('Bienvenue à la Bibliothèque', 'Glissez pour regarder, ZQSD ou flèches pour marcher.'); if (opts.goto) app.goToBook(opts.goto); });
        crumbHall();
      } else { app.closeGate(); if (opts.goto) app.goToBook(opts.goto); }
    },
    toggleSound() { st.sound = !st.sound; L.save(); if (audio.master) audio.master.gain.value = st.sound ? .55 : 0; $('#btnSound').classList.toggle('off', !st.sound); ui.toast(st.sound ? 'Son activé' : 'Son coupé'); initAudio(); },
    goToBook(l) {
      if (busy) return; if (SC.on) { closeBook(); return setTimeout(() => app.goToBook(l), 1900); }
      if (ui.gateOpen()) ui.hideGate();
      if (!st.sel.has(l.dom.id)) { st.sel.add(l.dom.id); L.save(); ui.refreshGate(); syncPortals(); ui.toast('Rayon ouvert', l.dom.nom); }
      st.reco = new Set([l.id]);
      const arrive = () => { const bay = cur.bays[l.theme.index]; applyReco(); glideTo(bay.stand, 1.5, () => { crumbRayon(bay); const ref = bay.books[l.slot]; ref.flash = 3; ui.toast(l.titre, 'Le voici, signalé par une étoile.'); }); };
      if (cur.kind === 'rayon' && cur.dom === l.dom) arrive(); else if (cur.kind === 'rayon') leaveRayon(() => enterRayon(l.dom, { then: arrive })); else enterRayon(l.dom, { then: arrive });
    },
    nextReco() {
      if (busy || SC.on || mode !== 'play') return;
      if (cur.kind !== 'rayon') { const p = hall.portals.find((q) => q.open && q.pulse); if (p) approachPortal(p); else ui.toast('Pas encore de recommandation', 'Choisissez un profil ou décrivez un besoin dans « Rayons ».'); return; }
      const list = cur.books.filter((b) => st.reco.has(b.id)); if (!list.length) return ui.toast('Aucune recommandation ici', 'Cherchez un thème dans la barre du bas.');
      app.nextIdx = ((app.nextIdx == null ? -1 : app.nextIdx) + 1) % list.length; const ref = list[app.nextIdx];
      glideTo(ref.bay.stand, 1.3, () => { crumbRayon(ref.bay); ref.flash = 3; });
    },
  };

  /* ====================================================================================== */
  /*  Mini-plan                                                                              */
  /* ====================================================================================== */

  const mini = $('#mini'), mg = mini.getContext('2d');
  const drawMini = () => {
    if ($('#hud').hidden) return; const S = mini.width, R = cur; mg.clearRect(0, 0, S, S);
    mg.save(); mg.fillStyle = 'rgba(24,6,6,.72)'; mg.beginPath(); mg.arc(S / 2, S / 2, S / 2 - 2, 0, 7); mg.fill(); mg.strokeStyle = 'rgba(249,166,108,.5)'; mg.lineWidth = 3; mg.stroke(); mg.clip();
    const arrow = (x, y) => { const fa = Math.atan2(-Math.cos(P.yaw), -Math.sin(P.yaw)); mg.save(); mg.translate(x, y); mg.rotate(fa); mg.fillStyle = '#fff'; mg.beginPath(); mg.moveTo(14, 0); mg.lineTo(-9, -9); mg.lineTo(-4, 0); mg.lineTo(-9, 9); mg.closePath(); mg.fill(); mg.strokeStyle = '#ff0000'; mg.lineWidth = 3; mg.stroke(); mg.restore(); };
    if (R.kind === 'hall') {
      const sc = (S / 2 - 26) / 10.6, cx = S / 2, cy = S / 2;
      mg.strokeStyle = 'rgba(243,210,122,.5)'; mg.lineWidth = 2; mg.beginPath(); mg.arc(cx, cy, 10 * sc, 0, 7); mg.stroke();
      mg.fillStyle = 'rgba(243,210,122,.7)'; mg.beginPath(); mg.arc(cx, cy, 1.5 * sc, 0, 7); mg.fill();
      R.portals.forEach((p) => { const x = cx + Math.sin(p.phi) * 10 * sc, y = cy + Math.cos(p.phi) * 10 * sc; mg.fillStyle = p.open ? p.dom.lueur : '#5a4a4a'; mg.beginPath(); mg.arc(x, y, 15, 0, 7); mg.fill(); mg.fillStyle = '#1a0606'; mg.font = `700 ${p.dom.glyph.length > 1 ? 13 : 19}px serif`; mg.textAlign = 'center'; mg.textBaseline = 'middle'; mg.fillText(p.dom.glyph, x, y + 1); });
      arrow(cx + P.x * sc, cy + P.z * sc);
    } else {
      const sc = (S - 40) / 26, cx = S / 2, cy = S / 2; mg.translate(cx, cy);
      mg.strokeStyle = 'rgba(243,210,122,.55)'; mg.lineWidth = 2; mg.strokeRect(-9 * sc, -13 * sc, 18 * sc, 26 * sc);
      mg.fillStyle = 'rgba(243,210,122,.25)'; mg.fillRect(-.75 * sc, -6.1 * sc, 1.5 * sc, 5.4 * sc);
      R.bays.forEach((b) => { const c = b.cfg, near = Math.hypot(P.x - b.stand.x, P.z - b.stand.z) < 2; mg.save(); mg.translate(c.pos[0] * sc, c.pos[1] * sc); mg.rotate(-c.psi); mg.fillStyle = near ? '#fff' : R.dom.lueur; mg.fillRect(-b.w / 2 * sc, -3, b.w * sc, 9); mg.restore(); });
      mg.fillStyle = '#ffd36a'; mg.fillRect(-1.8 * sc, 13 * sc - 6, 3.6 * sc, 8);
      arrow(P.x * sc, P.z * sc);
    }
    mg.restore();
  };
  mini.addEventListener('click', (e) => {
    if (mode !== 'play' || busy || SC.on) return; const r = mini.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * mini.width, y = (e.clientY - r.top) / r.height * mini.height, S = mini.width;
    if (cur.kind === 'hall') { const sc = (S / 2 - 26) / 10.6; let best = null, bd = 40; cur.portals.forEach((p) => { const d = Math.hypot(S / 2 + Math.sin(p.phi) * 10 * sc - x, S / 2 + Math.cos(p.phi) * 10 * sc - y); if (d < bd) { bd = d; best = p; } }); if (best) { if (best.open) approachPortal(best); else click(0, 0); } }
    else { const sc = (S - 40) / 26; let best = null, bd = 50; cur.bays.forEach((b) => { const d = Math.hypot(S / 2 + b.cfg.pos[0] * sc - x, S / 2 + b.cfg.pos[1] * sc - y); if (d < bd) { bd = d; best = b; } }); if (best) glideTo(best.stand, 1.3, () => crumbRayon(best)); }
  });

  /* ====================================================================================== */
  /*  Boucle                                                                                 */
  /* ====================================================================================== */

  const resize = () => {
    const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1 ? 74 : 62; camera.updateProjectionMatrix();
    const ph = 2 * 2.5 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.15; dimPlane.scale.set(ph * camera.aspect, ph, 1);
    if (mode === 'attract' && w > 900) camera.setViewOffset(w, h, -w * .17, 0, w, h);
  };
  addEventListener('resize', resize);

  let last = performance.now(), crumbT = 0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000) * (L.debug ? L.debug.fast : 1); last = now; time += dt;
    if (mode === 'attract' && !P.glide) { const a = time * .07 + 2.2; P.x = Math.sin(a) * 6.2; P.z = Math.cos(a) * 6.2; P.yaw = a; P.pitch = -.14; } else stepPlayer(dt);
    P.lift = (P.lift || 0) + ((mode === 'attract' ? .6 : 0) - (P.lift || 0)) * Math.min(1, dt * 2.5);
    camera.position.set(P.x, 1.65 + Math.sin(P.bob) * .035 + P.lift, P.z);
    camera.rotation.set(P.pitch, P.yaw, 0);
    cur.update(dt, time);
    if (cur.kind === 'rayon') {
      cur.books.forEach((b) => {
        const hv = hover && hover.kind === 'book' && hover.ref === b ? 1 : 0; b.hv = (b.hv || 0) + (hv - (b.hv || 0)) * Math.min(1, dt * 10);
        if (SC.ref !== b) { b.bk.root.scale.setScalar(1 + b.hv * .06 + (b.flash > 0 ? .03 * Math.sin(time * 8) : 0)); b.bk.root.position.z = b.home.p.z + b.hv * .06; }
        if (b.flash > 0) { b.flash -= dt; b.halo.material.opacity = .6; }
      });
      crumbT += dt; if (crumbT > .4 && mode === 'play' && !busy) { crumbT = 0; const nb = cur.bays.find((b) => Math.hypot(P.x - b.stand.x, P.z - b.stand.z) < 2.2); const key = nb ? nb.ti : -1; if (app.lastBay !== key) { app.lastBay = key; crumbRayon(nb); } }
    }
    if (ptr.dirty || (hover && hover.kind)) { ptr.dirty = false; updateHover(); }
    stepShowcase(dt, time);
    drawMini();
    renderer.render(scene, camera);
  };

  /* ---------- démarrage ---------- */
  hall = W.buildHall(ctx3); scene.add(hall.group); cur = hall;
  hall.update(0, 0); syncPortals(true);
  resize();
  ui.showGate('intro'); ui.refreshGate(); $('#btnSound').classList.toggle('off', !st.sound);
  requestAnimationFrame((t) => { last = t; frame(t); });

  /* accès de debug / tests automatisés */
  L.debug = { fast: 1, hall: () => hall, cur: () => cur, P, camera, scene, renderer, enterRayon, leaveRayon, openBook, closeBook, setPose, glideTo, state: () => ({ mode, busy, SC: { on: SC.on, phase: SC.phase } }), pick };
})();
