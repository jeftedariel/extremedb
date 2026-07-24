"use client";

import { useRouter } from "next/navigation";

/** Vuelve al catálogo restaurando los filtros/página con que se llegó. */
export default function BackLink() {
  const router = useRouter();
  const onClick = () => {
    let qs = "";
    try {
      qs = sessionStorage.getItem("catalog:qs") ?? "";
    } catch {
      // sin sessionStorage → home limpia
    }
    router.push(qs ? `/?${qs}` : "/");
  };
  return (
    <button
      onClick={onClick}
      className="cursor-pointer border-none bg-transparent p-0 font-sans text-[13px] font-semibold text-accent hover:underline"
    >
      ‹ Volver al catálogo
    </button>
  );
}
