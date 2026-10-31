/**
 * motorMultimediaLocal.js — Motor del Gestor d'arxius locals del Mas
 * (`/multimedia` → «Carpeta local» · IDEA-54 + IDEA-55 · Onada 261029_1605).
 *
 * Tot passa a l'ordinador de la persona: res no puja a Internet. És l'únic
 * lloc d'on la interfície importa (també reexporta la biblioteca de carpetes
 * recordades i el suggeriment de poble, que viuen en mòduls germans plans).
 *
 * FONT (fontDesDeHandle, Chrome i Edge; fontDesDeFitxers, qualsevol navegador,
 * només lectura): { nom, handle, limitacions, carpetes, llista(), llig(ruta,
 * { midaMaxima }), info(ruta), fitxer(ruta) } i, només amb un handle que sap
 * escriure, escriu(ruta, bytes, { sobreescriu, creaCarpetes, modificatEsperat,
 * midaEsperada }) → { ruta, mida, sobreescrit, modificat } i les quatre
 * operacions físiques: mou, reanomena, creaCarpeta i elimina.
 *
 * Regles que no es negocien:
 *   · Rutes relatives amb «/», sense «..», «.», buits, barres inverses ni
 *     ocults del sistema (RUTA_INVALIDA), a l'origen i al destí. Les rutes que
 *     canvien el disc tampoc no porten invisibles (controls C0, DEL, C1 ni
 *     direcció del text): un nom així es llista i s'obri, però no es toca.
 *   · Escriure contingut només en la llista blanca (EXTENSIONS_ESCRIPTURA_LOCAL:
 *     text editable i webp); html, css, js, xml, vcf i log són de només lectura.
 *   · El permís readwrite és sempre la PRIMERA espera de cada operació
 *     d'escriptura (l'activació del clic de la persona caduca).
 *   · Moure i reanomenar = copiar per trossos de stream + verificar el
 *     contingut byte a byte, per trossos i per a qualsevol mida + recomprovar
 *     l'origen + esborrar-lo sense `recursive`. Mai sobreescriuen. Si la còpia
 *     és diferent, s'esborra la còpia i l'origen no es toca; si no s'ha pogut
 *     comparar, l'origen tampoc no s'esborra (MOVIMENT_INCOMPLET, amb la còpia
 *     conservada). Un canvi només de majúscules o de forma Unicode es refusa
 *     (NOM_EQUIVALENT): al disc del Mac és el mateix fitxer.
 *   · Desar un text amb la versió esperada (data i mida) es comprova dins de
 *     la cua de la font, just abans d'escriure (CONFLICTE_DISC).
 *   · Eliminar esborra del disc (no va a la Paperera): només fitxers i
 *     carpetes buides, sense `recursive`. La confirmació és de la interfície.
 *   · Cap blob: amb HTML, SVG, XML ni JS: `mimeDeVisorLocal` només dona MIME de
 *     ràster, àudio, vídeo i PDF; l'SVG només com a `data:` dins d'un <img>.
 * Errors: sempre ErrorArxiuLocal amb `codi` (CODIS_ERROR_ARXIU_LOCAL).
 */
import { llegixExif } from '../../components/universal/enquadrament/exif.js';
import { esHandleCarpetaLocal, verificaPermisCarpetaLocal } from './bibliotecaCarpetesLocals.js';

export {
  CODIS_BIBLIOTECA_LOCAL,
  MAX_CARPETES_RECORDADES,
  NOM_BD_ARXIUS_LOCALS,
  STORE_CARPETES_LOCALS,
  VERSIO_BD_ARXIUS_LOCALS,
  creaBibliotecaCarpetesLocals,
  desaCarpetaLocal,
  desaHandleCarpetaLocal,
  esHandleCarpetaLocal,
  llistaCarpetesLocalsRecordades,
  marcaAccesCarpetaLocal,
  nouIdCarpetaLocal,
  oblidaCarpetaLocal,
  oblidaHandleCarpetaLocal,
  oblidaTotesLesCarpetesLocals,
  recuperaCarpetaLocal,
  recuperaHandleCarpetaLocal,
  recuperaUltimaCarpetaLocal,
  verificaPermisCarpetaLocal,
  verificaPermisHandleLocal
} from './bibliotecaCarpetesLocals.js';

export {
  AMBITS_CATALEG_LOCAL,
  AVISOS_SUGGERIMENT_POBLE,
  CONFIANCES_SUGGERIMENT_POBLE,
  MOTIUS_CATEGORIA_LOCAL,
  MOTIUS_ORIGEN_LOCAL,
  MOTIUS_SUGGERIMENT_POBLE,
  NOMS_POBLE_AMBIGUS,
  RADI_COMARCA_KM,
  RADI_POBLE_ALTA_KM,
  RADI_POBLE_PROPER_KM,
  suggerixPobleLocal
} from './suggerimentPobleLocal.js';

/* ═══ Errors tipats ═══════════════════════════════════════════════════════ */

/** Tots els codis que llança el motor (la interfície en tradueix cadascun). */
export const CODIS_ERROR_ARXIU_LOCAL = Object.freeze([
  'RUTA_INVALIDA',
  'FONT_OBLIDADA',
  'FONT_ILLEGIBLE',
  'FITXER_ILLEGIBLE',
  'FITXER_MASSA_GRAN',
  'FITXER_JA_EXISTEIX',
  'CARPETA_NO_TROBADA',
  'ESCRIPTURA_DENEGADA',
  'ESCRIPTURA_NO_PERMESA',
  'ESCRIPTURA_FALLIDA',
  'NOMES_LECTURA',
  'NO_ES_TEXT',
  'NO_ES_UTF8',
  'NO_ES_WEBP',
  'CONFLICTE_DISC',
  'SENSE_CRIPTO',
  'PARAMETRES_INVALIDS',
  'SELECTOR_NO_DISPONIBLE',
  'SELECCIO_CANCELLADA',
  'CAL_GEST',
  'SELECTOR_FALLIT',
  'NOM_INVALID',
  'MATEIXA_RUTA',
  'NOM_EQUIVALENT',
  'EXTENSIO_NO_CONSERVADA',
  'NO_ES_FITXER',
  'CARPETA_NO_BUIDA',
  'MOVIMENT_NO_VERIFICAT',
  'MOVIMENT_INCOMPLET',
  'ORIGINAL_NO_MOGUT'
]);

/** Els codis de `font.limitacions` (avisos de l'última llista, no errors). */
export const CODIS_LIMITACIO_LOCAL = Object.freeze(['CARPETA_TRUNCADA', 'PROFUNDITAT_MAXIMA', 'FITXER_ILLEGIBLE', 'CARPETA_ILLEGIBLE']);

export class ErrorArxiuLocal extends Error {
  /**
   * @param {string} codi un de CODIS_ERROR_ARXIU_LOCAL
   * @param {string} missatge en valencià
   * @param {{ cause?: unknown, detall?: object }} [opcions]
   */
  constructor(codi, missatge, { cause, detall } = {}) {
    super(missatge, cause !== undefined ? { cause } : undefined);
    this.name = 'ErrorArxiuLocal';
    this.codi = codi;
    this.detall = detall ?? null;
  }
}

const falla = (codi, missatge, opcions) => new ErrorArxiuLocal(codi, missatge, opcions);

/* ═══ Tipus, extensions i MIME ════════════════════════════════════════════ */

export const EXTENSIONS_IMATGE_LOCAL = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif']);
export const EXTENSIONS_RASTER_CONVERTIBLE = new Set(['png', 'jpg', 'jpeg']);
export const EXTENSIONS_AUDIO_LOCAL = new Set(['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac']);
export const EXTENSIONS_VIDEO_LOCAL = new Set(['mp4', 'webm', 'mov', 'm4v']);
/** Text editable: l'única llista d'on l'editor pot escriure contingut. */
export const EXTENSIONS_TEXT_LOCAL = new Set(['md', 'markdown', 'txt', 'json', 'csv', 'tsv', 'yml', 'yaml', 'canvas']);
/** Text de només lectura: es mostra com a text pla, mai es renderitza ni s'hi escriu. */
export const EXTENSIONS_CODI_LOCAL = new Set(['html', 'htm', 'xhtml', 'css', 'js', 'mjs', 'xml', 'vcf', 'log']);
export const EXTENSIONS_DOC_LOCAL = new Set(['pdf', 'xls', 'xlsx', 'ods', 'doc', 'docx', 'odt']);
/** Llista blanca d'escriptura de contingut: el text editable i la bessona webp del laboratori. */
export const EXTENSIONS_ESCRIPTURA_LOCAL = new Set([...EXTENSIONS_TEXT_LOCAL, 'webp']);

export const MAX_BYTES_TEXT_EDITABLE = 2 * 1024 * 1024;
export const MAX_BYTES_HASH_FITXER = 50 * 1024 * 1024;
export const MAX_BYTES_SVG_DATA = 1024 * 1024;
export const MAX_LECTURA_IMATGE_LOCAL_BYTES = 50 * 1024 * 1024;
export const LLINDAR_WEBP_PES_ALT_BYTES = 350 * 1024;
export const LLINDAR_RASTER_PES_ALT_BYTES = 500 * 1024;
export const PRESSUPOST_DUPLICATS = Object.freeze({ maxFitxers: 500, maxBytes: 1024 ** 3 });
export const MIDA_PAGINA_ALBUM = 24;
export const MIDA_PAGINA_TAULA = 100;
export const MIME_DESCARREGA_LOCAL = 'application/octet-stream';
export const ID_SELECTOR_ARXIUS_LOCALS = 'sdp-arxius-locals';
export const CARPETA_ORIGINALS_RASTER = 'originals_raster_public';

const MIME_PER_EXTENSIO = Object.freeze({
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  flac: 'audio/flac',
  aac: 'audio/aac',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  m4v: 'video/mp4',
  md: 'text/markdown',
  markdown: 'text/markdown',
  txt: 'text/plain',
  json: 'application/json',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  yml: 'application/yaml',
  yaml: 'application/yaml',
  canvas: 'application/json',
  html: 'text/html',
  htm: 'text/html',
  xhtml: 'application/xhtml+xml',
  css: 'text/css',
  js: 'text/javascript',
  mjs: 'text/javascript',
  xml: 'application/xml',
  vcf: 'text/vcard',
  log: 'text/plain',
  pdf: 'application/pdf',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text'
});

/** Els únics MIME que poden fer un blob: per a pintar (ràster, àudio, vídeo i PDF). */
export const MIMES_VISOR_LOCAL = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac', 'audio/aac',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf'
]);

/* Extensions que mai es poden posar a un fitxer que en tenia una altra (un .png no es torna .html). */
const EXTENSIONS_CONEGUDES = new Set([
  ...Object.keys(MIME_PER_EXTENSIO),
  'exe', 'sh', 'bat', 'cmd', 'command', 'app', 'dmg', 'pkg', 'scr', 'ps1', 'vbs', 'jar', 'msi',
  'php', 'py', 'rb', 'pl', 'svgz', 'shtml', 'xht', 'hta', 'lnk', 'url', 'webloc', 'zip', 'rar', '7z'
]);

export function extensioDe(ruta = '') {
  const neta = String(ruta);
  const barra = neta.lastIndexOf('/');
  const nom = barra >= 0 ? neta.slice(barra + 1) : neta;
  const punt = nom.lastIndexOf('.');
  return punt > 0 ? nom.slice(punt + 1).toLowerCase() : '';
}

export function nomFitxerDe(ruta = '') {
  const neta = String(ruta);
  const barra = neta.lastIndexOf('/');
  return barra >= 0 ? neta.slice(barra + 1) : neta;
}

export function troncSenseExtensio(ruta = '') {
  const neta = String(ruta);
  const punt = neta.lastIndexOf('.');
  const barra = neta.lastIndexOf('/');
  return punt > barra + 1 ? neta.slice(0, punt) : neta;
}

export function nomBaseSenseExtensio(ruta = '') {
  const nom = nomFitxerDe(ruta);
  const punt = nom.lastIndexOf('.');
  return punt > 0 ? nom.slice(0, punt).toLowerCase() : nom.toLowerCase();
}

export function subcarpetaPrincipalDe(ruta = '') {
  const neta = String(ruta);
  const barra = neta.indexOf('/');
  return barra > 0 ? neta.slice(0, barra) : '(arrel)';
}

/** La carpeta d'una ruta ('' si és a l'arrel). */
export function carpetaDeRuta(ruta = '') {
  const neta = String(ruta);
  const barra = neta.lastIndexOf('/');
  return barra > 0 ? neta.slice(0, barra) : '';
}

/**
 * La família d'un arxiu: 'imatge', 'audio', 'video', 'text' (editable),
 * 'codi' (text de només lectura), 'document' (sense vista de text) o 'altre'.
 */
