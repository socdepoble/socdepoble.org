/**
 * XatSection.jsx — el Xat sobre AppGridShell (pla 260927_0055 §4.D, DEC-02).
 *
 *   · Rail esquerre plegat per defecte (ClosCaXat), llista al centre amb el
 *     patró estàndard de missatgeria (ordre del Mestre, 260928: que la base
 *     tinga l'estructura que la gent ja coneix de les apps natives; Gauntlet
 *     261017, Bloc 3.1: un patró conegut, sense cap marca aliena): una sola
 *     fila de títol amb el «+» rodó blau a la dreta
 *     (Nova conversa, un diàleg), la cerca en píndola sempre a la vista, les
 *     píndoles Tot · No llegits · Preferits · Grups darrere de la icona de
 *     filtre (XAT-A17, T12) i la llista; i la conversa a la dreta amb
 *     capçalera honesta, separadors de dia, «Carrega'n més», bombolles i el
 *     compositor.
 *   · Onada 3 (T63.2, T67, T68, T69):
 *       - Les comunitats són UNA fila (FilaComunitat) que obri la seua fitxa a
 *         la columna de llista (/xat?comunitat=<id>); els seus fills (Avisos i
 *         grups) no es pinten sols. Una comunitat no s'obri mai com a conversa.
 *       - «Seleccionar xats»: cada fila es torna una casella i la fila de
 *         títol, BarraSeleccio amb «Marcar com a llegides» (marcaLlegides).
 *         Ordre del Mestre (261026_2126; pla 261026_2130, P1-36) · S'hi
 *         entra amb una pulsació llarga sobre una fila triable (o el menú
 *         contextual, o Maj+F10), que ja hi naix triada (LlistaConverses,
 *         onSelecciona): el «…» de la fila de títol (MenuLlista) era inventat
 *         i s'ha retirat.
 *       - La cerca global: amb el focus i el camp buit, la llista VERTICAL de
 *         filtres (FiltresCerca); en escriure o triar un filtre, els resultats
 *         de cercaXat() (ResultatsCercaXat). Escape o ⊗ netegen; perdre el
 *         focus amb el camp buit i sense filtre torna la llista.
 *       - ?sobre=<tipus>:<id>&titol=…&ruta=… (el «Comentar» d'una Pàgina
 *         Universal) obri el xat comú amb obriFilDePagina i hi navega.
 *         Auditoria 261008 (B05): la conversa conserva el descriptor a la
 *         seua URL (/xat/<filId>?sobre=<tipus>:<id>, sense títol ni ruta) i,
 *         si el fil no és a la llista (recarregar, un enllaç compartit), es
 *         torna a obrir abans del 404; si la xarxa falla, la URL es queda i
 *         es torna a provar.
 *   · Onada 3B · ?vista=<id> (les entrades del rail, ClosCaXat): la columna
 *     central pinta VistaComunitats (comunitats), VistaMultimedia (multimedia,
 *     operativa des de l'ordre del Mestre del 261004, T5) o
 *     VistaEnConstruccio (telefonades, destacats) en lloc de la llista; la dreta
 *     conserva l'estat buit de sempre. Sense ?vista= (o amb una que no
 *     existix), la llista de converses de l'onada 3A, sense cap canvi. Una
 *     conversa oberta des de la vista de comunitats la conserva a la columna
 *     (/xat/<fil>?vista=comunitats); la fitxa (?comunitat=) mana sobre la
 *     vista i, oberta des d'ella amb «Veure-ho tot», també la conserva
 *     (?comunitat=<id>&vista=comunitats): la seua fletxa hi torna.
 *   · Columna dreta (ordre del Mestre, 260927): sense conversa hi viu el
 *     document per defecte, l'espai que les apps de missatgeria deixen buit;
 *     en obrir-ne una,
 *     només el xat; en tornar a /xat, torna el document. En mode estret no hi
 *     cap: una sola columna cada vegada i, sense conversa, un avís sobri.
 *     Els ajustos del xat viuen a /control-xat, i s'hi arriba des de la
 *     targeta «Ajustos del xat» del Panell de Control (/control): «Novetats»
 *     del rail està amagada (D16) i la roda de «Menú» només replega el rail.
 *   · Sense sessió, «Entrar» (i el ?sobre= en remot) porten a l'entrada amb
 *     rutaDEntrada (T4): /registre?mode=entrar&tornar=<la ruta del Xat>.
 *   · L'àmbit el marca `ambitEstable` d'useXat() (ARQ-H01: backend + persona
 *     + actor, sense la generació del JWT): useNotesData() només queda per a
 *     `creaNota` del Retall. Els esborranys hi penjaven ja des de la revisió
 *     adversarial 260930 (P2); des de la Decisió 1 del Mestre (261007), també
 *     l'espai sencer: una renovació del JWT no el torna a muntar.
 *   · Tot el text passa per t() amb claus section.xat.* (XAT-P10) i les hores
 *     es formaten amb el locale de la interfície (XAT-P11).
 *
 * «Capçalera blava» en fer focus al cercador (onada 3, investigat): cap camí
 * del codi obri res en fer focus. El que es veu en ample i en mitjà és la
 * barra blava del document per defecte de la columna dreta (TextSection amb
 * chrome 'context'), que hi és sempre sense conversa, i l'anell de focus del
 * camp (--sdp-focus). Ara el focus pinta la llista de filtres del patró de
 * missatgeria.
 */
import { Component, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CircleX, MessageCircle, Plus, Search, Users, X } from 'lucide-react';
import { useLocation, useNavigate, useParams, useSearchParams } from '../../app/contexts/RouterContext';
import NotFoundPage from '../../pages/NotFoundPage';
import AppGridColumn from '../../components/layout/AppGridColumn.jsx';
import { useAppGrid } from '../../components/layout/AppGridShell.jsx';
import { useModeImmersiu } from '../../app/contexts/ModeImmersiuContext.jsx';
/* Fase D (261020, L4) · El document destacat (TextSection i PAGE_COPY) arriba en diferit. */
import { esErrorLazy, lazyRoute } from '../../apps/plataforma/lazyRoute.js';
import { esperaDeLaLlista, useXat } from './XatContext';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useNotesData } from '../notes/NotesDataContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useModeracio } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { subjecteDeXat } from '../../data/contracte.js';
import { construeixRetall } from './retall.js';
import { cercaXat, FILTRES_CERCA_XAT } from './cercaXat.js';
import { useSEO } from '../../hooks/useSEO';
import { rutaDEntrada } from '../../config/rutaEntrada.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { objecteDePagina, rutaConnectarObjecte } from '../../config/objecteConnectable.js';
/* Ordre del Mestre (261007) · La pàgina destacada de la columna dreta: es tria a paginaDestacada.js. */
import { paginaDestacada, rutaDeLaPaginaDestacada } from './paginaDestacada.js';
import ClosCaXat, { BotoObriRail, VISTES_XAT, entradaDeVista } from './components/ClosCaXat.jsx';
import VistaComunitats from './components/VistaComunitats.jsx';
import VistaEnConstruccio, { textosDeVista } from './components/VistaEnConstruccio.jsx';
import VistaMultimedia from './components/VistaMultimedia.jsx';
import LlistaConverses, { esFilaTriable } from './components/LlistaConverses.jsx';
import FiltreConverses from './components/FiltreConverses.jsx';
import Conversa from './components/Conversa.jsx';
import PanellInicialMobil from './components/PanellInicialMobil.jsx';
import BarraSeleccio from './components/BarraSeleccio.jsx';
import FiltresCerca, { IconaFiltre } from './components/FiltresCerca.jsx';
import ResultatsCercaXat from './components/ResultatsCercaXat.jsx';
import FitxaComunitat from './components/FitxaComunitat.jsx';
import DialegNovaConversa from './components/DialegNovaConversa.jsx';
import DialegCompartir from './components/DialegCompartir.jsx';
import { esNomesLectura } from './components/Compositor.jsx';
import useCompartitPendent from './useCompartitPendent.js';
import { desaEsborrany, llegixEsborrany } from './esborranys.js';
import { descartaCompartit, prenTextCompartit, triaDestiCompartit } from '../../config/compartirNatiu.js';
import { esComunitat } from './components/FilaConversa.jsx';
import FakeChatOnboarding from './components/FakeChatOnboarding.jsx';
import EntradaDelPoble from './components/EntradaDelPoble.jsx';
import usePobleAmfitrio from './usePobleAmfitrio.js';
/* Ordre del Mestre (261007) · Les files d'ajuda per defecte i on porten. */
import useObriXatPerDefecte, { ID_FIL_DE_MOSTRA_DE_LA_IAIA } from './useObriXatPerDefecte.js';
/* Ordre del Mestre (261021, pla 261021_0015 §8.5) · La fletxa de la conversa torna a la pàgina d'origen. */
import { useOrigenDelXat } from './origenDelXat.js';
import { PREFIX_PER_DEFECTE, clauPerDefecteDe, esIdPerDefecte, esLaPersonaDeContacte, esXatDeLaIAIA } from '../../data/xatsPerDefecte.js';
/* Gauntlet 261016_1530 (Bloc 3.6) · Els quatre actors al capdamunt, en
   l'ordre del Mestre, i la fila que porta a la comunitat de Sóc de Poble. */
import { RUTA_SOBRE_DE_SOC_DE_POBLE, anteposaActors, potPortarLaComunitat } from './actorsDelXat.js';
import { useEntitatDelProjecte } from '../../hooks/useEntitatDelProjecte.js';
/* Onada 6 · La IAIA apagada (nivell d'IA 0), els errors SDP traduïts i
   «Informa d'un error» per als beta testers. */
import { senseContacteDeLaIAIA } from './contactesAjuda.js';
import { textDErrorDelXat, textDeFalladaDirecte } from './errorsXat.js';
import useInformaDUnError from './useInformaDUnError.js';
import BotoInformaDUnError from './components/BotoInformaDUnError.jsx';
import {
  anteposaPoble, avatarDelPoble, comunitatsAmbCaraDelPoble, esComunitatDelPoble, filsAmbCaraDelPoble, pobleDelXat, rutaSobreDelPoble
} from './pobleAmfitrio.js';

/* Els quatre filtres fixos del patró de missatgeria (XAT-A17): identificador
   i clau i18n. */
const FILTRES = [
  ['tot', 'section.xat.filtres.tot', 'Tot'],
  ['noLlegits', 'section.xat.filtres.noLlegits', 'No llegits'],
  ['preferits', 'section.xat.filtres.preferits', 'Preferits'],
  ['grups', 'section.xat.filtres.grups', 'Grups']
];
const CAP = Object.freeze([]);
const noop = () => {};
const mai = () => false;
const capMarcada = () => 0;
const senseXat = async () => null;
const senseEspera = () => null;
const enc = (valor) => encodeURIComponent(String(valor));

/* El focus s'ha perdut: l'element que el tenia s'ha desmuntat (el focus cau a
   <body>, o a res dins d'un shadow root). Només llavors se'l recol·loca, per
   no robar-lo a qui escriu en un altre lloc (el compositor, per exemple). */
function focusPerdut(node) {
  const arrel = node?.getRootNode?.() || (typeof document !== 'undefined' ? document : null);
  if (!arrel) return false;
  const actiu = arrel.activeElement;
  return !actiu || actiu.isConnected === false || actiu === arrel.body
    || (typeof document !== 'undefined' && actiu === document.body);
}

/* Ordre del Mestre (261026_2126, P1-36) · El botó de la fila amb la clau
   `clau` (el <li data-clau> de LlistaConverses), si la llista el pinta. */
function botoDeLaFila(columna, clau) {
  if (!columna || clau == null) return null;
  const fila = [...columna.querySelectorAll('li[data-clau]')].find((li) => li.getAttribute('data-clau') === clau);
  return fila?.querySelector('button') || null;
}

/* Revisió adversarial 260930 (P2, «Escape al full Ajustos») · Un Escape amb
   un diàleg obert és del diàleg. A la SPA el Dialeg obri amb showModal() i
   només escolta `cancel`, que el navegador dispara DESPRÉS del keydown: el
   keydown arribava a `window` sense preventDefault i, a més de tancar el
   full, buidava «Seleccionar xats». Dos casos:
     · l'Escape naix dins d'un <dialog open> o d'una capa .sdp-capa-modal
       visible (el camí de l'esdeveniment, que composedPath() dona també dins
       d'un shadow root obert);
     · el focus ha caigut a <body> amb un modal obert a la mateixa arrel (un
       modal del navegador rep l'Escape igualment; en un shadow root tancat,
       l'arrel del node sí que el veu).
   A l'encastat modalLocal ja el consumix amb preventDefault: esta guarda no
   hi canvia res. */
const SELECTOR_MODAL_OBERT = 'dialog[open], .sdp-capa-modal:not([hidden])';

function esModalObert(node) {
  if (!node || node.nodeType !== 1) return false;
  if (node.localName === 'dialog') return node.hasAttribute('open');
  return node.classList.contains('sdp-capa-modal') && !node.hidden;
}

