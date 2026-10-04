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
import { recullTornadaOAuth, registerWithPassword } from './auth.js';
import { usuariDeSessio } from '../identitat.js';

const PAGINA = 'https://gentdelatorre.net/alguna/pagina?x=1';
/* F1v2 (261003, W4-02) · La tornada de l'alta porta la seua marca. */
const TORNADA_ALTA = `${PAGINA}&sdp_auth=alta`;
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

/* F1v2 · Canvi: la tornada és PAGINA amb la marca de l'alta (abans, PAGINA sola). */
test('l’alta demana que el correu de confirmació torne a la pàgina de l’amfitrió, amb la seua marca i mai a socdepoble.org', async () => {
  const crida = await alta();
  const url = tornadaDe(crida);
  expect(url.pathname).toBe('/auth/v1/signup');
  expect(url.searchParams.get('redirect_to')).toBe(TORNADA_ALTA);
  expect(crida[0]).not.toMatch(/socdepoble/);
  expect(crida[2]).toMatchObject({ method: 'POST', body: { email: 'synthetic@example.test', password: 'contrasenya', data: {} } });
});

test('l’alta no s’emporta les restes d’una entrada anterior (marques incloses) ni el fragment', async () => {
  window.history.replaceState(null, '', '/alguna/pagina?x=1&code=vell&error_code=bad_oauth_state&sdp_auth=alta&sdp_oauth_attempt=AAAAAAAAAAAAAAAAAAAAAA#access_token=vell');
  expect(tornadaDe(await alta()).searchParams.get('redirect_to')).toBe(TORNADA_ALTA);
});

/* De punta a punta amb el relé de veres: l'enllaç de confirmació torna a la
   tornada demanada amb tokens implícits al fragment (ordre del Mestre 261002:
   mai s'adopten, i la barra d'adreces queda neta). */
test('F1v2 · la tornada del correu de confirmació, amb la marca, no adopta tokens i deixa la pàgina neta', async () => {
  const { pathname, search } = new URL(tornadaDe(await alta()).searchParams.get('redirect_to'));
  window.history.replaceState({ usr: 'r' }, '', `${pathname}${search}#access_token=tok-sintetic&refresh_token=rt-sintetic&token_type=bearer&type=signup`);
  await expect(recullTornadaOAuth({})).resolves.toBeNull();
  expect(window.location.href).toBe(PAGINA);
  expect(window.history.state).toEqual({ usr: 'r' });
  expect(usuariDeSessio()).toBeNull();
  expect(m.request).toHaveBeenCalledTimes(1);   // només l'alta: res més a la xarxa
});
