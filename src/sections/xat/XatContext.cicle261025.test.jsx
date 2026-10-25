/* Gauntlet 261025_0545 · El cicle de vida del xat, al proveïdor real amb el
   port simulat (troballes XC i C0545 de l'auditoria del xat, verificades):
     · X3 (Codex C0545-X3) · l'historial inicial no esborra un missatge propi
       confirmat mentre la primera lectura era en vol;
     · XC-01 · una ràfega d'avisos del canal no congela la conversa oberta:
       una sola lectura en vol per fil, i una més si n'arriben d'altres;
     · XC-02 · posar-se al dia d'un fil ja visitat buida el forat en obrir-lo;
     · XC-13 · una lectura fallida d'un fil no tapa la llista (avís per fil);
     · XC-14 · `filCarregat`, `avisFil` i `recarregaFil` (contracte amb la vista);
     · ordre d'enviament · dos enviaments al mateix fil ixen en l'ordre escrit;
     · XC-03 · sense xarxa, la bombolla espera la xarxa sense gastar reintents;
     · marques · la lectura que esperava l'agrupació s'envia en amagar la pàgina.
   L'arnés és el dels PoC de l'auditoria (servidor de missatges amb latència),
   calcat de XatContext.xarxaRural.test.jsx. */
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
function Sonda() {
  const actual = useXat();
  useLayoutEffect(() => { value = actual; });
  value = actual;
  return null;
}
const arbre = (config = CONFIG) => <StrictMode><XatProvider config={config}><Sonda /></XatProvider></StrictMode>;
const pas = async (ms) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
/* Amb temporitzadors fingits: les cadenes de promeses llargues (diverses lectures seguides) acaben. */
const assenta = async () => { for (let i = 0; i < 10; i += 1) await pas(0); };
/* Totes les promeses ja resoltes han acabat la seua cadena (temporitzadors reals). */
const buidaCua = () => act(async () => { await new Promise((resol) => setTimeout(resol, 0)); });
const seqs = (filId = 'fil-A') => value.getThreadMessages(filId).filter((m) => m.seq != null).map((m) => m.seq);
const incrementals = () => mock.loadMissatges.mock.calls.filter(([, o]) => o?.despresDeSeq != null);

/* El «servidor» de missatges: xat_historial (els últims 50) i xat_nous (seq >
   cursor, com a molt 100 per crida). La resposta reflectix l'estat del
   servidor en EIXIR la petició; `enVol` compta les lectures que no han tornat. */
let servidor;
let latenciaMs;
let callbackCanal;
let enVol;
let maxEnVol;
/* navigator.onLine fingit (XC-03); es restaura després de cada prova. */
let espiaLinia = null;
beforeEach(() => {
  vi.clearAllMocks();
  servidor = [msg(1)];
  latenciaMs = 0;
  callbackCanal = null;
  enVol = 0;
  maxEnVol = 0;
  mock.session = { currentUser: { id: 'A' }, generacio: 1 };
  mock.actorKey = 'persona::A';
  mock.loadFils.mockImplementation(async () => [fil({ ultimSeq: servidor.at(-1)?.seq ?? 0 })]);
  mock.loadMissatges.mockImplementation((filId, opcions = {}) => new Promise((resol, rebutja) => {
    const tria = opcions.despresDeSeq != null
      ? servidor.filter((m) => m.seq > opcions.despresDeSeq).slice(0, 100)
      : servidor.filter((m) => opcions.abansDeSeq == null || m.seq < opcions.abansDeSeq).slice(-(opcions.limit ?? 50));
    const copia = tria.map((m) => ({ ...m }));
    enVol += 1;
    maxEnVol = Math.max(maxEnVol, enVol);
    const acaba = (fn) => { enVol -= 1; fn(); };
    if (!latenciaMs) { acaba(() => resol(copia)); return; }
    const t = setTimeout(() => acaba(() => resol(copia)), latenciaMs);
    opcions.signal?.addEventListener('abort', () => { clearTimeout(t); acaba(() => rebutja(new DOMException('avortat', 'AbortError'))); });
  }));
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
  mock.subscribeToXat.mockImplementation(async (filId, cb) => { callbackCanal = cb; return { subscription: `sub-${filId}`, error: null }; });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.useRealTimers(); espiaLinia?.mockRestore(); espiaLinia = null; });

