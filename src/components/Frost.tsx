import React, { useLayoutEffect, useRef, useState, type Ref } from "react";
import type { GlassOptics } from "@samasante/liquid-glass";
import { frost, saturate } from "../lib/vidro";

/** The frost half of the library's material backdrop-filter (GlassMaterial.tsx
 *  `applyBackdropFilter`), without the Blink-only `url(#…)` displacement.
 *  Missing knobs fall back to `[vidro]` in vidro.ini, the same pair as the bar. */
const frostFilter = (optics: Partial<GlassOptics>) => {
  const blur = Math.max(0, optics.frost ?? frost);
  const sat = optics.saturate ?? saturate;
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
