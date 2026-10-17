/**
 * Lector de notícies · l'entrada «Notícies» (/app/lector/noticies…), muntada
 * sobre l'espai de treball del Bloc de notes.
 *
 * Bloc 0 del Gauntlet (ordre del Mestre, 261016, prompt 261016_0015) ·
 * «Prohibit crear noves targetes inventades o jerarquies caòtiques a
 * /app/lector/noticies. El Lector s'ha de muntar directament sobre el patró
 * UniversalWorkspace de Bloc de notes (panell d'arbre/carpetes a l'esquerra,
 * flux de lectura net a la dreta).» Pla 261016_0015, Onada 2: «llista de
 * carpetes a l'esquerra, vista prèvia i lectura neta a la dreta». Deroga les
 * columnes pròpies de l'ordre del 261004 (Carpetes.jsx, Fonts.jsx i la graella
 * de UniversalCard d'esta vista, amb la Revista i les Targetes): és el mateix
 * espai que el Bloc i la Wiki, per la seua façana (la porta 'workspace' del
 * nucli 1.2.0, plataforma/contracteNucli.js), sense cap classe pròpia.
 *
 *   navegació  l'arbre de l'espai, a la manera de Feedly: «Hui», «Per a
 *              després», les categories del poble i, dins de cada una, les
 *              fonts que se seguixen. Cada fila porta el seu recompte de no
 *              llegides (`count`: l'espai no en suma cap; el de «Per a
 *              després», les desades que encara no s'han llegit). «Totes» és
 *              el «Tot» de l'espai. Cap botó de crear (sense onCreate).
 *   llista     la fila per defecte de l'espai (DefaultItemCard): el títol i,
 *              de subtítol, «font · data · Nou», amb la icona de la seua
 *              categoria. Cap imatge: ItemMedia la demanaria sense política de
 *              referent i la notícia de fora deixaria de ser privada.
 *   detall     sense notícia, la carpeta: quantes n'hi ha i «Marca-ho tot com
 *              a llegit» (amb una cerca, només els resultats que es veuen a
 *              la llista, i el botó ho diu: F2 del Gauntlet, 261016), sempre
 *              de la llista que es veu, també quan la carpeta de la URL és
 *              amagada a la roda dentada; amb ?article=<id>, la lectura
 *              immersiva (Lector.jsx), que en estret torna a la llista en
 *              tancar-la, també amb l'Arrere del sistema (encàrrec F del
 *              Gauntlet, 261016).
 *   teclat     E1 del Gauntlet (261016) · les dreceres d'un sol caràcter de
 *              Feedly (J/K, N/P, O, M, S, V, Maj+A, Maj+J/Maj+K: dreceres.js),
 *              només amb el focus dins de la closca (WCAG 2.1.4). Cap píxel.
 * Mana la URL (navegacio.js): triar a l'arbre o a la llista navega (push); el
 * que l'espai reconcilia (una carpeta que ja no hi és), replace. La notícia
 * oberta es queda a la llista on s'ha vist fins que la persona navega (llevar
 * «Desa per a després» no la trau de «Per a després»), i l'instant de «Hui» és
 * el de la llista (AppLector.jsx): obrir-la no la mou de carpeta. L'espai no
 * obri cap notícia pel seu compte (canAutoSelect): obrir-la la marca com a
 * llegida, i això només ho decidix la persona. En tancar-la, el focus torna a
 * la seua fila si la llista és la mateixa (el `retorn` de Lector.jsx). Una
 * altra carpeta o una altra font torna la llista a dalt, sense tocar el focus;
 * obrir i tancar una notícia de la mateixa carpeta la deixa on era.
 */
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Folder, Newspaper, Rss, Sun } from 'lucide-react';
import { useLocation, useNavigate } from '../../../app/contexts/RouterContext';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { EstatBuit, MarcColumna } from '../../../components/PedraSeca/index.js';
import { UniversalWorkspace } from '../../../components/universal/workspace/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import {
  DESPRES, HUI, articlesDeCarpeta, comptadorsCarpetes, dataDeBoina, esDeHui, ordenaPerData, senseFinal, seguix
} from '../nucli/index.js';
import { AvisLector, MarcaTotLlegit } from './comunes.jsx';
import { useVistaLector } from './context.js';
import { iconaDeCategoria } from './icones.js';
import { DreceresDeNoticies } from './dreceres.js';
import { CLOSCA, Lector, focusLliure } from './Lector.jsx';
import {
  NOM_CARPETA_FIXA, carpetaDeOpcio, fontDeOpcio, opcioDeCarpeta, opcioDeFont, opcioDeLaSeleccio, rutaDeSeleccio, seleccioDeRuta
} from './navegacio.js';

