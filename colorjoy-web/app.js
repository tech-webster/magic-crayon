const COLORS = [
  "#e63946", "#ff7b54", "#ffb200", "#ffd93d", "#8ac926",
  "#2a9d8f", "#4cc9f0", "#4361ee", "#7b2cbf", "#f72585",
  "#8d5524", "#c68642", "#ffdbac", "#ffffff",
];

const COLORS_PER_ROW = 7;
let currentColor = COLORS[0];
let erasing = false;
let currentPage = null;

/* ---------- Gallery ---------- */
function buildGallery() {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";
  PAGES.forEach((page) => {
    const card = document.createElement("button");
    card.className = "card";
    card.innerHTML = page.svg;
    const label = document.createElement("span");
    label.textContent = `${page.emoji} ${page.title}`;
    card.appendChild(label);
    // Gallery thumbnails stay uncolored
    card.querySelectorAll(".region").forEach((r) => {
      r.style.pointerEvents = "none";
    });
    card.addEventListener("click", () => openPage(page));
    gallery.appendChild(card);
  });
}

/* ---------- Painter ---------- */
function openPage(page) {
  currentPage = page;
  document.getElementById("gallery").classList.add("hidden");
  document.getElementById("painter").classList.remove("hidden");
  document.getElementById("pageTitle").textContent = `${page.emoji} ${page.title}`;

  const holder = document.getElementById("svgHolder");
  holder.innerHTML = page.svg;
  const svg = holder.querySelector("svg");
  svg.classList.add("page-svg");

  svg.querySelectorAll(".region").forEach((el) => {
    el.style.fill = "#ffffff";
    el.style.cursor = "pointer";
    el.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      el.style.fill = erasing ? "#ffffff" : currentColor;
    });
  });
}

function goHome() {
  currentPage = null;
  document.getElementById("painter").classList.add("hidden");
  document.getElementById("gallery").classList.remove("hidden");
  buildGallery();
}

/* ---------- Palette ---------- */
function buildPalette() {
  const palette = document.getElementById("palette");
  for (let i = 0; i < COLORS.length; i += COLORS_PER_ROW) {
    const row = document.createElement("div");
    row.className = "color-row";
    COLORS.slice(i, i + COLORS_PER_ROW).forEach((color) => {
      const swatch = document.createElement("button");
      swatch.className = "swatch" + (color === currentColor ? " picked" : "");
      swatch.style.background = color;
      swatch.dataset.color = color;
      swatch.setAttribute("aria-label", `color ${color}`);
      swatch.addEventListener("click", () => selectColor(color));
      row.appendChild(swatch);
    });
    palette.appendChild(row);
  }
}

function selectColor(color) {
  currentColor = color;
  erasing = false;
  setToolButtons(false);
  document.querySelectorAll(".swatch").forEach((s) => {
    s.classList.toggle("picked", s.dataset.color === color);
  });
}

/* ---------- Tools ---------- */
function setToolButtons(isErase) {
  document.getElementById("eraseTool").classList.toggle("active", isErase);
  document.getElementById("fillTool").classList.toggle("active", !isErase);
}

function resetPage() {
  if (!currentPage) return;
  document
    .getElementById("svgHolder")
    .querySelectorAll(".region")
    .forEach((el) => (el.style.fill = "#ffffff"));
}

function savePage() {
  if (!currentPage) return;
  const svg = document.getElementById("svgHolder").querySelector("svg");
  const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `colorjoy-${currentPage.id}.svg`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/* ---------- Boot ---------- */
document.getElementById("homeBtn").addEventListener("click", goHome);
document.getElementById("fillTool").addEventListener("click", () => {
  erasing = false;
  setToolButtons(false);
});
document.getElementById("eraseTool").addEventListener("click", () => {
  erasing = true;
  setToolButtons(true);
});
document.getElementById("resetBtn").addEventListener("click", resetPage);
document.getElementById("saveBtn").addEventListener("click", savePage);

buildGallery();
buildPalette();
