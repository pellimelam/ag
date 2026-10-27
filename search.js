
/* =========================================================
   ARGENTINA LOCALITIES — SEARCH ENGINE
   VIDHWAAN VILLAGE BASED GLOBAL TECHNOLOGY COMPANY
========================================================= */

"use strict";

/* ELEMENTS */
const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");
const button = document.getElementById("searchButton");
const results = document.getElementById("results");
const status = document.getElementById("statusArea");
const empty = document.getElementById("emptyState");

/* CONFIGURATION */
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 50;
const DATABASE_URL = "./argentina.json";

/* DATABASE */
let localities = [];
let databaseReady = false;

/* NORMALIZE TEXT — ACCENT-INSENSITIVE SEARCH */
function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .trim();
}

/* ESCAPE HTML */
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

/* LOAD ARGENTINA DATABASE */
async function loadLocalities() {
  try {
    const response = await fetch(DATABASE_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Expected a JSON array.");
    }

    localities = data.filter(item =>
      item &&
      item.locality &&
      item.department &&
      item.province &&
      item.localityCode
    );

    databaseReady = true;

    console.log(
      `Loaded ${localities.length.toLocaleString("es-AR")} localities.`
    );

    return true;
  } catch (error) {
    console.error("Argentina database error:", error);

    status.textContent =
      "No se pudo cargar la base de datos. Inténtelo nuevamente más tarde.";

    return false;
  }
}

