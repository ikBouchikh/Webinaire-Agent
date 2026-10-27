/* Matières et visuels dessinés en canvas (aucun fichier image) aux couleurs de la charte :
   rouge, clay (beiges), bleu et ocre en touches. Titres en IBM Plex Serif, catégories en IBM Plex Mono,
   interface en IBM Plex Sans (polices locales, assets/fonts). */

(function () {
  'use strict';
  const L = window.LDC;
  const C = L.C = {
    red: '#D71635', redHi: '#FF1E1E', redDeep: '#4B0000', redInk: '#3B0000',
    clay1: '#FAFAF5', clay2: '#F2EEE1', clay3: '#EBDCCD', clay4: '#E1C8B4', clay5: '#CDB4A5',
    blue: '#1E87BE', blueDeep: '#081F2C', ocre: '#FA914B', ocreDeep: '#CD5008', ink: '#1A1210',
    /* matières de la Grande salle (ancien monde) : bois sombre et bronze, dérivés du rouge profond et de l'ocre */
    wood: '#3A1812', woodL: '#5A2A20', bronze: '#B58A55', bronzeL: '#DDB985', bronzeD: '#6E4E2A', ash: '#D9BE9C',
  };
  const SERIF = L.SERIF = '"IBM Plex Serif", Georgia, "Times New Roman", serif';
  const SANS = L.SANS = '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif';
  const MONO = L.MONO = '"IBM Plex Mono", "Courier New", monospace';
  const T = L.tex = {};
  const cache = {}, owned = [];

  T.rng = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rng = T.rng;
  const mk = T.mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const tex = T.tex = (c, o = {}) => {
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = T.aniso || 8;
    if (o.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (o.own) owned.push(t);
    return t;
  };
  const memo = (k, fn) => (cache[k] || (cache[k] = fn()));
  T.disposeOwned = () => { owned.splice(0).forEach((t) => t.dispose()); };

  const rr = T.rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  /* Forme récurrente de la charte : rectangle arrondi, encoche en haut à droite (silhouette du symbole). */
  const brand = T.brand = (g, x, y, w, h, r, nw, nh) => {
    nw = nw == null ? w * .2 : nw; nh = nh == null ? h * .13 : nh;
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - nw - r, y); g.arcTo(x + w - nw, y, x + w - nw, y + r, r); g.lineTo(x + w - nw, y + nh); g.lineTo(x + w - r, y + nh);
    g.arcTo(x + w, y + nh, x + w, y + nh + r, r); g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r); g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r); g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.closePath();
  };
  const wrap = T.wrap = (g, text, maxW) => { const words = String(text).split(' '), lines = []; let cur = ''; words.forEach((w) => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; };
  const spaced = T.spaced = (g, px) => { try { g.letterSpacing = px + 'px'; } catch (e) { /* ignoré */ } };
  const noise = T.noise = (g, w, h, n, r, a = .06) => { for (let i = 0; i < n; i++) { g.fillStyle = r() > .5 ? `rgba(255,255,255,${a * r()})` : `rgba(0,0,0,${a * 1.5 * r()})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } };
  T.shade = (hex, amt) => { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  T.hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const bronze = (g, x0, y0, x1, y1) => { const q = g.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, C.bronzeD); q.addColorStop(.35, C.bronzeL); q.addColorStop(.62, C.bronze); q.addColorStop(1, C.bronzeD); return q; };

  /* ====================== Grande salle : la bibliothèque ancienne ====================== */

  T.marble = () => memo('marble', () => {
    const [c, g] = mk(1024, 1024), r = rng(7);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const dark = (i + j) % 2, x = i * 256, y = j * 256;
      g.fillStyle = dark ? '#4B0000' : C.clay4; g.fillRect(x, y, 256, 256);
      for (let k = 0; k < 7; k++) { g.strokeStyle = dark ? `rgba(255,214,200,${.05 + r() * .08})` : `rgba(110,70,50,${.05 + r() * .08})`; g.lineWidth = .8 + r() * 2; g.beginPath(); g.moveTo(x + r() * 256, y); g.bezierCurveTo(x + r() * 256, y + 90, x + r() * 256, y + 170, x + r() * 256, y + 256); g.stroke(); }
      g.strokeStyle = dark ? 'rgba(20,0,0,.5)' : 'rgba(110,80,50,.4)'; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, 253, 253);
    }
    noise(g, 1024, 1024, 9000, r, .05);
    return tex(c, { repeat: true });
  });

  T.stone = () => memo('stone', () => {
    const [c, g] = mk(1024, 1024), r = rng(13);
    g.fillStyle = C.clay5; g.fillRect(0, 0, 1024, 1024);
    for (let y = 0; y < 1024; y += 128) { const off = (y / 128) % 2 ? 128 : 0; for (let x = -256; x < 1024; x += 256) { const l = 76 + r() * 6; g.fillStyle = `hsl(28,${24 + r() * 8}%,${l}%)`; g.fillRect(x + off + 3, y + 3, 250, 122); } }
    noise(g, 1024, 1024, 14000, r, .07);
    return tex(c, { repeat: true });
  });

  T.wood = (key, base, seed) => memo('wood:' + key, () => {
    const [c, g] = mk(512, 512), r = rng(seed || 3);
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 80; i++) { const x = r() * 512; g.strokeStyle = r() > .5 ? `rgba(0,0,0,${.05 + r() * .1})` : `rgba(255,220,200,${.03 + r() * .05})`; g.lineWidth = .6 + r() * 2; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + r() * 26 - 13, 170, x + r() * 26 - 13, 340, x + r() * 18 - 9, 512); g.stroke(); }
    noise(g, 512, 512, 2200, r, .05);
    return tex(c, { repeat: true });
  });

  /* Rayonnages peints : dos de livres rouges et clay, touches de bleu et d'ocre (proportions de la charte). */
  T.bookwall = (seed = 1) => memo('bw:' + seed, () => {
    const [c, g] = mk(2048, 2048), r = rng(seed * 97 + 5);
    const pal = ['#4B0000', '#3B0000', '#6B0A12', '#D71635', '#4B0000', '#3B0000', '#8A1A1A', '#E1C8B4', '#CDB4A5', '#EBDCCD', '#4B0000', '#1E87BE', '#081F2C', '#CD5008', '#6B0A12', '#3B0000'];
    const rows = 8, sh = 2048 / rows;
    for (let s = 0; s < rows; s++) {
      const y0 = s * sh; const bg = g.createLinearGradient(0, y0, 0, y0 + sh); bg.addColorStop(0, '#190606'); bg.addColorStop(1, '#2C0F0C'); g.fillStyle = bg; g.fillRect(0, y0, 2048, sh);
      let x = 0;
      while (x < 2048) {
        const w = 20 + r() * 34, h = 150 + r() * 70, col = pal[(r() * pal.length) | 0]; if (r() < .05) { x += 30 + r() * 50; continue; }
        const top = y0 + sh - 22 - h, gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(.3, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.45)');
        g.fillStyle = col; g.fillRect(x, top, w, h); g.fillStyle = gr; g.fillRect(x, top, w, h);
        g.fillStyle = r() > .4 ? C.bronzeD : C.bronzeL; g.fillRect(x, top + 12 + r() * 8, w, 3); g.fillRect(x, top + h - 26 - r() * 8, w, 3);
        if (r() > .5) { g.fillStyle = 'rgba(225,200,180,.55)'; g.fillRect(x + w * .22, top + h * .32, w * .56, h * .2); }
        x += w + 1;
      }
      const wd = g.createLinearGradient(0, y0 + sh - 22, 0, y0 + sh); wd.addColorStop(0, C.woodL); wd.addColorStop(.25, '#6E3426'); wd.addColorStop(1, '#2A0E0A'); g.fillStyle = wd; g.fillRect(0, y0 + sh - 22, 2048, 22);
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, y0 + sh - 44, 2048, 22);
    }
    return tex(c, { repeat: true });
  });

  T.dome = () => memo('dome', () => {
    const [c, g] = mk(2048, 512);
    const bg = g.createLinearGradient(0, 0, 0, 512); bg.addColorStop(0, C.clay1); bg.addColorStop(1, C.clay4); g.fillStyle = bg; g.fillRect(0, 0, 2048, 512);
    for (let i = 0; i < 24; i++) { const x = i * 2048 / 24; g.fillStyle = i % 2 ? 'rgba(110,60,40,.07)' : 'rgba(255,255,255,.12)'; g.fillRect(x, 0, 2048 / 24, 512); }
    for (let i = 0; i < 12; i++) { const x = i * 2048 / 12; g.fillStyle = C.redDeep; g.fillRect(x - 10, 0, 20, 512); g.fillStyle = bronze(g, 0, 0, 0, 512); g.fillRect(x - 3, 0, 6, 512); }
    for (let k = 1; k < 5; k++) { g.fillStyle = C.redDeep; g.fillRect(0, k * 96, 2048, 12); g.fillStyle = C.bronze; g.fillRect(0, k * 96 + 4, 2048, 4); }
    return tex(c);
  });

  T.balustrade = () => memo('bal', () => {
    const [c, g] = mk(512, 256); g.clearRect(0, 0, 512, 256);
    for (let x = 16; x < 512; x += 64) { const q = g.createLinearGradient(x - 14, 0, x + 14, 0); q.addColorStop(0, '#2A0E0A'); q.addColorStop(.4, '#8A4A3C'); q.addColorStop(1, '#2A0E0A'); g.fillStyle = q; g.beginPath(); g.moveTo(x - 7, 12); g.quadraticCurveTo(x - 17, 128, x - 7, 244); g.lineTo(x + 7, 244); g.quadraticCurveTo(x + 17, 128, x + 7, 12); g.fill(); g.beginPath(); g.arc(x, 128, 14, 0, 7); g.fill(); }
    return tex(c, { repeat: true });
  });

  T.windowGlass = () => memo('win', () => {
    const [c, g] = mk(512, 1024);
    const sky = g.createLinearGradient(0, 0, 0, 1024); sky.addColorStop(0, C.clay1); sky.addColorStop(1, C.clay3); g.fillStyle = sky; g.fillRect(0, 0, 512, 1024);
    const gl = g.createRadialGradient(256, 300, 10, 256, 300, 420); gl.addColorStop(0, 'rgba(255,255,255,.9)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(0, 0, 512, 1024);
    g.strokeStyle = '#6A4A3A'; g.lineWidth = 12; g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 1024); g.stroke();
    for (const y of [300, 560, 800]) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    return tex(c);
  });

  /* ---------- portes : une teinte d'accent par univers, un numéro en IBM Plex Mono ---------- */
  T.doorLeaf = () => memo('leaf', () => {
    const [c, g] = mk(512, 1024), r = rng(41);
    g.fillStyle = C.wood; g.fillRect(0, 0, 512, 1024);
    for (let i = 0; i < 40; i++) { const x = r() * 512; g.strokeStyle = r() > .5 ? 'rgba(0,0,0,.14)' : 'rgba(255,210,200,.07)'; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 12, 300, x - 12, 700, x, 1024); g.stroke(); }
    const panel = (x, y, w, h) => { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x - 6, y - 6, w + 12, h + 12); g.fillStyle = C.woodL; g.fillRect(x, y, w, h); const q = g.createLinearGradient(x, y, x + w, y + h); q.addColorStop(0, 'rgba(255,255,255,.16)'); q.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = q; g.fillRect(x, y, w, h); g.strokeStyle = 'rgba(221,185,133,.6)'; g.lineWidth = 3; g.strokeRect(x + 14, y + 14, w - 28, h - 28); };
    panel(46, 50, 420, 400); panel(46, 500, 420, 470);
    g.fillStyle = C.bronzeL; for (const [x, y] of [[26, 26], [486, 26], [26, 998], [486, 998], [26, 480], [486, 480]]) { g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); }
    noise(g, 512, 1024, 3000, r, .05);
    return tex(c);
  });

  T.transom = (m) => memo('transom:' + m.id, () => {
    const A = m.accentCfg, [c, g] = mk(512, 256); g.clearRect(0, 0, 512, 256);
    g.save(); g.beginPath(); g.moveTo(0, 256); g.arc(256, 256, 256, Math.PI, 0); g.closePath(); g.clip();
    const q = g.createRadialGradient(256, 256, 10, 256, 256, 260); q.addColorStop(0, C.clay1); q.addColorStop(.5, A.main); q.addColorStop(1, A.deep); g.fillStyle = q; g.fillRect(0, 0, 512, 256);
    g.strokeStyle = 'rgba(30,8,6,.75)'; g.lineWidth = 6; for (let i = 0; i <= 12; i++) { const a = Math.PI + i * Math.PI / 12; g.beginPath(); g.moveTo(256, 256); g.lineTo(256 + Math.cos(a) * 260, 256 + Math.sin(a) * 260); g.stroke(); }
    for (const rad of [90, 170]) { g.beginPath(); g.arc(256, 256, rad, Math.PI, 0); g.stroke(); }
    g.fillStyle = C.clay1; g.beginPath(); g.arc(256, 256, 64, Math.PI, 0); g.fill(); g.stroke();
    g.fillStyle = A.deep; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = `500 52px ${MONO}`; g.fillText(String(m.ordre).padStart(2, '0'), 256, 240);
    g.restore(); return tex(c);
  });

  /* Ce que laisse deviner la porte entrouverte : un dégradé d'écran, tone sur tone (charte : dégradés pour écrans et motion). */
  T.vestibule = (m) => memo('vest:' + m.id, () => {
    const A = m.accentCfg, [c, g] = mk(256, 512);
    const q = g.createLinearGradient(0, 0, 0, 512); q.addColorStop(0, A.soft); q.addColorStop(.55, A.main); q.addColorStop(1, A.deep); g.fillStyle = q; g.fillRect(0, 0, 256, 512);
    const rg = g.createRadialGradient(128, 300, 10, 128, 300, 240); rg.addColorStop(0, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 256, 512);
    noise(g, 256, 512, 2500, rng(3), .04);
    return tex(c);
  });

  const plate = (w, h, kicker, title, tcol) => {
    const [c, g] = mk(w, h);
    const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, C.clay2); q.addColorStop(1, C.clay4); g.fillStyle = q; rr(g, 6, 6, w - 12, h - 12, h * .1); g.fill();
    g.strokeStyle = bronze(g, 0, 0, w, h); g.lineWidth = h * .03; rr(g, h * .08, h * .08, w - h * .16, h - h * .16, h * .06); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (kicker) { g.fillStyle = C.redDeep; g.font = `500 ${h * .15}px ${MONO}`; spaced(g, h * .02); g.fillText(kicker, w / 2, h * .28); spaced(g, 0); }
    g.fillStyle = tcol || C.redDeep; let fs = h * (kicker ? .3 : .4); g.font = `500 ${fs}px ${SERIF}`; while (g.measureText(title).width > w * .86 && fs > 18) { fs -= 2; g.font = `500 ${fs}px ${SERIF}`; }
    g.fillText(title, w / 2, h * (kicker ? .64 : .52));
    return tex(c, { own: true });
  };
  T.plaque = (m) => memo('plq:' + m.id, () => plate(1024, 200, `UNIVERS ${String(m.ordre).padStart(2, '0')}`, m.nom, C.redDeep));

  /* Rosace : motif géométrique issu de la forme récurrente (aucun texte, aucun faux logo). */
  T.rosace = () => memo('rosace', () => {
    const [c, g] = mk(1024, 1024), cx = 512, cy = 512; g.clearRect(0, 0, 1024, 1024);
    const ring = (r0, r1, col) => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r1, 0, 7); g.arc(cx, cy, r0, 0, 7, true); g.fill(); };
    g.fillStyle = C.redDeep; g.beginPath(); g.arc(cx, cy, 508, 0, 7); g.fill(); ring(484, 508, C.bronze); ring(470, 478, C.bronzeL);
    ring(330, 440, '#3B0000'); ring(322, 330, C.bronzeL);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.save(); g.translate(cx + Math.cos(a) * 385, cy + Math.sin(a) * 385); g.rotate(a + Math.PI / 2); g.fillStyle = i % 2 ? C.red : C.clay4; brand(g, -34, -46, 68, 92, 14); g.fill(); g.restore(); }
    g.fillStyle = C.red; g.strokeStyle = C.bronzeL; g.lineWidth = 4; g.beginPath(); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12 - Math.PI / 2, rad = i % 2 ? 150 : 300; g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C.redDeep; g.beginPath(); g.arc(cx, cy, 120, 0, 7); g.fill(); g.lineWidth = 5; g.stroke();
    g.fillStyle = C.clay2; brand(g, cx - 54, cy - 54, 108, 108, 20); g.fill();
    return tex(c);
  });

  /* ---------- le premier Code civil : uniquement ce que le client a fourni (content/vision-offre.json) ---------- */
  const aged = (w, h, seed) => {
    const [c, g] = mk(w, h), r = rng(seed); g.fillStyle = '#EFE4CF'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h, rad = 6 + r() * 34, q = g.createRadialGradient(x, y, 0, x, y, rad); q.addColorStop(0, `rgba(150,100,50,${.04 + r() * .07})`); q.addColorStop(1, 'rgba(150,100,50,0)'); g.fillStyle = q; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    const v = g.createRadialGradient(w / 2, h / 2, w * .3, w / 2, h / 2, h * .75); v.addColorStop(0, 'rgba(255,250,235,0)'); v.addColorStop(1, 'rgba(120,80,40,.28)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
    noise(g, w, h, 9000, r, .05); return [c, g];
  };
  const INK = '#2B1A14';
  const rule = (g, y, w) => { g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2 - 230, y); g.lineTo(w / 2 + 230, y); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.moveTo(w / 2 - 230, y + 9); g.lineTo(w / 2 + 230, y + 9); g.stroke(); };
  const CC = () => (L.content('vision-offre').codeCivil || {});
  T.codeTitle = () => memo('codeTitle', () => {
    const cc = CC(), pt = cc.pageTitre || ['CODE CIVIL', ''], W = 1024, H = 1440, [c, g] = aged(W, H, 9);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.strokeStyle = 'rgba(43,26,20,.5)'; g.lineWidth = 3; g.strokeRect(70, 70, W - 140, H - 140);
    g.font = `500 120px ${SERIF}`; spaced(g, 8); g.fillText(pt[0] || '', W / 2, 420); spaced(g, 0); rule(g, 520, W);
    g.font = `italic 400 54px ${SERIF}`; wrap(g, pt[1] || '', 760).forEach((l, i) => g.fillText(l, W / 2, 660 + i * 70));
    rule(g, 900, W); g.font = `400 36px ${SERIF}`; wrap(g, cc.pageBas || '', 760).forEach((l, i) => g.fillText(l, W / 2, 1180 + i * 50));
    return tex(c);
  });
  T.codePage = () => memo('codePage', () => {
    const W = 1024, H = 1440, [c, g] = aged(W, H, 21), r = rng(5);
    for (let blk = 0; blk < 2; blk++) { const y0 = blk ? 860 : 190; for (let i = 0; i < (blk ? 10 : 16); i++) { const y = y0 + i * 40, w = (i % 6 === 5) ? 340 : 700; g.fillStyle = `rgba(43,26,20,${.42 + r() * .12})`; g.fillRect(150, y, w, 6); } }
    return tex(c);
  });
  T.codeCover = () => memo('codeCover', () => {
    const W = 1024, H = 1440, [c, g] = mk(W, H), r = rng(404); g.fillStyle = '#4B0000'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) { g.fillStyle = r() > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.09)'; g.beginPath(); g.arc(r() * W, r() * H, 1.2 + r() * 3, 0, 7); g.fill(); }
    const v = g.createRadialGradient(W / 2, H * .45, W * .2, W / 2, H * .5, H * .75); v.addColorStop(0, 'rgba(255,255,255,.07)'); v.addColorStop(1, 'rgba(0,0,0,.42)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    const gold = bronze(g, 0, 0, W, H);
    g.strokeStyle = gold; g.lineWidth = 10; g.strokeRect(54, 54, W - 108, H - 108); g.lineWidth = 3; g.strokeRect(80, 80, W - 160, H - 160);
    g.fillStyle = gold; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `500 120px ${SERIF}`; spaced(g, 8); g.fillText('CODE', W / 2, 560); g.fillText('CIVIL', W / 2, 700); spaced(g, 0);
    g.lineWidth = 4; g.beginPath(); g.moveTo(300, 820); g.lineTo(W - 300, 820); g.stroke();
    return tex(c);
  });

  /* ---------- Le Grand Livre du Chiffre : installation contemporaine symbolique, aucun chiffre réel ---------- */
  T.ledger = (side) => memo('ledger:' + side, () => {
    const W = 1024, H = 1440, [c, g] = mk(W, H), r = rng(side ? 31 : 17);
    g.fillStyle = C.clay1; g.fillRect(0, 0, W, H); noise(g, W, H, 5000, r, .03);
    g.strokeStyle = 'rgba(8,31,44,.5)'; g.lineWidth = 2;
    const cols = side ? [110, 560, 740, 880, 960] : [64, 520, 700, 830, 930];
    for (let y = 150; y < H - 90; y += 44) { g.strokeStyle = y === 150 ? 'rgba(8,31,44,.7)' : 'rgba(8,31,44,.18)'; g.lineWidth = y === 150 ? 3 : 1.5; g.beginPath(); g.moveTo(60, y); g.lineTo(W - 60, y); g.stroke(); }
    g.strokeStyle = 'rgba(215,22,53,.55)'; g.lineWidth = 2; cols.forEach((x) => { g.beginPath(); g.moveTo(x, 90); g.lineTo(x, H - 90); g.stroke(); });
    g.fillStyle = C.blueDeep; g.font = `500 28px ${MONO}`; g.textAlign = 'left'; spaced(g, 3);
    g.fillText(side ? 'DÉBIT' : 'LIBELLÉ', cols[0] + 14, 124); if (side) g.fillText('CRÉDIT', cols[2] + 14, 124); else g.fillText('RATIO', cols[1] + 14, 124); spaced(g, 0);
    /* barres abstraites : aucune valeur lisible */
    for (let i = 0; i < 20; i++) { const y = 178 + i * 44 + 14, w = 40 + r() * 120; g.fillStyle = `rgba(8,31,44,${.18 + r() * .2})`; g.fillRect(cols[0] + 14, y, w, 8); g.fillStyle = `rgba(30,135,190,${.3 + r() * .3})`; g.fillRect(cols[1] + 14, y, 30 + r() * 100, 8); }
    /* courbe discrète */
    g.strokeStyle = C.red; g.lineWidth = 5; g.beginPath(); for (let i = 0; i <= 40; i++) { const x = 90 + i * 22, y = 1000 - Math.pow(i / 40, 1.6) * 520 + Math.sin(i * .9 + side) * 26; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.fillStyle = C.red; for (let i = 8; i <= 40; i += 8) { const x = 90 + i * 22, y = 1000 - Math.pow(i / 40, 1.6) * 520 + Math.sin(i * .9 + side) * 26; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); }
    g.fillStyle = C.blueDeep; g.font = `500 54px ${MONO}`; g.textAlign = 'center'; g.fillText('Σ', W / 2, H - 100);
    return tex(c);
  });
  T.ledgerCover = () => memo('ledgerCover', () => {
    const W = 1024, H = 1440, [c, g] = mk(W, H), r = rng(77); g.fillStyle = C.blueDeep; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) { g.fillStyle = r() > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.1)'; g.beginPath(); g.arc(r() * W, r() * H, 1.2 + r() * 3, 0, 7); g.fill(); }
    g.strokeStyle = C.clay4; g.lineWidth = 6; g.strokeRect(70, 70, W - 140, H - 140);
    g.fillStyle = C.clay2; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `500 92px ${SERIF}`; wrap(g, (L.content('vision-offre').chiffre || {}).designation || 'Le Grand Livre du Chiffre', 760).forEach((l, i) => g.fillText(l, W / 2, 560 + i * 110));
    return tex(c);
  });
  /* disque de verre gravé d'une courbe (ratios, performance) */
  T.glassCurve = (seed) => memo('gcurve:' + seed, () => {
    const [c, g] = mk(512, 512), r = rng(seed); g.clearRect(0, 0, 512, 512);
    g.strokeStyle = 'rgba(30,135,190,.55)'; g.lineWidth = 2; for (let k = 1; k < 5; k++) { g.beginPath(); g.arc(256, 256, k * 48, 0, 7); g.stroke(); }
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; g.beginPath(); g.moveTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200); g.lineTo(256 + Math.cos(a) * 214, 256 + Math.sin(a) * 214); g.stroke(); }
    g.strokeStyle = C.red; g.lineWidth = 5; g.beginPath(); for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 1.6 - .5, rad = 50 + i * 2.6 + Math.sin(i * .5 + seed) * 8; const x = 256 + Math.cos(a) * rad, y = 256 + Math.sin(a) * rad; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    return tex(c);
  });

  /* ====================== Mondes contemporains ====================== */

  T.microcement = (tint) => memo('mc:' + tint, () => {
    const [c, g] = mk(1024, 1024), r = rng(5); g.fillStyle = tint; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 160; i++) { const x = r() * 1024, y = r() * 1024, rad = 40 + r() * 160, q = g.createRadialGradient(x, y, 0, x, y, rad); q.addColorStop(0, r() > .5 ? 'rgba(255,255,255,.07)' : 'rgba(80,50,30,.06)'); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    g.strokeStyle = 'rgba(70,45,30,.16)'; g.lineWidth = 3; g.strokeRect(0, 0, 1024, 1024);
    noise(g, 1024, 1024, 9000, r, .04); return tex(c, { repeat: true });
  });
  T.plaster = (tint) => memo('pl:' + tint, () => {
    const [c, g] = mk(512, 512), r = rng(8); g.fillStyle = tint; g.fillRect(0, 0, 512, 512); noise(g, 512, 512, 7000, r, .035); return tex(c, { repeat: true });
  });
  T.ashWood = () => memo('ash', () => {
    const [c, g] = mk(512, 512), r = rng(12); g.fillStyle = '#D9BE9C'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 110; i++) { const x = r() * 512; g.strokeStyle = r() > .5 ? `rgba(110,70,40,${.04 + r() * .08})` : `rgba(255,240,220,${.05 + r() * .06})`; g.lineWidth = .6 + r() * 1.6; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + r() * 20 - 10, 170, x + r() * 20 - 10, 340, x + r() * 14 - 7, 512); g.stroke(); }
    noise(g, 512, 512, 1800, r, .04); return tex(c, { repeat: true });
  });

  /* Mur-écran de l'univers : dégradé texturé tone sur tone (charte : dégradés réservés aux écrans / motion). */
  T.screen = (m) => memo('screen:' + m.id, () => {
    const A = m.accentCfg, [c, g] = mk(2048, 640), r = rng(m.ordre * 13);
    const q = g.createLinearGradient(0, 0, 2048, 640); q.addColorStop(0, A.deep); q.addColorStop(.55, A.main); q.addColorStop(1, T.shade(C.clay4, -.02)); g.fillStyle = q; g.fillRect(0, 0, 2048, 640);
    const rg = g.createRadialGradient(1500, 160, 20, 1500, 160, 900); rg.addColorStop(0, 'rgba(255,255,255,.18)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 2048, 640);
    noise(g, 2048, 640, 26000, r, .05);
    return tex(c);
  });

  /* En-tête de station : forme récurrente, code en Mono, intitulé en Serif. */
  T.stationHeader = (st, m) => {
    const A = m.accentCfg, W = 1024, H = 512, [c, g] = mk(W, H); g.clearRect(0, 0, W, H);
    g.fillStyle = C.clay1; brand(g, 6, 6, W - 12, H - 12, 44); g.fill();
    g.fillStyle = A.main; g.save(); brand(g, 6, 6, W - 12, H - 12, 44); g.clip(); g.fillRect(0, 0, W, 22); g.restore();
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = A.text; g.font = `500 50px ${MONO}`; spaced(g, 4); g.fillText(st.code, 64, 112); spaced(g, 0);
    g.fillStyle = C.redInk; let fs = 74; g.font = `500 ${fs}px ${SERIF}`; let lines = wrap(g, st.nom, W - 190); while (lines.length > 2 && fs > 44) { fs -= 4; g.font = `500 ${fs}px ${SERIF}`; lines = wrap(g, st.nom, W - 190); }
    lines.forEach((l, i) => g.fillText(l, 64, 200 + i * fs * 1.12));
    g.fillStyle = '#5E4A42'; g.font = `400 40px ${SANS}`; g.fillText(`${st.n} ${L.plural(st.n, 'produit')} au catalogue`, 64, H - 52);
    return tex(c, { own: true });
  };

  /* Carnet-produit : étiquette de format (Mono), titre (Serif), durée et niveau (Sans). */
  T.carnet = (p, m) => {
    const A = m.accentCfg, W = 540, H = 736, [c, g] = mk(W, H); g.clearRect(0, 0, W, H);
    g.fillStyle = C.clay1; brand(g, 4, 4, W - 8, H - 8, 34); g.fill();
    g.save(); brand(g, 4, 4, W - 8, H - 8, 34); g.clip(); g.fillStyle = A.main; g.fillRect(0, 0, W, 18); g.restore();
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = A.text; g.font = `500 27px ${MONO}`; spaced(g, 2); g.fillText(String(p.f || p.tp || '').toUpperCase().slice(0, 22), 40, 92); spaced(g, 0);
    g.fillStyle = C.redInk; let fs = 56; g.font = `500 ${fs}px ${SERIF}`; let lines = wrap(g, p.t, W - 84); while (lines.length > 6 && fs > 30) { fs -= 3; g.font = `500 ${fs}px ${SERIF}`; lines = wrap(g, p.t, W - 84); }
    lines.slice(0, 7).forEach((l, i) => g.fillText(l, 40, 170 + i * fs * 1.18));
    g.fillStyle = '#5E4A42'; g.font = `400 30px ${SANS}`; g.fillText(`${p.dl || p.dh || ''}${p.n ? ' · ' + p.n : ''}`, 40, H - 66);
    if (p.best === 1) { g.fillStyle = A.text; rr(g, W - 40 - 112, H - 104, 112, 42, 21); g.fill(); g.fillStyle = '#fff'; g.font = `500 23px ${MONO}`; g.textAlign = 'center'; g.fillText('BEST', W - 40 - 56, H - 75); }
    return tex(c, { own: true });
  };

  T.check = () => memo('check', () => {
    const [c, g] = mk(128, 128); g.fillStyle = C.red; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(36, 66); g.lineTo(56, 86); g.lineTo(92, 44); g.stroke();
    return tex(c);
  });
  T.glow = () => memo('glow', () => { const [c, g] = mk(128, 128), q = g.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(.3, 'rgba(255,255,255,.45)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128); return tex(c); });
})();
