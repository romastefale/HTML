# HTML

Site: https://romastefale.github.io/HTML/

App React 19 (Vite + TypeScript) com vidro líquido da biblioteca [`@samasante/liquid-glass`](https://www.npmjs.com/package/@samasante/liquid-glass) 0.1.1, que é idêntica ao fork [romastefale/liquid-glass](https://github.com/romastefale/liquid-glass) no commit `4e7b769`. O menu do topo também usa o `<Glass>` dessa biblioteca. Os valores do vidro ficam em [`vidro.ini`](vidro.ini), cada um uma vez: `[vidro]` (desfoque e tinta de todo o site) e `[menu]` (as outras optics do vidro do menu). É um portal de seis páginas em pt-BR:

| Página | Endereço | O que mostra |
|---|---|---|
| Início | [`/HTML/`](https://romastefale.github.io/HTML/) | o portal: cartões das páginas, feed de vidro fosco e fotos |
| Amostra | [`liquid-glass-sample.html`](https://romastefale.github.io/HTML/liquid-glass-sample.html) | lente no lugar sobre o título, cartões com `refract` e botões materiais |
| Painel | [`painel.html`](https://romastefale.github.io/HTML/painel.html) | segmentado com lente, widgets com `refract` sobre a foto, chaves e controle deslizante de vidro, avisos e barra de abas |
| Galeria | [`galeria.html`](https://romastefale.github.io/HTML/galeria.html) | visor em WebGL em que cada controle é uma lente, chips de filtro e uma folha com lupa |
| Contrato de design | [`contrato-design.html`](https://romastefale.github.io/HTML/contrato-design.html) | `docs/` README, DESIGN-CONTRATO, TELA-CHEIA-E-BARRAS e ACESSIBILIDADE, com fotos de skylines |
| Arquitetura e operação | [`contrato-arquitetura.html`](https://romastefale.github.io/HTML/contrato-arquitetura.html) | `docs/` ARQUITETURA, DESEMPENHO, DEPLOY, CHECKLIST e HISTORICO, com fotos de skylines |

Todas compartilham:

- um menu flutuante em forma de pílula de vidro: o botão ☰ na ponta esquerda, que abre a lista de todas as páginas (o Início também), e depois só as seções da página;
- a pesquisa na página, que abre pela lupa;
- o modo claro/escuro.

## Documentação

O relato técnico e o **contrato para projetos futuros** estão em [`docs/`](docs/README.md). Os mesmos arquivos são o conteúdo das duas páginas de contrato: o build os compila (`scripts/vite-docs.ts`), então editar o `.md` atualiza o site.

- [Arquitetura](docs/ARQUITETURA.md)
- [Contrato de design](docs/DESIGN-CONTRATO.md)
- [Tela cheia e barras](docs/TELA-CHEIA-E-BARRAS.md)
- [Desempenho](docs/DESEMPENHO.md)
- [Deploy](docs/DEPLOY.md)
- [Acessibilidade e interação](docs/ACESSIBILIDADE-E-INTERACAO.md)
- [Checklist de verificação](docs/CHECKLIST-VERIFICACAO.md)
- [Histórico](docs/HISTORICO.md)

## Estrutura

- `index.html`, `liquid-glass-sample.html`, `painel.html`, `galeria.html`, `contrato-design.html` e `contrato-arquitetura.html`: entradas do Vite (`base: "/HTML/"`), uma por página.
- `src/lib/pages.ts`: a lista de páginas do portal (a da lista ☰).
- `src/components/SiteHeader.tsx`: o menu compartilhado (lista de páginas ☰, seções com rolagem lateral e seleção, tema e lupa). Pílula, lista e botões usam o mesmo fosco. Valores em `vidro.ini`.
- `src/components/PageSearch.tsx`: a pesquisa dentro da pílula (CSS Custom Highlight API, com fallback).
- `src/components/Frost.tsx`, `GlassPill.tsx` e `Surfaces.tsx`: as superfícies de vidro e as fotos responsivas.
- `src/components/examples/`: `GlassSwitch` e `GlassSlider`, copiados do `examples/` do fork (MIT).
- `src/pages/`: as páginas (`Home`, `Sample`, `Painel`, `Galeria` e `Docs`, que renderiza os documentos).
- `src/lib/device.ts`: medidas, pausa fora da tela, montagem adiada e detecção de WebGL em software.
- `src/styles/global.css`: o fundo orgânico (`src/assets/fundo-*.svg`, gerados por `scripts/make-organic-bg.py`), as camadas de borda, a hairline, as tintas e o foco.
- `public/img/`: as fotos, as variantes AVIF/WebP (`r/`) e o `CREDITS.md`. As variantes são geradas por `scripts/make-responsive-images.py`.

A biblioteca `@samasante/liquid-glass` só é baixada na amostra, no painel e na galeria. O renderizador de diagramas (mermaid) só é baixado quando alguém pede para desenhar um diagrama.

```bash
pnpm install
pnpm dev        # http://127.0.0.1:4178/HTML/
pnpm build      # typecheck + build → dist/
pnpm preview    # http://127.0.0.1:4179/HTML/
```

Deploy: o `.github/workflows/pages.yml` faz o build e publica o `dist/` com `actions/deploy-pages`. Para isso, é preciso ter **Settings → Pages → Source: "GitHub Actions"**. Detalhes em [docs/DEPLOY.md](docs/DEPLOY.md).