export function tipusMitjaDe(ruta = '') {
  const ext = extensioDe(ruta);
  if (EXTENSIONS_IMATGE_LOCAL.has(ext)) return 'imatge';
  if (EXTENSIONS_AUDIO_LOCAL.has(ext)) return 'audio';
  if (EXTENSIONS_VIDEO_LOCAL.has(ext)) return 'video';
  if (EXTENSIONS_TEXT_LOCAL.has(ext)) return 'text';
  if (EXTENSIONS_CODI_LOCAL.has(ext)) return 'codi';
  if (EXTENSIONS_DOC_LOCAL.has(ext)) return 'document';
  return 'altre';
}

/** Cert si la persona pot editar el contingut d'este arxiu (text editable). */
export const esTextEditableLocal = (ruta = '') => EXTENSIONS_TEXT_LOCAL.has(extensioDe(ruta));

/** Cert si l'arxiu es pot llegir com a text (editable o de només lectura). */
export const esTextLlegibleLocal = (ruta = '') => {
  const ext = extensioDe(ruta);
  return EXTENSIONS_TEXT_LOCAL.has(ext) || EXTENSIONS_CODI_LOCAL.has(ext);
};

/**
 * Com es mostra al detall: 'imatge' (ràster), 'svg', 'text', 'codi', 'audio',
 * 'video', 'pdf' o 'cap' (només descàrrega). Derivada de tipusMitjaDe.
 */
export function vistaDe(ruta = '') {
  const ext = extensioDe(ruta);
  const tipus = tipusMitjaDe(ruta);
  if (tipus === 'imatge') return ext === 'svg' ? 'svg' : 'imatge';
  if (tipus === 'text' || tipus === 'codi' || tipus === 'audio' || tipus === 'video') return tipus;
  if (tipus === 'document' && ext === 'pdf') return 'pdf';
  return 'cap';
}

/** La vista d'una extensió soleta ('png', 'md'…). */
export const vistaDeExtensio = (ext = '') => vistaDe(`x.${String(ext).toLowerCase()}`);

/** El MIME informatiu d'una ruta (per a mostrar-lo). Mai es fa servir per a un blob: visible. */
export function mimeDeRuta(ruta = '') {
  return MIME_PER_EXTENSIO[extensioDe(ruta)] || MIME_DESCARREGA_LOCAL;
}

/**
 * El MIME amb què es pot fer un blob: per a pintar (img, audio, video o pestanya
 * de PDF), o null si l'arxiu no se'n pot fer cap (SVG, HTML, text, codi…).
 */
export function mimeDeVisorLocal(ruta = '') {
  const mime = MIME_PER_EXTENSIO[extensioDe(ruta)];
  return mime && MIMES_VISOR_LOCAL.has(mime) ? mime : null;
}

