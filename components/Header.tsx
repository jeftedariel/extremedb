import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import SearchBox from "./SearchBox";
import SortSelect from "./SortSelect";

export default function Header() {
  return (
    <header
      className="z-20 flex flex-wrap items-center gap-x-5 gap-y-[10px] px-4 py-[10px] text-white bg-header bg-cover bg-center md:sticky md:top-0 md:px-[22px]"
      style={{ backgroundImage: "url(/assets/header-bg.webp)" }}
    >
      <Link href="/" className="order-1 flex items-center gap-[10px] whitespace-nowrap">
        <Image src="/assets/logo.png" alt="ExtremeTech" width={140} height={40} className="h-10 w-auto" priority />
        <span className="text-[11px] font-semibold uppercase tracking-[1px] text-white/75">
          Price Tracker
        </span>
      </Link>

      <Suspense>
        <SearchBox />
      </Suspense>
      <Suspense>
        <SortSelect />
      </Suspense>

      <nav className="order-2 ml-auto flex items-center gap-[14px] md:order-4 md:ml-0">
        <a
          href="https://github.com/jeftedariel/extremedb"
          target="_blank"
          rel="noopener"
          title="Código en GitHub"
          aria-label="GitHub"
          className="flex items-center text-white/80 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 16 16" width="22" height="22" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
        </a>
        <a
          href="https://mendozac.cr"
          target="_blank"
          rel="noopener"
          title="mendozac.cr"
          aria-label="Sitio web de Jefte"
          className="flex items-center text-white/80 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="9.2" />
            <path d="M2.8 12h18.4M12 2.8c2.6 2.5 3.9 5.7 3.9 9.2s-1.3 6.7-3.9 9.2c-2.6-2.5-3.9-5.7-3.9-9.2s1.3-6.7 3.9-9.2Z" />
          </svg>
        </a>
      </nav>
    </header>
  );
}
