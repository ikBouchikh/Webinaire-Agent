/* Cognitio : la mascotte-guide, scénarisée.
   - Le dessin ne change JAMAIS d'un univers à l'autre : seule l'image de variante (un ou deux accessoires légers) change.
   - Aucun modèle de langage : les répliques viennent de content/cognitio-script.json.
   - Architecture prête pour une API : remplacer `Cognitio.provider` par un objet { reply(ctx) → Promise<string[]> }.
     Le contexte transmis (ctx) ne contient que l'événement et des variables de catalogue, jamais de donnée client. */

(function () {
  'use strict';
  const L = window.LDC, $ = L.$;
  const SCRIPT = (L.content('cognitio-script').lignes) || {};
  const C = L.cognitio = { queue: [], i: 0, key: null };

  /* Fournisseur scénarisé par défaut. */
  C.scripted = { reply: (ctx) => Promise.resolve((SCRIPT[ctx.event] || []).map((t) => L.tpl(t, ctx.vars))) };
  C.provider = C.scripted;

  /* Variante d'image : accessoire du monde (content/domaines.json), « neutre » par défaut. */
  const FILES = ['droit', 'chiffre', 'rh', 'qse', 'management', 'technologies', 'neutre'];
  C.imageFor = (monde, station) => {
    let k = 'neutre';
    if (monde) { k = monde.accessoire || 'neutre'; if (station && monde.accessoiresParDomaine && monde.accessoiresParDomaine[station.id]) k = monde.accessoiresParDomaine[station.id]; }
    if (!FILES.includes(k)) k = 'neutre';
    return `assets/cognitio/cognitio-${k}.webp`;
  };
  C.setImage = (src) => { const img = $('#cgImg'); if (img && !img.src.endsWith(src)) img.src = src; };

  const render = () => {
    const t = $('#cgText'), next = $('#cgNext'); if (!t) return;
    t.textContent = C.queue[C.i] || '';
    next.hidden = !(C.queue.length > 1 && C.i < C.queue.length - 1);
  };

  /* say('monde.arrivee', { univers, promesse }) */
  C.say = (event, vars) => {
    C.key = event;
    return C.provider.reply({ event, vars: vars || {} }).then((lines) => { C.queue = lines.slice(); C.i = 0; render(); return lines; }, () => { /* le guide reste muet plutôt que de bloquer l'interface */ });
  };
  C.sayText = (txt) => { C.queue = [txt]; C.i = 0; render(); };
  C.next = () => { if (C.i < C.queue.length - 1) { C.i++; render(); } };
  C.show = () => { $('#cognitio').classList.remove('off'); $('#cgHide').textContent = 'Masquer'; };
  C.toggle = () => { const el = $('#cognitio'), off = el.classList.toggle('off'); $('#cgHide').textContent = off ? 'Afficher' : 'Masquer'; };

  C.init = () => {
    $('#cgNext').addEventListener('click', C.next);
    $('#cgHide').addEventListener('click', C.toggle);
    $('#cgBubble .ico').innerHTML = L.MARK;
    $('#cognitio .face').addEventListener('click', () => { if ($('#cognitio').classList.contains('off')) C.toggle(); });
    $('#cgBubble').addEventListener('click', (e) => { if (!e.target.closest('button')) $('#cognitio').classList.toggle('open'); });   // mobile : le texte replié se déplie au toucher
  };
})();
