import { Component, lazy } from 'react';

// L'entrada web pròpia injecta esta capacitat; els mòduls no importen PWA.
let recuperaErrorChunkDeploy = () => false;
export function configuraRecuperacioLazy(recupera) {
  recuperaErrorChunkDeploy = typeof recupera === 'function' ? recupera : () => false;
}

/** An import failure stays rejected in React and the browser module cache.
 * Only the owned web entry may confirm a deployment and reserve one reload;
 * otherwise recovery continues to belong to the route owner. */
export class LazyRouteError extends Error {
  constructor(cause) {
    super('No s’ha pogut carregar el mòdul d’esta vista.', { cause });
    this.name = 'LazyRouteError';
  }
}

export const ESPERA_TRANSICIO_DEPLOY_MS = 5000;

let transicioDeDocumentFins = 0;

export function marcaTransicioDeDocument(ara = Date.now(), duradaMs = ESPERA_TRANSICIO_DEPLOY_MS) {
  if (!Number.isFinite(ara) || !Number.isFinite(duradaMs) || duradaMs <= 0) return;
  transicioDeDocumentFins = Math.max(transicioDeDocumentFins, ara + duradaMs);
}

export function enTransicioDeDocument(ara = Date.now()) {
  return Number.isFinite(ara) && transicioDeDocumentFins > ara;
}

export function _reiniciaTransicioDeDocument() {
  transicioDeDocumentFins = 0;
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('beforeunload', () => marcaTransicioDeDocument());
  window.addEventListener('pageshow', (event) => {
    if (event?.persisted) _reiniciaTransicioDeDocument();
  });
}

export const esErrorLazy = (error) => error instanceof LazyRouteError;

/* Onada R32.2 · Peixos Daurats (P2, PerfilShell) · Un tros que NO ARRIBA (xarxa, desplegament, MIME, CSS de
   precàrrega) no és un tros que arriba i peta en avaluar-se (TDZ entre trossos, exportació nomenada que
   falta, throw al nivell superior): el segon és un error de codi determinista que el navegador guarda al
   mapa de mòduls, i cap «revisa la connexió» ni cap reintent el cura. Mateixos patrons que
   classificaErrorChunkDeploy (src/pwa/recuperacioChunkDeploy.js; els mòduls no importen PWA), sense la
   condició d'origen: ací no es recarrega res, només es tria quin avís és honest. Mai llança. */
const PATRONS_DE_TRANSPORT = Object.freeze([
  'failed to fetch dynamically imported module', 'error loading dynamically imported module',
  'importing a module script failed', 'unable to preload css', 'chunkloaderror',
]);
export function esFalladaDeTransport(error) {
  try {
    const vistos = new Set();
    let e = esErrorLazy(error) ? error.cause : error;
    for (let n = 0; e && n < 4 && !vistos.has(e); n += 1, e = typeof e === 'object' ? e.cause : null) {
      vistos.add(e);
      const missatge = typeof e === 'string' ? e : typeof e.message === 'string' ? e.message : '';
      if (missatge.length > 4096) return false;
      const text = missatge.toLowerCase();
      const mime = text.includes('mime') && (text.includes('module') || text.includes('script'));
      if (e.name === 'SyntaxError' && !mime) return false;
      if (mime || PATRONS_DE_TRANSPORT.some((patro) => text.includes(patro))
        || (text.includes('loading chunk') && text.includes('failed'))) return true;
    }
    return false;
  } catch { return false; }
}

function rebuigDeCarrega(error, rebutja = () => {}) {
  const falla = () => { rebutja(); throw esErrorLazy(error) ? error : new LazyRouteError(error); };
  if (enTransicioDeDocument()) {
    return new Promise(resolve => setTimeout(resolve, ESPERA_TRANSICIO_DEPLOY_MS)).then(falla);
  }
  const intent = recuperaErrorChunkDeploy(error);
  if (intent === false) return falla();
  // A confirmed reload owns the document transition. Do not flash a red
  // boundary while that new document is being requested. If navigation is
  // cancelled or cannot leave, restore the honest boundary after a finite wait.
  return intent.then(recarregant => recarregant
    ? new Promise(resolve => setTimeout(resolve, ESPERA_TRANSICIO_DEPLOY_MS)).then(falla) : falla(), falla);
}

export function lazyRoute(importa) {
  return lazy(() => Promise.resolve().then(importa).catch(error => rebuigDeCarrega(error)));
}

/* Onada R29 · R29-RUT-04 · La barrera d'un tros ACCESSORI (un tauler, un
   aparador, la barra de veu): si el seu import no arriba (LazyRouteError), es
   pinta `fallback` (per defecte, res) i la pàgina que ja es veia es queda;
   `onFalla` avisa el propietari una sola vegada. Qualsevol altre error puja
   com sempre. Sense reintent: el rebuig queda a la memòria de React i només
   el cura recarregar, que és cosa de la barrera de la ruta o de qui navega
   (precedents: BarreraDelPanellDelPoble i BarreraDelDocumentDestacat).
   Onada R32.2 · `nomesTransport` (opcional): la barrera només es queda el tros que NO ARRIBA
   (esFalladaDeTransport). Un tros que arriba i peta en avaluar-se puja amb la seua causa crua, com un
   error de render: el límit del panell o de la ruta l'anota i el mostra tal com és. Sense la prop, el
   contracte R29 no canvia. */
export class BarreraDelTrosAccessori extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  recull(error) {
    return esErrorLazy(error) && (!this.props.nomesTransport || esFalladaDeTransport(error));
  }

  componentDidCatch(error) {
    if (this.recull(error)) this.props.onFalla?.(error);
  }

  componentDidUpdate(anterior) {
    // Un altre propietari és una intenció nova; el seu tros no hereta la
    // fallada de l'anterior. Sense resetKey, es conserva el contracte de sempre.
    if (anterior.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (!this.recull(error)) throw esErrorLazy(error) && error.cause != null ? error.cause : error;
    return this.props.fallback ?? null;
  }
}

/** A lazy view whose owner may ask again on a new intent (a different key),
 * never in a loop. `vigent(clau)` keeps one shared lazy while it loads or
 * after it loads; after a rejection it keeps the rejected one for the key
 * that saw it (no retry when re-entering the same key) and builds a fresh
 * lazy for any other key. The owner says what a key is (XatSection: the
 * community and the mount). `reinicia()` forgets everything (owner, tests),
 * and a forgotten lazy that rejects later blames nobody. */
export function lazyRouteRenovable(importa) {
  const SENSE = Symbol('sense');
  let Vista = null, demanada = SENSE, rebutjada = SENSE;
  const crea = () => {
    const vista = lazy(() => Promise.resolve().then(importa).catch(error => rebuigDeCarrega(error, () => {
      if (Vista === vista) rebutjada = demanada;
    })));
    return vista;
  };
  return {
    vigent(clau) {
      if (!Vista || (rebutjada !== SENSE && rebutjada !== clau)) { Vista = crea(); rebutjada = SENSE; }
      demanada = clau;
      return Vista;
    },
    reinicia() { Vista = null; demanada = SENSE; rebutjada = SENSE; }
  };
}
