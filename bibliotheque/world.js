/* Les lieux : la Grande Nef (rotonde à six portes, une par domaine) et les rayons (une salle par domaine,
   cinq travées = cinq thématiques, quatre grands livres exposés par travée = quatre produits de formation). */

(function () {
  const L = window.LDC, T = L.tex, B = L.BRAND;
  const W = L.world = {};
  const PI = Math.PI;
  const rotXZ = (x, z, psi) => ({ x: x * Math.cos(psi) + z * Math.sin(psi), z: z * Math.cos(psi) - x * Math.sin(psi) });
  W.rotXZ = rotXZ;

  /* ---------- ressources partagées (jamais libérées) ---------- */
  const keep = new Set();
  let S = null;
  const shared = () => {
    if (S) return S;
    const k = (o) => { keep.add(o); return o; };
    S = {
      woodDark: k(new THREE.MeshStandardMaterial({ map: T.wood('dark', '#3a1d0e', 3), roughness: .8 })),
      woodMid: k(new THREE.MeshStandardMaterial({ map: T.wood('mid', '#5a3418', 9), roughness: .75 })),
      woodWarm: k(new THREE.MeshStandardMaterial({ map: T.wood('warm', '#74461f', 14), roughness: .7 })),
      stone: k(new THREE.MeshStandardMaterial({ map: T.stone(), roughness: .95 })),
      brass: k(new THREE.MeshStandardMaterial({ color: '#c99a3a', metalness: .85, roughness: .35 })),
      candle: k(new THREE.MeshStandardMaterial({ color: '#f4ead0', roughness: .8, emissive: '#5a4a28' })),
      flame: k(new THREE.SpriteMaterial({ map: T.flame(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })),
      glow: k(new THREE.SpriteMaterial({ map: T.glow(), color: '#ffb060', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .55 })),
      spine: k(new THREE.MeshStandardMaterial({ map: T.spine(), roughness: .7 })),
      boxGeo: k(new THREE.BoxGeometry(1, 1, 1)),
      candleGeo: k(new THREE.CylinderGeometry(.045, .05, .34, 10)),
      unitBook: k((() => { const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, .5, 0); return g; })()),
    };
    return S;
  };
  W.isShared = (o) => keep.has(o);

  const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
  const box = (w, h, d, mat) => mesh(new THREE.BoxGeometry(w, h, d), mat);
  const glowSprite = (color, size, opacity = .5) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity }));
    s.scale.set(size, size, 1); return s;
  };
  const scaleUV = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
  const archShape = (w, h) => {
    const s = new THREE.Shape(), r = w / 2, hs = h - r;
    s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, hs); s.absarc(0, hs, r, 0, PI, false); s.lineTo(-r, 0); return s;
  };
  const archGeo = (w, h) => {
    const g = new THREE.ShapeGeometry(archShape(w, h), 24); const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, p.getY(i) / h);
    return g;
  };
  const hitPlane = (w, h, pick) => {
    const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); m.visible = false; m.userData.pick = pick; return m;
  };
  const tooLit = (m) => { m.material.toneMapped = false; return m; };

  W.disposeGroup = (g) => {
    g.traverse((o) => {
      if (o.geometry && !keep.has(o.geometry)) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => { if (!keep.has(m)) m.dispose(); });
    });
  };

  /* ---------- briques décoratives ---------- */

  const candle = (opts = {}) => {
    const s = shared(), g = new THREE.Group();
    const c = mesh(s.candleGeo, s.candle); g.add(c);
    const f = new THREE.Sprite(s.flame); f.position.y = .3; f.scale.set(.14, .28, 1); g.add(f);
    const gl = new THREE.Sprite(s.glow); gl.position.y = .3; gl.scale.set(opts.halo || .9, opts.halo || .9, 1); g.add(gl);
    g.userData = { f, gl, ph: Math.random() * 6.28 };
    return g;
  };

  const chandelier = (R, n, drop) => {
    const s = shared(), g = new THREE.Group();
    const ring = mesh(new THREE.TorusGeometry(R, .045, 8, 48), s.brass); ring.rotation.x = PI / 2; g.add(ring);
    const ring2 = mesh(new THREE.TorusGeometry(R * .55, .035, 8, 32), s.brass); ring2.rotation.x = PI / 2; ring2.position.y = .35; g.add(ring2);
    const chain = mesh(new THREE.CylinderGeometry(.02, .02, drop, 6), s.brass); chain.position.y = drop / 2 + .35; g.add(chain);
    const candles = [];
    for (let i = 0; i < n; i++) { const a = i / n * PI * 2; const c = candle({ halo: 1.1 }); c.position.set(Math.cos(a) * R, .2, Math.sin(a) * R); c.scale.setScalar(.8); g.add(c); candles.push(c); }
    for (let i = 0; i < n / 2; i++) { const a = (i + .5) / (n / 2) * PI * 2; const c = candle({ halo: .8 }); c.position.set(Math.cos(a) * R * .55, .55, Math.sin(a) * R * .55); c.scale.setScalar(.7); g.add(c); candles.push(c); }
    g.userData.candles = candles; return g;
  };

  const lamp = () => {
    const s = shared(), g = new THREE.Group();
    const base = mesh(new THREE.CylinderGeometry(.09, .11, .04, 14), s.brass); g.add(base);
    const stem = mesh(new THREE.CylinderGeometry(.015, .015, .3, 8), s.brass); stem.position.y = .17; g.add(stem);
    const shade = mesh(new THREE.CylinderGeometry(.07, .15, .12, 16, 1, true, 0, PI), new THREE.MeshStandardMaterial({ color: '#1f7a46', emissive: '#0c3a20', roughness: .4, side: THREE.DoubleSide }));
    shade.rotation.set(PI / 2 - .5, 0, 0); shade.position.set(0, .34, .02); g.add(shade);
    const gl = glowSprite('#ffc070', .75, .55); gl.position.set(0, .22, .12); g.add(gl);
    return g;
  };

  const desk = (len = 1.8, dep = .95) => {
    const s = shared(), g = new THREE.Group();
    const top = box(len, .07, dep, s.woodWarm); top.position.y = .77; g.add(top);
    const edge = box(len + .04, .02, dep + .04, s.brass); edge.position.y = .74; g.add(edge);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = box(.08, .74, .08, s.woodDark); l.position.set(a * (len / 2 - .08), .37, b * (dep / 2 - .08)); g.add(l); });
    const apron = box(len - .1, .12, dep - .1, s.woodDark); apron.position.y = .68; g.add(apron);
    return g;
  };

  const ladder = (hgt = 3.4) => {
    const s = shared(), g = new THREE.Group();
    [-.22, .22].forEach((x) => { const r = box(.05, hgt, .04, s.woodWarm); r.position.set(x, hgt / 2, 0); g.add(r); });
    for (let y = .3; y < hgt - .1; y += .3) { const r = box(.44, .035, .04, s.woodMid); r.position.set(0, y, 0); g.add(r); }
    const hook = box(.5, .05, .08, s.brass); hook.position.set(0, hgt, 0); g.add(hook);
    return g;
  };

  /* Cadre de porte en arc, tunnel, fond lumineux, grille, lumière, enseigne. Repère local : +z = vers la pièce. */
  const makeDoor = (o) => {
    const s = shared(), g = new THREE.Group(), w = o.w, h = o.h, bw = .5, depth = o.depth || 1.6;
    const outer = archShape(w + bw * 2, h + bw); outer.holes.push(archShape(w, h));
    const frame = mesh(new THREE.ExtrudeGeometry(outer, { depth: .55, bevelEnabled: false, curveSegments: 24 }), s.stone); frame.position.z = -.1; g.add(frame);
    const trim = mesh(new THREE.ExtrudeGeometry((() => { const sh = archShape(w + .16, h + .08); sh.holes.push(archShape(w, h)); return sh; })(), { depth: .06, bevelEnabled: false, curveSegments: 24 }), s.brass); trim.position.z = .45; g.add(trim);
    const sideMat = new THREE.MeshStandardMaterial({ color: '#2a1608', roughness: .9, side: THREE.DoubleSide });
    const lw = mesh(new THREE.PlaneGeometry(depth, h), sideMat); lw.rotation.y = PI / 2; lw.position.set(-w / 2, h / 2, -depth / 2); g.add(lw);
    const rw = mesh(new THREE.PlaneGeometry(depth, h), sideMat); rw.rotation.y = -PI / 2; rw.position.set(w / 2, h / 2, -depth / 2); g.add(rw);
    const roof = mesh(new THREE.PlaneGeometry(w, depth), sideMat); roof.rotation.x = PI / 2; roof.position.set(0, h, -depth / 2); g.add(roof);
    const flo = mesh(new THREE.PlaneGeometry(w, depth), new THREE.MeshStandardMaterial({ color: '#3a1d0e', roughness: .8 })); flo.rotation.x = -PI / 2; flo.position.set(0, .01, -depth / 2); g.add(flo);
    const backMat = new THREE.MeshBasicMaterial({ map: o.backdrop, toneMapped: false, fog: false });
    const back = mesh(new THREE.PlaneGeometry(w, h), backMat); back.position.set(0, h / 2, -depth); g.add(back);
    const mist = glowSprite(o.color, 4.2, .0); mist.position.set(0, h * .45, -.45); mist.scale.set(3.6, 5.4, 1); g.add(mist);
    const spill = mesh(new THREE.PlaneGeometry(5.5, 5.5), new THREE.MeshBasicMaterial({ map: T.glow(), color: o.color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .0, fog: false }));
    spill.rotation.x = -PI / 2; spill.position.set(0, .03, 2.2); g.add(spill);
    const gateGeo = new THREE.PlaneGeometry(w, h); gateGeo.translate(0, -h / 2, 0);
    const gate = mesh(gateGeo, new THREE.MeshStandardMaterial({ map: T.gate(), alphaTest: .5, side: THREE.DoubleSide, roughness: .5, metalness: .7, color: '#9a8a7e' }));
    gate.position.set(0, h, .08); gate.visible = false; g.add(gate);
    const light = new THREE.PointLight(o.color, 0, 11, 1.4); light.position.set(0, h * .5, -.6); g.add(light);
    if (o.sign) { const sg = mesh(new THREE.PlaneGeometry(4.6, 4.6 * 280 / 1024), new THREE.MeshStandardMaterial({ map: o.sign, roughness: .5, metalness: .2, emissive: '#2a1a08', emissiveMap: o.sign, emissiveIntensity: .35 })); sg.position.set(0, h + bw + .75, .06); g.add(sg); }
    return { group: g, gate, backMat, mist, spill, light, w, h };
  };

  /* Livres volants : des grands livres ouverts qui battent des couvertures et tournent sous le plafond. */
  const flyers = (n, cx, cz, rad, y0, spread, doms) => {
    const g = new THREE.Group(), list = [];
    for (let i = 0; i < n; i++) {
      const dom = doms[i % doms.length];
      const bk = L.makeBook({ w: .3, h: .42, t: .05, color: dom.couleur, cover: T.catalogueCover(), page: T.cataloguePage(), endpaper: T.endpaper(dom), open: 1 });
      const fg = new THREE.Group(); bk.root.rotation.x = -PI / 2 + .18; fg.add(bk.root); fg.scale.setScalar(1.45); g.add(fg);
      const gl = glowSprite(dom.lueur, 1.1, .35); fg.add(gl);
      list.push({ fg, bk, a: i / n * PI * 2, r: rad * (.7 + Math.random() * .5), y: y0 + Math.random() * spread, sp: (.12 + Math.random() * .1) * (i % 2 ? 1 : -1), ph: Math.random() * 6 });
    }
    g.userData.update = (dt, t) => list.forEach((f) => {
      f.a += dt * f.sp; const x = cx + Math.cos(f.a) * f.r, z = cz + Math.sin(f.a) * f.r;
      f.fg.position.set(x, f.y + Math.sin(t * .9 + f.ph) * .3, z); f.fg.rotation.y = -f.a + (f.sp > 0 ? PI : 0) + PI / 2;
      f.bk.setOpen(.55 + .45 * Math.sin(t * 5.5 + f.ph));
    });
    return g;
  };

  const dustPoints = (n, rad, hgt) => {
    const pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { const a = Math.random() * PI * 2, r = Math.sqrt(Math.random()) * rad; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.random() * hgt; pos[i * 3 + 2] = Math.sin(a) * r; seed[i] = Math.random() * 6.28; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: T.glow(), color: '#ffd6c0', size: .09, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    pts.userData = { pos, seed, hgt, rad };
    pts.frustumCulled = false; return pts;
  };
  const updateDust = (pts, t, dt) => {
    const { pos, seed, hgt } = pts.userData;
    for (let i = 0; i < seed.length; i++) { pos[i * 3] += Math.sin(t * .2 + seed[i]) * dt * .04; pos[i * 3 + 1] += dt * (.03 + .02 * Math.sin(seed[i])); pos[i * 3 + 2] += Math.cos(t * .18 + seed[i]) * dt * .04; if (pos[i * 3 + 1] > hgt) pos[i * 3 + 1] = 0; }
    pts.geometry.attributes.position.needsUpdate = true;
  };
  const flicker = (c, t) => {
    const u = c.userData; const k = .5 + .5 * Math.sin(t * 9 + u.ph) * Math.sin(t * 5.3 + u.ph * 2);
    u.f.scale.set(.13 + k * .03, .26 + k * .07, 1);
    u.gl.scale.setScalar((u.gl.userData.base || (u.gl.userData.base = u.gl.scale.x)) * (.92 + k * .16));
  };

  /* ====================================================================================== */
  /*  LA GRANDE NEF                                                                          */
  /* ====================================================================================== */

  const HR = 10.6, HH = 9;

  W.buildHall = (ctx) => {
    const s = shared(), g = new THREE.Group();
    const R = { group: g, kind: 'hall', pickables: [], colliders: [], lights: [], portals: [], anim: [], hubPick: null };
    const addLight = (l, base) => { g.add(l); R.lights.push({ light: l, base: base == null ? l.intensity : base }); return l; };

    // sol et tapis
    const floor = mesh(new THREE.CircleGeometry(HR + .2, 72), new THREE.MeshStandardMaterial({ map: T.floor(), color: '#b9a49c', roughness: .6, metalness: .05 })); floor.rotation.x = -PI / 2; g.add(floor);
    const rug = mesh(new THREE.CircleGeometry(7.4, 72), new THREE.MeshStandardMaterial({ map: T.rug(), transparent: true, roughness: .95 })); rug.rotation.x = -PI / 2; rug.position.y = .012; g.add(rug);

    // murs : six secteurs de bibliothèque entre les six portes
    const gap = Math.asin(1.8 / HR), wallMat = new THREE.MeshStandardMaterial({ map: T.bookwall(1), roughness: .85, side: THREE.BackSide });
    for (let k = 0; k < 6; k++) {
      const phi = k * PI / 3;
      const arc = PI / 3 - 2 * gap;
      const geo = scaleUV(new THREE.CylinderGeometry(HR, HR, HH, 24, 1, true, phi + gap, arc), HR * arc / 4, HH / 4);
      const m = mesh(geo, wallMat); m.position.y = HH / 2; g.add(m);
      const hg = scaleUV(new THREE.CylinderGeometry(HR, HR, HH - 6.1, 8, 1, true, phi - gap, 2 * gap), HR * 2 * gap / 4, (HH - 6.1) / 4);
      const hm = mesh(hg, new THREE.MeshStandardMaterial({ map: T.wood('dark', '#3a1d0e', 3), roughness: .8, side: THREE.BackSide })); hm.position.y = 6.1 + (HH - 6.1) / 2; g.add(hm);
    }
    // dôme, oculus, corniche
    const dome = mesh(new THREE.SphereGeometry(HR, 48, 16, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ map: T.dome(), roughness: .9, side: THREE.BackSide })); dome.scale.y = .55; dome.position.y = HH; g.add(dome);
    const oculus = tooLit(mesh(new THREE.CircleGeometry(1.4, 32), new THREE.MeshBasicMaterial({ color: '#b9cdf5', fog: false }))); oculus.rotation.x = PI / 2; oculus.position.y = HH + HR * .55 - .02; g.add(oculus);
    const corniche = mesh(new THREE.TorusGeometry(HR - .1, .22, 8, 96), s.woodWarm); corniche.rotation.x = PI / 2; corniche.position.y = HH; g.add(corniche);
    const corn2 = mesh(new THREE.TorusGeometry(HR - .1, .05, 6, 96), s.brass); corn2.rotation.x = PI / 2; corn2.position.y = HH - .25; g.add(corn2);

    // les six portes : une par domaine
    L.DOMAINES.forEach((dom, k) => {
      const phi = k * PI / 3;
      const d = makeDoor({ w: 3.6, h: 5.4, backdrop: T.portalGlow(dom), color: dom.lueur, sign: T.sign(dom) });
      d.group.position.set(HR * Math.sin(phi), 0, HR * Math.cos(phi)); d.group.rotation.y = phi + PI; g.add(d.group);
      d.light.intensity = 0; R.lights.push({ light: d.light, base: 1.7, open: 1.7, closed: .35, dyn: true });
      const pick = { kind: 'portal', dom };
      const hit = hitPlane(4.6, 6.4, pick); hit.position.set(0, 3.2, .5); d.group.add(hit); R.pickables.push(hit);
      // bannières latérales
      [-1, 1].forEach((sd) => {
        const ban = mesh(new THREE.PlaneGeometry(1.05, 2.6), new THREE.MeshStandardMaterial({ map: T.banner(dom), roughness: .85, side: THREE.DoubleSide, emissive: dom.couleur, emissiveIntensity: .12 }));
        ban.geometry.translate(0, -1.3, 0); ban.position.set(sd * 3.15, 6.6, .25); ban.userData.pick = pick; d.group.add(ban); R.pickables.push(ban);
        const rod = box(1.25, .07, .1, s.brass); rod.position.set(sd * 3.15, 6.62, .26); d.group.add(rod);
        R.anim.push((t) => { ban.rotation.z = Math.sin(t * .7 + k + sd) * .018; ban.rotation.x = Math.sin(t * .5 + k) * .02; });
      });
      const hitS = hitPlane(4.6, 1.3, pick); hitS.position.set(0, 7.3, .2); d.group.add(hitS); R.pickables.push(hitS);
      const portal = { dom, phi, door: d, open: false, t: 0, target: 0, pos: new THREE.Vector3(HR * Math.sin(phi), 0, HR * Math.cos(phi)), stand: { x: 6.7 * Math.sin(phi), z: 6.7 * Math.cos(phi), yaw: phi + PI } };
      d.gate.visible = true; d.gate.scale.y = 1; d.backMat.color.setScalar(.25);
      R.portals.push(portal);
    });

    // fenêtres, colonnes, faisceaux de lune, bureaux de lecture
    for (let k = 0; k < 6; k++) {
      const phi = PI / 6 + k * PI / 3, wg = new THREE.Group();
      wg.position.set((HR - .06) * Math.sin(phi), 0, (HR - .06) * Math.cos(phi)); wg.rotation.y = phi + PI; g.add(wg);
      const glass = tooLit(mesh(archGeo(2.2, 5.2), new THREE.MeshBasicMaterial({ map: T.windowNight(), fog: false }))); glass.position.set(0, 3.4, .02); wg.add(glass);
      const outer = archShape(2.7, 5.7); outer.holes.push(archShape(2.2, 5.2));
      const fr = mesh(new THREE.ExtrudeGeometry(outer, { depth: .35, bevelEnabled: false, curveSegments: 20 }), s.stone); fr.position.set(0, 3.15, 0); wg.add(fr);
      const sill = box(3.1, .14, .6, s.stone); sill.position.set(0, 3.05, .25); wg.add(sill);
      [-1.9, 1.9].forEach((x) => { const col = mesh(new THREE.CylinderGeometry(.26, .32, HH - .5, 16), s.stone); col.position.set(x, (HH - .5) / 2, .35); wg.add(col); const cap = box(.8, .22, .8, s.stone); cap.position.set(x, HH - .6, .35); wg.add(cap); const bs = box(.8, .3, .8, s.stone); bs.position.set(x, .15, .35); wg.add(bs); });
      const shaft = new THREE.Group(); shaft.position.set(0, 8.3, .3); shaft.rotation.x = -.27; wg.add(shaft);
      [0, PI / 2].forEach((ry) => { const gm = new THREE.PlaneGeometry(2.3, 9); gm.translate(0, -4.5, 0); const sm = new THREE.Mesh(gm, new THREE.MeshBasicMaterial({ map: T.shaft(), transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); sm.rotation.y = ry; shaft.add(sm); });
      const ds = desk(1.9, .95); ds.position.set(0, 0, 2.0); wg.add(ds);
      const lp = lamp(); lp.position.set(.5, .8, 2.0); lp.rotation.y = -.5; wg.add(lp);
      const ob = L.makeBook({ w: .3, h: .42, t: .05, color: '#5a1420', cover: T.catalogueCover(), page: T.cataloguePage(), endpaper: T.endpaper(L.DOMAINES[k]), open: 1 });
      ob.root.position.set(-.25, .84, 1.95); ob.root.rotation.set(-PI / 2 + .35, 0, .1); wg.add(ob.root);
      R.colliders.push({ x: (HR - 2.06) * Math.sin(phi), z: (HR - 2.06) * Math.cos(phi), r: 1.15 });
      const ld = ladder(3.6); ld.position.set(2.9 * (k % 2 ? 1 : -1), .0, .1); ld.rotation.x = -.12; wg.add(ld);
    }

    // lustre central et petits lustres
    const chand = chandelier(1.5, 12, 6); chand.position.set(0, 8.4, 0); g.add(chand); R.chand = chand;
    const cLight = addLight(new THREE.PointLight('#ffc27a', 1.5, 26, 1.1)); cLight.position.set(0, 7.2, 0);
    const hemi = new THREE.HemisphereLight('#7a4a5a', '#1c0a10', .75); g.add(hemi); R.lights.push({ light: hemi, base: .75 });
    const moon = new THREE.DirectionalLight('#8fa8e0', .22); moon.position.set(3, 12, 4); g.add(moon); R.lights.push({ light: moon, base: .22 });

    // bougies flottantes (le clin d'œil magique)
    R.candles = [];
    for (let i = 0; i < 38; i++) {
      const c = candle(); const a = Math.random() * PI * 2, r = 2.4 + Math.random() * 6.4, y = 2.6 + Math.random() * 5.6;
      c.position.set(Math.cos(a) * r, y, Math.sin(a) * r); c.userData.base = y; g.add(c); R.candles.push(c);
    }
    R.dust = dustPoints(700, 9.5, 8.5); g.add(R.dust);
    const fly = flyers(7, 0, 0, 6.2, 4.4, 3.2, L.DOMAINES); g.add(fly); R.anim.push((t) => fly.userData.update(R.lastDt || .016, t));

    // piédestal central : lutrin, grand livre-catalogue, noms des rayons en orbite
    const ped = new THREE.Group(); g.add(ped);
    const st1 = mesh(new THREE.CylinderGeometry(1.5, 1.65, .22, 40), s.stone); st1.position.y = .11; ped.add(st1);
    const st2 = mesh(new THREE.CylinderGeometry(1.1, 1.2, .24, 40), s.woodWarm); st2.position.y = .34; ped.add(st2);
    const rim = mesh(new THREE.TorusGeometry(1.1, .035, 8, 48), s.brass); rim.rotation.x = PI / 2; rim.position.y = .47; ped.add(rim);
    const col = mesh(new THREE.CylinderGeometry(.16, .26, 1.0, 14), s.woodMid); col.position.y = 1.0; ped.add(col);
    const plate = box(1.05, .07, .8, s.woodWarm); plate.position.y = 1.55; plate.rotation.x = -.3; ped.add(plate);
    const pickHub = { kind: 'hub' };
    [st1, st2, col, plate].forEach((m) => { m.userData.pick = pickHub; R.pickables.push(m); });
    R.colliders.push({ x: 0, z: 0, r: 1.7 });
    const hub = new THREE.Group(); hub.position.y = 2.15; g.add(hub); R.hub = hub;
    const hb = L.makeBook({ w: .85, h: 1.15, t: .12, color: '#6e1020', cover: T.catalogueCover(), page: T.cataloguePage(), endpaper: T.endpaper(L.DOMAINES[0]), open: 1 });
    hb.root.rotation.x = -.62; hub.add(hb.root);
    hb.root.traverse((m) => { if (m.isMesh) { m.userData.pick = pickHub; R.pickables.push(m); } });
    const hubLight = addLight(new THREE.PointLight('#ffd890', 1.3, 10, 1.3)); hubLight.position.set(0, 2.9, .4);
    [0, PI / 2].forEach((ry) => { const gm = new THREE.PlaneGeometry(1.7, 6); gm.translate(0, 3, 0); const bm = new THREE.Mesh(gm, new THREE.MeshBasicMaterial({ map: T.beam(), color: '#ffd890', transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); bm.position.y = 2.3; bm.rotation.y = ry; g.add(bm); });
    const hubGlow = glowSprite('#ffc060', 3.2, .55); hubGlow.position.y = 2.4; g.add(hubGlow);
    R.orbits = L.DOMAINES.map((dom, i) => {
      const t = T.rune(dom.court, dom.lueur, true, true);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
      sp.scale.set(.3 * t.userData.aspect, .3, 1); sp.userData.pick = { kind: 'portal', dom, orbit: true }; g.add(sp); R.pickables.push(sp); return sp;
    });
    R.hubBook = hb;
    R.spawn = { x: 0, z: 5.4, yaw: 0, pitch: .02 };
    R.bounds = { kind: 'circle', r: 9.2, portalR: 10.35 };
    R.skyTop = oculus;

    R.setOpen = (domId, open, instant) => {
      const p = R.portals.find((q) => q.dom.id === domId); if (!p) return;
      p.open = open; p.target = open ? 1 : 0; if (instant) p.t = p.target;
    };
    R.update = (dt, t) => {
      R.lastDt = dt; hub.rotation.y += dt * .22; hub.position.y = 2.15 + Math.sin(t * .9) * .07; hubGlow.material.opacity = .45 + .12 * Math.sin(t * 1.7);
      R.orbits.forEach((sp, i) => { const a = t * .32 + i * PI / 3; sp.position.set(Math.cos(a) * 2.15, 3.3 + Math.sin(t * .8 + i * 1.7) * .22, Math.sin(a) * 2.15); });
      R.candles.forEach((c, i) => { c.position.y = c.userData.base + Math.sin(t * .7 + i) * .14; c.position.x += Math.sin(t * .3 + i * 2) * dt * .03; flicker(c, t); });
      R.chand.userData.candles.forEach((c) => flicker(c, t)); R.chand.rotation.y = t * .03;
      updateDust(R.dust, t, dt);
      R.anim.forEach((f) => f(t));
      R.portals.forEach((p) => {
        p.t += (p.target - p.t) * Math.min(1, dt * 2.6); const e = p.t;
        p.door.gate.scale.y = Math.max(.001, 1 - e); p.door.gate.visible = e < .985;
        p.door.backMat.color.setScalar(.25 + e * .75);
        p.door.mist.material.opacity = e * .32; p.door.spill.material.opacity = e * .32 + (p.pulse || 0) * (.6 + .4 * Math.sin(t * 3.2));
        const ent = R.lights.find((l) => l.light === p.door.light); p.door.light.intensity = (ent.closed + (ent.open - ent.closed) * e) * (R.dim == null ? 1 : R.dim);
      });
    };
    return R;
  };

  /* ====================================================================================== */
  /*  LES RAYONS                                                                             */
  /* ====================================================================================== */

  const RW = 18, RL = 26, RH = 9.2;
  const BAYS = [
    { pos: [-9, 1.8], psi: PI / 2, w: 6.2 }, { pos: [9, 1.8], psi: -PI / 2, w: 6.2 },
    { pos: [-9, -7], psi: PI / 2, w: 6.2 }, { pos: [9, -7], psi: -PI / 2, w: 6.2 },
    { pos: [0, -13], psi: 0, w: 8 },
  ];

  const fillBooks = (bay, widthM, shelves, seed, dom) => {
    const s = shared(), r = T.rng(seed);
    const pal = ['#5a1420', '#3b0a0a', '#6e2a14', '#2c3e2d', '#1f2f4a', '#7a5a1e', '#4a2f6b', '#8a1f2b', '#2a2220', '#5b3a21', '#8c6a3a', '#cdbf9c', dom.couleur, dom.couleur, dom.couleur].map((c) => new THREE.Color(c));
    const items = [];
    shelves.forEach(([y, h0, h1]) => {
      let x = -widthM / 2 + .06; const end = widthM / 2 - .06;
      while (x < end - .08) {
        if (r() < .035) { x += .08 + r() * .22; continue; }
        const th = .034 + r() * .045, h = h0 + r() * (h1 - h0), d = .22 + r() * .12;
        const lean = r() < .025 ? (r() < .5 ? .22 : -.22) : 0;
        items.push({ x: x + th / 2, y, th, h, d, lean, c: pal[(r() * pal.length) | 0] });
        x += th + .002;
      }
    });
    const im = new THREE.InstancedMesh(s.unitBook, s.spine, items.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    items.forEach((it, i) => { e.set(0, 0, it.lean); q.setFromEuler(e); p.set(it.x, it.y, .34); sc.set(it.th, it.h, it.d); m4.compose(p, q, sc); im.setMatrixAt(i, m4); im.setColorAt(i, it.c); });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    return im;
  };

  W.buildRayon = (dom, ctx) => {
    const s = shared(), g = new THREE.Group(), di = dom.index;
    const R = { group: g, kind: 'rayon', dom, pickables: [], colliders: [], lights: [], bays: [], books: [], anim: [], candles: [] };
    const addLight = (l, base) => { g.add(l); R.lights.push({ light: l, base: base == null ? l.intensity : base }); return l; };

    // sol, tapis, plafond à caissons, poutres
    const fl = mesh(scaleUV(new THREE.PlaneGeometry(RW, RL), RW / 21.2, RL / 21.2), new THREE.MeshStandardMaterial({ map: T.floor(), color: '#b9a49c', roughness: .6, metalness: .05 })); fl.rotation.x = -PI / 2; g.add(fl);
    const run = mesh(scaleUV(new THREE.PlaneGeometry(3.6, 21), 1, 21 / 14.4), new THREE.MeshStandardMaterial({ map: T.runner(dom), roughness: .95 })); run.rotation.x = -PI / 2; run.position.set(0, .012, 0); g.add(run);
    const ce = mesh(scaleUV(new THREE.PlaneGeometry(RW, RL), 1, RL / RW), new THREE.MeshStandardMaterial({ map: T.coffer(), roughness: .9 })); ce.rotation.x = PI / 2; ce.position.y = RH; g.add(ce);
    for (let z = -11; z <= 11; z += 4.4) { const bm = box(RW, .45, .5, s.woodMid); bm.position.set(0, RH - .22, z); g.add(bm); const tr = box(RW, .06, .52, s.brass); tr.position.set(0, RH - .47, z); g.add(tr); }

    // murs
    const wallMat = new THREE.MeshStandardMaterial({ map: T.bookwall(2 + di, dom.couleur), roughness: .85, side: THREE.DoubleSide });
    const wall = (w, h, x, y, z, ry) => { const m = mesh(scaleUV(new THREE.PlaneGeometry(w, h), w / 4, h / 4), wallMat); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
    wall(RL, RH, -RW / 2, RH / 2, 0, PI / 2); wall(RL, RH, RW / 2, RH / 2, 0, -PI / 2); wall(RW, RH, 0, RH / 2, -RL / 2, 0);
    wall(7.2, RH, -5.4, RH / 2, RL / 2, PI); wall(7.2, RH, 5.4, RH / 2, RL / 2, PI); wall(3.6, RH - 5.9, 0, 5.9 + (RH - 5.9) / 2, RL / 2, PI);

    // porte de sortie vers la Grande Nef
    const ex = makeDoor({ w: 3.6, h: 5.4, backdrop: T.portalGlow({ id: 'hall', lueur: '#ffd36a', glyph: '✦' }), color: '#ffd36a', sign: T.sign({ id: 'exit', court: 'Retour', nom: 'Grande Nef', couleur: '#5a1420' }) });
    ex.group.position.set(0, 0, RL / 2); ex.group.rotation.y = PI; g.add(ex.group);
    ex.backMat.color.setScalar(1); ex.mist.material.opacity = .3; ex.spill.material.opacity = .25; ex.light.intensity = 1.1; R.lights.push({ light: ex.light, base: 1.1 });
    const exitPick = { kind: 'exit' }; const exitHit = hitPlane(4.6, 6.4, exitPick); exitHit.position.set(0, 3.2, .5); ex.group.add(exitHit); R.pickables.push(exitHit);
    R.exit = { stand: { x: 0, z: RL / 2 - 3.2, yaw: PI } };
    // vitraux hauts + faisceaux
    [-1, 1].forEach((sd) => [-9.5, -2.5, 4.5, 10].forEach((z, i) => {
      const wg = new THREE.Group(); wg.position.set(sd * (RW / 2 - .03), 0, z); wg.rotation.y = sd < 0 ? PI / 2 : -PI / 2; g.add(wg);
      const gl = tooLit(mesh(archGeo(1.5, 2.5), new THREE.MeshBasicMaterial({ map: T.windowNight(), fog: false }))); gl.position.set(0, 6.45, .02); wg.add(gl);
      const outer = archShape(1.9, 2.9); outer.holes.push(archShape(1.5, 2.5)); const fr = mesh(new THREE.ExtrudeGeometry(outer, { depth: .25, bevelEnabled: false, curveSegments: 16 }), s.stone); fr.position.set(0, 6.25, 0); wg.add(fr);
      const sh = new THREE.Group(); sh.position.set(0, 8.3, .2); sh.rotation.x = -.5; wg.add(sh);
      [0, PI / 2].forEach((ry) => { const gm = new THREE.PlaneGeometry(1.6, 7); gm.translate(0, -3.5, 0); const sm = new THREE.Mesh(gm, new THREE.MeshBasicMaterial({ map: T.shaft(), transparent: true, opacity: .32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); sm.rotation.y = ry; sh.add(sm); });
    }));

    // les cinq travées
    const nbays = dom.themes.length, goldBay = Math.floor(Math.random() * nbays);
    dom.themes.forEach((theme, ti) => {
      const cfg = BAYS[ti], wb = cfg.w, bg = new THREE.Group();
      bg.position.set(cfg.pos[0], 0, cfg.pos[1]); bg.rotation.y = cfg.psi; g.add(bg);
      const back = mesh(new THREE.PlaneGeometry(wb, 6.2), new THREE.MeshStandardMaterial({ color: '#1e0f08', roughness: .95 })); back.position.set(0, 3.7, .03); bg.add(back);
      const velvet = mesh(new THREE.PlaneGeometry(wb - .1, 1.7), new THREE.MeshStandardMaterial({ color: T.shade(dom.couleur, -.78), roughness: 1, emissive: dom.couleur, emissiveIntensity: .025 })); velvet.position.set(0, 1.75, .05); bg.add(velvet);
      const cab = box(wb + .3, .9, .7, s.woodDark); cab.position.set(0, .45, .38); bg.add(cab);
      for (let i = -2; i <= 2; i++) { const dr = box(.9, .6, .02, s.woodWarm); dr.position.set(i * 1.05 * wb / 6.2, .45, .74); bg.add(dr); const kn = mesh(new THREE.SphereGeometry(.025, 8, 8), s.brass); kn.position.set(i * 1.05 * wb / 6.2 + .35, .45, .76); bg.add(kn); }
      const top = box(wb + .4, .06, .78, s.woodWarm); top.position.set(0, .93, .38); bg.add(top);
      [-1, 1].forEach((sd) => {
        const pil = box(.42, 6.9, .7, s.woodMid); pil.position.set(sd * (wb / 2 + .21), 3.45, .38); bg.add(pil);
        const trim = box(.06, 6.9, .72, s.brass); trim.position.set(sd * (wb / 2 + .02), 3.45, .38); bg.add(trim);
      });
      const val = box(wb + .3, 1.0, .5, s.woodDark); val.position.set(0, 3.1, .3); bg.add(val);
      const vtex = T.valance(theme.nom, ti + 1, nbays, dom), vw = wb - .3;
      const vpl = mesh(new THREE.PlaneGeometry(vw, vw * 170 / 1024), new THREE.MeshStandardMaterial({ map: vtex, roughness: .5, metalness: .25, emissive: '#3a2410', emissiveMap: vtex, emissiveIntensity: .45 })); vpl.position.set(0, 3.1, .56); bg.add(vpl);
      const strip = mesh(new THREE.BoxGeometry(wb - .5, .04, .06), new THREE.MeshBasicMaterial({ color: '#ffd9a0', fog: false })); strip.position.set(0, 2.57, .5); bg.add(strip);
      [4.7, 5.8, 6.9].forEach((y) => { const b2 = box(wb, .05, .6, s.woodMid); b2.position.set(0, y - .025, .34); bg.add(b2); });
      const cor = box(wb + .9, .36, .9, s.woodWarm); cor.position.set(0, 7.1, .4); bg.add(cor); const cor2 = box(wb + .95, .05, .95, s.brass); cor2.position.set(0, 6.9, .4); bg.add(cor2);
      bg.add(fillBooks(bg, wb, [[3.6, .3, .5], [4.7, .35, .62], [5.8, .38, .7]], (di + 1) * 100 + ti, dom));
      const bl = new THREE.PointLight(T.shade('#ffd9a8', 0), 0, 8, 1.3); bl.position.set(0, 2.4, 1.8); bg.add(bl); R.lights.push({ light: bl, base: 1.0 }); bl.intensity = 1.0;

      const bay = { theme, ti, group: bg, cfg, books: [], hit: null, w: wb };
      const sp = rotXZ(0, 3.3, cfg.psi); bay.stand = { x: cfg.pos[0] + sp.x, z: cfg.pos[1] + sp.z, yaw: cfg.psi, pitch: -.03 };
      bay.center = new THREE.Vector3(cfg.pos[0] + rotXZ(0, .45, cfg.psi).x, 1.5, cfg.pos[1] + rotXZ(0, .45, cfg.psi).z);
      const pickBay = { kind: 'bay', bay }; const bh = hitPlane(wb + .6, 7, pickBay); bh.position.set(0, 3.5, .04); bg.add(bh); R.pickables.push(bh); bay.hit = bh;

      // quatre grands livres exposés
      const bw = .56, bh2 = .8, spacing = wb / 4;
      theme.livres.forEach((livre, li) => {
        const x = (li - 1.5) * spacing;
        const bk = L.makeBook({ w: bw, h: bh2, t: .08, color: T.shade(dom.couleur, -.3), cover: T.cover(livre), page: T.titlePage(livre), endpaper: T.endpaper(dom) });
        const tilt = -.2; bk.root.position.set(x, .93 + bh2 / 2 * Math.cos(.2) + .02, .56); bk.root.rotation.set(tilt, (Math.random() - .5) * .08, 0); bg.add(bk.root);
        const lip = box(bw + .06, .035, .1, s.brass); lip.position.set(x, .95, .66); bg.add(lip);
        const sup = box(.05, bh2 * .8, .03, s.woodDark); sup.position.set(x, .93 + bh2 * .38, .45); sup.rotation.x = -.2; bg.add(sup);
        const halo = glowSprite(dom.lueur, 1.9, .28); halo.position.set(x, 1.45, .35); bg.add(halo);
        const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.star(), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); star.scale.set(.34, .34, 1); star.position.set(x, 2.2, .7); star.visible = false; star.renderOrder = 5; bg.add(star);
        const ref = { livre, bk, bay, home: { p: bk.root.position.clone(), r: bk.root.rotation.clone() }, halo, star, id: livre.id };
        const pk = { kind: 'book', ref };
        bk.root.traverse((m) => { if (m.isMesh) { m.userData.pick = pk; R.pickables.push(m); } });
        bay.books.push(ref); R.books.push(ref);
      });
      R.bays.push(bay);

      if (ti === goldBay && !(ctx && ctx.found && ctx.found.has(dom.id))) {
        const gx = (Math.random() < .5 ? -1 : 1) * (wb / 2 - .8 - Math.random() * 1.2);
        const gm = mesh(new THREE.BoxGeometry(.075, .52, .3), new THREE.MeshStandardMaterial({ color: B.gold, metalness: .9, roughness: .25, emissive: '#8a5a10', emissiveIntensity: .8 }));
        gm.position.set(gx, 3.6 + .26, .34); gm.rotation.z = .08; bg.add(gm);
        const gs = glowSprite('#ffd36a', .9, .6); gs.position.set(gx, 3.95, .55); bg.add(gs);
        gm.userData.pick = { kind: 'gold', dom }; R.pickables.push(gm); R.gold = { mesh: gm, glow: gs, bay };
      }
    });

    // table de lecture centrale, lampes, grands livres ouverts
    const tg = new THREE.Group(); tg.position.set(0, 0, -3.4); g.add(tg);
    const top = box(1.5, .08, 5.4, s.woodWarm); top.position.y = .78; tg.add(top);
    const tb = box(1.58, .025, 5.48, s.brass); tb.position.y = .735; tg.add(tb);
    [[-.6, -2.4], [.6, -2.4], [-.6, 2.4], [.6, 2.4]].forEach(([x, z]) => { const l = box(.12, .74, .12, s.woodDark); l.position.set(x, .37, z); tg.add(l); });
    const ap = box(1.3, .14, 5.2, s.woodDark); ap.position.y = .68; tg.add(ap);
    [-1.8, 0, 1.8].forEach((z, i) => { const lp = lamp(); lp.position.set(i % 2 ? .35 : -.35, .82, z); lp.rotation.y = i % 2 ? PI * .6 : -PI * .6; tg.add(lp); });
    [-2.2, .9, 2.4].forEach((z, i) => { const ob = L.makeBook({ w: .34, h: .48, t: .06, color: dom.couleur, cover: T.catalogueCover(), page: T.cataloguePage(), endpaper: T.endpaper(dom), open: 1 }); ob.root.position.set(i % 2 ? -.3 : .3, .84, z); ob.root.rotation.set(-PI / 2 + .25, 0, (i - 1) * .3); tg.add(ob.root); });
    [-1.1, -2.8, -4.6, -5.9].forEach((z) => R.colliders.push({ x: 0, z, r: 1.15 }));
    // lustres
    [6, -6].forEach((z) => { const ch = chandelier(1.1, 10, 1.6); ch.position.set(0, 7.3, z); g.add(ch); R.anim.push((t) => { ch.userData.candles.forEach((c) => flicker(c, t)); ch.rotation.y = t * .04; }); const pl = addLight(new THREE.PointLight('#ffbe78', .85, 18, 1.2)); pl.position.set(0, 6.6, z); });
    // échelles
    [[-8.1, 7.8, PI / 2], [8.1, 7.8, -PI / 2], [-8.1, -2.6, PI / 2], [8.1, -2.6, -PI / 2]].forEach(([x, z, ry]) => { const ld = ladder(4); ld.position.set(x, 0, z); ld.rotation.set(-.14, ry, 0); ld.rotateY(0); g.add(ld); });
    // bougies flottantes + poussière
    for (let i = 0; i < 26; i++) { const c = candle(); const x = (Math.random() - .5) * 13, z = (Math.random() - .5) * 21, y = 2.4 + Math.random() * 4.2; c.position.set(x, y, z); c.userData.base = y; g.add(c); R.candles.push(c); }
    R.dust = dustPoints(450, 8, 8); R.dust.position.set(0, 0, 0); R.dust.scale.set(1, 1, 1.55); g.add(R.dust);
    const fly = flyers(4, 0, 0, 4.2, 5.0, 1.8, [dom]); fly.scale.set(1, 1, 2.2); g.add(fly); R.anim.push((t) => fly.userData.update(R.lastDt || .016, t));
    const hemi = new THREE.HemisphereLight('#7a4a5a', '#1c0a10', .7); g.add(hemi); R.lights.push({ light: hemi, base: .7 });
    const moon = new THREE.DirectionalLight('#8fa8e0', .16); moon.position.set(-4, 12, 3); g.add(moon); R.lights.push({ light: moon, base: .16 });

    R.spawn = { x: 0, z: RL / 2 - 3.0, yaw: 0, pitch: .02 };
    R.bounds = { kind: 'rect', minX: -7.9, maxX: 7.9, minZ: -11.6, maxZ: RL / 2 - 1.2, exitHalf: 1.6, exitZ: RL / 2 + .5 };
    R.update = (dt, t) => {
      R.lastDt = dt; R.candles.forEach((c, i) => { c.position.y = c.userData.base + Math.sin(t * .7 + i) * .13; flicker(c, t); });
      updateDust(R.dust, t, dt); R.anim.forEach((f) => f(t));
      R.books.forEach((b, i) => { b.halo.material.opacity = .22 + .08 * Math.sin(t * 1.4 + i); if (b.star.visible) { b.star.scale.setScalar(.3 + .05 * Math.sin(t * 3 + i)); b.star.position.y = 2.2 + Math.sin(t * 1.6 + i) * .05; } });
      if (R.gold) { R.gold.glow.material.opacity = .35 + .3 * Math.sin(t * 2.2); R.gold.glow.scale.setScalar(.8 + .25 * Math.sin(t * 2.2)); }
    };
    return R;
  };

  W.applyDim = (R, f) => { R.dim = f; R.lights.forEach((l) => { if (!l.dyn) l.light.intensity = l.base * f; }); };
})();