/* Un formatador de MB per locale (crear-ne un a cada cel·la és car). */
const FORMATS_MB = new Map();
function xifraMb(valor, locale) {
  let format = FORMATS_MB.get(locale);
  if (!format) {
    try {
      format = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch {
      format = new Intl.NumberFormat('ca', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (FORMATS_MB.size < 16) FORMATS_MB.set(locale, format);
  }
  return format.format(valor);
}

/**
 * La mida per a la persona, en la llengua de la interfície (`locale`, el de
 * UIContext; sense, el valencià): «2,50 MB» en ca/es/eu/gl, «2.50 MB» en en.
 * Gauntlet 261029 (cicle 1, i18n) · Abans, sempre amb punt decimal, i un
 * fitxer de 0 bytes deia «1 KB». Ara 0 (o una mida invàlida) és «0 KB»; d'1
 * a 1.023 bytes, «1 KB» (la convenció dels exploradors d'arxius), i el que
 * arredonix a 1.024 KB ja es diu «1,00 MB».
 */
export function formatKb(bytes = 0, locale = 'ca') {
  const n = Number(bytes) || 0;
  if (n <= 0) return '0 KB';
  if (Math.round(n / 1024) >= 1024) return `${xifraMb(n / (1024 * 1024), locale || 'ca')} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

/* ═══ Rutes segures i noms nous ═══════════════════════════════════════════ */

const INTERNS_FONT_LOCAL = new WeakMap();
const NOMS_OCULTS_SISTEMA = new Set(['.ds_store', '.git', '__macosx', 'thumbs.db', 'desktop.ini']);

function esRutaOcultaLocal(ruta = '') {
  return String(ruta)
    .split('/')
    .some((segment) => {
      const s = segment.trim().toLowerCase();
      return !s || s.startsWith('.') || NOMS_OCULTS_SISTEMA.has(s);
    });
}

function segmentsSegursLocal(ruta) {
  const segs = typeof ruta === 'string' ? ruta.split('/') : [];
  if (
    segs.length === 0 ||
    segs.some((s) => s === '' || s === '.' || s === '..' || s.includes('\\')) ||
    esRutaOcultaLocal(ruta)
  ) {
    throw falla('RUTA_INVALIDA', `La ruta «${String(ruta)}» no és d'un fitxer de la carpeta local.`);
  }
  return segs;
}

/** Cert si la ruta és relativa, sense trampes i sense ocults del sistema. */
export function esRutaSeguraLocal(ruta) {
  try {
    segmentsSegursLocal(ruta);
    return true;
  } catch {
    return false;
  }
}

/* La clau amb què el disc del Mac (APFS) compara noms: sense majúscules i en NFC. */
const clauDisc = (text) => String(text).normalize('NFC').toLowerCase();

const PROHIBITS_NOM = new Set(['\\', '/', ':', '*', '?', '"', '<', '>', '|']);
/* Controls de direcció del text: amaguen la vertadera extensió («gnp.exe»). */
const ES_BIDI = (cp) => (cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069) || cp === 0x200e || cp === 0x200f || cp === 0x061c;
/* Invisibles que cap ruta de MUTACIÓ pot portar: controls C0 (U+0000-U+001F), DEL i C1
   (U+007F-U+009F) i els de direcció del text. */
const ES_INVISIBLE = (cp) => cp < 0x20 || (cp >= 0x7f && cp <= 0x9f) || ES_BIDI(cp);
/** Cert si el punt de codi és un d'estos invisibles (la presentació els fa visibles: suportGestorLocal.js). */
export const esCaracterInvisibleLocal = (cp) => ES_INVISIBLE(cp);

/**
 * El validador comú de les rutes que CANVIEN el disc (escriu, mou origen i destí,
 * reanomena, creaCarpeta, elimina i les funcions que les fan servir): el de lectura
 * (cap '.', '..', segment buit, barra inversa ni ocult del sistema) i, a més, cap
 * caràcter invisible. Un nom existent amb invisibles es pot llistar i obrir (la
 * lectura fa servir segmentsSegursLocal), però el Mas no el crea, ni el mou, ni
 * l'esborra: RUTA_INVALIDA amb `detall.motiu = 'CARACTERS_INVISIBLES'`.
 */
function segmentsMutacioLocal(ruta) {
  const segs = segmentsSegursLocal(ruta);
  for (const segment of segs) {
    for (const caracter of segment) {
      if (ES_INVISIBLE(caracter.codePointAt(0))) {
        throw falla('RUTA_INVALIDA', 'La ruta porta caràcters invisibles (de control o de direcció del text): des del Mas només es pot llegir.', {
          detall: { motiu: 'CARACTERS_INVISIBLES' }
        });
      }
    }
  }
  return segs;
}

/** Cert si el Mas pot escriure, moure, reanomenar o esborrar en esta ruta (cap invisible). */
export function esRutaEscrivibleLocal(ruta) {
  try {
    segmentsMutacioLocal(ruta);
    return true;
  } catch {
    return false;
  }
}
const RESERVATS_WINDOWS = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const MAX_BYTES_NOM = 255;
const codificador = new TextEncoder();
const bytesUtf8 = (text) => codificador.encode(text).byteLength;

/* El nom net (sense extensió), o '' si no en queda res de vàlid. */
function netejaBaseLocal(text, { treuExtensio = '', maxim = 120 } = {}) {
  let net = '';
  for (const caracter of String(text ?? '').normalize('NFC')) {
    const cp = caracter.codePointAt(0);
    if (ES_INVISIBLE(cp)) continue;
    net += PROHIBITS_NOM.has(caracter) ? '-' : caracter;
  }
  net = net.replace(/\s+/g, ' ').trim();
  if (treuExtensio && net.toLowerCase().endsWith(`.${treuExtensio.toLowerCase()}`)) {
    net = net.slice(0, net.length - treuExtensio.length - 1);
  }
  net = net.replace(/^[.\-\s]+/, '').replace(/[.\s]+$/, '');
  const punts = Array.from(net);
  if (punts.length > maxim) net = punts.slice(0, maxim).join('').replace(/[.\s]+$/, '');
  if (!net || RESERVATS_WINDOWS.test(net)) return '';
  return net;
}

/* Talla la base fins que `base.ext` cap en 255 bytes UTF-8. */
function ajustaBytes(base, ext) {
  const sufix = ext ? `.${ext}` : '';
  let punts = Array.from(base);
  while (punts.length > 0 && bytesUtf8(punts.join('') + sufix) > MAX_BYTES_NOM) punts = punts.slice(0, -1);
  const tallada = punts.join('').replace(/[.\s]+$/, '');
  return tallada ? `${tallada}${sufix}` : '';
}

const dosXifres = (n) => String(n).padStart(2, '0');

/**
 * Un nom de fitxer segur per a crear-lo: NFC, sense controls ni caràcters
 * prohibits, sense punts inicials, com a molt `maxim` punts de codi i 255 bytes.
 * Si no en queda res (o és un nom reservat de Windows), `nota-AAAAMMDD-HHMM`.
 * @param {string} nom
 * @param {{ extensio?: string, maxim?: number, ara?: () => number }} [opcions]
 * @returns {string}
 */
export function nomSegurDeFitxerLocal(nom, { extensio = 'md', maxim = 120, ara = Date.now } = {}) {
  const ext = /^[a-z0-9]{1,10}$/i.test(String(extensio)) ? String(extensio).toLowerCase() : 'md';
  const limit = Number.isSafeInteger(maxim) && maxim > 0 ? maxim : 120;
  let base = netejaBaseLocal(typeof nom === 'string' ? nom : '', { treuExtensio: ext, maxim: limit });
  if (!base) {
    const d = new Date(typeof ara === 'function' ? ara() : Date.now());
    base = `nota-${d.getFullYear()}${dosXifres(d.getMonth() + 1)}${dosXifres(d.getDate())}-${dosXifres(d.getHours())}${dosXifres(d.getMinutes())}`;
  }
  return ajustaBytes(base, ext);
}

/** Un nom de carpeta segur, o null si no en queda cap de vàlid. */
export function nomSegurDeCarpetaLocal(nom) {
  const base = netejaBaseLocal(typeof nom === 'string' ? nom : '', { maxim: 120 });
  return base ? ajustaBytes(base, '') || null : null;
}

/* El nom nou d'un reanomenat: conserva l'extensió de l'original, tal com és al disc. */
function nomNouAmbExtensio(nouNom, nomOriginal) {
  if (typeof nouNom !== 'string' || nouNom.includes('/') || nouNom.includes('\\')) {
    throw falla('NOM_INVALID', 'El nom nou no pot estar buit ni portar barres.');
  }
  const punt = nomOriginal.lastIndexOf('.');
  const extOriginal = punt > 0 ? nomOriginal.slice(punt + 1) : '';
  let base = nouNom.normalize('NFC').trim();
  const extNou = extensioDe(base);
  if (extNou && extOriginal && extNou === extOriginal.toLowerCase()) {
    base = base.slice(0, base.length - extNou.length - 1);
  } else if (extNou && EXTENSIONS_CONEGUDES.has(extNou)) {
    throw falla('EXTENSIO_NO_CONSERVADA', `El fitxer ha de conservar l'extensió «.${extOriginal || '(cap)'}».`);
  }
  const net = netejaBaseLocal(base, { maxim: 120 });
  const final = net ? ajustaBytes(net, extOriginal) : '';
  if (!final) throw falla('NOM_INVALID', `«${nouNom}» no és un nom vàlid per a un fitxer.`);
  return final;
}

/* Un nom que ve d'una persona per al destí d'un moviment: ha de ser vàlid tal qual. */
function exigixNomNouValid(nom) {
  const ext = extensioDe(nom);
  const base = ext ? nom.slice(0, nom.length - ext.length - 1) : nom;
  const net = netejaBaseLocal(base, { maxim: Number.MAX_SAFE_INTEGER });
  if (!net || net !== base || bytesUtf8(nom) > MAX_BYTES_NOM) {
    throw falla('NOM_INVALID', `«${nom}» no és un nom vàlid per a un fitxer.`);
  }
}

/** La ruta d'un fitxer mogut a una carpeta ('' o '(arrel)' és l'arrel). */
export function rutaDestiDeMoviment(rutaOrigen, carpetaDesti = '') {
  const nom = nomFitxerDe(rutaOrigen);
  const carpeta = typeof carpetaDesti === 'string' ? carpetaDesti.replace(/\/+$/, '') : '';
  return carpeta && carpeta !== '(arrel)' ? `${carpeta}/${nom}` : nom;
}

/**
 * On va l'original ràster en «Desar .webp i moure l'original»:
 * `originals_raster_public/` + la ruta sense la primera subcarpeta (si és a
 * l'arrel, només el nom).
 */
export function rutaOriginalsRasterDe(ruta = '') {
  const segs = String(ruta).split('/');
  return segs.length > 1
    ? [CARPETA_ORIGINALS_RASTER, ...segs.slice(1)].join('/')
    : `${CARPETA_ORIGINALS_RASTER}/${segs[0]}`;
}

/** Cert si té sentit oferir «Desar .webp i moure l'original» per a esta ruta. */
export function potMoureOriginalRaster(ruta = '') {
  if (!esRutaEscrivibleLocal(ruta) || !EXTENSIONS_RASTER_CONVERTIBLE.has(extensioDe(ruta))) return false;
  const segs = String(ruta).split('/');
  return segs.length === 1 || clauDisc(segs[0]) !== CARPETA_ORIGINALS_RASTER;
}

/* ═══ Bytes ═══════════════════════════════════════════════════════════════ */

/* Uint8Array, una vista o un ArrayBuffer (toString: instanceof falla entre reialmes de jsdom). */
function bytesDe(bytes) {
  if (bytes instanceof Uint8Array) return bytes;
  if (ArrayBuffer.isView(bytes)) return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (Object.prototype.toString.call(bytes) === '[object ArrayBuffer]') return new Uint8Array(bytes);
  throw falla('PARAMETRES_INVALIDS', 'Per a escriure calen bytes (Uint8Array o ArrayBuffer).');
}

const enterPositiu = (valor, perDefecte) => (Number.isSafeInteger(valor) && valor > 0 ? valor : perDefecte);

const hexDe = (buffer) => Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');

/* Cert si els dos trossos tenen els mateixos bytes (de 4 en 4 quan l'alineació ho deixa). */
function bytesIguals(a, b) {
  if (a.byteLength !== b.byteLength) return false;
  let i = 0;
  if (a.byteOffset % 4 === 0 && b.byteOffset % 4 === 0) {
    const paraules = a.byteLength >>> 2;
    const pa = new Uint32Array(a.buffer, a.byteOffset, paraules);
    const pb = new Uint32Array(b.buffer, b.byteOffset, paraules);
    for (let p = 0; p < paraules; p += 1) if (pa[p] !== pb[p]) return false;
    i = paraules << 2;
  }
  for (; i < a.byteLength; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * La mida dels trossos amb què es copia (sense stream) i es verifica una còpia:
 * 4 MiB. Mai es llig cap fitxer sencer: com a molt, dos trossos en memòria.
 */
export const MIDA_TROS_VERIFICACIO_LOCAL = 4 * 1024 * 1024;

/* Els bytes [inici, fi) d'un Blob, llegits amb slice() + arrayBuffer() (sense SubtleCrypto
   ni stream). Llança si l'API no hi és o si el tros no fa la mida esperada. */
async function llegixTros(blob, inici, fi) {
  if (typeof blob?.slice !== 'function') throw new Error('Este navegador no pot llegir un fitxer per trossos.');
  const tros = blob.slice(inici, fi);
  if (typeof tros?.arrayBuffer !== 'function') throw new Error('Este navegador no pot llegir un fitxer per trossos.');
  const bytes = new Uint8Array(await tros.arrayBuffer());
  if (bytes.byteLength !== fi - inici) throw new Error(`Tros curt: ${bytes.byteLength} bytes de ${fi - inici}.`);
  return bytes;
}

/* Error intern: els dos fitxers són diferents (no és una lectura fallida). */
class ContingutDiferent extends Error {}

/**
 * Compara el contingut de dos fitxers per trossos de MIDA_TROS_VERIFICACIO_LOCAL,
 * per a qualsevol mida i amb memòria constant. Torna si són idèntics; llança
 * ContingutDiferent si no ho són, i qualsevol altre error si no s'han pogut llegir
 * (llavors el contingut NO està verificat). `abansDeCadaTros` pot aturar-la.
 */
async function comparaContingutPerTrossos(a, b, { abansDeCadaTros = null } = {}) {
  if (a.size !== b.size) throw new ContingutDiferent(`Mida: ${b.size} i ${a.size}.`);
  for (let inici = 0; inici < a.size; inici += MIDA_TROS_VERIFICACIO_LOCAL) {
    if (typeof abansDeCadaTros === 'function') abansDeCadaTros();
    const fi = Math.min(a.size, inici + MIDA_TROS_VERIFICACIO_LOCAL);
    const [ta, tb] = await Promise.all([llegixTros(a, inici, fi), llegixTros(b, inici, fi)]);
    if (!bytesIguals(ta, tb)) throw new ContingutDiferent(`Bytes diferents a partir del byte ${inici}.`);
  }
}

/** Cert si els bytes són d'un WebP: 'RIFF' a 0 i 'WEBP' a 8. */
export function esBytesWebp(bytes) {
  if (!ArrayBuffer.isView(bytes) || bytes.byteLength < 12) return false;
  const b = bytesDe(bytes);
  return b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
    && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
}

/** Cert si els bytes comencen per la signatura d'un PDF («%PDF-»). */
export function esBytesPdf(bytes) {
  if (!ArrayBuffer.isView(bytes) || bytes.byteLength < 5) return false;
  const b = bytesDe(bytes);
  return b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d;
}

/**
 * Un SVG com a `data:image/svg+xml;base64,…` per a un <img> (on no s'executa
 * cap script), o null si passa d'1 MiB. Mai un blob:.
 */
export function dataUrlSvgLocal(bytes) {
  if (!ArrayBuffer.isView(bytes) || bytes.byteLength > MAX_BYTES_SVG_DATA) return null;
  const b = bytesDe(bytes);
  let binari = '';
  for (let i = 0; i < b.byteLength; i += 0x8000) {
    binari += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  }
  return `data:image/svg+xml;base64,${btoa(binari)}`;
}

/* ═══ Selector ════════════════════════════════════════════════════════════ */

/* Gauntlet 261029 c1 (selector-carpetes-iframe-alie) · Dins d'un marc d'un
   altre origen (el pont d'iframe de l'amfitrió), Chrome exposa
   showDirectoryPicker però el rebutja sempre amb SecurityError: el marc és
   alié si la pàgina de dalt no es deixa llegir. Sense `top`, o si `top` és el
   mateix entorn, no hi ha marc. */
function esMarcAlie(entorn) {
  try {
    const dalt = entorn.top;
    if (!dalt || dalt === entorn) return false;
    return typeof dalt.location.href !== 'string';
  } catch {
    return true;
  }
}

/**
 * Cert si es pot obrir el selector de carpetes del sistema: l'API hi és i no
 * som en un marc d'un altre origen (llavors, la reserva de triar fitxers).
 * @param {object} [entorn] per defecte, globalThis
 * @returns {boolean}
 */
export function potTriarCarpeta(entorn = globalThis) {
  return typeof entorn?.showDirectoryPicker === 'function' && !esMarcAlie(entorn);
}

/**
 * Obri el selector de carpetes del sistema. Cal cridar-la DINS del gestor del
 * clic de la persona (primera espera).
 * @param {{ mode?: 'read'|'readwrite', entorn?: object, id?: string }} [opcions]
 * @returns {Promise<FileSystemDirectoryHandle>}
 */
export async function demanaCarpeta({ mode = 'read', entorn = globalThis, id = ID_SELECTOR_ARXIUS_LOCALS } = {}) {
  if (mode !== 'read' && mode !== 'readwrite') throw falla('PARAMETRES_INVALIDS', 'El mode ha de ser read o readwrite.');
  if (!potTriarCarpeta(entorn)) {
    throw falla('SELECTOR_NO_DISPONIBLE', 'Este navegador no pot obrir el selector de carpetes: tria la carpeta amb el botó de seleccionar fitxers.');
  }
  const opcions = typeof id === 'string' && /^[\w-]{1,32}$/.test(id) ? { mode, id } : { mode };
  try {
    return await entorn.showDirectoryPicker(opcions);
  } catch (error) {
    if (error?.name === 'AbortError') throw falla('SELECCIO_CANCELLADA', "No s'ha triat cap carpeta.", { cause: error });
    if (error?.name === 'SecurityError' || error?.name === 'NotAllowedError') {
      throw falla('CAL_GEST', "El navegador només obri el selector just després d'un clic teu: torna a prémer el botó.", { cause: error });
    }
    throw falla('SELECTOR_FALLIT', "No s'ha pogut obrir la carpeta local.", { cause: error });
  }
}

/* ═══ Font ════════════════════════════════════════════════════════════════ */

async function* fillsDirectori(directori) {
  if (typeof directori?.entries === 'function') {
    for await (const [nom, fill] of directori.entries()) yield [nom, fill];
  } else if (typeof directori?.values === 'function') {
    for await (const fill of directori.values()) yield [fill?.name, fill];
  }
}

function viu(font) {
  const intern = INTERNS_FONT_LOCAL.get(font);
  if (!intern || intern.oblidada) throw falla('FONT_OBLIDADA', "La carpeta local s'ha desconnectat: torna-la a obrir.");
  return intern;
}

const massaGran = (ruta, maxima) => falla('FITXER_MASSA_GRAN',
  `«${ruta}» fa més de ${Math.max(1, Math.round(maxima / (1024 * 1024)))} MB: no es llig.`);

async function carpetaDe(arrel, segs, { crea = false } = {}) {
  let directori = arrel;
  for (const s of segs) directori = await directori.getDirectoryHandle(s, crea ? { create: true } : undefined);
  return directori;
}

async function exigixEscriptura(arrel) {
  if ((await verificaPermisCarpetaLocal(arrel, { mode: 'readwrite', demana: true })) !== 'granted') {
    throw falla('ESCRIPTURA_DENEGADA', "No hi ha permís per a escriure en la carpeta: accepta'l quan el navegador te'l demane.");
  }
}

async function mateixaEntrada(a, b) {
  if (a === b) return true;
  try {
    return typeof a?.isSameEntry === 'function' && (await a.isSameEntry(b)) === true;
  } catch {
    return false;
  }
}

/* L'expectativa de versió d'una escriptura: null (cap) o { modificat, mida } (null = no es mira). */
function expectativaDeVersio(modificatEsperat, midaEsperada) {
  const senseModificat = modificatEsperat === null || modificatEsperat === undefined;
  const senseMida = midaEsperada === null || midaEsperada === undefined;
  if (senseModificat && senseMida) return null;
  if (!senseModificat && !Number.isFinite(modificatEsperat)) {
    throw falla('PARAMETRES_INVALIDS', 'La data esperada del fitxer ha de ser un nombre.');
  }
  if (!senseMida && !(Number.isSafeInteger(midaEsperada) && midaEsperada >= 0)) {
    throw falla('PARAMETRES_INVALIDS', 'La mida esperada del fitxer ha de ser un enter positiu.');
  }
  return { modificat: senseModificat ? null : modificatEsperat, mida: senseMida ? null : midaEsperada };
}

/* Just abans d'escriure: el fitxer del disc és encara la versió esperada? Si no, CONFLICTE_DISC. */
async function comprovaVersioEsperada(existent, esperat, ruta) {
  const desaparegut = (cause) => falla('CONFLICTE_DISC', `«${ruta}» ha desaparegut del disc des que l'has obert.`, cause ? { cause } : undefined);
  if (!existent) throw desaparegut();
  let actual;
  try {
    actual = await existent.getFile();
  } catch (error) {
    if (error?.name === 'NotFoundError') throw desaparegut(error);
    throw falla('ESCRIPTURA_FALLIDA', `No s'ha pogut comprovar «${ruta}» abans d'escriure: no s'ha canviat res.`, { cause: error });
  }
  const modificat = actual.lastModified || 0;
  if ((esperat.modificat !== null && modificat !== esperat.modificat) || (esperat.mida !== null && actual.size !== esperat.mida)) {
    throw falla('CONFLICTE_DISC', `«${ruta}» ha canviat al disc des que l'has obert (potser un altre programa).`, {
      detall: { modificat, mida: actual.size }
    });
  }
}

/* Copia el fitxer per trossos de stream (o, sense stream, de MIDA_TROS_VERIFICACIO_LOCAL):
   mai sencer en memòria. Avisa de cada tros (i `enTros` pot aturar la còpia llançant). */
async function copiaPerTrossos(fitxer, escriptor, enTros) {
  if (typeof fitxer.stream !== 'function') {
    for (let inici = 0; inici < fitxer.size; inici += MIDA_TROS_VERIFICACIO_LOCAL) {
      const tros = await llegixTros(fitxer, inici, Math.min(fitxer.size, inici + MIDA_TROS_VERIFICACIO_LOCAL));
      await escriptor.write(tros);
      enTros(tros);
    }
    return;
  }
  const lector = fitxer.stream().getReader();
  let acabat = false;
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done) {
        acabat = true;
        break;
      }
      const tros = bytesDe(value);
      if (tros.byteLength === 0) continue;
      await escriptor.write(tros);
      enTros(tros);
    }
  } finally {
    if (!acabat) {
      try { await lector.cancel(); } catch { /* ja tancat */ }
    }
    try { lector.releaseLock(); } catch { /* ja alliberat */ }
  }
}

/**
 * Font sobre un FileSystemDirectoryHandle (Chrome i Edge).
 * @param {FileSystemDirectoryHandle} arrel
 * @param {{ profunditat?: number, maxFitxers?: number, maxBytesFitxer?: number, extensionsEscriptura?: Iterable<string> }} [opcions]
 */
export function fontDesDeHandle(arrel, opcions = {}) {
  if (!esHandleCarpetaLocal(arrel)) {
    throw falla('PARAMETRES_INVALIDS', 'Cal una carpeta triada amb el selector del sistema.');
  }
  const profunditatMax = enterPositiu(opcions.profunditat, 12);
  const maxFitxers = enterPositiu(opcions.maxFitxers, 10000);
  const maxBytesFitxer = enterPositiu(opcions.maxBytesFitxer, MAX_LECTURA_IMATGE_LOCAL_BYTES);
  /* Es pot estrényer la llista blanca, mai eixamplar-la. */
  const permeses = new Set(
    (opcions.extensionsEscriptura ? Array.from(opcions.extensionsEscriptura) : [...EXTENSIONS_ESCRIPTURA_LOCAL])
      .map((e) => String(e).toLowerCase())
      .filter((e) => EXTENSIONS_ESCRIPTURA_LOCAL.has(e))
  );
  const nom = typeof arrel.name === 'string' && arrel.name ? arrel.name : '_multimedia_de_poble';
  let limitacions = Object.freeze([]);
  let carpetes = Object.freeze([]);

  const fitxerDe = async (a, segs) => {
    const directori = await carpetaDe(a, segs.slice(0, -1));
    return (await directori.getFileHandle(segs[segs.length - 1])).getFile();
  };

  const font = {
    get nom() {
      return nom;
    },
    get limitacions() {
      const intern = INTERNS_FONT_LOCAL.get(font);
      return intern && !intern.oblidada ? limitacions : Object.freeze([]);
    },
    /** Totes les carpetes recorregudes en l'última llista (també les buides). */
    get carpetes() {
      const intern = INTERNS_FONT_LOCAL.get(font);
      return intern && !intern.oblidada ? carpetes : Object.freeze([]);
    },
    get handle() {
      const intern = INTERNS_FONT_LOCAL.get(font);
      return intern && !intern.oblidada ? intern.arrel ?? null : null;
    },

    async llista() {
      const { arrel: a } = viu(font);
      const entrades = [];
      const dirs = [];
      let truncada = false;
      let fonda = false;
      let illegibles = 0;
      let carpetesIllegibles = 0;

      const recorre = async (directori, prefix, nivell) => {
        for await (const [nomFill, fill] of fillsDirectori(directori)) {
          if (truncada) return;
          if (typeof nomFill !== 'string' || nomFill === '' || esRutaOcultaLocal(nomFill)) continue;
          const ruta = prefix ? `${prefix}/${nomFill}` : nomFill;
          if (fill?.kind === 'directory') {
            if (nivell >= profunditatMax) {
              fonda = true;
              continue;
            }
            dirs.push(ruta);
            try {
              await recorre(fill, ruta, nivell + 1);
            } catch (error) {
              if (error instanceof ErrorArxiuLocal) throw error;
              carpetesIllegibles += 1;
            }
          } else if (fill?.kind === 'file') {
            if (entrades.length >= maxFitxers) {
              truncada = true;
              return;
            }
            try {
              const f = await fill.getFile();
              entrades.push({ ruta, mida: f.size, modificat: f.lastModified || 0 });
            } catch {
              illegibles += 1;
            }
          }
        }
      };

      try {
        await recorre(a, '', 1);
      } catch (error) {
        if (error instanceof ErrorArxiuLocal) throw error;
        throw falla('FONT_ILLEGIBLE', "No s'ha pogut recórrer la carpeta: potser ja no hi ha permís.", { cause: error });
      }
      viu(font);
      const avisos = [];
      if (truncada) avisos.push({ codi: 'CARPETA_TRUNCADA', missatge: `S'han llistat els primers ${maxFitxers} fitxers.` });
      if (fonda) avisos.push({ codi: 'PROFUNDITAT_MAXIMA', missatge: `Hi ha carpetes a més de ${profunditatMax} nivells: no s'han recorregut.` });
      if (illegibles > 0) {
        avisos.push({
          codi: 'FITXER_ILLEGIBLE',
          missatge: illegibles === 1 ? "Un fitxer no s'ha pogut obrir i no es llista." : `${illegibles} fitxers no s'han pogut obrir i no es llisten.`
        });
      }
      if (carpetesIllegibles > 0) {
        avisos.push({ codi: 'CARPETA_ILLEGIBLE', missatge: `${carpetesIllegibles} carpeta(es) no s'han pogut recórrer.` });
      }
      limitacions = Object.freeze(avisos.map((a2) => Object.freeze(a2)));
      carpetes = Object.freeze(dirs.sort((x, y) => x.localeCompare(y)));
      return entrades.sort((x, y) => x.ruta.localeCompare(y.ruta));
    },

    async llig(ruta, { midaMaxima } = {}) {
      const { arrel: a } = viu(font);
      const segs = segmentsSegursLocal(ruta);
      const limit = Math.min(maxBytesFitxer, enterPositiu(midaMaxima, maxBytesFitxer));
      let fitxer;
      try {
        fitxer = await fitxerDe(a, segs);
      } catch (error) {
        throw falla('FITXER_ILLEGIBLE', `No s'ha pogut obrir «${ruta}».`, { cause: error });
      }
      if (fitxer.size > limit) throw massaGran(ruta, limit);
      let dades;
      try {
        dades = await fitxer.arrayBuffer();
      } catch (error) {
        throw falla('FITXER_ILLEGIBLE', `No s'ha pogut llegir «${ruta}».`, { cause: error });
      }
      viu(font);
      return new Uint8Array(dades);
    },

    async info(ruta) {
      const { arrel: a } = viu(font);
      const segs = segmentsSegursLocal(ruta);
      let fitxer;
      try {
        fitxer = await fitxerDe(a, segs);
      } catch (error) {
        throw falla('FITXER_ILLEGIBLE', `No s'ha pogut obrir «${ruta}».`, { cause: error });
      }
      viu(font);
      return Object.freeze({ ruta: segs.join('/'), mida: fitxer.size, modificat: fitxer.lastModified || 0 });
    },

    /** Un Blob de l'arxiu sense copiar-ne els bytes, amb un tipus segur (mai text/html ni svg). */
    async fitxer(ruta) {
      const { arrel: a } = viu(font);
      const segs = segmentsSegursLocal(ruta);
      let fitxer;
      try {
        fitxer = await fitxerDe(a, segs);
      } catch (error) {
        throw falla('FITXER_ILLEGIBLE', `No s'ha pogut obrir «${ruta}».`, { cause: error });
      }
      viu(font);
      return fitxer.slice(0, fitxer.size, mimeDeVisorLocal(ruta) || MIME_DESCARREGA_LOCAL);
    }
  };

  /* ── Escriptura i operacions físiques: només amb un handle que sap escriure ── */
  let ops = null;
  if (typeof arrel.getFileHandle === 'function') {
    /* Les escriptures i les operacions físiques d'una mateixa font van d'una en una: un doble
       clic no pot fer córrer dos moviments del mateix fitxer alhora. */
    let cua = Promise.resolve();
    const enOrdre = (feina) => {
      const resultat = cua.then(() => feina());
      cua = resultat.then(() => undefined, () => undefined);
      return resultat;
    };

    /* `modificatEsperat` i `midaEsperada` (QA-A03): la versió que la persona va obrir. Es
       comproven ací dins, en la cua i just abans d'escriure: dues escriptures encuades amb
       la mateixa expectativa o un canvi de fora mentre esperava donen CONFLICTE_DISC. */
    const escriu = async (ruta, bytes, { sobreescriu = false, creaCarpetes = false, modificatEsperat = null, midaEsperada = null } = {}) => {
      viu(font);
      const segs = segmentsMutacioLocal(ruta);
      const nomFitxer = segs[segs.length - 1];
      const ext = extensioDe(nomFitxer);
      if (!permeses.has(ext)) {
        throw falla('ESCRIPTURA_NO_PERMESA', `Des d'ací només s'escriuen fitxers ${[...permeses].map((e) => `.${e}`).join(', ')}.`);
      }
      const dades = bytesDe(bytes);
      if (ext === 'webp' && !esBytesWebp(dades)) throw falla('NO_ES_WEBP', 'Els bytes no són d’una imatge WebP.');
      const esperat = expectativaDeVersio(modificatEsperat, midaEsperada);
      const { arrel: a } = viu(font);
      await exigixEscriptura(a);
      viu(font);
      let directori;
      try {
        directori = await carpetaDe(a, segs.slice(0, -1), { crea: creaCarpetes === true });
      } catch (error) {
        throw falla('CARPETA_NO_TROBADA', `La carpeta de «${ruta}» no existix: no se'n crea cap.`, { cause: error });
      }
      let existent = null;
      try {
        existent = await directori.getFileHandle(nomFitxer);
      } catch (error) {
        if (error?.name !== 'NotFoundError') throw falla('ESCRIPTURA_FALLIDA', `No s'ha pogut preparar «${ruta}».`, { cause: error });
      }
      if (esperat) await comprovaVersioEsperada(existent, esperat, segs.join('/'));
      if (existent && sobreescriu !== true) {
        throw falla('FITXER_JA_EXISTEIX', `Ja hi ha un fitxer «${nomFitxer}»: no se sobreescriu sense confirmar-ho.`);
      }
      let escriptor = null;
      let fh = null;
      try {
        fh = existent ?? await directori.getFileHandle(nomFitxer, { create: true });
        /* Si algú l'ha creat entre la comprovació i la creació, no és nostre: no es trepitja. */
        if (!existent && sobreescriu !== true && (await fh.getFile()).size !== 0) {
          throw falla('FITXER_JA_EXISTEIX', `Ja hi ha un fitxer «${nomFitxer}»: no se sobreescriu sense confirmar-ho.`);
        }
        escriptor = await fh.createWritable();
        await escriptor.write(dades);
        await escriptor.close();
        escriptor = null;
      } catch (error) {
        if (escriptor) {
          try { await escriptor.abort(); } catch { /* ja tancat: no queda res a desfer */ }
        }
        if (error instanceof ErrorArxiuLocal) throw error;
        throw falla('ESCRIPTURA_FALLIDA', `No s'ha pogut escriure «${ruta}».`, { cause: error });
      }
      /* La data nova, encara dins de la cua: és la versió que la persona té ara oberta. */
      let modificat = null;
      try {
        modificat = (await fh.getFile()).lastModified || 0;
      } catch {
        modificat = null;
      }
      return Object.freeze({ ruta: segs.join('/'), mida: dades.byteLength, sobreescrit: Boolean(existent), modificat });
    };
    font.escriu = (ruta, bytes, opcions) => enOrdre(() => escriu(ruta, bytes, opcions));

    /* mou: copiar + verificar + recomprovar l'origen + esborrar-lo. `carpetesNoves` (intern) deixa
       crear les carpetes que falten del destí, i només si el destí comença per eixa carpeta. */
    const mou = async (rutaOrigen, rutaDesti, { carpetesNoves = null } = {}) => {
      viu(font);
      const segsO = segmentsMutacioLocal(rutaOrigen);
      const segsD = segmentsMutacioLocal(rutaDesti);
      const nomO = segsO[segsO.length - 1];
      const nomD = segsD[segsD.length - 1];
      const origen = segsO.join('/');
      const desti = segsD.join('/');
      if (origen === desti) throw falla('MATEIXA_RUTA', `«${origen}» ja és on vols moure'l.`);
      if (clauDisc(origen) === clauDisc(desti)) {
        throw falla('NOM_EQUIVALENT', `«${desti}» només canvia majúscules o accents de «${origen}»: el disc el veu com el mateix fitxer.`);
      }
      if (extensioDe(nomO) !== extensioDe(nomD)) {
        throw falla('EXTENSIO_NO_CONSERVADA', `El fitxer ha de conservar l'extensió «.${extensioDe(nomO) || '(cap)'}».`);
      }
      if (nomD !== nomO) exigixNomNouValid(nomD);
      const creaDesti = typeof carpetesNoves === 'string' && segsD.length > 1 && segsD[0] === carpetesNoves;
      const { arrel: a } = viu(font);
      await exigixEscriptura(a);
      viu(font);

      let dirO;
      try {
        dirO = await carpetaDe(a, segsO.slice(0, -1));
      } catch (error) {
        throw falla('FITXER_ILLEGIBLE', `«${origen}» ja no hi és: torna a llegir la carpeta.`, { cause: error });
      }
      let fhO;
      try {
        fhO = await dirO.getFileHandle(nomO);
      } catch (error) {
        if (error?.name === 'TypeMismatchError') throw falla('NO_ES_FITXER', `«${origen}» és una carpeta: només es mouen fitxers.`, { cause: error });
        throw falla('FITXER_ILLEGIBLE', `«${origen}» ja no hi és: torna a llegir la carpeta.`, { cause: error });
      }
      let fitxerO;
      try {
        fitxerO = await fhO.getFile();
      } catch (error) {
        throw falla('FITXER_ILLEGIBLE', `No s'ha pogut llegir «${origen}».`, { cause: error });
      }
      const midaO = fitxerO.size;
      const modificatO = fitxerO.lastModified;

      let dirD;
      try {
        dirD = await carpetaDe(a, segsD.slice(0, -1), { crea: creaDesti });
      } catch (error) {
        throw falla('CARPETA_NO_TROBADA', `La carpeta de «${desti}» no existix.`, { cause: error });
      }
      if (clauDisc(nomO) === clauDisc(nomD) && await mateixaEntrada(dirO, dirD)) {
        throw falla('NOM_EQUIVALENT', `«${desti}» és el mateix fitxer que «${origen}» per al disc.`);
      }
      let existeix = false;
      try {
        await dirD.getFileHandle(nomD);
        existeix = true;
      } catch (error) {
        if (error?.name === 'TypeMismatchError') existeix = true;
        else if (error?.name !== 'NotFoundError') throw falla('ESCRIPTURA_FALLIDA', `No s'ha pogut preparar «${desti}».`, { cause: error });
      }
      if (existeix) throw falla('FITXER_JA_EXISTEIX', `Ja hi ha «${desti}»: no se sobreescriu mai en moure.`);

      let fhD;
      try {
        fhD = await dirD.getFileHandle(nomD, { create: true });
        /* Si algú l'ha creat just ara (entre la comprovació i la creació), no és nostre: no es toca. */
        if ((await fhD.getFile()).size !== 0) throw falla('FITXER_JA_EXISTEIX', `Ja hi ha «${desti}»: no se sobreescriu mai en moure.`);
      } catch (error) {
        if (error instanceof ErrorArxiuLocal) throw error;
        throw falla('ESCRIPTURA_FALLIDA', `No s'ha pogut crear «${desti}».`, { cause: error });
      }
      const esborraCopia = async () => {
        try {
          await dirD.removeEntry(nomD);
          return true;
        } catch {
          return false;
        }
      };
      const midaCopia = async () => {
        try {
          return (await (await dirD.getFileHandle(nomD)).getFile()).size;
        } catch {
          return 0;
        }
      };
      const copiaConservada = (motiu) => falla('CONFLICTE_DISC',
        `«${origen}» ha desaparegut mentre es movia${motiu}: la còpia es conserva a «${desti}».`, { detall: { copiaConservada: desti } });
      /* 'igual' | 'canviat' | 'desaparegut' */
      const estatOrigen = async () => {
        try {
          const ara = await (await dirO.getFileHandle(nomO)).getFile();
          return ara.size === midaO && ara.lastModified === modificatO ? 'igual' : 'canviat';
        } catch {
          return 'desaparegut';
        }
      };
      const conflicte = (estat) => falla('CONFLICTE_DISC', estat === 'desaparegut'
        ? `«${origen}» ha desaparegut mentre es movia.`
        : `«${origen}» ha canviat mentre es movia (potser l'ha editat un altre programa): no s'ha mogut res.`);

      const desconnectada = (cause) => falla('FONT_OBLIDADA', "La carpeta local s'ha desconnectat: no s'ha mogut res.", { cause });
      let copiats = 0;
      let escriptor = null;
      try {
        escriptor = await fhD.createWritable();
        await copiaPerTrossos(fitxerO, escriptor, (tros) => {
          copiats += tros.byteLength;
          /* Si la font s'oblida a mitja còpia (p. ex. en tancar la sessió), no es llig ni s'escriu res més. */
          viu(font);
        });
        await escriptor.close();
        escriptor = null;
      } catch (error) {
        if (escriptor) {
          try { await escriptor.abort(); } catch { /* ja tancat */ }
        }
        /* Sense l'original, una còpia amb bytes (d'un altre moviment que sí que ha acabat) és l'única que queda. */
        const estat = await estatOrigen();
        if (estat === 'desaparegut' && (await midaCopia()) > 0) throw copiaConservada('');
        await esborraCopia();
        if (estat !== 'igual') throw conflicte(estat);
        if (error?.codi === 'FONT_OBLIDADA') throw desconnectada(error);
        throw falla('ESCRIPTURA_FALLIDA', `No s'ha pogut copiar «${origen}» a «${desti}»: no s'ha mogut res.`, { cause: error });
      }

      /* Verificació del CONTINGUT (QA-A02), per a qualsevol mida: la còpia es compara byte a
         byte amb l'origen tal com és ara al disc, per trossos de MIDA_TROS_VERIFICACIO_LOCAL
         (mai sencers en memòria, sense SubtleCrypto ni límit de mida: la memòria és constant).
         Si són diferents, s'esborra la còpia (MOVIMENT_NO_VERIFICAT). Si no s'han pogut
         comparar (una lectura que falla, l'API que falta), l'origen NO s'esborra i la còpia es
         conserva (MOVIMENT_INCOMPLET amb detall.copiaConservada): mai s'esborra l'únic
         original sense haver vist que la còpia és idèntica. */
      try {
        if (copiats !== midaO) throw new ContingutDiferent(`Copiats ${copiats} bytes de ${midaO}.`);
        const fitxerD = await (await dirD.getFileHandle(nomD)).getFile();
        const araO = await (await dirO.getFileHandle(nomO)).getFile();
        if (araO.size !== midaO || araO.lastModified !== modificatO) throw new ContingutDiferent("L'origen ha canviat.");
        await comparaContingutPerTrossos(araO, fitxerD, { abansDeCadaTros: () => viu(font) });
      } catch (error) {
        const estat = await estatOrigen();
        if (estat === 'desaparegut') throw copiaConservada(' (i la còpia no s’ha pogut verificar)');
        if (estat === 'canviat') {
          await esborraCopia();
          throw conflicte(estat);
        }
        if (error?.codi === 'FONT_OBLIDADA') {
          await esborraCopia();
          throw desconnectada(error);
        }
        if (error instanceof ContingutDiferent) {
          await esborraCopia();
          throw falla('MOVIMENT_NO_VERIFICAT', `La còpia de «${origen}» no és idèntica: s'ha esborrat la còpia i l'original no s'ha tocat.`, { cause: error });
        }
        throw falla('MOVIMENT_INCOMPLET', `«${origen}» s'ha copiat a «${desti}», però no s'ha pogut comprovar que la còpia siga idèntica: l'original no s'esborra i ara n'hi ha dos.`, {
          cause: error,
          detall: { origen, desti, copiaConservada: desti, motiu: 'SENSE_VERIFICAR' }
        });
      }
      const verificacio = 'bytes';

      const estat = await estatOrigen();
      if (estat === 'desaparegut') throw copiaConservada('');
      if (estat === 'canviat') {
        await esborraCopia();
        throw conflicte(estat);
      }
      const intern = INTERNS_FONT_LOCAL.get(font);
      if (!intern || intern.oblidada) {
        await esborraCopia();
        throw falla('FONT_OBLIDADA', "La carpeta local s'ha desconnectat: no s'ha mogut res.");
      }
      try {
        await dirO.removeEntry(nomO);
      } catch (error) {
        /* Si l'original ja no hi és (l'ha esborrat igualment, o un altre moviment), la còpia verificada
           és l'única: es queda, i el resultat és el que s'havia demanat. */
        if ((await estatOrigen()) === 'desaparegut') return Object.freeze({ ruta: desti, origen, mida: midaO, verificacio });
        if (await esborraCopia()) {
          throw falla('ESCRIPTURA_FALLIDA', `No s'ha pogut esborrar «${origen}»: no s'ha mogut res.`, { cause: error });
        }
        throw falla('MOVIMENT_INCOMPLET', `«${origen}» s'ha copiat a «${desti}», però l'original no s'ha pogut esborrar: ara n'hi ha dos.`, {
          cause: error,
          detall: { origen, desti }
        });
      }
      return Object.freeze({ ruta: desti, origen, mida: midaO, verificacio });
    };
    const reanomena = async (rutaOrigen, nouNom) => {
      viu(font);
      const segs = segmentsMutacioLocal(rutaOrigen);
      const nomNou = nomNouAmbExtensio(nouNom, segs[segs.length - 1]);
      return mou(segs.join('/'), [...segs.slice(0, -1), nomNou].join('/'));
    };

    const creaCarpeta = async (ruta) => {
      viu(font);
      const segs = segmentsMutacioLocal(ruta);
      const nomCarpeta = nomSegurDeCarpetaLocal(segs[segs.length - 1]);
      if (!nomCarpeta) throw falla('NOM_INVALID', `«${segs[segs.length - 1]}» no és un nom vàlid per a una carpeta.`);
      const finals = [...segs.slice(0, -1), nomCarpeta];
      segmentsMutacioLocal(finals.join('/'));
      const { arrel: a } = viu(font);
      await exigixEscriptura(a);
      viu(font);
      let pare;
      try {
        pare = await carpetaDe(a, finals.slice(0, -1));
      } catch (error) {
        throw falla('CARPETA_NO_TROBADA', `La carpeta on vols crear «${nomCarpeta}» no existix.`, { cause: error });
      }
      let existeix = false;
      try {
        await pare.getDirectoryHandle(nomCarpeta);
        existeix = true;
      } catch (error) {
        if (error?.name === 'TypeMismatchError') existeix = true;
        else if (error?.name !== 'NotFoundError') throw falla('ESCRIPTURA_FALLIDA', `No s'ha pogut preparar «${nomCarpeta}».`, { cause: error });
      }
      if (existeix) throw falla('FITXER_JA_EXISTEIX', `Ja hi ha «${finals.join('/')}».`);
      try {
        await pare.getDirectoryHandle(nomCarpeta, { create: true });
      } catch (error) {
        throw falla('ESCRIPTURA_FALLIDA', `No s'ha pogut crear «${finals.join('/')}».`, { cause: error });
      }
      return Object.freeze({ ruta: finals.join('/') });
    };

    const elimina = async (ruta) => {
      viu(font);
      const segs = segmentsMutacioLocal(ruta);
      const nomEntrada = segs[segs.length - 1];
      const { arrel: a } = viu(font);
      await exigixEscriptura(a);
      viu(font);
      let pare;
      try {
        pare = await carpetaDe(a, segs.slice(0, -1));
      } catch (error) {
        throw falla('FITXER_ILLEGIBLE', `«${ruta}» ja no hi és.`, { cause: error });
      }
      let tipus = 'fitxer';
      try {
        await pare.getFileHandle(nomEntrada);
      } catch (error) {
        if (error?.name !== 'TypeMismatchError') throw falla('FITXER_ILLEGIBLE', `«${ruta}» ja no hi és.`, { cause: error });
        tipus = 'carpeta';
      }
      if (tipus === 'carpeta') {
        let buida = true;
        try {
          const dir = await pare.getDirectoryHandle(nomEntrada);
          for await (const entrada of fillsDirectori(dir)) {
            if (entrada) {
              buida = false;
              break;
            }
          }
        } catch (error) {
          throw falla('FITXER_ILLEGIBLE', `No s'ha pogut obrir «${ruta}».`, { cause: error });
        }
        if (!buida) throw falla('CARPETA_NO_BUIDA', `«${ruta}» no està buida (també compten els fitxers ocults): no s'esborra.`);
      }
      viu(font);
      try {
        await pare.removeEntry(nomEntrada);
      } catch (error) {
        if (error?.name === 'InvalidModificationError') throw falla('CARPETA_NO_BUIDA', `«${ruta}» no està buida: no s'esborra.`, { cause: error });
        throw falla('ESCRIPTURA_FALLIDA', `No s'ha pogut esborrar «${ruta}».`, { cause: error });
      }
      return Object.freeze({ ruta: segs.join('/'), tipus });
    };

    ops = Object.freeze({ mou: (rutaOrigen, rutaDesti, opcions) => enOrdre(() => mou(rutaOrigen, rutaDesti, opcions)) });
    font.mou = (rutaOrigen, rutaDesti) => enOrdre(() => mou(rutaOrigen, rutaDesti));
    font.reanomena = (rutaOrigen, nouNom) => enOrdre(() => reanomena(rutaOrigen, nouNom));
    font.creaCarpeta = (ruta) => enOrdre(() => creaCarpeta(ruta));
    font.elimina = (ruta) => enOrdre(() => elimina(ruta));
  }

  INTERNS_FONT_LOCAL.set(font, { arrel, fitxers: null, oblidada: false, ops });
  return Object.freeze(font);
}

/**
 * Font sobre els fitxers d'un <input type="file" webkitdirectory> (Safari,
 * Firefox). Només lectura: no té escriu ni operacions físiques.
 * @param {FileList|File[]} llistaFitxers
 * @param {{ maxBytesFitxer?: number, nom?: string }} [opcions]
 */
export function fontDesDeFitxers(llistaFitxers, opcions = {}) {
  const fitxers = Array.from(llistaFitxers ?? []);
  const maxBytesFitxer = enterPositiu(opcions.maxBytesFitxer, MAX_LECTURA_IMATGE_LOCAL_BYTES);
  const primeraRel = String(fitxers.find((f) => String(f?.webkitRelativePath || '').includes('/'))?.webkitRelativePath || '');
  const arrelComuna = primeraRel.includes('/') ? primeraRel.split('/')[0] : '';
  const nom = String(opcions.nom || arrelComuna || '_multimedia_de_poble');
  const perRuta = new Map();
  const dirs = new Set();

  for (const fitxer of fitxers) {
    if (!fitxer || typeof fitxer !== 'object') continue;
    const rel =String(fitxer.webkitRelativePath || fitxer.name || '');
    const ruta = arrelComuna && rel.startsWith(`${arrelComuna}/`) ? rel.slice(arrelComuna.length + 1) : rel;
    if (!esRutaSeguraLocal(ruta) || perRuta.has(ruta)) continue;
    perRuta.set(ruta, fitxer);
    const segs = ruta.split('/');
    for (let i = 1; i < segs.length; i += 1) dirs.add(segs.slice(0, i).join('/'));
  }
  const carpetes = Object.freeze([...dirs].sort((x, y) => x.localeCompare(y)));

  const fitxerDe = (ruta) => {
    const intern = viu(font);
    segmentsSegursLocal(ruta);
    const fitxer = intern.fitxers.get(ruta);
    if (!fitxer) throw falla('FITXER_ILLEGIBLE', `«${ruta}» no és entre els fitxers triats.`);
    return fitxer;
  };

  const font = {
    get nom() {
      return nom;
    },
    get limitacions() {
      return Object.freeze([]);
    },
    get carpetes() {
      const intern = INTERNS_FONT_LOCAL.get(font);
      return intern && !intern.oblidada ? carpetes : Object.freeze([]);
    },
    get handle() {
      return null;
    },
    async llista() {
      const intern = viu(font);
      return [...intern.fitxers.entries()]
        .map(([ruta, fitxer]) => ({ ruta, mida: fitxer.size, modificat: fitxer.lastModified || 0 }))
        .sort((a, b) => a.ruta.localeCompare(b.ruta));
    },
    async llig(ruta, { midaMaxima } = {}) {
      const fitxer = fitxerDe(ruta);
      const limit = Math.min(maxBytesFitxer, enterPositiu(midaMaxima, maxBytesFitxer));
      if (fitxer.size > limit) throw massaGran(ruta, limit);
      let dades;
      try {
        dades = typeof fitxer.arrayBuffer === 'function'
          ? await fitxer.arrayBuffer()
          : await new Response(fitxer).arrayBuffer();
      } catch (error) {
        throw falla('FITXER_ILLEGIBLE', `No s'ha pogut llegir «${ruta}».`, { cause: error });
      }
      viu(font);
      return new Uint8Array(dades);
    },
    async info(ruta) {
      const fitxer = fitxerDe(ruta);
      return Object.freeze({ ruta, mida: fitxer.size, modificat: fitxer.lastModified || 0 });
    },
    async fitxer(ruta) {
      const fitxer = fitxerDe(ruta);
      return fitxer.slice(0, fitxer.size, mimeDeVisorLocal(ruta) || MIME_DESCARREGA_LOCAL);
    }
  };

  INTERNS_FONT_LOCAL.set(font, { arrel: null, fitxers: perRuta, oblidada: false, ops: null });
  return Object.freeze(font);
}

/**
 * Desenxufa una Font: buida les referències internes. Després, tots els
 * mètodes llancen FONT_OBLIDADA i `handle` és null. Cert si l'ha oblidada ara.
 */
export function oblidaFont(font) {
  const intern = font && typeof font === 'object' ? INTERNS_FONT_LOCAL.get(font) : undefined;
  if (!intern || intern.oblidada) return false;
  intern.oblidada = true;
  intern.arrel = null;
  intern.ops = null;
  if (intern.fitxers) intern.fitxers.clear();
  intern.fitxers = null;
  return true;
}

/* ═══ Text ════════════════════════════════════════════════════════════════ */

/** Els salts de línia d'un text: 'lf', 'crlf', 'mixt' (també amb CR solts) o null si no en té. */
export function saltsDeLiniaDe(text = '') {
  const s = String(text);
  let crlf = 0;
  let lf = 0;
  let cr = 0;
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (c === 13) {
      if (s.charCodeAt(i + 1) === 10) {
        crlf += 1;
        i += 1;
      } else {
        cr += 1;
      }
    } else if (c === 10) {
      lf += 1;
    }
  }
  if (cr > 0 || (crlf > 0 && lf > 0)) return 'mixt';
  if (crlf > 0) return 'crlf';
  if (lf > 0) return 'lf';
  return null;
}