function escapeDUnModal(e, node) {
  const cami = typeof e.composedPath === 'function' ? e.composedPath() : [];
  if ((cami.length ? cami : [e.target]).some(esModalObert)) return true;
  const arrel = node?.getRootNode?.() || (typeof document !== 'undefined' ? document : null);
  return Boolean(arrel?.querySelector?.(SELECTOR_MODAL_OBERT));
}

function instantDe(valor) {
  const t = new Date(valor || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/* «Tot · No llegits · Preferits · Grups» sobre una fila: una conversa o una
   comunitat sencera. «Grups» inclou les comunitats i els seus canals. La fila
   del poble que encara no existix (torn 260930, T1) és un grup sense dades:
   passa «Tot» i «Grups», mai «No llegits» ni «Preferits». */
function passaFiltre(fila, filtre) {
  /* Gauntlet 261016_1530 (Bloc 3.6) · La fila que porta a la comunitat de
     Sóc de Poble ('entitat', actorsDelXat.js), igual que la del poble. */
  if (fila.tipus === 'poble' || fila.tipus === 'entitat') return filtre === 'tot' || filtre === 'grups';
  if (fila.tipus === 'comunitat') {
    const { comunitat } = fila;
    const fills = comunitat.fills || CAP;
    switch (filtre) {
      case 'noLlegits': return (Number(comunitat.noLlegits) || 0) > 0 || fills.some((f) => f.noLlegitManual);
      case 'preferits': return Boolean(comunitat.fil.preferit) || fills.some((f) => f.preferit);
      default: return true;
    }
  }
  const { fil } = fila;
  switch (filtre) {
    case 'noLlegits': return (Number(fil.noLlegits) || 0) > 0 || Boolean(fil.noLlegitManual);
    case 'preferits': return Boolean(fil.preferit);
    case 'grups': return fil.tipus === 'grup' || fil.tipus === 'canal';
    default: return true;
  }
}

/** El descriptor de ?sobre=<tipus>:<id>: es talla pel PRIMER «:» (en una 'pagina' l'id és la ruta). */
export function objecteDeSobre(sobre, titol = '', ruta = '') {
  const valor = String(sobre || '');
  const i = valor.indexOf(':');
  if (i <= 0) return null;
  const tipus = valor.slice(0, i);
  const id = valor.slice(i + 1);
  return { tipus, id, titol: titol || '', ruta: ruta || (tipus === 'pagina' ? id : '') };
}

/** La ruta amb la seua consulta: on torna qui entra des del Xat (T4, rutaDEntrada). */
export function rutaAmbConsulta(pathname, params) {
  const consulta = params ? params.toString() : '';
  return `${pathname || '/xat'}${consulta ? `?${consulta}` : ''}`;
}

/**
 * Auditoria 261008 (B05) · La consulta del subjecte d'un fil de pàgina a la
 * URL de la conversa (/xat/<filId>?sobre=<tipus>:<id>), perquè un fil llegit
 * com a visitant sobrevisca a recarregar, a la pestanya que iOS descarta i a
 * l'enllaç compartit: el visitant només viu en la memòria del proveïdor, i el
 * descriptor és l'únic camí per a tornar a obrir-lo. S'ha triat la URL i no
 * sessionStorage perquè cobrix també l'enllaç compartit.
 * Revisió 261008 · Només el descriptor, mai `titol` ni `ruta`: la URL de la
 * conversa es queda a l'historial i, incrustat amb el router de navegador, a
 * la URL de la pàgina de l'amfitrió (i a la seua analítica). El subjecte no
 * sempre és públic (el xat comú d'una organització de membres el llig una
 * membre), i el servidor ja en deriva la ruta i el títol: obri_fil_de_pagina
 * només usa el títol del client per a un contingut sense títol propi, i en
 * tornar a obrir el fil ja existix. Una 'pagina' pren la ruta del seu id
 * (objecteDeSobre). L'identificador del subjecte sí que hi queda: és el que
 * el torna a obrir.
 */
export function consultaDeSobre(sobre) {
  return `sobre=${enc(sobre)}`;
}

/** B05 · El ?sobre= (<tipus>:<id>) del subjecte d'un fil, el que torna el servidor, o null si no en té cap amb xat. */
export function sobreDelFil(fil) {
  const subjecte = fil?.subjecte;
  if (!subjecte?.tipus || subjecte.id == null || subjecte.id === '') return null;
  const sobre = `${subjecte.tipus}:${subjecte.id}`;
  return subjecteDeXat(objecteDeSobre(sobre)) ? sobre : null;
}

/** El text d'una fallada en obrir un directe. SDP-XAT-016 (B03: la persona no
    ha donat el consentiment) es diu en la llengua de la interfície; l'adaptador
    en porta la reserva valenciana al message. La resta, com sempre.
    Onada 6 · Viu a errorsXat.js, amb els altres codis SDP traduïts (003, 013
    i 429), i es reexporta ací. */
export { textDeFalladaDirecte };

/* Onada 6 (tasca 12) · El descriptor d'un xat de pàgina és el de la IAIA. */
const esPaginaDeLaIAIA = (objecte) => Boolean(objecte) && esXatDeLaIAIA({ tipus: 'grup', subjecte: objecte });
const ID_FILA_DE_LA_IAIA = `${PREFIX_PER_DEFECTE}iaia`;

export default function XatSection() {
  const xat = useXat();
  /* Ordre del Mestre (261021, pla 261021_0015 §8.5) · La pàgina de l'app
     d'on s'ha entrat a la conversa (origenDelXat.js). Viu ací, per damunt de
     XatWorkspace: un àmbit nou torna a muntar l'espai, no tornar a entrar. */
  const origen = useOrigenDeLaConversa();
  // Padró, cerca i selecció pertanyen al mateix àmbit, i un altre àmbit
  // (persona, actor o backend) torna a muntar l'espai sencer.
  // Decisió 1 del Mestre (261007) · La clau és `ambitEstable` i no `scopeKey`:
  // una renovació del JWT (generació nova) no és un altre àmbit. Abans tornava
  // a muntar XatWorkspace cada hora i s'enduia la cita a mitges, la posició de
  // lectura, la cerca i el diàleg obert; ara XatContext conserva la conversa i
  // el que la persona té a la pantalla es queda.
  if (xat.senseSessio) {
    return (
      <FakeChatOnboarding originalContext={xat}>
        <XatWorkspace key={xat.ambitEstable ?? 'xat-fake'} origen={origen} />
      </FakeChatOnboarding>
    );
  }
  return <XatWorkspace key={xat.ambitEstable ?? 'xat'} origen={origen} />;
}

/* §8.5 · Hi ha una conversa demanada si la URL en porta una (/xat/<fil>) o la
   demana (?amb=, ?sobre=); una fila d'ajuda (/xat/sdp-per-defecte:<clau>)
   encara no és cap conversa: es resol amb replace i l'origen l'espera. */
function useOrigenDeLaConversa() {
  const { threadId } = useParams();
  const [params] = useSearchParams();
  const intencio = Boolean(threadId || params.get('amb') || params.get('sobre'));
  const fil = threadId && !esIdPerDefecte(threadId) ? String(threadId) : null;
  return useOrigenDelXat({ intencio, fil });
}

function XatWorkspace({ origen = null }) {
  const mounted = useRef(false);
  useLayoutEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const { showToast } = useToast();
  const { t } = useUIActions();
  const { locale, externalConfig } = useUIState();
  const { creaNota } = useNotesData();

  const { threadId } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const connectionContext = params.get('context') || '';
  /* Lògica d'Usuari (T4): «Escriu-li» des d'un perfil arriba amb ?amb=<id> i
     obri (o crea) la conversa amb eixa persona, entitat o agent. */
  const amb = params.get('amb') || '';
  /* T63.2 · «Comentar» d'una Pàgina Universal arriba amb ?sobre=<tipus>:<id>. */
  const sobre = params.get('sobre') || '';
  const titolSobre = params.get('titol') || '';
  const rutaSobre = params.get('ruta') || '';
  /* T67 · La fitxa d'una comunitat a la columna de llista. */
  const comunitatId = params.get('comunitat') || '';
  /* Onada 3B · La vista de la columna central que ha triat el rail. */
  const vistaDemanada = params.get('vista') || '';
  const vista = VISTES_XAT.includes(vistaDemanada) ? vistaDemanada : '';
  /* Torn 260930 (T1) · El poble de l'amfitrió («Gent de la Torre»): el seu
     grup va al capdamunt i, en ample, la primera arribada n'obri la fitxa a
     la columna de llista amb la presentació a la dreta (EntradaDelPoble;
     ordre del Mestre del 14-10, XAT-01: mai el General). Null a
     socdepoble.org: res no canvia.
     Gauntlet 261016 (Bloc 3.6) · La FILA, però, és sempre: sense amfitrió,
     la de «Gent de la Torre» (pobleDelXat, POBLE_PER_DEFECTE). `poble`
     continua sent el declarat, l'únic que obri sol la seua fitxa. */
  const poble = usePobleAmfitrio();
  const pobleDeLaLlista = pobleDelXat(poble);
  /* Onada 3 (P2, revisió) · La cara del poble de l'amfitrió, la de la seua
     fitxa de Pobles: la porta la comunitat del poble quan el servidor no n'hi
     dona cap (pobleAmfitrio.js, filsAmbCaraDelPoble), igual que FilaPoble. */
  const { towns } = useCoreContent();
  const caraDelPoble = useMemo(() => avatarDelPoble(pobleDeLaLlista, towns), [pobleDeLaLlista, towns]);

  const {
    chatThreads,
    getThreadMessages,
    sendChatMessage,
    sendChatMedia,
    obriFil = noop,
    status = 'ready',
    avis = null,
    creaFil,
    cercaMembres,
    totalNoLlegits = 0,
    hiHaMesAntics = mai,
    carregantAntics = mai,
    esperaAntics = senseEspera,
    carregaMesAntics = noop,
    /* Gauntlet 261025_0545 (XC-14) · Si el fil ja s'ha llegit, l'avís del fil
       i tornar-lo a llegir: baixen a la Conversa. Un context d'abans no els
       porta, i la Conversa fa el de sempre.
       Gauntlet 261025_0545 (D5) · I què ha fallat (tipusAvisFil) i si una
       lectura del fil vola (llegintFil), amb el mateix «si no hi són». */
    filCarregat,
    avisFil,
    recarregaFil,
    tipusAvisFil,
    llegintFil,
    reintenta = noop,
    descartaFallit = noop,
    marcaVist = noop,
    comunitats: comunitatsDelXat = CAP,
    contactesFrequents = CAP,
    marcaLlegides = capMarcada,
    obriFilDePagina = senseXat,
    joId = null,
    joNom = null,
    /* Pla 261014_1450 (front C) · L'entitat de la barra negra: baixa a la
       Conversa, i el Compositor diu qui signa. */
    entitatActiva = null,
    senseSessio = false,
    ambitEstable = '',
    /* Auditoria 261008 (B04) · Si l'última càrrega de la llista ha anat bé, i
       l'avís no bloquejant d'un sondeig fallit amb la llista conservada. */
    llistaFresca = true,
    avisLlista = null,
    /* Onada 6 (tasca 12) · Nivell d'IA 0: la IAIA no apareix. */
    iaiaApagada = false,
    esFilAmagat = mai,
    /* Gauntlet 261016 (Bloc 3.6.2) · On porten les files de la IAIA i de
       Javi depén del mode de dades (useObriXatPerDefecte). */
    modeDades = 'remote'
  } = useXat();
  /* Fase D (261020, tasca 2; pla 261020_1300) · Denunciar i bloquejar des de
     la conversa: només amb la capacitat i una sessió (el xat de mostra, mai).
     La porta de les normes no és ací: viu a XatContext (sendChatMessage). */
  const moderacioDePoble = useModeracio();
  /* Fase E (261020, tasca 3; pla 261020_2045) · Qui toca les llistes vives
     d'«El Comú»: la persona de la sessió, memoritzada perquè la targeta (que
     és memo) no es torne a pintar a cada tecla del compositor. Sense sessió,
     cap actor: la llista es llig però no es toca. */
  const actorLlista = useMemo(
    () => (joId && !senseSessio ? { id: String(joId), nom: String(joNom ?? '') } : null),
    [joId, joNom, senseSessio]
  );
  const moderacioDelXat = useMemo(
    () => (moderacioDePoble?.disponible === true && !senseSessio ? moderacioDePoble : null),
    [moderacioDePoble, senseSessio]
  );
  /* Gauntlet 261016_1530 (Bloc 3.6) · En remot, la comunitat de Sóc de Poble
     es reconeix per l'id que el backend dona a l'entitat pilot: el Xat torna
     a pintar quan arriba (useEntitatDelProjecte, la mateixa resolució única
     d'AppDataLoader), i fins aleshores no hi porta cap fila (actorsDelXat.js). */
  useEntitatDelProjecte();
  const comunitatPortable = potPortarLaComunitat(modeDades);

  const titolSeccio = t('section.xat.rail.titol', 'Xat');
  /* Onada 8 (261009) · Sense `image`: useSEO no passa cap SVG a les xarxes i
     ja hi posava la imatge base. El <head> és el mateix. */
  const seoXat = {
    title: totalNoLlegits > 0 ? `(${totalNoLlegits}) ${titolSeccio}` : titolSeccio,
    description: t('section.xat.subtitle', 'Espai de xat')
  };
  useSEO(seoXat);

  /* «Nova conversa» és un diàleg; des de Connectar (?context=) ja s'obri. */
  const [dialegNou, setDialegNou] = useState(Boolean(connectionContext));
  const [obrintAmb, setObrintAmb] = useState(null);
  /* Una obertura que falla amb el diàleg obert s'avisa DINS del diàleg. */
  const [errorObrir, setErrorObrir] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtre, setFiltre] = useState('tot');
  const [filtreCerca, setFiltreCerca] = useState(null);
  const [cercaActiva, setCercaActiva] = useState(false);
  const [membresCerca, setMembresCerca] = useState(CAP);
  const cercaRef = useRef(null);
  const campRef = useRef(null);
  const filtresRef = useRef(null);

  const [modeSeleccio, setModeSeleccio] = useState(false);
  const [triades, setTriades] = useState(() => new Set());

  /* On torna el focus quan un canvi de vista desmunta el control que el
     tenia: la columna, el «+» (Nova conversa), la creu de la selecció i la
     fletxa de la fitxa. Ordre del Mestre (261026_2126, P1-36) · El «…» s'ha
     retirat: el «+» és el control de la fila de títol que sempre hi és, i
     `filaDeLaSeleccio` guarda la clau de la fila que ha obert la selecció
     amb la pulsació llarga (el focus hi torna en eixir-ne). */
  const columnaRef = useRef(null);
  const botoNovaRef = useRef(null);
  const filaDeLaSeleccio = useRef(null);
  const eixirSeleccioRef = useRef(null);
  const tornaFitxaRef = useRef(null);
  /* La persona ha premut la fila virtual del poble i la comunitat encara no
     ha arribat (revisió adversarial 260930, P3; vegeu l'efecte del focus). */
  const pobleDemanat = useRef(false);

  const threads = useMemo(() => filsAmbCaraDelPoble(chatThreads || CAP, pobleDeLaLlista, caraDelPoble), [chatThreads, pobleDeLaLlista, caraDelPoble]);
  const comunitats = useMemo(() => comunitatsAmbCaraDelPoble(comunitatsDelXat, pobleDeLaLlista, caraDelPoble), [comunitatsDelXat, pobleDeLaLlista, caraDelPoble]);
  /* 261026 (ordre del Mestre, prompt 261026_1615, tasca 2) · El que arriba del
     menú «Compartir» del dispositiu espera a «Envia a…» (DialegCompartir). Les
     converses on es pot escriure, amb l'oberta primer i la resta per l'últim
     missatge. Amb imatges, només les que en poden rebre (com onSendMedia de
     Conversa, més avall): en remot i mai el xat de la IAIA. Tampoc el directe
     amb qui has bloquejat: Conversa no hi deixa escriure. */
  const compartit = useCompartitPendent();
  const filsPerCompartir = useMemo(() => {
    if (!compartit) return CAP;
    const ambFitxers = compartit.fitxers.length > 0;
    const obert = String(threadId ?? '');
    const bloquejat = (fil) => {
      const contrapart = moderacioDelXat?.objectiuDeContrapart?.(fil) ?? null;
      return Boolean(contrapart) && moderacioDelXat.esPersonaBloquejada?.(contrapart.id) === true;
    };
    return threads
      .filter((fil) => fil && !fil.arxivat && !fil.perDefecte && !esComunitat(fil) && fil.participant !== false
        && !esNomesLectura(fil) && !esFilAmagat(fil.id) && !bloquejat(fil)
        && !(ambFitxers && (modeDades !== 'remote' || esXatDeLaIAIA(fil))))
      .sort((a, b) => (Number(String(b.id) === obert) - Number(String(a.id) === obert)) || (instantDe(b.ultimAl) - instantDe(a.ultimAl)));
  }, [compartit, threads, threadId, esFilAmagat, modeDades, moderacioDelXat]);
  /* Auditoria 261008 (B04 i B05) · `trobatViu` és el fil de la URL tal com
     és ara a la llista (o entre els visitants). obriFil només es crida amb
     este: un id que no hi és (ni entre els visitants) no es demana mai a
     xat_historial, que respondria SDP-XAT-006 a cada sondeig.
     Revisió 261008 · Mentre la llista NO està al dia (`llistaFresca` fals:
     una càrrega que ha fallat, o l'esquema sense aplicar, que la buida), el
     fil que ja s'havia trobat en esta mateixa ruta es conserva (`trobat`) i
     no es convertix en un 404. Amb una llista al dia que ja no el porta (li
     han llevat el rol a qui representava una entitat, el fil ja no hi és),
     no: el fil ha desaparegut de veres, i es decidix com qualsevol altre,
     sense deixar a la vista una conversa congelada amb el compositor actiu.
     La memòria s'escriu després de pintar i s'oblida en canviar de ruta
     (/xat/X → /xat → /xat/X no la recupera). */
  const trobatViu = threadId ? threads.find((c) => String(c.id) === threadId) || null : null;
  const darrerTrobat = useRef(null);
  useLayoutEffect(() => {
    if (trobatViu) darrerTrobat.current = trobatViu;
    else if (String(darrerTrobat.current?.id ?? '') !== String(threadId ?? '')) darrerTrobat.current = null;
  });
  const conservat = !trobatViu && !llistaFresca && darrerTrobat.current && String(darrerTrobat.current.id) === threadId
    ? darrerTrobat.current
    : null;
  const trobat = trobatViu || conservat;
  const filALaLlista = Boolean(trobatViu);
  const trobatEsComunitat = esComunitat(trobat);
  /* Ordre del Mestre (261007) · Una fila d'ajuda per defecte (perDefecte,
     data/xatsPerDefecte.js) no és cap conversa: ni es munta Conversa ni es
     crida obriFil. Tampoc amb el seu id abans que arribe la llista (un enllaç
     directe, una recàrrega): xat_historial rebutjaria l'id i l'avís taparia
     la llista.
     Gauntlet 261016_1530 (Bloc 3.6; MCR b36_xat, proposta 1) · L'URL d'una
     fila sintètica que NO és a la llista (un enllaç vell, l'historial; en
     llavor, on la IAIA ja és el seu fil) s'encamina per la seua clau
     (clauPerDefecteDe: 'javi' o 'iaia'), com si s'haguera premut la fila, i
     sense passar pel 404. Dues guardes: amb la IAIA apagada mana la sortida
     de dinsDeLaIAIA (cap segona navegació), i Javi no s'obri cap xat amb ell
     mateix (SDP-XAT-002): torna a la llista. Una clau que ja no té fila
     ('socdepoble', des del 261016_1530) és un 404, com qualsevol id que no
     existix. */
  const clauDeLaRuta = trobat ? null : clauPerDefecteDe(threadId);
  const javiDavantDeJavi = clauDeLaRuta === 'javi' && esLaPersonaDeContacte({ id: joId });
  const clauEncaminada = clauDeLaRuta && !(clauDeLaRuta === 'iaia' && iaiaApagada) && !javiDavantDeJavi ? clauDeLaRuta : null;
  const trobatPerDefecte = trobat?.perDefecte || clauEncaminada;
  const idPerDefecte = Boolean(trobatPerDefecte) || esIdPerDefecte(threadId);
  /* Onada 6 (tasca 12) · Amb el nivell d'IA a 0 la IAIA no apareix: qui és
     dins d'un xat seu (la fila per defecte, el fil de la llista que el
     context ja amaga, o el xat públic de /iaia pel seu descriptor) torna a
     la llista amb un avís, en lloc d'un 404. */
  const dinsDeLaIAIA = iaiaApagada && Boolean(threadId) && (
    threadId === ID_FILA_DE_LA_IAIA || esFilAmagat(threadId) || esPaginaDeLaIAIA(sobre ? objecteDeSobre(sobre) : null)
  );
  const activeThread = trobatEsComunitat || idPerDefecte || dinsDeLaIAIA ? null : trobat;
  const filActiuId = activeThread?.id ?? null;
  const comunitatOberta = comunitatId
    ? comunitats.find((c) => String(c.fil.id) === comunitatId) || null
    : null;

  const consulta = useCallback((comunitat = '', vistaDesti = '') => {
    const parts = [];
    if (connectionContext) parts.push(`context=${enc(connectionContext)}`);
    if (comunitat) parts.push(`comunitat=${enc(comunitat)}`);
    if (vistaDesti) parts.push(`vista=${enc(vistaDesti)}`);
    return parts.length ? `?${parts.join('&')}` : '';
  }, [connectionContext]);

  /* Auditoria 261007 (B) · En eixir del Xat el fil es tanca: XatProvider viu
     per damunt de les rutes i, sense la neteja, el canal de temps real i el
     sondeig del fil (cada 5 o 30 s) continuaven al Mur o al Mercat. Entre dos
     fils, la neteja i l'efecte nou van en el mateix commit: de A a B, sense
     cap null entremig. Una fila per defecte ja no l'obri: la neteja no hi
     afig res.
     Efecte que es nota: el toast «Missatge nou de…» del fil que estava obert
     arribava a l'instant pel canal (o en 5-30 s pel sondeig del fil); ara
     arriba amb el sondeig de la llista, en 25 s com a màxim, igual que el de
     qualsevol altra conversa. Pendent de la decisió del Mestre. */
  useEffect(() => {
    obriFil(threadId && filALaLlista && !trobatEsComunitat && !idPerDefecte ? threadId : null);
    return () => obriFil(null);
  }, [threadId, filALaLlista, trobatEsComunitat, idPerDefecte, obriFil]);

  /* /xat/<comunitat> porta a la seua fitxa. */
  useEffect(() => {
    if (trobatEsComunitat && threadId) navigate(`/xat${consulta(threadId)}`, { replace: true });
  }, [trobatEsComunitat, threadId, navigate, consulta]);

  /* Ordre del Mestre (261007) · /xat/sdp-per-defecte:<clau> porta al xat real
     de la fila d'ajuda (useObriXatPerDefecte): Sóc de Poble, per la via «En
     privat»; la IAIA, al xat públic de la seua pàgina. Un sol punt per a la
     llista, la cerca del xat, la cerca global, l'historial i un enllaç. Una
     sola vegada per navegació: la guarda és una ref (el doble efecte de
     StrictMode ix per ella) i porta la consulta, que és nova a cada
     navegació. Així, si el xat encara no s'ha pogut resoldre i la persona es
     queda ací, tornar a prémer la fila el torna a demanar.
     Gauntlet 261016 (Bloc 3.6) · També la fila de Javi Llinares, i el mode
     de dades tria la via de la IAIA i la de Javi (en llavor i en local, el
     directe que contesta).
     Gauntlet 261016_1530 (Bloc 3.6.1) · Ja cap fila de Sóc de Poble (ni la
     via «En privat» d'ací): les claus són 'javi' i 'iaia', i també
     s'encaminen sense la fila a la llista (`clauEncaminada`, dalt). */
  const obriPerDefecte = useObriXatPerDefecte();
  const perDefecteTractat = useRef(null);
  useEffect(() => {
    if (!trobatPerDefecte) { perDefecteTractat.current = null; return; }
    const previ = perDefecteTractat.current;
    if (previ && previ.threadId === threadId && previ.params === params) return;
    perDefecteTractat.current = { threadId, params };
    obriPerDefecte(trobatPerDefecte, { modeDades, senseSessio });
  }, [trobatPerDefecte, threadId, params, obriPerDefecte, modeDades, senseSessio]);

  /* Onada 6 (tasca 12) · La IAIA s'ha apagat (o ja ho estava) amb la persona
     dins d'un xat seu: a la llista, amb replace i l'avís de per què. */
  const sortidaDeLaIAIA = useRef(null);
  useEffect(() => {
    if (!dinsDeLaIAIA) { sortidaDeLaIAIA.current = null; return; }
    /* Una sola vegada per ruta: el doble efecte de StrictMode ix per la guarda. */
    if (sortidaDeLaIAIA.current === threadId) return;
    sortidaDeLaIAIA.current = threadId;
    showToast(t('section.xat.iaia.apagada', "La IAIA està apagada (nivell d'IA 0). La pots tornar a encendre a «Realitat»."), 'info');
    navigate('/xat', { replace: true });
  }, [dinsDeLaIAIA, threadId, navigate, showToast, t]);

  /* Gauntlet 261016_1530 (Bloc 3.6) · Javi a la ruta de la seua pròpia fila
     (/xat/sdp-per-defecte:javi): a la llista, amb replace i una sola vegada
     per ruta. La seua llista no porta eixa fila (XatContext). */
  const sortidaDeJavi = useRef(null);
  useEffect(() => {
    if (!javiDavantDeJavi) { sortidaDeJavi.current = null; return; }
    if (sortidaDeJavi.current === threadId) return;
    sortidaDeJavi.current = threadId;
    navigate('/xat', { replace: true });
  }, [javiDavantDeJavi, threadId, navigate]);

  /* Onada 6 (beta testers) · «Informa d'un error», al peu de la llista (també
     davall de l'avís d'una llista que no s'ha pogut carregar): obri el xat de
     feedback amb l'esborrany de l'informe (useInformaDUnError). Si eixa
     conversa ja és la que està oberta, Conversa es torna a muntar
     (`revisioEsborrany`) perquè el compositor llija l'esborrany nou. Si no
     s'ha pogut obrir, la reserva: copiar l'informe o enviar-lo per correu. */
  const informe = useInformaDUnError({ t, navigate, showToast, pathname });
  const [revisioEsborrany, setRevisioEsborrany] = useState(0);
  /* 261026 (prompt 261026_1615, tasca 2) · Triar la conversa: les imatges les
     pren el compositor d'eixa conversa (ControlsAdjunt); un text sol, a
     l'esborrany, com l'informe d'un error. */
  const triaCompartir = (fil) => {
    // El lot és de qui tria (Gauntlet 261026_1615, C1615-01): ningú més no el pren.
    if (!triaDestiCompartit(fil.id, joId)) return;
    const text = prenTextCompartit(fil.id, joId);
    if (text && ambitEstable) {
      const clau = `${ambitEstable}::${fil.id}`;
      const previ = llegixEsborrany(clau);
      desaEsborrany(clau, previ ? `${previ}\n\n${text}` : text);
      if (String(fil.id) === String(threadId ?? '')) setRevisioEsborrany((n) => n + 1);
    }
    navigate(`/xat/${enc(fil.id)}`);
  };
  const informaDUnError = async () => {
    const obert = String(threadId ?? '');
    const filId = await informe.informa();
    if (mounted.current && filId && filId === obert) setRevisioEsborrany((n) => n + 1);
    return filId;
  };

  /* ?amb=<id>: una sola obertura per destinatari. La guarda és una ref i no
     una variable de l'efecte: amb el doble efecte de StrictMode, la segona
     passada surt per la guarda i la primera ha de poder navegar igualment.
     La resolució només navega si la URL encara demana eixe destinatari: si
     la persona ja ha obert una altra conversa, la guarda s'ha oblidat. */
  const ambTractat = useRef(null);
  useEffect(() => {
    /* Sense ?amb= (ja hem navegat) la guarda s'oblida: la mateixa instància
       (/xat i /xat/ID) pot rebre després el mateix destinatari. */
    if (!amb) { ambTractat.current = null; return; }
    if (threadId || status !== 'ready' || ambTractat.current === amb) return;
    ambTractat.current = amb;
    const vigent = () => mounted.current && ambTractat.current === amb;
    Promise.resolve()
      .then(() => creaFil(amb, null))
      .then((filId) => { if (vigent() && filId) navigate(`/xat/${enc(filId)}`, { replace: true }); })
      .catch((error) => {
        if (vigent()) showToast(textDeFalladaDirecte(error, t), 'error');
      });
  }, [amb, threadId, status, creaFil, navigate, showToast, t]);

  /* ?sobre=<tipus>:<id>&titol=…&ruta=… (T63.2): el xat comú de la pàgina. La
     regla de qui en té és subjecteDeXat (contracte.js). Sense xat o sense la
     capacitat, un avís honest i la llista. En remot sense sessió, a entrar. */
  const sobreTractat = useRef(null);
  useEffect(() => {
    /* El «Comentar» del document de la columna dreta torna a /xat?sobre= amb
       la mateixa instància: quan la URL ja no el porta, la guarda s'oblida.
       B05 · També amb una conversa oberta: des d'ara la seua URL conserva el
       ?sobre= (/xat/<filId>?sobre=…), i el «Comentar» següent de la mateixa
       pàgina s'ha de tornar a obrir. */
    if (!sobre || threadId) { sobreTractat.current = null; return; }
    if (status !== 'ready') return;
    /* En remot, mentre la sessió es comprova, no hi ha `joId` i encara no és
       `senseSessio`: obriFilDePagina tornaria null i l'avís «cap xat comú»
       seria mentida (i la URL perdria ?sobre=). S'espera: quan la sessió es
       resol, o arriba `joId` o arriba `senseSessio`. En local sempre hi ha joId. */
    if (!joId && !senseSessio) return;
    const clau = JSON.stringify([sobre, titolSobre, rutaSobre]);
    if (sobreTractat.current === clau) return;
    sobreTractat.current = clau;
    /* Una resolució tardana no trepitja la conversa que la persona ja ha obert. */
    const vigent = () => mounted.current && sobreTractat.current === clau;
    const tornaALaLlista = (text) => {
      /* La fila virtual del poble es queda (i el seu botó, amb el focus): la
         marca ja no espera cap comunitat. */
      pobleDemanat.current = false;
      showToast(text, 'info');
      navigate('/xat', { replace: true });
    };
    if (senseSessio) {
      /* T4 · La forma única de l'entrada: /registre?mode=entrar&tornar=… */
      navigate(rutaDEntrada({ tornar: rutaAmbConsulta('/xat', params) }), { replace: true });
      return;
    }
    const senseXatComu = t('section.xat.pagina.senseXat', 'Ací no hi ha cap xat comú on comentar.');
    const objecte = objecteDeSobre(sobre, titolSobre, rutaSobre);
    if (!subjecteDeXat(objecte)) { tornaALaLlista(senseXatComu); return; }
    /* Onada 6 (tasca 12) · Amb la IAIA apagada, el seu xat públic no s'obri. */
    if (iaiaApagada && esPaginaDeLaIAIA(objecte)) {
      tornaALaLlista(t('section.xat.iaia.apagada', "La IAIA està apagada (nivell d'IA 0). La pots tornar a encendre a «Realitat»."));
      return;
    }
    Promise.resolve()
      .then(() => obriFilDePagina(objecte))
      .then((filId) => {
        if (!vigent()) return;
        /* B05 · La conversa conserva el descriptor del subjecte. */
        if (filId) navigate(`/xat/${enc(filId)}?${consultaDeSobre(sobre)}`, { replace: true });
        else tornaALaLlista(senseXatComu);
      })
      .catch((error) => {
        if (!vigent()) return;
        /* Onada 6 · Un codi SDP (003, 013, 016) es diu en la llengua de la interfície. */
        tornaALaLlista(error?.codi === 'sense-capacitat'
          ? t('section.xat.pagina.senseCapacitat', 'Este poble encara no té el xat de les pàgines.')
          : textDErrorDelXat(error, t, t('section.xat.obrirError', "No s'ha pogut obrir la conversa.")));
      });
  }, [sobre, titolSobre, rutaSobre, threadId, status, joId, senseSessio, params, obriFilDePagina, navigate, showToast, t, iaiaApagada]);

  /* Auditoria 261008 (B05) · /xat/<filId>?sobre=… d'un fil que no és a la
     llista carregada ni entre els visitants (s'ha recarregat la pàgina, iOS
     ha restaurat la pestanya o arriba un enllaç compartit): es torna a obrir
     el xat comú amb obriFilDePagina ABANS de decidir el 404. El servidor no
     et fa participant, i el fil torna com a visitant. Una sola vegada per
     ruta i descriptor (la guarda és una ref, com la de ?sobre=):
       · si el fil apareix (és el General, els Avisos o el grup), la conversa;
       · si el servidor en torna un altre (un veí d'un altre poble ha obert
         l'enllaç), s'hi navega amb el mateix descriptor;
       · si no n'hi ha cap, el 404 de sempre; si falla amb un error que no
         es pot reintentar (SDP-XAT-013, sense la capacitat), l'avís i la
         llista, com «Comentar»;
       · revisió 261008 · si falla la xarxa (un error reintentable: 5xx,
         temps esgotat, «Load failed»), la URL es queda: on aniria la
         conversa, l'avís amb «Torna-ho a provar», i un reintent sol amb la
         mateixa escala d'esperes que la llista (esperaDeLaLlista: 2, 5, 10,
         30 i 60 s). Una sola fallada de xarxa no s'endú l'enllaç compartit
         ni la pestanya restaurada. Cada reintent és un intent nou de la
         mateixa clau (`intentReobertura`); l'avís es queda mentre torna a
         provar. */
  const objecteDeLaRuta = useMemo(
    () => (threadId && sobre ? objecteDeSobre(sobre, titolSobre, rutaSobre) : null),
    [threadId, sobre, titolSobre, rutaSobre]
  );
  const clauReobertura = objecteDeLaRuta && subjecteDeXat(objecteDeLaRuta)
    ? JSON.stringify([threadId, sobre, titolSobre, rutaSobre])
    : '';
  const calReobrir = Boolean(clauReobertura) && !trobatViu && !esIdPerDefecte(threadId)
    && status === 'ready' && llistaFresca && Boolean(joId) && !senseSessio && !dinsDeLaIAIA;
  const [reobertura, setReobertura] = useState(null);
  const [intentReobertura, setIntentReobertura] = useState({ clau: '', n: 0 });
  const intent = intentReobertura.clau === clauReobertura ? intentReobertura.n : 0;
  const reobertTractat = useRef(null);
  useEffect(() => {
    const guarda = `${clauReobertura}\n${intent}`;
    if (!calReobrir || reobertTractat.current === guarda) return;
    reobertTractat.current = guarda;
    const clau = clauReobertura;
    const vigent = () => mounted.current && reobertTractat.current === guarda;
    /* Un reintent conserva l'avís i el comptador; una clau nova comença de zero. */
    setReobertura((previa) => (previa?.clau === clau
      ? { ...previa, fet: false }
      : { clau, fet: false, filId: null, avis: null, fallades: 0 }));
    Promise.resolve()
      .then(() => obriFilDePagina(objecteDeLaRuta))
      .then((filId) => {
        if (vigent()) setReobertura({ clau, fet: true, filId: filId ? String(filId) : null, avis: null, fallades: 0 });
      })
      .catch((error) => {
        if (!vigent()) return;
        const text = error?.codi === 'sense-capacitat'
          ? t('section.xat.pagina.senseCapacitat', 'Este poble encara no té el xat de les pàgines.')
          : textDErrorDelXat(error, t, t('section.xat.obrirError', "No s'ha pogut obrir la conversa."));
        if (error?.retriable === true) {
          setReobertura((previa) => ({
            clau, fet: true, filId: null, avis: text, fallades: (previa?.clau === clau ? previa.fallades : 0) + 1
          }));
          return;
        }
        setReobertura({ clau, fet: true, filId: null, avis: null, fallades: 0 });
        showToast(text, 'info');
        navigate('/xat', { replace: true });
      });
  }, [calReobrir, clauReobertura, intent, objecteDeLaRuta, obriFilDePagina, navigate, showToast, t]);
  const reoberturaDeLaRuta = reobertura?.clau === clauReobertura && clauReobertura ? reobertura : null;
  /* L'avís d'una reobertura que ha fallat per la xarxa, mentre el fil no hi és. */
  const avisReobertura = !trobatViu && reoberturaDeLaRuta?.avis ? reoberturaDeLaRuta.avis : null;
  const falladesReobertura = avisReobertura ? reoberturaDeLaRuta.fallades : 0;
  const esperantReintent = Boolean(avisReobertura && reoberturaDeLaRuta.fet);
  const reintentaReobertura = useCallback(() => {
    setIntentReobertura((previ) => ({ clau: clauReobertura, n: (previ.clau === clauReobertura ? previ.n : 0) + 1 }));
  }, [clauReobertura]);
  useEffect(() => {
    if (!esperantReintent || !falladesReobertura) return undefined;
    const temporitzador = setTimeout(reintentaReobertura, esperaDeLaLlista(falladesReobertura, true));
    return () => clearTimeout(temporitzador);
  }, [esperantReintent, falladesReobertura, reintentaReobertura]);
  /* El servidor ha tornat un altre fil per al mateix subjecte: s'hi va. */
  const filReobertAltre = reoberturaDeLaRuta?.fet && !trobatViu && reoberturaDeLaRuta.filId
    && reoberturaDeLaRuta.filId !== threadId ? reoberturaDeLaRuta.filId : null;
  useEffect(() => {
    if (filReobertAltre) navigate(`/xat/${enc(filReobertAltre)}?${consultaDeSobre(sobre)}`, { replace: true });
  }, [filReobertAltre, sobre, navigate]);
  /* Mentre es torna a obrir (o abans de començar, en el mateix render), o
     amb l'avís d'una fallada de xarxa a la vista, cap 404. */
  const reobrint = (calReobrir && !reoberturaDeLaRuta?.fet) || Boolean(avisReobertura) || Boolean(filReobertAltre);

  /* B05 · Un fil de pàgina obert com a visitant des de la llista, la fitxa o
     la cerca (/xat/<filId>, sense ?sobre=) també ha de sobreviure a
     recarregar: la URL hi afig el descriptor del seu subjecte (només
     ?sobre=, vegeu consultaDeSobre), amb replace i conservant la resta de la
     consulta. Res no es torna a muntar. */
  const sobreVisitant = !sobre && trobatViu?.participant === false && !esComunitat(trobatViu) ? sobreDelFil(trobatViu) || '' : '';
  const visitantAnotat = useRef(null);
  useEffect(() => {
    if (!sobreVisitant || !threadId) { visitantAnotat.current = null; return; }
    if (visitantAnotat.current === threadId) return;
    visitantAnotat.current = threadId;
    const consultaNova = new URLSearchParams(params);
    consultaNova.set('sobre', sobreVisitant);
    consultaNova.delete('titol');
    consultaNova.delete('ruta');
    navigate(`/xat/${enc(threadId)}?${consultaNova.toString()}`, { replace: true });
  }, [sobreVisitant, threadId, params, navigate]);

  /* El padró per a la cerca global (grup «Persones»): al servidor, amb un
     xicotet retard, només quan hi ha terme. */
  const terme = searchTerm.trim();
  useEffect(() => {
    if (!terme) { setMembresCerca(CAP); return undefined; }
    let viu = true;
    const temporitzador = setTimeout(() => {
      Promise.resolve()
        .then(() => cercaMembres(terme))
        .then((llista) => { if (viu) setMembresCerca(Array.isArray(llista) ? llista : CAP); })
        .catch(() => { if (viu) setMembresCerca(CAP); });
    }, 250);
    return () => { viu = false; clearTimeout(temporitzador); };
  }, [terme, cercaMembres]);

  const cercant = terme !== '' || filtreCerca != null;
  /* Onada 6 (tasca 12) · Amb la IAIA apagada, la cerca tampoc no la troba al padró. */
  const membresVisibles = useMemo(() => (iaiaApagada ? senseContacteDeLaIAIA(membresCerca) : membresCerca), [iaiaApagada, membresCerca]);
  const resultat = useMemo(() => (cercant
    ? cercaXat({ terme, filtre: filtreCerca, fils: threads, membres: membresVisibles, missatgesPerFil: getThreadMessages, joId })
    : null), [cercant, terme, filtreCerca, threads, membresVisibles, getThreadMessages, joId]);

  /* Les files de la llista (T67): cada comunitat és una sola fila i els seus
     fills no es pinten sols. Per activitat, les fixades primer. */
  const files = useMemo(() => {
    const agrupats = new Set();
    for (const c of comunitats) {
      agrupats.add(String(c.fil.id));
      for (const f of c.fills || CAP) agrupats.add(String(f.id));
    }
    const llista = [];
    for (const c of comunitats) {
      if (c.fil.arxivat) continue;
      llista.push({ clau: `comunitat:${c.fil.id}`, tipus: 'comunitat', comunitat: c, fixat: Boolean(c.fil.fixat), instant: instantDe(c.ultimAl || c.fil.ultimAl) });
    }
    for (const fil of threads) {
      if (fil.arxivat || esComunitat(fil) || agrupats.has(String(fil.id))) continue;
      llista.push({ clau: String(fil.id), tipus: 'fil', fil, fixat: Boolean(fil.fixat), instant: instantDe(fil.ultimAl) });
    }
    llista.sort((a, b) => (Number(b.fixat) - Number(a.fixat)) || (b.instant - a.instant));
    /* T1 · El grup del poble, primer de tot; sense sessió no hi ha fila
       virtual (el xat fals porta la seua comunitat). Revisió adversarial
       260930 (P3) · Ni mentre la llista carrega: encara no se sap si la
       comunitat existix, i la fila virtual feia la llista no buida, tapava el
       «Carregant…» i després es transformava en la de la comunitat.
       Gauntlet 261016 (Bloc 3.6) · Amb el poble del xat: sense amfitrió,
       «Gent de la Torre».
       Gauntlet 261016_1530 (Bloc 3.6; ordre vigent, mana sobre la del
       261007) · Els quatre actors al capdamunt i en este ordre: la comunitat
       de Sóc de Poble, Javi Llinares, Gent de la Torre i la IAIA
       (anteposaActors). La fila que porta a la comunitat quan encara no hi
       és segueix la regla de la del poble (mai mentre carrega ni sense
       sessió) i, en remot, només quan el backend ja ha donat l'id de
       l'entitat (potPortarLaComunitat). */
    const virtual = !senseSessio && status === 'ready';
    const ambElPoble = anteposaPoble(llista, { poble: pobleDeLaLlista, comunitats, virtual });
    return anteposaActors(ambElPoble, { comunitat: virtual && comunitatPortable });
  }, [comunitats, threads, pobleDeLaLlista, senseSessio, status, comunitatPortable]);
  /* La fila virtual del poble no es pot triar: fora mentre se seleccionen xats.
     Ordre del Mestre (261007) · Les files d'ajuda per defecte tampoc: no són
     converses i no tenen res a marcar. Gauntlet 261016_1530 · Ni la que porta
     a la comunitat de Sóc de Poble ('entitat'). Ordre del Mestre (261026_2126,
     P1-36) · La regla viu a LlistaConverses (esFilaTriable): la mateixa que
     decidix quines files obrin la selecció amb la pulsació llarga. */
  const filesVisibles = files.filter((fila) => passaFiltre(fila, filtre) && (!modeSeleccio || esFilaTriable(fila)));
  /* La comunitat de la fila del poble (el focus la seguix quan naix). La
     fitxa automàtica només la rep amb un poble declarat (EntradaDelPoble). */
  const comunitatDelPoble = comunitats.find((c) => esComunitatDelPoble(c, pobleDeLaLlista)) || null;

  const carregaMes = useCallback(() => {
    if (filActiuId != null) carregaMesAntics(filActiuId);
  }, [filActiuId, carregaMesAntics]);

  const marcaVistActiu = useCallback((seq) => {
    if (filActiuId != null) marcaVist(filActiuId, seq);
  }, [filActiuId, marcaVist]);

  const copiaText = useCallback(async (text) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast(t('section.xat.missatge.copiat', 'Text copiat'), 'success');
      }
    } catch {
      showToast(t('section.xat.missatge.noCopiat', "No s'ha pogut copiar el text"), 'error');
    }
  }, [showToast, t]);

  /* Escape també ix de la selecció de xats (T68). S'escolta a `window`, que
     rep l'esdeveniment DARRERE de tots els menús (que l'escolten al document
     o al shadow root i el consumixen amb preventDefault en tancar-se): així
     un sol Escape tanca el menú obert i no s'emporta també la selecció.
     Revisió adversarial 260930 (P2) · Els diàlegs (el full «Ajustos» i
     qualsevol altre) no el consumixen a la SPA: escapeDUnModal els reconeix. */
  useEffect(() => {
    if (!modeSeleccio || typeof window === 'undefined') return undefined;
    const alTeclat = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || escapeDUnModal(e, columnaRef.current)) return;
      setModeSeleccio(false);
      setTriades(new Set());
    };
    window.addEventListener('keydown', alTeclat);
    return () => window.removeEventListener('keydown', alTeclat);
  }, [modeSeleccio]);

  /* Focus coherent (T68). Només si el control que el tenia s'ha desmuntat.
     Ordre del Mestre (261026_2126, P1-36) · Sense el «…», la fila que ha obert
     la selecció amb la pulsació llarga és el punt de tornada: en entrar-hi, si
     el focus no era enlloc (un dit a iOS no enfoca el botó), a eixa fila, ja
     casella triada, o a la creu de la barra; en eixir-ne (la creu o «Marcar
     com a llegides» s'han desmuntat), a la mateixa fila o, si el filtre ja no
     la mostra, al «+» de la fila de títol. */
  const seleccioPrevia = useRef(modeSeleccio);
  useEffect(() => {
    if (seleccioPrevia.current === modeSeleccio) return;
    seleccioPrevia.current = modeSeleccio;
    const columna = columnaRef.current;
    if (!focusPerdut(columna)) return;
    const fila = botoDeLaFila(columna, filaDeLaSeleccio.current);
    (fila || (modeSeleccio ? eixirSeleccioRef : botoNovaRef).current)?.focus();
  }, [modeSeleccio]);

  /* Focus coherent (T67): en obrir la fitxa d'una comunitat, a la fletxa de
     tornar; en tornar-ne, a la fila de la comunitat (o al «+» si el filtre
     l'amaga; abans, el «…» retirat el 261026). Només si el control que el
     tenia s'ha desmuntat. */
  const comunitatPrevia = useRef(comunitatId);
  useEffect(() => {
    const previa = comunitatPrevia.current;
    if (previa === comunitatId) return;
    comunitatPrevia.current = comunitatId;
    const columna = columnaRef.current;
    if (!focusPerdut(columna)) return;
    if (comunitatId) { tornaFitxaRef.current?.focus(); return; }
    const fila = [...(columna?.querySelectorAll('li[data-clau]') || [])]
      .find((li) => li.getAttribute('data-clau') === `comunitat:${previa}`);
    /* Onada 3B · Si la fitxa s'havia obert des de la vista de comunitats, la
       tornada hi porta: el focus va al seu «Veure-ho tot». */
    const bloc = [...(columna?.querySelectorAll('[data-comunitat]') || [])]
      .find((el) => el.getAttribute('data-comunitat') === previa);
    (fila?.querySelector('button') || bloc?.querySelector('.sdp-xat-vista-comunitats__tot') || botoNovaRef.current)?.focus();
  }, [comunitatId]);

  /* Revisió adversarial 260930 (P3) · Focus coherent (T1): la fila virtual
     del poble (clau poble:<id>, FilaPoble) es convertix, quan la comunitat
     naix o arriba, en la fila de la comunitat (comunitat:<id>, FilaComunitat):
     un altre <li> i un altre <button>. Qui l'havia premuda amb el teclat
     quedava amb el focus a <body> (o a res dins del shadow root). Només si
     la persona l'ha premuda (`pobleDemanat`) i si el focus s'ha perdut: mai
     no es roba a qui ja és en un altre lloc, ni quan la comunitat arriba sola
     pel sondeig. */
  const idComunitatDelPoble = comunitatDelPoble ? String(comunitatDelPoble.fil.id) : '';
  useEffect(() => {
    if (!idComunitatDelPoble || !pobleDemanat.current) return;
    pobleDemanat.current = false;
    const columna = columnaRef.current;
    if (!focusPerdut(columna)) return;
    const fila = [...(columna?.querySelectorAll('li[data-clau]') || [])]
      .find((li) => li.getAttribute('data-clau') === `comunitat:${idComunitatDelPoble}`);
    (fila?.querySelector('button') || botoNovaRef.current)?.focus();
  }, [idComunitatDelPoble]);

  /* Onada 3B · Entrar en una vista del rail deixa la cerca i la selecció de
     xats: la vista les tapa i, en tornar a «Xats», no han de reaparéixer a
     mitges (un terme vell o una barra de selecció sense motiu). */
  const vistaPrevia = useRef(vista);
  useEffect(() => {
    if (vistaPrevia.current === vista) return;
    vistaPrevia.current = vista;
    if (!vista) return;
    setSearchTerm('');
    setFiltreCerca(null);
    setCercaActiva(false);
    setModeSeleccio(false);
    setTriades(new Set());
  }, [vista]);

  /* Auditoria 261008 (B04 i B05) · El 404 només es decidix amb una llista al
     dia (`llistaFresca`: amb l'última càrrega fallida, la conversa no es
     tanca per un sondeig que no ha arribat) i quan no s'està tornant a obrir
     un fil de pàgina pel seu descriptor (`reobrint`, també amb l'avís d'una
     fallada de xarxa). Un fil que ja s'havia trobat en esta ruta només es
     conserva mentre la llista no està al dia (`trobat`). */
  /* Gauntlet 261016_1530 (Bloc 3.6) · Ni l'URL d'una fila sintètica que
     s'encamina per la seua clau (`clauDeLaRuta`): el 404 es pintava un
     commit abans que l'efecte navegara (el parpelleig de l'MCR). */
  if (threadId && !trobat && status === 'ready' && llistaFresca && !reobrint && !dinsDeLaIAIA && !clauDeLaRuta) {
    return <NotFoundPage />;
  }

  const messages = activeThread ? getThreadMessages(activeThread.id) : CAP;

  const netejaCerca = () => {
    setSearchTerm('');
    setFiltreCerca(null);
    setCercaActiva(false);
  };

  const tancaDialegNou = () => { setDialegNou(false); setErrorObrir(null); };

  const obriConversaAmb = async (membre) => {
    if (obrintAmb) return;
    /* Des del diàleg, l'error es pinta dins del diàleg (un toast quedaria
       davall del <dialog> modal, inert); des de la cerca, un toast. */
    const desDelDialeg = dialegNou;
    const tanca = () => { tancaDialegNou(); netejaCerca(); };
    setErrorObrir(null);
    if (membre.fil_id) {
      tanca();
      navigate(`/xat/${enc(membre.fil_id)}${consulta()}`);
      return;
    }
    setObrintAmb(membre.usuari_id);
    try {
      const filId = await creaFil(membre.usuari_id, null);
      if (!mounted.current || !filId) return;
      tanca();
      navigate(`/xat/${enc(filId)}${consulta()}`);
    } catch (error) {
      if (!mounted.current) return;
      const text = textDeFalladaDirecte(error, t);
      if (desDelDialeg) setErrorObrir(text);
      else showToast(text, 'error');
    } finally {
      if (mounted.current) setObrintAmb(null);
    }
  };

  const obriComunitat = (id) => navigate(`/xat${consulta(id)}`);

  /* XAT-01 (ordre del Mestre, 14-10) · La primera arribada a /xat en ample
     obri la fitxa del poble (EntradaDelPoble) per la mateixa ruta, amb
     replace. Ningú no l'ha demanada: si el focus ja era fora del Xat (a
     <body>, o a la pàgina de l'amfitrió, que des del shadow root tancat de
     l'encastat no es veu i comptava com a perduda), no es mou. Marcar-la com
     a prèvia deixa l'efecte T67 quiet; sense la marca, el focus saltava a la
     fletxa de la fitxa i el cercador de l'amfitrió se'l deixava. Si el focus
     era dins del Xat, T67 decidix com sempre: només el recol·loca si
     l'element que el tenia desapareix (el cercador de la llista, per
     exemple). La fletxa de tornar el recol·loca en tots dos casos. */
  const entraALaComunitat = (id) => {
    if (focusPerdut(columnaRef.current)) comunitatPrevia.current = String(id);
    navigate(`/xat${consulta(id)}`, { replace: true });
  };

  /* T1 · La fila del poble que encara no existix fa el camí del «Comentar»
     de la pàgina del poble: l'efecte ?sobre= l'obri o el crea i porta al
     seu General. La marca `pobleDemanat` deixa que el focus seguisca la fila
     quan es convertix en la de la comunitat.
     Onada 6 · Amb les fitxes (`towns`), el grup nou es diu com la gent del
     poble si l'amfitrió no n'ha declarat el nom (pobleAmfitrio.js). */
  const obriPoble = (p) => {
    pobleDemanat.current = true;
    navigate(rutaSobreDelPoble(p, towns));
  };

  /* Gauntlet 261016_1530 (Bloc 3.6) · La fila que porta a la comunitat de
     Sóc de Poble fa el camí del «Comentar» de /socdepoble: l'efecte ?sobre=
     l'obri (o la crea, al servidor, perquè la persona ho ha demanat). */
  const obriEntitat = () => navigate(RUTA_SOBRE_DE_SOC_DE_POBLE);

  /* Onada 3B · «Veure-ho tot ›» de la vista de comunitats obri la fitxa i
     conserva la vista d'origen (/xat?comunitat=<id>&vista=comunitats): la
     fitxa hi mana, i la seua fletxa hi torna, com a les apps de missatgeria
     (captura de referència 19.41.43), igual que una conversa oberta des de
     la vista. */
  const obriComunitatDeLaVista = (id) => navigate(`/xat${consulta(id, vista)}`);

  /* Una conversa oberta des de la fitxa conserva la fitxa i, si n'hi havia,
     la vista d'on venia la fitxa. */
  const handleSelectThread = (id) => {
    navigate(`/xat/${enc(id)}${consulta(comunitatOberta ? comunitatOberta.fil.id : '', comunitatOberta ? vista : '')}`);
  };

  /* Un resultat de la cerca: una comunitat obri la seua fitxa; la resta, la conversa. */
  const obriResultat = (fil) => {
    if (esComunitat(fil)) obriComunitat(fil.id);
    else navigate(`/xat/${enc(fil.id)}${consulta()}`);
  };

  /* La fletxa de la conversa (estret) torna on s'havia obert: la fitxa de la
     comunitat, la vista del rail o la llista. */
  const handleBackToList = () => {
    if (comunitatId) navigate(`/xat${consulta(comunitatId, vista)}`);
    else if (vista) navigate(`/xat${consulta('', vista)}`);
    else navigate('/xat');
  };

  /* Ordre del Mestre (261021, pla 261021_0015 §8.5) · Amb origen, la fletxa
     (també en ample) torna a la pàgina d'on s'ha entrat, amb una entrada
     nova: Arrere del navegador no sempre hi porta (origenDelXat.js). */
  const tornaAOrigen = origen ? () => navigate(origen) : null;

  /* Onada 3B · Una conversa oberta des de la vista de comunitats conserva la
     vista a la columna central, com la fitxa conserva ?comunitat=. */
  const obriFilDeLaVista = (id) => {
    navigate(`/xat/${enc(id)}${consulta('', vista)}`);
  };

  /* La fletxa de la fitxa torna on s'havia obert: la vista de comunitats, si
     venia d'ella, o la llista de converses. */
  const tornaDeLaComunitat = () => {
    const desti = consulta('', vista);
    navigate(filActiuId != null ? `/xat/${enc(filActiuId)}${desti}` : `/xat${desti}`);
  };

  const enviaAlBloc = async (triats) => {
    const retall = construeixRetall({ fil: activeThread, missatges: triats, locale });
    try {
      const nota = await creaNota(retall);
      if (!mounted.current) return;
      /* Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») ·
         Derogat per l'ordre del Mestre del 261004: el CustomEvent
         'sdp:note-created' a window, amb la nota sencera al detail. Ningú no
         l'escoltava (la navegació a /notes?nota= ja obri la nota) i dins de
         WordPress lliurava el contingut de la nota a la pàgina de l'amfitrió. */
      showToast(t('section.xat.retall.desat', 'Retall guardat al Bloc de Notes.'), 'success');
      navigate(`/notes?nota=${encodeURIComponent(nota.id)}`);
    } catch (error) {
      if (!mounted.current) throw error;
      console.error('[xat] no s\'ha pogut crear el retall:', error);
      showToast(t('section.xat.retall.error', "No s'ha pogut crear la nota. Comprova la connexió i que tingues la sessió iniciada."), 'error');
      throw error;
    }
  };

  /* ── Selecció de xats (T68) ──
     Mentre se selecciona, la cerca s'amaga i es buida: els resultats (gent,
     missatges) no són files que es puguen triar, i una fila de resultat que
     obrira una conversa enmig de la tria deixaria la barra mentint.
     Ordre del Mestre (261026_2126, P1-36) · S'hi entra amb la pulsació llarga
     sobre una fila (LlistaConverses, onSelecciona), que ja naix triada: és
     la que es volia triar, com a les apps de missatgeria. */
  const entraEnSeleccio = (clau) => {
    netejaCerca();
    filaDeLaSeleccio.current = clau;
    setModeSeleccio(true);
    setTriades(new Set([clau]));
  };
  const ixDeSeleccio = () => { setModeSeleccio(false); setTriades(new Set()); };
  const alternaTria = (clau) => {
    setTriades((previes) => {
      const noves = new Set(previes);
      if (noves.has(clau)) noves.delete(clau);
      else noves.add(clau);
      return noves;
    });
  };
  const marcaTriadesLlegides = () => {
    const ids = [];
    for (const fila of files) {
      if (!triades.has(fila.clau)) continue;
      if (fila.tipus === 'comunitat') ids.push(...(fila.comunitat.fills || CAP).map((f) => f.id));
      else ids.push(fila.fil.id);
    }
    const marcades = Number(marcaLlegides(ids)) || 0;
    showToast(marcades > 0
      ? t('section.xat.seleccio.marcades', '{n} converses marcades com a llegides.').replace('{n}', String(marcades))
      : t('section.xat.seleccio.capMarcada', 'Cap de les converses triades tenia missatges per llegir.'), 'info');
    ixDeSeleccio();
  };

  /* ── La cerca global (T69) ── */
  const filtreActiu = FILTRES_CERCA_XAT.find((f) => f.id === filtreCerca) || null;
  const nomFiltre = filtreActiu ? t(filtreActiu.clauI18n, filtreActiu.etiqueta) : '';
  const alPerdreFocus = (e) => {
    const desti = e.relatedTarget;
    if (desti && (campRef.current?.contains(desti) || filtresRef.current?.contains(desti))) return;
    setCercaActiva(false);
  };
  /* Teclat del cercador (T69). Escape amb text o filtre els buida; buit,
     amaga la llista de filtres i torna la de converses SENSE traure el focus
     del camp (no cau a <body>). Amb la llista de filtres a la vista, Fletxa
     avall o Tab entren a la primera fila (en el DOM, el següent enfocable és
     el botó de filtre, que la tancaria); amagada, Fletxa avall la torna a
     obrir. Retrocés amb el camp buit lleva la fitxa del filtre. */
  const alTeclatCerca = (e) => {
    if (e.key === 'Escape') {
      if (searchTerm || filtreCerca) {
        e.preventDefault();
        e.stopPropagation();
        setSearchTerm('');
        setFiltreCerca(null);
      } else {
        setCercaActiva(false);
      }
      return;
    }
    if (!cercant && (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey && cercaActiva))) {
      e.preventDefault();
      if (cercaActiva) filtresRef.current?.querySelector('button')?.focus();
      else setCercaActiva(true);
      return;
    }
    if (e.key === 'Backspace' && !searchTerm && filtreCerca) {
      e.preventDefault();
      setFiltreCerca(null);
    }
  };
  const tornaAlCamp = () => cercaRef.current?.focus();
  const triaFiltreCerca = (id) => {
    setFiltreCerca(id);
    setCercaActiva(true);
    cercaRef.current?.focus();
  };
  const buidaCerca = () => {
    setSearchTerm('');
    setFiltreCerca(null);
    cercaRef.current?.focus();
  };

  const titolLlista = t('section.xat.llista.titol', 'Converses');
  const etiquetaCerca = t('section.xat.cerca', 'Cerca converses');
  /* T4 · Qui entra des del Xat hi torna, a la mateixa ruta i consulta. */
  const rutaActual = rutaAmbConsulta(pathname, params);
  /* Gauntlet 261022_0225 (XAT-1) · Sense sessió, l'accés (AccesAlXat) és
     l'últim fill del cos amb scroll de la columna, davall de la llista, de la
     fitxa d'una comunitat, de la cerca o de «Comunitats», com quan vivia fora
     del cos davall de tots. Fora del cos no s'encongia i en una pantalla baixa
     (un mòbil apaïsat) deixava la llista a 0 px. Sempre al mateix lloc del
     cos: obrir o tancar la cerca no el torna a muntar davall del dit. */
  const peuDAcces = senseSessio && !activeThread ? (
    <div className="sdp-xat-llista__peu sdp-xat-llista__peu--acces"><AccesAlXat t={t} tornar={rutaActual} navigate={navigate} /></div>
  ) : null;

  /* Gauntlet 261022_0225 (XAT-6) · Sense sessió, la crida a entrar ja la
     porta el peu de la llista (AccesAlXat): l'estat buit no la repetix i diu
     el mateix que a qui té sessió (el filtre buit o la llista buida). */
  let estatBuit = null;
  if (filtre !== 'tot') estatBuit = t('section.xat.buit.filtre', 'Cap conversa amb este filtre.');
  else {
    estatBuit = (
      <>
        <strong>{t('section.xat.buit.titol', 'Encara no tens cap conversa')}</strong>
        <p>{t('section.xat.buit.text', 'Prem «Conversa nova» per a triar amb qui vols parlar.')}</p>
      </>
    );
  }

  let cos;
  if (comunitatId) {
    cos = comunitatOberta ? (
      <FitxaDeLaClosca
        comunitat={comunitatOberta}
        filActiuId={filActiuId}
        onObriFil={handleSelectThread}
        onAfegirGrup={() => showToast(t('section.xat.nou.pagina', "Els grups i les comunitats naixen d'una Pàgina Universal. Obri la pàgina d'un element, d'una entitat o d'un poble i prem «Comentar»."), 'info')}
        locale={locale}
        t={t}
        joId={joId}
      />
    ) : (
      <p className="sdp-workspace-state" role="status">
        {status !== 'ready'
          ? t('section.xat.carregant', 'Carregant…')
          : t('section.xat.comunitat.noTrobada', 'Esta comunitat no és a la teua llista de converses.')}
      </p>
    );
  } else if (cercant) {
    cos = (
      <ResultatsDeLaClosca
        resultat={resultat}
        terme={terme}
        filtre={filtreCerca}
        onObriFil={obriResultat}
        onObriPersona={obriConversaAmb}
        obrintAmb={obrintAmb}
        comunitats={comunitats}
        locale={locale}
        t={t}
      />
    );
  } else if (cercaActiva) {
    cos = <FiltresCerca ref={filtresRef} onTria={triaFiltreCerca} onBlur={alPerdreFocus} onTornaAlCamp={tornaAlCamp} t={t} />;
  } else {
    const llista = (
      <LlistaDeLaClosca
        files={filesVisibles}
        filActiuId={filActiuId}
        onSelect={handleSelectThread}
        onObriComunitat={obriComunitat}
        onObriPoble={obriPoble}
        onObriEntitat={obriEntitat}
        locale={locale}
        t={t}
        joId={joId}
        estatBuit={estatBuit}
        avis={avis}
        carregant={status !== 'ready' && !threads.length}
        seleccio={modeSeleccio ? { triades, onAlterna: alternaTria } : null}
        onSelecciona={entraEnSeleccio}
        informe={informe.disponible && !modeSeleccio ? { onPrem: informaDUnError, obrint: informe.obrint, reserva: informe.reserva, onCopia: informe.copiaInforme } : null}
      />
    );
    /* Auditoria 261008 (B04) · Un sondeig fallit amb la llista conservada:
       l'avís va damunt de la llista i no la tapa (el de LlistaConverses és
       per a la llista que no s'ha pogut carregar mai). El context ja hi torna
       sol als pocs segons.
       Revisió 261008 · La regió viva és SEMPRE muntada, buida i només per al
       lector de pantalla quan no hi ha avís: un lector (NVDA, JAWS, sovint
       VoiceOver) no anuncia una regió role="status" que naix amb el text ja
       posat. Només en canvia el contingut i la classe; a la pantalla no es
       veu res fins que hi ha avís. El mateix text repetit pel sondeig no es
       torna a anunciar, a propòsit: seria soroll cada pocs segons. */
    const ambAvisLlista = Boolean(avisLlista) && !avis;
    cos = (
      <>
        <p className={ambAvisLlista ? 'sdp-xat-avis' : 'sdp-nomes-lector'} role="status">{ambAvisLlista ? avisLlista : ''}</p>
        {llista}
      </>
    );
  }

  let capcalera;
  if (modeSeleccio && !comunitatId) {
    capcalera = <BarraSeleccio quants={triades.size} onEixir={ixDeSeleccio} onMarcaLlegides={marcaTriadesLlegides} t={t} refEixir={eixirSeleccioRef} />;
  } else if (comunitatId) {
    capcalera = (
      <AppGridColumn
        esDark={true}
        titol={t('section.xat.comunitats.titol', 'Comunitats')}
        icona={Users}
        esquerra={(
          <>
            <BotoObriRail etiqueta={t('section.xat.rail.menu', 'Menú')} />
            <button ref={tornaFitxaRef} type="button" className="sdp-xat-icona" onClick={tornaDeLaComunitat} aria-label={t('section.xat.tornaConverses', 'Torna a les converses')}>
              <ArrowLeft size={24} aria-hidden="true" focusable="false" />
            </button>
          </>
        )}
      />
    );
  } else {
    capcalera = (
      <CapcaleraLlista
        titol={titolLlista}
        titolRail={t('section.xat.rail.menu', 'Menú')}
        etiquetaNova={t('section.xat.novaConversaAria', 'Nova conversa')}
        onNova={() => setDialegNou(true)}
        refNova={botoNovaRef}
      />
    );
  }

  /* Onada 3B · La vista que ha triat el rail (?vista=) ocupa tota la columna
     central: la seua fila de títol, els seus controls i el seu cos, en lloc de
     la fila de títol, la cerca i la llista. La fitxa d'una comunitat hi mana. */
  const vistaActiva = comunitatId ? '' : vista;
  const entradaVista = entradaDeVista(vistaActiva);
  const titolVista = entradaVista ? t(entradaVista.clau, entradaVista.text) : '';
  let vistaNode = null;
  if (vistaActiva === 'comunitats') {
    vistaNode = (
      <VistaDeLaClosca
        comunitats={comunitats}
        filActiuId={filActiuId}
        onObriFil={obriFilDeLaVista}
        onObriComunitat={obriComunitatDeLaVista}
        onNova={() => showToast(t('section.xat.vista.comunitats.nova', "Les comunitats naixen de la Pàgina Universal d'una entitat o d'un poble: obri la seua pàgina i prem «Comentar»."), 'info')}
        esquerra={<BotoObriRail etiqueta={t('section.xat.rail.menu', 'Menú')} />}
        carregant={status !== 'ready' && !threads.length}
        peu={peuDAcces}
        locale={locale}
        t={t}
        joId={joId}
      />
    );
  } else if (vistaActiva === 'multimedia') {
    /* Ordre del Mestre del 261004 (prompt 261004_0515, T5) · Contingut
       multimèdia ja és operativa: els enllaços dels missatges carregats en
       esta sessió i, a Fitxers i Documents, l'estat buit honest fins als
       adjunts de F1. Una conversa oberta des d'ella conserva la vista
       (obriFilDeLaVista), i la fletxa hi torna (handleBackToList). La lupa,
       Ordena i Selecciona continuen inertes: «En construcció». */
    vistaNode = (
      <MultimediaDeLaClosca
        titol={titolVista}
        icona={entradaVista.Icona}
        esquerra={<BotoObriRail etiqueta={t('section.xat.rail.menu', 'Menú')} />}
        fils={threads}
        missatgesPerFil={getThreadMessages}
        onObriFil={obriFilDeLaVista}
        onEnConstruccio={() => showToast(t('section.xat.construccio.titol', 'En construcció'), 'info')}
        locale={locale}
        t={t}
      />
    );
  } else if (entradaVista) {
    /* D17 · Si la vista porta un avís propi (Telefonades), els controls inerts
       diuen eixe mateix text: una sola font, la de VISTES_EN_CONSTRUCCIO. */
    const textos = textosDeVista(vistaActiva, t);
    const avisInert = textos?.avis || t('section.xat.construccio.titol', 'En construcció');
    vistaNode = (
      <VistaEnConstruccio
        {...textos}
        titol={titolVista}
        icona={entradaVista.Icona}
        esquerra={<BotoObriRail etiqueta={t('section.xat.rail.menu', 'Menú')} />}
        onEnConstruccio={() => showToast(avisInert, 'info')}
        t={t}
      />
    );
  }

  const middleColumn = (
    <aside className="sdp-workspace-column" aria-label={titolVista || titolLlista} ref={columnaRef}>
      {vistaNode || capcalera}
      {/* La cerca en píndola, sempre a la vista (D5), menys a la fitxa d'una
          comunitat, mentre se seleccionen xats i a les vistes del rail (que
          porten la seua). El filtre de cerca triat (T69) és una fitxa dins
          del camp; el ⊗ buida terme i filtre. A la mateixa línia, la icona
          de filtre desplega Tot · No llegits · Preferits · Grups (T12). */}
      {!vistaNode && !comunitatId && !modeSeleccio ? (
        <div className="sdp-xat-cerca">
          <div className={`sdp-xat-cerca__camp${cercaActiva ? ' sdp-xat-cerca__camp--actiu' : ''}`} ref={campRef} onBlur={alPerdreFocus}>
            {filtreActiu ? (
              <button
                type="button"
                className="sdp-xat-fitxa"
                aria-label={t('section.xat.cerca.lleva', 'Lleva el filtre {nom}').replace('{nom}', nomFiltre)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setFiltreCerca(null); cercaRef.current?.focus(); }}
              >
                <span className="sdp-xat-fitxa__pastilla">
                  <IconaFiltre nom={filtreActiu.icona} size={16} />
                  <span>{nomFiltre}</span>
                  <X size={16} aria-hidden="true" focusable="false" />
                </span>
              </button>
            ) : null}
            <label className="sdp-xat-cerca__etiqueta">
              <span className="sdp-nomes-lector">{etiquetaCerca}</span>
              {!filtreActiu ? <Search size={20} aria-hidden="true" focusable="false" /> : null}
              <input
                ref={cercaRef}
                type="search"
                name="xatSearch"
                autoComplete="off"
                value={searchTerm}
                placeholder={etiquetaCerca}
                onFocus={() => setCercaActiva(true)}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={alTeclatCerca}
              />
            </label>
            {searchTerm || filtreCerca ? (
              <button
                type="button"
                className="sdp-xat-icona"
                aria-label={t('section.xat.tancaCerca', 'Tanca la cerca')}
                onMouseDown={(e) => e.preventDefault()}
                onClick={buidaCerca}
              >
                <CircleX size={20} aria-hidden="true" focusable="false" />
              </button>
            ) : null}
          </div>
          <FiltreConverses opcions={FILTRES} filtre={filtre} onTria={setFiltre} t={t} />
        </div>
      ) : null}
      {vistaNode ? null : <div className={peuDAcces ? 'sdp-workspace-column__body sdp-xat-cos--amb-peu' : 'sdp-workspace-column__body'}>{cos}{peuDAcces}</div>}
      {/* Multimèdia i les vistes «En construcció» pinten el seu cos (fora
          d'esta secció): l'accés hi va darrere, com abans. */}
      {vistaNode && vistaActiva !== 'comunitats' ? peuDAcces : null}
      <DialegNovaConversa
        obert={dialegNou}
        senseSessio={senseSessio}
        onTanca={tancaDialegNou}
        errorObrir={errorObrir}
        t={t}
        cercaMembres={cercaMembres}
        contactesFrequents={contactesFrequents}
        joId={joId}
        joNom={joNom}
        filPersonal={threads.find((f) => f.tipus === 'personal')?.id ?? null}
        onTriaMembre={obriConversaAmb}
        obrintAmb={obrintAmb}
        onObriFil={(id) => { tancaDialegNou(); navigate(`/xat/${enc(id)}${consulta()}`); }}
        onVes={(ruta) => { tancaDialegNou(); navigate(ruta); }}
        tornar={rutaActual}
        senseIAIA={iaiaApagada}
      />
    </aside>
  );

  const rightColumn = (
    <>
      {/* Ordre del Mestre (261007) · La ruta de pas d'una fila d'ajuda no és
          cap conversa: en estret es queda la llista (amb l'avís, si el xat
          encara s'ha de resoldre) fins que arriba el xat real. */}
      <PanellInicialMobil llistaPrimer={!threadId || trobatEsComunitat || idPerDefecte} />
      <EntradaDelPoble poble={poble} comunitat={comunitatDelPoble} aLaLlista={!threadId && pathname === '/xat' && !params.toString()} onEntra={entraALaComunitat} />
      {activeThread ? <ConversaAPantallaCompleta /> : null}
      {activeThread ? (
        <Conversa
          key={`${activeThread.id}\n${revisioEsborrany}`}
          clauEsborrany={ambitEstable ? `${ambitEstable}::${activeThread.id}` : null}
          initialText={connectionContext}
          peu={senseSessio ? <AccesAlXat t={t} tornar={rutaActual} navigate={navigate} /> : null}
          cortesiaIAIA={modeDades === 'remote' && !senseSessio && !iaiaApagada && esXatDeLaIAIA(activeThread)}
          consultaIAIA={!iaiaApagada && (esXatDeLaIAIA(activeThread) || (senseSessio && activeThread.id === ID_FIL_DE_MOSTRA_DE_LA_IAIA))}
          fil={activeThread}
          entitatActiva={entitatActiva}
          moderacio={moderacioDelXat}
          actorLlista={actorLlista}
          messages={messages}
          onSendMessage={sendChatMessage}
          onSendMedia={modeDades === 'remote' && !senseSessio && !esXatDeLaIAIA(activeThread) ? sendChatMedia : null}
          configAdjunts={externalConfig}
          usuariAdjunts={joId}
          onBack={handleBackToList}
          onTornaAOrigen={tornaAOrigen}
          onEnviaAlBloc={enviaAlBloc}
          onCopia={copiaText}
          hiHaMes={Boolean(hiHaMesAntics(activeThread.id))}
          carregantMes={Boolean(carregantAntics(activeThread.id))}
          onCarregaMes={carregaMes}
          esperaAntics={esperaAntics(activeThread.id)}
          carregat={filCarregat ? filCarregat(activeThread.id) : true}
          avisFil={avisFil ? avisFil(activeThread.id) : null}
          onReintentaFil={recarregaFil ? () => recarregaFil(activeThread.id) : null}
          tipusAvisFil={typeof tipusAvisFil === 'function' ? tipusAvisFil(activeThread.id) ?? undefined : undefined}
          llegintFil={typeof llegintFil === 'function' ? Boolean(llegintFil(activeThread.id)) : false}
          onReintenta={reintenta}
          onDescarta={descartaFallit}
          onMarcaVist={marcaVistActiu}
          locale={locale}
          t={t}
        />
      ) : avisReobertura ? (
        /* Revisió 261008 (B05) · On aniria la conversa: la reobertura ha
           fallat per la xarxa i torna a provar sola; el botó no espera. Un
           role="alert" que naix amb el text s'anuncia en aparéixer (a
           diferència d'un role="status"), i és una fallada que bloqueja. */
        <div className="sdp-xat-buit sdp-xat-buit--avis" role="alert">
          <MessageCircle size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" />
          <p className="sdp-xat-buit__titol">{t('section.xat.obrirError', "No s'ha pogut obrir la conversa.")}</p>
          <p>{avisReobertura}</p>
          <button type="button" className="sdp-xat-pindola" onClick={reintentaReobertura}>
            {t('section.xat.missatge.reintenta', 'Torna-ho a provar')}
          </button>
        </div>
      ) : (
        <ColumnaDretaBuida t={t} seo={seoXat} />
      )}
    </>
  );

  /* L'entrada del rail que marca la pàgina actual: la fitxa d'una comunitat
     (la comunitat del rail), una vista o «Xats». */
  let activaAlRail = 'converses';
  if (comunitatId) activaAlRail = 'comunitat';
  else if (vistaActiva) activaAlRail = vistaActiva;

  return (
    <>
      <ClosCaXat
        activa={activaAlRail}
        comunitatActiva={comunitatId || null}
        middleTitle={titolVista || titolLlista}
        middleIcon={entradaVista ? entradaVista.Icona : MessageCircle}
        middleColumn={middleColumn}
        rightColumn={rightColumn}
      />
      {/* Fora de les columnes: en estret una de les dues no es pinta, i el
          diàleg ha d'aparéixer siga on siga la persona dins del Xat. */}
      <DialegCompartir
        obert={Boolean(compartit) && !compartit.desti}
        lot={compartit}
        fils={filsPerCompartir}
        filActiuId={threadId ?? null}
        senseSessio={senseSessio}
        carregant={status !== 'ready' || (!joId && !senseSessio)}
        tornar={rutaActual}
        onTria={triaCompartir}
        onDescarta={descartaCompartit}
        onVes={(ruta) => navigate(ruta)}
        locale={locale}
        t={t}
        joId={joId}
      />
    </>
  );
}

