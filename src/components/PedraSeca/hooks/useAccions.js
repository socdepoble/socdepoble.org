import { useNavigate } from '../../../app/contexts/RouterContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { registraEsdeveniment, seccioActual } from '../../../data/telemetria.js';
import {
  esPrivat, esRutaInterna, modeXat, objecteDePagina, rutaConnectarObjecte, rutaXatDePagina
} from '../../../config/objecteConnectable.js';

/* T63.2 · El clic a un Comentar que ara no porta a cap xat (una pàgina sense
   xat comú, un element que no s'ha trobat): ho diu, no navega enlloc. */
export const AVIS_SENSE_XAT = 'Ací no hi ha cap xat comú on comentar.';

/* Connectar substituïx el «M'agrada»: és un acte conscient i el comptem.
   Només valors tancats: cap títol, etiqueta ni text de la persona pot
   colar-se a la telemetria per esta porta. */
const ORIGENS = new Set(['targeta', 'pagina']);
const MODES = new Set(['previsualitzacio']);

/**
 * Registra l'esdeveniment «connectar» sense esperar-lo: `registraEsdeveniment`
 * és síncron i el `fetch` que llança no s'espera. Si peta, el clic continua.
 */
export function registraConnectar({ origen, mode } = {}) {
  const dades = { seccio: seccioActual(), origen: ORIGENS.has(origen) ? origen : 'targeta' };
  if (MODES.has(mode)) dades.mode = mode;
  try { registraEsdeveniment('connectar', dades); } catch { /* la telemetria mai trenca el clic */ }
}

/**
 * T43 (ordre del Mestre, 260928) · La ruta on està la persona, llegida en el
 * moment del clic (no en pintar: moltes proves simulen el router sense
 * useLocation). Inclou la consulta (?item=… de la Wiki) si hi cap. Amb un
 * `basename` d'incrustació, la ruta el porta: és la de la barra d'adreces.
 * PENDENT (T43a-1): amb basename, navigate() l'hi tornaria a afegir, i amb
 * MemoryRouter és la ruta de la pàgina amfitriona. Cal llegir-la del router
 * quan les proves que el simulen només amb useNavigate ho admeten.
 */
export function rutaActual() {
  if (typeof window === 'undefined' || !window.location) return '';
  const { pathname = '', search = '' } = window.location;
  const sencera = `${pathname}${search}`;
  return esRutaInterna(sencera) ? sencera : (esRutaInterna(pathname) ? pathname : '');
}

/**
 * T43 · El Connectar per defecte d'una targeta sense descriptor propi: una
 * 'pagina' amb la ruta del detall (mainHref) o, si no n'hi ha, la d'on està
 * la persona. Sense detall, la clau és el títol, com abans.
 */
export function rutaConnectarPerDefecte(title, mainHref) {
  const titol = typeof title === 'string' ? title : '';
  const detall = esRutaInterna(mainHref) ? mainHref : '';
  return rutaConnectarObjecte(objecteDePagina({ titol, ruta: detall || rutaActual(), id: detall || titol }));
}

/**
 * T63.2 (doctrina del Mestre, 260928) · El Comentar per defecte sense
 * descriptor propi: el xat comú de la 'pagina' del detall (mainHref). Només
 * la barra d'una pàgina (`pagina: true`) pren, sense detall, la ruta d'on està
 * la persona: una targeta d'una llista no és la llista, i totes les targetes
 * compartirien un sol xat amb títols diferents. La clau és la ruta, mai el
 * títol. null si no n'hi ha cap que valga per al contracte (subjecteDeXat: la
 * llista tancada de pàgines amb xat), com una pàgina privada, una fitxa amb
 * consulta o una ruta de detall.
 */
export function rutaXatPerDefecte(title, mainHref, { pagina = false } = {}) {
  const titol = typeof title === 'string' ? title : '';
  const ruta = esRutaInterna(mainHref) ? mainHref : (pagina ? rutaActual() : '');
  return ruta ? rutaXatDePagina(objecteDePagina({ titol, ruta })) : null;
}

/** URL absoluta del detall; si no n'hi ha, la de la pàgina. */
export function urlPerCompartir(href) {
  if (!href) return window.location.href;
  try { return new URL(href, window.location.origin).href; } catch { return window.location.href; }
}

