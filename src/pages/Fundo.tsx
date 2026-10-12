import React from "react";
import { SiteHeader, type NavItem } from "../components/SiteHeader";
import { GlassCaption, GlassPanel, Picture } from "../components/Surfaces";
import { AnimatedBackground } from "../components/AnimatedBackground";
import "./Home.css";
import "./Fundo.css";

/*
 * Fundo animado: the home's feed of frosted cards over the animated background
 * of romastefale/aurora alt-version.html (components/AnimatedBackground.tsx)
 * instead of the static SVG. A grid of photo cards, then how the background
 * is drawn.
 */

const NAV: NavItem[] = [
  { href: "#topo", label: "Início" },
  { href: "#fotos", label: "Fotos" },
  { href: "#receita", label: "Receita" },
  { href: "#desfoque", label: "Desfoque" },
  { href: "#movimento", label: "Movimento" },
  { href: "#bordas", label: "Bordas" },
  { href: "#desempenho", label: "Desempenho" },
];

const TILES = [
  { name: "santorini-oia", w: 1600, h: 1067, title: "Oia, Santorini", alt: "Três cúpulas azuis de igrejas brancas em Oia, Santorini, acima do mar Egeu azul-escuro" },
  { name: "lencois-maranhenses", w: 1600, h: 1200, title: "Lençóis Maranhenses", alt: "Lagoa azul entre dunas brancas e curvas nos Lençóis Maranhenses, sob céu azul" },
  { name: "toquio-torre-minato", w: 1600, h: 900, title: "Torre de Tóquio", alt: "Tóquio à noite vista do alto, com a Torre de Tóquio iluminada em laranja entre os prédios de Minato" },
  { name: "cataratas-do-iguacu", w: 1600, h: 1200, title: "Cataratas do Iguaçu", alt: "Arco-íris sobre as Cataratas do Iguaçu, vistas do lado argentino, cercadas de mata verde" },
  { name: "singapura-entardecer", w: 1600, h: 900, title: "Singapura", alt: "Arranha-céus de Singapura ao entardecer, com o céu alaranjado refletido na água" },
  { name: "nova-york-midtown-noite", w: 1600, h: 900, title: "Midtown, Nova York", alt: "Prédios iluminados de Midtown, em Nova York, à noite" },
];

const Photo: React.FC<{ name: string; alt: string; w: number; h: number; children: React.ReactNode }> = ({ name, alt, w, h, children }) => (
  <figure className="photo">
    <Picture name={name} alt={alt} w={w} h={h} lazy sizes="(min-width: 600px) 528px, calc(100vw - 72px)" />
    <figcaption>
      <GlassCaption>
        <span className="cap">{children}</span>
      </GlassCaption>
    </figcaption>
  </figure>
);

const Card: React.FC<{ id: string; avatar?: string; title: string; subtitle: string; children: React.ReactNode }> = ({
  id,
  avatar = "",
  title,
  subtitle,
  children,
}) => (
  <GlassPanel className="card-glass">
    <article className="card" id={id}>
      <div className="card-header">
        <div className={`avatar ${avatar}`} />
        <div>
          <h2 className="card-title">{title}</h2>
          <p className="card-subtitle">{subtitle}</p>
        </div>
      </div>
      {children}
    </article>
  </GlassPanel>
);

