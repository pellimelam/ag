/* =========================================================
   ARGENTINA LOCALITIES — SEARCH.JS
   Vidhwaan Village Based Global Technology Company
========================================================= */

"use strict";

const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");
const button = document.getElementById("searchButton");
const results = document.getElementById("results");
const status = document.getElementById("statusArea");
const empty = document.getElementById("emptyState");

let localities = [];
let databaseReady = false;

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

/* MATCH GENERATED LOCALITY FOLDER NAMING */
function slugify(value = "") {
  return String(value)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
    .filter(value =>
      value !== undefined &&
      value !== null &&
      value !== ""
    )
    .map(normalizeText);
}

/* RELEVANCE RANKING */
function scoreLocality(item, query) {
  const locality = normalizeText(item.locality);
  const department = normalizeText(item.department);
  const province = normalizeText(item.province);
  const code = normalizeText(item.localityCode);

  if (locality === query) return 1000;
  if (code === query) return 900;
  if (locality.startsWith(query)) return 850;
  if (locality.includes(query)) return 700;

  if (department === query) return 600;
  if (department.startsWith(query)) return 500;
  if (code.startsWith(query)) return 450;
  if (department.includes(query)) return 400;

  if (province === query) return 350;
  if (province.startsWith(query)) return 300;
  if (province.includes(query)) return 250;

  if (searchableFields(item).some(field =>
    field.includes(query)
  )) {
    return 200;
  }

  return 0;
}

/* HIGHLIGHT SEARCH MATCH */
function highlightText(value, query) {
  const original = String(value ?? "");
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return escapeHTML(original);
  }

  let normalized = "";
  const positions = [];

  for (let i = 0; i < original.length;) {
    const character = String.fromCodePoint(
      original.codePointAt(i)
    );

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
    return escapeHTML(original);
  }

  const start = positions[index]?.start;
  const end =
    positions[index + normalizedQuery.length - 1]?.end;

  if (start === undefined || end === undefined) {
    return escapeHTML(original);
  }

  return (
    escapeHTML(original.slice(0, start)) +
    "<mark>" +
    escapeHTML(original.slice(start, end)) +
    "</mark>" +
    escapeHTML(original.slice(end))
  );
}

/* CREATE RESULT CARD */
function createResult(item, query) {
  const department = escapeHTML(item.department);
  const province = escapeHTML(item.province);

  const agglomeration = item.agglomeration
    ? `
      <div class="resultDetail">
        <strong>Aglomeración:</strong>
        ${escapeHTML(item.agglomeration)}
      </div>
    `
    : "";

  const government = item.localGovernment
    ? `
      <div class="resultDetail">
        <strong>Gobierno local:</strong>
        ${escapeHTML(item.localGovernment)}
      </div>
    `
    : "";

  return `
    <article
      class="resultItem fadeIn"
      tabindex="0"
      role="link"
      aria-label="${escapeHTML(item.locality)}, ${department}, ${province}"
      data-url="/${encodeURIComponent(folderName(item))}/"
    >
      <h2 class="resultTitle">
        ${highlightText(item.locality, query)}
      </h2>

      <div class="resultMeta">
        ${department} • ${province}
      </div>

      <p class="resultDescription">
        Localidad de ${escapeHTML(item.locality)},
        departamento ${department},
        provincia de ${province}, Argentina.
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

/* DISPLAY RESULTS */
function renderResults(found, query) {
  results.replaceChildren();

  if (!found.length) {
    results.hidden = true;
    empty.hidden = false;

    status.textContent =
      "No se encontraron localidades coincidentes.";

    return;
  }

  empty.hidden = true;
  results.hidden = false;

  status.textContent =
    `Se encontraron ${found.length} resultados.`;

  results.innerHTML =
    `<div class="resultCount">Resultados de búsqueda</div>` +
    found.map(item => createResult(item, query)).join("");
}

/* SEARCH LOCALITIES */
function searchLocalities(value) {
  const query = normalizeText(value);

  if (query.length < 2) {
    results.hidden = true;
    results.replaceChildren();
    empty.hidden = true;

    status.textContent =
      "Ingrese al menos 2 caracteres para buscar.";

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
        "es"
      )
    )
    .slice(0, 50)
    .map(result => result.item);

  renderResults(found, query);
}

/* OPEN A LOCALITY */
function openResult(event) {
  const card = event.target.closest(".resultItem");

  if (!card || !results.contains(card)) {
    return;
  }

  if (card.dataset.url) {
    window.location.href = card.dataset.url;
  }
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

  if (card.dataset.url) {
    window.location.href = card.dataset.url;
  }
});

/* SEARCH FORM */
form.addEventListener("submit", event => {
  event.preventDefault();
  searchLocalities(input.value);
});

/* COOKIE POLICY POPUP */
const policyLink =
  document.getElementById("cookiePolicyLink");

const policyDialog =
  document.getElementById("cookiePolicyDialog");

const policyClose =
  document.getElementById("cookiePolicyClose");

const policyCloseBottom =
  document.getElementById("cookiePolicyCloseBottom");

function openPolicy() {
  if (!policyDialog) return;

  policyDialog.hidden = false;
  document.body.classList.add("dialogOpen");

  if (policyClose) {
    policyClose.focus();
  }
}

function closePolicy() {
  if (!policyDialog) return;

  policyDialog.hidden = true;
  document.body.classList.remove("dialogOpen");

  if (policyLink) {
    policyLink.focus();
  }
}

if (policyLink) {
  policyLink.addEventListener("click", event => {
    event.preventDefault();
    openPolicy();
  });
}

if (policyClose) {
  policyClose.addEventListener("click", closePolicy);
}

if (policyCloseBottom) {
  policyCloseBottom.addEventListener(
    "click",
    closePolicy
  );
}

if (policyDialog) {
  policyDialog.addEventListener("click", event => {
    if (event.target === policyDialog) {
      closePolicy();
    }
  });
}

document.addEventListener("keydown", event => {
  if (
    event.key === "Escape" &&
    policyDialog &&
    !policyDialog.hidden
  ) {
    closePolicy();
  }
});

/* RESTORE SEARCH FROM URL */
function restoreURLSearch() {
  const query =
    new URLSearchParams(window.location.search).get("q");

  if (!query) return;

  input.value = query;
  searchLocalities(query);
}

/* LOAD ARGENTINA DATABASE */
async function init() {
  results.hidden = true;
  empty.hidden = true;
  button.disabled = true;
  input.disabled = true;

  status.textContent =
    "Cargando la base de datos de Argentina...";

  try {
    const response = await fetch("./argentina.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(
        "The JSON root must be an array."
      );
    }

    localities = data.filter(item =>
      item &&
      item.province &&
      item.department &&
      item.locality &&
      item.localityCode
    );

    if (!localities.length) {
      throw new Error(
        "No valid locality records were found."
      );
    }

    databaseReady = true;

    status.textContent =
      `Base de datos cargada: ${localities.length.toLocaleString("es-AR")} localidades.`;

    restoreURLSearch();

  } catch (error) {
    console.error(
      "Unable to load Argentina JSON:",
      error
    );

    status.textContent =
      "No se pudo cargar la base de datos de localidades de Argentina. Inténtelo de nuevo más tarde.";

  } finally {
    button.disabled = false;
    input.disabled = false;
  }

  console.info(
    "%cARGENTINA LOCALITIES",
    "color:#c9a227;font-size:18px;font-weight:bold;"
  );

  console.info("Powered by VIDHWAAN");
}

init();
