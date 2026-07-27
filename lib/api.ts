import { NextRequest, NextResponse } from "next/server";

/**
 * Helpers del API pública (/api/v1): CORS, auth por token y rate limit.
 *
 * - Sin token: acceso libre pero limitado por IP (RATE_LIMIT req/min).
 * - Con token válido (env API_TOKENS, separados por coma): sin límite.
 *
 * El limitador es en memoria y por instancia serverless: es un freno de abuso
 * best-effort, no un contador exacto global. Si algún día hace falta precisión
 * (múltiples regiones, límites por plan), migrar a un store compartido (Upstash/KV).
 */

const RATE_LIMIT = Math.max(1, parseInt(process.env.API_RATE_LIMIT || "60") || 60);
const WINDOW_MS = 60_000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

/* ---------- auth ---------- */

function tokens(): Set<string> {
  return new Set(
    (process.env.API_TOKENS || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  );
}

/** true si la request trae un token válido (Bearer o ?token=). */
export function isAuthenticated(req: NextRequest): boolean {
  const valid = tokens();
  if (valid.size === 0) return false;
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ")
    ? auth.slice(7).trim()
    : req.nextUrl.searchParams.get("token") ?? "";
  return provided !== "" && valid.has(provided);
}

/* ---------- rate limit (ventana fija por IP) ---------- */

const hits = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

interface RateResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

function checkRate(ip: string): RateResult {
  const now = Date.now();

  // Poda ocasional para que el Map no crezca sin límite en instancias longevas.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }

  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: RATE_LIMIT - 1, resetAt: now + WINDOW_MS };
  }
  entry.count++;
  return {
    ok: entry.count <= RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - entry.count),
    resetAt: entry.resetAt,
  };
}

/* ---------- respuestas ---------- */

export function apiJson(data: unknown, init?: ResponseInit & { headers?: Record<string, string> }) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...CORS, ...init?.headers },
  });
}

export function apiError(status: number, message: string, headers?: Record<string, string>) {
  return apiJson({ error: message }, { status, headers });
}

/** Preflight CORS — exportar como OPTIONS en cada route del API. */
export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Envuelve un handler GET del API pública: aplica rate limit a requests sin
 * token y añade los headers X-RateLimit-*. Los handlers solo se ocupan de los datos.
 */
export function withPublicApi(
  handler: (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    if (isAuthenticated(req)) return handler(req, ctx);

    const rate = checkRate(clientIp(req));
    const rateHeaders = {
      "X-RateLimit-Limit": String(RATE_LIMIT),
      "X-RateLimit-Remaining": String(rate.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rate.resetAt / 1000)),
    };
    if (!rate.ok) {
      return apiError(429, "Demasiadas solicitudes. Esperá un momento o usá un token de API.", {
        ...rateHeaders,
        "Retry-After": String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))),
      });
    }

    const res = await handler(req, ctx);
    for (const [k, v] of Object.entries(rateHeaders)) res.headers.set(k, v);
    return res;
  };
}