/* LOCALITY PAGE FOLDER
   Must match the GitHub Actions page-generation workflow.
   Example: 25-de-mayo-06854100
*/
function folderName(item) {
  const slug = normalizeText(item.locality)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug}-${item.localityCode}`;
}

/* ALL SEARCHABLE FIELDS */
function searchableFields(item) {
  return [
    item.locality,
    item.department,
    item.province,
    item.agglomeration,
    item.localGovernment,
    item.localGovernmentCategory,
    item.localityType,
    item.localityCode,
    item.departmentCode,
    item.jurisdictionCode,
    item.localGovernmentCode,
    item.agglomerationCode
  ]
    .filter(value => value !== undefined && value !== null && value !== "")
    .map(normalizeText);
}

/* SEARCH RELEVANCE */
function scoreLocality(item, query) {
  const locality = normalizeText(item.locality);
  const department = normalizeText(item.department);
  const province = normalizeText(item.province);
  const code = normalizeText(item.localityCode);

  /* Exact locality matches always rank highest. */
  if (locality === query) return 1000;
  if (code === query) return 950;
  if (locality.startsWith(query)) return 850;
  if (locality.includes(query)) return 750;

  if (department === query) return 650;
  if (department.startsWith(query)) return 550;
  if (department.includes(query)) return 450;

  if (province === query) return 400;
  if (province.startsWith(query)) return 350;
  if (province.includes(query)) return 300;

  if (code.startsWith(query)) return 250;

  if (searchableFields(item).some(field => field.includes(query))) {
    return 150;
  }

  return 0;
}

/* HIGHLIGHT MATCHES WITHOUT INSERTING UNSAFE HTML */
function highlightText(value, query) {
  const original = String(value || "");
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return escapeHTML(original);
  }

  /*
   * Map each normalized character back to its original
   * character position so accents are handled correctly.
   */
  let normalized = "";
  const positions = [];

  for (let i = 0; i < original.length;) {
    const character = String.fromCodePoint(
      original.codePointAt(i)
    );

    const normalizedCharacter = normalizeText(character);

    for (let j = 0; j < normalizedCharacter.length; j++) {
      positions.push({
        start: i,
        end: i + character.length
      });
    }

    normalized += normalizedCharacter;
    i += character.length;
  }

  const index = normalized.indexOf(normalizedQuery);

  if (index < 0) {
    return escapeHTML(original);
  }

  const first = positions[index];
  const last = positions[index + normalizedQuery.length - 1];

  if (!first || !last) {
    return escapeHTML(original);
  }

  const start = first.start;
  const end = last.end;

  return (
    escapeHTML(original.slice(0, start)) +
    "<mark>" + escapeHTML(original.slice(start, end)) + "</mark>" +
    escapeHTML(original.slice(end))
  );
}

/* BUILD PROFESSIONAL LOCALITY RESULT */
function createResult(item, query) {
  const folder = folderName(item);

  const localityName = highlightText(item.locality, query);

  const department = escapeHTML(item.department);
  const province = escapeHTML(item.province);
  const localityCode = escapeHTML(item.localityCode);

  const government = item.localGovernment
    ? `
      <div class="resultExtra">
        <span class="resultExtraLabel">Gobierno local</span>
        <span>${escapeHTML(item.localGovernment)}</span>
      </div>
    `
    : "";

  const agglomeration = item.agglomeration
    ? `
      <div class="resultExtra">
        <span class="resultExtraLabel">Aglomeración</span>
        <span>${escapeHTML(item.agglomeration)}</span>
      </div>
    `
    : "";

  const description = `
    Localidad de ${escapeHTML(item.locality)}, departamento
    ${department}, provincia de ${province}, Argentina.
    Explore el portal digital de esta localidad para acceder
    a recursos comunitarios, servicios digitales e información
    útil disponible.
  `.replace(/\s+/g, " ").trim();

  return `
    <article
      class="resultItem fadeIn"
      tabindex="0"
      role="link"
      aria-label="${escapeHTML(item.locality)}, ${department}, ${province}. Abrir portal de la localidad."
      data-url="/${encodeURIComponent(folder)}/"
    >
      <div class="resultEyebrow">
        LOCALIDAD DE ARGENTINA
      </div>

      <h2 class="resultTitle">
        ${localityName}
      </h2>

      <div class="resultMeta">
        <span>${department}</span>
        <span class="resultMetaDot" aria-hidden="true">•</span>
        <span>${province}</span>
        <span class="resultMetaDot" aria-hidden="true">•</span>
        <span>Argentina</span>
      </div>

      <p class="resultDescription">
        ${description}
      </p>

      <div class="resultDetails">
        <div class="resultExtra">
          <span class="resultExtraLabel">Código de localidad</span>
          <span>${localityCode}</span>
        </div>
        ${government}
        ${agglomeration}
      </div>

      <div class="resultAction">
        <span>Explorar localidad</span>
        <span class="resultArrow" aria-hidden="true">→</span>
      </div>
    </article>
  `;
}

/* DISPLAY RESULTS */
function renderResults(found, query) {
  if (!found.length) {
    results.hidden = true;
    results.innerHTML = "";
    empty.hidden = false;

    status.textContent =
      "No se encontraron localidades coincidentes. Pruebe con otro nombre, departamento o provincia.";

    return;
  }

  empty.hidden = true;
  results.hidden = false;

  status.innerHTML =
    `Se encontraron <strong>${found.length}</strong> localidades coincidentes.`;

  results.innerHTML = `
    <div class="resultCount">
      <span>Resultados de búsqueda</span>
      <span>${found.length} resultados</span>
    </div>

    ${found.map(item => createResult(item, query)).join("")}
  `;
}

/* SEARCH LOCALITIES */
function searchLocalities(value) {
  const query = normalizeText(value);

  if (query.length < MIN_QUERY_LENGTH) {
    results.hidden = true;
    results.innerHTML = "";
    empty.hidden = true;

    status.textContent =
      `Ingrese al menos ${MIN_QUERY_LENGTH} caracteres para buscar.`;

    return;
  }

  if (!databaseReady) {
    status.textContent =
      "La base de datos todavía no está disponible.";

    return;
  }

  const found = localities
    .map(item => ({
      item,
      score: scoreLocality(item, query)
    }))
    .filter(result => result.score > 0)
    .sort((a, b) =>
      b.score - a.score ||
      String(a.item.locality).localeCompare(
        String(b.item.locality),
        "es-AR"
      ) ||
      String(a.item.localityCode).localeCompare(
        String(b.item.localityCode),
        "es-AR"
      )
    )
    .slice(0, MAX_RESULTS)
    .map(result => result.item);

  renderResults(found, query);
}

/* OPEN SELECTED RESULT */
function openResult(card) {
  if (!card || !card.dataset.url) return;

  window.location.href = card.dataset.url;
}

results.addEventListener("click", event => {
  const card = event.target.closest(".resultItem");

  if (!card || !results.contains(card)) return;

  openResult(card);
});

/* KEYBOARD ACCESSIBILITY */
results.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const card = event.target.closest(".resultItem");

  if (!card || !results.contains(card)) return;

  event.preventDefault();
  openResult(card);
});

/* FORM SUBMISSION */
form.addEventListener("submit", event => {
  event.preventDefault();
  searchLocalities(input.value);
});

/* SEARCH BUTTON */
button.addEventListener("click", event => {
  event.preventDefault();
  searchLocalities(input.value);
});

/* SUPPORT URL SEARCH: ?q=Buenos+Aires */
function applyURLSearch() {
  const query = new URLSearchParams(
    window.location.search
  ).get("q");

  if (!query) return;

  input.value = query;

  if (databaseReady) {
    searchLocalities(query);
  }
}

/* INITIALIZE */
async function init() {
  results.hidden = true;
  empty.hidden = true;

  button.disabled = true;
  input.disabled = true;

  status.textContent =
    "Cargando la base de datos de Argentina...";

  const loaded = await loadLocalities();

  button.disabled = false;
  input.disabled = false;

  if (loaded) {
    status.innerHTML = `
      Base de datos disponible:
      <strong>${localities.length.toLocaleString("es-AR")}</strong>
      localidades de Argentina.
    `;

    applyURLSearch();
  }

  console.log(
    "%cARGENTINA LOCALITIES",
    "color:#b89545;font-size:18px;font-weight:700;"
  );

  console.log("Vidhwaan Village Based Global Technology Company");
}

init();
