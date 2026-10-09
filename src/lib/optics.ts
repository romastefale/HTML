import type { GlassOptics } from "@samasante/liquid-glass";
import { vidro } from "./vidro";

const frost = vidro.paginas.optics.frost;

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
 *  default material look (bends the live page in Chrome/Edge). */
export const CONTROL: Partial<GlassOptics> = { ...NO_SHINE, frost };

/** Wide bars (the Painel tab bar, the Galeria chips) + caption pills: frost only. BROWSERS.md: "Very
 *  wide panels shouldn't use a single stretched displacement lens … use a
 *  frost-only treatment". Rendered by <Frost> (plain CSS, same look) rather
 *  than a material <Glass>: see src/components/Frost.tsx. */
export const FROST: Partial<GlassOptics> = { ...NO_SHINE, strength: 0, dispersion: 0, frost, saturate: 1.15 };

/** Reading panels (cards, notes, footer): frost only (<Frost>), stronger saturation. */
export const PANEL: Partial<GlassOptics> = { ...NO_SHINE, strength: 0, dispersion: 0, frost, saturate: 1.4 };