export async function compartix(titol, url, showToast) {
  if (navigator.share) {
    try {
      await navigator.share({ title: titol || document.title, url });
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return; // ha tancat el menú: no és cap error
      // Qualsevol altra fallada: provem el porta-retalls.
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast('Enllaç copiat al porta-retalls.');
  } catch {
    showToast(`No s'ha pogut copiar. Enllaç: ${url}`, 6000);
  }
}

/**
 * Peça única de domini per a les accions de UI (Connectar, Traduir, Comentar, Compartir).
 * Cura el doble protocol i el prop drilling.
 *
 * `telemetria` ({ origen?: 'targeta' | 'pagina', mode?: 'previsualitzacio' }) diu
 * com es compta el Connectar. És l'únic lloc que el registra: UniversalPage
 * no l'embolcalla, i per això un clic a la barra de pàgina compta una vegada.
 *
 * `objecte` (T63.2) diu on porta Comentar quan no hi ha onComment propi:
 *   · un descriptor tipat (objecteDe, objecteDePerfil, objecteDePagina…): el
 *     seu xat (rutaXatDePagina). Una nota, una carpeta, una categoria o una
 *     etiqueta no en tenen mai: Comentar no es pinta, encara que showComment
 *     el demane.
 *   · null: la pàgina sap que ara no té cap element (carregant, no trobat, un
 *     contingut de fora). No hi ha xat.
 *   · sense (undefined): el valor per defecte, rutaXatPerDefecte (la barra
 *     d'una pàgina, `telemetria.origen === 'pagina'`, hi posa la seua ruta).
 * Quan no porta a cap xat (null, o un descriptor o una ruta que el contracte
 * no admet), el botó es queda on era, amb el nom neutre, i el clic mostra
 * AVIS_SENSE_XAT: amagar-lo canviaria píxels (Llei del Píxel).
 * Connectar no el fa servir: continua amb onConnect.
 */
export function useAccions({
  title,
  mainHref,
  objecte,
  onConnect,
  onTranslate,
  onComment,
  onShare,
  showConnect,
  showTranslate,
  showComment,
  showShare,
  hasFooter,
  telemetria
}) {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // T43 · sense handler propi, el Connectar porta un descriptor tipat (no només el títol).
  const connectar = onConnect || (() => navigate(rutaConnectarPerDefecte(title, mainHref)));
  // Primer es compta i després es fa el de sempre (handler propi o navegació).
  // `telemetria.comptar === false`: el botó principal no és un Connectar
  // (p. ex. «Obrir» o «Veure detall» de la Consola) i no entra a la mètrica.
  const handleConnect = (...args) => {
    if (telemetria?.comptar !== false) registraConnectar(telemetria);
    return connectar(...args);
  };
  const handleTranslate = onTranslate || (() => navigate('/traduccions'));
  // T63.2 · sense handler propi, Comentar obri el xat de la Pàgina Universal:
  // la de l'objecte tipat o, sense objecte, la del valor per defecte. La ruta
  // d'on està la persona es llig en el clic, com la de Connectar.
  const pagina = telemetria?.origen === 'pagina';
  const rutaXat = () => (objecte === undefined
    ? rutaXatPerDefecte(title, mainHref, { pagina })
    : rutaXatDePagina(objecte));
  const handleComment = onComment || (() => {
    const ruta = rutaXat();
    if (ruta) navigate(ruta);
    else showToast(AVIS_SENSE_XAT);
  });
  const handleShare = onShare || (() => compartix(title, urlPerCompartir(mainHref), showToast));

  const perDefecte = hasFooter === true;
  const privat = !onComment && esPrivat(objecte);
  const traduirVisible = showTranslate ?? (perDefecte || Boolean(onTranslate));
  const comentarVisible = !privat && (showComment ?? (perDefecte || Boolean(onComment)));
  const compartirVisible = showShare ?? (perDefecte || Boolean(onShare));
  const connectarVisible = showConnect ?? (perDefecte || Boolean(onConnect));
  /* On porta Comentar, per al nom del botó de la barra blava: 'comu' (xat
     comú), 'directe' (persona o IA) o null (cap xat, o un handler propi
     sense objecte, que no sabem on va). */
  const comentarXat = objecte ? modeXat(objecte) : (onComment || !rutaXat() ? null : 'comu');

  return {
    handleConnect,
    handleTranslate,
    handleComment,
    handleShare,
    traduirVisible,
    comentarVisible,
    compartirVisible,
    connectarVisible,
    comentarXat
  };
}
