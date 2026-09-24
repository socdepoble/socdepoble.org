import { afterEach, expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { setEfimer, getEfimer } from '../config/storage.js';
import { esborraSessio, usuariDeSessio } from './identitat.js';
import { beginAuthAttempt, cancelAuthAttempts } from './authAttempt.js';
import { gestionaTornada, entraAmbGoogle } from './oauthRelay.js';
const config = () => ({ hasSupabaseConfig: true, supabaseUrl: 'https://backend.example.test', supabaseAnonKey: 'public' });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { resolve, promise }; };
function returning() {
  window.history.replaceState(null, '', '/?code=code&state=state');
  setEfimer('sdp:oauth:state', 'state'); setEfimer('sdp:oauth:verificador', 'verifier');
}
afterEach(() => { cancelAuthAttempts(); esborraSessio(); vi.restoreAllMocks(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/'); });
test('retorn tardà després de logout no restaura la sessió encara que fetch ignore abort', async () => {
  returning(); const body = deferred(); const fetch = vi.fn(async () => ({ ok: true, json: () => body.promise })); vi.stubGlobal('fetch', fetch);
  const work = gestionaTornada({}, config); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await Promise.resolve(); esborraSessio();
  body.resolve({ access_token: 'synthetic', user: { id: 'A' } }); await result;
  expect(usuariDeSessio()).toBeNull(); expect(fetch.mock.calls[0][1].redirect).toBe('error'); expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
});
test('un intent nou cancel·la el bescanvi anterior i conserva el seu verificador', async () => {
  returning(); const response = deferred(); vi.stubGlobal('fetch', vi.fn(() => response.promise));
  const work = gestionaTornada({}, config); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  const newer = beginAuthAttempt(); setEfimer('sdp:oauth:verificador', 'new-verifier'); setEfimer('sdp:oauth:state', 'new-state');
  response.resolve({ ok: true, json: async () => ({ access_token: 'old', user: { id: 'A' } }) }); await result;
  expect(getEfimer('sdp:oauth:verificador')).toBe('new-verifier'); expect(getEfimer('sdp:oauth:state')).toBe('new-state');
  newer.assertCurrent(); expect(usuariDeSessio()).toBeNull();
});
test('el popup pendent es tanca i rebutja quan comença un altre mètode d’entrada', async () => {
  vi.stubGlobal('crypto', webcrypto);
  const popup = { location: {}, closed: false, close: vi.fn() }; vi.spyOn(window, 'open').mockReturnValue(popup);
  const work = entraAmbGoogle({}, config); const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  const newer = beginAuthAttempt(); await result;
  expect(popup.close).toHaveBeenCalled(); newer.assertCurrent(); expect(usuariDeSessio()).toBeNull();
});
test('el bescanvi vigent guarda exactament la sessió vàlida i neteja el retorn', async () => {
  returning(); vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ access_token: 'synthetic', user: { id: 'A' } }) })));
  await gestionaTornada({}, config); expect(usuariDeSessio()?.id).toBe('A'); expect(window.location.search).toBe('');
  expect(getEfimer('sdp:oauth:verificador', null)).toBeNull();
});

test('un digest PKCE tardà no tanca el popup reutilitzat per l’intent següent', async () => {
  const first = deferred(), second = deferred();
  vi.stubGlobal('crypto', {
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    subtle: { digest: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise) }
  });
  const popup = { location: {}, closed: false, close: vi.fn() };
  vi.spyOn(window, 'open').mockReturnValue(popup);
  const a = entraAmbGoogle({}, config);
  const aResult = expect(a).rejects.toMatchObject({ name: 'AbortError' });
  const b = entraAmbGoogle({}, config);
  const bResult = expect(b).rejects.toMatchObject({ name: 'AbortError' });
  expect(popup.close).toHaveBeenCalledTimes(1);
  second.resolve(new ArrayBuffer(32));
  await vi.waitFor(() => expect(popup.location.href).toContain('/authorize'));
  first.resolve(new ArrayBuffer(32)); await aResult;
  expect(popup.close).toHaveBeenCalledTimes(1);
  expect(getEfimer('sdp:oauth:verificador')).toBeTruthy();
  cancelAuthAttempts(); await bResult;
  expect(popup.close).toHaveBeenCalledTimes(2);
});
