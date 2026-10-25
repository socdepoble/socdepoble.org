/* Gauntlet 261025_0545 (D5, carril de la vista) · XatSection baixa a la
   Conversa el tipus de l'avís del fil (tipusAvisFil) i si una lectura del fil
   vola (llegintFil), com ja feia amb filCarregat, avisFil i recarregaFil. Un
   context que encara no els porta deixa la conversa com sempre: el text de
   llegir i «Torna-ho a provar» actiu. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { mapejaFil } from './missatges.js';
import { buidaEsborranys } from './esborranys.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  threads: [],
  extra: {}
}));

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ pathname: '/xat/a', search: '' }),
    useSearchParams: () => [new URLSearchParams()],
    useParams: () => ({ threadId: 'a' }),
    useRouter: () => ({ navigate: mocks.navigate, currentPath: '/xat/a' }),
    Link: ({ to, children, className, ...rest }) => createElement('a', { href: to, className, ...rest }, children)
  };
});
vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
vi.mock('../text/TextSection', () => ({ default: () => null }));
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
    creaFil: vi.fn(),
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
    consumixEntrada: undefined,
    ...mocks.extra
  })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));

const ara = new Date().toISOString();
const directe = (id, nom, persona) => mapejaFil({ id, tipus: 'directe', titol: nom, altres: [{ id: persona, nom, tipus: 'persona' }], ultimAl: ara });
const textLectura = "No s'ha pogut actualitzar la conversa.";
const textMarca = "No s'ha pogut marcar la conversa com a llegida.";

afterEach(() => { cleanup(); });
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.navigate.mockReset();
  mocks.threads = [directe('a', 'Pepa', 'P')];
  mocks.extra = {
    filCarregat: () => true,
    avisFil: (id) => (id === 'a' ? 'new row violates row-level security policy' : null),
    recarregaFil: vi.fn()
  };
  buidaEsborranys();
});

test('el context diu que ha fallat la marca i que la lectura vola: el text de marcar i el reintent ocupat', async () => {
  const tipusAvisFil = vi.fn(() => 'marca');
  const llegintFil = vi.fn(() => true);
  Object.assign(mocks.extra, { tipusAvisFil, llegintFil });
  render(<XatSection />);
  await waitFor(() => expect(screen.getByText(textMarca)).toBeTruthy());
  expect(tipusAvisFil).toHaveBeenCalledWith('a');
  expect(llegintFil).toHaveBeenCalledWith('a');
  expect(screen.queryByText(textLectura)).toBeNull();
  const boto = screen.getByRole('button', { name: 'Actualitzant…' });
  expect(boto.getAttribute('aria-busy')).toBe('true');
  expect(boto.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(boto);
  expect(mocks.extra.recarregaFil).not.toHaveBeenCalled();
});

test('un context d’abans (sense tipusAvisFil ni llegintFil): el text de llegir i «Torna-ho a provar» torna a llegir el fil', async () => {
  render(<XatSection />);
  await waitFor(() => expect(screen.getByText(textLectura)).toBeTruthy());
  fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
  expect(mocks.extra.recarregaFil).toHaveBeenCalledWith('a');
});

test('un tipus que no és «marca» (o cap) és el de llegir', async () => {
  Object.assign(mocks.extra, { tipusAvisFil: () => null, llegintFil: () => false });
  render(<XatSection />);
  await waitFor(() => expect(screen.getByText(textLectura)).toBeTruthy());
  expect(screen.getByRole('button', { name: 'Torna-ho a provar' }).hasAttribute('aria-busy')).toBe(false);
});

test('la primera lectura ha fallat: l’avís, sense «Carregant la conversa…»', async () => {
  Object.assign(mocks.extra, { filCarregat: () => false, tipusAvisFil: () => 'lectura', llegintFil: () => false });
  render(<XatSection />);
  await waitFor(() => expect(screen.getByText(textLectura)).toBeTruthy());
  expect(screen.queryByText('Carregant la conversa…')).toBeNull();
  expect(screen.queryByText('Cap missatge encara. Inicia la conversa!')).toBeNull();
});
