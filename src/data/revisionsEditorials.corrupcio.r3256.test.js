import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('./backendPort.js', () => ({ teCapacitat: () => false }));
vi.mock('./identitat.js', () => ({ entradaSessio: () => 1, capturaSessio: () => () => {} }));
const KEY = 'sdp_embed_publicacions.revisions.v1';
function netejaEditorial() {
  for (const key of Object.keys(localStorage)) if (key.startsWith('sdp_embed_publicacions.revisions')) localStorage.removeItem(key);
}
beforeEach(netejaEditorial);
afterEach(() => { netejaEditorial(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
test.each(['{"mur:old":', '[]', '"text recuperable"', '42', 'null', 'false', '',
  '{"mur:old":{"camps":{"title":"Antiga"}},"events:broken":null}',
  '{"mur:old":{"camps":{"title":"Antiga"}},"events:broken":{"camps":{"title":{"x":1},"content":"Text recuperable"}}}'
])('R32.56: forma/JSON %s queda intacte i la desada no promet persistència', async raw => {
  localStorage.setItem(KEY, raw); vi.resetModules();
  const m = await import('./revisionsEditorials.js');
  const result = await m.desaRevisioEditorialAmbServidor('mur', { id: 'new' }, { title: 'Recuperable' }, { config: { dataMode: 'local' } });
  expect(result).toMatchObject({ desada: false, motiu: 'sense-persistencia' });
  expect(localStorage.getItem(KEY)).toBe(raw); expect(m.revisioEditorial('mur', 'new')).toEqual({ title: 'Recuperable' });
  // Una reparació externa explícita habilita el retry; es conserva l'overlay local.
  localStorage.setItem(KEY, '{}');
  expect(await m.desaRevisioEditorialAmbServidor('mur', { id: 'new' }, { lead: 'Reintent' }, { config: { dataMode: 'local' } })).toMatchObject({ desada: true });
  expect(JSON.parse(localStorage.getItem(KEY))['mur:new'].camps).toEqual({ title: 'Recuperable', lead: 'Reintent' });
});
test('R32.56: clau absent continua permetent la primera desada', async () => {
  localStorage.removeItem(KEY); vi.resetModules(); const m = await import('./revisionsEditorials.js');
  expect(await m.desaRevisioEditorialAmbServidor('mur', { id: 'new' }, { title: 'Primera' }, { config: { dataMode: 'local' } })).toMatchObject({ desada: true });
});
test('R32.56: un storage event parcial actualitza la projecció vàlida i conserva l’edició pendent', async () => {
  localStorage.setItem(KEY, '{'); vi.resetModules(); const m = await import('./revisionsEditorials.js');
  const deixa = m.subscriuRevisionsEditorials(() => {});
  try {
    await m.desaRevisioEditorialAmbServidor('mur', { id: 'pending' }, { title: 'En RAM' }, { config: { dataMode: 'local' } });
    const raw = '{"mur:old":{"camps":{"title":"Llegible"}},"events:broken":null}';
    localStorage.setItem(KEY, raw); window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    expect(m.revisioEditorial('mur', 'old')).toEqual({ title: 'Llegible' });
    expect(m.revisioEditorial('mur', 'pending')).toEqual({ title: 'En RAM' });
    expect(localStorage.getItem(KEY)).toBe(raw);
    expect(await m.desaRevisioEditorialAmbServidor('mur', { id: 'pending' }, { lead: 'Més RAM' }, { config: { dataMode: 'local' } })).toMatchObject({ desada: false });
    expect(localStorage.getItem(KEY)).toBe(raw);
  } finally { deixa(); }
});
