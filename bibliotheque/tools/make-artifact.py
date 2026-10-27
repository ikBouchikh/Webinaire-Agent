#!/usr/bin/env python3
"""Prépare la page de la version publiée en ligne (fragment HTML + liste de fichiers).

Le dossier reste la livraison de référence (double-clic sur index.html). Cette variante n'existe que pour la
relecture dans un navigateur sans accès au dossier : polices incorporées (data:), bouton d'impression retiré
(l'impression est indisponible dans ce cadre). Le code applicatif est identique.

Usage : python3 tools/make-artifact.py <dossier_de_sortie>   → <sortie>/page.html et <sortie>/files.json
"""
import base64, glob, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1]
os.makedirs(out, exist_ok=True)

html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
css = open(os.path.join(ROOT, 'style.css'), encoding='utf-8').read()

def font_uri(m):
    path = os.path.join(ROOT, m.group(1))
    return 'url(data:font/woff2;base64,' + base64.b64encode(open(path, 'rb').read()).decode() + ')'
css = re.sub(r'url\((assets/fonts/[^)]+\.woff2)\)', font_uri, css)

title = re.search(r'<title>(.*?)</title>', html, re.S).group(1)
title = title.split('·')[0].strip()          # nom stable de la page
body = html[html.index('<body>') + 6: html.index('</body>')]
scripts = re.findall(r'<script src="([^"]+)"></script>', body)
body = re.sub(r'<script src="[^"]+"></script>\s*', '', body)
body = body.replace('<a class="skip" href="#dock">Aller à la carte du lieu</a>\n', '')

page = f'<title>{title}</title>\n<style>\n{css}\n</style>\n{body}\n<script>window.LDC_ENV={{artifact:true}};</script>\n' + '\n'.join(f'<script src="{s}"></script>' for s in scripts) + '\n'
open(os.path.join(out, 'page.html'), 'w', encoding='utf-8').write(page)

files = list(scripts) + sorted(os.path.relpath(p, ROOT) for p in glob.glob(os.path.join(ROOT, 'assets', 'cognitio', '*.webp')))
json.dump(files, open(os.path.join(out, 'files.json'), 'w'), indent=1)
print('page.html', os.path.getsize(os.path.join(out, 'page.html')) // 1024, 'Ko ;', len(files), 'fichiers')
for f in files:
    print(' ', f)
