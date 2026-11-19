#!/bin/sh
# Installation (ou mise à jour) du thème GTA6 pour Spicetify — macOS / Linux.
# Installe le thème DANS Spotify via Spicetify : l'écran de chargement est alors
# instantané (contrairement au Marketplace, qui télécharge le CSS après le démarrage).
#
#   curl -fsSL https://gregjvdr.github.io/spicetify-gta6/install.sh | sh
set -e

DEPOT="https://github.com/GregJVDR/spicetify-gta6.git"
NOM="GTA6"

command -v spicetify >/dev/null 2>&1 || { echo "Spicetify n'est pas installé : https://spicetify.app"; exit 1; }
command -v git >/dev/null 2>&1       || { echo "git est requis pour installer le thème."; exit 1; }

THEMES="$(dirname "$(spicetify -c)")/Themes"
DEST="$THEMES/$NOM"
mkdir -p "$THEMES"

if [ -d "$DEST/.git" ]; then
  echo "Mise à jour du thème dans $DEST"
  git -C "$DEST" pull --ff-only
elif [ -e "$DEST" ]; then
  echo "Un dossier $DEST existe déjà et n'est pas une installation de ce thème."
  echo "Renommez-le ou supprimez-le, puis relancez ce script."
  exit 1
else
  echo "Installation du thème dans $DEST"
  git clone --depth 1 "$DEPOT" "$DEST"
fi

spicetify config current_theme "$NOM" color_scheme vice inject_theme_js 1 inject_css 1 replace_colors 1
spicetify apply
echo "Thème GTA6 installé."
