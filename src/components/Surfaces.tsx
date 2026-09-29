import React from "react";
import { Glass } from "@samasante/liquid-glass";
import { CONTROL, FROST, PANEL } from "../lib/optics";

/** A frosted reading panel (card, note, footer): a block-level material <Glass>. */
export const GlassPanel: React.FC<{
  className?: string;
  tint?: string;
  children: React.ReactNode;
}> = ({ className = "", tint = "tint-frost", children }) => (
  <Glass className={`glass ${tint} ${className}`} optics={PANEL} style={{ display: "block", width: "100%" }}>
    {children}
  </Glass>
);

/** A content-sized glass pill holding one button or link (the material default look). */
export const GlassPill: React.FC<{ tint: string; children: React.ReactNode }> = ({ tint, children }) => (
  <Glass className={`glass pill ${tint}`} optics={CONTROL}>
    {children}
  </Glass>
);

/** Glass caption floating over a photo (frost-only: it can be wide). */
export const GlassCaption: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = "", children }) => (
  <Glass className={`glass cap-pill tint-ink ${className}`} optics={FROST}>
    {children}
  </Glass>
);

export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export const HOME_URL = import.meta.env.BASE_URL;
export const SAMPLE_URL = `${import.meta.env.BASE_URL}liquid-glass-sample.html`;
export const CREDITS_URL = `${import.meta.env.BASE_URL}img/CREDITS.md`;
