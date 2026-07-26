import { NextRequest } from "next/server";
import { cachedList } from "@/lib/cache";
import { apiJson, corsPreflight, withPublicApi } from "@/lib/api";

const MAX_LIMIT = 100;

/**
 * GET /api/v1/products — listado del catálogo con búsqueda, filtro, orden y paginación.
 * Mismos parámetros que la web: search, category, sort, dir, page, limit.
 */
export const GET = withPublicApi(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const search = (sp.get("search") ?? sp.get("q") ?? "").trim();
  const category = sp.get("category") ?? "";
  const sort = sp.get("sort") ?? "updated";
  const dir = sp.get("dir") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1") || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(sp.get("limit") ?? "24") || 24));

  const data = await cachedList({ search, category, sort, dir, page, limit });
  return apiJson(data, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
  });
});

export const OPTIONS = corsPreflight;
