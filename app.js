
/* =====================================================
   VIDHWAAN ARGENTINA DIRECTORY
   APP.JS — PRODUCTION VERSION
===================================================== */

"use strict";

/* =====================================================
   ELEMENTS
===================================================== */

const installBtn = document.getElementById("installBtn");
const appsGrid = document.getElementById("appsGrid");
const featuredApp = document.getElementById("featuredApp");
const notificationsFeed = document.getElementById("notificationsFeed");
const governmentGrid = document.getElementById("governmentGrid");
const tollGrid = document.getElementById("tollGrid");
const videosGrid = document.getElementById("videosGrid");

/* =====================================================
   HELPERS
===================================================== */

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const safeURL = value => {
  try {
    const url = new URL(String(value || ""), window.location.href);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch (_) {}
  return "";
};

const safeImage = value => {
  const url = safeURL(value);
  return url || "../icons/icon-192.png";
};

const text = value => escapeHTML(value);

const openExternal = url => {
  const safe = safeURL(url);
  if (safe) window.location.assign(safe);
};

const makeButton = (url, label, className = "openCardBtn") => {
  const safe = safeURL(url);
  if (!safe) return "";
  return `
    <div class="cardButtons">
      <button class="${className}" type="button" data-url="${escapeHTML(safe)}">
        ${text(label)}
      </button>
    </div>`;
};

/* =====================================================
   CARD RENDERERS
===================================================== */

const render = (() => {
  const card = (item, buttonLabel) => {
    const name = item.name || item.title || item.appName || "Servicio digital";
    const description = item.description || item.summary || item.details || "";
    const category = item.category || item.type || "Servicio digital";
    const url = safeURL(item.url || item.link || item.href || item.appUrl || item.website);
    const icon = safeImage(item.icon || item.image || item.logo);

    return `
      <article class="appCard">
        <div class="appCardGlow"></div>
        <img
          src="${escapeHTML(icon)}"
          alt="${text(name)}"
          class="appIcon"
          loading="lazy"
          decoding="async"
        >
        <div class="appInfo">
          <div class="appTag">${text(category)}</div>
          <h3>${text(name)}</h3>
          <p>${text(description)}</p>
          ${url ? makeButton(url, buttonLabel) : ""}
        </div>
      </article>`;
  };

  return {
    app(item) {
      return card(item, "Abrir aplicación");
    },

    government(item) {
      return card(item, "Abrir sitio oficial");
    },

    emergency(item) {
      const title = item.title || item.name || "Contacto de emergencia";
      const number = String(item.number || "").trim();
      const description = item.description || "";
      const icon = item.icon || "🆘";
      const phoneNumber = number.replace(/[^\d+]/g, "");

      return `
        <article class="appCard emergencyCard">
          <div class="appCardGlow"></div>
          <div class="appInfo">
            <div class="appTag">${text(icon)} · EMERGENCIAS Y AYUDA</div>
            <h3>${text(title)}</h3>
            <p class="emergencyNumber">${text(number)}</p>
            <p>${text(description)}</p>
            ${
              phoneNumber
                ? `<div class="cardButtons">
                    <a class="launchButton emergencyCallButton"
                       href="tel:${escapeHTML(phoneNumber)}"
                       aria-label="Llamar al ${text(number)}">
                      Llamar ${text(number)}
                    </a>
                  </div>`
                : ""
            }
          </div>
        </article>`;
    },

    featured(item) {
      const name = item.name || item.title || "VIDHWAAN";
      const description = item.description || "";
      const url = safeURL(item.url || item.link || item.href);
      const icon = safeImage(item.icon || item.image || item.logo);

      return `
        <article class="featuredCard">
          <div class="featuredGlow"></div>
          <div class="featuredImageWrap">
            <img src="${escapeHTML(icon)}" alt="${text(name)}"
                 loading="eager" decoding="async">
          </div>
          <div class="featuredContent">
            <div class="featuredBadge">${text(item.badge || "DESTACADO")}</div>
            <h3>${text(name)}</h3>
            <p>${text(description)}</p>
            ${url ? makeButton(url, "Descubrir", "launchButton") : ""}
          </div>
        </article>`;
    },

    notification(item) {
      const url = safeURL(item.url || item.link || "");
      return `
        <article class="notificationCard" ${url ? `data-url="${escapeHTML(url)}" tabindex="0" role="link"` : ""}>
          <div class="notificationGlow"></div>
          <div class="notificationTop">
            <div class="notificationBadge">${text(item.badge || "NOVEDAD")}</div>
            <div class="notificationTime">${text(item.time || "")}</div>
          </div>
          <h3>${text(item.title || item.name || "Información")}</h3>
          <p>${text(item.description || "")}</p>
        </article>`;
    },

    video(item) {
      const rawURL = String(item.youtube || item.url || "").trim();
      let videoId = "";
      let isShort = false;

      try {
        const url = new URL(rawURL);
        const host = url.hostname.toLowerCase();
        const parts = url.pathname.split("/").filter(Boolean);

        if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) {
          if (parts[0] === "shorts" && parts[1]) {
            videoId = parts[1];
            isShort = true;
          } else if (parts[0] === "embed" && parts[1]) {
            videoId = parts[1];
          } else if (url.pathname === "/watch") {
            videoId = url.searchParams.get("v") || "";
          }
        } else if (["youtu.be", "www.youtu.be"].includes(host)) {
          videoId = parts[0] || "";
        }
      } catch (_) {
        return "";
      }

      if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) return "";

      const thumbnail =
        `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;

      const embedURL =
        `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1&rel=0`;

      return `
        <article class="videoCard ${isShort ? "videoCardShort" : "videoCardNormal"}"
                 data-video-src="${escapeHTML(embedURL)}">
          <div class="videoPlayerWrap">
            <button class="videoPoster" type="button"
                    aria-label="Reproducir ${text(item.title || "video")}">
              <img src="${thumbnail}" alt="" class="videoThumbnail"
                   loading="lazy" decoding="async">
              <span class="videoPlayButton" aria-hidden="true">▶</span>
            </button>
          </div>
          <div class="videoContent">
            ${item.title ? `<h3>${text(item.title)}</h3>` : ""}
            ${item.description ? `<p>${text(item.description)}</p>` : ""}
          </div>
        </article>`;
    }
  };
})();

/* =====================================================
   DATA CLASSIFICATION
===================================================== */

function classifyItem(item) {
  if (!item || typeof item !== "object") return "ignore";

  if (item.type === "video" || item.youtube) return "video";
  if (item.number !== undefined) return "emergency";

  const category = String(item.category || "").toLowerCase();
  const id = String(item.id || "").toLowerCase();

  if (
    category.includes("government") ||
    category.includes("gobierno") ||
    category.includes("identity services") ||
    category.includes("taxes and revenue") ||
    category.includes("social security") ||
    category.includes("health services") ||
    category.includes("consumer protection") ||
    category.includes("transport services") ||
    category.includes("education services") ||
    id.includes("argentina-gov") ||
    id.includes("mi-argentina") ||
    id.includes("renaper") ||
    id === "arca" ||
    id === "anses"
  ) return "government";

  if (item.time !== undefined && item.title && item.description) {
    return "notification";
  }

  if (
    item.featured !== undefined ||
    category.includes("vidhwaan apps") ||
    category.includes("ai services") ||
    category.includes("business services") ||
    category.includes("productivity") ||
    category.includes("inspiration") ||
    category.includes("science & learning") ||
    category.includes("education") ||
    category.includes("useful tools") ||
    category.includes("sports") ||
    category.includes("time")
  ) return "app";

  if (item.url || item.link || item.href || item.website) return "app";

  return "ignore";
}

/* =====================================================
   LOAD LOCALITY DATA
===================================================== */

async function loadData() {
  try {
    const response = await fetch("./apps.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`No se pudo cargar apps.json: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("apps.json debe contener una lista JSON.");
    }

    let featuredHTML = "";
    let appsHTML = "";
    let governmentHTML = "";
    let emergencyHTML = "";
    let notificationsHTML = "";
    let videosHTML = "";

    for (const item of data) {
      const type = classifyItem(item);

      switch (type) {
        case "video":
          videosHTML += render.video(item);
          break;

        case "emergency":
          emergencyHTML += render.emergency(item);
          break;

        case "government":
          governmentHTML += render.government(item);
          break;

        case "notification":
          notificationsHTML += render.notification(item);
          break;

        case "app":
          appsHTML += render.app(item);

          if (item.featured === true && !featuredHTML) {
            featuredHTML = render.featured(item);
          }
          break;
      }
    }

    if (featuredApp) {
      featuredApp.innerHTML = featuredHTML;
      const section = document.getElementById("featuredSection");
      if (section) section.hidden = !featuredHTML;
    }

    if (appsGrid) appsGrid.innerHTML = appsHTML;
    if (governmentGrid) governmentGrid.innerHTML = governmentHTML;
    if (tollGrid) tollGrid.innerHTML = emergencyHTML;
    if (notificationsFeed) notificationsFeed.innerHTML = notificationsHTML;
    if (videosGrid) videosGrid.innerHTML = videosHTML;

    toggleEmptySection("appsSection", appsHTML);
    toggleEmptySection("governmentSection", governmentHTML);
    toggleEmptySection("emergencySection", emergencyHTML);
    toggleEmptySection("notificationsSection", notificationsHTML);
    toggleEmptySection("videosSection", videosHTML);

  } catch (error) {
    console.error("Error al cargar los datos del directorio:", error);

    const targets = [appsGrid, governmentGrid, tollGrid];
    targets.forEach(target => {
      if (target) {
        target.innerHTML =
          '<p role="status">No se pudo cargar la información. Inténtelo de nuevo más tarde.</p>';
      }
    });
  }
}

