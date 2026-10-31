/**
 * Conversa.jsx — la conversa oberta a la columna dreta del Xat: capçalera,
 * llista de missatges amb separadors de dia, «Carrega'n més», bombolles i
 * compositor. Extreta de XatSection.jsx (torn 260930) sense canvi de
 * comportament, perquè el detall de la conversa (el patró estàndard de
 * missatgeria) visca en un sol fitxer.
 *
 * Torn 260930 (T1 · la conversa amb el patró estàndard de missatgeria, ordre
 * del Mestre). La lògica pura viu a ../conversa.js i ../esborranys.js:
 *   · Grups: les bombolles seguides del mateix autor el mateix dia van
 *     juntes; només la primera porta la cua i el nom.
 *   · «N missatges no llegits»: es calcula UNA vegada, amb la marca de
 *     lectura que tenia el fil en obrir-lo (XatSection munta Conversa amb
 *     key=fil.id: muntar és obrir), i queda fixa mentre està oberta. En
 *     obrir, si n'hi ha, la vista comença pel separador i no pel fons.
 *   · Scroll: un missatge nou només baixa al fons si ja eres a baix o si és
 *     teu. Si no, ix «Baixa al final» amb el recompte dels que han arribat.
 *     Els antics carregats per dalt conserven la posició de lectura.
 *   · Respostes: «Respon» al menú de la bombolla obri la barra damunt del
 *     camp; la cita de la bombolla porta a l'original i el ressalta.
 *   · Esborranys: amb `clauEsborrany`, el text a mig escriure sobreviu a
 *     canviar de conversa (initialText, si n'hi ha, guanya en pantalla però
 *     no sobreescriu l'esborrany fins que la persona l'edita).
 *
 * Els salts només mouen la llista (scrollTop/scrollTo): scrollIntoView
 * també desplaçaria els contenidors de fora, i incrustada dins d'una pàgina
 * de l'amfitrió en mouria el document.
 *
 * Revisió adversarial 260930 (carril F-Conversa):
 *   · Obrir no és tindre la llista al dia. Si la memòria cau és d'abans
 *     d'obrir (#1) o hi ha no llegits per damunt de la pàgina (#4), el
 *     separador i el salt inicial esperen la càrrega (estatObertura), i
 *     mentrestant no es marca res com a llegit. MS_ESPERA_OBERTURA ho limita.
 *   · Un visitant d'un fil de pàgina no té marca pròpia: cap separador (#2).
 *   · L'esborrany es desa quan la persona escriu, no en muntar (#3).
 *   · «Baixa al final»: el salt suau no es desfà a mitjan animació (#5), i
 *     el focus va al camp només en ample; en estret o sense camp, a la
 *     llista (#6, #9).
 *   · La llista no és una regió en viu: una regió germana anuncia només els
 *     nous d'altres que entren pel final (#11). La cita porta el focus a
 *     l'original (#12).
 */
import { BENVINGUDA_IAIA, IAIA_ID, RESPOSTA_IAIA, agentIASeed } from '../../../data/identitatsSeed.js';
import { respostaDeLaIAIA } from '../../../data/iaiaLocal.js';
import { Fragment, forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, FileText } from 'lucide-react';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import CapcaleraConversa from './CapcaleraConversa.jsx';
import Bombolla from './Bombolla.jsx';
import SeparadorDia from './SeparadorDia.jsx';
import SeparadorNoLlegits from './SeparadorNoLlegits.jsx';
import BotoBaixar from './BotoBaixar.jsx';
import BarraResposta from './BarraResposta.jsx';
import Compositor, { esNomesLectura } from './Compositor.jsx';
import ControlsAdjunt from './ControlsAdjunt.jsx';
import ConsultaIAIA from './ConsultaIAIA.jsx';
import {
  MAX_PAGINES_NO_LLEGITS, MS_ESPERA_OBERTURA, MS_RESSALT, anotaGrups, anunciDeNous, clauDe, classificaCanvi,
  comportamentDesplacament, construeixFiles, estaAlFons, estatObertura, extremsSeq, noLlegitsEnObrir,
  nousAnunciables, scrollPerCentrar, scrollPerDeixarDalt
} from '../conversa.js';
import { desaEsborrany, llegixEsborrany } from '../esborranys.js';

/* Gauntlet 261025_0545 (IA-07) · El nom de la IAIA a la seua benvinguda, el
   del padró (identitatsSeed.js), com a la capçalera i a les bombolles. */
const NOM_IAIA = agentIASeed(IAIA_ID)?.name || 'IAIA MarIA';

/* IDEA-56 (pla 261029_1605, Bloc F.2) · Les respostes locals de la IAIA que
   es queden a la vista (les últimes). */
const MAXIM_RESPOSTES_LOCALS = 20;

/* Gauntlet 261029 (cicle 1, iaia-local-respostes-desordenades) · Cada
   resposta local va just darrere de la SEUA pregunta, no darrere de tota la
   llista: amb dues preguntes l'ordre era Q1, Q2, A1, A2, i al grup públic de
   /iaia la resposta semblava la de l'últim que algú havia escrit (la raó
   d'IA-07 per a la benvinguda). `respostes`: { missatge, pregunta: { id,
   text, previs } }. L'àncora és l'id del missatge propi que torna
   onSendMessage (el pendent i l'eco del servidor el comparteixen: el servidor
   és idempotent per id). Si no en torna cap, el primer missatge propi amb el
   mateix text que no hi era en preguntar (`previs`) ni ancora una altra
   resposta. Mai per creatAl: el rellotge del servidor i el del dispositiu no
   casen. Sense àncora a la llista (l'eco encara no ha arribat, o ja no hi
   és), al final, com abans. Una fila 'iaia-local' talla el grup
   (anotaGrups): la pregunta següent torna a portar la cua. Funció pura. */
function intercalaRespostesLocals(files, respostes) {
  if (!respostes.length) return files;
  const propies = files.filter((fila) => fila.tipus === 'missatge' && fila.msg?.sender === 'me');
  const perClau = new Set(propies.map((fila) => fila.clau));
  const preses = new Set();
  const darrere = new Map();
  const soltes = [];
  for (const { missatge, pregunta } of respostes) {
    const ancora = pregunta.id != null
      ? (perClau.has(pregunta.id) ? pregunta.id : null)
      : propies.find((fila) => !preses.has(fila.clau) && !pregunta.previs.has(fila.clau)
        && String(fila.msg.text ?? '').trim() === pregunta.text)?.clau ?? null;
    const fila = { tipus: 'iaia-local', clau: missatge.id, msg: missatge };
    if (ancora == null) {
      soltes.push(fila);
      continue;
    }
    preses.add(ancora);
    darrere.set(ancora, [...(darrere.get(ancora) || []), fila]);
  }
  const intercalades = [];
  for (const fila of files) {
    intercalades.push(fila);
    if (fila.tipus === 'missatge' && darrere.has(fila.clau)) intercalades.push(...darrere.get(fila.clau));
  }
  return anotaGrups([...intercalades, ...soltes]);
}

/* Gauntlet 261025_0545 (XU-05) · Els missatges que creixen després de muntar
   (la foto o el vídeo que carreguen, la llista viva d'«El Comú»): només
   estes bombolles s'observen per a quedar-se al fons. */
const CREIXEN_DESPRES = new Set(['imatge', 'video', 'veu', 'llista_comu']);

/* Gauntlet 261025_0545 (XU-05, verificació en Chrome) · Marge d'arredoniment
   de scrollTop (els navegadors amb zoom en donen fraccions): menys d'un píxel
   no és que la persona haja pujat. */
const MARGE_SCROLL_PX = 1;

/* Gauntlet 261025_0545 (XU-05, revisió creuada) · El que la conversa ha vist
   o ha posat ella a la llista: on era (top) i fins on podia baixar (maxim,
   scrollHeight − clientHeight). */
function apuntaVist(vist, ol) {
  vist.top = ol.scrollTop;
  vist.maxim = ol.scrollHeight - ol.clientHeight;
}

/* La persona no ha pujat des de l'últim que s'ha vist: scrollTop no ha
   baixat més del marge. */
function noHaPujat(vist, ol) {
  return ol.scrollTop >= vist.top - MARGE_SCROLL_PX;
}