/**
 * Text → bytes UTF-8, amb els salts i el BOM de l'original (el <textarea>
 * normalitza CRLF a LF: ací es tornen a posar).
 */
export function codificaTextLocal(text, { ambBom = false, salts = 'lf' } = {}) {
  let net = String(text ?? '').replace(/\r\n?/g, '\n');
  if (salts === 'crlf') net = net.replace(/\n/g, '\r\n');
  const cos = codificador.encode(net);
  if (ambBom !== true) return cos;
  const tot = new Uint8Array(cos.byteLength + 3);
  tot.set([0xef, 0xbb, 0xbf], 0);
  tot.set(cos, 3);
  return tot;
}

/**
 * Llig un arxiu de text (editable o de només lectura) com a UTF-8 estricte.
 * @returns {Promise<{ ruta, text, mida, ambBom, salts, modificat, editable }>}
 */
export async function llegixTextLocal(font, ruta, { midaMaxima = MAX_BYTES_TEXT_EDITABLE } = {}) {
  const segs = segmentsSegursLocal(ruta);
  if (!esTextLlegibleLocal(ruta)) throw falla('NO_ES_TEXT', `«${ruta}» no és un arxiu de text.`);
  /* La data abans dels bytes: si canvia entremig, el desat ho veurà com a conflicte (mai al revés). */
  let modificat = null;
  if (typeof font?.info === 'function') {
    try {
      modificat = (await font.info(ruta)).modificat;
    } catch (error) {
      if (error?.codi === 'FONT_OBLIDADA') throw error;
      modificat = null;
    }
  }
  const bytes = await font.llig(ruta, { midaMaxima: enterPositiu(midaMaxima, MAX_BYTES_TEXT_EDITABLE) });
  const ambBom = bytes.byteLength >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (error) {
    throw falla('NO_ES_UTF8', `«${ruta}» no és text UTF-8: no s'edita per a no fer-lo malbé.`, { cause: error });
  }
  if (text.includes('\u0000')) throw falla('NO_ES_TEXT', `«${ruta}» porta bytes binaris: no és text.`);
  return Object.freeze({
    ruta: segs.join('/'),
    text,
    mida: bytes.byteLength,
    ambBom,
    salts: saltsDeLiniaDe(text),
    modificat,
    /* Un nom amb invisibles es llig, però no s'hi escriu (segmentsMutacioLocal). */
    editable: esTextEditableLocal(ruta) && typeof font?.escriu === 'function' && esRutaEscrivibleLocal(ruta)
  });
}

