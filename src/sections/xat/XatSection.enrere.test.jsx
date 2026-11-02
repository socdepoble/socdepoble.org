/* P0-24b (T2b, prompt 261102_1532) · La selecció de xats (modeSeleccio) és a
   la pila de l'Arrere d'Android (config/pilaEnrere.js) amb el MATEIX camí que
   el seu Escape (ix de la selecció i buida les marques). Amb una capa damunt
   (el calaix d'emoticones del compositor de la conversa, ja apuntat), el
   primer Arrere tanca la de dalt i la selecció continua; el segon n'ix.
   Les ombres són les de XatSection.test.jsx, retallades al que ací es munta.
   Patró: PedraSeca/organismes/Dialeg.enrere.test.jsx. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { buidaEsborranys } from './esborranys.js';
import { _reiniciaPilaEnrere, capesEnrereObertes, tancaCapaSuperior } from '../../config/pilaEnrere.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), threadId: 'a', params: new URLSearchParams(), members: vi.fn(), createThread: vi.fn(), openThread: vi.fn(),
  send: vi.fn(), reintenta: vi.fn(), descarta: vi.fn(), carregaMes: vi.fn(), hiHaMes: vi.fn(), marcaVist: vi.fn(),
  marcaLlegides: vi.fn(), obriFilDePagina: vi.fn(), showToast: vi.fn(), threads: [], messages: [], amplada: 1280
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
/* El document per defecte de la columna dreta i la pàgina viva d'una
   comunitat: marques, com a XatSection.test.jsx. */
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
    obriFilDePagina: mocks.obriFilDePagina, joId: 'jo', joNom: 'Javi', senseSessio: false
  })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
/* El catàleg de veres pesa 292 kB: ací, una família sintètica. */
vi.mock('../notes/canalEmojis.js', () => ({
  carregaCatalegEmojis: async () => ({ GRUPS_EMOJIS: [{ id: 'cares-emocions', nom: 'Cares', emojis: [['1F600', '😀', 'grinning face']] }] })
}));

/* AppGridShell mesura el contenidor: 1280 és escriptori (llista i conversa). */
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return mocks.amplada; } });

const ARA = Date.now();
const fa = (dies) => new Date(ARA - dies * 86400000).toISOString();
const filsDeMostra = () => [
  { id: 'a', title: 'Conversa', name: 'Conversa', tipus: 'directe', ultimText: 'Hola', ultimAl: fa(0), noLlegits: 3, altresNoms: ['Veí'] },
  { id: 'b', title: 'Altra', name: 'Altra', tipus: 'grup', ultimText: 'Adeu', ultimAl: fa(1), noLlegits: 0, preferit: true, altresNoms: ['Pep', 'Maria'] }
];
const missatgesDeMostra = () => [
  { id: '1', seq: 1, text: 'Primer', sender: 'me', creatAl: fa(2), estatEnviament: 'llegit' },
  { id: '2', seq: 2, text: 'Segon', sender: 'other', author: 'Veí', usuariId: 'x', creatAl: fa(0), estatEnviament: 'enviat' }
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.threadId = 'a';
  mocks.params = new URLSearchParams();
  mocks.threads = filsDeMostra();
  mocks.messages = missatgesDeMostra();
  mocks.members.mockResolvedValue([]);
  mocks.createThread.mockResolvedValue('thread-new');
  mocks.send.mockResolvedValue([]);
  mocks.hiHaMes.mockReturnValue(false);
  mocks.marcaLlegides.mockReturnValue(0);
  mocks.obriFilDePagina.mockResolvedValue(null);
  buidaEsborranys();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); _reiniciaPilaEnrere(); });

/* Cada Arrere, un segon més tard: fora de la finestra d'absorció. */
let rellotge = 10_000;
const arrere = () => { let r; act(() => { rellotge += 1000; r = tancaCapaSuperior(rellotge); }); return r; };

