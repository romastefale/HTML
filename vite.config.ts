import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Same toolchain as the liquid-glass fork's own demo site (site/vite.config.ts):
// Vite + @vitejs/plugin-react, React 19, TypeScript. Two HTML entries keep the
// existing URLs: /HTML/ (index.html) and /HTML/liquid-glass-sample.html.
const entry = (file: string) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  // GitHub Pages project site: https://romastefale.github.io/HTML/
  base: "/HTML/",
  plugins: [react()],
  resolve: { dedupe: ["react", "react-dom"] },
  build: {
    rollupOptions: {
      input: {
        index: entry("./index.html"),
        sample: entry("./liquid-glass-sample.html"),
      },
    },
  },
  server: { host: "127.0.0.1", port: 4178 },
  preview: { host: "127.0.0.1", port: 4179 },
});
