import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mock = vi.hoisted(() => ({ entrada: 1, escriu: vi.fn() }));
vi.mock('./backendPort.js', () => ({ teCapacitat: cap => cap === 'edicioEditorial', adminActualitzaPublicacioEditorial: mock.escriu }));
vi.mock('./identitat.js', () => ({ entradaSessio: () => mock.entrada, capturaSessio: () => {
  const entrada = mock.entrada;
  return () => { if (entrada !== mock.entrada) throw new DOMException('Sessió canviada.', 'AbortError'); };
} }));
const CLAU = 'sdp_embed_publicacions.revisions.v1';
const CONFIG_A = { dataMode: 'remote', backendUrl: 'https://a.invalid' };
const CONFIG_B = { dataMode: 'remote', backendUrl: 'https://b.invalid' };
const element = { id: 'manifest', _editorialClau: 'feedPosts', _editorialVersio: 7 };
let a, b, disposa;
beforeEach(async () => {
  vi.resetAllMocks(); mock.entrada = 1; window.localStorage.removeItem(CLAU); disposa = [];
  vi.resetModules(); a = await import('./revisionsEditorials.js');
  vi.resetModules(); b = await import('./revisionsEditorials.js');
});
afterEach(() => { disposa.forEach(fn => fn()); window.localStorage.removeItem(CLAU); });
const storage = key => window.dispatchEvent(new StorageEvent('storage', { key }));

test('dues instàncies rellegeixen el storage durable; notificacions duplicades i fora d’ordre no reescriuen contingut antic', () => {
  const avisaA = vi.fn(), avisaB = vi.fn();
  disposa.push(a.subscriuRevisionsEditorials(avisaA), b.subscriuRevisionsEditorials(avisaB));
  expect(a.desaRevisioEditorial('mur', 'manifest', { title: 'Versió A' })).toBe(true);
  storage(CLAU); expect(b.revisioEditorial('mur', 'manifest')).toMatchObject({ title: 'Versió A' });
  expect(b.desaRevisioEditorial('mur', 'manifest', { title: 'Versió B', content: '<p>Nou</p>' })).toBe(true);
  storage(CLAU); storage(CLAU); storage(null);
  expect(a.revisioEditorial('mur', 'manifest')).toEqual(b.revisioEditorial('mur', 'manifest'));
  expect(a.revisioEditorial('mur', 'manifest')).toMatchObject({ title: 'Versió B', content: '<p>Nou</p>' });
  const abans = avisaA.mock.calls.length; storage('clau-aliena'); expect(avisaA).toHaveBeenCalledTimes(abans);
});

test('l’ACK antic d’A no marca la revisió escrita des de B després de logout-login i canvi de backend', async () => {
  let releaseA;
  mock.escriu.mockImplementationOnce(() => new Promise(r => { releaseA = r; })).mockResolvedValueOnce({ versio: 8 });
  const pendent = a.desaRevisioEditorialAmbServidor('mur', element, { content: '<p>A privada</p>' }, { config: CONFIG_A, esSuperadmin: true });
  await vi.waitFor(() => expect(releaseA).toEqual(expect.any(Function)));
  mock.entrada += 1;
  const actual = await b.desaRevisioEditorialAmbServidor('mur', element, { title: 'B actual' }, { config: CONFIG_B, esSuperadmin: true });
  expect(actual).toMatchObject({ desti: 'servidor', versio: 8 });
  expect(mock.escriu.mock.calls[1][0].canvis).toEqual({ title: 'B actual' });
  expect(mock.escriu.mock.calls[1][1]).toMatchObject(CONFIG_B);
  const storageB = window.localStorage.getItem(CLAU);
  releaseA({ versio: 8 });
  expect(await pendent).toMatchObject({ desti: 'navegador', motiu: 'avortada' });
  expect(window.localStorage.getItem(CLAU)).toBe(storageB);
});
