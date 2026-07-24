const fmt = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

export const money = (n: number | null | undefined): string =>
  n == null ? "—" : fmt.format(n);

export const fmtDate = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleDateString("es-CR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

/** % de descuento visible en cards/detalle (0 si no aplica). */
export const discountPct = (
  price: number | null,
  regularPrice: number | null,
  onSale: boolean
): number =>
  onSale && price != null && regularPrice != null && regularPrice > price
    ? Math.round((1 - price / regularPrice) * 100)
    : 0;

/** Query-string de la home preservando los params actuales, con overrides.
 *  Un override con valor vacío/undefined elimina el param. Cambiar filtros resetea page. */
export function buildHref(
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();
  const merged = { ...current, ...overrides };
  if (!("page" in overrides)) delete merged.page; // cambiar cualquier filtro resetea la página
  for (const key of ["search", "category", "sort", "page"]) {
    const v = merged[key];
    if (v) params.set(key, v);
  }
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
