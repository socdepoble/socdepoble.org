/**
 * informeDError.js — Onada 6 (prompt 261009_0230, punt 4: el xat és l'eina
 * de feedback dels beta testers) · L'esborrany de «Informa d'un error».
 *
 * Una plantilla curta (Què ha passat · On · Què esperaves) i quatre dades
 * tècniques que no diuen res de la persona:
 *   · la ruta on era abans d'entrar al xat i la d'ara, sense consulta ni
 *     fragment, amb una llista BLANCA: només es conserva el primer segment
 *     (la secció: /xat, /mur, /pobles…) i tota la resta passa a «:id»;
 *   · la versió del paquet: el mode de Vite i el nom del fitxer de
 *     JavaScript que porta este codi. Al build de pàgines porta el hash de
 *     la construcció; al paquet de WordPress (IIFE) el nom és fix
 *     (soc-de-poble.standalone.js) i no diu la versió: la que calcula el
 *     build (versioDelBuild, vite.standalone.config.js) encara no arriba al
 *     client (pendent, fitxers compartits);
 *   · el navegador: només el nom, la versió major i el sistema;
 *   · la mida de la finestra en píxels CSS i la densitat.
 * Cap nom, correu, sessió, testimoni ni consulta. L'esborrany es mostra al
 * compositor i la persona el pot editar o esborrar abans d'enviar-lo.
 * Si el xat no es pot obrir, la reserva: copiar l'informe o enviar-lo per
 * correu (enllacDeCorreu) a l'adreça pública del projecte.
 * Pur, llevat de les lectures de l'entorn (`entorn`), que es poden injectar.
 */
import { CORREU_CONTACTE } from '../../config/contacte.js';

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/* La secció és una paraula de ruta: minúscules, xifres i guionets. */
const RE_SECCIO = /^[a-z][a-z0-9-]*$/;
const MAXIM_SEGMENT = 40;

/**
 * La ruta sense consulta, sense fragment i sense identificadors. Llista
 * blanca: el primer segment es conserva si té forma de secció (no un UUID ni
 * un número ni un segment llarg); tots els altres passen a «:id», perquè
 * `:sectionId/:itemId` (App.jsx) pot portar qualsevol id o slug.
 */
