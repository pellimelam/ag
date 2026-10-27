
/* =========================================================
   VIDHWAAN ARGENTINA DIRECTORY
   APP.JS — PRODUCTION VERSION
   Vanilla JavaScript | PWA | Responsive
========================================================= */

"use strict";

/* =========================================================
   DOM ELEMENTS
========================================================= */

const installBtn = document.getElementById("installBtn");
const appsGrid = document.getElementById("appsGrid");
const featuredApp = document.getElementById("featuredApp");
const notificationsFeed = document.getElementById("notificationsFeed");
const governmentGrid = document.getElementById("governmentGrid");
const tollGrid = document.getElementById("tollGrid");
const videosGrid = document.getElementById("videosGrid");

/* =========================================================
   SECURITY AND FORMATTING HELPERS
========================================================= */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function safeURL(value) {
  const input = String(value ?? "").trim();

  if (!input) return "";

  try {
    const url = new URL(input, window.location.href);

    if (!["https:", "http:"].includes(url.protocol)) {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

function safeImageURL(value) {
  const url = safeURL(value);

  if (!url) return "../icons/icon-192.png";

  return url;
}

function safePhone(value) {
  const phone = String(value ?? "").trim();

  if (!/^[+\d\s().-]{3,30}$/.test(phone)) {
    return "";
  }

  return phone.replace(/[^\d+]/g, "");
}

function renderButton(url, text, className = "launchButton") {
  const destination = safeURL(url);

  if (!destination) return "";

  return `
    <div class="cardButtons">
      <a
        class="${className}"
        href="${escapeHTML(destination)}"
        target="_blank"
        rel="noopener noreferrer"
      >${escapeHTML(text)}</a>
    </div>
  `;
}

/* =========================================================
   CARD RENDERERS
========================================================= */

const render = (() => {
  function standardCard(item, buttonText) {
    const name = escapeHTML(item.name || item.title || "Recurso");
    const category = escapeHTML(item.category || "Información");
    const description = escapeHTML(item.description || "");
    const icon = escapeHTML(safeImageURL(item.icon));
    const url = safeURL(item.url);

    return `
      <article class="appCard">
        <div class="appCardGlow"></div>

        <img
          src="${icon}"
          alt="${name}"
          class="appIcon"
          loading="lazy"
          decoding="async"
        >

        <div class="appInfo">
          <div class="appTag">${category}</div>
          <h3>${name}</h3>
          <p>${description}</p>

          ${renderButton(url, buttonText, "openCardBtn")}
        </div>
      </article>
    `;
  }

  return {
    app(item) {
      return standardCard(item, "Abrir aplicación");
    },

    government(item) {
      return standardCard(item, "Abrir sitio oficial");
    },

    toll(item) {
      const title = escapeHTML(item.title || item.name || "Teléfono útil");
      const description = escapeHTML(item.description || "");
      const category = escapeHTML(item.icon || "TELÉFONO");
      const number = safePhone(item.number);

      const callButton = number
        ? `
          <div class="cardButtons">
            <a class="launchButton" href="tel:${escapeHTML(number)}">
              Llamar ${escapeHTML(item.number)}
            </a>
          </div>
        `
        : "";

      return `
        <article class="appCard">
          <div class="appCardGlow"></div>

          <div class="appInfo">
            <div class="appTag">${category}</div>
            <h3>${title}</h3>
            <p>${description}</p>
            ${callButton}
          </div>
        </article>
      `;
    },

    featured(item) {
      const name = escapeHTML(item.name || item.title || "Experiencia destacada");
      const description = escapeHTML(item.description || "");
      const badge = escapeHTML(item.badge || "DESTACADO");
      const icon = escapeHTML(safeImageURL(item.icon));
      const url = safeURL(item.url);

      return `
        <article class="featuredCard">
          <div class="featuredGlow"></div>

          <div class="featuredImageWrap">
            <img
              src="${icon}"
              alt="${name}"
              loading="eager"
              decoding="async"
            >
          </div>

          <div class="featuredContent">
            <div class="featuredBadge">${badge}</div>
            <h3>${name}</h3>
            <p>${description}</p>

            ${renderButton(url, "Descubrir experiencia")}
          </div>
        </article>
      `;
    },

    notification(item) {
      const title = escapeHTML(item.title || "Novedad");
      const description = escapeHTML(item.description || "");
      const badge = escapeHTML(item.badge || "NOVEDAD");
      const time = escapeHTML(item.time || "");
      const url = safeURL(item.url);

      const tag = url
        ? "a"
        : "article";

      const attributes = url
        ? `href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer"`
        : "";

      return `
        <${tag} class="notificationCard" ${attributes}>
          <div class="notificationTop">
            <div class="notificationBadge">${badge}</div>
            <div class="notificationTime">${time}</div>
          </div>

          <h3>${title}</h3>
          <p>${description}</p>
        </${tag}>
      `;
    },

    video(item) {
      const originalURL = String(item.youtube || item.url || "").trim();

      if (!originalURL) return "";

      let parsedURL;

      try {
        parsedURL = new URL(originalURL);
      } catch {
        return "";
      }

      const hostname = parsedURL.hostname.toLowerCase();
      const allowedHosts = [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtu.be"
      ];

      if (!allowedHosts.includes(hostname)) {
        return "";
      }

      let videoID = "";
      let isShort = false;

      if (hostname.includes("youtu.be")) {
        videoID = parsedURL.pathname.split("/").filter(Boolean)[0] || "";
      } else {
        const parts = parsedURL.pathname.split("/").filter(Boolean);

        if (parts[0] === "shorts" && parts[1]) {
          videoID = parts[1];
          isShort = true;
        } else if (parts[0] === "embed" && parts[1]) {
          videoID = parts[1];
        } else if (parsedURL.pathname === "/watch") {
          videoID = parsedURL.searchParams.get("v") || "";
        } else if (parts[0] === "live" && parts[1]) {
          videoID = parts[1];
        }
      }

      videoID = videoID.split("?")[0].split("&")[0].trim();

      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoID)) {
        return "";
      }

      const title = escapeHTML(item.title || "Video de Vidhwaan");
      const description = escapeHTML(item.description || "");
      const safeID = encodeURIComponent(videoID);
      const embedURL =
        `https://www.youtube-nocookie.com/embed/${safeID}` +
        "?autoplay=1&playsinline=1&rel=0";

      const thumbnail =
        `https://i.ytimg.com/vi/${safeID}/hqdefault.jpg`;

      return `
        <article
          class="videoCard ${isShort ? "videoCardShort" : "videoCardNormal"}"
          data-video-src="${escapeHTML(embedURL)}"
        >
          <div class="videoPlayerWrap">
            <button
              class="videoPoster"
              type="button"
              aria-label="Reproducir ${title}"
            >
              <img
                src="${thumbnail}"
                alt=""
                class="videoThumbnail"
                loading="lazy"
                decoding="async"
              >

              <span class="videoPlayButton" aria-hidden="true">▶</span>
            </button>
          </div>

          <div class="videoContent">
            <h3>${title}</h3>
            ${description ? `<p>${description}</p>` : ""}
          </div>
        </article>
      `;
    }
  };
})();

/* =========================================================
   LOAD LOCALITY DATA
   Each generated locality has its own apps.json.
========================================================= */

async function loadData() {
  try {
    const response = await fetch("./apps.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`apps.json returned HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("apps.json must contain a JSON array.");
    }

    let featuredHTML = "";
    let appsHTML = "";
    let governmentHTML = "";
    let tollHTML = "";
    let notificationsHTML = "";
    let videosHTML = "";

    for (const item of data) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        continue;
      }

      /* VIDEOS */
      if (item.type === "video") {
        videosHTML += render.video(item);
        continue;
      }

      /* NOTIFICATIONS */
      if (item.time !== undefined) {
        notificationsHTML += render.notification(item);
        continue;
      }

      /* EMERGENCY AND IMPORTANT NUMBERS */
      if (item.number !== undefined) {
        tollHTML += render.toll(item);
        continue;
      }

      /* APPLICATIONS */
      if (item.featured !== undefined) {
        appsHTML += render.app(item);

        if (item.featured === true) {
          featuredHTML = render.featured(item);
        }

        continue;
      }

      /* GOVERNMENT AND OTHER SERVICES */
      governmentHTML += render.government(item);
    }

    if (featuredApp) {
      featuredApp.innerHTML = featuredHTML;
    }

    if (appsGrid) {
      appsGrid.innerHTML = appsHTML;
    }

    if (governmentGrid) {
      governmentGrid.innerHTML = governmentHTML;
    }

    if (tollGrid) {
      tollGrid.innerHTML = tollHTML;
    }

    if (notificationsFeed) {
      notificationsFeed.innerHTML = notificationsHTML;
    }

    if (videosGrid) {
      videosGrid.innerHTML = videosHTML;
    }

    /* Hide section headings if no cards were returned. */
    toggleEmptySection("featuredSection", featuredHTML);
    toggleEmptySection("appsSection", appsHTML);
    toggleEmptySection("governmentSection", governmentHTML);
    toggleEmptySection("emergencySection", tollHTML);
    toggleEmptySection("notificationsSection", notificationsHTML);
    toggleEmptySection("videosSection", videosHTML);
  } catch (error) {
    console.error("Vidhwaan Argentina data loading failed:", error);

    const containers = [
      appsGrid,
      governmentGrid,
      tollGrid,
      notificationsFeed,
      videosGrid
    ];

    for (const container of containers) {
      if (container) {
        container.innerHTML = `
          <p class="errorMessage">
            No se pudo cargar la información. Inténtelo de nuevo más tarde.
          </p>
        `;
      }
    }
  }
}

