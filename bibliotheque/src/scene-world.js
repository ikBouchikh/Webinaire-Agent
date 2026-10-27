/* Monde 2 : six univers contemporains, chauds et tactiles (microciment, bois clair, plâtre clay, verre).
   Même gabarit pour tous : une salle en longueur, un mur-écran en dégradé tone sur tone, un « accueil » avec
   l'installation de l'univers, puis une station par domaine (en-tête à la forme récurrente + vitrine de produits).
   Les produits vitrines et les intitulés viennent du catalogue ; rien n'est écrit à la main. */

(function () {
  'use strict';
  const L = window.LDC, S = L.S, T = L.tex, C = L.C, PI = Math.PI;
  const { mesh, box, scaleUV } = S.h;
  const SP = S.WORLD_SP = 6.2, RZ0 = S.WORLD_Z0 = -6, RH = 4.8, BAND = 3.0;

  const std = (o) => new THREE.MeshStandardMaterial(o);
  const tube = (pts, col, rad = .012, seg = 48) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, rad, 6), new THREE.MeshBasicMaterial({ color: col }));
  const lerpCol = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
  const tagTex = (text, A, w = 512, h = 224) => {
    const [c, g] = T.mk(w, h); g.clearRect(0, 0, w, h); g.fillStyle = C.clay1; T.brand(g, 4, 4, w - 8, h - 8, 28); g.fill();
    g.save(); T.brand(g, 4, 4, w - 8, h - 8, 28); g.clip(); g.fillStyle = A.main; g.fillRect(0, 0, 14, h); g.restore();
    g.fillStyle = C.redInk; g.font = `500 ${h * .2}px ${L.MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; T.spaced(g, 2); g.fillText(text.toUpperCase(), w / 2 + 6, h / 2 + 4, w - 60); T.spaced(g, 0);
    return T.tex(c, { own: true });
  };
  const faceMat = (map) => new THREE.MeshBasicMaterial({ map, transparent: true, side: THREE.DoubleSide });
  const flat = (w, h, r, map, pick) => { const m = mesh(S.brandFace(w, h, r), faceMat(map)); if (pick) m.userData.pick = pick; return m; };

  /* ====================== installations d'accueil, une par univers ====================== */

  const HERO = {
    /* Droit — la chambre des sources : textes, jurisprudence, doctrine, reliés par une chaîne de preuve. */
    droit(g, A) {
      const pal = [C.clay1, C.clay4, C.redDeep, C.clay3, C.clay1, C.clay5];
      const dais = mesh(new THREE.CylinderGeometry(2.9, 3.0, .12, 64), std({ color: C.clay3, roughness: .8 }), true); dais.position.set(0, .06, -4.0); g.add(dais);
      for (let i = 0; i < 13; i++) {
        const a = (i / 12 - .5) * 2.1, h = 1.7 + 1.3 * Math.cos(a * 1.3) , col = i === 6 ? A.main : pal[i % pal.length], s = box(.36, h, .17, std({ color: col, roughness: .68 }), true);
        s.position.set(Math.sin(a) * 3.5, h / 2 + .12, -5.4 + (1 - Math.cos(a)) * 2.0); s.rotation.y = -a * .55; g.add(s);
      }
      const labels = ['Textes', 'Jurisprudence', 'Doctrine', 'Pratique'], pts = [];
      labels.forEach((t, i) => { const x = (i - 1.5) * 1.55, y = 2.0 + (i % 2) * .45, p = flat(1.2, .52, .1, tagTex(t, A)); p.position.set(x, y, -3.5); g.add(p); pts.push(new THREE.Vector3(x, y, -3.46)); });
      g.add(tube(pts, A.main, .014, 40));
      pts.forEach((p) => { const n = mesh(new THREE.SphereGeometry(.05, 12, 10), new THREE.MeshBasicMaterial({ color: A.main })); n.position.copy(p).add(new THREE.Vector3(0, -.36, 0)); g.add(n); });
    },

    /* Chiffre — l'observatoire des décisions : la table et ses disques de verre, entourés d'anneaux et d'un graphique en barres. */
    chiffre(g, A) {
      const ch = S.buildChiffre({ kind: 'decor' }); ch.group.position.set(0, 0, -4.1); g.add(ch.group); g.userData.discs = ch.discs;
      [1.9, 2.5, 3.1].forEach((rad, i) => { const t = mesh(new THREE.TorusGeometry(rad, .014 + i * .004, 6, 96), new THREE.MeshStandardMaterial({ color: '#C5CBD0', metalness: .9, roughness: .3 })); t.rotation.x = PI / 2; t.position.set(0, .03, -4.1); g.add(t); });
      const r = T.rng(5), tops = [];
      for (let i = 0; i < 11; i++) { const h = 1.0 + r() * 2.2 + i * .1, b = box(.3, h, .16, std({ color: lerpCol(A.main, C.clay4, .15 + r() * .55), roughness: .6 }), true); b.position.set((i - 5) * .6, h / 2 + .1, -5.7); g.add(b); tops.push(new THREE.Vector3((i - 5) * .6, h + .22, -5.55)); }
      g.add(tube(tops, C.red, .016, 60));
    },

    /* RH, Paie & Social — la constellation des talents : des personnes (nœuds) reliées entre elles. */
    rh(g, A) {
      const r = T.rng(21), pts = [], mats = [C.ocre, C.clay4, C.red, C.clay1, C.ocreDeep, C.clay5].map((c) => std({ color: c, roughness: .55 }));
      const dais = mesh(new THREE.CylinderGeometry(2.8, 2.9, .1, 64), std({ color: C.clay3, roughness: .8 }), true); dais.position.set(0, .05, -4.3); g.add(dais);
      for (let i = 0; i < 32; i++) { const p = i ? new THREE.Vector3((r() - .5) * 7, 1.2 + r() * 2.7, -5.6 + r() * 2.2) : new THREE.Vector3(0, 2.4, -4.5); pts.push(p); const n = mesh(new THREE.SphereGeometry(i ? .1 + r() * .12 : .34, 20, 14), mats[i ? i % mats.length : 0], true); n.position.copy(p); g.add(n); }
      const seg = []; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (pts[i].distanceTo(pts[j]) < 1.75) seg.push(pts[i], pts[j]);
      g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seg), new THREE.LineBasicMaterial({ color: '#7A4A38', transparent: true, opacity: .55 })));
      for (let i = 0; i < 7; i++) { const c = mesh(S.brandBody(.3, .4, .05, .03), std({ color: i % 2 ? C.clay1 : C.clay4, roughness: .6 }), true); const p = pts[1 + i * 3]; c.position.copy(p).add(new THREE.Vector3(-.15, .2, 0)); c.rotation.y = (r() - .5) * .6; g.add(c); }
    },

    /* QSE — la salle des risques et des impacts : matrice probabilité × gravité et ondes d'impact au sol. */
    qse(g, A) {
      const sz = .62, gp = .07;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
        const s = (i + j) / 8, col = s < .5 ? lerpCol(C.blue, C.clay3, s * 2) : lerpCol(C.clay3, C.ocreDeep, (s - .5) * 2), hot = s > .85 ? lerpCol(col, C.red, .6) : col;
        const t = box(sz, sz, .05 + s * .16, std({ color: hot, roughness: .6 }), true); t.position.set((i - 2) * (sz + gp), 1.45 + j * (sz + gp), -5.45 + t.geometry.parameters.depth / 2); g.add(t);
      }
      const frame = box(5 * (sz + gp) + .2, .05, .3, new THREE.MeshStandardMaterial({ color: '#C5CBD0', metalness: .9, roughness: .3 })); frame.position.set(0, 1.28, -5.4); g.add(frame);
      const ax = (txt, x, y, ry) => { const p = flat(1.5, .34, .06, tagTex(txt, A, 512, 120)); p.position.set(x, y, -5.38); p.rotation.z = ry; g.add(p); };
      ax('Probabilité', 0, 1.0, 0); ax('Gravité', -2.35, 2.9, PI / 2);
      [[1.1, C.red], [1.9, C.ocre], [2.7, C.blue]].forEach(([rad, col], i) => { const t = mesh(new THREE.TorusGeometry(rad, .03, 8, 96), new THREE.MeshBasicMaterial({ color: col })); t.rotation.x = PI / 2; t.position.set(0, .025, -3.4); g.add(t); });
    },

    /* Service public — la cartographie des missions : relief hexagonal d'un territoire, missions repérées et reliées. */
    public(g, A) {
      const r = T.rng(31), top = .5, base = mesh(new THREE.CylinderGeometry(3.3, 3.4, top, 72), std({ map: T.ashWood(), roughness: .6 }), true); base.position.set(0, top / 2, -4.2); g.add(base);
      const pal = [C.clay1, C.clay3, C.clay4, C.clay5, C.clay2], s = .4, hl = [], tiles = [];
      for (let q = -3; q <= 3; q++) for (let rr = -3; rr <= 3; rr++) {
        if (Math.abs(q + rr) > 3) continue;
        const h = .06 + r() * .34, x = s * Math.sqrt(3) * (q + rr / 2), z = s * 1.5 * rr, hx = mesh(new THREE.CylinderGeometry(s * .95, s * .95, h, 6), std({ color: pal[(r() * pal.length) | 0], roughness: .7 }), true);
        hx.rotation.y = PI / 6; hx.position.set(x, top + h / 2, -4.2 + z); g.add(hx); tiles.push({ x, z, h });
      }
      [3, 11, 19, 27, 33].forEach((i, k) => { const t = tiles[i % tiles.length], col = [C.red, C.ocre, C.blue, C.red, C.ocre][k]; const pin = mesh(new THREE.CylinderGeometry(.018, .018, .7, 8), new THREE.MeshBasicMaterial({ color: col })); pin.position.set(t.x, top + t.h + .35, -4.2 + t.z); g.add(pin); const hd = mesh(new THREE.SphereGeometry(.09, 14, 12), new THREE.MeshBasicMaterial({ color: col })); hd.position.set(t.x, top + t.h + .72, -4.2 + t.z); g.add(hd); hl.push(new THREE.Vector3(t.x, top + t.h + .72, -4.2 + t.z)); });
      for (let i = 0; i < hl.length - 1; i++) { const a = hl[i], b = hl[i + 1], mid = a.clone().lerp(b, .5).add(new THREE.Vector3(0, .55, 0)); g.add(tube([a, mid, b], A.main, .012, 24)); }
    },

    /* Management, Soft skills & Numérique — l'arène de situations : gradins, cartes de situation autour d'un pupitre. */
    mgmt(g, A) {
      const r = T.rng(41), woods = [std({ map: T.ashWood(), roughness: .6 }), std({ color: C.clay3, roughness: .8 }), std({ color: C.clay4, roughness: .8 })];
      [[2.9, .16], [2.3, .32], [1.7, .48]].forEach(([rad, h], i) => { const c = mesh(new THREE.CylinderGeometry(rad, rad + .04, h, 72), woods[i], true); c.position.set(0, h / 2, -4.2); g.add(c); });
      const ped = mesh(new THREE.CylinderGeometry(.5, .56, .9, 32), woods[0], true); ped.position.set(0, .48 + .45, -4.2); g.add(ped);
      const cen = flat(.9, 1.2, .1, tagTex('Situation', A, 384, 512), null); cen.position.set(0, 1.9, -4.15); g.add(cen);
      const cols = [A.main, C.clay4, C.ocre, C.clay1, C.red, C.clay5];
      for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2, rad = 2.55, w = .5, h = .66, x = Math.sin(a) * rad, z = -4.2 + Math.cos(a) * rad; const c = new THREE.Group(); c.position.set(x, .16 + h / 2, z); c.rotation.y = a + PI; const body = mesh(S.brandBody(w, h, .06, .04), std({ color: cols[i % cols.length], roughness: .6 }), true); body.position.z = -.02; c.add(body); g.add(c); }
    },
  };

  /* ====================================================================================== */
  /*  Une station : en-tête (forme récurrente) + plinthe + vitrine de quatre produits        */
  /* ====================================================================================== */

  const buildStation = (st, monde, x, ctx) => {
    const g = new THREE.Group(); g.position.set(x, 0, RZ0);
    const body = mesh(S.brandBody(3.4, 1.7, .18, .06), std({ color: C.clay3, roughness: .8 }), true); body.position.set(0, 3.1, -.02); g.add(body);
    const hdr = mesh(S.brandFace(3.4, 1.7, .18), new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide })); hdr.position.set(0, 3.1, .05); hdr.userData.pick = { kind: 'station', st }; g.add(hdr);
    const plinth = box(5.4, .7, .95, ctx.ash, true); plinth.position.set(0, .35, .9); g.add(plinth);
    const slab = box(5.6, .07, 1.1, ctx.top, true); slab.position.set(0, .735, .9); g.add(slab);
    const cards = [], n = st.vitrine.length, tilt = -.14, CW = 1.06, CH = 1.45;
    st.vitrine.forEach((p, i) => {
      const cx = (i - (n - 1) / 2) * 1.3, cg = new THREE.Group(); cg.position.set(cx, .77 + CH / 2 * Math.cos(tilt), .98); cg.rotation.x = tilt;
      const b = mesh(S.brandBody(CW, CH, .08, .04), std({ color: C.clay3, roughness: .6 }), true); b.position.z = -.045; cg.add(b);
      const f = mesh(S.brandFace(CW, CH, .08), new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide })); f.position.z = .03; cg.add(f);
      const pk = { kind: 'product', p, st }; [b, f].forEach((o) => { o.userData.pick = pk; });
      const foot = box(.8, .035, .16, ctx.bronze); foot.position.set(cx, .78, 1.04); g.add(foot);
      const mark = mesh(new THREE.CircleGeometry(.12, 24), new THREE.MeshBasicMaterial({ map: T.check(), transparent: true })); mark.position.set(.38, .64, .07); mark.visible = false; cg.add(mark);
      g.add(cg); cards.push({ p, group: cg, face: f, mark, home: cg.position.clone(), hv: 0, anchor: new THREE.Vector3(x + cx, 1.55, RZ0 + 1.0), pk });
    });
    const ref = { st, x, group: g, hdr, cards, loaded: false, anchorHdr: new THREE.Vector3(x, 3.1, RZ0 + .1) };
    return ref;
  };
  const loadStation = (ref, monde) => {
    if (ref.loaded) return; ref.loaded = true;
    ref.hdr.material.map = T.stationHeader(ref.st, monde); ref.hdr.material.needsUpdate = true;
    ref.cards.forEach((c) => { c.face.material.map = T.carnet(c.p, monde); c.face.material.needsUpdate = true; });
  };
  const unloadStation = (ref) => {
    if (!ref.loaded) return; ref.loaded = false;
    [ref.hdr].concat(ref.cards.map((c) => c.face)).forEach((m) => { if (m.material.map) { m.material.map.dispose(); m.material.map = null; m.material.needsUpdate = true; } });
  };

  /* ====================================================================================== */

  S.buildWorld = (monde) => {
    const A = monde.accentCfg, n = monde.stations.length, g = new THREE.Group(), R = { group: g, kind: 'world', monde, pickables: [], stations: [], P: [0] };
    const len = (n + 1) * SP, x0 = -9, x1 = n * SP + 9, W = x1 - x0, xc = (x0 + x1) / 2;
    const tint = { red: ['#D6C4B4', '#E4D6C8'], blue: ['#CBC7C1', '#DFDCD6'], ocre: ['#D9C4AC', '#E8DAC6'] }[monde.accent] || ['#D6C4B4', '#E4D6C8'];
    const ctx = { ash: std({ map: T.ashWood(), roughness: .6 }), top: std({ color: C.clay1, roughness: .55 }), bronze: std({ color: C.bronze, metalness: .8, roughness: .35 }) };

    const floor = mesh(scaleUV(new THREE.PlaneGeometry(W, 12), W / 6, 2), std({ map: T.microcement(tint[0]), roughness: .5, metalness: .02, envMapIntensity: .35 })); floor.rotation.x = -PI / 2; floor.position.set(xc, 0, -.5); floor.receiveShadow = true; g.add(floor);
    const wallLow = mesh(scaleUV(new THREE.PlaneGeometry(W, BAND), W / 4, 1), std({ map: T.plaster(tint[1]), roughness: .95, envMapIntensity: .35 })); wallLow.position.set(xc, BAND / 2, RZ0); g.add(wallLow);
    const sc = T.screen(monde); sc.wrapS = THREE.RepeatWrapping; sc.repeat.set(W / 14, 1);
    const band = mesh(new THREE.PlaneGeometry(W, RH - BAND), new THREE.MeshBasicMaterial({ map: sc })); band.position.set(xc, BAND + (RH - BAND) / 2, RZ0 + .01); g.add(band);
    const ledge = box(W, .08, .12, std({ color: A.main, roughness: .5 })); ledge.position.set(xc, BAND, RZ0 + .06); g.add(ledge);
    const skirt = box(W, .12, .04, std({ color: A.deep, roughness: .6 })); skirt.position.set(xc, .06, RZ0 + .02); g.add(skirt);
    const ceil = mesh(new THREE.PlaneGeometry(W, 12), std({ color: C.clay1, roughness: .95 })); ceil.rotation.x = PI / 2; ceil.position.set(xc, RH, -.5); g.add(ceil);
    [-3, 1.6].forEach((z) => { const strip = box(W - 2, .03, .22, new THREE.MeshBasicMaterial({ color: '#FFF6EA' })); strip.position.set(xc, RH - .02, z); g.add(strip); });
    [x0, x1].forEach((x, i) => { const w = mesh(new THREE.PlaneGeometry(12, RH), std({ map: T.plaster(tint[1]), roughness: .95 })); w.rotation.y = i ? -PI / 2 : PI / 2; w.position.set(x, RH / 2, -.5); g.add(w); });
    const front = mesh(new THREE.PlaneGeometry(W, RH), std({ color: tint[1], roughness: .95 })); front.rotation.y = PI; front.position.set(xc, RH / 2, 5.6); g.add(front);

    /* accueil de l'univers (installation), légèrement réduite et reculée */
    const hg = new THREE.Group(); hg.scale.setScalar(.85); hg.position.z = -.75; g.add(hg); HERO[monde.id](hg, A); g.userData.discs = hg.userData.discs;

    /* stations */
    monde.stations.forEach((st, i) => { const ref = buildStation(st, monde, (i + 1) * SP, ctx); g.add(ref.group); R.stations.push(ref); R.P.push(ref.x); ref.group.traverse((o) => { if (o.userData.pick) R.pickables.push(o); }); });

    /* lumière : pas d'ombres portées (lecture nette, rendu plus léger), éclairage doux et neutre */
    const sun = new THREE.DirectionalLight('#FFF4E8', .5);
    g.add(sun); g.add(sun.target); R.sun = sun;
    g.add(new THREE.HemisphereLight('#FFF5EA', '#A89080', .42));
    R.focus = (x) => { sun.position.set(x + 4, 10, RZ0 + 12); sun.target.position.set(x, 1.5, RZ0); sun.target.updateMatrixWorld(); };
    R.focus(0);

    R.ensure = (x) => { R.stations.forEach((s) => { const d = Math.abs(s.x - x); if (d < SP * 1.6) loadStation(s, monde); else if (d > SP * 3.2) unloadStation(s); }); };
    R.ensure(0);
    R.update = (dt, t, reduced) => {
      if (!reduced && g.userData.discs) g.userData.discs.forEach((d, i) => { d.rotation.y += dt * (.05 + i * .02); });
    };
    R.syncSelection = (has) => R.stations.forEach((s) => s.cards.forEach((c) => { c.mark.visible = has(c.p.c); }));
    R.railLen = len;
    return R;
  };
})();
