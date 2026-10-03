/**
 * La Nevera de Casa · LA COMPRA i LES LLISTES, sobre l'esquelet comú.
 *
 * Ordre del Mestre (261002, sinergies T4/T8): les mateixes columnes que el
 * TPV del bar, amb una altra intel·ligència de dades. Ací no hi ha cap
 * graella, llista ni targeta pròpia: només es vestixen les dades del nucli.
 *   ColumnaLlistes      «Les meues llistes» (ColumnaColleccions: targetes)
 *   ColumnaLaCompra     el que falta, en rajoles a l'estil de Bring: un toc
 *                       ho marca com a comprat (ix i passa a «Recents»)
 *   ColumnaLlistaActiva la mateixa llista, al costat de «Llistes»
 *   ColumnaCatalegCompra els articles per seccions de la llista, «Recents»
 *                       davant, «Necessite…» i l'especificació (DetallArticle)
 */
import { Clock, Trash2 } from 'lucide-react';
import { Boto } from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, ColumnaColleccio, ColumnaColleccions } from '../../comu/esquelet/index.js';
import { articlePerId, liniesOrdenades, recentsDisponibles } from '../nucli/index.js';
import { AvisNevera } from './AvisNevera.jsx';
import { COMPRA } from './constants.js';
import { llistaDelCami, textArticles, useVistaNevera } from './context.js';
import { useObriDetall } from './useObriDetall.js';
import { articlesVestits, liniesVestides, perArticle, seccionsDe } from './vestits.js';

const TEXTOS_LLISTA = Object.freeze({
  enColleccio: 'Per comprar',
  buit: 'La llista és buida',
  buitText: 'Afig el que falta des del catàleg o amb «Necessite…».',
  obriCataleg: 'Afig des del catàleg'
});

const TEXTOS_LLISTA_DESCONEGUDA = Object.freeze({
  ...TEXTOS_LLISTA,
  buit: 'Esta llista no existix',
  buitText: 'Potser s’ha esborrat. Tria’n una altra a «Les meues llistes».'
});

/** «Les meues llistes»: cada targeta és un enllaç a /app/nevera/llista/<id>. */
export function ColumnaLlistes({ params }) {
  const { estat, ruta, obriNovaLlista, llistaVigent } = useVistaNevera();
  return (
    <ColumnaColleccions
      titol="Les meues llistes"
      colleccions={estat.llistes.map((llista) => ({ id: llista.id, nom: llista.nom, comptador: llista.linies.length }))}
      actiu={llistaDelCami(params) ?? llistaVigent(null).id}
      hrefDe={(colleccio) => ruta(COMPRA.entrada, colleccio.id)}
      onCrea={obriNovaLlista}
      textCrea="Crea una llista"
      textComptador={textArticles}
    />
  );
}

/* `vigent`: fora de La compra, una llista que ja no existix mostra la per
   defecte mentre AppNevera canonitza el camí; a La compra, ho diu. */
function LaCompra({ params, ambEdicio, vigent = false }) {
  const { estat, accions, llistaDe, llistaVigent } = useVistaNevera();
  const obriDetall = useObriDetall(COMPRA);
  const llista = vigent ? llistaVigent(params) : llistaDe(params);
  if (!llista) {
    return <ColumnaColleccio titol="Llista desconeguda" linies={[]} textos={TEXTOS_LLISTA_DESCONEGUDA} primer={COMPRA.primer} tram={COMPRA.tram} />;
  }
  const linies = liniesVestides(estat, liniesOrdenades(estat, llista.id));
  return (
    <ColumnaColleccio
      titol={llista.nom}
      linies={linies}
      forma="rajoles"
      resum={{ etiqueta: 'Per comprar', comptador: linies.length, textComptador: textArticles }}
      onTria={(linia) => accions.marcaComprat(llista.id, linia.articleId)}
      onEdita={ambEdicio ? (linia) => obriDetall(linia.articleId) : undefined}
      textos={TEXTOS_LLISTA}
      peu={<AvisNevera />}
      primer={COMPRA.primer}
      tram={COMPRA.tram}
    />
  );
}

/** La llista de la ruta (o l'activa): el mig de La compra. */
export function ColumnaLaCompra({ params }) {
  return <LaCompra params={params} ambEdicio />;
}

/** La llista del camí (/llistes/<id>) al costat de «Llistes» (sense detall: el catàleg no es veu ací). */
export function ColumnaLlistaActiva({ params }) {
  return <LaCompra params={params} ambEdicio={false} vigent />;
}

/** El catàleg de La compra: tocar posa o lleva de la llista; el botó dret dona l'especificació. */
export function ColumnaCatalegCompra({ params }) {
  const { estat, accions, llistaDe } = useVistaNevera();
  const llista = llistaDe(params);
  const linies = perArticle(llista);
  const articles = articlesVestits(estat, { aLaLlista: new Set(linies.keys()), secundari: (a) => linies.get(a.id)?.especificacio });
  const recents = llista ? recentsDisponibles(estat, llista.id) : [];
  const destacats = recents.length ? [{
    id: 'recents',
    nom: 'Recents',
    icona: Clock,
    articles: recents.map((recent) => {
      const article = articlePerId(estat, recent.articleId);
      return { id: article.id, nom: article.nom, categoriaId: article.categoriaId, secundari: recent.especificacio || undefined };
    })
  }] : [];
  const especificacioRecent = (id) => llista?.recents.find((recent) => recent.articleId === id)?.especificacio ?? '';

  return (
    <ColumnaCataleg
      titol="Catàleg"
      categories={seccionsDe(estat, llista?.id)}
      articles={articles}
      destacats={destacats}
      commutable
      textosEstat={{ 'en-colleccio': 'A la llista' }}
      onTria={llista ? (article) => accions.commuta(llista.id, article.id) : undefined}
      afegit={llista ? {
        etiqueta: 'Necessite…',
        suggeriments: articles,
        onTria: (article) => accions.afig(llista.id, article.id),
        onCrea: (text) => accions.afigPerNom(llista.id, text)
      } : null}
      detall={llista ? {
        ambQuantitat: false,
        etiquetaNota: 'Especificació',
        textAccepta: 'Posa-ho a la llista',
        inicialDe: (article) => ({ nota: linies.get(article.id)?.especificacio ?? especificacioRecent(article.id) }),
        onAccepta: ({ nota }, article) => accions.afig(llista.id, article.id, { especificacio: nota }),
        accionsDe: (article, tanca) => (linies.has(article.id) ? (
          <Boto icona={Trash2} onClick={() => {
            accions.lleva(llista.id, article.id);
            tanca();
          }}>Lleva de la llista</Boto>
        ) : null)
      } : null}
      resum={llista ? { etiqueta: llista.nom, comptador: linies.size, textComptador: textArticles } : null}
      primer={COMPRA.primer}
      tram={COMPRA.tram}
    />
  );
}