/* Amb els temporitzadors de la prova: el fil obert i el seu canal. */
async function obert() {
  render(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  vi.useFakeTimers();
  act(() => value.obriFil('fil-A'));
  await pas(0);
  expect(seqs()).toEqual([1]);
  expect(typeof callbackCanal).toBe('function');
}

/* Amb temporitzadors reals: la primera lectura del fil, en vol fins que la prova la resol. */
async function obertAmbLecturaEnVol() {
  const vista = render(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  const inicial = deferred();
  mock.loadMissatges.mockReturnValueOnce(inicial.promise);
  act(() => value.obriFil('fil-A'));
  await waitFor(() => expect(mock.loadMissatges).toHaveBeenCalledTimes(1));
  expect(mock.loadMissatges.mock.calls[0][1]).not.toHaveProperty('despresDeSeq');
  return { inicial, vista };
}
const confirmaPropi = (seq) => mock.enviaMissatge.mockImplementationOnce(async (_, cos) => ({ ...msg(seq, 'A'), id: cos.id, text: cos.text }));

describe('X3 (Codex C0545-X3) · l’historial inicial no esborra un missatge propi confirmat', () => {
  it('historial inicial en vol, el meu seq 3 confirmat i l’instantània amb el seq 1: es veuen el 1 i el 3', async () => {
    const { inicial } = await obertAmbLecturaEnVol();
    confirmaPropi(3);
    await act(async () => { await value.sendChatMessage({ id: 'fil-A' }, 'meu'); });
    expect(seqs()).toEqual([3]);
    await act(async () => { inicial.resolve([msg(1)]); });
    await buidaCua();
    expect(seqs()).toEqual([1, 3]);
    expect(value.getThreadMessages('fil-A').find((m) => m.seq === 3)).toMatchObject({ text: 'meu', sender: 'me', estatEnviament: 'enviat' });
  });

  it('el cursor el governa la lectura (1, no el meu 3): la següent recupera el 2 del forat sense duplicar el meu', async () => {
    const { inicial } = await obertAmbLecturaEnVol();
    confirmaPropi(3);
    let propi;
    await act(async () => { [propi] = await value.sendChatMessage({ id: 'fil-A' }, 'meu'); });
    await act(async () => { inicial.resolve([msg(1)]); });
    await buidaCua();
    expect(seqs()).toEqual([1, 3]);
    servidor = [msg(1), msg(2), { ...msg(3, 'A'), id: propi.id, text: 'meu' }];
    await act(async () => { callbackCanal(null, { tipus: 'nous', filId: 'fil-A', seq: 3 }); });
    await buidaCua();
    expect(mock.loadMissatges.mock.calls.at(-1)[1]).toMatchObject({ despresDeSeq: 1 });
    expect(seqs()).toEqual([1, 2, 3]);
    expect(value.getThreadMessages('fil-A').filter((m) => m.id === propi.id)).toHaveLength(1);
  });

  it('amb l’historial encara buit, el meu primer missatge es queda i la lectura següent ix del cursor 0', async () => {
    servidor = [];
    const { inicial } = await obertAmbLecturaEnVol();
    confirmaPropi(1);
    let primer;
    await act(async () => { [primer] = await value.sendChatMessage({ id: 'fil-A' }, 'el primer'); });
    await act(async () => { inicial.resolve([]); });
    await buidaCua();
    expect(seqs()).toEqual([1]);
    servidor = [{ ...msg(1, 'A'), id: primer.id, text: 'el primer' }];
    await act(async () => { callbackCanal(null, { tipus: 'nous', filId: 'fil-A', seq: 1 }); });
    await buidaCua();
    expect(mock.loadMissatges.mock.calls.at(-1)[1]).toMatchObject({ despresDeSeq: 0 });
    expect(value.getThreadMessages('fil-A').filter((m) => m.id === primer.id)).toHaveLength(1);
  });

  it('si l’instantània ja porta el meu missatge (el mateix id), una sola bombolla', async () => {
    const { inicial } = await obertAmbLecturaEnVol();
    confirmaPropi(3);
    let propi;
    await act(async () => { [propi] = await value.sendChatMessage({ id: 'fil-A' }, 'meu'); });
    await act(async () => { inicial.resolve([msg(1), { ...msg(3, 'A'), id: propi.id, text: 'meu' }]); });
    await buidaCua();
    expect(seqs()).toEqual([1, 3]);
    expect(value.getThreadMessages('fil-A').filter((m) => m.id === propi.id)).toHaveLength(1);
  });

  it('un esborrat que porta l’instantània (el mateix id) mana sobre la confirmació', async () => {
    const { inicial } = await obertAmbLecturaEnVol();
    confirmaPropi(3);
    let propi;
    await act(async () => { [propi] = await value.sendChatMessage({ id: 'fil-A' }, 'meu'); });
    await act(async () => { inicial.resolve([msg(1), { ...msg(3, 'A'), id: propi.id, text: '', esborratAl: '2026-10-25T05:01:00Z' }]); });
    await buidaCua();
    expect(value.getThreadMessages('fil-A').filter((m) => m.id === propi.id))
      .toEqual([expect.objectContaining({ esborrat: true, text: '' })]);
  });

  it('la resposta tardana de l’historial d’A no entra quan ja hi és B', async () => {
    const { inicial, vista } = await obertAmbLecturaEnVol();
    confirmaPropi(3);
    await act(async () => { await value.sendChatMessage({ id: 'fil-A' }, 'meu'); });
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    await act(async () => { inicial.resolve([msg(1)]); });
    await buidaCua();
    expect(value.getThreadMessages('fil-A')).toEqual([]);
  });
});

describe('XC-01 · una ràfega d’avisos del canal no congela la conversa oberta', () => {
  it('400 ms de latència i un missatge cada 100 ms durant 3 s: la conversa avança durant la ràfega, amb una sola lectura en vol', async () => {
    await obert();
    latenciaMs = 400;
    const abans = mock.loadMissatges.mock.calls.length;
    maxEnVol = 0;
    const visibles = [];
    for (let s = 2; s <= 31; s += 1) {
      servidor.push(msg(s));
      act(() => callbackCanal(null, { tipus: 'nous', filId: 'fil-A', seq: s }));
      await pas(100);
      visibles.push(seqs().at(-1));
    }
    const crides = mock.loadMissatges.mock.calls.length - abans;
    /* Abans: [1, 1, …, 1] i 30 crides. */
    expect(visibles[9]).toBeGreaterThanOrEqual(4);
    expect(visibles.at(-1)).toBeGreaterThanOrEqual(20);
    expect(visibles).toEqual([...visibles].sort((a, b) => a - b));
    expect(maxEnVol).toBeLessThanOrEqual(2);
    expect(crides).toBeLessThanOrEqual(10);
    await pas(800);
    expect(seqs().at(-1)).toBe(31);
    expect(seqs()).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });

  it('xarxa rural (1,5 s) i un missatge per segon durant 12 s: cada pocs segons n’arriben de nous', async () => {
    await obert();
    latenciaMs = 1500;
    maxEnVol = 0;
    const visibles = [];
    for (let s = 2; s <= 13; s += 1) {
      servidor.push(msg(s));
      act(() => callbackCanal(null, { tipus: 'nous', filId: 'fil-A', seq: s }));
      await pas(1000);
      visibles.push(seqs().at(-1));
    }
    /* Abans: 1 cada segon fins que la ràfega parava. */
    expect(visibles[2]).toBeGreaterThan(1);
    expect(visibles.at(-1)).toBeGreaterThanOrEqual(10);
    expect(maxEnVol).toBeLessThanOrEqual(2);
    await pas(3000);
    expect(seqs().at(-1)).toBe(13);
  });
});

describe('XC-02 · un fil ja visitat amb més de 100 missatges nous es posa al dia en obrir-lo', () => {
  it('350 nous: en obrir es veuen tots (351), no als 65 s, i amb un límit de pàgines per crida', async () => {
    await obert();
    act(() => value.obriFil(null));
    await pas(0);
    for (let s = 2; s <= 351; s += 1) servidor.push(msg(s));
    const abans = incrementals().length;
    act(() => value.obriFil('fil-A'));
    await assenta();
    /* Abans: 101 en obrir, 201 als 5 s, 301 als 35 s i 351 als 65 s. */
    expect(seqs().at(-1)).toBe(351);
    expect(seqs()).toHaveLength(351);
    const pagines = incrementals().slice(abans).map(([, o]) => o.despresDeSeq);
    expect(pagines).toEqual([1, 101, 201, 301, 351]);
  });

  it('un forat de més de cinc pàgines s’acaba de buidar al tic següent, no en una sola crida', async () => {
    await obert();
    act(() => value.obriFil(null));
    await pas(0);
    for (let s = 2; s <= 701; s += 1) servidor.push(msg(s));
    const abans = incrementals().length;
    act(() => value.obriFil('fil-A'));
    await assenta();
    expect(incrementals().length - abans).toBe(5);
    expect(seqs().at(-1)).toBe(501);
    await pas(5000);
    await assenta();
    expect(seqs().at(-1)).toBe(701);
  });
});

describe('XC-13 · una lectura fallida d’un fil no tapa la llista: avís per fil, no bloquejant', () => {
  it('un tic del fil sense xarxa deixa `avis` buit i posa `avisFil`; la lectura bona següent el lleva', async () => {
    await obert();
    const original = mock.loadMissatges.getMockImplementation();
    mock.loadMissatges.mockImplementationOnce(() => Promise.reject(xarxa()));
    await pas(5000);
    /* Abans: avis = 'Failed to fetch' i LlistaConverses en pintava l'alerta. */
    expect(value.avis).toBeNull();
    expect(value.avisFil('fil-A')).toBe('Failed to fetch');
    expect(value.avisFil('fil-B')).toBeNull();
    expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
    mock.loadMissatges.mockImplementation(original);
    servidor.push(msg(2));
    act(() => value.recarregaFil('fil-A'));
    await pas(0);
    expect(value.avisFil('fil-A')).toBeNull();
    expect(seqs()).toEqual([1, 2]);
  });

  it('l’historial cap arrere i la marca de lectura fallits també avisen només al fil', async () => {
    servidor = Array.from({ length: 60 }, (_, i) => msg(i + 1));
    mock.loadFils.mockImplementation(async () => [fil({ ultimSeq: 60, llegitFinsSeq: 0, noLlegits: 60 })]);
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    vi.useFakeTimers();
    act(() => value.obriFil('fil-A'));
    await pas(0);
    expect(seqs()).toHaveLength(50);
    mock.loadMissatges.mockImplementationOnce(() => Promise.reject(xarxa()));
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.avis).toBeNull();
    expect(value.avisFil('fil-A')).toBe('Failed to fetch');
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.avisFil('fil-A')).toBeNull();
    mock.marcaLlegit.mockRejectedValueOnce(Object.assign(new Error('No s’ha pogut marcar com a llegit.'), { retriable: true }));
    act(() => value.marcaVist('fil-A', 60));
    await pas(2000);
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    expect(value.avis).toBeNull();
    expect(value.avisFil('fil-A')).toBe('No s’ha pogut marcar com a llegit.');
    expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
  });
});

