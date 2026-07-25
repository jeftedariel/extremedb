import { sql } from "./db";
import type {
  CategoryNode,
  CategoryRef,
  HistoryPoint,
  ListParams,
  ListResult,
  Product,
  ProductDetail,
  Stats,
} from "./types";

/* ---------- helpers ---------- */

// Base pública del bucket R2 (ej: https://media.extremedb.mendozac.cr). Sin ella no hay imágenes.
const R2_BASE = (process.env.R2_PUBLIC_BASE || "").replace(/\/$/, "");
const r2Url = (key: string | null) => (key && R2_BASE ? `${R2_BASE}/${key}` : null);

/** timestamptz llega como Date; se normaliza a ISO string para que el resultado sea
 *  JSON-serializable (requisito de unstable_cache y de las props server→client). */
const toIso = (v: unknown): string | null =>
  v instanceof Date ? v.toISOString() : v == null ? null : String(v);

type Row = Record<string, unknown>;

/**
 * Un producto se considera DESCATALOGADO si el scraper (que recorre el catálogo completo
 * varias veces al día) lleva más de este umbral sin verlo. Distinto de "sin stock":
 * sin stock sigue listado en la tienda; descatalogado ya no aparece en ella.
 */
const DELISTED_AFTER_MS = 3 * 24 * 60 * 60 * 1000; // 3 días

