import postgres from "postgres";

/**
 * Conexión a Supabase (Postgres) vía el Transaction Pooler (6543):
 * - prepare: false — el pooler en modo transacción no soporta prepared statements.
 * - max: 5 — con Fluid compute una instancia atiende varias requests concurrentes;
 *   con max: 1 todas serializaban por una sola conexión y una query colgada
 *   congelaba la instancia entera (504 FUNCTION_INVOCATION_TIMEOUT de 5 min).
 * - timeouts — Supavisor cierra conexiones inactivas sin avisar y deja el socket
 *   medio muerto; sin timeouts postgres.js esperaba en él para siempre.
 *   idle_timeout/max_lifetime reciclan la conexión antes de que eso pase.
 *   (statement_timeout como startup param NO sirve: Supavisor lo descarta —
 *   verificado con current_setting(). El backstop server-side es el default
 *   de 2 min de Supabase.)
 * - numeric/int8 llegan como string por defecto → Number (precios e ids caben en double).
 *
 * Singleton perezoso en globalThis: evita crear pools duplicados con el HMR de dev y
 * no exige el env en build-time (solo al ejecutar la primera query).
 */
declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

export function sql() {
  if (!globalThis.__sql) {
    const url = process.env.SUPABASE_DB_URL;
    if (!url) {
      throw new Error(
        "Falta SUPABASE_DB_URL (connection string del Transaction Pooler de Supabase)."
      );
    }
    globalThis.__sql = postgres(url, {
      prepare: false,
      max: 5,
      connect_timeout: 10,
      idle_timeout: 20,
      max_lifetime: 60 * 15,
      types: {
        numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: Number },
        int8: { to: 20, from: [20], serialize: (x: unknown) => String(x), parse: Number },
      },
    });
  }
  return globalThis.__sql;
}
