"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

/** Buscador con debounce 250ms; escribe `search` en la URL (resetea page). */
export default function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = searchParams.get("search") ?? "";

  // Si la URL cambia por navegación externa (chip ✕, logo), refleja el valor.
  useEffect(() => {
    if (inputRef.current && inputRef.current.value.trim() !== current) {
      inputRef.current.value = current;
    }
  }, [current]);

  const onInput = (value: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const q = value.trim();
      if (q) params.set("search", q);
      else params.delete("search");
      params.delete("page");
      startTransition(() => {
        router.replace(params.size ? `/?${params}` : "/", { scroll: false });
      });
    }, 250);
  };

  return (
    <div className="flex-1">
      <input
        ref={inputRef}
        type="search"
        defaultValue={current}
        placeholder="Buscar producto, marca o SKU…"
        autoComplete="off"
        onChange={(e) => onInput(e.target.value)}
        className={`w-full rounded-full border-2 border-transparent bg-white px-6 py-[10px] text-sm text-[#444] outline-none ring-1 ring-[#eee] placeholder:text-[#a7a7a7] focus:border-accent focus:ring-0 ${
          isPending ? "opacity-80" : ""
        }`}
      />
    </div>
  );
}
