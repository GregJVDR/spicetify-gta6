(function () {
  const root = document.documentElement;
  /* Temps mesurés depuis le LANCEMENT de Spotify (performance.now() part de 0
     à l'ouverture de la page), pas depuis l'arrivée de ce script : avec le
     Marketplace, le JS arrive plusieurs secondes après le CSS. */
  const DUREE_MIN = 5000;   /* durée minimale de l'écran de démarrage (ms) */
  const DUREE_MAX = 10000;  /* fin forcée (le CSS termine seul à 10,5 s sans JS) */

  /* ===== TEXTES DE L'ÉCRAN DE CHARGEMENT, dans la langue de Spotify =====
     Langue lue dans Spicetify.Locale dès qu'il est disponible, sinon dans
     <html lang> ou celle du système. Repli : anglais. */
  const TEXTES = {
    en: ["Loading", "Starting…", "Connecting to Spotify…", "Loading interface…", "Preparing theme…", "Ready"],
    fr: ["Chargement", "Démarrage…", "Connexion à Spotify…", "Chargement de l'interface…", "Préparation du thème…", "Prêt"],
    es: ["Cargando", "Iniciando…", "Conectando con Spotify…", "Cargando la interfaz…", "Preparando el tema…", "Listo"],
    de: ["Wird geladen", "Wird gestartet…", "Verbindung zu Spotify…", "Oberfläche wird geladen…", "Theme wird vorbereitet…", "Bereit"],
    it: ["Caricamento", "Avvio…", "Connessione a Spotify…", "Caricamento dell'interfaccia…", "Preparazione del tema…", "Pronto"],
    pt: ["Carregando", "Iniciando…", "Conectando ao Spotify…", "Carregando a interface…", "Preparando o tema…", "Pronto"],
    nl: ["Laden", "Opstarten…", "Verbinden met Spotify…", "Interface laden…", "Thema voorbereiden…", "Klaar"],
    pl: ["Ładowanie", "Uruchamianie…", "Łączenie ze Spotify…", "Ładowanie interfejsu…", "Przygotowywanie motywu…", "Gotowe"],
    sv: ["Laddar", "Startar…", "Ansluter till Spotify…", "Laddar gränssnittet…", "Förbereder temat…", "Klart"],
    tr: ["Yükleniyor", "Başlatılıyor…", "Spotify'a bağlanılıyor…", "Arayüz yükleniyor…", "Tema hazırlanıyor…", "Hazır"],
    ru: ["Загрузка", "Запуск…", "Подключение к Spotify…", "Загрузка интерфейса…", "Подготовка темы…", "Готово"],
    ja: ["読み込み中", "起動中…", "Spotifyに接続中…", "インターフェースを読み込み中…", "テーマを準備中…", "完了"],
    ko: ["로딩 중", "시작하는 중…", "Spotify에 연결하는 중…", "인터페이스를 불러오는 중…", "테마를 준비하는 중…", "준비 완료"],
    zh: ["加载中", "正在启动…", "正在连接 Spotify…", "正在加载界面…", "正在准备主题…", "就绪"],
    "zh-tw": ["載入中", "正在啟動…", "正在連線至 Spotify…", "正在載入介面…", "正在準備主題…", "就緒"],
  };
  let localeSpotify = false;   /* vrai dès que la langue vient de Spicetify.Locale */
  function langue() {
    let l = "";
    try {
      const S = window.Spicetify;
      if (S && S.Locale && typeof S.Locale.getLocale === "function") {
        l = S.Locale.getLocale() || "";
        if (l) localeSpotify = true;
      }
    } catch (e) { /* Spicetify pas encore prêt */ }
    l = String(l || document.documentElement.lang || navigator.language || "en").toLowerCase();
    if (l.startsWith("zh")) return /tw|hk|hant/.test(l) ? "zh-tw" : "zh";
    const code = l.split(/[-_]/)[0];
    return TEXTES[code] ? code : "en";
  }
  let T = TEXTES[langue()];
  /* Index des textes */
  const TITRE = 0, DEMARRAGE = 1, CONNEXION = 2, INTERFACE = 3, THEME = 4, PRET = 5;

  /* ===== 1. ÉCRAN DE DÉMARRAGE =====
     L'image, le halo et le logo sont déjà affichés par le CSS dès la première
     image. Ce script ajoute par-dessus le reflet du logo et la progression. */
  let splash = null, barre = null, etape = null;
  let fini = false;
  function creerSplash() {
    if (splash || fini || !document.body) return;
    splash = document.createElement("div");
    splash.id = "gta-splash";
    splash.innerHTML =
      '<div class="gta-logo-reflet"><div class="gta-logo-bande"></div></div>' +
      '<div class="gta-splash-contenu">' +
        '<div class="gta-splash-titre">' + T[TITRE] + '</div>' +
        '<div class="gta-splash-piste"><div class="gta-splash-barre"></div></div>' +
        '<div class="gta-splash-etape">' + T[DEMARRAGE] + '</div>' +
      '</div>';
    document.body.appendChild(splash);
    barre = splash.querySelector(".gta-splash-barre");
    etape = splash.querySelector(".gta-splash-etape");
  }
  const progres = (p, texte) => {
    if (barre) barre.style.transform = "scaleX(" + p + ")";
    if (etape && texte && etape.textContent !== texte) etape.textContent = texte;
  };

  /* ===== 2. SUIVI DU VRAI CHARGEMENT ===== */
  /* ===== PASSAGE DU « VI » (fin du chargement) =====
     Un grand VI semi-transparent traverse l'écran de gauche à droite pendant
     que l'écran de chargement s'efface : traînée de copies estompées + traits
     de vitesse. Dessiné en SVG (net à toute taille), animé en transform /
     opacity uniquement, supprimé dès la fin (~1,3 s). */
  const VI_SVG =
    '<svg viewBox="-40 -40 1060 880" aria-hidden="true">' +
      '<defs>' +
        '<linearGradient id="gta-vi-degrade" x1="0" y1="0" x2="0.25" y2="1">' +
          '<stop offset="0" stop-color="#3b10e0"/>' +
          '<stop offset="0.35" stop-color="#a63fe8"/>' +
          '<stop offset="0.6" stop-color="#ff3fb8"/>' +
          '<stop offset="0.85" stop-color="#ff8a50"/>' +
          '<stop offset="1" stop-color="#9df5c0"/>' +
        '</linearGradient>' +
        '<g id="gta-vi-forme">' +
          '<polygon points="0,0 300,0 440,470 560,0 690,0 440,800"/>' +
          '<rect x="720" y="0" width="260" height="800"/>' +
        '</g>' +
      '</defs>' +
      '<use href="#gta-vi-forme" fill="#2b0b3d" stroke="#2b0b3d" stroke-width="56" stroke-linejoin="round"/>' +
      '<use href="#gta-vi-forme" fill="url(#gta-vi-degrade)" stroke="#fff6dc" stroke-width="14" stroke-linejoin="round"/>' +
    '</svg>';
  function passageVI() {
    if (!document.body) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const d = document.createElement("div");
    d.id = "gta-vi";
    /* Traits de vitesse : hauteur, longueur, retard, couleur variés */
    const traits = [
      [14, 38, 0.00, "255,255,255"], [21, 55, 0.10, "255,79,163"],
      [29, 30, 0.04, "255,255,255"], [36, 62, 0.16, "46,196,214"],
      [43, 45, 0.02, "255,255,255"], [52, 70, 0.12, "255,79,163"],
      [60, 42, 0.06, "255,255,255"], [67, 50, 0.18, "255,138,61"],
      [75, 34, 0.03, "255,255,255"], [83, 58, 0.14, "46,196,214"],
      [90, 36, 0.08, "255,255,255"],
    ].map(([y, w, t, c]) =>
      `<span style="--y:${y}%;--w:${w}vw;--t:${t}s;--c:${c}"></span>`).join("");
    d.innerHTML =
      '<div class="gta-vi-traits">' + traits + '</div>' +
      '<div class="gta-vi-bloc">' +
        '<div class="gta-vi-fantome" style="--n:3"><svg viewBox="-40 -40 1060 880"><use href="#gta-vi-forme" fill="url(#gta-vi-degrade)"/></svg></div>' +
        '<div class="gta-vi-fantome" style="--n:2"><svg viewBox="-40 -40 1060 880"><use href="#gta-vi-forme" fill="url(#gta-vi-degrade)"/></svg></div>' +
        '<div class="gta-vi-fantome" style="--n:1"><svg viewBox="-40 -40 1060 880"><use href="#gta-vi-forme" fill="url(#gta-vi-degrade)"/></svg></div>' +
        '<div class="gta-vi-lettres">' + VI_SVG + '</div>' +
      '</div>';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1600);
  }

  function terminer() {
    if (fini) return;
    fini = true;
    passageVI();                             /* le VI traverse pendant le fondu */
    root.classList.add("gta-done");          /* fondu des calques CSS + de Spotify */
    if (splash) splash.classList.add("fin");
    setTimeout(() => {
      if (splash) splash.remove();
      root.classList.add("gta-fini");        /* calques CSS supprimés */
      demarrerAnimations();                  /* animations lourdes après le fondu */
    }, 900);
  }

  /* Le logo et l'image de chargement peuvent venir d'Internet (installation
     Marketplace) : on attend qu'ils soient téléchargés avant de terminer,
     pour ne jamais finir sur un écran sans logo ni image (3 s maximum). */
  const debutScript = performance.now();
  const MIN_APRES_SCRIPT = 2500;   /* l'écran reste visible au moins 2,5 s après l'arrivée du script */
  let imagesPretes = false;
  (function precharger() {
    const cs = getComputedStyle(root);
    const urls = ["--splash", "--logo"]
      .map((v) => (cs.getPropertyValue(v).match(/url\(\s*["']?([^"')]+)["']?\s*\)/) || [])[1])
      .filter(Boolean);
    if (!urls.length) { imagesPretes = true; return; }
    let reste = urls.length;
    const une = () => { if (--reste <= 0) imagesPretes = true; };
    urls.forEach((u) => { const img = new Image(); img.onload = img.onerror = une; img.src = u; });
    setTimeout(() => { imagesPretes = true; }, 3000);
  })();

  if (performance.now() >= DUREE_MAX) {
    /* Script arrivé trop tard : l'écran CSS est déjà terminé, on ne le relance pas */
    fini = true;
    root.classList.add("gta-done", "gta-fini");
    setTimeout(demarrerAnimations, 0);
  } else {
    if (document.body) creerSplash();
    else document.addEventListener("DOMContentLoaded", creerSplash, { once: true });

    const suivi = setInterval(() => {
      creerSplash();
      /* Tant que Spicetify.Locale n'a pas répondu, on revérifie la langue */
      if (!localeSpotify) {
        const T2 = TEXTES[langue()];
        if (T2 !== T) {
          T = T2;
          const titre = splash && splash.querySelector(".gta-splash-titre");
          if (titre) titre.textContent = T[TITRE];
        }
      }
      const S = window.Spicetify;
      const ecoule = performance.now();
      let p = 0.15, texte = T[DEMARRAGE];
      if (S && S.Player) {
        p = 0.4; texte = T[CONNEXION];
        const vue = document.getElementById("main-view");
        if (vue && vue.querySelector("section, [data-testid]")) {
          p = 0.7; texte = T[INTERFACE];
          if (S.colorExtractor && S.Platform) {
            p = 0.9; texte = T[THEME];
            if (ecoule >= DUREE_MIN && imagesPretes &&
                ecoule - debutScript >= MIN_APRES_SCRIPT) { p = 1; texte = T[PRET]; }
          }
        }
      }
      progres(p, texte);
      if (p === 1 || ecoule >= DUREE_MAX) {
        clearInterval(suivi);
        progres(1, T[PRET]);
        setTimeout(terminer, 350);
      }
    }, 150);
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

  /* ===== 4. PANNEAU DE DROITE : GLISSEMENT À L'OUVERTURE / FERMETURE =====
     Spotify ne fait que basculer une classe (.Root__right-sidebar-expanded) :
     le panneau apparaît / disparaît d'un coup. Ici, technique « FLIP » : on
     laisse Spotify changer la mise en page, puis, avant l'affichage de l'image,
     on replace le panneau à son ancienne position et on l'anime jusqu'à la
     nouvelle, en transform / opacity uniquement (calculé par le GPU).
       ouverture : le panneau sort de la languette repliée et glisse en place
       fermeture : le panneau garde sa largeur et glisse hors de l'écran,
                   pendant que la languette de verre apparaît */
  const EASE_ENTREE = "cubic-bezier(0.25, 0.8, 0.25, 1)";   /* arrive vite, se pose en douceur */
  const EASE_SORTIE = "cubic-bezier(0.4, 0, 0.6, 1)";       /* démarre et finit en douceur */
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
  function panneauDroit() {
    const peek = document.querySelector(".Root__right-sidebar-peek");
    const contenu = peek && peek.querySelector(":scope .Root__right-sidebar-peekContent");
    if (!contenu) { setTimeout(panneauDroit, 500); return; }
    let ouvert = peek.classList.contains("Root__right-sidebar-expanded");
    let anim = null;
    let fin = null;
    /* Bord droit du panneau ouvert, mémorisé : une fois replié, on ne peut
       plus le mesurer (l'enveloppe ne fait plus que 40 px). */
    let bordOuvert = 0;
    const memoriser = () => { if (ouvert && !anim) bordOuvert = peek.getBoundingClientRect().right; };
    memoriser();
    window.addEventListener("resize", memoriser, { passive: true });

    const nettoyer = () => {
      if (anim) { anim.cancel(); anim = null; }
      if (fin) { fin(); fin = null; }
    };

    const obs = new MutationObserver(() => {
      const maintenant = peek.classList.contains("Root__right-sidebar-expanded");
      if (maintenant === ouvert) return;
      ouvert = maintenant;
      nettoyer();
      if (ouvert) memoriser();
      if (reduit.matches || document.hidden) return;
      let voileAnim = null;

      if (ouvert) {
        /* Départ : bord gauche du panneau à l'endroit de la languette (40 px) */
        const r = contenu.getBoundingClientRect();
        const dx = Math.max(0, bordOuvert - 40 - r.left);
        anim = contenu.animate(
          [{ transform: `translateX(${dx}px)` }, { transform: "none" }],
          { duration: 450, easing: EASE_ENTREE });
      } else {
        if (!bordOuvert) return;
        /* Le contenu garde sa largeur d'origine le temps de sortir. On neutralise
           le décalage que Spotify lui applique une fois replié pour mesurer sa
           vraie position, puis on le replace pile sur l'ancien panneau. */
        const largeur = (contenu.firstElementChild || contenu).offsetWidth;
        peek.setAttribute("data-gta-sortie", "");   /* attribut : React réécrit la classe */
        contenu.style.width = largeur + "px";
        contenu.style.transform = "none";
        const depart = bordOuvert - contenu.getBoundingClientRect().right;
        const voile = peek.querySelector(":scope .Root__right-sidebar-overlayWrapper > :last-child");
        anim = contenu.animate(
          [{ transform: `translateX(${depart}px)`, opacity: 1 },
           { transform: `translateX(${depart + largeur}px)`, opacity: 0.2 }],
          { duration: 400, easing: EASE_SORTIE, fill: "forwards" });
        voileAnim = voile && voile.animate(
          [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }],
          { duration: 400, easing: "ease-out" });
        fin = () => {
          if (voileAnim) voileAnim.cancel();
          contenu.style.width = "";
          contenu.style.transform = "";
          peek.removeAttribute("data-gta-sortie");
        };
      }
      /* Spotify bloque le fil principal ~150-250 ms juste après le changement
         (nouveau rendu) : lancée tout de suite, l'animation serait déjà à
         moitié finie à la première image affichée. On la fige sur sa position
         de départ et on ne la lance qu'à l'image suivante. */
      const a = anim;
      const voileA = voileAnim;
      a.pause(); if (voileA) voileA.pause();
      requestAnimationFrame(() => {
        if (anim !== a) return;
        a.play(); if (voileA) voileA.play();
      });
      a.finished.then(() => {
        if (anim !== a) return;
        anim = null;
        a.cancel();               /* rend la main au CSS (fill: forwards sinon figé) */
        if (fin) { fin(); fin = null; }
      }, () => {});
    });
    obs.observe(peek, { attributes: true, attributeFilter: ["class"] });
    /* Si Spotify recrée le panneau (mode cinéma…), on se rebranche dessus */
    const veille = setInterval(() => {
      if (peek.isConnected) return;
      clearInterval(veille); obs.disconnect(); nettoyer();
      panneauDroit();
    }, 2000);
  }
  panneauDroit();

  /* Pas de parallaxe : le fond doit rester immobile pour que le verre
     précalculé des panneaux reste aligné, et pour ne rien redessiner. */
  function demarrerAnimations() {
    root.classList.add("gta-ready");
  }
})();
