import Link from "next/link";
import type { Product } from "@/lib/types";
import { discountPct, fmtDate, money } from "@/lib/format";
import ProductImage from "./ProductImage";

interface Props {
  product: Product;
  showUpdated: boolean;
}

export default function ProductCard({ product: p, showUpdated }: Props) {
  const off = discountPct(p.price, p.regularPrice, p.onSale);

  return (
    <Link
      href={`/p/${p.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-line bg-white text-center transition-[box-shadow,transform] duration-150 hover:-translate-y-[3px] hover:border-transparent hover:shadow-card"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        <ProductImage
          src={p.thumbnail}
          alt={p.name}
          sizes="(max-width: 780px) 45vw, (max-width: 1280px) 30vw, 220px"
        />
      </div>
      <div className="flex flex-1 flex-col items-center gap-1 p-2 md:gap-[6px] md:p-3">
        {p.brand && (
          <div className="text-[10px] font-semibold uppercase tracking-[0.5px] text-muted md:text-[11px]">
            {p.brand}
          </div>
        )}
        <div className="h-[4.2em] overflow-hidden text-[12.5px] font-semibold capitalize leading-[1.4] text-ink md:text-sm">
          {p.name}
        </div>
        <div className="mt-auto flex flex-wrap items-baseline justify-center gap-1.5 md:gap-2">
          <span className="text-sm font-semibold text-accent md:text-[15px]">{money(p.price)}</span>
          {off > 0 && (
            <>
              <span className="text-[11px] font-normal text-[#bbb] line-through md:text-[12.5px]">
                {money(p.regularPrice)}
              </span>
              <span className="rounded-[3px] bg-accent px-[6px] py-[3px] text-[10px] font-semibold uppercase tracking-[0.3px] text-white md:px-[9px] md:py-1 md:text-[11px]">
                -{off}%
              </span>
            </>
          )}
          {p.delisted ? (
            <span
              className="rounded-[3px] bg-ink-2 px-[6px] py-[3px] text-[10px] font-semibold uppercase tracking-[0.3px] text-white md:px-[9px] md:py-1 md:text-[11px]"
              title={`Ya no aparece en el catálogo de la tienda (visto por última vez: ${fmtDate(p.lastSeen)})`}
            >
              Descatalogado
            </span>
          ) : (
            !p.inStock && (
              <span className="rounded-[3px] bg-[#f0f0f0] px-[6px] py-[3px] text-[10px] font-semibold uppercase tracking-[0.3px] text-muted md:px-[9px] md:py-1 md:text-[11px]">
                Agotado
              </span>
            )
          )}
        </div>
        {showUpdated && p.updatedAt && (
          <div className="mt-1 text-[10px] font-normal text-muted md:text-[11px]">
            Actualizado: {fmtDate(p.updatedAt)}
          </div>
        )}
        {p.historyPoints != null && (
          <div className="mt-1 text-[10px] font-semibold text-ink-2 md:text-[11px]">
            📈 {p.historyPoints} {p.historyPoints === 1 ? "punto" : "puntos"} de historial
          </div>
        )}
      </div>
    </Link>
  );
}
