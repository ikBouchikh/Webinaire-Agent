/* Noyau : espace de noms, utilitaires, contenus, état local, panneaux.
   Aucune requête réseau : tout vient des fichiers locaux data/*.js et content/*.js. */

(function () {
  'use strict';
  const L = window.LDC = window.LDC || {};
  const q = new URLSearchParams(location.search);
  L.env = window.LDC_ENV || {};   // { artifact: true } dans la version publiée en ligne (impression indisponible)
  L.params = { debug: q.has('debug'), fast: +(q.get('fast') || 1), noGL: q.has('nogl'), reduce: q.has('reduce') };

  L.$ = (s, r = document) => r.querySelector(s);
  L.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  L.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  L.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  L.clamp01 = (v) => L.clamp(v, 0, 1);
  L.lerp = (a, b, t) => a + (b - a) * t;
  L.ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  L.mod = (a, n) => ((a % n) + n) % n;
  L.norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  L.plural = (n, s, p) => (n > 1 ? (p || s + 's') : s);

  /* Mouvement réduit : préférence système, ou ?reduce pour les tests. */
  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  L.reduced = () => L.params.reduce || mq.matches;

  /* ---------- contenus éditoriaux (content/*.json agrégés par tools/build-data.py) ---------- */
  L.CONTENT = window.LDC_CONTENT || {};
  L.content = (name) => L.CONTENT[name] || {};

  /* Étiquette « À VALIDER » : tout texte ou donnée non validé est signalé à l'écran. */
  L.tagAV = (txt) => `<span class="av" title="Donnée non validée : à confirmer par l'offre">${L.esc(txt || 'À VALIDER')}</span>`;

  /* Gabarit {variable} pour les textes scénarisés. */
  L.tpl = (s, v) => {
    const vars = Object.assign({}, v); if (vars.univers) vars.universL = vars.univers.charAt(0).toLowerCase() + vars.univers.slice(1);   // « dans l'observatoire… » en milieu de phrase
    return String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  };

  /* ---------- stockage local (jamais bloquant) ---------- */
  const KEY = 'ldc-bibliotheque-v4';
  let mem = {};
  L.store = {
    load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return mem; } },
    save(o) { mem = o; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* stockage indisponible : on garde en mémoire */ } },
    clear() { mem = {}; try { localStorage.removeItem(KEY); } catch (e) { /* ignoré */ } },
  };

  /* ---------- état de l'application ---------- */
  const blank = () => ({
    besoin: { texte: '', metier: null, competences: [], momentId: null, niveau: null, formats: [], dureeMax: null, mondes: [] },
    produits: [],
    argument: '',
    etape: '',
  });
  const saved = L.store.load();
  const S = L.state = {
    seenTransition: !!saved.seenTransition,
    seenIntro: !!saved.seenIntro,
    client: Object.assign(blank(), saved.client || {}),
    listeners: new Set(),
  };
  S.client.besoin = Object.assign(blank().besoin, S.client.besoin || {});
  L.onChange = (fn) => { S.listeners.add(fn); return () => S.listeners.delete(fn); };
  L.persist = () => {
    L.store.save({ seenTransition: S.seenTransition, seenIntro: S.seenIntro, client: S.client });
    S.listeners.forEach((fn) => { try { fn(); } catch (e) { /* un abonné défaillant ne bloque pas les autres */ } });
  };
  L.resetClient = () => { S.client = blank(); L.persist(); };

  /* ---------- notification brève ---------- */
  let toastT = 0;
  L.toast = (msg) => {
    const t = L.$('#toast'); if (!t) return; t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600);
  };

  /* ---------- copie dans le presse-papiers (repli execCommand pour file://) ---------- */
  L.copy = (txt) => new Promise((resolve) => {
    const fb = () => { const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } ta.remove(); resolve(ok); };
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) navigator.clipboard.writeText(txt).then(() => resolve(true), fb); else fb();
  });

  /* ---------- panneaux : ouverture, fermeture, Échap, focus ---------- */
  const stack = [];
  const sync = () => {
    document.body.classList.toggle('has-panel', stack.some((el) => !el.classList.contains('left')));
    document.body.classList.toggle('has-pitch', stack.some((el) => el.classList.contains('left')));
  };
  L.panels = {
    stack,
    open(el, opts = {}) {
      /* un seul panneau à droite à la fois (le pitch, à gauche, reste ouvert) */
      if (!el.classList.contains('left')) stack.slice().forEach((o) => { if (o !== el && !o.classList.contains('left')) L.panels.close(o, true); });
      if (!stack.includes(el)) stack.push(el);
      sync();
      el._opener = document.activeElement; el._onClose = opts.onClose;
      el.hidden = false; requestAnimationFrame(() => el.classList.add('show'));
      el.setAttribute('aria-hidden', 'false');
      if (opts.focus !== false) setTimeout(() => { const f = L.$(opts.focus || '[data-autofocus],h2,h3', el); if (f) { if (!f.hasAttribute('tabindex')) f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); } }, 60);
    },
    close(el, silent) {
      const i = stack.indexOf(el); if (i >= 0) stack.splice(i, 1);
      sync();
      el.classList.remove('show'); el.setAttribute('aria-hidden', 'true');
      setTimeout(() => { if (!el.classList.contains('show')) el.hidden = true; }, L.reduced() ? 0 : 380);
      if (!silent) { if (el._onClose) el._onClose(); if (el._opener && el._opener.focus && document.contains(el._opener)) { try { el._opener.focus({ preventScroll: true }); } catch (e) { /* ignoré */ } } }
    },
    top() { return stack[stack.length - 1] || null; },
    isOpen(el) { return stack.includes(el); },
  };

  /* ---------- identité : symbole approché (À VALIDER) ----------
     Le symbole officiel « JL » n'a pas été fourni. Cette forme (rectangle à angles arrondis, encoche
     en haut à droite) reprend la silhouette récurrente de la charte et n'est PAS le logo officiel. */
  L.ICON_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M12 6h30a6 6 0 0 1 6 6v8h8a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z" fill="currentColor"/></svg>';
})();
