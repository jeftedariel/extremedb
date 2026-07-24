# ExtremeDatabase

Rastreador de precios (estilo [SteamDB](https://steamdb.info) / Keepa) del catálogo de
ExtremeTech CR: explora los productos y su **histórico de precios** con gráficas y
estadísticas.

**[→ Visitar el sitio](https://extremedb.mendozac.cr/)**

![demo](docs/demo.png)

Los datos y las imágenes los **recopila un scraper privado** que los publica
periódicamente — esta web únicamente expone la información recopilada.

## Features

- Catálogo completo con los **actualizados más recientemente** primero (orden por defecto).
- **Búsqueda** por nombre, marca o SKU.
- **Árbol de categorías** con conteos, como el del sitio oficial.
- Órdenes: precio ↑/↓, mayor descuento, A–Z.
- **Detalle por producto**: gráfica SVG del histórico de precio (sin dependencias),
  precio actual, mínimo y máximo históricos con sus fechas.
- El histórico solo registra **cambios reales** de precio o stock — cada punto de la
  gráfica es un cambio, no ruido.

## Cómo funciona

```
Vercel CDN   →  public/          frontend estático (HTML/CSS/JS vanilla, sin build)
Vercel Fn    →  api/index.js     API Express serverless, cacheada 1 h en el CDN
Supabase     →  Postgres         datos en solo lectura
Cloudflare R2 → imágenes         servidas desde dominio propio
```

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar variables
npm start              # http://localhost:4000
```

| Variable | Descripción |
|---|---|
| `SUPABASE_DB_URL` | Connection string de Postgres (pooler, apto para serverless) |
| `R2_PUBLIC_BASE` | Base pública del bucket de imágenes, sin slash final |
| `PORT` | Opcional, por defecto `4000` |

> Sin acceso a una base de datos con este esquema, el repo sirve como referencia de
> código: la fuente de datos es privada.

## Estructura

```
api/index.js     # entrypoint de Vercel (exporta la app Express)
server.js        # entrypoint de desarrollo local
lib/             # cliente de DB, queries y rutas de la API
public/          # frontend: index.html, app.js (grid, filtros, gráfica SVG), styles.css
```

## Nota sobre el histórico

La gráfica y las estadísticas se enriquecen con cada corrida del tracker: solo se guarda
un punto nuevo cuando el precio o el stock cambian. La recolección en producción comenzó
el **24 de julio de 2026** — los datos existen a partir de esa fecha.

## Aviso

Proyecto **independiente y sin afiliación** con ExtremeTech. Los nombres, datos e
imágenes de productos pertenecen a ExtremeTech y sus proveedores. Sitio oficial:
[extremetechcr.com](https://extremetechcr.com/).

## Licencia

El código de este repositorio está bajo licencia [MIT](LICENSE). Los datos e imágenes de
productos que el sitio muestra **no** están cubiertos por esta licencia.
