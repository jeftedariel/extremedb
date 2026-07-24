import { app } from "./lib/app.js";
import { sql } from "./lib/db.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  console.log(`\nExtremeTech Viewer  →  http://localhost:${PORT}`);
  try {
    const [{ n }] = await sql`SELECT COUNT(*)::int n FROM products`;
    console.log(`DB: Supabase (${n} productos)\n`);
  } catch (err) {
    console.error("No se pudo consultar Supabase:", err.message);
  }
});