describe('XC-14 · el contracte amb la vista: filCarregat, avisFil i recarregaFil', () => {
  it('fals mentre la primera lectura és en vol, cert quan arriba; un altre àmbit torna a començar', async () => {
    const { inicial, vista } = await obertAmbLecturaEnVol();
    expect(value.filCarregat('fil-A')).toBe(false);
    expect(value.avisFil('fil-A')).toBeNull();
    await act(async () => { inicial.resolve([msg(1)]); });
    await buidaCua();
    expect(value.filCarregat('fil-A')).toBe(true);
    expect(value.filCarregat('fil-B')).toBe(false);
    const vell = value;
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.filCarregat('fil-A')).toBe(false);
    expect(vell.filCarregat('fil-A')).toBe(false);
  });

  it('una primera lectura fallida el deixa fals amb l’avís del fil; recarregaFil torna a llegir ara i el posa a cert', async () => {
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    mock.loadMissatges.mockImplementationOnce(() => Promise.reject(xarxa()));
    act(() => value.obriFil('fil-A'));
    await buidaCua();
    expect(value.filCarregat('fil-A')).toBe(false);
    expect(value.avisFil('fil-A')).toBe('Failed to fetch');
    expect(value.avis).toBeNull();
    const crides = mock.loadMissatges.mock.calls.length;
    act(() => { expect(value.recarregaFil('fil-A')).toBeUndefined(); });
    await buidaCua();
    expect(mock.loadMissatges.mock.calls.length).toBe(crides + 1);
    expect(value.filCarregat('fil-A')).toBe(true);
    expect(value.avisFil('fil-A')).toBeNull();
    expect(seqs()).toEqual([1]);
  });

  it.each(['seed', 'local'])('en mode %s, cert des del primer moment', async (dataMode) => {
    render(arbre({ dataMode }));
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.filCarregat('fil-A')).toBe(true);
  });

  it('una fila d’ajuda per defecte no té res per llegir: cert, i recarregaFil no va al port', async () => {
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.filCarregat('sdp-per-defecte:iaia')).toBe(true);
    act(() => value.recarregaFil('sdp-per-defecte:iaia'));
    await buidaCua();
    expect(mock.loadMissatges).not.toHaveBeenCalled();
  });
});

