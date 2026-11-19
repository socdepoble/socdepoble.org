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
import { useClosaAplicacio } from '../../plataforma/index.js';
import { textosBuitNevera, textosVistaNevera } from '../i18nNevera.js';
import { AvisNevera } from './AvisNevera.jsx';
import { autoriaDArticle } from './autoria.js';
import { CATALEG } from './constants.js';
import { useVistaNevera } from './context.js';
import { useObriDetall } from './useObriDetall.js';
import { articlesVestits, perArticle, productesALaGraella, seccionsDe, suggerimentsVestits } from './vestits.js';

const textPropisDe = (tx) => (n) => (n === 0 ? tx.capEncara : tx.textArticlesCount(n));

/* La confirmació d'esborrar un article propi: desapareix de tot arreu. */
function useEsborraPropi(tx) {
  const { accions, demanaConfirmacio } = useVistaNevera();
  return (article) => demanaConfirmacio({
    titol: tx.volsEsborrarArticle(article.nom),
    descripcio: tx.esborrarArticleDesc,
    etiquetaConfirma: tx.esborra,
    accio: () => accions.esborraArticlePropi(article.id)
  });
}

export function ColumnaCatalegSencer({ params }) {
  const { estat, accions, llistaVigent } = useVistaNevera();
  const { idioma } = useClosaAplicacio();
  const txBuit = textosBuitNevera(idioma);
  const tx = textosVistaNevera(idioma);
  /* La fitxa d'un producte de botiga també el posa a la graella, com el detall (vestits.js). */
  const { article: obert, fitxa } = useVistaCataleg();
  const esborra = useEsborraPropi(tx);
  const llista = llistaVigent(params);
  const linies = perArticle(llista);
  const propis = new Set(estat.propis.map((propi) => propi.id));
  const vestit = { aLaLlista: new Set(linies.keys()), secundari: (a) => linies.get(a.id)?.especificacio };
  /* REGLA D'OR 1 (261004) · Cada targeta, amb la boina de qui signa l'article (autoria.js). */
  const articles = articlesVestits(estat, { ...vestit, productes: productesALaGraella(estat, llista.id, obert || fitxa), autoria: autoriaDArticle });
  return (
    <ColumnaCataleg
      forma="targetes"
      ometDataNoIndicada
      titol={tx.cataleg}
      categories={seccionsDe(estat, llista.id, { totesVisibles: true })}
      articles={articles}
      textosEstat={{ 'en-colleccio': tx.aLlistaNom(llista.nom) }}
      onTria={(article, { obriDetall }) => obriDetall()}
      afegit={{ etiqueta: tx.buscaOCreaArticle, suggeriments: suggerimentsVestits(estat, vestit), onCrea: (text) => accions.creaArticlePropi(text) }}
      detall={{
        ambQuantitat: false,
        etiquetaNota: tx.especificacio,
        textAccepta: tx.posaHoALlistaNom(llista.nom),
        inicialDe: (article) => ({ nota: linies.get(article.id)?.especificacio ?? '' }),
        onAccepta: ({ nota }, article) => accions.afig(llista.id, article.id, { especificacio: nota }),
        accionsDe: (article, tanca) => (propis.has(article.id) ? (
          <Boto varietat="perill" icona={Trash2} onClick={() => {
            tanca();
            esborra(article);
          }}>{tx.esborraLArticle}</Boto>
        ) : null)
      }}
      resum={{ etiqueta: tx.articlesPropis, comptador: propis.size, textComptador: textPropisDe(tx) }}
      textos={{ buit: txBuit.catalegBuit, buitText: txBuit.catalegBuitText }}
      primer={CATALEG.primer}
      tram={CATALEG.tram}
    />
  );
}

export function ColumnaArticlesPropis({ params }) {
  const { estat, llistaVigent } = useVistaNevera();
  const { idioma } = useClosaAplicacio();
  const txBuit = textosBuitNevera(idioma);
  const tx = textosVistaNevera(idioma);
  const esborra = useEsborraPropi(tx);
  const obriDetall = useObriDetall(CATALEG);
  const llista = llistaVigent(params);
  const linies = perArticle(llista);
  const files = estat.propis.map((propi) => ({
    id: propi.id,
    articleId: propi.id,
    nom: propi.nom,
    detall: linies.has(propi.id) ? tx.aLlistaNom(llista.nom) : undefined
  }));
  return (
    <ColumnaColleccio
      titol={tx.articlesPropis}
      linies={files}
      resum={{ etiqueta: tx.articlesPropis, comptador: files.length, textComptador: textPropisDe(tx) }}
      onTria={(linia) => obriDetall(linia.articleId)}
      onLleva={(linia) => esborra({ id: linia.articleId, nom: linia.nom })}
      textosLinies={{ lleva: tx.esborraNom }}
      textos={{
        buit: txBuit.propisBuit,
        buitText: txBuit.propisBuitText,
        tornaCataleg: txBuit.propisTornaCataleg
      }}
      peu={<AvisNevera />}
      primer={CATALEG.primer}
      tram={CATALEG.tram}
    />
  );
}
