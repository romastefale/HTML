import React from "react";
import { DocsPage, type Skyline } from "./Docs";
import arq from "../../docs/ARQUITETURA.md?doc";
import desempenho from "../../docs/DESEMPENHO.md?doc";
import deploy from "../../docs/DEPLOY.md?doc";
import checklist from "../../docs/CHECKLIST-VERIFICACAO.md?doc";
import historico from "../../docs/HISTORICO.md?doc";

const C = (href: string, author: string, lic: string, licHref: string) => (
  <>
    Foto: <a href={href}>{author}</a>, {licHref ? <a href={licHref}>{lic}</a> : lic}
  </>
);

const CHICAGO: Skyline = {
  name: "chicago-amanhecer",
  alt: "Horizonte de Chicago ao amanhecer, com a Willis Tower e os prédios refletidos no Lago Michigan",
  place: "Chicago ao amanhecer",
  credit: C(
    "https://commons.wikimedia.org/wiki/File:Chicago_sunrise_1.jpg",
    "Daniel Schwen", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/",
  ),
};
const SINGAPURA: Skyline = {
  name: "singapura-entardecer",
  alt: "Centro financeiro de Singapura ao entardecer, com a Marina Bay, o museu em forma de flor de lótus e prédios iluminados",
  place: "Marina Bay, Singapura",
  credit: C(
    "https://commons.wikimedia.org/wiki/File:Skylines_of_the_Central_Business_District,_Singapore_at_dusk.jpg",
    "Basile Morin", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/",
  ),
};
const HONG_KONG: Skyline = {
  name: "hong-kong-noite-tufao",
  alt: "Arranha-céus de Hong Kong iluminados numa noite de tufão, com o céu nublado em tons de laranja",
  place: "Hong Kong numa noite de tufão",
  credit: C(
    "https://commons.wikimedia.org/wiki/File:Hong_Kong_skyscrapers_in_a_night_of_typhoon.jpg",
    "Wilfredor", "CC0", "https://creativecommons.org/publicdomain/zero/1.0/",
  ),
};

export const ContratoArquitetura: React.FC = () => (
  <DocsPage
    self="arquitetura"
    eyebrow="Contrato · docs/"
    lead={
      <>
        Como o projeto é construído e mantido: stack, componentes, desempenho, deploy, checklist e o histórico de cada
        PR. O texto vem direto da pasta <code>docs/</code> do repositório.
      </>
    }
    hero={CHICAGO}
    docs={[
      { doc: arq, label: "Arquitetura" },
      { doc: desempenho, label: "Desempenho", before: SINGAPURA },
      { doc: deploy, label: "Deploy" },
      { doc: checklist, label: "Checklist" },
      { doc: historico, label: "Histórico", before: HONG_KONG },
    ]}
  />
);