/* ───────────────────────── La fila de títol de la llista ─────────────────── */

/* Una sola fila, com la de «Chats» de la referència de missatgeria (captures
   19.11.50 i 19.12.18): a la dreta, el «+» rodó blau (nom accessible «Nova
   conversa», que App.test.jsx exigix). És la fila 1 de la graella, alineada
   amb la capçalera de la conversa. En estret i en mitjà, la closca del Xat no
   pinta pestanyes (modules.css, .sdp-xat): el primer botó és BotoObriRail,
   que obri el rail. El títol no es centra com a la referència: AppGridColumn
   el posa darrere de `esquerra` a tota la graella (sdp-app-grid-shell §2) i
   centrar-lo voldria tocar la capçalera compartida.
   Ordre del Mestre (261026_2126; pla 261026_2130, P1-36) · El «…» rodó de
   l'esquerra (MenuLlista, amb l'única opció «Seleccionar xats») era inventat
   i s'ha retirat: la selecció s'obri amb la pulsació llarga sobre una fila
   (LlistaConverses). `refNova` deixa que el focus torne al «+». */
function CapcaleraLlista({ titol, titolRail, etiquetaNova, onNova, refNova = null }) {
  return (
    <AppGridColumn
      esDark={true}
      titol={titol}
      icona={MessageCircle}
      esquerra={<BotoObriRail etiqueta={titolRail} />}
    >
      <button
        ref={refNova}
        type="button"
        className="sdp-xat-nova"
        aria-label={etiquetaNova}
        title={etiquetaNova}
        aria-haspopup="dialog"
        onClick={onNova}
      >
        <Plus size={24} aria-hidden="true" focusable="false" />
      </button>
    </AppGridColumn>
  );
}

