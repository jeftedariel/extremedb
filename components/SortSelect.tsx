"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const OPTIONS = [
  { value: "updated", label: "Actualizados" },
  { value: "added", label: "Fecha de alta" },
  { value: "activity", label: "Actividad registrada" },
  { value: "price", label: "Precio" },
  { value: "discount", label: "Descuento" },
  { value: "name", label: "Nombre" },
];

/** Dirección natural de cada criterio (espejo de DEFAULT_DIR en lib/queries). */
const DEFAULT_DIR: Record<string, "asc" | "desc"> = {
  updated: "desc",
  added: "asc", // fecha de alta: del más viejo al más nuevo (espejo de lib/queries)
  activity: "desc",
  name: "asc",
  price: "asc",
  discount: "desc",
};

/** Normaliza también los valores legacy que puedan venir en URLs viejas. */
function currentSort(params: URLSearchParams): { key: string; dir: "asc" | "desc" } {
  const raw = params.get("sort") ?? "updated";
  if (raw === "price_asc") return { key: "price", dir: "asc" };
  if (raw === "price_desc") return { key: "price", dir: "desc" };
  const key = raw in DEFAULT_DIR ? raw : "updated";
  const d = params.get("dir");
  return { key, dir: d === "asc" || d === "desc" ? d : DEFAULT_DIR[key] };
}

/** Criterio de orden + botón de dirección asc/desc; ambos viven en la URL. */
export default function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const { key, dir } = currentSort(searchParams);

  const navigate = (mutate: (p: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    startTransition(() => {
      router.replace(params.size ? `/?${params}` : "/", { scroll: false });
    });
  };

  const onCriterion = (value: string) => {
    navigate((p) => {
      if (value === "updated") p.delete("sort"); // default limpio en la URL
      else p.set("sort", value);
      p.delete("dir"); // cada criterio arranca en su dirección natural
    });
  };

  const onToggleDir = () => {
    const next = dir === "asc" ? "desc" : "asc";
    navigate((p) => {
      // sort legacy en la URL → normalizar de paso
      if ((p.get("sort") ?? "").startsWith("price_")) p.set("sort", "price");
      if (next === DEFAULT_DIR[key]) p.delete("dir"); // default limpio en la URL
      else p.set("dir", next);
    });
  };

  return (
    <div className="order-4 flex w-full items-center gap-2 md:order-3 md:w-auto">
      <select
        value={key}
        onChange={(e) => onCriterion(e.target.value)}
        className="flex-1 cursor-pointer rounded-full border-none bg-white px-3 py-[10px] text-[13px] font-semibold text-[#444] outline-none ring-1 ring-[#eee] md:flex-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        onClick={onToggleDir}
        title={dir === "asc" ? "Ascendente (click para descendente)" : "Descendente (click para ascendente)"}
        aria-label={dir === "asc" ? "Orden ascendente" : "Orden descendente"}
        className="flex h-[38px] w-[38px] flex-none cursor-pointer items-center justify-center rounded-full border-none bg-white text-[15px] font-bold text-[#444] ring-1 ring-[#eee] transition-colors hover:bg-soft hover:text-accent"
      >
        {dir === "asc" ? "↑" : "↓"}
      </button>
    </div>
  );
}
