/**
 * Política universal de router de l'enxufe.
 *
 * L'app viu en dos llocs: a socdepoble.org (#root), on és ama de la URL, i
 * incrustada dins d'un amfitrió (Sollutia, o WordPress com a banc de proves),
 * on la URL i l'historial són de l'amfitrió. La regla és una sola i no sap
 * quin amfitrió té davant:
 *
 *  - El router de NAVEGADOR només s'usa quan algú ho declara: routerType
 *    'browser' (el #root de socdepoble.org) o una base explícita (l'amfitrió
 *    diu «a partir d'esta ruta, la URL és teua»). Dins de la base l'app és ama;
 *    fora d'ella queda inert: no pinta rutes ni reescriu res.
 *  - Sense cap declaració, l'element incrustat navega en MEMÒRIA: mai toca la
 *    URL ni l'historial de l'amfitrió, i l'adreça dinàmica de Sollutia no es
 *    trenca.
 *
 * Les rutes relatives ('../wikidepoble') es resolen sobre la ruta DE L'APP,
 * no sobre la de l'amfitrió: al navegador no es passa mai una URL relativa.
 */

// Origen fictici per a resoldre rutes amb el parser d'URL sense tocar la xarxa.
const ORIGEN_FICTICI = 'http://x.invalid';
// Espais, control C0/C1, barra invertida, consulta i fragment: cap té lloc en una base.
const PROHIBIT_A_BASE = /[\s\u0000-\u001F\u007F-\u009F\\?#]/;
/* Invisibles i marques bidi (U+200B–U+200F, U+202A–U+202E, U+2066–U+2069,
   U+FEFF): una base amb ells s'assembla a una altra i no la veu ningú. Es miren
   per punt de codi perquè el font no porte caràcters invisibles. */
const RANGS_INVISIBLES = Object.freeze([[0x200B, 0x200F], [0x202A, 0x202E], [0x2066, 0x2069], [0xFEFF, 0xFEFF]]);
// El parser d'URL també pren %2e com a punt: '/a/%2e%2e' puja un nivell.
const SEGMENT_DE_PUNTS = /^(?:\.|%2e){1,2}$/i;
/* Forma canònica d'un segment (RFC 3986 §6.2.2 i RFC 3987 §3.1): una %XX
   vàlida o un caràcter fora d'ASCII. Una '%' sense dos hexadecimals darrere
   no casa i es queda tal qual: no es descodifica res que no siga vàlid. */
const A_CANONITZAR = /%([0-9A-Fa-f]{2})|[\u0080-\u{10FFFF}]/gu;
// No reservats de l'RFC 3986: la %XX d'un d'ells és el mateix caràcter.
const NO_RESERVAT = /^[A-Za-z0-9._~-]$/;
// El que el parser d'URL posa en lloc d'una meitat solta d'un parell subrogat (U+FFFD).
const SUBSTITUT_CODIFICAT = '%EF%BF%BD';

const esRutaDeLApp = (valor) => typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//');

const teInvisibles = (text) => Array.from(text).some((caracter) => {
  const punt = caracter.codePointAt(0);
  return RANGS_INVISIBLES.some(([des, fins]) => punt >= des && punt <= fins);
});

/**
 * Base on l'amfitrió deixa l'app ser ama de la URL. '' vol dir «sense base»
 * (absent o invàlida). '/comunitat/' → '/comunitat'; '/' → ''.
 * Es torna codificada com la dóna `location.pathname`, perquè s'hi puga comparar.
 */
export function normalitzaBase(valor) {
  if (!esRutaDeLApp(valor) || PROHIBIT_A_BASE.test(valor) || teInvisibles(valor)) return '';
  const base = valor.replace(/\/+$/, '');
  if (!base) return '';
  // '/a//b' (segment buit) i els segments de punts no són una base: la reescriurien.
  if (base.slice(1).split('/').some(segment => !segment || SEGMENT_DE_PUNTS.test(segment))) return '';
  let url;
  try { url = new URL(base, ORIGEN_FICTICI); } catch { return ''; }
  if (url.origin !== ORIGEN_FICTICI) return '';
  return url.pathname;
}

/**
 * Un segment en forma canònica, per a comparar-lo i res més: %xx → %XX, la %XX
 * d'un no reservat → el caràcter, i un caràcter fora d'ASCII → la seua UTF-8
 * codificada. 'p%c3%a0gina', 'p%C3%A0gina' i 'pàgina' donen el mateix. Una
 * seqüència invàlida no es descodifica mai: '%zz' es compara tal qual, i una
 * '%c3' sola (UTF-8 incomplet), només amb l'hexadecimal en majúscula.
 */
const canonitzaSegment = (segment) => segment.replace(A_CANONITZAR, (tros, hex) => {
  if (hex === undefined) {
    try { return encodeURIComponent(tros); } catch { return SUBSTITUT_CODIFICAT; }
  }
  const caracter = String.fromCharCode(Number.parseInt(hex, 16));
  return NO_RESERVAT.test(caracter) ? caracter : `%${hex.toUpperCase()}`;
});

/**
 * Ruta de l'app dins de la URL del document. Sense base, el camí tal qual.
 * `null` vol dir FORA DE BASE: la URL és de l'amfitrió i l'app no hi té res a
 * dir. El límit és de segment: la base '/comunitat' no casa '/comunitats'.
 * La base i el camí es comparen segment a segment en forma canònica (la caixa
 * de les %XX o una 'à' crua no els fan distints), però el que es torna és la
 * resta del camí ORIGINAL, sense retocar.
 */
export function treuBase(pathname, base) {
  const b = normalitzaBase(base);
  if (!b) return pathname;
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) return null;
  const segmentsBase = b.slice(1).split('/');
  const segments = pathname.slice(1).split('/');
  if (segments.length < segmentsBase.length) return null;
  const casa = segmentsBase.every((segment, i) => canonitzaSegment(segment) === canonitzaSegment(segments[i]));
  if (!casa) return null;
  // La base ocupa la barra inicial, els seus segments originals i les barres d'entre ells.
  const resta = pathname.slice(1 + segments.slice(0, segmentsBase.length).join('/').length);
  return resta === '' ? '/' : resta;
}

