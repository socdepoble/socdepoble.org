import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { registerSeo } from './seoHead.js';

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
test('S6 · la imatge base (marcada o amb la mateixa URL) deixa intacte el conjunt del document', () => {
  ambImatgeBase();
  for (const image of [{ url: 'https://example.org/una-altra-ruta.png', base: true }, LOGO]) {
    const cleanup = ambImatge(image);
    expect(['og:image', 'og:image:width', 'og:image:height', 'og:image:alt'].map(propietat))
      .toEqual([LOGO, '1200', '630', 'Logotip de prova']);
    expect(propietat('twitter:card')).toBe('summary_large_image');
    cleanup(); cleanups = [];
  }
});
test('S6 · sense imatge al document, la base marcada només publica la URL', () => {
  ambImatge({ url: LOGO, base: true });
  expect(propietat('og:image')).toBe(LOGO);
  expect(['og:image:width', 'og:image:height', 'og:image:alt'].map(propietat)).toEqual([null, null, null]);
});
