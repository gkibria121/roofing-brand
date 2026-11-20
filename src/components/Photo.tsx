import Image, { type ImageProps } from "next/image";

/** next/image wrapper that skips the optimizer for SVG placeholders. */
export function Photo({ alt, ...props }: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  return <Image alt={alt} {...props} unoptimized={src.endsWith(".svg") || props.unoptimized} />;
}
