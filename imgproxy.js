import { chromium } from "playwright-core";

/**
 * Proxy de imágenes bajo demanda.
 *
 * Las imágenes de ExtremeTech están detrás de Cloudflare (403 a peticiones directas) y la
 * cookie cf_clearance es SameSite=Lax, así que no se pueden "hotlinkear" desde otro origen.
 * Este proxy las trae a través del Chrome real (por CDP, el mismo que usa el tracker), que
 * ya tiene sesión válida, y las cachea EN MEMORIA (no en disco → no gasta espacio).
 * Solo se descargan las imágenes que el usuario realmente ve.
 */

const CDP_URL = process.env.CDP_URL || "http://127.0.0.1:9222";
const MAX_CACHE = 400; // nº de imágenes en memoria (LRU simple)
const cache = new Map(); // url -> { buf: Buffer, type: string }

let browserPromise = null;
let sitePagePromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium
      .connectOverCDP(CDP_URL, { timeout: 5000 })
      .catch((e) => {
        browserPromise = null;
        throw e;
      });
  }
  return browserPromise;
}

/** Una pestaña ubicada en el sitio (misma sesión/cookies) desde la cual hacer fetch. */
async function getSitePage() {
  if (!sitePagePromise) {
    sitePagePromise = (async () => {
      const browser = await getBrowser();
      const ctx = browser.contexts()[0] || (await browser.newContext());
      let page =
        ctx.pages().find((p) => p.url().includes("extremetechcr.com")) || null;
      if (!page) {
        page = await ctx.newPage();
        await page.goto("https://extremetechcr.com/", {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
      }
      return page;
    })().catch((e) => {
      sitePagePromise = null;
      throw e;
    });
  }
  return sitePagePromise;
}

function remember(url, entry) {
  cache.set(url, entry);
  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value; // Map conserva orden de inserción
    cache.delete(oldest);
  }
}

/** Trae una imagen (con caché). Devuelve { buf, type } o lanza. */
async function fetchImage(url) {
  const hit = cache.get(url);
  if (hit) {
    // refresca el orden LRU
    cache.delete(url);
    cache.set(url, hit);
    return hit;
  }

  const page = await getSitePage();
  const result = await page.evaluate(async (u) => {
    const r = await fetch(u, { credentials: "include" });
    if (!r.ok) return { ok: false, status: r.status };
    const blob = await r.blob();
    const dataUrl = await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(blob);
    });
    return { ok: true, dataUrl, type: blob.type };
  }, url);

  if (!result.ok) throw new Error(`upstream ${result.status}`);
  const base64 = String(result.dataUrl).split(",")[1] || "";
  const entry = { buf: Buffer.from(base64, "base64"), type: result.type || "image/jpeg" };
  remember(url, entry);
  return entry;
}

/** Handler Express: GET /img?u=<url absoluta de extremetechcr.com> */
export async function imageProxy(req, res) {
  const url = req.query.u;
  if (!url || !/^https:\/\/([a-z0-9-]+\.)*extremetechcr\.com\//i.test(url)) {
    return res.status(400).send("url inválida");
  }
  try {
    const { buf, type } = await fetchImage(url);
    res.set("Content-Type", type);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(buf);
  } catch (e) {
    // Si Chrome no está disponible o Cloudflare bloquea, respondemos 502 (el <img> hará su
    // onerror y mostrará el placeholder).
    res.status(502).send("no disponible");
  }
}
