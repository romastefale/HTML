# Desempenho

## 1. Diagnóstico do PR #9: o problema estava no código, não no deploy

**Deploy (verificado com `curl` no site ao vivo):**

- O GitHub Pages responde em ~0,12–0,18 s.
- A base `/HTML/` está certa e nenhum asset dá 404.
- O Pages serve **só gzip** (sem brotli) e manda `cache-control: max-age=600` para tudo, inclusive para os assets com hash. **Nada disso é configurável no Pages.**
- O único 404 era o `/favicon.ico` automático na raiz do domínio. Foi resolvido com `<link rel="icon" href="data:,">`.

**Código (a causa):**

1. **Cada `<Glass>` material gerava um mapa de deslocamento no main thread** (canvas pixel a pixel e `toDataURL`, um PNG de ~110 KB em data URL).
   - Isso acontecia até nas superfícies só de fosco (menu, painéis, legendas) e até no WebKit/Gecko, onde o mapa nunca é usado.
   - No Chromium, cada uma dessas superfícies ainda recebia um `backdrop-filter: url(#svg)` que não muda nada visualmente (deslocamento 0), mas é re-rasterizado a cada quadro de rolagem.
2. **As fotos eram JPEGs de 1600 px** (182–373 KB), exibidos com ~321 px (Início) e ~353 px (amostra) de largura no iPhone 15.

### Medições (antes → depois)

Números medidos no PR #9. Não são estimativas.

| Métrica | Início (`index.html`) | Amostra |
|---|---|---|
| Lighthouse mobile, mediana de 3 | 78 → **85** | 79 → **84** |
| Total Blocking Time | 812 → **509 ms** | 630 → **505 ms** |
| LCP | 2538 → **2164 ms** | 2896 → **2471 ms** |
| Time to Interactive | 3149 → **2381 ms** | 3596 → **3019 ms** |
| Peso total transferido | 996 → **183 KiB** | 987 → **272 KiB** |
| Trabalho no main thread | 2734 → **1629 ms** | 3033 → **2540 ms** |
| Execução de JS | 1009 → **126 ms** | 1259 → **726 ms** |
| JS (gzip) | 88,5 + 2,3 → **73,4 + 2,3 KB** | 88,5 + 5 → **73,4 + 20,6 KB** |
| `<Glass>` / filtros `url()` no Chrome | 12 / 12 → **0 / 0** | 15 / 14 → **6 / 5** |
| Mapas em data URL no DOM | 1,77 MB → **0** | 2,35 MB → **0,99 MB** |
| Tarefa longa na montagem (CPU 4×) | 1130 → **451 ms** | 1259 → **805 ms** |
| Montagem no WebKit (sem throttle) | 631 → **219 ms** | 868 → **285 ms** |
| Rolagem no Chromium, iPhone 15 emulado (render por software) | 13,7 → **60 fps** | 10–11 → **18 fps** |
| Foto de Hong Kong no iPhone 15 | JPEG 373 KB → **AVIF 1080 px, 112 KB** | — |

A linha "`<Glass>` / filtros `url()`" do PR #9 conta as instâncias com filtro SVG: na amostra, depois da mudança, são os 5 botões e a lente. Os 3 cartões `refract` não criam `<filter>` SVG no DOM. O inventário por componente está em [ARQUITETURA.md §6](ARQUITETURA.md#6-onde-há-glass-e-onde-há-fosco-em-css).

**Como foi medido:**

- **Lighthouse:** perfil mobile com o throttling padrão, 3 execuções por página, mediana. Rodou sobre o build de `main` (antes) e o da branch (depois), servidos localmente com gzip.
- **Perfil de montagem:** Chromium com CPU 4× via CDP.
- **Rolagem:** Playwright headless, com render por software. Os fps absolutos são pessimistas; o que vale é a comparação entre antes e depois.
- **Visual:** diferença pixel a pixel entre o site ao vivo e o build novo, em Chromium e WebKit, claro e escuro, 3 posições de rolagem e as duas páginas. A diferença máxima foi de 0–6/255, com 0 pixels acima de 8, fora a região das fotos, que muda um pouco por causa do redimensionamento e do AVIF.

## 2. Regras

### P1. Imagens responsivas (OBRIGATÓRIO)

Toda foto de conteúdo DEVE ser um `<picture>` com AVIF, depois WebP, e o JPEG original como `<img>` de fallback. Os `width` e `height` intrínsecos são obrigatórios, junto com `decoding="async"`. Uma foto fora da primeira dobra também leva `loading="lazy"`.

```tsx
// src/components/Surfaces.tsx › Picture
const WIDTHS = [480, 720, 1080, 1440];
<picture>
  <source type="image/avif" srcSet="…-480.avif 480w, …-720.avif 720w, …-1080.avif 1080w, …-1440.avif 1440w" sizes={sizes} />
  <source type="image/webp" srcSet="…webp" sizes={sizes} />
  <img src="img/{nome}.jpg" alt="…" width={w} height={h} loading={lazy ? "lazy" : undefined} decoding="async" />
</picture>
```

- `sizes` DEVE ser a largura em que a imagem é **desenhada**, não a da caixa. Com `object-fit: cover`, a imagem pode ser desenhada mais larga que a caixa:
  - Início: `(min-width: 600px) 528px, calc(100vw - 72px)`;
  - Amostra: `(max-width: 860px) calc(112.5vw - 45px), 650px`.
