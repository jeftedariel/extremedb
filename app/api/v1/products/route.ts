import { NextRequest } from "next/server";
import { cachedList } from "@/lib/cache";
import { apiError, apiJson, corsPreflight, withPublicApi } from "@/lib/api";

const MAX_LIMIT = 100;

/**
 * GET /api/v1/products — listado del catálogo con búsqueda, filtro, orden y paginación.
 * Mismos parámetros que la web: search, category, sort, dir, since, until, page, limit.
 */
export const GET = withPublicApi(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const search = (sp.get("search") ?? sp.get("q") ?? "").trim();
  const category = sp.get("category") ?? "";
  const slug = (sp.get("slug") ?? "").trim();
  const sort = sp.get("sort") ?? "updated";
  const dir = sp.get("dir") ?? "";
  const since = (sp.get("since") ?? "").trim();
  const until = (sp.get("until") ?? "").trim();
  const page = Math.max(1, parseInt(sp.get("page") ?? "1") || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(sp.get("limit") ?? "24") || 24));

  for (const [name, value] of [["since", since], ["until", until]] as const) {
    if (value && Number.isNaN(Date.parse(value))) {
      return apiError(400, `Parámetro '${name}' inválido: usar YYYY-MM-DD o ISO 8601.`);
    }
  }

  const data = await cachedList({ search, category, slug, sort, dir, since, until, page, limit });
  return apiJson(data, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
  });
});

export const OPTIONS = corsPreflight;
