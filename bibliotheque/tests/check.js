/* Petit cadre de vérification : affiche OK / ÉCHEC et fixe le code de sortie. */
let fails = 0, total = 0;
exports.ok = (label, cond, extra = '') => { total++; console.log((cond ? 'OK   ' : 'ÉCHEC'), label, extra === '' ? '' : '· ' + extra); if (!cond) fails++; };
exports.done = (log) => { if (log) { exports.ok('console sans erreur', log.errors.length === 0, log.errors.slice(0, 3).join(' | ')); exports.ok('aucune requête réseau (hors file:/data:/blob:)', log.network.length === 0, log.network.slice(0, 3).join(' | ')); } console.log(`\n${total - fails}/${total} vérifications réussies`); return fails; };
