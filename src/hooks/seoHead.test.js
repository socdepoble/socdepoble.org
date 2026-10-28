import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { registerSeo } from './seoHead.js';
import { ATRIBUT_SSR, CAP_SOCIAL_BASE, ORIGEN_SOCIAL_PER_DEFECTE } from '../config/imatgeSocial.js';

let cleanups;
beforeEach(() => {
  cleanups = [];
  const title = document.createElement('title'); title.textContent = 'Host';
  const meta = document.createElement('meta'); meta.name = 'description'; meta.content = 'Host description';
  document.head.replaceChildren(title, meta);
});
afterEach(() => {
  cleanups.reverse().forEach(cleanup => cleanup());
  vi.unstubAllGlobals();
});
const data = { path: '/mercat', title: 'Mercat', index: true, canonical: 'https://example.test/mercat' };
const register = options => {
  const cleanup = registerSeo(Symbol('owner'), data, options);
  cleanups.push(cleanup);
  return cleanup;
};

test.each([undefined, null, {}, { manageDocumentHead: false }, { manageDocumentHead: 'true' }])('direct registry call requires explicit boolean authority: %j', options => {
  const before = document.head.innerHTML;
  register(options);
  expect(document.head.innerHTML).toBe(before);
});

test('authorized standalone owner updates and restores the host metadata', () => {
  const before = document.head.innerHTML;
  const cleanup = register({ manageDocumentHead: true });
  expect(document.title).toBe('Mercat | Sóc de Poble');
  expect(document.head.querySelector('link[rel="canonical"]').href).toBe(data.canonical);
  cleanup(); cleanups = [];
  expect(document.head.innerHTML).toBe(before);
});

test.each(['embedded', 'iframe'])('explicit authority cannot bypass %s boundary', mode => {
  const before = document.head.innerHTML;
  vi.stubGlobal('window', mode === 'embedded'
    ? { self: 1, top: 1, __SDP_EMBEDDED__: true }
    : { self: 1, top: 2 });
  register({ manageDocumentHead: true });
  expect(document.head.innerHTML).toBe(before);
});

test('denied registration cannot alter an existing authorized owner', () => {
  register({ manageDocumentHead: true });
  const before = document.head.innerHTML;
  const denied = registerSeo(Symbol('denied'), { ...data, title: 'Unauthorized' }, { manageDocumentHead: false });
  denied();
  expect(document.head.innerHTML).toBe(before);
});

/* S6 · Conjunt d'imatge: URL, MIME, mides i alt no es barregen mai entre imatges. */
const LOGO = 'https://example.org/assets/system/ui/og-socdepoble-1200x630.png';
const CISTELLA = 'https://example.org/media/cistella.jpg';
function ambImatgeBase() {
  for (const [property, content] of [['og:image', LOGO], ['og:image:width', '1200'], ['og:image:height', '630'], ['og:image:alt', 'Logotip de prova']]) {
    const node = document.createElement('meta'); node.setAttribute('property', property); node.content = content;
    document.head.appendChild(node);
  }
}
const propietat = nom => document.head.querySelector(`meta[property="${nom}"], meta[name="${nom}"]`)?.content ?? null;
const ambImatge = image => {
  const cleanup = registerSeo(Symbol('vista'), { ...data, image }, { manageDocumentHead: true });
  cleanups.push(cleanup);
  return cleanup;
};

test('S6 · una imatge sense propietats elimina les de la base i desmuntar restaura el head exacte', () => {
  ambImatgeBase();
  const before = document.head.innerHTML;
  const cleanup = ambImatge({ url: CISTELLA });
  expect([propietat('og:image'), propietat('twitter:image')]).toEqual([CISTELLA, CISTELLA]);
  expect(['og:image:width', 'og:image:height', 'og:image:alt', 'og:image:type', 'twitter:image:alt'].map(propietat))
    .toEqual([null, null, null, null, null]);
  cleanup(); cleanups = [];
  expect(document.head.innerHTML).toBe(before);
});
test('S6 · una imatge amb conjunt el publica sencer i el desmuntatge no deixa òrfenes', () => {
  const before = document.head.innerHTML;
  const cleanup = ambImatge({ url: CISTELLA, type: 'image/jpeg', width: '800', height: '600', alt: 'Cistella de fruita' });
  expect(['og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt', 'twitter:image:alt'].map(propietat))
    .toEqual(['image/jpeg', '800', '600', 'Cistella de fruita', 'Cistella de fruita']);
  cleanup(); cleanups = [];
  expect(document.head.innerHTML).toBe(before);
});
/* Pla 261027_1154 (P1-61) · S3. Esta prova substituïx la que fixava el salt:
   una imatge marcada `base` o amb la mateixa URL que el document deixava el
   conjunt del document tal com estava. Amb un head servit particular, eixe
   conjunt era la foto del producte d'entrada. Ara cada imatge s'escriu
   sencera, amb el seu conjunt o cap, i desmuntar torna el document exacte. */
