import { cachedList, cachedTree } from "@/lib/cache";
import type { CategoryNode } from "@/lib/types";
import CategoryTree from "@/components/CategoryTree";
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-white px-[14px] py-[18px] max-md:max-h-[45vh] max-md:overflow-y-auto md:sticky md:top-[61px] md:h-[calc(100vh-61px)] md:overflow-y-auto md:border-b-0 md:border-r">
        <h3 className="mx-2 mb-3 mt-1 text-[13px] font-bold uppercase tracking-[1px] text-ink">
          Categorías
        </h3>
        <CategoryTree tree={tree} activeCategory={category} currentParams={currentParams} />
      </aside>

      <main className="min-w-0 px-[22px] pb-[60px] pt-[18px]">
        <ResultBar
          total={data.total}
          categoryName={category ? findName(category, tree) ?? category : undefined}
          search={search || undefined}
          currentParams={currentParams}
        />
        {data.items.length === 0 ? (
          <div className="p-10 text-center text-muted">
            Sin resultados. Prueba otra búsqueda o categoría.
          </div>
        ) : (
          <section className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
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
