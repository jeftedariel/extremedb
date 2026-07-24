import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  getCategories,
  getCategoryTree,
  getRecent,
  listProducts,
  getProductDetail,
} from "./queries.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const app = express();

// Los datos cambian 2 veces al día → el CDN de Vercel puede servir casi todo:
// 1h fresco + hasta 24h stale mientras revalida.
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  next();
});

/** Envuelve un handler async: errores → 500 JSON (y log para Vercel). */
const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(`${req.method} ${req.originalUrl}:`, err);
    res.status(500).json({ error: "error interno" });
  }
};

app.get("/api/categories", wrap(async (_req, res) => {
  res.json(await getCategories());
}));

app.get("/api/categories/tree", wrap(async (_req, res) => {
  res.json(await getCategoryTree());
}));

app.get("/api/recent", wrap(async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  res.json({ items: await getRecent(limit) });
}));

app.get("/api/products", wrap(async (req, res) => {
  res.json(
    await listProducts({
      search: (req.query.search || "").trim(),
      category: (req.query.category || "").trim(),
      sort: (req.query.sort || "name").trim(),
      page: Math.max(1, parseInt(req.query.page) || 1),
      limit: Math.min(60, Math.max(1, parseInt(req.query.limit) || 24)),
    })
  );
}));

app.get("/api/products/:id", wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "id inválido" });
  }
  const detail = await getProductDetail(id);
  if (!detail) return res.status(404).json({ error: "no encontrado" });
  res.json(detail);
}));

/* ---------- static (solo dev local; en Vercel lo sirve el CDN) ---------- */
app.use(express.static(join(__dirname, "..", "public")));
