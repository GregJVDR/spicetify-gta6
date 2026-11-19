# Installation (ou mise à jour) du thème GTA6 pour Spicetify — Windows (PowerShell).
# Installe le thème DANS Spotify via Spicetify : l'écran de chargement est alors
# instantané (contrairement au Marketplace, qui télécharge le CSS après le démarrage).
#
#   iwr -useb https://gregjvdr.github.io/spicetify-gta6/install.ps1 | iex
$ErrorActionPreference = "Stop"

$Depot = "https://github.com/GregJVDR/spicetify-gta6.git"
$Nom   = "GTA6"

if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) { Write-Host "Spicetify n'est pas installé : https://spicetify.app"; return }
if (-not (Get-Command git -ErrorAction SilentlyContinue))       { Write-Host "git est requis pour installer le thème."; return }

$Themes = Join-Path (Split-Path (spicetify -c)) "Themes"
$Dest   = Join-Path $Themes $Nom
New-Item -ItemType Directory -Force -Path $Themes | Out-Null

if (Test-Path (Join-Path $Dest ".git")) {
  Write-Host "Mise à jour du thème dans $Dest"
  git -C $Dest pull --ff-only
} elseif (Test-Path $Dest) {
  Write-Host "Un dossier $Dest existe déjà et n'est pas une installation de ce thème."
  Write-Host "Renommez-le ou supprimez-le, puis relancez ce script."
  return
} else {
  Write-Host "Installation du thème dans $Dest"
  git clone --depth 1 $Depot $Dest
}

spicetify config current_theme $Nom color_scheme vice inject_theme_js 1 inject_css 1 replace_colors 1
spicetify apply
Write-Host "Thème GTA6 installé."