function toggleEmptySection(sectionID, content) {
  const section = document.getElementById(sectionID);

  if (!section) return;

  section.hidden = !content.trim();
}

/* =========================================================
   YOUTUBE PLAYER
   Load the iframe only after a visitor presses Play.
========================================================= */

document.addEventListener("click", event => {
  const poster = event.target.closest(".videoPoster");

  if (!poster) return;

  const card = poster.closest(".videoCard");
  const playerWrap = card?.querySelector(".videoPlayerWrap");
  const videoSrc = card?.dataset.videoSrc;

  if (!playerWrap || !videoSrc) return;

  let url;

  try {
    url = new URL(videoSrc);
  } catch {
    return;
  }

  if (url.hostname !== "www.youtube-nocookie.com") {
    return;
  }

  const iframe = document.createElement("iframe");

  iframe.className = "videoPlayer";
  iframe.src = url.href;
  iframe.title = "Video de Vidhwaan en YouTube";
  iframe.loading = "lazy";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";

  playerWrap.replaceChildren(iframe);
});

/* =========================================================
   GLOBAL URL AND PHONE HANDLING
========================================================= */

document.addEventListener("click", event => {
  const target = event.target;

  if (!(target instanceof Element)) return;

  const element = target.closest("[data-url], [data-phone]");

  if (!element) return;

  /* Links and buttons with their own native action should work normally. */
  if (target.closest("a, button")) return;

  const url = safeURL(element.dataset.url);

  if (url) {
    window.location.assign(url);
    return;
  }

  const phone = safePhone(element.dataset.phone);

  if (phone) {
    window.location.href = `tel:${phone}`;
  }
});

