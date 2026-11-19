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
  function terminer() {
    if (fini) return;
    fini = true;
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

  /* Pas de parallaxe : le fond doit rester immobile pour que le verre
     précalculé des panneaux reste aligné, et pour ne rien redessiner. */
  function demarrerAnimations() {
    root.classList.add("gta-ready");
  }
})();
