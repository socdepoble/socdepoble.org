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