/* =========================================================
   PWA INSTALLATION
========================================================= */

let deferredInstallPrompt = null;

function isPWAInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function hideInstallButton() {
  if (installBtn) {
    installBtn.classList.remove("showInstall");
  }
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;

  if (installBtn && !isPWAInstalled()) {
    installBtn.classList.add("showInstall");
  }
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;

    try {
      await promptEvent.prompt();

      const result = await promptEvent.userChoice;

      if (result?.outcome === "accepted") {
        hideInstallButton();
      }
    } catch (error) {
      console.error("PWA installation failed:", error);
    }
  });
}

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  hideInstallButton();
});

if (isPWAInstalled()) {
  hideInstallButton();
}

/* =========================================================
   IMAGE FALLBACK
========================================================= */

document.addEventListener("error", event => {
  const image = event.target;

  if (
    !(image instanceof HTMLImageElement) ||
    image.dataset.fallback ||
    image.classList.contains("videoThumbnail")
  ) {
    return;
  }

  image.dataset.fallback = "1";
  image.src = "../icons/icon-192.png";
}, true);

/* =========================================================
   KEYBOARD ACCESSIBILITY
========================================================= */

document.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const target = event.target;

  if (!(target instanceof Element)) return;

  const element = target.closest("[data-url], [data-phone]");

  if (!element || target.closest("button, a")) return;

  event.preventDefault();

  const url = safeURL(element.dataset.url);

  if (url) {
    window.location.assign(url);
    return;
  }

  const phone = safePhone(element.dataset.phone);

  if (phone) {
    window.location.href = `tel:${phone}`;
  }
});

/* =========================================================
   SERVICE WORKER
========================================================= */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.error("Service worker registration failed:", error);
    });
  }, { once: true });
}

/* =========================================================
   START APPLICATION
========================================================= */

loadData();
