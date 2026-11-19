/**
 * La Nevera de Casa · A CASA (la nevera i el rebost), sobre l'esquelet.
 *   ColumnaACasa      tots els articles amb el que en queda («N’hi ha», «Se
 *                     n’acaba», «S’ha acabat»); el que se seguix va davant.
 *                     Tocar-ne un obri la tria directa de l'esquelet (disseny
 *                     del Bar §A.6, flux 1): un toc tria i tanca.
 *   ColumnaCalComprar el que s'ha acabat o se n'acaba i no és a la llista
 *                     del camí: «+» l'afig; «Afig-ho tot», tot d'una.
 * «A casa» és de tota la casa, no d'una llista: es veuen totes les seccions,
 * també les que la llista del camí amaga al seu catàleg. «Busca a casa…»
 * també troba els productes de botiga; els que se seguixen ixen a la graella.
 * Ordre del Mestre, 261004 (prompt 261004_0515) · La graella és de targetes
 * (forma="targetes" de l'esquelet: UniversalCard). «Cal comprar» continua en
 * línies.
 */
import { Plus, Refrigerator } from 'lucide-react';
import { Boto } from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, ColumnaColleccio, useVistaCataleg } from '../../comu/esquelet/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { textosBuitNevera, textosVistaNevera } from '../i18nNevera.js';
import { propostesDeCasa } from '../nucli/index.js';
import { AvisNevera } from './AvisNevera.jsx';
import { autoriaDArticle } from './autoria.js';
import { CASA } from './constants.js';
import { textArticles, useVistaNevera } from './context.js';
import { useObriDetall } from './useObriDetall.js';
import {
  articlesVestits, liniesVestides, perArticle, productesALaGraella, seccionsDe, suggerimentsVestits, textosCasa
} from './vestits.js';

export function ColumnaACasa({ params }) {
  const { estat, accions, llistaVigent } = useVistaNevera();
  const { idioma } = useClosaAplicacio();
  const txBuit = textosBuitNevera(idioma);
  const tx = textosVistaNevera(idioma);
  const txCasa = textosCasa(idioma);
  const variantsCasa = [
    { valor: 'hi-ha', etiqueta: txCasa['hi-ha'] },
    { valor: 'se-n-acaba', etiqueta: txCasa['se-n-acaba'] },
    { valor: 'acabat', etiqueta: txCasa.acabat }
  ];
  const deixa = { valor: 'deixa', etiqueta: tx.noElSeguisques };
  /* La fitxa d'un producte de botiga també el posa a la graella, com el detall (vestits.js). */
  const { article: obert, fitxa } = useVistaCataleg();
  const llista = llistaVigent(params);
  const linies = perArticle(llista);
  const aCasa = new Map(estat.casa.map((entrada) => [entrada.articleId, entrada.estat]));
  const vestit = { aLaLlista: new Set(linies.keys()), secundari: (a) => txCasa[aCasa.get(a.id)], idioma };
  /* REGLA D'OR 1 (261004) · Cada targeta, amb la boina de qui signa l'article (autoria.js). */
  const articles = articlesVestits(estat, { ...vestit, productes: productesALaGraella(estat, llista.id, obert || fitxa), autoria: autoriaDArticle });
  const seguits = articles.filter((article) => aCasa.has(article.id));
  const propostes = propostesDeCasa(estat, llista.id);
  return (
    <ColumnaCataleg
      forma="targetes"
      ometDataNoIndicada
      titol={tx.aCasa}
      categories={seccionsDe(estat, llista.id, { totesVisibles: true, idioma })}
      articles={articles}
      destacats={seguits.length ? [{ id: 'seguits', nom: tx.elQueTensACasa, icona: Refrigerator, articles: seguits }] : []}
      textosEstat={{ 'en-colleccio': tx.aLlistaNom(llista.nom) }}
      onTria={(article, { obriDetall }) => obriDetall()}
      afegit={{ etiqueta: tx.buscaACasa, suggeriments: suggerimentsVestits(estat, vestit) }}
      detall={{
        triaDirecta: true,
        etiquetaVariants: tx.queEnTens,
        variantsDe: (article) => (aCasa.has(article.id) ? [...variantsCasa, deixa] : variantsCasa),
        onAccepta: ({ variant }, article) => accions.marcaACasa(article.id, variant === deixa.valor ? null : variant),
        accionsDe: (article, tanca) => (linies.has(article.id) ? null : (
          <Boto icona={Plus} onClick={() => {
            accions.afig(llista.id, article.id);
            tanca();
          }}>{tx.afigALlistaNom(llista.nom)}</Boto>
        ))
      }}
      resum={{ etiqueta: tx.calComprar, comptador: propostes.length, textComptador: idioma === 'ca' ? textArticles : tx.textArticlesCount }}
      textos={{ buit: txBuit.catalegBuit, buitText: txBuit.catalegBuitText }}
      primer={CASA.primer}
      tram={CASA.tram}
    />
  );
}

export function ColumnaCalComprar({ params }) {
  const { estat, accions, llistaVigent } = useVistaNevera();
  const { idioma } = useClosaAplicacio();
  const txBuit = textosBuitNevera(idioma);
  const tx = textosVistaNevera(idioma);
  const txCasa = textosCasa(idioma);
  const obriDetall = useObriDetall(CASA);
  const llista = llistaVigent(params);
  const propostes = propostesDeCasa(estat, llista.id);
  const linies = liniesVestides(estat, propostes, { detall: (proposta) => txCasa[proposta.estat], idioma });
  return (
    <ColumnaColleccio
      titol={tx.calComprar}
      linies={linies}
      resum={{
        etiqueta: tx.perALlistaNom(llista.nom),
        comptador: linies.length,
        textComptador: idioma === 'ca' ? textArticles : tx.textArticlesCount,
        accio: { text: tx.afigHoTot, onClick: () => accions.afigPropostes(llista.id), desactivada: linies.length === 0 }
      }}
      onTria={(linia) => obriDetall(linia.articleId)}
      onSuma={(linia) => accions.afig(llista.id, linia.articleId)}
      textosLinies={{ suma: (nom) => tx.afigItemALlistaNom(nom, llista.nom) }}
      textos={{
        buit: txBuit.casaCalComprarBuit,
        buitText: txBuit.casaCalComprarBuitText,
        tornaCataleg: txBuit.casaTornaCataleg
      }}
      peu={<AvisNevera />}
      primer={CASA.primer}
      tram={CASA.tram}
    />
  );
}