const esNoTrobat = (error) => error?.codi === 'FITXER_ILLEGIBLE' && error?.cause?.name === 'NotFoundError';

/* Una font que no és del motor (un doble de proves): la comprovació es fa abans d'encuar,
   com abans de QA-A03. Les fonts del motor la fan dins de la cua (font.escriu). */
async function comprovaVersioDeFora(font, ruta, esperat) {
  let actual;
  try {
    actual = await font.info(ruta);
  } catch (error) {
    if (esNoTrobat(error)) throw falla('CONFLICTE_DISC', `«${ruta}» ha desaparegut del disc des que l'has obert.`, { cause: error });
    throw error;
  }
  if ((esperat.modificat !== null && actual.modificat !== esperat.modificat) || (esperat.mida !== null && actual.mida !== esperat.mida)) {
    throw falla('CONFLICTE_DISC', `«${ruta}» ha canviat al disc des que l'has obert (potser un altre programa).`, {
      detall: { modificat: actual.modificat, mida: actual.mida }
    });
  }
}

/**
 * Desa un text a la carpeta local. Amb `modificatEsperat` (i `midaEsperada`, la
 * mida que tenia en obrir-lo), comprova just abans d'escriure, dins de la cua
 * de la font, que ningú l'ha canviat des de fora ni des d'una altra escriptura
 * encuada (CONFLICTE_DISC). `modificat` del resultat és la data nova.
 * @returns {Promise<{ ruta, mida, sobreescrit, modificat }>}
 */
