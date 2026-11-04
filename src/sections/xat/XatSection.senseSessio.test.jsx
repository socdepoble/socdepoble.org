/* xat-flux-03 (T7a, 261104) · En remot i sense sessió, «En privat (amb …)»
   d'una targeta del Mur o del Mercat porta a /xat?amb=<id de la persona>. El
   xat de mostra (FakeChatOnboarding) només obri entitats: per a una persona
   (o per al null que el directori torna a un visitant anònim) rebutja amb
   DESTINATARI_INVALID, i XatSection en feia un toast vermell fals («No s’ha
   trobat el destinatari del xat.», en valencià siga quina siga la llengua)
   amb ?amb= encara a la URL, que amagava «Connectar-se» i «Registrar-se».
   Ara porta a entrar amb la forma única de T4 (rutaDEntrada), com ?sobre=.
   El context NO es burla: es dona per XatContext.Provider i el
   FakeChatOnboarding és el de veres (com a XatSection.avatars.test.jsx). */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { XatContext } from './XatContext';
import { buidaEsborranys } from './esborranys.js';
import { rutaDEntrada } from '../../config/rutaEntrada.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  threadId: null,
  params: new URLSearchParams(),
  showToast: vi.fn(),
  perfil: vi.fn()
}));

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ pathname: mocks.threadId ? `/xat/${mocks.threadId}` : '/xat' }),
    useSearchParams: () => [mocks.params],
    useParams: () => ({ threadId: mocks.threadId }),
    useRouter: () => ({ navigate: mocks.navigate, currentPath: '/xat' }),
    Link: ({ to, children, className, ...rest }) => createElement('a', { href: to, className, ...rest }, children)
  };
});
vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
vi.mock('../text/TextSection', async () => {
  const { createElement } = await import('react');
  return { default: ({ pageKey }) => createElement('div', { 'data-testid': 'document-per-defecte' }, pageKey) };
});
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', pageCopy: {}, towns: [] }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (v) => v }),
  useUIState: () => ({
    language: 'ca', locale: 'ca-ES',
    externalConfig: { dataMode: 'remote', supabaseUrl: 'https://test.invalid', supabaseAnonKey: 'clau-publica', tenantId: '00000000-0000-4000-8000-000000000000' }
  })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
/* El directori remot: la capacitat i el perfil públic (null per a anon, com supabase/perfils.js). */
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (capacitat) => capacitat === 'directori',
  loadPerfilPublic: (...args) => mocks.perfil(...args)
}));

Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 1280; } });

const PERSONA = '7d1c2f3a-0b4e-4c5d-8e6f-1a2b3c4d5e6f';
const OLI = '3073b933-69fc-4c3e-80dc-b0df9c6b8391';

/* El context remot sense sessió (XatContext: joId null i senseSessio, ja comprovat). */
const senseSessio = () => ({
  scopeKey: 'A', ambitEstable: '', status: 'ready', avis: null, chatThreads: [], getThreadMessages: () => [],
  sendChatMessage: vi.fn(async () => []), obriFil: () => {}, creaFil: vi.fn(), cercaMembres: vi.fn(async () => []),
  totalNoLlegits: 0, hiHaMesAntics: () => false, carregantAntics: () => false, carregaMesAntics: () => {},
  reintenta: () => {}, descartaFallit: () => {}, marcaVist: () => {}, comunitats: [], contactesFrequents: [],
  marcaLlegides: () => 0, obriFilDePagina: vi.fn(async () => null), joId: null, joNom: null, senseSessio: true,
  modeDades: 'remote'
});
const munta = () => render(<XatContext.Provider value={senseSessio()}><XatSection /></XatContext.Provider>);
const buida = () => act(async () => { for (let i = 0; i < 8; i += 1) await Promise.resolve(); });
const errorsAlToast = () => mocks.showToast.mock.calls.filter(([, tipus]) => tipus === 'error');

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.threadId = null;
  mocks.params = new URLSearchParams();
  mocks.perfil.mockReset();
  buidaEsborranys();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test('«En privat» amb una persona porta a entrar (replace), amb la tornada a /xat?amb=, i cap toast d’error', async () => {
  mocks.perfil.mockResolvedValue(null);
  mocks.params = new URLSearchParams({ amb: PERSONA });
  munta();
  await buida();
  expect(mocks.perfil).toHaveBeenCalledWith(PERSONA, expect.anything());
  const esperada = rutaDEntrada({ tornar: `/xat?amb=${PERSONA}` });
  expect(esperada).toBe(`/registre?mode=entrar&tornar=%2Fxat%3Famb%3D${PERSONA}`);
  expect(mocks.navigate).toHaveBeenCalledWith(esperada, { replace: true });
  expect(errorsAlToast()).toEqual([]);
});

test('amb una entitat del directori, el directe de mostra de sempre: /xat/fake-entitat:<id>, sense passar per entrar', async () => {
  mocks.perfil.mockResolvedValue({ tipus: 'entitat', id: OLI, slug: 'olidelatorre', nom: 'Oli de La Torre', avatar: null });
  mocks.params = new URLSearchParams({ amb: 'olidelatorre' });
  munta();
  await buida();
  expect(mocks.navigate).toHaveBeenCalledWith(`/xat/${encodeURIComponent(`fake-entitat:${OLI}`)}`, { replace: true });
  expect(mocks.navigate.mock.calls.some(([ruta]) => String(ruta).startsWith('/registre'))).toBe(false);
  expect(errorsAlToast()).toEqual([]);
});

test('una fallada de xarxa del directori continua avisant amb el toast, sense portar a entrar', async () => {
  mocks.perfil.mockRejectedValue(Object.assign(new Error('Load failed'), { retriable: true }));
  mocks.params = new URLSearchParams({ amb: PERSONA });
  munta();
  await buida();
  expect(errorsAlToast()).toHaveLength(1);
  expect(mocks.navigate.mock.calls.some(([ruta]) => String(ruta).startsWith('/registre'))).toBe(false);
});
