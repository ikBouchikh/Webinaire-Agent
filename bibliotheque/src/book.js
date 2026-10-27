/* Le « grand livre » : reliure en cuir, dorures, couverture qui pivote sur le dos,
   feuillets qui tournent, page de titre à droite, ex-libris à gauche. */

(function () {
  const L = window.LDC, T = L.tex, B = L.C;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  L.ease = ease; L.clamp01 = clamp01;

  let pageEdgeTex = null;
  const pageEdge = () => {
    if (pageEdgeTex) return pageEdgeTex;
    const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = '#efe4c8'; g.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 3) { g.fillStyle = y % 6 ? 'rgba(120,90,50,.28)' : 'rgba(255,255,255,.35)'; g.fillRect(0, y, 64, 1); }
    pageEdgeTex = new THREE.CanvasTexture(c); pageEdgeTex.encoding = THREE.sRGBEncoding; return pageEdgeTex;
  };

  /* opts : w, h, t (largeur, hauteur, épaisseur d'une couverture fermée), color, cover, page, endpaper */
  L.makeBook = (o) => {
    const w = o.w || .52, h = o.h || .74, t = o.t || .075;
    const root = new THREE.Group(), inner = new THREE.Group(); root.add(inner);
    const leather = new THREE.MeshStandardMaterial({ color: o.color || '#5a1420', roughness: .55, metalness: .06 });
    const coverMat = new THREE.MeshStandardMaterial({ map: o.cover, roughness: .5, metalness: .1 });
    const endMat = new THREE.MeshStandardMaterial({ map: o.endpaper, roughness: .85, color: '#E6DDD0' });
    const edgeMat = new THREE.MeshStandardMaterial({ map: pageEdge(), roughness: 1 });
    const faceMat = new THREE.MeshStandardMaterial({ map: o.page, roughness: .95, color: '#E6DDD0' });
    const plainMat = new THREE.MeshStandardMaterial({ color: '#efe4c8', roughness: 1 });

    const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, .012), leather); back.position.set(0, 0, -t / 2 + .006);
    const spine = new THREE.Mesh(new THREE.BoxGeometry(.034, h, t), leather); spine.position.set(-w / 2 + .017, 0, 0);
    const pages = new THREE.Mesh(new THREE.BoxGeometry(w - .045, h - .03, t - .026), [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, plainMat]);
    pages.position.set(.006, 0, 0);
    // bandes dorées sur le dos
    const bandMat = new THREE.MeshStandardMaterial({ color: B.bronzeL, metalness: .85, roughness: .35 });
    [-.36, -.28, .28, .36].forEach((f) => { const b = new THREE.Mesh(new THREE.BoxGeometry(.038, .012, t + .004), bandMat); b.position.set(-w / 2 + .017, f * h, 0); inner.add(b); });

    const coverPivot = new THREE.Group(); coverPivot.position.set(-w / 2, 0, t / 2 - .006);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(w, h, .012), [leather, leather, leather, leather, coverMat, endMat]); cover.position.x = w / 2;
    coverPivot.add(cover);

    // feuillets qui tournent puis s'effacent
    const sheets = [];
    for (let i = 0; i < 3; i++) {
      const pv = new THREE.Group(); pv.position.set(-w / 2 + .02, 0, t / 2 - .013 - i * .003);
      const m = new THREE.MeshStandardMaterial({ color: '#f1e7d0', roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 1, emissive: new THREE.Color('#3a2a10') });
      const s = new THREE.Mesh(new THREE.PlaneGeometry(w - .06, h - .04), m); s.position.x = (w - .06) / 2;
      pv.add(s); inner.add(pv); sheets.push({ pv, m });
    }
    // marque-page
    const rib = new THREE.Mesh(new THREE.PlaneGeometry(.035, h * .34), new THREE.MeshStandardMaterial({ color: B.red, roughness: .7, side: THREE.DoubleSide }));
    rib.position.set(.04, -h / 2 - h * .12, -t / 2 + .02);

    inner.add(back, spine, pages, coverPivot, rib);
    root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    const state = { p: 0 };
    const api = {
      root, inner, w, h, t, state, faceMat, leather, coverMat, endMat, pages,
      setOpen(p) {
        state.p = p; const e = ease(clamp01(p));
        coverPivot.rotation.y = -e * Math.PI * .985;
        sheets.forEach((s, i) => { const q = clamp01((p - .12 - i * .11) / .6); const eq = ease(q); s.pv.rotation.y = -eq * Math.PI * (.9 - i * .03); s.m.opacity = q > .55 ? clamp01(1 - (q - .55) / .45) : 1; s.pv.visible = p > .08 && s.m.opacity > .01; });
        inner.position.x = e * w / 2;
        rib.visible = e > .6;
      },
      dispose() { root.traverse((m) => { if (m.isMesh) { m.geometry.dispose(); [].concat(m.material).forEach((mm) => mm.dispose()); } }); },
    };
    api.setOpen(o.open || 0);
    return api;
  };
})();
