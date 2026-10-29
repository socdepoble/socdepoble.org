/**
 * VisorImatges.jsx — el visor de fotos a pantalla completa, a l'estil de
 * Google Fotos.
 *
 * Onada 0.3 (Gauntlet 261016, M04-M06; pla 261016_1530: «En fer clic sobre
 * qualsevol imatge de la galeria a /multimedia, prohibit saltar a cap pàgina
 * externa ni a rutes estranyes. S'obri un visor modal / Lightbox natiu a
 * pantalla completa sobre fons fosc: navegació entre imatges (anterior /
 * següent), zoom fluid i panell lateral desplegable de metadades») · Un
 * Dialeg de Pedra Seca de mida 'completa' i sense marc (el de PantallaCompleta):
 * a la SPA, showModal() el porta a la capa superior i deixa inert el fons; dins
 * d'un <soc-de-poble>, la capa local ocupa la caixa de .sdp-root. Estils a
 * src/css/components.css (§ VISOR D'IMATGES).
 *
 * COM ÉS. Dalt, una franja amb «Tancar» (a l'esquerra, com a Google Fotos), el
 * comptador «3 / 20» i, a la dreta, Reduir, Ampliar i Informació. Al mig, la
 * foto sencera sobre el fons fosc del crom (--sdp-crom-fons, el mateix en clar
 * i en fosc) i, als costats, «Imatge anterior» i «Imatge següent», que donen
 * la volta com el CarruselImatges. A la dreta (en mòbil, a baix), el panell
 * plegable amb les dades de la foto.
 * T4 (pla 261024_1315, P1-06; auditoria Gemini 261024, G-01) · «Tancar» és la
 * ✕ (la X de lucide, la mateixa del Dialeg), no la fletxa d'arrere: l'ordre
 * del Mestre del 261024 la demana inequívoca. El nom i la drecera, els de
 * sempre.
 *
 * ZOOM. Fluid, d'1× a 4×, amb transform: scale() i translate() sobre la imatge
 * (tres propietats CSS, --sdp-visor-escala, --sdp-visor-x i --sdp-visor-y,
 * escrites des d'una ref amb usePropietatsCss: cap atribut style). La roda
 * (un listener propi, no passiu, que es lleva en tancar), el doble clic (1× ↔
 * 2×, a la foto i al fons fosc: vegeu TANCAR AMB UN CLIC AL FONS), els botons
 * ± (×1,5), el pessic amb dos dits i les tecles + − i 0. Amb
 * la foto ampliada, arrossegar-la la mou, dins dels seus límits; sense
 * ampliar, lliscar el dit a un costat passa de foto. Canviar de foto torna a 1×.
 * Gauntlet 261017 · La roda amplia en proporció al gir: un pas de ratolí (100
 * px, o 3 línies a Firefox) és ×1,2, com abans; el trackpad, que envia girs
 * menuts i seguits, ja no salta a 4× d'una revolada.
 *
 * CONTRACTE
 *   obert (controlat) · onTanca(motiu: 'esc'|'boto'|'vel', info?) · imatges
 *   [{ src, alt, titol }] (els src ja resolts: la peça no sap res
 *   d'amfitrions) · index (la foto oberta) · onCanvi(nouIndex) · titol (el nom
 *   accessible del diàleg; per defecte «Visor d'imatges») · metadades
 *   [{ clau, etiqueta, valor }] de la foto oberta (valor, text o node: qui la
 *   munta hi posa els enllaços) · infoInicial (false: el panell comença
 *   plegat) · etiquetes { tanca, anterior, seguent, ampliar, reduir, info,
 *   posicio ('Imatge {n} de {total}'), error, senseImatge, fixar, desfixar },
 *   ja traduïdes (fixar i desfixar, si no arriben, pel traductor de l'app) ·
 *   onCarrega(index, { amplada, alcada } | null) (Gauntlet 261017, C05 de
 *   Codex: la resolució del panell) · les mides reals de la foto pintada
 *   (naturalWidth i naturalHeight) quan carrega, o null si no carrega o el
 *   fitxer no en té (un SVG sense mida); la peça no les pinta, les passa.
 *   Revisió del Gauntlet 261017 (M4) · El null torna cada vegada que es
 *   pinta l'avís d'una foto que no ha carregat, també en tornar-hi ·
 *   className.
 *   Tancat, no pinta cap imatge: el <dialog> és buit i no es demana res.
 *   L'estat de l'URL (?foto=) és de qui el munta.
 *
 * TANCAR AMB UN CLIC AL FONS. T4 (pla 261024_1315; Gemini G-01) · Un clic net
 * al fons fosc buit de l'escenari (no a la foto ni a cap control, sense
 * arrossegar ni pessigar i amb la foto a 1×) tanca amb el motiu 'vel'. Es
 * decidix pel pointerdown, no pel destí del clic: amb la captura del punter,
 * el clic que comença a la foto arriba a l'escenari. Correccions del 261024
 * (R4-02) · El tancament s'ajorna la finestra d'un doble clic
 * (FINESTRA_DEL_DOBLE_CLIC, 300 ms): el primer clic d'un doble clic al fons ja
 * no tanca, i el doble clic hi amplia, com a la foto. Qualsevol gest nou dins
 * del visor abans que passe (un punter que baixa, el segon del doble clic
 * inclòs, la roda, una tecla, el dblclick) l'anul·la; un altre tancament
 * ('esc', 'boto') o tancar-lo des del pare, també: el pare no rep mai dos
 * avisos (a /multimedia, cada avís és un navigate(-1)). El segon clic d'un
 * doble clic (detail 2) tampoc no compta. Ampliada, el fons arrossega la
 * foto, com abans. Sense closedby: el
 * Dialeg no el passa, i a pantalla completa no queda cap vora fora de la
 * caixa on clicar.
 *
 * ACCESSIBILITAT. El diàleg porta el nom; el focus comença a «Tancar» i, en
 * tancar, torna a la foto que l'havia obert (Dialeg). Escape tanca. Les
 * fletxes passen de foto des de qualsevol control del visor, també després
 * de clicar o arrossegar la foto: el marc rep el focus del clic (tabIndex -1,
 * fora de l'ordre de Tab), on abans queia al <body> i el teclat callava
 * (Gauntlet 261017). «i» plega i
 * desplega el panell, que és un <aside> amb nom i aria-controls/aria-expanded
 * al seu botó. El comptador és una regió viva educada («Imatge 3 de 20»).
 * Tots els botons, de --sdp-touch; «Tancar», de --sdp-alt-accio.
 *
 * MODE FIXAT (P1-43; pla 261029_0216; Llibre Mestre, fita 7). Dalt del panell,
 * «Fixar la informació» (📌, aria-pressed): fixat, el panell es queda obert
 * mentre es passa de foto (botons, fletxes, lliscament) i pinta les dades de
 * cada imatge, que arriben per `metadades`; «Informació» i la tecla «i» el
 * pleguen i el desfixen d'un colp (un botó que no fera res visible seria un
 * botó trencat). L'estat viu al contingut del visor, com el del panell: dura
 * el que dura el visor obert i no es desa enlloc. Sense fixar, res no canvia.
 * En mòbil, fixat, el full de baix s'acurta i «anterior» i «següent» pugen
 * damunt d'ell (components.css). «Tancar» és l'aspa gran, de --sdp-alt-accio;
 * en tancar, el focus torna a qui l'havia obert (Dialeg), com sempre. Les dues
 * etiquetes noves es traduïxen ací quan hi ha traductor (useTraductorOpcional,
 * com Moderacio.jsx) o arriben per `etiquetes`.
 *
 * Dins de PedraSeca/, esta peça importa per camí directe (mai per index.js):
 * la porta de dependències circulars de Pedra Seca ho exigix.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Info, Pin, PinOff, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Boto } from '../atoms/Boto.jsx';
import { Dialeg } from './Dialeg.jsx';
import { usePropietatsCss } from '../../../hooks/usePropietatsCss.js';
import { tradueix, useTraductorOpcional } from '../hooks/useTraductorOpcional.js';

/* P1-43 · Les dues etiquetes del mode fixat, en parells [clau i18n, reserva]:
   es traduïxen al visor quan hi ha traductor, perquè qui el munta no haja de
   passar-les. Les de sempre continuen arribant per `etiquetes`, exactes. */