/* La pell del Lector: tot el que l'espai de treball no ha de saber. */
const ETIQUETES = Object.freeze({
  categories: 'CARPETES',
  items: 'NOTÍCIES',
  all: 'Totes',
  search: 'Cercar notícies',
  loading: 'Carregant les notícies…',
  error: 'No s’han pogut carregar les notícies.',
  select: 'Tria una notícia.'
});
const ICONES = Object.freeze({ categories: Folder, items: Newspaper });
const ESTAT_DE_L_ESPAI = Object.freeze({ carregant: 'loading', llest: 'ready', error: 'error' });
/* L'espai no tria cap notícia pel seu compte: obrir-la la marcaria com a llegida. */
const CAP_TRIA_AUTOMATICA = () => false;
/* Una notícia de la URL que no és a la llista (d'una font que ja no se seguix, un enllaç
   compartit…): l'espai no en decidix l'absència. La resol el detall (Lector.jsx · useArticle),
   amb els seus estats de sempre: carregant, error i «Esta notícia ja no hi és». */
const LA_RESOL_EL_DETALL = async () => ({ status: 'found' });
const GRUP = 'carpetes';
/* Els scrollers de la llista, dins de la closca: el cos de la columna del mig i, plegada, el seu
   rail de documents (a la mateixa columna en ample i en mitjana; a #app-grid-rail en estret).
   Mai l'arbre ni el detall. */
const SCROLL_DE_LA_LLISTA = '#app-grid-list .sdp-workspace-column__body, .sdp-workspace-rail--documents';
/* Una columna que la closca té tancada (AppGridShell la marca inert): el navegador no hi enfoca res. */
const COLUMNA_TANCADA = '[inert]';

const textNoticies = (n) => `${n} ${n === 1 ? 'notícia' : 'notícies'}`;

const BUITS = Object.freeze({
  [HUI]: Object.freeze(['Hui encara no hi ha res nou', 'Les notícies de les últimes 24 hores de les fonts que seguixes apareixeran ací.']),
  [DESPRES]: Object.freeze(['No has desat res per a després', 'Obri una notícia i toca «Desa per a després» per a guardar-la ací.']),
  altres: Object.freeze(['No hi ha cap notícia ací', 'Quan esta font o esta carpeta publiquen, ho voràs ací.'])
});
/* El buit d'una carpeta ('hui', 'despres', una categoria o null). */
const buitDe = (carpeta) => BUITS[carpeta && Object.hasOwn(BUITS, carpeta) ? carpeta : 'altres'];

/* L'arbre: les carpetes fixes, les categories del poble i les fonts que se seguixen, cada una
   dins de la seua categoria (una font sense categoria, a l'arrel). Els recomptes són de no
   llegides: el de «Per a després», de les desades que encara no s'han llegit, perquè l'espai
   en diu el text accessible d'un sol patró («{n} sense llegir»). */
function opcionsDeLArbre({ noticies, estat, ara }) {
  const llegits = new Set(estat.llegits);
  const comptes = comptadorsCarpetes({ ...noticies, estat, ara });
  const categories = new Set(noticies.categories.map((categoria) => categoria.id));
  const perFont = new Map();
  for (const article of noticies.articles) {
    if (!llegits.has(article.id)) perFont.set(article.fontId, (perFont.get(article.fontId) || 0) + 1);
  }
  const primeraFont = 2 + noticies.categories.length;
  return [
    { id: opcioDeCarpeta(HUI), label: NOM_CARPETA_FIXA[HUI], icon: Sun, order: 0, count: comptes.get(HUI) || 0 },
    {
      id: opcioDeCarpeta(DESPRES), label: NOM_CARPETA_FIXA[DESPRES], icon: Bookmark, order: 1,
      count: estat.despres.filter((desat) => !llegits.has(desat.id)).length
    },
    ...noticies.categories.map((categoria, i) => ({
      id: opcioDeCarpeta(categoria.id), label: categoria.nom, icon: iconaDeCategoria(categoria.icona), order: 2 + i,
      count: comptes.get(categoria.id) || 0
    })),
    ...noticies.fonts.filter((font) => seguix(estat, font.id)).map((font, i) => ({
      id: opcioDeFont(font.id), label: font.nom, icon: Rss, order: primeraFont + i,
      parentId: categories.has(font.categoriaId) ? opcioDeCarpeta(font.categoriaId) : null,
      count: perFont.get(font.id) || 0
    }))
  ];
}

