const state = {
  search: "",
  category: "", // slug de la categoría seleccionada
  categoryName: "",
  sort: "updated",
  page: 1,
  pages: 1,
  total: 0,
  tree: [], // árbol de categorías (se carga una vez)
  expanded: new Set(), // slugs de nodos expandidos en el sidebar
};

const fmt = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});
const money = (n) => (n == null ? "—" : fmt.format(n));
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("es-CR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const $ = (s) => document.querySelector(s);
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// La API ya devuelve URLs absolutas de R2 (o null → placeholder por onerror).
const imgUrl = (src) => src || "";

/* ---------- data ---------- */
async function loadCategories() {
  state.tree = await fetch("/api/categories/tree").then((r) => r.json());
  renderCategories();
}

/** Devuelve la cadena de ancestros (slugs) hasta la categoría dada, o null. */
function findAncestors(slug, nodes = state.tree, trail = []) {
  for (const n of nodes) {
    if (n.slug === slug) return trail;
    const r = findAncestors(slug, n.children, [...trail, n.slug]);
    if (r) return r;
  }
  return null;
}

function renderCategories() {
  const ul = $("#categories");
  ul.innerHTML = "";

  // Acceso especial: todas las categorías.
  const all = el("li");
  all.appendChild(catRow("Todas", null, !state.category, () => selectCategory("", "")));
  ul.appendChild(all);

  for (const node of state.tree) ul.appendChild(renderCatNode(node, 0));
}

/** Fila clickeable del sidebar (nombre + conteo opcional). */
function catRow(name, count, active, onClick, toggle) {
  const row = el("div", "cat-row" + (active ? " active" : ""));
  if (toggle) {
    const tw = el("button", "tw" + (toggle.open ? " open" : ""), "▸");
    tw.onclick = (e) => {
      e.stopPropagation();
      toggle.fn();
    };
    row.appendChild(tw);
  } else {
    row.appendChild(el("span", "tw-spacer"));
  }
  row.appendChild(el("span", "cat-name", esc(name)));
  if (count != null) row.appendChild(el("span", "cnt", String(count)));
  row.onclick = onClick;
  return row;
}

function renderCatNode(node, depth) {
  const li = el("li", "depth-" + depth);
  const hasKids = node.children.length > 0;
  const open = state.expanded.has(node.slug);

  li.appendChild(
    catRow(
      node.name,
      node.count,
      state.category === node.slug,
      () => {
        if (hasKids) state.expanded.add(node.slug);
        selectCategory(node.slug, node.name);
      },
      hasKids
        ? {
            open,
            fn: () => {
              open ? state.expanded.delete(node.slug) : state.expanded.add(node.slug);
              renderCategories();
            },
          }
        : null
    )
  );

  if (hasKids && open) {
    const sub = el("ul", "cats sub");
    for (const c of node.children) sub.appendChild(renderCatNode(c, depth + 1));
    li.appendChild(sub);
  }
  return li;
}

async function loadProducts() {
  const grid = $("#grid");
  grid.innerHTML = `<div class="loading">Cargando…</div>`;

  const params = new URLSearchParams({
    search: state.search,
    category: state.category,
    sort: state.sort,
    page: state.page,
    limit: 24,
  });
  const data = await fetch("/api/products?" + params).then((r) => r.json());
  state.pages = data.pages;
  state.total = data.total;
  renderResultbar();
  renderGrid(data.items, { showUpdated: state.sort === "updated" });
  renderPager();
}

/* ---------- render list ---------- */
function renderResultbar() {
  const bar = $("#resultbar");
  bar.innerHTML = `<span>${state.total.toLocaleString("es-CR")} productos</span>`;
  if (state.category) {
    const chip = el("span", "chip", `${esc(state.categoryName || state.category)} <button title="quitar">✕</button>`);
    chip.querySelector("button").onclick = () => selectCategory("", "");
    bar.appendChild(chip);
  }
  if (state.search) {
    const chip = el("span", "chip", `“${esc(state.search)}” <button title="quitar">✕</button>`);
    chip.querySelector("button").onclick = () => {
      $("#search").value = "";
      state.search = "";
      state.page = 1;
      loadProducts();
    };
    bar.appendChild(chip);
  }
}

function renderGrid(items, opts = {}) {
  const grid = $("#grid");
  grid.innerHTML = "";
  if (!items.length) {
    grid.appendChild(el("div", "empty", "Sin resultados. Prueba otra búsqueda o categoría."));
    return;
  }
  for (const p of items) {
    const card = el("div", "card");
    const off =
      p.onSale && p.regularPrice && p.regularPrice > p.price
        ? Math.round((1 - p.price / p.regularPrice) * 100)
        : 0;
    card.innerHTML = `
      <div class="imgwrap">
        <img loading="lazy" src="${esc(imgUrl(p.thumbnail))}" alt="${esc(p.name)}"
             onerror="this.style.visibility='hidden'"/>
      </div>
      <div class="body">
        <div class="brand">${esc(p.brand || "")}</div>
        <div class="name">${esc(p.name)}</div>
        <div class="priceRow">
          <span class="price">${money(p.price)}</span>
          ${off ? `<span class="was">${money(p.regularPrice)}</span>` : ""}
          ${off ? `<span class="badge off">-${off}%</span>` : ""}
          ${!p.inStock ? `<span class="badge out">Agotado</span>` : ""}
        </div>
        ${opts.showUpdated && p.updatedAt ? `<div class="upd">Actualizado: ${fmtDate(p.updatedAt)}</div>` : ""}
      </div>`;
    card.onclick = () => (location.hash = `#/p/${p.id}`);
    grid.appendChild(card);
  }
}

function renderPager() {
  const p = $("#pager");
  p.innerHTML = "";
  if (state.pages <= 1) return;
  const prev = el("button", "", "‹ Anterior");
  prev.disabled = state.page <= 1;
  prev.onclick = () => {
    state.page--;
    loadProducts();
    scrollTo(0, 0);
  };
  const next = el("button", "", "Siguiente ›");
  next.disabled = state.page >= state.pages;
  next.onclick = () => {
    state.page++;
    loadProducts();
    scrollTo(0, 0);
  };
  p.append(prev, el("span", "info", `Página ${state.page} de ${state.pages}`), next);
}

/* ---------- interactions ---------- */
function selectCategory(slug, name) {
  state.category = slug;
  state.categoryName = name;
  state.page = 1;
  // Mantiene visible la rama de la categoría seleccionada.
  const ancestors = slug ? findAncestors(slug) : null;
  if (ancestors) for (const a of ancestors) state.expanded.add(a);
  renderCategories();
  loadProducts();
}

let searchTimer;
$("#search").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = e.target.value.trim();
    state.page = 1;
    loadProducts();
  }, 250);
});
$("#sort").addEventListener("change", (e) => {
  state.sort = e.target.value;
  state.page = 1;
  loadProducts();
});

