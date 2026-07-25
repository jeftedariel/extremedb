"use client";

import { useEffect, useState } from "react";
import type { CategoryNode } from "@/lib/types";
import CategoryTree from "./CategoryTree";

interface Props {
  tree: CategoryNode[];
  activeCategory: string;
  activeCategoryName?: string;
  currentParams: Record<string, string | undefined>;
}

/** Sidebar de categorías: fijo en desktop, acordeón colapsable en mobile. */
export default function Sidebar({ tree, activeCategory, activeCategoryName, currentParams }: Props) {
  const [open, setOpen] = useState(false);

  // Al elegir una categoría en mobile, el acordeón se cierra para mostrar los resultados.
  useEffect(() => {
    setOpen(false);
  }, [activeCategory]);

  return (
    <aside className="border-b border-line bg-white px-[14px] py-3 md:sticky md:top-[61px] md:h-[calc(100vh-61px)] md:overflow-y-auto md:border-b-0 md:border-r md:py-[18px]">
      {/* Toggle solo visible en mobile */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-line bg-soft px-3 py-[10px] text-[13px] font-bold uppercase tracking-[1px] text-ink md:hidden"
        aria-expanded={open}
      >
        <span className="truncate">
          Categorías
          {activeCategoryName && (
            <span className="ml-2 font-semibold normal-case tracking-normal text-accent">
              · {activeCategoryName}
            </span>
          )}
        </span>
        <span className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      <h3 className="mx-2 mb-3 mt-1 hidden text-[13px] font-bold uppercase tracking-[1px] text-ink md:block">
        Categorías
      </h3>

      <div
        className={`${open ? "mt-3 max-h-[60vh] overflow-y-auto" : "hidden"} md:mt-0 md:block md:max-h-none md:overflow-visible`}
      >
        <CategoryTree tree={tree} activeCategory={activeCategory} currentParams={currentParams} />
      </div>
    </aside>
  );
}