export async function escriuTextLocal(font, ruta, text, {
  sobreescriu = false,
  ambBom = false,
  salts = 'lf',
  modificatEsperat = null,
  midaEsperada = null,
  midaMaxima = MAX_BYTES_TEXT_EDITABLE
} = {}) {
  segmentsMutacioLocal(ruta);
  if (!esTextEditableLocal(ruta)) throw falla('ESCRIPTURA_NO_PERMESA', `«${ruta}» no és un arxiu de text editable.`);
  if (typeof font?.escriu !== 'function') throw falla('NOMES_LECTURA', 'Esta carpeta és de només lectura en este navegador.');
  if (typeof text !== 'string') throw falla('PARAMETRES_INVALIDS', 'Cal el text que es desa.');
  const esperat = expectativaDeVersio(modificatEsperat, midaEsperada);
  const bytes = codificaTextLocal(text, { ambBom, salts });
  const limit = enterPositiu(midaMaxima, MAX_BYTES_TEXT_EDITABLE);
  if (bytes.byteLength > limit) throw massaGran(ruta, limit);
  if (font.handle) await exigixEscriptura(font.handle);
  const delMotor = INTERNS_FONT_LOCAL.has(font);
  if (esperat && !delMotor) await comprovaVersioDeFora(font, ruta, esperat);
  const resultat = await font.escriu(ruta, bytes, delMotor && esperat
    ? { sobreescriu: sobreescriu === true, modificatEsperat: esperat.modificat, midaEsperada: esperat.mida }
    : { sobreescriu: sobreescriu === true });
  let modificat = Number.isFinite(resultat?.modificat) ? resultat.modificat : null;
  if (modificat === null) {
    try {
      modificat = (await font.info(resultat.ruta)).modificat;
    } catch {
      modificat = null;
    }
  }
  return Object.freeze({ ...resultat, modificat });
}

/**
 * Crea un fitxer Markdown nou. El nom el posa la persona; si ja n'hi ha un,
 * FITXER_JA_EXISTEIX (cap sufix automàtic). No crea mai carpetes.
 * @returns {Promise<{ ruta, nom, mida }>}
 */