/**
 * Destí absolut (camí + consulta + fragment) d'una navegació. Una ruta que
 * comença per '/' es torna tal qual; una relativa es resol com ho faria el
 * navegador, però sobre `rutaActual`, que és la ruta de l'app.
 * Torna `null` quan el destí no és una ruta de l'app (un altre origen, '//host',
 * un esquema com 'https:' o 'mailto:'): no hi ha res a navegar dins seu.
 */
export function resolRuta(to, rutaActual = '/') {
  if (typeof to !== 'string') return null;
  const actual = esRutaDeLApp(rutaActual) ? rutaActual : '/';
  let url;
  try { url = new URL(to, ORIGEN_FICTICI + actual); } catch { return null; }
  // El parser lleva tabuladors i pren '\' per '/': '/\\host' o '/\t/host' també ixen de l'origen.
  if (url.origin !== ORIGEN_FICTICI) return null;
  return to.startsWith('/') ? to : url.pathname + url.search + url.hash;
}

const MEMORIA = Object.freeze({ memoria: true, basename: '' });

/**
 * Tria del router en muntar. L'ordre és estricte:
 *  1. una instància que no és la primera navega sempre en memòria (dues apps
 *     no poden ser ames de la mateixa URL);
 *  2. routerType 'memory' → memòria;
 *  3. routerType 'browser' → navegador, amb la base declarada si n'hi ha;
 *  4. una base declarada → navegador sota eixa base;
 *  5. res declarat → memòria: l'element incrustat no toca la URL de l'amfitrió.
 */
export function triaRouter(config = {}, { primeraInstancia = true } = {}) {
  const c = config !== null && typeof config === 'object' ? config : {};
  if (primeraInstancia === false) return MEMORIA;
  if (c.routerType === 'memory') return MEMORIA;
  const basename = normalitzaBase(c.basename ?? c.basePath);
  if (c.routerType === 'browser') return Object.freeze({ memoria: false, basename });
  if (basename) return Object.freeze({ memoria: false, basename });
  return MEMORIA;
}
