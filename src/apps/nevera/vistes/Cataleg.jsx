/**
 * La Nevera de Casa · el CATÀLEG sencer i els ARTICLES PROPIS, sobre l'esquelet.
 *   ColumnaCatalegSencer  tots els articles (totes les seccions, també les
 *                         amagades a la llista); tocar-ne un obri el detall:
 *                         especificació, posar-lo a la llista del camí i, si
 *                         és propi, esborrar-lo. «Busca o crea un article».
 *   ColumnaArticlesPropis els que ha creat la persona (LiniesColleccio).
 */
import { Trash2 } from 'lucide-react';
import { Boto } from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, ColumnaColleccio } from '../../comu/esquelet/index.js';
import { AvisNevera } from './AvisNevera.jsx';
import { CATALEG } from './constants.js';
import { useVistaNevera } from './context.js';
import { useObriDetall } from './useObriDetall.js';
import { articlesVestits, perArticle, seccionsDe } from './vestits.js';

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
  const esborra = useEsborraPropi();
  const llista = llistaVigent(params);
  const linies = perArticle(llista);
  const propis = new Set(estat.propis.map((propi) => propi.id));
  const articles = articlesVestits(estat, { aLaLlista: new Set(linies.keys()), secundari: (a) => linies.get(a.id)?.especificacio });
  return (
    <ColumnaCataleg
      titol="Catàleg"
      categories={seccionsDe(estat, llista.id, { totesVisibles: true })}
      articles={articles}
      textosEstat={{ 'en-colleccio': `A «${llista.nom}»` }}
      onTria={(article, { obriDetall }) => obriDetall()}
      afegit={{ etiqueta: 'Busca o crea un article', suggeriments: articles, onCrea: (text) => accions.creaArticlePropi(text) }}
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
