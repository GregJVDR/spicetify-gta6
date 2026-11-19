# GTA6 — thème Spicetify

Thème Spotify « Vice City » au style *liquid glass* : panneaux en verre teinté sur une illustration GTA VI, couleurs qui s'adaptent à la pochette en cours, écran de démarrage animé et boutons du lecteur animés.

![Aperçu](captures/preview.png)

> **English** — A "Vice City" liquid-glass theme for Spotify (Spicetify). Glass panels over GTA VI artwork, accent colors follow the current cover art, animated splash screen and player controls. Install it from the Spicetify Marketplace (search "GTA6") or manually (see below). Requires Spicetify, desktop only.

## Fonctionnalités

- **Panneaux en verre** teinté, reflets et bords lumineux, coins arrondis.
- **Couleurs selon la pochette** : l'accent du thème change à chaque morceau.
- **Écran de démarrage** animé pendant le chargement de Spotify.
- **Boutons du lecteur animés** : anneau dégradé autour de lecture/pause pendant la lecture, bulles de verre au survol de précédent/suivant/aléatoire/répéter.
- **Police système Apple** (SF Pro) sur macOS.
- **Performances** : animations uniquement en `transform`/`opacity`, aucun flou en temps réel, animations démarrées après le chargement et mises en pause quand Spotify n'est pas au premier plan. Respecte « Réduire les animations » et « Réduire la transparence » du système.

## Prérequis et avertissements

- **[Spicetify](https://spicetify.app) est obligatoire.** Ce thème ne fonctionne qu'avec l'application Spotify **de bureau** (macOS, Windows, Linux), pas sur le lecteur web ni sur mobile.
- Spicetify **modifie le client Spotify de façon non officielle**. Ce n'est ni soutenu ni approuvé par Spotify : utilisation à vos risques. Une mise à jour de Spotify peut casser le thème jusqu'à sa mise à jour.
- Projet de fans, **non affilié** à Rockstar Games, Take-Two Interactive ou Spotify. « GTA », « Grand Theft Auto », « Rockstar Games » et « Spotify » sont des marques de leurs propriétaires respectifs.
- Les illustrations du fond et de l'écran de chargement appartiennent à **Rockstar Games**. Elles ne sont **pas stockées dans ce dépôt** : le thème les charge depuis le site de Rockstar. Si Rockstar change ces adresses, un dégradé de secours s'affiche à la place.
- Le premier lancement télécharge environ 2,6 Mo d'images (mises ensuite en cache par Spotify).

## Installation

### Depuis le Marketplace Spicetify (recommandé)

1. Installez le [Marketplace Spicetify](https://github.com/spicetify/marketplace) si ce n'est pas déjà fait.
2. Dans Spotify, ouvrez **Marketplace** → onglet **Themes**.
3. Cherchez **GTA6** et cliquez sur **Install**.

### Installation manuelle

```bash
# 1. Cloner le thème dans le dossier des thèmes Spicetify
git clone https://github.com/GregJVDR/spicetify-gta6.git "$(dirname "$(spicetify -c)")/Themes/GTA6"

# 2. Activer le thème, le jeu de couleurs et le JavaScript du thème
spicetify config current_theme GTA6 color_scheme vice inject_theme_js 1 inject_css 1 replace_colors 1

# 3. Appliquer
spicetify apply
```

Sous Windows (PowerShell), remplacez la première commande par :

```powershell
git clone https://github.com/GregJVDR/spicetify-gta6.git "$(Split-Path (spicetify -c))\Themes\GTA6"
```

## Personnalisation

En haut de `user.css`, la section **RÉGLAGES** permet notamment de changer :

- `--verre-teinte` : opacité du verre (dernier chiffre : `0` transparent → `1` opaque) ;
- `--assombrir-fond` : assombrissement de l'image de fond ;
- `--intensite-aurore` : intensité de la teinte de pochette sur le fond.

**Mettre votre propre fond** : remplacez l'adresse de `--fond` (et `--splash` pour l'écran de chargement) sur la troisième ligne de `user.css` par l'URL de votre image.

## Désinstallation

Depuis le Marketplace : bouton **Remove** sur la carte du thème. En manuel :

```bash
spicetify config current_theme "" color_scheme ""
spicetify apply
```

## Licence

Code sous licence [MIT](LICENSE). La licence ne couvre ni les illustrations de Rockstar Games ni les marques citées.