/* En estret, triar una conversa sempre la porta a pantalla: també la que ja
   era oberta, o una altra, quan s'ha tornat a la llista amb la pestanya
   «Converses». En eixos casos `threadId` no passa de buit a ple,
   PanellInicialMobil no es torna a disparar i la llista no s'apartava.
   Obrir una comunitat no aparta res: la seua fitxa viu a la mateixa columna. */
function useApartaEnEstret(fn) {
  const { mida, tancaPanells } = useAppGrid();
  return (...args) => {
    if (mida === 'estret') tancaPanells();
    fn(...args);
  };
}

function LlistaDeLaClosca({ onSelect, informe = null, ...resta }) {
  const tria = useApartaEnEstret(onSelect);
  /* Onada 6 · «Informa d'un error»: en estret, la llista s'aparta quan la
     conversa ja és a punt (en remot, després de crear-la), no abans. */
  const { mida, tancaPanells } = useAppGrid();
  const informa = async () => {
    const filId = await informe?.onPrem?.();
    if (filId && mida === 'estret') tancaPanells();
  };
  const peu = informe ? (
    <BotoInformaDUnError onPrem={informa} obrint={informe.obrint} reserva={informe.reserva} onCopia={informe.onCopia} t={resta.t} />
  ) : null;
  return <LlistaConverses {...resta} onSelect={tria} peu={peu} />;
}

