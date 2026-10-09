import React, { useLayoutEffect, useRef, useState, type Ref } from "react";
import type { GlassOptics } from "@samasante/liquid-glass";

/** The library's material defaults for the two knobs a frost-only surface uses
 *  (MATERIAL_OPTICS in the fork's src/GlassMaterial.tsx: frost 6px, saturate 1.15). */
const MATERIAL_FROST = 6;
const MATERIAL_SATURATE = 1.15;

/** The frost half of the library's material backdrop-filter (GlassMaterial.tsx
 *  `applyBackdropFilter`), without the Blink-only `url(#…)` displacement. */
const frostFilter = (optics: Partial<GlassOptics>) => {
  const blur = Math.max(0, optics.frost ?? MATERIAL_FROST);
  const sat = optics.saturate ?? MATERIAL_SATURATE;
  return [blur > 0 ? `blur(${blur}px)` : "", sat !== 1 ? `saturate(${sat})` : ""].filter(Boolean).join(" ") || "none";
};

/**
 * Frost-only glass, the treatment BROWSERS.md requires for a wide panel: the
 * cross-browser `blur()` + `saturate()` a material `<Glass>` paints when it does
 * not attach `backdrop-filter: url()`. The tint stays the element's own
 * background. No displacement map, no SVG backdrop filter.
 * `position: relative` is added only when the element is otherwise static, the
 * same rule as GlassMaterial: a fixed or absolute surface keeps its own position.
 */
export const Frost: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { optics: Partial<GlassOptics>; children?: React.ReactNode; ref?: Ref<HTMLDivElement> }
> = ({ optics, style, children, ref, ...rest }) => {
  const inner = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState(false);
  useLayoutEffect(() => {
    const el = inner.current;
    if (el && getComputedStyle(el).position === "static") setAnchor(true);
  }, []);
  const filter = frostFilter(optics);
  return (
    <div
      ref={(node) => {
        inner.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      data-frost=""
      {...rest}
      style={{
        ...(anchor ? { position: "relative" as const } : null),
        backdropFilter: filter,
        WebkitBackdropFilter: filter,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
