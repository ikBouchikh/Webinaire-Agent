/* Textures dessinées en canvas : aucun fichier image, tout fonctionne hors ligne.
   Charte : crème, rouge, bordeaux, pêche, serif (reprise de la démo du webinaire). */

(function () {
  const L = window.LDC;
  const BRAND = L.BRAND = {
    cream: '#f7eee8', red: '#d6175f', redD: '#b50f4e', ink: '#4a0a22', peach: '#f6b68a', peachL: '#fbe0cd', bordeaux: '#680d2d',
    gold: '#d9a441', goldL: '#f3d27a', goldD: '#8a6420',
  };
  const SANS = L.SANS = "'Calibri','Segoe UI','Helvetica Neue',Arial,sans-serif";
  const SERIF = L.SERIF = "'Source Serif 4','Source Serif Pro','Noto Serif',Georgia,'Times New Roman',serif";
  const T = L.tex = {};
  const cache = {};
  const owned = []; // textures à libérer avec le rayon courant

  const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  T.rng = mulberry;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const tex = (c, o = {}) => {
    const t = new THREE.CanvasTexture(c);
    t.encoding = o.linear ? THREE.LinearEncoding : THREE.sRGBEncoding;
    t.anisotropy = T.aniso || 4;
    if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
    if (o.own) owned.push(t);
    return t;
  };
  const memo = (key, fn) => (cache[key] || (cache[key] = fn()));
  T.disposeOwned = () => { owned.splice(0).forEach((t) => t.dispose()); };

  const rr = (ctx, x, y, w, h, r) => {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  const wrap = (ctx, text, maxW) => {
    const words = text.split(' '); const lines = []; let cur = '';
    words.forEach((w) => { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); return lines;
  };
  const goldGrad = (ctx, x0, y0, x1, y1) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, BRAND.goldD); g.addColorStop(.35, BRAND.goldL); g.addColorStop(.6, BRAND.gold); g.addColorStop(1, BRAND.goldD); return g;
  };
  const spaced = (ctx, s, px) => { try { ctx.letterSpacing = px + 'px'; } catch (e) { /* ignoré */ } return s; };
  const noise = (ctx, w, h, n, rnd, alpha = .08) => {
    for (let i = 0; i < n; i++) { ctx.fillStyle = rnd() > .5 ? `rgba(255,255,255,${alpha * rnd()})` : `rgba(0,0,0,${alpha * 1.6 * rnd()})`; ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  };

  /* Marque Lefebvre Dalloz : carré d'angle arrondi, trait vertical et trait horizontal (comme sur les slides). */
  T.drawMark = (ctx, x, y, s, color) => {
    ctx.save(); ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(s * .78)}px ${SANS}`; ctx.fillText('Skilia', x, y); ctx.restore();
  };

  /* ---------- Matériaux d'architecture ---------- */

  T.floor = () => memo('floor', () => {
    const [c, g] = mk(1024, 1024); const r = mulberry(7);
    g.fillStyle = '#2a170a'; g.fillRect(0, 0, 1024, 1024);
    const pw = 64, pl = 256;
    for (let row = 0; row < 1024 / pw; row++) {
      const off = r() * pl;
      for (let x = -pl; x < 1024 + pl; x += pl) {
        const lum = 30 + r() * 16, hue = 22 + r() * 8;
        g.fillStyle = `hsl(${hue},48%,${lum}%)`; g.fillRect(x + off + 2, row * pw + 2, pl - 4, pw - 4);
        for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(20,8,0,${.06 + r() * .1})`; g.lineWidth = 1; g.beginPath(); const yy = row * pw + 4 + r() * (pw - 8); g.moveTo(x + off + 2, yy); g.bezierCurveTo(x + off + 80, yy + r() * 6 - 3, x + off + 170, yy + r() * 6 - 3, x + off + pl - 2, yy + r() * 4 - 2); g.stroke(); }
      }
    }
    noise(g, 1024, 1024, 5000, r, .07);
    return tex(c, { repeat: [5, 5] });
  });

  T.wood = (key = 'wood', base = '#4a2814', seed = 3) => memo('wood:' + key, () => {
    const [c, g] = mk(512, 512); const r = mulberry(seed);
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 90; i++) {
      const x = r() * 512; g.strokeStyle = r() > .5 ? `rgba(0,0,0,${.05 + r() * .12})` : `rgba(255,220,170,${.03 + r() * .06})`;
      g.lineWidth = .6 + r() * 2.2; g.beginPath(); g.moveTo(x, 0);
      g.bezierCurveTo(x + r() * 30 - 15, 170, x + r() * 30 - 15, 340, x + r() * 20 - 10, 512); g.stroke();
    }
    noise(g, 512, 512, 2500, r, .06);
    return tex(c, { repeat: [1, 1] });
  });

  T.stone = () => memo('stone', () => {
    const [c, g] = mk(512, 512); const r = mulberry(11);
    g.fillStyle = '#6d6256'; g.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 64) { const off = (y / 64 % 2) * 64; for (let x = -64; x < 512; x += 128) { const l = 38 + r() * 8; g.fillStyle = `hsl(30,10%,${l}%)`; g.fillRect(x + off + 2, y + 2, 124, 60); } }
    noise(g, 512, 512, 6000, r, .1);
    return tex(c, { repeat: [2, 2] });
  });

  /* Rayonnages peints : des centaines de dos de livres, répétables. */
  T.bookwall = (seed = 1, bias = null) => memo(`bw:${seed}:${bias}`, () => {
    const [c, g] = mk(1024, 1024); const r = mulberry(seed * 97 + 5);
    const pal = ['#5a1420', '#3b0a0a', '#6e2a14', '#2c3e2d', '#1f2f4a', '#7a5a1e', '#4a2f6b', '#8a1f2b', '#2a2220', '#5b3a21', '#8c6a3a', '#d8cdb0'];
    if (bias) { pal.push(bias, bias, bias, bias); }
    const shelves = 4, sh = 1024 / shelves;
    for (let s = 0; s < shelves; s++) {
      const y0 = s * sh;
      const bg = g.createLinearGradient(0, y0, 0, y0 + sh); bg.addColorStop(0, '#0e0705'); bg.addColorStop(1, '#241209');
      g.fillStyle = bg; g.fillRect(0, y0, 1024, sh);
      let x = 0;
      while (x < 1024) {
        const w = 12 + r() * 24, h = 140 + r() * 80, col = pal[(r() * pal.length) | 0];
        if (r() < .06) { x += 20 + r() * 40; continue; }
        const top = y0 + sh - 20 - h;
        const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(.25, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.5)');
        g.fillStyle = col; g.fillRect(x, top, w, h); g.fillStyle = gr; g.fillRect(x, top, w, h);
        g.fillStyle = r() > .4 ? BRAND.goldD : BRAND.goldL;
        g.fillRect(x, top + 10 + r() * 6, w, 2); g.fillRect(x, top + h - 22 - r() * 6, w, 2);
        if (r() > .55) { g.fillStyle = 'rgba(243,210,122,.55)'; g.fillRect(x + w * .25, top + h * .3, w * .5, h * .22); }
        x += w + .5;
      }
      const wd = g.createLinearGradient(0, y0 + sh - 20, 0, y0 + sh); wd.addColorStop(0, '#5a3418'); wd.addColorStop(.2, '#7a4a24'); wd.addColorStop(1, '#2a1608');
      g.fillStyle = wd; g.fillRect(0, y0 + sh - 20, 1024, 20);
      g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, y0 + sh - 38, 1024, 18);
    }
    return tex(c, { repeat: [1, 1] });
  });

  T.coffer = () => memo('coffer', () => {
    const [c, g] = mk(512, 512); const r = mulberry(23);
    g.fillStyle = '#1d0f08'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const x = i * 256, y = j * 256;
      g.fillStyle = '#2c180c'; g.fillRect(x + 14, y + 14, 228, 228);
      g.strokeStyle = BRAND.goldD; g.lineWidth = 3; g.strokeRect(x + 26, y + 26, 204, 204);
      g.strokeStyle = 'rgba(217,164,65,.5)'; g.lineWidth = 1; g.strokeRect(x + 40, y + 40, 176, 176);
      g.fillStyle = BRAND.goldD; g.beginPath(); g.arc(x + 128, y + 128, 10, 0, 7); g.fill();
    }
    noise(g, 512, 512, 3000, r, .05);
    return tex(c, { repeat: [6, 6] });
  });

  T.dome = () => memo('dome', () => {
    const [c, g] = mk(2048, 512); const r = mulberry(31);
    const bg = g.createLinearGradient(0, 0, 0, 512); bg.addColorStop(0, '#0a0506'); bg.addColorStop(1, '#2a140c');
    g.fillStyle = bg; g.fillRect(0, 0, 2048, 512);
    for (let i = 0; i < 36; i++) { const x = i * 2048 / 36; g.fillStyle = i % 2 ? 'rgba(80,40,18,.35)' : 'rgba(20,8,4,.35)'; g.fillRect(x, 0, 2048 / 36, 512); }
    for (let i = 0; i < 12; i++) { const x = i * 2048 / 12; g.fillStyle = '#3a1d0e'; g.fillRect(x - 9, 0, 18, 512); g.fillStyle = BRAND.goldD; g.fillRect(x - 2, 0, 4, 512); }
    for (let k = 1; k < 5; k++) { g.fillStyle = '#3a1d0e'; g.fillRect(0, k * 100, 2048, 12); g.fillStyle = 'rgba(217,164,65,.6)'; g.fillRect(0, k * 100 + 4, 2048, 3); }
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(243,210,122,${.2 + r() * .5})`; g.beginPath(); g.arc(r() * 2048, r() * 480, .8 + r() * 1.8, 0, 7); g.fill(); }
    return tex(c);
  });

  T.balustrade = () => memo('bal', () => {
    const [c, g] = mk(256, 128); g.clearRect(0, 0, 256, 128);
    g.fillStyle = '#4a2814'; g.fillRect(0, 0, 256, 16); g.fillStyle = '#7a4a24'; g.fillRect(0, 2, 256, 4);
    g.fillStyle = '#3a1d0e'; g.fillRect(0, 112, 256, 16);
    for (let x = 8; x < 256; x += 32) { const gr = g.createLinearGradient(x - 8, 0, x + 8, 0); gr.addColorStop(0, '#2a1608'); gr.addColorStop(.4, '#7a4a24'); gr.addColorStop(1, '#2a1608'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 4, 16); g.quadraticCurveTo(x - 9, 64, x - 4, 112); g.lineTo(x + 4, 112); g.quadraticCurveTo(x + 9, 64, x + 4, 16); g.fill(); }
    return tex(c, { repeat: [24, 1] });
  });

  T.windowNight = () => memo('win', () => {
    const [c, g] = mk(256, 512);
    const sky = g.createLinearGradient(0, 0, 0, 512); sky.addColorStop(0, '#0f1b3a'); sky.addColorStop(1, '#3a5a8a');
    g.fillStyle = sky; g.fillRect(0, 0, 256, 512);
    const r = mulberry(5); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${.3 + r() * .6})`; g.fillRect(r() * 256, r() * 300, 1.5, 1.5); }
    const mg = g.createRadialGradient(170, 110, 0, 170, 110, 80); mg.addColorStop(0, 'rgba(255,248,220,1)'); mg.addColorStop(.25, 'rgba(255,240,200,.9)'); mg.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = mg; g.fillRect(0, 0, 256, 300);
    g.strokeStyle = '#120a06'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 512); g.stroke();
    for (const y of [150, 280, 400]) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    g.lineWidth = 14; g.strokeRect(0, 0, 256, 512);
    return tex(c);
  });

  /* ---------- Rideaux, enseignes, plaques ---------- */

  T.banner = (dom) => memo('banner:' + dom.id, () => {
    const [c, g] = mk(256, 640);
    const gr = g.createLinearGradient(0, 0, 0, 640); gr.addColorStop(0, dom.couleur); gr.addColorStop(1, shade(dom.couleur, -.35));
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(256, 0); g.lineTo(256, 600); g.lineTo(128, 640); g.lineTo(0, 600); g.closePath(); g.fill();
    g.strokeStyle = goldGrad(g, 0, 0, 256, 640); g.lineWidth = 8; g.strokeRect(14, 14, 228, 540);
    g.lineWidth = 2; g.strokeRect(26, 26, 204, 516);
    T.drawMark(g, 128, 90, 56, BRAND.goldL, 5);
    g.fillStyle = goldGrad(g, 0, 160, 256, 420); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${dom.glyph.length > 2 ? 78 : dom.glyph.length > 1 ? 104 : 150}px ${SERIF}`; g.fillText(dom.glyph, 128, 275);
    g.font = `600 22px ${SERIF}`; g.fillStyle = BRAND.cream; spaced(g, '', 3);
    wrap(g, dom.court.toUpperCase(), 190).forEach((l, i) => g.fillText(l, 128, 420 + i * 28));
    return tex(c);
  });

  T.sign = (dom) => memo('sign:' + dom.id, () => {
    const [c, g] = mk(1024, 280);
    const wd = g.createLinearGradient(0, 0, 0, 280); wd.addColorStop(0, '#3a1d0e'); wd.addColorStop(.5, '#2a1408'); wd.addColorStop(1, '#1a0b05');
    g.fillStyle = wd; rr(g, 4, 4, 1016, 272, 18); g.fill();
    g.strokeStyle = goldGrad(g, 0, 0, 1024, 280); g.lineWidth = 6; rr(g, 14, 14, 996, 252, 12); g.stroke();
    g.lineWidth = 1.5; rr(g, 26, 26, 972, 228, 8); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = BRAND.peach; g.font = `italic 600 32px ${SERIF}`; spaced(g, '', 4);
    g.fillText(dom.court.toUpperCase(), 512, 66);
    g.fillStyle = goldGrad(g, 0, 90, 0, 220); g.font = `700 ${dom.nom.length > 28 ? 50 : 64}px ${SERIF}`; spaced(g, '', 1);
    const lines = wrap(g, dom.nom, 900);
    lines.forEach((l, i) => g.fillText(l, 512, (lines.length > 1 ? 144 : 168) + i * 58));
    return tex(c);
  });

  /* Plaque de travée : titre de la thématique + nombre de formations. */
  T.valance = (theme, n, total, dom) => {
    const [c, g] = mk(1024, 170);
    const wd = g.createLinearGradient(0, 0, 0, 170); wd.addColorStop(0, '#4a2814'); wd.addColorStop(.5, '#341b0c'); wd.addColorStop(1, '#22110a');
    g.fillStyle = wd; g.fillRect(0, 0, 1024, 170);
    g.strokeStyle = goldGrad(g, 0, 0, 1024, 170); g.lineWidth = 5; g.strokeRect(10, 10, 1004, 150); g.lineWidth = 1.5; g.strokeRect(22, 22, 980, 126);
    g.fillStyle = dom.lueur; g.beginPath(); g.arc(88, 85, 40, 0, 7); g.fill();
    g.fillStyle = '#1a0b05'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${dom.glyph.length > 2 ? 22 : dom.glyph.length > 1 ? 30 : 44}px ${SERIF}`; g.fillText(dom.glyph, 88, 88);
    g.textAlign = 'left'; g.fillStyle = BRAND.peach; g.font = `italic 600 24px ${SERIF}`; spaced(g, '', 3);
    g.fillText(`TRAVÉE ${n} / ${total}`, 150, 52);
    g.fillStyle = goldGrad(g, 150, 60, 900, 140); g.font = `700 ${theme.length > 30 ? 44 : 54}px ${SERIF}`; spaced(g, '', 0);
    g.fillText(theme, 150, 106);
    return tex(c, { own: true });
  };

  T.gate = () => memo('gate', () => {
    const [c, g] = mk(512, 768); g.clearRect(0, 0, 512, 768);
    g.fillStyle = '#17110f';
    for (let x = 20; x < 512; x += 34) g.fillRect(x, 0, 8, 768);
    for (const y of [60, 380, 700]) g.fillRect(0, y, 512, 16);
    g.fillStyle = '#2b201c'; for (let x = 20; x < 512; x += 34) { g.beginPath(); g.moveTo(x - 4, 0); g.lineTo(x + 4, -16); g.lineTo(x + 12, 0); g.fill(); }
    g.fillStyle = goldGrad(g, 196, 330, 316, 470); rr(g, 196, 330, 120, 140, 14); g.fill();
    g.fillStyle = '#17110f'; g.beginPath(); g.arc(256, 385, 14, 0, 7); g.fill(); g.fillRect(250, 390, 12, 40);
    g.strokeStyle = goldGrad(g, 196, 250, 316, 330); g.lineWidth = 12; g.beginPath(); g.arc(256, 330, 44, Math.PI, 0); g.stroke();
    return tex(c);
  });

  T.portalGlow = (dom) => memo('pg:' + dom.id, () => {
    const [c, g] = mk(512, 768);
    const bg = g.createLinearGradient(0, 0, 0, 768); bg.addColorStop(0, '#1a0c08'); bg.addColorStop(1, '#3a2010');
    g.fillStyle = bg; g.fillRect(0, 0, 512, 768);
    // perspective de rayonnages
    g.strokeStyle = 'rgba(243,210,122,.18)'; g.lineWidth = 2;
    for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(256 + i * 18, 330); g.lineTo(256 + i * 70, 768); g.stroke(); }
    for (let k = 0; k < 8; k++) { const y = 330 + k * k * 8; g.beginPath(); g.moveTo(256 - (y - 300) * .5, y); g.lineTo(256 + (y - 300) * .5, y); g.stroke(); }
    const rg = g.createRadialGradient(256, 420, 10, 256, 420, 360); rg.addColorStop(0, 'rgba(255,236,190,.95)'); rg.addColorStop(.35, hexA(dom.lueur, .55)); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 512, 768);
    g.fillStyle = 'rgba(255,255,255,.9)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${dom.glyph.length > 2 ? 100 : dom.glyph.length > 1 ? 130 : 200}px ${SERIF}`;
    g.globalAlpha = .75; g.fillText(dom.glyph, 256, 430); g.globalAlpha = 1;
    return tex(c);
  });

  /* ---------- Tapis ---------- */

  T.rug = () => memo('rug', () => {
    const [c, g] = mk(1024, 1024); const cx = 512, cy = 512;
    g.clearRect(0, 0, 1024, 1024);
    const ring = (r0, r1, col) => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r1, 0, 7); g.arc(cx, cy, r0, 0, 7, true); g.fill(); };
    g.fillStyle = '#5a0c26'; g.beginPath(); g.arc(cx, cy, 506, 0, 7); g.fill();
    ring(488, 506, BRAND.goldD); ring(470, 480, BRAND.gold); ring(330, 440, '#3a0818'); ring(322, 330, BRAND.gold);
    // étoile à 12 branches
    g.fillStyle = '#86123a'; g.strokeStyle = BRAND.gold; g.lineWidth = 3;
    g.beginPath(); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12 - Math.PI / 2, rad = i % 2 ? 160 : 310; g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#3a0818'; g.beginPath(); g.arc(cx, cy, 120, 0, 7); g.fill(); g.strokeStyle = BRAND.goldL; g.lineWidth = 4; g.stroke();
    T.drawMark(g, cx, cy, 120, BRAND.goldL);
    // texte circulaire
    g.fillStyle = BRAND.goldL; g.font = `600 40px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const txt = 'SKILIA PAR LEFEBVRE DALLOZ COMPÉTENCES  ✦  CATALOGUE 2027  ✦  ', n = txt.length;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; g.save(); g.translate(cx + Math.cos(a) * 395, cy + Math.sin(a) * 395); g.rotate(a + Math.PI / 2); g.fillText(txt[i], 0, 0); g.restore(); }
    L.DOMAINES.forEach((d, i) => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2, x = cx + Math.cos(a) * 262, y = cy + Math.sin(a) * 262;
      g.fillStyle = d.couleur; g.beginPath(); g.arc(x, y, 34, 0, 7); g.fill(); g.strokeStyle = BRAND.goldL; g.lineWidth = 4; g.stroke();
      g.fillStyle = BRAND.goldL; g.font = `700 ${d.glyph.length > 2 ? 20 : d.glyph.length > 1 ? 26 : 36}px ${SERIF}`; g.fillText(d.glyph, x, y + 2);
    });
    return tex(c);
  });

  T.runner = (dom) => memo('runner:' + dom.id, () => {
    const [c, g] = mk(256, 1024);
    g.fillStyle = shade(dom.couleur, -.45); g.fillRect(0, 0, 256, 1024);
    g.strokeStyle = BRAND.goldD; g.lineWidth = 10; g.strokeRect(10, 10, 236, 1004);
    g.strokeStyle = 'rgba(243,210,122,.7)'; g.lineWidth = 2; g.strokeRect(28, 28, 200, 968);
    for (let i = 0; i < 4; i++) {
      const y = 140 + i * 250; g.fillStyle = shade(dom.couleur, -.15); g.beginPath(); g.moveTo(128, y - 100); g.lineTo(220, y); g.lineTo(128, y + 100); g.lineTo(36, y); g.closePath(); g.fill();
      g.strokeStyle = BRAND.gold; g.lineWidth = 3; g.stroke();
      g.fillStyle = BRAND.goldL; g.beginPath(); g.arc(128, y, 22, 0, 7); g.fill();
    }
    return tex(c, { repeat: [1, 1] });
  });

  /* ---------- Reliures et pages ---------- */

  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    return `rgb(${f(r)},${f(gg)},${f(b)})`;
  };
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  T.shade = shade; T.hexA = hexA;

  T.leather = (color, seed = 1) => {
    const [c, g] = mk(512, 720); const r = mulberry(seed);
    g.fillStyle = color; g.fillRect(0, 0, 512, 720);
    for (let i = 0; i < 4200; i++) { g.fillStyle = r() > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; g.beginPath(); g.arc(r() * 512, r() * 720, 1 + r() * 2.4, 0, 7); g.fill(); }
    const v = g.createRadialGradient(256, 330, 120, 256, 360, 480); v.addColorStop(0, 'rgba(255,255,255,.07)'); v.addColorStop(1, 'rgba(0,0,0,.5)');
    g.fillStyle = v; g.fillRect(0, 0, 512, 720);
    return [c, g];
  };

  T.cover = (livre) => {
    const dom = livre.dom, fm = L.FORMATS[livre.fmt];
    const [c, g] = T.leather(shade(dom.couleur, -.3), livre.titre.length * 13 + livre.slot);
    const gold = goldGrad(g, 0, 0, 512, 720);
    g.strokeStyle = gold; g.lineWidth = 6; g.strokeRect(24, 24, 464, 672); g.lineWidth = 1.6; g.strokeRect(38, 38, 436, 644);
    [[38, 38, 1, 1], [474, 38, -1, 1], [38, 682, 1, -1], [474, 682, -1, -1]].forEach(([x, y, sx, sy]) => {
      g.save(); g.translate(x, y); g.scale(sx, sy); g.beginPath(); g.moveTo(0, 36); g.quadraticCurveTo(0, 0, 36, 0); g.moveTo(0, 22); g.quadraticCurveTo(0, 0, 22, 0); g.lineWidth = 3; g.stroke(); g.restore();
    });
    T.drawMark(g, 256, 92, 60, BRAND.goldL);
    g.fillStyle = BRAND.goldL; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 15px ${SERIF}`; spaced(g, '', 2);
    g.fillText('PAR LEFEBVRE DALLOZ COMPÉTENCES', 256, 138); spaced(g, '', 0);
    // médaillon
    g.strokeStyle = gold; g.lineWidth = 4; g.beginPath(); g.arc(256, 250, 70, 0, 7); g.stroke();
    g.lineWidth = 1.5; g.beginPath(); g.arc(256, 250, 80, 0, 7); g.stroke();
    g.fillStyle = hexA(dom.lueur, .18); g.beginPath(); g.arc(256, 250, 66, 0, 7); g.fill();
    g.fillStyle = gold; g.font = `700 ${dom.glyph.length > 2 ? 42 : dom.glyph.length > 1 ? 56 : 84}px ${SERIF}`; g.fillText(dom.glyph, 256, 256);
    // titre
    g.fillStyle = BRAND.cream; let fs = 44; g.font = `700 ${fs}px ${SERIF}`;
    let lines = wrap(g, livre.titre, 380); while (lines.length > 5 && fs > 28) { fs -= 3; g.font = `700 ${fs}px ${SERIF}`; lines = wrap(g, livre.titre, 380); }
    const lh = fs * 1.2, y0 = 372 + (5 - Math.min(5, lines.length)) * lh * .35;
    lines.forEach((l, i) => g.fillText(l, 256, y0 + i * lh));
    // pied
    g.strokeStyle = gold; g.lineWidth = 2; g.beginPath(); g.moveTo(130, 590); g.lineTo(382, 590); g.stroke();
    g.fillStyle = BRAND.peach; g.font = `italic 600 22px ${SERIF}`; g.fillText(livre.theme.nom, 256, 618, 400);
    g.fillStyle = BRAND.cream; g.font = `600 19px ${SERIF}`; spaced(g, '', 2); g.fillText(`${fm.nom.toUpperCase()}  ·  ${livre.duree.toUpperCase()}`, 256, 654); spaced(g, '', 0);
    // marque-page au format
    g.fillStyle = fm.col; g.beginPath(); g.moveTo(404, 0); g.lineTo(450, 0); g.lineTo(450, 128); g.lineTo(427, 104); g.lineTo(404, 128); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(404, 0, 5, 128);
    return tex(c, { own: true });
  };

  T.titlePage = (livre) => {
    const [c, g] = mk(512, 720); const r = mulberry(4);
    g.fillStyle = '#f1e7d0'; g.fillRect(0, 0, 512, 720);
    const v = g.createRadialGradient(256, 360, 160, 256, 360, 480); v.addColorStop(0, 'rgba(255,250,235,.0)'); v.addColorStop(1, 'rgba(140,100,40,.28)'); g.fillStyle = v; g.fillRect(0, 0, 512, 720);
    noise(g, 512, 720, 3500, r, .05);
    g.strokeStyle = 'rgba(59,10,10,.45)'; g.lineWidth = 2; g.strokeRect(30, 30, 452, 660);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    T.drawMark(g, 256, 84, 52, BRAND.red);
    g.fillStyle = BRAND.ink; g.font = `700 32px ${SERIF}`; const lines = wrap(g, livre.titre, 390);
    lines.forEach((l, i) => g.fillText(l, 256, 170 + i * 40));
    const y1 = 170 + lines.length * 40 + 14;
    g.fillStyle = BRAND.redD; g.fillRect(226, y1, 60, 3);
    g.fillStyle = '#6a4a3a'; g.font = `italic 600 20px ${SERIF}`; g.fillText(livre.theme.nom, 256, y1 + 32, 400);
    g.textAlign = 'left'; g.fillStyle = BRAND.redD; g.font = `700 17px ${SERIF}`; spaced(g, '', 2); g.fillText('COMPÉTENCES VISÉES', 62, y1 + 92); spaced(g, '', 0);
    g.fillStyle = BRAND.ink; g.font = `600 20px ${SERIF}`;
    let yy = y1 + 132;
    livre.comps.slice(0, 4).forEach((cp) => { g.fillStyle = BRAND.redD; g.beginPath(); g.arc(70, yy - 6, 4, 0, 7); g.fill(); g.fillStyle = BRAND.ink; wrap(g, cp, 370).forEach((l, i) => g.fillText(l, 88, yy + i * 25)); yy += 28 + (wrap(g, cp, 370).length - 1) * 25 + 14; });
    g.textAlign = 'center'; g.fillStyle = 'rgba(59,10,10,.55)'; g.font = `italic 17px ${SERIF}`; g.fillText('Skilia par Lefebvre Dalloz Compétences · Catalogue 2027', 256, 662);
    return tex(c, { own: true });
  };

  T.endpaper = (dom) => memo('endp:' + dom.id, () => {
    const [c, g] = mk(512, 720); const r = mulberry(dom.index * 5 + 2);
    g.fillStyle = shade(dom.couleur, -.25); g.fillRect(0, 0, 512, 720);
    for (let i = 0; i < 40; i++) { g.strokeStyle = r() > .5 ? 'rgba(243,210,122,.12)' : 'rgba(255,255,255,.07)'; g.lineWidth = 2 + r() * 6; g.beginPath(); const y = r() * 720; g.moveTo(0, y); g.bezierCurveTo(130, y + r() * 140 - 70, 380, y + r() * 140 - 70, 512, y + r() * 60 - 30); g.stroke(); }
    const gr = g.createRadialGradient(256, 340, 20, 256, 340, 220); gr.addColorStop(0, hexA(dom.lueur, .55)); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 720);
    g.strokeStyle = goldGrad(g, 0, 0, 512, 720); g.lineWidth = 5; g.strokeRect(26, 26, 460, 668);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = goldGrad(g, 100, 250, 400, 450);
    g.font = `700 ${dom.glyph.length > 2 ? 90 : dom.glyph.length > 1 ? 120 : 190}px ${SERIF}`; g.fillText(dom.glyph, 256, 340);
    g.fillStyle = BRAND.cream; g.font = `italic 600 26px ${SERIF}`; g.fillText('Ex-libris', 256, 520);
    g.font = `600 20px ${SERIF}`; spaced(g, '', 3); g.fillText(dom.court.toUpperCase(), 256, 560); spaced(g, '', 0);
    return tex(c);
  });

  /* Livre-catalogue géant du hall. */
  T.catalogueCover = () => memo('catcov', () => {
    const [c, g] = T.leather('#6e1020', 77); const gold = goldGrad(g, 0, 0, 512, 720);
    g.strokeStyle = gold; g.lineWidth = 8; g.strokeRect(22, 22, 468, 676); g.lineWidth = 2; g.strokeRect(40, 40, 432, 640);
    T.drawMark(g, 256, 150, 120, BRAND.goldL);
    g.fillStyle = gold; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 54px ${SERIF}`; g.fillText('CATALOGUE', 256, 300); g.fillText('2027', 256, 366);
    g.fillStyle = BRAND.cream; g.font = `italic 600 26px ${SERIF}`; g.fillText('par Lefebvre Dalloz Compétences', 256, 460);
    g.strokeStyle = gold; g.lineWidth = 2; g.beginPath(); g.moveTo(150, 500); g.lineTo(362, 500); g.stroke();
    L.DOMAINES.forEach((d, i) => { g.fillStyle = d.lueur; g.beginPath(); g.arc(112 + i * 58, 560, 16, 0, 7); g.fill(); });
    return tex(c);
  });
  T.cataloguePage = () => memo('catpage', () => {
    const [c, g] = mk(512, 720); g.fillStyle = '#f1e7d0'; g.fillRect(0, 0, 512, 720);
    const v = g.createRadialGradient(256, 360, 160, 256, 360, 480); v.addColorStop(0, 'rgba(255,250,235,0)'); v.addColorStop(1, 'rgba(140,100,40,.3)'); g.fillStyle = v; g.fillRect(0, 0, 512, 720);
    g.textAlign = 'center'; g.textBaseline = 'middle'; T.drawMark(g, 256, 90, 58, BRAND.red);
    g.fillStyle = BRAND.ink; g.font = `700 30px ${SERIF}`; g.fillText('Sommaire', 256, 160);
    L.DOMAINES.forEach((d, i) => { const y = 225 + i * 74; g.fillStyle = d.couleur; g.beginPath(); g.arc(70, y, 22, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = `700 ${d.glyph.length > 2 ? 13 : d.glyph.length > 1 ? 17 : 24}px ${SERIF}`; g.fillText(d.glyph, 70, y + 1);
      g.textAlign = 'left'; g.fillStyle = BRAND.ink; g.font = `600 21px ${SERIF}`; g.fillText(d.court, 110, y - 8); g.font = `italic 15px ${SERIF}`; g.fillStyle = '#6a4a3a'; g.fillText(`${d.themes.length} travées · ${d.nbLivres} formations`, 110, y + 15); g.textAlign = 'center'; });
    return tex(c);
  });

  /* Dos de livre générique (niveaux de gris, teinté par instance) : bandes dorées et relief. */
  T.spine = () => memo('spine', () => {
    const [c, g] = mk(64, 256);
    const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(.3, '#ffffff'); gr.addColorStop(.7, '#cfcfcf'); gr.addColorStop(1, '#6a6a6a');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    g.fillStyle = '#f6e3a0'; g.fillRect(0, 22, 64, 4); g.fillRect(0, 30, 64, 2); g.fillRect(0, 226, 64, 4); g.fillRect(0, 218, 64, 2);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(8, 70, 48, 90);
    g.fillStyle = '#f6e3a0'; g.fillRect(14, 80, 36, 3); g.fillRect(14, 148, 36, 3);
    return tex(c);
  });

  /* ---------- Effets lumineux ---------- */

  const radial = (stops, size = 128) => { const [c, g] = mk(size, size); const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size); return tex(c, { linear: false }); };
  T.glow = () => memo('glow', () => radial([[0, 'rgba(255,255,255,1)'], [.25, 'rgba(255,255,255,.55)'], [.6, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']]));
  T.flame = () => memo('flame', () => {
    const [c, g] = mk(64, 128);
    const gr = g.createRadialGradient(32, 84, 2, 32, 76, 52); gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(.25, 'rgba(255,214,120,.95)'); gr.addColorStop(.6, 'rgba(255,140,40,.4)'); gr.addColorStop(1, 'rgba(255,100,20,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(32, 4); g.bezierCurveTo(60, 50, 58, 100, 32, 122); g.bezierCurveTo(6, 100, 4, 50, 32, 4); g.fill();
    return tex(c);
  });
  T.spark = () => memo('spark', () => { const [c, g] = mk(64, 64); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.2, 'rgba(255,236,170,.8)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(32, 4); g.lineTo(32, 60); g.moveTo(4, 32); g.lineTo(60, 32); g.stroke(); return tex(c); });
  T.beam = () => memo('beam', () => {
    const [c, g] = mk(128, 256);
    const v = g.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, 'rgba(255,255,255,0)'); v.addColorStop(.3, 'rgba(255,255,255,.16)'); v.addColorStop(.6, 'rgba(255,255,255,.34)'); v.addColorStop(.85, 'rgba(255,255,255,.1)'); v.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = v; g.fillRect(0, 0, 128, 256);
    g.globalCompositeOperation = 'destination-in'; const h = g.createLinearGradient(0, 0, 128, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = h; g.fillRect(0, 0, 128, 256);
    return tex(c);
  });
  T.shaft = () => memo('shaft', () => {
    const [c, g] = mk(128, 512);
    const v = g.createLinearGradient(0, 0, 0, 512); v.addColorStop(0, 'rgba(190,215,255,.55)'); v.addColorStop(1, 'rgba(190,215,255,0)');
    g.fillStyle = v; g.fillRect(0, 0, 128, 512);
    g.globalCompositeOperation = 'destination-in'; const h = g.createLinearGradient(0, 0, 128, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(.35, 'rgba(0,0,0,.9)'); h.addColorStop(.65, 'rgba(0,0,0,.9)'); h.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = h; g.fillRect(0, 0, 128, 512);
    return tex(c);
  });

  /* Rune : texte flottant (compétence) sur halo. */
  T.rune = (text, color = '#fde3cf', big = false, keep = false) => {
    const [c0, g0] = mk(8, 8); g0.font = `600 ${big ? 30 : 26}px ${SERIF}`;
    const w = Math.min(560, Math.ceil(g0.measureText(text).width) + 70), h = 80;
    const [c, g] = mk(w, h);
    const bg = g.createLinearGradient(0, 0, w, 0); bg.addColorStop(0, 'rgba(20,6,6,0)'); bg.addColorStop(.12, 'rgba(30,8,8,.78)'); bg.addColorStop(.88, 'rgba(30,8,8,.78)'); bg.addColorStop(1, 'rgba(20,6,6,0)');
    g.fillStyle = bg; rr(g, 4, 14, w - 8, h - 28, 26); g.fill();
    g.strokeStyle = color; g.globalAlpha = .7; g.lineWidth = 2; rr(g, 4, 14, w - 8, h - 28, 26); g.stroke(); g.globalAlpha = 1;
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${big ? 30 : 26}px ${SERIF}`; g.fillText(text, w / 2, h / 2 + 1, w - 50);
    const t = tex(c, { own: !keep }); t.userData = { aspect: w / h }; return t;
  };

  /* Étoile « recommandé ». */
  T.star = () => memo('star', () => {
    const [c, g] = mk(128, 128); g.translate(64, 64);
    const gl = g.createRadialGradient(0, 0, 0, 0, 0, 64); gl.addColorStop(0, 'rgba(255,225,140,.9)'); gl.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gl; g.fillRect(-64, -64, 128, 128);
    g.fillStyle = BRAND.goldL; g.strokeStyle = BRAND.goldD; g.lineWidth = 3; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rad = i % 2 ? 14 : 34; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } g.closePath(); g.fill(); g.stroke();
    return tex(c);
  });
})();
