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
 * COM ÉS. Dalt, una franja amb «Tancar» (la fletxa d'arrere, a l'esquerra, com
 * a Google Fotos), el comptador «3 / 20» i, a la dreta, Reduir, Ampliar i
 * Informació. Al mig, la foto sencera sobre el fons fosc del crom
 * (--sdp-crom-fons, el mateix en clar i en fosc) i, als costats, «Imatge
 * anterior» i «Imatge següent», que donen la volta com el CarruselImatges. A la
 * dreta (en mòbil, a baix), el panell plegable amb les dades de la foto.
 *
 * ZOOM. Fluid, d'1× a 4×, amb transform: scale() i translate() sobre la imatge
 * (tres propietats CSS, --sdp-visor-escala, --sdp-visor-x i --sdp-visor-y,
 * escrites des d'una ref amb usePropietatsCss: cap atribut style). La roda
 * (un listener propi, no passiu, que es lleva en tancar), el doble clic (1× ↔
 * 2×), els botons ± (×1,5), el pessic amb dos dits i les tecles + − i 0. Amb
 * la foto ampliada, arrossegar-la la mou, dins dels seus límits; sense
 * ampliar, lliscar el dit a un costat passa de foto. Canviar de foto torna a 1×.
 *
 * CONTRACTE
 *   obert (controlat) · onTanca(motiu: 'esc'|'boto', info?) · imatges
 *   [{ src, alt, titol }] (els src ja resolts: la peça no sap res
 *   d'amfitrions) · index (la foto oberta) · onCanvi(nouIndex) · titol (el nom
 *   accessible del diàleg; per defecte «Visor d'imatges») · metadades
 *   [{ clau, etiqueta, valor }] de la foto oberta (valor, text o node: qui la
 *   munta hi posa els enllaços) · infoInicial (false: el panell comença
 *   plegat) · etiquetes { tanca, anterior, seguent, ampliar, reduir, info,
 *   posicio ('Imatge {n} de {total}'), error, senseImatge }, ja traduïdes ·
 *   className.
 *   Tancat, no pinta cap imatge: el <dialog> és buit i no es demana res.
 *   L'estat de l'URL (?foto=) és de qui el munta.
 *
 * ACCESSIBILITAT. El diàleg porta el nom; el focus comença a «Tancar» i, en
 * tancar, torna a la foto que l'havia obert (Dialeg). Escape tanca. Les
 * fletxes passen de foto des de qualsevol control del visor; «i» plega i
 * desplega el panell, que és un <aside> amb nom i aria-controls/aria-expanded
 * al seu botó. El comptador és una regió viva educada («Imatge 3 de 20»).
 * Tots els botons, de --sdp-touch.
 *
 * Dins de PedraSeca/, esta peça importa per camí directe (mai per index.js):
 * la porta de dependències circulars de Pedra Seca ho exigix.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Info, ZoomIn, ZoomOut } from 'lucide-react';
import { Boto } from '../atoms/Boto.jsx';
import { Dialeg } from './Dialeg.jsx';
import { usePropietatsCss } from '../../../hooks/usePropietatsCss.js';

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
  senseImatge: 'Esta entrada no porta cap imatge.'
});

/* Sense export: la porta del catàleg (tractor-cataleg.mjs) registra tot export
   que comença en majúscula. */
const ESCALA_MINIMA = 1;
const ESCALA_MAXIMA = 4;
const PAS_BOTO = 1.5;
const PAS_RODA = 1.2;
/* Quant ha de córrer el dit (en píxels de pantalla) perquè un lliscament passe de foto. */
const LLINDAR_LLISCAMENT = 48;

const textDe = (valor, reserva) => (typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : reserva);
const posicioDe = (plantilla, n, total) => plantilla.replace('{n}', () => String(n)).replace('{total}', () => String(total));

/** L'escala dins dels límits del visor (1× a 4×). */
export function limitaEscala(escala) {
  return Math.min(ESCALA_MAXIMA, Math.max(ESCALA_MINIMA, Number.isFinite(escala) ? escala : ESCALA_MINIMA));
}

