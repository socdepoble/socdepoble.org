/* Revisió adversarial 260930 · carril F-POBLE. Les correccions de
   XatSection que no cabien a XatSection.test.jsx sense tocar-ne el mock:
     · P2 · l'esborrany penja d'ambitEstable, no de scopeKey (renovació del JWT);
     · P3 · la fila virtual del poble no tapa el «Carregant…» de la llista;
     · P3 · prémer la fila virtual del poble no deixa el focus perdut;
     · P2/P3 · un Escape nascut en un diàleg obert no buida «Seleccionar xats». */
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { agrupaComunitats, mapejaFil } from './missatges.js';
import { buidaEsborranys } from './esborranys.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  threadId: 'a',
  scope: 'A',
  ambit: 'P',
  status: 'ready',
  params: new URLSearchParams(),
  externalConfig: {},
  threads: [],
  comunitats: [],
  obriFilDePagina: vi.fn(),
  showToast: vi.fn(),
  amplada: 1280
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
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (v) => v }),
  /* usePobleAmfitrio llig el poble de l'amfitrió d'ací. */
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: mocks.externalConfig })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('./XatContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useXat: () => ({
    scopeKey: mocks.scope,
    ambitEstable: mocks.ambit,
    status: mocks.status,
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
    obriFilDePagina: mocks.obriFilDePagina,
    joId: 'jo',
    joNom: 'Javi',
    senseSessio: false,
    modeDades: 'remote',
    /* Sense guarda: EntradaDelPoble no hi fa res (en té les seues proves). */
    consumixEntrada: undefined
  })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: mocks.showToast })
}));

/* AppGridShell mesura el contenidor: 1280 és escriptori (closca ampla). */
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() { return mocks.amplada; }
});

const ARA = Date.now();
const fa = (dies) => new Date(ARA - dies * 86400000).toISOString();
const POBLE = { id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre' };

function filsDeMostra() {
  return [
    { id: 'a', title: 'Conversa', name: 'Conversa', tipus: 'directe', ultimText: 'Hola', ultimAl: fa(0), noLlegits: 0, altresNoms: ['Veí'] },
    { id: 'b', title: 'Altra', name: 'Altra', tipus: 'grup', ultimText: 'Adeu', ultimAl: fa(1), noLlegits: 0, altresNoms: ['Pep', 'Maria'] }
  ];
}

/* La comunitat del poble tal com arriba del context després d'obrir-la. */
function ambComunitatDelPoble() {
  const subjecte = { tipus: 'poble', id: POBLE.id, ruta: `/pobles/${POBLE.id}`, titol: POBLE.nom };
  const comunitat = [
    { id: 'c-torre', tipus: 'comunitat', titol: POBLE.nom, comunitatId: null, subjecte },
    { id: 'a-torre', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-torre', subjecte, rol: 'membre', ultimAl: fa(0.5) },
    { id: 'g-torre', tipus: 'grup', titol: 'General', comunitatId: 'c-torre', subjecte, rol: 'membre', ultimAl: fa(0.2) }
  ].map((f) => mapejaFil(f));
  mocks.threads = [...filsDeMostra(), ...comunitat];
  mocks.comunitats = agrupaComunitats(mocks.threads);
}

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.navigate.mockReset();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.threadId = 'a';
  mocks.scope = 'A';
  mocks.ambit = 'P';
  mocks.status = 'ready';
  mocks.params = new URLSearchParams();
  mocks.externalConfig = {};
  mocks.threads = filsDeMostra();
  mocks.comunitats = [];
  mocks.amplada = 1280;
  mocks.obriFilDePagina.mockResolvedValue(null);
  buidaEsborranys();
});

/* ─────────── P2 · l'esborrany sobreviu a la renovació del JWT ─────────── */

test('P2 · una renovació del JWT (scopeKey nou, mateix ambitEstable) conserva el text a mig escriure', () => {
  const vista = render(<XatSection />);
  fireEvent.change(screen.getByRole('textbox', { name: 'Escriu un missatge' }), { target: { value: 'mig escrit' } });
  /* La renovació: scopeKey canvia i XatWorkspace es torna a muntar sencer. */
  mocks.scope = 'A-renovat';
  vista.rerender(<XatSection />);
  expect(screen.getByRole('textbox', { name: 'Escriu un missatge' }).value).toBe('mig escrit');
});

test('P2 · una altra persona (o un altre actor) és un altre ambitEstable i no veu el text', () => {
  const vista = render(<XatSection />);
  fireEvent.change(screen.getByRole('textbox', { name: 'Escriu un missatge' }), { target: { value: 'privat de P' } });
  mocks.scope = 'B';
  mocks.ambit = 'Q';
  vista.rerender(<XatSection />);
  expect(screen.getByRole('textbox', { name: 'Escriu un missatge' }).value).toBe('');
});

/* ─────────── P3 · la fila virtual del poble i l'estat de càrrega ─────────── */

