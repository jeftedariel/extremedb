import express from "express";
import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { imageProxy } from "./imgproxy.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, "data", "extremetech.db");
const PORT = process.env.PORT || 4000;

const db = new Database(DB_PATH, { readonly: true });
const app = express();

/* ---------- helpers ---------- */

/** Parsea el JSON de categorías de un producto (tolerante a null). */
function parseCategories(json) {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/** Mapea una fila de producto de la DB a la forma que consume el frontend. */
function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    sku: row.sku,
    permalink: row.permalink,
    thumbnail: row.thumbnail || row.image,
    image: row.image || row.thumbnail,
    price: row.price,
    regularPrice: row.regular_price,
    onSale: !!row.on_sale,
    inStock: !!row.in_stock,
    currency: row.currency || "CRC",
    categories: parseCategories(row.categories),
    updatedAt: row.captured_at || null,
  };
}

/**
 * Extrae la ruta jerárquica de una categoría a partir de su link de WooCommerce.
 * Ej: https://extremetechcr.com/product-category/componentes/procesadores/amd/
 *   → ["componentes", "procesadores", "amd"]
 */
function categoryPath(link) {
  const m = /product-category\/(.+?)\/?$/.exec(link || "");
  return m ? m[1].split("/").filter(Boolean) : [];
}

// Orden de las categorías raíz, tomado del menú oficial de extremetechcr.com.
const ROOT_ORDER = [
  "computadoras",
  "componentes",
  "perifericos-y-accesorios",
  "gaming-y-streaming",
  "audio-y-video",
  "hogar-y-smart-home",
  "celulares-relojes-y-tablets",
  "conectividad-y-redes",
  "otras-categorias",
  "empresa",
  "cuotas-cero-intereses",
  "descuentos",
];

/* ---------- API ---------- */