/* ---------- detail ---------- */
async function openDetail(id) {
  const overlay = $("#overlay");
  const box = $("#detail");
  overlay.classList.remove("hidden");
  box.innerHTML = `<div class="loading">Cargando…</div>`;

  const data = await fetch(`/api/products/${id}`).then((r) => r.json());
  if (data.error) {
    box.innerHTML = `<div class="empty">Producto no encontrado</div>`;
    return;
  }
  const { product: p, history, stats } = data;
  const off =
    p.onSale && p.regularPrice && p.regularPrice > p.price
      ? Math.round((1 - p.price / p.regularPrice) * 100)
      : 0;

  box.innerHTML = `
    <div class="dtop">
      <button class="xbtn" onclick="closeDetail()">✕</button>
      <div class="dhead">
        <div class="dimg"><img src="${esc(imgUrl(p.image))}" alt="${esc(p.name)}"
             onerror="this.style.visibility='hidden'"/></div>
        <div>
          <div class="dbrand">${esc(p.brand || "")}</div>
          <h2>${esc(p.name)}</h2>
          <div class="priceRow">
            <span class="price" style="font-size:24px;font-weight:800">${money(p.price)}</span>
            ${off ? `<span class="was">${money(p.regularPrice)}</span>` : ""}
            ${off ? `<span class="badge off">-${off}%</span>` : ""}
            ${p.inStock ? `<span class="badge in">En stock</span>` : `<span class="badge out">Agotado</span>`}
          </div>
          <div class="dcats">${(p.categories || []).map((c) => `<span>${esc(c.name)}</span>`).join("")}</div>
          ${p.sku ? `<div class="desc">SKU: ${esc(p.sku)}</div>` : ""}
        </div>
      </div>
    </div>

    <div class="stats">
      <div class="stat now"><div class="label">Precio actual</div>
        <div class="val">${money(stats?.current.price)}</div>
        <div class="date">${fmtDate(stats?.current.date)}</div></div>
      <div class="stat low"><div class="label">Precio más bajo</div>
        <div class="val">${money(stats?.min.price)}</div>
        <div class="date">${fmtDate(stats?.min.date)}</div></div>
      <div class="stat high"><div class="label">Precio más alto</div>
        <div class="val">${money(stats?.max.price)}</div>
        <div class="date">${fmtDate(stats?.max.date)}</div></div>
    </div>

    <div class="chartwrap">
      <h4>Histórico de precio</h4>
      <div id="chart-host"></div>
      <div class="chart-note">
        ${
          history.length <= 1
            ? "Solo hay un registro por ahora — el historial se irá llenando con cada corrida del tracker."
            : `${history.length} puntos registrados.`
        }
      </div>
    </div>

    <div class="dlinks">
      <a href="${esc(p.permalink)}" target="_blank" rel="noopener">Ver en la tienda oficial ↗</a>
    </div>`;

  drawChart($("#chart-host"), history);
}

