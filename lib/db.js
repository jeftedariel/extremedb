import postgres from "postgres";

/**
 * Conexión a Supabase (Postgres) vía postgres.js.
 *
 * En Vercel se usa la connection string del Transaction Pooler (puerto 6543), que no
 * soporta prepared statements → prepare: false. max: 1 porque cada instancia serverless
 * atiende una request a la vez.
 *
 * Tipos: numeric e int8 llegan como string por defecto; los parseamos a Number
 * (precios e ids caben de sobra en un double).
 */
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  throw new Error(
    "Falta SUPABASE_DB_URL (connection string del Transaction Pooler de Supabase)."
  );
}

export const sql = postgres(url, {
  prepare: false,
  max: 1,
  types: {
    numeric: { to: 1700, from: [1700], serialize: (x) => String(x), parse: Number },
    int8: { to: 20, from: [20], serialize: (x) => String(x), parse: Number },
  },
});
