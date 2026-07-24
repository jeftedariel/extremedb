import { sql } from "./db.js";

/* ---------- helpers ---------- */

// Base pública del bucket R2 (ej: https://pub-xxxx.r2.dev). Sin ella no hay imágenes.
const R2_BASE = (process.env.R2_PUBLIC_BASE || "").replace(/\/$/, "");
const r2Url = (key) => (key && R2_BASE ? `${R2_BASE}/${key}` : null);

/** Mapea una fila de producto (products + latest_price) a la forma del frontend. */
function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    sku: row.sku,
    permalink: row.permalink,
    thumbnail: r2Url(row.r2_thumb || row.r2_image),
    image: r2Url(row.r2_image || row.r2_thumb),
    price: row.price,
    regularPrice: row.regular_price,
    onSale: !!row.on_sale,
    inStock: !!row.in_stock,
    currency: row.currency || "CRC",
    categories: row.categories || [],
    updatedAt: row.captured_at || null,
  };
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

const PRODUCT_COLS = sql`
  p.id, p.name, p.slug, p.brand, p.sku, p.permalink, p.categories,
  p.r2_image, p.r2_thumb,
  lp.price, lp.regular_price, lp.on_sale, lp.in_stock, lp.currency, lp.captured_at
`;

/* ---------- queries ---------- */

/** Facetas planas: nombre de categoría con conteo de productos. */
export async function getCategories() {
  const rows = await sql`
    SELECT name, COUNT(*)::int AS count
    FROM product_categories
    GROUP BY name
    ORDER BY count DESC
  `;
  return rows.map((r) => ({ name: r.name, count: r.count }));
}

/** Árbol jerárquico de categorías (hasta 3 niveles) a partir de los paths guardados. */
export async function getCategoryTree() {
  const rows = await sql`
    SELECT slug, name, path, COUNT(*)::int AS count
    FROM product_categories
    GROUP BY slug, name, path
  `;

  // slug → nodo (si un slug aparece con paths distintos, gana el de más productos)
  const nodes = new Map();
  for (const r of rows) {
    const existing = nodes.get(r.slug);
    if (existing && existing.count >= r.count) {
      existing.count += r.count;
      continue;
    }
    nodes.set(r.slug, {
      name: r.name,
      slug: r.slug,
      path: r.path.split("/"),
      count: (existing?.count || 0) + r.count,
    });
  }

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
  return roots.map(strip);
}

/** Los N productos actualizados más recientemente. */
export async function getRecent(limit) {
  const rows = await sql`
    SELECT ${PRODUCT_COLS}
    FROM products p
    JOIN latest_price lp ON lp.product_id = p.id
    ORDER BY lp.captured_at DESC, p.id DESC
    LIMIT ${limit}
  `;
  return rows.map(mapProduct);
}

const ORDER_BY = {
  name: sql`lower(p.name) ASC`, // paridad con COLLATE NOCASE del prototipo
  price_asc: sql`lp.price ASC NULLS LAST`,
  price_desc: sql`lp.price DESC NULLS LAST`,
  discount: sql`(lp.regular_price - lp.price) DESC NULLS LAST`,
  updated: sql`lp.captured_at DESC NULLS LAST`,
};

/** Listado con búsqueda, filtro por categoría, orden y paginación. */
export async function listProducts({ search, category, sort, page, limit }) {
  const conds = [];
  if (search) {
    const q = `%${search}%`;
    conds.push(sql`(p.name ILIKE ${q} OR p.sku ILIKE ${q} OR p.brand ILIKE ${q})`);
  }
  if (category) {
    conds.push(sql`EXISTS (
      SELECT 1 FROM product_categories pc
      WHERE pc.product_id = p.id AND pc.slug = ${category}
    )`);
  }
  const whereSql = conds.length
    ? conds.reduce((a, b) => sql`${a} AND ${b}`)
    : sql`TRUE`;
  const orderSql = ORDER_BY[sort] || ORDER_BY.name;
  const offset = (page - 1) * limit;

  const [{ n: total }] = await sql`
    SELECT COUNT(*)::int AS n
    FROM products p
    LEFT JOIN latest_price lp ON lp.product_id = p.id
    WHERE ${whereSql}
  `;

  const rows = await sql`
    SELECT ${PRODUCT_COLS}
    FROM products p
    LEFT JOIN latest_price lp ON lp.product_id = p.id
    WHERE ${whereSql}
    ORDER BY ${orderSql}
    LIMIT ${limit} OFFSET ${offset}
  `;

  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    items: rows.map(mapProduct),
  };
}

/** Detalle: producto + histórico completo + estadísticas de precio. */
export async function getProductDetail(id) {
  const [row] = await sql`
    SELECT p.*, lp.price, lp.regular_price, lp.on_sale, lp.in_stock,
           lp.currency, lp.captured_at
    FROM products p
    LEFT JOIN latest_price lp ON lp.product_id = p.id
    WHERE p.id = ${id}
  `;
  if (!row) return null;

  const history = await sql`
    SELECT captured_at, price, regular_price, sale_price, on_sale, in_stock, currency
    FROM price_history WHERE product_id = ${id} ORDER BY captured_at ASC
  `;

  return {
    product: mapProduct(row),
    history: history.map((h) => ({ ...h, on_sale: !!h.on_sale, in_stock: !!h.in_stock })),
    stats: computeStats(history),
  };
}

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
