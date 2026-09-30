import React from "react";
import { Glass } from "@samasante/liquid-glass";
import { CONTROL } from "../lib/optics";
import { Frost } from "./Frost";

/** Blink only renders `backdrop-filter: url()` (the live bend); the same sniff
 *  as the library's useSupportsBackdropUrl (src/GlassMaterial.tsx). */
const isBlink = (() => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const hasUAData = (navigator as Navigator & { userAgentData?: unknown }).userAgentData != null;
  return (
    hasUAData ||
    (/\b(?:Chrome|Chromium|Edg)\//.test(ua) && !/\b(?:CriOS|EdgiOS|FxiOS|OPiOS)\b/.test(ua) && !/iPhone|iPad|iPod/.test(ua))
  );
})();

/**
 * A content-sized glass pill holding one button or link (the material default
 * look). In Chrome/Edge it's the library's material <Glass>, which bends the
 * live page behind it. Safari and Firefox can't render that bend, and there the
 * library paints frost + saturate only, while still building a displacement
 * map it never uses, so they get the identical CSS frost instead.
 */
export const GlassPill: React.FC<{ tint: string; children: React.ReactNode }> = ({ tint, children }) =>
  isBlink ? (
    <Glass className={`glass pill ${tint}`} optics={CONTROL}>
      {children}
    </Glass>
  ) : (
    <Frost className={`glass pill ${tint}`} optics={CONTROL} style={{ display: "inline-block" }}>
      {children}
    </Frost>
  );
