import React, { StrictMode, useEffect, useLayoutEffect } from 'react';
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
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: mock.identitats }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: mock.pathname }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, fallback) => fallback }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const message = (text, id = 'm-A', extra = {}) => ({ id, filId: 'fil-A', usuariId: 'A', text, seq: 1, creatAl: '2026-09-24T10:00:00Z', ...extra });
const fil = (extra = {}) => ({ id: 'fil-A', titol: 'A', altresNoms: [], ultimSeq: 2, llegitFinsSeq: 0, llegitPelsAltresFinsSeq: 0, noLlegits: 2, ultimAutorId: 'X', ultimAl: '2026-09-24T10:00:00Z', ...extra });
let value, snapshots;
function Probe() {
  value = useXat();
  useLayoutEffect(() => { snapshots.push({ ...value }); });
  return null;
}
function tree(config) { return <StrictMode><XatProvider config={config}><Probe /></XatProvider></StrictMode>; }
async function open(config = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' }) {
  const view = render(tree(config));
  await waitFor(() => expect(value.status).toBe('ready'));
  act(() => value.obriFil('fil-A'));
  await waitFor(() => expect(value.chatMessages[0]?.text).toBe('secret-A'));
  return { ...view, config };
}
beforeEach(() => {
  vi.clearAllMocks(); snapshots = []; mock.pathname = '/xat';
  mock.session = { currentUser: { id: 'A' }, generacio: 1 }; mock.actorKey = 'persona::A'; mock.identitats = undefined;
  mock.loadFils.mockResolvedValue([fil()]);
  mock.loadMissatges.mockResolvedValue([message('secret-A')]);
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub-A', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('confidencialitat del scope del Xat', () => {
  it('oculta i purga A en logout abans dels efectes, també en entrar B', async () => {
    const view = await open(); const old = value;
    mock.session = { currentUser: null, generacio: 2 };
    snapshots = []; view.rerender(tree(view.config));
    expect(snapshots[0].chatMessages).toEqual([]);
    expect(snapshots[0].chatThreads).toEqual([]);
    expect(snapshots[0].totalNoLlegits).toBe(0);
    expect(snapshots[0].filActiu).toBeNull();
    expect(old.getThreadMessages('fil-A')).toEqual([]);
    mock.session = { currentUser: { id: 'B' }, generacio: 3 }; mock.actorKey = 'persona::B';
    mock.loadFils.mockResolvedValue([]); view.rerender(tree(view.config));
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.getThreadMessages('fil-A')).toEqual([]);
    expect(value.filActiu).toBeNull();
    expect(mock.unsubscribeFromXat).toHaveBeenCalledWith('sub-A');
  });

  it.each(['tenant', 'backend', 'config', 'actor', 'generacio'])('invalida %s mantenint el mateix usuari', async change => {
    const view = await open();
    const signal = mock.loadMissatges.mock.calls.at(-1)[1].signal;
    let config = view.config;
    if (change === 'tenant') config = { ...config, tenantId: '00000000-0000-0000-0000-00000000000b' };
    if (change === 'backend') config = { ...config, backendId: 'altre' };
    if (change === 'config') config = { ...config };
    if (change === 'actor') mock.actorKey = 'entitat::associacio';
    if (change === 'generacio') mock.session = { ...mock.session, generacio: 2 };
    snapshots = []; view.rerender(tree(config));
    expect(snapshots[0].chatMessages).toEqual([]);
    expect(snapshots[0].filActiu).toBeNull();
    expect(signal.aborted).toBe(true);
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.getThreadMessages('fil-A')).toEqual([]);
  });

  it('descarta lectures tardanes i no marca llegit en el scope següent', async () => {
    const view = await open();
    const late = deferred(); mock.loadMissatges.mockReturnValueOnce(late.promise);
    act(() => value.obriFil('fil-pendent'));
    await waitFor(() => expect(mock.loadMissatges).toHaveBeenCalledWith('fil-pendent', expect.any(Object)));
    const old = value;
    mock.marcaLlegit.mockClear(); mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    view.rerender(tree(view.config));
    await act(async () => { late.resolve([message('tarda', 'm-tarda', { filId: 'fil-pendent' })]); old.marcaVist('fil-pendent', 1); });
    expect(value.getThreadMessages('fil-pendent')).toEqual([]);
    expect(mock.marcaLlegit).not.toHaveBeenCalled();
  });

  it('descarta enviament, cerca, creació i realtime tardans, inclosos callbacks guardats', async () => {
    const view = await open(); const old = value;
    const lateSend = deferred(), lateMembers = deferred(), lateThread = deferred();
    mock.enviaMissatge.mockReturnValueOnce(lateSend.promise);
    mock.carregaMembres.mockReturnValueOnce(lateMembers.promise);
    mock.creaFilDirecte.mockReturnValueOnce(lateThread.promise);
    let send, members, thread;
    act(() => { send = old.sendChatMessage({ id: 'fil-A' }, 'pendent'); members = old.cercaMembres(); thread = old.creaFil('X'); });
    expect(value.getThreadMessages('fil-A').at(-1).estatEnviament).toBe('pendent');
    const realtime = mock.subscribeToXat.mock.calls.at(-1)[1];
    mock.session = { currentUser: { id: 'B' }, generacio: 2 }; view.rerender(tree(view.config));
    const carregues = mock.loadMissatges.mock.calls.length;
    await act(async () => {
      lateSend.resolve(message('pendent', 'm-pendent', { seq: 2 })); lateMembers.resolve([{ id: 'A' }]); lateThread.resolve('fil-A');
      realtime(null, { tipus: 'nous', filId: 'fil-A', seq: 5 });
      expect(await send).toEqual([]); expect(await members).toEqual([]); expect(await thread).toBeNull();
    });
    expect(value.chatMessages).toEqual([]); expect(value.getThreadMessages('fil-A')).toEqual([]);
    expect(mock.loadMissatges.mock.calls.length).toBe(carregues);
    const sends = mock.enviaMissatge.mock.calls.length;
    await act(async () => expect(await old.sendChatMessage({ id: 'fil-A' }, 'prohibit')).toEqual([]));
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(sends);
  });

  it('accepta el fil sol·licitat per un fill en el primer efecte, també en canviar scope', async () => {
    function Route() {
      const { obriFil } = useXat();
      useEffect(() => { obriFil('fil-A'); }, [obriFil]);
      return <Probe />;
    }
    const config = { tenantId: '00000000-0000-0000-0000-000000000000' };
    const route = () => <StrictMode><XatProvider config={config}><Route /></XatProvider></StrictMode>;
    const view = render(route());
    await waitFor(() => expect(value.chatMessages[0]?.text).toBe('secret-A'));
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    mock.loadMissatges.mockResolvedValue([message('resposta-B')]);
    view.rerender(route());
    await waitFor(() => expect(value.chatMessages[0]?.text).toBe('resposta-B'));
  });

  it('invalida el getter i totes les accions guardades després de desmuntar', async () => {
    const view = await open(), old = value;
    const signal = mock.loadMissatges.mock.calls.at(-1)[1].signal;
    view.unmount();
    expect(signal.aborted).toBe(true);
    expect(old.getThreadMessages('fil-A')).toEqual([]);
    expect(old.hiHaMesAntics('fil-A')).toBe(false);
    expect(await old.sendChatMessage({ id: 'fil-A' }, 'fora')).toEqual([]);
    expect(await old.cercaMembres()).toEqual([]);
    expect(await old.creaFil('B')).toBeNull();
    expect(await old.carregaMesAntics('fil-A')).toBe(false);
    expect(mock.enviaMissatge).not.toHaveBeenCalled();
    expect(mock.carregaMembres).not.toHaveBeenCalled();
    expect(mock.creaFilDirecte).not.toHaveBeenCalled();
  });

  it('desconnecta una subscripció que es resol després del logout', async () => {
    const sub = deferred(); mock.subscribeToXat.mockReturnValueOnce(sub.promise);
    const view = await open();
    mock.session = { currentUser: null, generacio: 2 }; view.rerender(tree(view.config));
    await act(async () => sub.resolve({ subscription: 'sub-tardana', error: null }));
    expect(mock.unsubscribeFromXat).toHaveBeenCalledWith('sub-tardana');
  });
});