function ResultatsDeLaClosca({ onObriFil, ...resta }) {
  const obri = useApartaEnEstret(onObriFil);
  const obriFil = (fil) => (esComunitat(fil) ? onObriFil(fil) : obri(fil));
  return <ResultatsCercaXat {...resta} onObriFil={obriFil} />;
}

function VistaDeLaClosca({ onObriFil, ...resta }) {
  const obri = useApartaEnEstret(onObriFil);
  return <VistaComunitats {...resta} onObriFil={obri} />;
}

/* Torn 261004 (T5) · El mateix calc per a Contingut multimèdia: en estret,
   el botó de la conversa d'un enllaç la porta a pantalla. */
function MultimediaDeLaClosca({ onObriFil, ...resta }) {
  const obri = useApartaEnEstret(onObriFil);
  return <VistaMultimedia {...resta} onObriFil={obri} />;
}

function FitxaDeLaClosca({ onObriFil, ...resta }) {
  const obri = useApartaEnEstret(onObriFil);
  /* La fitxa de la comunitat també és una pantalla empesa, com a les apps de
     missatgeria en mòbil (captures 12.54.22 i 12.54.37): fletxa a dalt i cap
     barra inferior. */
  const { mida } = useAppGrid();
  useModeImmersiu(mida === 'estret');
  return <FitxaComunitat {...resta} onObriFil={obri} />;
}

