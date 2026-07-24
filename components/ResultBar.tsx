import Link from "next/link";
import { buildHref } from "@/lib/format";

interface Props {
  total: number;
  categoryName?: string;
  search?: string;
  currentParams: Record<string, string | undefined>;
}

function Chip({ label, href }: { label: string; href: string }) {
  return (
    <span className="rounded-full border border-line bg-card-2 px-[10px] py-1 text-[13px] text-ink-2">
      {label}
      <Link href={href} title="quitar" className="ml-1 text-sm text-accent">
        ✕
      </Link>
    </span>
  );
}

export default function ResultBar({ total, categoryName, search, currentParams }: Props) {
  return (
    <div className="mb-[14px] flex flex-wrap items-center gap-[10px] text-sm text-muted">
      <span>{total.toLocaleString("es-CR")} productos</span>
      {categoryName && (
        <Chip label={categoryName} href={buildHref(currentParams, { category: undefined })} />
      )}
      {search && (
        <Chip label={`“${search}”`} href={buildHref(currentParams, { search: undefined })} />
      )}
    </div>
  );
}
