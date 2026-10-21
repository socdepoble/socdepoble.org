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
import { RESPOSTA_IAIA } from '../../../data/identitatsSeed.js';
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import CapcaleraConversa from './CapcaleraConversa.jsx';
import Bombolla from './Bombolla.jsx';
import SeparadorDia from './SeparadorDia.jsx';
import SeparadorNoLlegits from './SeparadorNoLlegits.jsx';
import BotoBaixar from './BotoBaixar.jsx';
import BarraResposta from './BarraResposta.jsx';
import Compositor, { esNomesLectura } from './Compositor.jsx';
import {
  MAX_PAGINES_NO_LLEGITS, MS_ESPERA_OBERTURA, MS_RESSALT, anunciDeNous, clauDe, classificaCanvi,
  comportamentDesplacament, construeixFiles, estaAlFons, estatObertura, extremsSeq, noLlegitsEnObrir,
  nousAnunciables, scrollPerCentrar, scrollPerDeixarDalt
} from '../conversa.js';
import { desaEsborrany, llegixEsborrany } from '../esborranys.js';

const CAP = [];

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
export default function Conversa({
  initialText = '', clauEsborrany = null, fil, messages, onSendMessage, onBack, onEnviaAlBloc, onCopia,
  hiHaMes, carregantMes, onCarregaMes, esperaAntics = null, onReintenta, onDescarta, onMarcaVist, locale, t,
  entitatActiva = null, moderacio = null, actorLlista = null, onMutaLlista = null, onTornaAOrigen = null, peu = null, cortesiaIAIA = false
}) {
  const [text, setText] = useState(() => initialText || llegixEsborrany(clauEsborrany));
  const [modeSeleccio, setModeSeleccio] = useState(false);
  const [triats, setTriats] = useState(() => new Set());
  const [creantNota, setCreantNota] = useState(false);
  const [resposta, setResposta] = useState(null);
  const [aBaix, setABaix] = useState(true);
  const [nousAvall, setNousAvall] = useState(0);
  const [ressalt, setRessalt] = useState(null);
  /* Els nous d'altres que ha d'anunciar la regió en viu (#11). */
  const [perAnunciar, setPerAnunciar] = useState(CAP);
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

  const llistaRef = useRef(null);
  const sentinellaRef = useRef(null);
  const campRef = useRef(null);
  const aBaixRef = useRef(true);
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
    const baix = estaAlFons(ol);
    if (baixantRef.current && !baix) return;
    baixantRef.current = false;
    aBaixRef.current = baix;
    setABaix(baix);
    if (baix) setNousAvall(0);
  }, []);

  const interrompBaixada = useCallback(() => { baixantRef.current = false; }, []);

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
        if (posicionadaRef.current && anunciables.length) setPerAnunciar(anunciables);
      }
    }
    const claus = messages.map(clauDe);
    geometria.current = { claus, alcada: ol.scrollHeight, ancora: { clau: claus[0], pos: posicioAlContingut(ol, claus[0]) } };
  }, [messages, llesta, actualitzaFons]);

  /* La barra de resposta ocupa lloc davall de la llista: si eres a baix, s'hi
     continua (com a les apps de missatgeria, l'últim missatge no queda tapat). */
  useLayoutEffect(() => {
    const ol = llistaRef.current;
    if (ol && aBaixRef.current) ol.scrollTop = ol.scrollHeight;
  }, [resposta]);

  useEffect(() => {
    setModeSeleccio(false);
    setTriats(new Set());
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
     marca per damunt de no llegits que ningú no ha vist (#1, #4). */
  useEffect(() => {
    const ol = llistaRef.current;
    if (!ol || !llesta || typeof IntersectionObserver === 'undefined') return undefined;
    const nodes = ol.querySelectorAll('[data-vist]');
    if (!nodes.length) return undefined;
    const observador = new IntersectionObserver((entrades) => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      let maxim = null;
      for (const e of entrades) {
        if (!e.isIntersecting) continue;
        const seq = Number(e.target.getAttribute('data-vist'));
        if (Number.isFinite(seq) && (maxim == null || seq > maxim)) maxim = seq;
      }
      if (maxim != null) onMarcaVist(maxim);
    }, { root: ol, threshold: 0.5 });
    nodes.forEach((n) => observador.observe(n));
    return () => observador.disconnect();
  }, [messages, llesta, onMarcaVist]);

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
    const citat = resposta;
    /* Enviar buida l'esborrany només si el camp era l'esborrany de la
       persona: enviar tal qual el text de ?context= no se'l menja (#3). */
    const propi = esborranyPropiRef.current;
    setText('');
    setResposta(null);
    if (propi) desaEsborrany(clauEsborrany, '');
    try {
      if (citat?.id != null) await onSendMessage(fil, value, { respostaA: citat.id });
      else await onSendMessage(fil, value);
    } catch {
      /* Si falla, es conserven el text i la resposta (i l'esborrany). */
      setText(value);
      if (propi) desaEsborrany(clauEsborrany, value);
      if (citat) setResposta(citat);
    }
  }, [text, resposta, fil, onSendMessage, clauEsborrany]);

  /* En triar «Respon» el focus va al camp, com a les apps de missatgeria.
     Directament i no amb un efecte sobre `resposta`: respondre al missatge que ja és la
     resposta no canvia l'estat, i el focus del menú desmuntat cauria a
     <body> (revisió adversarial 260930, #8). */
  const respon = useCallback((missatge) => {
    setResposta(missatge);
    campRef.current?.focus();
  }, []);

  const cancelaResposta = useCallback(() => {
    setResposta(null);
    campRef.current?.focus();
  }, []);

  const baixaAlFinal = () => {
    const ol = llistaRef.current;
    if (!ol) return;
    const comportament = comportamentDesplacament();
    baixantRef.current = comportament === 'smooth';
    desplacaLlista(ol, ol.scrollHeight, comportament);
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

  const alterna = (clau) => {
    setTriats((previs) => {
      const nous = new Set(previs);
      if (nous.has(clau)) nous.delete(clau);
      else nous.add(clau);
      return nous;
    });
  };

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
  const files = useMemo(() => construeixFiles(messages, { noLlegits }), [messages, noLlegits]);

  /* Els missatges per id, per a trobar el que cita cada resposta. */
  const perId = useMemo(() => {
    const mapa = new Map();
    for (const m of messages) if (m?.id != null) mapa.set(String(m.id), m);
    return mapa;
  }, [messages]);

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
    <div className="sdp-xat-conversa">
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
        onScroll={actualitzaFons}
        onWheel={interrompBaixada}
        onTouchStart={interrompBaixada}
        onPointerDown={interrompBaixada}
        onKeyDown={interrompBaixada}
        aria-label={t('section.xat.missatges', 'Missatges')}
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
        {messages.length === 0 && !cortesiaIAIA ? (
          <li className="sdp-xat-conversa-buida">{t('section.xat.conversaBuida', 'Cap missatge encara. Inicia la conversa!')}</li>
        ) : null}
        {files.map((fila) => {
          if (fila.tipus === 'dia') return <SeparadorDia key={fila.clau} iso={fila.iso} locale={locale} t={t} />;
          if (fila.tipus === 'no-llegits') return <SeparadorNoLlegits key={fila.clau} quants={fila.quants} t={t} />;
          const msg = fila.msg;
          /* Fase D (261020, tasca 2) · Què es pot denunciar o bloquejar d'esta bombolla. */
          const objectiu = moderacio && !msg.bloquejat ? moderacio.objectiuDeMissatge?.(msg, fil) ?? null : null;
          return (
            <Bombolla
              key={fila.clau}
              missatge={msg}
              onDenuncia={objectiu ? (obridor) => moderacio.demanaDenuncia(objectiu, obridor) : null}
              onBloqueja={objectiu?.bloquejable && moderacio.potBloquejar ? (obridor) => moderacio.demanaBloqueig(objectiu, obridor) : null}
              nomAutor={objectiu?.autor?.nom ?? ''}
              esGrup={esGrup}
              primerDelGrup={fila.primerDelGrup}
              citat={msg.respostaA != null ? perId.get(String(msg.respostaA)) ?? null : null}
              onVesACita={vesAlMissatge}
              onRespon={potRespondre ? respon : null}
              ressaltat={ressalt != null && msg.id != null && ressalt.id === String(msg.id)}
              locale={locale}
              t={t}
              seleccio={modeSeleccio ? { actiu: true, triat: triats.has(fila.clau), onAlterna: () => alterna(fila.clau) } : null}
              onReintenta={onReintenta}
              onDescarta={onDescarta}
              onCopia={onCopia}
              actorLlista={actorLlista}
              onMutaLlista={onMutaLlista}
            />
          );
        })}
        {cortesiaIAIA ? (
          <li className="sdp-xat-conversa-buida">
            <strong>IAIA MarIA</strong>
            <p>{RESPOSTA_IAIA}</p>
            <small>{t('section.xat.iaia.cortesia', 'Benvinguda automàtica. Es mostra només ací; no és una resposta guardada al xat compartit.')}</small>
          </li>
        ) : null}
      </ol>

      {/* Només els nous d'altres que entren pel final (#11). */}
      <p className="sdp-nomes-lector" role="status">{anunciDeNous(perAnunciar, t)}</p>

      {aBaix ? null : <BotoBaixar nous={nousAvall} onBaixa={baixaAlFinal} t={t} />}

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
        />
      )}
      {peu}
    </div>
  );
}