export function rutaSenseDades(ruta) {
  const cami = String(ruta || '/').split(/[?#]/)[0] || '/';
  let primer = true;
  return cami.split('/').map((segment) => {
    if (!segment) return segment;
    const conserva = primer && RE_SECCIO.test(segment) && segment.length <= MAXIM_SEGMENT && !RE_UUID.test(segment);
    primer = false;
    return conserva ? segment : ':id';
  }).join('/') || '/';
}

/* L'adreça pública de contacte del projecte (l'Avís legal, legalContent.js):
   la reserva quan el xat no es pot obrir. T2 (261024) · De la font única,
   config/contacte.js (sense dependències: no porta el document legal). */
export const CORREU_DE_RESERVA = CORREU_CONTACTE;

/**
 * L'enllaç mailto: amb l'informe al cos i `assumpte`. Els salts de línia van
 * com a CRLF (RFC 6068). Només porta el que diu l'informe: cap dada personal.
 */
export function enllacDeCorreu(informe, assumpte = '', correu = CORREU_DE_RESERVA) {
  const codifica = (text) => encodeURIComponent(String(text || '').replace(/\r?\n/g, '\r\n'));
  const parts = [];
  if (assumpte) parts.push(`subject=${codifica(assumpte)}`);
  if (informe) parts.push(`body=${codifica(informe)}`);
  return `mailto:${correu}${parts.length ? `?${parts.join('&')}` : ''}`;
}

/* La darrera ruta de l'app fora del Xat: on era la persona abans d'entrar-hi.
   La deixa XatContext (AvisadorXat, que viu per damunt de les rutes). Només
   en memòria, en esta pestanya. */
let darreraForaDelXat = null;
const RE_RUTA_XAT = /(^|\/)xat(\/|$)/;

/** Recorda `ruta` si no és del Xat. */
export function recordaRutaForaDelXat(ruta) {
  const valor = String(ruta || '');
  if (valor && !RE_RUTA_XAT.test(valor)) darreraForaDelXat = valor;
}

/** Per a les proves. */
export function oblidaRutaForaDelXat() {
  darreraForaDelXat = null;
}

/* El nom, la versió major i el sistema; l'ordre importa: Edge i Samsung
   porten «Chrome», i Chrome porta «Safari». */
const NAVEGADORS = Object.freeze([
  ['Edge', /Edg(?:e|A|iOS)?\/(\d+)/],
  ['Firefox', /(?:Firefox|FxiOS)\/(\d+)/],
  ['Samsung Internet', /SamsungBrowser\/(\d+)/],
  ['Chrome', /(?:Chrome|CriOS)\/(\d+)/],
  ['Safari', /Version\/(\d+).*Safari\//]
]);

/** «Safari 16 · iOS», «Chrome 129 · Android»… o «—» si no se sap. */
export function navegadorDe(ua) {
  const text = String(ua || '');
  let nom = '—';
  for (const [etiqueta, patro] of NAVEGADORS) {
    const trobat = patro.exec(text);
    if (trobat) { nom = `${etiqueta} ${trobat[1]}`; break; }
  }
  let sistema = '';
  if (/iPhone|iPad|iPod/.test(text)) sistema = 'iOS';
  else if (/Android/.test(text)) sistema = 'Android';
  else if (/Macintosh|Mac OS X/.test(text)) sistema = 'macOS';
  else if (/Windows/.test(text)) sistema = 'Windows';
  else if (/CrOS|Linux/.test(text)) sistema = 'Linux';
  return sistema ? `${nom} · ${sistema}` : nom;
}

/** «production · XatSection-abc123.js»: el mode i el fitxer que porta este codi (al paquet de WordPress, un nom fix). */
export function versioDelPaquet(url = import.meta.url, mode = import.meta.env?.MODE) {
  let fitxer = '';
  try {
    fitxer = new URL(String(url)).pathname.split('/').pop() || '';
  } catch {
    fitxer = '';
  }
  return [mode, fitxer].filter(Boolean).join(' · ') || '—';
}

/** «375 × 812 · ×3»: la finestra en píxels CSS i, si no és 1, la densitat. */
export function midaDePantalla(amplada, alcada, densitat = 1) {
  const a = Math.round(Number(amplada));
  const b = Math.round(Number(alcada));
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return '—';
  const d = Number(densitat);
  return Number.isFinite(d) && d > 0 && d !== 1 ? `${a} × ${b} · ×${Math.round(d * 100) / 100}` : `${a} × ${b}`;
}

/* L'entorn real: només lectures, cap dada de la persona. */
function entornDelNavegador() {
  const finestra = typeof window === 'undefined' ? null : window;
  return {
    ua: typeof navigator === 'undefined' ? '' : navigator.userAgent,
    amplada: finestra?.innerWidth,
    alcada: finestra?.innerHeight,
    densitat: finestra?.devicePixelRatio ?? 1
  };
}

/** La plantilla, en valencià: la reserva de la clau section.xat.informe.plantilla. */
export const PLANTILLA_INFORME = 'Què ha passat: \nOn: \nQuè esperaves: \n\n— Dades tècniques, sense dades personals —\nRuta: {ruta}\nVersió: {versio}\nNavegador: {navegador}\nPantalla: {pantalla}';

/**
 * L'esborrany de l'informe, en la llengua de la interfície. `rutaActual` és
 * la ruta del Xat on s'ha premut el botó; l'anterior, la que s'ha recordat.
 */
export function composaInforme({ t, rutaActual, rutaAnterior = darreraForaDelXat, entorn = entornDelNavegador(), versio = versioDelPaquet() } = {}) {
  const ara = rutaSenseDades(rutaActual);
  const abans = rutaAnterior ? rutaSenseDades(rutaAnterior) : null;
  const plantilla = typeof t === 'function' ? t('section.xat.informe.plantilla', PLANTILLA_INFORME) : PLANTILLA_INFORME;
  const dades = {
    ruta: abans && abans !== ara ? `${abans} → ${ara}` : ara,
    versio,
    navegador: navegadorDe(entorn?.ua),
    pantalla: midaDePantalla(entorn?.amplada, entorn?.alcada, entorn?.densitat)
  };
  return String(plantilla).replace(/\{(ruta|versio|navegador|pantalla)\}/g, (_, clau) => dades[clau]);
}

/** L'esborrany que ja hi havia i, darrere, l'informe; o només l'informe. */
export function afigInforme(esborrany, informe) {
  const previ = String(esborrany || '').trimEnd();
  if (!previ) return informe;
  return previ.includes(informe) ? previ : `${previ}\n\n${informe}`;
}
