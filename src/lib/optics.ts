import type { GlassOptics } from "@samasante/liquid-glass";
import { frost, saturate } from "./vidro";

/** No library light at all, for every <Glass> on the site.
 *  • `specular: 0` turns the edge layer off: the material <Glass> always draws a
 *    brighter 1px top highlight on top of the all-round rim (src/GlassMaterial.tsx
 *    in the fork, `edgeShadow`), and `specular` is its only knob. The hairline is
 *    one uniform line drawn by `.glass::after` instead (src/styles/global.css).
 *  • `sheen: 0, glow: 0`: `specular` is also the gain of the sheen and glow in
 *    the filter, so at 0 they add nothing, but the library only SKIPS their two
 *    primitives (feColorMatrix + feComposite, per frame) when both are 0
 *    (`hasSpecular = glow > 0 || sheen > 0`, src/Glass.tsx and GlassMaterial.tsx).
 *    Same pixels, less filter work (docs/DESEMPENHO.md P2). */
export const NO_SHINE: Partial<GlassOptics> = { specular: 0, sheen: 0, glow: 0 };

/** Content-sized controls (buttons, the search step pill): the library's
 *  default material look (bends the live page in Chrome/Edge). The frost half
 *  is the bar's pair. */
export const CONTROL: Partial<GlassOptics> = { ...NO_SHINE, frost, saturate };

/** Frost-only glass, the bar's pair: `blur(frost) saturate(saturate)` from
 *  vidro.ini, without `backdrop-filter: url()`. Menu, tab bar, chips, captions,
 *  cards, notes and the sheet. */
export const FROST: Partial<GlassOptics> = { ...NO_SHINE, strength: 0, dispersion: 0, frost, saturate };
