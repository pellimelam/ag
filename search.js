
/* =========================================================
   ARGENTINA LOCALITIES — SEARCH.JS
   Vidhwaan Village Based Global Technology Company
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

/* LOAD ARGENTINA JSON */
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
      "Unable to load the Argentina locality database. Please try again later.";

    return false;
  }
}

/* UNIQUE LOCALITY PAGE FOLDER
   Example: buenosaires-25demayo-06854100
   The official locality code prevents name collisions.
*/
function folderName(item) {
  const slug = normalizeText(item.locality)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug}-${item.localityCode}`;
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
    .filter(Boolean)
    .map(normalizeText);
}

/* RELEVANCE SCORE */
function scoreLocality(item, query) {
  const locality = normalizeText(item.locality);
  const department = normalizeText(item.department);
  const province = normalizeText(item.province);
  const code = String(item.localityCode || "");

  if (locality === query) return 1000;
  if (locality.startsWith(query)) return 850;
  if (locality.includes(query)) return 700;

  if (department === query) return 600;
  if (department.startsWith(query)) return 500;
  if (department.includes(query)) return 400;

  if (province === query) return 350;
  if (province.startsWith(query)) return 300;
  if (province.includes(query)) return 250;

  if (code === query) return 900;
  if (code.startsWith(query)) return 450;

  if (searchableFields(item).some(field => field.includes(query))) {
    return 200;
  }

  return 0;
}

/* HIGHLIGHT MATCHES SAFELY */
function highlightText(value, query) {
  const text = String(value || "");
  const normalized = normalizeText(text);
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) return escapeHTML(text);

  const index = normalized.indexOf(normalizedQuery);

  if (index < 0) return escapeHTML(text);

  /*
    Accent-insensitive matching can change character offsets.
    Highlight only when the normalized and original offsets agree.
  */
  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);

  if (normalizeText(before + match).length !==
      normalizeText(before).length + normalizedQuery.length) {
    return escapeHTML(text);
  }

  return (
    escapeHTML(before) +
    "<mark>" + escapeHTML(match) + "</mark>" +
    escapeHTML(text.slice(index + match.length))
  );
}

/* RESULT CARD */
function createResult(item, query) {
  const folder = folderName(item);
  const locality = highlightText(item.locality, query);

  const details = [
    item.department,
    item.province
  ].filter(Boolean).map(escapeHTML);

  const agglomeration = item.agglomeration
    ? `<div><strong>Aglomeración:</strong> ${escapeHTML(item.agglomeration)}</div>`
    : "";

  const government = item.localGovernment
    ? `<div><strong>Gobierno local:</strong> ${escapeHTML(item.localGovernment)}</div>`
    : "";

  return `
    <article
      class="resultItem fadeIn"
      tabindex="0"
      role="link"
      aria-label="${escapeHTML(item.locality)}, ${escapeHTML(item.department)}, ${escapeHTML(item.province)}"
      data-url="/${encodeURIComponent(folder)}/"
    >
      <h2 class="resultTitle">${locality}</h2>

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

      ${agglomeration}
      ${government}
    </article>
  `;
}

/* RENDER RESULTS */
function renderResults(found, query) {
  if (!found.length) {
    results.hidden = true;
    results.innerHTML = "";
    empty.hidden = false;
    status.textContent = "No se encontraron localidades coincidentes.";
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
function searchLocalities(text) {
  const query = normalizeText(text);

  if (query.length < 2) {
    results.hidden = true;
    empty.hidden = true;
    status.textContent =
      "Ingrese al menos 2 caracteres para buscar.";
    return;
  }

  if (!localities.length) {
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
  if (!card || !results.contains(card)) return;

  window.location.href = card.dataset.url;
}

results.addEventListener("click", openResult);

results.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const card = event.target.closest(".resultItem");
  if (!card || !results.contains(card)) return;

  event.preventDefault();
  window.location.href = card.dataset.url;
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

/* URL SEARCH: ?q=Buenos+Aires */
window.addEventListener("load", () => {
  const query = new URLSearchParams(window.location.search).get("q");

  if (query) {
    input.value = query;
    if (localities.length) searchLocalities(query);
  }
});

/* INITIALIZE */
async function init() {
  results.hidden = true;
  empty.hidden = true;
  button.disabled = true;
  input.disabled = true;
  status.textContent = "Cargando la base de datos de Argentina...";

  const loaded = await loadLocalities();

  button.disabled = false;
  input.disabled = false;

  if (loaded) {
    status.textContent =
      `Base de datos cargada: ${localities.length.toLocaleString("es-AR")} localidades.`;

    const query = new URLSearchParams(window.location.search).get("q");

    if (query) {
      input.value = query;
      searchLocalities(query);
    }
  }

  console.log("%cARGENTINA LOCALITIES", 
    "color:#c9a227;font-size:18px;font-weight:bold;");
  console.log("Powered by VIDHWAAN");
}

init();
