export interface CategoryRef {
  id: number;
  name: string;
  slug: string;
  link?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  brand: string | null;
  sku: string | null;
  permalink: string;
  thumbnail: string | null;
  image: string | null;
  price: number | null;
  regularPrice: number | null;
  onSale: boolean;
  inStock: boolean;
  currency: string;
  categories: CategoryRef[];
  updatedAt: string | null;
  /** Primera vez que el scraper lo vio en el catálogo ≈ fecha de alta del producto. */
  firstSeen: string | null;
  /** Última vez que el scraper lo vio en el catálogo de la tienda. */
  lastSeen: string | null;
  /** true si lleva demasiado sin aparecer en el catálogo (≠ sin stock: ya no está listado). */
  delisted: boolean;
  /** Nº de puntos de histórico — solo presente cuando se ordena por "mayor historial". */
  historyPoints?: number;
}

export interface HistoryPoint {
  captured_at: string;
  price: number | null;
  regular_price: number | null;
  sale_price: number | null;
  on_sale: boolean;
  in_stock: boolean;
  currency: string | null;
}

export interface Stats {
  current: { price: number; date: string };
  min: { price: number; date: string };
  max: { price: number; date: string };
  points: number;
  offFromMax: number;
}

export interface ProductDetail {
  product: Product;
  history: HistoryPoint[];
  stats: Stats | null;
}

export interface CategoryNode {
  name: string;
  slug: string;
  count: number;
  children: CategoryNode[];
}

export type SortKey = "updated" | "added" | "name" | "price_asc" | "price_desc" | "discount";

export interface ListParams {
  search: string;
  category: string;
  /** Lookup exacto por slug (resolución de URLs de la tienda, p.ej. el bot de Discord). */
  slug?: string;
  sort: string;
  /** "asc" | "desc" | "" (vacío = dirección natural del criterio). */
  dir: string;
  /** Filtro por fecha de alta (first_seen): desde, inclusive. YYYY-MM-DD o ISO 8601. */
  since?: string;
  /** Filtro por fecha de alta (first_seen): hasta. YYYY-MM-DD incluye el día completo. */
  until?: string;
  page: number;
  limit: number;
}

export interface ListResult {
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: Product[];
}
