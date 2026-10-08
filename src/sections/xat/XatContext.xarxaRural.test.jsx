/* Auditoria 261008 (261008_1355_auditoria_claude.md) · El xat amb xarxa rural
   intermitent, al proveïdor real amb el port simulat:
     · B04 · un sondeig fallit ja no buida una llista que s'havia carregat bé
       (ni tanca la conversa oberta): l'avís no bloqueja i el tic següent
       arriba als 2, 5, 10 o 30 s, amb sostre de 60 s;
     · B09 · cada fallada seguida de l'historial cap arrere porta una espera
       (esperaAntics); a la tercera, o amb un error no reintentable, només el
       botó o la xarxa que torna ('online'); el primer èxit la reinicia.
   Calcada de la preparació de XatContext.test.jsx. */
import { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A', pathname: '/xat', showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: undefined }) }));
/* La resta de dependències del proveïdor, com a XatContext.test.jsx. */
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: mock.pathname }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
const missatge = (text, id = 'm-A', extra = {}) => ({ id, filId: 'fil-A', usuariId: 'X', text, seq: 1, creatAl: '2026-10-08T10:00:00Z', ...extra });
const fil = (extra = {}) => ({ id: 'fil-A', titol: 'A', altresNoms: [], ultimSeq: 1, llegitFinsSeq: 1, llegitPelsAltresFinsSeq: 0, noLlegits: 0, ultimAutorId: 'X', ultimAl: '2026-10-08T10:00:00Z', ...extra });
const xarxa = (text = 'Load failed') => Object.assign(new Error(text), { code: 'XARXA', retriable: true });
const noReintentable = (text = 'SDP-XAT-003: no eres membre d’aquest poble.') => Object.assign(new Error(text), { code: 'SDP-XAT-003', retriable: false });

let value;
function Sonda() {
  const actual = useXat();
  useLayoutEffect(() => { value = actual; });
  value = actual;
  return null;
}
const arbre = () => <StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>;
const pas = async (ms) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const llistes = () => mock.loadFils.mock.calls.length;

