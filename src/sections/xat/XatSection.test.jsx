import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { construeixRetall } from './retall';

const mocks = vi.hoisted(() => ({
  creaNota: vi.fn(),
  navigate: vi.fn(),
  threadId: 'a',
  scope: 'A',
  params: new URLSearchParams(),
  members: vi.fn(),
  createThread: vi.fn(),
  openThread: vi.fn(),
  send: vi.fn(),
  reintenta: vi.fn(),
  descarta: vi.fn(),
  carregaMes: vi.fn(),
  hiHaMes: vi.fn(),
  marcaVist: vi.fn(),
  seo: vi.fn(),
  showToast: vi.fn(),
  threads: [],
  messages: [],
  totalNoLlegits: 0,
  amplada: 1280
}));

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: '/xat' }),
  useSearchParams: () => [mocks.params],
  useParams: () => ({ threadId: mocks.threadId }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: '/xat' })
}));
vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
vi.mock('../text/TextSection', () => ({ default: () => null }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, fallback) => fallback, resolveAsset: (v) => v }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: {} })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {} }) }));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: mocks.creaNota }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (opcions) => mocks.seo(opcions) }));
vi.mock('./XatContext', () => ({
  useXat: () => ({
    scopeKey: mocks.scope,
    status: 'ready',
    avis: null,
    chatThreads: mocks.threads,
    getThreadMessages: () => mocks.messages,
    sendChatMessage: mocks.send,
    obriFil: mocks.openThread,
    creaFil: mocks.createThread,
    cercaMembres: mocks.members,
    totalNoLlegits: mocks.totalNoLlegits,
    hiHaMesAntics: mocks.hiHaMes,
    carregantAntics: () => false,
    carregaMesAntics: mocks.carregaMes,
    reintenta: mocks.reintenta,
    descartaFallit: mocks.descarta,
    marcaVist: mocks.marcaVist
  })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: mocks.showToast })
}));

/* AppGridShell mesura el contenidor: jsdom dona 0 (estret). Ací decidim
   l'amplària per prova: 1280 és escriptori, 375 és mòbil. */
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() { return mocks.amplada; }
});

const ARA = Date.now();
const fa = (dies) => new Date(ARA - dies * 86400000).toISOString();

function filsDeMostra() {
  return [
    { id: 'a', title: 'Conversa', name: 'Conversa', tipus: 'directe', ultimText: 'Hola', ultimAl: fa(0), noLlegits: 3, altresNoms: ['Veí'] },
    { id: 'b', title: 'Altra', name: 'Altra', tipus: 'grup', ultimText: 'Adeu', ultimAl: fa(1), noLlegits: 0, preferit: true, altresNoms: ['Pep', 'Maria'] }
  ];
}

function missatgesDeMostra() {
  return [
    { id: '1', seq: 1, text: 'Primer', sender: 'me', creatAl: fa(2), estatEnviament: 'llegit' },
    { id: '2', seq: 2, text: 'Segon', sender: 'other', author: 'Veí', usuariId: 'x', creatAl: fa(0), estatEnviament: 'enviat' }
  ];
}

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.threadId = 'a';
  mocks.scope = 'A';
  mocks.params = new URLSearchParams();
  mocks.amplada = 1280;
  mocks.threads = filsDeMostra();
  mocks.messages = missatgesDeMostra();
  mocks.totalNoLlegits = 0;
  mocks.members.mockResolvedValue([]);
  mocks.createThread.mockResolvedValue('thread-new');
  mocks.send.mockResolvedValue([]);
  mocks.hiHaMes.mockReturnValue(false);
});

test('selecció en ordre i navegació després de confirmar', async () => {
  let resolve;
  mocks.creaNota.mockReturnValue(new Promise((r) => { resolve = r; }));
  render(<XatSection />);

  fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar missatges' }));

  const send = screen.getByRole('button', { name: /Enviar al Bloc de Notes/ });
  expect(send.disabled).toBe(true);

  const caselles = screen.getAllByRole('checkbox');
  expect(caselles).toHaveLength(2);
  fireEvent.click(caselles[1]);
  fireEvent.click(caselles[0]);
  expect(caselles[0].getAttribute('aria-checked')).toBe('true');

  fireEvent.click(send);

  expect(mocks.creaNota).toHaveBeenCalledTimes(1);
  const retall = mocks.creaNota.mock.calls[0][0];
  expect(retall.content).toContain('Primer');
  expect(retall.content).toContain('Segon');
  expect(retall.content.indexOf('Primer')).toBeLessThan(retall.content.indexOf('Segon'));
  expect(mocks.navigate).not.toHaveBeenCalled();

  resolve({ id: 'new-note' });
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/notes?nota=new-note'));
});

test('retall.js saneja i escapa correctament', () => {
  const fil = { title: '<img>' };
  const missatges = [{ author: '<b>', text: '<script>alert(1)</script>\n&' }];
  const retall = construeixRetall({ fil, missatges, locale: 'ca-ES' });

  expect(retall.title).toBe('Retall de «&lt;img&gt;»');
  expect(retall.content).toContain('&lt;script&gt;alert(1)&lt;/script&gt;<br>&amp;');
  expect(retall.content).not.toContain('<script>');
});

test('context de Connectar acompanya la tria de destinatari i no envia missatges', async () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ context: 'Una peça' });
  mocks.members.mockResolvedValue([{ usuari_id: 'B', nom: 'Veí' }]);
  render(<XatSection />);
  fireEvent.click(await screen.findByRole('button', { name: /Veí/ }));
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/xat/thread-new?context=Una%20pe%C3%A7a'));
  expect(mocks.send).not.toHaveBeenCalled();
});

