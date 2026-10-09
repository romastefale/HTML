import type { GlassOptics } from "@samasante/liquid-glass";
import vidroIni from "../../vidro.ini?raw";

type Valor = string | number | boolean;

const secoes: Record<string, Record<string, Valor>> = {};
let secao = "";
for (const linha of vidroIni.split("\n")) {
  const t = linha.trim();
  if (!t || t.startsWith("#")) continue;
  const s = t.match(/^\[(.+)\]$/);
  if (s) {
    secoes[(secao = s[1])] = {};
    continue;
  }
  const kv = t.match(/^(\w+)\s*=\s*(.+)$/);
  if (!kv) continue;
  const bruto = kv[2].trim();
  const valor: Valor =
    bruto === "true" ? true : bruto === "false" ? false : /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(bruto) ? Number(bruto) : bruto;
  secoes[secao][kv[1]] = valor;
}

const ler = (nome: string, chave: string) => {
  const v = secoes[nome]?.[chave];
  if (v === undefined) throw new Error(`vidro.ini: [${nome}] ${chave}`);
  return v;
};

export const frost = Number(ler("vidro", "frost"));
export const saturate = Number(ler("vidro", "saturate"));

/** Text or color from a section. Numbers stay as written. */
export const texto = (nome: string, chave: string) => String(ler(nome, chave));

/** Library optics for one element. [brilho] applies first; later sections override. */
export const otica = (...nomes: string[]): Partial<GlassOptics> => {
  const o: Record<string, Valor> = { ...secoes.brilho };
  for (const n of nomes) Object.assign(o, secoes[n]);
  return o as Partial<GlassOptics>;
};

const raiz = document.documentElement.style;
raiz.setProperty("--vidro-frost", `${frost}px`);
raiz.setProperty("--vidro-saturate", String(saturate));
raiz.setProperty("--vidro-tint-claro", texto("vidro", "tintClaro"));
raiz.setProperty("--vidro-tint-escuro", texto("vidro", "tintEscuro"));
for (const [chave, valor] of Object.entries(secoes.tinta)) {
  raiz.setProperty(`--tinta-${chave.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`, String(valor));
}
