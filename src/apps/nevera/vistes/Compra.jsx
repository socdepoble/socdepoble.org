/**
 * La Nevera de Casa · LA COMPRA i LES LLISTES, sobre l'esquelet comú.
 *
 * Ordre del Mestre (261002, sinergies T4/T8): les mateixes columnes que el
 * TPV del bar, amb una altra intel·ligència de dades. Ací no hi ha cap
 * graella, llista ni targeta pròpia: només es vestixen les dades del nucli.
 *   ColumnaLlistes      «Les meues llistes» (ColumnaColleccions: targetes)
 *   ColumnaLaCompra     el que falta, en targetes a l'estil de Bring: un toc
 *                       ho marca com a comprat (ix i passa a «Recents»)
 *   ColumnaLlistaActiva la mateixa llista, al costat de «Llistes»
 *   ColumnaCatalegCompra els articles per seccions de la llista, «Recents»
 *                       davant, «Necessite…» (amb els productes de botiga)
 *                       i l'especificació (DetallArticle)
 * Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes») · El
 * catàleg i la llista porten forma="targetes": cada article és una
 * UniversalCard de l'esquelet (les rajoles pròpies ja no). La resta, igual.
 */
import { Clock, Trash2 } from 'lucide-react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { Boto, Botonera } from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, ColumnaColleccio, ColumnaColleccions, useVistaCataleg } from '../../comu/esquelet/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { textosBuitNevera, textosVistaNevera } from '../i18nNevera.js';
import { ARTICLES_PRODUCTES, LIMITS, articlePerId, liniesOrdenades, recentsDisponibles } from '../nucli/index.js';
import { ambPreusMercadona, esLlistaMercadona, nomLlistaVisible } from '../mercadona.js';
import { AvisNevera } from './AvisNevera.jsx';
import { autoriaDArticle } from './autoria.js';
import { COMPRA } from './constants.js';
import { llistaDelCami, textArticles, useVistaNevera } from './context.js';
import { useObriDetall } from './useObriDetall.js';
import { AvisCatalegMercadona, ComparadorMercadona, useMercadona } from './Mercadona.jsx';
import { ComparticioLlistaCompra } from './ComparticioLlistaCompra.jsx';
import { EncarrecBotigaPoble } from './EncarrecBotigaPoble.jsx';
import { RecepcioRecepta } from './RecepcioRecepta.jsx';
import {
  articlesVestits, entradetaDe, liniesVestides, nomArticleVisible, perArticle, productesALaGraella, seccionsDe, subtitolDe, suggerimentsVestits
} from './vestits.js';

function textosLlistaDe(idioma) {
  const tx = textosBuitNevera(idioma);
  return {
    enColleccio: tx.llistaEnColleccio,
    buit: tx.llistaBuida,
    buitText: tx.llistaBuidaText,
    obriCataleg: tx.llistaObriCataleg
  };
}

function textosLlistaDesconegudaDe(idioma) {
  const tx = textosBuitNevera(idioma);
  return {
    ...textosLlistaDe(idioma),
    buit: tx.llistaDesconeguda,
    buitText: tx.llistaDesconegudaText
  };
}

/** «Les meues llistes»: cada targeta és un enllaç a /app/nevera/llista/<id>. */
export function ColumnaLlistes({ params }) {
  const { estat, accions, ruta, obriNovaLlista, llistaVigent, mode, llegit } = useVistaNevera();
  const { idioma = 'ca' } = useClosaAplicacio();
  const tx = textosVistaNevera(idioma);
  const navigate = useNavigate();
  const mercadona = estat.llistes.find(esLlistaMercadona);
  return (
    <ColumnaColleccions
      titol={tx.lesMeuesLlistes}
      colleccions={estat.llistes.map((llista) => ({ id: llista.id, nom: nomLlistaVisible(llista.nom), comptador: llista.linies.length }))}
      actiu={llistaDelCami(params) ?? llistaVigent(null).id}
      hrefDe={(colleccio) => ruta(COMPRA.entrada, colleccio.id)}
      onCrea={obriNovaLlista}
      textCrea={tx.creaUnaLlista}
      textComptador={idioma === 'ca' ? textArticles : tx.textArticlesCount}
      avis={(
        <Botonera etiqueta={tx.catalegsDeCompra}>
          <Boto disabled={!mercadona && (!llegit || mode === 'lectora' || estat.llistes.length >= LIMITS.llistes)} onClick={() => {
            const id = mercadona?.id || accions.creaLlista(tx.botigaDePoble);
            if (id) navigate(ruta(COMPRA.entrada, id));
          }}>{tx.catalegDeBotiga}</Boto>
        </Botonera>
      )}
    />
  );
}

/* `vigent`: fora de La compra, una llista que ja no existix mostra la per
   defecte mentre AppNevera canonitza el camí; a La compra, ho diu. */
