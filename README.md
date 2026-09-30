# HTML

Site: https://romastefale.github.io/HTML/ · Amostra: https://romastefale.github.io/HTML/liquid-glass-sample.html

App React 19 (Vite + TypeScript) com vidro líquido da biblioteca [`@samasante/liquid-glass`](https://www.npmjs.com/package/@samasante/liquid-glass) 0.1.1, que é idêntica ao fork [romastefale/liquid-glass](https://github.com/romastefale/liquid-glass) no commit `4e7b769`. Tem duas páginas em pt-BR e as duas compartilham:

- um menu flutuante em forma de pílula de vidro;
- a pesquisa na página, que abre pela lupa;
- o modo claro/escuro.

## Documentação

O relato técnico e o **contrato para projetos futuros** estão em [`docs/`](docs/README.md):

- [Arquitetura](docs/ARQUITETURA.md)
- [Contrato de design](docs/DESIGN-CONTRATO.md)
- [Tela cheia e barras](docs/TELA-CHEIA-E-BARRAS.md)
- [Desempenho](docs/DESEMPENHO.md)
- [Deploy](docs/DEPLOY.md)
- [Acessibilidade e interação](docs/ACESSIBILIDADE-E-INTERACAO.md)
- [Checklist de verificação](docs/CHECKLIST-VERIFICACAO.md)
- [Histórico](docs/HISTORICO.md)

## Estrutura

- `index.html` e `liquid-glass-sample.html`: entradas do Vite (`base: "/HTML/"`).
- `src/components/SiteHeader.tsx`: o menu compartilhado (links com rolagem lateral, item atual selecionado, tema e lupa).
- `src/components/PageSearch.tsx`: a pesquisa dentro da pílula (CSS Custom Highlight API, com fallback).
- `src/components/Frost.tsx`, `GlassPill.tsx` e `Surfaces.tsx`: as superfícies de vidro e as fotos responsivas.
- `src/pages/Home.tsx` e `src/pages/Sample.tsx`: as duas páginas.
- `src/styles/global.css`: o fundo em gradiente, a hairline, as tintas e o foco.
- `public/img/`: as fotos, as variantes AVIF/WebP (`r/`) e o `CREDITS.md`. As variantes são geradas por `scripts/make-responsive-images.py`.

```bash
pnpm install
pnpm dev        # http://127.0.0.1:4178/HTML/
pnpm build      # typecheck + build → dist/
pnpm preview    # http://127.0.0.1:4179/HTML/
```

Deploy: o `.github/workflows/pages.yml` faz o build e publica o `dist/` com `actions/deploy-pages`. Para isso, é preciso ter **Settings → Pages → Source: "GitHub Actions"**. Detalhes em [docs/DEPLOY.md](docs/DEPLOY.md).
