"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Recuerda la última vista del catálogo (filtros/orden/página) para "Volver al catálogo". */
export default function CatalogStateSaver() {
  const searchParams = useSearchParams();
  useEffect(() => {
    try {
      sessionStorage.setItem("catalog:qs", searchParams.toString());
    } catch {
      // sessionStorage no disponible — sin memoria de estado, sin romper nada
    }
  }, [searchParams]);
  return null;
}
