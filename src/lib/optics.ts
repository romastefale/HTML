import type { GlassOptics } from "@samasante/liquid-glass";
import { frost, otica, saturate } from "./vidro";

/** [brilho] in vidro.ini. */
export const NO_SHINE: Partial<GlassOptics> = otica();

/** Content-sized controls. The frost half is [vidro]; the bend stays the library's. */
export const CONTROL: Partial<GlassOptics> = { ...NO_SHINE, frost, saturate };

/** Frost-only glass: [vidro] plus [fosco], no displacement lens. */
export const FROST: Partial<GlassOptics> = { ...otica("fosco"), frost, saturate };