/* L'accés continua visible també al peu d'un fil de mostra o només lectura.
   Gauntlet 261022_0225 (XAT-4) · És l'única parella d'accés del Xat sense
   sessió: el compositor d'un fil de mostra ja no hi afig cap enllaç.
   Ordre del Mestre (261026_2126; prompt 261026_2130, tasca 1; P1-38) · Damunt
   de la parella, «Descarrega l'App» porta a /descarregues, l'adreça curta de
   la pàgina «Descàrregues i Aplicacions» (App.jsx la redirigix a
   /page/descarregues). Dins de l'app nativa no hi és: ja s'hi és. Ho diu
   esAppNativa (config/origenPublic.js), pur i sense cap import de src/natiu. */
function AccesAlXat({ t, tornar, navigate }) {
  return (
    <div className="sdp-alerta sdp-xat-acces">
      <p>{t('section.xat.sessio.calEntrar', 'Benvinguda a Sóc de Poble')}</p>
      {esAppNativa() ? null : (
        <button type="button" className="sdp-xat-pindola sdp-xat-acces__descarrega" onClick={() => navigate('/descarregues')}>
          {t('section.xat.sessio.descarregar', "Descarrega l'App")}
        </button>
      )}
      <div className="sdp-alerta__accions">
        <button type="button" className="sdp-xat-pindola" onClick={() => navigate(rutaDEntrada({ tornar }))}>
          {t('section.xat.sessio.connectar', 'Connectar-se')}
        </button>
        <button type="button" className="sdp-xat-pindola" onClick={() => navigate(rutaDEntrada({ mode: 'crear', tornar }))}>
          {t('section.xat.sessio.registrar', 'Registrar-se')}
        </button>
      </div>
    </div>
  );
}


