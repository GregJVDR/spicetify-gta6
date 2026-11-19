(function () {
  const root = document.documentElement;
  const DUREE_MIN = 2500;   /* durée minimale de l'écran de démarrage (ms) */
  const DUREE_MAX = 12000;  /* sécurité : disparaît au plus tard après 12 s */
  const debut = performance.now();
  root.classList.add("gta-chargement");   /* le CSS ne cache Spotify que si ce script tourne */

  /* ===== 1. ÉCRAN DE DÉMARRAGE (affiché immédiatement) ===== */
  let splash = null, barre = null, etape = null;
  function creerSplash() {
    if (splash || !document.body) return;
    splash = document.createElement("div");
    splash.id = "gta-splash";
    splash.innerHTML =
      '<div class="gta-splash-bg"></div>' +
      '<div class="gta-splash-contenu">' +
        '<div class="gta-logo">' +
          '<div class="gta-logo-img"></div>' +
          '<div class="gta-logo-reflet"><div class="gta-logo-bande"></div></div>' +
        '</div>' +
        '<div class="gta-splash-titre">Chargement</div>' +
        '<div class="gta-splash-piste"><div class="gta-splash-barre"></div></div>' +
        '<div class="gta-splash-etape">Démarrage…</div>' +
      '</div>';
    document.body.appendChild(splash);
    barre = splash.querySelector(".gta-splash-barre");
    etape = splash.querySelector(".gta-splash-etape");
  }
  const progres = (p, texte) => {
    if (barre) barre.style.transform = "scaleX(" + p + ")";
    if (etape && texte && etape.textContent !== texte) etape.textContent = texte;
  };
  if (document.body) creerSplash();
  else document.addEventListener("DOMContentLoaded", creerSplash, { once: true });

  /* ===== 2. SUIVI DU VRAI CHARGEMENT ===== */
  let fini = false;
  const suivi = setInterval(() => {
    creerSplash();
    const S = window.Spicetify;
    const ecoule = performance.now() - debut;
    let p = 0.15, texte = "Démarrage…";
    if (S && S.Player) {
      p = 0.4; texte = "Connexion à Spotify…";
      const vue = document.getElementById("main-view");
      if (vue && vue.querySelector("section, [data-testid]")) {
        p = 0.7; texte = "Chargement de l'interface…";
        if (S.colorExtractor && S.Platform) {
          p = 0.9; texte = "Préparation du thème…";
          if (ecoule >= DUREE_MIN) { p = 1; texte = "Prêt"; }
        }
      }
    }
    progres(p, texte);
    if (p === 1 || ecoule >= DUREE_MAX) {
      clearInterval(suivi);
      progres(1, "Prêt");
      setTimeout(terminer, 450);
    }
  }, 150);

  function terminer() {
    if (fini) return;
    fini = true;
    root.classList.add("gta-done");
    if (splash) {
      splash.classList.add("fin");
      setTimeout(() => splash && splash.remove(), 900);
    }
    /* Les animations lourdes démarrent après le fondu */
    setTimeout(demarrerAnimations, 900);
  }

  /* ===== 3. THÈME (préparé derrière l'écran de démarrage) ===== */
  let bg = null;
  function initTheme() {
    const S = window.Spicetify;
    if (!S || !S.Player || !S.Player.addEventListener || !S.colorExtractor || !document.body) {
      setTimeout(initTheme, 300);
      return;
    }
    bg = document.createElement("div");
    bg.id = "gta-bg";
    document.body.prepend(bg);

    /* Couleurs selon la pochette */
    const lum = (hex) => {
      const n = parseInt(String(hex).replace("#", ""), 16);
      return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    };
    let applique = "";   /* morceau dont les couleurs sont affichées */
    let demande = "";    /* dernier morceau demandé */
    async function couleurs() {
      const d = S.Player.data || {};
      const uri = (d.item || d.track || {}).uri;
      if (!uri || uri === applique || uri === demande) return;
      demande = uri;
      try {
        const c = await S.colorExtractor(uri);
        /* Un autre morceau a été lancé pendant l'extraction : on ignore ce résultat */
        if (demande !== uri) return;
        const a1 = [c.VIBRANT, c.LIGHT_VIBRANT, c.PROMINENT].filter(Boolean).find((h) => lum(h) > 0.35) || "#FF4FA3";
        const a2 = [c.LIGHT_VIBRANT, c.PROMINENT, c.DESATURATED].filter(Boolean).find((h) => h !== a1 && lum(h) > 0.35) || "#2EC4D6";
        root.style.setProperty("--accent", a1);
        root.style.setProperty("--accent-2", a2);
        applique = uri;
      } catch (e) {
        console.warn("[GTA6]", e);
      } finally {
        /* En cas d'échec, le morceau pourra être retenté au prochain événement */
        if (demande === uri) demande = "";
      }
    }
    S.Player.addEventListener("songchange", couleurs);
    couleurs();

    /* Musique en cours : active les animations autour des boutons du lecteur */
    const lecture = () => {
      let enCours = false;
      try { enCours = S.Player.isPlaying(); } catch (e) { enCours = !(S.Player.data || {}).isPaused; }
      root.classList.toggle("gta-lecture", !!enCours);
    };
    S.Player.addEventListener("onplaypause", lecture);
    S.Player.addEventListener("songchange", lecture);
    lecture();

    /* Pause quand Spotify n'est pas au premier plan */
    const pause = () => root.classList.toggle("gta-pause", document.hidden || !document.hasFocus());
    document.addEventListener("visibilitychange", pause);
    window.addEventListener("blur", pause);
    window.addEventListener("focus", pause);
    pause();
  }
  initTheme();

  /* Pas de parallaxe : le fond doit rester immobile pour que le verre
     précalculé des panneaux reste aligné, et pour ne rien redessiner. */
  function demarrerAnimations() {
    root.classList.add("gta-ready");
  }
})();
