/**
 * Pla 261022_1955 (Cercador Universal Desacoblat i Resilient, T3) · Proves
 * d'integració de /cerca amb el directori públic d'entitats, el padró tancat
 * dels forasters, el termini de les fonts i el logo resolt pel port. Els
 * contextos són els simulats de SearchSection.test.jsx; el port, el real amb
 * tres mètodes espiats.
 */
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import SearchSection from './SearchSection';
import { MS_TERMINI_FONT, oblidaElDirectori } from './useCercaGlobal.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';

const mocks = vi.hoisted(() => ({
  url: '',
  setParams: vi.fn(),
  mode: 'remote',
  t: (_, fallback) => fallback,
  ui: { locale: 'ca-ES', externalConfig: {} },
  core: null,
  mur: null,
  media: null,
  notes: null,
  xat: null,
  identitat: null,
  session: null,
  listPublicOrganizations: null,
  portTeCapacitat: null,
  resolveAsset: null
}));

vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (...args) => mocks.portTeCapacitat(...args),
  resolveAsset: (...args) => mocks.resolveAsset(...args),
  listPublicOrganizations: (...args) => mocks.listPublicOrganizations(...args)
}));

vi.mock('../../app/contexts/RouterContext', async () => {
  const React = await import('react');
  const Link = ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children);
  return {
    /* Un useSearchParams amb estat: l'URL canvia com al router de veres. */
    useSearchParams: () => {
      const [params, setParams] = React.useState(() => new URLSearchParams(mocks.url));
      const aplica = React.useCallback((nous, opcions) => {
        mocks.setParams(nous, opcions);
        setParams((previs) => {
          const seguents = new URLSearchParams(previs);
          Object.entries(nous).forEach(([clau, valor]) => (valor == null ? seguents.delete(clau) : seguents.set(clau, valor)));
          return seguents;
        });
      }, []);
      return [params, aplica];
    },
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/cerca', search: '' }),
    useRouter: () => ({ navigate: vi.fn(), currentPath: '/cerca', basename: '' }),
    Link,
    NavLink: Link
  };
});
/* La Pàgina Universal simulada pinta el títol i, davall, la ranura
   accioPrincipal dins del bloc del títol, com PageFrame (div.page-title-accio). */