/* Ordre del Mestre (261007) · El patró estàndard de missatgeria en mòbil: la
   barra inferior només viu a les pestanyes d'arrel; tota pantalla empesa (conversa,
   fitxa de comunitat, ajustos) ocupa la pantalla sencera amb la fletxa a dalt
   (captures 12.54.22, 12.54.54 i 12.57.33). Amb la conversa a pantalla (estret
   i cap panell obert damunt), la closca amaga la barra negra, la franja i la
   barra inferior (ModeImmersiuContext); la fletxa torna a la llista i el mode
   s'apaga sol. En «mitja» la llista conviu amb la conversa i les barres es
   queden. Les pàgines universals no el demanen mai: la barra negra hi és fixa. */

function ConversaAPantallaCompleta() {
  const { mida, panellObert } = useAppGrid();
  useModeImmersiu(mida === 'estret' && panellObert === null);
  return null;
}

/* ─────────────────────── La columna dreta sense conversa ─────────────────── */

/* Ordre del Mestre (260927): en ample i mitjà hi viu el document per defecte;
   en estret no hi cap i una sola columna cada vegada vol un avís sobri.
   Muntada dins de la closca, llig la mida amb useAppGrid().
   Ordre del Mestre (261007) · El document és la pàgina destacada que tria
   l'administrador a paginaDestacada.js («El Xat»; si la clau no existix,
   «L'ànima de la IAIA», la de sempre). Sense l'acció gran «Anar al xat»: ja
   s'és al Xat. Comentar obri el menú de dues vies (ordre del Mestre, 261007):
   «En privat», el xat privat amb Sóc de Poble, i «En públic», el xat públic
   de la pàgina destacada. Connectar i «En públic» porten el MATEIX
   descriptor (revisió del 261007, M3-10): la ruta de la pàgina que el lector
   de connexions sap resoldre (/page/xat, /iaia…), mai /xat, que no és cap
   pàgina (proposta P4). */

