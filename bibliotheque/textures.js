/* Matières et couvertures dessinées en canvas (haute définition, aucun fichier image).
   Tout reste dans la charte : sable, bordeaux, framboise, pêche, or. */

(function () {
  const L = window.LDC;
  const C = L.C = {
    sable: '#F4ECE4', creme: '#FBF7F2', encre: '#4A0A22', bordeaux: '#680D2D', framboise: '#D6175F', framboiseD: '#B50F4E',
    peche: '#F2B48C', rose: '#F3DDE3', bleu: '#2F5DA8', pierre: '#E6D7C3', pierreD: '#C9B293',
    acajou: '#4A1B26', acajouL: '#6A2A38', or: '#D9A441', orL: '#F3D27A', orD: '#8A6420',
  };
  const SERIF = L.SERIF = "Georgia,'Times New Roman',serif";
  const SANS = L.SANS = "'Calibri','Carlito','Segoe UI','Helvetica Neue',Arial,sans-serif";
  const T = L.tex = {};
  const cache = {}, owned = [];

  const rng = T.rng = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const tex = (c, o = {}) => {
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = T.aniso || 8;
    if (o.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (o.own) owned.push(t);
    return t;
  };
  const memo = (k, fn) => (cache[k] || (cache[k] = fn()));
  T.disposeOwned = () => { owned.splice(0).forEach((t) => t.dispose()); };

  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const wrap = (g, text, maxW) => { const words = text.split(' '), lines = []; let cur = ''; words.forEach((w) => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; };
  const goldGrad = (g, x0, y0, x1, y1) => { const q = g.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, C.orD); q.addColorStop(.35, C.orL); q.addColorStop(.62, C.or); q.addColorStop(1, C.orD); return q; };
  const spaced = (g, px) => { try { g.letterSpacing = px + 'px'; } catch (e) { /* ignoré */ } };
  const noise = (g, w, h, n, r, a = .06) => { for (let i = 0; i < n; i++) { g.fillStyle = r() > .5 ? `rgba(255,255,255,${a * r()})` : `rgba(0,0,0,${a * 1.5 * r()})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } };
  const shade = T.shade = (hex, amt) => { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  const hexA = T.hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  T.wordmark = (g, x, y, size, color) => {
    g.save(); g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${Math.round(size * .5)}px ${SERIF}`; spaced(g, size * .07); g.fillText('LEFEBVRE DALLOZ', x, y - size * .12);
    g.font = `600 ${Math.round(size * .24)}px ${SANS}`; spaced(g, size * .09); g.fillText('COMPÉTENCES', x, y + size * .3); spaced(g, 0); g.restore();
  };

  /* ---------- architecture ---------- */

  T.marble = () => memo('marble', () => {
    const [c, g] = mk(1024, 1024), r = rng(7);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const dark = (i + j) % 2, x = i * 256, y = j * 256;
      g.fillStyle = dark ? '#6A1230' : '#E8DAC7'; g.fillRect(x, y, 256, 256);
      for (let k = 0; k < 7; k++) { g.strokeStyle = dark ? `rgba(255,220,225,${.05 + r() * .09})` : `rgba(120,80,60,${.05 + r() * .08})`; g.lineWidth = .8 + r() * 2; g.beginPath(); g.moveTo(x + r() * 256, y); g.bezierCurveTo(x + r() * 256, y + 90, x + r() * 256, y + 170, x + r() * 256, y + 256); g.stroke(); }
      g.strokeStyle = dark ? 'rgba(20,0,8,.5)' : 'rgba(110,80,50,.4)'; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, 253, 253);
    }
    noise(g, 1024, 1024, 9000, r, .05);
    return tex(c, { repeat: true });
  });

  T.parquet = () => memo('parquet', () => {
    const [c, g] = mk(1024, 1024), r = rng(11);
    g.fillStyle = '#2A0F14'; g.fillRect(0, 0, 1024, 1024);
    const pw = 64, pl = 341;
    for (let row = 0; row < 16; row++) { const off = r() * pl; for (let x = -pl; x < 1024 + pl; x += pl) { const l = 22 + r() * 9; g.fillStyle = `hsl(${352 + r() * 8},${38 + r() * 10}%,${l}%)`; g.fillRect(x + off + 1.5, row * pw + 1.5, pl - 3, pw - 3); for (let k = 0; k < 10; k++) { g.strokeStyle = `rgba(20,0,6,${.06 + r() * .1})`; g.lineWidth = 1; g.beginPath(); const yy = row * pw + 5 + r() * (pw - 10); g.moveTo(x + off + 2, yy); g.bezierCurveTo(x + off + 100, yy + r() * 5 - 2.5, x + off + 230, yy + r() * 5 - 2.5, x + off + pl - 2, yy + r() * 3 - 1.5); g.stroke(); } } }
    noise(g, 1024, 1024, 5000, r, .05);
    return tex(c, { repeat: true });
  });

  T.stone = () => memo('stone', () => {
    const [c, g] = mk(1024, 1024), r = rng(13);
    g.fillStyle = '#C9B293'; g.fillRect(0, 0, 1024, 1024);
    for (let y = 0; y < 1024; y += 128) { const off = (y / 128) % 2 ? 128 : 0; for (let x = -256; x < 1024; x += 256) { const l = 78 + r() * 6; g.fillStyle = `hsl(33,${28 + r() * 8}%,${l}%)`; g.fillRect(x + off + 3, y + 3, 250, 122); } }
    noise(g, 1024, 1024, 14000, r, .07);
    return tex(c, { repeat: true });
  });

  T.wood = (key, base, seed) => memo('wood:' + key, () => {
    const [c, g] = mk(512, 512), r = rng(seed || 3);
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 80; i++) { const x = r() * 512; g.strokeStyle = r() > .5 ? `rgba(0,0,0,${.05 + r() * .1})` : `rgba(255,210,200,${.03 + r() * .05})`; g.lineWidth = .6 + r() * 2; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + r() * 26 - 13, 170, x + r() * 26 - 13, 340, x + r() * 18 - 9, 512); g.stroke(); }
    noise(g, 512, 512, 2200, r, .05);
    return tex(c, { repeat: true });
  });

  /* Rayonnages peints (fond lointain) : 8 étagères de dos de livres aux couleurs de la charte. */
  T.bookwall = (seed = 1) => memo('bw:' + seed, () => {
    const [c, g] = mk(2048, 2048), r = rng(seed * 97 + 5);
    const pal = ['#680D2D', '#7A1233', '#4A0A22', '#8B0F3E', '#5A2230', '#6A1230', '#E6D7C3', '#F3DDE3', '#B58A4A', '#2F5DA8', '#3A2A2E', '#9A4A2B', '#680D2D', '#5A0B27'];
    const rows = 8, sh = 2048 / rows;
    for (let s = 0; s < rows; s++) {
      const y0 = s * sh; const bg = g.createLinearGradient(0, y0, 0, y0 + sh); bg.addColorStop(0, '#1A070C'); bg.addColorStop(1, '#2E0E16'); g.fillStyle = bg; g.fillRect(0, y0, 2048, sh);
      let x = 0;
      while (x < 2048) {
        const w = 20 + r() * 34, h = 150 + r() * 70, col = pal[(r() * pal.length) | 0]; if (r() < .05) { x += 30 + r() * 50; continue; }
        const top = y0 + sh - 22 - h, gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(255,255,255,.2)'); gr.addColorStop(.3, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.45)');
        g.fillStyle = col; g.fillRect(x, top, w, h); g.fillStyle = gr; g.fillRect(x, top, w, h);
        g.fillStyle = r() > .4 ? C.orD : C.orL; g.fillRect(x, top + 12 + r() * 8, w, 3); g.fillRect(x, top + h - 26 - r() * 8, w, 3);
        if (r() > .45) { g.fillStyle = 'rgba(243,210,122,.6)'; g.fillRect(x + w * .22, top + h * .32, w * .56, h * .2); }
        x += w + 1;
      }
      const wd = g.createLinearGradient(0, y0 + sh - 22, 0, y0 + sh); wd.addColorStop(0, '#6A2A3A'); wd.addColorStop(.25, '#8A3A4C'); wd.addColorStop(1, '#3A1219'); g.fillStyle = wd; g.fillRect(0, y0 + sh - 22, 2048, 22);
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, y0 + sh - 44, 2048, 22);
    }
    return tex(c, { repeat: true });
  });

  T.coffer = () => memo('coffer', () => {
    const [c, g] = mk(1024, 1024), r = rng(23);
    g.fillStyle = '#E4D3BE'; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const x = i * 512, y = j * 512;
      g.fillStyle = '#D9C5AB'; g.fillRect(x + 36, y + 36, 440, 440);
      const gr = g.createLinearGradient(x, y, x + 512, y + 512); gr.addColorStop(0, 'rgba(255,255,255,.3)'); gr.addColorStop(1, 'rgba(0,0,0,.14)'); g.fillStyle = gr; g.fillRect(x + 36, y + 36, 440, 440);
      g.strokeStyle = goldGrad(g, x, y, x + 512, y + 512); g.lineWidth = 7; g.strokeRect(x + 56, y + 56, 400, 400); g.lineWidth = 2; g.strokeRect(x + 76, y + 76, 360, 360);
      g.fillStyle = C.bordeaux; g.beginPath(); g.arc(x + 256, y + 256, 26, 0, 7); g.fill(); g.strokeStyle = C.or; g.lineWidth = 4; g.stroke();
    }
    noise(g, 1024, 1024, 5000, r, .04);
    return tex(c, { repeat: true });
  });

  T.dome = () => memo('dome', () => {
    const [c, g] = mk(2048, 512);
    const bg = g.createLinearGradient(0, 0, 0, 512); bg.addColorStop(0, '#FBF7F2'); bg.addColorStop(1, '#DCC8AC'); g.fillStyle = bg; g.fillRect(0, 0, 2048, 512);
    for (let i = 0; i < 24; i++) { const x = i * 2048 / 24; g.fillStyle = i % 2 ? 'rgba(120,70,50,.07)' : 'rgba(255,255,255,.12)'; g.fillRect(x, 0, 2048 / 24, 512); }
    for (let i = 0; i < 12; i++) { const x = i * 2048 / 12; g.fillStyle = C.bordeaux; g.fillRect(x - 10, 0, 20, 512); g.fillStyle = goldGrad(g, 0, 0, 0, 512); g.fillRect(x - 3, 0, 6, 512); }
    for (let k = 1; k < 5; k++) { g.fillStyle = C.bordeaux; g.fillRect(0, k * 96, 2048, 12); g.fillStyle = C.or; g.fillRect(0, k * 96 + 4, 2048, 4); }
    return tex(c);
  });

  T.balustrade = () => memo('bal', () => {
    const [c, g] = mk(512, 256); g.clearRect(0, 0, 512, 256);
    for (let x = 16; x < 512; x += 64) { const q = g.createLinearGradient(x - 14, 0, x + 14, 0); q.addColorStop(0, '#3A1219'); q.addColorStop(.4, '#9A5A52'); q.addColorStop(1, '#3A1219'); g.fillStyle = q; g.beginPath(); g.moveTo(x - 7, 12); g.quadraticCurveTo(x - 17, 128, x - 7, 244); g.lineTo(x + 7, 244); g.quadraticCurveTo(x + 17, 128, x + 7, 12); g.fill(); g.fillStyle = q; g.beginPath(); g.arc(x, 128, 14, 0, 7); g.fill(); }
    return tex(c, { repeat: true });
  });

  T.windowGlass = () => memo('win', () => {
    const [c, g] = mk(512, 1024);
    const sky = g.createLinearGradient(0, 0, 0, 1024); sky.addColorStop(0, '#FFF8EC'); sky.addColorStop(1, '#F1DDC2'); g.fillStyle = sky; g.fillRect(0, 0, 512, 1024);
    const gl = g.createRadialGradient(256, 300, 10, 256, 300, 420); gl.addColorStop(0, 'rgba(255,255,255,.9)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(0, 0, 512, 1024);
    g.strokeStyle = '#7A5A4A'; g.lineWidth = 12; g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 1024); g.stroke();
    for (const y of [300, 560, 800]) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    return tex(c);
  });

  /* ---------- portes ---------- */

  T.doorLeaf = () => memo('leaf', () => {
    const [c, g] = mk(512, 1024), r = rng(41);
    g.fillStyle = C.acajou; g.fillRect(0, 0, 512, 1024);
    for (let i = 0; i < 40; i++) { const x = r() * 512; g.strokeStyle = r() > .5 ? 'rgba(0,0,0,.14)' : 'rgba(255,210,200,.07)'; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 12, 300, x - 12, 700, x, 1024); g.stroke(); }
    const panel = (x, y, w, h) => { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x - 6, y - 6, w + 12, h + 12); g.fillStyle = C.acajouL; g.fillRect(x, y, w, h); const q = g.createLinearGradient(x, y, x + w, y + h); q.addColorStop(0, 'rgba(255,255,255,.18)'); q.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = q; g.fillRect(x, y, w, h); g.strokeStyle = 'rgba(243,210,122,.7)'; g.lineWidth = 3; g.strokeRect(x + 14, y + 14, w - 28, h - 28); };
    panel(46, 50, 420, 400); panel(46, 500, 420, 470);
    g.fillStyle = C.orL; for (const [x, y] of [[26, 26], [486, 26], [26, 998], [486, 998], [26, 480], [486, 480]]) { g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); }
    noise(g, 512, 1024, 3000, r, .05);
    return tex(c);
  });

  T.transom = (dom) => memo('transom:' + dom.id, () => {
    const [c, g] = mk(512, 256); g.clearRect(0, 0, 512, 256);
    g.save(); g.beginPath(); g.moveTo(0, 256); g.lineTo(0, 256); g.arc(256, 256, 256, Math.PI, 0); g.closePath(); g.clip();
    const q = g.createRadialGradient(256, 256, 10, 256, 256, 260); q.addColorStop(0, '#FFF6E4'); q.addColorStop(.55, dom.lueur); q.addColorStop(1, dom.couleur); g.fillStyle = q; g.fillRect(0, 0, 512, 256);
    g.strokeStyle = 'rgba(58,18,25,.8)'; g.lineWidth = 6; for (let i = 0; i <= 12; i++) { const a = Math.PI + i * Math.PI / 12; g.beginPath(); g.moveTo(256, 256); g.lineTo(256 + Math.cos(a) * 260, 256 + Math.sin(a) * 260); g.stroke(); }
    for (const rad of [90, 170]) { g.beginPath(); g.arc(256, 256, rad, Math.PI, 0); g.stroke(); }
    g.fillStyle = '#FFF6E4'; g.beginPath(); g.arc(256, 256, 62, Math.PI, 0); g.fill(); g.strokeStyle = 'rgba(58,18,25,.8)'; g.stroke();
    g.fillStyle = dom.couleur; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = `700 ${dom.glyph.length > 2 ? 30 : dom.glyph.length > 1 ? 40 : 56}px ${SERIF}`; g.fillText(dom.glyph, 256, 244);
    g.restore(); return tex(c);
  });

  T.vestibule = (dom) => memo('vest:' + dom.id, () => {
    const [c, g] = mk(256, 512);
    const q = g.createRadialGradient(128, 260, 10, 128, 260, 300); q.addColorStop(0, '#FFF6E4'); q.addColorStop(.45, hexA(dom.lueur, 1)); q.addColorStop(1, shade(dom.couleur, -.35)); g.fillStyle = q; g.fillRect(0, 0, 256, 512);
    g.strokeStyle = 'rgba(255,246,228,.35)'; g.lineWidth = 2; for (let i = -5; i <= 5; i++) { g.beginPath(); g.moveTo(128 + i * 8, 250); g.lineTo(128 + i * 40, 512); g.stroke(); }
    return tex(c);
  });

  /* ---------- enseignes ---------- */

  const plate = (w, h, kicker, title, tcol) => {
    const [c, g] = mk(w, h);
    const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, '#F1E6D4'); q.addColorStop(1, '#DCC8AC'); g.fillStyle = q; rr(g, 6, 6, w - 12, h - 12, h * .1); g.fill();
    g.strokeStyle = goldGrad(g, 0, 0, w, h); g.lineWidth = h * .035; rr(g, h * .08, h * .08, w - h * .16, h - h * .16, h * .06); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (kicker) { g.fillStyle = C.framboiseD; g.font = `700 ${h * .17}px ${SANS}`; spaced(g, h * .02); g.fillText(kicker, w / 2, h * .3); spaced(g, 0); }
    g.fillStyle = tcol || C.bordeaux; g.font = `700 ${h * (kicker ? .3 : .42)}px ${SERIF}`; g.fillText(title, w / 2, h * (kicker ? .64 : .52), w * .88);
    return tex(c, { own: true });
  };
  T.plaque = (dom) => memo('plq:' + dom.id, () => plate(1024, 200, 'RAYON', dom.court, C.bordeaux));
  T.valance = (theme, n, total) => plate(2048, 282, `TRAVÉE ${n} SUR ${total}`, theme, C.bordeaux);

  T.rosace = () => memo('rosace', () => {
    const [c, g] = mk(1024, 1024), cx = 512, cy = 512; g.clearRect(0, 0, 1024, 1024);
    const ring = (r0, r1, col) => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r1, 0, 7); g.arc(cx, cy, r0, 0, 7, true); g.fill(); };
    g.fillStyle = C.bordeaux; g.beginPath(); g.arc(cx, cy, 508, 0, 7); g.fill(); ring(484, 508, C.or); ring(470, 478, C.orL);
    ring(330, 440, '#4A0A22'); ring(322, 330, C.orL);
    g.fillStyle = C.framboise; g.strokeStyle = C.orL; g.lineWidth = 4; g.beginPath(); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12 - Math.PI / 2, rad = i % 2 ? 150 : 300; g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C.bordeaux; g.beginPath(); g.arc(cx, cy, 120, 0, 7); g.fill(); g.lineWidth = 5; g.stroke(); g.fillStyle = C.orL; g.font = `700 104px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LD', cx, cy + 4);
    g.fillStyle = C.orL; g.font = `600 42px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; spaced(g, 4);
    const txt = 'LEFEBVRE DALLOZ COMPÉTENCES  ·  CATALOGUE 2027  ·  ', n = txt.length;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; g.save(); g.translate(cx + Math.cos(a) * 395, cy + Math.sin(a) * 395); g.rotate(a + Math.PI / 2); g.fillText(txt[i], 0, 0); g.restore(); }
    return tex(c);
  });

  T.runner = (dom) => memo('runner:' + dom.id, () => {
    const [c, g] = mk(1024, 256);
    g.fillStyle = shade(dom.cuir, -.15); g.fillRect(0, 0, 1024, 256);
    g.strokeStyle = C.or; g.lineWidth = 12; g.strokeRect(0, 12, 1024, 232); g.strokeStyle = 'rgba(243,210,122,.7)'; g.lineWidth = 3; g.strokeRect(-4, 34, 1032, 188);
    for (let i = 0; i < 2; i++) { const x = 256 + i * 512; g.fillStyle = shade(dom.cuir, .12); g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 170, 128); g.lineTo(x, 216); g.lineTo(x - 170, 128); g.closePath(); g.fill(); g.strokeStyle = C.or; g.lineWidth = 5; g.stroke(); g.fillStyle = C.orL; g.beginPath(); g.arc(x, 128, 22, 0, 7); g.fill(); }
    return tex(c, { repeat: true });
  });

  /* ---------- reliures ---------- */

  const leather = (color, seed, w, h) => {
    const [c, g] = mk(w, h), r = rng(seed); g.fillStyle = color; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { g.fillStyle = r() > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; g.beginPath(); g.arc(r() * w, r() * h, 1.2 + r() * 3, 0, 7); g.fill(); }
    const v = g.createRadialGradient(w / 2, h * .45, w * .2, w / 2, h * .5, h * .75); v.addColorStop(0, 'rgba(255,255,255,.06)'); v.addColorStop(1, 'rgba(0,0,0,.42)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
    return [c, g];
  };

  T.cover = (livre) => {
    const dom = livre.dom, fm = L.FORMATS[livre.fmt], W = 1024, H = 1440;
    const [c, g] = leather(dom.cuir, livre.titre.length * 13 + livre.slot, W, H), gold = goldGrad(g, 0, 0, W, H);
    g.strokeStyle = gold; g.lineWidth = 12; g.strokeRect(48, 48, W - 96, H - 96); g.lineWidth = 3.5; g.strokeRect(76, 76, W - 152, H - 152);
    [[76, 76, 1, 1], [W - 76, 76, -1, 1], [76, H - 76, 1, -1], [W - 76, H - 76, -1, -1]].forEach(([x, y, sx, sy]) => { g.save(); g.translate(x, y); g.scale(sx, sy); g.lineWidth = 6; g.beginPath(); g.moveTo(0, 74); g.quadraticCurveTo(0, 0, 74, 0); g.moveTo(0, 46); g.quadraticCurveTo(0, 0, 46, 0); g.stroke(); g.restore(); });
    T.wordmark(g, W / 2, 215, 118, C.orL); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeStyle = gold; g.lineWidth = 8; g.beginPath(); g.arc(W / 2, 520, 140, 0, 7); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(W / 2, 520, 160, 0, 7); g.stroke();
    g.fillStyle = hexA(dom.lueur, .16); g.beginPath(); g.arc(W / 2, 520, 134, 0, 7); g.fill();
    g.fillStyle = gold; g.font = `700 ${dom.glyph.length > 2 ? 84 : dom.glyph.length > 1 ? 112 : 168}px ${SERIF}`; g.fillText(dom.glyph, W / 2, 532);
    g.fillStyle = C.creme; let fs = 88; g.font = `700 ${fs}px ${SERIF}`; let lines = wrap(g, livre.titre, 760);
    while (lines.length > 5 && fs > 56) { fs -= 5; g.font = `700 ${fs}px ${SERIF}`; lines = wrap(g, livre.titre, 760); }
    const lh = fs * 1.2; lines.forEach((l, i) => g.fillText(l, W / 2, 780 + i * lh + (5 - lines.length) * lh * .3));
    g.strokeStyle = gold; g.lineWidth = 4; g.beginPath(); g.moveTo(260, 1180); g.lineTo(W - 260, 1180); g.stroke();
    g.fillStyle = C.peche; g.font = `italic 600 44px ${SERIF}`; g.fillText(livre.theme.nom, W / 2, 1236, 800);
    g.fillStyle = C.creme; g.font = `700 38px ${SANS}`; spaced(g, 4); g.fillText(`${fm.nom.toUpperCase()}  ·  ${livre.duree.toUpperCase()}`, W / 2, 1310); spaced(g, 0);
    g.fillStyle = fm.col; g.beginPath(); g.moveTo(780, 0); g.lineTo(880, 0); g.lineTo(880, 262); g.lineTo(830, 214); g.lineTo(780, 262); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(780, 0, 10, 262);
    return tex(c, { own: true });
  };

  T.titlePage = (livre) => {
    const W = 1024, H = 1440, [c, g] = mk(W, H), r = rng(4);
    g.fillStyle = '#F6EEE0'; g.fillRect(0, 0, W, H); const v = g.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 900); v.addColorStop(0, 'rgba(255,250,240,0)'); v.addColorStop(1, 'rgba(150,100,60,.22)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    noise(g, W, H, 6000, r, .04); g.strokeStyle = 'rgba(104,13,45,.5)'; g.lineWidth = 3; g.strokeRect(64, 64, W - 128, H - 128);
    T.wordmark(g, W / 2, 200, 96, C.framboise);
    g.fillStyle = C.encre; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 68px ${SERIF}`; const lines = wrap(g, livre.titre, 780); lines.forEach((l, i) => g.fillText(l, W / 2, 400 + i * 82));
    const y1 = 400 + lines.length * 82 + 20; g.fillStyle = C.framboise; g.fillRect(W / 2 - 60, y1, 120, 6);
    g.fillStyle = '#6A4A52'; g.font = `italic 600 42px ${SERIF}`; g.fillText(livre.theme.nom, W / 2, y1 + 66, 800);
    g.textAlign = 'left'; g.fillStyle = C.framboiseD; g.font = `700 32px ${SANS}`; spaced(g, 4); g.fillText('COMPÉTENCES VISÉES', 130, y1 + 190); spaced(g, 0); g.font = `600 40px ${SERIF}`; let yy = y1 + 260;
    livre.comps.slice(0, 4).forEach((cp) => { g.fillStyle = C.framboise; g.beginPath(); g.arc(146, yy - 12, 8, 0, 7); g.fill(); g.fillStyle = C.encre; const ls = wrap(g, cp, 720); ls.forEach((l, i) => g.fillText(l, 176, yy + i * 50)); yy += 56 + (ls.length - 1) * 50 + 22; });
    g.textAlign = 'center'; g.fillStyle = 'rgba(74,10,34,.55)'; g.font = `italic 32px ${SERIF}`; g.fillText('Lefebvre Dalloz Compétences · Catalogue 2027', W / 2, H - 110);
    return tex(c, { own: true });
  };

  T.endpaper = (dom) => memo('endp:' + dom.id, () => {
    const W = 1024, H = 1440, [c, g] = mk(W, H), r = rng(dom.index * 5 + 2);
    g.fillStyle = '#F4ECE4'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 46; i++) { g.strokeStyle = r() > .5 ? hexA(dom.couleur, .1) : 'rgba(104,13,45,.07)'; g.lineWidth = 4 + r() * 14; g.beginPath(); const y = r() * H; g.moveTo(0, y); g.bezierCurveTo(260, y + r() * 280 - 140, 760, y + r() * 280 - 140, W, y + r() * 120 - 60); g.stroke(); }
    g.strokeStyle = goldGrad(g, 0, 0, W, H); g.lineWidth = 8; g.strokeRect(60, 60, W - 120, H - 120);
    g.fillStyle = C.bordeaux; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${dom.glyph.length > 2 ? 150 : dom.glyph.length > 1 ? 210 : 340}px ${SERIF}`; g.fillText(dom.glyph, W / 2, 660);
    g.fillStyle = C.encre; g.font = `italic 600 52px ${SERIF}`; g.fillText('Ex-libris', W / 2, 1030); g.font = `700 36px ${SANS}`; spaced(g, 5); g.fillText(dom.court.toUpperCase(), W / 2, 1100); spaced(g, 0);
    return tex(c);
  });

  T.spine = () => memo('spine', () => {
    const [c, g] = mk(64, 256); const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, '#A0A0A0'); gr.addColorStop(.3, '#fff'); gr.addColorStop(.7, '#D0D0D0'); gr.addColorStop(1, '#707070'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    g.fillStyle = '#F6E3A0'; g.fillRect(0, 22, 64, 4); g.fillRect(0, 31, 64, 2); g.fillRect(0, 226, 64, 4); g.fillRect(0, 217, 64, 2); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(8, 70, 48, 90); g.fillStyle = '#F6E3A0'; g.fillRect(14, 80, 36, 3); g.fillRect(14, 148, 36, 3);
    return tex(c);
  });


  /* ---------- le premier Code civil (1804) ---------- */
  const aged = (w, h, seed) => {
    const [c, g] = mk(w, h), r = rng(seed); g.fillStyle = '#EFE2C6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h, rad = 6 + r() * 34, q = g.createRadialGradient(x, y, 0, x, y, rad); q.addColorStop(0, `rgba(150,100,50,${.04 + r() * .08})`); q.addColorStop(1, 'rgba(150,100,50,0)'); g.fillStyle = q; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    const v = g.createRadialGradient(w / 2, h / 2, w * .3, w / 2, h / 2, h * .75); v.addColorStop(0, 'rgba(255,250,235,0)'); v.addColorStop(1, 'rgba(120,80,40,.3)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
    noise(g, w, h, 9000, r, .05); return [c, g];
  };
  const INK = '#3A2418';
  const rule = (g, y, w) => { g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2 - 230, y); g.lineTo(w / 2 + 230, y); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.moveTo(w / 2 - 230, y + 9); g.lineTo(w / 2 + 230, y + 9); g.stroke(); };
  T.codeTitle = () => memo('codeTitle', () => {
    const W = 1024, H = 1440, [c, g] = aged(W, H, 9); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK;
    g.strokeStyle = 'rgba(58,36,24,.55)'; g.lineWidth = 3; g.strokeRect(70, 70, W - 140, H - 140);
    g.font = `700 112px ${SERIF}`; spaced(g, 6); g.fillText('CODE CIVIL', W / 2, 360); g.font = `700 78px ${SERIF}`; g.fillText('DES FRANÇAIS', W / 2, 480); spaced(g, 0);
    rule(g, 570, W);
    g.font = `600 42px ${SERIF}`; spaced(g, 4); g.fillText('ÉDITION ORIGINALE', W / 2, 700); g.font = `italic 600 40px ${SERIF}`; spaced(g, 0); g.fillText('et seule officielle', W / 2, 770);
    rule(g, 850, W);
    g.font = `600 44px ${SERIF}`; spaced(g, 3); g.fillText('À PARIS,', W / 2, 980); g.font = `600 36px ${SERIF}`; g.fillText('DE L\'IMPRIMERIE DE LA RÉPUBLIQUE.', W / 2, 1050, 800); spaced(g, 0);
    g.font = `700 52px ${SERIF}`; spaced(g, 4); g.fillText('AN XII — 1804.', W / 2, 1190); spaced(g, 0);
    return tex(c);
  });
  T.codePage = () => memo('codePage', () => {
    const W = 1024, H = 1440, [c, g] = aged(W, H, 21), r = rng(5); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK;
    const bars = (y0, n) => { for (let i = 0; i < n; i++) { const y = y0 + i * 40, w = (i % 6 === 5) ? 340 : 700; g.fillStyle = `rgba(58,36,24,${.5 + r() * .15})`; g.fillRect(150, y, w, 6); } };
    g.font = `700 40px ${SERIF}`; spaced(g, 8); g.fillText('TITRE PRÉLIMINAIRE', W / 2, 190); spaced(g, 0);
    g.font = `italic 600 34px ${SERIF}`; g.fillText('De la publication, des effets et de l\'application', W / 2, 262, 760); g.fillText('des lois en général.', W / 2, 308);
    rule(g, 360, W); bars(430, 14);
    g.fillStyle = INK; g.font = `700 36px ${SERIF}`; spaced(g, 8); g.fillText('LIVRE PREMIER', W / 2, 1060); spaced(g, 0); g.font = `italic 600 38px ${SERIF}`; g.fillText('Des personnes', W / 2, 1115);
    bars(1170, 5); g.fillStyle = INK; g.font = `600 30px ${SERIF}`; g.fillText('1', W / 2, H - 100);
    return tex(c);
  });
  T.codeCover = () => memo('codeCover', () => {
    const W = 1024, H = 1440, [c, g] = leather('#5A0B27', 404, W, H), gold = goldGrad(g, 0, 0, W, H);
    g.strokeStyle = gold; g.lineWidth = 12; g.strokeRect(48, 48, W - 96, H - 96); g.lineWidth = 3.5; g.strokeRect(76, 76, W - 152, H - 152);
    g.fillStyle = 'rgba(30,0,12,.55)'; rr(g, 180, 330, W - 360, 520, 18); g.fill(); g.strokeStyle = gold; g.lineWidth = 6; rr(g, 180, 330, W - 360, 520, 18); g.stroke();
    g.fillStyle = gold; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 92px ${SERIF}`; spaced(g, 6); g.fillText('CODE', W / 2, 480); g.fillText('CIVIL', W / 2, 590); g.font = `700 52px ${SERIF}`; g.fillText('DES FRANÇAIS', W / 2, 720); spaced(g, 0);
    g.font = `italic 600 44px ${SERIF}`; g.fillText('Édition originale', W / 2, 1010); g.font = `700 64px ${SERIF}`; spaced(g, 8); g.fillText('1804', W / 2, 1130); spaced(g, 0);
    for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + s * (.35 + i * .2); g.save(); g.translate(W / 2 + Math.sin(a) * 250, 1130 + 50 - Math.cos(a) * 140 + 140); g.rotate(a * .8); g.fillStyle = gold; g.beginPath(); g.ellipse(0, 0, 8, 22, 0, 0, 7); g.fill(); g.restore(); }
    return tex(c);
  });

  /* ---------- lueurs ---------- */
  T.glow = () => memo('glow', () => { const [c, g] = mk(128, 128), q = g.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(.3, 'rgba(255,255,255,.45)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128); return tex(c); });
  T.flame = () => memo('flame', () => { const [c, g] = mk(64, 128), q = g.createRadialGradient(32, 84, 2, 32, 76, 52); q.addColorStop(0, 'rgba(255,255,235,1)'); q.addColorStop(.3, 'rgba(255,222,150,.95)'); q.addColorStop(.7, 'rgba(255,170,90,.35)'); q.addColorStop(1, 'rgba(255,130,60,0)'); g.fillStyle = q; g.beginPath(); g.moveTo(32, 4); g.bezierCurveTo(60, 50, 58, 100, 32, 122); g.bezierCurveTo(6, 100, 4, 50, 32, 4); g.fill(); return tex(c); });
  T.spark = () => memo('spark', () => { const [c, g] = mk(64, 64), q = g.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(.25, 'rgba(255,236,170,.8)'); q.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); return tex(c); });
  T.beam = () => memo('beam', () => {
    const [c, g] = mk(128, 256), v = g.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, 'rgba(255,255,255,0)'); v.addColorStop(.4, 'rgba(255,255,255,.18)'); v.addColorStop(.85, 'rgba(255,255,255,.34)'); v.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = v; g.fillRect(0, 0, 128, 256);
    g.globalCompositeOperation = 'destination-in'; const h = g.createLinearGradient(0, 0, 128, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = h; g.fillRect(0, 0, 128, 256); return tex(c);
  });
})();