export const Fundo: React.FC = () => (
  <>
    <AnimatedBackground />
    <a className="skip" href="#conteudo">
      Pular para o conteúdo
    </a>
    <SiteHeader items={NAV} current={"fundo"} />
    <main className="feed" id="conteudo">
      <GlassPanel className="card-glass">
        <section className="intro" id="topo" aria-labelledby="fundo-title">
          <h1 id="fundo-title">Fundo animado</h1>
          <p>
            O fundo desta página não é uma imagem: é a animação da{" "}
            <a className="card-link" href="https://romastefale.github.io/aurora/alt-version.html">
              Aurora Alt
            </a>
            , desenhada ao vivo em WebGL atrás dos cartões. Manchas de cor translúcidas e desfocadas passeiam pela tela,
            crescem, encolhem e trocam de cor devagar. Role a página e veja o vidro fosco dos cartões desfocar o
            movimento que passa por baixo.
          </p>
        </section>
      </GlassPanel>

      <section className="fundo-fotos" id="fotos" aria-labelledby="fotos-title">
        <h2 id="fotos-title" className="portal-title">
          Cartões de imagem
        </h2>
        <ul className="fundo-grid">
          {TILES.map((t) => (
            <li key={t.name}>
              <figure className="fundo-place">
                <Picture name={t.name} alt={t.alt} w={t.w} h={t.h} lazy sizes="(min-width: 600px) 277px, calc(50vw - 23px)" />
                <figcaption>
                  <GlassCaption>
                    <span className="cap">
                      <strong>{t.title}</strong>
                    </span>
                  </GlassCaption>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <Card id="receita" title="A receita" subtitle="Sete elipses">
        <p className="card-body">
          A cena tem sete elipses. O raio de cada uma vai de 22% a 49% do lado maior da tela, então elas são grandes e se
          sobrepõem. Cada elipse tem uma cor própria, de matiz sorteado a cada visita, com a mesma saturação e a mesma
          luminosidade para todas: no claro, cores mais vivas e opacas; no escuro, mais fundas e um pouco mais
          transparentes. Elas são empilhadas uma sobre a outra, como camadas de vidro colorido, sobre uma cor de base
          clara ou escura.
        </p>
        <Photo name="aurora-boreal-alasca" alt="Aurora boreal verde e roxa no céu noturno sobre a neve, no Alasca" w={1600} h={1043}>
          Aurora boreal, Alasca: a inspiração do nome
        </Photo>
      </Card>

      <Card id="desfoque" avatar="alt" title="O desfoque" subtitle="Calculado, não filtrado">
        <p className="card-body">
          Não há filtro de desfoque nem imagem borrada. Para cada pixel, o shader mede a distância até a borda de cada
          elipse e transforma essa distância em transparência com a função de erro (<code>erf</code>), que é a forma
          exata da borda de um desfoque gaussiano. O raio do desfoque é 4,9% do lado maior da tela. As cores são
          misturadas em luz linear, como a luz se soma de verdade, e só no fim voltam para sRGB, então a transição entre
          duas cores não fica acinzentada. Por último, um pontilhado de Bayer 4×4, menor que um degrau de cor, apaga as
          faixas que um degradê longo costuma mostrar.
        </p>
      </Card>

      <Card id="movimento" avatar="alt2" title="O movimento" subtitle="Senos lentos">
        <p className="card-body">
          Cada elipse tem quatro ondas próprias, de frequência e fase sorteadas. Duas levam o centro de um lado ao outro
          da tela (e um pouco além da borda), uma faz o raio respirar 15% para mais e para menos, e a última estica a
          elipse. As ondas levam de meio minuto a mais de um minuto para completar uma volta, e as frequências não
          combinam entre si, então a cena não se repete. A cor de cada elipse gira de 3 a 8 graus de matiz por
          segundo, umas no sentido horário e outras no anti-horário.
        </p>
        <Photo name="hong-kong-noite-tufao" alt="Arranha-céus de Hong Kong à noite sob nuvens baixas de tufão" w={1600} h={900}>
          Hong Kong em noite de tufão
        </Photo>
      </Card>

      <Card id="bordas" avatar="alt3" title="As bordas" subtitle="Barras do navegador">
        <p className="card-body">
          Nos 14% de cima e de baixo da tela, a animação se funde suavemente na cor que o navegador usa nas barras, a
          mesma das outras páginas do portal. Assim a barra de status e a barra de baixo continuam da cor da página, e a
          animação nunca termina numa linha reta. O desenho ocupa a altura da tela com as barras recolhidas (
          <code>100lvh</code>) e fica fixo: a página rola por cima dele.
        </p>
      </Card>

      <Card id="desempenho" avatar="alt4" title="Desempenho e acessibilidade" subtitle="Leve por padrão">
        <p className="card-body">
          A animação é desenhada na metade da resolução da tela: como tudo é desfoque, ampliar não mostra diferença, e a
          placa de vídeo calcula quatro vezes menos pixels. O laço usa <code>requestAnimationFrame</code>, que o
          navegador pausa quando a aba não está visível. Com “reduzir movimento” ativado no sistema, ou quando o WebGL
          roda no processador em vez da placa de vídeo, a página mostra um quadro parado. Sem WebGL, fica o fundo
          estático das outras páginas. Se o navegador descartar o contexto WebGL, a animação volta sozinha quando ele é
          restaurado.
        </p>
      </Card>
    </main>
  </>
);
