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
 *              després», les categories i, dins de cada una, les fonts. Cada
 *              fila porta el seu recompte de no llegides (`count`: l'espai no
 *              en suma cap; el de «Per a després», les desades que encara no
 *              s'han llegit). «Totes» és el «Tot» de l'espai. Cap botó de
 *              crear (sense onCreate).
 *              Ordre del Mestre (261024, 15:05) · «Les fonts viuen a l'arbre de
 *              carpetes»: una carpeta és el flux de tots els seus autors i una
 *              font, només el seu. L'arbre porta TOTES les fonts
 *              (fontsDelLector.js): les apagades, marcades (EyeOff, «· apagada»)
 *              per a tornar-les a encendre, i les teues; les que el servei
 *              encara no llig, pendents (Hourglass, «· pendent»). La gestió de
 *              fonts és el diàleg de la capçalera de l'arbre (onManageCategories,
 *              «Gestiona les fonts»: GestioFonts.jsx), i triar-ne una porta al
 *              detall el que s'hi pot fer (seguir-la, apagar-la, llevar-la).
 *   llista     Ordre del Mestre (261024, 15:05) · la fila del Bloc de notes
 *              (FilaNoticia.jsx, `renderItem`, amb la variant de la llista del
 *              Bloc): la miniatura (només la del servei de notícies, mai l'origen
 *              de la font; sense, la icona de la categoria), el títol, «font ·
 *              data · Nou» i l'entradeta.
 *   detall     sense notícia, la carpeta: quantes n'hi ha i «Marca-ho tot com
 *              a llegit» (amb una cerca, només els resultats que es veuen a
 *              la llista, i el botó ho diu: F2 del Gauntlet, 261016), sempre
 *              de la llista que es veu, també quan la carpeta de la URL és
 *              amagada a la roda dentada; amb ?article=<id>, la lectura
 *              immersiva (Lector.jsx), que en estret torna a la llista en
 *              tancar-la, també amb l'Arrere del sistema (encàrrec F del
 *              Gauntlet, 261016).
 *   callades   T5 (P1-07, 261024) · les fonts territorials poden no respondre.
 *              Si cauen totes les que se seguixen, el detall sense notícia
 *              d'una carpeta buida és FontsSenseResposta.jsx (per què, «Torna-ho
 *              a provar» i les portes a la resta del poble) i el buit de la
 *              llista ho diu; si en cauen algunes, AvisFonts (comunes.jsx) dins
 *              del detall. L'error del port (status 'error' de l'espai) es queda
 *              com era: l'espai no hi crida renderDetail.
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
import { Bookmark, CloudOff, EyeOff, Folder, Hourglass, Newspaper, Rss, Sun, Trash2 } from 'lucide-react';
import { useLocation, useNavigate } from '../../../app/contexts/RouterContext';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { Boto, EstatBuit, MarcColumna } from '../../../components/PedraSeca/index.js';
import { UniversalWorkspace } from '../../../components/universal/workspace/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import {
  DESPRES, HUI, articlesDeCarpeta, comptadorsCarpetes, dataDeBoina, esDeHui, ordenaPerData, senseFinal, seguix
} from '../nucli/index.js';
import { AvisFonts, AvisLector, MarcaTotLlegit } from './comunes.jsx';
import { useVistaLector } from './context.js';
import { FilaNoticia } from './FilaNoticia.jsx';
import { TEXT_PENDENT, estatDeFont, fontsDelLector } from './fontsDelLector.js';
import { FontsSenseResposta, textDelMotiu } from './FontsSenseResposta.jsx';
import { GestioDeFonts } from './GestioFonts.jsx';
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
  select: 'Tria una notícia.',
  /* 261024 (Lector) · L'acció de la capçalera de l'arbre que obri la gestió de fonts. */
  manage: 'Gestiona les fonts'
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
/* T5 (261024) · El buit de la llista quan no ha respost cap font de les que se seguixen. */
const BUIT_CALLADES = 'Les fonts no responen ara mateix.';
/* 261024 (Lector) · El buit de la llista d'una font apagada o pendent, i el que se'n diu a l'arbre. */
const BUIT_DE_FONT = Object.freeze({ apagada: 'No seguixes esta font.', pendent: 'Esta font encara no es llig.' });
const MARCA_A_LARBRE = Object.freeze({ apagada: 'apagada', pendent: 'pendent' });
const ICONA_A_LARBRE = Object.freeze({ seguida: Rss, apagada: EyeOff, pendent: Hourglass });
/* La fila de la llista: la del Bloc de notes (FilaNoticia.jsx). */
const filaDeNoticia = ({ item, active, onSelect }) => <FilaNoticia item={item} active={active} onSelect={onSelect} />;
/* Correcció L-04 (261024 Lector final, WCAG 2.4.3) · El marc del detall (MarcColumna) i el botó de
   cada acció de la font que hi ha a la vista en cada estat (l'atribut data-accio-font dels botons):
   apagar-la desmunta «Deixa de seguir-la» i munta «Torna a seguir-la», i a l'inrevés. */
