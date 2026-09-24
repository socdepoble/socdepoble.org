import React, { StrictMode, useEffect, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A',
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const message = (text, id = 'm-A') => ({ id, filId: 'fil-A', usuariId: 'A', text, creatAl: '2026-09-24T10:00:00Z' });
let value, snapshots;
function Probe() {
  value = useXat();
  useLayoutEffect(() => { snapshots.push({ ...value }); });
  return null;
}
function tree(config) { return <StrictMode><XatProvider config={config}><Probe /></XatProvider></StrictMode>; }
async function open(config = { backendId: 'supabase', tenantId: 'poble-A' }) {
  const view = render(tree(config));
  await waitFor(() => expect(value.status).toBe('ready'));
  act(() => value.obriFil('fil-A'));
  await waitFor(() => expect(value.chatMessages[0]?.text).toBe('secret-A'));
  return { ...view, config };
}
beforeEach(() => {
  vi.clearAllMocks(); snapshots = [];
  mock.session = { currentUser: { id: 'A' }, generacio: 1 }; mock.actorKey = 'persona::A';
  mock.loadFils.mockResolvedValue([{ id: 'fil-A', titol: 'A', altresNoms: [], noLlegits: 2 }]);
  mock.loadMissatges.mockResolvedValue([message('secret-A')]);
  mock.marcaLlegit.mockResolvedValue(null);
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub-A' });
  mock.unsubscribeFromXat.mockResolvedValue(null);
});
afterEach(cleanup);

describe('confidencialitat del scope del Xat', () => {
  it('oculta i purga A en logout abans dels efectes, també en entrar B', async () => {
    const view = await open(); const old = value;
    mock.session = { currentUser: null, generacio: 2 };
    snapshots = []; view.rerender(tree(view.config));
    expect(snapshots[0].chatMessages).toEqual([]);
    expect(snapshots[0].chatThreads).toEqual([]);
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
    if (change === 'tenant') config = { ...config, tenantId: 'poble-B' };
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
    mock.marcaLlegit.mockClear(); mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    view.rerender(tree(view.config));
    await act(async () => late.resolve([message('tarda') ]));
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
    const realtime = mock.subscribeToXat.mock.calls.at(-1)[1];
    mock.session = { currentUser: { id: 'B' }, generacio: 2 }; view.rerender(tree(view.config));
    await act(async () => {
      lateSend.resolve(message('pendent')); lateMembers.resolve([{ id: 'A' }]); lateThread.resolve('fil-A');
      realtime(null, { id: 'rt-A', fil_id: 'fil-A', usuari_id: 'X', text: 'secret realtime' });
      expect(await send).toEqual([]); expect(await members).toEqual([]); expect(await thread).toBeNull();
    });
    expect(value.chatMessages).toEqual([]); expect(value.getThreadMessages('fil-A')).toEqual([]);
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
    const config = { tenantId: 'poble' };
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
    expect(await old.sendChatMessage({ id: 'fil-A' }, 'fora')).toEqual([]);
    expect(await old.cercaMembres()).toEqual([]);
    expect(await old.creaFil('B')).toBeNull();
    expect(mock.enviaMissatge).not.toHaveBeenCalled();
    expect(mock.carregaMembres).not.toHaveBeenCalled();
    expect(mock.creaFilDirecte).not.toHaveBeenCalled();
  });

  it('desconnecta una subscripció que es resol després del logout', async () => {
    const sub = deferred(); mock.subscribeToXat.mockReturnValueOnce(sub.promise);
    const view = await open();
    mock.session = { currentUser: null, generacio: 2 }; view.rerender(tree(view.config));
    await act(async () => sub.resolve({ subscription: 'sub-tardana' }));
    expect(mock.unsubscribeFromXat).toHaveBeenCalledWith('sub-tardana');
  });
});
