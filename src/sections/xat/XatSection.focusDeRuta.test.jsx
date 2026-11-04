/* xat-ux-a11y-03 (T7a, 261104) · Obrir o tancar una conversa canvia el
   pathname (/xat ↔ /xat/<fil>, el mateix XatSection) i App enfoca
   main#main-content a cada canvi (App.jsx:444-449). Com que l'efecte del pare
   corre després dels del fill, el focus es quedava a <main>: el Tab següent
   anava a «Idioma» de la barra negra i, en tornar a la llista en estret, es
   perdia la fila d'on es venia. Ara el Xat el recol·loca un fotograma després
   (la regla de focusLliure del Lector, ordre del Mestre del 261004): en obrir,
   a la llista de missatges (contorn només amb :focus-visible; el compositor en
   ample és decisió del Mestre); en tancar, al botó de la fila del fil tancat
   o al «+». Mai si la persona ja té el focus en un altre control.
   L'arnés `AppDeProva` replica l'efecte de ruta d'App: un efecte passiu del
   pare sobre el pathname que enfoca <main id="main-content" tabIndex=-1>. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { buidaEsborranys } from './esborranys.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), threadId: null, params: new URLSearchParams(), threads: [], messages: [], amplada: 1280,
  showToast: vi.fn()
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
  useUIActions: () => ({ t: (_, fallback) => fallback, resolveAsset: (v) => v }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: {} })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('./XatContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useXat: () => ({
    scopeKey: 'A', ambitEstable: '', status: 'ready', avis: null, chatThreads: mocks.threads, getThreadMessages: () => mocks.messages,
    sendChatMessage: vi.fn(async () => []), obriFil: () => {}, creaFil: vi.fn(), cercaMembres: vi.fn(async () => []), totalNoLlegits: 0,
    hiHaMesAntics: () => false, carregantAntics: () => false, carregaMesAntics: () => {}, reintenta: () => {},
    descartaFallit: () => {}, marcaVist: () => {}, comunitats: [], contactesFrequents: [], marcaLlegides: () => 0,
    obriFilDePagina: vi.fn(async () => null), joId: 'jo', joNom: 'Javi', senseSessio: false
  })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));

/* AppGridShell mesura el contenidor: 1280 és ample (llista i conversa); 375, estret. */
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return mocks.amplada; } });

const ARA = Date.now();
const fa = (dies) => new Date(ARA - dies * 86400000).toISOString();
const filsDeMostra = () => [
  { id: 'a', title: 'Conversa', name: 'Conversa', tipus: 'directe', ultimText: 'Hola', ultimAl: fa(0), noLlegits: 0, altresNoms: ['Veí'] },
  { id: 'b', title: 'Altra', name: 'Altra', tipus: 'grup', ultimText: 'Adeu', ultimAl: fa(1), noLlegits: 0, altresNoms: ['Pep', 'Maria'] }
];
const missatgesDeMostra = () => [
  { id: '1', seq: 1, text: 'Primer', sender: 'me', creatAl: fa(2), estatEnviament: 'llegit' },
  { id: '2', seq: 2, text: 'Segon', sender: 'other', author: 'Veí', usuariId: 'x', creatAl: fa(0), estatEnviament: 'enviat' }
];

/* App.jsx:444-449 · «Restaurar el focus a main en canviar de ruta (A11y)». */
function AppDeProva() {
  const pathname = mocks.threadId ? `/xat/${mocks.threadId}` : '/xat';
  const mainRef = useRef(null);
  useEffect(() => { mainRef.current?.focus({ preventScroll: true }); }, [pathname]);
  return (
    <>
      <input aria-label="Cerca de la barra negra" />
      <main id="main-content" tabIndex={-1} ref={mainRef}><XatSection /></main>
    </>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.threadId = null;
  mocks.params = new URLSearchParams();
  mocks.threads = filsDeMostra();
  mocks.messages = missatgesDeMostra();
  mocks.amplada = 1280;
  buidaEsborranys();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const fotograma = () => act(async () => { await new Promise((r) => { requestAnimationFrame(() => r()); }); });
const fotogrames = async (n = 3) => { for (let i = 0; i < n; i += 1) await fotograma(); };
const botoDeFila = (clau) => screen.getByRole('list', { name: 'Converses', hidden: true }).querySelector(`li[data-clau="${clau}"] > button`);
const llistaDeMissatges = () => document.querySelector('.app-grid-column--right .sdp-xat-missatges');
const main = () => document.getElementById('main-content');
/* El router simulat aplica la ruta que l'aplicació ha demanat amb navigate. */
function aplicaNavegacio(vista) {
  const [ruta] = mocks.navigate.mock.calls.at(-1);
  const url = new URL(ruta, 'https://x.invalid');
  const parts = url.pathname.split('/').filter(Boolean);
  mocks.threadId = parts[1] ? decodeURIComponent(parts[1]) : null;
  mocks.params = new URLSearchParams(url.search);
  vista.rerender(<AppDeProva />);
}

test('ample · Enter sobre una fila obri la conversa i el focus va a la llista de missatges, no a <main>', async () => {
  const vista = render(<AppDeProva />);
  await fotogrames();
  const fila = botoDeFila('a');
  fila.focus();
  fireEvent.click(fila);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/a');
  aplicaNavegacio(vista);
  /* L'efecte d'App ja ha passat: el focus és a <main>, com abans. */
  expect(document.activeElement).toBe(main());
  await fotogrames();
  expect(llistaDeMissatges()).not.toBeNull();
  expect(document.activeElement).toBe(llistaDeMissatges());
  /* La llista no entra a l'ordre de tabulació (tabIndex -1, Conversa.jsx). */
  expect(llistaDeMissatges().getAttribute('tabindex')).toBe('-1');
});

test('ample · d’una conversa a una altra, el focus va a la llista de missatges de la nova', async () => {
  mocks.threadId = 'a';
  const vista = render(<AppDeProva />);
  await fotogrames();
  fireEvent.click(botoDeFila('b'));
  aplicaNavegacio(vista);
  await fotogrames();
  expect(document.activeElement).toBe(llistaDeMissatges());
  expect(document.activeElement.closest('.app-grid-column--right')).not.toBeNull();
});

test('estret · «Torna a la llista» porta el focus al botó de la fila de la conversa tancada', async () => {
  mocks.amplada = 375;
  mocks.threadId = 'a';
  const vista = render(<AppDeProva />);
  await fotogrames();
  fireEvent.click(screen.getByRole('button', { name: 'Torna a la llista' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat');
  aplicaNavegacio(vista);
  await fotogrames();
  expect(document.activeElement).toBe(botoDeFila('a'));
});

test('arribar amb un enllaç directe (el muntatge) no mou el focus que App ha posat a <main>', async () => {
  mocks.threadId = 'a';
  render(<AppDeProva />);
  await fotogrames();
  expect(document.activeElement).toBe(main());
});

test('si la persona ja és en un altre control quan arriba el fotograma, no se li roba el focus', async () => {
  const vista = render(<AppDeProva />);
  await fotogrames();
  fireEvent.click(botoDeFila('a'));
  aplicaNavegacio(vista);
  const camp = screen.getByRole('textbox', { name: 'Cerca de la barra negra' });
  camp.focus();
  await fotogrames();
  expect(document.activeElement).toBe(camp);
});