/* D7 (ordre del Mestre, 260930) · Avisos estrictament unidireccionals:
   defensa en profunditat al context, a banda del Compositor i del servidor. */
describe('D7 · fils on no es pot escriure', () => {
  it('sendChatMessage amb potEscriure:false no crida enviaMissatge ni pinta cap bombolla', async () => {
    await open();
    const abans = value.getThreadMessages('fil-A').length;
    let resultat;
    await act(async () => { resultat = await value.sendChatMessage({ id: 'fil-A', tipus: 'canal', potEscriure: false }, 'Avís'); });
    expect(resultat).toEqual([]);
    expect(mock.enviaMissatge).not.toHaveBeenCalled();
    expect(value.getThreadMessages('fil-A')).toHaveLength(abans);
    expect(value.getThreadMessages('fil-A').some((m) => m.text === 'Avís')).toBe(false);
  });

  it('amb potEscriure:true (administració dels Avisos) sí que envia', async () => {
    await open();
    mock.enviaMissatge.mockImplementationOnce(async (_, cos) => message(cos.text, cos.id, { seq: 3 }));
    await act(async () => { await value.sendChatMessage({ id: 'fil-A', tipus: 'canal', potEscriure: true }, 'Avís'); });
    expect(mock.enviaMissatge).toHaveBeenCalledWith('fil-A', expect.objectContaining({ text: 'Avís' }), expect.any(Object));
  });
});

