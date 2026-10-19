const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/* Gauntlet 261016 (I34) · Les nou reserves viuen a uploads/brain/: a
   /assets/img/ no n'hi ha cap (eixa carpeta de l'arrel no es servix) i un
   poble sense imatge pintava una imatge trencada. Ho vigila la prova de
   frescor d'assetResolver.test.js. */
const TOWN_FALLBACK_IMAGES = [
  '/assets/uploads/brain/hero_panoramic_landscape_1774710654078.png',
  '/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png',
  '/assets/uploads/brain/art_trellat_farmer_1774708525806.png',
  '/assets/uploads/brain/nano_mercat_llaurador_1774197050578.png',
  '/assets/uploads/brain/aplec_danses_1774952191348.png',
  '/assets/uploads/brain/nano_mel_font_roja_1774216345755.png',
  '/assets/uploads/brain/art_trellat_v2_1774708257858.png',
  '/assets/uploads/brain/hero_serrella_comic_1774709602282.png',
  '/assets/uploads/brain/nano_oli_oliva_1774198089084.png'
];

/* Gauntlet 261017 (I34) · La llavor, en NFC: 'Penàguila' escrit amb l'accent
   compost o descompost tria la mateixa reserva. Un text ASCII no canvia. */
function pickDeterministicImage(seed, options) {
  const list = options.filter(Boolean);
  if (list.length === 0) return TOWN_FALLBACK_IMAGES[0];

  const text = String(seed || '').normalize('NFC');
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return list[hash % list.length];
}

/* ── Base dels recursos de l'amfitrió ─────────────────────────────────
   Les imatges de public/ viatgen DINS del paquet autònom. Incrustat en un
   amfitrió (un connector de WordPress, Sollutia), el paquet no viu a l'arrel
   del domini i '/assets/…' apuntaria als recursos de l'amfitrió, no als
   nostres. Qui munta l'app (l'element <soc-de-poble>, embed.jsx) fixa ací
   on viu el paquet, i resolveAsset() la usa quan la crida no en porta cap.
   Sense amfitrió la base és buida i tot resol com sempre (Llei del Píxel).
   És només presentació: no és cap origen de dades ni cap permís. */
let baseActual = '';

/* Espais, control (Cc), invisibles i bidi (Cf), barra inversa, cometes i
   angles: una base no en porta mai cap, i així el valor pot anar tal qual
   dins d'un src="…" o d'un url("…") sense trencar l'atribut. */