- `picture { display: contents }` em `global.css`, para o `<img>` continuar sendo o item de layout.
- A primeira foto da página inicial (Hong Kong) é **eager**; as outras são lazy.
- As variantes são geradas por `scripts/make-responsive-images.py` (veja [DEPLOY.md](DEPLOY.md#5-regenerar-as-imagens)).

*Por quê:* esta regra foi o maior ganho de peso do PR #9 (Início: 996 → 183 KiB).

### P2. `<Glass>` só onde há refração (OBRIGATÓRIO)

Uma superfície só de fosco DEVE usar `<Frost>` (CSS). O `<Glass>` material só DEVE ser montado no Blink (`GlassPill`). Veja [ARQUITETURA.md §6](ARQUITETURA.md#6-onde-há-glass-e-onde-há-fosco-em-css).

*Por quê:* isso tirou 12 mapas e 12 filtros da página inicial, e a rolagem no Chromium foi de 13,7 para 60 fps.

### P3. A biblioteca só nas páginas que a usam (OBRIGATÓRIO)

Módulos compartilhados DEVEM importar só **tipos** da biblioteca (`import type`). Hoje o valor (`Glass`, `glassValue`) só é importado em `Sample.tsx` e `GlassPill.tsx`, que só a amostra usa. O resultado é que a biblioteca fica no chunk `sample-*.js` (62,38 kB, ou 20,65 kB gz), e a página inicial não a baixa.

Ao criar uma página nova, confira no `pnpm build` em qual chunk a biblioteca foi parar.

### P4. `filterResolution` e fps condicionados ao aparelho (OBRIGATÓRIO)

- `filterResolution={2}` só em tela ≤ 1,5dppx (`useMediaQuery("(max-resolution: 1.5dppx)")`) **e** em máquina forte (`hardwareConcurrency > 4 && deviceMemory > 4`). No resto, o valor é `1`.
  *Por quê:*
  - o `BROWSERS.md` recomenda o 2× no Chromium para bordas nítidas, mas 2× são 4× os pixels do filtro;
  - em telas 2×/3× o filtro já rasteriza em pixels do aparelho;
  - a biblioteca força 1 no WebKit.
- Em aparelho fraco (`hardwareConcurrency <= 4 || deviceMemory <= 4`), a **órbita** da lente roda a ~30 fps: ela pula quadros com menos de 30 ms desde o último passo. A suavização passa de `0.12` para `1 − (1 − 0.12)²`, para manter o mesmo trajeto. Com mouse ou dedo, a lente continua em taxa cheia.
  - O Safari pode informar um `hardwareConcurrency` limitado. Nesse caso, iPhones também recebem a órbita a 30 fps.
- `navigator.deviceMemory` não existe no Safari e no Firefox. Quando o valor falta, o código assume 8.

### P5. Laços de animação pausam fora da tela (OBRIGATÓRIO)

Todo loop de `requestAnimationFrame` contínuo DEVE parar com `IntersectionObserver` (elemento fora da viewport) e com `visibilitychange` (aba oculta), e voltar quando o elemento reaparece. Com `prefers-reduced-motion: reduce`, não há órbita: a lente fica parada em `REST`, a menos que o ponteiro a mova.

O scroll-spy usa no máximo 1 rAF por evento de rolagem, com listener `passive: true`.

### P6. Medições acompanham o PR (RECOMENDADO)

Todo PR que mexer em vidro, imagens ou dependências DEVE trazer os números de antes e depois: Lighthouse mobile e peso transferido. Assim, este documento continua verdadeiro.

## 3. Orçamento de desempenho

Metas **normativas** para o estado atual. Elas foram tiradas dos números medidos acima, com margem. Não são medições.

| Item | Início | Amostra |
|---|---|---|
| Lighthouse mobile (desempenho) | ≥ 80 | ≥ 80 |
| Total Blocking Time (Lighthouse) | ≤ 600 ms | ≤ 600 ms |
| Peso transferido no carregamento | ≤ 250 KiB | ≤ 350 KiB |
| JS gzip (soma dos chunks da página) | ≤ 80 KB | ≤ 100 KB |
| `<Glass>` montados | 0 | ≤ 4 fixos + os botões materiais no Blink (hoje 5) |
| Lentes animadas continuamente | 0 | ≤ 1 |
| Maior imagem baixada no iPhone 15 | ≤ 150 KB (AVIF) | ≤ 150 KB (AVIF) |
| Erros de console / 404 | 0 | 0 |

Quem estourar um item DEVE justificar no PR ou compensar em outro ponto.

## 4. Limites conhecidos (custo do próprio design)

- **A lente do título da amostra.** O modo "no lugar" aplica `filter: url(#…)` com 19 primitivas SVG sobre **todo** o bloco do título (~353×451 CSS px no iPhone 15, com `will-change: filter`), e não só sobre o disco da lente, de 130–200 px. Isso é refeito a cada quadro enquanto a lente orbita.
  - Parada no topo da amostra: ~11–12 fps em render por software, igual antes e depois. Com movimento reduzido, 60 fps.
  - Reduzir esse custo exige mudar a biblioteca (restringir a região do filtro) ou o efeito.
- **Os 5 botões com curvatura ao vivo no Chromium e os desfoques fortes** (22px nos painéis) são o próprio visual. Nos experimentos do PR #9 na amostra, no Chromium, com movimento reduzido:

  | Configuração | fps de rolagem |
  |---|---|
  | Completa | ~19 |
  | Sem o `url()` dos botões | ~30 |
  | Sem o hero | ~39 |
  | Sem os foscos | ~31 |

- **React e react-dom** somam ~60 KB gz e são necessários.
- **Primeiro layout:** ~385 ms a 4× de CPU, igual antes e depois. É layout de texto e fonte, não vidro.
- **GitHub Pages:** `max-age=600` e só gzip, sem configuração. Veja [DEPLOY.md](DEPLOY.md).
