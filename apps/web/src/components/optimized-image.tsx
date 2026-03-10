"use client";

import Image from "next/image";
import { blurDataURL } from "@/lib/image-utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Drop-in replacement for `<img>` that uses `next/image`
 * with automatic blur placeholder and sizing.
 */
export function OptimizedImage({
  src,
  alt,
  fill = true,
  width,
  height,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
}: OptimizedImageProps) {
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        placeholder="blur"
        blurDataURL={blurDataURL()}
        priority={priority}
        unoptimized={src.startsWith("data:")}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 256}
      height={height ?? 256}
      className={className}
      sizes={sizes}
      placeholder="blur"
      blurDataURL={blurDataURL()}
      priority={priority}
      unoptimized={src.startsWith("data:")}
    />
  );
}
