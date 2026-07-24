import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://extremedb.mendozac.cr"),
  title: {
    default: "ExtremeDatabase · Rastreador de Precios de ExtremeTech",
    template: "%s · ExtremeDatabase",
  },
  description:
    "Explora el catálogo de ExtremeTech CR con histórico de precios, gráficas y estadísticas por producto.",
  icons: { icon: "/assets/favicon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={montserrat.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
