/* Monde 1 : la Grande salle, bibliothèque française ancienne.
   Au centre, à égalité : le premier Code civil (Droit, Édition) et l'installation « Le Grand Livre du Chiffre ».
   Six portes, une par univers. Aucun halo permanent, aucune flamme : lumière fixe. */

(function () {
  'use strict';
  const L = window.LDC, T = L.tex, C = L.C, PI = Math.PI;
  const S = L.S = {};

  /* ---------- ressources partagées ---------- */
  const keep = new Set();
  let M = null;
  const shared = () => {
    if (M) return M;
    const k = (o) => { keep.add(o); return o; }, std = (o) => k(new THREE.MeshStandardMaterial(o));
    M = {
      wood: std({ map: T.wood('wood', C.wood, 5), roughness: .5, metalness: .04 }),
      woodL: std({ map: T.wood('woodL', C.woodL, 8), roughness: .45 }),
      stone: std({ map: T.stone(), roughness: .9 }),
      bronze: std({ color: C.bronze, metalness: .85, roughness: .34 }),
      steel: std({ color: '#C5CBD0', metalness: .92, roughness: .28 }),
      glass: std({ color: '#DDEFF7', transparent: true, opacity: .2, roughness: .06, metalness: 0, envMapIntensity: 1.3, side: THREE.DoubleSide, depthWrite: false }),
      lamp: k(new THREE.MeshBasicMaterial({ color: '#FFF1DC' })),
    };
    return M;
  };
  S.shared = shared;
  S.isShared = (o) => keep.has(o);
  S.keep = (o) => { keep.add(o); return o; };
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
  S.h = { mesh, box, scaleUV, archShape, archGeo, hitPlane };
  S.archGeo = archGeo; S.scaleUV = scaleUV;

  /* Forme récurrente de la charte en géométrie (carnets, en-têtes de stations). */
  S.brandShape = (w, h, r, nw, nh) => {
    nw = nw == null ? w * .2 : nw; nh = nh == null ? h * .13 : nh; const x = -w / 2, y = -h / 2, s = new THREE.Shape();
    s.moveTo(x + r, y + h); s.lineTo(x + w - nw - r, y + h); s.quadraticCurveTo(x + w - nw, y + h, x + w - nw, y + h - r); s.lineTo(x + w - nw, y + h - nh); s.lineTo(x + w - r, y + h - nh);
    s.quadraticCurveTo(x + w, y + h - nh, x + w, y + h - nh - r); s.lineTo(x + w, y + r); s.quadraticCurveTo(x + w, y, x + w - r, y); s.lineTo(x + r, y); s.quadraticCurveTo(x, y, x, y + r); s.lineTo(x, y + h - r); s.quadraticCurveTo(x, y + h, x + r, y + h);
    return s;
  };
  S.brandFace = (w, h, r) => { const g = new THREE.ShapeGeometry(S.brandShape(w, h, r), 12), uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h); return g; };
  S.brandBody = (w, h, r, d) => new THREE.ExtrudeGeometry(S.brandShape(w, h, r), { depth: d, bevelEnabled: true, bevelSize: .008, bevelThickness: .008, bevelSegments: 2, curveSegments: 8 });

  /* Lumière d'ambiance : un décor dégradé chaud (clay) converti en environnement. */
  S.makeEnv = (renderer) => {
    const sc = new THREE.Scene(), cv = document.createElement('canvas'); cv.width = 8; cv.height = 256; const g = cv.getContext('2d');
    const q = g.createLinearGradient(0, 0, 0, 256); q.addColorStop(0, '#E8DACB'); q.addColorStop(.5, '#B49C8B'); q.addColorStop(1, '#4A2A24'); g.fillStyle = q; g.fillRect(0, 0, 8, 256);
    const tx = new THREE.CanvasTexture(cv); tx.encoding = THREE.sRGBEncoding;
    sc.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.MeshBasicMaterial({ map: tx, side: THREE.BackSide })));
    [[0, 14, 25], [0, 14, -25], [25, 12, 0], [-25, 12, 0]].forEach(([x, y, z]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), new THREE.MeshBasicMaterial({ color: '#EFE3D5', side: THREE.DoubleSide })); p.position.set(x, y, z); p.lookAt(0, 3, 0); sc.add(p); });
    const pm = new THREE.PMREMGenerator(renderer), env = pm.fromScene(sc, .04).texture; pm.dispose(); tx.dispose();
    return env;
  };

  /* ---------- une porte (un univers) ---------- */
  const makeDoor = (monde) => {
    const m = shared(), A = monde.accentCfg, g = new THREE.Group(), w = 2.9, hTot = 4.2, hLeaf = 2.75, r = w / 2, dep = 2.4;
    const outer = archShape(w + 1.0, hTot + .5); outer.holes.push(archShape(w, hTot));
    const frame = mesh(new THREE.ExtrudeGeometry(outer, { depth: .6, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 2, curveSegments: 32 }), m.stone, true); frame.position.z = -.15; g.add(frame);
    const ts = archShape(w + .14, hTot + .07); ts.holes.push(archShape(w, hTot));
    const trim = mesh(new THREE.ExtrudeGeometry(ts, { depth: .06, bevelEnabled: false, curveSegments: 32 }), m.bronze); trim.position.z = .44; g.add(trim);
    const side = new THREE.MeshStandardMaterial({ color: '#6F4B40', roughness: .9, side: THREE.DoubleSide });
    [[-r, 1], [r, -1]].forEach(([x, s]) => { const p = mesh(new THREE.PlaneGeometry(dep, hTot), side); p.rotation.y = s * PI / 2; p.position.set(x, hTot / 2, -dep / 2); g.add(p); });
    const roof = mesh(new THREE.PlaneGeometry(w, dep), side); roof.rotation.x = PI / 2; roof.position.set(0, hTot, -dep / 2); g.add(roof);
    const flo = mesh(new THREE.PlaneGeometry(w, dep), new THREE.MeshStandardMaterial({ color: A.deep, roughness: .5 })); flo.rotation.x = -PI / 2; flo.position.set(0, .01, -dep / 2); g.add(flo);
    const back = mesh(new THREE.PlaneGeometry(w, hTot), new THREE.MeshBasicMaterial({ map: T.vestibule(monde) })); back.position.set(0, hTot / 2, -dep); g.add(back);
    const sh = new THREE.Shape(); sh.moveTo(-r, hLeaf); sh.lineTo(r, hLeaf); sh.absarc(0, hLeaf, r, 0, PI, false); sh.lineTo(-r, hLeaf);
    const ug = new THREE.ShapeGeometry(sh, 32); const up = ug.attributes.position, uu = ug.attributes.uv; for (let i = 0; i < uu.count; i++) uu.setXY(i, (up.getX(i) + r) / w, (up.getY(i) - hLeaf) / r);
    const trans = mesh(ug, new THREE.MeshBasicMaterial({ map: T.transom(monde), transparent: true })); trans.position.z = .02; g.add(trans);
    const lw = r - .015, leafGeo = new THREE.BoxGeometry(lw, hLeaf, .07), leaves = [];
    [[-1, 1], [1, -1]].forEach(([sx, dir]) => {
      const pv = new THREE.Group(); pv.position.set(sx * r, 0, 0); const lf = mesh(leafGeo, new THREE.MeshStandardMaterial({ map: T.doorLeaf(), roughness: .5, metalness: .05 }), true); lf.position.set(-sx * lw / 2, hLeaf / 2, 0); pv.add(lf);
      const hd = mesh(new THREE.CylinderGeometry(.025, .025, .5, 10), m.bronze); hd.position.set(-sx * (lw - .12), 1.15, .07); pv.add(hd);
      g.add(pv); leaves.push({ pv, dir });
    });
    const plaque = mesh(new THREE.PlaneGeometry(2.4, 2.4 * 200 / 1024), new THREE.MeshStandardMaterial({ map: T.plaque(monde), roughness: .5 })); plaque.position.set(0, hTot + .26, .44); g.add(plaque);
    const api = { group: g, state: 0, target: 0 };
    api.apply = () => { const a = api.state * 1.75; leaves[0].pv.rotation.y = a; leaves[1].pv.rotation.y = -a; };
    api.apply();
    return api;
  };

  /* ---------- l'installation « Le Grand Livre du Chiffre » (réutilisée dans l'observatoire) ---------- */
  S.buildChiffre = (pk) => {
    const m = shared(), g = new THREE.Group(), pick = (o) => { o.userData.pick = pk; return o; }, picks = [];
    const add = (o, p) => { g.add(o); if (p) { pick(o); picks.push(o); } return o; };
    const base = mesh(new THREE.CylinderGeometry(1.0, 1.12, .12, 48), m.stone, true); base.position.y = .06; add(base, true);
    const col = mesh(new THREE.CylinderGeometry(.09, .14, .96, 20), m.steel, true); col.position.y = .6; add(col, true);
    const leg = (a) => { const l = mesh(new THREE.CylinderGeometry(.035, .05, 1.0, 10), m.steel, true); l.position.set(Math.cos(a) * .55, .62, Math.sin(a) * .35); l.rotation.set(Math.sin(a) * .3, 0, -Math.cos(a) * .3); return l; };
    [PI / 2, PI / 2 + 2.1, PI / 2 - 2.1].forEach((a) => add(leg(a), true));
    const TILT = .34, top = box(2.0, .08, 1.4, m.woodL, true); top.position.y = 1.18; top.rotation.x = TILT; add(top, true);
    const lg = L.makeBook({ w: .86, h: 1.1, t: .09, color: C.blueDeep, cover: T.ledgerCover(), page: T.ledger(0), endpaper: T.ledger(1), open: 1 });
    /* le grand livre repose sur le plateau incliné : même normale que le plateau, décalé d'une demi-épaisseur */
    lg.root.rotation.x = TILT - PI / 2; lg.root.scale.setScalar(1.2); lg.root.position.set(0, 1.18 + Math.cos(TILT) * .1, Math.sin(TILT) * .1 + .02); g.add(lg.root);
    lg.root.traverse((o) => { if (o.isMesh) { pick(o); picks.push(o); } });
    /* trois disques de verre gravés d'une courbe, suspendus (ratios, performance, arbitrage) */
    const discs = [];
    [[.98, 2.15, 0], [.78, 2.6, 1], [.58, 3.05, 2]].forEach(([r, y, i]) => {
      const dg = new THREE.Group(); dg.position.set(0, y, 0); dg.rotation.set(.2 - i * .12, i * .9, 0);
      const disc = mesh(new THREE.CylinderGeometry(r, r, .025, 64), m.glass); dg.add(disc);
      const face = mesh(new THREE.CircleGeometry(r * .98, 64), new THREE.MeshBasicMaterial({ map: T.glassCurve(5 + i), transparent: true, depthWrite: false })); face.rotation.x = -PI / 2; face.position.y = .016; dg.add(face);
      const ring = mesh(new THREE.TorusGeometry(r, .012, 8, 64), m.steel); ring.rotation.x = PI / 2; dg.add(ring);
      [disc, face].forEach((o) => { pick(o); picks.push(o); });
      g.add(dg); discs.push(dg);
    });
    [-1, 1].forEach((s) => { const rod = mesh(new THREE.CylinderGeometry(.012, .012, 2.0, 8), m.steel); rod.position.set(s * .95, 2.2, -.1); g.add(rod); });
    const arc = mesh(new THREE.TorusGeometry(.95, .014, 8, 48, PI), m.steel); arc.position.set(0, 3.2, -.1); g.add(arc);
    return { group: g, picks, discs, ledger: lg };
  };

  /* ====================================================================================== */
  /*  GRANDE SALLE                                                                           */
  /* ====================================================================================== */

  const HR = 11, HH = 9.8, GY = 5.2;
  S.HR = HR; S.HALL_STEP = PI / 3; S.DOOR0 = -5 * PI / 6;
  /* angle de la porte de l'univers k (Droit et Chiffre encadrent l'axe central, au fond de la salle) */
  S.doorPhi = (k) => S.DOOR0 - k * PI / 3;
  S.CODE_X = -2.35; S.CHIFFRE_X = 2.35;

  S.buildHall = (mondes) => {
    const m = shared(), g = new THREE.Group(), R = { group: g, kind: 'hall', pickables: [], doors: [], anim: [] };
    const floor = mesh(scaleUV(new THREE.CircleGeometry(HR + .3, 96), 5.65, 5.65), new THREE.MeshStandardMaterial({ map: T.marble(), roughness: .26, metalness: .04, envMapIntensity: .9 })); floor.rotation.x = -PI / 2; floor.receiveShadow = true; g.add(floor);
    const ros = mesh(new THREE.CircleGeometry(5.4, 96), new THREE.MeshStandardMaterial({ map: T.rosace(), transparent: true, roughness: .35, envMapIntensity: .8 })); ros.rotation.x = -PI / 2; ros.position.y = .012; g.add(ros);
    /* murs : bibliothèques interrompues par six portes (aux angles π/6 + nπ/3) */
    const gap = Math.asin(1.5 / HR), arc = PI / 3 - 2 * gap, wallMat = new THREE.MeshStandardMaterial({ map: T.bookwall(1), roughness: .8, side: THREE.BackSide, emissive: '#3A1012', emissiveIntensity: .32 });
    for (let k = 0; k < 6; k++) {
      const phi = PI / 6 + k * PI / 3;
      const a = mesh(scaleUV(new THREE.CylinderGeometry(HR, HR, HH, 32, 1, true, phi + gap, arc), HR * arc / 4, HH / 4), wallMat); a.position.y = HH / 2; g.add(a);
      const h = mesh(scaleUV(new THREE.CylinderGeometry(HR, HR, HH - 4.5, 10, 1, true, phi - gap, 2 * gap), HR * 2 * gap / 4, (HH - 4.5) / 4), wallMat); h.position.y = 4.5 + (HH - 4.5) / 2; g.add(h);
    }
    const sh = new THREE.Shape(); sh.absarc(0, 0, HR, 0, PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, 9.7, 0, PI * 2, true); sh.holes.push(hole);
    const slab = mesh(new THREE.ExtrudeGeometry(sh, { depth: .3, bevelEnabled: false, curveSegments: 96 }), m.wood, true); slab.rotation.x = -PI / 2; slab.position.y = GY - .3; g.add(slab);
    const mold = mesh(new THREE.TorusGeometry(9.72, .1, 8, 96), m.bronze); mold.rotation.x = PI / 2; mold.position.y = GY - .3; g.add(mold);
    const bal = mesh(scaleUV(new THREE.CylinderGeometry(9.74, 9.74, 1.0, 96, 1, true), 9.74 * PI * 2 / 1.9, 1), new THREE.MeshStandardMaterial({ map: T.balustrade(), transparent: true, alphaTest: .35, side: THREE.DoubleSide, roughness: .5 })); bal.position.y = GY + .5; g.add(bal);
    const rail = mesh(new THREE.TorusGeometry(9.74, .055, 8, 96), m.bronze); rail.rotation.x = PI / 2; rail.position.y = GY + 1.0; g.add(rail);
    const corn = mesh(new THREE.TorusGeometry(HR - .1, .25, 8, 96), m.stone); corn.rotation.x = PI / 2; corn.position.y = HH; g.add(corn);
    const corn2 = mesh(new THREE.TorusGeometry(HR - .1, .05, 6, 96), m.bronze); corn2.rotation.x = PI / 2; corn2.position.y = HH - .3; g.add(corn2);
    const dome = mesh(new THREE.SphereGeometry(HR, 64, 20, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ map: T.dome(), roughness: .85, side: THREE.BackSide, emissive: '#6A5040', emissiveIntensity: .3 })); dome.scale.y = .5; dome.position.y = HH; g.add(dome);
    const oc = mesh(new THREE.CircleGeometry(1.5, 40), new THREE.MeshBasicMaterial({ color: '#FFFFFF' })); oc.rotation.x = PI / 2; oc.position.y = HH + HR * .5 - .03; g.add(oc);
    /* fenêtres hautes entre les portes (dont une au centre du fond de salle, entre Droit et Chiffre) */
    for (let k = 0; k < 6; k++) {
      const phi = k * PI / 3, wg = new THREE.Group(); wg.position.set((HR - .05) * Math.sin(phi), 0, (HR - .05) * Math.cos(phi)); wg.rotation.y = phi + PI; g.add(wg);
      const glass = mesh(archGeo(2.2, 3.4), new THREE.MeshBasicMaterial({ map: T.windowGlass() })); glass.position.set(0, 5.8, .02); wg.add(glass);
      const o = archShape(2.8, 3.8); o.holes.push(archShape(2.2, 3.4)); const fr = mesh(new THREE.ExtrudeGeometry(o, { depth: .35, bevelEnabled: false, curveSegments: 24 }), m.stone, true); fr.position.set(0, 5.6, -.02); wg.add(fr);
      const sill = box(3.2, .14, .55, m.stone); sill.position.set(0, 5.55, .22); wg.add(sill);
    }
    /* portes */
    mondes.forEach((mo) => {
      const phi = S.doorPhi(mo.k), d = makeDoor(mo);
      d.group.position.set(HR * Math.sin(phi), 0, HR * Math.cos(phi)); d.group.rotation.y = phi + PI; g.add(d.group);
      const hit = hitPlane(3.9, 4.7, { kind: 'door', k: mo.k, monde: mo }); hit.position.set(0, 2.35, .5); d.group.add(hit); R.pickables.push(hit);
      d.monde = mo; d.k = mo.k; d.phi = phi; d.pos = new THREE.Vector3(HR * Math.sin(phi), 0, HR * Math.cos(phi)); R.doors.push(d);
    });
    /* suspensions fixes (aucune flamme, aucun vacillement) */
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + .2, rr = 7.4, y = 7.4 + (i % 2) * .5, lg = new THREE.Group(); lg.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); const cord = mesh(new THREE.CylinderGeometry(.01, .01, 1.8, 6), m.bronze); cord.position.y = .9; lg.add(cord); const lp = mesh(new THREE.CylinderGeometry(.22, .3, .22, 24), m.bronze); lg.add(lp); const lt = mesh(new THREE.CircleGeometry(.22, 24), m.lamp); lt.rotation.x = PI / 2; lt.position.y = -.12; lg.add(lt); g.add(lg); }
    g.add(new THREE.HemisphereLight('#FFF4E6', '#7A3A36', .42));
    const pl = new THREE.PointLight('#FFEBD2', .38, 28, 1.1); pl.position.set(0, 7.5, 0); g.add(pl);

    /* ---- pièce centrale gauche : le premier Code civil (Droit · Édition) ---- */
    const pkC = { kind: 'code' }, cx = S.CODE_X, lec = new THREE.Group(); lec.position.set(cx, 0, 0); g.add(lec);
    const st1 = mesh(new THREE.CylinderGeometry(1.4, 1.52, .22, 48), m.stone, true); st1.position.y = .11;
    const st2 = mesh(new THREE.CylinderGeometry(1.05, 1.14, .2, 48), m.wood, true); st2.position.y = .32;
    const rim2 = mesh(new THREE.TorusGeometry(1.05, .03, 8, 64), m.bronze); rim2.rotation.x = PI / 2; rim2.position.y = .43;
    const colm = mesh(new THREE.CylinderGeometry(.15, .24, .95, 16), m.wood, true); colm.position.y = .93;
    const plate = box(1.1, .07, .8, m.woodL, true); plate.position.y = 1.46; plate.rotation.x = .32;
    [st1, st2, colm, plate].forEach((o) => { o.userData.pick = pkC; lec.add(o); R.pickables.push(o); }); lec.add(rim2);
    const hub = new THREE.Group(); hub.position.y = 2.18; lec.add(hub);
    const hb = L.makeBook({ w: .62, h: .86, t: .09, color: '#4B0000', cover: T.codeCover(), page: T.codePage(), endpaper: T.codeTitle(), open: 1 });
    hb.root.rotation.x = -.5; hb.root.scale.setScalar(1.55); hub.add(hb.root);
    hb.root.traverse((o) => { if (o.isMesh) { o.userData.pick = pkC; R.pickables.push(o); } });
    const l1 = new THREE.PointLight('#FFE8CC', .7, 8, 1.4); l1.position.set(cx, 3.2, 1.2); g.add(l1);
    R.hub = hub; R.codeCenter = new THREE.Vector3(cx, 2.18, 0);

    /* ---- pièce centrale droite : le Grand Livre du Chiffre / la table des décisions ---- */
    const pkD = { kind: 'chiffre' }, ch = S.buildChiffre(pkD); ch.group.position.set(S.CHIFFRE_X, 0, 0); g.add(ch.group); ch.picks.forEach((o) => R.pickables.push(o));
    const l2 = new THREE.PointLight('#F3F6FA', .6, 8, 1.4); l2.position.set(S.CHIFFRE_X, 3.4, 1.4); g.add(l2);
    R.chiffre = ch; R.chiffreCenter = new THREE.Vector3(S.CHIFFRE_X, 1.55, 0);
    R.anchors = { code: new THREE.Vector3(cx, .18, 1.9), chiffre: new THREE.Vector3(S.CHIFFRE_X, .18, 1.9) };

    R.camPos = new THREE.Vector3(0, 2, 6);
    R.update = (dt, t, reduced) => {
      hub.rotation.y = L.clamp(Math.atan2(R.camPos.x - cx, R.camPos.z), -.55, .55);
      if (!reduced) ch.discs.forEach((d, i) => { d.rotation.y += dt * (.05 + i * .02); });
      R.doors.forEach((d) => { if (Math.abs(d.target - d.state) > .0005) { d.state += (d.target - d.state) * Math.min(1, dt * 3.2); d.apply(); } });
    };
    return R;
  };
})();
