import { render, screen, fireEvent, waitFor, cleanup, act, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import XatControlSection from './XatControlSection';
import { construeixRetall } from './retall';
import { getVal, setVal, delVal } from '../../config/storage.js';

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

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ pathname: mocks.threadId ? `/xat/${mocks.threadId}` : '/xat' }),
    useSearchParams: () => [mocks.params],
    useParams: () => ({ threadId: mocks.threadId }),
    useRouter: () => ({ navigate: mocks.navigate, currentPath: '/xat' }),
    /* Els enllaços al perfil (T4) es pinten com a <a href>: prou per a llegir-ne la ruta. */
    Link: ({ to, children, className, ...rest }) => createElement('a', { href: to, className, ...rest }, children)
  };
});
vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
/* El document per defecte de la columna dreta: una marca que les proves
   poden buscar sense muntar tota la UniversalPage. Registra el seu SEO com
   el TextSection de veres, que és el que competix pel títol de la pestanya. */
vi.mock('../text/TextSection', async () => {
  const { createElement } = await import('react');
  const { useSEO } = await import('../../hooks/useSEO');
  function DocumentPerDefecte({ page, pageKey }) {
    useSEO({ title: page.title, description: page.subtitle || page.lead || 'Sóc de Poble' });
    return createElement('div', { 'data-testid': 'document-per-defecte' }, pageKey);
  }
  return { default: DocumentPerDefecte };
});
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, fallback) => fallback, resolveAsset: (v) => v }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: {} })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: mocks.creaNota }) }));
/* Anota cada crida i passa pel seoHead real: `document.title` diu qui guanya. */
vi.mock('../../hooks/useSEO', async (importOriginal) => {
  const real = await importOriginal();
  return { useSEO: (opcions) => { mocks.seo(opcions); return real.useSEO(opcions); } };
});
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

/* T12 (ordre del Mestre, 260927): els quatre filtres ja no són una fila de
   píndoles sinó un desplegable darrere de la icona de filtre, a la línia de
   la cerca; filtren igual que abans i la icona diu quin filtre hi ha. */
test('T12 · els filtres Tot · No llegits · Preferits · Grups viuen en un desplegable i filtren de veres', () => {
  mocks.threadId = null;
  render(<XatSection />);
  expect(screen.getByText('Hola')).toBeTruthy();
  expect(screen.getByText('Adeu')).toBeTruthy();
  expect(document.querySelector('.sdp-xat-filtres')).toBeNull();
  expect(screen.queryByRole('menu')).toBeNull();
  const tria = (nom) => {
    fireEvent.click(screen.getByRole('button', { name: /^Filtra les converses/ }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: nom }));
  };

  tria('No llegits');
  expect(screen.queryByRole('menu')).toBeNull();
  expect(screen.getByText('Hola')).toBeTruthy();
  expect(screen.queryByText('Adeu')).toBeNull();
  expect(screen.getByRole('button', { name: 'Filtra les converses (No llegits)' }).classList.contains('sdp-xat-filtre__boto--actiu')).toBe(true);

  tria('Grups');
  expect(screen.queryByText('Hola')).toBeNull();
  expect(screen.getByText('Adeu')).toBeTruthy();

  tria('Preferits');
  expect(screen.queryByText('Hola')).toBeNull();
  expect(screen.getByText('Adeu')).toBeTruthy();

  tria('Tot');
  expect(screen.getByText('Hola')).toBeTruthy();
  expect(screen.getByText('Adeu')).toBeTruthy();
  const boto = screen.getByRole('button', { name: 'Filtra les converses' });
  expect(boto.classList.contains('sdp-xat-filtre__boto--actiu')).toBe(false);
  fireEvent.click(boto);
  expect(screen.getByRole('menuitemradio', { name: 'Tot' }).getAttribute('aria-checked')).toBe('true');
  expect(screen.getAllByRole('menuitemradio').map((o) => o.textContent)).toEqual(['Tot', 'No llegits', 'Preferits', 'Grups']);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('menu')).toBeNull();
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

