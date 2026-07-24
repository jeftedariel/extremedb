"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CategoryNode } from "@/lib/types";
import { buildHref } from "@/lib/format";

interface Props {
  tree: CategoryNode[];
  activeCategory: string;
  /** search/sort actuales, para preservarlos en los links. */
  currentParams: Record<string, string | undefined>;
}

/** Cadena de ancestros (slugs) hasta la categoría dada, o null. */
function findAncestors(slug: string, nodes: CategoryNode[], trail: string[] = []): string[] | null {
  for (const n of nodes) {
    if (n.slug === slug) return trail;
    const r = findAncestors(slug, n.children, [...trail, n.slug]);
    if (r) return r;
  }
  return null;
}

export default function CategoryTree({ tree, activeCategory, currentParams }: Props) {
  // La rama de la categoría activa arranca expandida.
  const initialExpanded = useMemo(() => {
    const set = new Set<string>();
    if (activeCategory) {
      for (const a of findAncestors(activeCategory, tree) ?? []) set.add(a);
      set.add(activeCategory);
    }
    return set;
  }, [activeCategory, tree]);
  const [extra, setExtra] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const isOpen = (slug: string) =>
    !collapsed.has(slug) && (initialExpanded.has(slug) || extra.has(slug));

  const toggle = (slug: string) => {
    if (isOpen(slug)) {
      setCollapsed((s) => new Set(s).add(slug));
      setExtra((s) => {
        const n = new Set(s);
        n.delete(slug);
        return n;
      });
    } else {
      setExtra((s) => new Set(s).add(slug));
      setCollapsed((s) => {
        const n = new Set(s);
        n.delete(slug);
        return n;
      });
    }
  };

  const row = (node: CategoryNode | null, depth: number) => {
    const slug = node?.slug ?? "";
    const active = node ? activeCategory === slug : !activeCategory;
    const hasKids = !!node && node.children.length > 0;
    const open = !!node && isOpen(slug);

    return (
      <div
        className={`flex items-center gap-1 rounded-lg py-[7px] pl-1 pr-2 text-[13.5px] ${
          active
            ? "bg-accent text-white"
            : "text-ink-2 hover:bg-soft hover:text-accent"
        }`}
      >
        {hasKids ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(slug);
            }}
            className={`w-[18px] flex-none cursor-pointer border-none bg-transparent p-0 text-xs transition-transform ${
              open ? "rotate-90" : ""
            } ${active ? "text-[#ffd7d9]" : "text-muted"}`}
            aria-label={open ? "Colapsar" : "Expandir"}
          >
            ▸
          </button>
        ) : (
          <span className="w-[18px] flex-none" />
        )}
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {node ? node.name : "Todas"}
        </span>
        {node && (
          <span className={`text-xs ${active ? "text-[#ffd7d9]" : "text-muted"}`}>
            {node.count}
          </span>
        )}
      </div>
    );
  };

  const renderNode = (node: CategoryNode, depth: number) => (
    <li key={node.slug}>
      <Link href={buildHref(currentParams, { category: node.slug })} className="block">
        {row(node, depth)}
      </Link>
      {node.children.length > 0 && isOpen(node.slug) && (
        <ul className="ml-[14px] list-none border-l border-line p-0 text-[13px]">
          {node.children.map((c) => renderNode(c, depth + 1))}
        </ul>
      )}
    </li>
  );

  return (
    <ul className="m-0 list-none p-0">
      <li>
        <Link href={buildHref(currentParams, { category: undefined })} className="block">
          {row(null, 0)}
        </Link>
      </li>
      {tree.map((n) => renderNode(n, 0))}
    </ul>
  );
}
