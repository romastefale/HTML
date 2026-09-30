import type { NavItem } from "../components/SiteHeader";

const BASE = import.meta.env.BASE_URL;

/** Every page of the portal (Vite entries in vite.config.ts), in menu order. */
export type PageKey = "inicio" | "amostra" | "painel" | "galeria" | "contrato" | "arquitetura";
export interface PageInfo {
  key: PageKey;
  href: string;
  /** Short label in the menu pill. */
  label: string;
  title: string;
  /** One line for the home page card. */
  summary: string;
}
export const PAGES: PageInfo[] = [
  { key: "inicio", href: BASE, label: "Início", title: "Interface de vidro", summary: "" },
  {
    key: "amostra", href: `${BASE}liquid-glass-sample.html`, label: "Amostra", title: "Amostra Liquid Glass",
    summary: "Lente no lugar sobre o título, cartões com refract e botões materiais.",
  },
  {
    key: "painel", href: `${BASE}painel.html`, label: "Painel", title: "Painel de widgets",
    summary: "Controle segmentado com lente, widgets com refract sobre a foto, chaves e controle deslizante de vidro e barra de abas.",
  },
  {
    key: "galeria", href: `${BASE}galeria.html`, label: "Galeria", title: "Galeria de lugares",
    summary: "Visor em WebGL em que cada controle é uma lente, chips de filtro e uma folha com lupa refratada.",
  },
  {
    key: "contrato", href: `${BASE}contrato-design.html`, label: "Contrato", title: "Contrato de design",
    summary: "O contrato de design, tela cheia e acessibilidade, lidos direto de docs/.",
  },
  {
    key: "arquitetura", href: `${BASE}contrato-arquitetura.html`, label: "Arquitetura", title: "Arquitetura e operação",
    summary: "Arquitetura, desempenho, deploy, checklist e histórico, lidos direto de docs/.",
  },
];
export const page = (key: PageKey) => PAGES.find((p) => p.key === key)!;

/**
 * The menu of a page: its own sections first (they scroll inside the page and
 * follow the scroll-spy), then the links that leave the page: "‹ Início" (on
 * every page but the home) and the other pages. The first page link carries
 * `sep`, a small gap in the pill between the two groups.
 */
export function pageNav(self: PageKey, sections: NavItem[]): NavItem[] {
  const out: NavItem[] = [...sections];
  const others: NavItem[] = [];
  if (self !== "inicio") others.push({ href: BASE, label: "Início", back: true, ariaLabel: "Voltar ao início", spy: false });
  for (const p of PAGES) {
    if (p.key === "inicio" || p.key === self) continue;
    others.push({ href: p.href, label: p.label, ariaLabel: `${p.title} (outra página)`, spy: false });
  }
  if (others.length) others[0] = { ...others[0], sep: true };
  return out.concat(others);
}
