/**
 * enquadramentUrl.js — P0-80 / IDEA-211 (llei del Mestre, 09-11-2026):
 * ENQUADRAMENT NO DESTRUCTIU. La foto es puja sencera i el marc que tria la
 * persona viu a la mateixa adreça de la imatge, en un fragment:
 *
 *   sdp-media://mitjans/<camí>.webp#sdp-crop=format=16%3A9&zoom=1.5&cx=0.4&cy=0.6
 *
 * `format` és una forma del diàleg ('original' o «a:b», com '16:9'), `zoom`
 * va d'1 a ZOOM_MAXIM_ENQUADRAMENT i `cx`, `cy` són el centre del marc en
 * fraccions [0..1] de l'amplada i de l'alçada de la foto sencera (l'estat de
 * DialegEnquadrament). Qui pinta llig el fragment i el pinta amb CSS
 * (useEnquadramentDeImatge); qui resol, valida, promou o exporta la imatge
 * treballa amb la base (llevaEnquadrament) i, si l'adreça continua cap a qui
 * pinta, hi torna el fragment (conservaEnquadrament).
 *
 * Funcions pures, sense cap import: les fan servir la capa de dades
 * (storage.js, mitjansLocal.js), les dades obertes, el diàleg i les vistes
 * (la pintura del marc, al final: posicioEnCaixa i retallCssDelZoom). Cap Map
 * en memòria ni cap adreça d'un sol cas. Sense taules: la portada és a
 * l'entrada del paquet.
 */

/** El començament del fragment d'enquadrament. */
export const PREFIX_ENQUADRAMENT = '#sdp-crop=';
/** L'ampliació màxima que pot portar un fragment (la de l'enquadrament: enquadrament.js · ZOOM_MAX). */
export const ZOOM_MAXIM_ENQUADRAMENT = 4;

/* Una forma: l'original o dues xifres d'1 a 99 separades per dos punts. */
const FORMA = /^(?:original|[1-9]\d?:[1-9]\d?)$/;
const DECIMALS = 4;

const arrodonix = (valor) => Math.round(valor * 10 ** DECIMALS) / 10 ** DECIMALS;
const entre = (valor, minim, maxim) => Math.min(maxim, Math.max(minim, valor));
/* Un número de veres: ni buit, ni null, ni text que no ho siga. */
const numero = (valor) => (typeof valor === 'number' || (typeof valor === 'string' && valor.trim() !== '') ? Number(valor) : Number.NaN);

/**
 * L'estat { format, zoom, cx, cy } net (zoom dins de [1, ZOOM_MAXIM] i el
 * centre dins de [0, 1], amb quatre decimals), o null si no és un estat:
 * una forma desconeguda o algun valor que no és un número finit.
 */
export function enquadramentNet(estat) {
  if (!estat || typeof estat !== 'object') return null;
  const { format } = estat;
  const zoom = numero(estat.zoom);
  const cx = numero(estat.cx);
  const cy = numero(estat.cy);
  if (typeof format !== 'string' || !FORMA.test(format)) return null;
  if (![zoom, cx, cy].every(Number.isFinite)) return null;
  return {
    format,
    zoom: arrodonix(entre(zoom, 1, ZOOM_MAXIM_ENQUADRAMENT)),
    cx: arrodonix(entre(cx, 0, 1)),
    cy: arrodonix(entre(cy, 0, 1)),
  };
}

/** La foto sencera: l'original sense ampliar no necessita cap fragment. */
const esLaFotoSencera = (estat) => estat.format === 'original' && estat.zoom === 1;

/**
 * { base, enquadrament }: l'adreça sense el fragment d'enquadrament i l'estat
 * net que porta (o null). Un fragment que no és el nostre no es toca (base =
 * el valor tal qual); un de nostre que no es pot llegir es lleva i no porta
 * cap estat. Un valor que no és text torna tal qual.
 */