beforeEach(() => {
  vi.clearAllMocks();
  mock.session = { currentUser: { id: 'A' }, generacio: 1 };
  mock.actorKey = 'persona::A';
  mock.loadFils.mockResolvedValue([fil()]);
  mock.loadMissatges.mockResolvedValue([missatge('Bon dia')]);
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub-A', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

/* La llista carregada bé, el fil obert i el sondeig tornat a armar amb els
   temporitzadors de la prova (obrir un fil torna a crear l'efecte). */
async function ambLlistaCarregada() {
  const vista = render(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
  vi.useFakeTimers();
  act(() => value.obriFil('fil-A'));
  await pas(0);
  expect(value.chatMessages.map((m) => m.text)).toEqual(['Bon dia']);
  return vista;
}

describe('B04 · un sondeig fallit no buida la llista ni tanca la conversa', () => {
  it('després d’una càrrega bona, un loadFils rebutjat conserva la llista i el fil obert, avisa sense bloquejar i torna a provar als 2 s', async () => {
    await ambLlistaCarregada();
    mock.loadFils.mockRejectedValueOnce(xarxa());
    const abans = llistes();
    await pas(25000);
    expect(llistes()).toBe(abans + 1);
    expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
    expect(value.filActiu).toBe('fil-A');
    expect(value.chatMessages.map((m) => m.text)).toEqual(['Bon dia']);
    expect(value.status).toBe('ready');
    /* L'avís que tapa la llista no es posa: només el no bloquejant. */
    expect(value.avis).toBeNull();
    expect(value.llistaFresca).toBe(false);
    expect(value.avisLlista).toBe('Load failed');
    /* No als 250 s: als 2 s. */
    await pas(1999);
    expect(llistes()).toBe(abans + 1);
    await pas(1);
    expect(llistes()).toBe(abans + 2);
    expect(value.llistaFresca).toBe(true);
    expect(value.avisLlista).toBeNull();
    expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
  });

  it('les fallades reintentables seguides tornen a provar als 2, 5, 10 i 30 s i després cada 60 s; un èxit torna als 25 s', async () => {
    await ambLlistaCarregada();
    mock.loadFils.mockRejectedValue(xarxa());
    const abans = llistes();
    await pas(25000);
    expect(llistes()).toBe(abans + 1);
    let esperades = abans + 1;
    for (const espera of [2000, 5000, 10000, 30000, 60000, 60000]) {
      await pas(espera - 1);
      expect(llistes()).toBe(esperades);
      await pas(1);
      esperades += 1;
      expect(llistes()).toBe(esperades);
      expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
      expect(value.llistaFresca).toBe(false);
    }
    mock.loadFils.mockResolvedValue([fil()]);
    await pas(60000);
    esperades += 1;
    expect(llistes()).toBe(esperades);
    expect(value.llistaFresca).toBe(true);
    /* Amb èxit, la cadència de sempre: el comptador s'ha reiniciat. */
    await pas(24999);
    expect(llistes()).toBe(esperades);
    await pas(1);
    expect(llistes()).toBe(esperades + 1);
  });

  it('un error no reintentable amb la llista carregada també la conserva, però el tic següent s’espaia a 250 s', async () => {
    await ambLlistaCarregada();
    mock.loadFils.mockRejectedValueOnce(noReintentable());
    const abans = llistes();
    await pas(25000);
    expect(llistes()).toBe(abans + 1);
    expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
    expect(value.avis).toBeNull();
    expect(value.avisLlista).toBe('SDP-XAT-003: no eres membre d’aquest poble.');
    await pas(249999);
    expect(llistes()).toBe(abans + 1);
    await pas(1);
    expect(llistes()).toBe(abans + 2);
  });

  it('la primera càrrega fallida continua buidant la llista amb l’avís que la tapa, i torna a provar als 2 s, no als 25 s', async () => {
    /* Revisió 261008 · Amb els temporitzadors de la prova des del muntatge:
       el sondeig s'arma abans que la càrrega inicial falle. */
    vi.useFakeTimers();
    mock.loadFils.mockRejectedValue(xarxa());
    render(arbre());
    await pas(0);
    expect(value.status).toBe('ready');
    expect(value.chatThreads).toEqual([]);
    expect(value.avis).toBe('Load failed');
    expect(value.avisLlista).toBeNull();
    expect(value.llistaFresca).toBe(false);
    const abans = llistes();
    mock.loadFils.mockResolvedValue([fil()]);
    await pas(1999);
    expect(llistes()).toBe(abans);
    await pas(1);
    expect(llistes()).toBe(abans + 1);
    expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
    expect(value.avis).toBeNull();
    expect(value.llistaFresca).toBe(true);
  });

  it('obrir una conversa enmig de l’espera curta no la torna als 25 s', async () => {
    await ambLlistaCarregada();
    mock.loadFils.mockRejectedValueOnce(xarxa());
    const abans = llistes();
    await pas(25000);
    expect(llistes()).toBe(abans + 1);
    await pas(1000);
    /* Canviar el fil obert torna a crear l'efecte del sondeig. */
    act(() => value.obriFil(null));
    await pas(0);
    await pas(1999);
    expect(llistes()).toBe(abans + 1);
    await pas(1);
    expect(llistes()).toBe(abans + 2);
  });

  it('una fallada d’una altra crida (recarrega) també passa a l’espera curta', async () => {
    await ambLlistaCarregada();
    const abans = llistes();
    await pas(10000);
    mock.loadFils.mockRejectedValueOnce(xarxa());
    await act(async () => { await value.recarrega(); });
    expect(llistes()).toBe(abans + 1);
    expect(value.avisLlista).toBe('Load failed');
    /* Sense la reprogramació, el tic arribava als 25 s del muntatge (15 s més tard). */
    await pas(1999);
    expect(llistes()).toBe(abans + 1);
    await pas(1);
    expect(llistes()).toBe(abans + 2);
    expect(value.llistaFresca).toBe(true);
  });

  it('l’esquema sense aplicar buida la llista encara que s’haguera carregat', async () => {
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
    mock.loadFils.mockRejectedValueOnce(Object.assign(new Error('L’esquema del xat no està aplicat.'), { code: 'ESQUEMA', retriable: false }));
    await act(async () => { await value.recarrega(); });
    expect(value.chatThreads).toEqual([]);
    expect(value.avis).toBe('L’esquema del xat no està aplicat.');
    expect(value.avisLlista).toBeNull();
    expect(value.llistaFresca).toBe(false);
  });
});

describe('B09 · l’historial cap arrere no es demana en bucle quan falla', () => {
  /* Només l'historial cap arrere (abansDeSeq) falla; la resta de lectures, bé. */
  function anticsFallen(error) {
    mock.loadMissatges.mockImplementation((_, opcions) => (opcions?.abansDeSeq != null
      ? Promise.reject(error)
      : Promise.resolve([missatge('Bon dia')])));
  }

  it('cada fallada seguida porta una espera de 2 i 5 s; a la tercera, només manual; el primer èxit la lleva i reinicia el comptador', async () => {
    await ambLlistaCarregada();
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    const ara = Date.now();
    anticsFallen(xarxa());
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toEqual({ fallades: 1, manual: false, fins: ara + 2000 });
    expect(value.carregantAntics('fil-A')).toBe(false);
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toEqual({ fallades: 2, manual: false, fins: ara + 5000 });
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toEqual({ fallades: 3, manual: true, fins: null });
    /* El botó continua podent provar-ho; si torna a fallar, continua manual. */
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toEqual({ fallades: 4, manual: true, fins: null });
    mock.loadMissatges.mockResolvedValue([]);
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toBeNull();
    /* El comptador torna a començar. */
    anticsFallen(xarxa());
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toMatchObject({ fallades: 1, manual: false });
  });

  it('un error no reintentable passa a manual a la primera fallada', async () => {
    await ambLlistaCarregada();
    anticsFallen(noReintentable('SDP-XAT-006: no eres membre actiu del fil.'));
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toEqual({ fallades: 1, manual: true, fins: null });
  });

  it('la xarxa que torna (online) lleva l’espera però conserva el comptador', async () => {
    await ambLlistaCarregada();
    anticsFallen(xarxa());
    for (let i = 0; i < 3; i += 1) await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toMatchObject({ fallades: 3, manual: true });
    await act(async () => { window.dispatchEvent(new Event('online')); });
    expect(value.esperaAntics('fil-A')).toBeNull();
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toEqual({ fallades: 4, manual: true, fins: null });
  });

  it('un altre àmbit (una altra persona) no hereta ni l’espera ni el comptador', async () => {
    const vista = await ambLlistaCarregada();
    anticsFallen(xarxa());
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toMatchObject({ fallades: 2, manual: false });
    const vell = value;
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    await pas(0);
    expect(value.status).toBe('ready');
    expect(vell.esperaAntics('fil-A')).toBeNull();
    expect(value.esperaAntics('fil-A')).toBeNull();
    act(() => value.obriFil('fil-A'));
    await pas(0);
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toMatchObject({ fallades: 1, manual: false });
  });
});
