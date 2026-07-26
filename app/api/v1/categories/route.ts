import { cachedTree } from "@/lib/cache";
import { apiJson, corsPreflight, withPublicApi } from "@/lib/api";

/**
 * GET /api/v1/categories — árbol jerárquico de categorías (hasta 3 niveles)
 * con el conteo de productos de cada una.
 */
export const GET = withPublicApi(async () => {
  const categories = await cachedTree();
  return apiJson(
    { categories },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } }
  );
});

export const OPTIONS = corsPreflight;