function LaCompra({ params, ambEdicio, vigent = false }) {
  const { estat, accions, llistaDe, llistaVigent } = useVistaNevera();
  const { idioma } = useClosaAplicacio();
  const tx = textosVistaNevera(idioma);
  const obriDetall = useObriDetall(COMPRA);
  const llista = vigent ? llistaVigent(params) : llistaDe(params);
  if (!llista) {
    return <ColumnaColleccio titol={tx.llistaDesconegudaTitol} linies={[]} textos={textosLlistaDesconegudaDe(idioma)} primer={COMPRA.primer} tram={COMPRA.tram} />;
  }
  /* REGLA D'OR 1 (261004) · Cada targeta, amb la boina de qui signa l'article (autoria.js). */
  const linies = liniesVestides(estat, liniesOrdenades(estat, llista.id), { autoria: autoriaDArticle, idioma });
  return (
    <ColumnaColleccio
      forma="targetes"
      ometDataNoIndicada
      titol={nomLlistaVisible(llista.nom)}
      linies={linies}
      resum={{ etiqueta: tx.perComprar, comptador: linies.length, textComptador: idioma === 'ca' ? textArticles : tx.textArticlesCount }}
      onTria={(linia) => accions.marcaComprat(llista.id, linia.articleId)}
      onEdita={ambEdicio ? (linia) => obriDetall(linia.articleId) : undefined}
      textos={textosLlistaDe(idioma)}
      avis={(
        <>
          <RecepcioRecepta llista={llista} />
          {/* R16-F · Compartir la llista i rebre'n una (#compartida=…). */}
          <ComparticioLlistaCompra key={llista.id} llista={llista} />
          {/* IDEA-258b (Onada R24) · Precomanda per a la botiga local / de poble. */}
          <EncarrecBotigaPoble key={`encarrec:${llista.id}`} llista={llista} />
        </>
      )}
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
  const { idioma } = useClosaAplicacio();
  const txBuit = textosBuitNevera(idioma);
  const tx = textosVistaNevera(idioma);
  /* La fitxa d'un producte de botiga també el posa a la graella, com el detall (vestits.js). */
  const { article: obert, fitxa } = useVistaCataleg();
  const llista = llistaDe(params);
  const deMercadona = esLlistaMercadona(llista);
  const { dades: catalegMercadona, error: errorMercadona } = useMercadona(deMercadona || Boolean((obert || fitxa)?.startsWith('mer-')));
  const linies = perArticle(llista);
  const vestit = { aLaLlista: new Set(linies.keys()), secundari: (a) => linies.get(a.id)?.especificacio, idioma };
  const productes = deMercadona ? ARTICLES_PRODUCTES : productesALaGraella(estat, llista?.id, obert || fitxa);
  const vestits = articlesVestits(estat, { ...vestit, productes, autoria: autoriaDArticle })
    .filter((article) => !deMercadona || article.id.startsWith('mer-') || linies.has(article.id));
  const articles = ambPreusMercadona(vestits, catalegMercadona?.productes);
  const recents = llista ? recentsDisponibles(estat, llista.id) : [];
  const destacats = recents.length ? [{
    id: 'recents',
    nom: tx.recents,
    icona: Clock,
    articles: recents.map((recent) => {
      const article = articlePerId(estat, recent.articleId);
      return {
        id: article.id, nom: nomArticleVisible(article), categoriaId: article.categoriaId, secundari: recent.especificacio || undefined,
        /* REGLA D'OR 1 (261004) · La boina de la targeta, com les de la graella (vestits.js). */
        autoria: autoriaDArticle(article),
        /* Integració final (261004, F04) · El subtítol i l'entradeta, com les de la graella. */
        subtitol: subtitolDe(article, idioma),
        entradeta: entradetaDe(article, idioma)
      };
    })
  }] : [];
  const especificacioRecent = (id) => llista?.recents.find((recent) => recent.articleId === id)?.especificacio ?? '';

  return (
    <ColumnaCataleg
      forma="targetes"
      ometDataNoIndicada
      titol={tx.cataleg}
      avis={deMercadona ? <AvisCatalegMercadona dades={catalegMercadona} error={errorMercadona} /> : null}
      categories={seccionsDe(estat, llista?.id, { idioma })}
      articles={articles}
      destacats={destacats}
      commutable
      textosEstat={{ 'en-colleccio': tx.aLaLlista }}
      onTria={llista ? (article) => accions.commuta(llista.id, article.id) : undefined}
      afegit={llista ? {
        etiqueta: tx.necessite,
        suggeriments: suggerimentsVestits(estat, vestit),
        onTria: (article) => accions.afig(llista.id, article.id),
        onCrea: (text) => accions.afigPerNom(llista.id, text)
      } : null}
      detall={llista ? {
        contingutDe: (article) => {
          const producte = catalegMercadona?.productes.find((p) => p.id === article.id);
          return producte ? <ComparadorMercadona key={producte.id} producte={producte} /> : null;
        },
        ambQuantitat: false,
        etiquetaNota: tx.especificacio,
        textAccepta: tx.posaHoALaLlista,
        inicialDe: (article) => ({ nota: linies.get(article.id)?.especificacio ?? especificacioRecent(article.id) }),
        onAccepta: ({ nota }, article) => accions.afig(llista.id, article.id, { especificacio: nota }),
        accionsDe: (article, tanca) => (linies.has(article.id) ? (
          <Boto icona={Trash2} onClick={() => {
            accions.lleva(llista.id, article.id);
            tanca();
          }}>{tx.llevaDeLaLlista}</Boto>
        ) : null)
      } : null}
      resum={llista ? { etiqueta: nomLlistaVisible(llista.nom), comptador: linies.size, textComptador: idioma === 'ca' ? textArticles : tx.textArticlesCount } : null}
      textos={{ buit: txBuit.catalegBuit, buitText: txBuit.catalegBuitText }}
      primer={COMPRA.primer}
      tram={COMPRA.tram}
    />
  );
}
