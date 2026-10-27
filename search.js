
"use strict";

/* =========================================================
   VIDHWAAN — ARGENTINA LOCALITIES SEARCH PORTAL
   Locality search + Cookies Policy popup
========================================================= */

(() => {
  const DATA_URL = "/argentina.json";
  const MAX_RESULTS = 50;
  const MIN_QUERY_LENGTH = 2;

  const $ = (id) => document.getElementById(id);

  const form = $("searchForm");
  const input = $("searchInput");
  const searchButton = $("searchButton");
  const statusArea = $("statusArea");
  const resultsContainer = $("results");
  const emptyState = $("emptyState");

  let localityData = [];
  let loadingPromise = null;
  let previousActiveElement = null;

  /* =======================================================
     GENERAL UTILITIES
  ======================================================= */

  function setStatus(message) {
    if (statusArea) statusArea.textContent = message;
  }

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("en")
      .trim();
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function getField(item, keys) {
    for (const key of keys) {
      const value = item?.[key];

      if (value !== undefined && value !== null && value !== "") {
        if (typeof value === "string" || typeof value === "number") {
          return String(value);
        }
      }
    }

    return "";
  }

  function getLocality(item) {
    return getField(item, [
      "locality",
      "locality_name",
      "localityName",
      "name",
      "nombre",
      "localidad",
      "city",
      "town",
      "settlement"
    ]);
  }

  function getProvince(item) {
    return getField(item, [
      "province",
      "province_name",
      "provinceName",
      "provincia",
      "state"
    ]);
  }

  function getDepartment(item) {
    return getField(item, [
      "department",
      "department_name",
      "departmentName",
      "departamento",
      "district"
    ]);
  }

  function getAgglomeration(item) {
    return getField(item, [
      "agglomeration",
      "agglomeration_name",
      "aglomeracion",
      "urban_area"
    ]);
  }

  function getCode(item) {
    return getField(item, [
      "code",
      "locality_code",
      "localityCode",
      "id",
      "codigo",
      "census_code"
    ]);
  }

  function getDescription(item) {
    return getField(item, [
      "description",
      "descripcion",
      "summary"
    ]);
  }

  function getSearchableText(item) {
    return normalize([
      getLocality(item),
      getProvince(item),
      getDepartment(item),
      getAgglomeration(item),
      getCode(item),
      getDescription(item)
    ].join(" "));
  }

  function hideResults() {
    if (resultsContainer) {
      resultsContainer.hidden = true;
      resultsContainer.replaceChildren();
    }

    if (emptyState) emptyState.hidden = true;
  }

  /* =======================================================
     DATA LOADING
  ======================================================= */

  function extractRecords(payload) {
    if (Array.isArray(payload)) return payload;

    if (payload && typeof payload === "object") {
      for (const key of [
        "localities",
        "localitiesData",
        "localidades",
        "villages",
        "results",
        "data",
        "items"
      ]) {
        if (Array.isArray(payload[key])) return payload[key];
      }
    }

    throw new Error(
      "The locality dataset has an unsupported structure."
    );
  }

  async function loadLocalities() {
    if (localityData.length) return localityData;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      setStatus("Loading the Argentina locality directory...");

      if (searchButton) searchButton.disabled = true;

      try {
        const response = await fetch(DATA_URL, {
          cache: "no-store",
          headers: { Accept: "application/json" }
        });

        if (!response.ok) {
          throw new Error(
            `Could not load the locality dataset (${response.status}).`
          );
        }

        const payload = await response.json();
        localityData = extractRecords(payload).filter(
          (item) => item && typeof item === "object"
        );

        setStatus(
          `Directory ready. ${localityData.length.toLocaleString()} records loaded.`
        );

        return localityData;
      } catch (error) {
        console.error("Locality directory loading failed:", error);

        setStatus(
          "The locality directory could not be loaded. Please refresh and try again."
        );

        throw error;
      } finally {
        if (searchButton) searchButton.disabled = false;
        loadingPromise = null;
      }
    })();

    return loadingPromise;
  }

  /* =======================================================
     RESULT LINKS
     Only accept safe same-site paths or HTTPS URLs.
  ======================================================= */

  function getResultURL(item) {
    const suppliedURL = getField(item, [
      "url",
      "href",
      "page",
      "path",
      "locality_url"
    ]);

    if (!suppliedURL) return "";

    try {
      const parsed = new URL(suppliedURL, window.location.origin);

      if (
        parsed.protocol !== "https:" &&
        parsed.origin !== window.location.origin
      ) {
        return "";
      }

      if (parsed.protocol !== "https:" &&
          parsed.protocol !== "http:") {
        return "";
      }

      if (
        parsed.origin !== window.location.origin &&
        parsed.protocol !== "https:"
      ) {
        return "";
      }

      return parsed.href;
    } catch {
      return "";
    }
  }

  /* =======================================================
     RESULT RENDERING
  ======================================================= */

  function createResult(item) {
    const locality = getLocality(item) || "Unnamed locality";
    const province = getProvince(item);
    const department = getDepartment(item);
    const agglomeration = getAgglomeration(item);
    const code = getCode(item);
    const description = getDescription(item);
    const url = getResultURL(item);

    const card = document.createElement(url ? "a" : "article");
    card.className = "resultItem fadeIn";

    if (url) {
      card.href = url;
      card.setAttribute("aria-label", `Open locality: ${locality}`);
    }

    const title = document.createElement("div");
    title.className = "resultTitle";
    title.textContent = locality;
    card.appendChild(title);

    const metaParts = [];

    if (province) metaParts.push(["Province", province]);
    if (department) metaParts.push(["Department", department]);
    if (agglomeration) metaParts.push(["Agglomeration", agglomeration]);
    if (code) metaParts.push(["Code", code]);

    if (metaParts.length) {
      const meta = document.createElement("div");
      meta.className = "resultMeta";

      metaParts.forEach(([label, value], index) => {
        if (index) meta.appendChild(document.createTextNode(" · "));

        const strong = document.createElement("strong");
        strong.textContent = `${label}: `;
        meta.appendChild(strong);
        meta.appendChild(document.createTextNode(value));
      });

      card.appendChild(meta);
    }

    if (description) {
      const descriptionElement = document.createElement("p");
      descriptionElement.className = "resultDescription";
      descriptionElement.textContent = description;
      card.appendChild(descriptionElement);
    }

    return card;
  }

  function renderResults(items, query) {
    if (!resultsContainer) return;

    resultsContainer.replaceChildren();

    if (!items.length) {
      resultsContainer.hidden = true;

      if (emptyState) emptyState.hidden = false;

      setStatus(`No matching localities found for "${query}".`);
      return;
    }

    if (emptyState) emptyState.hidden = true;

    const count = document.createElement("p");
    count.className = "resultCount";
    count.textContent =
      `${items.length} matching ${items.length === 1 ? "locality" : "localities"}` +
      (items.length === MAX_RESULTS ? " (showing the first 50)" : "");

    resultsContainer.appendChild(count);

    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
      fragment.appendChild(createResult(item));
    });

    resultsContainer.appendChild(fragment);
    resultsContainer.hidden = false;

    setStatus(
      `Found ${items.length} matching ${items.length === 1 ? "locality" : "localities"}.`
    );
  }

  /* =======================================================
     SEARCH
  ======================================================= */

  async function performSearch() {
    const query = input?.value.trim() ?? "";
    const normalizedQuery = normalize(query);

    hideResults();

    if (query.length < MIN_QUERY_LENGTH) {
      setStatus(`Enter at least ${MIN_QUERY_LENGTH} characters to search.`);
      input?.focus();
      return;
    }

    try {
      const records = await loadLocalities();

      setStatus("Searching the locality directory...");

      const matches = [];

      for (const item of records) {
        if (getSearchableText(item).includes(normalizedQuery)) {
          matches.push(item);

          if (matches.length >= MAX_RESULTS) break;
        }
      }

      renderResults(matches, query);
    } catch {
      setStatus(
        "We could not complete your search. Please refresh the page and try again."
      );
    }
  }

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      performSearch();
    });
  }

  /* =======================================================
     COOKIES POLICY POPUP
  ======================================================= */

  const policyModal = $("cookiePolicyModal");
  const policyDialog = policyModal?.querySelector(".policyDialog");
  const openPolicyButton = $("openCookiePolicy");
  const closePolicyButton = $("closeCookiePolicy");
  const closePolicyFooterButton = $("closeCookiePolicyFooter");

  let policyWasOpen = false;

  function openCookiePolicy() {
    if (!policyModal || !policyDialog) return;

    previousActiveElement = document.activeElement;
    policyWasOpen = true;

    policyModal.hidden = false;
    document.body.classList.add("policyOpen");

    closePolicyButton?.focus();
  }

  function closeCookiePolicy() {
    if (!policyModal || policyModal.hidden) return;

    policyModal.hidden = true;
    document.body.classList.remove("policyOpen");

    if (
      previousActiveElement &&
      typeof previousActiveElement.focus === "function"
    ) {
      previousActiveElement.focus();
    } else {
      openPolicyButton?.focus();
    }

    policyWasOpen = false;
  }

  openPolicyButton?.addEventListener("click", openCookiePolicy);
  closePolicyButton?.addEventListener("click", closeCookiePolicy);
  closePolicyFooterButton?.addEventListener("click", closeCookiePolicy);

  policyModal?.addEventListener("click", (event) => {
    const target = event.target;

    if (
      target instanceof Element &&
      target.closest('[data-close-policy="true"]')
    ) {
      closeCookiePolicy();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!policyModal || policyModal.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeCookiePolicy();
      return;
    }

    /* Keep keyboard focus inside the open dialog. */
    if (event.key === "Tab" && policyWasOpen) {
      const focusable = Array.from(
        policyDialog.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), ' +
          '[tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.getClientRects().length > 0);

      if (!focusable.length) {
        event.preventDefault();
        policyDialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* =======================================================
     STARTUP
  ======================================================= */

  async function initialize() {
    try {
      await loadLocalities();

      /* Support direct search links using ?q=... */
      const params = new URLSearchParams(window.location.search);
      const initialQuery = params.get("q");

      if (initialQuery && input) {
        input.value = initialQuery.slice(0, 100);

        if (input.value.trim().length >= MIN_QUERY_LENGTH) {
          await performSearch();
        }
      }
    } catch {
      /* loadLocalities already displays the failure message. */
    }
  }

  initialize();
})();