vi.mock('../../components/universal/UniversalPage', async () => {
  const { createElement } = await import('react');
  return {
    UniversalPage: ({ title, accioPrincipal, children }) => createElement('main', null,
      createElement('header', { 'data-testid': 'capcalera' },
        createElement('p', { 'data-testid': 'titol' }, title),
        accioPrincipal ? createElement('div', { className: 'page-title-accio' }, accioPrincipal) : null),
      children)
  };
});
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => mocks.ui
}));
vi.mock('../../config/backendConfig.js', () => ({ normalizeBackendConfig: () => ({ dataMode: mocks.mode }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));
vi.mock('../notes/NotesContext', () => ({ useNotes: () => mocks.notes }));
vi.mock('../xat/XatContext', () => ({ useXat: () => mocks.xat }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mocks.session }));
const BUIT = Object.freeze([]);

beforeEach(() => {
  mocks.url = '';
  mocks.mode = 'remote';
  mocks.setParams = vi.fn();
  mocks.core = {
    status: 'ready', error: null, refresh: vi.fn(),
    agents: [{ id: '0001', name: 'Mestre Javi', type: 'PERSON', town_name: 'La Torre de les Maçanes' }],
    towns: [{ id: 'benifallim', title: 'Benifallim', comarca: "L'Alcoià", population: '110 hab' }],
    pages: BUIT
  };
  mocks.mur = { status: 'ready', error: null, refresh: vi.fn(), feedPosts: BUIT, events: BUIT, marketItems: BUIT };
  mocks.media = { status: 'ready', error: null, refresh: vi.fn(), mediaItems: BUIT };
  mocks.notes = { status: 'ready', error: null, refresh: vi.fn(), notes: BUIT };
  mocks.xat = {
    status: 'ready', scopeKey: 'A#1', ambitEstable: 'A', chatThreads: BUIT, recarrega: vi.fn(),
    cercaMembres: vi.fn(async () => [{ usuari_id: 'u-pepa', nom: 'Javi Ferrer', tipus: 'persona', avatar_url: null, fil_id: null }])
  };
  mocks.identitat = { identitats: [{ tipus: 'persona', id: 'jo', nom: 'Javi Llinares', avatar: null }] };
  mocks.session = {
    currentUser: { id: 'jo', email: 'jo@exemple.org', user_metadata: { full_name: 'Javi Llinares', town_name: 'La Torre de les Maçanes' } },
    estat: 'dins',
    teCapacitat: (nom) => nom === 'directoriEntitats'
  };
  mocks.listPublicOrganizations = vi.fn(async () => [FIGUERA]);
  mocks.portTeCapacitat = (nom) => nom === 'mitjans';
  mocks.resolveAsset = vi.fn(async (ref) => (ref === LOGO ? LOGO_PUBLIC : ref));
  oblidaElDirectori();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const ID_FIGUERA = 'a6d028a2-8abc-469d-bf86-ae21aea6bffc';
const LOGO = 'sdp-media://mitjans/11111111-2222-3333-4444-555555555555/7d3c2f4e-0000-4000-8000-000000000001/avatars/logo.webp';
const LOGO_PUBLIC = 'https://poble.test/storage/v1/object/public/mitjans/logo.webp';
const FIGUERA = Object.freeze({
  id: ID_FIGUERA, tenant_id: '11111111-2222-3333-4444-555555555555', slug: 'lafiguera', name: 'La Figuera', kind: 'company',
  parent_organization_id: null, lema: '', description: 'Natural art 🌸 Made in La Terreta', logo_url: LOGO, hero_url: LOGO,
  presentacio_html: '', copyright: '', town_name: 'La Torre de les Maçanes', created_at: '2026-10-22T17:29:24Z', updated_at: null
});
/* El Storage del node és un origen propi: l'arrencada el registra (permetOrigenMitjans), com ací. */
beforeAll(() => permetOrigenMitjans(LOGO_PUBLIC));
const forasterDelServidor = () => Object.assign(
  new Error('Estàs en Mode Foraster: el xat és per a la gent d’este poble. Prova d’eixir i tornar a entrar.'),
  { code: 'SDP-XAT-003', retriable: false, cause: { status: 403, code: '42501' } }
);

const pinta = async () => { await act(async () => { render(<SearchSection />); }); };
const estat = () => document.querySelector('p[role="status"].sdp-cerca__estat');
const avisos = () => [...document.querySelectorAll('.sdp-alerta')].map((alerta) => alerta.textContent);

test('Pla 261022_1955 · sense sessió, «figuera» troba La Figuera a Tot i a Entitats (1), amb enllaç i sense cap error', async () => {
  mocks.session = { currentUser: null, estat: 'fora', teCapacitat: (nom) => nom === 'directoriEntitats' };
  mocks.identitat = { identitats: BUIT };
  mocks.url = '?q=figuera';
  await pinta();
  await waitFor(() => expect(screen.getByRole('link', { name: 'La Figuera' })).toBeTruthy());
  /* Sense saber el tenant actiu (el simulat no en porta), la ruta que sempre s'obri: per id. */
  expect(screen.getByRole('link', { name: 'La Figuera' }).getAttribute('href')).toBe(`/empresa/${ID_FIGUERA}`);
  expect(screen.getByRole('button', { name: 'Tot 1' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Entitats 1' })).toBeTruthy();
  expect(estat().textContent).toBe("S'ha trobat 1 resultat per a «figuera»");
  expect(screen.getByText('La Torre de les Maçanes')).toBeTruthy();
  /* L'únic avís és l'informatiu d'entrar: cap «No s'ha pogut buscar». */
  expect(avisos().some((text) => text.includes("No s'ha pogut buscar"))).toBe(false);
  expect(mocks.xat.cercaMembres).not.toHaveBeenCalled();
  expect(mocks.listPublicOrganizations).toHaveBeenCalledTimes(1);
  const [filtre] = mocks.listPublicOrganizations.mock.calls[0];
  expect(filtre.limit).toBe(500);
  expect(filtre.signal).toBeInstanceOf(AbortSignal);
});

test('Pla 261022_1955 · el logo opac del directori es resol pel port i es pinta', async () => {
  mocks.url = '?q=figuera&tipus=entitats';
  await pinta();
  await waitFor(() => expect(document.querySelector(`img[src="${LOGO_PUBLIC}"]`)).not.toBeNull());
  expect(mocks.resolveAsset).toHaveBeenCalledWith(LOGO, expect.anything());
  expect(document.querySelector('img[src^="sdp-media:"]')).toBeNull();
});

test('Pla 261022_1955 · un foraster (SDP-XAT-003, 403) no veu cap avís del padró i la resta de la cerca continua', async () => {
  mocks.xat.cercaMembres = vi.fn(async () => { throw forasterDelServidor(); });
  mocks.url = '?q=javi';
  await pinta();
  await waitFor(() => expect(mocks.xat.cercaMembres).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByRole('link', { name: 'Mestre Javi' })).toBeTruthy());
  expect(screen.queryByText(/Mode Foraster/)).toBeNull();
  expect(screen.queryByText("No s'ha pogut buscar en el padró del poble")).toBeNull();
  expect(screen.queryByRole('button', { name: 'Torna-ho a provar' })).toBeNull();
  expect(screen.queryByText("Encara arriben resultats d'algunes fonts…")).toBeNull();
  expect(screen.getByRole('heading', { name: 'Javi Llinares' })).toBeTruthy();
});

test.each([
  ['un 403 sense codi propi', () => Object.assign(new Error('Forbidden'), { code: 'XAT', cause: { status: 403 } })],
  ['el 42501 de la causa', () => Object.assign(new Error('permís'), { code: 'XAT', cause: { code: '42501' } })],
  ['sense sessió al servidor (SDP-XAT-001)', () => Object.assign(new Error('Cal la sessió iniciada.'), { code: 'SDP-XAT-001' })],
  ['SENSE_PERMIS', () => Object.assign(new Error('permission denied for function membres_del_poble'), { code: 'SENSE_PERMIS' })]
])('Pla 261022_1955 · el padró tancat per %s tampoc no pinta cap avís', async (_, error) => {
  mocks.xat.cercaMembres = vi.fn(async () => { throw error(); });
  mocks.url = '?q=javi';
  await pinta();
  await waitFor(() => expect(mocks.xat.cercaMembres).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByRole('link', { name: 'Mestre Javi' })).toBeTruthy());
  expect(screen.queryByText("No s'ha pogut buscar en el padró del poble")).toBeNull();
});

test('Pla 261022_1955 · una fallada de veres del directori s’avisa, la resta es veu, i «Torna-ho a provar» el torna a demanar', async () => {
  mocks.listPublicOrganizations = vi.fn(async () => { throw Object.assign(new Error('Error de xarxa: No es pot connectar al servidor.'), { status: 0 }); });
  mocks.url = '?q=javi';
  await pinta();
  await waitFor(() => expect(screen.getByText("No s'ha pogut buscar en el directori d'entitats")).toBeTruthy());
  expect(screen.getByText('Error de xarxa: No es pot connectar al servidor.')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Mestre Javi' })).toBeTruthy();

  mocks.listPublicOrganizations.mockImplementation(async () => [{ ...FIGUERA, name: 'Javi Fusteria', slug: 'javifusteria' }]);
  await act(async () => { screen.getByRole('button', { name: 'Torna-ho a provar' }).click(); });
  await waitFor(() => expect(screen.getByRole('link', { name: 'Javi Fusteria' })).toBeTruthy());
  expect(screen.queryByText("No s'ha pogut buscar en el directori d'entitats")).toBeNull();
  expect(mocks.listPublicOrganizations).toHaveBeenCalledTimes(2);
});

test('Pla 261022_1955 · el directori es demana una vegada per àmbit: ni per tecla ni en tornar a /cerca', async () => {
  mocks.url = '?q=fig';
  await pinta();
  await waitFor(() => expect(screen.getByRole('link', { name: 'La Figuera' })).toBeTruthy());
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'figuera' } });
  await waitFor(() => expect(mocks.setParams).toHaveBeenCalledWith({ q: 'figuera' }, { replace: true }));
  cleanup();
  mocks.url = '?q=terreta';
  await pinta();
  await waitFor(() => expect(screen.getByRole('link', { name: 'La Figuera' })).toBeTruthy());
  expect(mocks.listPublicOrganizations).toHaveBeenCalledTimes(1);
});

test('Pla 261022_1955 · amb el filtre Persones el directori no es demana; sense la capacitat, tampoc', async () => {
  mocks.url = '?q=javi&tipus=persones';
  await pinta();
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Javi Ferrer' })).toBeTruthy());
  cleanup();
  mocks.session = { ...mocks.session, teCapacitat: () => false };
  mocks.url = '?q=figuera';
  await pinta();
  await waitFor(() => expect(screen.getByText('Cap resultat per a «figuera»')).toBeTruthy());
  expect(mocks.listPublicOrganizations).not.toHaveBeenCalled();
});

test('Pla 261022_1955 · l’entitat que gestiones i la del directori són una sola fitxa («La gestiones tu»)', async () => {
  mocks.identitat = { identitats: [
    { tipus: 'persona', id: 'jo', nom: 'Javi Llinares', avatar: null },
    { tipus: 'entitat', id: ID_FIGUERA, nom: 'La Figuera', slug: 'lafiguera', avatar: null, poble: 'La Torre de les Maçanes' }
  ] };
  mocks.url = '?q=figuera';
  await pinta();
  await waitFor(() => expect(mocks.listPublicOrganizations).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByRole('button', { name: 'Entitats 1' })).toBeTruthy());
  expect(screen.getAllByRole('link', { name: 'La Figuera' })).toHaveLength(1);
  expect(screen.getByText('La gestiones tu')).toBeTruthy();
});

test('Pla 261022_1955 · una font que no respon passa a avís als deu segons, i la resta ja s’hi veu', async () => {
  vi.useFakeTimers();
  mocks.xat.cercaMembres = vi.fn(() => new Promise(() => {}));
  mocks.listPublicOrganizations = vi.fn(() => new Promise(() => {}));
  mocks.url = '?q=javi';
  await pinta();
  expect(screen.getByRole('link', { name: 'Mestre Javi' })).toBeTruthy();
  expect(screen.getByText("Encara arriben resultats d'algunes fonts…")).toBeTruthy();
  await act(async () => { vi.advanceTimersByTime(MS_TERMINI_FONT - 1); });
  expect(screen.queryByText("No s'ha pogut buscar en el padró del poble")).toBeNull();
  await act(async () => { vi.advanceTimersByTime(2); });
  expect(screen.getByText("No s'ha pogut buscar en el padró del poble")).toBeTruthy();
  expect(screen.getByText("No s'ha pogut buscar en el directori d'entitats")).toBeTruthy();
  expect(screen.getAllByText('No ha respost a temps. La resta de resultats continua ací.')).toHaveLength(2);
  expect(screen.queryByText("Encara arriben resultats d'algunes fonts…")).toBeNull();
  expect(screen.getByRole('link', { name: 'Mestre Javi' })).toBeTruthy();
});

/* Gauntlet (crític del hook, confirmat) · Un termini vençut no es queda
   enganxat a la clau: tornar a la vista Tot fa una petició nova, i esta té els
   seus deu segons sencers. */
test('Pla 261022_1955 · després d’un termini, anar a Pobles i tornar a Tot no avisa d’una petició acabada d’eixir', async () => {
  vi.useFakeTimers();
  mocks.xat.cercaMembres = vi.fn(() => new Promise(() => {}));
  mocks.url = '?q=javi';
  await pinta();
  await act(async () => { vi.advanceTimersByTime(MS_TERMINI_FONT + 1); });
  expect(screen.getByText("No s'ha pogut buscar en el padró del poble")).toBeTruthy();
  await act(async () => { screen.getByRole('button', { name: /^Pobles/ }).click(); });
  await act(async () => { screen.getByRole('button', { name: /^Tot/ }).click(); });
  expect(mocks.xat.cercaMembres).toHaveBeenCalledTimes(2);
  await act(async () => { vi.advanceTimersByTime(50); });
  expect(screen.queryByText("No s'ha pogut buscar en el padró del poble")).toBeNull();
  await act(async () => { vi.advanceTimersByTime(MS_TERMINI_FONT); });
  expect(screen.getByText("No s'ha pogut buscar en el padró del poble")).toBeTruthy();
});

/* Gauntlet (crític del hook; xarxa rural) · El directori no depén del filtre:
   una petició lenta continua viva encara que la persona passe per Persones. */
test('Pla 261022_1955 · una petició lenta del directori sobreviu a un canvi de filtre i no es repetix', async () => {
  let respon;
  mocks.listPublicOrganizations = vi.fn((filtre) => new Promise((resol) => { respon = resol; void filtre; }));
  mocks.url = '?q=figuera';
  await pinta();
  await act(async () => { screen.getByRole('button', { name: /^Persones/ }).click(); });
  await act(async () => { screen.getByRole('button', { name: /^Tot/ }).click(); });
  expect(mocks.listPublicOrganizations).toHaveBeenCalledTimes(1);
  expect(mocks.listPublicOrganizations.mock.calls[0][0].signal.aborted).toBe(false);
  await act(async () => { respon([FIGUERA]); });
  await waitFor(() => expect(screen.getByRole('link', { name: 'La Figuera' })).toBeTruthy());
});
