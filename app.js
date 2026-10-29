
"use strict";

/* =========================================================
   VIDHWAAN — ARGENTINA DIGITAL DIRECTORY
   Directory renderer + PWA installation
   ========================================================= */

(() => {
  const CONFIG = {
    dataUrl: "./apps.json",
    serviceWorkerUrl: "./sw.js",

    sections: [
      {
        key: "vidhwaan-apps",
        id: "appsSection",
        title: "VIDHWAAN Apps",
        description:
          "Explore our applications and digital tools, built to make technology accessible and useful for everyone.",
        grid: "appsGrid"
      },
      {
        key: "government-portals",
        id: "governmentSection",
        title: "Official Government Portals",
        description:
          "Access government portals and public services. Confirm requirements and procedures with each official agency.",
        grid: "governmentGrid"
      },
      {
        key: "emergency-contacts",
        id: "emergencySection",
        title: "Emergency Contacts",
        description:
          "Find emergency and support numbers. Availability may vary by province and municipality.",
        grid: "tollGrid"
      },
      {
        key: "vidhwaan-links",
        id: "vidhwaanLinksSection",
        title: "VIDHWAAN Global Links",
        description:
          "Explore our platforms, technology services, and digital initiatives.",
        grid: "vidhwaanLinksGrid"
      },
      {
        key: "videos",
        id: "videosSection",
        title: "Videos",
        description:
          "Discover our applications, platforms, and technology solutions through videos.",
        grid: "videosGrid"
      }
    ]
  };

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const byId = id =>
    document.getElementById(id);

  const state = {
    installPrompt: null,
    installInProgress: false
  };

  /* =======================================================
     SECURITY AND UTILITY HELPERS
     ======================================================= */

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[ch]);
  }

  function safeURL(value) {
    if (
      typeof value !== "string" ||
      !value.trim()
    ) {
      return "";
    }

    try {
      const url = new URL(
        value,
        window.location.href
      );

      return ["https:", "http:"].includes(url.protocol)
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  function safeImageURL(value) {
    return safeURL(value);
  }

  function safePhone(value) {
    const phone = String(value || "")
      .replace(/[^\d+]/g, "");

    return /^\+?\d{2,20}$/.test(phone)
      ? phone
      : "";
  }

  function imageMarkup(
    item,
    className = "appIcon"
  ) {
    const src = safeImageURL(
      item.icon || item.image
    );

    const label = escapeHTML(
      item.name || item.title || "VIDHWAAN"
    );

    if (src) {
      return `
        <img
          class="${escapeHTML(className)}"
          src="${escapeHTML(src)}"
          alt="${label}"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        >
      `;
    }

    return `
      <div
        class="directoryIconFallback"
        aria-hidden="true"
      >
        ${escapeHTML(item.emoji || "✦")}
      </div>
    `;
  }

  function actionLink(
    url,
    label,
    className = "openCardBtn"
  ) {
    const href = safeURL(url);

    if (!href) return "";

    return `
      <a
        class="${className}"
        href="${escapeHTML(href)}"
        target="_blank"
        rel="noopener noreferrer"
      >${escapeHTML(label)}</a>
    `;
  }

  /* =======================================================
     DIRECTORY CARD RENDERERS
     ======================================================= */

  function cardShell({
    className = "",
    icon = "",
    category = "",
    badge = "",
    title = "",
    description = "",
    url = "",
    button = "Open Website"
  }) {
    const action = actionLink(url, button);

    return `
      <article class="appCard ${className} directoryCard">
        <div
          class="appCardGlow"
          aria-hidden="true"
        ></div>

        ${
          icon
            ? `<div class="directoryCardIdentity">${icon}</div>`
            : ""
        }

        <div class="appInfo">
          ${
            category
              ? `<div class="appTag">${escapeHTML(category)}</div>`
              : ""
          }

          ${
            badge
              ? `<span class="appBadge">${escapeHTML(badge)}</span>`
              : ""
          }

          <h3>${escapeHTML(title)}</h3>

          <p>${escapeHTML(description)}</p>

          <div class="cardButtons">
            ${
              action ||
              '<span class="linkUnavailable">Website link unavailable</span>'
            }
          </div>
        </div>
      </article>
    `;
  }

  function renderApp(item) {
    return cardShell({
      className: "appDirectoryCard",
      icon: imageMarkup(item),
      category: item.category || "VIDHWAAN App",
      badge: item.badge || "",
      title: item.name || item.title || "Application",
      description:
        item.description ||
        "Explore this digital service from VIDHWAAN.",
      url: item.url,
      button: "Open App"
    });
  }

  function renderGovernment(item) {
    return cardShell({
      className: "governmentCard",
      icon: imageMarkup(
        item,
        "appIcon governmentIcon"
      ),
      category:
        item.category || "Government Service",
      badge: item.badge || "Official Portal",
      title:
        item.name || item.title || "Government Portal",
      description:
        item.description ||
        "Visit the official website for current information.",
      url: item.url,
      button: "Visit Official Website"
    });
  }

  function renderEmergency(item) {
    const number = String(item.number || "");
    const phone = safePhone(number);

    const title = escapeHTML(
      item.title || item.name || "Emergency Contact"
    );

    const category = escapeHTML(
      item.category || "Emergency Services"
    );

    const description = escapeHTML(
      item.description ||
      "Check the relevant service for current availability."
    );

    const call = phone
      ? `
        <a
          class="launchButton emergencyCallBtn"
          href="tel:${escapeHTML(phone)}"
          aria-label="Call ${escapeHTML(number)}: ${title}"
        >Call ${escapeHTML(number)}</a>
      `
      : "";

    return `
      <article class="appCard emergencyCard directoryCard">
        <div
          class="appCardGlow"
          aria-hidden="true"
        ></div>

        <div class="appInfo">
          <div
            class="emergencyIcon"
            aria-hidden="true"
          >
            ${escapeHTML(item.icon || "☎")}
          </div>

          <div class="appTag">${category}</div>

          <h3>${title}</h3>

          <div class="emergencyNumber">
            ${escapeHTML(number || "Contact service")}
          </div>

          <p>${description}</p>

          <div class="cardButtons">${call}</div>
        </div>
      </article>
    `;
  }

  function renderVidhwaanLink(item) {
    return cardShell({
      className: "vidhwaanLinkCard",
      category:
        item.badge ||
        item.category ||
        "GLOBAL TECHNOLOGY",
      badge: item.time || "",
      title:
        item.title ||
        item.name ||
        "VIDHWAAN Platform",
      description:
        item.description ||
        "Explore a VIDHWAAN digital platform.",
      url: item.url,
      button: "Explore Platform"
    });
  }

  /* =======================================================
     YOUTUBE VIDEO SUPPORT
     ======================================================= */

  function getVideoDetails(item) {
    const raw = String(
      item.youtube || item.url || ""
    ).trim();

    if (!raw) return null;

    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();

      const allowedHosts = [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtu.be"
      ];

      if (!allowedHosts.includes(host)) {
        return null;
      }

      const parts = url.pathname
        .split("/")
        .filter(Boolean);

      let id = "";
      let isShort = false;

      if (host.includes("youtu.be")) {
        id = parts[0] || "";
      } else if (
        parts[0] === "shorts" &&
        parts[1]
      ) {
        id = parts[1];
        isShort = true;
      } else if (
        parts[0] === "embed" &&
        parts[1]
      ) {
        id = parts[1];
      } else if (url.pathname === "/watch") {
        id = url.searchParams.get("v") || "";
      }

      if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) {
        return null;
      }

      if (item.orientation === "portrait") {
        isShort = true;
      }

      if (item.orientation === "landscape") {
        isShort = false;
      }

      return {
        id,
        isShort,
        embed:
          `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0`,
        thumbnail:
          `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`
      };
    } catch {
      return null;
    }
  }

  function renderVideo(item) {
    const video = getVideoDetails(item);

    if (!video) return "";

    const title = escapeHTML(
      item.title || "VIDHWAAN Video"
    );

    const description = escapeHTML(
      item.description || ""
    );

    return `
      <article
        class="videoCard ${
          video.isShort
            ? "videoCardShort"
            : "videoCardNormal"
        }"
        data-video-src="${escapeHTML(video.embed)}"
      >
        <div class="videoPlayerWrap">
          <button
            class="videoPoster"
            type="button"
            aria-label="Play video: ${title}"
          >
            <img
              src="${escapeHTML(video.thumbnail)}"
              alt=""
              class="videoThumbnail"
              loading="lazy"
              decoding="async"
            >

            <span
              class="videoPlayButton"
              aria-hidden="true"
            >▶</span>
          </button>
        </div>

        <div class="videoContent">
          <h3>${title}</h3>
          ${
            description
              ? `<p>${description}</p>`
              : ""
          }
        </div>
      </article>
    `;
  }

  /* =======================================================
     LOCALITY IDENTIFICATION
     ======================================================= */

  function localityFolder() {
    const meta = $(
      'meta[name="locality-folder"]'
    );

    const value =
      meta &&
      meta.content &&
      !meta.content.includes("{{")
        ? meta.content.trim()
        : "";

    const pathPart = window.location.pathname
      .split("/")
      .filter(Boolean)
      .slice(-2, -1)[0] || "locality";

    return (value || pathPart)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "locality";
  }

  function localityName() {
    const meta = $(
      'meta[name="locality-name"]'
    );

    if (
      meta &&
      meta.content &&
      !meta.content.includes("{{")
    ) {
      return meta.content.trim();
    }

    const heading = $(".heroContent h1");

    if (heading) {
      return heading.textContent
        .split(",")[0]
        .trim();
    }

    return "Locality";
  }

  function insertAfter(reference, element) {
    if (reference && reference.parentNode) {
      reference.parentNode.insertBefore(
        element,
        reference.nextSibling
      );
    }
  }

  /* =======================================================
     DIGITAL OFFICE
     ======================================================= */

  function ensureDigitalOffice(appRoot) {
    let section = appRoot.querySelector(
      ".digitalOfficeSection"
    );

    if (!section) {
      section = document.createElement("section");
      section.className =
        "sectionBlock digitalOfficeSection";
    }

    const name = localityName();
    const email =
      `digitaloffice+${localityFolder()}@vidhwaan.com`;

    section.setAttribute(
      "aria-labelledby",
      "digitalOfficeHeading"
    );

    section.innerHTML = `
      <div class="digitalOfficeCard">
        <div
          class="digitalOfficeGlow"
          aria-hidden="true"
        ></div>

        <div class="digitalOfficeLogoWrap">
          <img
            class="digitalOfficeLogo"
            src="../icons/logo.png"
            alt="VIDHWAAN"
            width="156"
            height="156"
            loading="eager"
            decoding="async"
          >
        </div>

        <div class="digitalOfficeContent">
          <span class="digitalOfficeBadge">
            VIDHWAAN AG DIGITAL OFFICE — ${escapeHTML(name)}
          </span>

          <h2 id="digitalOfficeHeading">
            VIDHWAAN AG Digital Office
          </h2>

          <p class="digitalOfficeDescription">
            Have an idea for a business, website, or application?
            VIDHWAAN builds and deploys digital solutions for
            businesses, entrepreneurs, and communities.
            Contact our team to discuss your requirements.
          </p>

          <div class="digitalOfficeContact">
            <a
              class="digitalOfficeEmail"
              href="mailto:${escapeHTML(email)}"
              aria-label="Email VIDHWAAN AG Digital Office for ${escapeHTML(name)}"
            >${escapeHTML(email)}</a>
          </div>

          <div class="digitalOfficeActions">
            <a
              class="digitalOfficeEmailBtn"
              href="mailto:${escapeHTML(email)}"
              aria-label="Email VIDHWAAN AG Digital Office for ${escapeHTML(name)}"
            >Email Us</a>

            <a
              class="digitalOfficeWhatsappBtn"
              href="https://wa.me/919440246101"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact VIDHWAAN AG Digital Office for ${escapeHTML(name)} on WhatsApp"
            >WhatsApp Us</a>
          </div>
        </div>
      </div>
    `;

    const hero = appRoot.querySelector(".heroSection");

    if (hero) {
      insertAfter(hero, section);
    } else {
      appRoot.insertBefore(
        section,
        appRoot.firstChild
      );
    }

    return section;
  }

  /* =======================================================
     FEATURED APP
     ======================================================= */

  function ensureFeatured(appRoot, officeSection) {
    let section = byId("featuredSection");

    if (!section) {
      section = document.createElement("section");
      section.id = "featuredSection";
      section.className =
        "sectionBlock featuredSection";
    }

    section.innerHTML = `
      <div class="sectionTitleWrap">
        <h2 id="featuredHeading">Featured App</h2>
      </div>

      <p class="sectionDescription">
        Discover our featured digital experience from VIDHWAAN.
      </p>

      <div id="featuredApp"></div>
    `;

    section.hidden = true;

    if (
      officeSection &&
      officeSection.parentNode
    ) {
      insertAfter(officeSection, section);
    } else {
      appRoot.insertBefore(
        section,
        appRoot.firstChild
      );
    }

    return section;
  }

  function renderFeatured(item) {
    if (!item) return "";

    const name =
      item.name || item.title || "Featured App";

    const image = imageMarkup(
      item,
      "featuredImage"
    );

    const url = safeURL(item.url);

    const button = url
      ? `
        <a
          class="launchButton"
          href="${escapeHTML(url)}"
          target="_blank"
          rel="noopener noreferrer"
        >Open Featured App</a>
      `
      : "";

    return `
      <article class="featuredCard">
        <div
          class="featuredGlow"
          aria-hidden="true"
        ></div>

        <div class="featuredImageWrap">
          ${image}
        </div>

        <div class="featuredContent">
          <span class="featuredBadge">
            ${escapeHTML(item.badge || "FEATURED APP")}
          </span>

          <p class="linkEyebrow">
            ${escapeHTML(
              item.category ||
              "VIDHWAAN Digital Platform"
            )}
          </p>

          <h3>${escapeHTML(name)}</h3>

          <p>
            ${escapeHTML(
              item.description ||
              "Explore this digital platform from VIDHWAAN."
            )}
          </p>

          <div class="cardButtons">
            ${button}
          </div>
        </div>
      </article>
    `;
  }

  /* =======================================================
     SECTION SETUP AND ORDER
     ======================================================= */

  function createSection(config) {
    const section = document.createElement("section");

    section.id = config.id;
    section.className =
      "sectionBlock directoryDynamicSection";

    section.innerHTML = `
      <div class="sectionTitleWrap">
        <h2>${escapeHTML(config.title)}</h2>
      </div>

      <p class="sectionDescription">
        ${escapeHTML(config.description)}
      </p>

      <div id="${escapeHTML(config.grid)}"></div>
    `;

    return section;
  }

  function prepareSections() {
    const root =
      byId("app") ||
      $("main") ||
      document.body;

    const office = ensureDigitalOffice(root);
    const featured = ensureFeatured(root, office);

    let footer = byId("footer");

    if (!footer) {
      footer = document.createElement("footer");
      footer.id = "footer";
      footer.innerHTML = `
        <p>VIDHWAAN</p>
        <p>Village Based Global Technology Company</p>
      `;
      root.appendChild(footer);
    }

    const sections = {};

    CONFIG.sections.forEach(config => {
      let section = byId(config.id);

      if (!section) {
        section = createSection(config);
      }

      sections[config.key] = section;
      root.insertBefore(section, footer);
    });

    root.insertBefore(
      featured,
      sections["vidhwaan-apps"]
    );

    root.insertBefore(
      sections["vidhwaan-apps"],
      footer
    );

    root.insertBefore(
      sections["government-portals"],
      footer
    );

    root.insertBefore(
      sections["emergency-contacts"],
      footer
    );

    root.insertBefore(
      sections["vidhwaan-links"],
      footer
    );

    root.insertBefore(
      sections.videos,
      footer
    );

    insertAfter(office, featured);

    const oldNotifications =
      byId("notificationsSection");

    if (oldNotifications) {
      oldNotifications.hidden = true;
    }

    return {
      ...sections,
      featuredSection: featured
    };
  }

  /* =======================================================
     CLASSIFY AND RENDER apps.json
     ======================================================= */

  function classify(item) {
    const section = String(
      item.section || ""
    ).toLowerCase();

    if (section === "government-services") {
      return "government-portals";
    }

    if (section === "notifications") {
      return "ignore";
    }

    const validSections = [
      "vidhwaan-apps",
      "government-portals",
      "emergency-contacts",
      "vidhwaan-links",
      "videos"
    ];

    if (validSections.includes(section)) {
      return section;
    }

    if (
      item.type === "video" ||
      item.youtube
    ) {
      return "videos";
    }

    if (item.number !== undefined) {
      return "emergency-contacts";
    }

    if (item.time !== undefined) {
      return "vidhwaan-links";
    }

    return "government-portals";
  }

  function renderData(data, sections) {
    const groups = Object.fromEntries(
      CONFIG.sections.map(section => [
        section.key,
        []
      ])
    );

    data.forEach(item => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return;
      }

      const key = classify(item);

      if (groups[key]) {
        groups[key].push(item);
      }
    });

    const featuredItem = data.find(item =>
      item &&
      item.featured === true &&
      classify(item) === "vidhwaan-apps"
    ) || null;

    if (featuredItem) {
      groups["vidhwaan-apps"] =
        groups["vidhwaan-apps"].filter(
          item => item !== featuredItem
        );

      byId("featuredApp").innerHTML =
        renderFeatured(featuredItem);

      sections.featuredSection.hidden = false;
    } else {
      sections.featuredSection.hidden = true;
    }

    const renderers = {
      "vidhwaan-apps": renderApp,
      "government-portals": renderGovernment,
      "emergency-contacts": renderEmergency,
      "vidhwaan-links": renderVidhwaanLink,
      "videos": renderVideo
    };

    CONFIG.sections.forEach(config => {
      const section = sections[config.key];
      const grid = byId(config.grid);
      const items = groups[config.key] || [];

      grid.innerHTML = items
        .map(renderers[config.key])
        .filter(Boolean)
        .join("");

      section.hidden = items.length === 0;
    });
  }

  /* =======================================================
     LOAD DIRECTORY DATA
     ======================================================= */

  async function loadData() {
    const sections = prepareSections();

    try {
      const response = await fetch(
        CONFIG.dataUrl,
        {
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          `apps.json returned HTTP ${response.status}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "apps.json must contain a JSON array."
        );
      }

      renderData(data, sections);

      document.documentElement.classList.add(
        "directoryReady"
      );
    } catch (error) {
      console.error(
        "Could not load the VIDHWAAN directory:",
        error
      );

      CONFIG.sections.forEach(config => {
        const grid = byId(config.grid);

        if (grid) {
          grid.innerHTML = `
            <div
              class="directoryError"
              role="status"
            >
              <h3>Unable to load this section</h3>
              <p>Check your connection and try again.</p>
              <button
                class="launchButton"
                type="button"
                data-retry-load
              >Try Again</button>
            </div>
          `;
        }
      });
    }
  }

  /* =======================================================
     VIDEO AND RETRY CLICK HANDLERS
     ======================================================= */

  document.addEventListener("click", event => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest("[data-retry-load]")) {
      loadData();
      return;
    }

    const poster = target.closest(".videoPoster");

    if (!poster) return;

    const card = poster.closest(".videoCard");
    const wrap = card && $(".videoPlayerWrap", card);
    const src = card && card.dataset.videoSrc;

    if (!wrap || !src) return;

    const iframe = document.createElement("iframe");

    iframe.className = "videoPlayer";
    iframe.src = src;
    iframe.title = "VIDHWAAN Video";
    iframe.loading = "lazy";

    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

    iframe.allowFullscreen = true;
    iframe.referrerPolicy =
      "strict-origin-when-cross-origin";

    wrap.replaceChildren(iframe);
  });

  /* =======================================================
     IMAGE FALLBACK
     ======================================================= */

  document.addEventListener(
    "error",
    event => {
      const img = event.target;

      if (
        !img ||
        img.tagName !== "IMG" ||
        img.classList.contains("videoThumbnail") ||
        img.dataset.fallback
      ) {
        return;
      }

      img.dataset.fallback = "1";
      img.hidden = true;

      const fallback = document.createElement("span");

      fallback.className =
        "directoryIconFallback";

      fallback.setAttribute(
        "aria-hidden",
        "true"
      );

      fallback.textContent = "✦";

      img.insertAdjacentElement(
        "afterend",
        fallback
      );
    },
    true
  );

  /* =======================================================
     PWA INSTALL BUTTON
     ======================================================= */

  const installBtn = byId("installBtn");

  function isInstalled() {
    return (
      window.matchMedia(
        "(display-mode: standalone)"
      ).matches ||
      window.matchMedia(
        "(display-mode: fullscreen)"
      ).matches ||
      window.navigator.standalone === true
    );
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(
      window.navigator.userAgent
    ) || (
      navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1
    );
  }

  function isSafari() {
    const ua = navigator.userAgent;

    return (
      /safari/i.test(ua) &&
      !/chrome|chromium|crios|android|edg|opr|fxios/i.test(ua)
    );
  }

  function hideInstallButton() {
    if (!installBtn) return;

    installBtn.hidden = true;

    installBtn.setAttribute(
      "aria-hidden",
      "true"
    );

    installBtn.classList.remove(
      "showInstall"
    );
  }

  function showInstallButton() {
    if (!installBtn || isInstalled()) return;

    installBtn.hidden = false;

    installBtn.removeAttribute(
      "aria-hidden"
    );

    installBtn.classList.add(
      "showInstall"
    );
  }

  function showInstallHelp(message) {
    /*
     * Use a normal dialog rather than a browser alert.
     * This explains manual installation when the browser
     * has not made a native installation prompt available.
     */

    let dialog = byId("pwaInstallHelp");

    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "pwaInstallHelp";
      dialog.className = "pwaInstallHelp";

      dialog.innerHTML = `
        <div class="pwaInstallHelpContent">
          <h2>Install Vidhwaan</h2>
          <p data-install-help-message></p>
          <button
            type="button"
            data-install-help-close
          >Got it</button>
        </div>
      `;

      document.body.appendChild(dialog);

      dialog.addEventListener("click", event => {
        if (
          event.target === dialog ||
          event.target.closest(
            "[data-install-help-close]"
          )
        ) {
          dialog.close();
        }
      });
    }

    const messageElement = $(
      "[data-install-help-message]",
      dialog
    );

    if (messageElement) {
      messageElement.textContent = message;
    }

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      window.alert(message);
    }
  }

  function manualInstallHelp() {
    if (isIOS()) {
      showInstallHelp(
        "To install this portal on your iPhone or iPad, open it in Safari, tap the Share button, and select Add to Home Screen."
      );
      return;
    }

    if (/android/i.test(navigator.userAgent)) {
      showInstallHelp(
        "To install this portal, open your browser menu and look for Install app or Add to Home screen. If the option is unavailable, the browser may not currently consider this portal installable."
      );
      return;
    }

    showInstallHelp(
      "To install this portal, look for the Install option in your browser's address bar or menu. If it is unavailable, check that the portal is using HTTPS, its web app manifest is valid, and its service worker is active."
    );
  }

  /*
   * Show the button for browser users who may install.
   * Hide it when the site is already installed.
   */

  if (isInstalled()) {
    hideInstallButton();
  } else {
    showInstallButton();
  }

  /*
   * Chrome and supported browsers fire this event when
   * they have a native installation prompt available.
   */

  window.addEventListener(
    "beforeinstallprompt",
    event => {
      event.preventDefault();

      state.installPrompt = event;

      showInstallButton();
    }
  );

  if (installBtn) {
    installBtn.addEventListener(
      "click",
      async () => {
        if (state.installInProgress) return;

        if (isInstalled()) {
          hideInstallButton();
          return;
        }

        /*
         * The browser has not supplied a native prompt.
         * Do not pretend that an installation occurred.
         */

        if (!state.installPrompt) {
          manualInstallHelp();
          return;
        }

        const promptEvent = state.installPrompt;

        state.installPrompt = null;
        state.installInProgress = true;
        installBtn.disabled = true;

        try {
          await promptEvent.prompt();

          const choice =
            await promptEvent.userChoice;

          if (
            choice &&
            choice.outcome === "accepted"
          ) {
            hideInstallButton();
          } else {
            showInstallButton();
          }
        } catch (error) {
          console.error(
            "PWA installation prompt failed:",
            error
          );

          showInstallButton();

          manualInstallHelp();
        } finally {
          state.installInProgress = false;

          if (
            installBtn &&
            !isInstalled()
          ) {
            installBtn.disabled = false;
          }
        }
      }
    );
  }

  window.addEventListener(
    "appinstalled",
    () => {
      state.installPrompt = null;
      hideInstallButton();
    }
  );

  /*
   * When the page returns to the foreground, re-check
   * whether the portal is already installed.
   */

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (isInstalled()) {
        hideInstallButton();
      } else {
        showInstallButton();
      }
    }
  );

  /* =======================================================
     SERVICE WORKER REGISTRATION
     ======================================================= */

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.info(
        "Service workers are not supported by this browser."
      );
      return;
    }

    if (window.location.protocol !== "https:" &&
        window.location.hostname !== "localhost") {
      console.warn(
        "Service worker registration requires HTTPS or localhost."
      );
      return;
    }

    try {
      await navigator.serviceWorker.register(
        CONFIG.serviceWorkerUrl,
        {
          scope: "./"
        }
      );

      console.info(
        "VIDHWAAN locality service worker registered."
      );
    } catch (error) {
      console.error(
        "VIDHWAAN service worker registration failed:",
        error
      );
    }
  }

  /* =======================================================
     STARTUP
     ======================================================= */

  function startApp() {
    loadData();
    registerServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      startApp,
      { once: true }
    );
  } else {
    startApp();
  }
})();
