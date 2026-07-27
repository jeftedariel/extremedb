import { NextRequest, NextResponse } from "next/server";

/** GET /api — redirige al índice de la versión actual del API. */
export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/api/v1", req.nextUrl.origin), 308);
}
