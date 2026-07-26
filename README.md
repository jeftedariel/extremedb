# ExtremeDatabase

Rastreador de precios (estilo [SteamDB](https://steamdb.info)) del catálogo de
ExtremeTech, muestra sus productos y su histórico de precios con gráficas y
estadísticas.

**[Visitar el sitio](https://extremedb.mendozac.cr/)**

![demo](docs/demo.png)

Los datos y las imágenes los **recopila un scraper** que los publica
periódicamente, esta web únicamente expone la información recopilada.



## Cómo funciona

```
Next.js 15 (App Router, TypeScript, Tailwind v4) desplegado en Vercel
  Server Components → consultan Postgres directo (cache de datos 1 h)
  /                 → catálogo SSR: búsqueda, categorías, orden y paginación en la URL
  /p/[id]           → detalle SSR por producto con metadata OG y gráfica de histórico
Supabase      → Postgres         Base de datos (solo lectura)
Cloudflare R2 → imágenes         Imágenes de productos (via next/image)
```

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar variables
npm run dev            # http://localhost:3000
```

| Variable | Descripción |
|---|---|
| `SUPABASE_DB_URL` | Connection string de Postgres (pooler, apto para serverless) |
| `R2_PUBLIC_BASE` | Base pública del bucket de imágenes, sin slash final |
| `REVALIDATE_SECRET` | Secret del endpoint `POST /api/revalidate` (invalidación de cache) |
| `API_TOKENS` | *(opcional)* Tokens del API que saltan el rate limit, separados por coma |
| `API_RATE_LIMIT` | *(opcional)* Requests/minuto por IP sin token (default `60`) |


## API pública

API REST de solo lectura en `/api/v1` (JSON, CORS abierto). No requiere
autenticación: sin token hay un límite de 60 req/min por IP;
con un token de `API_TOKENS` no hay límite.

| Endpoint | Descripción |
|---|---|
| `GET /api/v1/products` | Listado. Parámetros: `search`, `category` (slug), `sort` (`updated`\|`name`\|`price`\|`discount`\|`activity`), `dir` (`asc`\|`desc`), `page`, `limit` (máx. 100) |
| `GET /api/v1/products/:id` | Detalle: producto + histórico de precios + estadísticas |
| `GET /api/v1/categories` | Árbol de categorías con conteo de productos |


## Estructura

```
app/             # rutas: page.tsx (catálogo), p/[id] (detalle), sitemap, robots
components/      # Header, SearchBox, CategoryTree, ProductCard, PriceChart, …
lib/             # db (postgres.js), queries, cache (1 h), format, types
public/assets/   # logo, favicon, textura del header
```

## Nota sobre el histórico

La gráfica y las estadísticas incrementan con cada run del tracker: solo se guarda
un punto nuevo cuando el precio o el stock cambian. La recolección en producción comenzó
el **24 de julio de 2026**, los datos existen a partir de esa fecha.

Nota: Se incluyeron datos legacy scrapeados desde Wayback Machine de un periodo de 2016 a 2025.

## Aviso

Proyecto **independiente y sin afiliación** con ExtremeTech. Los nombres, datos e
imágenes de productos pertenecen a ExtremeTech y sus proveedores. Sitio oficial:
[extremetechcr.com](https://extremetechcr.com/).

## Licencia

El código de este repositorio está bajo licencia [MIT](LICENSE). Los datos e imágenes de
productos que el sitio muestra **no** están cubiertos por esta licencia.
