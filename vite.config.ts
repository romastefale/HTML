import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { docsPlugin } from "./scripts/vite-docs.ts";

// Same toolchain as the liquid-glass fork's own demo site (site/vite.config.ts):
// Vite + @vitejs/plugin-react, React 19, TypeScript. One HTML entry per page of
// the portal (src/lib/pages.ts): /HTML/ (index.html), the sample
// (liquid-glass-sample.html), the two example pages (painel.html,
// galeria.html) and the two contract pages (contrato-design.html,
// contrato-arquitetura.html), which render docs/*.md compiled at build time
// by scripts/vite-docs.ts.
const entry = (file: string) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  // GitHub Pages project site: https://romastefale.github.io/HTML/
  base: "/HTML/",
  plugins: [react(), docsPlugin()],
  resolve: { dedupe: ["react", "react-dom"] },
  build: {
    rollupOptions: {
      input: {
        index: entry("./index.html"),
        sample: entry("./liquid-glass-sample.html"),
        painel: entry("./painel.html"),
        galeria: entry("./galeria.html"),
        "contrato-design": entry("./contrato-design.html"),
        "contrato-arquitetura": entry("./contrato-arquitetura.html"),
      },
    },
  },
  server: { host: "127.0.0.1", port: 4178 },
  preview: { host: "127.0.0.1", port: 4179 },
});
