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
      <div className="flex flex-1 flex-col items-center gap-[6px] p-3">
        {p.brand && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
            {p.brand}
          </div>
        )}
        <div className="h-[4.2em] overflow-hidden text-sm font-semibold capitalize leading-[1.4] text-ink">
          {p.name}
        </div>
        <div className="mt-auto flex flex-wrap items-baseline justify-center gap-2">
          <span className="text-[15px] font-semibold text-accent">{money(p.price)}</span>
          {off > 0 && (
            <>
              <span className="text-[12.5px] font-normal text-[#bbb] line-through">
                {money(p.regularPrice)}
              </span>
              <span className="rounded-[3px] bg-accent px-[9px] py-1 text-[11px] font-semibold uppercase tracking-[0.3px] text-white">
                -{off}%
              </span>
            </>
          )}
          {!p.inStock && (
            <span className="rounded-[3px] bg-[#f0f0f0] px-[9px] py-1 text-[11px] font-semibold uppercase tracking-[0.3px] text-muted">
              Agotado
            </span>
          )}
        </div>
        {showUpdated && p.updatedAt && (
          <div className="mt-1 text-[11px] font-normal text-muted">
            Actualizado: {fmtDate(p.updatedAt)}
          </div>
        )}
      </div>
    </Link>
  );
}
