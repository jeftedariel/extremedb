import type { NextConfig } from "next";

// Host de las imágenes en R2; en Vercel el env está disponible en build.
const r2Host = process.env.R2_PUBLIC_BASE
  ? new URL(process.env.R2_PUBLIC_BASE).hostname
  : "media.extremedb.mendozac.cr";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: r2Host }],
  },
};

export default nextConfig;
