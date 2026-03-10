/**
 * Generates a tiny SVG-based blur placeholder for Next.js Image component.
 * Returns a base64-encoded data URI.
 */
export function blurDataURL(w = 8, h = 8): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><filter id="b" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1"/></filter><rect width="${w}" height="${h}" fill="#1a1a2e" filter="url(#b)"/></svg>`;
  return `data:image/svg+xml;base64,${typeof btoa !== "undefined" ? btoa(svg) : Buffer.from(svg).toString("base64")}`;
}
