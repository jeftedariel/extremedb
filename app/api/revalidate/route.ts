import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * Invalida al instante todo el Data Cache del catálogo (tag "catalog").
 *
 * Uso (n8n, curl, o el scraper tras cada push):
 *   curl -X POST https://extremedb.mendozac.cr/api/revalidate \
 *        -H "Authorization: Bearer $REVALIDATE_SECRET"
 *
 * Requiere la env var REVALIDATE_SECRET (en Vercel y .env local).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "REVALIDATE_SECRET no configurado" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : req.nextUrl.searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  revalidateTag("catalog");
  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
