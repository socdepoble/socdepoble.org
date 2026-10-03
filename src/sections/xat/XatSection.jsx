/**
 * XatSection.jsx — el Xat sobre AppGridShell (pla 260927_0055 §4.D, DEC-02).
 *
 *   · Rail esquerre plegat per defecte (ClosCaXat), llista al centre calcada
 *     de WhatsApp Desktop (ordre del Mestre, 260928: «volem que la base quede
 *     calcada a la de l'aplicació nativa»): una sola fila de títol amb el «…»
 *     rodó a l'esquerra (Seleccionar xats) i el «+» rodó blau a la dreta
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
 *       - La cerca global: amb el focus i el camp buit, la llista VERTICAL de
 *         filtres (FiltresCerca); en escriure o triar un filtre, els resultats
 *         de cercaXat() (ResultatsCercaXat). Escape o ⊗ netegen; perdre el
 *         focus amb el camp buit i sense filtre torna la llista.
 *       - ?sobre=<tipus>:<id>&titol=…&ruta=… (el «Comentar» d'una Pàgina
 *         Universal) obri el xat comú amb obriFilDePagina i hi navega.
 *   · Onada 3B · ?vista=<id> (les entrades del rail, ClosCaXat): la columna
 *     central pinta VistaComunitats (comunitats) o VistaEnConstruccio
 *     (telefonades, multimedia, destacats) en lloc de la llista; la dreta
 *     conserva l'estat buit de sempre. Sense ?vista= (o amb una que no
 *     existix), la llista de converses de l'onada 3A, sense cap canvi. Una
 *     conversa oberta des de la vista de comunitats la conserva a la columna
 *     (/xat/<fil>?vista=comunitats); la fitxa (?comunitat=) mana sobre la
 *     vista i, oberta des d'ella amb «Veure-ho tot», també la conserva
 *     (?comunitat=<id>&vista=comunitats): la seua fletxa hi torna.
 *   · Columna dreta (ordre del Mestre, 260927): sense conversa hi viu el
 *     document per defecte, l'espai que WhatsApp deixa buit; en obrir-ne una,
 *     només el xat; en tornar a /xat, torna el document. En mode estret no hi
 *     cap: una sola columna cada vegada i, sense conversa, un avís sobri.
 *     Els ajustos del xat viuen a /control-xat, i s'hi arriba des de la
 *     targeta «Ajustos del xat» del Panell de Control (/control): «Novetats»
 *     del rail està amagada (D16) i la roda de «Menú» només replega el rail.
 *   · Sense sessió, «Entrar» (i el ?sobre= en remot) porten a l'entrada amb
 *     rutaDEntrada (T4): /registre?mode=entrar&tornar=<la ruta del Xat>.
 *   · L'àmbit el marca `scopeKey` d'useXat() (ARQ-H01): useNotesData() només
 *     queda per a `creaNota` del Retall. Els esborranys, en canvi, van per
 *     `ambitEstable` (backend + persona + actor, sense la generació del JWT):
 *     revisió adversarial 260930, P2.
 *   · Tot el text passa per t() amb claus section.xat.* (XAT-P10) i les hores
 *     es formaten amb el locale de la interfície (XAT-P11).
 *
 * «Capçalera blava» en fer focus al cercador (onada 3, investigat): cap camí
 * del codi obri res en fer focus. El que es veu en ample i en mitjà és la
 * barra blava del document per defecte de la columna dreta (TextSection amb
 * chrome 'context'), que hi és sempre sense conversa, i l'anell de focus del
 * camp (--sdp-focus). Ara el focus pinta la llista de filtres de WhatsApp.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CircleX, MessageCircle, Plus, Search, Users, X } from 'lucide-react';
import { useLocation, useNavigate, useParams, useSearchParams } from '../../app/contexts/RouterContext';
import NotFoundPage from '../../pages/NotFoundPage';
import AppGridColumn from '../../components/layout/AppGridColumn.jsx';
import { useAppGrid } from '../../components/layout/AppGridShell.jsx';
import TextSection from '../text/TextSection';
import { useXat } from './XatContext';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useNotesData } from '../notes/NotesDataContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { subjecteDeXat } from '../../data/contracte.js';
import { construeixRetall } from './retall.js';
import { cercaXat, FILTRES_CERCA_XAT } from './cercaXat.js';
import { useSEO } from '../../hooks/useSEO';
import { resolveAsset } from '../../config/assetResolver.js';
import { rutaDEntrada } from '../../config/rutaEntrada.js';
import { PAGE_COPY } from '../text/pageContent.js';
import ClosCaXat, { BotoObriRail, VISTES_XAT, entradaDeVista } from './components/ClosCaXat.jsx';
import VistaComunitats from './components/VistaComunitats.jsx';
import VistaEnConstruccio, { textosDeVista } from './components/VistaEnConstruccio.jsx';
import LlistaConverses from './components/LlistaConverses.jsx';
import FiltreConverses from './components/FiltreConverses.jsx';
import Conversa from './components/Conversa.jsx';
import PanellInicialMobil from './components/PanellInicialMobil.jsx';
import MenuLlista from './components/MenuLlista.jsx';
import BarraSeleccio from './components/BarraSeleccio.jsx';
import FiltresCerca, { IconaFiltre } from './components/FiltresCerca.jsx';
import ResultatsCercaXat from './components/ResultatsCercaXat.jsx';
import FitxaComunitat from './components/FitxaComunitat.jsx';
import DialegNovaConversa from './components/DialegNovaConversa.jsx';
import { esComunitat } from './components/FilaConversa.jsx';
import FakeChatOnboarding from './components/FakeChatOnboarding.jsx';
import EntradaDelPoble from './components/EntradaDelPoble.jsx';
import usePobleAmfitrio from './usePobleAmfitrio.js';
import {
  anteposaPoble, avatarDelPoble, comunitatsAmbCaraDelPoble, esComunitatDelPoble, filsAmbCaraDelPoble, rutaSobreDelPoble
} from './pobleAmfitrio.js';

/* Els quatre filtres fixos de WhatsApp (XAT-A17): identificador i clau i18n. */
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
  if (fila.tipus === 'poble') return filtre === 'tot' || filtre === 'grups';
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