const PARELLS_FIXAR = Object.freeze({
  fixar: Object.freeze(['section.multimedia.visor.fixar', 'Fixar la informació']),
  desfixar: Object.freeze(['section.multimedia.visor.desfixar', 'Deixar de fixar'])
});

const ETIQUETES = Object.freeze({
  titol: 'Visor d’imatges',
  tanca: 'Tancar el visor',
  anterior: 'Imatge anterior',
  seguent: 'Imatge següent',
  ampliar: 'Ampliar',
  reduir: 'Reduir',
  info: 'Informació de la imatge',
  posicio: 'Imatge {n} de {total}',
  error: 'No s’ha pogut carregar la imatge.',
  senseImatge: 'Esta entrada no porta cap imatge.',
  fixar: PARELLS_FIXAR.fixar[1],
  desfixar: PARELLS_FIXAR.desfixar[1]
});

/* Sense export: la porta del catàleg (tractor-cataleg.mjs) registra tot export
   que comença en majúscula. */
const ESCALA_MINIMA = 1;
const ESCALA_MAXIMA = 4;
const PAS_BOTO = 1.5;
const PAS_RODA = 1.2;
/* El gir de la roda que val un PAS_RODA sencer, i els píxels d'una línia i
   d'una pàgina (deltaMode 1 i 2: Firefox amb ratolí en dona línies). */