const RE_BASE_PERILLOSA = /[\s\p{Cc}\p{Cf}\\"'<>`]/u;

function normalitzaBaseRecursos(valor) {
  if (typeof valor !== 'string') return null;
  const text = valor.trim();
  if (!text || RE_BASE_PERILLOSA.test(text)) return null;
  if (text.split(/[?#]/)[0].split('/').some((segment) => segment === '.' || segment === '..')) return null;
  let url;
  if (text.startsWith('/')) {
    if (text.startsWith('//')) return null;
    try { url = new URL(text, 'http://x.invalid'); } catch { return null; }
    if (url.origin !== 'http://x.invalid') return null;
    return url.pathname.replace(/\/+$/, '');
  }
  try { url = new URL(text); } catch { return null; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
}

/**
 * Fixa la base dels recursos: una URL http(s) absoluta o un camí que comence
 * per una sola '/'. Es guarda l'origen i el camí, sense consulta, sense
 * fragment i sense barra final; '/' la buida. Qualsevol altra cosa (buit,
 * '//x', altres esquemes, credencials, segments '.' o '..') no canvia res.
 * Torna la base vigent.
 */
export function fixaBaseRecursos(url) {
  const nova = normalitzaBaseRecursos(url);
  if (nova !== null) baseActual = nova;
  return baseActual;
}

/** La base vigent: '' sense amfitrió. */
export function baseRecursos() {
  return baseActual;
}

/* ── La base des de l'script que ens carrega ──────────────────────────
   El paquet de l'amfitrió es carrega amb un <script src> clàssic, i les
   seues imatges viuen al costat d'eixe fitxer (dist/assets/…). Hi ha mòduls
   que resolen imatges EN IMPORTAR-SE (townsContent.js, marketContent.js),
   abans que l'element <soc-de-poble> puga fixar cap base.
   Decisió 5 del Mestre (261007, paquet trossejat) · Per defecte el paquet ja
   no és un IIFE: el <script src> és el carregador clàssic
   (carregadorDelPaquet.js), que captura la base, i l'app arriba com a mòdul
   ESM, on document.currentScript és null. Ara la base la fixa
   provisionalDelPaquet.js, el PRIMER import d'embed.jsx, amb la del
   carregador, abans que s'avaluen host.js i els mòduls d'imatges. Esta via
   només val per al paquet MONOLÍTIC (SDP_PAQUET=monolitic i la variant del
   directori de WordPress, un IIFE): com que tots els mòduls importen este
   fitxer, dins de l'IIFE s'avalua abans que ells i la base hi arriba a temps.
   document.currentScript només val durant l'execució síncrona d'un script
   clàssic; en un mòdul (el trossejat, el Vite de socdepoble.org en
   desenvolupament i en producció) i a les proves és null, i ací la base es
   queda buida i res no canvia (Llei del Píxel). */
function baseDeLScriptActual() {
  if (typeof document === 'undefined' || typeof HTMLScriptElement === 'undefined') return '';
  const script = document.currentScript;
  if (!(script instanceof HTMLScriptElement) || !script.src) return '';
  if (String(script.type || '').trim().toLowerCase() === 'module') return '';
  // blob: i data: no tenen carpeta: new URL() hi peta i no hi ha base.
  try { return new URL('./', script.src).href; } catch { return ''; }
}

fixaBaseRecursos(baseDeLScriptActual());

/* ── Política de mitjans del paquet (encàrrec 261019_1425) ─────────────
   El paquet del directori de WordPress.org no porta l'arxiu ni el contingut
   pesant, i el de l'autònom porta les bessones en lloc dels originals (D3):
   vite.standalone.config.js segella ací (define de
   import.meta.env.SDP_POLITICA_DE_MITJANS) quines carpetes es demanen a un
   origen extern i quins originals tenen bessona .webp, que viatja en el seu
   lloc. resolveAsset() n'és l'únic punt d'aplicació: la bessona en lloc de
   l'original i, per a una carpeta externa, l'origen extern en lloc de la base
   del paquet. Les dades no canvien mai (el cens, les llavors i les files del
   port continuen nomenant l'original); només el que es demana.
   Sense política (socdepoble.org, el natiu, les proves) tot resol com sempre
   (Llei del Píxel); l'autònom en porta una sense origen extern, només amb
   les bessones (D3). Una política mal formada no s'aplica. */
let politicaActual = null;

const RE_ORIGINAL = /^assets\/(?:[^/]+\/)*[^/]+\.(?:jpe?g|png)$/i;
const RE_PREFIX_EXTERN = /^assets\/(?:[^/.][^/]*\/)+$/;

function normalitzaPolitica(valor) {
  let dades = valor;
  if (typeof dades === 'string') {
    try { dades = JSON.parse(dades); } catch { return null; }
  }
  if (!dades || typeof dades !== 'object') return null;
  const bessones = Array.isArray(dades.bessones)
    ? dades.bessones.filter((cami) => typeof cami === 'string' && RE_ORIGINAL.test(cami) && !cami.split('/').includes('..'))
    : [];
  const externs = Array.isArray(dades.externs)
    ? dades.externs.filter((prefix) => typeof prefix === 'string' && RE_PREFIX_EXTERN.test(prefix))
    : [];
  const origen = normalitzaBaseRecursos(dades.origen);
  // L'origen extern és una adreça absoluta: un camí el faria penjar de l'amfitrió.
  const origenValid = origen && /^https?:\/\//i.test(origen) ? origen : '';
  if (!bessones.length && !(origenValid && externs.length)) return null;
  return Object.freeze({
    origen: origenValid,
    externs: Object.freeze(origenValid ? externs : []),
    bessones: new Set(bessones),
    // La bessona → el seu original, per al recurs de pintat (fallbackBessones.js).
    originals: new Map(bessones.map((cami) => [cami.replace(/\.[^./]+$/, '.webp'), cami]))
  });
}

/**
 * Fixa la política de mitjans: { origen, externs: ['assets/…/'], bessones:
 * ['assets/…/x.jpg'] }, com a objecte o JSON. null, o un valor mal format,
 * la retira. Torna la vigent.
 */
export function fixaPoliticaDeMitjans(valor) {
  politicaActual = normalitzaPolitica(valor);
  return politicaActual;
}

/** L'origen extern de la política vigent ('' si no n'hi ha cap). */
export function origenDeMitjansExterns() {
  return politicaActual?.origen || '';
}

/** Cert si hi ha una política de mitjans vigent (el paquet del directori o l'autònom). */
export function hiHaPoliticaDeMitjans() {
  return politicaActual !== null;
}

/**
 * L'adreça de l'original d'una bessona que s'ha demanat (absoluta o relativa,
 * amb consulta o fragment), o '' si no és cap bessona de la política vigent.
 * El recurs de pintat la demana quan la bessona no arriba (un origen extern
 * encara sense desplegar): mateixa base o origen, mateixa consulta.
 */
export function recursOriginalDeBessona(url) {
  if (!politicaActual || typeof url !== 'string') return '';
  const fi = url.search(/[?#]/);
  const cami = fi === -1 ? url : url.slice(0, fi);
  const resta = fi === -1 ? '' : url.slice(fi);
  for (let pos = cami.indexOf('assets/'); pos !== -1; pos = cami.indexOf('assets/', pos + 1)) {
    if (pos > 0 && cami[pos - 1] !== '/') continue;
    const original = politicaActual.originals.get(cami.slice(pos));
    if (original) return `${cami.slice(0, pos)}${original}${resta}`;
  }
  return '';
}

/* Revisió adversarial (261019) · La clau de l'entorn i no una global: Vite
   la substituïx pel valor segellat als builds del directori i de l'autònom
   i, als que no en porten (el natiu, socdepoble.org), per undefined. Cap
   amfitrió no pot instal·lar una política des de la pàgina (Model B: els
   orígens els tria i els segella Sóc de Poble). Fora de Vite (node --test)
   import.meta.env no existix: llavors tampoc no hi ha política. */
let politicaSegellada;
try { politicaSegellada = import.meta.env.SDP_POLITICA_DE_MITJANS; } catch { politicaSegellada = undefined; }
fixaPoliticaDeMitjans(politicaSegellada);

/* Gauntlet 261017 (I34) · El principi d'un camí propi que no és cap
   carpeta: barres (també la inversa, que el navegador llig com a barra) i
   segments de punts ('./', '../', '.', '..'). Es lleva sencer abans de posar
   la base: '../assets/x' no puja mai fora de la carpeta del paquet, i '//x' o
   '/\x' no es tornen mai una adreça d'un altre lloc. */
const RE_INICI_SENSE_CARPETA = /^(?:[/\\]+|\.{1,2}(?:[/\\]|$))+/;
// Tabuladors i salts de línia: el parser d'URL els lleva d'on siguen.
const RE_TAB_O_SALT = /[\t\n\r]/g;
/* Revisió del Gauntlet 261017 (Decisió 3, imatges de tercers) · Una barra
   inversa o un caràcter de control entre les barres i els punts del principi
   ('/\rastreig.example/p.gif', '/\t/fora.example/x.png') amaga un altre lloc:
   no es resol i torna ''. Rentar-lo a un camí propi el feia passar pel filtre
   d'imatges pròpies (fontImatgePropia) i el Mur pintava una imatge trencada
   en lloc de la silueta de sempre. '//x' continua sent el camí propi '/x'. */
const RE_INICI_AMB_ORIGEN_AMAGAT = /^[/.]*[\\\u0000-\u001F\u007F]/;

export function resolveAsset(path, basePath = '/', pluginUrl = '', version = '') {
  if (!path) return '';
  /* Gauntlet 261017 (I34) · Sense espais als extrems: ' /assets/x.png' donava
     '/ /assets/x.png' i ' https://…', '/ https://…'. Només espais, buit. */
  const ruta = String(path).trim();
  if (!ruta) return '';
  if (/^(?:https?:\/\/|data:|blob:)/i.test(ruta)) return ruta;
  if (RE_INICI_AMB_ORIGEN_AMAGAT.test(ruta)) return '';

  let base = String(basePath || '').replace(/\/$/, '');
  if (base === '/') base = '';
  if (pluginUrl) {
    base = String(pluginUrl).replace(/\/$/, '');
  }

  /* Sense base pròpia a la crida, la de l'amfitrió. Un camí que ja penja
     d'una base-camí no es torna a prefixar: resoldre dues vegades el mateix
     recurs (PageFrame → BarraTaronja) dona el mateix resultat. */
  if (!base && baseActual) {
    const jaResolt = baseActual.startsWith('/') && (ruta === baseActual || ruta.startsWith(`${baseActual}/`));
    if (!jaResolt) base = baseActual;
  }
  const cami = ruta.replace(RE_TAB_O_SALT, '').replace(RE_INICI_SENSE_CARPETA, '');

  /* C08 · La versió va a la consulta, abans del fragment: '#crop?v=7' no
     arribava mai al servidor. Sense versió, el camí tal qual. */
  const posFragment = cami.indexOf('#');
  const senseFragment = posFragment === -1 ? cami : cami.slice(0, posFragment);
  const fragment = posFragment === -1 ? '' : cami.slice(posFragment);
  const query = version ? `${senseFragment.includes('?') ? '&' : '?'}v=${version}` : '';

  if (politicaActual) {
    /* Encàrrec 261019_1425 · La política mira el fitxer, sense la consulta: la
       bessona en lloc de l'original i, per a una carpeta externa, l'origen
       extern en lloc de qualsevol base (el paquet no la porta). */
    const posConsulta = senseFragment.indexOf('?');
    let fitxer = posConsulta === -1 ? senseFragment : senseFragment.slice(0, posConsulta);
    const consulta = posConsulta === -1 ? '' : senseFragment.slice(posConsulta);
    if (politicaActual.bessones.has(fitxer)) fitxer = fitxer.replace(/\.[^./]+$/, '.webp');
    if (politicaActual.externs.some((prefix) => fitxer.startsWith(prefix))) base = politicaActual.origen;
    return `${base}/${fitxer}${consulta}${query}${fragment}`;
  }

  return `${base}/${senseFragment}${query}${fragment}`;
}

/* Els src="/assets/…" d'un HTML de contingut (PAGE_COPY, les pàgines del
   servidor) es resolen en PINTAR-LO, no en importar-lo: així hi val la base
   que l'amfitrió fixe després. Sense base torna l'HTML intacte (Llei del
   Píxel). Va ABANS de sanitizeHtml(), que continua sent l'última paraula
   sobre qualsevol HTML que entra a l'arbre. */
const RE_SRC_RECURS = /(\ssrc\s*=\s*)(["'])(\/assets\/[^"'<>\s]*)\2/gi;

export function resolRecursosDeHtml(html) {
  if ((!baseActual && !politicaActual) || typeof html !== 'string') return html;
  return html.replace(RE_SRC_RECURS, (_, atribut, cometa, ruta) => `${atribut}${cometa}${resolveAsset(ruta)}${cometa}`);
}

/* Un valor d'imatge en PINTAR-LO (Mercat, TargetaViva): només un recurs
   propi, '/assets/…', passa per la base. La resta torna tal qual: una URL
   https:, un data:, una referència opaca sdp-media:// (la resol el port), un
   camí relatiu o qualsevol cosa que no siga text. Mai es reescriuen les dades
   guardades, només el que es pinta. Sense base, el mateix valor. */
export function resolRecursPropi(valor) {
  if ((!baseActual && !politicaActual) || typeof valor !== 'string' || !valor.startsWith('/assets/')) return valor;
  return resolveAsset(valor);
}

/* Gauntlet 261017 (I34) · Les branques nominals: el poble i l'índex de la
   seua reserva, en este ordre (el primer que casa mana: 'Alcoleja i Sella' és
   Sella, com abans). Casen amb el nom sencer dins del text normalitzat (sense
   accents, en minúscules), no amb un tros: 'Rossella' ja no és Sella. Els
   límits són qualsevol cosa que no siga una lletra ASCII (també '-', '_',
   '/', '.' i les xifres): un slug o un camí ('img_sella.jpg', 'xixona2.jpg')
   continua casant. Sense lookbehind: Baseline Safari 16.0. */
const BRANQUES_NOMINALS = Object.freeze([
  ['benifallim', 0], ['sella', 3], ['orxeta', 4], ['relleu', 5], ['alcoleja', 6], ['xixona', 7], ['tibi', 8]
].map(([nom, index]) => Object.freeze({ nom, index, patro: new RegExp(`(?:^|[^a-z])${nom}(?:[^a-z]|$)`) })));

function resolveTownImageUrl(value, context = '', seed = '', basePath = '/', pluginUrl = '', version = '') {
  const raw = String(value || '').trim();
  const text = normalizeText(`${raw} ${context}`);

  if (/^https?:\/\//i.test(raw)) return raw;
  if (
    raw &&
    !raw.startsWith('/assets/uploads/poble/') &&
    !raw.startsWith('/assets/img/') &&
    !raw.startsWith('/assets/images/towns/')
  ) {
    return resolveAsset(raw, basePath, pluginUrl, version);
  }

  const branca = BRANQUES_NOMINALS.find(({ patro }) => patro.test(text));
  if (branca) return resolveAsset(TOWN_FALLBACK_IMAGES[branca.index], basePath, pluginUrl, version);

  return resolveAsset(pickDeterministicImage(seed || text, TOWN_FALLBACK_IMAGES), basePath, pluginUrl, version);
}

export { resolveTownImageUrl, TOWN_FALLBACK_IMAGES };