test('canviar àmbit (scopeKey) purga el padró i ignora una obertura tardana de conversa', async () => {
  mocks.threadId = null;
  mocks.members.mockResolvedValue([{ usuari_id: 'B', nom: 'Privat d A' }]);
  let resolve;
  mocks.createThread.mockImplementation(() => new Promise((done) => { resolve = done; }));
  const view = render(<XatSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }));
  fireEvent.click(await screen.findByRole('button', { name: /Privat d A/ }));
  mocks.scope = 'B';
  view.rerender(<XatSection />);
  expect(screen.queryByText('Privat d A')).toBeNull();
  await act(async () => resolve('old-thread'));
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('les píndoles Tot · No llegits · Preferits · Grups filtren de veres', () => {
  mocks.threadId = null;
  render(<XatSection />);
  expect(screen.getByText('Hola')).toBeTruthy();
  expect(screen.getByText('Adeu')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'No llegits' }));
  expect(screen.getByText('Hola')).toBeTruthy();
  expect(screen.queryByText('Adeu')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Grups' }));
  expect(screen.queryByText('Hola')).toBeNull();
  expect(screen.getByText('Adeu')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Preferits' }));
  expect(screen.queryByText('Hola')).toBeNull();
  expect(screen.getByText('Adeu')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Tot' }));
  expect(screen.getByText('Hola')).toBeTruthy();
  expect(screen.getByText('Adeu')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Tot' }).getAttribute('aria-pressed')).toBe('true');
});

test('el comptador de no llegits es pinta amb número i text accessible', () => {
  mocks.threadId = null;
  render(<XatSection />);
  expect(screen.getByText('3')).toBeTruthy();
  expect(screen.getByText('3 missatges no llegits')).toBeTruthy();
  fireEvent.click(screen.getByText('Hola').closest('button'));
  expect(mocks.navigate).toHaveBeenCalledWith('/xat/a');
});

test('el compositor envia amb Retorn i fa salt de línia amb Maj+Retorn a l\'escriptori', async () => {
  render(<XatSection />);
  const camp = screen.getByRole('textbox', { name: 'Escriu un missatge' });
  expect(camp.tagName).toBe('TEXTAREA');
  const envia = screen.getByRole('button', { name: 'Envia' });
  expect(envia.disabled).toBe(true);

  fireEvent.change(camp, { target: { value: 'Bon dia' } });
  expect(envia.disabled).toBe(false);
  fireEvent.keyDown(camp, { key: 'Enter', shiftKey: true });
  expect(mocks.send).not.toHaveBeenCalled();

  fireEvent.keyDown(camp, { key: 'Enter' });
  await waitFor(() => expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), 'Bon dia'));
  expect(camp.value).toBe('');
});

test('una bombolla en error es queda amb «Torna-ho a provar» i «Descarta»', () => {
  mocks.messages = [
    ...missatgesDeMostra(),
    { id: '3', seq: null, text: 'Fallit', sender: 'me', creatAl: fa(0), estatEnviament: 'error' }
  ];
  render(<XatSection />);
  expect(screen.getByText("No s'ha enviat")).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
  expect(mocks.reintenta).toHaveBeenCalledWith('3');
  fireEvent.click(screen.getByRole('button', { name: 'Descarta' }));
  expect(mocks.descarta).toHaveBeenCalledWith('3');
});

test('els enllaços són segurs i avisen dels dominis enganyosos', () => {
  mocks.messages = [
    { id: '9', seq: 9, text: 'Mira http://xn--pple-43d.com/entra ara', sender: 'other', author: 'Veí', creatAl: fa(0) }
  ];
  render(<XatSection />);
  const enllac = screen.getByRole('link', { name: 'http://xn--pple-43d.com/entra' });
  expect(enllac.getAttribute('rel')).toBe('noopener noreferrer');
  expect(enllac.getAttribute('target')).toBe('_blank');
  expect(screen.getByText(/caràcters enganyosos \(xn--pple-43d\.com\)/)).toBeTruthy();
});

test('el títol de la pestanya porta el comptador de no llegits', () => {
  mocks.totalNoLlegits = 5;
  render(<XatSection />);
  expect(mocks.seo).toHaveBeenCalledWith(expect.objectContaining({ title: '(5) Xat' }));
  cleanup();
  mocks.totalNoLlegits = 0;
  render(<XatSection />);
  expect(mocks.seo).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Xat' }));
});

test('«Carrega\'n més» demana l\'historial anterior', () => {
  mocks.hiHaMes.mockReturnValue(true);
  render(<XatSection />);
  fireEvent.click(screen.getByRole('button', { name: "Carrega'n més" }));
  expect(mocks.carregaMes).toHaveBeenCalledWith('a');
});

test('la capçalera no promet trucades i la línia secundària només ix als grups', () => {
  render(<XatSection />);
  expect(screen.queryByRole('button', { name: /trucada/i })).toBeNull();
  expect(screen.queryByText('Veí', { selector: '.sdp-xat-capcalera__sub' })).toBeNull();
  cleanup();
  mocks.threadId = 'b';
  render(<XatSection />);
  expect(screen.getByText('Pep, Maria')).toBeTruthy();
});

test('en mode estret primer es veu la llista i, amb conversa, la conversa', async () => {
  mocks.amplada = 375;
  mocks.threadId = null;
  render(<XatSection />);
  await waitFor(() => expect(document.getElementById('app-grid-list').getAttribute('data-obert')).toBe('true'));
  cleanup();
  mocks.threadId = 'a';
  render(<XatSection />);
  await waitFor(() => expect(document.getElementById('app-grid-main').getAttribute('data-obert')).toBe('true'));
  expect(document.getElementById('app-grid-list').getAttribute('data-obert')).toBe('false');
  expect(screen.getByRole('button', { name: 'Torna a la llista' })).toBeTruthy();
});