describe('ordre d’enviament (MISSED P2) · el mateix fil, en l’ordre en què s’escriu', () => {
  it('A falla una vegada (reintentable) i B, escrit després, espera A: seq(A) < seq(B)', async () => {
    await obert();
    let seguent = 2;
    let primera = true;
    mock.enviaMissatge.mockImplementation(async (_, cos) => {
      if (cos.text === 'A' && primera) { primera = false; throw xarxa(); }
      const m = { ...msg(seguent, 'A'), id: cos.id, text: cos.text };
      seguent += 1;
      servidor.push(m);
      return m;
    });
    let pa; let pb;
    act(() => { pa = value.sendChatMessage({ id: 'fil-A' }, 'A'); });
    await pas(0);
    act(() => { pb = value.sendChatMessage({ id: 'fil-A' }, 'B'); });
    await pas(0);
    /* B no ix mentre A espera el reintent. */
    expect(mock.enviaMissatge.mock.calls.map(([, cos]) => cos.text)).toEqual(['A']);
    expect(value.chatMessages.map((m) => `${m.text}:${m.seq ?? m.estatEnviament}`)).toEqual(['t1:1', 'A:pendent', 'B:pendent']);
    await pas(2000);
    await act(async () => { await pa; await pb; });
    /* Abans: t1:1 | B:2 | A:3. */
    expect(mock.enviaMissatge.mock.calls.map(([, cos]) => cos.text)).toEqual(['A', 'A', 'B']);
    expect(value.chatMessages.map((m) => `${m.text}:${m.seq ?? m.estatEnviament}`)).toEqual(['t1:1', 'A:2', 'B:3']);
  });

  it('una cua buida ix en el mateix tic, un altre fil no espera i el reintent manual també fa cua', async () => {
    await obert();
    mock.enviaMissatge.mockRejectedValueOnce(Object.assign(new Error('no'), { retriable: false }));
    await act(async () => { await value.sendChatMessage({ id: 'fil-A' }, 'fallit'); });
    const fallit = value.chatMessages.at(-1);
    expect(fallit.estatEnviament).toBe('error');
    const lent = deferred();
    mock.enviaMissatge.mockReturnValueOnce(lent.promise);
    act(() => { value.sendChatMessage({ id: 'fil-A' }, 'lent'); });
    /* La cua del fil era buida: l'enviament ix en el mateix tic. */
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(2);
    mock.enviaMissatge.mockImplementation(async (_, cos) => ({ ...msg(3, 'A'), id: cos.id, text: cos.text }));
    act(() => { value.sendChatMessage({ id: 'fil-B' }, 'altre fil'); });
    /* Un altre fil no espera la cua de fil-A. */
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(3);
    act(() => { value.reintenta(fallit.id); });
    await pas(0);
    /* Abans: el reintent eixia de seguida, davant de «lent». */
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(3);
    await act(async () => { lent.resolve({ ...msg(2, 'A'), id: mock.enviaMissatge.mock.calls[1][1].id, text: 'lent' }); });
    await pas(0);
    expect(mock.enviaMissatge.mock.calls.map(([, cos]) => cos.text)).toEqual(['fallit', 'lent', 'altre fil', 'fallit']);
    expect(value.chatMessages.map((m) => `${m.text}:${m.seq ?? m.estatEnviament}`)).toEqual(['t1:1', 'lent:2', 'fallit:3']);
  });
});