const GIR_PER_PAS = 100;
const PIXELS_PER_LINIA = 40;
const PIXELS_PER_PAGINA = 800;
/* Quant ha de córrer el dit (en píxels de pantalla) perquè un lliscament passe de foto. */
const LLINDAR_LLISCAMENT = 48;
/* T4 (pla 261024_1315) · El que pot córrer el punter perquè un toc al fons
   encara siga un clic net, i no un arrossegament, que tanque el visor. */
const MARGE_DEL_TOC = 10;
/* Correccions del 261024 (R4-02) · Quant s'espera el tancament del fons: la
   finestra en què un segon clic encara fa un doble clic. */
const FINESTRA_DEL_DOBLE_CLIC = 300;
/* P1-43 · L'aspa gran de «Tancar»: la X de lucide (la del Dialeg) a esta mida,
   dins del botó de --sdp-alt-accio (components.css, .sdp-visor__boto--gran). */
const MIDA_ASPA = 28;

const textDe = (valor, reserva) => (typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : reserva);
const posicioDe = (plantilla, n, total) => plantilla.replace('{n}', () => String(n)).replace('{total}', () => String(total));

/** L'escala dins dels límits del visor (1× a 4×). */
export function limitaEscala(escala) {
  return Math.min(ESCALA_MAXIMA, Math.max(ESCALA_MINIMA, Number.isFinite(escala) ? escala : ESCALA_MINIMA));
}

const vistaInicial = (clau) => ({ clau, escala: ESCALA_MINIMA, x: 0, y: 0 });
/* El Boto passa aria-hidden i focusable; la mida la fixa el visor. */
const AspaGran = (props) => <X {...props} size={MIDA_ASPA} />;
const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* El factor d'un gir de roda: PAS_RODA elevat al gir en píxels partit per
   GIR_PER_PAS, amb un pas sencer de sostre per esdeveniment. */
function factorDeRoda(event) {
  const unitat = event.deltaMode === 1 ? PIXELS_PER_LINIA : event.deltaMode === 2 ? PIXELS_PER_PAGINA : 1;
  return PAS_RODA ** Math.max(-1, Math.min(1, (-event.deltaY * unitat) / GIR_PER_PAS));
}

/* Les mides reals de la foto pintada, o null si el fitxer no en té. */
const midesDe = (img) => (img?.naturalWidth > 0 && img?.naturalHeight > 0 ? { amplada: img.naturalWidth, alcada: img.naturalHeight } : null);

/* El desplaçament dins dels límits: la foto ampliada es mou fins que la seua
   vora arriba a la de l'escenari, mai més enllà, i en l'eix on, ampliada,
   encara no l'ompli, es queda centrada. Es mesura la foto pintada sense
   transformar (offsetWidth i offsetHeight: max-inline-size i max-block-size
   la cenyixen a la imatge), no l'escenari: amb una foto vertical o menuda, el
   límit de l'escenari la deixava traure sencera del visor (revisió
   adversarial del 261016). Sense foto (l'avís d'error), cap desplaçament. */
function dinsDelsLimits(proposta, escenari, imatge) {
  const marge = (foto, caixa) => Math.max(0, (proposta.escala * (foto || 0) - (caixa || 0)) / 2);
  const mx = escenari && imatge ? marge(imatge.offsetWidth, escenari.clientWidth) : 0;
  const my = escenari && imatge ? marge(imatge.offsetHeight, escenari.clientHeight) : 0;
  return { ...proposta, x: Math.min(mx, Math.max(-mx, proposta.x)), y: Math.min(my, Math.max(-my, proposta.y)) };
}

