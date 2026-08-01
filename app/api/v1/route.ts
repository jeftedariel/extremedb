import { NextRequest } from "next/server";
import { apiJson, corsPreflight, withPublicApi } from "@/lib/api";

/**
 * GET /api/v1 — índice autodescriptivo del API: endpoints, parámetros,
 * autenticación y rate limit.
 */
export const GET = withPublicApi(async (req: NextRequest) => {
  const base = `${req.nextUrl.origin}/api/v1`;
  return apiJson({
    name: "ExtremeDatabase API",
    version: "v1",
    description:
      "API REST de solo lectura del catálogo y el histórico de precios. Respuestas JSON con CORS abierto.",
    auth: {
      required: false,
      rate_limit: `Sin token: ${process.env.API_RATE_LIMIT || 60} requests/minuto por IP (429 al excederlo, ver header Retry-After).`,
      token:
        "Con un token válido no aplica límite. Se envía como 'Authorization: Bearer <token>' o '?token=<token>'.",
    },
    endpoints: [
      {
        method: "GET",
        path: "/products",
        url: `${base}/products`,
        description: "Listado del catálogo con búsqueda, filtro, orden y paginación.",
        params: {
          search: "texto a buscar en nombre, SKU y marca (alias: q)",
          category: "slug de categoría (ver /categories)",
          slug: "lookup exacto por slug de producto (resuelve URLs /producto/<slug>/ de la tienda)",
          sort: "updated | added | name | price | discount | activity (default: updated). 'added' ordena por fecha de alta en el catálogo, del más viejo al más nuevo.",
          dir: "asc | desc (default: dirección natural del criterio)",
          since: "fecha de alta mínima, inclusive (YYYY-MM-DD o ISO 8601)",
          until: "fecha de alta máxima (YYYY-MM-DD incluye ese día completo)",
          page: "página, desde 1 (default: 1)",
          limit: "items por página, máx. 100 (default: 24)",
        },
      },
      {
        method: "GET",
        path: "/products/:id",
        url: `${base}/products/:id`,
        description:
          "Detalle de un producto: datos actuales, histórico completo de precios y estadísticas (mín/máx/actual). 404 si no existe.",
      },
      {
        method: "GET",
        path: "/categories",
        url: `${base}/categories`,
        description:
          "Árbol jerárquico de categorías con conteo de productos. Los slug sirven para el parámetro category del listado.",
      },
    ],
  });
});

export const OPTIONS = corsPreflight;
