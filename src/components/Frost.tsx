import React from "react";
import type { GlassOptics } from "@samasante/liquid-glass";

/** The library's material defaults for the two knobs a frost-only surface uses
 *  (MATERIAL_OPTICS in the fork's src/GlassMaterial.tsx: frost 6px, saturate 1.15). */
const MATERIAL_FROST = 6;
const MATERIAL_SATURATE = 1.15;

export const frostFilter = (optics: Partial<GlassOptics>) => {
  const blur = Math.max(0, optics.frost ?? MATERIAL_FROST);
  const sat = optics.saturate ?? MATERIAL_SATURATE;
  return [blur > 0 ? `blur(${blur}px)` : "", sat !== 1 ? `saturate(${sat})` : ""].filter(Boolean).join(" ") || "none";
};

/**
 * A frost-only glass surface in plain CSS: exactly what a material <Glass>
 * with `strength: 0, dispersion: 0, specular: 0` paints (its backdrop-filter is
 * `blur() saturate()` + an SVG `url()` filter whose displacement scale is 0 and
 * whose sheen gain is 0, i.e. an identity pass; its edge layer is transparent).
 * Same look, none of the cost: no displacement map generated on the main thread
 * at mount (a ~110 KB PNG data URL per instance), no live SVG backdrop filter
 * re-rasterised on every scroll frame in Chromium, no ResizeObserver. The tint
 * stays the element's own background (className), the hairline .glass::after.
 */
export const Frost: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { optics: Partial<GlassOptics>; children?: React.ReactNode }
> = ({ optics, style, children, ...rest }) => {
  const filter = frostFilter(optics);
  return (
    <div
      data-frost=""
      {...rest}
      style={{ position: "relative", backdropFilter: filter, WebkitBackdropFilter: filter, ...style }}
    >
      {children}
    </div>
  );
};