const MARC = '.sdp-marc-columna';
const ACCIO_DE_LA_FONT = Object.freeze({ seguida: 'deixa', apagada: 'torna' });

/* Correcció L-04 · On va el focus quan s'ha llevat una font des del seu detall: l'arbre ja no la
   porta i l'espai ha triat una altra llista. La fila de l'arbre de la llista que es veu ara
   (aria-current="page"); si l'arbre és una columna tancada (estret), el cos del detall, que és una
   regió amb nom (la de la llista nova). Mai una columna tancada. */
function destiDespresDeLlevar(closca, marc) {
  const fila = closca?.querySelector('#app-grid-sidebar [aria-current="page"]') || null;
  if (fila && !fila.closest(COLUMNA_TANCADA)) return fila;
  const cos = marc?.isConnected ? marc.querySelector('[role="region"]') : null;
  return cos && !cos.closest(COLUMNA_TANCADA) ? cos : null;
}

/* Si, acabada la ronda, no ha respost cap de les fonts que se seguixen (i se'n seguix alguna). */
function totesCallades(noticies, estat) {
  const caigudes = noticies.caigudes ?? [];
  if (noticies.estat !== 'llest' || caigudes.length === 0) return false;
  const ids = new Set(caigudes.map((caiguda) => caiguda.fontId));
  const seguides = noticies.fonts.filter((font) => seguix(estat, font.id));
  return seguides.length > 0 && seguides.every((font) => ids.has(font.id));
}

const BUITS = Object.freeze({
  [HUI]: Object.freeze(['Hui encara no hi ha res nou', 'Les notícies de les últimes 24 hores de les fonts que seguixes apareixeran ací.']),
  [DESPRES]: Object.freeze(['No has desat res per a després', 'Obri una notícia i toca «Desa per a després» per a guardar-la ací.']),
  altres: Object.freeze(['No hi ha cap notícia ací', 'Quan esta font o esta carpeta publiquen, ho voràs ací.'])
});
/* El buit d'una carpeta ('hui', 'despres', una categoria o null). */
const buitDe = (carpeta) => BUITS[carpeta && Object.hasOwn(BUITS, carpeta) ? carpeta : 'altres'];

/* L'arbre: les carpetes fixes, les categories i totes les fonts (fontsDelLector.js), cada una
   dins de la seua categoria (una font sense categoria, a l'arrel). Els recomptes són de no
   llegides: el de «Per a després», de les desades que encara no s'han llegit, perquè l'espai
   en diu el text accessible d'un sol patró («{n} sense llegir»).
   Ordre del Mestre (261024, 15:05) · També les fonts apagades (EyeOff i «· apagada») i les
   teues pendents (Hourglass i «· pendent»), sense recompte: no se'n demana res. */
function opcionsDeLArbre({ noticies, estat, ara, fonts }) {
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
    ...fonts.map((font, i) => {
      const quin = estatDeFont(font, estat);
      return {
        id: opcioDeFont(font.id), label: MARCA_A_LARBRE[quin] ? `${font.nom} · ${MARCA_A_LARBRE[quin]}` : font.nom,
        icon: ICONA_A_LARBRE[quin], order: primeraFont + i,
        parentId: categories.has(font.categoriaId) ? opcioDeCarpeta(font.categoriaId) : null,
        count: quin === 'seguida' ? perFont.get(font.id) || 0 : 0
      };
    })
  ];
}

/* Les files de la llista: les notícies de les fonts que se seguixen i les desades (encara que la
   font ja no les servisca), cadascuna amb les opcions de l'arbre on viu. De la més nova a la més
   vella; a «Per a després», en l'ordre en què es van desar (el del nucli).
   Ordre del Mestre (261024, 15:05) · Cada fila porta, a més, l'entradeta (el resum) i la
   miniatura que dona el servei (`imatge`: mitjans.js; sense servei, cap). */
