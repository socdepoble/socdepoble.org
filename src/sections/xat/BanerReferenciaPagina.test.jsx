import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { mapejaFil } from './missatges.js';
import { buidaEsborranys } from './esborranys.js';
import { oblidaOrigenDelXat } from './origenDelXat.js';
import { oblidaReferenciaPaginaXat, recordaReferenciaPaginaXat } from './referenciaPaginaXat.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  threadId: null,
  params: new URLSearchParams(),
  threads: [],
  creaFil: null,
  obriFilDePagina: null
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
    obriFilDePagina: mocks.obriFilDePagina,
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

const ara = new Date().toISOString();

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.navigate.mockReset();
  mocks.creaFil = vi.fn(async () => 'fil-privat-rentonar');
  mocks.obriFilDePagina = vi.fn(async () => 'fil-event-pedra');
  mocks.threadId = null;
  mocks.params = new URLSearchParams();
  mocks.threads = [
    mapejaFil({
      id: 'fil-event-pedra',
      tipus: 'grup',
      titol: 'Cursos de pedra en sec a Fageca i Alcosser',
      participants: 4,
      ultimAl: ara,
      subjecte: {
        tipus: 'esdeveniment',
        id: 'cursos-pedra-en-sec-fageca-alcosser-2026',
        titol: 'Cursos de pedra en sec a Fageca i Alcosser',
        ruta: '/events/cursos-pedra-en-sec-fageca-alcosser-2026'
      }
    }),
    mapejaFil({
      id: 'fil-privat-rentonar',
      tipus: 'directe',
      titol: 'El Rentonar',
      altres: [{ id: 'rentonar', nom: 'El Rentonar', tipus: 'entitat' }],
      ultimAl: ara
    }),
    mapejaFil({
      id: 'fil-altre',
      tipus: 'directe',
      titol: 'Pepa',
      altres: [{ id: 'pepa', nom: 'Pepa', tipus: 'persona' }],
      ultimAl: ara
    })
  ];
  buidaEsborranys();
  oblidaOrigenDelXat();
  oblidaReferenciaPaginaXat();
});

afterEach(() => {
  cleanup();
  oblidaReferenciaPaginaXat();
  oblidaOrigenDelXat();
});

test('en qualsevol xat públic de pàgina o esdeveniment, el bàner superior mostra el títol i enllaça cap a la notícia/esdeveniment', async () => {
  mocks.threadId = 'fil-event-pedra';
  render(<XatSection />);

  const baner = await screen.findByTestId('baner-referencia-pagina-xat');
  expect(within(baner).getByText('Esdeveniment:')).toBeTruthy();
  expect(within(baner).getByText('Cursos de pedra en sec a Fageca i Alcosser')).toBeTruthy();
  const enllac = within(baner).getByRole('link', { name: /Veure la pàgina d’origen: Cursos de pedra en sec/ });
  expect(enllac.getAttribute('href')).toBe('/events/cursos-pedra-en-sec-fageca-alcosser-2026');
});

test('en entrar en privat des d’una pàgina (?amb=), conserva el bàner de referència i l’esborrany al compositor, i l’oblida en canviar de xat', async () => {
  recordaReferenciaPaginaXat(
    {
      tipus: 'esdeveniment',
      id: 'cursos-pedra-en-sec-fageca-alcosser-2026',
      titol: 'Cursos de pedra en sec a Fageca i Alcosser',
      ruta: '/events/cursos-pedra-en-sec-fageca-alcosser-2026'
    },
    { esborrany: '✅ Sí, compta amb mi — Anem dos des de la Torre' }
  );

  mocks.params = new URLSearchParams('amb=rentonar');
  const { rerender } = render(<XatSection />);
  await waitFor(() => expect(mocks.creaFil).toHaveBeenCalledWith('rentonar', null));

  mocks.threadId = 'fil-privat-rentonar';
  mocks.params = new URLSearchParams();
  rerender(<XatSection />);

  const baner = await screen.findByTestId('baner-referencia-pagina-xat');
  expect(within(baner).getByRole('link').getAttribute('href')).toBe('/events/cursos-pedra-en-sec-fageca-alcosser-2026');
  const camp = screen.getByRole('textbox', { name: 'Escriu un missatge' });
  expect(camp.value).toContain('[Cursos de pedra en sec a Fageca i Alcosser]');
  expect(camp.value).toContain('✅ Sí, compta amb mi — Anem dos des de la Torre');

  mocks.threadId = 'fil-altre';
  rerender(<XatSection />);
  expect(screen.queryByTestId('baner-referencia-pagina-xat')).toBeNull();
});
