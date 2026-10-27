
"use strict";

/* =========================================================
   VIDHWAAN — ARGENTINA DIGITAL DIRECTORY
   File: app.js
   Brand: VIDHWAAN — Village Based Global Technology Company
   Data source: ./apps.json
   ========================================================= */

(() => {
  const CONFIG = {
    dataUrl: "./apps.json",
    company: "VIDHWAAN",
    tagline: "Village Based Global Technology Company",
    sections: [
      {
        key: "vidhwaan-apps",
        id: "appsSection",
        title: "Aplicaciones de VIDHWAAN",
        subtitle: "Descubra nuestras plataformas y herramientas digitales.",
        gridId: "appsGrid"
      },
      {
        key: "government-portals",
        id: "governmentSection",
        title: "Portales oficiales del Gobierno argentino",
        subtitle:
          "Acceda a portales oficiales y consulte los requisitos directamente con cada organismo.",
        gridId: "governmentGrid"
      },
      {
        key: "emergency-contacts",
        id: "emergencySection",
        title: "Emergencias y teléfonos útiles",
        subtitle:
          "En una emergencia, indique su ubicación exacta. La disponibilidad de algunos servicios depende de su jurisdicción.",
        gridId: "tollGrid"
      },
      {
        key: "vidhwaan-links",
        id: "vidhwaanLinksSection",
        title: "Red global de VIDHWAAN",
        subtitle:
          "Explore nuestras plataformas, servicios tecnológicos e iniciativas digitales.",
        gridId: "vidhwaanLinksGrid"
      },
      {
        key: "videos",
        id: "videosSection",
        title: "Videos",
        subtitle:
          "Conozca nuestras aplicaciones, plataformas y soluciones tecnológicas.",
        gridId: "videosGrid"
      }
    ]
  };

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const byId = id => document.getElementById(id);

  const state = {
    data: [],
    installPrompt: null
  };

  /* =======================================================
     SAFE HELPERS
     ======================================================= */

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function safeURL(value) {
    if (typeof value !== "string" || !value.trim()) {
      return "";
    }

    try {
      const url = new URL(value, window.location.href);

      if (
        url.protocol !== "https:" &&
        url.protocol !== "http:"
      ) {
        return "";
      }

      return url.href;
    } catch {
      return "";
    }
  }

  function safeImageURL(value) {
    if (typeof value !== "string" || !value.trim()) {
      return "";
    }

    try {
      const url = new URL(value, window.location.href);

      if (
        url.protocol !== "https:" &&
        url.protocol !== "http:"
      ) {
        return "";
      }

      return url.href;
    } catch {
      return "";
    }
  }

  function safePhone(value) {
    const phone = String(value || "").replace(/[^\d+]/g, "");

    if (!/^\+?\d{2,20}$/.test(phone)) {
      return "";
    }

    return phone;
  }

  function imageMarkup(item, className = "appIcon") {
    const icon = safeImageURL(item.icon);
    const name = escapeHTML(item.name || item.title || CONFIG.company);

    if (icon) {
      return `
        <img
          class="${className}"
          src="${escapeHTML(icon)}"
          alt="${name}"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        >
      `;
    }

    return `
      <div class="directoryIconFallback" aria-hidden="true">
        ${escapeHTML(item.emoji || "✦")}
      </div>
    `;
  }

  function externalLink(url, label, className = "openCardBtn") {
    const safe = safeURL(url);

    if (!safe) {
      return "";
    }

    return `
      <a
        class="${escapeHTML(className)}"
        href="${escapeHTML(safe)}"
        target="_blank"
        rel="noopener noreferrer"
      >${escapeHTML(label)}</a>
    `;
  }

  /* =======================================================
     CARD RENDERERS
     ======================================================= */

  function renderApp(item) {
    const name = escapeHTML(item.name || "Aplicación");
    const category = escapeHTML(item.category || "VIDHWAAN");
    const description = escapeHTML(item.description || "");
    const badge = item.badge
      ? `<span class="appBadge">${escapeHTML(item.badge)}</span>`
      : "";

    const link = externalLink(item.url, "Abrir plataforma");

    return `
      <article class="appCard directoryCard">
        <div class="appCardGlow" aria-hidden="true"></div>

        <div class="directoryCardIdentity">
          ${imageMarkup(item)}
        </div>

        <div class="appInfo">
          <div class="appTag">${category}</div>
          ${badge}
          <h3>${name}</h3>
          <p>${description}</p>

          <div class="cardButtons">
            ${link || '<span class="linkUnavailable">Enlace no disponible</span>'}
          </div>
        </div>
      </article>
    `;
  }

  function renderGovernment(item) {
    const name = escapeHTML(item.name || "Portal gubernamental");
    const category = escapeHTML(item.category || "Servicio público");
    const description = escapeHTML(item.description || "");
    const badge = item.badge
      ? `<span class="appBadge">${escapeHTML(item.badge)}</span>`
      : "";

    const link = externalLink(item.url, "Visitar sitio oficial");

    return `
      <article class="appCard governmentCard directoryCard">
        <div class="appCardGlow" aria-hidden="true"></div>

        <div class="directoryCardIdentity">
          ${imageMarkup(item, "appIcon governmentIcon")}
        </div>

        <div class="appInfo">
          <div class="appTag">${category}</div>
          ${badge}
          <h3>${name}</h3>
          <p>${description}</p>

          <div class="cardButtons">
            ${link || '<span class="linkUnavailable">Enlace no disponible</span>'}
          </div>
        </div>
      </article>
    `;
  }

  function renderEmergency(item) {
    const title = escapeHTML(item.title || "Contacto de emergencia");
    const number = String(item.number || "");
    const phone = safePhone(number);
    const description = escapeHTML(item.description || "");
    const category = escapeHTML(item.category || "Emergencias");
    const icon = escapeHTML(item.icon || "☎");

    const callAction = phone
      ? `
        <a
          class="launchButton emergencyCallBtn"
          href="tel:${escapeHTML(phone)}"
          aria-label="Llamar al ${escapeHTML(number)}: ${title}"
        >☎ Llamar ${escapeHTML(number)}</a>
      `
      : "";

    return `
      <article class="appCard emergencyCard directoryCard">
        <div class="appCardGlow" aria-hidden="true"></div>

        <div class="appInfo">
          <div class="emergencyIcon" aria-hidden="true">${icon}</div>
          <div class="appTag">${category}</div>
          <h3>${title}</h3>

          <div class="emergencyNumber">
            ${escapeHTML(number)}
          </div>

          <p>${description}</p>

          <div class="cardButtons">
            ${callAction}
          </div>
        </div>
      </article>
    `;
  }

  function renderVidhwaanLink(item) {
    const title = escapeHTML(item.title || "VIDHWAAN");
    const badge = escapeHTML(item.badge || "GLOBAL TECHNOLOGY");
    const time = escapeHTML(item.time || "");
    const description = escapeHTML(item.description || "");
    const link = externalLink(item.url, "Explorar plataforma");

    return `
      <article class="appCard vidhwaanLinkCard directoryCard">
        <div class="appCardGlow" aria-hidden="true"></div>

        <div class="appInfo">
          <div class="appTag">${badge}</div>
          ${time ? `<div class="linkEyebrow">${time}</div>` : ""}
          <h3>${title}</h3>
          <p>${description}</p>

          <div class="cardButtons">
            ${link || '<span class="linkUnavailable">Enlace no disponible</span>'}
          </div>
        </div>
      </article>
    `;
  }

  /* =======================================================
     YOUTUBE VIDEO SUPPORT
     ======================================================= */

  function getVideoDetails(item) {
    const raw = String(item.youtube || item.url || "").trim();

    if (!raw) {
      return null;
    }

    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      const parts = url.pathname.split("/").filter(Boolean);

      const validHost = [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtu.be"
      ].includes(host);

      if (!validHost) {
        return null;
      }

      let videoId = "";
      let isShort = false;

      if (host.includes("youtu.be")) {
        videoId = parts[0] || "";
      } else if (parts[0] === "shorts" && parts[1]) {
        videoId = parts[1];
        isShort = true;
      } else if (parts[0] === "embed" && parts[1]) {
        videoId = parts[1];
      } else if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") || "";
      }

      if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
        return null;
      }

      if (item.orientation === "portrait") isShort = true;
      if (item.orientation === "landscape") isShort = false;

      return {
        id: videoId,
        isShort,
        embed:
          "https://www.youtube-nocookie.com/embed/" +
          encodeURIComponent(videoId) +
          "?autoplay=1&playsinline=1&rel=0",
        thumbnail:
          "https://i.ytimg.com/vi/" +
          encodeURIComponent(videoId) +
          "/hqdefault.jpg"
      };
    } catch {
      return null;
    }
  }

  function renderVideo(item) {
    const video = getVideoDetails(item);

    if (!video) {
      return "";
    }

    const title = escapeHTML(item.title || "Video de VIDHWAAN");
    const description = escapeHTML(item.description || "");
    const orientationClass = video.isShort
      ? "videoCardShort"
      : "videoCardNormal";

    return `
      <article
        class="videoCard ${orientationClass}"
        data-video-id="${escapeHTML(video.id)}"
        data-video-src="${escapeHTML(video.embed)}"
      >
        <div class="videoPlayerWrap">
          <button
            class="videoPoster"
            type="button"
            aria-label="Reproducir ${title}"
          >
            <img
              src="${escapeHTML(video.thumbnail)}"
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

  /* =======================================================
     SECTION SETUP AND ORDER
     ======================================================= */

  function createSection(section) {
    const element = document.createElement("section");
    element.id = section.id;
    element.className =
      "sectionBlock directoryDynamicSection " +
      section.key.replace(/[^a-z0-9-]/gi, "");

    element.innerHTML = `
      <div class="sectionTitleWrap">
        <h2>${escapeHTML(section.title)}</h2>
      </div>
      <p class="sectionDescription">
        ${escapeHTML(section.subtitle)}
      </p>
      <div id="${escapeHTML(section.gridId)}"></div>
    `;

    return element;
  }

  function prepareSections() {
    const appRoot = byId("app") || $("main");

    if (!appRoot) {
      throw new Error("No se encontró el contenedor principal de la aplicación.");
    }

    let footer = byId("footer");

    if (!footer) {
      footer = document.createElement("footer");
      footer.id = "footer";
      footer.innerHTML = `
        <p>${CONFIG.company} — ${CONFIG.tagline}</p>
      `;
      appRoot.appendChild(footer);
    }

    const sections = {};

    for (const config of CONFIG.sections) {
      let element = byId(config.id);

      if (!element) {
        element = createSection(config);
      }

      sections[config.key] = element;
    }

    /*
     * The current template may contain an older notifications
     * section. It is not part of the requested five sections.
     */
    const oldNotifications = byId("notificationsSection");

    if (oldNotifications) {
      oldNotifications.hidden = true;
    }

    /*
     * Reorder the five content sections without replacing the
     * existing hero, Vidhwaan Digital Office, or footer.
     */
    for (const config of CONFIG.sections) {
      const section = sections[config.key];

      if (section.parentElement !== appRoot) {
        appRoot.insertBefore(section, footer);
      } else {
        appRoot.insertBefore(section, footer);
      }
    }

    /*
     * Videos must be the final content section before the footer.
     */
    appRoot.insertBefore(sections.videos, footer);

    return sections;
  }

  /* =======================================================
     DATA VALIDATION AND RENDERING
     ======================================================= */

  function classify(item) {
    if (item.section) {
      return item.section;
    }

    /*
     * Compatibility with older apps.json files.
     */
    if (item.type === "video") return "videos";
    if (item.number !== undefined) return "emergency-contacts";
    if (item.time !== undefined) return "vidhwaan-links";
    if (item.featured !== undefined) return "vidhwaan-apps";

    return "government-portals";
  }

  function renderIntoSections(data, sections) {
    const groups = {
      "vidhwaan-apps": [],
      "government-portals": [],
      "emergency-contacts": [],
      "vidhwaan-links": [],
      "videos": []
    };

    for (const item of data) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const key = classify(item);

      if (groups[key]) {
        groups[key].push(item);
      }
    }

    const renderers = {
      "vidhwaan-apps": renderApp,
      "government-portals": renderGovernment,
      "emergency-contacts": renderEmergency,
      "vidhwaan-links": renderVidhwaanLink,
      "videos": renderVideo
    };

    for (const config of CONFIG.sections) {
      const section = sections[config.key];
      const grid = byId(config.gridId);

      if (!section || !grid) {
        continue;
      }

      const items = groups[config.key] || [];
      const renderer = renderers[config.key];

      grid.innerHTML = items.map(renderer).join("");

      /*
       * Hide sections without content instead of displaying
       * empty cards or blank headings.
       */
      section.hidden = items.length === 0;
    }
  }

  async function loadData() {
    const sections = prepareSections();

    try {
      const response = await fetch(CONFIG.dataUrl, {
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`apps.json respondió con HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("apps.json debe contener un array JSON.");
      }

      state.data = data;
      renderIntoSections(data, sections);

      document.documentElement.classList.add("directoryReady");
    } catch (error) {
      console.error("Error al cargar el directorio de VIDHWAAN:", error);

      for (const config of CONFIG.sections) {
        const grid = byId(config.gridId);

        if (grid) {
          grid.innerHTML = `
            <div class="directoryError" role="status">
              <h3>No se pudo cargar esta sección</h3>
              <p>Compruebe su conexión e inténtelo de nuevo.</p>
              <button class="launchButton" type="button" data-retry-load>
                Reintentar
              </button>
            </div>
          `;
        }
      }
    }
  }

  /* =======================================================
     CLICK HANDLERS
     ======================================================= */

  document.addEventListener("click", event => {
    const retry = event.target.closest("[data-retry-load]");

    if (retry) {
      loadData();
      return;
    }

    const poster = event.target.closest(".videoPoster");

    if (!poster) {
      return;
    }

    const card = poster.closest(".videoCard");
    const playerWrap = card && $(".videoPlayerWrap", card);
    const videoSrc = card && card.dataset.videoSrc;

    if (!playerWrap || !videoSrc) {
      return;
    }

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

  /* =======================================================
     IMAGE FALLBACK
     ======================================================= */

  document.addEventListener("error", event => {
    const image = event.target;

    if (
      !image ||
      image.tagName !== "IMG" ||
      image.classList.contains("videoThumbnail") ||
      image.dataset.fallback
    ) {
      return;
    }

    image.dataset.fallback = "1";
    image.hidden = true;

    const fallback = document.createElement("span");
    fallback.className = "directoryIconFallback";
    fallback.setAttribute("aria-hidden", "true");
    fallback.textContent = "✦";

    image.insertAdjacentElement("afterend", fallback);
  }, true);

  /* =======================================================
     PWA INSTALL EXPERIENCE
     ======================================================= */

  const installBtn = byId("installBtn");

  function isInstalled() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function hideInstallButton() {
    if (installBtn) {
      installBtn.classList.remove("showInstall");
      installBtn.hidden = true;
    }
  }

  if (isInstalled()) {
    hideInstallButton();
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    state.installPrompt = event;

    if (installBtn && !isInstalled()) {
      installBtn.hidden = false;
      installBtn.classList.add("showInstall");
    }
  });

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!state.installPrompt) {
        /*
         * Some browsers do not expose a programmatic install
         * prompt. Do not pretend the installation succeeded.
         */
        return;
      }

      const promptEvent = state.installPrompt;
      state.installPrompt = null;

      try {
        await promptEvent.prompt();

        const choice = await promptEvent.userChoice;

        if (choice && choice.outcome === "accepted") {
          hideInstallButton();
        }
      } catch (error) {
        console.error("No se pudo abrir la instalación PWA:", error);
      }
    });
  }

  window.addEventListener("appinstalled", () => {
    state.installPrompt = null;
    hideInstallButton();
  });

  /* =======================================================
     STARTUP
     ======================================================= */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadData, {
      once: true
    });
  } else {
    loadData();
  }
})();
