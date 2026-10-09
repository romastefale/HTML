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
  <img ref={img} alt="…" width={w} height={h} loading={lazy ? "lazy" : undefined} decoding="async" />  // src = img/{nome}.jpg no useLayoutEffect
</picture>
```

- `sizes` DEVE ser a largura em que a imagem é **desenhada**, não a da caixa. Com `object-fit: cover`, a imagem pode ser desenhada mais larga que a caixa:
  - Início: `(min-width: 600px) 528px, calc(100vw - 72px)`;
  - Amostra: `(max-width: 860px) calc(112.5vw - 45px), 650px`.
- `picture { display: contents }` em `global.css`, para o `<img>` continuar sendo o item de layout.
- **O `src` do JPEG DEVE ser aplicado depois que o `<img>` está dentro do `<picture>`** (`useLayoutEffect` em `Picture`). O React define o `src` antes de colocar o `<img>` no `<picture>`, e o WebKit começa a baixar esse `src` na hora: no PR #12, as fotos eager (sem `loading="lazy"`) baixavam o JPEG de 1600 px (170–340 KB) além do AVIF.
- Na página inicial, desde o PR #12, **todas** as fotos são lazy: o portal (cartões das páginas) ocupa a primeira dobra. Nas outras páginas, a foto do topo (o palco do painel, o visor da galeria e o topo dos contratos) é eager com `fetchpriority="high"` (`Picture priority`); as outras são lazy.
- Mais `sizes` desenhados (PR #12):
  - palco do painel: `(max-width: 700px) calc(150vw - 60px), (max-width: 1100px) calc(100vw - 40px), 1040px`;
  - visor da galeria: `(max-width: 700px) calc(125vw - 50px), 1040px`; grade: `(max-width: 700px) calc(62vw - 20px), 360px`; folha: `(max-width: 700px) calc(100vw - 48px), 656px`;
  - topo dos contratos: `(max-width: 700px) calc(140vw - 56px), 880px`; fotos entre documentos: `(max-width: 700px) calc(100vw - 40px), 880px`.
- As variantes são geradas por `scripts/make-responsive-images.py` (veja [DEPLOY.md](DEPLOY.md#5-regenerar-as-imagens)).

*Por quê:* esta regra foi o maior ganho de peso do PR #9 (Início: 996 → 183 KiB).

### P2. `<Glass>` só onde há refração (OBRIGATÓRIO)

Uma superfície só de fosco DEVE usar `<Frost>` (CSS). O `<Glass>` material só DEVE ser montado no Blink (`GlassPill`). Veja [ARQUITETURA.md §6](ARQUITETURA.md#6-onde-há-glass-e-onde-há-fosco-em-css).

*Por quê:* isso tirou 12 mapas e 12 filtros da página inicial, e a rolagem no Chromium foi de 13,7 para 60 fps.

No `<Glass>` que fica, o filtro também NÃO DEVE ter passes que não mudam nada: toda ótica espalha `NO_SHINE` (`specular: 0`, `sheen: 0`, `glow: 0`, `src/lib/optics.ts`). Com `specular: 0` o ganho do brilho já é zero, mas a biblioteca só tira as duas primitivas dele (`feColorMatrix` + `feComposite`) quando `sheen` e `glow` também são 0. No PR #15, as capturas ficaram idênticas e a lente do título ganhou fps (§3.4).

### P3. A biblioteca só nas páginas que a usam (OBRIGATÓRIO)

Módulos compartilhados DEVEM importar só **tipos** da biblioteca (`import type`). O valor só é importado nas páginas com refração (`Sample.tsx`, `Painel.tsx`, `Galeria.tsx`), em `GlassPill.tsx` e em `components/examples/*`. Com três páginas usando a biblioteca, o Rollup a separa num chunk próprio, `dist-*.js` (49,35 kB, ou 16,60 kB gz), que só a amostra, o painel e a galeria baixam. O Início e os contratos não o baixam. O mermaid das páginas de contrato é um `import()` dinâmico: não entra no carregamento inicial nem em `modulepreload`.

O menu do topo importa o `<Glass>` só nos três botões de 34px (DESIGN-CONTRATO D9.1). A pílula e a lista ☰ são `<Frost>` e não pedem a biblioteca. Com esse import no `SiteHeader`, a biblioteca vai no chunk compartilhado (`Surfaces-*.js`) e todas as páginas a baixam (§3.5).

Ao criar uma página nova, confira no `pnpm build` (e nos `<script>`/`modulepreload` do HTML gerado em `dist/`) quais chunks ela carrega.

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

Na galeria (PR #12), o `<Glass draw>` do visor é o único laço contínuo. Ele só existe com as quatro condições juntas: visor na tela, aba visível, apresentação tocando e WebGL **na GPU**. `softwareGL()` (`lib/device.ts`) lê o `WEBGL_debug_renderer_info`: com SwiftShader, llvmpipe ou "Basic Render" (WebGL desenhado pelo processador), os controles ficam em `<Frost>`, a apresentação começa pausada e, ao tocar, troca as fotos com um `setTimeout` e uma transição CSS na barra. O parâmetro `?webgl=forcar` desliga a checagem (usado nos testes, porque o Chromium headless só tem SwiftShader).

*Por quê:* no Lighthouse (SwiftShader), o laço contínuo em software dava TBT de ~147 s e nota 55; com a checagem, 60 ms e 96.

### P6. Montagem adiada (OBRIGATÓRIO)

- **Uma lente que não é necessária na primeira pintura DEVE montar depois dela**, uma por vez: `useDeferredMount()` (`lib/device.ts`) libera uma montagem por intervalo ocioso (`requestIdleCallback`, com um quadro entre uma e outra, para cada uma virar uma tarefa própria). Até lá, a mesma cena aparece plana: a seleção do segmentado sem a lente, os widgets sem a refração e as chaves como chaves planas que já funcionam (`role="switch"`), do mesmo tamanho. As chaves e o controle deslizante só montam quando a central chega perto da tela (`useNear`).
- **O corpo dos documentos** nas páginas de contrato é dividido nas seções de cada documento, e cada parte monta num intervalo ocioso, na ordem da página, com a altura estimada reservada até lá. Os títulos (os alvos da pílula) aparecem de imediato.
- **`content-visibility: auto` NÃO DEVE ser usado nas partes com âncoras.** Foi testado no PR #12: a altura estimada das partes puladas fazia um link direto (`#historico-…`) parar ~11.000 px longe do alvo e o scroll-spy perder seções, e o ganho de TBT foi pequeno perto da montagem adiada.

*Por quê:* sem isso, uma página de contrato fazia o layout dos ~1600 elementos de todos os documentos na mesma tarefa da montagem.

### P7. Pilha de fontes que sempre resolve na primeira família (OBRIGATÓRIO)

```css
body { font-family: system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif; }
code { font-family: ui-monospace, monospace; }
```

- `system-ui` é o SF Pro no iPhone e no Mac, o Roboto no Android e o Segoe UI no Windows. Como ele sempre existe, o navegador não procura as famílias seguintes.
- A pilha antiga (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, …`) fazia o Chromium fora da Apple procurar cada nome que não existe. Na máquina de medição (Linux com ~3.700 fontes), cada nome ausente custou ~50 ms no primeiro layout, e a pilha antiga custava ~300 ms por página.

*Por quê:* essa foi a maior parte do "primeiro layout" que o PR #9 deixou como limite conhecido. Com a troca, o TBT do Início caiu de ~370 para ~80 ms e o da amostra de ~550 para ~250 ms.

### P8. Medições acompanham o PR (RECOMENDADO)


Todo PR que mexer em vidro, imagens ou dependências DEVE trazer os números de antes e depois: Lighthouse mobile e peso transferido. Assim, este documento continua verdadeiro.

## 3. Orçamento de desempenho

Metas **normativas** para o estado atual. Elas foram tiradas dos números medidos, com margem. Não são medições.

| Item | Início | Amostra | Painel | Galeria | Contratos (cada) |
|---|---|---|---|---|---|
| Lighthouse mobile (desempenho) | ≥ 80 | ≥ 80 | ≥ 80 | ≥ 80 | ≥ 80 |
| Total Blocking Time (Lighthouse) | ≤ 600 ms | ≤ 600 ms | ≤ 600 ms | ≤ 600 ms | ≤ 600 ms |
| Peso transferido no carregamento | ≤ 250 KiB | ≤ 350 KiB | ≤ 350 KiB | ≤ 350 KiB | ≤ 350 KiB |
| JS gzip (soma dos chunks da página) | ≤ 80 KB | ≤ 100 KB | ≤ 110 KB | ≤ 110 KB | ≤ 130 KB (inclui o texto dos documentos, ~20–32 KB gz, que cresce com o contrato) |
| `<Glass>` montados | 3 botões do menu, no Blink | ≤ 4 fixos + 5 botões no Blink + 3 do menu | ≤ 6 + 3 do menu | 1 renderizador (4 lentes) + 1 lupa na folha + 3 do menu | 3 botões do menu, no Blink |
| Lentes animadas continuamente | 0 | ≤ 1 | 0 | ≤ 1 renderizador, só com GPU | 0 |
| Maior imagem baixada no iPhone 15 | ≤ 150 KB (AVIF) | ≤ 150 KB (AVIF) | ≤ 150 KB (AVIF) | ≤ 150 KB (AVIF) | ≤ 150 KB (AVIF) |
| Erros de console / 404 | 0 | 0 | 0 | 0 | 0 |

### 3.1 Medições do PR #12

Lighthouse 12 mobile (throttling padrão, simulado), 3 execuções por página, mediana, sobre `dist/` servido localmente com gzip em `/HTML/`:

| Página | Nota | TBT | FCP | LCP | TTI | CLS | Peso | JS (transferido) |
|---|---|---|---|---|---|---|---|---|
| Início | 99 | 80 ms | 1,5 s | 1,9 s | 2,1 s | 0 | 184 KiB | 75 KiB |
| Amostra | 93 | 250 ms | 1,7 s | 2,3 s | 2,6 s | 0 | 274 KiB | 95 KiB |
| Painel | 97 | 140 ms | 1,7 s | 2,0 s | 2,0 s | 0 | 149 KiB | 102 KiB |
| Galeria | 96 | 60 ms | 1,7 s | 2,6 s | 2,6 s | 0 | 310 KiB | 98 KiB |
| Contrato de design | 98 | 110 ms | 1,7 s | 2,0 s | 2,0 s | 0 | 151 KiB | 98 KiB |
| Arquitetura e operação | 98 | 100 ms | 1,7 s | 2,0 s | 2,0 s | 0 | 147 KiB | 109 KiB |

Na galeria, o Lighthouse mede o caminho sem lentes, porque o Chrome dele desenha o WebGL com SwiftShader (regra P5). Maior imagem baixada no iPhone 15 (WebKit, rolando a página inteira): Início 110 KB (Hong Kong, AVIF 1080), amostra 130 KB (Santorini, AVIF 1440), painel 89 KB (Lençóis, AVIF 1440), galeria 130 KB (Santorini, AVIF 1440), contrato de design 72 KB (São Paulo, AVIF 1440) e arquitetura 52 KB (Chicago, AVIF 1440). Nenhum JPEG é baixado.

Antes das regras P5 a P7, na mesma máquina: painel 80 (TBT 760 ms), galeria 55 (TBT ~147 s, o laço WebGL em software), contrato de design 75 (TBT 1060 ms) e arquitetura 74 (TBT 1160 ms).

Quem estourar um item DEVE justificar no PR ou compensar em outro ponto.

### 3.2 Medições do PR #13

Mesmo método da seção 3.1 (Lighthouse 12 mobile, 3 execuções, mediana, `dist/` local), depois da lista de páginas no ☰, dos contratos em cartões e da quebra de linha:

| Página | Nota | TBT | FCP | LCP | TTI | CLS | Peso | JS (transferido) |
|---|---|---|---|---|---|---|---|---|
| Início | 97 (era 99) | 150 ms (era 80) | 1,5 s | 2,0 s | 2,2 s | 0 | 185 KiB | 76 KiB |
| Amostra | 93 | 230 ms (era 250) | 1,7 s | 2,4 s | 2,7 s | 0 | 276 KiB | 95 KiB |
| Painel | 97 | 140 ms | 1,7 s | 2,0 s | 2,1 s | 0 | 150 KiB | 103 KiB |
| Galeria | 96 | 70 ms (era 60) | 1,7 s | 2,6 s | 2,6 s | 0 | 311 KiB | 99 KiB |
| Contrato de design | 98 | 100 ms (era 110) | 1,7 s | 2,0 s | 2,0 s | 0 | 155 KiB | 101 KiB |
| Arquitetura e operação | 98 | 100 ms | 1,7 s | 2,0 s | 2,0 s | 0 | 150 KiB | 112 KiB |

Os ~90 e ~110 cartões com `backdrop-filter` dos contratos não aumentaram o TBT: as partes abaixo da dobra continuam montadas depois (regra P6). No Início, o TBT mediano subiu 70 ms (execuções de 130 a 160 ms). A causa não foi isolada: as outras páginas têm a mesma barra (☰, lista de páginas e faixa de rolagem) e não subiram. Todas as páginas continuam dentro do orçamento.

### 3.3 Medições do PR #14

Mesmo método, com o fundo orgânico e as camadas de borda:

| Página | Nota | TBT | FCP | LCP | TTI | CLS | Peso | JS (transferido) |
|---|---|---|---|---|---|---|---|---|
| Início | 98 (era 97) | 130 ms (era 150) | 1,5 s | 2,0 s | 2,1 s | 0 | 187 KiB | 76 KiB |
| Amostra | 93 | 230 ms | 1,7 s | 2,4 s | 2,7 s | 0 | 277 KiB | 95 KiB |
| Painel | 98 (era 97) | 120 ms (era 140) | 1,7 s | 2,0 s | 2,0 s | 0 | 152 KiB | 103 KiB |
| Galeria | 96 | 70 ms | 1,7 s | 2,6 s | 2,6 s | 0 | 313 KiB | 99 KiB |
| Contrato de design | 98 | 90 ms (era 100) | 1,7 s | 2,0 s | 2,0 s | 0 | 158 KiB | 102 KiB |
| Arquitetura e operação | 97 (era 98) | 90 ms (era 100) | 1,8 s (era 1,7) | 2,1 s (era 2,0) | 2,1 s | 0 | 153 KiB | 113 KiB |

- **Peso:** os dois SVG do fundo (~2,7 kB cada) entram no CSS como data URL, sem requisição a mais. Cada página ganhou 2 a 3 KiB transferidos.
- **Custo:** o fundo é rasterizado uma vez, numa camada fixa de `100lvh`, e as camadas de borda são degradês. Nenhum deles tem animação ou JS, e o CLS continua 0.
- Na arquitetura, FCP e LCP subiram 0,1 s. Todas as páginas continuam dentro do orçamento.

### 3.4 Medições do PR #15

Mesmo método (Lighthouse 12 mobile, 3 execuções, mediana, `dist/` local), com `NO_SHINE`, WebGL 2, o foco neutro e a lupa nova:

| Página | Nota | TBT | FCP | LCP | TTI | CLS | Peso | JS (transferido) |
|---|---|---|---|---|---|---|---|---|
| Início | 98 | 140 ms (era 130) | 1,5 s | 2,0 s | 2,2 s | 0 | 187 KiB | 76 KiB |
| Amostra | 94 (era 93) | 220 ms (era 230) | 1,7 s | 2,4 s | 2,6 s | 0 | 277 KiB | 95 KiB |
| Painel | 97 (era 98) | 140 ms (era 120) | 1,7 s | 2,0 s | 2,0 s | 0 | 152 KiB | 103 KiB |
| Galeria | 96 | 70 ms | 1,7 s | 2,6 s | 2,6 s | 0 | 313 KiB | 99 KiB |
| Contrato de design | 98 | 100 ms (era 90) | 1,7 s | 2,0 s | 2,0 s | 0 | 159 KiB | 104 KiB |
| Arquitetura e operação | 97 | 100 ms (era 90) | 1,8 s | 2,1 s | 2,1 s | 0 | 155 KiB | 115 KiB |

As variações de TBT (10–20 ms) estão dentro do ruído entre execuções (no Painel, 120, 190 e 140 ms). Todas as páginas continuam dentro do orçamento.

- **Pixels:** 96 capturas de tela de antes (`main`) e depois (3 contextos: Chromium desktop, iPhone 15 emulado no Chromium e iPhone 15 no WebKit; claro e escuro; Início, Amostra, Painel e Galeria; 4 posições de rolagem; movimento reduzido para as lentes pararem): todas idênticas, diferença máxima 0/255.
- **Lente do título da amostra** (fps do `requestAnimationFrame` em 6 s com a lente orbitando, mediana de 3 execuções, render por software): o `<filter>` caiu de 19 para 17 primitivas.

  | Contexto | Antes | Depois | p95 do quadro |
  |---|---|---|---|
  | iPhone 15 emulado no Chromium | 10,3 fps | **13,7 fps** | 117 → 83 ms |
  | Chromium desktop, CPU 4× mais lenta | 8,5 fps | **10,2 fps** | 133 → 117 ms |
  | iPhone 15 no WebKit | 8,7 fps | 8,8 fps | igual |

  No WebKit o ganho não aparece: ali o custo é a rasterização do bloco inteiro do título (§4), não as duas primitivas.
- **Lupa da galeria** (arrasto de 120 pontos em duas voltas, fps do `requestAnimationFrame` durante o arrasto):

  | Contexto | Antes | Depois | Duração do arrasto |
  |---|---|---|---|
  | iPhone 15 no WebKit (eventos de toque, 16 ms entre eles) | 2,5 fps (p95 460 ms) | **12,7 fps** (p95 88 ms) | 15,7 → 4,6 s |
  | iPhone 15 emulado no Chromium | 40 fps (p95 33 ms) | **43 fps** (p95 33 ms) | igual (~2 s) |
  | Chromium desktop (`filterResolution` 2) | 12,8 fps (p95 150 ms) | **19,1 fps** (p95 67 ms) | 9,4 → 6,4 s |

  React: 121 commits por arrasto antes, 0 depois; no Chromium, o tempo de script do arrasto caiu de 53 para 16 ms (iPhone emulado) e de 83 para 27 ms (desktop). O maior ganho no WebKit vem do recorte da cópia: antes, a fonte do filtro era a foto inteira ampliada 1,8× (≈700×470 CSS px, ×3 no iPhone), e o WebKit a rasterizava a cada quadro e ainda a reduzia (a lupa ficava mais borrada); agora é a lupa mais 40px de cada lado. No Chromium a lupa parada ficou igual à de antes (84 pixels com diferença acima de 8/255, na borda); no WebKit ela ficou mais nítida.

### 3.5 Medições do menu com o `<Glass>`

`pnpm build` local; soma dos chunks JS de cada página, em gzip. O chunk compartilhado (`Surfaces-*.js`) tem 88 KB gz, com a biblioteca dentro.

| Página | PR #15 | Menu com o `<Glass>` | Orçamento (§3) |
|---|---|---|---|
| Início | 76 KB | **90 KB** | ≤ 80 KB: **estoura** |
| Amostra | 95 KB | 93 KB | ≤ 100 KB |
| Painel | 102 KB | 99 KB | ≤ 110 KB |
| Galeria | 98 KB | 96 KB | ≤ 110 KB |
| Contrato de design | 104 KB | 119 KB | ≤ 130 KB |
| Arquitetura e operação | 117 KB | **133 KB** | ≤ 130 KB: **estoura** |

- Início e Arquitetura passam do orçamento porque passaram a baixar a biblioteca (P3). Na amostra, no painel e na galeria ela já vinha; lá o total caiu um pouco, porque o chunk próprio dela deixou de existir.
- Quem levar esta mudança para a `main` DEVE justificar o estouro no PR (regra do §3).
- A pílula e a lista ☰ são fosco só (A12). Os três botões de 34px continuam sendo o `<Glass>` que puxa a biblioteca para o chunk compartilhado.

## 4. Limites conhecidos (custo do próprio design)

- **A lente do título da amostra.** O modo "no lugar" aplica `filter: url(#…)` com 17 primitivas SVG (19 até o PR #14) sobre **todo** o bloco do título (~353×451 CSS px no iPhone 15, com `will-change: filter`), e não só sobre o disco da lente, de 130–200 px. Isso é refeito a cada quadro enquanto a lente orbita.
  - Parada no topo da amostra: ~11–12 fps em render por software no PR #14; 13,7 fps no PR #15 (iPhone emulado no Chromium, §3.4). Com movimento reduzido, 60 fps.
  - Reduzir esse custo exige mudar a biblioteca (restringir a região do filtro) ou o efeito.
- **Os 5 botões com curvatura ao vivo no Chromium e os desfoques** (o `frost` do `vidro.ini` nos painéis) são o próprio visual. Nos experimentos do PR #9 na amostra, no Chromium, com movimento reduzido:

  | Configuração | fps de rolagem |
  |---|---|
  | Completa | ~19 |
  | Sem o `url()` dos botões | ~30 |
  | Sem o hero | ~39 |
  | Sem os foscos | ~31 |

- **React e react-dom** somam ~60 KB gz e são necessários.
- **Primeiro layout:** no PR #9, ~385 ms a 4× de CPU, atribuídos a texto e fonte. O PR #12 achou a causa principal (a busca de famílias de fonte ausentes) e a resolveu com a regra P7.
- **Mermaid:** o renderizador de diagramas é grande (~3,4 MB brutos em vários chunks). Ele só é baixado quando alguém toca em "Desenhar diagrama", e o código do diagrama fica legível antes disso.
- **Folha da galeria no WebKit:** o Safari não desfoca o que fica atrás de um `<dialog>` na top layer, então a folha usa uma tinta mais densa em vez de depender do desfoque.
- **GitHub Pages:** `max-age=600` e só gzip, sem configuração. Veja [DEPLOY.md](DEPLOY.md).
