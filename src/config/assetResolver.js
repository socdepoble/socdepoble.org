const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const TOWN_FALLBACK_IMAGES = [
  '/assets/img/hero_panoramic_landscape_1774710654078.png',
  '/assets/img/hero_panoramic_rural_view_1774720664221.png',
  '/assets/img/art_trellat_farmer_1774708525806.png',
  '/assets/img/nano_mercat_llaurador_1774197050578.png',
  '/assets/img/aplec_danses_1774952191348.png',
  '/assets/img/nano_mel_font_roja_1774216345755.png',
  '/assets/img/art_trellat_v2_1774708257858.png',
  '/assets/img/hero_serrella_comic_1774709602282.png',
  '/assets/img/nano_oli_oliva_1774198089084.png'
];

function pickDeterministicImage(seed, options) {
  const list = options.filter(Boolean);
  if (list.length === 0) return TOWN_FALLBACK_IMAGES[0];

  const text = String(seed || '');
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
   El paquet autònom (IIFE) es carrega amb un <script src> clàssic, i les
   seues imatges viuen al costat d'eixe fitxer (dist/assets/…). Hi ha mòduls
   que resolen imatges EN IMPORTAR-SE (townsContent.js, marketContent.js),
   abans que l'element <soc-de-poble> puga fixar cap base. Com que tots
   importen este fitxer, dins de l'IIFE s'avalua abans que ells: ací és l'únic
   lloc on la base arriba a temps. document.currentScript només val durant
   l'execució síncrona d'un script clàssic; en un mòdul (el Vite de
   socdepoble.org, en desenvolupament i en producció) i a les proves és null,
   la base es queda buida i res no canvia (Llei del Píxel). */
function baseDeLScriptActual() {
  if (typeof document === 'undefined' || typeof HTMLScriptElement === 'undefined') return '';
  const script = document.currentScript;
  if (!(script instanceof HTMLScriptElement) || !script.src) return '';
  if (String(script.type || '').trim().toLowerCase() === 'module') return '';
  // blob: i data: no tenen carpeta: new URL() hi peta i no hi ha base.
  try { return new URL('./', script.src).href; } catch { return ''; }
}

fixaBaseRecursos(baseDeLScriptActual());

export function resolveAsset(path, basePath = '/', pluginUrl = '', version = '') {
  if (!path) return '';
  if (/^(?:https?:\/\/|data:|blob:)/i.test(path)) return path;

  let base = String(basePath || '').replace(/\/$/, '');
  if (base === '/') base = '';
  if (pluginUrl) {
    base = String(pluginUrl).replace(/\/$/, '');
  }

  if (typeof path !== 'string') {
    path = String(path);
  }
  /* Sense base pròpia a la crida, la de l'amfitrió. Un camí que ja penja
     d'una base-camí no es torna a prefixar: resoldre dues vegades el mateix
     recurs (PageFrame → BarraTaronja) dona el mateix resultat. */
  if (!base && baseActual) {
    const jaResolt = baseActual.startsWith('/') && (path === baseActual || path.startsWith(`${baseActual}/`));
    if (!jaResolt) base = baseActual;
  }
  path = path.replace(/^\/+/, '');
  
  const separator = path.includes('?') ? '&' : '?';
  const query = version ? `${separator}v=${version}` : '';
  
  return base ? `${base}/${path}${query}` : `/${path}${query}`;
}

/* Els src="/assets/…" d'un HTML de contingut (PAGE_COPY, les pàgines del
   servidor) es resolen en PINTAR-LO, no en importar-lo: així hi val la base
   que l'amfitrió fixe després. Sense base torna l'HTML intacte (Llei del
   Píxel). Va ABANS de sanitizeHtml(), que continua sent l'última paraula
   sobre qualsevol HTML que entra a l'arbre. */
const RE_SRC_RECURS = /(\ssrc\s*=\s*)(["'])(\/assets\/[^"'<>\s]*)\2/gi;

export function resolRecursosDeHtml(html) {
  if (!baseActual || typeof html !== 'string') return html;
  return html.replace(RE_SRC_RECURS, (_, atribut, cometa, ruta) => `${atribut}${cometa}${resolveAsset(ruta)}${cometa}`);
}

/* Un valor d'imatge en PINTAR-LO (Mercat, TargetaViva): només un recurs
   propi, '/assets/…', passa per la base. La resta torna tal qual: una URL
   https:, un data:, una referència opaca sdp-media:// (la resol el port), un
   camí relatiu o qualsevol cosa que no siga text. Mai es reescriuen les dades
   guardades, només el que es pinta. Sense base, el mateix valor. */
export function resolRecursPropi(valor) {
  if (!baseActual || typeof valor !== 'string' || !valor.startsWith('/assets/')) return valor;
  return resolveAsset(valor);
}

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

  if (text.includes('benifallim')) return resolveAsset('/assets/img/hero_panoramic_landscape_1774710654078.png', basePath, pluginUrl, version);
  if (text.includes('sella')) return resolveAsset('/assets/img/nano_mercat_llaurador_1774197050578.png', basePath, pluginUrl, version);
  if (text.includes('orxeta')) return resolveAsset('/assets/img/aplec_danses_1774952191348.png', basePath, pluginUrl, version);
  if (text.includes('relleu')) return resolveAsset('/assets/img/nano_mel_font_roja_1774216345755.png', basePath, pluginUrl, version);
  if (text.includes('alcoleja')) return resolveAsset('/assets/img/art_trellat_v2_1774708257858.png', basePath, pluginUrl, version);
  if (text.includes('xixona')) return resolveAsset('/assets/img/hero_serrella_comic_1774709602282.png', basePath, pluginUrl, version);
  if (text.includes('tibi')) return resolveAsset('/assets/img/nano_oli_oliva_1774198089084.png', basePath, pluginUrl, version);
  if (raw.startsWith('/assets/images/towns/')) return resolveAsset(pickDeterministicImage(seed || text, TOWN_FALLBACK_IMAGES), basePath, pluginUrl, version);

  return resolveAsset(pickDeterministicImage(seed || text, TOWN_FALLBACK_IMAGES), basePath, pluginUrl, version);
}

export { resolveTownImageUrl, TOWN_FALLBACK_IMAGES };

