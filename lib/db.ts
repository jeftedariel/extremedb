import postgres from "postgres";

/**
 * Conexión a Supabase (Postgres) vía el Transaction Pooler (6543):
 * - prepare: false — el pooler en modo transacción no soporta prepared statements.
 * - max: 1 — cada instancia serverless atiende una request a la vez (postgres.js
 *   encola si dos queries compiten; con el pooler es seguro subirlo si hiciera falta).
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
      max: 1,
      types: {
        numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: Number },
        int8: { to: 20, from: [20], serialize: (x: unknown) => String(x), parse: Number },
      },
    });
  }
  return globalThis.__sql;
}