/** Mapea una fila de producto (products + latest_price) a la forma del frontend. */
function mapProduct(row: Row): Product {
  const lastSeen = toIso(row.last_seen);
  const delisted =
    lastSeen != null && Date.now() - new Date(lastSeen).getTime() > DELISTED_AFTER_MS;
  return {
    lastSeen,
    delisted,
    id: row.id as number,
    name: row.name as string,
    slug: row.slug as string,
    brand: (row.brand as string) ?? null,
    sku: (row.sku as string) ?? null,
    permalink: row.permalink as string,
    thumbnail: r2Url((row.r2_thumb as string) || (row.r2_image as string) || null),
    image: r2Url((row.r2_image as string) || (row.r2_thumb as string) || null),
    price: (row.price as number) ?? null,
    regularPrice: (row.regular_price as number) ?? null,
    onSale: !!row.on_sale,
    inStock: !!row.in_stock,
    currency: (row.currency as string) || "CRC",
    categories: (row.categories as CategoryRef[]) || [],
    updatedAt: toIso(row.captured_at),
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

/* ---------- queries ---------- */

/** Árbol jerárquico de categorías (hasta 3 niveles) a partir de los paths guardados. */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const db = sql();
  const rows = await db`
    SELECT slug, name, path, COUNT(*)::int AS count
    FROM product_categories
    GROUP BY slug, name, path
  `;

  // slug → nodo (si un slug aparece con paths distintos, gana el de más productos)
  type Node = { name: string; slug: string; path: string[]; count: number };
  const nodes = new Map<string, Node>();
  for (const r of rows) {
    const existing = nodes.get(r.slug);
    if (existing && existing.count >= r.count) {
      existing.count += r.count;
      continue;
    }
    nodes.set(r.slug, {
      name: r.name,
      slug: r.slug,
      path: (r.path as string).split("/"),
      count: (existing?.count || 0) + r.count,
    });
  }

  type TreeNode = Node & { children: TreeNode[] };
  const byPath = new Map<string, TreeNode>();
  for (const n of nodes.values()) byPath.set(n.path.join("/"), { ...n, children: [] });

  const roots: TreeNode[] = [];
  for (const n of byPath.values()) {
    if (n.path.length === 1) {
      roots.push(n);
      continue;
    }
    const parent = byPath.get(n.path.slice(0, -1).join("/"));
    if (parent) parent.children.push(n);
    else roots.push(n); // padre sin productos propios: se promueve para no perderlo
  }

  const sortChildren = (list: TreeNode[]) => {
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

  const strip = (n: TreeNode): CategoryNode => ({
    name: n.name,
    slug: n.slug,
    count: n.count,
    children: n.children.map(strip),
  });
  return roots.map(strip);
}

const PRODUCT_COLS_SQL = `
  p.id, p.name, p.slug, p.brand, p.sku, p.permalink, p.categories,
  p.r2_image, p.r2_thumb, p.last_seen,
  lp.price, lp.regular_price, lp.on_sale, lp.in_stock, lp.currency, lp.captured_at
`;

/** Listado con búsqueda, filtro por categoría, orden y paginación. */
export async function listProducts({ search, category, sort, page, limit }: ListParams): Promise<ListResult> {
  const db = sql();

  const conds = [];
  if (search) {
    const q = `%${search}%`;
    conds.push(db`(p.name ILIKE ${q} OR p.sku ILIKE ${q} OR p.brand ILIKE ${q})`);
  }
  if (category) {
    conds.push(db`EXISTS (
      SELECT 1 FROM product_categories pc
      WHERE pc.product_id = p.id AND pc.slug = ${category}
    )`);
  }
  const whereSql = conds.length ? conds.reduce((a, b) => db`${a} AND ${b}`) : db`TRUE`;

  // p.id como desempate estable: muchos productos comparten captured_at (snapshot inicial)
  // y sin él la paginación puede duplicar/saltar items entre páginas.
  const ORDER_BY: Record<string, ReturnType<ReturnType<typeof sql>>> = {
    name: db`lower(p.name) ASC, p.id ASC`,
    price_asc: db`lp.price ASC NULLS LAST, p.id ASC`,
    price_desc: db`lp.price DESC NULLS LAST, p.id ASC`,
    discount: db`(lp.regular_price - lp.price) DESC NULLS LAST, p.id ASC`,
    updated: db`lp.captured_at DESC NULLS LAST, p.id DESC`,
  };
  const orderSql = ORDER_BY[sort] || ORDER_BY.updated;
  const offset = (page - 1) * limit;

  const [{ n: total }] = await db`
    SELECT COUNT(*)::int AS n
    FROM products p
    LEFT JOIN latest_price lp ON lp.product_id = p.id
    WHERE ${whereSql}
  `;

  const rows = await db`
    SELECT ${db.unsafe(PRODUCT_COLS_SQL)}
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
export async function getProductDetail(id: number): Promise<ProductDetail | null> {
  const db = sql();
  const [row] = await db`
    SELECT p.*, lp.price, lp.regular_price, lp.on_sale, lp.in_stock,
           lp.currency, lp.captured_at
    FROM products p
    LEFT JOIN latest_price lp ON lp.product_id = p.id
    WHERE p.id = ${id}
  `;
  if (!row) return null;

  const rows = await db`
    SELECT captured_at, price, regular_price, sale_price, on_sale, in_stock, currency
    FROM price_history WHERE product_id = ${id} ORDER BY captured_at ASC
  `;
  const history: HistoryPoint[] = rows.map((h) => ({
    captured_at: toIso(h.captured_at) as string,
    price: h.price ?? null,
    regular_price: h.regular_price ?? null,
    sale_price: h.sale_price ?? null,
    on_sale: !!h.on_sale,
    in_stock: !!h.in_stock,
    currency: h.currency ?? null,
  }));

  return { product: mapProduct(row), history, stats: computeStats(history) };
}

/** Ids + última actualización de todos los productos (para el sitemap). */
export async function getProductIds(): Promise<{ id: number; lastSeen: string | null }[]> {
  const db = sql();
  const rows = await db`SELECT id, last_seen FROM products ORDER BY id`;
  return rows.map((r) => ({ id: r.id as number, lastSeen: toIso(r.last_seen) }));
}

/** Calcula mínimo/máximo/actual con sus fechas a partir del histórico. */
function computeStats(history: HistoryPoint[]): Stats | null {
  const pts = history.filter((h): h is HistoryPoint & { price: number } => h.price != null);
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
    offFromMax: max.price > 0 ? Math.round((1 - current.price / max.price) * 100) : 0,
  };
}