export function separaEnquadrament(valor) {
  if (typeof valor !== 'string') return { base: valor, enquadrament: null };
  const posicio = valor.indexOf('#');
  if (posicio === -1 || !valor.startsWith(PREFIX_ENQUADRAMENT, posicio)) return { base: valor, enquadrament: null };
  const parametres = new URLSearchParams(valor.slice(posicio + PREFIX_ENQUADRAMENT.length));
  const estat = enquadramentNet({
    format: parametres.get('format'), zoom: parametres.get('zoom'), cx: parametres.get('cx'), cy: parametres.get('cy'),
  });
  return { base: valor.slice(0, posicio), enquadrament: estat && !esLaFotoSencera(estat) ? estat : null };
}

/** L'adreça sense el fragment d'enquadrament (la resta, tal qual). */
export const llevaEnquadrament = (valor) => separaEnquadrament(valor).base;

/**
 * L'adreça `valor` amb el marc `estat` al fragment, en la forma canònica. Sense
 * estat (o amb la foto sencera), l'adreça sense cap fragment. Qualsevol
 * fragment d'abans es substituïx: una imatge no en necessita cap altre.
 */
export function ambEnquadrament(valor, estat) {
  if (typeof valor !== 'string' || valor === '') return valor;
  const posicio = valor.indexOf('#');
  const base = posicio === -1 ? valor : valor.slice(0, posicio);
  const net = enquadramentNet(estat);
  if (!net || esLaFotoSencera(net)) return base;
  const parametres = new URLSearchParams({
    format: net.format, zoom: String(net.zoom), cx: String(net.cx), cy: String(net.cy),
  });
  return `${base}${PREFIX_ENQUADRAMENT}${parametres.toString()}`;
}

/**
 * La mateixa imatge en una altra adreça (la que torna el port en resoldre o
 * promoure la referència): hi torna el marc de l'original, si en portava.
 * Una adreça buida, o que no és text, torna tal qual.
 */
export function conservaEnquadrament(adreca, original) {
  if (typeof adreca !== 'string' || adreca === '') return adreca;
  const { enquadrament } = separaEnquadrament(original);
  return enquadrament ? ambEnquadrament(adreca, enquadrament) : adreca;
}

/** Els dos estats diuen el mateix marc (null = la foto sencera). */
export function mateixEnquadrament(a, b) {
  const x = enquadramentNet(a);
  const y = enquadramentNet(b);
  const senceraX = !x || esLaFotoSencera(x);
  const senceraY = !y || esLaFotoSencera(y);
  if (senceraX || senceraY) return senceraX && senceraY;
  return x.format === y.format && x.zoom === y.zoom && x.cx === y.cx && x.cy === y.cy;
}

/* ── La pintura del marc ─────────────────────────────────────────────────
   Una forma «a:b» és la proporció a / b (les de FORMATS ho són, lletra per
   lletra) i 'original', la de la mateixa foto. Unitats: l'alçada de la foto
   val 1 i l'amplada, la seua proporció. */
const EPSILON = 1e-6;
const ambDecimals = (valor, decimals) => Math.round(valor * 10 ** decimals) / 10 ** decimals;
/* El marc més gran de proporció r dins d'una caixa W × H (enquadrament.js · marcBase). */
const marcDins = (W, H, r) => (W / H > r ? { w: H * r, h: H } : { w: W, h: W / r });

/**
 * La proporció (amplada / alçada) del marc d'una forma: «a:b» → a / b, o, per
 * a 'original', la de la mateixa foto (`ratioImatge`, si ja se sap). null si
 * no es pot dir.
 */
export function ratioDelMarc(format, ratioImatge) {
  if (format === 'original') return Number.isFinite(ratioImatge) && ratioImatge > 0 ? ratioImatge : null;
  const parts = /^([1-9]\d?):([1-9]\d?)$/.exec(String(format ?? ''));
  return parts ? Number(parts[1]) / Number(parts[2]) : null;
}

