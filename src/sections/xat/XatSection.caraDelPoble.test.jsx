/* Onada 3 (P2, revisió adversarial) · Amb sessió, la comunitat del poble de
   l'amfitrió que torna el servidor no porta imatge (xat_fils_meus:
   coalesce(f.imatge_url, …), i public.towns no en té cap columna). La fila
   virtual (FilaPoble) ja portava la cara del poble i, quan naixia la
   comunitat, la mateixa fila queia a les inicials: «Gent de la Torre» tornava
   a ser GD per a qualsevol persona amb sessió. Ara la comunitat porta la cara
   del poble a la llista i a la seua fitxa; el General continua amb la seua
   icona, i una imatge pròpia del fil mana. Sense poble, res no canvia. */
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { agrupaComunitats, mapejaFil } from './missatges.js';
import { buidaEsborranys } from './esborranys.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  threadId: null,
  params: new URLSearchParams(),
  externalConfig: {},
  towns: [],
  threads: [],
  comunitats: []
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
/* Les fitxes de Pobles del node: d'ací ix la cara del poble. */
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {}, towns: mocks.towns }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (v) => v }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: mocks.externalConfig })
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
    creaFil: vi.fn(),
    cercaMembres: vi.fn(async () => []),
    totalNoLlegits: 0,
    hiHaMesAntics: () => false,
    carregantAntics: () => false,
    carregaMesAntics: () => {},
    reintenta: () => {},
    descartaFallit: () => {},
    marcaVist: () => {},
    comunitats: mocks.comunitats,
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

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() { return 1280; }
});

const POBLE = { id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre' };
const CARA = '/assets/towns/la-torre-de-les-macanes/2.jpg';
const TORRE = { id: POBLE.id, title: 'La Torre de les Maçanes', image_url: '/assets/towns/la-torre-de-les-macanes/1.jpg', avatar_url: CARA };

/* La comunitat del poble com la torna el servidor: subjecte amb l'UUID de
   towns i la ruta canònica, i cap imatge (imatgeUrl null). */
function ambComunitatDelPoble(imatgeUrl = null) {
  const subjecte = { tipus: 'poble', id: '44444444-4444-4444-8444-444444444444', ruta: `/pobles/${POBLE.id}`, titol: POBLE.nom };
  const fils = [
    { id: 'c-torre', tipus: 'comunitat', titol: POBLE.nom, comunitatId: null, subjecte, imatgeUrl },
    { id: 'a-torre', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-torre', subjecte, rol: 'membre', ultimAl: new Date().toISOString() },
    { id: 'g-torre', tipus: 'grup', titol: 'General', comunitatId: 'c-torre', subjecte, rol: 'membre', ultimAl: new Date().toISOString() }
  ].map((f) => mapejaFil(f));
  mocks.threads = fils;
  mocks.comunitats = agrupaComunitats(fils);
}

const llista = () => screen.getByRole('list', { name: 'Converses' });
/* La imatge de l'avatar d'un element (null: les inicials). */
const caraDe = (element) => element?.querySelector('.sdp-avatar img')?.getAttribute('src') ?? null;

afterEach(cleanup);
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.navigate.mockReset();
  mocks.threadId = null;
  mocks.params = new URLSearchParams();
  mocks.externalConfig = { poble: POBLE.id, nomPoble: POBLE.nom };
  mocks.towns = [TORRE];
  mocks.threads = [];
  mocks.comunitats = [];
  buidaEsborranys();
});

test('la fila del poble no perd la cara quan la comunitat naix al servidor sense imatge', () => {
  const vista = render(<XatSection />);
  expect(caraDe(llista().querySelector(`li[data-clau="poble:${POBLE.id}"]`))).toBe(CARA);

  ambComunitatDelPoble();
  vista.rerender(<XatSection />);
  const fila = llista().querySelector('li[data-clau="comunitat:c-torre"]');
  expect(fila).not.toBeNull();
  expect(caraDe(fila)).toBe(CARA);
});

test('la fitxa de la comunitat porta la mateixa cara; els Avisos i el General, la seua icona', () => {
  ambComunitatDelPoble();
  mocks.params = new URLSearchParams('comunitat=c-torre');
  render(<XatSection />);
  const fitxa = screen.getByRole('region', { name: POBLE.nom });
  expect(caraDe(fitxa.querySelector('.sdp-xat-fitxa-comunitat__cap'))).toBe(CARA);
  expect(fitxa.querySelectorAll('.sdp-xat-fitxa-comunitat__cos .sdp-avatar')).toHaveLength(0);
  expect(fitxa.querySelectorAll('.sdp-xat-fitxa-comunitat__cos .sdp-xat-avatar-icona')).toHaveLength(2);
});

test('si el servidor ja dona imatge a la comunitat, mana la seua', () => {
  ambComunitatDelPoble('/assets/uploads/comunitat-propia.jpg');
  render(<XatSection />);
  expect(caraDe(llista().querySelector('li[data-clau="comunitat:c-torre"]'))).toBe('/assets/uploads/comunitat-propia.jpg');
});

test('sense fitxa del poble al node, la comunitat es queda amb les inicials (cap cara inventada)', () => {
  mocks.towns = [{ id: 'sella', avatar_url: '/assets/towns/sella/2.jpg' }];
  ambComunitatDelPoble();
  render(<XatSection />);
  expect(caraDe(llista().querySelector('li[data-clau="comunitat:c-torre"]'))).toBeNull();
});

test('sense poble declarat (socdepoble.org), la comunitat d’un poble no canvia', () => {
  mocks.externalConfig = {};
  ambComunitatDelPoble();
  render(<XatSection />);
  expect(caraDe(llista().querySelector('li[data-clau="comunitat:c-torre"]'))).toBeNull();
});
