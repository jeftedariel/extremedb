"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
}

/** next/image con paridad del `onerror → invisible` del sitio anterior. */
export default function ProductImage({ src, alt, sizes, priority }: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="h-full w-full bg-white" />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className="object-contain"
      onError={() => setFailed(true)}
    />
  );
}
