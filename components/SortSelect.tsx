"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const OPTIONS = [
  { value: "updated", label: "Actualizados recientemente" },
  { value: "activity", label: "Mayor historial" },
  { value: "name", label: "Nombre (A–Z)" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "discount", label: "Mayor descuento" },
];

/** Selector de orden; escribe `sort` en la URL (resetea page). */
export default function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "updated") params.delete("sort"); // default limpio en la URL
    else params.set("sort", value);
    params.delete("page");
    startTransition(() => {
      router.replace(params.size ? `/?${params}` : "/", { scroll: false });
    });
  };

  return (
    <select
      value={searchParams.get("sort") ?? "updated"}
      onChange={(e) => onChange(e.target.value)}
      className="order-4 w-full cursor-pointer rounded-full border-none bg-white px-3 py-[10px] text-[13px] font-semibold text-[#444] outline-none ring-1 ring-[#eee] md:order-3 md:w-auto"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