describe('enviament fiable (F0)', () => {
  it('pinta la bombolla pendent amb un UUID abans de la xarxa i passa a enviat i després a llegit', async () => {
    await open();
    const late = deferred(); mock.enviaMissatge.mockReturnValueOnce(late.promise);
    let promesa;
    act(() => { promesa = value.sendChatMessage({ id: 'fil-A' }, 'hola'); });
    const pendent = value.getThreadMessages('fil-A').at(-1);
    expect(pendent.estatEnviament).toBe('pendent');
    expect(pendent.seq).toBeNull();
    expect(pendent.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(mock.enviaMissatge).toHaveBeenCalledWith('fil-A', { id: pendent.id, text: 'hola' }, expect.objectContaining({ tenantId: '00000000-0000-0000-0000-00000000000a' }));
    let resultat;
    await act(async () => { late.resolve(message('hola', pendent.id, { seq: 3 })); resultat = await promesa; });
    expect(resultat).toHaveLength(1);
    const enviat = value.getThreadMessages('fil-A').find(m => m.id === pendent.id);
    expect(enviat.estatEnviament).toBe('enviat');
    expect(enviat.seq).toBe(3);
    expect(value.getThreadMessages('fil-A').filter(m => m.id === pendent.id)).toHaveLength(1);
    expect(value.chatThreads[0].ultimText).toBe('hola');
    expect(value.chatThreads[0].ultimSeq).toBe(3);
    mock.loadFils.mockResolvedValue([fil({ ultimSeq: 3, llegitPelsAltresFinsSeq: 3, ultimAutorId: 'A' })]);
    await act(async () => { await value.recarrega(); });
    expect(value.getThreadMessages('fil-A').find(m => m.id === pendent.id).estatEnviament).toBe('llegit');
    expect(mock.showToast).not.toHaveBeenCalled();
  });

  it('un missatge enviat dos vegades (reintent) viatja amb el mateix id i es queda una sola vegada', async () => {
    await open();
    const xarxa = Object.assign(new Error('xarxa'), { retriable: true });
    mock.enviaMissatge.mockRejectedValueOnce(xarxa);
    mock.enviaMissatge.mockImplementationOnce(async (_, cos) => message(cos.text, cos.id, { seq: 4 }));
    vi.useFakeTimers();
    let promesa;
    act(() => { promesa = value.sendChatMessage({ id: 'fil-A' }, 'idempotent'); });
    const id = value.getThreadMessages('fil-A').at(-1).id;
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    const resultat = await promesa;
    vi.useRealTimers();
    expect(resultat[0].id).toBe(id);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(2);
    expect(mock.enviaMissatge.mock.calls[0][1].id).toBe(id);
    expect(mock.enviaMissatge.mock.calls[1][1].id).toBe(id);
    const propis = value.getThreadMessages('fil-A').filter(m => m.id === id);
    expect(propis).toHaveLength(1);
    expect(propis[0].estatEnviament).toBe('enviat');
  });

  it('no reintenta un error no retriable, deixa la bombolla en error amb el text del servidor i permet descartar-la', async () => {
    await open();
    const error = Object.assign(new Error('SDP-XAT-007: el missatge és buit o massa llarg'), { code: 'SDP-XAT-007', retriable: false });
    mock.enviaMissatge.mockRejectedValueOnce(error);
    let resultat;
    await act(async () => { resultat = await value.sendChatMessage({ id: 'fil-A' }, 'massa'); });
    expect(resultat).toEqual([]);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    const fallit = value.getThreadMessages('fil-A').at(-1);
    expect(fallit.estatEnviament).toBe('error');
    expect(fallit.error).toBe('SDP-XAT-007: el missatge és buit o massa llarg');
    expect(fallit.text).toBe('massa');
    act(() => value.descartaFallit(fallit.id));
    expect(value.getThreadMessages('fil-A').some(m => m.id === fallit.id)).toBe(false);
  });

  it('reintenta tres vegades amb espera 1 s, 2 s, 4 s quan l\'error és retriable i després admet el reintent manual', async () => {
    await open();
    const xarxa = Object.assign(new Error('xarxa'), { retriable: true });
    mock.enviaMissatge.mockRejectedValue(xarxa);
    vi.useFakeTimers();
    let promesa;
    act(() => { promesa = value.sendChatMessage({ id: 'fil-A' }, 'reintent'); });
    const id = value.getThreadMessages('fil-A').at(-1).id;
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(999); });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(501); });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(3);
    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(4);
    expect(await promesa).toEqual([]);
    vi.useRealTimers();
    expect(mock.enviaMissatge.mock.calls.every(c => c[1].id === id)).toBe(true);
    expect(value.getThreadMessages('fil-A').at(-1).estatEnviament).toBe('error');
    mock.enviaMissatge.mockResolvedValue(message('reintent', id, { seq: 9 }));
    let manual;
    await act(async () => { manual = await value.reintenta(id); });
    expect(manual[0].seq).toBe(9);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(5);
    expect(mock.enviaMissatge.mock.calls[4][1].id).toBe(id);
    const confirmat = value.getThreadMessages('fil-A').find(m => m.id === id);
    expect(confirmat.estatEnviament).toBe('enviat');
    expect(value.getThreadMessages('fil-A').filter(m => m.id === id)).toHaveLength(1);
  });
});

