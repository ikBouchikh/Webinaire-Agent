/* Les lieux : la Grande salle (rotonde à galerie, une porte par domaine) et les rayons
   (une longue galerie, cinq travées de rayonnages, quatre grands livres exposés par travée). */

(function () {
  const L = window.LDC, T = L.tex, C = L.C, PI = Math.PI;
  const S = L.S = {};

  /* ---------- ressources partagées ---------- */
  const keep = new Set();
  let M = null;
  const shared = () => {
    if (M) return M;
    const k = (o) => { keep.add(o); return o; }, std = (o) => k(new THREE.MeshStandardMaterial(o));
    M = {
      acajou: std({ map: T.wood('acajou', C.acajou, 5), roughness: .5, metalness: .04 }),
      acajouL: std({ map: T.wood('acajouL', C.acajouL, 8), roughness: .45 }),
      stone: std({ map: T.stone(), roughness: .9 }),
      brass: std({ color: C.or, metalness: .9, roughness: .3 }),
      spine: std({ map: T.spine(), roughness: .6 }),
      candle: std({ color: C.creme, roughness: .8, emissive: '#6A5A40' }),
      flame: k(new THREE.SpriteMaterial({ map: T.flame(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })),
      glow: k(new THREE.SpriteMaterial({ map: T.glow(), color: '#FFC98A', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .4 })),
      unitBook: k((() => { const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, .5, 0); return g; })()),
      candleGeo: k(new THREE.CylinderGeometry(.05, .055, .4, 12)),
    };
    return M;
  };
  S.isShared = (o) => keep.has(o);
  S.disposeGroup = (g) => g.traverse((o) => {
    if (o.isInstancedMesh) o.dispose();
    if (o.geometry && !keep.has(o.geometry)) o.geometry.dispose();
    if (o.material) [].concat(o.material).forEach((m) => { if (!keep.has(m)) m.dispose(); });
  });

  const mesh = (geo, mat, shadow) => { const m = new THREE.Mesh(geo, mat); if (shadow) { m.castShadow = true; m.receiveShadow = true; } return m; };
  const box = (w, h, d, mat, shadow) => mesh(new THREE.BoxGeometry(w, h, d), mat, shadow);
  const scaleUV = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
  const archShape = (w, h) => { const s = new THREE.Shape(), r = w / 2, hs = h - r; s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, hs); s.absarc(0, hs, r, 0, PI, false); s.lineTo(-r, 0); return s; };
  const archGeo = (w, h) => { const g = new THREE.ShapeGeometry(archShape(w, h), 32), uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, p.getY(i) / h); return g; };
  const hitPlane = (w, h, pick) => { const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); m.visible = false; m.userData.pick = pick; return m; };
  const glowSprite = (color, size, opacity) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity })); s.scale.set(size, size, 1); return s; };
  S.archGeo = archGeo; S.scaleUV = scaleUV;

  /* Lumière d'ambiance (reflets et remplissage) : un décor dégradé converti en environnement. */
  S.makeEnv = (renderer) => {
    const sc = new THREE.Scene(), [cv, g] = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 256; return [c, c.getContext('2d')]; })();
    const q = g.createLinearGradient(0, 0, 0, 256); q.addColorStop(0, '#C9B8A3'); q.addColorStop(.5, '#A08A78'); q.addColorStop(1, '#4A2230'); g.fillStyle = q; g.fillRect(0, 0, 8, 256);
    const tx = new THREE.CanvasTexture(cv); tx.encoding = THREE.sRGBEncoding;
    sc.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.MeshBasicMaterial({ map: tx, side: THREE.BackSide })));
    [[0, 14, 25], [0, 14, -25], [25, 12, 0], [-25, 12, 0]].forEach(([x, y, z]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), new THREE.MeshBasicMaterial({ color: '#E4D6C4', side: THREE.DoubleSide })); p.position.set(x, y, z); p.lookAt(0, 3, 0); sc.add(p); });
    const pm = new THREE.PMREMGenerator(renderer), env = pm.fromScene(sc, .04).texture; pm.dispose(); tx.dispose();
    return env;
  };

  /* ---------- briques ---------- */
  const candle = (halo) => {
    const m = shared(), g = new THREE.Group();
    g.add(mesh(m.candleGeo, m.candle));
    const f = new THREE.Sprite(m.flame); f.position.y = .36; f.scale.set(.15, .3, 1); g.add(f);
    const gl = new THREE.Sprite(m.glow); gl.position.y = .36; gl.scale.set(halo || .9, halo || .9, 1); g.add(gl);
    g.userData = { f, gl, ph: Math.random() * 6.28 }; return g;
  };
  const flicker = (c, t) => { const u = c.userData, k = .5 + .5 * Math.sin(t * 9 + u.ph) * Math.sin(t * 5.3 + u.ph * 2); u.f.scale.set(.14 + k * .03, .28 + k * .07, 1); };

  const makeDoor = (dom) => {
    const m = shared(), g = new THREE.Group(), w = 2.9, hTot = 4.2, hLeaf = 2.75, r = w / 2, dep = 2.4;
    const outer = archShape(w + 1.0, hTot + .5); outer.holes.push(archShape(w, hTot));
    const frame = mesh(new THREE.ExtrudeGeometry(outer, { depth: .6, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 2, curveSegments: 32 }), m.stone, true); frame.position.z = -.15; g.add(frame);
    const ts = archShape(w + .14, hTot + .07); ts.holes.push(archShape(w, hTot));
    const trim = mesh(new THREE.ExtrudeGeometry(ts, { depth: .06, bevelEnabled: false, curveSegments: 32 }), m.brass); trim.position.z = .44; g.add(trim);
    const side = new THREE.MeshStandardMaterial({ color: '#8A6A5A', roughness: .9, side: THREE.DoubleSide });
    [[-r, 1], [r, -1]].forEach(([x, s]) => { const p = mesh(new THREE.PlaneGeometry(dep, hTot), side); p.rotation.y = s * PI / 2; p.position.set(x, hTot / 2, -dep / 2); g.add(p); });
    const roof = mesh(new THREE.PlaneGeometry(w, dep), side); roof.rotation.x = PI / 2; roof.position.set(0, hTot, -dep / 2); g.add(roof);
    const flo = mesh(new THREE.PlaneGeometry(w, dep), new THREE.MeshStandardMaterial({ color: '#6A1230', roughness: .5 })); flo.rotation.x = -PI / 2; flo.position.set(0, .01, -dep / 2); g.add(flo);
    const back = mesh(new THREE.PlaneGeometry(w, hTot), new THREE.MeshBasicMaterial({ map: T.vestibule(dom) })); back.position.set(0, hTot / 2, -dep); g.add(back);
    // vitrail (imposte)
    const sh = new THREE.Shape(); sh.moveTo(-r, hLeaf); sh.lineTo(r, hLeaf); sh.absarc(0, hLeaf, r, 0, PI, false); sh.lineTo(-r, hLeaf);
    const ug = new THREE.ShapeGeometry(sh, 32); const up = ug.attributes.position, uu = ug.attributes.uv; for (let i = 0; i < uu.count; i++) uu.setXY(i, (up.getX(i) + r) / w, (up.getY(i) - hLeaf) / r);
    const trans = mesh(ug, new THREE.MeshBasicMaterial({ map: T.transom(dom), transparent: true })); trans.position.z = .02; g.add(trans);
    // vantaux
    const lw = r - .015, leafGeo = new THREE.BoxGeometry(lw, hLeaf, .07), leaves = [];
    [[-1, 1], [1, -1]].forEach(([sx, dir]) => {
      const pv = new THREE.Group(); pv.position.set(sx * r, 0, 0); const lf = mesh(leafGeo, new THREE.MeshStandardMaterial({ map: T.doorLeaf(), roughness: .5, metalness: .05 }), true); lf.position.set(-sx * lw / 2, hLeaf / 2, 0); pv.add(lf);
      const hd = mesh(new THREE.CylinderGeometry(.025, .025, .5, 10), m.brass); hd.position.set(-sx * (lw - .12), 1.15, .07); pv.add(hd);
      g.add(pv); leaves.push({ pv, dir });
    });
    // cadenas (rayon fermé)
    const lock = new THREE.Group(); lock.position.set(0, 1.15, .1);
    lock.add(mesh(new THREE.BoxGeometry(.2, .24, .08), m.brass)); const sk = mesh(new THREE.TorusGeometry(.07, .018, 8, 16, PI), m.brass); sk.position.y = .13; lock.add(sk); g.add(lock);
    const light = new THREE.PointLight(dom.lueur, 0, 10, 1.3); light.position.set(0, 2.2, -1); g.add(light);
    const plaque = mesh(new THREE.PlaneGeometry(2.3, 2.3 * 200 / 1024), new THREE.MeshStandardMaterial({ map: T.plaque(dom), roughness: .5 })); plaque.position.set(0, hTot + .24, .44); g.add(plaque);
    const api = { group: g, light, state: 0, target: 0, locked: true };
    api.setLocked = (v) => { api.locked = v; lock.visible = v; };
    api.apply = () => { const a = api.state * 1.75; leaves[0].pv.rotation.y = a; leaves[1].pv.rotation.y = -a; light.intensity = Math.min(1, api.state * 3) * 1.6; };
    api.setLocked(true); api.apply();
    return api;
  };

  /* ====================================================================================== */
  /*  GRANDE SALLE                                                                           */
  /* ====================================================================================== */

  const HR = 11, HH = 9.8, GY = 5.2;
  S.HR = HR;

  S.buildHall = () => {
    const m = shared(), g = new THREE.Group(), R = { group: g, kind: 'hall', pickables: [], doors: [], anim: [], candles: [] };
    // sol en damier de marbre + rosace
    const floor = mesh(scaleUV(new THREE.CircleGeometry(HR + .3, 96), 5.65, 5.65), new THREE.MeshStandardMaterial({ map: T.marble(), roughness: .26, metalness: .04, envMapIntensity: .9 })); floor.rotation.x = -PI / 2; g.add(floor);
    const ros = mesh(new THREE.CircleGeometry(5.4, 96), new THREE.MeshStandardMaterial({ map: T.rosace(), transparent: true, roughness: .35, envMapIntensity: .8 })); ros.rotation.x = -PI / 2; ros.position.y = .012; g.add(ros);
    // murs : bibliothèques, interrompues par les six portes
    const gap = Math.asin(1.5 / HR), arc = PI / 3 - 2 * gap, wallMat = new THREE.MeshStandardMaterial({ map: T.bookwall(1), roughness: .8, side: THREE.BackSide, emissive: '#3A1018', emissiveIntensity: .35 });
    for (let k = 0; k < 6; k++) {
      const phi = k * PI / 3;
      const a = mesh(scaleUV(new THREE.CylinderGeometry(HR, HR, HH, 32, 1, true, phi + gap, arc), HR * arc / 4, HH / 4), wallMat); a.position.y = HH / 2; g.add(a);
      const h = mesh(scaleUV(new THREE.CylinderGeometry(HR, HR, HH - 4.5, 10, 1, true, phi - gap, 2 * gap), HR * 2 * gap / 4, (HH - 4.5) / 4), wallMat); h.position.y = 4.5 + (HH - 4.5) / 2; g.add(h);
    }
    // galerie
    const sh = new THREE.Shape(); sh.absarc(0, 0, HR, 0, PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, 9.7, 0, PI * 2, true); sh.holes.push(hole);
    const slab = mesh(new THREE.ExtrudeGeometry(sh, { depth: .3, bevelEnabled: false, curveSegments: 96 }), m.acajou, true); slab.rotation.x = -PI / 2; slab.position.y = GY - .3; g.add(slab);
    const mold = mesh(new THREE.TorusGeometry(9.72, .1, 8, 96), m.brass); mold.rotation.x = PI / 2; mold.position.y = GY - .3; g.add(mold);
    const bal = mesh(scaleUV(new THREE.CylinderGeometry(9.74, 9.74, 1.0, 96, 1, true), 9.74 * PI * 2 / 1.9, 1), new THREE.MeshStandardMaterial({ map: T.balustrade(), transparent: true, alphaTest: .35, side: THREE.DoubleSide, roughness: .5 })); bal.position.y = GY + .5; g.add(bal);
    const rail = mesh(new THREE.TorusGeometry(9.74, .055, 8, 96), m.brass); rail.rotation.x = PI / 2; rail.position.y = GY + 1.0; g.add(rail);
    // corniche, dôme, oculus
    const corn = mesh(new THREE.TorusGeometry(HR - .1, .25, 8, 96), m.stone); corn.rotation.x = PI / 2; corn.position.y = HH; g.add(corn);
    const corn2 = mesh(new THREE.TorusGeometry(HR - .1, .05, 6, 96), m.brass); corn2.rotation.x = PI / 2; corn2.position.y = HH - .3; g.add(corn2);
    const dome = mesh(new THREE.SphereGeometry(HR, 64, 20, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ map: T.dome(), roughness: .85, side: THREE.BackSide, emissive: '#6A5040', emissiveIntensity: .3 })); dome.scale.y = .5; dome.position.y = HH; g.add(dome);
    const oc = mesh(new THREE.CircleGeometry(1.5, 40), new THREE.MeshBasicMaterial({ color: '#FFFFFF' })); oc.rotation.x = PI / 2; oc.position.y = HH + HR * .5 - .03; g.add(oc);
    // fenêtres hautes entre les portes
    for (let k = 0; k < 6; k++) {
      const phi = PI / 6 + k * PI / 3, wg = new THREE.Group(); wg.position.set((HR - .05) * Math.sin(phi), 0, (HR - .05) * Math.cos(phi)); wg.rotation.y = phi + PI; g.add(wg);
      const glass = mesh(archGeo(2.2, 3.4), new THREE.MeshBasicMaterial({ map: T.windowGlass() })); glass.position.set(0, 5.8, .02); wg.add(glass);
      const o = archShape(2.8, 3.8); o.holes.push(archShape(2.2, 3.4)); const fr = mesh(new THREE.ExtrudeGeometry(o, { depth: .35, bevelEnabled: false, curveSegments: 24 }), m.stone, true); fr.position.set(0, 5.6, -.02); wg.add(fr);
      const sill = box(3.2, .14, .55, m.stone); sill.position.set(0, 5.55, .22); wg.add(sill);
    }
    // portes
    L.DOMAINES.forEach((dom, k) => {
      const phi = -k * PI / 3, d = makeDoor(dom);
      d.group.position.set(HR * Math.sin(phi), 0, HR * Math.cos(phi)); d.group.rotation.y = phi + PI; g.add(d.group);
      const hit = hitPlane(3.9, 4.7, { kind: 'door', k, dom }); hit.position.set(0, 2.35, .5); d.group.add(hit); R.pickables.push(hit);
      d.dom = dom; d.k = k; d.phi = phi; d.pos = new THREE.Vector3(HR * Math.sin(phi), 0, HR * Math.cos(phi)); R.doors.push(d);
    });
    // lumière
    const hemi = new THREE.HemisphereLight('#FFF4E4', '#7A3345', .38); g.add(hemi);
    const pl = new THREE.PointLight('#FFE8C8', .35, 28, 1.1); pl.position.set(0, 7.5, 0); g.add(pl);
    // quelques bougies flottantes
    for (let i = 0; i < 12; i++) { const c = candle(1.0), a = i / 12 * PI * 2 + .3, rr = 6.2 + (i % 3) * 1.2, y = 6.6 + (i % 4) * .6; c.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); c.userData.base = y; g.add(c); R.candles.push(c); }

    // pupitre central : le premier Code civil (1804)
    const pk = { kind: 'code' };
    const st1 = mesh(new THREE.CylinderGeometry(1.6, 1.75, .24, 48), m.stone, true); st1.position.y = .12;
    const st2 = mesh(new THREE.CylinderGeometry(1.2, 1.3, .22, 48), m.acajou, true); st2.position.y = .35;
    const rim = mesh(new THREE.TorusGeometry(1.2, .035, 8, 64), m.brass); rim.rotation.x = PI / 2; rim.position.y = .47;
    const col = mesh(new THREE.CylinderGeometry(.17, .27, 1.0, 16), m.acajou, true); col.position.y = 1.0;
    const plate = box(1.2, .07, .88, m.acajouL, true); plate.position.y = 1.56; plate.rotation.x = -.32;
    [st1, st2, col, plate].forEach((o) => { o.userData.pick = pk; g.add(o); R.pickables.push(o); }); g.add(rim);
    const hub = new THREE.Group(); hub.position.y = 2.3; g.add(hub);
    const hb = L.makeBook({ w: .62, h: .86, t: .09, color: '#5A0B27', cover: T.codeCover(), page: T.codePage(), endpaper: T.codeTitle(), open: 1 });
    hb.root.rotation.x = -.5; hb.root.scale.setScalar(1.7); hub.add(hb.root);
    hb.root.traverse((o) => { if (o.isMesh) { o.userData.pick = pk; R.pickables.push(o); } });
    [0, PI / 2].forEach((ry) => { const gm = new THREE.PlaneGeometry(1.9, 3.4); gm.translate(0, 1.7, 0); const bm = new THREE.Mesh(gm, new THREE.MeshBasicMaterial({ map: T.beam(), color: '#FFE2B0', transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); bm.position.y = 3.2; bm.rotation.y = ry; g.add(bm); });
    const hubGlow = glowSprite('#FFD9A0', 3.4, .28); hubGlow.position.set(0, .1, -.9); hub.add(hubGlow);
    const hubLight = new THREE.PointLight('#FFE2B8', .9, 9, 1.3); hubLight.position.set(0, 3.1, .4); g.add(hubLight);
    R.hub = hub; R.hubCenter = new THREE.Vector3(0, 2.3, 0); R.camPos = new THREE.Vector3(0, 2, 6);

    R.setSelection = (sel, instant) => R.doors.forEach((d) => { const open = sel.has(d.dom.id); d.setLocked(!open); d.target = open ? .16 : 0; if (instant) { d.state = d.target; d.apply(); } });
    R.update = (dt, t) => {
      hub.position.y = 2.3 + Math.sin(t * .9) * .05; hub.rotation.y = Math.atan2(R.camPos.x, R.camPos.z) + Math.sin(t * .35) * .3; hubGlow.material.opacity = .26 + .05 * Math.sin(t * 1.6);
      R.doors.forEach((d) => { if (Math.abs(d.target - d.state) > .0005) { d.state += (d.target - d.state) * Math.min(1, dt * 3.2); d.apply(); } });
      R.candles.forEach((c, i) => { c.position.y = c.userData.base + Math.sin(t * .7 + i) * .1; flicker(c, t); });
    };
    return R;
  };

  /* ====================================================================================== */
  /*  RAYONS                                                                                 */
  /* ====================================================================================== */

  const RX = 24, RZ0 = -6, RZ1 = 6.5, RH = 9.4, RGY = 5.2, BAYW = 6.8, PITCH = 7.2;
  S.BAY_X = [0, 1, 2, 3, 4].map((i) => (i - 2) * PITCH);
  S.RAY_Z = RZ0;

  const fillBooks = (width, rows, seed, dom) => {
    const m = shared(), r = T.rng(seed);
    const pal = ['#680D2D', '#5A0B27', '#4A0A22', '#8B0F3E', '#5A2230', '#7A1233', '#E6D7C3', '#F3DDE3', '#B58A4A', '#2F5DA8', '#9A4A2B', dom.cuir, dom.cuir].map((c) => new THREE.Color(c));
    const items = [];
    rows.forEach(([y, h0, h1]) => {
      let x = -width / 2 + .06; const end = width / 2 - .06;
      while (x < end - .08) {
        if (r() < .03) { x += .08 + r() * .2; continue; }
        const th = .036 + r() * .05, h = h0 + r() * (h1 - h0), d = .24 + r() * .12, lean = r() < .02 ? (r() < .5 ? .2 : -.2) : 0;
        items.push({ x: x + th / 2, y, th, h, d, lean, c: pal[(r() * pal.length) | 0] }); x += th + .002;
      }
    });
    const im = new THREE.InstancedMesh(m.unitBook, m.spine, items.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    items.forEach((it, i) => { e.set(0, 0, it.lean); q.setFromEuler(e); p.set(it.x, it.y, .36); sc.set(it.th, it.h, it.d); m4.compose(p, q, sc); im.setMatrixAt(i, m4); im.setColorAt(i, it.c); });
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; return im;
  };

  S.buildRayon = (dom) => {
    const m = shared(), g = new THREE.Group(), di = dom.index, R = { group: g, kind: 'rayon', dom, pickables: [], bays: [], books: [], anim: [], candles: [] };
    // sol, tapis, plafond
    const floor = mesh(scaleUV(new THREE.PlaneGeometry(RX * 2, RZ1 - RZ0), RX * 2 / 4, (RZ1 - RZ0) / 4), new THREE.MeshStandardMaterial({ map: T.parquet(), roughness: .42, metalness: .03, envMapIntensity: .6 })); floor.rotation.x = -PI / 2; floor.position.z = (RZ0 + RZ1) / 2; floor.receiveShadow = true; g.add(floor);
    const run = mesh(scaleUV(new THREE.PlaneGeometry(RX * 2 - 2, 3.4), (RX * 2 - 2) / 8, 1), new THREE.MeshStandardMaterial({ map: T.runner(dom), roughness: .95 })); run.rotation.x = -PI / 2; run.position.set(0, .014, RZ0 + 3.2); run.receiveShadow = true; g.add(run);
    const ce = mesh(scaleUV(new THREE.PlaneGeometry(RX * 2, RZ1 - RZ0), RX * 2 / 6, (RZ1 - RZ0) / 6), new THREE.MeshStandardMaterial({ map: T.coffer(), roughness: .85 })); ce.rotation.x = PI / 2; ce.position.set(0, RH, (RZ0 + RZ1) / 2); g.add(ce);
    for (let x = -RX + 3; x <= RX - 3; x += 6) { const b = box(.5, .5, RZ1 - RZ0, m.acajou, false); b.position.set(x, RH - .25, (RZ0 + RZ1) / 2); g.add(b); const t = box(.54, .06, RZ1 - RZ0, m.brass); t.position.set(x, RH - .52, (RZ0 + RZ1) / 2); g.add(t); }
    // murs
    const wallMat = new THREE.MeshStandardMaterial({ map: T.bookwall(2 + di), roughness: .8, side: THREE.DoubleSide, emissive: '#3A1018', emissiveIntensity: .35 });
    const wall = (w, h, x, y, z, ry) => { const p = mesh(scaleUV(new THREE.PlaneGeometry(w, h), w / 4, h / 4), wallMat); p.position.set(x, y, z); p.rotation.y = ry; p.receiveShadow = true; g.add(p); };
    wall(RX * 2, RH, 0, RH / 2, RZ0, 0); wall(RZ1 - RZ0, RH, -RX, RH / 2, (RZ0 + RZ1) / 2, PI / 2); wall(RZ1 - RZ0, RH, RX, RH / 2, (RZ0 + RZ1) / 2, -PI / 2);
    const front = mesh(scaleUV(new THREE.PlaneGeometry(RX * 2, RH), RX * 2 / 4, RH / 4), m.stone); front.position.set(0, RH / 2, RZ1); front.rotation.y = PI; g.add(front);
    for (let x = -21; x <= 21; x += 6) {
      const glass = mesh(archGeo(2.4, 5.4), new THREE.MeshBasicMaterial({ map: T.windowGlass() })); glass.position.set(x, 2.6, RZ1 - .03); glass.rotation.y = PI; g.add(glass);
      const o = archShape(3.0, 5.9); o.holes.push(archShape(2.4, 5.4)); const fr = mesh(new THREE.ExtrudeGeometry(o, { depth: .4, bevelEnabled: false, curveSegments: 24 }), m.stone, false); fr.position.set(x, 2.35, RZ1 - .4); g.add(fr);
    }
    // galerie continue
    const slab = box(RX * 2, .3, 1.3, m.acajou, true); slab.position.set(0, RGY - .15, RZ0 + .65); g.add(slab);
    const mold = box(RX * 2, .16, .1, m.brass); mold.position.set(0, RGY - .38, RZ0 + 1.3); g.add(mold);
    const bal = mesh(scaleUV(new THREE.PlaneGeometry(RX * 2, 1.0), RX * 2 / 1.9, 1), new THREE.MeshStandardMaterial({ map: T.balustrade(), transparent: true, alphaTest: .35, side: THREE.DoubleSide, roughness: .5 })); bal.position.set(0, RGY + .5, RZ0 + 1.28); g.add(bal);
    const rail = box(RX * 2, .08, .1, m.brass); rail.position.set(0, RGY + 1.0, RZ0 + 1.28); g.add(rail);

    // les cinq travées
    dom.themes.forEach((theme, ti) => {
      const xc = S.BAY_X[ti], bg = new THREE.Group(); bg.position.set(xc, 0, RZ0); g.add(bg);
      const back = mesh(new THREE.PlaneGeometry(BAYW, 4.0), new THREE.MeshStandardMaterial({ color: '#2A0F16', roughness: .95 })); back.position.set(0, 2.95, .03); back.receiveShadow = true; bg.add(back);
      const velvet = mesh(new THREE.PlaneGeometry(BAYW - .1, 1.9), new THREE.MeshStandardMaterial({ color: T.shade(dom.cuir, -.55), roughness: 1 })); velvet.position.set(0, 1.9, .05); velvet.receiveShadow = true; bg.add(velvet);
      const cab = box(BAYW + .3, .95, .75, m.acajou, true); cab.position.set(0, .475, .375); bg.add(cab);
      for (let i = -2; i <= 2; i++) { const dr = box(1.0, .62, .03, m.acajouL, false); dr.position.set(i * 1.3, .47, .76); bg.add(dr); const kn = mesh(new THREE.SphereGeometry(.028, 10, 10), m.brass); kn.position.set(i * 1.3 + .38, .47, .79); bg.add(kn); }
      const top = box(BAYW + .4, .06, .82, m.acajouL, true); top.position.set(0, .98, .41); bg.add(top);
      [-1, 1].forEach((sd) => { const pil = box(.46, 4.95, .85, m.acajou, true); pil.position.set(sd * (BAYW / 2 + .23), 2.475, .42); bg.add(pil); const tr = box(.06, 4.95, .87, m.brass); tr.position.set(sd * (BAYW / 2 + .02), 2.475, .42); bg.add(tr); const cap = box(.62, .2, .95, m.acajouL, true); cap.position.set(sd * (BAYW / 2 + .23), 4.95, .45); bg.add(cap); });
      const val = box(BAYW + .3, .8, .5, m.acajou, true); val.position.set(0, 3.25, .33); bg.add(val);
      const vw = 5.2, vp = mesh(new THREE.PlaneGeometry(vw, vw * 282 / 2048), new THREE.MeshStandardMaterial({ map: T.valance(theme.nom, ti + 1, dom.themes.length), roughness: .5 })); vp.position.set(0, 3.25, .585); bg.add(vp);
      const strip = mesh(new THREE.BoxGeometry(BAYW - .6, .035, .06), new THREE.MeshBasicMaterial({ color: '#FFE3B8' })); strip.position.set(0, 2.83, .56); bg.add(strip);
      [4.3, 4.93].forEach((y) => { const b2 = box(BAYW, .05, .62, m.acajouL, true); b2.position.set(0, y - .025, .36); bg.add(b2); });
      bg.add(fillBooks(BAYW, [[3.65, .3, .5], [4.3, .32, .58]], (di + 1) * 100 + ti, dom));
      const pt = new THREE.PointLight('#FFE6C4', .3, 6, 1.4); pt.position.set(0, 2.5, 1.7); bg.add(pt);

      const bay = { theme, ti, xc, group: bg, books: [] };
      const bh = hitPlane(BAYW + .8, 6, { kind: 'bay', bay }); bh.position.set(0, 3, .06); bg.add(bh); R.pickables.push(bh);
      theme.livres.forEach((livre, li) => {
        const x = (li - 1.5) * 1.62, bw = .8, bhh = 1.1;
        const bk = L.makeBook({ w: bw, h: bhh, t: .1, color: dom.cuir, cover: T.cover(livre), page: T.titlePage(livre), endpaper: T.endpaper(dom) });
        bk.root.position.set(x, .98 + bhh / 2 * Math.cos(.13) + .02, .5); bk.root.rotation.set(-.13, 0, 0); bg.add(bk.root);
        const lip = box(bw + .08, .04, .12, m.brass); lip.position.set(x, .99, .62); bg.add(lip);
        const ref = { livre, bk, bay, id: livre.id, home: { p: bk.root.position.clone(), r: bk.root.rotation.clone() }, anchor: new THREE.Vector3(xc + x, 1.0, RZ0 + .9), hv: 0 };
        bk.root.traverse((o) => { if (o.isMesh) { o.userData.pick = { kind: 'book', ref }; R.pickables.push(o); } });
        bay.books.push(ref); R.books.push(ref);
      });
      R.bays.push(bay);
    });
    // échelles roulantes
    [-3.6, 10.8].forEach((x) => { const ld = new THREE.Group(); [-.22, .22].forEach((dx) => { const r = box(.05, 4.4, .04, m.acajouL, true); r.position.set(dx, 2.2, 0); ld.add(r); }); for (let y = .35; y < 4.3; y += .32) { const rg = box(.44, .035, .04, m.acajou, false); rg.position.set(0, y, 0); ld.add(rg); } ld.position.set(x, 0, RZ0 + 1.05); ld.rotation.x = -.1; g.add(ld); });

    // lumière : soleil rasant par les fenêtres, remplissage chaud
    const sun = new THREE.DirectionalLight('#FFE3BE', 1.0); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 7; sc.bottom = -2; sc.near = 1; sc.far = 40; sun.shadow.bias = -.0005; sun.shadow.normalBias = .02;
    g.add(sun); g.add(sun.target); R.sun = sun;
    const hemi = new THREE.HemisphereLight('#FFF4E4', '#7A3345', .32); g.add(hemi);
    for (let i = 0; i < 9; i++) { const c = candle(1.0), x = -20 + i * 5 + (i % 2) * 1.3, y = 6.8 + (i % 3) * .5; c.position.set(x, y, RZ0 + 2.6 + (i % 2) * 1.4); c.userData.base = y; g.add(c); R.candles.push(c); }
    R.focus = (x) => { sun.position.set(x + 5, 13, RZ0 + 14); sun.target.position.set(x, 1.8, RZ0); sun.target.updateMatrixWorld(); };
    R.focus(S.BAY_X[0]);
    R.update = (dt, t) => R.candles.forEach((c, i) => { c.position.y = c.userData.base + Math.sin(t * .7 + i) * .1; flicker(c, t); });
    return R;
  };
})();
