/**
 * Canal d'identitat de l'amfitrió: `window.SocDePobleConfig`.
 *
 * És un canal DECLARAT del contracte d'amfitrió, no una convenció de WordPress:
 * qualsevol amfitrió (el plugin de WordPress, que només és banc de proves, o
 * Sollutia) el pot escriure abans de carregar el bundle, i el nucli el llig com
 * a dada de només lectura. Té la prioritat MÉS BAIXA: el JSON de l'element, els
 * atributs i `configura()` el trepitgen sempre.
 *
 * Només porta presentació i navegació: el nom visible del poble (`nomPoble`) i
 * el poble on aterra qui entra (`poble`). Qualsevol altra clau es descarta sense
 * mirar-la: backend, credencials, tenant o mode de dades no poden entrar per un
 * global que qualsevol script de la pàgina pot escriure.
 *
 * `poble` NO és `tenantId`. `tenantId` és l'UUID de public.towns(id): l'abast de
 * dades de Supabase, que decidix quines files es lligen i s'escriuen. `poble` és
 * l'id de l'element de la secció Pobles (app_content 'towns', p. ex.
 * 'la-torre-de-les-macanes') i només tria la ruta inicial /pobles/<id>.
 * Confondre'ls faria que una dada de presentació governara l'abast de les dades.
 */

export const CLAUS_AMFITRIO = Object.freeze(['nomPoble', 'poble']);

const LIMIT_ETIQUETA = 80;
// Control C0, DEL i C1.
const CONTROL = /[\u0000-\u001F\u007F-\u009F]/g;
/* Invisibles i marques bidi: amb elles un nom es fa passar per un altre o gira
   el text que el seguix a la barra. A més de la llista del contracte, U+061C
   (marca bidi àrab) i U+2060–U+2064 (unió de paraules i operadors invisibles).
   Van escapats: el font no porta mai el caràcter cru, que no es veu en revisar. */
const INVISIBLES = /[\u{061C}\u{200B}-\u{200F}\u{202A}-\u{202E}\u{2060}-\u{2064}\u{2066}-\u{2069}\u{FEFF}]/gu;
const IDENTIFICADOR = /^[a-z0-9](?:[a-z0-9-]{0,62})$/;
const ORIGEN_FICTICI = 'http://x.invalid';
const PROHIBIT_A_RUTA = /[\\\s\u0000-\u001F\u007F-\u009F]/;
// El parser d'URL també pren %2e com a punt: '/a/%2e%2e/b' puja un nivell.
const SEGMENT_DE_PUNTS = /^(?:\.|%2e){1,2}$/i;

/**
 * Text curt i visible (el nom del poble a la barra). Els blancs de control
 * (\t, \n…) passen a espai, com fa sanitize_text_field; la resta de control i
 * els invisibles desapareixen. NFC després de llevar-los, perquè un invisible
 * entre lletra i accent no deixe l'eixida sense compondre. Es talla per punts
 * de codi: mai parteix un parell subrogat.
 */
export function sanejaEtiqueta(valor, maxim = LIMIT_ETIQUETA) {
  if (typeof valor !== 'string') return undefined;
  const limit = Number.isInteger(maxim) && maxim > 0 ? maxim : LIMIT_ETIQUETA;
  const net = valor
    .replace(INVISIBLES, '')
    .replace(CONTROL, c => (/\s/.test(c) ? ' ' : ''))
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
  if (!net) return undefined;
  return Array.from(net).slice(0, limit).join('').trimEnd();
}

/** Id d'element en minúscules, segur per a una URL tal qual. */
export function sanejaIdentificador(valor) {
  if (typeof valor !== 'string') return undefined;
  const id = valor.trim().toLowerCase();
  return IDENTIFICADOR.test(id) ? id : undefined;
}

/**
 * Ruta interna de l'app (camí + consulta, sense fragment). Mai un origen: ni
 * '//host', ni esquemes, ni barres invertides, ni segments que pugen.
 */
export function sanejaRuta(valor) {
  if (typeof valor !== 'string' || !valor.startsWith('/') || valor.startsWith('//')) return undefined;
  if (PROHIBIT_A_RUTA.test(valor)) return undefined;
  const cami = valor.split(/[?#]/, 1)[0];
  if (cami.split('/').some(segment => SEGMENT_DE_PUNTS.test(segment))) return undefined;
  let url;
  try { url = new URL(valor, ORIGEN_FICTICI); } catch { return undefined; }
  if (url.origin !== ORIGEN_FICTICI) return undefined;
  return url.pathname + url.search;
}

/** Pàgina del poble dins de l'app; un id inexistent mostra «Element no trobat». */
export function rutaDelPoble(poble) {
  const id = sanejaIdentificador(poble);
  return id ? `/pobles/${id}` : undefined;
}

/* El global el pot haver definit l'amfitrió amb un getter que llança: la lectura
   per defecte tampoc no pot trencar l'arrencada. */
function llegeixGlobal() {
  try { return globalThis.SocDePobleConfig; } catch { return undefined; }
}

/* Literal d'objecte o Object.create(null), també d'un altre reialme (iframe).
   Arrays, funcions, Map, Date i instàncies de classe no són configuració. */
function esObjectePla(valor) {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) return false;
  const proto = Object.getPrototypeOf(valor);
  return proto === null || Object.getPrototypeOf(proto) === null;
}

// Només claus pròpies: un Object.prototype contaminat no pot declarar un poble.
const propia = (font, clau) => (Object.hasOwn(font, clau) ? font[clau] : undefined);

/**
 * Llig el canal de l'amfitrió i torna un objecte congelat amb, com a màxim,
 * `nomPoble` i `poble`. Les claus absents o invàlides no hi apareixen.
 * `tenant` (nom de l'especificació T1) és àlies de `poble` només si `poble` no
 * s'ha declarat: una clau canònica invàlida no es substituïx per l'àlies.
 */
export function llegeixConfigAmfitrio(font = llegeixGlobal()) {
  try {
    if (!esObjectePla(font)) return Object.freeze({});
    const nomPoble = sanejaEtiqueta(propia(font, 'nomPoble'));
    const declarat = propia(font, 'poble');
    const poble = sanejaIdentificador(declarat !== undefined ? declarat : propia(font, 'tenant'));
    return Object.freeze({
      ...(nomPoble ? { nomPoble } : {}),
      ...(poble ? { poble } : {})
    });
  } catch {
    return Object.freeze({});
  }
}