function toggleEmptySection(id, content) {
  const section = document.getElementById(id);
  if (section) section.hidden = !content;
}

/* =====================================================
   PWA INSTALL
===================================================== */

let deferredPrompt = null;

function isPWAInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;

  if (installBtn && !isPWAInstalled()) {
    installBtn.classList.add("showInstall");
  }
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    const promptEvent = deferredPrompt;
    deferredPrompt = null;

    try {
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;

      if (result.outcome === "accepted") {
        installBtn.classList.remove("showInstall");
      }
    } catch (error) {
      console.error("Error al instalar la aplicación:", error);
    }
  });
}

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  if (installBtn) installBtn.classList.remove("showInstall");
});

/* =====================================================
   IMAGE FALLBACK
===================================================== */

document.addEventListener("error", event => {
  const image = event.target;

  if (
    image &&
    image.tagName === "IMG" &&
    !image.classList.contains("videoThumbnail") &&
    !image.dataset.fallback
  ) {
    image.dataset.fallback = "1";
    image.src = "../icons/icon-192.png";
  }
}, true);

/* =====================================================
   VIDEO PLAYER
===================================================== */

document.addEventListener("click", event => {
  const poster = event.target.closest(".videoPoster");
  if (!poster) return;

  const card = poster.closest(".videoCard");
  const playerWrap = card?.querySelector(".videoPlayerWrap");
  const videoSrc = card?.dataset.videoSrc;

  if (!playerWrap || !videoSrc) return;

  const iframe = document.createElement("iframe");
  iframe.className = "videoPlayer";
  iframe.src = videoSrc;
  iframe.title = "Video de VIDHWAAN";
  iframe.loading = "lazy";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";

  playerWrap.replaceChildren(iframe);
});

/* =====================================================
   URL NAVIGATION AND PHONE CALLS
===================================================== */

document.addEventListener("click", event => {
  const button = event.target.closest("[data-url]");
  if (!button) return;

  // Let native links and buttons work normally when they contain a link.
  const url = safeURL(button.dataset.url);
  if (url) openExternal(url);
});

document.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const element = event.target.closest?.("[data-url]");
  if (!element || event.target.tagName === "BUTTON") return;

  event.preventDefault();
  const url = safeURL(element.dataset.url);
  if (url) openExternal(url);
});

/* =====================================================
   SERVICE WORKER
===================================================== */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch(error => console.error("Error al registrar el service worker:", error));
  }, { once: true });
}

/* =====================================================
   START
===================================================== */

loadData();
