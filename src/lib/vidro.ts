import type { GlassOptics } from "@samasante/liquid-glass";
import vidroIni from "../../vidro.ini?raw";

const secoes: Record<string, Record<string, string>> = {};
let secao = "";
for (const linha of vidroIni.split("\n").map((l) => l.trim())) {
  const s = linha.match(/^\[(.+)\]$/);
  if (s) secoes[(secao = s[1])] = {};
  const kv = linha.match(/^(\w+)\s*=\s*(.+)$/);
  if (kv) secoes[secao][kv[1]] = kv[2];
}

export const frost = Number(secoes.vidro.frost);

export const menuOptics: Partial<GlassOptics> = {
  ...Object.fromEntries(Object.entries(secoes.menu).map(([k, v]) => [k, Number(v)])),
  frost,
};

const raiz = document.documentElement.style;
raiz.setProperty("--vidro-frost", `${frost}px`);
raiz.setProperty("--vidro-tint-claro", secoes.vidro.tintClaro);
raiz.setProperty("--vidro-tint-escuro", secoes.vidro.tintEscuro);