/* Les files de la llista: les notícies de les fonts que se seguixen i les desades (encara que la
   font ja no les servisca), cadascuna amb les opcions de l'arbre on viu. De la més nova a la més
   vella; a «Per a després», en l'ordre en què es van desar (el del nucli). */
function filesDeLaLlista({ noticies, estat, ara, desfas, carpeta }) {
  const llegits = new Set(estat.llegits);
  const desats = new Set(estat.despres.map((desat) => desat.id));
  const fonts = new Map(noticies.fonts.map((font) => [font.id, font]));
  const categories = new Map(noticies.categories.map((categoria) => [categoria.id, categoria]));
  const vives = ordenaPerData(noticies.articles.filter((article) => fonts.has(article.fontId) && seguix(estat, article.fontId)));
  const deVives = new Set(vives.map((article) => article.id));
  const despres = articlesDeCarpeta({ ...noticies, estat, carpeta: DESPRES, ara }) || [];
  const ordre = carpeta === DESPRES
    ? [...despres, ...vives.filter((article) => !desats.has(article.id))]
    : ordenaPerData([...vives, ...despres.filter((article) => !deVives.has(article.id))]);
  return ordre.map((article) => {
    const font = fonts.get(article.fontId) || null;
    const seguida = Boolean(font) && seguix(estat, font.id);
    const categoria = seguida && font.categoriaId ? categories.get(font.categoriaId) || null : null;
    const boina = dataDeBoina(article.data, desfas);
    /* «font · data · Nou», sempre en text. Sense font coneguda, l'autor de l'article: mai
       «Sóc de Poble», que no l'ha escrita. */
    const subtitol = [font?.nom || article.autor, boina ? `${boina.time} ${boina.date}` : null, llegits.has(article.id) ? null : 'Nou']
      .filter(Boolean).join(' · ');
    return {
      id: article.id,
      title: senseFinal(article.titol),
      subtitle: subtitol || undefined,
      icon: (categoria && iconaDeCategoria(categoria.icona)) || Rss,
      categoryIds: [
        categoria ? opcioDeCarpeta(categoria.id) : null,
        seguida ? opcioDeFont(font.id) : null,
        seguida && esDeHui(article, ara) ? opcioDeCarpeta(HUI) : null,
        desats.has(article.id) ? opcioDeCarpeta(DESPRES) : null
      ].filter(Boolean),
      searchText: [article.titol, font?.nom, article.autor, article.resum].filter(Boolean).join(' ')
    };
  });
}

/* El nom de la selecció: la carpeta, la font o «Totes». Claus pròpies: una categoria del poble
   que es diguera 'constructor' no ha de llegir res d'Object.prototype. */
function nomDeLaSeleccio(categoryId, noticies) {
  if (categoryId == null) return ETIQUETES.all;
  const carpeta = carpetaDeOpcio(categoryId);
  if (carpeta) {
    if (Object.hasOwn(NOM_CARPETA_FIXA, carpeta)) return NOM_CARPETA_FIXA[carpeta];
    return noticies.categories.find((categoria) => categoria.id === carpeta)?.nom || 'Notícies';
  }
  const fontId = fontDeOpcio(categoryId);
  return noticies.fonts.find((font) => font.id === fontId)?.nom || 'Notícies';
}

/* El detall sense cap notícia oberta: la carpeta, quantes en porta i «Marca-ho tot com a
   llegit», el ✓ de la capçalera de la llista de Feedly. L'avís del disc, dins del marc.
   `ancora`: un node del detall des d'on EspaiNoticies troba la closca (el scroll de la llista).
   Pedra Seca no passa refs: és un <span> sense classe al voltant del text, i cap píxel canvia.
   F2 del Gauntlet (261016, defecte L1-2) · `resultats`: amb una cerca, els ids que es veuen a la
   llista (els dona l'espai a renderDetail); el botó marca només eixos i ho diu. El resum i el
   buit continuen sent de la carpeta (`ids`). Sense cerca, null: el botó i l'abast de sempre. */
