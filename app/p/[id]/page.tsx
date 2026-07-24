import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    <div className="mx-auto w-full max-w-[920px] px-4 pb-14 pt-6">
      <BackLink />

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
        <div className="grid grid-cols-1 gap-[22px] p-[22px] md:grid-cols-[280px_1fr]">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[10px] border border-line bg-white">
            <ProductImage src={p.image} alt={p.name} sizes="(max-width: 780px) 90vw, 280px" priority />
          </div>
          <div>
            {p.brand && (
              <div className="mb-[10px] text-[13px] font-semibold uppercase tracking-[0.5px] text-muted">
                {p.brand}
              </div>
            )}
            <h1 className="mb-[6px] text-[19px] font-bold leading-[1.35] text-ink">{p.name}</h1>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-extrabold text-accent">{money(p.price)}</span>
              {off > 0 && (
                <>
                  <span className="text-[12.5px] text-[#bbb] line-through">{money(p.regularPrice)}</span>
                  <span className="rounded-[3px] bg-accent px-[9px] py-1 text-[11px] font-semibold uppercase text-white">
                    -{off}%
                  </span>
                </>
              )}
              {p.inStock ? (
                <span className="rounded-[3px] bg-green-ok/12 px-[9px] py-1 text-[11px] font-semibold uppercase text-green-ok">
                  En stock
                </span>
              ) : (
                <span className="rounded-[3px] bg-[#f0f0f0] px-[9px] py-1 text-[11px] font-semibold uppercase text-muted">
                  Agotado
                </span>
              )}
            </div>
            {p.categories.length > 0 && (
              <div className="my-[10px] flex flex-wrap gap-[6px]">
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
              className="mt-4 inline-block rounded-full bg-accent px-5 py-[10px] text-[13px] font-semibold uppercase tracking-[0.3px] text-white transition-colors hover:bg-accent-dark"
            >
              Ver en ExtremeTech ↗
            </a>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-3 px-[22px] pb-[6px] md:grid-cols-3">
            {(
              [
                ["Precio actual", stats.current, "text-accent"],
                ["Precio más bajo", stats.min, "text-green-ok"],
                ["Precio más alto", stats.max, "text-ink"],
              ] as const
            ).map(([label, s, cls]) => (
              <div key={label} className="rounded-[10px] border border-line bg-white p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
                  {label}
                </div>
                <div className={`mt-1 text-lg font-bold ${cls}`}>{money(s.price)}</div>
                <div className="mt-[3px] text-[11px] text-muted">{fmtDate(s.date)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="px-[22px] pb-[22px] pt-[18px]">
          <h2 className="mb-[6px] text-sm font-bold text-ink">Histórico de precio</h2>
          <PriceChart history={history} />
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
