/* Gauntlet 261025_0545 · Verificació creuada del xat (D2 i la part de dades
   de D5), al proveïdor real amb el port simulat:
     · D2 · `sendChatMessage(fil, text, { esperaLaXarxa: false })`: qui envia
       per programa (Connectar) rep una resposta acotada sense xarxa, com
       abans de XC-03; i si el fil ja té una bombolla que espera la xarxa, no
       s'hi queda ni passa davant: la seua bombolla queda en error, a mà;
     · D5 · `tipusAvisFil(filId)` ('lectura' | 'marca' | null) i
       `llegintFil(filId)` (vola una lectura del fil que la vista ha de saber),
       amb `avisFil(filId)` intacte (el text cru).
   L'arnés és el de XatContext.cicle261025.test.jsx. */
import { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A', pathname: '/xat', showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn(), publicaAdjuntXat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: undefined }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: mock.pathname }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
const msg = (seq, usuariId = 'X', extra = {}) => ({ id: `m-${seq}`, filId: 'fil-A', usuariId, text: `t${seq}`, seq, creatAl: '2026-10-25T05:00:00Z', ...extra });
const fil = (extra = {}) => ({ id: 'fil-A', titol: 'A', altresNoms: [], ultimSeq: 1, llegitFinsSeq: 1, llegitPelsAltresFinsSeq: 0, noLlegits: 0, ultimAutorId: 'X', ultimAl: '2026-10-25T05:00:00Z', ...extra });
const xarxa = () => Object.assign(new Error('Failed to fetch'), { code: 'XARXA', retriable: true });
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

let value;
let renders = 0;
function Sonda() {
  const actual = useXat();
  renders += 1;
  useLayoutEffect(() => { value = actual; });
  value = actual;
  return null;
}
const arbre = (config = CONFIG) => <StrictMode><XatProvider config={config}><Sonda /></XatProvider></StrictMode>;
const pas = async (ms) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const buidaCua = () => act(async () => { await new Promise((resol) => setTimeout(resol, 0)); });
const propis = (filId = 'fil-A') => value.getThreadMessages(filId).filter((m) => m.sender === 'me').map((m) => `${m.text}:${m.seq ?? m.estatEnviament}`);
const textos = () => mock.enviaMissatge.mock.calls.map(([, cos]) => cos.text);

let espiaLinia = null;
const senseXarxa = () => { espiaLinia = vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false); return espiaLinia; };
beforeEach(() => {
  vi.clearAllMocks();
  renders = 0;
  mock.session = { currentUser: { id: 'A' }, generacio: 1 };
  mock.actorKey = 'persona::A';
  /* Amb un no llegit: marcaVist('fil-A', 1) arriba a l'agrupador. */
  mock.loadFils.mockImplementation(async () => [fil({ llegitFinsSeq: 0, noLlegits: 1 })]);
  mock.loadMissatges.mockResolvedValue([msg(1)]);
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.useRealTimers(); espiaLinia?.mockRestore(); espiaLinia = null; });