function SenseNoticia({ titol, ids, resultats = null, buit, ancora }) {
  const { lector } = useVistaLector();
  const llegits = new Set(lector.estat.llegits);
  const noLlegides = ids.filter((id) => !llegits.has(id)).length;
  const marca = <MarcaTotLlegit ids={resultats ?? ids} filtrat={resultats != null} />;
  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} />} eines={marca} avis={<AvisLector />} etiqueta={titol}>
      {ids.length ? (
        <EstatBuit titol="Tria una notícia">
          <span ref={ancora}>
            {`${textNoticies(ids.length)}, ${noLlegides ? `${noLlegides} sense llegir` : 'totes llegides'}. Obri’n una de la llista per a llegir-la.`}
          </span>
        </EstatBuit>
      ) : <EstatBuit titol={buit[0]}><span ref={ancora}>{buit[1]}</span></EstatBuit>}
    </MarcColumna>
  );
}

/* La notícia oberta. En estret (el mestre-detall de l'espai), tancar-la torna a la llista,
   com l'arrere de Feedly al mòbil; en ample i en mitjana, la llista ja es veu al costat. L'aspa,
   «Tornar» i Esc obrin la llista en el mateix pas que tanquen (el focus troba la fila a la
   vista); l'Arrere del sistema, que no passa per ací, el cobrix TornaALaLlista. */
function DetallDeNoticia({ id, tanca, retorn }) {
  const { mida, obriPanell } = useClosaAplicacio();
  const onTanca = useCallback(() => {
    tanca();
    if (mida === 'estret') obriPanell('mig');
  }, [tanca, mida, obriPanell]);
  return <Lector id={id} onTanca={onTanca} retorn={retorn} />;
}

/* Encàrrec F del Gauntlet (261016, P2) · En estret, deixar la notícia torna a la llista vinga
   d'on vinga. L'Arrere del sistema (el d'Android, history.back) només lleva ?article= de la URL,
   sense passar per onTanca, i la closca aplica el panell d'eixida només en muntar (AppGridShell,
   panellEstret): es quedava al detall buit, «Tria una notícia», en lloc de la llista. Viu dins de
   la closca, davant del detall (amb notícia i sense), i en el pas d'una notícia oberta a cap obri
   el panell de la llista si encara no ho és; l'aspa ja l'ha obert. No pinta res. */
function TornaALaLlista({ obert }) {
  const { mida, panellObert, obriPanell } = useClosaAplicacio();
  const venia = useRef(obert);
  useLayoutEffect(() => {
    const deLaNoticia = venia.current != null;
    venia.current = obert;
    if (deLaNoticia && obert == null && mida === 'estret' && panellObert !== 'mig') obriPanell('mig');
  }, [obert, mida, panellObert, obriPanell]);
  return null;
}

/**
 * `params`: els de la ruta de notícies, ja validats (rutes.js · RUTES_NOTICIES).
 * `totes`: si la ruta és la de «Totes».
 */
