import React, { useRef } from "react";
import { GlassNav, type NavItem } from "../components/GlassNav";
import { PageSearch, SEARCH_INPUT_ID } from "../components/PageSearch";
import { GlassCaption, GlassPanel, asset, CREDITS_URL, SAMPLE_URL } from "../components/Surfaces";
import "./Home.css";

const NAV: NavItem[] = [
  { href: "#topo", label: "Início", current: true },
  { href: SAMPLE_URL, label: "Amostra" },
  {
    href: `#${SEARCH_INPUT_ID}`,
    label: "Pesquisar",
    onSelect: (e) => {
      e.preventDefault();
      document.getElementById(SEARCH_INPUT_ID)?.focus();
    },
  },
];

const Photo: React.FC<{ src: string; alt: string; w: number; h: number; lazy?: boolean; children: React.ReactNode }> = ({
  src,
  alt,
  w,
  h,
  lazy,
  children,
}) => (
  <figure className="photo">
    <img src={asset(src)} alt={alt} width={w} height={h} loading={lazy ? "lazy" : undefined} decoding="async" />
    <figcaption>
      <GlassCaption>
        <span className="cap">{children}</span>
      </GlassCaption>
    </figcaption>
  </figure>
);

const Card: React.FC<{ avatar?: string; title: string; subtitle: string; children: React.ReactNode }> = ({
  avatar = "",
  title,
  subtitle,
  children,
}) => (
  <GlassPanel className="card-glass">
    <article className="card">
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

export const Home: React.FC = () => {
  const main = useRef<HTMLElement>(null);
  return (
    <>
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <GlassNav items={NAV} />
      <main ref={main} className="feed" id="conteudo">
        <GlassPanel className="card-glass">
          <section className="intro" id="topo" aria-labelledby="home-title">
            <h1 id="home-title">Interface de vidro</h1>
            <p>
              Role a página: o menu no topo se recolhe num botão redondo de vidro, e a barra de pesquisa lá embaixo
              encontra qualquer palavra nesta página.
            </p>
          </section>
        </GlassPanel>

        <Card avatar="alt2" title="Amostra Liquid Glass" subtitle="Nova página">
          <p className="card-body">
            Vidro líquido que refrata o conteúdo ao vivo, com fallback em blur.{" "}
            <a className="card-link" href={SAMPLE_URL}>
              Abrir a amostra →
            </a>
          </p>
        </Card>

        <Card title="Menu que se recolhe" subtitle="Navegação">
          <p className="card-body">
            No topo da página o menu aparece inteiro. Ao rolar, a pílula de vidro se transforma num botão redondo com
            três pontos, e o conteúdo ganha destaque. Toque nos três pontos para abrir o menu de novo.
          </p>
          <Photo
            src="img/hong-kong-victoria-harbour.jpg"
            alt="Arranha-céus iluminados às margens do Porto de Victoria, em Hong Kong, ao entardecer"
            w={1600}
            h={1063}
          >
            Porto de Victoria, Hong Kong · Foto:{" "}
            <a href="https://commons.wikimedia.org/wiki/File:Victoria_Harbour_skyscrapers.jpg">Wilfredor</a>, CC0
          </Photo>
        </Card>

        <Card avatar="alt" title="Pesquisar na página" subtitle="Busca">
          <p className="card-body">
            Digite uma palavra na barra de vidro lá embaixo, como “vidro” ou “foto”: cada ocorrência fica destacada e o
            contador mostra “1 de N”. <kbd>Enter</kbd> vai para a próxima, <kbd>Shift</kbd>+<kbd>Enter</kbd> volta e{" "}
            <kbd>Esc</kbd> limpa. Acentos e maiúsculas não importam.
          </p>
        </Card>

        <Card avatar="alt2" title="Fundo em gradiente suave" subtitle="Transparência">
          <p className="card-body">
            O fundo é um único gradiente translúcido, sem formas. Ele começa e termina na mesma cor, que também é a cor
            usada pelo navegador atrás das barras, então o topo da tela parece continuar a página.
          </p>
          <Photo
            src="img/rio-pao-de-acucar.jpg"
            alt="Pão de Açúcar sobre a Baía de Guanabara, no Rio de Janeiro, com mata verde e céu azul"
            w={1600}
            h={990}
            lazy
          >
            Pão de Açúcar, Rio de Janeiro · Foto:{" "}
            <a href="https://commons.wikimedia.org/wiki/File:Sugarloaf_Mountain,_Rio_de_Janeiro,_Brazil.jpg">Wilfredor</a>, CC0
          </Photo>
        </Card>

        <Card title="Cartões de vidro" subtitle="Componentes React">
          <p className="card-body">
            Cada cartão é um componente React que usa o <code>&lt;Glass&gt;</code> da biblioteca liquid-glass: vidro
            fosco sobre o gradiente, com luz suave nas bordas em vez de linhas finas.
          </p>
        </Card>

        <Card avatar="alt" title="Céu noturno" subtitle="Foto">
          <p className="card-body">
            A coluna usa a largura disponível e se limita a 564px em telas maiores; os controles de vidro ficam por cima
            enquanto a página rola.
          </p>
          <Photo
            src="img/aurora-boreal-alasca.jpg"
            alt="Aurora boreal verde e roxa no céu noturno sobre a neve, no Alasca"
            w={1600}
            h={1043}
            lazy
          >
            Aurora boreal, Alasca · Foto:{" "}
            <a href="https://commons.wikimedia.org/wiki/File:Aurora_borealis_over_Eielson_Air_Force_Base,_Alaska.jpg">
              Senior Airman Joshua Strang (USAF)
            </a>
            , domínio público
          </Photo>
        </Card>

        <GlassPanel className="card-glass">
          <footer className="foot">
            Fotos do Wikimedia Commons; créditos e licenças em <a href={CREDITS_URL}>CREDITS.md</a>. Efeito:{" "}
            <a href="https://github.com/romastefale/liquid-glass">liquid-glass</a> (MIT © Sam Asante), via o pacote{" "}
            <code>@samasante/liquid-glass</code>.
          </footer>
        </GlassPanel>
      </main>
      <PageSearch scope={main} />
    </>
  );
};
