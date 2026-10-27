#!/usr/bin/env bash
# Lance toute la batterie de tests. Prérequis : Node + Playwright (Chromium), Python 3 + openpyxl.
# Variables : LDC_PRODUITS et LDC_ROME (chemins des deux xlsx), OUT (dossier des captures, défaut /tmp/ldc-tests).
set -u
cd "$(dirname "$0")/.."
OUT="${OUT:-/tmp/ldc-tests}"; mkdir -p "$OUT"
fail=0
run() { echo; echo "=== $1"; shift; "$@" || fail=1; }

run "Données : contrôle d'intégrité et mapping ROME de test" python3 tests/rome_fixture.py "${LDC_PRODUITS:?}" "${LDC_ROME:?}" "$OUT/fixture"
run "Moteur ROME 4 (copie avec mapping de test)" env LDC_ROOT="$OUT/fixture/copie" node tests/rome-match.js
run "Parcours principal (file://, Grande salle, Code civil, portes, univers, fiche, sélection)" node tests/e2e-core.js "$OUT/core"
run "Pitch guidé" node tests/e2e-pitch.js "$OUT/pitch"
run "Mouvement réduit, Passer, version courte, sans WebGL" node tests/e2e-modes.js "$OUT/modes"
run "Mobile" node tests/e2e-mobile.js "$OUT/mobile"
echo; [ $fail -eq 0 ] && echo "TOUS LES TESTS PASSENT" || echo "DES TESTS ÉCHOUENT"
exit $fail
