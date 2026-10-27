/* Transition Grande salle → univers : une séquence narrative.
   Les pages d'un livre s'ouvrent → un ordinateur en émerge → une feuille sort de l'écran → elle se plie en Cognitio
   → Cognitio invite dans l'univers → l'ancien monde disparaît.

   Trois façons de la jouer, sans aucun appel réseau :
   1. vidéo locale (assets/transition/*.webm / .mp4) quand les fichiers existent (détectés par tools/build-data.py) ;
   2. séquence procédurale HTML/CSS/SVG (par défaut) ;
   3. version courte (visites suivantes) ou image fixe (prefers-reduced-motion).
   Le bouton « Passer » est toujours disponible. */

(function () {
  'use strict';
  const L = window.LDC, $ = L.$;
  const CFG = L.content('transition'), V = CFG.video || {}, D = CFG.dureesMs || { premiereVisite: 3800, visiteSuivante: 1400, mouvementReduit: 900 };
  const T = L.transition = { active: false };
  let skip = null, timer = 0;

  const videoSrc = () => {
    const d = V.disponible || {}, el = $('#transVideo');
    if (!el || !L.params || L.params.noVideo) return null;
    if (d.webm && el.canPlayType('video/webm')) return { src: V.webm, type: 'video/webm' };
    if (d.mp4 && el.canPlayType('video/mp4')) return { src: V.mp4, type: 'video/mp4' };
    return null;
  };

  const tidy = () => { clearTimeout(timer); const el = $('#trans'); el.classList.remove('play', 'short', 'still'); const v = $('#transVideo'); v.pause(); v.hidden = true; v.removeAttribute('src'); $('#transSvg').style.display = ''; $('#transProg').style.animation = 'none'; };

  /* Joue la séquence ; `before()` est appelé quand l'écran est entièrement recouvert (on y construit le nouvel univers). */
  T.run = (monde, station, before) => new Promise((resolve) => {
    const el = $('#trans'), say = $('#transSay'), cg = $('#transCg');
    T.active = true; tidy();
    const first = !L.state.seenTransition, reduced = L.reduced(), vid = !reduced && first ? videoSrc() : null;
    const ms = reduced ? D.mouvementReduit : first ? D.premiereVisite : D.visiteSuivante;
    cg.src = L.cognitio.imageFor(monde, station);
    say.textContent = L.tpl(((L.content('cognitio-script').lignes || {})['transition.monde'] || ['Entrons dans {univers}.'])[0], { univers: monde.univers });
    el.style.setProperty('--td', (ms / 1000) + 's');
    el.classList.add('on'); el.setAttribute('aria-hidden', 'false');
    let done = false;
    const finish = () => { if (done) return; done = true; clearTimeout(timer); skip = null; if (first && !reduced) { L.state.seenTransition = true; L.persist(); } resolve(); };
    skip = finish;
    setTimeout(() => {
      try { before && before(); } catch (e) { console.error(e); }
      if (vid) {
        const v = $('#transVideo'); v.hidden = false; $('#transSvg').style.display = 'none';
        if (V.disponible.poster) v.poster = V.poster;
        v.src = vid.src; v.onended = finish; v.onerror = () => { v.hidden = true; $('#transSvg').style.display = ''; el.classList.add('play'); timer = setTimeout(finish, ms); };
        v.play().catch(() => v.onerror());
        timer = setTimeout(finish, ((V.dureeMaxSecondes || 6) + 1) * 1000);
      } else {
        el.classList.toggle('still', reduced); el.classList.toggle('short', !first && !reduced); void el.offsetWidth; el.classList.add('play');
        timer = setTimeout(finish, ms);
      }
    }, L.reduced() ? 60 : 480);
  });

  T.hide = () => new Promise((resolve) => {
    const el = $('#trans'); el.classList.remove('on'); el.setAttribute('aria-hidden', 'true');
    setTimeout(() => { tidy(); T.active = false; resolve(); }, L.reduced() ? 20 : 480);
  });
  T.skip = () => { if (skip) skip(); };
  T.init = () => { $('#transSkip').addEventListener('click', T.skip); };
})();
