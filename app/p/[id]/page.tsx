import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaExternalLinkAlt } from "react-icons/fa";
import { cachedDetail } from "@/lib/cache";
import { discountPct, fmtDate, money } from "@/lib/format";
import BackLink from "@/components/BackLink";
import PriceChart from "@/components/PriceChart";
import ProductImage from "@/components/ProductImage";

type Params = { params: Promise<{ id: string }> };

async function detailFromParams({ params }: Params) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return cachedDetail(id);
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const detail = await detailFromParams(props);
  if (!detail) return {};
  const { product: p, stats } = detail;
  return {
    title: p.name,
    description: `Precio actual ${money(p.price)}${
      stats ? `. Mínimo histórico ${money(stats.min.price)} (${fmtDate(stats.min.date)})` : ""
    }. Histórico de precios de ${p.name} en ExtremeTech.`,
    openGraph: { images: p.image ? [p.image] : [] },
  };
}

export default async function ProductPage(props: Params) {
  const detail = await detailFromParams(props);
  if (!detail) notFound();
  const { product: p, history, stats } = detail;
  const off = discountPct(p.price, p.regularPrice, p.onSale);

  return (
    <div className="mx-auto w-full max-w-[920px] px-3 pb-14 pt-4 md:px-4 md:pt-6">
      <BackLink />

      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-white md:mt-4">
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[280px_1fr] md:gap-[22px] md:p-[22px]">
          <div className="relative mx-auto flex aspect-square w-full max-w-[260px] items-center justify-center overflow-hidden rounded-[10px] border border-line bg-white md:max-w-none">
            <ProductImage src={p.image} alt={p.name} sizes="(max-width: 780px) 70vw, 280px" priority />
          </div>
          <div className="max-md:text-center">
            {p.brand && (
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.5px] text-muted md:mb-[10px] md:text-[13px]">
                {p.brand}
              </div>
            )}
            <h1 className="mb-2 text-[16px] font-bold leading-[1.35] text-ink md:mb-[6px] md:text-[19px]">
              {p.name}
            </h1>
            <div className="flex flex-wrap items-baseline gap-2 max-md:justify-center">
              <span className="text-xl font-extrabold text-accent md:text-2xl">{money(p.price)}</span>
              {off > 0 && (
                <>
                  <span className="text-[12.5px] text-[#bbb] line-through">{money(p.regularPrice)}</span>
                  <span className="rounded-[3px] bg-accent px-[9px] py-1 text-[11px] font-semibold uppercase text-white">
                    -{off}%
                  </span>
                </>
              )}
              {p.delisted ? (
                <span className="rounded-[3px] bg-ink-2 px-[9px] py-1 text-[11px] font-semibold uppercase text-white">
                  Descatalogado
                </span>
              ) : p.inStock ? (
                <span className="rounded-[3px] bg-green-ok/12 px-[9px] py-1 text-[11px] font-semibold uppercase text-green-ok">
                  En stock
                </span>
              ) : (
                <span className="rounded-[3px] bg-[#f0f0f0] px-[9px] py-1 text-[11px] font-semibold uppercase text-muted">
                  Agotado
                </span>
              )}
            </div>
            {p.delisted && (
              <div className="mt-2 rounded-lg border border-line bg-soft px-3 py-2 text-xs text-ink-2 max-md:text-center">
                Este producto ya no aparece en el catálogo de ExtremeTech — visto por última
                vez el {fmtDate(p.lastSeen)}. Su histórico se conserva aquí.
              </div>
            )}
            {p.categories.length > 0 && (
              <div className="my-[10px] flex flex-wrap gap-[6px] max-md:justify-center">
                {p.categories.map((c) => (
                  <span
                    key={c.slug}
                    className="rounded-full border border-line bg-soft px-[9px] py-[3px] text-xs text-ink-2"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}
            {p.sku && (
              <div className="mt-2 text-[13.5px] font-normal leading-normal text-ink-2">
                SKU: {p.sku}
              </div>
            )}
            <a
              href={p.permalink}
              target="_blank"
              rel="noopener"
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-[11px] text-center text-[13px] font-semibold uppercase tracking-[0.3px] text-white transition-colors hover:bg-accent-dark md:inline-flex md:py-[10px]"
            >
              Ver en ExtremeTech
              <FaExternalLinkAlt size={12} aria-hidden="true" />
            </a>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-2 px-4 pb-[6px] md:grid-cols-3 md:gap-3 md:px-[22px]">
            {(
              [
                ["Precio actual", stats.current, "text-accent"],
                ["Precio más bajo", stats.min, "text-green-ok"],
                ["Precio más alto", stats.max, "text-ink"],
              ] as const
            ).map(([label, s, cls], i) => (
              <div
                key={label}
                className={`rounded-[10px] border border-line bg-white p-3 ${
                  i === 2 ? "max-md:col-span-2" : ""
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.5px] text-muted md:text-[11px]">
                  {label}
                </div>
                <div className={`mt-1 text-base font-bold md:text-lg ${cls}`}>{money(s.price)}</div>
                <div className="mt-[3px] text-[11px] text-muted">{fmtDate(s.date)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 pb-[22px] pt-[18px] md:px-[22px]">
          <h2 className="mb-[6px] text-sm font-bold text-ink">Histórico de precio</h2>
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <PriceChart history={history} />
            </div>
          </div>
          <div className="mt-2 text-xs text-muted">
            {history.length <= 1
              ? "Solo hay un registro por ahora — el historial se irá llenando con cada corrida del tracker."
              : `${history.length} puntos registrados.`}
          </div>
        </div>

      </div>
    </div>
  );
}
