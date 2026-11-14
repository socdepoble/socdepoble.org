/* Auditoria del kit de Gemini R22 (kit_gemini_auditor) · La safata «Arxivats»
   és a la pila de l'Arrere d'Android mentre es veu. En estret (375), obrir-ne
   una conversa la tapa amb la conversa a pantalla completa: l'Arrere no s'ha
   de gastar en una capa que ningú veu (el mateix criteri que ARB-T2B-01 per a
   la selecció). En tornar a la llista, la safata continua oberta (com a
   WhatsApp) i torna a la pila. En ample, llista i conversa conviuen i la
   safata visible continua a la pila. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { buidaEsborranys } from './esborranys.js';
import { _reiniciaPilaEnrere, capesEnrereObertes, tancaCapaSuperior } from '../../config/pilaEnrere.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), threadId: 'a', params: new URLSearchParams(), members: vi.fn(), createThread: vi.fn(), openThread: vi.fn(),
  send: vi.fn(), reintenta: vi.fn(), descarta: vi.fn(), carregaMes: vi.fn(), hiHaMes: vi.fn(), marcaVist: vi.fn(),
  marcaLlegides: vi.fn(), obriFilDePagina: vi.fn(), showToast: vi.fn(), threads: [], messages: [], amplada: 1280
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
/* El document per defecte de la columna dreta i la pàgina viva d'una
   comunitat: marques, com a XatSection.test.jsx. */
vi.mock('../text/TextSection', async () => {
  const { createElement } = await import('react');
  return { default: ({ pageKey }) => createElement('div', { 'data-testid': 'document-per-defecte' }, pageKey) };
});
vi.mock('./components/FitxaVivaDeComunitat.jsx', async () => {
  const { createElement } = await import('react');
  return { default: () => createElement('div', { 'data-testid': 'fitxa-viva-de-comunitat' }) };
});
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, fallback) => fallback, resolveAsset: (v) => v }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: {} })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('./XatContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useXat: () => ({
    scopeKey: 'A', ambitEstable: '', status: 'ready', avis: null, chatThreads: mocks.threads, getThreadMessages: () => mocks.messages,
    sendChatMessage: mocks.send, obriFil: mocks.openThread, creaFil: mocks.createThread, cercaMembres: mocks.members, totalNoLlegits: 0,
    hiHaMesAntics: mocks.hiHaMes, carregantAntics: () => false, carregaMesAntics: mocks.carregaMes, reintenta: mocks.reintenta,
    descartaFallit: mocks.descarta, marcaVist: mocks.marcaVist, comunitats: [], contactesFrequents: [], marcaLlegides: mocks.marcaLlegides,
    obriFilDePagina: mocks.obriFilDePagina, joId: 'jo', joNom: 'Javi', senseSessio: false
  })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
/* El catàleg de veres pesa 292 kB: ací, una família sintètica. */
vi.mock('../notes/canalEmojis.js', () => ({
  carregaCatalegEmojis: async () => ({ GRUPS_EMOJIS: [{ id: 'cares-emocions', nom: 'Cares', emojis: [['1F600', '😀', 'grinning face']] }] })
}));

/* AppGridShell mesura el contenidor: 1280 és ample; 375, estret. */
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return mocks.amplada; } });

const ARA = Date.now();
const fa = (dies) => new Date(ARA - dies * 86400000).toISOString();
const filsDeMostra = () => [
  { id: 'a', title: 'Conversa', name: 'Conversa', tipus: 'directe', ultimText: 'Hola', ultimAl: fa(0), noLlegits: 0, altresNoms: ['Veí'] },
  { id: 'b', title: 'Arxivada', name: 'Arxivada', tipus: 'directe', ultimText: 'Adeu', ultimAl: fa(1), noLlegits: 0, arxivat: true, altresNoms: ['Pep'] }
];
const missatgesDeMostra = () => [
  { id: '1', seq: 1, text: 'Primer', sender: 'me', creatAl: fa(2), estatEnviament: 'llegit' }
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.threadId = null;
  mocks.params = new URLSearchParams();
  mocks.threads = filsDeMostra();
  mocks.messages = missatgesDeMostra();
  mocks.amplada = 375;
  mocks.members.mockResolvedValue([]);
  mocks.send.mockResolvedValue([]);
  mocks.hiHaMes.mockReturnValue(false);
  mocks.marcaLlegides.mockReturnValue(0);
  mocks.obriFilDePagina.mockResolvedValue(null);
  buidaEsborranys();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); _reiniciaPilaEnrere(); });

let rellotge = 10_000;
const arrere = () => { let r; act(() => { rellotge += 1000; r = tancaCapaSuperior(rellotge); }); return r; };
/* La safata oberta: la fletxa de la seua capçalera («Torna a les converses»). */
const titolSafata = () => screen.queryByRole('button', { name: 'Torna a les converses' });

function obriLaSafataIUnaConversa() {
  const vista = render(<XatSection />);
  fireEvent.click(screen.getByRole('button', { name: /Arxivats/ }));
  expect(titolSafata()).toBeTruthy();
  expect(capesEnrereObertes()).toBe(1);
  fireEvent.click(screen.getByRole('list', { name: 'Converses' }).querySelector('li[data-clau="b"] > button'));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/b');
  mocks.threadId = 'b';
  vista.rerender(<XatSection />);
  return vista;
}

test('estret · amb una conversa de la safata oberta, la safata (tapada) no és a la pila i l’Arrere no es consumix; en tornar, safata i capa hi tornen', () => {
  const vista = obriLaSafataIUnaConversa();
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
  mocks.threadId = null;
  vista.rerender(<XatSection />);
  expect(titolSafata()).toBeTruthy();
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(titolSafata()).toBeNull();
  expect(capesEnrereObertes()).toBe(0);
});

test('ample · la safata visible al costat de la conversa continua a la pila i l’Arrere la tanca', () => {
  mocks.amplada = 1280;
  obriLaSafataIUnaConversa();
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(titolSafata()).toBeNull();
  expect(capesEnrereObertes()).toBe(0);
});