test('P3 · mentre la llista carrega, la fila virtual del poble no tapa el «Carregant…»', () => {
  mocks.threadId = null;
  mocks.externalConfig = { poble: POBLE.id, nomPoble: POBLE.nom };
  mocks.status = 'loading';
  mocks.threads = [];
  const vista = render(<XatSection />);
  expect(screen.getByText('Carregant…').getAttribute('role')).toBe('status');
  expect(screen.queryByRole('button', { name: /Gent de la Torre, Grup del poble/ })).toBeNull();

  /* Amb la llista definitiva i sense comunitat, la fila virtual hi és. */
  mocks.status = 'ready';
  vista.rerender(<XatSection />);
  expect(screen.getByRole('button', { name: /Gent de la Torre, Grup del poble/ })).toBeTruthy();
  expect(screen.queryByText('Carregant…')).toBeNull();
});

/* ─────────── P3 · el focus segueix la fila del poble ─────────── */

test('P3 · prémer la fila virtual amb el teclat: quan naix la comunitat, el focus va a la seua fila, no a <body>', () => {
  mocks.threadId = null;
  mocks.externalConfig = { poble: POBLE.id, nomPoble: POBLE.nom };
  const vista = render(<XatSection />);
  const fila = screen.getByRole('button', { name: /Gent de la Torre, Grup del poble/ });
  fila.focus();
  fireEvent.click(fila);
  const [ruta] = mocks.navigate.mock.calls.at(-1);
  expect(new URL(ruta, 'https://x.invalid').searchParams.get('sobre')).toBe(`poble:${POBLE.id}`);

  /* obriFilDePagina crea la comunitat i recarrega: la fila virtual (poble:<id>)
     es convertix en la de la comunitat (comunitat:<id>), un altre <button>. */
  ambComunitatDelPoble();
  vista.rerender(<XatSection />);
  expect(fila.isConnected).toBe(false);
  const li = screen.getByRole('list', { name: 'Converses' }).querySelector('li[data-clau="comunitat:c-torre"]');
  expect(li).not.toBeNull();
  expect(document.activeElement).toBe(li.querySelector('button'));
});

test('P3 · si la comunitat arriba sense que ningú haja premut la fila, el focus no es mou', () => {
  mocks.threadId = null;
  mocks.externalConfig = { poble: POBLE.id, nomPoble: POBLE.nom };
  const vista = render(<XatSection />);
  const cerca = screen.getByRole('searchbox', { name: 'Cerca converses' });
  cerca.focus();
  cerca.blur();
  expect(document.activeElement).toBe(document.body);
  ambComunitatDelPoble();
  vista.rerender(<XatSection />);
  expect(document.activeElement).toBe(document.body);
});

/* ─────────── P2/P3 · Escape d'un diàleg i «Seleccionar xats» ─────────── */

function entraEnSeleccioAmbUnaTriada() {
  fireEvent.click(screen.getByRole('button', { name: 'Més opcions' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar xats' }));
  fireEvent.click(within(screen.getByRole('list', { name: 'Converses' })).getAllByRole('checkbox')[0]);
  expect(screen.getByText('1 seleccionada')).toBeTruthy();
}

/* Un modal fora de l'arbre del Xat, com el full «Ajustos» de ClosCaXat: a la
   SPA és un <dialog> amb showModal() (jsdom: l'atribut open); a l'encastat,
   una capa .sdp-capa-modal visible. */
function modal(tipus) {
  const capa = document.createElement(tipus === 'capa' ? 'div' : 'dialog');
  if (tipus === 'capa') capa.className = 'sdp-capa-modal';
  else capa.setAttribute('open', '');
  const camp = document.createElement('input');
  camp.setAttribute('aria-label', 'Cerca als ajustos');
  capa.appendChild(camp);
  document.body.appendChild(capa);
  return { capa, camp };
}

test.each([['dialog'], ['capa']])('Escape nascut dins d’un modal obert (%s) el tanca a ell i no buida «Seleccionar xats»', (tipus) => {
  render(<XatSection />);
  entraEnSeleccioAmbUnaTriada();
  const { capa, camp } = modal(tipus);
  camp.focus();
  fireEvent.keyDown(camp, { key: 'Escape' });
  expect(screen.getByText('1 seleccionada')).toBeTruthy();
  capa.remove();
  /* Sense cap diàleg, Escape continua eixint de la selecció. */
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
});

test('Escape amb el focus caigut a <body> i un <dialog> modal obert tampoc no buida la selecció', () => {
  render(<XatSection />);
  entraEnSeleccioAmbUnaTriada();
  const { capa } = modal('dialog');
  document.activeElement?.blur?.();
  fireEvent.keyDown(document.body, { key: 'Escape' });
  expect(screen.getByText('1 seleccionada')).toBeTruthy();
  capa.remove();
});

test('una capa .sdp-capa-modal amagada (el Dialeg local tancat) no compta: Escape ix de la selecció', () => {
  render(<XatSection />);
  entraEnSeleccioAmbUnaTriada();
  const { capa } = modal('capa');
  capa.hidden = true;
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  capa.remove();
});
