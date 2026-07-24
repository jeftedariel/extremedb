import Link from "next/link";
import { buildHref } from "@/lib/format";

interface Props {
  page: number;
  pages: number;
  currentParams: Record<string, string | undefined>;
}

const btn =
  "rounded-full bg-accent px-[18px] py-[9px] text-[13px] font-semibold uppercase text-white hover:bg-accent-dark";
const btnOff =
  "rounded-full bg-accent px-[18px] py-[9px] text-[13px] font-semibold uppercase text-white opacity-35";

export default function Pager({ page, pages, currentParams }: Props) {
  if (pages <= 1) return null;
  const href = (p: number) => buildHref(currentParams, { page: String(p) });

  return (
    <div className="mt-7 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={btn}>
          ‹ Anterior
        </Link>
      ) : (
        <span className={btnOff}>‹ Anterior</span>
      )}
      <span className="text-sm text-muted">
        Página {page} de {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className={btn}>
          Siguiente ›
        </Link>
      ) : (
        <span className={btnOff}>Siguiente ›</span>
      )}
    </div>
  );
}