/* Fase D (261020, L4) · El document destacat, en diferit amb la seua còpia local
   (el precedent de TextRouteAmbCopiaLocal, App.jsx). En estret no es munta mai,
   tampoc al primer commit sense mesura (AppGridShell comença en 'ample'): /xat
   en mòbil no baixa TextSection ni PAGE_COPY. */
const DocumentDestacatDiferit = lazyRoute(() => Promise.all([
  import('../text/pageContent.js'),
  import('../text/TextSection')
]).then(([{ PAGE_COPY }, { default: TextSection }]) => ({
  default: function DocumentDestacat({ pageCopy, navigate, seo, avis }) {
    const destacada = paginaDestacada(pageCopy, undefined, PAGE_COPY);
    if (!destacada) return avis;
    const { clau, pagina } = destacada;
    const objecte = objecteDePagina({ titol: pagina.title, ruta: rutaDeLaPaginaDestacada(clau) });
    return (
      <div className="sdp-xat-buit">
        <TextSection page={{ ...pagina, chrome: 'context' }} pageKey={clau}
          onConnect={() => navigate(rutaConnectarObjecte(objecte))} objecte={objecte} />
        <SeoDelXat key={`${pagina.title}\n${pagina.subtitle || pagina.lead || ''}`} {...seo} />
      </div>
    );
  }
})));

/* Un tros que no arriba (connexió rural) deixa a la columna dreta l'avís de
   sempre fins a recarregar (lazyRoute: la fallada queda en memòria); qualsevol
   altre error puja (precedent: BarreraDelPanellDelPoble, detailSectionMeta.jsx). */
export class BarreraDelDocumentDestacat extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    if (!esErrorLazy(this.state.error)) throw this.state.error;
    return this.props.fallback;
  }
}

function AvisSenseConversa({ t }) {
  return (
    <div className="sdp-xat-buit sdp-xat-buit--avis">
      <MessageCircle size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" />
      <p className="sdp-xat-buit__titol">{t('section.xat.selectConversation', 'Selecciona una conversa')}</p>
    </div>
  );
}

function ColumnaDretaBuida({ t, seo }) {
  const { mida, mesurada } = useAppGrid();
  const navigate = useNavigate();
  const { pageCopy } = useCoreContent();
  const avis = <AvisSenseConversa t={t} />;
  /* `=== false`: un context sense la clau (proves antigues) es pren per mesurat. */
  if (mida === 'estret' || mesurada === false) return avis;
  return (
    <BarreraDelDocumentDestacat fallback={avis}>
      <Suspense fallback={<div className="sdp-xat-buit" />}>
        <DocumentDestacatDiferit pageCopy={pageCopy} navigate={navigate} seo={seo} avis={avis} />
      </Suspense>
    </BarreraDelDocumentDestacat>
  );
}

/* La pestanya és del Xat, «(N) Xat», també amb el document muntat. TextSection
   registra el SEO del seu document i, com que es munta després del Xat (tornar
   d'una conversa, passar d'estret a ample), guanyava a seoHead per seqüència.
   Este germà, posat darrere, torna a registrar el del Xat en el mateix commit;
   la `key` el remunta quan canvien títol o descripció del document, que és
   quan TextSection es torna a registrar. */
function SeoDelXat(seo) {
  useSEO(seo);
  return null;
}
