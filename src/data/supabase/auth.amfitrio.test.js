// @vitest-environment-options {"url": "https://gentdelatorre.net/alguna/pagina?x=1"}
/* P1 · Onada 3 (261003) · L'alta per correu des d'un amfitrió (Model B).
   Quan el projecte demana confirmar el correu, l'enllaç del correu torna on
   diu el `redirect_to` de l'alta. Sense ell, GoTrue triava el Referer (només
   l'origen, en un fetch entre orígens) o la Site URL del projecte, on viu una
   SPA vella de socdepoble.org. Ací oauthRelay.js és el de veres
   (urlDeTornada) i jsdom viu a la pàgina de l'amfitrió; només es falsegen el
   transport i el canvi de backend de la sessió. */
import { afterEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../identitat.js', async (importOriginal) => ({ ...await importOriginal(), configuraBackendSessio: vi.fn() }));
vi.mock('./runtime.js', () => ({ configuraRefrescSessio: vi.fn(), getCurrentUser: () => null, request: m.request, rpc: vi.fn(),
  getResolvedConfig: (config) => ({ supabaseUrl: 'https://backend.example.test', supabaseAnonKey: 'public', runtimeDataMode: 'remote', ...config }) }));
vi.mock('./realtime.js', () => ({ tancaRealtime: vi.fn(async () => {}) }));
vi.mock('./config.js', () => ({ resetClient: vi.fn() }));
import { registerWithPassword } from './auth.js';

const PAGINA = 'https://gentdelatorre.net/alguna/pagina?x=1';
const tornadaDe = (crida) => new URL(crida[0], 'https://backend.example.test');
const alta = async () => {
  m.request.mockReset().mockResolvedValueOnce({ user: { id: 'A' } });   // confirmació per correu: sense sessió
  await expect(registerWithPassword('synthetic@example.test', 'contrasenya', {})).resolves.toEqual({ user: { id: 'A' } });
  expect(m.request).toHaveBeenCalledTimes(1);
  return m.request.mock.calls[0];
};
afterEach(() => { window.history.replaceState(null, '', '/alguna/pagina?x=1'); });

test('premissa: la pàgina és la de l’amfitrió', () => {
  expect(window.location.href).toBe(PAGINA);
});

test('l’alta demana que el correu de confirmació torne a la pàgina de l’amfitrió, mai a socdepoble.org', async () => {
  const crida = await alta();
  const url = tornadaDe(crida);
  expect(url.pathname).toBe('/auth/v1/signup');
  expect(url.searchParams.get('redirect_to')).toBe(PAGINA);
  expect(crida[0]).not.toMatch(/socdepoble/);
  expect(crida[2]).toMatchObject({ method: 'POST', body: { email: 'synthetic@example.test', password: 'contrasenya', data: {} } });
});

test('l’alta no s’emporta les restes d’una entrada anterior ni el fragment', async () => {
  window.history.replaceState(null, '', '/alguna/pagina?x=1&code=vell&error_code=bad_oauth_state#access_token=vell');
  expect(tornadaDe(await alta()).searchParams.get('redirect_to')).toBe(PAGINA);
});