// Lista de categorías con conteo (facetas), derivada del JSON de cada producto.
app.get("/api/categories", (_req, res) => {
  const rows = db
    .prepare("SELECT categories FROM products WHERE categories IS NOT NULL")
    .all();
  const counts = new Map();
  for (const r of rows) {
    for (const c of parseCategories(r.categories)) {
      const key = c.name;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  const list = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  res.json(list);
});

// Árbol jerárquico de categorías (hasta 3 niveles), reconstruido desde las
// rutas de los links de WooCommerce, que reflejan el menú del sitio oficial.
app.get("/api/categories/tree", (_req, res) => {
  const rows = db
    .prepare("SELECT categories FROM products WHERE categories IS NOT NULL")
    .all();

  // slug → { name, slug, path, count }
  const nodes = new Map();
  for (const r of rows) {
    for (const c of parseCategories(r.categories)) {
      const path = categoryPath(c.link);
      if (!path.length) continue;
      const e = nodes.get(c.slug) || { name: c.name, slug: c.slug, path, count: 0 };
      e.count++;
      nodes.set(c.slug, e);
    }
  }

  // Indexa por ruta para colgar cada nodo de su padre.
  const byPath = new Map();
  for (const n of nodes.values()) byPath.set(n.path.join("/"), { ...n, children: [] });

  const roots = [];
  for (const n of byPath.values()) {
    if (n.path.length === 1) {
      roots.push(n);
      continue;
    }
    const parent = byPath.get(n.path.slice(0, -1).join("/"));
    if (parent) parent.children.push(n);
    else roots.push(n); // padre sin productos propios: se promueve para no perderlo
  }

  const sortChildren = (list) => {
    list.sort((a, b) => a.name.localeCompare(b.name, "es"));
    for (const n of list) sortChildren(n.children);
  };
  for (const r of roots) sortChildren(r.children);
  roots.sort((a, b) => {
    const ia = ROOT_ORDER.indexOf(a.slug);
    const ib = ROOT_ORDER.indexOf(b.slug);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return b.count - a.count;
  });

  const strip = (n) => ({
    name: n.name,
    slug: n.slug,
    count: n.count,
    children: n.children.map(strip),
  });
  res.json(roots.map(strip));
});

// Los 50 productos actualizados más recientemente (fecha del último snapshot).
app.get("/api/recent", (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const rows = db
    .prepare(
      `SELECT p.id, p.name, p.slug, p.brand, p.sku, p.permalink, p.image, p.thumbnail,
              p.categories, last.price, last.regular_price, last.on_sale, last.in_stock,
              last.currency, last.captured_at
       FROM products p
       JOIN (
         SELECT ph.product_id, ph.price, ph.regular_price, ph.on_sale, ph.in_stock,
                ph.currency, ph.captured_at
         FROM price_history ph
         JOIN (SELECT product_id, MAX(captured_at) mx FROM price_history GROUP BY product_id) m
           ON ph.product_id = m.product_id AND ph.captured_at = m.mx
       ) last ON last.product_id = p.id
       ORDER BY last.captured_at DESC, p.id DESC
       LIMIT ?`
    )
    .all(limit);
  res.json({ items: rows.map(mapProduct) });
});

// Listado de productos con búsqueda, filtro por categoría, orden y paginación.
// El precio actual se toma del último snapshot de price_history.
app.get("/api/products", (req, res) => {
  const search = (req.query.search || "").trim();
  const category = (req.query.category || "").trim();
  const sort = (req.query.sort || "name").trim();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(req.query.limit) || 24));
  const offset = (page - 1) * limit;

  const where = [];
  const params = {};
  if (search) {
    where.push("(p.name LIKE @q OR p.sku LIKE @q OR p.brand LIKE @q)");
    params.q = `%${search}%`;
  }
  if (category) {
    // Coincidencia por slug de categoría dentro del JSON almacenado (los
    // nombres se repiten entre ramas — p. ej. "Periféricos", "Samsung").
    where.push("p.categories LIKE @cat");
    params.cat = `%"slug":"${category}"%`;
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const orderSql =
    {
      name: "p.name COLLATE NOCASE ASC",
      price_asc: "last.price ASC",
      price_desc: "last.price DESC",
      discount: "(last.regular_price - last.price) DESC",
      updated: "last.captured_at DESC",
    }[sort] || "p.name COLLATE NOCASE ASC";

  const base = `
    FROM products p
    LEFT JOIN (
      SELECT ph.product_id, ph.price, ph.regular_price, ph.on_sale, ph.in_stock, ph.currency,
             ph.captured_at
      FROM price_history ph
      JOIN (SELECT product_id, MAX(captured_at) mx FROM price_history GROUP BY product_id) m
        ON ph.product_id = m.product_id AND ph.captured_at = m.mx
    ) last ON last.product_id = p.id
    ${whereSql}
  `;

  const total = db
    .prepare(`SELECT COUNT(*) n ${base}`)
    .get(params).n;

  const rows = db
    .prepare(
      `SELECT p.id, p.name, p.slug, p.brand, p.sku, p.permalink, p.image, p.thumbnail,
              p.categories, last.price, last.regular_price, last.on_sale, last.in_stock,
              last.currency, last.captured_at
       ${base}
       ORDER BY ${orderSql}
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit, offset });

  res.json({
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    items: rows.map(mapProduct),
  });
});

// Detalle de un producto: datos + histórico + estadísticas de precio.
app.get("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ error: "no encontrado" });

  const history = db
    .prepare(
      `SELECT captured_at, price, regular_price, sale_price, on_sale, in_stock, currency
       FROM price_history WHERE product_id = ? ORDER BY captured_at ASC`
    )
    .all(id);

  const stats = computeStats(history);
  res.json({ product: mapProduct(row), history, stats });
});

/** Calcula mínimo/máximo/actual con sus fechas a partir del histórico. */
function computeStats(history) {
  const pts = history.filter((h) => h.price != null);
  if (pts.length === 0) return null;

  let min = pts[0];
  let max = pts[0];
  for (const p of pts) {
    if (p.price < min.price) min = p;
    if (p.price > max.price) max = p;
  }
  const current = pts[pts.length - 1];
  return {
    current: { price: current.price, date: current.captured_at },
    min: { price: min.price, date: min.captured_at },
    max: { price: max.price, date: max.captured_at },
    points: pts.length,
    // % respecto del máximo histórico (qué tan buena está la oferta ahora).
    offFromMax:
      max.price > 0 ? Math.round((1 - current.price / max.price) * 100) : 0,
  };
}

/* ---------- image proxy (bajo demanda, caché en memoria) ---------- */
app.get("/img", imageProxy);

/* ---------- static ---------- */
app.use(express.static(join(__dirname, "public")));

app.listen(PORT, () => {
  const count = db.prepare("SELECT COUNT(*) n FROM products").get().n;
  console.log(`\nExtremeTech Viewer  →  http://localhost:${PORT}`);
  console.log(`DB: ${DB_PATH}  (${count} productos)\n`);
});
