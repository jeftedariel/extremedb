import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { FaGlobeAmericas } from "react-icons/fa";
import { SiDiscord, SiGithub } from "react-icons/si";
import { LOGO_SRC } from "@/lib/assets";
import SearchBox from "./SearchBox";
import SortSelect from "./SortSelect";

export default function Header() {
  return (
    <header
      className="z-20 flex flex-wrap items-center gap-x-5 gap-y-[10px] px-4 py-[10px] text-white bg-header bg-cover bg-center md:sticky md:top-0 md:px-[22px]"
      style={{ backgroundImage: "url(/assets/header-bg.webp)" }}
    >
      <Link href="/" className="order-1 flex items-center gap-[10px] whitespace-nowrap">
        <Image src={LOGO_SRC} alt="ExtremeTech" width={140} height={40} className="h-10 w-auto" priority />
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
          <SiGithub size={22} aria-hidden="true" />
        </a>
        <a
          href="https://discord.gg/dDgvnNUJg2"
          target="_blank"
          rel="noopener"
          title="Únete al Discord"
          aria-label="Discord"
          className="flex items-center text-white/80 transition-colors hover:text-white"
        >
          <SiDiscord size={22} aria-hidden="true" />
        </a>
        <a
          href="https://mendozac.cr"
          target="_blank"
          rel="noopener"
          title="mendozac.cr"
          aria-label="Sitio web de Jefte"
          className="flex items-center text-white/80 transition-colors hover:text-white"
        >
          <FaGlobeAmericas size={22} aria-hidden="true" />
        </a>
      </nav>
    </header>
  );
}
