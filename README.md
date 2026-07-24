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
Vercel CDN   →  public/          frontend
Vercel Fn    →  api/index.js     API Express serverless
Supabase     →  Postgres         Base de datos
Cloudflare R2 → imágenes         Imagenes de productos
```

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar variables
npm start              # http://localhost:4000
```

| Variable | Descripción |
|---|---|
| `SUPABASE_DB_URL` | Connection string de Postgres |
| `R2_PUBLIC_BASE` | Base pública del bucket de imágenes, sin slash final |
| `PORT` | Opcional, por defecto `4000` |


## Estructura

```
api/index.js     # entrypoint de Vercel (exporta la app Express)
server.js        # entrypoint de desarrollo local
lib/             # cliente de DB, queries y rutas de la API
public/          # frontend: index.html, app.js (grid, filtros, gráfica), styles.css
```

## Nota sobre el histórico

La gráfica y las estadísticas se enriquecen con cada corrida del tracker: solo se guarda
un punto nuevo cuando el precio o el stock cambian. La recolección en producción comenzó
el **24 de julio de 2026**, los datos existen a partir de esa fecha.

## Aviso

Proyecto **independiente y sin afiliación** con ExtremeTech. Los nombres, datos e
imágenes de productos pertenecen a ExtremeTech y sus proveedores. Sitio oficial:
[extremetechcr.com](https://extremetechcr.com/).

## Licencia

El código de este repositorio está bajo licencia [MIT](LICENSE). Los datos e imágenes de
productos que el sitio muestra **no** están cubiertos por esta licencia.
