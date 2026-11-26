/* v1.2.25 · Poliment P2 de l'auditoria de Codex (Guàrdia #7) · K-CAB-ENT0108 (COMMIT-5) a la tornada de Google per
   redirecció. data/oauthRelay.js (errorDelProveidor) porta el codi de les altes tancades, del compte suspés i del
   correu de Google sense confirmar; la closca (App.jsx, atenTornada) el pintava sempre amb el text valencià de
   l'error. Ara diu la clau section.login.error.* en la llengua de la interfície, i espera el diccionari si encara
   no ha arribat: en arrencar per la tornada, el normal. Un error sense cap d'eixos codis continua dient el seu
   missatge, com abans.
   Este fitxer NO importa tests/helpers/diccionaris.js: els diccionaris es carreguen com en producció, quan es
   demanen. El de castellà té una porta (diccionariEs) que la prova obri quan vol. */
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { CODI_ENTRADA } from '../data/errorsBackend.js';
import { getSessionState } from '../data/sessionService.js';

const diccionariEs = vi.hoisted(() => {
  let obri;
  const porta = new Promise((resol) => { obri = resol; });
  return { porta, obri };
});
vi.mock('../config/idiomes/es.js', async (importOriginal) => {
  await diccionariEs.porta;
  return importOriginal();
});
vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const TEXT_DE_L_ADAPTADOR = 'Text de l’adaptador, sempre en valencià';
const CA_ALTES = 'Les altes noves estan tancades temporalment en este poble. Si ja tens compte, entra amb el teu correu.';
const ES_ALTES = 'Las nuevas altas están cerradas temporalmente en este pueblo. Si ya tienes cuenta, entra con tu correo.';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* La closca sense sessió i amb el backend remot (com App.test.jsx, muntaSenseSessio): la tornada es recull una
   vegada en muntar. */
async function tornadaAmbError(language, error, cos) {
  vi.stubGlobal('innerWidth', 1024);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (String(url).startsWith('/__iaia/')) return { status: 404, ok: false, statusText: 'Not Found' };
    throw new Error('Xarxa inesperada: ' + url);
  }));
  const recull = vi.fn(async () => { throw error; });
  const anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((name) => [name, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => [],
    recullTornadaOAuth: recull
  });
  window.history.replaceState(null, '', '/mur');
  try {
    render(<PedraSecaEmbed config={{ routerType: 'browser', dataMode: 'remote', language }} />);
    await waitFor(() => expect(getSessionState().estat).toBe('fora'));
    await waitFor(() => expect(recull).toHaveBeenCalledTimes(1));
    await cos();
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

const rebuig = (code) => Object.assign(new Error(TEXT_DE_L_ADAPTADOR), { code });

test('Poliment P2 · el castellà encara no ha arribat: l’avís de les altes tancades l’espera i ix en castellà', async () => {
  await tornadaAmbError('es', rebuig(CODI_ENTRADA.ALTES_TANCADES), async () => {
    await act(async () => { await new Promise((resol) => setTimeout(resol, 50)); });
    expect(screen.queryByText(CA_ALTES)).toBeNull();
    expect(screen.queryByText(TEXT_DE_L_ADAPTADOR)).toBeNull();
    await act(async () => { diccionariEs.obri(); });
    expect(await screen.findByText(ES_ALTES)).toBeTruthy();
    expect(screen.queryByText(CA_ALTES)).toBeNull();
  });
});

test.each([
  ['en', CODI_ENTRADA.COMPTE_SUSPES, 'This account is temporarily suspended. Contact this village’s administration if you believe this is a mistake.'],
  ['gl', CODI_ENTRADA.CORREU_GOOGLE_PENDENT, 'A túa conta de Google aínda non ten o correo confirmado. Confírmao antes de volver entrar.'],
  ['eu', CODI_ENTRADA.ALTES_TANCADES, 'Izen-emate berriak aldi baterako itxita daude herri honetan. Kontua baduzu jada, sartu zure posta elektronikoarekin.'],
  ['ca', CODI_ENTRADA.COMPTE_SUSPES, 'Este compte està suspés temporalment. Contacta amb l’administració d’este poble si creus que és un error.']
])('Poliment P2 · %s: la tornada amb el rebuig %s avisa amb la clau en la llengua de la interfície', async (language, code, avis) => {
  await tornadaAmbError(language, rebuig(code), async () => {
    expect(await screen.findByText(avis)).toBeTruthy();
    expect(screen.queryByText(TEXT_DE_L_ADAPTADOR)).toBeNull();
  });
});

test('Poliment P2 · un error de la tornada sense cap d’eixos codis continua dient el seu missatge, com abans', async () => {
  await tornadaAmbError('en', rebuig(CODI_ENTRADA.DESCONEGUT), async () => {
    expect(await screen.findByText(TEXT_DE_L_ADAPTADOR)).toBeTruthy();
  });
});