function closeDetail() {
  $("#overlay").classList.add("hidden");
  if (location.hash.startsWith("#/p/")) history.pushState("", "", location.pathname);
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDetail();
});

/* ---------- SVG price chart (sin dependencias) ---------- */
function drawChart(host, history) {
  const pts = history.filter((h) => h.price != null);
  const W = 860, H = 260, pad = { l: 64, r: 20, t: 18, b: 34 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

  // Escalas. Si hay un solo punto, se dibuja plano centrado.
  const times = pts.map((p) => new Date(p.captured_at).getTime());
  const prices = pts.map((p) => p.price);
  let tMin = Math.min(...times), tMax = Math.max(...times);
  if (tMin === tMax) { tMin -= 86400000; tMax += 86400000; }
  let pMin = Math.min(...prices), pMax = Math.max(...prices);
  if (pMin === pMax) { pMin = pMin * 0.95; pMax = pMax * 1.05; }
  const padP = (pMax - pMin) * 0.12;
  pMin -= padP; pMax += padP;

  const x = (t) => pad.l + ((t - tMin) / (tMax - tMin)) * iw;
  const y = (p) => pad.t + (1 - (p - pMin) / (pMax - pMin)) * ih;

  const coords = pts.map((p) => ({
    px: x(new Date(p.captured_at).getTime()),
    py: y(p.price),
    price: p.price,
    date: p.captured_at,
  }));

  // Ejes Y (4 líneas de guía).
  let gridY = "";
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const val = pMin + ((pMax - pMin) * i) / ticks;
    const yy = y(val);
    gridY += `<line class="grid-line" x1="${pad.l}" y1="${yy}" x2="${W - pad.r}" y2="${yy}"/>`;
    gridY += `<text class="axis-txt" x="${pad.l - 8}" y="${yy + 4}" text-anchor="end">${money(Math.round(val))}</text>`;
  }

  const linePath = coords.map((c, i) => `${i ? "L" : "M"}${c.px},${c.py}`).join(" ");
  const areaPath =
    coords.length > 1
      ? `M${coords[0].px},${H - pad.b} ` +
        coords.map((c) => `L${c.px},${c.py}`).join(" ") +
        ` L${coords[coords.length - 1].px},${H - pad.b} Z`
      : "";

  const dots = coords
    .map((c) => `<circle class="dot" cx="${c.px}" cy="${c.py}" r="3.5"/>`)
    .join("");

  // Etiquetas de fecha (primera y última).
  const first = coords[0], last = coords[coords.length - 1];
  const dateLabels =
    `<text class="axis-txt" x="${first.px}" y="${H - 12}" text-anchor="middle">${fmtDate(first.date)}</text>` +
    (coords.length > 1
      ? `<text class="axis-txt" x="${last.px}" y="${H - 12}" text-anchor="middle">${fmtDate(last.date)}</text>`
      : "");

  host.innerHTML = `
    <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      ${gridY}
      ${areaPath ? `<path class="area" d="${areaPath}"/>` : ""}
      <path class="line" d="${linePath}"/>
      ${dots}
      ${dateLabels}
      <circle class="hover-dot" r="5" style="opacity:0" id="hd"/>
      <rect x="${pad.l}" y="${pad.t}" width="${iw}" height="${ih}" fill="transparent" id="hit"/>
    </svg>
    <div class="tooltip" id="tt"></div>`;

  // Hover: encuentra el punto más cercano en X.
  const svg = host.querySelector("svg");
  const hd = host.querySelector("#hd");
  const tt = host.querySelector("#tt");
  const hit = host.querySelector("#hit");
  hit.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const scale = W / rect.width;
    const mx = (e.clientX - rect.left) * scale;
    let best = coords[0], bd = Infinity;
    for (const c of coords) {
      const d = Math.abs(c.px - mx);
      if (d < bd) { bd = d; best = c; }
    }
    hd.setAttribute("cx", best.px);
    hd.setAttribute("cy", best.py);
    hd.style.opacity = 1;
    tt.style.opacity = 1;
    tt.style.left = e.clientX + "px";
    tt.style.top = e.clientY + "px";
    tt.innerHTML = `<b>${money(best.price)}</b><br>${fmtDate(best.date)}`;
  });
  hit.addEventListener("mouseleave", () => {
    hd.style.opacity = 0;
    tt.style.opacity = 0;
  });
}

/* ---------- router ---------- */
function handleHash() {
  const m = location.hash.match(/^#\/p\/(\d+)/);
  if (m) openDetail(parseInt(m[1]));
  else $("#overlay").classList.add("hidden");
}
window.addEventListener("hashchange", handleHash);

/* ---------- init ---------- */
loadCategories();
loadProducts();
handleHash();