function filesDeLaLlista({ noticies, estat, ara, desfas, carpeta, imatge }) {
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
      entradeta: article.resum || undefined,
      miniatura: article.imatge ? imatge(article.imatge) : null,
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
   que es diguera 'constructor' no ha de llegir res d'Object.prototype. `fonts`: les de l'arbre
   (fontsDelLector.js), també les apagades i les pendents. */
function nomDeLaSeleccio(categoryId, noticies, fonts) {
  if (categoryId == null) return ETIQUETES.all;
  const carpeta = carpetaDeOpcio(categoryId);
  if (carpeta) {
    if (Object.hasOwn(NOM_CARPETA_FIXA, carpeta)) return NOM_CARPETA_FIXA[carpeta];
    return noticies.categories.find((categoria) => categoria.id === carpeta)?.nom || 'Notícies';
  }
  const fontId = fontDeOpcio(categoryId);
  return fonts.find((font) => font.id === fontId)?.nom || 'Notícies';
}

/* El detall sense cap notícia oberta: la carpeta, quantes en porta i «Marca-ho tot com a
   llegit», el ✓ de la capçalera de la llista de Feedly. L'avís del disc, dins del marc.
   `ancora`: un node del detall des d'on EspaiNoticies troba la closca (el scroll de la llista).
   Pedra Seca no passa refs: és un <span> sense classe al voltant del text, i cap píxel canvia.
   F2 del Gauntlet (261016, defecte L1-2) · `resultats`: amb una cerca, els ids que es veuen a la
   llista (els dona l'espai a renderDetail); el botó marca només eixos i ho diu. El resum i el
   buit continuen sent de la carpeta (`ids`). Sense cerca, null: el botó i l'abast de sempre.
   T5 (261024) · `callades`: { motiu, rellegix } quan no ha respost cap font, o null. Una carpeta
   buida, llavors, és FontsSenseResposta en lloc del seu buit; una amb notícies (les desades) es
   veu com sempre. AvisFonts va al costat de l'avís del disc.
   Ordre del Mestre (261024, 15:05) · `font`: la de l'arbre (fontsDelLector.js) si la selecció és
   una font, o null. El detall diu el que s'hi pot fer, sense cap pàgina a banda: apagada, «Torna
   a seguir-la»; pendent, per què; seguida, «Deixa de seguir-la» a les eines; i una de les teues,
   «Lleva la font». Si no ha respost, el seu motiu (correcció R5-08: una adreça vetada no diu mai
   que la font ha enviat res).
   Correcció L-04 (261024 Lector final, WCAG 2.4.3) · Cap d'estes accions deixa el focus al <body>:
   «Deixa de seguir-la» el porta a «Torna a seguir-la» (que apareix al cos) i a l'inrevés, quan la
   vista ja és la nova; «Lleva la font» avisa EspaiNoticies (`onLlevada`), que el porta a l'arbre
   quan l'espai ja ha triat una altra llista. Només si el focus encara és lliure (el botó premut,
   desmuntat, l'ha deixat al body, o és dins del marc): mai es furta d'un altre lloc. */
function SenseNoticia({ titol, ids, resultats = null, buit, ancora, callades = null, font = null, onLlevada = null }) {
  const { lector, noticies, personals } = useVistaLector();
  const llegits = new Set(lector.estat.llegits);
  const noLlegides = ids.filter((id) => !llegits.has(id)).length;
  const marca = <MarcaTotLlegit ids={resultats ?? ids} filtrat={resultats != null} />;
  const quin = font ? estatDeFont(font, lector.estat) : null;
  const fontId = font?.id ?? null;
  const caiguda = font ? (noticies.caigudes ?? []).find((candidata) => candidata.fontId === font.id) || null : null;
  /* Correcció L-04 · El botó premut i el marc on és: quan la font canvia d'estat, el focus va al
     botó de l'estat nou, dins del mateix marc. Si la font triada ja és una altra, s'oblida. */
  const commutada = useRef(null);
  useLayoutEffect(() => {
    const pendent = commutada.current;
    if (!pendent || (pendent.fontId === fontId && pendent.des === quin)) return;
    commutada.current = null;
    const accio = pendent.fontId === fontId ? ACCIO_DE_LA_FONT[quin] : null;
    const desti = accio ? pendent.marc?.querySelector(`[data-accio-font="${accio}"]`) : null;
    if (desti && focusLliure(desti, pendent.marc)) desti.focus();
  }, [fontId, quin]);
  const commuta = (event) => {
    commutada.current = { fontId, des: quin, marc: event.currentTarget.closest(MARC) };
    if (!lector.accions.commutaSeguiment(fontId)) commutada.current = null;
  };
  const lleva = async (event) => {
    const marc = event.currentTarget.closest(MARC);
    const id = fontId;
    if (await personals.lleva(id)) onLlevada?.({ id, marc });
  };
  let cos;
  if (quin === 'pendent') {
    cos = <EstatBuit icona={Hourglass} titol="Esta font encara no es llig"><span ref={ancora}>{TEXT_PENDENT}</span></EstatBuit>;
  } else if (quin === 'apagada') {
    cos = (
      <EstatBuit icona={EyeOff} titol="No seguixes esta font"
        accio={<Boto varietat="primari" data-accio-font="torna" onClick={commuta}>Torna a seguir-la</Boto>}>
        <span ref={ancora}>{font.descripcio || 'Encén-la i les seues notícies tornaran a la llista.'}</span>
      </EstatBuit>
    );
  } else if (ids.length) {
    cos = (
      <EstatBuit titol="Tria una notícia">
        <span ref={ancora}>
          {`${textNoticies(ids.length)}, ${noLlegides ? `${noLlegides} sense llegir` : 'totes llegides'}. Obri’n una de la llista per a llegir-la.`}
        </span>
      </EstatBuit>
    );
  } else if (callades) {
    cos = <FontsSenseResposta motiu={callades.motiu} onTornaAProvar={callades.rellegix} ancora={ancora} />;
  } else if (caiguda) {
    cos = (
      <EstatBuit icona={CloudOff} titol={caiguda.motiu === 'adreca' ? 'Esta adreça no es pot llegir' : 'Esta font no ha respost'}
        accio={<Boto varietat="secundari" onClick={noticies.rellegix}>Torna-ho a provar</Boto>}>
        <span ref={ancora}>{textDelMotiu(caiguda.motiu, { una: true })}</span>
      </EstatBuit>
    );
  } else cos = <EstatBuit titol={buit[0]}><span ref={ancora}>{buit[1]}</span></EstatBuit>;
  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} />}
      eines={<>{marca}{font ? <AccionsDeFont font={font} quin={quin} onCommuta={commuta} onLleva={lleva} /> : null}</>}
      avis={<><AvisLector /><AvisFonts /></>} etiqueta={titol}>
      {cos}
    </MarcColumna>
  );
}

