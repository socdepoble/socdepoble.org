/**
 * Política de mitjans del paquet · bessones WebP i mitjans externs
 * ---------------------------------------------------------------------------
 * Encàrrec 261019_1425 (alliberament del paquet multimèdia i conversió a
 * WebP). Dos peces, totes dues sobre camins relatius a public/ en POSIX
 * ('assets/towns/tibi/1.jpg'):
 *
 *   · Les BESSONES WebP. tooling/media/optimitzar_webp.mjs escriu NOM.webp al
 *     costat de NOM.jpg o NOM.png i no toca mai l'original. Un .webp és la
 *     bessona d'un original només si n'és l'única font: la mateixa carpeta, el
 *     mateix nom amb la mateixa caixa i cap altre PNG/JPEG de la carpeta amb
 *     el mateix nom sense distingir majúscules (el tractor salta eixos parells:
 *     el disc d'un Mac no les distingix). Un .webp sense original, o amb dos,
 *     no és la bessona de ningú.
 *   · Els mitjans EXTERNS de la variant del directori de WordPress.org
 *     (SDP_VARIANT=wordpress): el contingut pesant del servei i les
 *     il·lustracions editorials/demostratives (uploads/, towns/, fotos/,
 *     events/, ui/, nano_cards/, img/ i notes/) no viatgen dins del zip per
 *     mantindre el paquet al voltant de 3,6 MB (molt per davall del límit de
 *     10 MB de WordPress.org), i se servixen des de l'origen extern
 *     (https://socdepoble.org). La carcassa bàsica de la interfície (system/,
 *     fonts/, components/, els índexs i els fitxers de l'arrel d'assets/) sí
 *     que hi viatja.
 *
 * El fitxer és pur: cap import, cap fs, cap import.meta. El fan servir
 * vite.standalone.config.js (què viatja al paquet i què se segella al bundle),
 * wordpress-plugin/eines/empaqueta.mjs (la verificació entre variants, sense
 * carregar Vite), la prova del cens de l'Arxiu visual (censImatges.test.js) i
 * el cens del tractor de mitjans. El resolutor (assetResolver.js) no l'importa: rep la
 * política ja calculada, segellada pel build.
 */

const ORIGINAL = /\.(?:jpe?g|png)$/i;

/**
 * Cert si el host no és d'Internet: localhost, loopback, xarxa privada, enllaç
 * local o .local. La compartixen el build (el node segellat i l'origen dels
 * mitjans, vite.standalone.config.js) i l'empaquetador (empaqueta.mjs).
 */
export function esHostLocal(host) {
  const h = String(host).replace(/^\[|\]$/g, '').toLowerCase();
  return h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h === '0.0.0.0' || h === '::1'
    || /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)
    || /^169\.254\./.test(h) || /^f[cd][0-9a-f]{2}:/.test(h) || /^fe80:/.test(h);
}
const EXTENSIO = /\.[^./]+$/;

/** El camí de la bessona .webp d'un original PNG/JPEG, o null si no n'és cap. */
export function bessonaDe(cami) {
  const text = String(cami ?? '');
  return ORIGINAL.test(text) ? text.replace(EXTENSIO, '.webp') : null;
}

/**
 * Els originals que tenen bessona entre `camins` (la llista de fitxers, en
 * camins relatius POSIX), ordenats i congelats. Regla de la capçalera: la
 * bessona hi és amb el nom exacte i l'original n'és l'única font.
 */
export function bessonesDe(camins) {
  const presents = new Set(camins);
  const fonts = new Map();
  for (const cami of camins) {
    if (!ORIGINAL.test(cami)) continue;
    const clau = cami.replace(EXTENSIO, '').toLowerCase();
    fonts.set(clau, (fonts.get(clau) || 0) + 1);
  }
  return Object.freeze(camins
    .filter((cami) => ORIGINAL.test(cami) && presents.has(bessonaDe(cami)))
    .filter((cami) => fonts.get(cami.replace(EXTENSIO, '').toLowerCase()) === 1)
    .sort());
}

/**
 * Variant del directori: l'origen per defecte i les carpetes de contingut que
 * no viatgen al zip. Cada prefix és una carpeta sencera, amb la barra final.
 * L'origen el pot canviar el build (SDP_ORIGEN_MITJANS, p. ex. un bucket
 * públic de Supabase Storage que replique assets/), mai l'amfitrió.
 */
export const MITJANS_EXTERNS_DEL_DIRECTORI = Object.freeze({
  origen: 'https://socdepoble.org',
  prefixos: Object.freeze([
    'assets/uploads/',
    'assets/towns/',
    'assets/fotos/',
    'assets/events/',
    'assets/ui/',
    'assets/nano_cards/',
    'assets/img/',
    'assets/notes/'
  ])
});

/** Cert si `cami` penja d'un dels `prefixos` (comparació exacta de carpeta). */
export function esExtern(cami, prefixos = []) {
  const text = String(cami ?? '');
  return prefixos.some((prefix) => text.startsWith(prefix));
}

/**
 * Reparteix els recursos de public/ segons una política
 * ({ externs: [prefixos], bessones: [originals] }):
 *   · externs     els que no viatgen perquè se servixen de l'origen extern;
 *   · substituits els originals que no viatgen perquè hi viatja la bessona;
 *   · viatgen     la resta, en el mateix ordre.
 * Sense política, tot viatja. Les bessones d'un extern també són externes.
 * Un original només se substituïx si la seua bessona és a la llista i
 * viatja: una política vella mai no deixa el paquet sense cap de les dues.
 */
export function separaRecursos(camins, politica = null) {
  if (!politica) return { viatgen: [...camins], externs: [], substituits: [] };
  const prefixos = politica.externs || [];
  const bessones = new Set(politica.bessones || []);
  const presents = new Set(camins);
  const viatgen = [];
  const externs = [];
  const substituits = [];
  for (const cami of camins) {
    if (esExtern(cami, prefixos)) externs.push(cami);
    else if (bessones.has(cami) && presents.has(bessonaDe(cami))) substituits.push(cami);
    else viatgen.push(cami);
  }
  return { viatgen, externs, substituits };
}
