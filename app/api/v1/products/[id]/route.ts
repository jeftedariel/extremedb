import { NextRequest } from "next/server";
import { cachedDetail } from "@/lib/cache";
import { apiError, apiJson, corsPreflight, withPublicApi } from "@/lib/api";

/**
 * GET /api/v1/products/:id — detalle de un producto: datos actuales,
 * histórico completo de precio y estadísticas (mínimo/máximo/actual).
 */
export const GET = withPublicApi(async (req: NextRequest, { params }) => {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return apiError(400, "id inválido: debe ser un entero positivo");
  }
  const detail = await cachedDetail(id);
  if (!detail) return apiError(404, "producto no encontrado");

  return apiJson(detail, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
  });
});

export const OPTIONS = corsPreflight;
