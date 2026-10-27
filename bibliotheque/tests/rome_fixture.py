#!/usr/bin/env python3
"""Test du moteur ROME 4 sur une COPIE du projet avec un mapping de TEST (jamais livré dans content/).

Usage : python3 tests/rome_fixture.py <produits.xlsx> <rome.xlsx> <dossier_temporaire>
Affiche le chemin de la copie préparée (à passer à LDC_ROOT) ; vérifie aussi que le contrôle d'intégrité refuse
un identifiant ROME inexistant, un libellé différent et un statut VALIDE sans signataire.
"""
import json, os, shutil, subprocess, sys

src = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
prod, rome, tmp = sys.argv[1:4]
dst = os.path.join(tmp, 'copie')
if os.path.exists(dst):
    shutil.rmtree(dst)
shutil.copytree(src, dst, ignore=shutil.ignore_patterns('.git', 'node_modules', '__pycache__'))

FIX = {
    '_meta': {'statut': 'TEST', 'note': 'FIXTURE DE TEST — ne jamais copier dans content/.'},
    'produits': {
        '600013': {'competences': [{'id': 400878, 'libelle': 'Appliquer le cadre juridique des marchés publics', 'importance': 'coeur', 'explication': 'Fixture de test.'}],
                   'momentsDeVie': ['M-TEST'], 'metiers': [], 'statut': 'VALIDE', 'validePar': 'TEST FIXTURE', 'date': '2000-01-01'},
        '521038': {'competences': [{'id': 404763, 'importance': 'coeur'}, {'id': 400878, 'importance': 'support'}],
                   'statut': 'VALIDE', 'validePar': 'TEST FIXTURE', 'date': '2000-01-01'},
        '519004': {'competences': [{'id': 512070, 'importance': 'coeur'}, {'id': 499446, 'importance': 'support'}],
                   'statut': 'VALIDE', 'validePar': 'TEST FIXTURE', 'date': '2000-01-01'},
    },
}
MOM = {'_meta': {'statut': 'TEST'}, 'moments': [{'id': 'M-TEST', 'libelle': 'Moment de test (fixture)', 'description': 'Fixture', 'competences': [400878]}]}

def write(name, obj):
    with open(os.path.join(dst, 'content', name), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

def build():
    return subprocess.run([sys.executable, os.path.join(dst, 'tools', 'build-data.py'), '--produits', prod, '--rome', rome], capture_output=True, text=True)

ok = True
def expect(label, cond, extra=''):
    global ok
    print(('OK   ' if cond else 'ÉCHEC'), label, extra)
    ok &= bool(cond)

# 1. mapping valide
write('mapping-produits-rome.json', FIX); write('moments-de-vie.json', MOM)
r = build(); expect('build accepte le mapping de test', r.returncode == 0, r.stdout.strip().splitlines()[-1] if r.stdout else r.stderr[-200:])

# 2. refus d'un identifiant inexistant
bad = json.loads(json.dumps(FIX)); bad['produits']['600013']['competences'][0]['id'] = 999999999
write('mapping-produits-rome.json', bad); r = build(); expect('build refuse un identifiant ROME inexistant', r.returncode == 1 and 'inexistant' in r.stdout)

# 3. refus d'un libellé différent
bad = json.loads(json.dumps(FIX)); bad['produits']['600013']['competences'][0]['libelle'] = 'Un autre libellé'
write('mapping-produits-rome.json', bad); r = build(); expect('build refuse un libellé ROME différent', r.returncode == 1 and 'libellé différent' in r.stdout)

# 4. refus d'un statut VALIDE sans signataire
bad = json.loads(json.dumps(FIX)); del bad['produits']['600013']['validePar']
write('mapping-produits-rome.json', bad); r = build(); expect('build refuse VALIDE sans validePar', r.returncode == 1 and 'sans' in r.stdout)

# 5. refus d'un code produit inconnu
bad = json.loads(json.dumps(FIX)); bad['produits']['ZZZ'] = bad['produits']['600013']
write('mapping-produits-rome.json', bad); r = build(); expect('build refuse un code produit inconnu', r.returncode == 1 and 'code produit inconnu' in r.stdout)

# 6. on rebâtit avec le bon mapping pour les tests navigateur
write('mapping-produits-rome.json', FIX); r = build(); expect('reconstruction avec le mapping de test', r.returncode == 0)
print('COPIE=' + dst)
sys.exit(0 if ok else 1)