export function VisorImatges({
  obert, onTanca, imatges, index = 0, onCanvi, titol, etiquetes, metadades, infoInicial = false, onCarrega, className
}) {
  const llista = Array.isArray(imatges) ? imatges.filter(Boolean) : [];
  const total = llista.length;
  const visible = Boolean(obert) && total > 0;
  const actual = total ? Math.min(Math.max(0, Number.isInteger(index) ? index : 0), total - 1) : 0;
  /* P1-43 · Fixar i desfixar passen pel traductor de l'app si n'hi ha; la
     resta, les reserves de sempre. `etiquetes` mana sobre totes. */
  const traductor = useTraductorOpcional();
  const text = Object.fromEntries(Object.entries(ETIQUETES).map(([clau, reserva]) => [clau,
    textDe(etiquetes?.[clau], Object.hasOwn(PARELLS_FIXAR, clau) ? tradueix(traductor, PARELLS_FIXAR[clau]) : reserva)]));
  const nom = textDe(titol, text.titol);
  const marc = useRef(null);
  /* El focus comença a «Tancar» quan el <dialog> ja és obert, a la SPA i
     encastat: no depén de com cada navegador tria el primer focus de
     showModal(). */
  const alObrir = () => marc.current?.querySelector('[data-sdp-focus-inicial]')?.focus();
  /* Correccions del 261024 (R4-02) · El tancament del fons, ajornat (vegeu la
     capçalera). Tot avís al pare passa per `tanca`, que anul·la el pendent. */
  const tancaRef = useRef(onTanca);
  tancaRef.current = onTanca;
  const velPendent = useRef(null);
  const anulaElVel = useCallback(() => {
    clearTimeout(velPendent.current);
    velPendent.current = null;
  }, []);
  const tanca = useCallback((...motiu) => {
    anulaElVel();
    tancaRef.current?.(...motiu);
  }, [anulaElVel]);
  const ajornaElVel = useCallback(() => {
    anulaElVel();
    velPendent.current = setTimeout(() => {
      velPendent.current = null;
      tancaRef.current?.('vel');
    }, FINESTRA_DEL_DOBLE_CLIC);
  }, [anulaElVel]);
  /* Tancat pel pare (obert=false) o desmuntat: cap 'vel' pendent. */
  useEffect(() => anulaElVel, [visible, anulaElVel]);
  return (
    <Dialeg obert={visible} onTanca={tanca} titol={nom} variant="sense-marc" mida="completa" tancaEnVel={false}
      className={['sdp-visor', className].filter(Boolean).join(' ')} onObert={alObrir}>
      {visible ? (
        <ContingutVisor marcRef={marc} llista={llista} actual={actual} onCanvi={onCanvi} onTanca={tanca} text={text}
          metadades={metadades} infoInicial={infoInicial} onCarrega={onCarrega} ajornaElVel={ajornaElVel}
          anulaElVel={anulaElVel} />
      ) : null}
    </Dialeg>
  );
}