describe('historial, lectura i avisos (F0)', () => {
  it('pagina cap arrere per seq i sap quan no en queden més', async () => {
    const pagina = Array.from({ length: 50 }, (_, i) => message(`m${51 + i}`, `id-${51 + i}`, { seq: 51 + i }));
    mock.loadMissatges.mockResolvedValue(pagina);
    render(tree({ tenantId: '00000000-0000-0000-0000-00000000000a' }));
    await waitFor(() => expect(value.status).toBe('ready'));
    act(() => value.obriFil('fil-A'));
    await waitFor(() => expect(value.getThreadMessages('fil-A')).toHaveLength(50));
    expect(mock.loadMissatges.mock.calls[0][1]).not.toHaveProperty('despresDeSeq');
    expect(mock.loadMissatges.mock.calls[0][1]).not.toHaveProperty('abansDeSeq');
    expect(value.hiHaMesAntics('fil-A')).toBe(true);
    expect(value.carregantAntics('fil-A')).toBe(false);
    const antics = Array.from({ length: 10 }, (_, i) => message(`m${41 + i}`, `id-${41 + i}`, { seq: 41 + i }));
    const late = deferred(); mock.loadMissatges.mockReturnValueOnce(late.promise);
    let promesa;
    act(() => { promesa = value.carregaMesAntics('fil-A'); });
    await waitFor(() => expect(value.carregantAntics('fil-A')).toBe(true));
    expect(mock.loadMissatges).toHaveBeenLastCalledWith('fil-A', expect.objectContaining({ abansDeSeq: 51, limit: 50 }));
    await act(async () => { late.resolve(antics); await promesa; });
    const seqs = value.getThreadMessages('fil-A').map(m => m.seq);
    expect(seqs).toHaveLength(60);
    expect(seqs[0]).toBe(41);
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
    expect(value.hiHaMesAntics('fil-A')).toBe(false);
    expect(value.carregantAntics('fil-A')).toBe(false);
  });

  it('en rebre un avís de temps real demana només els nous per seq i no avisa dins del xat', async () => {
    await open();
    const cb = mock.subscribeToXat.mock.calls.at(-1)[1];
    mock.loadMissatges.mockResolvedValueOnce([message('nou', 'm-nou', { seq: 2, usuariId: 'X', autorNom: 'Pepa' })]);
    await act(async () => { cb(null, { tipus: 'nous', filId: 'fil-A', seq: 2 }); });
    await waitFor(() => expect(value.getThreadMessages('fil-A')).toHaveLength(2));
    expect(mock.loadMissatges).toHaveBeenLastCalledWith('fil-A', expect.objectContaining({ despresDeSeq: 1 }));
    expect(value.getThreadMessages('fil-A').at(-1)).toMatchObject({ id: 'm-nou', sender: 'other', author: 'Pepa', seq: 2 });
    expect(mock.showToast).not.toHaveBeenCalled();
  });

  it('agrupa marcaVist cada 2 s per conversa, mai cap arrere, i baixa els no llegits en local', async () => {
    mock.loadFils.mockResolvedValue([fil({ ultimSeq: 5, noLlegits: 5 })]);
    mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 5, rebutFinsSeq: 5 });
    await open();
    expect(value.chatThreads[0].noLlegits).toBe(5);
    expect(value.totalNoLlegits).toBe(5);
    vi.useFakeTimers();
    act(() => { value.marcaVist('fil-A', 3); value.marcaVist('fil-A', 5); value.marcaVist('fil-A', 4); });
    expect(value.chatThreads[0].llegitFinsSeq).toBe(5);
    expect(value.chatThreads[0].noLlegits).toBe(0);
    expect(value.totalNoLlegits).toBe(0);
    expect(mock.marcaLlegit).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1999); });
    expect(mock.marcaLlegit).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    expect(mock.marcaLlegit).toHaveBeenCalledWith('fil-A', expect.objectContaining({ llegitFinsSeq: 5, tenantId: '00000000-0000-0000-0000-00000000000a' }));
    act(() => value.marcaVist('fil-A', 2));
    await act(async () => { await vi.advanceTimersByTimeAsync(2500); });
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('suma els no llegits de les converses ni silenciades ni arxivades, exposa scopeKey i no formata hores', async () => {
    mock.loadFils.mockResolvedValue([
      fil({ noLlegits: 2 }),
      fil({ id: 'fil-B', titol: 'B', noLlegits: 3, silenciatFinsAl: '2999-01-01T00:00:00Z' }),
      fil({ id: 'fil-C', titol: 'C', noLlegits: 4, arxivatAl: '2026-01-01T00:00:00Z' })
    ]);
    render(tree({ backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' }));
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.totalNoLlegits).toBe(2);
    expect(value.chatThreads.map(f => f.id)).toEqual(['fil-A', 'fil-B', 'fil-C']);
    expect(value.chatThreads[1].silenciat).toBe(true);
    expect(value.chatThreads[2].arxivat).toBe(true);
    expect(value.chatThreads[0].ultimAl).toBe('2026-09-24T10:00:00Z');
    expect(value.chatThreads[0]).not.toHaveProperty('lastMessageTime');
    expect(typeof value.scopeKey).toBe('string');
    expect(value.scopeKey).toContain('00000000-0000-0000-0000-00000000000a');
    expect(value.scopeKey).toContain('persona::A');
  });

  it('T68 · marcaLlegides marca diverses converses: la marca agrupada, i el «no llegit» manual a l’instant', async () => {
    mock.loadFils.mockResolvedValue([
      fil({ ultimSeq: 5, noLlegits: 5 }),
      fil({ id: 'fil-B', titol: 'B', ultimSeq: 2, llegitFinsSeq: 2, noLlegits: 0, noLlegitManual: true }),
      fil({ id: 'fil-C', titol: 'C', ultimSeq: 1, llegitFinsSeq: 1, noLlegits: 0 })
    ]);
    mock.marcaLlegit.mockImplementation(async (_, c) => ({ llegitFinsSeq: c.llegitFinsSeq, rebutFinsSeq: c.llegitFinsSeq }));
    render(tree({ tenantId: '00000000-0000-0000-0000-00000000000a' }));
    await waitFor(() => expect(value.status).toBe('ready'));
    vi.useFakeTimers();
    let marcades;
    act(() => { marcades = value.marcaLlegides(['fil-A', 'fil-B', 'fil-C', 'no-hi-es']); });
    expect(marcades).toBe(2);
    const perId = (id) => value.chatThreads.find(f => f.id === id);
    expect(perId('fil-A').noLlegits).toBe(0);
    expect(perId('fil-B').noLlegitManual).toBe(false);
    expect(mock.marcaLlegit).toHaveBeenCalledWith('fil-B', expect.objectContaining({ llegitFinsSeq: 2 }));
    expect(mock.marcaLlegit).not.toHaveBeenCalledWith('fil-A', expect.anything());
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(mock.marcaLlegit).toHaveBeenCalledWith('fil-A', expect.objectContaining({ llegitFinsSeq: 5 }));
    expect(mock.marcaLlegit).not.toHaveBeenCalledWith('fil-C', expect.anything());
    vi.useRealTimers();
    expect(value.marcaLlegides([])).toBe(0);
  });

  it('avisa amb el nom de qui escriu quan la persona no és al xat (XAT-J01), una sola vegada per seq', async () => {
    mock.pathname = '/mur';
    render(tree({ tenantId: '00000000-0000-0000-0000-00000000000a' }));
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(mock.showToast).not.toHaveBeenCalled();
    mock.loadFils.mockResolvedValue([fil({ titol: 'Pepa', ultimSeq: 3, noLlegits: 3, ultimAutorId: 'X', ultimText: 'text privat' })]);
    await act(async () => { await value.recarrega(); });
    expect(mock.showToast).toHaveBeenCalledTimes(1);
    expect(mock.showToast.mock.calls[0][0]).toContain('Pepa');
    expect(mock.showToast.mock.calls[0][0]).not.toContain('text privat');
    await act(async () => { await value.recarrega(); });
    expect(mock.showToast).toHaveBeenCalledTimes(1);
    mock.loadFils.mockResolvedValue([fil({ titol: 'Pepa', ultimSeq: 4, noLlegits: 0, ultimAutorId: 'A' })]);
    await act(async () => { await value.recarrega(); });
    expect(mock.showToast).toHaveBeenCalledTimes(1);
  });
});

