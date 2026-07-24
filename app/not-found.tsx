import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-16 text-center">
      <h1 className="mb-2 text-xl font-bold text-ink">Producto no encontrado</h1>
      <p className="mb-6 text-sm text-muted">
        Puede que haya salido del catálogo o que el enlace sea incorrecto.
      </p>
      <Link
        href="/"
        className="rounded-full bg-accent px-[18px] py-[9px] text-[13px] font-semibold uppercase text-white hover:bg-accent-dark"
      >
        Volver al catálogo
      </Link>
    </div>
  );
}
