# ExtremeTech Viewer (demo)

Landing web para explorar el catálogo de ExtremeTech y el **histórico de precios** que
recolecta el [tracker](../extremetech-tracker). Lee la base de datos SQLite del tracker
(una copia vive en `data/extremetech.db`).

![demo](docs/preview.png)

## Qué incluye

- **Landing** con grid de productos (imagen, precio, descuento, stock).
- **Buscador** por nombre, marca o SKU (con debounce).
- **Filtro por categorías** (como el sitio oficial) con conteos.
- **Orden**: nombre, precio ↑/↓, mayor descuento.
- **Vista de detalle** por producto con:
  - **Gráfica de histórico de precio** (SVG propia, interactiva, sin dependencias).
  - **Estadísticas**: precio actual, **más bajo** y cuándo, **más alto** y cuándo, promedio.
  - Categorías, SKU y enlace a la tienda oficial.

## Cómo correr

```bash
npm install
npm start          # http://localhost:4000
# opcional: PORT=8080 npm start
```

La DB se lee de `data/extremetech.db`. Para usar una más fresca, copia la del tracker:

```bash
cp ../extremetech-tracker/data/extremetech.db data/extremetech.db
```

## Imágenes (proxy bajo demanda)

Las imágenes de ExtremeTech están **detrás de Cloudflare** (403 a peticiones directas) y su
cookie es `SameSite=Lax`, así que **no se pueden hotlinkear** desde otro origen — por eso en
la DB guardamos solo los **enlaces**, no los archivos.

Para mostrarlas sin descargar todo el catálogo, el servidor expone `GET /img?u=<url>` que:

1. Trae la imagen a través del **Chrome real** (por CDP en `127.0.0.1:9222`, el mismo que
   usa el tracker y que ya pasó Cloudflare).
2. La **cachea en memoria** (LRU, sin tocar disco → no gasta espacio).

Solo se descargan las imágenes que realmente ves. **Requiere que ese Chrome esté corriendo**
(lo levanta el tracker con `npm run scrape`, o lánzalo tú con el puerto `--remote-debugging-port=9222`).
Si no está disponible, la web funciona igual pero muestra un placeholder en lugar de la imagen.

> `CDP_URL` permite apuntar a otro endpoint (por defecto `http://127.0.0.1:9222`).

## Nota sobre el histórico

Ahora mismo cada producto tiene 1 punto de precio (recién empezamos a recolectar). La gráfica
y las estadísticas se irán enriqueciendo conforme el tracker corra a diario y detecte cambios
(guarda un punto nuevo solo cuando el precio o el stock cambian).

## Estructura

```
server.js        # Express: API (/api/products, /api/categories, /api/products/:id) + /img
imgproxy.js      # proxy de imágenes vía CDP con caché en memoria
public/
├── index.html   # estructura
├── styles.css   # tema oscuro estilo tienda tech
└── app.js       # lógica: grid, búsqueda, filtros, detalle + gráfica SVG
data/
└── extremetech.db  # copia de la DB del tracker
```