describe('xat de pàgina i comunitats (T63.2, T67)', () => {
  const PUBLICACIO = { tipus: 'publicacio', id: 'p-1', titol: 'Festa', ruta: '/mur/p-1' };
  const SUBJECTE = { tipus: 'entitat', id: 'org-1', ruta: '/empresa/org-1', titol: 'Coop' };
  const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
  async function muntat(config = CONFIG) {
    const view = render(tree(config));
    await waitFor(() => expect(value.status).toBe('ready'));
    return view;
  }
  /* El que torna el port en remot: tres fils que encara no has escrit. */
  const comunitatVisitada = () => ({
    filId: 'g-1',
    fils: [
      { id: 'c-1', tipus: 'comunitat', titol: 'Coop', comunitatId: null, subjecte: SUBJECTE, participant: false },
      { id: 'a-1', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-1', subjecte: SUBJECTE, participant: false, ultimSeq: 1 },
      { id: 'g-1', tipus: 'grup', titol: 'General', comunitatId: 'c-1', subjecte: SUBJECTE, participant: false, ultimSeq: 3 }
    ]
  });

  it('obri el fil de la pàgina pel port, recarrega la llista i en torna l’id', async () => {
    await muntat();
    mock.obriFilDePagina.mockResolvedValue({ filId: 'g-9', fils: [{ id: 'g-9', tipus: 'grup', titol: 'Festa', participant: true }] });
    mock.loadFils.mockResolvedValue([fil(), { id: 'g-9', tipus: 'grup', titol: 'Festa', altresNoms: [], subjecte: { tipus: 'publicacio', id: 'p-1' } }]);
    const carregues = mock.loadFils.mock.calls.length;
    let filId;
    await act(async () => { filId = await value.obriFilDePagina(PUBLICACIO); });
    expect(filId).toBe('g-9');
    expect(mock.teCapacitat).toHaveBeenCalledWith('xatDePagina');
    expect(mock.obriFilDePagina).toHaveBeenCalledWith(PUBLICACIO, expect.objectContaining({ tenantId: '00000000-0000-0000-0000-00000000000a', signal: expect.any(AbortSignal) }));
    expect(mock.loadFils.mock.calls.length).toBe(carregues + 1);
    expect(value.chatThreads.find(f => f.id === 'g-9')).toMatchObject({ esGrup: true, participant: true, subjecte: { tipus: 'publicacio', id: 'p-1' } });
  });

  it('un subjecte sense xat torna null i, sense la capacitat, rebutja amb codi sense-capacitat', async () => {
    await muntat();
    for (const objecte of [{ tipus: 'nota', id: 'n-1' }, { tipus: 'persona', id: 'B' }, { tipus: 'ia', id: 'iaia' }, { tipus: 'publicacio', id: '' }]) {
      await expect(value.obriFilDePagina(objecte)).resolves.toBeNull();
    }
    mock.teCapacitat.mockReturnValue(false);
    await expect(value.obriFilDePagina(PUBLICACIO)).rejects.toMatchObject({ codi: 'sense-capacitat' });
    expect(mock.obriFilDePagina).not.toHaveBeenCalled();
  });

  it('els fils que encara no has escrit es lligen com a visitant, sense marques, i el primer missatge hi entra', async () => {
    await muntat();
    mock.obriFilDePagina.mockResolvedValue(comunitatVisitada());
    await act(async () => { expect(await value.obriFilDePagina({ tipus: 'entitat', id: 'org-1' })).toBe('g-1'); });
    expect(value.chatThreads.map(f => [f.id, f.participant])).toEqual([['fil-A', true], ['c-1', false], ['a-1', false], ['g-1', false]]);
    expect(value.comunitats).toHaveLength(1);
    expect(value.comunitats[0].fil.id).toBe('c-1');
    expect(value.comunitats[0].fills.map(f => f.id)).toEqual(['a-1', 'g-1']);
    /* La recàrrega periòdica no se'ls endú: encara no hi participes. */
    await act(async () => { await value.recarrega(); });
    expect(value.chatThreads.some(f => f.id === 'g-1')).toBe(true);
    expect(value.totalNoLlegits).toBe(2);

    mock.loadMissatges.mockResolvedValue([message('comentari', 'm-g', { filId: 'g-1', usuariId: 'X', seq: 3 })]);
    act(() => value.obriFil('g-1'));
    await waitFor(() => expect(value.getThreadMessages('g-1')[0]?.text).toBe('comentari'));
    expect(mock.loadMissatges).toHaveBeenCalledWith('g-1', expect.objectContaining({ visitant: true }));
    vi.useFakeTimers();
    act(() => value.marcaVist('g-1', 3));
    await act(async () => { await vi.advanceTimersByTimeAsync(2500); });
    vi.useRealTimers();
    expect(mock.marcaLlegit).not.toHaveBeenCalled();

    mock.enviaMissatge.mockImplementationOnce(async (_, cos) => message(cos.text, cos.id, { filId: 'g-1', seq: 4 }));
    mock.loadFils.mockResolvedValue([fil(), { id: 'g-1', tipus: 'grup', titol: 'General', comunitatId: 'c-1', altresNoms: [], ultimSeq: 4, llegitFinsSeq: 4 }]);
    await act(async () => { await value.sendChatMessage({ id: 'g-1' }, 'Hola'); });
    expect(mock.enviaMissatge).toHaveBeenLastCalledWith('g-1', expect.objectContaining({ text: 'Hola' }), expect.objectContaining({ visitant: true }));
    await waitFor(() => expect(value.chatThreads.find(f => f.id === 'g-1').participant).toBe(true));
    mock.enviaMissatge.mockImplementationOnce(async (_, cos) => message(cos.text, cos.id, { filId: 'g-1', seq: 5 }));
    await act(async () => { await value.sendChatMessage({ id: 'g-1' }, 'Segon'); });
    expect(mock.enviaMissatge.mock.calls.at(-1)[2]).not.toHaveProperty('visitant');
  });

  it('descarta una obertura tardana en canviar de scope i no hi deixa cap visitant', async () => {
    const view = await muntat();
    const tard = deferred(); mock.obriFilDePagina.mockReturnValueOnce(tard.promise);
    let promesa;
    act(() => { promesa = value.obriFilDePagina(PUBLICACIO); });
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    view.rerender(tree(CONFIG));
    await act(async () => {
      tard.resolve({ filId: 'g-1', fils: [{ id: 'g-1', tipus: 'grup', participant: false }] });
      expect(await promesa).toBeNull();
    });
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.chatThreads.some(f => f.id === 'g-1')).toBe(false);
  });

  it('deriva les comunitats (Avisos primer, suma de no llegits) i els contactes freqüents dels directes', async () => {
    mock.loadFils.mockResolvedValue([
      { id: 'c-1', tipus: 'comunitat', titol: 'Coop', altresNoms: [] },
      { id: 'g-1', tipus: 'grup', titol: 'General', comunitatId: 'c-1', altresNoms: [], ultimSeq: 2, noLlegits: 2, ultimAl: '2026-09-28T11:00:00Z' },
      { id: 'a-1', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-1', altresNoms: [], ultimSeq: 1, noLlegits: 1, ultimAl: '2026-09-28T10:00:00Z' },
      { id: 'd-1', tipus: 'directe', altresNoms: ['Pepa'], altres: [{ id: 'P', nom: 'Pepa', tipus: 'persona', avatarUrl: null }], ultimAl: '2026-09-27T00:00:00Z' },
      { id: 'd-2', tipus: 'directe', altresNoms: ['Toni'], altres: [{ id: 'T', nom: 'Toni', tipus: 'persona', avatarUrl: '/t.png' }], ultimAl: '2026-09-28T00:00:00Z' }
    ]);
    await muntat();
    expect(value.comunitats).toHaveLength(1);
    expect(value.comunitats[0]).toMatchObject({ noLlegits: 3, ultimAl: '2026-09-28T11:00:00Z' });
    expect(value.comunitats[0].fills.map(f => f.id)).toEqual(['a-1', 'g-1']);
    expect(value.contactesFrequents).toEqual([
      { usuari_id: 'T', nom: 'Toni', tipus: 'persona', avatar_url: '/t.png', fil_id: 'd-2' },
      { usuari_id: 'P', nom: 'Pepa', tipus: 'persona', avatar_url: null, fil_id: 'd-1' }
    ]);
  });

  it('fora del proveïdor, els valors per defecte són segurs', async () => {
    render(<Probe />);
    await expect(value.obriFilDePagina(PUBLICACIO)).resolves.toBeNull();
    expect(value.comunitats).toEqual([]);
    expect(value.contactesFrequents).toEqual([]);
    expect(value.marcaLlegides(['fil-A'])).toBe(0);
    expect(value.joId).toBeNull();
  });

  /* Onada 3 · La interfície necessita saber qui és «jo»: la cerca no el troba
     a ell mateix, «Nova conversa» el pinta amb «(Tu)» (amb el nom de la
     persona, no el de l'entitat amb què actua) i, sense ningú (remot sense
     sessió, ja comprovada), ?sobre= porta a /registre. Mai es veu el jo d'un
     altre scope. */
  it('exposa joId, joNom i joAvatar de la persona del scope visible; senseSessio només amb la sessió ja comprovada', async () => {
    mock.identitats = [
      { tipus: 'persona', id: 'A', nom: 'Pepa Soler', avatar: '/assets/pepa.jpg' },
      { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre', avatar: '/assets/forn.jpg' }
    ];
    const view = await muntat();
    expect(value.joId).toBe('A');
    expect(value.joNom).toBe('Pepa Soler');
    expect(value.joAvatar).toBe('/assets/pepa.jpg');
    mock.identitats = [{ tipus: 'persona', id: 'B', nom: 'Altra persona', avatar: '/assets/altra.jpg' }, ...mock.identitats];
    mock.actorKey = 'entitat::o-1';
    view.rerender(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.joAvatar).toBe('/assets/pepa.jpg');
    expect(value.senseSessio).toBe(false);

    mock.session = { currentUser: null, generacio: 2, estat: 'comprovant' };
    snapshots = [];
    view.rerender(tree(CONFIG));
    expect(snapshots[0].joId).toBeNull();
    expect(snapshots[0].joNom).toBeNull();
    expect(snapshots[0].joAvatar).toBeNull();
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.joId).toBeNull();
    expect(value.senseSessio).toBe(false);

    mock.session = { currentUser: null, generacio: 2, estat: 'fora' };
    view.rerender(tree(CONFIG));
    expect(value.senseSessio).toBe(true);
  });
});
