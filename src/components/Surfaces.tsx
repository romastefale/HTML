import React from "react";
import { FROST, PANEL } from "../lib/optics";
import { Frost } from "./Frost";

/** A frosted reading panel (card, note, footer): frost-only glass (Frost.tsx). */
export const GlassPanel: React.FC<{
  className?: string;
  tint?: string;
  children: React.ReactNode;
}> = ({ className = "", tint = "tint-frost", children }) => (
  <Frost className={`glass ${tint} ${className}`} optics={PANEL} style={{ display: "block", width: "100%" }}>
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
const WIDTHS = [480, 720, 1080, 1440];
export const Picture: React.FC<{
  name: string;
  alt: string;
  w: number;
  h: number;
  sizes: string;
  lazy?: boolean;
}> = ({ name, alt, w, h, sizes, lazy }) => {
  const set = (ext: string) => WIDTHS.map((x) => `${asset(`img/r/${name}-${x}.${ext}`)} ${x}w`).join(", ");
  return (
    <picture>
      <source type="image/avif" srcSet={set("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={set("webp")} sizes={sizes} />
      <img src={asset(`img/${name}.jpg`)} alt={alt} width={w} height={h} loading={lazy ? "lazy" : undefined} decoding="async" />
    </picture>
  );
};

export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export const HOME_URL = import.meta.env.BASE_URL;
export const SAMPLE_URL = `${import.meta.env.BASE_URL}liquid-glass-sample.html`;
export const CREDITS_URL = `${import.meta.env.BASE_URL}img/CREDITS.md`;
