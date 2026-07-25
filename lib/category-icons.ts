/**
 * Iconos de categoría tomados del sitio oficial extremetechcr.com,
 * guardados en public/assets/cat-icons/ con el slug como nombre de archivo.
 * Son monocromos sobre fondo transparente (vienen en negro, rojo o blanco
 * según de dónde los usa el sitio), así que en la UI se normalizan con
 * filtros CSS (brightness-0 / invert).
 */
const CATEGORY_ICONS: Record<string, string> = {
  "accesorios-celulares": "accesorios-celulares.png",
  "accesorios-perifericos-accesorios": "accesorios-perifericos-accesorios.png",
  adaptadores: "adaptadores.png",
  almacenamiento: "almacenamiento.png",
  audifonos: "audifonos.png",
  "audio-en-casa": "audio-en-casa.png",
  "audio-y-video": "audio-y-video.webp",
  automoviles: "automoviles.png",
  "cables-de-red": "cables-de-red.png",
  "cables-y-cargadores": "cables-y-cargadores.png",
  calculadoras: "calculadoras.png",
  camaras: "camaras.png",
  case: "case.png",
  celulares: "celulares.png",
  "celulares-relojes-y-tablets": "celulares-relojes-y-tablets.webp",
  componentes: "componentes.webp",
  computadoras: "computadoras.webp",
  "conectividad-y-redes": "conectividad-y-redes.webp",
  consolas: "consolas.png",
  "cuotas-cero-intereses": "cuotas-cero-intereses.webp",
  descuentos: "descuentos.svg",
  "descuentos-mundial": "descuentos-mundial.webp",
  drones: "drones.png",
  empresa: "empresa.webp",
  enfriamiento: "enfriamiento.png",
  "fuentes-de-poder": "fuentes-de-poder.png",
  "gaming-y-streaming": "gaming-y-streaming.webp",
  "hogar-y-smart-home": "hogar-y-smart-home.webp",
  impresoras: "impresoras.png",
  "internet-satelital": "internet-satelital.png",
  laptops: "laptops.png",
  limpieza: "limpieza.webp",
  "lluvia-de-descuentos": "lluvia-de-descuentos.webp",
  "memoria-ram": "memoria-ram.png",
  microfonos: "microfonos.png",
  monitores: "monitores.png",
  "ninos-y-ninas": "ninos-y-ninas.png",
  "otras-categorias": "otras-categorias.webp",
  parlantes: "parlantes.png",
  "pc-de-escritorio": "pc-de-escritorio.png",
  perifericos: "perifericos.png",
  "perifericos-gaming-y-streaming": "perifericos-gaming-y-streaming.png",
  "perifericos-y-accesorios": "perifericos-y-accesorios.webp",
  procesadores: "procesadores.png",
  "punto-de-venta": "punto-de-venta.png",
  "realidad-virtual": "realidad-virtual.png",
  relojes: "relojes.png",
  "routers-y-switches": "routers-y-switches.png",
  "sillas-y-escritorios": "sillas-y-escritorios.png",
  "sim-racing": "sim-racing.png",
  "smart-home": "smart-home.png",
  streaming: "streaming.png",
  tablets: "tablets.png",
  "tablets-de-dibujo": "tablets-de-dibujo.png",
  "tarjetas-de-video": "tarjetas-de-video.png",
  "tarjetas-madre": "tarjetas-madre.png",
  televisores: "televisores.png",
  "ups-y-energia": "ups-y-energia.png",
  "vigilancia-y-monitoreo": "vigilancia-y-monitoreo.png",
};

/** Ruta pública del icono de una categoría, o null si no tiene. */
export function categoryIconSrc(slug: string): string | null {
  const file = CATEGORY_ICONS[slug];
  return file ? `/assets/cat-icons/${file}` : null;
}