function ContingutVisor({ marcRef, llista, actual, onCanvi, onTanca, text, metadades, infoInicial, onCarrega, ajornaElVel, anulaElVel }) {
  const idPanell = useId();
  const total = llista.length;
  const imatge = llista[actual];
  const clau = `${actual}|${imatge.src || ''}`;
  const [info, setInfo] = useState(Boolean(infoInicial));
  /* P1-43 · El mode fixat viu ací, com `info`: dura el que dura el visor obert.
     Fixat, el panell és obert (la guarda explícita: fixat ⇒ obert). */
  const [fixat, setFixat] = useState(false);
  const panellObert = info || fixat;
  const [vista, setVista] = useState(() => vistaInicial(clau));
  const [errada, setErrada] = useState(null);
  const [arrossegant, setArrossegant] = useState(false);
  const escenariRef = useRef(null);
  const imatgeRef = useRef(null);
  const punters = useRef(new Map());
  const gest = useRef(null);
  /* T4 (pla 261024_1315) · El toc al fons buit: { id, x, y, net }. */
  const toc = useRef(null);
  const clauRef = useRef(clau);
  clauRef.current = clau;
  const carregaRef = useRef(onCarrega);
  carregaRef.current = onCarrega;

  /* Revisió del Gauntlet 261017 (M4) · Una foto que no ha carregat es queda
     amb l'avís, sense <img>: en tornar-hi no arriba cap load ni cap error
     nou. El null de l'onCarrega es diu cada vegada que es pinta l'avís d'una
     foto amb src (no només en l'error): qui munta el visor no es queda en
     «Llegint…» al costat de l'avís. */
  const ambAvis = Boolean(imatge.src) && errada === clau;
  useEffect(() => {
    if (ambAvis) carregaRef.current?.(actual, null);
  }, [ambAvis, clau, actual]);

  const v = vista.clau === clau ? vista : vistaInicial(clau);
  const ampliada = v.escala > ESCALA_MINIMA;

  /* Les tres propietats només s'escriuen amb la foto ampliada o moguda: sense
     zoom, el node no porta cap estil. */
  usePropietatsCss(imatgeRef, ampliada ? { '--sdp-visor-escala': v.escala, '--sdp-visor-x': `${v.x}px`, '--sdp-visor-y': `${v.y}px` } : {});

  /* El desplaçament no deixa la foto fora del visor (dinsDelsLimits). */
  const limita = (proposta) => dinsDelsLimits(proposta, escenariRef.current, imatgeRef.current);

  const fixaEscala = (calcula) => setVista((previa) => {
    const base = previa.clau === clauRef.current ? previa : vistaInicial(clauRef.current);
    const escala = limitaEscala(calcula(base.escala));
    if (escala <= ESCALA_MINIMA) return vistaInicial(clauRef.current);
    return limita({ ...base, escala });
  });

  const vesA = (desti) => {
    if (total < 2) return;
    onCanvi?.(((desti % total) + total) % total);
  };

  /* P1-43 · «Informació» i la tecla «i»: fixat, pleguen el panell i el
     desfixen d'un colp; sense fixar, commuten com sempre. */
  const commutaInfo = () => {
    /* Revisió final (261029) · Si el focus és dins del panell (el botó de fixar
       sempre hi és), amagar l'<aside> l'enviaria al <body> i les tecles del
       visor deixarien d'arribar: torna al marc (tabIndex -1) abans d'amagar. */
    const arrel = marcRef.current?.getRootNode?.() ?? document;
    if (arrel.activeElement && marcRef.current?.querySelector('.sdp-visor__panell')?.contains(arrel.activeElement)) marcRef.current.focus();
    if (fixat) {
      setFixat(false);
      setInfo(false);
      return;
    }
    setInfo((obert) => !obert);
  };

  /* La roda amplia i redueix la foto. React registra `wheel` com a passiu i
     no deixa prevenir el desplaçament de la pàgina de l'amfitrió: el listener
     és propi, no passiu, i es lleva en tancar el visor. Com els botons, les
     tecles i el pessic, torna a passar pels límits: reduir amb la roda una
     foto arrossegada a la vora no la deixa fora de l'escenari. */
  useEffect(() => {
    const node = escenariRef.current;
    if (!node) return undefined;
    const enRoda = (event) => {
      if (!event.deltaY) return;
      event.preventDefault();
      anulaElVel();
      const factor = factorDeRoda(event);
      setVista((previa) => {
        const base = previa.clau === clauRef.current ? previa : vistaInicial(clauRef.current);
        const escala = limitaEscala(base.escala * factor);
        return escala <= ESCALA_MINIMA ? vistaInicial(clauRef.current) : dinsDelsLimits({ ...base, escala }, node, imatgeRef.current);
      });
    };
    node.addEventListener('wheel', enRoda, { passive: false });
    return () => node.removeEventListener('wheel', enRoda);
  }, [anulaElVel]);

  const enPremer = (event) => {
    /* T4 (pla 261024_1315) · Qualsevol punter nou anul·la el toc d'abans. */
    toc.current = null;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target?.closest?.('button')) return;
    punters.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (punters.current.size >= 2) {
      const [a, b] = [...punters.current.values()];
      gest.current = { tipus: 'pessic', distancia: distancia(a, b) || 1, escala: v.escala };
      setArrossegant(false);
      return;
    }
    gest.current = { tipus: ampliada ? 'arrossega' : 'llisca', x0: event.clientX, y0: event.clientY, dx: v.x, dy: v.y };
    if (ampliada) setArrossegant(true);
    /* El fons buit és l'escenari mateix (els controls no reben el punter:
       components.css); la foto i l'avís, no. */
    else if (event.target === event.currentTarget) toc.current = { id: event.pointerId, x: event.clientX, y: event.clientY, net: false };
  };

  const enMoure = (event) => {
    if (!punters.current.has(event.pointerId)) return;
    punters.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const g = gest.current;
    if (!g) return;
    if (g.tipus === 'pessic' && punters.current.size >= 2) {
      const [a, b] = [...punters.current.values()];
      fixaEscala(() => (g.escala * distancia(a, b)) / g.distancia);
    } else if (g.tipus === 'arrossega') {
      setVista((previa) => (previa.clau === clauRef.current
        ? limita({ ...previa, x: g.dx + event.clientX - g.x0, y: g.dy + event.clientY - g.y0 })
        : previa));
    }
  };

  const enAlcar = (event) => {
    const g = gest.current;
    punters.current.delete(event.pointerId);
    if (g?.tipus === 'llisca' && event.type === 'pointerup') {
      const dx = event.clientX - g.x0;
      const dy = event.clientY - g.y0;
      if (Math.abs(dx) >= LLINDAR_LLISCAMENT && Math.abs(dx) > Math.abs(dy) * 1.5) vesA(actual + (dx < 0 ? 1 : -1));
    }
    /* T4 (pla 261024_1315) · El toc al fons és net si el punter s'alça on
       havia baixat (dins de MARGE_DEL_TOC) i és l'únic. */
    const t = toc.current;
    if (t && t.id === event.pointerId) {
      toc.current = event.type === 'pointerup' && punters.current.size === 0
        && Math.hypot(event.clientX - t.x, event.clientY - t.y) <= MARGE_DEL_TOC ? { ...t, net: true } : null;
    }
    if (punters.current.size === 0 || g?.tipus === 'pessic') gest.current = null;
    if (punters.current.size === 0) setArrossegant(false);
  };

  /* T4 (pla 261024_1315; Gemini G-01) · El clic d'un toc net al fons buit
     tanca ('vel'). Amb la foto ampliada, mai (el fons l'arrossega); el segon
     clic d'un doble clic, tampoc. Correccions del 261024 (R4-02) · Tanca
     passada la finestra del doble clic (ajornaElVel), mai en el primer clic. */
  const enClicAlFons = (event) => {
    const t = toc.current;
    toc.current = null;
    if (!t?.net || ampliada || event.detail > 1) return;
    ajornaElVel();
  };

  /* Les fletxes, + − 0 i «i», des de qualsevol control del visor. Escape és
     del Dialeg. Amb una tecla modificadora no es toca res.
     Correccions del 261024 (R4-02) · Una tecla anul·la el 'vel' pendent. */
  const enTecla = (event) => {
    anulaElVel();
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const accions = {
      ArrowLeft: () => vesA(actual - 1),
      ArrowRight: () => vesA(actual + 1),
      '+': () => fixaEscala((escala) => escala * PAS_BOTO),
      '=': () => fixaEscala((escala) => escala * PAS_BOTO),
      '-': () => fixaEscala((escala) => escala / PAS_BOTO),
      0: () => fixaEscala(() => ESCALA_MINIMA),
      i: commutaInfo,
      I: commutaInfo
    };
    if (!Object.hasOwn(accions, event.key)) return;
    event.preventDefault();
    accions[event.key]();
  };

  /* El doble clic amplia o torna a 1×; sobre «anterior» o «següent», no
     (dos clics ràpids passen dues fotos). Correccions del 261024 (R4-02) ·
     També al fons fosc: el primer clic no ha tancat (el 'vel' s'anul·la). */
  const enDobleClic = (event) => {
    anulaElVel();
    if (event.target?.closest?.('button')) return;
    fixaEscala((escala) => (escala > ESCALA_MINIMA ? ESCALA_MINIMA : 2));
  };

  const posicio = posicioDe(text.posicio, actual + 1, total);
  const files = Array.isArray(metadades) ? metadades.filter((fila) => fila && fila.etiqueta) : [];
  const classesEscenari = ['sdp-visor__escenari', ampliada && 'sdp-visor__escenari--ampliat', arrossegant && 'sdp-visor__escenari--arrossega']
    .filter(Boolean).join(' ');
  /* P1-43 · Fixat, el marc ho diu: en mòbil el full s'acurta i els controls pugen (components.css). */
  const classesMarc = ['sdp-visor__marc', fixat && 'sdp-visor__marc--fixat'].filter(Boolean).join(' ');

  /* tabIndex -1: el clic a la foto deixa el focus al marc (no al <body>) i les
     tecles hi continuen arribant; Tab no s'hi para mai.
     Revisió del Gauntlet 261017 (M1, A11Y-1) · Des del marc, Maj+Tab no ix del
     visor: encastat, la guarda de modalLocal.js el compta com a vora i dona
     la volta a l'últim control; a la SPA, showModal() deixa inert la resta.
     Correccions del 261024 (R4-02) · Un punter que baixa a qualsevol lloc del
     marc (en captura: el segon d'un doble clic, un control, la foto) anul·la
     el 'vel' pendent. */
  return (
    <div ref={marcRef} className={classesMarc} tabIndex={-1} onKeyDown={enTecla} onPointerDownCapture={anulaElVel}>
      <div className="sdp-visor__barra">
        <Boto varietat="secundari" className="sdp-visor__boto sdp-visor__boto--gran" icona={AspaGran} aria-label={text.tanca}
          aria-keyshortcuts="Escape" data-sdp-focus-inicial onClick={() => onTanca?.('boto')} />
        <p className="sdp-visor__comptador" aria-live="polite" aria-atomic="true">
          <span aria-hidden="true">{`${actual + 1} / ${total}`}</span>
          <span className="sdp-nomes-lector">{posicio}</span>
        </p>
        <Boto varietat="secundari" className="sdp-visor__boto" icona={ZoomOut} aria-label={text.reduir}
          aria-keyshortcuts="-" onClick={() => fixaEscala((escala) => escala / PAS_BOTO)} />
        <Boto varietat="secundari" className="sdp-visor__boto" icona={ZoomIn} aria-label={text.ampliar}
          aria-keyshortcuts="+" onClick={() => fixaEscala((escala) => escala * PAS_BOTO)} />
        <Boto varietat="secundari" className="sdp-visor__boto" icona={Info} aria-label={text.info}
          aria-expanded={panellObert} aria-controls={idPanell} aria-keyshortcuts="I" onClick={commutaInfo} />
      </div>
      <div className="sdp-visor__cos">
        <div ref={escenariRef} className={classesEscenari} onPointerDown={enPremer} onPointerMove={enMoure}
          onPointerUp={enAlcar} onPointerCancel={enAlcar} onClick={enClicAlFons} onDoubleClick={enDobleClic}>
          {imatge.src && !ambAvis ? (
            <img ref={imatgeRef} className="sdp-visor__imatge" src={imatge.src} alt={imatge.alt || ''} draggable="false"
              onLoad={(event) => onCarrega?.(actual, midesDe(event.currentTarget))}
              onError={() => setErrada(clau)} />
          ) : (
            <p className="sdp-visor__avis">{imatge.src ? text.error : text.senseImatge}</p>
          )}
          {total > 1 ? (
            <div className="sdp-visor__controls">
              <Boto varietat="secundari" className="sdp-visor__boto" icona={ChevronLeft} aria-label={text.anterior}
                aria-keyshortcuts="ArrowLeft" onClick={() => vesA(actual - 1)} />
              <Boto varietat="secundari" className="sdp-visor__boto" icona={ChevronRight} aria-label={text.seguent}
                aria-keyshortcuts="ArrowRight" onClick={() => vesA(actual + 1)} />
            </div>
          ) : null}
        </div>
        <aside id={idPanell} className="sdp-visor__panell" hidden={!panellObert} aria-label={text.info}>
          {/* P1-43 · Fixar: aria-pressed diu l'estat; el text, l'acció que fa. */}
          <div className="sdp-visor__fixador">
            <Boto varietat="secundari" className="sdp-visor__fixar" icona={fixat ? PinOff : Pin} aria-pressed={fixat}
              onClick={() => setFixat((previ) => !previ)}>
              {fixat ? text.desfixar : text.fixar}
            </Boto>
          </div>
          {imatge.titol || imatge.alt ? <p className="sdp-visor__titol">{imatge.titol || imatge.alt}</p> : null}
          {files.length ? (
            <dl className="sdp-visor__dades">
              {files.map((fila, i) => (
                <div key={fila.clau || i} className="sdp-visor__fila">
                  <dt className="sdp-visor__clau">{fila.etiqueta}</dt>
                  <dd className="sdp-visor__valor">{fila.valor}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
