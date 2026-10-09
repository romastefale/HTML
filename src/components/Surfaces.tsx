import React, { useLayoutEffect, useRef } from "react";
import { FROST } from "../lib/optics";
import { Frost } from "./Frost";

/** A frosted reading panel (card, note, footer): frost-only glass (Frost.tsx). */
export const GlassPanel: React.FC<{
  className?: string;
  tint?: string;
  children: React.ReactNode;
}> = ({ className = "", tint = "tint-frost", children }) => (
  <Frost className={`glass ${tint} ${className}`} optics={FROST} style={{ display: "block", width: "100%" }}>
    {children}
  </Frost>
);

/** Glass caption floating over a photo (frost-only: it can be wide). */
export const GlassCaption: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = "", children }) => (
  <Frost className={`glass cap-pill tint-ink ${className}`} optics={FROST}>
    {children}
  </Frost>
);

/**
 * A photo as a responsive <picture>: AVIF, then WebP, at 480/720/1080/1440 px
 * (public/img/r/, made from the 1600 px originals), the original JPEG as the
 * fallback. `sizes` is the width the image is actually drawn at (object-fit:
 * cover can draw it wider than its box).
 */
export const WIDTHS = [480, 720, 1080, 1440];
export const Picture: React.FC<{
  name: string;
  alt: string;
  w: number;
  h: number;
  sizes: string;
  lazy?: boolean;
  /** The page's largest first-view image (LCP): fetched first. */
  priority?: boolean;
  className?: string;
  /** object-position (what stays in view when object-fit: cover crops). */
  position?: string;
}> = ({ name, alt, w, h, sizes, lazy, priority, className, position }) => {
  const set = (ext: string) => WIDTHS.map((x) => `${asset(`img/r/${name}-${x}.${ext}`)} ${x}w`).join(", ");
  // React sets an <img>'s src before the <img> is inside its <picture>, and
  // WebKit starts fetching that src at once: an eager photo downloaded the
  // 1600 px JPEG as well as the AVIF. So the fallback src is set here, after
  // the <source>s are in place (lazy images wait for layout anyway).
  const img = useRef<HTMLImageElement>(null);
  const jpg = asset(`img/${name}.jpg`);
  useLayoutEffect(() => {
    if (img.current && img.current.getAttribute("src") !== jpg) img.current.src = jpg;
  }, [jpg]);
  return (
    <picture>
      <source type="image/avif" srcSet={set("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={set("webp")} sizes={sizes} />
      <img
        className={className}
        style={position ? { objectPosition: position } : undefined}
        ref={img}
        alt={alt}
        width={w}
        height={h}
        loading={lazy ? "lazy" : undefined}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
      />
    </picture>
  );
};

export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export const HOME_URL = import.meta.env.BASE_URL;
