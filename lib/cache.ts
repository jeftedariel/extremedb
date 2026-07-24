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

export const cachedTree = unstable_cache(getCategoryTree, ["cat-tree"], { revalidate: HOUR });
export const cachedList = unstable_cache(listProducts, ["products-list"], { revalidate: HOUR });
export const cachedDetail = unstable_cache(getProductDetail, ["product-detail"], { revalidate: HOUR });
export const cachedProductIds = unstable_cache(getProductIds, ["product-ids"], { revalidate: HOUR });