/**
 * Com es pinta, amb la foto SENCERA, el que es veia quan el marc `estat`
 * ({ format, zoom, cx, cy }, el del diàleg) es retallava dins del fitxer i el
 * fitxer anava a una caixa de proporció `ratioCaixa` amb object-fit: cover i
 * object-position `alineacio` ({ x, y } en fraccions 0..1; de sèrie, el
 * centre). La targeta, per exemple, és quadrada i ancorada dalt
 * ({ x: 0.5, y: 0 }): d'un marc 16:9 ensenyava el quadrat del mig de dalt.
 * Sense `ratioCaixa`, la caixa té la forma del marc (la portada de la fitxa)
 * i es veu el marc sencer.
 * Torna { x, y, zoom } per a object-position i transform-origin (x i y en %,
 * dos decimals) i transform: scale(zoom) (quatre decimals, mai menys d'1), o
 * null si l'estat no és de números finits o encara no se sap la proporció de
 * la foto. Amb la caixa de la forma del marc, és posicioDeRetall
 * (enquadrament.js, el punt focal de la targeta 16:9).
 */
export function posicioEnCaixa(estat, ratioImatge, ratioCaixa = null, { alineacio = null } = {}) {
  let format, zoom, cx, cy;
  try {
    if (!estat || typeof estat !== 'object') return null;
    ({ format, zoom, cx, cy } = estat);
  } catch {
    return null;
  }
  const R = ratioImatge;
  const ratioMarc = ratioDelMarc(format, R);
  const B = Number.isFinite(ratioCaixa) && ratioCaixa > 0 ? ratioCaixa : ratioMarc;
  if (![cx, cy, zoom, R, ratioMarc, B].every((v) => Number.isFinite(v)) || !(R > 0) || !(ratioMarc > 0)) return null;
  const z = entre(zoom, 1, ZOOM_MAXIM_ENQUADRAMENT);
  const base = marcDins(R, 1, ratioMarc);
  const ampleMarc = base.w / z;
  const altMarc = base.h / z;
  const esquerraMarc = entre(cx * R, ampleMarc / 2, R - ampleMarc / 2) - ampleMarc / 2;
  const daltMarc = entre(cy, altMarc / 2, 1 - altMarc / 2) - altMarc / 2;
  // El que la caixa ensenyava del fitxer retallat: cover dins del marc, a l'alineació de la caixa.
  const vist = marcDins(ampleMarc, altMarc, B);
  const fraccio = (valor) => entre(Number.isFinite(Number(valor)) ? Number(valor) : 0.5, 0, 1);
  const esquerra = esquerraMarc + (ampleMarc - vist.w) * fraccio(alineacio?.x);
  const dalt = daltMarc + (altMarc - vist.h) * fraccio(alineacio?.y);
  // La foto sencera en la mateixa caixa, amb cover, ensenya `coberta`: l'ampliació la porta a `vist`.
  const coberta = marcDins(R, 1, B);
  const eix = (inici, mida, total) => {
    const rang = total - mida;
    return rang <= EPSILON * total ? 50 : ambDecimals(entre(inici / rang, 0, 1) * 100, 2);
  };
  return { x: eix(esquerra, vist.w, R), y: eix(dalt, vist.h, 1), zoom: ambDecimals(Math.max(1, coberta.w / vist.w), 4) };
}

/**
 * El clip-path que deixa una imatge ampliada amb transform: scale(zoom) al
 * voltant de { x, y } (posicioEnCaixa) dins de la seua pròpia caixa, sense
 * dependre que el contenidor talle el que sobreïx: inset() en les coordenades
 * de l'element, abans de la transformació. Sense ampliació (zoom 1), null:
 * res no sobreïx, i el focus no es retalla.
 */
export function retallCssDelZoom(punt) {
  const z = Number(punt?.zoom);
  const x = Number(punt?.x);
  const y = Number(punt?.y);
  if (![z, x, y].every((v) => Number.isFinite(v)) || z <= 1) return null;
  const k = 1 - 1 / z;
  const pc = (valor) => `${ambDecimals(valor * k, 3)}%`;
  return `inset(${pc(y)} ${pc(100 - x)} ${pc(100 - y)} ${pc(x)})`;
}
