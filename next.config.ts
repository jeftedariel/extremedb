import type { NextConfig } from "next";

// Host de las imágenes derivado del env (presente en build tanto local como en Vercel).
// Sin R2_PUBLIC_BASE no se permite ningún host remoto para next/image.
const r2Host = process.env.R2_PUBLIC_BASE
  ? new URL(process.env.R2_PUBLIC_BASE).hostname
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2Host ? [{ protocol: "https", hostname: r2Host }] : [],
  },
};

export default nextConfig;