/* El contingut ha crescut davall de la persona: no ha pujat I la llista pot
   baixar més que abans (la foto, el compositor que creix, el teclat que
   encongix la vista). Sense creixement, un scroll que no baixa és la persona
   que puja a poc a poc (1 px o menys per scroll), no contingut. */
function haCrescut(vist, ol) {
  return noHaPujat(vist, ol) && ol.scrollHeight - ol.clientHeight > vist.maxim + MARGE_SCROLL_PX;
}

/* Gauntlet 261025_0545 (MISSED de verify-xat-ux) · Els llindars de
   l'observador de lectura. Amb 0,5 sol, una bombolla més alta que el doble
   de la llista no hi arribava mai (Chromium: isIntersecting false) i no es
   marcava mai. Les potències de dos avisen quan se'n veu prou tros: per a
   tota bombolla fins a 32 vegades la llista, n'hi ha una entre mitja llista
   i la llista sencera. */
const LLINDARS_VIST = [0, 1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1];

/* Vista: la meitat de la bombolla o, si és més alta, mitja llista. Un
   navegador sempre en dona la ràtio; sense (un observador fals), mana
   isIntersecting. */
function esVista(entrada, alcadaLlista) {
  if (typeof entrada.intersectionRatio !== 'number') return Boolean(entrada.isIntersecting);
  if (!(entrada.intersectionRatio > 0)) return false;
  return entrada.intersectionRatio >= 0.5
    || (alcadaLlista > 0 && Number(entrada.intersectionRect?.height) >= alcadaLlista / 2);
}

/* Desplaça la llista i només la llista. Sense scrollTo (jsdom), el salt és sec. */
function desplacaLlista(ol, top, behavior) {
  if (typeof ol.scrollTo === 'function') ol.scrollTo({ top, behavior });
  else ol.scrollTop = top;
}

/* On és un missatge dins del contingut de la llista (px des de dalt del
   contingut, sense dependre del scroll). Null si no hi és o si no hi ha
   maquetació per a mesurar-lo (una caixa sense alçada). */
function posicioAlContingut(ol, clau) {
  if (clau == null) return null;
  const node = [...ol.querySelectorAll('[data-missatge]')].find((n) => n.getAttribute('data-missatge') === String(clau));
  if (!node) return null;
  const caixa = node.getBoundingClientRect();
  if (!caixa.height) return null;
  return caixa.top - ol.getBoundingClientRect().top + ol.scrollTop;
}

/* El coixí de dalt de la llista: el separador de no llegits hi queda com
   quedaria el primer missatge amb el scroll a zero. */
function coixiDalt(ol) {
  if (typeof getComputedStyle !== 'function') return 0;
  const valor = parseFloat(getComputedStyle(ol).paddingTop);
  return Number.isFinite(valor) ? valor : 0;
}

/* Gauntlet 261022_0225 (crítica Claude, F5) · La regió en viu (#11) té
   l'estat propi: anunciar els nous d'altres només repinta este <p>. Abans
   l'estat vivia a Conversa, i cada missatge d'altri feia un segon render de
   tota la conversa (20.002 bombolles amb 10.000 missatges). Conversa li
   passa els anunciables per la ref. */
/* Gauntlet 261025_0545 (XU-13) · Dos anuncis iguals seguits («Pep: ok» i
   «Pep: ok», o «2 missatges nous» dos vegades) deixaven el text igual i el
   lector callava el segon. Un espai dur alterna, com l'avís de les
   emoticones del compositor; un sol anunci per lot, com sempre. */
const AnunciDeNous = forwardRef(function AnunciDeNous({ t }, ref) {
  const [anunci, setAnunci] = useState('');
  useImperativeHandle(ref, () => (nous) => {
    const text = anunciDeNous(nous, t);
    setAnunci((abans) => (text && abans === text ? `${text}\u00A0` : text));
  }, [t]);
  return <p className="sdp-nomes-lector" role="status">{anunci}</p>;
});

/* Gauntlet 261022_0225 (crítica Claude, REV-ESTRES-2) · Cada missatge conserva
   l'objecte d'abans mentre els seus camps són els mateixos. XatContext torna a
   derivar la llista a cada missatge nou i a cada canvi dels fils, i
   combinaMissatges (els propis ja llegits) i anotaMissatgesBloquejats hi fan
   objectes nous amb els mateixos camps. Amb Bombolla memo, cada objecte nou
   repintava la seua bombolla: en un directe, un missatge entrant en repintava
   la meitat. Els objectes plans (metadades) es comparen un nivell més; la
   resta, per identitat. Si no canvia res, la llista d'abans. */
const esPla = (valor) => valor !== null && typeof valor === 'object'
  && [Object.prototype, null].includes(Object.getPrototypeOf(valor));
function mateixosCamps(a, b, nivell = 1) {
  const claus = Object.keys(a);
  if (claus.length !== Object.keys(b).length) return false;
  return claus.every((clau) => Object.hasOwn(b, clau) && (Object.is(a[clau], b[clau])
    || (nivell > 0 && esPla(a[clau]) && esPla(b[clau]) && mateixosCamps(a[clau], b[clau], nivell - 1))));
}
function estabilitza(rebuts, previ) {
  if (!previ) return { llista: rebuts, perClau: new Map(rebuts.map((m, i) => [clauDe(m, i), m])) };
  const perClau = new Map();
  let igual = rebuts.length === previ.llista.length;
  const llista = rebuts.map((m, i) => {
    const clau = clauDe(m, i);
    const abans = previ.perClau.get(clau);
    const estable = abans && esPla(m) && abans !== m && mateixosCamps(abans, m) ? abans : m;
    perClau.set(clau, estable);
    if (estable !== previ.llista[i]) igual = false;
    return estable;
  });
  return { llista: igual ? previ.llista : llista, perClau };
}

/* Pla 261014_1450 (front C) · `entitatActiva` (l'entitat de la barra negra,
   d'useXat per XatSection) baixa per props al Compositor, que diu qui signa.
   Per props i no per IdentitatContext: la UI de la conversa no llig cap
   context d'identitat (Conversa.antics.test.jsx el simula sense actor). */
/* Fase D (261020, tasca 2; pla 261020_1300) · `moderacio`: el valor de
   useModeracio, només amb la capacitat i una sessió (XatSection; mai el xat
   de mostra). Amb ell, cada bombolla d'una altra persona porta «Denuncia el
   missatge» i, si es pot, «Bloqueja {nom}» (objectiuDeMissatge), i la
   capçalera d'un directe 1:1, «Denuncia {nom}» i «Bloqueja {nom}» o
   «Desbloqueja {nom}» (objectiuDeContrapart). Sense, el DOM de sempre. */
/* Fase E (261020, tasca 3; pla 261020_2045) · `actorLlista` ({ id, nom } de
   la sessió, memoritzat a XatSection) i `onMutaLlista` (el port de la tasca 4)
   baixen a cada Bombolla per a la llista viva d'«El Comú». Per props, com
   entitatActiva i moderacio: la conversa no llig cap context d'identitat.
   Sense, les llistes es lligen però no es toquen. */
/* Ordre del Mestre (261021, pla 261021_0015 §8.5) · `onTornaAOrigen` baixa
   tal qual a la capçalera: la fletxa torna a la pàgina d'on s'ha entrat
   (origenDelXat.js). Sense, la fletxa de sempre (onBack). */
/* Gauntlet 261025_0545 (XC-14 / XU-07) · `carregat` (filCarregat del
   context, per XatSection) diu si el fil ja s'ha llegit alguna vegada:
   mentre no, una conversa sense missatges diu «Carregant la conversa…» i no
   «Cap missatge encara». `avisFil` (l'avís del fil, avisFil del context) es
   veu damunt del compositor sense tapar res, amb «Torna-ho a provar»
   (`onReintentaFil`, recarregaFil). Sense, el de sempre. */
/* Gauntlet 261025_0545 (D5, revisió creuada) · `tipusAvisFil` diu què ha
   fallat ('lectura' o 'marca') i tria el text de l'avís; `llegintFil`, si
   una lectura del fil vola: «Torna-ho a provar» ho diu i no torna a demanar.
   Un context d'abans no els porta: 'lectura' i false, el de sempre. */
