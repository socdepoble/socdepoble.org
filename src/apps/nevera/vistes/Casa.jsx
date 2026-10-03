/**
 * La Nevera de Casa · A CASA (la nevera i el rebost), sobre l'esquelet.
 *   ColumnaACasa      tots els articles amb el que en queda («N’hi ha», «Se
 *                     n’acaba», «S’ha acabat»); el que se seguix va davant.
 *                     Tocar-ne un obri la tria directa de l'esquelet (disseny
 *                     del Bar §A.6, flux 1): un toc tria i tanca.
 *   ColumnaCalComprar el que s'ha acabat o se n'acaba i no és a la llista
 *                     del camí: «+» l'afig; «Afig-ho tot», tot d'una.
 * «A casa» és de tota la casa, no d'una llista: es veuen totes les seccions,
 * també les que la llista del camí amaga al seu catàleg.
 */
import { Plus, Refrigerator } from 'lucide-react';
import { Boto } from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, ColumnaColleccio } from '../../comu/esquelet/index.js';
import { propostesDeCasa } from '../nucli/index.js';
import { AvisNevera } from './AvisNevera.jsx';
import { CASA } from './constants.js';
import { textArticles, useVistaNevera } from './context.js';
import { useObriDetall } from './useObriDetall.js';
import { TEXTOS_CASA, articlesVestits, liniesVestides, perArticle, seccionsDe } from './vestits.js';

const VARIANTS_CASA = Object.freeze([
  { valor: 'hi-ha', etiqueta: TEXTOS_CASA['hi-ha'] },
  { valor: 'se-n-acaba', etiqueta: TEXTOS_CASA['se-n-acaba'] },
  { valor: 'acabat', etiqueta: TEXTOS_CASA.acabat }
]);
const DEIXA = Object.freeze({ valor: 'deixa', etiqueta: 'No el seguisques' });

export function ColumnaACasa({ params }) {
  const { estat, accions, llistaVigent } = useVistaNevera();
  const llista = llistaVigent(params);
  const linies = perArticle(llista);
  const aCasa = new Map(estat.casa.map((entrada) => [entrada.articleId, entrada.estat]));
  const articles = articlesVestits(estat, { aLaLlista: new Set(linies.keys()), secundari: (a) => TEXTOS_CASA[aCasa.get(a.id)] });
  const seguits = articles.filter((article) => aCasa.has(article.id));
  const propostes = propostesDeCasa(estat, llista.id);
  return (
    <ColumnaCataleg
      titol="A casa"
      categories={seccionsDe(estat, llista.id, { totesVisibles: true })}
      articles={articles}
      destacats={seguits.length ? [{ id: 'seguits', nom: 'El que tens a casa', icona: Refrigerator, articles: seguits }] : []}
      textosEstat={{ 'en-colleccio': `A «${llista.nom}»` }}
      onTria={(article, { obriDetall }) => obriDetall()}
      afegit={{ etiqueta: 'Busca a casa…', suggeriments: articles }}
      detall={{
        triaDirecta: true,
        etiquetaVariants: 'Què en tens?',
        variantsDe: (article) => (aCasa.has(article.id) ? [...VARIANTS_CASA, DEIXA] : VARIANTS_CASA),
        onAccepta: ({ variant }, article) => accions.marcaACasa(article.id, variant === DEIXA.valor ? null : variant),
        accionsDe: (article, tanca) => (linies.has(article.id) ? null : (
          <Boto icona={Plus} onClick={() => {
            accions.afig(llista.id, article.id);
            tanca();
          }}>{`Afig a «${llista.nom}»`}</Boto>
        ))
      }}
      resum={{ etiqueta: 'Cal comprar', comptador: propostes.length, textComptador: textArticles }}
      primer={CASA.primer}
      tram={CASA.tram}
    />
  );
}

export function ColumnaCalComprar({ params }) {
  const { estat, accions, llistaVigent } = useVistaNevera();
  const obriDetall = useObriDetall(CASA);
  const llista = llistaVigent(params);
  const propostes = propostesDeCasa(estat, llista.id);
  const linies = liniesVestides(estat, propostes, { detall: (proposta) => TEXTOS_CASA[proposta.estat] });
  return (
    <ColumnaColleccio
      titol="Cal comprar"
      linies={linies}
      resum={{
        etiqueta: `Per a «${llista.nom}»`,
        comptador: linies.length,
        textComptador: textArticles,
        accio: { text: 'Afig-ho tot', onClick: () => accions.afigPropostes(llista.id), desactivada: linies.length === 0 }
      }}
      onTria={(linia) => obriDetall(linia.articleId)}
      onSuma={(linia) => accions.afig(llista.id, linia.articleId)}
      textosLinies={{ suma: (nom) => `Afig ${nom} a «${llista.nom}»` }}
      textos={{
        buit: 'No cal comprar res',
        buitText: 'Quan marques que alguna cosa se n’acaba o s’ha acabat, apareixerà ací.',
        tornaCataleg: 'Torna a «A casa»'
      }}
      peu={<AvisNevera />}
      primer={CASA.primer}
      tram={CASA.tram}
    />
  );
}