/* Ordre del Mestre (261024, 15:05) · Les eines d'una font triada a l'arbre: una de les teues es
   lleva (la mateixa operació que la gestió de fonts, useFontsPersonals); una del catàleg que se
   seguix, s'apaga (es desa i ja no es demana; continua a l'arbre, marcada). Una apagada porta
   «Torna a seguir-la» al cos. En una pestanya lectora no es lleva res: el disc és d'una altra.
   Correcció L-04 · Les accions les fa SenseNoticia (`onCommuta`, `onLleva`), que en porta el focus. */
function AccionsDeFont({ font, quin, onCommuta, onLleva }) {
  const { lector } = useVistaLector();
  if (font.personal) {
    return (
      <Boto varietat="secundari" icona={Trash2} disabled={lector.mode === 'lectora'} onClick={onLleva}>
        Lleva la font
      </Boto>
    );
  }
  if (quin !== 'seguida') return null;
  return <Boto varietat="secundari" icona={EyeOff} data-accio-font="deixa" onClick={onCommuta}>Deixa de seguir-la</Boto>;
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
  const { lector, noticies, ara, desfas, ruta, enLinia, personals, llegixPersonals, mitjans } = useVistaLector();
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

  /* 261024 (Lector) · Totes les fonts de l'arbre: les del port i les teues pendents. */
  const fonts = useMemo(() => fontsDelLector({ noticies, personals: personals.fonts, llegixPersonals }),
    [noticies, personals.fonts, llegixPersonals]);
  const opcions = useMemo(() => opcionsDeLArbre({ noticies, estat, ara, fonts }), [noticies, estat, ara, fonts]);
  const base = useMemo(() => filesDeLaLlista({ noticies, estat, ara, desfas, carpeta, imatge: mitjans.imatge }),
    [noticies, estat, ara, desfas, carpeta, mitjans]);
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
  /* 261024 (Lector) · Les fonts teues són a l'arbre: mentre el disc no s'ha llegit, l'espai espera
     (un enllaç a una d'elles no es reconcilia a «Hui» abans de temps). */
  const personalsLlegides = personals.llegides || personals.error !== null;
  const model = useMemo(() => ({
    status: personalsLlegides ? ESTAT_DE_L_ESPAI[noticies.estat] || 'loading' : 'loading',
    itemsComplete: false,
    resolveItemId: LA_RESOL_EL_DETALL,
    canAutoSelect: CAP_TRIA_AUTOMATICA,
    refresh: noticies.rellegix,
    navigationGroups: [{ id: GRUP, label: null, options: opcions }],
    items: files
  }), [personalsLlegides, noticies.estat, noticies.rellegix, opcions, files]);

  /* Mana la URL: la tria de la persona fa push; la reconciliació de l'espai, replace. */
  const actual = search ? `${pathname}?${search}` : pathname;
  const enTriar = useCallback(({ categoryId, itemId }, meta) => {
    const desti = rutaDeSeleccio({ categoryId, itemId }, { fonts, ruta });
    if (desti !== actual) navigate(desti, { replace: meta?.reason !== 'user' });
  }, [fonts, ruta, actual, navigate]);
  /* 261024 (Lector) · La gestió de fonts: el diàleg de la capçalera de l'arbre. */
  const [gestioOberta, setGestioOberta] = useState(false);
  const obriGestio = useCallback(() => setGestioOberta(true), []);
  const tancaGestio = useCallback(() => setGestioOberta(false), []);
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

  /* Correcció L-04 (261024 Lector final, WCAG 2.4.3) · «Lleva la font» al detall desmunta la font
     sencera: el seu botó, la seua fila de l'arbre i la selecció (l'espai la reconcilia amb una altra
     llista, replace). Quan l'arbre ja no la porta i la URL ja no la tria, el focus va a la fila de
     l'arbre de la llista nova (destiDespresDeLlevar), si encara és lliure: mai al <body>. */
  const [llevada, setLlevada] = useState(null);
  useLayoutEffect(() => {
    if (!llevada || fonts.some((font) => font.id === llevada.id) || fontDeOpcio(llista) === llevada.id) return;
    setLlevada(null);
    const desti = destiDespresDeLlevar(llevada.marc?.closest(CLOSCA) || closca.current, llevada.marc);
    if (desti && focusLliure(desti, llevada.marc)) desti.focus();
  }, [llevada, fonts, llista]);

  /* El buit de la columna de la llista (labels.empty): el de la carpeta de la URL. */
  const buit = buitDe(carpeta);
  /* T5 (261024) · Si no ha respost cap font: per què (sense xarxa al dispositiu, sempre
     'sense-connexio') i com tornar-ho a provar, per al detall (SenseNoticia).
     261024 (Lector final) · El motiu és el del port (fontNoticies.js · motiuDominant), que ja compta
     'adreca' i 'personals-off' en el mateix ordre: la vista ja no en fa cap còpia. */
  const callades = useMemo(() => {
    if (!totesCallades(noticies, estat)) return null;
    return { motiu: enLinia === false ? 'sense-connexio' : noticies.motiu, rellegix: noticies.rellegix };
  }, [noticies, estat, enLinia]);
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
    const fontId = fontDeOpcio(vista);
    const font = fontId ? fonts.find((candidata) => candidata.id === fontId) || null : null;
    return (
      <>
        {tornada}
        {dreceres}
        <SenseNoticia titol={nomDeLaSeleccio(vista, noticies, fonts)} ids={ids} resultats={resultats} buit={buitDe(carpetaDeOpcio(vista))}
          ancora={ancora} callades={callades} font={font} onLlevada={setLlevada} />
      </>
    );
  }, [tanca, files, noticies, callades, fonts]);
  /* El buit de la llista d'una font apagada o pendent ho diu (261024, Lector). */
  const fontDeLaUrl = fontDelCami ? fonts.find((font) => font.id === fontDelCami) || null : null;
  const buitDeFont = fontDeLaUrl ? BUIT_DE_FONT[estatDeFont(fontDeLaUrl, estat)] || null : null;
  const etiquetes = useMemo(() => ({ ...ETIQUETES, empty: callades ? BUIT_CALLADES : buitDeFont || `${buit[0]}.` }), [buit, callades, buitDeFont]);

  /* MD (ordre del Mestre, 261003) · En mòbil, primer l'arbre; amb ?article= a l'entrada, la
     notícia (nivellMestreDetall.js). */
  /* Ordre del Mestre (261024, 15:05) · La fila del Bloc de notes (renderItem, amb la variant de la
     llista del Bloc) i la gestió de fonts a la capçalera de l'arbre (onManageCategories). */
  return (
    <>
      <UniversalWorkspace
        idEspai="lector"
        mestreDetall={{ clau: 'lector', element: obert }}
        model={model}
        initialSelection={inicial}
        selection={seleccio}
        onSelectionChange={enTriar}
        onManageCategories={obriGestio}
        labels={etiquetes}
        icons={ICONES}
        tagFilter={false}
        renderItem={filaDeNoticia}
        listClassName="sdp-bloc-list--notes"
        renderDetail={renderDetail}
      />
      <GestioDeFonts obert={gestioOberta} onTanca={tancaGestio} fonts={fonts} />
    </>
  );
}
