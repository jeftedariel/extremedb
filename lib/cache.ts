import { unstable_cache } from "next/cache";
import { getCategoryTree, getProductDetail, getProductIds, listProducts } from "./queries";

/**
 * Data Cache de Vercel con TTL 1 h — réplica del `s-maxage=3600` del sitio anterior:
 * los datos cambian ~2 veces al día, así que un cache hit no toca la DB.
 * unstable_cache incluye los argumentos serializados en la key, así que cada
 * combinación search/category/sort/page es una entrada distinta.
 * (Migrar a `"use cache"` + cacheLife cuando salga de experimental.)
 */
const HOUR = 3600;

// Versión de las keys: el Data Cache de Vercel SOBREVIVE a los redeploys, así que tras
// una migración de datos (p.ej. la normalización de categorías) hay que subir la versión
// para forzar entradas frescas de inmediato — o purgarlo en Vercel → Settings → Data Cache.
const V = "v2";

// Tag común: permite invalidar TODO el catálogo al instante con revalidateTag("catalog")
// (ver app/api/revalidate/route.ts) sin esperar el TTL ni redeployar.
const OPTS = { revalidate: HOUR, tags: ["catalog"] };

export const cachedTree = unstable_cache(getCategoryTree, ["cat-tree", V], OPTS);
export const cachedList = unstable_cache(listProducts, ["products-list", V], OPTS);
export const cachedDetail = unstable_cache(getProductDetail, ["product-detail", V], OPTS);
export const cachedProductIds = unstable_cache(getProductIds, ["product-ids", V], OPTS);