test('S3 · la imatge amb la mateixa URL que el document (o marcada base) s’escriu sencera: no hereta el conjunt del document', () => {
  ambImatgeBase();
  const before = document.head.innerHTML;
  for (const image of [{ url: 'https://example.org/una-altra-ruta.png', base: true }, LOGO]) {
    const url = image.url || image;
    const cleanup = ambImatge(image);
    expect(['og:image', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt', 'twitter:image', 'twitter:image:alt']
      .map(propietat)).toEqual([url, null, null, null, null, url, null]);
    expect(propietat('twitter:card')).toBe('summary_large_image');
    cleanup(); cleanups = [];
    expect(document.head.innerHTML).toBe(before);
  }
  const { type, width, height, alt } = CAP_SOCIAL_BASE.image;
  ambImatge({ url: LOGO, type, width, height, alt });
  expect(['og:image', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt', 'twitter:image', 'twitter:image:alt']
    .map(propietat)).toEqual([LOGO, type, width, height, alt, LOGO, alt]);
});
test('S6 · sense imatge al document, la base marcada només publica la URL', () => {
  ambImatge({ url: LOGO, base: true });
  expect(propietat('og:image')).toBe(LOGO);
  expect(['og:image:width', 'og:image:height', 'og:image:alt'].map(propietat)).toEqual([null, null, null]);
});

/* Pla 261027_1154 (P1-61) · S3. El head que servirà el prerender per a la
   samarreta (fila app_content.marketItems de producció, només camins): cada
   node propi de la ruta porta ATRIBUT_SSR, i el JSON-LD també data-sdp-seo.
   Els nodes sense marca (og:site_name i el JSON-LD WebSite d'index.html) són
   del lloc, no de la ruta. */
const FOTO = 'https://socdepoble.org/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png';
const DESCRIPCIO_SAMARRETA = 'Mapa del tresor sobre cotó resistent. La imatge complementa el text, no el substituïx.';
const HEAD_SERVIT = `
  <title ${ATRIBUT_SSR}>Samarreta Sóc de Poble | Sóc de Poble</title>
  <meta property="og:site_name" content="Sóc de Poble">
  <meta name="description" content="${DESCRIPCIO_SAMARRETA}" ${ATRIBUT_SSR}>
  <link rel="canonical" href="https://socdepoble.org/mercat/samarreta-socdepoble" ${ATRIBUT_SSR}>
  <meta property="og:url" content="https://socdepoble.org/mercat/samarreta-socdepoble" ${ATRIBUT_SSR}>
  <meta property="og:title" content="Samarreta Sóc de Poble | Sóc de Poble" ${ATRIBUT_SSR}>
  <meta property="og:description" content="${DESCRIPCIO_SAMARRETA}" ${ATRIBUT_SSR}>
  <meta property="og:type" content="product" ${ATRIBUT_SSR}>
  <meta property="og:image" content="${FOTO}" ${ATRIBUT_SSR}>
  <meta property="og:image:type" content="image/jpeg" ${ATRIBUT_SSR}>
  <meta property="og:image:width" content="1024" ${ATRIBUT_SSR}>
  <meta property="og:image:height" content="1024" ${ATRIBUT_SSR}>
  <meta property="og:image:alt" content="Samarreta Sóc de Poble" ${ATRIBUT_SSR}>
  <meta property="product:price:amount" content="15.00" ${ATRIBUT_SSR}>
  <meta name="twitter:card" content="summary_large_image" ${ATRIBUT_SSR}>
  <meta name="twitter:title" content="Samarreta Sóc de Poble | Sóc de Poble" ${ATRIBUT_SSR}>
  <meta name="twitter:description" content="${DESCRIPCIO_SAMARRETA}" ${ATRIBUT_SSR}>
  <meta name="twitter:image" content="${FOTO}" ${ATRIBUT_SSR}>
  <meta name="twitter:image:alt" content="Samarreta Sóc de Poble" ${ATRIBUT_SSR}>
  <script type="application/ld+json" data-sdp-seo="true" ${ATRIBUT_SSR}>{"@type":"Product","name":"Samarreta Sóc de Poble"}</script>
  <script type="application/ld+json">{"@type":"WebSite","name":"Sóc de Poble"}</script>`;
const ambHeadServit = () => { document.head.innerHTML = HEAD_SERVIT; };
const GENERICA = new URL(CAP_SOCIAL_BASE.image.url, ORIGEN_SOCIAL_PER_DEFECTE).href;
/* El head genèric que ha de quedar: CAP_SOCIAL_BASE i res de la ruta servida. */
const METES_GENERIQUES = {
  description: CAP_SOCIAL_BASE.description, 'og:site_name': 'Sóc de Poble',
  'og:title': CAP_SOCIAL_BASE.title, 'og:description': CAP_SOCIAL_BASE.description, 'og:type': 'website',
  'og:image': GENERICA, 'og:image:type': 'image/png', 'og:image:width': '1200', 'og:image:height': '630',
  'og:image:alt': CAP_SOCIAL_BASE.image.alt, 'twitter:card': 'summary_large_image', 'twitter:title': CAP_SOCIAL_BASE.title,
  'twitter:description': CAP_SOCIAL_BASE.description, 'twitter:image': GENERICA, 'twitter:image:alt': CAP_SOCIAL_BASE.image.alt
};
const metes = () => {
  const files = [...document.head.querySelectorAll('meta[name], meta[property]')]
    .map(node => [node.getAttribute('property') || node.getAttribute('name'), node.content]);
  expect(new Set(files.map(([clau]) => clau)).size, 'cap etiqueta duplicada').toBe(files.length);
  return Object.fromEntries(files);
};
const AMA = { manageDocumentHead: true };

test('S3 · un head servit amb data-sdp-ssr no és la base: la ruta sense imatge pròpia porta el genèric i desmuntar torna CAP_SOCIAL_BASE', () => {
  ambHeadServit();
  const { type, width, height, alt } = CAP_SOCIAL_BASE.image;
  const cleanup = registerSeo(Symbol('mur'), { path: '/mur', title: 'Mur', index: true, canonical: 'https://socdepoble.org/mur',
    image: { url: GENERICA, type, width, height, alt } }, AMA);
  cleanups.push(cleanup);
  expect(document.head.querySelector(`[${ATRIBUT_SSR}]`)).toBeNull();
  expect(metes()).toEqual({ ...METES_GENERIQUES, 'og:title': 'Mur | Sóc de Poble', 'twitter:title': 'Mur | Sóc de Poble',
    'og:url': 'https://socdepoble.org/mur' });
  expect(document.title).toBe('Mur | Sóc de Poble');
  expect(document.head.querySelector('script[data-sdp-seo]')).toBeNull();
  expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  cleanup(); cleanups = [];
  expect(metes()).toEqual(METES_GENERIQUES);
  expect(document.title).toBe(CAP_SOCIAL_BASE.title);
  expect(document.head.querySelectorAll('title')).toHaveLength(1);
  expect(document.head.querySelector(`[${ATRIBUT_SSR}], link[rel="canonical"], script[data-sdp-seo]`)).toBeNull();
  // El JSON-LD del lloc, sense data-sdp-seo, no és de cap ruta: es queda intacte.
  expect([...document.head.querySelectorAll('script[type="application/ld+json"]')].map(node => node.textContent))
    .toEqual(['{"@type":"WebSite","name":"Sóc de Poble"}']);
});
test('S3 · amb el head servit, una vista que no porta imatge ni descripció no hereta les del producte', () => {
  ambHeadServit();
  register(AMA);
  expect([propietat('og:image'), propietat('twitter:image'), propietat('twitter:card')]).toEqual([null, null, null]);
  expect(['description', 'og:description', 'twitter:description', 'og:type'].map(propietat))
    .toEqual([CAP_SOCIAL_BASE.description, CAP_SOCIAL_BASE.description, CAP_SOCIAL_BASE.description, 'website']);
  expect(document.head.querySelector('meta[property^="product:"]')).toBeNull();
});
test('S3 · un segon registre després de desmuntar-ho tot parteix del mateix head genèric', () => {
  ambHeadServit();
  registerSeo(Symbol('a'), { ...data, image: GENERICA }, AMA)();
  const generic = document.head.innerHTML;
  registerSeo(Symbol('b'), { ...data, ogType: 'article', image: FOTO }, AMA)();
  expect(document.head.innerHTML).toBe(generic);
  expect(metes()).toEqual(METES_GENERIQUES);
});
test('S3 · sense autoritat, el head servit no es toca: ni els nodes marcats', () => {
  ambHeadServit();
  const before = document.head.innerHTML;
  for (const options of [undefined, { manageDocumentHead: false }]) register(options);
  expect(document.head.innerHTML).toBe(before);
  expect(document.head.querySelectorAll(`[${ATRIBUT_SSR}]`).length).toBeGreaterThan(0);
});
test('S3 · og:type és de la ruta: data.ogType o website, i desmuntar torna el del document', () => {
  const before = document.head.innerHTML;
  const producte = registerSeo(Symbol('producte'), { ...data, ogType: 'product' }, AMA);
  cleanups.push(producte);
  expect(propietat('og:type')).toBe('product');
  producte(); cleanups = [];
  expect(document.head.innerHTML).toBe(before);
  register(AMA);
  expect(propietat('og:type')).toBe('website');
});
test('S3 · sense marca, la base continua sent el head servit; la descripció de reserva, però, és la genèrica', () => {
  const before = document.head.innerHTML;
  const cleanup = register(AMA);
  expect(propietat('description')).toBe(CAP_SOCIAL_BASE.description);
  cleanup(); cleanups = [];
  expect(document.head.innerHTML).toBe(before);
  expect(propietat('description')).toBe('Host description');
});
/* Pla 261027_1154 (P1-61) · Revisió adversarial (261027) · El head servit és
   el de la ruta que declara el seu canonical (o og:url) marcat. Mentre l'SPA
   hi és, mana ell: ni la reserva (prioritat 0) ni la vista no el substituïxen.
   En canviar de ruta, els nodes marcats se'n van i la base és la genèrica. Un
   head marcat que no declara cap ruta se'n va en el primer registre. */
const SAMARRETA = '/mercat/samarreta-socdepoble';
test('Revisió 261027 · a la ruta que declara el head servit, cap registre no el toca; en eixir-ne, cap node servit', () => {
  ambHeadServit();
  const servit = document.head.innerHTML;
  const reserva = registerSeo(Symbol('ruta'), { path: SAMARRETA, priority: 0, title: 'Mercat', index: true }, AMA);
  cleanups.push(reserva);
  const vista = registerSeo(Symbol('fitxa'), { path: SAMARRETA, title: null, index: true, image: null }, AMA);
  cleanups.push(vista);
  expect(document.head.innerHTML).toBe(servit);
  // Amb barra final, la mateixa ruta.
  const barra = registerSeo(Symbol('barra'), { path: `${SAMARRETA}/`, title: 'No trobat', index: true }, AMA);
  expect(document.head.innerHTML).toBe(servit);
  barra();
  expect(document.head.innerHTML).toBe(servit);
  // Una altra ruta: fora els nodes marcats, el genèric i la vista nova.
  const mur = registerSeo(Symbol('mur'), { path: '/mur', priority: 0, title: 'Mur', index: true, canonical: 'https://socdepoble.org/mur' }, AMA);
  cleanups.push(mur);
  expect(document.head.querySelector(`[${ATRIBUT_SSR}]`)).toBeNull();
  expect(document.head.querySelector('meta[property^="product:"], script[data-sdp-seo]')).toBeNull();
  expect(document.title).toBe('Mur | Sóc de Poble');
  expect(propietat('og:type')).toBe('website');
});
test('Revisió 261027 · un head marcat sense canonical ni og:url marcats se’n va en el primer registre', () => {
  ambHeadServit();
  document.head.querySelectorAll('link[rel="canonical"], meta[property="og:url"]').forEach(node => node.remove());
  register(AMA);
  expect(document.head.querySelector(`[${ATRIBUT_SSR}]`)).toBeNull();
  expect(document.head.querySelector('meta[property^="product:"]')).toBeNull();
  expect(propietat('description')).toBe(CAP_SOCIAL_BASE.description);
});
test('Revisió 261027 · si la primera ruta registrada no és la del head servit (una redirecció del client), els nodes marcats se’n van', () => {
  ambHeadServit();
  register(AMA);
  expect(document.head.querySelector(`[${ATRIBUT_SSR}]`)).toBeNull();
  expect(document.title).toBe('Mercat | Sóc de Poble');
});
test('Revisió 261027 · desmuntar-ho tot a la ruta servida deixa el head servit; sense autoritat, tampoc no es toca', () => {
  ambHeadServit();
  const servit = document.head.innerHTML;
  registerSeo(Symbol('fitxa'), { path: SAMARRETA, title: 'Samarreta', index: true }, AMA)();
  expect(document.head.innerHTML).toBe(servit);
  registerSeo(Symbol('fora'), { path: SAMARRETA, title: 'Samarreta' }, { manageDocumentHead: false })();
  expect(document.head.innerHTML).toBe(servit);
});

/* Pla 261028_1526 (P1-61, Fase 2) · La ruta del head servit i la dels
   propietaris són claus socials (config/rutaSocial.js): a /wikidepoble porten
   el seu ?item=. El head servit del document A no es congela quan l'app obri
   el document B al mateix camí; el de la forma de camí (/wikidepoble/<id>,
   decisió 2 del Mestre) és el mateix document que ?item=<id>. */
const LLIBRE = 'https://socdepoble.org/wikidepoble?item=03_llibre_d_or_memoria_episodica';
const ambHeadDeDocument = (canonical = LLIBRE) => {
  document.head.innerHTML = `
    <title ${ATRIBUT_SSR}>El Llibre d'Or | Sóc de Poble</title>
    <meta property="og:site_name" content="Sóc de Poble">
    <meta name="description" content="Memòria contrastada" ${ATRIBUT_SSR}>
    <meta property="og:title" content="El Llibre d'Or | Sóc de Poble" ${ATRIBUT_SSR}>
    <meta property="og:type" content="article" ${ATRIBUT_SSR}>
    ${canonical ? `<link rel="canonical" href="${canonical}" ${ATRIBUT_SSR}>
    <meta property="og:url" content="${canonical}" ${ATRIBUT_SSR}>` : ''}`;
};
test('Fase 2 · el head servit de ?item=A es queda a A (també amb altres paràmetres) i se’n va en obrir ?item=B', () => {
  ambHeadDeDocument();
  const servit = document.head.innerHTML;
  const reserva = registerSeo(Symbol('reserva'), { path: '/wikidepoble?item=03_llibre_d_or_memoria_episodica', priority: 0, title: 'Wiki de Poble', index: false }, AMA);
  const documentA = registerSeo(Symbol('document'), { path: '/wikidepoble?categoria=folder%3A01_ser&item=03_llibre_d_or_memoria_episodica', title: 'El Llibre d’Or', index: true }, AMA);
  expect(document.head.innerHTML).toBe(servit);
  // L'app obri B al mateix camí: la reserva de la ruta (RouteSEO) es torna a registrar amb la clau nova.
  documentA(); reserva();
  cleanups.push(registerSeo(Symbol('reserva B'), { path: '/wikidepoble?item=el_projecte', priority: 0, title: 'Wiki de Poble', index: false }, AMA));
  cleanups.push(registerSeo(Symbol('b'), { path: '/wikidepoble?item=el_projecte', title: 'El projecte', index: true,
    canonical: 'https://socdepoble.org/wikidepoble?item=el_projecte' }, AMA));
  expect(document.head.querySelector(`[${ATRIBUT_SSR}]`)).toBeNull();
  expect(document.title).toBe('El projecte | Sóc de Poble');
  expect(document.head.querySelector('link[rel="canonical"]').href).toBe('https://socdepoble.org/wikidepoble?item=el_projecte');
  expect(propietat('og:type')).toBe('website');
  expect(document.head.querySelectorAll('meta[property="og:site_name"]')).toHaveLength(1);
});
test('Fase 2 · el camí sol (/wikidepoble) no és la ruta d’un document servit: els nodes marcats se’n van', () => {
  ambHeadDeDocument();
  cleanups.push(registerSeo(Symbol('llista'), { path: '/wikidepoble', priority: 0, title: 'Wiki de Poble', index: true }, AMA));
  expect(document.head.querySelector(`[${ATRIBUT_SSR}]`)).toBeNull();
  expect(document.title).toBe('Wiki de Poble | Sóc de Poble');
});
test('Fase 2 · la forma de camí /wikidepoble/<id> és la mateixa clau que ?item=<id>: el head servit no es purga en la redirecció', () => {
  ambHeadDeDocument();
  const servit = document.head.innerHTML;
  cleanups.push(registerSeo(Symbol('camí'), { path: '/wikidepoble/03_llibre_d_or_memoria_episodica', priority: 0, title: 'Wiki de Poble', index: false }, AMA));
  expect(document.head.innerHTML).toBe(servit);
  cleanups.push(registerSeo(Symbol('consulta'), { path: '/wikidepoble?item=03_llibre_d_or_memoria_episodica', title: 'El Llibre d’Or', index: true }, AMA));
  expect(document.head.innerHTML).toBe(servit);
});
test('Fase 2 · el head servit de la llista (/wikidepoble, sense canonical) se’n va en el primer registre', () => {
  ambHeadDeDocument(null);
  cleanups.push(registerSeo(Symbol('document'), { path: '/wikidepoble?item=03_llibre_d_or_memoria_episodica', title: 'El Llibre d’Or', index: true,
    canonical: LLIBRE }, AMA));
  expect(document.head.querySelector(`[${ATRIBUT_SSR}]`)).toBeNull();
  expect(document.title).toBe('El Llibre d’Or | Sóc de Poble');
  expect(document.head.querySelector('link[rel="canonical"]').href).toBe(LLIBRE);
});

/* Revisió adversarial (261028) · Una vista que diu que la seua ruta no
   s'indexa (el que has bloquejat, «No trobat») mana sobre el head servit; la
   reserva de RouteSEO (prioritat 0) sense indexar, no. */
test('Revisió 261028 · a la ruta servida, una vista sense indexar purga el head servit; la reserva sense indexar, no', () => {
  ambHeadServit();
  const servit = document.head.innerHTML;
  cleanups.push(registerSeo(Symbol('reserva'), { path: SAMARRETA, priority: 0, title: 'Mercat', index: false }, AMA));
  expect(document.head.innerHTML).toBe(servit);
  // Una vista d'una altra ruta que encara no s'ha desmuntat no compta.
  const altra = registerSeo(Symbol('altra'), { path: '/notes', title: 'Notes', index: false }, AMA);
  expect(document.head.innerHTML).toBe(servit);
  altra();
  const esperant = registerSeo(Symbol('esperant'), { path: SAMARRETA, title: null, index: true }, AMA);
  expect(document.head.innerHTML).toBe(servit);
  esperant();
  cleanups.push(registerSeo(Symbol('bloquejat'), { path: SAMARRETA, title: null, index: false }, AMA));
  expect(document.head.querySelector(`[${ATRIBUT_SSR}]`)).toBeNull();
  expect(document.head.querySelector('meta[property^="product:"], script[data-sdp-seo], link[rel="canonical"], meta[property="og:url"]')).toBeNull();
  expect(document.title).toBe('Sóc de Poble');
  expect(propietat('robots')).toBe('noindex, nofollow');
  expect(propietat('og:image')).not.toBe(FOTO);
  expect(propietat('description')).toBe(CAP_SOCIAL_BASE.description);
});
test('Revisió 261028 · el head d’un document servit a /wikidepoble/<id> (og:url de camí, canonical ?item=) es queda a ?item=<id>', () => {
  ambHeadDeDocument();
  document.head.querySelector('meta[property="og:url"]').setAttribute('content', 'https://socdepoble.org/wikidepoble/03_llibre_d_or_memoria_episodica');
  const servit = document.head.innerHTML;
  cleanups.push(registerSeo(Symbol('camí'), { path: '/wikidepoble/03_llibre_d_or_memoria_episodica', priority: 0, title: 'Wiki de Poble', index: false }, AMA));
  cleanups.push(registerSeo(Symbol('consulta'), { path: '/wikidepoble?item=03_llibre_d_or_memoria_episodica', title: 'El Llibre d’Or', index: true }, AMA));
  expect(document.head.innerHTML).toBe(servit);
});
