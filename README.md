# HTML

Site: https://romastefale.github.io/HTML/ · Amostra: https://romastefale.github.io/HTML/liquid-glass-sample.html

App React (Vite + TypeScript) com a mesma arquitetura do site de demonstração da biblioteca
[liquid-glass](https://github.com/romastefale/liquid-glass) (`site/`): cada superfície de vidro é um
componente React que usa o `<Glass>` do pacote `@samasante/liquid-glass` (versão 0.1.1, idêntica ao fork no
commit `4e7b769`).

- `index.html` e `liquid-glass-sample.html`: entradas do Vite (mesmas URLs de antes).
- `src/components/GlassNav.tsx`: menu de vidro compartilhado (recolhe em “…” ao rolar, abre como popover).
- `src/components/PageSearch.tsx`: pesquisa na página (CSS Custom Highlight API, com fallback).
- `src/pages/Home.tsx`, `src/pages/Sample.tsx`: as duas páginas.
- `src/styles/global.css`: fundo em gradiente suave, cores das barras do navegador, tintas do vidro.
- `public/img/`: fotos e `CREDITS.md`.

```bash
pnpm install
pnpm dev        # http://127.0.0.1:4178/HTML/
pnpm build      # typecheck + build → dist/
pnpm preview    # http://127.0.0.1:4179/HTML/
```

Deploy: `.github/workflows/pages.yml` faz o build e publica `dist/` com `actions/deploy-pages`
(requer Settings → Pages → Source: “GitHub Actions”).
