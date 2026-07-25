import { Suspense } from "react";
import { cachedList, cachedTree } from "@/lib/cache";
import type { CategoryNode } from "@/lib/types";
import CatalogStateSaver from "@/components/CatalogStateSaver";
import Sidebar from "@/components/Sidebar";
import ProductCard from "@/components/ProductCard";
import ResultBar from "@/components/ResultBar";
import Pager from "@/components/Pager";

/** Nombre visible de la categoría activa (para el chip). */
function findName(slug: string, nodes: CategoryNode[]): string | null {
  for (const n of nodes) {
    if (n.slug === slug) return n.name;
    const r = findName(slug, n.children);
    if (r) return r;
  }
  return null;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const search = (sp.search ?? "").trim();
  const category = sp.category ?? "";
  const sort = sp.sort ?? "updated";
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const currentParams = { search, category, sort: sp.sort, page: sp.page };

  const [tree, data] = await Promise.all([
    cachedTree(),
    cachedList({ search, category, sort, page, limit: 24 }),
  ]);
  const categoryName = category ? findName(category, tree) ?? category : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <Suspense>
        <CatalogStateSaver />
      </Suspense>
      <Sidebar
        tree={tree}
        activeCategory={category}
        activeCategoryName={categoryName}
        currentParams={currentParams}
      />

      <main className="min-w-0 px-3 pb-[60px] pt-3 md:px-[22px] md:pt-[18px]">
        <ResultBar
          total={data.total}
          categoryName={categoryName}
          search={search || undefined}
          currentParams={currentParams}
        />
        {data.items.length === 0 ? (
          <div className="p-10 text-center text-muted">
            Sin resultados. Prueba otra búsqueda o categoría.
          </div>
        ) : (
          <section className="grid grid-cols-2 gap-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] md:gap-4">
            {data.items.map((p) => (
              <ProductCard key={p.id} product={p} showUpdated={sort === "updated"} />
            ))}
          </section>
        )}
        <Pager page={data.page} pages={data.pages} currentParams={currentParams} />
      </main>
    </div>
  );
}