/* Amb els temporitzadors de la prova: el fil obert i llegit. */
async function obert() {
  const vista = render(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  vi.useFakeTimers();
  act(() => value.obriFil('fil-A'));
  await pas(0);
  expect(value.filCarregat('fil-A')).toBe(true);
  return vista;
}
let seguentSeq;
const confirmaTot = (desDe = 2) => {
  seguentSeq = desDe;
  mock.enviaMissatge.mockReset();
  mock.enviaMissatge.mockImplementation(async (_, cos) => ({ ...msg(seguentSeq++, 'A'), id: cos.id, text: cos.text }));
};

describe('D2 · { esperaLaXarxa: false }: resposta acotada per a qui envia per programa', () => {
  it('sense xarxa, els reintents de sempre (4 intents) i error: la promesa acaba amb []', async () => {
    await obert();
    senseXarxa();
    mock.enviaMissatge.mockRejectedValue(xarxa());
    let resultat = null;
    act(() => { value.sendChatMessage({ id: 'fil-A' }, 'programa', { esperaLaXarxa: false }).then((r) => { resultat = r; }); });
    await pas(15_000);
    expect(resultat).toEqual([]);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(4);
    expect(value.chatMessages.at(-1)).toMatchObject({ text: 'programa', estatEnviament: 'error', error: 'Failed to fetch' });
  });

  it('darrere d’un enviament lent (amb xarxa) espera el seu torn i ix després: l’ordre del fil es conserva', async () => {
    await obert();
    const lent = deferred();
    mock.enviaMissatge.mockReturnValueOnce(lent.promise);
    act(() => { value.sendChatMessage({ id: 'fil-A' }, 'primer'); });
    let resultat = null;
    act(() => { value.sendChatMessage({ id: 'fil-A' }, 'programa', { esperaLaXarxa: false }).then((r) => { resultat = r; }); });
    await pas(0);
    expect(textos()).toEqual(['primer']);
    expect(resultat).toBeNull();
    confirmaTot(3);
    await act(async () => { lent.resolve({ ...msg(2, 'A'), id: value.chatMessages.at(-2).id, text: 'primer' }); });
    await pas(0);
    expect(textos()).toEqual(['programa']);
    expect(resultat).toHaveLength(1);
    expect(propis()).toEqual(['primer:2', 'programa:3']);
  });

  it('si la bombolla de davant entra a esperar la xarxa, la de programa queda en error sense eixir, i la de darrere continua a la cua', async () => {
    await obert();
    const linia = senseXarxa();
    const enVol = deferred();
    mock.enviaMissatge.mockReturnValueOnce(enVol.promise);
    let primer;
    act(() => { primer = value.sendChatMessage({ id: 'fil-A' }, 'primer'); });
    let resultat = null;
    act(() => { value.sendChatMessage({ id: 'fil-A' }, 'programa', { esperaLaXarxa: false }).then((r) => { resultat = r; }); });
    let tercer;
    act(() => { tercer = value.sendChatMessage({ id: 'fil-A' }, 'tercer'); });
    await pas(0);
    expect(resultat).toBeNull();
    /* «primer» falla sense xarxa i entra a esperar-la (XC-03). */
    mock.enviaMissatge.mockRejectedValue(xarxa());
    await act(async () => { enVol.reject(xarxa()); });
    await pas(0);
    expect(resultat).toEqual([]);
    expect(textos()).toEqual(['primer']);
    expect(propis()).toEqual(['primer:pendent', 'programa:error', 'tercer:pendent']);
    expect(value.chatMessages.find((m) => m.text === 'programa')).toMatchObject({ codiError: 'XARXA' });
    await pas(60_000);
    expect(textos()).toEqual(['primer']);
    /* Torna la xarxa: «primer» i després «tercer»; «programa» es queda en error, a mà. */
    linia.mockReturnValue(true);
    confirmaTot();
    act(() => { window.dispatchEvent(new Event('online')); });
    await pas(0);
    await act(async () => { await primer; await tercer; });
    expect(textos()).toEqual(['primer', 'tercer']);
    expect(propis()).toEqual(['primer:2', 'tercer:3', 'programa:error']);
    /* El reintent a mà fa cua com sempre i ix. */
    const programa = value.chatMessages.find((m) => m.text === 'programa');
    await act(async () => { await value.reintenta(programa.id); });
    expect(textos()).toEqual(['primer', 'tercer', 'programa']);
    expect(mock.enviaMissatge.mock.calls.at(-1)[1].id).toBe(programa.id);
  });

  it('si ja n’hi ha una que espera la xarxa en encuar-la, error de seguida; un altre fil no en fa cas', async () => {
    await obert();
    senseXarxa();
    mock.enviaMissatge.mockRejectedValue(xarxa());
    act(() => { value.sendChatMessage({ id: 'fil-A' }, 'primer'); });
    await pas(0);
    let resultat;
    await act(async () => { resultat = await value.sendChatMessage({ id: 'fil-A' }, 'programa', { esperaLaXarxa: false }); });
    expect(resultat).toEqual([]);
    expect(textos()).toEqual(['primer']);
    let altre = null;
    act(() => { value.sendChatMessage({ id: 'fil-B' }, 'altre fil', { esperaLaXarxa: false }).then((r) => { altre = r; }); });
    await pas(0);
    /* fil-B no té res davant: ho prova (reintents acotats). */
    expect(textos()).toEqual(['primer', 'altre fil']);
    await pas(15_000);
    expect(altre).toEqual([]);
    expect(textos().filter((t) => t === 'altre fil')).toHaveLength(4);
  });
});

describe('D5 (dades) · tipusAvisFil i llegintFil', () => {
  it('fora del proveïdor: null i fals', () => {
    render(<Sonda />);
    expect(value.tipusAvisFil('fil-A')).toBeNull();
    expect(value.llegintFil('fil-A')).toBe(false);
  });

  it('una lectura fallida és «lectura», una marca fallida és «marca»; avisFil continua sent el text cru', async () => {
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    mock.loadMissatges.mockImplementationOnce(() => Promise.reject(xarxa()));
    act(() => value.obriFil('fil-A'));
    await buidaCua();
    expect(value.avisFil('fil-A')).toBe('Failed to fetch');
    expect(value.tipusAvisFil('fil-A')).toBe('lectura');
    expect(value.tipusAvisFil('fil-B')).toBeNull();
    act(() => value.recarregaFil('fil-A'));
    await buidaCua();
    expect(value.avisFil('fil-A')).toBeNull();
    expect(value.tipusAvisFil('fil-A')).toBeNull();
    vi.useFakeTimers();
    mock.marcaLlegit.mockRejectedValueOnce(Object.assign(new Error('No s’ha pogut marcar com a llegit.'), { retriable: true }));
    act(() => value.marcaVist('fil-A', 1));
    await pas(2000);
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    expect(value.avisFil('fil-A')).toBe('No s’ha pogut marcar com a llegit.');
    expect(value.tipusAvisFil('fil-A')).toBe('marca');
  });

  it('l’historial cap arrere fallit també és «lectura»', async () => {
    mock.loadMissatges.mockResolvedValue(Array.from({ length: 50 }, (_, i) => msg(i + 11)));
    await obert();
    mock.loadMissatges.mockImplementationOnce(() => Promise.reject(xarxa()));
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.avisFil('fil-A')).toBe('Failed to fetch');
    expect(value.tipusAvisFil('fil-A')).toBe('lectura');
  });

  it('llegintFil: cert mentre vola la primera lectura i mentre vola el reintent d’un fil amb avís', async () => {
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    const primera = deferred();
    mock.loadMissatges.mockReturnValueOnce(primera.promise);
    act(() => value.obriFil('fil-A'));
    await waitFor(() => expect(mock.loadMissatges).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(value.llegintFil('fil-A')).toBe(true));
    expect(value.llegintFil('fil-B')).toBe(false);
    await act(async () => { primera.reject(xarxa()); });
    await buidaCua();
    expect(value.llegintFil('fil-A')).toBe(false);
    expect(value.tipusAvisFil('fil-A')).toBe('lectura');
    const reintent = deferred();
    mock.loadMissatges.mockReturnValueOnce(reintent.promise);
    act(() => value.recarregaFil('fil-A'));
    await buidaCua();
    expect(value.llegintFil('fil-A')).toBe(true);
    /* Una altra demanda mentre vola: la mateixa lectura (XC-01), continua cert. */
    act(() => value.recarregaFil('fil-A'));
    expect(value.llegintFil('fil-A')).toBe(true);
    await act(async () => { reintent.resolve([msg(1)]); });
    await buidaCua();
    expect(value.llegintFil('fil-A')).toBe(false);
    expect(value.avisFil('fil-A')).toBeNull();
    expect(value.filCarregat('fil-A')).toBe(true);
  });

  it('un fil ja carregat i sense avís: el sondeig no es publica (cap render) i llegintFil és fals', async () => {
    await obert();
    await pas(0);
    const abans = value;
    const rendersAbans = renders;
    const sondeig = deferred();
    mock.loadMissatges.mockReturnValueOnce(sondeig.promise);
    act(() => value.recarregaFil('fil-A'));
    await pas(0);
    expect(value.llegintFil('fil-A')).toBe(false);
    await act(async () => { sondeig.resolve([]); });
    await pas(0);
    expect(value).toBe(abans);
    expect(renders).toBe(rendersAbans);
  });

  it('una marca fallida mentre vola un sondeig: llegintFil passa a cert fins que acaba', async () => {
    await obert();
    const sondeig = deferred();
    mock.loadMissatges.mockReturnValueOnce(sondeig.promise);
    act(() => value.recarregaFil('fil-A'));
    await pas(0);
    expect(value.llegintFil('fil-A')).toBe(false);
    mock.marcaLlegit.mockRejectedValueOnce(Object.assign(new Error('No s’ha pogut marcar com a llegit.'), { retriable: true }));
    act(() => value.marcaVist('fil-A', 1));
    await pas(2000);
    expect(value.tipusAvisFil('fil-A')).toBe('marca');
    expect(value.llegintFil('fil-A')).toBe(true);
    await act(async () => { sondeig.resolve([]); });
    await pas(0);
    expect(value.llegintFil('fil-A')).toBe(false);
    /* La lectura bona se'n porta l'avís (XC-13), també el de la marca. */
    expect(value.tipusAvisFil('fil-A')).toBeNull();
  });

  it('un altre àmbit: res de l’anterior (ni avís, ni tipus, ni lectura en vol)', async () => {
    const vista = render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    mock.loadMissatges.mockImplementationOnce(() => Promise.reject(xarxa()));
    act(() => value.obriFil('fil-A'));
    await buidaCua();
    const penjada = deferred();
    mock.loadMissatges.mockReturnValueOnce(penjada.promise);
    act(() => value.recarregaFil('fil-A'));
    await buidaCua();
    expect(value.llegintFil('fil-A')).toBe(true);
    expect(value.tipusAvisFil('fil-A')).toBe('lectura');
    const vell = value;
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.llegintFil('fil-A')).toBe(false);
    expect(value.tipusAvisFil('fil-A')).toBeNull();
    expect(vell.llegintFil('fil-A')).toBe(false);
    expect(vell.tipusAvisFil('fil-A')).toBeNull();
  });
});
