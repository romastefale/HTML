const BASE = import.meta.env.BASE_URL;

/** Every page of the portal (Vite entries in vite.config.ts), in menu order. */
export type PageKey = "inicio" | "amostra" | "painel" | "galeria" | "contrato" | "arquitetura";
interface PageInfo {
  key: PageKey;
  href: string;
  /** Short label (home cards and titles). */
  label: string;
  /** The page's name in the ☰ page picker. */
  pick: string;
  title: string;
  /** One line for the home page card. */
  summary: string;
}
export const PAGES: PageInfo[] = [
  { key: "inicio", href: BASE, pick: "Início", label: "Início", title: "Interface de vidro", summary: "" },
  {
    key: "amostra", href: `${BASE}liquid-glass-sample.html`, pick: "Amostra", label: "Amostra", title: "Amostra Liquid Glass",
    summary: "Lente no lugar sobre o título, cartões com refract e botões materiais.",
  },
  {
    key: "painel", href: `${BASE}painel.html`, pick: "Painel", label: "Painel", title: "Painel de widgets",
    summary: "Controle segmentado com lente, widgets com refract sobre a foto, chaves e controle deslizante de vidro e barra de abas.",
  },
  {
    key: "galeria", href: `${BASE}galeria.html`, pick: "Galeria", label: "Galeria", title: "Galeria de lugares",
    summary: "Visor em WebGL em que cada controle é uma lente, chips de filtro e uma folha com lupa refratada.",
  },
  {
    key: "contrato", href: `${BASE}contrato-design.html`, pick: "Contrato de design", label: "Contrato", title: "Contrato de design",
    summary: "O contrato de design, tela cheia e acessibilidade, lidos direto de docs/.",
  },
  {
    key: "arquitetura", href: `${BASE}contrato-arquitetura.html`, pick: "Arquitetura e operação", label: "Arquitetura", title: "Arquitetura e operação",
    summary: "Arquitetura, desempenho, deploy, checklist e histórico, lidos direto de docs/.",
  },
];
export const page = (key: PageKey) => PAGES.find((p) => p.key === key)!;
