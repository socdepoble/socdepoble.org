/* Crítica de correcció del lliurament R22 · L'arxiu de converses és, de moment,
   només en memòria d'esta sessió (XatContext · arxivaFil torna { estat: 'local' }
   mentre el backend no declare 'arxivaXat', D-B8C-4). El menú «⋯» de la conversa
   (useArxivaDelFil) ho diu amb honestedat (TEXTOS_ARXIVA.nomesLocal). Arxivar en
   lot des de «Seleccionar xats» deia «Conversa arxivada» com si el servidor ho
   haguera guardat: la persona tornava a obrir l'app i les converses hi eren. Els
   dos camins han de dir el mateix. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { buidaEsborranys } from './esborranys.js';
import { TEXTOS_ARXIVA } from './arxivaXat.js';
import { _reiniciaPilaEnrere } from '../../config/pilaEnrere.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), params: new URLSearchParams(), members: vi.fn(), createThread: vi.fn(), openThread: vi.fn(),
  send: vi.fn(), reintenta: vi.fn(), descarta: vi.fn(), carregaMes: vi.fn(), hiHaMes: vi.fn(), marcaVist: vi.fn(),
  marcaLlegides: vi.fn(), obriFilDePagina: vi.fn(), showToast: vi.fn(), arxivaFil: vi.fn(), threads: [], messages: []
}));

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ pathname: '/xat' }),
    useSearchParams: () => [mocks.params],
    useParams: () => ({ threadId: null }),
    useRouter: () => ({ navigate: mocks.navigate, currentPath: '/xat' }),
    Link: ({ to, children, className, ...rest }) => createElement('a', { href: to, className, ...rest }, children)
  };
});
vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
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
    obriFilDePagina: mocks.obriFilDePagina, joId: 'jo', joNom: 'Javi', senseSessio: false,
    potArxivarFil: () => true, arxivaFil: mocks.arxivaFil
  })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock('../notes/canalEmojis.js', () => ({
  carregaCatalegEmojis: async () => ({ GRUPS_EMOJIS: [{ id: 'cares-emocions', nom: 'Cares', emojis: [['1F600', '😀', 'grinning face']] }] })
}));

Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 1280; } });

const ARA = Date.now();
const fa = (dies) => new Date(ARA - dies * 86400000).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.params = new URLSearchParams();
  mocks.threads = [
    { id: 'a', title: 'Conversa', name: 'Conversa', tipus: 'directe', ultimText: 'Hola', ultimAl: fa(0), noLlegits: 0, altresNoms: ['Veí'] },
    { id: 'b', title: 'Altra', name: 'Altra', tipus: 'directe', ultimText: 'Adeu', ultimAl: fa(1), noLlegits: 0, altresNoms: ['Pep'] }
  ];
  mocks.messages = [];
  mocks.members.mockResolvedValue([]);
  mocks.send.mockResolvedValue([]);
  mocks.hiHaMes.mockReturnValue(false);
  mocks.marcaLlegides.mockReturnValue(0);
  mocks.obriFilDePagina.mockResolvedValue(null);
  buidaEsborranys();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); _reiniciaPilaEnrere(); });

/* Maj+F10 (el camí del teclat de la pulsació llarga) sobre la primera fila, que hi naix triada. */
function entraEnSeleccioAmbUnaTriada() {
  const fila = screen.getByRole('list', { name: 'Converses' }).querySelector('li[data-clau] > button[aria-keyshortcuts]');
  fila.focus();
  fireEvent.keyDown(fila, { key: 'F10', shiftKey: true });
  expect(within(screen.getByRole('list', { name: 'Converses' })).getAllByRole('checkbox')[0].getAttribute('aria-checked')).toBe('true');
}

test('arxivar en lot només en memòria avisa que el servidor encara no ho guarda (el mateix que el menú «⋯»)', async () => {
  mocks.arxivaFil.mockImplementation(async (_id, arxivar) => ({ estat: 'local', arxivat: arxivar }));
  render(<XatSection />);
  entraEnSeleccioAmbUnaTriada();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: TEXTOS_ARXIVA.seleccionades[1] })); });
  expect(mocks.arxivaFil).toHaveBeenCalledWith('a', true);
  const textos = mocks.showToast.mock.calls.map(([text]) => text);
  expect(textos).toContain(TEXTOS_ARXIVA.nomesLocal[1]);
  expect(textos).not.toContain(TEXTOS_ARXIVA.fet[1]);
});

test('quan el servidor sí que el guarda («fet»), diu «Conversa arxivada»', async () => {
  mocks.arxivaFil.mockImplementation(async (_id, arxivar) => ({ estat: 'fet', arxivat: arxivar }));
  render(<XatSection />);
  entraEnSeleccioAmbUnaTriada();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: TEXTOS_ARXIVA.seleccionades[1] })); });
  expect(mocks.showToast).toHaveBeenCalledWith(TEXTOS_ARXIVA.fet[1], 'success');
});
