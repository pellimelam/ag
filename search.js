
/* =========================================================
   ARGENTINA LOCALITIES — SEARCH.JS
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

/* DATA */
let localities = [];

/* NORMALIZE SEARCH TEXT */
function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
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
    const response = await fetch("./argentina.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("The JSON root must be an array.");
    }

    localities = data.filter(item =>
      item &&
      item.province &&
      item.department &&
      item.locality &&
      item.localityCode
    );

    console.log(
      `Loaded ${localities.length} Argentina localities.`
    );

    return true;
  } catch (error) {
    console.error("Unable to load Argentina JSON:", error);

    status.textContent =
      "No se pudo cargar la base de datos de localidades de Argentina. Inténtelo nuevamente más tarde.";

    return false;
  }
}

/* SLUGIFY
   Must match the slugify function used by the generation workflow.
*/
function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* LOCALITY PAGE FOLDER
   Format: locality-slug-locality-code
*/
function folderName(item) {
  return `${slugify(item.locality)}-${slugify(item.localityCode)}`;
}

/* SEARCHABLE FIELDS */
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
    .filter(value => value !== null && value !== undefined && value !== "")
    .map(normalizeText);
}

/* RELEVANCE SCORE */
function scoreLocality(item, query) {
  const locality = normalizeText(item.locality);
  const department = normalizeText(item.department);
  const province = normalizeText(item.province);
  const code = normalizeText(item.localityCode);

  if (locality === query) return 1000;
  if (code === query) return 950;

  if (locality.startsWith(query)) return 850;
  if (locality.includes(query)) return 700;

  if (department === query) return 600;
  if (department.startsWith(query)) return 500;
  if (department.includes(query)) return 400;

  if (province === query) return 350;
  if (province.startsWith(query)) return 300;
  if (province.includes(query)) return 250;

  if (code.startsWith(query)) return 450;

  if (searchableFields(item).some(field => field.includes(query))) {
    return 200;
  }

  return 0;
}

/* ACCENT-INSENSITIVE HIGHLIGHTING */
function highlightText(value, query) {
  const text = String(value || "");
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return escapeHTML(text);
  }

  /*
   * Build a character-position map so accent removal does not
   * cause the highlighted section to point at the wrong letters.
   */
  let normalized = "";
  const positions = [];

  for (let i = 0; i < text.length;) {
    const character = String.fromCodePoint(text.codePointAt(i));
    const normalizedCharacter = character
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");

    for (let j = 0; j < normalizedCharacter.length; j++) {
      normalized += normalizedCharacter[j];
      positions.push({
        start: i,
        end: i + character.length
      });
    }

    i += character.length;
  }

  const index = normalized.indexOf(normalizedQuery);

  if (index < 0) {
    return escapeHTML(text);
  }

  const start = positions[index]?.start;
  const end = positions[index + normalizedQuery.length - 1]?.end;

  if (start === undefined || end === undefined) {
    return escapeHTML(text);
  }

  return (
    escapeHTML(text.slice(0, start)) +
    "<mark>" + escapeHTML(text.slice(start, end)) + "</mark>" +
    escapeHTML(text.slice(end))
  );
}

/* RESULT CARD — ORIGINAL HTML/CSS CLASSES */
function createResult(item, query) {
  const folder = folderName(item);

  const details = [
    item.department,
    item.province
  ]
    .filter(Boolean)
    .map(escapeHTML);

  const agglomeration = item.agglomeration
    ? `<div class="resultMeta"><strong>Aglomeración:</strong> ${escapeHTML(item.agglomeration)}</div>`
    : "";

  const government = item.localGovernment
    ? `<div class="resultMeta"><strong>Gobierno local:</strong> ${escapeHTML(item.localGovernment)}</div>`
    : "";

  const localityType = item.localityType
    ? `<div class="resultMeta"><strong>Tipo de localidad:</strong> ${escapeHTML(item.localityType)}</div>`
    : "";

  return `
    <article
      class="resultItem fadeIn"
      tabindex="0"
      role="link"
      aria-label="${escapeHTML(item.locality)}, ${escapeHTML(item.department)}, ${escapeHTML(item.province)}"
      data-url="/${encodeURIComponent(folder)}/"
    >
      <h2 class="resultTitle">
        ${highlightText(item.locality, query)}
      </h2>

      <div class="resultMeta">
        ${details.join(" • ")}
      </div>

      <p class="resultDescription">
        Localidad de ${escapeHTML(item.locality)}, departamento
        ${escapeHTML(item.department)}, provincia de
        ${escapeHTML(item.province)}, Argentina.
      </p>

      <div class="resultMeta">
        <strong>Código de localidad:</strong>
        ${escapeHTML(item.localityCode)}
      </div>

      ${localityType}
      ${agglomeration}
      ${government}
    </article>
  `;
}

/* RENDER SEARCH RESULTS */
function renderResults(found, query) {
  if (!found.length) {
    results.hidden = true;
    results.innerHTML = "";
    empty.hidden = false;

    status.textContent =
      "No se encontraron localidades coincidentes.";

    return;
  }

  empty.hidden = true;
  results.hidden = false;

  status.textContent =
    `Se encontraron ${found.length} resultados.`;

  results.innerHTML = `
    <div class="resultCount">Resultados de búsqueda</div>
    ${found.map(item => createResult(item, query)).join("")}
  `;
}

/* SEARCH */
function searchLocalities(value) {
  const query = normalizeText(value);

  if (query.length < 2) {
    results.hidden = true;
    results.innerHTML = "";
    empty.hidden = true;

    status.textContent =
      "Ingrese al menos 2 caracteres para buscar.";

    return;
  }

  if (!localities.length) {
    results.hidden = true;
    empty.hidden = true;

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
        "es"
      )
    )
    .slice(0, 50)
    .map(result => result.item);

  renderResults(found, query);
}

/* OPEN RESULT */
function openResult(event) {
  const card = event.target.closest(".resultItem");

  if (!card || !results.contains(card)) {
    return;
  }

  window.location.href = card.dataset.url;
}

results.addEventListener("click", openResult);

/* KEYBOARD ACCESSIBILITY */
results.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const card = event.target.closest(".resultItem");

  if (!card || !results.contains(card)) {
    return;
  }

  event.preventDefault();
  window.location.href = card.dataset.url;
});

/* FORM SUBMISSION */
form.addEventListener("submit", event => {
  event.preventDefault();
  searchLocalities(input.value);
});

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

  if (!loaded) {
    return;
  }

  status.textContent =
    `Base de datos cargada: ${localities.length.toLocaleString("es-AR")} localidades.`;

  /* Support direct search URLs such as ?q=Buenos+Aires */
  const query = new URLSearchParams(window.location.search).get("q");

  if (query) {
    input.value = query;
    searchLocalities(query);
  }

  console.log(
    "%cARGENTINA LOCALITIES",
    "color:#b89435;font-size:18px;font-weight:bold;"
  );

  console.log("Powered by VIDHWAAN");
}

init();
