import type { GlassOptics } from "@samasante/liquid-glass";
import vidroIni from "../../vidro.ini?raw";

export type Vidro = { optics: Partial<GlassOptics>; tintClaro: string; tintEscuro: string };

export const vidro: Record<string, Vidro> = {};
let secao = "";
for (const linha of vidroIni.split("\n").map((l) => l.trim())) {
  const s = linha.match(/^\[(.+)\]$/);
  if (s) vidro[(secao = s[1])] = { optics: {} } as Vidro;
  const kv = linha.match(/^(\w+)\s*=\s*(.+)$/);
  if (!kv) continue;
  const [, chave, valor] = kv;
  if (chave === "tintClaro" || chave === "tintEscuro") vidro[secao][chave] = valor;
  else
    (vidro[secao].optics as Record<string, number | boolean>)[chave] =
      valor === "true" ? true : valor === "false" ? false : Number(valor);
}

const raiz = document.documentElement.style;
raiz.setProperty("--vidro-frost", `${vidro.paginas.optics.frost}px`);
raiz.setProperty("--vidro-tint-claro", vidro.paginas.tintClaro);
raiz.setProperty("--vidro-tint-escuro", vidro.paginas.tintEscuro);