export async function creaFitxerMarkdownLocal(font, { carpeta = '', nom = '', contingut = null, ara = Date.now } = {}) {
  const carpetaNeta = carpeta === '' || carpeta === '(arrel)' ? '' : segmentsMutacioLocal(carpeta).join('/');
  if (typeof font?.escriu !== 'function') throw falla('NOMES_LECTURA', 'Esta carpeta és de només lectura en este navegador.');
  const nomFitxer = nomSegurDeFitxerLocal(typeof nom === 'string' ? nom : '', { extensio: 'md', ara });
  const ruta = carpetaNeta ? `${carpetaNeta}/${nomFitxer}` : nomFitxer;
  const text = typeof contingut === 'string' ? contingut : `# ${troncSenseExtensio(nomFitxer)}\n`;
  const resultat = await font.escriu(ruta, codificaTextLocal(text), { sobreescriu: false });
  return Object.freeze({ ruta: resultat.ruta, nom: nomFitxer, mida: resultat.mida });
}

/* ═══ SHA-256 i duplicats exactes ═════════════════════════════════════════ */

/** El SHA-256 (64 hex en minúscules) d'un arxiu de la font. */
export async function calculaHashFitxerLocal(font, ruta, { cripto = globalThis.crypto, midaMaxima = MAX_BYTES_HASH_FITXER } = {}) {
  const subtle = cripto?.subtle;
  if (typeof subtle?.digest !== 'function') throw falla('SENSE_CRIPTO', 'Este navegador no pot calcular SHA-256 (cal una connexió segura).');
  const bytes = await font.llig(ruta, { midaMaxima });
  return hexDe(await subtle.digest('SHA-256', bytes));
}

/**
 * Busca duplicats exactes (byte a byte, per SHA-256). Només es lligen els
 * fitxers que comparteixen mida amb un altre; per grups sencers, amb
 * pressupost, en seqüència i cancel·lable.
 * @returns {Promise<{ grups: Array<{ hash, mida, rutes }>, analitzats, bytesLlegits, omesos: Array<{ ruta, codi }>, truncat, cancellat }>}
 */
export async function cercaDuplicatsExactesLocals(font, entrades, {
  cripto = globalThis.crypto,
  senyal = null,
  maxFitxers = PRESSUPOST_DUPLICATS.maxFitxers,
  maxBytes = PRESSUPOST_DUPLICATS.maxBytes,
  midaMinima = 1,
  filtre = null,
  enProgres = null
} = {}) {
  const subtle = cripto?.subtle;
  if (typeof subtle?.digest !== 'function') throw falla('SENSE_CRIPTO', 'Este navegador no pot calcular SHA-256 (cal una connexió segura).');
  const minim = Number.isFinite(midaMinima) && midaMinima > 0 ? midaMinima : 1;
  const limitFitxers = enterPositiu(maxFitxers, PRESSUPOST_DUPLICATS.maxFitxers);
  const limitBytes = Number.isFinite(maxBytes) && maxBytes > 0 ? maxBytes : PRESSUPOST_DUPLICATS.maxBytes;
  const passa = (e) => {
    if (typeof filtre !== 'function') return true;
    try {
      return filtre(e) === true;
    } catch {
      return false;
    }
  };
  const vistes = new Set();
  const perMida = new Map();
  for (const e of Array.isArray(entrades) ? entrades : []) {
    if (!e || typeof e.ruta !== 'string' || vistes.has(e.ruta)) continue;
    const mida = Number(e.mida);
    if (!Number.isFinite(mida) || mida < minim || !passa(e)) continue;
    vistes.add(e.ruta);
    const grup = perMida.get(mida) ?? [];
    grup.push(e.ruta);
    perMida.set(mida, grup);
  }
  const candidats = [...perMida.entries()].filter(([, rutes]) => rutes.length > 1).sort((x, y) => x[0] - y[0]);
  const total = candidats.reduce((n, [, rutes]) => n + rutes.length, 0);
  const grups = [];
  const omesos = [];
  let analitzats = 0;
  let fets = 0;
  let bytesLlegits = 0;
  let pressupostFitxers = 0;
  let pressupostBytes = 0;
  let truncat = false;
  let cancellat = false;
  const avisa = () => {
    if (typeof enProgres !== 'function') return;
    try {
      enProgres({ fets, total, bytesLlegits });
    } catch {
      /* el progrés és informatiu: una fallada seua no para la cerca */
    }
  };

  for (const [mida, rutes] of candidats) {
    if (pressupostFitxers + rutes.length > limitFitxers || pressupostBytes + mida * rutes.length > limitBytes) {
      truncat = true;
      break;
    }
    pressupostFitxers += rutes.length;
    pressupostBytes += mida * rutes.length;
    const perHash = new Map();
    for (const ruta of rutes) {
      if (senyal?.aborted) {
        cancellat = true;
        break;
      }
      try {
        const bytes = await font.llig(ruta, { midaMaxima: MAX_BYTES_HASH_FITXER });
        bytesLlegits += bytes.byteLength;
        const hash = hexDe(await subtle.digest('SHA-256', bytes));
        analitzats += 1;
        const llista = perHash.get(hash) ?? [];
        llista.push(ruta);
        perHash.set(hash, llista);
      } catch (error) {
        omesos.push({ ruta, codi: error?.codi || 'FITXER_ILLEGIBLE' });
      }
      fets += 1;
      avisa();
    }
    if (cancellat) break;
    for (const [hash, iguals] of perHash) {
      if (iguals.length > 1) grups.push({ hash, mida, rutes: iguals });
    }
  }
  return { grups, analitzats, bytesLlegits, omesos, truncat, cancellat };
}

/** Map(ruta → { hash, altres }) dels grups de duplicats exactes. */
export function indexaDuplicatsExactes(grups = []) {
  const index = new Map();
  for (const grup of Array.isArray(grups) ? grups : []) {
    for (const ruta of grup?.rutes ?? []) {
      index.set(ruta, { hash: grup.hash, altres: grup.rutes.filter((r) => r !== ruta) });
    }
  }
  return index;
}

/* ═══ WebP ════════════════════════════════════════════════════════════════ */

/** La ruta de la bessona webp: la mateixa ruta amb `.webp`. */
export const rutaBessonaWebp = (ruta = '') => `${troncSenseExtensio(ruta)}.webp`;

/**
 * Desa una .webp del laboratori a la carpeta local. Primer sense sobreescriure;
 * davant FITXER_JA_EXISTEIX, la interfície confirma i torna amb `sobreescriu:true`.
 * @returns {Promise<{ ruta, mida, sobreescrit }>}
 */
export async function desaWebpALaCarpetaLocal(font, rutaWebp, bytesWebp, { sobreescriu = false } = {}) {
  segmentsMutacioLocal(rutaWebp);
  if (extensioDe(rutaWebp) !== 'webp') throw falla('ESCRIPTURA_NO_PERMESA', 'Només es desen fitxers .webp des del laboratori.');
  if (!esBytesWebp(bytesWebp)) throw falla('NO_ES_WEBP', 'Els bytes no són d’una imatge WebP (este navegador potser no sap codificar-ne).');
  if (typeof font?.escriu !== 'function') throw falla('NOMES_LECTURA', 'Esta carpeta és de només lectura en este navegador.');
  return font.escriu(rutaWebp, bytesWebp, { sobreescriu: sobreescriu === true });
}

async function existeixFitxer(font, ruta) {
  try {
    await font.info(ruta);
    return true;
  } catch (error) {
    if (error?.codi !== 'FITXER_ILLEGIBLE') throw error;
    if (error.cause?.name === 'NotFoundError') return false;
    return true;
  }
}

/**
 * «Desar .webp i moure l'original a originals_raster_public/»: comprova abans
 * les dues col·lisions, desa la .webp i després mou l'original (creant les
 * carpetes que falten NOMÉS dins d'originals_raster_public/). Si el moviment
 * falla, ORIGINAL_NO_MOGUT diu que la .webp sí que s'ha desat.
 * @returns {Promise<{ webp: { ruta, mida, sobreescrit }, original: { ruta, origen, mida, verificacio } }>}
 */
export async function desaWebpIMouOriginalLocal(font, rutaOriginal, bytesWebp, { sobreescriuWebp = false } = {}) {
  const segs = segmentsMutacioLocal(rutaOriginal);
  const origen = segs.join('/');
  if (!potMoureOriginalRaster(origen)) {
    throw falla('PARAMETRES_INVALIDS', `«${origen}» no és un original ràster que es puga moure a ${CARPETA_ORIGINALS_RASTER}/.`);
  }
  if (!esBytesWebp(bytesWebp)) throw falla('NO_ES_WEBP', 'Els bytes no són d’una imatge WebP (este navegador potser no sap codificar-ne).');
  const intern = INTERNS_FONT_LOCAL.get(font);
  if (typeof font?.escriu !== 'function' || !intern?.ops) {
    if (intern?.oblidada) viu(font);
    throw falla('NOMES_LECTURA', 'Esta carpeta és de només lectura en este navegador.');
  }
  const { arrel: a, ops } = viu(font);
  const rutaWebp = rutaBessonaWebp(origen);
  const rutaDesti = rutaOriginalsRasterDe(origen);
  await exigixEscriptura(a);
  if (sobreescriuWebp !== true && await existeixFitxer(font, rutaWebp)) {
    throw falla('FITXER_JA_EXISTEIX', `Ja hi ha «${rutaWebp}»: no se sobreescriu sense confirmar-ho.`, { detall: { ruta: rutaWebp, quina: 'webp' } });
  }
  if (await existeixFitxer(font, rutaDesti)) {
    throw falla('FITXER_JA_EXISTEIX', `Ja hi ha «${rutaDesti}»: l'original no es pot moure allí.`, { detall: { ruta: rutaDesti, quina: 'original' } });
  }
  const webp = await font.escriu(rutaWebp, bytesWebp, { sobreescriu: sobreescriuWebp === true });
  try {
    const original = await ops.mou(origen, rutaDesti, { carpetesNoves: CARPETA_ORIGINALS_RASTER });
    return Object.freeze({ webp, original });
  } catch (error) {
    throw falla('ORIGINAL_NO_MOGUT', `S'ha desat «${webp.ruta}», però l'original no s'ha mogut: ${error?.message || 'error desconegut'}`, {
      cause: error,
      detall: { webp: webp.ruta, desti: rutaDesti }
    });
  }
}

/**
 * @deprecated Compatibilitat amb la interfície anterior: sobreescriu i crea
 * carpetes. La nova fa servir desaWebpALaCarpetaLocal amb confirmació.
 * @returns {Promise<string>} la ruta desada
 */
export async function desarWebpEnHandleLocal(rootHandle, rutaWebpRelativa, bytesWebp) {
  if (!esHandleCarpetaLocal(rootHandle) || typeof rootHandle.getFileHandle !== 'function') {
    throw falla('NOMES_LECTURA', 'Cal obrir la carpeta amb el selector natiu del navegador per poder desar el WebP.');
  }
  const font = fontDesDeHandle(rootHandle);
  try {
    const neta = String(rutaWebpRelativa ?? '').replace(/^\/+/, '');
    segmentsMutacioLocal(neta);
    if (extensioDe(neta) !== 'webp') throw falla('ESCRIPTURA_NO_PERMESA', 'Només es permet escriure fitxers .webp dins de la carpeta local.');
    if (!esBytesWebp(bytesWebp)) throw falla('NO_ES_WEBP', 'Els bytes no són d’una imatge WebP.');
    return (await font.escriu(neta, bytesWebp, { sobreescriu: true, creaCarpetes: true })).ruta;
  } finally {
    oblidaFont(font);
  }
}

/* ═══ Àlbum: pàgines, URL d'objecte i etiquetes ═══════════════════════════ */

/** Una pàgina d'una llista: la pàgina es tanca dins de 1..pagines. */
export function paginaLocal(llista, pagina = 1, mida = MIDA_PAGINA_ALBUM) {
  const tots = Array.isArray(llista) ? llista : [];
  const perPagina = enterPositiu(mida, MIDA_PAGINA_ALBUM);
  const pagines = Math.max(1, Math.ceil(tots.length / perPagina));
  const demanada = Number.isFinite(pagina) ? Math.trunc(pagina) : 1;
  const actual = Math.min(pagines, Math.max(1, demanada));
  return {
    elements: tots.slice((actual - 1) * perPagina, actual * perPagina),
    pagina: actual,
    pagines,
    total: tots.length
  };
}

/**
 * Registre de URL d'objecte: només crea blob: de la llista blanca de MIME
 * (torna null per a qualsevol altre) i les revoca totes de colp.
 * @param {{ urlApi?: { createObjectURL: Function, revokeObjectURL: Function } }} [opcions]
 */
