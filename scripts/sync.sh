#!/bin/zsh
# Recopie la version perso du thème dans ce dépôt et génère un user.css autonome.
# - style.css, color.ini, theme.js : copiés à l'identique depuis la version perso
# - images : référencées par URL (aucune image Rockstar n'est stockée dans ce dépôt)
#     fond / écran de chargement -> hébergés par Rockstar Games
#     logo                       -> hébergé dans ce dépôt (raw GitHub)
set -e
cd "$(dirname "$0")/.."

PERSO="$HOME/.config/spicetify/Themes/GTA6"
DEPOT_RAW="https://raw.githubusercontent.com/GregJVDR/spicetify-gta6/main"

URL_FOND="https://www.rockstargames.com/VI/_next/static/media/Jason_Lucia_Lock_And_Load_landscape.0l9s5w7ih9p~3.jpg"
URL_SPLASH="https://www.rockstargames.com/VI/_next/static/media/Jason_and_Lucia_Beach_landscape.0419q._86ukpt.jpg"
URL_LOGO="$DEPOT_RAW/logo.webp"

for f in style.css color.ini theme.js logo.webp; do
  [[ -f "$PERSO/$f" ]] || { echo "Introuvable : $PERSO/$f" >&2; exit 1; }
done

cp "$PERSO/color.ini" color.ini
cp "$PERSO/theme.js"  theme.js
cp "$PERSO/logo.webp" logo.webp

{
  printf '/* GTA6 — thème Spicetify · https://github.com/GregJVDR/spicetify-gta6\n'
  printf '   Fichier généré par scripts/sync.sh : modifier la version source, pas ce fichier. */\n'
  printf ':root { --fond: url("%s"); --splash: url("%s"); --logo: url("%s"); }\n' \
    "$URL_FOND" "$URL_SPLASH" "$URL_LOGO"
  cat "$PERSO/style.css"
} > user.css.tmp
mv user.css.tmp user.css

echo "Synchronisé depuis $PERSO"
ls -la user.css color.ini theme.js logo.webp