/* Ordre del Mestre (260927): la columna dreta que WhatsApp deixa buida
   mostra el document per defecte només sense conversa; amb conversa, només
   el xat, i en tornar a /xat torna el document. */
test('sense conversa la dreta mostra el document per defecte; amb conversa, només el xat', () => {
  mocks.threadId = null;
  render(<XatSection />);
  const dreta = () => document.getElementById('app-grid-main');
  expect(dreta().querySelector('[data-testid="document-per-defecte"]').textContent).toBe('anima');
  expect(dreta().querySelector('.sdp-xat-conversa')).toBeNull();
  cleanup();

  mocks.threadId = 'a';
  render(<XatSection />);
  expect(dreta().querySelector('[data-testid="document-per-defecte"]')).toBeNull();
  expect(dreta().querySelector('.sdp-xat-buit')).toBeNull();
  expect(dreta().querySelector('.sdp-xat-conversa')).toBeTruthy();
  /* Tornar a les converses (entrada «Xats» del rail) deselecciona. */
  fireEvent.click(screen.getByRole('button', { name: 'Xats' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat');
});

test('en mode estret, sense conversa, la dreta no carrega cap document', async () => {
  mocks.amplada = 375;
  mocks.threadId = null;
  render(<XatSection />);
  await waitFor(() => expect(document.querySelector('.app-grid-shell').getAttribute('data-layout')).toBe('estret'));
  const dreta = document.getElementById('app-grid-main');
  expect(dreta.querySelector('[data-testid="document-per-defecte"]')).toBeNull();
  expect(dreta.querySelector('.sdp-xat-buit--avis').textContent).toContain('Selecciona una conversa');
});

/* El document per defecte no roba la pestanya: ni muntat alhora que el Xat
   ni muntat després (tornar d'una conversa, passar d'estret a ample). */
test('amb el document per defecte muntat, la pestanya continua sent la del Xat', () => {
  mocks.totalNoLlegits = 5;
  mocks.threadId = null;
  render(<XatSection />);
  expect(document.getElementById('app-grid-main').querySelector('[data-testid="document-per-defecte"]')).toBeTruthy();
  expect(document.title).toBe('(5) Xat | Sóc de Poble');
  cleanup();

  mocks.threadId = 'a';
  const view = render(<XatSection />);
  expect(document.title).toBe('(5) Xat | Sóc de Poble');
  mocks.seo.mockClear();
  mocks.threadId = null;
  view.rerender(<XatSection />);
  expect(document.getElementById('app-grid-main').querySelector('[data-testid="document-per-defecte"]')).toBeTruthy();
  expect(mocks.seo).toHaveBeenLastCalledWith(expect.objectContaining({ title: '(5) Xat' }));
  expect(document.title).toBe('(5) Xat | Sóc de Poble');
});

/* Ordre innegociable del Mestre (260927 vesprada): el rail calca el menú de
   WhatsApp per a Mac. «Novetats» és, de moment, l'entrada del Control del
   xat i funciona com a commutador; les quatre sense lògica pròpia ho diuen
   amb un avís en lloc de fer com si. */
test('«Novetats» del rail obri el Control del xat i, premuda, el tanca', () => {
  mocks.threadId = null;
  render(<XatSection />);
  const novetats = screen.getByRole('button', { name: 'Novetats' });
  expect(novetats.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(novetats);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/control-xat');
  cleanup();

  render(<XatControlSection />);
  const premuda = screen.getByRole('button', { name: 'Novetats' });
  expect(premuda.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(premuda);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat');
});

test('el rail calca WhatsApp: sis entrades en el seu ordre, capçalera «Menú» i avís a les pendents', () => {
  mocks.threadId = null;
  render(<XatSection />);
  const sidebar = document.getElementById('app-grid-sidebar');
  const noms = within(sidebar).getAllByRole('button').map((b) => b.getAttribute('aria-label'));
  expect(noms).toEqual(['Expandir Menú', 'Xats', 'Novetats', 'Comunitats', 'Telefonades', 'Contingut multimèdia', 'Destacats']);
  expect(screen.queryByRole('button', { name: /Configuració/ })).toBeNull();
  fireEvent.click(within(sidebar).getByRole('button', { name: 'Telefonades' }));
  expect(mocks.showToast).toHaveBeenCalledWith(expect.stringContaining('Encara no disponible'), 'info');
  expect(mocks.navigate).not.toHaveBeenCalled();
});

/* Graella del rail (ordre del Mestre, 260927 nit: «una graella ben
   quadrada»). jsdom no calcula geometria, però sí que conserva els atributs
   del svg: les sis icones del rail fan 24, com la roda de «Menú», en els dos
   estats, i la llista desplegada conserva la classe que ancora la CSS de la
   graella (modules.css, .sdp-xat-rail-llista) i el focus de BotoObriRail. */
test('el rail porta icones de 24 com la roda de Menú, plegat i desplegat', () => {
  mocks.threadId = null;
  render(<XatSection />);
  const sidebar = document.getElementById('app-grid-sidebar');
  const mides = (arrel) => [...arrel.querySelectorAll('svg')].map((s) => `${s.getAttribute('width')}x${s.getAttribute('height')}`);
  expect(mides(sidebar.querySelector('.app-grid-col-header__rail-top'))).toEqual(['24x24']);
  expect(mides(sidebar.querySelector('.sdp-workspace-rail'))).toEqual(Array(6).fill('24x24'));

  fireEvent.click(screen.getByRole('button', { name: 'Expandir Menú' }));
  expect(mides(sidebar.querySelector('.app-grid-col-header__plec'))).toEqual(['24x24']);
  const llista = sidebar.querySelector('.sdp-xat-rail-llista');
  expect(llista.querySelectorAll('li > .sdp-workspace-nav-item')).toHaveLength(6);
  expect(mides(llista)).toEqual(Array(6).fill('24x24'));
  /* L'estat del rail es recorda (setVal): es deixa plegat per a la prova següent. */
  fireEvent.click(screen.getByRole('button', { name: 'Replegar Menú' }));
  expect(screen.getByRole('button', { name: 'Expandir Menú' })).toBeTruthy();
});

test.each([[950, 'ample'], [800, 'mitja']])('el divisor de Converses s’arrossega i recorda l’amplària a %ipx (%s)', async (amplada, layout) => {
  const ampladesAnteriors = getVal('sdp-grid-widths');
  const railAnterior = getVal('sdp-xat-rail');
  setVal('sdp-grid-widths', { left: 420, middle: 280 });
  setVal('sdp-xat-rail', 'plegat');
  mocks.amplada = amplada;
  try {
    const { unmount } = render(<XatSection />);
    const shell = document.querySelector('.app-grid-shell');
    expect(shell.dataset.layout).toBe(layout);
    expect(screen.queryByRole('separator', { name: 'Redimensionar Menú' })).toBeNull();
    const divisor = screen.getByRole('separator', { name: 'Redimensionar Converses' });
    const captura = vi.fn();
    const allibera = vi.fn();
    divisor.setPointerCapture = captura;
    divisor.releasePointerCapture = allibera;
    // Conserva les coordenades i el pointerId també amb jsdom sense PointerEvent.
    const pointer = (tipus, x) => {
      const event = new MouseEvent(tipus, { bubbles: true, button: 0, clientX: x });
      Object.defineProperties(event, { pointerId: { value: 7 }, pointerType: { value: 'mouse' } });
      fireEvent(divisor, event);
    };
    pointer('pointerdown', 280);
    pointer('pointermove', 450);
    pointer('pointerup', 450);
    expect(captura).toHaveBeenCalledWith(7);
    expect(allibera).toHaveBeenCalledWith(7);
    expect(divisor.getAttribute('aria-valuenow')).toBe('450');
    expect(document.querySelector('.app-grid-page').style.getPropertyValue('--app-grid-col-list')).toBe('450px');
    expect(getVal('sdp-grid-widths')).toEqual({ left: 420, middle: 450 });
    expect(shell.dataset.layout).toBe(layout);
    expect(document.getElementById('app-grid-main').getAttribute('aria-hidden')).toBeNull();

    unmount();
    render(<XatSection />);
    expect(screen.getByRole('separator', { name: 'Redimensionar Converses' }).getAttribute('aria-valuenow')).toBe('450');
    expect(document.querySelector('.app-grid-page').style.getPropertyValue('--app-grid-col-list')).toBe('450px');
    // El mateix separador universal també es governa amb el teclat.
    fireEvent.keyDown(screen.getByRole('separator', { name: 'Redimensionar Converses' }), { key: 'ArrowLeft' });
    expect(getVal('sdp-grid-widths').middle).toBe(434);
    // El límit preserva espai per a la conversa: menú plegat en ample,
    // menú superposat en mitjà, sense restar l'amplària desplegada desada.
    fireEvent.keyDown(screen.getByRole('separator', { name: 'Redimensionar Converses' }), { key: 'End' });
    expect(getVal('sdp-grid-widths').middle).toBe(layout === 'ample' ? 520 : 480);
    expect(document.querySelector('.app-grid-shell').dataset.layout).toBe(layout);
  } finally {
    cleanup();
    if (ampladesAnteriors == null) delVal('sdp-grid-widths');
    else setVal('sdp-grid-widths', ampladesAnteriors);
    if (railAnterior == null) delVal('sdp-xat-rail');
    else setVal('sdp-xat-rail', railAnterior);
  }
});

test('en mòbil no hi ha divisor entre panells que s’alternen', () => {
  mocks.amplada = 375;
  render(<XatSection />);
  expect(document.querySelector('.app-grid-shell').dataset.layout).toBe('estret');
  expect(screen.queryByRole('separator', { name: /Redimensionar/ })).toBeNull();
});

test('expandir el menú el manté obert quan l’amplària de Converses força el mode mitjà', () => {
  const ampladesAnteriors = getVal('sdp-grid-widths');
  const railAnterior = getVal('sdp-xat-rail');
  setVal('sdp-grid-widths', { left: 260, middle: 450 });
  setVal('sdp-xat-rail', 'plegat');
  mocks.amplada = 950;
  try {
    render(<XatSection />);
    const shell = document.querySelector('.app-grid-shell');
    expect(shell.dataset.layout).toBe('ample');
    fireEvent.click(screen.getByRole('button', { name: 'Expandir Menú' }));
    expect(shell.dataset.layout).toBe('mitja');
    expect(shell.dataset.panell).toBe('left');
    expect(document.getElementById('app-grid-sidebar').getAttribute('aria-hidden')).toBeNull();
    expect(screen.getByRole('button', { name: 'Xats' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tanca el menú' }));
    expect(document.getElementById('app-grid-sidebar').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('separator', { name: 'Redimensionar Converses' })).toBeTruthy();
  } finally {
    cleanup();
    if (ampladesAnteriors == null) delVal('sdp-grid-widths');
    else setVal('sdp-grid-widths', ampladesAnteriors);
    if (railAnterior == null) delVal('sdp-xat-rail');
    else setVal('sdp-xat-rail', railAnterior);
  }
});

test('el drag parteix de l’amplària visible quan la desada supera l’espai de tauleta', () => {
  const ampladesAnteriors = getVal('sdp-grid-widths');
  setVal('sdp-grid-widths', { left: 260, middle: 520 });
  mocks.amplada = 800;
  try {
    render(<XatSection />);
    expect(document.querySelector('.app-grid-shell').dataset.layout).toBe('mitja');
    const divisor = screen.getByRole('separator', { name: 'Redimensionar Converses' });
    expect(divisor.getAttribute('aria-valuenow')).toBe('480');
    expect(getVal('sdp-grid-widths').middle).toBe(520);
    const pointer = (tipus, x) => {
      const event = new MouseEvent(tipus, { bubbles: true, button: 0, clientX: x });
      Object.defineProperties(event, { pointerId: { value: 7 }, pointerType: { value: 'mouse' } });
      fireEvent(divisor, event);
    };
    pointer('pointerdown', 480);
    pointer('pointermove', 479);
    expect(divisor.getAttribute('aria-valuenow')).toBe('479');
    pointer('pointermove', 470);
    expect(divisor.getAttribute('aria-valuenow')).toBe('470');
    pointer('pointermove', 460);
    pointer('pointerup', 460);
    expect(divisor.getAttribute('aria-valuenow')).toBe('460');
    expect(getVal('sdp-grid-widths').middle).toBe(460);
    fireEvent.keyDown(divisor, { key: 'ArrowLeft' });
    expect(getVal('sdp-grid-widths').middle).toBe(444);
  } finally {
    cleanup();
    if (ampladesAnteriors == null) delVal('sdp-grid-widths');
    else setVal('sdp-grid-widths', ampladesAnteriors);
  }
});

/* D5 (ordre del Mestre, 260927): la columna de la llista calca WhatsApp. De
   dalt a baix, una sola fila de títol amb el «+» redó, la cerca en píndola
   sempre a la vista (amb la icona de filtre a la mateixa línia, T12) i la
   llista; cap fila de lupa ni de píndoles de filtre. */
test('la llista calca WhatsApp: títol amb «+», cerca en píndola amb filtre i llista', async () => {
  mocks.threadId = null;
  render(<XatSection />);
  const columna = document.getElementById('app-grid-list').querySelector('.sdp-workspace-column');
  expect([...columna.children].map((n) => n.classList[0])).toEqual([
    'app-grid-col-header', 'sdp-xat-cerca', 'sdp-workspace-column__body'
  ]);
  expect(columna.querySelector('.sdp-xat-cerca .sdp-xat-filtre__boto')).toBeTruthy();
  const nova = screen.getByRole('button', { name: 'Nova conversa' });
  expect(nova.classList.contains('sdp-xat-nova')).toBe(true);
  expect(columna.firstElementChild.contains(nova)).toBe(true);

  const cerca = screen.getByRole('searchbox', { name: 'Cerca converses' });
  fireEvent.change(cerca, { target: { value: 'adeu' } });
  expect(screen.queryByText('Hola')).toBeNull();
  expect(screen.getByText('Adeu')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Tanca la cerca' }));
  expect(cerca.value).toBe('');
  expect(screen.getByText('Hola')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Tanca la cerca' })).toBeNull();
  /* La creu s'ha desmuntat: el focus torna al camp, no cau a <body>. */
  expect(document.activeElement).toBe(cerca);

  /* El «+» obri el padró com abans: la cerca passa a buscar persones, els
     filtres se'n van i el botó es torna la creu de tornar. */
  fireEvent.click(nova);
  await waitFor(() => expect(mocks.members).toHaveBeenCalled());
  expect(screen.getByRole('searchbox', { name: 'Cerca una persona' })).toBeTruthy();
  expect(columna.querySelector('.sdp-xat-filtres')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Torna a les converses' }));
  expect(screen.getByRole('button', { name: 'Nova conversa' })).toBeTruthy();
});

/* En estret i en mitjà la closca del Xat no pinta pestanyes (la regla viu a
   modules.css; jsdom no carrega CSS): la fila de títol obri el rail, el rail
   va sempre desplegat amb etiquetes (mai el de 56px d'icones, que quedava
   perdut dins del panell) i la seua creu el tanca. */
test('en mode estret la fila de títol obri el rail desplegat i la creu del rail el tanca', async () => {
  mocks.amplada = 375;
  mocks.threadId = null;
  render(<XatSection />);
  const closca = document.querySelector('.app-grid-shell');
  await waitFor(() => expect(closca.getAttribute('data-panell')).toBe('middle'));
  const rail = document.getElementById('app-grid-list').querySelector('.sdp-xat-obri-rail');
  /* El botó es diu com el panell que obri. */
  expect(rail.getAttribute('aria-label')).toBe('Menú');
  expect(rail.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(rail);
  expect(closca.getAttribute('data-panell')).toBe('left');
  const sidebar = document.getElementById('app-grid-sidebar');
  expect(sidebar.getAttribute('data-obert')).toBe('true');
  expect(sidebar.querySelector('.app-grid-col-header--collapsed')).toBeNull();
  expect(sidebar.querySelector('.sdp-xat-rail-llista')).toBeTruthy();
  /* La llista passa a `inert`: el focus entra a la primera entrada del rail. */
  expect(document.activeElement).toBe(within(sidebar).getByRole('button', { name: 'Xats' }));

  /* Tota la pastilla del rail el tanca: també el text i amb retorn de focus. */
  const tanca = within(sidebar).getByRole('button', { name: 'Tanca el menú' });
  expect(tanca.querySelector('button')).toBeNull();
  fireEvent.click(within(tanca).getByText('Menú'));
  expect(closca.getAttribute('data-panell')).toBe('middle');
  expect(document.activeElement).toBe(rail);
});

test('en mode estret, triar una entrada del rail el tanca: «Xats» torna la llista i «Novetats» obri el Control', async () => {
  mocks.amplada = 375;
  mocks.threadId = null;
  render(<XatSection />);
  const closca = document.querySelector('.app-grid-shell');
  await waitFor(() => expect(closca.getAttribute('data-panell')).toBe('middle'));
  const rail = document.querySelector('.sdp-xat-obri-rail');
  const sidebar = document.getElementById('app-grid-sidebar');
  fireEvent.click(rail);
  fireEvent.click(within(sidebar).getByRole('button', { name: 'Xats' }));
  expect(closca.getAttribute('data-panell')).toBe('middle');
  /* Ja sent a /xat, «Xats» no afig cap entrada a l'historial. */
  expect(mocks.navigate).not.toHaveBeenCalled();

  fireEvent.click(rail);
  expect(closca.getAttribute('data-panell')).toBe('left');
  fireEvent.click(within(sidebar).getByRole('button', { name: 'Novetats' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/control-xat');
  expect(closca.getAttribute('data-panell')).toBe('middle');
});

/* El Control del xat seguix el mateix calc: fila de títol amb el botó del
   rail, cap fila 2 buida fora d'ample, i l'opció oberta amb la fletxa que
   torna a la llista d'opcions. */
test('en mode estret el Control del xat porta el botó del rail, cap fila buida i la fletxa d\'arrere a l\'opció', async () => {
  mocks.amplada = 375;
  render(<XatControlSection />);
  const closca = document.querySelector('.app-grid-shell');
  await waitFor(() => expect(closca.getAttribute('data-panell')).toBe('middle'));
  const llista = document.getElementById('app-grid-list');
  expect(llista.querySelector('.sdp-xat-obri-rail')).toBeTruthy();
  expect(llista.querySelector('.app-grid-col-header--dark-intens')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Torna a les opcions' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: /Missatges temporals/ }));
  const dreta = document.getElementById('app-grid-main');
  expect(closca.getAttribute('data-panell')).toBe('');
  expect(dreta.getAttribute('data-obert')).toBe('true');
  expect(dreta.querySelector('.sdp-xat-capcalera--opcio').textContent).toContain('Missatges temporals');
  fireEvent.click(screen.getByRole('button', { name: 'Torna a les opcions' }));
  expect(closca.getAttribute('data-panell')).toBe('middle');
  expect(dreta.querySelector('.sdp-xat-capcalera--opcio')).toBeNull();
});

test('en ample el Control del xat conserva la fila 2 i el rail plegat d\'icones, sense controls de mòbil', () => {
  render(<XatControlSection />);
  const llista = document.getElementById('app-grid-list');
  expect(llista.querySelector('.app-grid-col-header--dark-intens')).toBeTruthy();
  expect(llista.querySelector('.sdp-xat-obri-rail')).toBeNull();
  const sidebar = document.getElementById('app-grid-sidebar');
  expect(sidebar.querySelector('.app-grid-col-header--collapsed')).toBeTruthy();
  expect(sidebar.querySelector('.sdp-xat-rail-llista')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Tanca el menú' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Expandir Menú' })).toBeTruthy();
});

/* Mòbil: amb una conversa oberta, la pestanya «Converses» torna a la llista
   (i s'amaga). Triar-hi la mateixa conversa, o una altra, la torna a portar
   a pantalla encara que `threadId` no passe de buit a ple. */
test('en mode estret, des de la llista es torna a la conversa oberta', async () => {
  mocks.amplada = 375;
  mocks.threadId = 'a';
  render(<XatSection />);
  const closca = document.querySelector('.app-grid-shell');
  const dreta = document.getElementById('app-grid-main');
  await waitFor(() => expect(dreta.getAttribute('data-obert')).toBe('true'));
  fireEvent.click(document.querySelector('.app-grid-header-btn[aria-controls="app-grid-list"]'));
  expect(closca.getAttribute('data-panell')).toBe('middle');
  expect(dreta.getAttribute('data-obert')).toBe('false');

  fireEvent.click(screen.getByText('Hola').closest('button'));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/a');
  expect(closca.getAttribute('data-panell')).toBe('');
  expect(dreta.getAttribute('data-obert')).toBe('true');
});

/* Tauleta (mitjà): la mateixa fila de títol que en mòbil; el botó obri el
   rail desplegat, la creu del rail el tanca, i el focus torna al botó. */
test('en mode mitjà la fila de títol obri el rail desplegat, la creu el tanca i el focus torna al botó', async () => {
  mocks.amplada = 820;
  mocks.threadId = null;
  render(<XatSection />);
  const closca = document.querySelector('.app-grid-shell');
  await waitFor(() => expect(closca.getAttribute('data-layout')).toBe('mitja'));
  const rail = document.getElementById('app-grid-list').querySelector('.sdp-xat-obri-rail');
  fireEvent.click(rail);
  expect(closca.getAttribute('data-panell')).toBe('left');
  expect(rail.getAttribute('aria-expanded')).toBe('true');
  const sidebar = document.getElementById('app-grid-sidebar');
  expect(sidebar.querySelector('.app-grid-col-header--collapsed')).toBeNull();
  expect(sidebar.contains(document.activeElement)).toBe(true);

  fireEvent.click(within(sidebar).getByRole('button', { name: 'Tanca el menú' }));
  expect(closca.getAttribute('data-panell')).toBe('');
  expect(document.activeElement).toBe(rail);

  fireEvent.click(rail);
  fireEvent.click(rail);
  expect(closca.getAttribute('data-panell')).toBe('');
});

/* Lògica d'Usuari (T3, T4): l'altra part de la conversa té perfil i, si és la
   IAIA, es diu. Als grups, el nom de l'autor també enllaça al seu perfil. */
test('la capçalera enllaça al perfil de l’altra part i diu quan és la IAIA', () => {
  mocks.threads = [{
    id: 'ia', tipus: 'iaia', name: 'IAIA MarIA', esIA: true, ultimText: 'Hola', ultimAl: fa(0), noLlegits: 0,
    altresNoms: ['IAIA MarIA'], altres: [{ id: 'iaia-1', nom: 'IAIA MarIA', tipus: 'ia', avatarUrl: null }]
  }];
  mocks.messages = [{ id: '7', seq: 7, text: 'Ara estic en proves', sender: 'other', author: 'IAIA MarIA', usuariId: 'iaia-1', is_ai: true, creatAl: fa(0) }];
  mocks.threadId = 'ia';
  render(<XatSection />);
  const capcalera = document.querySelector('.sdp-xat-capcalera');
  const enllac = within(capcalera).getByRole('link', { name: 'Obri el perfil de IAIA MarIA' });
  expect(enllac.getAttribute('href')).toBe('/perfil/iaia-1');
  expect(within(capcalera).getByText('Intel·ligència artificial en proves')).toBeTruthy();
  /* La bombolla de la IAIA es signa com a IA i també enllaça al perfil. */
  const autor = within(document.querySelector('.sdp-xat-missatges')).getByRole('link', { name: 'Obri el perfil de IAIA MarIA' });
  expect(autor.textContent).toBe('IAIA MarIA · IA');
});

test('als grups, el nom de l’autor enllaça al seu perfil; a les converses directes no s’escriu', () => {
  render(<XatSection />);
  expect(document.querySelector('.sdp-xat-bombolla__autor')).toBeNull();
  cleanup();
  mocks.threadId = 'b';
  render(<XatSection />);
  const autor = screen.getByRole('link', { name: 'Obri el perfil de Veí' });
  expect(autor.getAttribute('href')).toBe('/gent/x');
  expect(autor.classList.contains('sdp-xat-bombolla__autor')).toBe(true);
});

test('el canal d’una entitat diu en nom de qui es parla i la capçalera enllaça al client', () => {
  mocks.threads = [{
    id: 'canal', tipus: 'entitat', name: 'Toni Pastor', comEntitat: true, entitatId: 'socdepoble', entitatNom: 'Sóc de Poble',
    ultimText: 'Queden samarretes?', ultimAl: fa(0), noLlegits: 1, altresNoms: ['Toni Pastor'],
    altres: [{ id: 'toni', nom: 'Toni Pastor', tipus: 'persona', avatarUrl: null }]
  }];
  mocks.threadId = 'canal';
  render(<XatSection />);
  const capcalera = document.querySelector('.sdp-xat-capcalera');
  expect(within(capcalera).getByText('Canal de Sóc de Poble')).toBeTruthy();
  expect(within(capcalera).getByRole('link', { name: 'Obri el perfil de Toni Pastor' }).getAttribute('href')).toBe('/gent/toni');
});

test('?amb=<id> obri o crea la conversa amb eixa identitat i hi navega', async () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ amb: 'socdepoble' });
  render(<XatSection />);
  await waitFor(() => expect(mocks.createThread).toHaveBeenCalledWith('socdepoble', null));
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/xat/thread-new', { replace: true }));
  expect(mocks.createThread).toHaveBeenCalledTimes(1);
});

test('en ample la fila de títol no porta el botó del rail', () => {
  mocks.threadId = null;
  render(<XatSection />);
  expect(document.querySelector('.sdp-xat-obri-rail')).toBeNull();
});

test('en ample el text de Menú replega tot el rail i conserva el focus entre els controls', () => {
  render(<XatSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Expandir Menú' }));
  const replega = screen.getByRole('button', { name: 'Replegar Menú' });
  expect(document.activeElement).toBe(replega);
  expect(replega.getAttribute('aria-expanded')).toBe('true');
  expect(replega.querySelector('button')).toBeNull();
  fireEvent.click(within(replega).getByText('Menú'));
  const expandir = screen.getByRole('button', { name: 'Expandir Menú' });
  expect(expandir.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(expandir);
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

/* El que toques és el que s'obri (ordre del Mestre, 260927): la capçalera de
   la columna central del Control porta el mateix dibuix que l'entrada
   «Novetats» del rail que hi ha dut, i no la roda de configuració. */
test('la capçalera del Control del xat porta la mateixa icona que «Novetats» al rail', () => {
  mocks.threadId = null;
  render(<XatControlSection />);
  const rail = document.getElementById('app-grid-sidebar');
  const novetats = within(rail).getByRole('button', { name: 'Novetats' }).querySelector('svg');
  const columna = screen.getByRole('complementary', { name: 'Control del xat' });
  const capcalera = columna.querySelector('.app-grid-col-header__plec svg');
  expect(capcalera).toBeTruthy();
  expect(capcalera.getAttribute('class')).toBe(novetats.getAttribute('class'));
  expect(capcalera.getAttribute('class')).toMatch(/circle-dashed/);
  expect(columna.querySelector('.app-grid-col-header .lucide-settings')).toBeNull();
});