export function EspaiNoticies({ params = null, totes = false }) {
  const { lector, noticies, ara, desfas, ruta } = useVistaLector();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const carpetaDelCami = params?.carpeta ?? null;
  const fontDelCami = params?.font ?? null;
  const articleDeLaUrl = new URLSearchParams(search).get('article');
  const seleccio = useMemo(
    () => seleccioDeRuta({ carpeta: carpetaDelCami, font: fontDelCami }, { totes, article: articleDeLaUrl }),
    [carpetaDelCami, fontDelCami, totes, articleDeLaUrl]
  );
  const [inicial] = useState(seleccio);
  const { categoryId: llista, itemId: obert } = seleccio;
  const carpeta = carpetaDeOpcio(llista);
  const estat = lector.estat;

  const opcions = useMemo(() => opcionsDeLArbre({ noticies, estat, ara }), [noticies, estat, ara]);
  const base = useMemo(() => filesDeLaLlista({ noticies, estat, ara, desfas, carpeta }), [noticies, estat, ara, desfas, carpeta]);
  /* Encàrrec F del Gauntlet (261016, P2) · La notícia oberta es queda a la llista on la persona
     l'ha vista. Una fila és de «Per a després» només mentre està desada (filesDeLaLlista):
     llevar-ne «Desa per a després» amb la notícia oberta li llevava la carpeta, i l'espai,
     reconciliant (WorkspaceContext), triava la primera de les seues, la categoria, i la URL es
     reescrivia (replace). Com a Feedly, es queda on era fins que la persona navega: `enganxada`
     recorda la notícia i la llista on s'ha vist, i mentre siguen les mateixes la fila hi continua.
     Tancar-la l'oblida. Una notícia que arriba d'una altra llista (un enllaç a /esports?article=
     d'una de festes) no s'hi ha vist mai: l'espai la porta a la seua, com sempre. */
  const filaOberta = useMemo(() => (obert == null ? null : base.find((fila) => fila.id === obert) || null), [base, obert]);
  const hiEs = Boolean(filaOberta) && (llista == null || filaOberta.categoryIds.includes(llista));
  const [enganxada, setEnganxada] = useState(null);
  useLayoutEffect(() => {
    if (obert == null) setEnganxada(null);
    else if (hiEs) setEnganxada((actual) => (actual?.id === obert && actual.llista === llista ? actual : { id: obert, llista }));
  }, [obert, llista, hiEs]);
  const files = useMemo(() => {
    if (!filaOberta || hiEs || enganxada?.id !== obert || enganxada.llista !== llista) return base;
    return base.map((fila) => (fila === filaOberta ? { ...fila, categoryIds: [...fila.categoryIds, llista] } : fila));
  }, [base, filaOberta, hiEs, enganxada, obert, llista]);
  const model = useMemo(() => ({
    status: ESTAT_DE_L_ESPAI[noticies.estat] || 'loading',
    itemsComplete: false,
    resolveItemId: LA_RESOL_EL_DETALL,
    canAutoSelect: CAP_TRIA_AUTOMATICA,
    refresh: noticies.rellegix,
    navigationGroups: [{ id: GRUP, label: null, options: opcions }],
    items: files
  }), [noticies.estat, noticies.rellegix, opcions, files]);

  /* Mana la URL: la tria de la persona fa push; la reconciliació de l'espai, replace. */
  const actual = search ? `${pathname}?${search}` : pathname;
  const enTriar = useCallback(({ categoryId, itemId }, meta) => {
    const desti = rutaDeSeleccio({ categoryId, itemId }, { fonts: noticies.fonts, ruta });
    if (desti !== actual) navigate(desti, { replace: meta?.reason !== 'user' });
  }, [noticies.fonts, ruta, actual, navigate]);
  /* Tancar: la mateixa llista, sense l'article (ni la seua ?seccio=). */
  const tanca = useCallback(() => {
    if (actual !== pathname) navigate(pathname);
  }, [actual, pathname, navigate]);

  const retorn = useRef(null);

  /* E1 del Gauntlet (261016) · El que fan servir les dreceres de teclat (dreceres.js), sempre
     l'última pintada: les dreceres viuen dins del detall i el llegixen en el moment de la tecla. */
  const entorn = useRef(null);
  useLayoutEffect(() => {
    entorn.current = { lector, noticies, opcions, obert, enTriar, tanca };
  });

  /* P2 de Codex (relleu 02:26) · Una altra carpeta o una altra font comença de dalt, com a Feedly
     i com les columnes del 261004, que es tornaven a muntar: l'espai conserva el node de la
     llista d'una carpeta a l'altra i el scroll s'hi quedava. Es posa a 0 sense tocar el focus
     (cap focus() ni scrollIntoView) i només quan canvia la llista: obrir i tancar una notícia de
     la mateixa carpeta la deixa on era. La closca es troba des del detall: l'àncora de
     SenseNoticia o la que deixa el lector a `retorn`; si en una pintada no n'hi ha cap (el
     detall carregant), l'última coneguda. Va abans del focus, que buida `retorn`. */
  const ancora = useRef(null);
  const closca = useRef(null);
  const llistaDelScroll = useRef(llista);
  useLayoutEffect(() => {
    const trobada = ancora.current?.closest(CLOSCA) || retorn.current?.closca || null;
    if (trobada) closca.current = trobada;
    if (llistaDelScroll.current === llista) return;
    llistaDelScroll.current = llista;
    if (!closca.current?.isConnected) return;
    for (const node of closca.current.querySelectorAll(SCROLL_DE_LA_LLISTA)) {
      if (node.scrollTop !== 0) node.scrollTop = 0;
    }
  });

  /* En tancar la notícia, el focus torna a la seua fila, si la llista és la mateixa: una
     altra carpeta comença de dalt, i el focus és d'on l'ha posat la persona (l'arbre).
     Encàrrec F del Gauntlet (261016) · Una fila d'una columna tancada no el rep mai. En estret,
     amb l'Arrere del sistema, la llista encara és un panell tancat en este commit: TornaALaLlista
     l'obri en el següent, abans de pintar, i el focus hi va en el fotograma de després. */
  const llistaDeLArticle = useRef(undefined);
  useLayoutEffect(() => {
    if (obert) {
      llistaDeLArticle.current = llista;
      return undefined;
    }
    const desti = retorn.current;
    const mateixa = llistaDeLArticle.current === llista;
    retorn.current = null;
    llistaDeLArticle.current = undefined;
    if (!mateixa || !desti?.fitxa?.isConnected) return undefined;
    const enfoca = () => {
      if (!desti.fitxa.isConnected || desti.fitxa.closest(COLUMNA_TANCADA)) return;
      if (focusLliure(desti.fitxa, desti.closca)) desti.fitxa.focus({ preventScroll: true });
    };
    if (!desti.fitxa.closest(COLUMNA_TANCADA) || typeof requestAnimationFrame !== 'function') {
      enfoca();
      return undefined;
    }
    const fotograma = requestAnimationFrame(enfoca);
    return () => cancelAnimationFrame(fotograma);
  }, [obert, llista]);

  /* El buit de la columna de la llista (labels.empty): el de la carpeta de la URL. */
  const buit = buitDe(carpeta);
  /* F2 (261016) · `visibleItemIds` i `filtered`, els camps opcionals de l'espai: amb una cerca,
     el que la llista deixa a la vista.
     Encàrrec F del Gauntlet (261016, P2) · El detall sense notícia és de la llista que es veu: la
     carpeta que l'espai té triada (`selection.categoryId`), no la de la URL. Amb la carpeta de la
     URL amagada a la roda dentada («Carpetes a la vista»), l'espai la mostra des del seu «Tot»
     sense canviar la URL (seleccioALaVista), i el títol, el resum i «Marca-ho tot com a llegit»
     són de «Totes». TornaALaLlista va davant del detall, amb notícia i sense: així passa d'un a
     l'altre sense desmuntar-se.
     E1 del Gauntlet (261016) · Les dreceres de teclat a la manera de Feedly (dreceres.js), darrere,
     pel mateix motiu: la llista que es veu (`visibleItemIds`) és la seua. No pinten res. */
  const renderDetail = useCallback(({ selection, visibleItemIds, filtered }) => {
    const id = selection?.itemId ?? null;
    const tornada = <TornaALaLlista obert={id} />;
    const dreceres = <DreceresDeNoticies selection={selection} visibleItemIds={visibleItemIds} entorn={entorn} closca={closca} />;
    if (id != null) return <>{tornada}{dreceres}<DetallDeNoticia key={id} id={String(id)} tanca={tanca} retorn={retorn} /></>;
    const vista = opcioDeLaSeleccio(selection?.categoryId);
    const ids = files.filter((fila) => vista == null || fila.categoryIds.includes(vista)).map((fila) => fila.id);
    const resultats = filtered && Array.isArray(visibleItemIds) ? visibleItemIds : null;
    return (
      <>
        {tornada}
        {dreceres}
        <SenseNoticia titol={nomDeLaSeleccio(vista, noticies)} ids={ids} resultats={resultats} buit={buitDe(carpetaDeOpcio(vista))} ancora={ancora} />
      </>
    );
  }, [tanca, files, noticies]);
  const etiquetes = useMemo(() => ({ ...ETIQUETES, empty: `${buit[0]}.` }), [buit]);

  /* MD (ordre del Mestre, 261003) · En mòbil, primer l'arbre; amb ?article= a l'entrada, la
     notícia (nivellMestreDetall.js). */
  return (
    <UniversalWorkspace
      idEspai="lector"
      mestreDetall={{ clau: 'lector', element: obert }}
      model={model}
      initialSelection={inicial}
      selection={seleccio}
      onSelectionChange={enTriar}
      labels={etiquetes}
      icons={ICONES}
      tagFilter={false}
      renderDetail={renderDetail}
    />
  );
}