/* IDEA-56 (pla 261029_1605, Bloc F.2) · `respostaLocalIAIA` (per defecte,
   respostaDeLaIAIA, el cervell local de data/iaiaLocal.js), només amb
   `cortesiaIAIA` (remot amb sessió, al grup públic de /iaia, on ningú no
   contesta): després d'enviar la pregunta, la IAIA respon ací mateix, amb una
   bombolla seua i l'avís «Resposta local de la IAIA: només la veus tu…».
   La resposta viu a l'estat d'esta conversa: mai no va al port ni al
   servidor, no porta `seq` (no marca res com a llegit) i es perd en canviar
   de fil o recarregar. Si l'enviament falla o la persona no accepta les
   normes, no hi ha resposta. */
export default function Conversa({
  initialText = '', clauEsborrany = null, fil, messages: missatgesRebuts, onSendMessage, onSendMedia = null, configAdjunts, usuariAdjunts, onBack, onEnviaAlBloc, onCopia,
  hiHaMes, carregantMes, onCarregaMes, esperaAntics = null, onReintenta, onDescarta, onMarcaVist, locale, t,
  entitatActiva = null, moderacio = null, actorLlista = null, onMutaLlista = null, onTornaAOrigen = null, peu = null, cortesiaIAIA = false, consultaIAIA = false,
  carregat = true, avisFil = null, onReintentaFil = null, tipusAvisFil = 'lectura', llegintFil = false, respostaLocalIAIA = respostaDeLaIAIA
}) {
  /* REV-ESTRES-2 · La llista amb els objectes d'abans (estabilitza); la ref
     guarda la de l'últim render confirmat. */
  const establesRef = useRef(null);
  const estables = useMemo(() => estabilitza(missatgesRebuts, establesRef.current), [missatgesRebuts]);
  useLayoutEffect(() => { establesRef.current = estables; }, [estables]);
  const messages = estables.llista;
  const [text, setText] = useState(() => initialText || llegixEsborrany(clauEsborrany));
  const [modeSeleccio, setModeSeleccio] = useState(false);
  const [triats, setTriats] = useState(() => new Set());
  const [creantNota, setCreantNota] = useState(false);
  const [resposta, setResposta] = useState(null);
  const [aBaix, setABaix] = useState(true);
  const [nousAvall, setNousAvall] = useState(0);
  const [ressalt, setRessalt] = useState(null);
  /* Els nous d'altres que ha d'anunciar la regió en viu (#11): AnunciDeNous. */
  const anunciRef = useRef(null);
  /* En estret (mòbil), enfocar el camp obriria el teclat (#6). */
  const estret = useContext(AppGridContext)?.mida === 'estret';

  /* El fil tal com era en obrir-lo (XatSection munta Conversa amb key=fil.id:
     muntar és obrir). La marca de `fil` puja mentre llegixes (marcaVist) i el
     separador no s'ha de moure per això. Un visitant d'un fil de pàgina no
     té marca pròpia: res no hi compta com a no llegit, com a la llista (#2). */
  const [enObrir] = useState(() => ({
    marca: fil?.participant === false ? null : fil?.llegitFinsSeq,
    ultimSeq: fil?.ultimSeq ?? null,
    total: fil?.noLlegits ?? null
  }));
  /* Límits de l'espera: el temps (MS_ESPERA_OBERTURA) i l'historial cap
     arrere que ja no arriba o que passa de MAX_PAGINES_NO_LLEGITS (#4). */
  const [esperaEsgotada, setEsperaEsgotada] = useState(false);
  const [anticsEsgotats, setAnticsEsgotats] = useState(false);
  const fase = estatObertura(messages, { ultimSeq: enObrir.ultimSeq, llegitFinsSeq: enObrir.marca, hiHaMes });
  const potFixar = fase === 'llesta' || (fase === 'antics' && anticsEsgotats) || (fase !== 'buida' && esperaEsgotada);
  const separadorAra = () => noLlegitsEnObrir(messages, enObrir.marca, { hiHaMes, total: enObrir.total });
  /* undefined: la conversa encara no és llesta (sense missatges, o esperant
     que la llista estiga al dia); null: no hi ha no llegits; { clau, quants }:
     el separador. Es fixa una sola vegada i ja no es recalcula. */
  const [noLlegits, setNoLlegits] = useState(() => (potFixar ? separadorAra() : undefined));
  if (noLlegits === undefined && potFixar) setNoLlegits(separadorAra());
  const llesta = noLlegits !== undefined;
  /* Gauntlet 261025_0545 (XC-14) · El fil encara no s'ha llegit mai i no hi
     ha res a mostrar: la llista està ocupada, no buida. */
  const carregantFil = carregat === false && messages.length === 0;
  /* D5 · Si la primera lectura ha fallat, mana l'avís: mai «Carregant la
     conversa…» i l'avís alhora. La llista està ocupada mentre no hi ha avís
     o mentre «Torna-ho a provar» torna a llegir. */
  const textCarregant = carregantFil && !avisFil;
  const llistaOcupada = carregantFil && (!avisFil || Boolean(llegintFil));

  const llistaRef = useRef(null);
  const sentinellaRef = useRef(null);
  const campRef = useRef(null);
  const aBaixRef = useRef(true);
  /* Gauntlet 261025_0545 (XU-05, verificació en Chrome) · L'últim scrollTop
     de la llista que la conversa ha vist o ha posat ella: amb ell se sap si
     un scroll és la persona que puja (baixa) o el contingut que creix.
     Revisió creuada · I fins on podia baixar llavors (apuntaVist): sense
     creixement, el scroll és de la persona encara que no haja baixat. */
  const vistRef = useRef({ top: 0, maxim: 0 });
  /* Cert mentre dura el salt suau de «Baixa al final» (#5). */
  const baixantRef = useRef(false);
  /* El salt inicial ja s'ha fet (una sola vegada, amb la llista llesta). Si
     has enviat mentre la conversa esperava, el salt no t'allunya del que has
     escrit: es queda al fons, i el separador, al seu lloc (#1). */
  const posicionadaRef = useRef(false);
  const teuEnEsperaRef = useRef(false);
  /* Les pàgines d'historial demanades per a arribar al primer no llegit, i
     el seq més baix que hi havia en demanar l'última (#4). */
  const enrereRef = useRef({ pagines: 0, minim: undefined });
  /* Si el camp mostra l'esborrany de la persona (o el que ella hi ha escrit)
     i no el text de ?context= (#3). */
  const esborranyPropiRef = useRef(!initialText);
  /* Una resposta tardana d'enviar no pot desfer una edició, una cita o un
     enviament posterior, ni recrear l'esborrany després de desmuntar. */
  const revisioCompositorRef = useRef(0);
  useEffect(() => () => { revisioCompositorRef.current += 1; }, []);
  /* IDEA-56 (Bloc F.2) · Les respostes locals de la IAIA (vegeu
     `respostaLocalIAIA`), en una cua perquè arriben en l'ordre de les
     preguntes, i si la conversa encara és muntada (en l'efecte: resistent a
     StrictMode). Cap setState després de desmuntar.
     Gauntlet 261029 (cicle 1) · Cada una porta la seua pregunta, per a anar
     darrere d'ella (intercalaRespostesLocals): { missatge, pregunta }. */
  const [respostesLocals, setRespostesLocals] = useState([]);
  const muntadaRef = useRef(false);
  const comptadorLocalRef = useRef(0);
  const cuaLocalRef = useRef(Promise.resolve());
  useEffect(() => {
    muntadaRef.current = true;
    return () => { muntadaRef.current = false; };
  }, []);
  const geometria = useRef({ claus: [], alcada: 0 });
  /* Als grups i als Avisos cada bombolla diu qui l'ha escrita. */
  const esGrup = fil?.tipus === 'grup' || fil?.tipus === 'canal';
  /* Es respon on es pot escriure: la mateixa regla que amaga el compositor. */
  const potRespondre = !esNomesLectura(fil);

  /* Esborrany de la conversa: es desa quan la persona escriu (un text buit
     l'esborra), mai en muntar. Així el text que porta ?context= (initialText)
     es mostra però no trepitja l'esborrany d'eixa conversa mentre no s'edite
     (#3). Sense clau, res no ix d'ací. */
  const canviaText = useCallback((valor) => {
    revisioCompositorRef.current += 1;
    esborranyPropiRef.current = true;
    setText(valor);
    desaEsborrany(clauEsborrany, valor);
  }, [clauEsborrany]);

  /* Si la llista és a baix (a menys de LLINDAR_FONS_PX): ho recorda la ref,
     per a decidir en arribar un missatge, i l'estat, per al botó. Durant el
     salt suau de «Baixa al final» els scrolls intermedis de l'animació no
     desfan el «ja eres a baix»: el salt s'acaba en arribar al fons o quan la
     persona toca la llista (#5). scrollend no és de Baseline 2022. */
  const actualitzaFons = useCallback(() => {
    const ol = llistaRef.current;
    if (!ol) return;
    apuntaVist(vistRef.current, ol);
    const baix = estaAlFons(ol);
    if (baixantRef.current && !baix) return;
    baixantRef.current = false;
    aBaixRef.current = baix;
    setABaix(baix);
    if (baix) setNousAvall(0);
  }, []);

  /* Gauntlet 261025_0545 (XU-05, verificació en Chrome) · El navegador
     dispara el scroll pendent (el d'una fixació d'abans) ABANS que la crida
     del ResizeObserver del mateix fotograma: una foto que ja era a la memòria
     cau, o el compositor que creix a tecla seguida, el feien llegir lluny del
     fons i «ja eres a baix» queia; l'observador ja no fixava i el final
     quedava tapat amb «Baixa al final» (4 de 4 en Chrome). Un scroll només
     vol dir que la persona ha deixat el fons si scrollTop ha baixat: si eres
     a baix i no ha baixat, el que ha canviat és el contingut, i t'hi quedes.
     Pujar sempre baixa scrollTop; el salt al separador, la cita i els antics
     de dalt els decidix el codi que els fa (actualitzaFons), no este scroll.
     Gauntlet 261025_0545 (XU-05, revisió creuada) · No haver baixat no basta:
     un trackpad, un dit o una roda de precisió lents (uns 60 px/s o menys en
     Chrome) mouen la llista 1 px o menys per scroll, i com que cada scroll
     dins del fons apunta on és, en passar el llindar semblava contingut que
     creix i tornava al fons sense botó (6 de 6 en Chrome). Només es fixa si
     la llista pot baixar més que l'últim cop que s'ha vist (haCrescut). */
  const enScroll = useCallback(() => {
    const ol = llistaRef.current;
    if (!ol) return;
    if (aBaixRef.current && !baixantRef.current && !estaAlFons(ol) && haCrescut(vistRef.current, ol)) {
      ol.scrollTop = ol.scrollHeight;
      apuntaVist(vistRef.current, ol);
      return;
    }
    actualitzaFons();
  }, [actualitzaFons]);

  /* XU-05 (verificació) · Si la persona interromp el salt suau de «Baixa al
     final», la llista és seua des d'eixe moment: es mira on ha quedat (a mig
     camí, el botó torna) i el scroll següent ja no es pren per contingut que
     creix. Fora del salt no s'hi apunta res: la roda i el dit són passius, i
     Chrome pot haver mogut la llista ABANS d'avisar-ne (en Chrome, apuntar-hi
     el scrollTop tornava al fons qui pujava 120 px amb la roda). */
  const interrompBaixada = useCallback(() => {
    if (!baixantRef.current) return;
    baixantRef.current = false;
    actualitzaFons();
  }, [actualitzaFons]);

  /* Scroll segons el que ha canviat (conversa.js, classificaCanvi):
     · el salt inicial, una sola vegada i amb la llista llesta, va al
       separador de no llegits o, si no n'hi ha, al fons; mentre no és llesta,
       la primera llista va provisionalment al fons;
     · els antics carregats per dalt conserven la posició de lectura;
     · els nous baixen al fons si ja eres a baix o si n'hi ha de teus; si
       no, se sumen al recompte del botó «Baixa al final». Els d'altres
       s'anuncien a la regió en viu (#11). */
  useLayoutEffect(() => {
    const ol = llistaRef.current;
    if (!ol) return;
    const previ = geometria.current;
    const canvi = classificaCanvi(previ.claus, messages);
    if (llesta && !posicionadaRef.current && messages.length) {
      posicionadaRef.current = true;
      const separador = teuEnEsperaRef.current ? null : ol.querySelector('.sdp-xat-no-llegits');
      ol.scrollTop = separador
        ? scrollPerDeixarDalt(ol.scrollTop, ol.getBoundingClientRect(), separador.getBoundingClientRect(), coixiDalt(ol))
        : ol.scrollHeight;
      actualitzaFons();
    } else if (canvi.inicial) {
      ol.scrollTop = ol.scrollHeight;
      actualitzaFons();
    } else {
      /* Auditoria de Codex 2150, C6-X1: si en el mateix render entren antics
         per dalt i nous per baix (carregaMissatges i carregaMesAntics són
         independents), tot el creixement no és de dalt. Es compensa el que
         s'ha mogut el missatge que abans era el primer; sense maquetació per
         a mesurar-lo, el creixement sencer, com abans. */
      if (canvi.antics > 0) {
        const ara = posicioAlContingut(ol, previ.ancora?.clau);
        ol.scrollTop += ara != null && previ.ancora?.pos != null
          ? ara - previ.ancora.pos
          : ol.scrollHeight - previ.alcada;
        /* XU-05 (verificació) · La compensació és del codi, no de la persona. */
        apuntaVist(vistRef.current, ol);
      }
      if (canvi.nous.length) {
        const teu = canvi.nous.some((m) => m?.sender === 'me');
        if (teu && !posicionadaRef.current) teuEnEsperaRef.current = true;
        if (teu || aBaixRef.current) {
          ol.scrollTop = ol.scrollHeight;
          actualitzaFons();
        } else {
          /* Fase D (261020, tasca 2) · Els de qui has bloquejat no compten. */
          const aliens = canvi.nous.filter((m) => m?.sender !== 'me' && !m?.bloquejat).length;
          if (aliens) setNousAvall((n) => n + aliens);
        }
        /* Només després del salt inicial: la càrrega d'obrir no s'anuncia. */
        const anunciables = nousAnunciables(canvi.nous);
        if (posicionadaRef.current && anunciables.length) anunciRef.current?.(anunciables);
      }
    }
    const claus = messages.map(clauDe);
    geometria.current = { claus, alcada: ol.scrollHeight, ancora: { clau: claus[0], pos: posicioAlContingut(ol, claus[0]) } };
  }, [messages, llesta, actualitzaFons]);

  /* La barra de resposta ocupa lloc davall de la llista: si eres a baix, s'hi
     continua (com a les apps de missatgeria, l'últim missatge no queda tapat).
     Gauntlet 261025_0545 (XC-14) · L'avís del fil també hi ocupa lloc.
     IDEA-56 (Bloc F.2) · I la resposta local de la IAIA, que arriba pel final. */
  useLayoutEffect(() => {
    const ol = llistaRef.current;
    if (!ol || !aBaixRef.current) return;
    ol.scrollTop = ol.scrollHeight;
    apuntaVist(vistRef.current, ol);
  }, [resposta, avisFil, respostesLocals]);

  /* Gauntlet 261025_0545 (XU-05) · Enganxada al fons també quan canvia una
     mida i no la llista: la foto que acaba de carregar, el compositor que
     creix fins a 6 línies, la barra de l'adjunt o el teclat d'Android, que
     encongix la vista (SystemBars). Cap d'eixos canvis fa scroll, i el final
     quedava tapat sense «Baixa al final». Si eres a baix, t'hi quedes; si no,
     res no salta. S'observa la caixa de la llista i només les bombolles que
     creixen després de muntar (CREIXEN_DESPRES): observar-les totes serien
     10.000 observacions amb 10.000 missatges. Sense ResizeObserver, com abans.
     Verificació en Chrome · Si scrollTop ha baixat des de l'últim que s'ha
     vist (una animació de teclat que puja i el seu scroll encara no ha
     arribat), no es fixa: es mira on és. Una retallada del navegador quan el
     contingut s'encongix també el baixa, però deixa la llista al fons. */
  const midesRef = useRef(null);
  useEffect(() => {
    const ol = llistaRef.current;
    if (!ol || typeof ResizeObserver === 'undefined') return undefined;
    const observador = new ResizeObserver(() => {
      if (aBaixRef.current && noHaPujat(vistRef.current, ol)) {
        ol.scrollTop = ol.scrollHeight;
        apuntaVist(vistRef.current, ol);
      } else actualitzaFons();
    });
    observador.observe(ol);
    midesRef.current = { observador, observats: new Set() };
    return () => {
      observador.disconnect();
      midesRef.current = null;
    };
  }, [actualitzaFons]);
  useEffect(() => {
    const mides = midesRef.current;
    const ol = llistaRef.current;
    if (!mides || !ol) return;
    const creixen = new Set(messages.filter((msg) => msg?.id != null && CREIXEN_DESPRES.has(msg.tipus)).map((msg) => String(msg.id)));
    const nodes = creixen.size ? [...ol.querySelectorAll('[data-missatge]')] : [];
    const actuals = new Set(nodes.filter((node) => creixen.has(node.getAttribute('data-missatge'))));
    for (const node of mides.observats) {
      if (actuals.has(node)) continue;
      mides.observador.unobserve?.(node);
      mides.observats.delete(node);
    }
    for (const node of actuals) {
      if (mides.observats.has(node)) continue;
      mides.observador.observe(node);
      mides.observats.add(node);
    }
  }, [messages]);

  useEffect(() => {
    setModeSeleccio(false);
    /* Gauntlet 261022_0225 (crítica Claude, F6) · Un Set nou sempre és un
       estat nou: en muntar, forçava un segon render de tota la conversa. Ara
       només es buida si hi havia res triat. */
    setTriats((previs) => (previs.size ? new Set() : previs));
  }, [fil?.id]);

  /* L'espera a estar al dia té límit: passat MS_ESPERA_OBERTURA es fixa amb
     el que hi ha (el comportament d'abans), perquè una càrrega que no arriba
     no deixe mai la marca de lectura penjada (#1). */
  useEffect(() => {
    if (llesta) return undefined;
    const temporitzador = setTimeout(() => setEsperaEsgotada(true), MS_ESPERA_OBERTURA);
    return () => clearTimeout(temporitzador);
  }, [llesta]);

  /* Amb no llegits per damunt de la pàgina, es demana historial cap arrere
     fins que hi entra el primer (#4). Una petició que no porta res de nou, o
     passar de MAX_PAGINES_NO_LLEGITS, acaba l'espera: el separador es fixa
     amb el que hi ha i diu els no llegits del fil (noLlegitsEnObrir, total). */
  useEffect(() => {
    if (llesta || fase !== 'antics' || anticsEsgotats || carregantMes) return;
    const { minim } = extremsSeq(messages);
    const previ = enrereRef.current;
    if (previ.pagines >= MAX_PAGINES_NO_LLEGITS || previ.minim === minim) {
      setAnticsEsgotats(true);
      return;
    }
    enrereRef.current = { pagines: previ.pagines + 1, minim };
    onCarregaMes?.();
  }, [llesta, fase, anticsEsgotats, carregantMes, messages, onCarregaMes]);

  /* Carrega automàtica de l'historial en arribar a dalt (XAT-A23).
     Auditoria 261008 (B09) · Un observador nou notifica de seguida si el
     sentinella és a la vista: quan una càrrega fallava, `carregantMes` tornava
     a false, l'observador es tornava a crear i la tornava a demanar a
     l'instant (sense xarxa, un bucle de peticions). Amb `esperaAntics` (el
     context, esperaDeLHistorial) no es crea cap observador dins de l'espera
     (`fins`) i, amb `manual`, gens: només el botó «Carrega'n més» o la xarxa
     que torna. Passada l'espera, `despertaAntics` el torna a crear. Sense
     `esperaAntics`, com sempre. */
  const anticsManual = Boolean(esperaAntics?.manual);
  const anticsFins = Number(esperaAntics?.fins) || 0;
  const [despertaAntics, setDespertaAntics] = useState(0);
  useEffect(() => {
    const node = sentinellaRef.current;
    if (!node || !hiHaMes || carregantMes || anticsManual || typeof IntersectionObserver === 'undefined') return undefined;
    const resta = anticsFins - Date.now();
    if (resta > 0) {
      const temporitzador = setTimeout(() => setDespertaAntics((n) => n + 1), resta);
      return () => clearTimeout(temporitzador);
    }
    const observador = new IntersectionObserver((entrades) => {
      if (entrades.some((e) => e.isIntersecting)) onCarregaMes();
    }, { root: llistaRef.current });
    observador.observe(node);
    return () => observador.disconnect();
  }, [hiHaMes, carregantMes, onCarregaMes, anticsManual, anticsFins, despertaAntics]);

  /* Marcar com a llegit només el que ha entrat en pantalla amb la pestanya
     visible (XAT-C08). El context agrupa i mai fa retrocedir la marca. Res
     fins que la conversa és llesta: la llista provisional (memòria cau
     rància, o la pàgina sense el primer no llegit) no ha de fer pujar la
     marca per damunt de no llegits que ningú no ha vist (#1, #4).
     Gauntlet 261022_0225 (crítica Claude, F7) · Un sol observador mentre la
     conversa és llesta: cada canvi de la llista observa només les bombolles
     noves i deixa les que ja no hi són. Abans se'n creava un a cada missatge,
     que tornava a observar-les totes (6.668 observe() per un sol missatge
     amb 10.000). Com que ja no es torna a notificar tot, es recorda què és a
     la vista, i cada notificació amb la pestanya visible marca fins al més
     alt: el mateix que feia la notificació inicial de l'observador nou.
     Gauntlet 261025_0545 (XU-08, XC-12) · Llegit vol dir vist:
       · L'arrel és la pantalla i no la llista: la llista retalla igual, i ara
         també compta si la conversa és fora de la vista (l'encastament dins
         d'una pàgina de l'amfitrió que s'ha desplaçat).
       · La finestra ha d'estar atenta: visible i amb el focus. Desenfocada
         (darrere d'una altra app, l'altra pantalla) no es marca res. Sense
         focus però sense haver-lo perdut mai (un iframe que encara no s'ha
         tocat, un WebView que no el diu), com abans.
       · En tornar (focus de la finestra o pestanya visible), es marca el que
         ja hi ha a la vista, sense esperar cap missatge ni cap scroll.
     MISSED (verify-xat-ux) · Una bombolla més alta que el doble de la llista
     també es llig: esVista i LLINDARS_VIST. */
  const marcaVistRef = useRef(onMarcaVist);
  useEffect(() => { marcaVistRef.current = onMarcaVist; }, [onMarcaVist]);
  /* Gauntlet 261025_0545 (XU-08, revisió) · El focus es vigila des que es
     munta la conversa i no des que és llesta: si la finestra el perd mentre
     carrega (canviar d'app als primers segons), quan es fa llesta ja no és
     atenta. Tornar a ser visible només desfà el desenfocament amb el focus:
     una finestra destapada mentre una altra app el té continua desenfocada. */
  /* Gauntlet 261025_0545 (D4, revisió creuada) · Un WKWebView (Capacitor a
     iOS) que dispara blur en anar al fons però, en tornar, ni torna el focus
     ni dispara 'focus' deixava la conversa desenfocada per sempre: no es
     marcava res fins que la persona enfocava alguna cosa. També la desfan
     'pageshow' amb la pàgina visible i el primer toc o tecla DINS de la
     conversa (qui toca la conversa la mira). Sense res d'això, desenfocada
     no marca res, com fins ara. */
  const arrelRef = useRef(null);
  const atencioRef = useRef({ desenfocada: false, enTornar: null });
  useEffect(() => {
    const doc = llistaRef.current?.ownerDocument ?? globalThis.document;
    const finestra = doc?.defaultView;
    if (!doc) return undefined;
    const atencio = atencioRef.current;
    const arrel = arrelRef.current;
    const ambFocus = () => typeof doc.hasFocus !== 'function' || doc.hasFocus();
    const enDesenfocar = () => { atencio.desenfocada = true; };
    const enTornar = () => {
      atencio.desenfocada = false;
      atencio.enTornar?.();
    };
    const enCanviarVisibilitat = () => {
      if (doc.visibilityState !== 'visible') return;
      if (ambFocus()) atencio.desenfocada = false;
      atencio.enTornar?.();
    };
    /* Gauntlet 261025_0545 (D4, revisió creuada) · Només el pageshow d'una
       pàgina que torna (persisted): el de la primera càrrega arriba després
       de load i, si la conversa ja era muntada i la finestra havia perdut el
       focus, marcava com a llegit amb la finestra desenfocada. */
    const enMostrarPagina = (esdeveniment) => {
      if (esdeveniment?.persisted && doc.visibilityState === 'visible') enTornar();
    };
    const enInteractuar = () => {
      if (atencio.desenfocada) enTornar();
    };
    const opcionsInteraccio = { capture: true, passive: true };
    finestra?.addEventListener('blur', enDesenfocar);
    finestra?.addEventListener('focus', enTornar);
    finestra?.addEventListener('pageshow', enMostrarPagina);
    doc.addEventListener('visibilitychange', enCanviarVisibilitat);
    for (const tipus of ['pointerdown', 'touchstart', 'keydown']) arrel?.addEventListener(tipus, enInteractuar, opcionsInteraccio);
    return () => {
      finestra?.removeEventListener('blur', enDesenfocar);
      finestra?.removeEventListener('focus', enTornar);
      finestra?.removeEventListener('pageshow', enMostrarPagina);
      doc.removeEventListener('visibilitychange', enCanviarVisibilitat);
      for (const tipus of ['pointerdown', 'touchstart', 'keydown']) arrel?.removeEventListener(tipus, enInteractuar, opcionsInteraccio);
    };
  }, []);
  const vigiaRef = useRef(null);
  useEffect(() => {
    const ol = llistaRef.current;
    if (!ol || !llesta || typeof IntersectionObserver === 'undefined') return undefined;
    const doc = ol.ownerDocument;
    const aLaVista = new Set();
    const atencio = atencioRef.current;
    const atenta = () => doc.visibilityState === 'visible'
      && (typeof doc.hasFocus !== 'function' || doc.hasFocus() || !atencio.desenfocada);
    const marcaLaVista = () => {
      if (!atenta()) return;
      let maxim = null;
      for (const node of aLaVista) {
        const seq = Number(node.getAttribute('data-vist') ?? NaN);
        if (Number.isFinite(seq) && (maxim == null || seq > maxim)) maxim = seq;
      }
      if (maxim != null) marcaVistRef.current(maxim);
    };
    const observador = new IntersectionObserver((entrades) => {
      const alcada = ol.clientHeight;
      for (const e of entrades) {
        if (esVista(e, alcada)) aLaVista.add(e.target);
        else aLaVista.delete(e.target);
      }
      marcaLaVista();
    }, { threshold: LLINDARS_VIST });
    atencio.enTornar = marcaLaVista;
    vigiaRef.current = { observador, observats: new Set(), aLaVista };
    return () => {
      observador.disconnect();
      if (atencio.enTornar === marcaLaVista) atencio.enTornar = null;
      vigiaRef.current = null;
    };
  }, [llesta]);
  useEffect(() => {
    const vigia = vigiaRef.current;
    const ol = llistaRef.current;
    if (!vigia || !ol) return;
    const actuals = new Set(ol.querySelectorAll('[data-vist]'));
    for (const node of vigia.observats) {
      if (actuals.has(node)) continue;
      vigia.observador.unobserve(node);
      vigia.observats.delete(node);
      vigia.aLaVista.delete(node);
    }
    for (const node of actuals) {
      if (vigia.observats.has(node)) continue;
      vigia.observador.observe(node);
      vigia.observats.add(node);
    }
  }, [messages, llesta]);

  /* El ressalt del missatge citat dura MS_RESSALT; un objecte nou a cada
     salt el torna a encendre encara que siga el mateix missatge. */
  useEffect(() => {
    if (!ressalt) return undefined;
    const temporitzador = setTimeout(() => setRessalt(null), MS_RESSALT);
    return () => clearTimeout(temporitzador);
  }, [ressalt]);

  const envia = useCallback(async () => {
    const value = text.trim();
    if (!value) return;
    const revisio = ++revisioCompositorRef.current;
    const citat = resposta;
    /* Enviar buida l'esborrany només si el camp era l'esborrany de la
       persona: enviar tal qual el text de ?context= no se'l menja (#3). */
    const propi = esborranyPropiRef.current;
    setText('');
    setResposta(null);
    if (propi) desaEsborrany(clauEsborrany, '');
    /* Gauntlet 261029 (cicle 1) · Els missatges propis amb este mateix text
       que ja hi eren abans de preguntar: la resposta local no s'hi ancora
       (intercalaRespostesLocals). Només amb la cortesia. */
    const previs = cortesiaIAIA
      ? new Set((establesRef.current?.llista || [])
        .filter((m) => m?.sender === 'me' && m.id != null && String(m.text ?? '').trim() === value).map((m) => String(m.id)))
      : null;
    let enviat = false;
    let idPropi = null;
    try {
      const enviats = citat?.id != null ? await onSendMessage(fil, value, { respostaA: citat.id }) : await onSendMessage(fil, value);
      /* XatContext torna [definitiu]: el mateix id que el pendent. */
      idPropi = Array.isArray(enviats) && enviats[0]?.id != null ? String(enviats[0].id) : null;
      enviat = true;
    } catch {
      /* Si el compositor continua igual, es recuperen el text i la cita.
         Si la persona ja ha continuat, mana el que ha fet després. */
      if (revisioCompositorRef.current !== revisio) return;
      setText(value);
      if (propi) desaEsborrany(clauEsborrany, value);
      if (citat) setResposta(citat);
    }
    /* IDEA-56 (Bloc F.2) · La pregunta ja ha anat al grup públic: la IAIA
       respon ací, només per a qui pregunta. Si no troba res, la seua frase
       de sempre (RESPOSTA_IAIA). */
    if (!enviat || !cortesiaIAIA || typeof respostaLocalIAIA !== 'function') return;
    cuaLocalRef.current = cuaLocalRef.current
      .then(() => respostaLocalIAIA(value))
      .catch(() => null)
      .then((trobada) => {
        if (!muntadaRef.current) return;
        comptadorLocalRef.current += 1;
        const missatge = {
          id: `iaia-local:${comptadorLocalRef.current}`, sender: 'other', author: NOM_IAIA, usuariId: IAIA_ID, is_ai: true,
          text: typeof trobada === 'string' && trobada.trim() ? trobada : RESPOSTA_IAIA, creatAl: new Date().toISOString()
        };
        const pregunta = { id: idPropi, text: value, previs };
        setRespostesLocals((previes) => [...previes, { missatge, pregunta }].slice(-MAXIM_RESPOSTES_LOCALS));
        anunciRef.current?.([missatge]);
      })
      .catch(() => {});
  }, [text, resposta, fil, onSendMessage, clauEsborrany, cortesiaIAIA, respostaLocalIAIA]);

  /* En triar «Respon» el focus va al camp, com a les apps de missatgeria.
     Directament i no amb un efecte sobre `resposta`: respondre al missatge que ja és la
     resposta no canvia l'estat, i el focus del menú desmuntat cauria a
     <body> (revisió adversarial 260930, #8). */
  const respon = useCallback((missatge) => {
    revisioCompositorRef.current += 1;
    setResposta(missatge);
    campRef.current?.focus();
  }, []);

  const cancelaResposta = useCallback(() => {
    revisioCompositorRef.current += 1;
    setResposta(null);
    campRef.current?.focus();
  }, []);

  const baixaAlFinal = () => {
    const ol = llistaRef.current;
    if (!ol) return;
    const comportament = comportamentDesplacament();
    baixantRef.current = comportament === 'smooth';
    desplacaLlista(ol, ol.scrollHeight, comportament);
    apuntaVist(vistRef.current, ol);
    aBaixRef.current = true;
    setABaix(true);
    setNousAvall(0);
    /* El botó desapareix i el focus no es pot perdre. En ample va al camp;
       en estret no, perquè obriria el teclat del mòbil damunt del final que
       volies llegir (#6), i sense camp (Avisos de només lectura, Retall)
       cauria a <body> (#9): en tots dos casos, a la llista. */
    if (!estret && campRef.current) campRef.current.focus();
    else ol.focus({ preventScroll: true });
  };

  /* La cita porta a l'original: la llista el centra i el ressalta, i el
     focus hi va (#12) perquè el lector el llegisca i el Tab continue des
     d'allí. El salt ja el fa la llista: preventScroll. */
  const vesAlMissatge = useCallback((id) => {
    const ol = llistaRef.current;
    if (!ol || id == null) return;
    const node = [...ol.querySelectorAll('[data-missatge]')].find((el) => el.getAttribute('data-missatge') === String(id));
    if (!node) return;
    desplacaLlista(ol, scrollPerCentrar(ol.scrollTop, ol.getBoundingClientRect(), node.getBoundingClientRect()), comportamentDesplacament());
    node.focus({ preventScroll: true });
    setRessalt({ id: String(id) });
  }, []);

  const alterna = useCallback((clau) => {
    setTriats((previs) => {
      const nous = new Set(previs);
      if (nous.has(clau)) nous.delete(clau);
      else nous.add(clau);
      return nous;
    });
  }, []);

  const surtDeSeleccio = () => {
    setModeSeleccio(false);
    setTriats(new Set());
  };

  const enviaAlBloc = async () => {
    if (creantNota) return;
    const tria = messages.filter((m, i) => triats.has(clauDe(m, i)));
    if (tria.length === 0) return;
    setCreantNota(true);
    try {
      await onEnviaAlBloc(tria);
      surtDeSeleccio();
    } catch {
      // El pare ja avisa.
    } finally {
      setCreantNota(false);
    }
  };

  /* Files de la llista (conversa.js): separadors de dia, el de no llegits i
     les bombolles amb la marca de primera del grup. */
  const filesDelFil = useMemo(() => construeixFiles(messages, { noLlegits }), [messages, noLlegits]);
  /* Gauntlet 261029 (cicle 1) · Amb la cortesia, les respostes locals de la
     IAIA hi entren darrere de la seua pregunta (intercalaRespostesLocals). */
  const files = useMemo(
    () => (cortesiaIAIA ? intercalaRespostesLocals(filesDelFil, respostesLocals) : filesDelFil),
    [filesDelFil, cortesiaIAIA, respostesLocals]
  );

  /* Els missatges per id, per a trobar el que cita cada resposta. */
  const perId = useMemo(() => {
    const mapa = new Map();
    for (const m of messages) if (m?.id != null) mapa.set(String(m.id), m);
    return mapa;
  }, [messages]);

  /* Gauntlet 261022_0225 (crítica Claude, F4) · Bombolla és memo i la llista
     es memoritza: una tecla al compositor ja no torna a fer cap bombolla, i un
     missatge nou només pinta el seu (també amb la llista que deriva
     XatContext: estabilitza, REV-ESTRES-2). Per a tindre props estables, les accions
     de moderació de cada missatge són sempre les mateixes funcions (es
     resolen en el clic, amb la moderació i el fil del darrer render), i la
     tria de cada bombolla només canvia quan canvia la seua casella. */
  const araRef = useRef({ moderacio, fil });
  useLayoutEffect(() => { araRef.current = { moderacio, fil }; });
  const [accionsPerMissatge] = useState(() => new WeakMap());
  const accionsDe = useCallback((msg) => {
    let accions = accionsPerMissatge.get(msg);
    if (!accions) {
      const objectiuAra = () => {
        const { moderacio: mod, fil: filAra } = araRef.current;
        return mod && !msg.bloquejat ? mod.objectiuDeMissatge?.(msg, filAra) ?? null : null;
      };
      accions = {
        denuncia: (obridor) => {
          const objectiu = objectiuAra();
          if (objectiu) araRef.current.moderacio.demanaDenuncia(objectiu, obridor);
        },
        bloqueja: (obridor) => {
          const objectiu = objectiuAra();
          if (objectiu) araRef.current.moderacio.demanaBloqueig(objectiu, obridor);
        }
      };
      accionsPerMissatge.set(msg, accions);
    }
    return accions;
  }, [accionsPerMissatge]);
  const [triesPerClau] = useState(() => new Map());
  const seleccioDe = useCallback((clau, triat) => {
    const previa = triesPerClau.get(clau);
    if (previa?.triat === triat) return previa;
    const tria = { actiu: true, triat, onAlterna: () => alterna(clau) };
    triesPerClau.set(clau, tria);
    return tria;
  }, [triesPerClau, alterna]);

  const bombolles = useMemo(() => files.map((fila) => {
    if (fila.tipus === 'dia') return <SeparadorDia key={fila.clau} iso={fila.iso} locale={locale} t={t} />;
    if (fila.tipus === 'no-llegits') return <SeparadorNoLlegits key={fila.clau} quants={fila.quants} t={t} />;
    /* IDEA-56 (Bloc F.2) · Una resposta local de la IAIA, amb el seu avís
       (la classe de la cortesia): només la veu qui ha preguntat. Sense seq
       (cap data-vist), sense «Respon» ni denúncia. Gauntlet 261029 (cicle
       1) · Darrere de la seua pregunta (intercalaRespostesLocals). */
    if (fila.tipus === 'iaia-local') {
      return (
        <Fragment key={fila.clau}>
          <Bombolla missatge={fila.msg} locale={locale} t={t} onCopia={onCopia} />
          <li className="sdp-xat-conversa-buida">
            <small>{t('section.xat.iaia.local.avis', 'Resposta local de la IAIA: només la veus tu i no s’ha guardat al xat compartit.')}</small>
          </li>
        </Fragment>
      );
    }
    const msg = fila.msg;
    /* Fase D (261020, tasca 2) · Què es pot denunciar o bloquejar d'esta bombolla. */
    const objectiu = moderacio && !msg.bloquejat ? moderacio.objectiuDeMissatge?.(msg, fil) ?? null : null;
    const accions = objectiu ? accionsDe(msg) : null;
    return (
      <Bombolla
        key={fila.clau}
        missatge={msg}
        configAdjunts={configAdjunts}
        usuariAdjunts={usuariAdjunts}
        onDenuncia={objectiu ? accions.denuncia : null}
        onBloqueja={objectiu?.bloquejable && moderacio.potBloquejar ? accions.bloqueja : null}
        nomAutor={objectiu?.autor?.nom ?? ''}
        esGrup={esGrup}
        primerDelGrup={fila.primerDelGrup}
        citat={msg.respostaA != null ? perId.get(String(msg.respostaA)) ?? null : null}
        onVesACita={vesAlMissatge}
        onRespon={potRespondre ? respon : null}
        ressaltat={ressalt != null && msg.id != null && ressalt.id === String(msg.id)}
        locale={locale}
        t={t}
        seleccio={modeSeleccio ? seleccioDe(fila.clau, triats.has(fila.clau)) : null}
        onReintenta={onReintenta}
        onDescarta={onDescarta}
        onCopia={onCopia}
        actorLlista={actorLlista}
        onMutaLlista={onMutaLlista}
      />
    );
  }), [
    files, moderacio, fil, accionsDe, configAdjunts, usuariAdjunts, esGrup, perId, vesAlMissatge, potRespondre, respon,
    ressalt, locale, t, modeSeleccio, seleccioDe, triats, onReintenta, onDescarta, onCopia, actorLlista, onMutaLlista
  ]);

  /* Fase D (261020, tasca 2) · L'altra part d'un directe 1:1 amb una persona
     (ni grups, ni la IAIA, ni canals d'entitat, ni fils de pàgina). */
  const contrapart = moderacio?.objectiuDeContrapart?.(fil) ?? null;
  const contrapartBloquejada = Boolean(contrapart) && moderacio.esPersonaBloquejada?.(contrapart.id) === true;
  const accionsDeLaContrapart = contrapart ? {
    onDenunciaPersona: (obridor) => moderacio.demanaDenuncia(contrapart, obridor),
    onBloqueja: moderacio.potBloquejar && !contrapartBloquejada ? (obridor) => moderacio.demanaBloqueig(contrapart, obridor) : null,
    onDesbloqueja: contrapartBloquejada
      ? () => moderacio.desbloqueja?.({ tipus: contrapart.tipus, id: contrapart.id, nom: contrapart.autor?.nom })?.catch?.(() => {})
      : null,
    nomContrapart: contrapart.autor?.nom || ''
  } : null;

  return (
    <div className="sdp-xat-conversa" ref={arrelRef}>
      <CapcaleraConversa
        fil={fil}
        onTorna={onBack}
        onTornaAOrigen={onTornaAOrigen}
        onSeleccionar={() => setModeSeleccio(true)}
        seleccio={modeSeleccio ? { quants: triats.size, onEixir: surtDeSeleccio } : null}
        t={t}
        {...accionsDeLaContrapart}
      />

      {/* La llista no és una regió en viu: s'hi inserixen la càrrega d'obrir,
          els lots d'antics i els menús de les bombolles (#11). tabIndex -1:
          «Baixa al final» hi deixa el focus sense entrar a l'ordre de
          tabulació (#6, #9). Tocar-la interromp el salt suau (#5). */}
      <ol
        className="sdp-xat-missatges"
        ref={llistaRef}
        tabIndex={-1}
        onScroll={enScroll}
        onWheel={interrompBaixada}
        onTouchStart={interrompBaixada}
        onPointerDown={interrompBaixada}
        onKeyDown={interrompBaixada}
        aria-label={t('section.xat.missatges', 'Missatges')}
        aria-busy={llistaOcupada || undefined}
      >
        {hiHaMes ? (
          <li className="sdp-xat-carrega">
            <button type="button" className="sdp-xat-carrega__boto" onClick={onCarregaMes} disabled={carregantMes} aria-busy={carregantMes || undefined}>
              {carregantMes
                ? t('section.xat.carregantAntics', 'Carregant missatges anteriors…')
                : t('section.xat.carregaMes', "Carrega'n més")}
            </button>
          </li>
        ) : null}
        <li className="sdp-xat-sentinella" ref={sentinellaRef} aria-hidden="true" />
        {/* Gauntlet 261025_0545 (IA-07 i MISSED de verify-iaia-xat) · La
            benvinguda automàtica diu que és IA, com tota bombolla de la IA
            (Bombolla, «· IA»), i va dalt de tot, abans dels missatges: al
            final, al grup públic de /iaia semblava la resposta de la IAIA al
            que algú acabava d'escriure. En un fil buit es veu igual que abans. */}
        {cortesiaIAIA ? (
          <li className="sdp-xat-conversa-buida">
            <strong>{`${NOM_IAIA} · ${t('section.xat.ia.etiqueta', 'IA')}`}</strong>
            <p>{t('section.xat.iaia.salutacio', BENVINGUDA_IAIA)}</p>
            <small>{t('section.xat.iaia.cortesia', 'Benvinguda automàtica. Es mostra només ací; no és una resposta guardada al xat compartit.')}</small>
          </li>
        ) : null}
        {/* Gauntlet 261025_0545 (XC-14 / XU-07) · Mentre el fil no s'ha llegit
            mai, no es diu que és buit: «Carregant la conversa…». */}
        {textCarregant ? (
          <li className="sdp-xat-conversa-buida">
            <span role="status">{t('section.xat.carregantConversa', 'Carregant la conversa…')}</span>
          </li>
        ) : carregantFil ? null : messages.length === 0 && !cortesiaIAIA ? (
          <li className="sdp-xat-conversa-buida">{t('section.xat.conversaBuida', 'Cap missatge encara. Inicia la conversa!')}</li>
        ) : null}
        {/* Les bombolles i, amb la cortesia, les respostes locals de la IAIA
            darrere de la seua pregunta (Gauntlet 261029, cicle 1). */}
        {bombolles}
      </ol>

      {/* Només els nous d'altres que entren pel final (#11). */}
      <AnunciDeNous ref={anunciRef} t={t} />

      {/* Gauntlet 261025_0545 (XC-14) · L'avís del fil que no s'ha pogut
          llegir (o marcar): una línia damunt del compositor, amb la peça de
          l'avís públic i el botó de la bombolla en error. No tapa ni la
          llista ni el camp. El context en dona el text cru de l'error («Load
          failed»): ací es diu, traduït, què li passa a la conversa. */}
      {/* Gauntlet 261025_0545 (D5) · El text segons el que ha fallat: una
          marca de lectura que no s'ha pogut desar no és una conversa que no
          s'ha pogut llegir. Mentre una lectura vola, el botó continua al seu
          lloc i amb el focus (aria-disabled i no disabled), diu
          «Actualitzant…» i no torna a demanar. */}
      {avisFil ? (
        <div className="sdp-xat-avis-public">
          <AlertTriangle size={16} aria-hidden="true" focusable="false" />
          <span role="status">
            {tipusAvisFil === 'marca'
              ? t('section.xat.conversa.avisMarca', "No s'ha pogut marcar la conversa com a llegida.")
              : t('section.xat.conversa.avisFil', "No s'ha pogut actualitzar la conversa.")}
          </span>
          {typeof onReintentaFil === 'function' ? (
            <button
              type="button"
              className="sdp-xat-bombolla__accio"
              onClick={llegintFil ? undefined : onReintentaFil}
              aria-busy={llegintFil ? true : undefined}
              aria-disabled={llegintFil ? true : undefined}
            >
              {llegintFil
                ? t('section.xat.conversa.actualitzant', 'Actualitzant…')
                : t('section.xat.missatge.reintenta', 'Torna-ho a provar')}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Ordre del Mestre (261026_2126; P1-37) · L'àncora de «Baixa al final»
          va damunt de «Pregunta a la IAIA»: el botó flota sobre els missatges,
          com a tota conversa, i no tapa la punta dreta de la píndola. */}
      {aBaix ? null : <BotoBaixar nous={nousAvall} onBaixa={baixaAlFinal} t={t} />}

      {consultaIAIA && !modeSeleccio ? <ConsultaIAIA t={t} /> : null}

      {/* Pla 261028_1526 (P1-66) · Una sola barra: ControlsAdjunt guarda
          l'estat dels adjunts i munta el Compositor (render-prop), sempre el
          mateix element. Sense adjunts (convidats, llavor, IAIA, només
          lectura, bloquejats, fora de la conversa: actiu fals) el Compositor
          ix com sempre; si `actiu` canvia, el camp no es torna a muntar. */}
      {modeSeleccio ? (
        <div className="sdp-xat-compositor sdp-xat-compositor--seleccio">
          <button
            type="button"
            className="sdp-xat-accio-bloc"
            onClick={enviaAlBloc}
            disabled={triats.size === 0 || creantNota}
            aria-busy={creantNota || undefined}
          >
            <FileText size={20} aria-hidden="true" focusable="false" />
            <span>{creantNota ? t('section.xat.seleccio.creant', 'Creant la nota…') : t('section.xat.seleccio.enviaBloc', 'Enviar al Bloc de Notes')}</span>
          </button>
        </div>
      ) : (
        <ControlsAdjunt
          actiu={potRespondre && !contrapartBloquejada && fil.participant !== false && Boolean(onSendMedia)}
          fil={fil} externalConfig={configAdjunts} usuariId={usuariAdjunts} t={t} locale={locale}
          onTextOrfe={(orfe) => canviaText(text.trim() ? `${text}\n\n${orfe}` : orfe)}
          onEnvia={async (conversa, adjunt, opcions) => {
            const resultat = await onSendMedia(conversa, { ...adjunt, respostaA: resposta?.id || null }, opcions);
            if (resultat?.length) cancelaResposta();
            return resultat;
          }}
        >
          {(adjunts) => (
            <Compositor
              valor={text}
              onCanvia={canviaText}
              onEnvia={envia}
              t={t}
              fil={fil}
              entitatActiva={entitatActiva}
              campRef={campRef}
              onEscapa={resposta ? cancelaResposta : null}
              barra={resposta ? <BarraResposta missatge={resposta} onCancela={cancelaResposta} t={t} /> : null}
              adjunts={adjunts}
            />
          )}
        </ControlsAdjunt>
      )}
      {peu}
    </div>
  );
}