const vistaInicial = (clau) => ({ clau, escala: ESCALA_MINIMA, x: 0, y: 0 });
const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

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
  obert, onTanca, imatges, index = 0, onCanvi, titol, etiquetes, metadades, infoInicial = false, className
}) {
  const llista = Array.isArray(imatges) ? imatges.filter(Boolean) : [];
  const total = llista.length;
  const visible = Boolean(obert) && total > 0;
  const actual = total ? Math.min(Math.max(0, Number.isInteger(index) ? index : 0), total - 1) : 0;
  const text = Object.fromEntries(Object.entries(ETIQUETES).map(([clau, reserva]) => [clau, textDe(etiquetes?.[clau], reserva)]));
  const nom = textDe(titol, text.titol);
  const marc = useRef(null);
  /* El focus comença a «Tancar» quan el <dialog> ja és obert, a la SPA i
     encastat: no depén de com cada navegador tria el primer focus de
     showModal(). */
  const alObrir = () => marc.current?.querySelector('[data-sdp-focus-inicial]')?.focus();
  return (
    <Dialeg obert={visible} onTanca={onTanca} titol={nom} variant="sense-marc" mida="completa" tancaEnVel={false}
      className={['sdp-visor', className].filter(Boolean).join(' ')} onObert={alObrir}>
      {visible ? (
        <ContingutVisor marcRef={marc} llista={llista} actual={actual} onCanvi={onCanvi} onTanca={onTanca} text={text}
          metadades={metadades} infoInicial={infoInicial} />
      ) : null}
    </Dialeg>
  );
}

function ContingutVisor({ marcRef, llista, actual, onCanvi, onTanca, text, metadades, infoInicial }) {
  const idPanell = useId();
  const total = llista.length;
  const imatge = llista[actual];
  const clau = `${actual}|${imatge.src || ''}`;
  const [info, setInfo] = useState(Boolean(infoInicial));
  const [vista, setVista] = useState(() => vistaInicial(clau));
  const [errada, setErrada] = useState(null);
  const [arrossegant, setArrossegant] = useState(false);
  const escenariRef = useRef(null);
  const imatgeRef = useRef(null);
  const punters = useRef(new Map());
  const gest = useRef(null);
  const clauRef = useRef(clau);
  clauRef.current = clau;

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
      const factor = event.deltaY < 0 ? PAS_RODA : 1 / PAS_RODA;
      setVista((previa) => {
        const base = previa.clau === clauRef.current ? previa : vistaInicial(clauRef.current);
        const escala = limitaEscala(base.escala * factor);
        return escala <= ESCALA_MINIMA ? vistaInicial(clauRef.current) : dinsDelsLimits({ ...base, escala }, node, imatgeRef.current);
      });
    };
    node.addEventListener('wheel', enRoda, { passive: false });
    return () => node.removeEventListener('wheel', enRoda);
  }, []);

  const enPremer = (event) => {
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
    if (punters.current.size === 0 || g?.tipus === 'pessic') gest.current = null;
    if (punters.current.size === 0) setArrossegant(false);
  };

  /* Les fletxes, + − 0 i «i», des de qualsevol control del visor. Escape és
     del Dialeg. Amb una tecla modificadora no es toca res. */
  const enTecla = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const accions = {
      ArrowLeft: () => vesA(actual - 1),
      ArrowRight: () => vesA(actual + 1),
      '+': () => fixaEscala((escala) => escala * PAS_BOTO),
      '=': () => fixaEscala((escala) => escala * PAS_BOTO),
      '-': () => fixaEscala((escala) => escala / PAS_BOTO),
      0: () => fixaEscala(() => ESCALA_MINIMA),
      i: () => setInfo((obert) => !obert),
      I: () => setInfo((obert) => !obert)
    };
    if (!Object.hasOwn(accions, event.key)) return;
    event.preventDefault();
    accions[event.key]();
  };

  /* El doble clic amplia o torna a 1×; sobre «anterior» o «següent», no
     (dos clics ràpids passen dues fotos). */
  const enDobleClic = (event) => {
    if (event.target?.closest?.('button')) return;
    fixaEscala((escala) => (escala > ESCALA_MINIMA ? ESCALA_MINIMA : 2));
  };

  const posicio = posicioDe(text.posicio, actual + 1, total);
  const files = Array.isArray(metadades) ? metadades.filter((fila) => fila && fila.etiqueta) : [];
  const classesEscenari = ['sdp-visor__escenari', ampliada && 'sdp-visor__escenari--ampliat', arrossegant && 'sdp-visor__escenari--arrossega']
    .filter(Boolean).join(' ');

  return (
    <div ref={marcRef} className="sdp-visor__marc" onKeyDown={enTecla}>
      <div className="sdp-visor__barra">
        <Boto varietat="secundari" className="sdp-visor__boto" icona={ArrowLeft} aria-label={text.tanca}
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
          aria-expanded={info} aria-controls={idPanell} aria-keyshortcuts="I" onClick={() => setInfo((obert) => !obert)} />
      </div>
      <div className="sdp-visor__cos">
        <div ref={escenariRef} className={classesEscenari} onPointerDown={enPremer} onPointerMove={enMoure}
          onPointerUp={enAlcar} onPointerCancel={enAlcar} onDoubleClick={enDobleClic}>
          {imatge.src && errada !== clau ? (
            <img ref={imatgeRef} className="sdp-visor__imatge" src={imatge.src} alt={imatge.alt || ''} draggable="false"
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
        <aside id={idPanell} className="sdp-visor__panell" hidden={!info} aria-label={text.info}>
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