describe('XC-03 · sense xarxa la bombolla espera la xarxa sense gastar reintents', () => {
  const senseXarxa = () => { espiaLinia = vi.spyOn(window.navigator, 'onLine', 'get'); return espiaLinia; };

  it('offline: es queda pendent més enllà dels reintents i, en tornar la xarxa, ix amb el mateix id i en ordre', async () => {
    await obert();
    const linia = senseXarxa().mockReturnValue(false);
    mock.enviaMissatge.mockRejectedValue(xarxa());
    let pa; let pb;
    act(() => { pa = value.sendChatMessage({ id: 'fil-A' }, 'Demà hi ha mercat?'); });
    act(() => { pb = value.sendChatMessage({ id: 'fil-A' }, 'I a quina hora?'); });
    const [ida, idb] = value.chatMessages.slice(-2).map((m) => m.id);
    await pas(60000);
    /* Abans: 4 intents en ~10 s i la bombolla en error. */
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    expect(value.chatMessages.slice(-2).map((m) => m.estatEnviament)).toEqual(['pendent', 'pendent']);
    linia.mockReturnValue(true);
    let seguent = 2;
    mock.enviaMissatge.mockReset();
    mock.enviaMissatge.mockImplementation(async (_, cos) => ({ ...msg(seguent++, 'A'), id: cos.id, text: cos.text }));
    act(() => { window.dispatchEvent(new Event('online')); });
    await pas(0);
    await act(async () => { await pa; await pb; });
    expect(mock.enviaMissatge.mock.calls.map(([, cos]) => cos.id)).toEqual([ida, idb]);
    expect(value.chatMessages.map((m) => `${m.text}:${m.seq ?? m.estatEnviament}`))
      .toEqual(['t1:1', 'Demà hi ha mercat?:2', 'I a quina hora?:3']);
  });

  it('offline: tornar a la pàgina també ho torna a provar, sense gastar reintents', async () => {
    await obert();
    const linia = senseXarxa().mockReturnValue(false);
    mock.enviaMissatge.mockRejectedValue(xarxa());
    act(() => { value.sendChatMessage({ id: 'fil-A' }, 'hola'); });
    await pas(30000);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    await pas(0);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(2);
    expect(value.chatMessages.at(-1).estatEnviament).toBe('pendent');
    linia.mockReturnValue(true);
    mock.enviaMissatge.mockImplementation(async (_, cos) => ({ ...msg(2, 'A'), id: cos.id, text: cos.text }));
    act(() => { window.dispatchEvent(new Event('online')); });
    await pas(0);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(3);
    expect(value.chatMessages.at(-1)).toMatchObject({ text: 'hola', seq: 2, estatEnviament: 'enviat' });
  });

  it('offline amb un error no reintentable: error de seguida, com sempre', async () => {
    await obert();
    senseXarxa().mockReturnValue(false);
    mock.enviaMissatge.mockRejectedValue(Object.assign(new Error('SDP-XAT-007: massa llarg'), { code: 'SDP-XAT-007', retriable: false }));
    let resultat;
    await act(async () => { resultat = await value.sendChatMessage({ id: 'fil-A' }, 'massa'); });
    expect(resultat).toEqual([]);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    expect(value.chatMessages.at(-1)).toMatchObject({ estatEnviament: 'error', error: 'SDP-XAT-007: massa llarg' });
  });
});

