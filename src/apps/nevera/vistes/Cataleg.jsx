/**
 * La Nevera de Casa · el CATÀLEG sencer i els ARTICLES PROPIS, sobre l'esquelet.
 *   ColumnaCatalegSencer  tots els articles (totes les seccions, també les
 *                         amagades a la llista); tocar-ne un obri el detall:
 *                         especificació, posar-lo a la llista del camí i, si
 *                         és propi, esborrar-lo. «Busca o crea un article»
 *                         també troba els productes de botiga i n'obri el
 *                         detall.
 *   ColumnaArticlesPropis els que ha creat la persona (LiniesColleccio).
 * Ordre del Mestre, 261004 (prompt 261004_0515) · El catàleg és de targetes
 * (forma="targetes" de l'esquelet: UniversalCard).
 */
import { Trash2 } from 'lucide-react';
import { Boto } from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, ColumnaColleccio, useVistaCataleg } from '../../comu/esquelet/index.js';
import { AvisNevera } from './AvisNevera.jsx';
import { autoriaDArticle } from './autoria.js';
import { CATALEG } from './constants.js';
import { useVistaNevera } from './context.js';
import { useObriDetall } from './useObriDetall.js';
import { articlesVestits, perArticle, productesALaGraella, seccionsDe, suggerimentsVestits } from './vestits.js';

const textPropis = (n) => (n === 0 ? 'Cap encara' : `${n} ${n === 1 ? 'article' : 'articles'}`);

/* La confirmació d'esborrar un article propi: desapareix de tot arreu. */
function useEsborraPropi() {
  const { accions, demanaConfirmacio } = useVistaNevera();
  return (article) => demanaConfirmacio({
    titol: `Vols esborrar «${article.nom}»?`,
    descripcio: 'Desapareixerà del catàleg, de totes les llistes i d’«A casa».',
    etiquetaConfirma: 'Esborra',
    accio: () => accions.esborraArticlePropi(article.id)
  });
}

export function ColumnaCatalegSencer({ params }) {
  const { estat, accions, llistaVigent } = useVistaNevera();
  /* La fitxa d'un producte de botiga també el posa a la graella, com el detall (vestits.js). */
  const { article: obert, fitxa } = useVistaCataleg();
  const esborra = useEsborraPropi();
  const llista = llistaVigent(params);
  const linies = perArticle(llista);
  const propis = new Set(estat.propis.map((propi) => propi.id));
  const vestit = { aLaLlista: new Set(linies.keys()), secundari: (a) => linies.get(a.id)?.especificacio };
  /* REGLA D'OR 1 (261004) · Cada targeta, amb la boina de qui signa l'article (autoria.js). */
  const articles = articlesVestits(estat, { ...vestit, productes: productesALaGraella(estat, llista.id, obert || fitxa), autoria: autoriaDArticle });
  return (
    <ColumnaCataleg
      forma="targetes"
      titol="Catàleg"
      categories={seccionsDe(estat, llista.id, { totesVisibles: true })}
      articles={articles}
      textosEstat={{ 'en-colleccio': `A «${llista.nom}»` }}
      onTria={(article, { obriDetall }) => obriDetall()}
      afegit={{ etiqueta: 'Busca o crea un article', suggeriments: suggerimentsVestits(estat, vestit), onCrea: (text) => accions.creaArticlePropi(text) }}
      detall={{
        ambQuantitat: false,
        etiquetaNota: 'Especificació',
        textAccepta: `Posa-ho a «${llista.nom}»`,
        inicialDe: (article) => ({ nota: linies.get(article.id)?.especificacio ?? '' }),
        onAccepta: ({ nota }, article) => accions.afig(llista.id, article.id, { especificacio: nota }),
        accionsDe: (article, tanca) => (propis.has(article.id) ? (
          <Boto varietat="perill" icona={Trash2} onClick={() => {
            tanca();
            esborra(article);
          }}>Esborra l’article</Boto>
        ) : null)
      }}
      resum={{ etiqueta: 'Articles propis', comptador: propis.size, textComptador: textPropis }}
      primer={CATALEG.primer}
      tram={CATALEG.tram}
    />
  );
}

export function ColumnaArticlesPropis({ params }) {
  const { estat, llistaVigent } = useVistaNevera();
  const esborra = useEsborraPropi();
  const obriDetall = useObriDetall(CATALEG);
  const llista = llistaVigent(params);
  const linies = perArticle(llista);
  const files = estat.propis.map((propi) => ({
    id: propi.id,
    articleId: propi.id,
    nom: propi.nom,
    detall: linies.has(propi.id) ? `A «${llista.nom}»` : undefined
  }));
  return (
    <ColumnaColleccio
      titol="Articles propis"
      linies={files}
      resum={{ etiqueta: 'Articles propis', comptador: files.length, textComptador: textPropis }}
      onTria={(linia) => obriDetall(linia.articleId)}
      onLleva={(linia) => esborra({ id: linia.articleId, nom: linia.nom })}
      textosLinies={{ lleva: (nom) => `Esborra ${nom}` }}
      textos={{
        buit: 'Encara no n’has creat cap',
        buitText: 'Escriu el nom a «Busca o crea un article» i tria «Afig… com a article nou».',
        tornaCataleg: 'Torna al catàleg'
      }}
      peu={<AvisNevera />}
      primer={CATALEG.primer}
      tram={CATALEG.tram}
    />
  );
}