const botoDeFila = (clau) => screen.getByRole('list', { name: 'Converses' }).querySelector(`li[data-clau="${clau}"] > button`);
/* La pulsació llarga pel teclat (Maj+F10): la fila naix triada (XatSection.test.jsx).
   Una sola entrada per prova: la finestra de duplicats de pulsacioLlarga.js (400 ms). */
function seleccionaAmbElTeclat(clau) {
  const fila = botoDeFila(clau);
  fila.focus();
  fireEvent.keyDown(fila, { key: 'F10', shiftKey: true });
  return fila;
}
const caselles = () => within(screen.getByRole('list', { name: 'Converses' })).queryAllByRole('checkbox');
const calaix = () => screen.queryByRole('dialog', { name: 'Emoticones' });

test('la selecció de xats és a la pila; l’Arrere fa el camí de l’Escape (ix i buida les marques) i el focus queda a la fila; fora, cap capa', () => {
  mocks.threadId = null;
  render(<XatSection />);
  expect(capesEnrereObertes()).toBe(0);
  seleccionaAmbElTeclat('b');
  expect(screen.getByText('1 seleccionada')).toBeTruthy();
  expect(caselles()).toHaveLength(2);
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(screen.queryByText('1 seleccionada')).toBeNull();
  expect(caselles()).toHaveLength(0);
  expect(screen.queryByRole('button', { name: 'Eixir de la selecció de xats' })).toBeNull();
  expect(document.activeElement).toBe(botoDeFila('b'));
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
});

test('dues capes: el calaix d’emoticones de la conversa damunt de la selecció; el primer Arrere tanca el calaix i la selecció continua, el segon n’ix', async () => {
  render(<XatSection />);
  seleccionaAmbElTeclat('a');
  expect(screen.getByText('1 seleccionada')).toBeTruthy();
  expect(capesEnrereObertes()).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: 'Emoticones' }), { detail: 1 });
  await screen.findByRole('tab', { name: 'Cares' });
  expect(calaix()).toBeTruthy();
  expect(capesEnrereObertes()).toBe(2);
  expect(arrere()).toBe(true);
  expect(calaix()).toBeNull();
  expect(screen.getByText('1 seleccionada')).toBeTruthy();
  expect(botoDeFila('a').getAttribute('aria-checked')).toBe('true');
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(caselles()).toHaveLength(0);
  expect(screen.queryByText('1 seleccionada')).toBeNull();
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
});

/* Corrector T2b (ARB-T2B-01) · La capa seguix la barra visible. Amb la fitxa
   d'una comunitat damunt (?comunitat=, un enllaç o un avís push enmig de la
   tria), la selecció continua viva però la barra no es pinta: l'Arrere no s'ha
   de gastar en una capa que ningú veu. En tornar a la llista, barra i capa
   tornen i l'Arrere fa el camí de l'Escape. */
test('amb la fitxa d’una comunitat damunt la selecció no és a la pila (l’Arrere no es consumix) i en tornar-ne hi torna', () => {
  mocks.threadId = null;
  const view = render(<XatSection />);
  seleccionaAmbElTeclat('b');
  expect(screen.getByText('1 seleccionada')).toBeTruthy();
  expect(capesEnrereObertes()).toBe(1);
  mocks.params = new URLSearchParams({ comunitat: 'c-1' });
  view.rerender(<XatSection />);
  expect(screen.getByText('Esta comunitat no és a la teua llista de converses.')).toBeTruthy();
  expect(screen.queryByText('1 seleccionada')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Eixir de la selecció de xats' })).toBeNull();
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
  mocks.params = new URLSearchParams();
  view.rerender(<XatSection />);
  expect(screen.getByText('1 seleccionada')).toBeTruthy();
  expect(botoDeFila('b').getAttribute('aria-checked')).toBe('true');
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(screen.queryByText('1 seleccionada')).toBeNull();
  expect(caselles()).toHaveLength(0);
  expect(capesEnrereObertes()).toBe(0);
});