describe('marques de lectura (MISSED P3) · la que esperava l’agrupació s’envia en amagar o tancar la pàgina', () => {
  const amaga = () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  };
  const mostra = () => { delete document.visibilityState; delete document.hidden; };
  async function ambNoLlegits() {
    mock.loadFils.mockImplementation(async () => [fil({ ultimSeq: 5, llegitFinsSeq: 0, noLlegits: 5 })]);
    mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 5, rebutFinsSeq: 5 });
    const vista = render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    vi.useFakeTimers();
    return vista;
  }

  it('pagehide envia ara la marca pendent, sense esperar els 2 s', async () => {
    await ambNoLlegits();
    act(() => value.marcaVist('fil-A', 5));
    expect(mock.marcaLlegit).not.toHaveBeenCalled();
    act(() => { window.dispatchEvent(new Event('pagehide')); });
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    expect(mock.marcaLlegit).toHaveBeenCalledWith('fil-A', expect.objectContaining({ llegitFinsSeq: 5 }));
    await pas(3000);
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
  });

  it('la pestanya que s’amaga també l’envia; sense res pendent no envia res', async () => {
    await ambNoLlegits();
    try {
      act(() => value.marcaVist('fil-A', 4));
      amaga();
      act(() => { document.dispatchEvent(new Event('visibilitychange')); });
      expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
      expect(mock.marcaLlegit).toHaveBeenCalledWith('fil-A', expect.objectContaining({ llegitFinsSeq: 4 }));
      act(() => { document.dispatchEvent(new Event('visibilitychange')); });
      expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    } finally { mostra(); }
  });

  it('un canvi d’àmbit continua cancel·lant: la marca d’A mai s’envia com a B', async () => {
    const vista = await ambNoLlegits();
    act(() => value.marcaVist('fil-A', 5));
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    await pas(0);
    act(() => { window.dispatchEvent(new Event('pagehide')); });
    await pas(3000);
    expect(mock.marcaLlegit).not.toHaveBeenCalled();
  });
});
