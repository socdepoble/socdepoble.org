/* Ordre del Mestre (261021, pla 261021_0015 §8.5) · Tornar del Xat a la
   pàgina d'origen. En ample (escriptori) la fletxa de la capçalera era només
   d'estret: qui entrava des de /iaia («Parla amb la IAIA») o des d'una fitxa
   de perfil no tenia cap porta dins de l'app per a tornar-hi. Ara XatSection
   pren l'origen que ha recordat AvisadorXat (origenDelXat.js) i la capçalera
   de la conversa porta la fletxa cap allí, també en ample. Sense origen, o
   després de triar una altra conversa, la capçalera de sempre. */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { mapejaFil } from './missatges.js';
import { buidaEsborranys } from './esborranys.js';
import { oblidaOrigenDelXat, recordaOrigenDelXat } from './origenDelXat.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  threadId: null,
  params: new URLSearchParams(),
  threads: [],
  creaFil: null
}));

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ pathname: mocks.threadId ? `/xat/${mocks.threadId}` : '/xat', search: mocks.params.toString() }),
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
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {}, towns: [] }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (v) => v }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: {} })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('./XatContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useXat: () => ({
    scopeKey: 'A',
    ambitEstable: 'P',
    status: 'ready',
    avis: null,
    chatThreads: mocks.threads,
    getThreadMessages: () => [],
    sendChatMessage: vi.fn(async () => []),
    obriFil: () => {},
    creaFil: mocks.creaFil,
    cercaMembres: vi.fn(async () => []),
    totalNoLlegits: 0,
    hiHaMesAntics: () => false,
    carregantAntics: () => false,
    carregaMesAntics: () => {},
    reintenta: () => {},
    descartaFallit: () => {},
    marcaVist: () => {},
    comunitats: [],
    contactesFrequents: [],
    marcaLlegides: () => 0,
    obriFilDePagina: vi.fn(async () => null),
    joId: 'jo',
    joNom: 'Javi',
    senseSessio: false,
    modeDades: 'remote',
    consumixEntrada: undefined
  })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));

/* En ample: l'escriptori, on abans no hi havia cap fletxa. */
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() { return 1280; }
});

const ara = new Date().toISOString();
const directe = (id, nom, persona) => mapejaFil({ id, tipus: 'directe', titol: nom, altres: [{ id: persona, nom, tipus: 'persona' }], ultimAl: ara });

const capcalera = () => document.querySelector('header.sdp-xat-capcalera');
const fletxaDOrigen = () => screen.queryByRole('button', { name: 'Torna a la pàgina anterior' });
const fletxaDeSempre = () => screen.queryByRole('button', { name: 'Torna a la llista' });
/* Canvia la URL del router simulat i torna a pintar, com una navegació. */
const ves = (rerender, threadId, consulta = '') => {
  mocks.threadId = threadId;
  mocks.params = new URLSearchParams(consulta);
  rerender(<XatSection />);
};

afterEach(() => { cleanup(); oblidaOrigenDelXat(); });
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.navigate.mockReset();
  mocks.creaFil = vi.fn(() => new Promise(() => {}));
  mocks.threadId = null;
  mocks.params = new URLSearchParams();
  mocks.threads = [directe('a', 'Pepa', 'P'), directe('b', 'Joan', 'J')];
  buidaEsborranys();
  oblidaOrigenDelXat();
});

test('sense origen (càrrega directa), la capçalera de sempre: la fletxa només d’estret, cap a la llista', async () => {
  mocks.threadId = 'a';
  render(<XatSection />);
  await waitFor(() => expect(capcalera()).toBeTruthy());
  expect(fletxaDOrigen()).toBeNull();
  expect(fletxaDeSempre().getAttribute('class')).toBe('sdp-xat-icona d-mobile-only');
});

test('des de /iaia directe a /xat/<fil>: la fletxa es veu en ample i torna a /iaia', async () => {
  recordaOrigenDelXat('/iaia');
  mocks.threadId = 'a';
  render(<XatSection />);
  await waitFor(() => expect(fletxaDOrigen()).toBeTruthy());
  expect(fletxaDOrigen().getAttribute('class')).toBe('sdp-xat-icona');
  expect(fletxaDeSempre()).toBeNull();
  mocks.navigate.mockClear();
  fletxaDOrigen().click();
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/iaia');
});

test('des d’una fitxa de perfil per /xat?amb=<id>: l’origen espera el replace a /xat/<fil> i conserva la consulta', async () => {
  recordaOrigenDelXat('/perfil/pepa', 'pestanya=xat');
  mocks.params = new URLSearchParams('amb=P');
  const { rerender } = render(<XatSection />);
  await waitFor(() => expect(mocks.creaFil).toHaveBeenCalledWith('P', null));
  expect(capcalera()).toBeNull();
  /* XatSection resol ?amb= amb un replace a /xat/<fil>. */
  ves(rerender, 'a');
  await waitFor(() => expect(fletxaDOrigen()).toBeTruthy());
  mocks.navigate.mockClear();
  fletxaDOrigen().click();
  expect(mocks.navigate).toHaveBeenLastCalledWith('/perfil/pepa?pestanya=xat');
});

test('triar una altra conversa oblida l’origen: ni en ella ni tornant a la primera', async () => {
  recordaOrigenDelXat('/iaia');
  mocks.threadId = 'a';
  const { rerender } = render(<XatSection />);
  await waitFor(() => expect(fletxaDOrigen()).toBeTruthy());
  ves(rerender, 'b');
  await waitFor(() => expect(fletxaDeSempre()).toBeTruthy());
  expect(fletxaDOrigen()).toBeNull();
  ves(rerender, 'a');
  await waitFor(() => expect(fletxaDeSempre()).toBeTruthy());
  expect(fletxaDOrigen()).toBeNull();
});

test('entrar a la llista nua (el menú «Xat») no porta cap origen a la conversa que s’hi tria', async () => {
  recordaOrigenDelXat('/mur');
  const { rerender } = render(<XatSection />);
  ves(rerender, 'a');
  await waitFor(() => expect(capcalera()).toBeTruthy());
  expect(fletxaDOrigen()).toBeNull();
  expect(fletxaDeSempre()).toBeTruthy();
});