export function creaRegistreUrlsLocals({ urlApi = globalThis.URL } = {}) {
  const vives = new Set();
  return Object.freeze({
    crea(blob) {
      if (!blob || typeof blob !== 'object' || typeof blob.type !== 'string') return null;
      const tipus = blob.type.split(';')[0].trim().toLowerCase();
      if (!MIMES_VISOR_LOCAL.has(tipus) || typeof urlApi?.createObjectURL !== 'function') return null;
      const url = urlApi.createObjectURL(blob);
      vives.add(url);
      return url;
    },
    revoca(url) {
      if (!vives.has(url)) return false;
      vives.delete(url);
      try {
        urlApi.revokeObjectURL(url);
      } catch {
        /* ja revocada */
      }
      return true;
    },
    revocaTot() {
      for (const url of vives) {
        try {
          urlApi.revokeObjectURL(url);
        } catch {
          /* ja revocada */
        }
      }
      vives.clear();
    },
    get vives() {
      return vives.size;
    }
  });
}

/**
 * Les etiquetes d'estat d'un element de l'anàlisi: 'publicada', 'bessonaWebp',
 * 'inedita', 'pesAlt', 'duplicada' (exacte, per hash) i 'possibleDuplicat'
 * (per nom o per mida, sense confirmar).
 * @param {object} el element de analitzaCarpetaMultimediaLocal
 * @param {Map|Set|null} duplicatsExactes rutes amb duplicat exacte (indexaDuplicatsExactes)
 */
export function etiquetesEstatLocal(el, duplicatsExactes = null) {
  if (!el || typeof el !== 'object') return [];
  const etiquetes = [];
  if (el.emparelladaWeb) etiquetes.push('publicada');
  if (el.teBessonaLocal) etiquetes.push('bessonaWebp');
  if (el.inedita) etiquetes.push('inedita');
  if (el.pesAlt) etiquetes.push('pesAlt');
  const exacte = typeof duplicatsExactes?.has === 'function' && duplicatsExactes.has(el.ruta);
  if (exacte) etiquetes.push('duplicada');
  else if (el.duplicada) etiquetes.push('possibleDuplicat');
  return etiquetes;
}

/* ═══ Anàlisi de la carpeta ═══════════════════════════════════════════════ */

/**
 * Extreu el possible camí canònic `/assets/...` d'una ruta local
 * (`originals_raster_public/assets/uploads/brain/x.jpg` → `/assets/uploads/brain/x`).
 */
export function troncAssetsDeRutaLocal(ruta = '') {
  const tronc = troncSenseExtensio(ruta);
  const idx = tronc.indexOf('assets/');
  if (idx >= 0) return `/${tronc.slice(idx)}`;
  return null;
}

/** Índex del cens web per tronc (`/assets/uploads/brain/x`) i per nom base (`x`). */
export function indexaCensWeb(cens, mitjansWeb = []) {
  const perTronc = new Map();
  const perNomBase = new Map();
  const registra = (src, info) => {
    if (typeof src !== 'string' || !src) return;
    const tronc = troncSenseExtensio(src);
    const base = nomBaseSenseExtensio(src);
    if (!perTronc.has(tronc)) perTronc.set(tronc, info);
    if (base && !perNomBase.has(base)) perNomBase.set(base, info);
  };
  if (cens && typeof cens.entries === 'function') {
    for (const [src, entrada] of cens.entries()) {
      registra(src, {
        src,
        titol: entrada?.titol || entrada?.title || '',
        ambit: entrada?.ambit || '',
        poble: entrada?.poble || null,
        origen: entrada?.origen || null
      });
    }
  }
  if (Array.isArray(mitjansWeb)) {
    for (const item of mitjansWeb) {
      if (item?.src) {
        registra(item.src, {
          src: item.src,
          titol: item.title || item.titol || '',
          ambit: item.ambit || '',
          poble: item.poble || null,
          origen: item.origen || null
        });
      }
    }
  }
  return { perTronc, perNomBase };
}

/* La ruta sense la primera carpeta i sense extensió, per a aparellar bessones entre carpetes. */
const restaDelTronc = (ruta) => {
  const tronc = troncSenseExtensio(ruta).toLowerCase();
  const barra = tronc.indexOf('/');
  return barra > 0 ? tronc.slice(barra + 1) : tronc;
};

/**
 * El diagnòstic de la carpeta: tipus, subcarpetes, parella amb el cens web,
 * bessones ràster↔webp (en la mateixa carpeta o, pel nom base, entre carpetes:
 * eixa parella no és mai «duplicada»), inèdites, pes alt i possibles duplicats.
 */
export function analitzaCarpetaMultimediaLocal(entrades = [], { cens = null, mitjansWeb = [] } = {}) {
  const { perTronc, perNomBase } = indexaCensWeb(cens, mitjansWeb);
  const valides = (Array.isArray(entrades) ? entrades : []).filter((item) => item && typeof item.ruta === 'string');
  const perTroncLocal = new Map();
  const perNomBaseLocal = new Map();
  const perMidaImatge = new Map();
  const carpetesSet = new Set();

  for (const item of valides) {
    const tronc = troncSenseExtensio(item.ruta);
    const grupTronc = perTroncLocal.get(tronc) || [];
    grupTronc.push(item);
    perTroncLocal.set(tronc, grupTronc);

    const base = nomBaseSenseExtensio(item.ruta);
    if (base) {
      const grupBase = perNomBaseLocal.get(base) || [];
      grupBase.push(item);
      perNomBaseLocal.set(base, grupBase);
    }

    if (tipusMitjaDe(item.ruta) === 'imatge' && item.mida > 4096) {
      const grupMida = perMidaImatge.get(item.mida) || [];
      grupMida.push(item.ruta);
      perMidaImatge.set(item.mida, grupMida);
    }
    const segs = item.ruta.split('/');
    for (let i = 1; i < segs.length; i += 1) carpetesSet.add(segs.slice(0, i).join('/'));
  }

  const esWebp = (g) => extensioDe(g.ruta) === 'webp';
  const esRaster = (g) => EXTENSIONS_RASTER_CONVERTIBLE.has(extensioDe(g.ruta));
  /* La bessona d'una altra carpeta: la que té la mateixa ruta sense la primera carpeta o, si no, la primera pel nom base. */
  const bessonaEntreCarpetes = (ruta, base, condicio) => {
    const candidates = (perNomBaseLocal.get(base) || [])
      .filter((g) => g.ruta !== ruta && troncSenseExtensio(g.ruta) !== troncSenseExtensio(ruta) && condicio(g))
      .sort((x, y) => x.ruta.localeCompare(y.ruta));
    if (candidates.length === 0) return null;
    const resta = restaDelTronc(ruta);
    return candidates.find((g) => restaDelTronc(g.ruta) === resta) || candidates[0];
  };

  const subcarpetesMap = new Map();
  let pesTotalBytes = 0;
  let totalImatges = 0;
  let totalEmparelladesWeb = 0;
  let totalInedites = 0;
  let totalBessonesLocals = 0;
  let totalPesAlt = 0;
  let totalDuplicades = 0;
  let estalviBessonesBytes = 0;

  const elements = valides.map((item) => {
    const ruta = item.ruta;
    const mida = Number(item.mida) || 0;
    const modificat = Number(item.modificat) || 0;
    const ext = extensioDe(ruta);
    const tipus = tipusMitjaDe(ruta);
    const subcarpeta = subcarpetaPrincipalDe(ruta);
    const nom = nomFitxerDe(ruta);
    const tronc = troncSenseExtensio(ruta);
    const base = nomBaseSenseExtensio(ruta);

    pesTotalBytes += mida;
    const comptaSub = subcarpetesMap.get(subcarpeta) || { nom: subcarpeta, total: 0, bytes: 0 };
    comptaSub.total += 1;
    comptaSub.bytes += mida;
    subcarpetesMap.set(subcarpeta, comptaSub);

    const troncAssets = troncAssetsDeRutaLocal(ruta);
    const parellaWeb = (troncAssets && perTronc.get(troncAssets)) || perNomBase.get(base) || null;

    const esRasterConvertible = EXTENSIONS_RASTER_CONVERTIBLE.has(ext);
    const germansTronc = perTroncLocal.get(tronc) || [];
    let germansWebp = esRasterConvertible ? germansTronc.find((g) => esWebp(g) && g.ruta !== ruta) || null : null;
    let germansRaster = ext === 'webp' ? germansTronc.find((g) => esRaster(g) && g.ruta !== ruta) || null : null;
    let entreCarpetes = false;
    if (esRasterConvertible && !germansWebp) {
      germansWebp = bessonaEntreCarpetes(ruta, base, esWebp);
      entreCarpetes = Boolean(germansWebp);
    }
    if (ext === 'webp' && !germansRaster) {
      germansRaster = bessonaEntreCarpetes(ruta, base, esRaster);
      entreCarpetes = Boolean(germansRaster);
    }

    const teBessonaLocal = Boolean((esRasterConvertible && germansWebp) || (ext === 'webp' && germansRaster));
    const estalviBytes = esRasterConvertible && germansWebp && mida > germansWebp.mida ? mida - germansWebp.mida : 0;
    if (estalviBytes > 0) estalviBessonesBytes += estalviBytes;

    const emparelladaWeb = Boolean(parellaWeb);
    const inedita = tipus === 'imatge' && esRasterConvertible && !emparelladaWeb && !germansWebp;
    const pesAlt = tipus === 'imatge' && (
      (ext === 'webp' && mida > LLINDAR_WEBP_PES_ALT_BYTES) ||
      (esRasterConvertible && !germansWebp && mida > LLINDAR_RASTER_PES_ALT_BYTES)
    );

    const mateixaMida = tipus === 'imatge' && mida > 4096 ? (perMidaImatge.get(mida) || []).filter((r) => r !== ruta) : [];
    /* Un ràster i una webp amb el mateix nom són bessones, no duplicades. */
    const sonBessones = (g) => (esRasterConvertible && esWebp(g)) || (ext === 'webp' && esRaster(g));
    const altresCarpetesMateixNom = (perNomBaseLocal.get(base) || [])
      .filter((g) => g.ruta !== ruta && troncSenseExtensio(g.ruta) !== tronc && !sonBessones(g))
      .map((g) => g.ruta);
    const duplicada = mateixaMida.length > 0 || altresCarpetesMateixNom.length > 0;

    if (tipus === 'imatge') {
      totalImatges += 1;
      if (emparelladaWeb) totalEmparelladesWeb += 1;
      if (inedita) totalInedites += 1;
      if (teBessonaLocal) totalBessonesLocals += 1;
      if (pesAlt) totalPesAlt += 1;
      if (duplicada) totalDuplicades += 1;
    }

    return {
      ruta,
      nom,
      subcarpeta,
      carpeta: carpetaDeRuta(ruta),
      ext,
      tipus,
      vista: vistaDe(ruta),
      mida,
      modificat,
      emparelladaWeb,
      parellaWeb,
      teBessonaLocal,
      bessonaEntreCarpetes: entreCarpetes,
      bessonaWebpRuta: esRasterConvertible ? germansWebp?.ruta || null : null,
      bessonaWebpMida: esRasterConvertible ? germansWebp?.mida ?? null : null,
      originalRasterRuta: ext === 'webp' ? germansRaster?.ruta || null : null,
      originalRasterMida: ext === 'webp' ? germansRaster?.mida ?? null : null,
      estalviBytes,
      inedita,
      pesAlt,
      duplicada,
      coincidenciesMida: mateixaMida,
      coincidenciesNom: altresCarpetesMateixNom
    };
  });

  const subcarpetes = [...subcarpetesMap.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'ca'));
  const carpetes = [...carpetesSet].sort((a, b) => a.localeCompare(b, 'ca'));

  return {
    elements,
    subcarpetes,
    carpetes,
    resum: {
      totalFitxers: elements.length,
      totalImatges,
      pesTotalBytes,
      totalEmparelladesWeb,
      totalInedites,
      totalBessonesLocals,
      totalPesAlt,
      totalDuplicades,
      estalviBessonesBytes
    }
  };
}

/**
 * Llig una imatge de la font i n'extreu l'EXIF (data, càmera com a objecte
 * { marca, model }, autor, drets i GPS). `blob` només per a ràster (MIME de la
 * llista blanca); per a l'SVG, `dataUrl` (fins a 1 MiB) i `blob` null.
 */
export async function inspeccionaImatgeLocal(font, ruta) {
  const bytes = await font.llig(ruta, { midaMaxima: MAX_LECTURA_IMATGE_LOCAL_BYTES });
  const mime = mimeDeVisorLocal(ruta);
  const blob = mime ? new Blob([bytes], { type: mime }) : null;
  const dataUrl = extensioDe(ruta) === 'svg' ? dataUrlSvgLocal(bytes) : null;
  let exif = null;
  if (mime) {
    try {
      exif = await llegixExif(bytes, { ambCamera: true });
    } catch {
      exif = null;
    }
  }
  return { bytes, blob, mime, dataUrl, exif };
}