export default function XatSection() {
  const xat = useXat();
  // Padró, cerca i selecció pertanyen al mateix àmbit. L'esborrany del
  // compositor no: va per `ambitEstable` i sobreviu a la renovació del JWT.
  if (xat.senseSessio) {
    return (
      <FakeChatOnboarding originalContext={xat}>
        <XatWorkspace key={xat.scopeKey ?? 'xat-fake'} />
      </FakeChatOnboarding>
    );
  }
  return <XatWorkspace key={xat.scopeKey ?? 'xat'} />;
}

function XatWorkspace() {
  const mounted = useRef(false);
  useLayoutEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const { showToast } = useToast();
  const { t } = useUIActions();
  const { locale } = useUIState();
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
     grup va al capdamunt i, en ample, és la primera vista (EntradaDelPoble).
     Null a socdepoble.org: res no canvia. */
  const poble = usePobleAmfitrio();
  /* Onada 3 (P2, revisió) · La cara del poble de l'amfitrió, la de la seua
     fitxa de Pobles: la porta la comunitat del poble quan el servidor no n'hi
     dona cap (pobleAmfitrio.js, filsAmbCaraDelPoble), igual que FilaPoble. */
  const { towns } = useCoreContent();
  const caraDelPoble = useMemo(() => avatarDelPoble(poble, towns), [poble, towns]);

  const {
    chatThreads,
    getThreadMessages,
    sendChatMessage,
    obriFil = noop,
    status = 'ready',
    avis = null,
    creaFil,
    cercaMembres,
    totalNoLlegits = 0,
    hiHaMesAntics = mai,
    carregantAntics = mai,
    carregaMesAntics = noop,
    reintenta = noop,
    descartaFallit = noop,
    marcaVist = noop,
    comunitats: comunitatsDelXat = CAP,
    contactesFrequents = CAP,
    marcaLlegides = capMarcada,
    obriFilDePagina = senseXat,
    joId = null,
    joNom = null,
    senseSessio = false,
    ambitEstable = ''
  } = useXat();

  const titolSeccio = t('section.xat.rail.titol', 'Xat');
  const seoXat = {
    title: totalNoLlegits > 0 ? `(${totalNoLlegits}) ${titolSeccio}` : titolSeccio,
    description: t('section.xat.subtitle', 'Espai de xat'),
    image: resolveAsset('/assets/system/ui/logo-socdepoble-cuadrat-verd.svg')
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
     tenia: la columna, el «…», la creu de la selecció i la fletxa de la fitxa. */
  const columnaRef = useRef(null);
  const botoMesRef = useRef(null);
  const eixirSeleccioRef = useRef(null);
  const tornaFitxaRef = useRef(null);
  /* La persona ha premut la fila virtual del poble i la comunitat encara no
     ha arribat (revisió adversarial 260930, P3; vegeu l'efecte del focus). */
  const pobleDemanat = useRef(false);

  const threads = useMemo(() => filsAmbCaraDelPoble(chatThreads || CAP, poble, caraDelPoble), [chatThreads, poble, caraDelPoble]);
  const comunitats = useMemo(() => comunitatsAmbCaraDelPoble(comunitatsDelXat, poble, caraDelPoble), [comunitatsDelXat, poble, caraDelPoble]);
  const trobat = threadId ? threads.find((c) => String(c.id) === threadId) || null : null;
  const trobatEsComunitat = esComunitat(trobat);
  const activeThread = trobatEsComunitat ? null : trobat;
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

  useEffect(() => {
    obriFil(threadId && !trobatEsComunitat ? threadId : null);
  }, [threadId, trobatEsComunitat, obriFil]);

  /* /xat/<comunitat> porta a la seua fitxa. */
  useEffect(() => {
    if (trobatEsComunitat && threadId) navigate(`/xat${consulta(threadId)}`, { replace: true });
  }, [trobatEsComunitat, threadId, navigate, consulta]);

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
        if (vigent()) showToast(error?.message || t('section.xat.obrirError', "No s'ha pogut obrir la conversa."), 'error');
      });
  }, [amb, threadId, status, creaFil, navigate, showToast, t]);

  /* ?sobre=<tipus>:<id>&titol=…&ruta=… (T63.2): el xat comú de la pàgina. La
     regla de qui en té és subjecteDeXat (contracte.js). Sense xat o sense la
     capacitat, un avís honest i la llista. En remot sense sessió, a entrar. */
  const sobreTractat = useRef(null);
  useEffect(() => {
    /* El «Comentar» del document de la columna dreta torna a /xat?sobre= amb
       la mateixa instància: quan la URL ja no el porta, la guarda s'oblida. */
    if (!sobre) { sobreTractat.current = null; return; }
    if (threadId || status !== 'ready') return;
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
    Promise.resolve()
      .then(() => obriFilDePagina(objecte))
      .then((filId) => {
        if (!vigent()) return;
        if (filId) navigate(`/xat/${enc(filId)}`, { replace: true });
        else tornaALaLlista(senseXatComu);
      })
      .catch((error) => {
        if (!vigent()) return;
        tornaALaLlista(error?.codi === 'sense-capacitat'
          ? t('section.xat.pagina.senseCapacitat', 'Este poble encara no té el xat de les pàgines.')
          : error?.message || t('section.xat.obrirError', "No s'ha pogut obrir la conversa."));
      });
  }, [sobre, titolSobre, rutaSobre, threadId, status, joId, senseSessio, params, obriFilDePagina, navigate, showToast, t]);

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
  const resultat = useMemo(() => (cercant
    ? cercaXat({ terme, filtre: filtreCerca, fils: threads, membres: membresCerca, missatgesPerFil: getThreadMessages, joId })
    : null), [cercant, terme, filtreCerca, threads, membresCerca, getThreadMessages, joId]);

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
       «Carregant…» i després es transformava en la de la comunitat. */
    return anteposaPoble(llista, { poble, comunitats, virtual: !senseSessio && status === 'ready' });
  }, [comunitats, threads, poble, senseSessio, status]);
  /* La fila virtual del poble no es pot triar: fora mentre se seleccionen xats. */
  const filesVisibles = files.filter((fila) => passaFiltre(fila, filtre) && !(modeSeleccio && fila.tipus === 'poble'));
  const comunitatDelPoble = poble ? comunitats.find((c) => esComunitatDelPoble(c, poble)) || null : null;

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

  /* Focus coherent (T68): en entrar a la selecció, a la creu de la barra; en
     eixir-ne, al «…». Només si el control que el tenia s'ha desmuntat. */
  const seleccioPrevia = useRef(modeSeleccio);
  useEffect(() => {
    if (seleccioPrevia.current === modeSeleccio) return;
    seleccioPrevia.current = modeSeleccio;
    if (!focusPerdut(columnaRef.current)) return;
    (modeSeleccio ? eixirSeleccioRef : botoMesRef).current?.focus();
  }, [modeSeleccio]);

  /* Focus coherent (T67): en obrir la fitxa d'una comunitat, a la fletxa de
     tornar; en tornar-ne, a la fila de la comunitat (o al «…» si el filtre
     l'amaga). Només si el control que el tenia s'ha desmuntat. */
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
    (fila?.querySelector('button') || bloc?.querySelector('.sdp-xat-vista-comunitats__tot') || botoMesRef.current)?.focus();
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
    (fila?.querySelector('button') || botoMesRef.current)?.focus();
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

  if (threadId && !trobat && status === 'ready') {
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
      const text = error?.message || t('section.xat.obrirError', "No s'ha pogut obrir la conversa.");
      if (desDelDialeg) setErrorObrir(text);
      else showToast(text, 'error');
    } finally {
      if (mounted.current) setObrintAmb(null);
    }
  };

  const obriComunitat = (id) => navigate(`/xat${consulta(id)}`);

  /* T1 · La fila del poble que encara no existix fa el camí del «Comentar»
     de la pàgina del poble: l'efecte ?sobre= l'obri o el crea i porta al
     seu General. La marca `pobleDemanat` deixa que el focus seguisca la fila
     quan es convertix en la de la comunitat. */
  const obriPoble = (p) => {
    pobleDemanat.current = true;
    navigate(rutaSobreDelPoble(p));
  };

  /* Onada 3B · «Veure-ho tot ›» de la vista de comunitats obri la fitxa i
     conserva la vista d'origen (/xat?comunitat=<id>&vista=comunitats): la
     fitxa hi mana, i la seua fletxa hi torna, com a WhatsApp (captura
     19.41.43), igual que una conversa oberta des de la vista. */
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sdp:note-created', { detail: { note: nota } }));
      }
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
     obrira una conversa enmig de la tria deixaria la barra mentint. */
  const entraEnSeleccio = () => { netejaCerca(); setModeSeleccio(true); setTriades(new Set()); };
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

  let estatBuit = null;
  if (senseSessio) estatBuit = <>
    <p>{t('section.xat.sessio.calEntrar', 'Entra per buscar persones i enviar missatges.')}</p>
    <button type="button" className="sdp-xat-pindola" onClick={() => navigate(rutaDEntrada({ tornar: rutaActual }))}>
      {t('section.xat.sessio.entrar', 'Entrar')}
    </button>
  </>;
  else if (filtre !== 'tot') estatBuit = t('section.xat.buit.filtre', 'Cap conversa amb este filtre.');
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
    cos = (
      <LlistaDeLaClosca
        files={filesVisibles}
        filActiuId={filActiuId}
        onSelect={handleSelectThread}
        onObriComunitat={obriComunitat}
        onObriPoble={obriPoble}
        locale={locale}
        t={t}
        joId={joId}
        estatBuit={estatBuit}
        avis={avis}
        carregant={status !== 'ready' && !threads.length}
        seleccio={modeSeleccio ? { triades, onAlterna: alternaTria } : null}
      />
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
        onSeleccionar={entraEnSeleccio}
        refBoto={botoMesRef}
        t={t}
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
        locale={locale}
        t={t}
        joId={joId}
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
      {vistaNode ? null : <div className="sdp-workspace-column__body">{cos}</div>}
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
      />
    </aside>
  );

  const rightColumn = (
    <>
      <PanellInicialMobil llistaPrimer={!threadId || trobatEsComunitat} />
      <EntradaDelPoble poble={poble} comunitat={comunitatDelPoble} aLaLlista={!threadId && pathname === '/xat' && !params.toString()} />
      {activeThread ? (
        <Conversa
          key={activeThread.id}
          clauEsborrany={ambitEstable ? `${ambitEstable}::${activeThread.id}` : null}
          initialText={connectionContext}
          fil={activeThread}
          messages={messages}
          onSendMessage={sendChatMessage}
          onBack={handleBackToList}
          onEnviaAlBloc={enviaAlBloc}
          onCopia={copiaText}
          hiHaMes={Boolean(hiHaMesAntics(activeThread.id))}
          carregantMes={Boolean(carregantAntics(activeThread.id))}
          onCarregaMes={carregaMes}
          onReintenta={reintenta}
          onDescarta={descartaFallit}
          onMarcaVist={marcaVistActiu}
          locale={locale}
          t={t}
        />
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
    <ClosCaXat
      activa={activaAlRail}
      comunitatActiva={comunitatId || null}
      middleTitle={titolVista || titolLlista}
      middleIcon={entradaVista ? entradaVista.Icona : MessageCircle}
      middleColumn={middleColumn}
      rightColumn={rightColumn}
    />
  );
}

/* ───────────────────────── La fila de títol de la llista ─────────────────── */

/* Una sola fila, com «Chats» de WhatsApp Desktop (captures 19.11.50 i
   19.12.18): a l'esquerra, el «…» rodó (MenuLlista: «Seleccionar xats") i, a
   la dreta, el «+» rodó blau (nom accessible «Nova conversa», que App.test.jsx
   exigix). És la fila 1 de la graella, alineada amb la capçalera de la
   conversa. En estret i en mitjà, la closca del Xat no pinta pestanyes
   (modules.css, .sdp-xat): el primer botó és BotoObriRail, que obri el rail.
   El títol no es centra com a WhatsApp: AppGridColumn el posa darrere de
   `esquerra` a tota la graella (sdp-app-grid-shell §2) i centrar-lo voldria
   tocar la capçalera compartida. Es desplaça, doncs, l'amplària del «…». */
function CapcaleraLlista({ titol, titolRail, etiquetaNova, onNova, onSeleccionar, refBoto, t }) {
  return (
    <AppGridColumn
      esDark={true}
      titol={titol}
      icona={MessageCircle}
      esquerra={(
        <>
          <BotoObriRail etiqueta={titolRail} />
          <MenuLlista onSeleccionar={onSeleccionar} refBoto={refBoto} t={t} />
        </>
      )}
    >
      <button
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

function LlistaDeLaClosca({ onSelect, ...resta }) {
  const tria = useApartaEnEstret(onSelect);
  return <LlistaConverses {...resta} onSelect={tria} />;
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

function FitxaDeLaClosca({ onObriFil, ...resta }) {
  const obri = useApartaEnEstret(onObriFil);
  return <FitxaComunitat {...resta} onObriFil={obri} />;
}

/* ─────────────────────── La columna dreta sense conversa ─────────────────── */

/* Ordre del Mestre (260927): en ample i mitjà hi viu el document per defecte
   («L'ànima de la IAIA»); en estret no hi cap i una sola columna cada vegada
   vol un avís sobri. Muntada dins de la closca, llig la mida amb useAppGrid(). */
function ColumnaDretaBuida({ t, seo }) {
  const { mida } = useAppGrid();
  const { pageCopy } = useCoreContent();
  const anima = pageCopy?.anima || PAGE_COPY?.anima;
  if (mida !== 'estret' && anima) {
    return (
      <div className="sdp-xat-buit">
        <TextSection page={{ ...anima, chrome: 'context' }} pageKey="anima" />
        <SeoDelXat key={`${anima.title}\n${anima.subtitle || anima.lead || ''}`} {...seo} />
      </div>
    );
  }
  return (
    <div className="sdp-xat-buit sdp-xat-buit--avis">
      <MessageCircle size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" />
      <p className="sdp-xat-buit__titol">{t('section.xat.selectConversation', 'Selecciona una conversa')}</p>
    </div>
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
