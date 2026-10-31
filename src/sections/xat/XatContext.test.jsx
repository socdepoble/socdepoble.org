import React, { StrictMode, useEffect, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';
import { ambXatsPerDefecte } from '../../data/xatsPerDefecte.js';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A', pathname: '/xat', showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
/* Pla 261014_1450 (front C) · `actor` és el d'IdentitatContext que pinta la
   barra negra; sense valor, com fins ara (cap entitat activa). */
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: mock.identitats, actor: mock.actor }) }));
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
  mock.session = { currentUser: { id: 'A' }, generacio: 1 }; mock.actorKey = 'persona::A'; mock.identitats = undefined; mock.actor = undefined;
  mock.loadFils.mockResolvedValue([fil()]);
  mock.loadMissatges.mockResolvedValue([message('secret-A')]);
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub-A', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('confidencialitat del scope del Xat', () => {
  it('captura un rebuig tardà de la baixa després de desmuntar', async () => {
    const view = await open();
    const pendent = deferred();
    const causa = Object.assign(new Error('No s’ha pogut tancar el canal.'), { code: 'CANAL_NO_TANCAT', retriable: true });
    const avisa = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      mock.unsubscribeFromXat.mockReturnValueOnce(pendent.promise);
      view.unmount();
      expect(mock.unsubscribeFromXat).toHaveBeenLastCalledWith('sub-A');
      await act(async () => { pendent.reject(causa); });
      expect(avisa).toHaveBeenCalledWith('[Xat] No s’ha pogut tancar el canal de temps real.', causa);
    } finally { avisa.mockRestore(); }
  });

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

  it.each(['tenant', 'backend', 'actor'])('invalida %s mantenint el mateix usuari', async change => {
    const view = await open();
    const signal = mock.loadMissatges.mock.calls.at(-1)[1].signal;
    let config = view.config;
    if (change === 'tenant') config = { ...config, tenantId: '00000000-0000-0000-0000-00000000000b' };
    if (change === 'backend') config = { ...config, backendId: 'altre' };
    if (change === 'actor') mock.actorKey = 'entitat::associacio';
    snapshots = []; view.rerender(tree(config));
    expect(snapshots[0].chatMessages).toEqual([]);
    expect(snapshots[0].filActiu).toBeNull();
    expect(signal.aborted).toBe(true);
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.getThreadMessages('fil-A')).toEqual([]);
  });

  /* Decisió 1 del Mestre (261007) · «Bombolles del xat: S'HAN DE CONSERVAR.
     La desaparició de l'historial del xat cada hora en renovar-se la sessió
     destrossa l'experiència.» 'generacio' (la renovació del JWT) i 'config'
     (una config nova del mateix backend) eren dos casos de la prova de dalt,
     que fixava la purga; ja no són un altre àmbit i fixen el contrari: les
     operacions en vol s'avorten i se'n llancen de noves amb el testimoni nou
     (la llista, el fil obert per seq i el canal), i cap render no perd la
     conversa ni el fil obert. */
  it.each(['generacio', 'config'])('Decisió 1 · %s nou del mateix àmbit avorta les operacions i conserva el fil obert i els missatges', async change => {
    const view = await open();
    const signal = mock.loadMissatges.mock.calls.at(-1)[1].signal;
    const subscripcions = mock.subscribeToXat.mock.calls.length;
    const llistes = mock.loadFils.mock.calls.length;
    let config = view.config;
    if (change === 'config') config = { ...config };
    if (change === 'generacio') mock.session = { ...mock.session, generacio: 2 };
    snapshots = []; view.rerender(tree(config));
    expect(snapshots.length).toBeGreaterThan(0);
    for (const s of snapshots) {
      expect(s.chatMessages.map((m) => m.text)).toEqual(['secret-A']);
      expect(s.filActiu).toBe('fil-A');
      expect(s.status).toBe('ready');
      expect(s.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
    }
    expect(signal.aborted).toBe(true);
    await waitFor(() => expect(mock.subscribeToXat.mock.calls.length).toBeGreaterThan(subscripcions));
    expect(mock.unsubscribeFromXat).toHaveBeenCalledWith('sub-A');
    expect(mock.loadFils.mock.calls.length).toBeGreaterThan(llistes);
    const darrera = mock.loadMissatges.mock.calls.at(-1);
    expect(darrera).toEqual(['fil-A', expect.objectContaining({ despresDeSeq: 1 })]);
    expect(darrera[1].signal).not.toBe(signal);
    expect(darrera[1].signal.aborted).toBe(false);
    expect(value.getThreadMessages('fil-A').map((m) => m.text)).toEqual(['secret-A']);
    expect(value.filActiu).toBe('fil-A');
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

  /* Onada 6 · Revisió 261009 · La bombolla en error porta el codi SDP
     (codiError) perquè Bombolla el diga en la llengua de la interfície
     (errorsXat.js); el reintent manual el neteja amb l'error. */
  it('deixa el codi SDP a la bombolla en error (codiError) i el reintent manual el neteja', async () => {
    await open();
    const error = Object.assign(new Error('Esta pàgina ja no existix o no la pots vore.'), { code: 'SDP-XAT-013', retriable: false });
    mock.enviaMissatge.mockRejectedValueOnce(error);
    await act(async () => { await value.sendChatMessage({ id: 'fil-A' }, 'hola'); });
    const fallit = value.getThreadMessages('fil-A').at(-1);
    expect(fallit).toMatchObject({ estatEnviament: 'error', codiError: 'SDP-XAT-013', error: 'Esta pàgina ja no existix o no la pots vore.' });
    /* Un error sense codi no n'inventa cap. */
    mock.enviaMissatge.mockRejectedValueOnce(Object.assign(new Error('xarxa'), { retriable: false }));
    await act(async () => { await value.sendChatMessage({ id: 'fil-A' }, 'adeu'); });
    expect(value.getThreadMessages('fil-A').at(-1)).toMatchObject({ estatEnviament: 'error', codiError: null, error: 'xarxa' });
    const pendent = deferred();
    mock.enviaMissatge.mockReturnValueOnce(pendent.promise);
    let reintent;
    act(() => { reintent = value.reintenta(fallit.id); });
    expect(value.getThreadMessages('fil-A').find(m => m.id === fallit.id)).toMatchObject({ estatEnviament: 'pendent', codiError: null, error: null });
    await act(async () => { pendent.resolve(message('hola', fallit.id, { seq: 5 })); await reintent; });
    expect(value.getThreadMessages('fil-A').find(m => m.id === fallit.id).estatEnviament).toBe('enviat');
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

/* Decisió 1 del Mestre (261007) · «Bombolles del xat: S'HAN DE CONSERVAR. […]
   L'estat local ha de mantenir la continuïtat de la conversa malgrat la
   renovació del token (JWT).» Una renovació és la mateixa persona amb
   generacio+1 (auth.js → identitat.js:versioSessio → sessionService.js). */
describe('Decisió 1 · la conversa sobreviu a la renovació del JWT', () => {
  const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
  const renova = (view, config = view.config || CONFIG) => {
    mock.session = { ...mock.session, generacio: (mock.session.generacio || 0) + 1 };
    view.rerender(tree(config));
  };
  /* Totes les promeses ja resoltes han acabat la seua cadena. */
  const buidaCua = () => act(async () => { await new Promise((resol) => setTimeout(resol, 0)); });
  const avortat = () => Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' });
  /* Relleu 261007 (revisió de seguretat de la Decisió 1, problema 1) · Obri
     la finestra entre la comprovació del relleu i la continuació de qui
     l'espera. `senyal` és el de l'operació viva (la de la renovació): la
     primera lectura de `aborted` que el troba viu és la de relleuViu, i en
     eixe moment es programa, en una microtasca, l'entrada de B dins de
     flushSync. Eixa microtasca s'executa abans que la continuació de
     despresDelRelleu o d'enviaMarca. Torna si el canvi ja s'ha fet.
     Relleu 261007 (revisió de la correcció de seguretat, problema 2) · El
     canvi és `aplica`: l'entrada de B o una segona renovació. */
  const armaCanviEnLaFinestra = (view, senyal, aplica, config = view.config || CONFIG) => {
    let armat = true;
    Object.defineProperty(senyal, 'aborted', {
      configurable: true,
      get() {
        const real = Reflect.get(Object.getPrototypeOf(senyal), 'aborted', senyal);
        if (armat && !real) {
          armat = false;
          Promise.resolve().then(() => flushSync(() => {
            aplica();
            view.rerender(tree(config));
          }));
        }
        return real;
      }
    });
    return () => !armat;
  };
  const armaCanviDePersona = (view, senyal, config) => armaCanviEnLaFinestra(view, senyal, () => {
    mock.session = { currentUser: { id: 'B' }, generacio: 9 }; mock.actorKey = 'persona::B';
  }, config);
  const armaSegonaRenovacio = (view, senyal, config) => armaCanviEnLaFinestra(view, senyal, () => {
    mock.session = { ...mock.session, generacio: (mock.session.generacio || 0) + 1 };
  }, config);

  it('una bombolla en error sobreviu a la renovació i «Torna-ho a provar» la reenvia amb el mateix id', async () => {
    const view = await open();
    mock.enviaMissatge.mockRejectedValueOnce(Object.assign(new Error('SDP-XAT-500: el servidor no respon'), { retriable: false }));
    await act(async () => { await value.sendChatMessage({ id: 'fil-A' }, 'Demà a les 8 al bancal'); });
    const fallit = value.getThreadMessages('fil-A').at(-1);
    expect(fallit).toMatchObject({ estatEnviament: 'error', text: 'Demà a les 8 al bancal' });
    renova(view);
    await buidaCua();
    expect(value.getThreadMessages('fil-A').find((m) => m.id === fallit.id))
      .toMatchObject({ estatEnviament: 'error', text: 'Demà a les 8 al bancal', error: 'SDP-XAT-500: el servidor no respon' });
    mock.enviaMissatge.mockImplementationOnce(async (_, cos) => message(cos.text, cos.id, { seq: 7 }));
    let resultat;
    await act(async () => { resultat = await value.reintenta(fallit.id); });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(2);
    expect(mock.enviaMissatge.mock.calls[1][1]).toEqual({ id: fallit.id, text: 'Demà a les 8 al bancal' });
    expect(mock.enviaMissatge.mock.calls[1][2].signal.aborted).toBe(false);
    expect(resultat[0]).toMatchObject({ id: fallit.id, seq: 7 });
    expect(value.getThreadMessages('fil-A').filter((m) => m.id === fallit.id))
      .toEqual([expect.objectContaining({ estatEnviament: 'enviat', seq: 7 })]);
  });

  it('un enviament en vol quan es renova passa a error sense desaparéixer ni un render i es reintenta amb el mateix id', async () => {
    const view = await open();
    const enVol = deferred(); mock.enviaMissatge.mockReturnValueOnce(enVol.promise);
    let promesa;
    act(() => { promesa = value.sendChatMessage({ id: 'fil-A' }, 'just ara'); });
    const id = value.getThreadMessages('fil-A').at(-1).id;
    const senyal = mock.enviaMissatge.mock.calls[0][2].signal;
    snapshots = []; renova(view);
    expect(senyal.aborted).toBe(true);
    expect(snapshots.length).toBeGreaterThan(0);
    expect(snapshots.every((s) => s.chatMessages.some((m) => m.id === id && m.text === 'just ara'))).toBe(true);
    /* error: null → la bombolla diu el «No s'ha enviat» traduït de sempre. */
    expect(value.getThreadMessages('fil-A').find((m) => m.id === id)).toMatchObject({ estatEnviament: 'error', text: 'just ara', error: null });
    await act(async () => { enVol.reject(avortat()); expect(await promesa).toEqual([]); });
    expect(value.getThreadMessages('fil-A').find((m) => m.id === id).estatEnviament).toBe('error');
    mock.enviaMissatge.mockImplementationOnce(async (_, cos) => message(cos.text, cos.id, { seq: 3 }));
    await act(async () => { await value.reintenta(id); });
    expect(mock.enviaMissatge.mock.calls.map((c) => c[1].id)).toEqual([id, id]);
    expect(value.getThreadMessages('fil-A').filter((m) => m.id === id))
      .toEqual([expect.objectContaining({ estatEnviament: 'enviat', seq: 3 })]);
  });

  /* Relleu 261007 (revisió adversarial) · L'escenari dels verificadors: un
     missatge que esperava el reintent automàtic (1-4 s, esperaReintent) quan
     arriba la renovació. Durant l'espera la bombolla és 'pendent'; l'abort
     talla l'espera, la bombolla passa a 'error' i ja no es reintenta sola amb
     el testimoni vell. «Torna-ho a provar» la reenvia amb el mateix id. */
  it('un enviament que espera el reintent automàtic quan es renova passa a error i no es reintenta sol', async () => {
    const view = await open();
    mock.enviaMissatge.mockRejectedValueOnce(Object.assign(new Error('xarxa'), { retriable: true }));
    vi.useFakeTimers();
    let promesa;
    act(() => { promesa = value.sendChatMessage({ id: 'fil-A' }, 'esperant'); });
    const id = value.getThreadMessages('fil-A').at(-1).id;
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    expect(value.getThreadMessages('fil-A').find((m) => m.id === id).estatEnviament).toBe('pendent');
    renova(view);
    expect(value.getThreadMessages('fil-A').find((m) => m.id === id))
      .toMatchObject({ estatEnviament: 'error', text: 'esperant', error: null });
    await act(async () => { expect(await promesa).toEqual([]); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    expect(value.getThreadMessages('fil-A').find((m) => m.id === id).estatEnviament).toBe('error');
    vi.useRealTimers();
    mock.enviaMissatge.mockImplementationOnce(async (_, cos) => message(cos.text, cos.id, { seq: 3 }));
    await act(async () => { await value.reintenta(id); });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(2);
    expect(mock.enviaMissatge.mock.calls[1][1]).toEqual({ id, text: 'esperant' });
    expect(mock.enviaMissatge.mock.calls[1][2].signal.aborted).toBe(false);
    expect(value.getThreadMessages('fil-A').filter((m) => m.id === id))
      .toEqual([expect.objectContaining({ estatEnviament: 'enviat', seq: 3 })]);
  });

  it('si el servidor ja tenia l’enviament tallat, la lectura del testimoni nou retira la bombolla en error (retiraConfirmats)', async () => {
    const view = await open();
    const enVol = deferred(); mock.enviaMissatge.mockReturnValueOnce(enVol.promise);
    act(() => { value.sendChatMessage({ id: 'fil-A' }, 'ja hi era'); });
    const id = value.getThreadMessages('fil-A').at(-1).id;
    mock.loadMissatges.mockResolvedValue([message('ja hi era', id, { seq: 2 })]);
    renova(view);
    await waitFor(() => expect(value.getThreadMessages('fil-A').filter((m) => m.id === id))
      .toEqual([expect.objectContaining({ estatEnviament: 'enviat', seq: 2 })]));
    expect(mock.loadMissatges).toHaveBeenLastCalledWith('fil-A', expect.objectContaining({ despresDeSeq: 1 }));
    expect(value.getThreadMessages('fil-A').map((m) => m.text)).toEqual(['secret-A', 'ja hi era']);
    await act(async () => { enVol.reject(avortat()); });
  });

  it.each(['persona', 'actor'])('un canvi de %s continua purgant-ho tot, també les bombolles en error (ARQ-H01)', async (canvi) => {
    const view = await open();
    mock.enviaMissatge.mockRejectedValueOnce(Object.assign(new Error('no'), { retriable: false }));
    await act(async () => { await value.sendChatMessage({ id: 'fil-A' }, 'privat'); });
    const fallit = value.getThreadMessages('fil-A').at(-1);
    expect(fallit.estatEnviament).toBe('error');
    const old = value;
    if (canvi === 'persona') { mock.session = { currentUser: { id: 'B' }, generacio: 2 }; mock.actorKey = 'persona::B'; }
    else mock.actorKey = 'entitat::associacio';
    snapshots = []; view.rerender(tree(view.config));
    expect(snapshots[0].chatMessages).toEqual([]);
    expect(snapshots[0].chatThreads).toEqual([]);
    expect(snapshots[0].filActiu).toBeNull();
    expect(old.getThreadMessages('fil-A')).toEqual([]);
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.getThreadMessages('fil-A')).toEqual([]);
    expect(value.filActiu).toBeNull();
    await act(async () => {
      expect(await old.reintenta(fallit.id)).toEqual([]);
      expect(await value.reintenta(fallit.id)).toEqual([]);
    });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
  });

  it('l’historial cap arrere que la renovació talla es torna a demanar sense eixir de «carregant» i les pàgines carregades es queden', async () => {
    const pagina = Array.from({ length: 50 }, (_, i) => message(`m${51 + i}`, `id-${51 + i}`, { seq: 51 + i }));
    const antics = Array.from({ length: 10 }, (_, i) => message(`m${41 + i}`, `id-${41 + i}`, { seq: 41 + i }));
    const vella = deferred(), nova = deferred();
    const respostes = [vella.promise, nova.promise];
    mock.loadMissatges.mockImplementation((_, o) => (o.abansDeSeq != null ? respostes.shift() : Promise.resolve(pagina)));
    const anticsDemanats = () => mock.loadMissatges.mock.calls.filter(([, o]) => o.abansDeSeq != null).map(([, o]) => o);
    const view = render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    act(() => value.obriFil('fil-A'));
    await waitFor(() => expect(value.getThreadMessages('fil-A')).toHaveLength(50));
    act(() => { value.carregaMesAntics('fil-A'); });
    await waitFor(() => expect(value.carregantAntics('fil-A')).toBe(true));
    expect(anticsDemanats()).toHaveLength(1);
    renova(view);
    await waitFor(() => expect(anticsDemanats()).toHaveLength(2));
    const [primera, segona] = anticsDemanats();
    expect(primera.signal.aborted).toBe(true);
    expect(segona).toMatchObject({ abansDeSeq: 51, limit: 50 });
    expect(segona.signal.aborted).toBe(false);
    expect(value.carregantAntics('fil-A')).toBe(true);
    expect(value.getThreadMessages('fil-A')).toHaveLength(50);
    /* La resposta tardana de l'operació avortada no entra ni apaga «carregant». */
    await act(async () => { vella.resolve(antics.slice(0, 5)); });
    expect(value.getThreadMessages('fil-A')).toHaveLength(50);
    expect(value.carregantAntics('fil-A')).toBe(true);
    await act(async () => { nova.resolve(antics); });
    await waitFor(() => expect(value.getThreadMessages('fil-A')).toHaveLength(60));
    expect(value.carregantAntics('fil-A')).toBe(false);
    expect(value.hiHaMesAntics('fil-A')).toBe(false);
  });

  /* Relleu 261007 (revisió adversarial) · La cursa fràgil del canvi: al
     navegador, el fetch avortat rebutja a l'instant i el `finally` de
     l'operació vella no ha d'esborrar l'entrada que el relleu torna a demanar;
     si l'esborrara abans, «carregant» es quedaria encés per sempre i no
     eixiria cap segona petició. */
  it('l’historial tallat que rebutja en avortar-se (com fetch) es torna a demanar, sense avís, i «carregant» s’apaga en arribar', async () => {
    const pagina = Array.from({ length: 50 }, (_, i) => message(`m${51 + i}`, `id-${51 + i}`, { seq: 51 + i }));
    const antics = Array.from({ length: 10 }, (_, i) => message(`m${41 + i}`, `id-${41 + i}`, { seq: 41 + i }));
    const nova = deferred();
    let primera = true;
    mock.loadMissatges.mockImplementation((_, o) => {
      if (o.abansDeSeq == null) return Promise.resolve(pagina);
      if (!primera) return nova.promise;
      primera = false;
      return new Promise((_resol, rebutja) => {
        o.signal.addEventListener('abort', () => rebutja(avortat()), { once: true });
      });
    });
    const anticsDemanats = () => mock.loadMissatges.mock.calls.filter(([, o]) => o.abansDeSeq != null).map(([, o]) => o);
    const view = render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    act(() => value.obriFil('fil-A'));
    await waitFor(() => expect(value.getThreadMessages('fil-A')).toHaveLength(50));
    act(() => { value.carregaMesAntics('fil-A'); });
    await waitFor(() => expect(anticsDemanats()).toHaveLength(1));
    expect(value.carregantAntics('fil-A')).toBe(true);
    renova(view);
    await waitFor(() => expect(anticsDemanats()).toHaveLength(2));
    await buidaCua();
    const [primeraPeticio, segona] = anticsDemanats();
    expect(primeraPeticio.signal.aborted).toBe(true);
    expect(segona).toMatchObject({ abansDeSeq: 51, limit: 50 });
    expect(segona.signal.aborted).toBe(false);
    expect(value.carregantAntics('fil-A')).toBe(true);
    expect(value.avis).toBeNull();
    await act(async () => { nova.resolve(antics); });
    await waitFor(() => expect(value.getThreadMessages('fil-A')).toHaveLength(60));
    expect(value.carregantAntics('fil-A')).toBe(false);
    expect(anticsDemanats()).toHaveLength(2);
  });

  it('una obertura de conversa tallada per la renovació es torna a fer amb l’operació nova i torna l’id de veres', async () => {
    const view = await open();
    const tallada = deferred();
    mock.creaFilDirecte.mockReturnValueOnce(tallada.promise).mockResolvedValueOnce('fil-A');
    let promesa;
    act(() => { promesa = value.creaFil('X'); });
    renova(view);
    expect(mock.creaFilDirecte.mock.calls[0][2].signal.aborted).toBe(true);
    await act(async () => { tallada.reject(avortat()); });
    let filId;
    await act(async () => { filId = await promesa; });
    expect(filId).toBe('fil-A');
    expect(mock.creaFilDirecte).toHaveBeenCalledTimes(2);
    expect(mock.creaFilDirecte.mock.calls[1].slice(0, 2)).toEqual(['X', null]);
    expect(mock.creaFilDirecte.mock.calls[1][2].signal.aborted).toBe(false);
  });

  /* ARQ-H01 · El relleu d'una renovació no és un passaport: si, abans que la
     petició tallada acabe, entra una altra persona, l'acció no es repetix amb
     la sessió nova. */
  it('una obertura tallada per una renovació i després per un canvi de persona no es repetix amb la persona nova', async () => {
    const view = await open();
    const tallada = deferred();
    mock.creaFilDirecte.mockReturnValueOnce(tallada.promise).mockResolvedValue('fil-de-B');
    let promesa;
    act(() => { promesa = value.creaFil('X'); });
    renova(view);
    mock.session = { currentUser: { id: 'B' }, generacio: 9 }; mock.actorKey = 'persona::B';
    view.rerender(tree(view.config));
    await act(async () => { tallada.reject(avortat()); });
    let filId = 'sense resoldre';
    await act(async () => { filId = await promesa; });
    expect(filId).toBeNull();
    expect(mock.creaFilDirecte).toHaveBeenCalledTimes(1);
  });

  it('una marca tallada per una renovació i després per un canvi de persona no s’envia amb la persona nova', async () => {
    mock.loadFils.mockResolvedValue([fil({ ultimSeq: 5, noLlegits: 5 })]);
    const view = render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    const tallada = deferred();
    mock.marcaLlegit.mockReturnValueOnce(tallada.promise);
    vi.useFakeTimers();
    act(() => value.marcaVist('fil-A', 5));
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    renova(view);
    mock.session = { currentUser: { id: 'B' }, generacio: 9 }; mock.actorKey = 'persona::B';
    view.rerender(tree(CONFIG));
    await act(async () => { tallada.reject(avortat()); await vi.advanceTimersByTimeAsync(0); });
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    expect(value.avis).toBeNull();
  });

  it('una marca de lectura en vol que la renovació talla es torna a enviar amb l’operació nova, sense avís', async () => {
    mock.loadFils.mockResolvedValue([fil({ ultimSeq: 5, noLlegits: 5 })]);
    const view = render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    const tallada = deferred();
    mock.marcaLlegit.mockReturnValueOnce(tallada.promise).mockResolvedValueOnce({ llegitFinsSeq: 5, rebutFinsSeq: 5 });
    vi.useFakeTimers();
    act(() => value.marcaVist('fil-A', 5));
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    const senyal = mock.marcaLlegit.mock.calls[0][1].signal;
    renova(view);
    expect(senyal.aborted).toBe(true);
    await act(async () => { tallada.reject(avortat()); await vi.advanceTimersByTimeAsync(0); });
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(2);
    expect(mock.marcaLlegit.mock.calls[1][0]).toBe('fil-A');
    expect(mock.marcaLlegit.mock.calls[1][1]).toMatchObject({ llegitFinsSeq: 5 });
    expect(mock.marcaLlegit.mock.calls[1][1].signal.aborted).toBe(false);
    expect(value.avis).toBeNull();
    expect(value.chatThreads[0].noLlegits).toBe(0);
  });

  /* Relleu 261007 (revisió adversarial) · El bucle en sèrie de «Connectar»
     (useAplicaAbast.js) usa el creaFil i el sendChatMessage del render en què
     va començar. Si la renovació arriba a mig bucle, els destinataris següents
     no poden rebre un null o un [] sense bombolla: el seu avís diu «El
     trobaràs al xat per a tornar-ho a provar». */
  it('les accions guardades abans de la renovació i cridades després passen per la versió vigent', async () => {
    const view = await open();
    const guardat = value;
    renova(view);
    await buidaCua();
    expect(value.sendChatMessage).not.toBe(guardat.sendChatMessage);
    mock.creaFilDirecte.mockResolvedValueOnce('fil-A');
    let filId;
    await act(async () => { filId = await guardat.creaFil('X'); });
    expect(filId).toBe('fil-A');
    expect(mock.creaFilDirecte.mock.calls[0][2].signal.aborted).toBe(false);
    const enVol = deferred(); mock.enviaMissatge.mockReturnValueOnce(enVol.promise);
    let promesa;
    act(() => { promesa = guardat.sendChatMessage({ id: 'fil-A' }, 'enllaç'); });
    const bombolla = value.getThreadMessages('fil-A').at(-1);
    expect(bombolla).toMatchObject({ text: 'enllaç', estatEnviament: 'pendent' });
    expect(mock.enviaMissatge.mock.calls[0][1]).toEqual({ id: bombolla.id, text: 'enllaç' });
    expect(mock.enviaMissatge.mock.calls[0][2].signal.aborted).toBe(false);
    let enviats;
    await act(async () => { enVol.resolve(message('enllaç', bombolla.id, { seq: 3 })); enviats = await promesa; });
    expect(enviats).toEqual([expect.objectContaining({ id: bombolla.id, seq: 3 })]);
    mock.obriFilDePagina.mockResolvedValueOnce({ filId: 'g-9', fils: [{ id: 'g-9', tipus: 'grup', titol: 'Festa', participant: true }] });
    await act(async () => {
      expect(await guardat.obriFilDePagina({ tipus: 'publicacio', id: 'p-1', titol: 'Festa', ruta: '/mur/p-1' })).toBe('g-9');
    });
    expect(mock.obriFilDePagina.mock.calls[0][1].signal.aborted).toBe(false);
  });

  /* ARQ-H01 · Eixir i tornar a entrar com la mateixa persona dona la mateixa
     clau d'àmbit, però és una sessió nova (la purga ja s'ha fet): l'acció
     guardada de la sessió anterior no hi passa. Relleu 261007 (revisió de
     seguretat, problema 2) · La prova pinta l'estat intermedi sense sessió,
     com fa sessionService, que notifica primer `usuari: null` (en eixir a la
     mateixa pestanya, esborraSessio → sincronitza; entre pestanyes,
     reconciliaAmbRegistre → sincronitza o recuperaSessio): la protecció és
     sobre el que React ha arribat a pintar. */
  it('eixir i tornar a entrar com la mateixa persona no és una renovació: les accions guardades de la sessió anterior no hi passen', async () => {
    const view = await open();
    const guardat = value;
    mock.session = { currentUser: null, generacio: 2, estat: 'fora' };
    view.rerender(tree(view.config));
    mock.session = { currentUser: { id: 'A' }, generacio: 3 };
    view.rerender(tree(view.config));
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.ambitEstable).toBe(guardat.ambitEstable);
    await act(async () => {
      expect(await guardat.sendChatMessage({ id: 'fil-A' }, 'de la sessió d’abans')).toEqual([]);
      expect(await guardat.creaFil('X')).toBeNull();
      expect(await guardat.obriFilDePagina({ tipus: 'publicacio', id: 'p-1', titol: 'Festa', ruta: '/mur/p-1' })).toBeNull();
    });
    expect(mock.enviaMissatge).not.toHaveBeenCalled();
    expect(mock.creaFilDirecte).not.toHaveBeenCalled();
    expect(mock.obriFilDePagina).not.toHaveBeenCalled();
    expect(value.getThreadMessages('fil-A').some((m) => m.text === 'de la sessió d’abans')).toBe(false);
  });

  /* Relleu 261007 (revisió de seguretat de la Decisió 1, problema 4a) · L'altre
     camí en què l'àmbit torna a ser idèntic: una renovació i, després, l'anada
     i tornada d'actor (persona → entitat → persona). La clau d'àmbit torna a
     ser la de les accions guardades, però el llinatge és nou: no hi passen. */
  it('l’anada i tornada d’actor després d’una renovació no és una renovació: les accions guardades d’abans no hi passen', async () => {
    const view = await open();
    const guardat = value;
    renova(view);
    await buidaCua();
    mock.actorKey = 'entitat::o';
    view.rerender(tree(view.config));
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.ambitEstable).not.toBe(guardat.ambitEstable);
    mock.actorKey = 'persona::A';
    view.rerender(tree(view.config));
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.ambitEstable).toBe(guardat.ambitEstable);
    await act(async () => {
      expect(await guardat.sendChatMessage({ id: 'fil-A' }, 'amb la veu d’abans')).toEqual([]);
      expect(await guardat.creaFil('X')).toBeNull();
      expect(await guardat.obriFilDePagina({ tipus: 'publicacio', id: 'p-1', titol: 'Festa', ruta: '/mur/p-1' })).toBeNull();
    });
    expect(mock.enviaMissatge).not.toHaveBeenCalled();
    expect(mock.creaFilDirecte).not.toHaveBeenCalled();
    expect(mock.obriFilDePagina).not.toHaveBeenCalled();
    expect(value.getThreadMessages('fil-A').some((m) => m.text === 'amb la veu d’abans')).toBe(false);
  });

  /* Relleu 261007 (revisió de seguretat de la Decisió 1, problema 4b) · Una
     obertura en vol, una renovació i el desmuntatge del proveïdor: el relleu
     acaba en null i l'acció no es repetix. */
  it('una obertura tallada per una renovació i després pel desmuntatge torna null i no es repetix', async () => {
    const view = await open();
    const tallada = deferred();
    mock.creaFilDirecte.mockReturnValueOnce(tallada.promise).mockResolvedValue('fil-A');
    let promesa;
    act(() => { promesa = value.creaFil('X'); });
    renova(view);
    expect(mock.creaFilDirecte.mock.calls[0][2].signal.aborted).toBe(true);
    view.unmount();
    await act(async () => { tallada.reject(avortat()); });
    let filId = 'sense resoldre';
    await act(async () => { filId = await promesa; });
    expect(filId).toBeNull();
    expect(mock.creaFilDirecte).toHaveBeenCalledTimes(1);
  });

  /* Relleu 261007 (revisió de seguretat de la Decisió 1, problemes 1 i 4c) · La
     finestra: relleuViu troba viva l'operació de la renovació, però la
     continuació de qui l'espera s'executa una microtasca després. Si entre
     mig React confirma l'entrada de B (flushSync), l'acció vigent ja és la
     de B: el relleu s'ha de tornar a comprovar en el mateix tic de la crida. */
  it('una obertura tallada per una renovació no es repetix amb la persona que entra entre la comprovació del relleu i la continuació', async () => {
    const view = await open();
    const tallada = deferred();
    mock.creaFilDirecte.mockReturnValueOnce(tallada.promise).mockResolvedValue('fil-de-B');
    let promesa;
    act(() => { promesa = value.creaFil('X'); });
    renova(view);
    await buidaCua();
    const senyal = mock.loadFils.mock.calls.at(-1)[0].signal;
    expect(senyal).not.toBe(mock.creaFilDirecte.mock.calls[0][2].signal);
    expect(senyal.aborted).toBe(false);
    const canviat = armaCanviDePersona(view, senyal);
    await act(async () => { tallada.reject(avortat()); await new Promise((resol) => setTimeout(resol, 0)); });
    let filId = 'sense resoldre';
    await act(async () => { filId = await promesa; });
    expect(canviat()).toBe(true);
    expect(senyal.aborted).toBe(true);
    expect(value.joId).toBe('B');
    expect(filId).toBeNull();
    expect(mock.creaFilDirecte).toHaveBeenCalledTimes(1);
  });

  /* Relleu 261007 (revisió de seguretat de la Decisió 1, problema 1) · La
     mateixa finestra per a la marca de lectura tallada: el relleu no la torna
     a enviar amb la sessió de B. */
  it('una marca tallada per una renovació no s’envia amb la persona que entra entre la comprovació del relleu i la continuació', async () => {
    mock.loadFils.mockResolvedValue([fil({ ultimSeq: 5, noLlegits: 5 })]);
    const view = render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    const tallada = deferred();
    mock.marcaLlegit.mockReturnValueOnce(tallada.promise).mockResolvedValue({ llegitFinsSeq: 5, rebutFinsSeq: 5 });
    vi.useFakeTimers();
    act(() => value.marcaVist('fil-A', 5));
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    vi.useRealTimers();
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    renova(view);
    await buidaCua();
    const senyal = mock.loadFils.mock.calls.at(-1)[0].signal;
    expect(senyal).not.toBe(mock.marcaLlegit.mock.calls[0][1].signal);
    expect(senyal.aborted).toBe(false);
    const canviat = armaCanviDePersona(view, senyal);
    await act(async () => { tallada.reject(avortat()); await new Promise((resol) => setTimeout(resol, 0)); });
    await buidaCua();
    expect(canviat()).toBe(true);
    expect(value.joId).toBe('B');
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    expect(value.avis).toBeNull();
  });

  /* Relleu 261007 (revisió de la correcció de seguretat, problema 2) · La
     mateixa finestra, però el que React confirma entre mig és una SEGONA
     renovació de la mateixa persona: l'operació que relleuViu havia trobat
     viva ja està avortada. No és cap altre àmbit, i l'obertura s'ha de tornar
     a fer amb l'operació de la segona renovació, no tornar null. */
  it('una obertura tallada per una renovació es fa amb l’operació d’una segona renovació confirmada entre la comprovació del relleu i la continuació', async () => {
    const view = await open();
    const tallada = deferred();
    mock.creaFilDirecte.mockReturnValueOnce(tallada.promise).mockResolvedValue('fil-A');
    let promesa;
    act(() => { promesa = value.creaFil('X'); });
    renova(view);
    await buidaCua();
    const senyal = mock.loadFils.mock.calls.at(-1)[0].signal;
    expect(senyal).not.toBe(mock.creaFilDirecte.mock.calls[0][2].signal);
    expect(senyal.aborted).toBe(false);
    const canviat = armaSegonaRenovacio(view, senyal);
    await act(async () => { tallada.reject(avortat()); await new Promise((resol) => setTimeout(resol, 0)); });
    let filId = 'sense resoldre';
    await act(async () => { filId = await promesa; });
    expect(canviat()).toBe(true);
    expect(senyal.aborted).toBe(true);
    expect(value.joId).toBe('A');
    expect(filId).toBe('fil-A');
    expect(mock.creaFilDirecte).toHaveBeenCalledTimes(2);
    expect(mock.creaFilDirecte.mock.calls[1][2].signal).not.toBe(senyal);
    expect(mock.creaFilDirecte.mock.calls[1][2].signal.aborted).toBe(false);
  });

  /* Relleu 261007 (revisió de la correcció de seguretat, problema 2) · El
     mateix per a la marca de lectura: una segona renovació entre mig no la
     deixa sense enviar. */
  it('una marca tallada per una renovació s’envia amb l’operació d’una segona renovació confirmada entre la comprovació del relleu i la continuació', async () => {
    mock.loadFils.mockResolvedValue([fil({ ultimSeq: 5, noLlegits: 5 })]);
    const view = render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    const tallada = deferred();
    mock.marcaLlegit.mockReturnValueOnce(tallada.promise).mockResolvedValue({ llegitFinsSeq: 5, rebutFinsSeq: 5 });
    vi.useFakeTimers();
    act(() => value.marcaVist('fil-A', 5));
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    vi.useRealTimers();
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    renova(view);
    await buidaCua();
    const senyal = mock.loadFils.mock.calls.at(-1)[0].signal;
    expect(senyal).not.toBe(mock.marcaLlegit.mock.calls[0][1].signal);
    expect(senyal.aborted).toBe(false);
    const canviat = armaSegonaRenovacio(view, senyal);
    await act(async () => { tallada.reject(avortat()); await new Promise((resol) => setTimeout(resol, 0)); });
    await buidaCua();
    expect(canviat()).toBe(true);
    expect(value.joId).toBe('A');
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(2);
    expect(mock.marcaLlegit.mock.calls[1][0]).toBe('fil-A');
    expect(mock.marcaLlegit.mock.calls[1][1]).toMatchObject({ llegitFinsSeq: 5 });
    expect(mock.marcaLlegit.mock.calls[1][1].signal).not.toBe(senyal);
    expect(mock.marcaLlegit.mock.calls[1][1].signal.aborted).toBe(false);
    expect(value.avis).toBeNull();
    expect(value.chatThreads[0].noLlegits).toBe(0);
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

  /* Decisió 1 del Mestre (261007) · Una renovació del JWT no és un altre
     àmbit: el ?sobre= de XatSection ja no es torna a muntar i un null li feia
     dir «Ací no hi ha cap xat comú on comentar». La crida es torna a fer amb
     l'operació nova (obri_fil_de_pagina troba o crea: idempotent). */
  it('Decisió 1 · una obertura tallada per la renovació es torna a fer i no torna un null fals', async () => {
    const view = await muntat();
    const tallada = deferred();
    mock.obriFilDePagina.mockReturnValueOnce(tallada.promise)
      .mockResolvedValueOnce({ filId: 'g-9', fils: [{ id: 'g-9', tipus: 'grup', titol: 'Festa', participant: true }] });
    let promesa;
    act(() => { promesa = value.obriFilDePagina(PUBLICACIO); });
    mock.session = { ...mock.session, generacio: 2 };
    view.rerender(tree(CONFIG));
    expect(mock.obriFilDePagina.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => { tallada.reject(Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' })); });
    let filId;
    await act(async () => { filId = await promesa; });
    expect(filId).toBe('g-9');
    expect(mock.obriFilDePagina).toHaveBeenCalledTimes(2);
    expect(mock.obriFilDePagina.mock.calls[1][1].signal.aborted).toBe(false);
  });

  /* Decisió 1 · El comportament segur amb els VISITANTS en una renovació: es
     conserven. Són del mateix àmbit (backend + persona + actor) i el servidor
     continua decidint qui llig què. Purgar-los trauria de la llista el fil de
     pàgina obert (XatSection pintaria la 404), la lectura ja no aniria com a
     visitant i el reintent de la bombolla fallida no hi entraria. */
  it('Decisió 1 · un fil de pàgina que llegixes com a visitant sobreviu a la renovació i la bombolla fallida s’hi reintenta com a visitant', async () => {
    const view = await muntat();
    mock.obriFilDePagina.mockResolvedValue(comunitatVisitada());
    await act(async () => { await value.obriFilDePagina({ tipus: 'entitat', id: 'org-1' }); });
    mock.loadMissatges.mockResolvedValue([message('comentari', 'm-g', { filId: 'g-1', usuariId: 'X', seq: 3 })]);
    act(() => value.obriFil('g-1'));
    await waitFor(() => expect(value.getThreadMessages('g-1')[0]?.text).toBe('comentari'));
    mock.enviaMissatge.mockRejectedValueOnce(Object.assign(new Error('xarxa'), { retriable: false }));
    await act(async () => { await value.sendChatMessage({ id: 'g-1' }, 'Hola'); });
    const fallit = value.getThreadMessages('g-1').at(-1);
    expect(fallit.estatEnviament).toBe('error');
    const carregues = mock.loadMissatges.mock.calls.length;
    mock.session = { ...mock.session, generacio: 2 };
    view.rerender(tree(CONFIG));
    expect(value.chatThreads.find(f => f.id === 'g-1')).toMatchObject({ participant: false });
    expect(value.filActiu).toBe('g-1');
    await waitFor(() => expect(mock.loadMissatges.mock.calls.length).toBeGreaterThan(carregues));
    expect(mock.loadMissatges.mock.calls.at(-1)).toEqual(['g-1', expect.objectContaining({ visitant: true, despresDeSeq: 3 })]);
    expect(value.getThreadMessages('g-1').find(m => m.id === fallit.id).estatEnviament).toBe('error');
    mock.enviaMissatge.mockImplementationOnce(async (_, cos) => message(cos.text, cos.id, { filId: 'g-1', seq: 4 }));
    await act(async () => { await value.reintenta(fallit.id); });
    expect(mock.enviaMissatge.mock.calls.at(-1)).toEqual(['g-1', { id: fallit.id, text: 'Hola' }, expect.objectContaining({ visitant: true })]);
    expect(value.getThreadMessages('g-1').filter(m => m.id === fallit.id)).toEqual([expect.objectContaining({ estatEnviament: 'enviat' })]);
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
    /* Pla 261014_1450 (front C) · Fora del proveïdor, cap entitat activa. */
    expect(value.entitatActiva).toBeNull();
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

  /* Pla 261014_1450 (front C) · La barra negra actua com una entitat: el xat
     exposa `entitatActiva` amb el MATEIX actor d'IdentitatContext (per a
     pintar-la al rail i dir-ho al compositor), però `joId`, `joNom` i
     `joAvatar` continuen sent la persona: el servidor desa usuari_id =
     auth.uid() i el costat de les bombolles es decidix amb `joId`. Com la
     resta del jo, no es veu fora del scope visible. */
  it('amb un actor entitat exposa entitatActiva i el jo continua sent la persona', async () => {
    mock.identitats = [
      { tipus: 'persona', id: 'A', nom: 'Pepa Soler', avatar: '/assets/pepa.jpg' },
      { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre', avatar: '/assets/forn.jpg' }
    ];
    mock.actor = { tipus: 'persona', id: 'A', nom: 'Pepa Soler', avatar: '/assets/pepa.jpg' };
    const view = await muntat();
    expect(value.entitatActiva).toBeNull();

    mock.actor = { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre', avatar: '/assets/forn.jpg', rol: 'owner', slug: 'forn' };
    mock.actorKey = 'entitat::o-1';
    view.rerender(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.entitatActiva).toEqual({ id: 'o-1', nom: 'Forn de la Torre', avatar: '/assets/forn.jpg' });
    expect([value.joId, value.joNom, value.joAvatar]).toEqual(['A', 'Pepa Soler', '/assets/pepa.jpg']);
    /* El mateix actor tornat a construir no canvia el valor (memo pels camps). */
    const abans = value.entitatActiva;
    mock.actor = { ...mock.actor };
    view.rerender(tree(CONFIG));
    expect(value.entitatActiva).toBe(abans);

    /* Una entitat sense logo: avatar null, mai la foto de la persona. */
    mock.actor = { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre', avatar: null };
    view.rerender(tree(CONFIG));
    expect(value.entitatActiva).toEqual({ id: 'o-1', nom: 'Forn de la Torre', avatar: null });

    /* Sense sessió (scope no visible): null, com el jo. */
    mock.session = { currentUser: null, generacio: 2, estat: 'comprovant' };
    snapshots = [];
    view.rerender(tree(CONFIG));
    expect(snapshots[0].entitatActiva).toBeNull();
    expect(snapshots[0].joId).toBeNull();
  });
});

/* Ordre del Mestre (261007) · Les files d'ajuda per defecte que el port
   sintetitza en remot (xatsPerDefecte.js): el context no n'afig cap, però en
   lleva la que ja té el seu xat real entre els visitants, i la de Sóc de Poble
   a qui gestiona l'entitat.
   Gauntlet 261016_1530 (Bloc 3.6.1, ordre vigent) · «PROHIBIT duplicar Sóc
   de Poble»: ja no hi ha cap fila sintètica de Sóc de Poble (el seu actor és
   la comunitat), i la regla de qui gestiona l'entitat, que només la llevava,
   es deroga. Les proves que la fixaven s'actualitzen a posta. */
describe('files d’ajuda per defecte', () => {
  const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
  const perDefecte = () => value.chatThreads.filter(f => f.perDefecte).map(f => f.perDefecte);
  async function muntat() {
    render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
  }
  /* P1-70 (261029) · Els dos avisos de la conversa d'atenció personal i servei tècnic (section.xat.javi.*). */
  const AVIS_TU = 'Esta és la teua fila d’atenció personal i servei tècnic, tal com la veu la gent del poble. Les converses que t’escriguen arribaran a la llista com a directes.';
  const AVIS_SENSE = 'El compte de Javi Llinares encara no està connectat al xat d’este poble. Mentrestant, per a atenció personal i servei tècnic, escriu al grup General de la comunitat Sóc de Poble.';

  /* Gauntlet 261016 (Bloc 3.6) · Tres files des d'ara: Javi Llinares entre
     Sóc de Poble i la IAIA. Les proves que en fixaven dues s'actualitzen. */
  it('passen del port a la llista, amb la marca, sense comptar com a no llegides ni com a contactes freqüents', async () => {
    mock.loadFils.mockResolvedValue(ambXatsPerDefecte([fil()]));
    await muntat();
    expect(value.chatThreads.map(f => f.id)).toEqual(['fil-A', 'sdp-per-defecte:javi', 'sdp-per-defecte:iaia']);
    expect(perDefecte()).toEqual(['javi', 'iaia']);
    expect(value.chatThreads.find(f => f.id === 'fil-A').perDefecte).toBeNull();
    expect(value.totalNoLlegits).toBe(2);
    expect(value.contactesFrequents).toEqual([]);
  });

  it('sense files sintètiques (la llavor), la llista no canvia', async () => {
    mock.loadFils.mockResolvedValue([fil()]);
    await muntat();
    expect(value.chatThreads.map(f => f.id)).toEqual(['fil-A']);
  });

  it('qui llig el xat públic de /iaia com a visitant ja no veu la fila sintètica de la IAIA', async () => {
    mock.loadFils.mockResolvedValue(ambXatsPerDefecte([fil()]));
    await muntat();
    mock.obriFilDePagina.mockResolvedValue({ filId: 'g-iaia', fils: [{ id: 'g-iaia', tipus: 'grup', titol: "L'ànima de la iaia",
      subjecte: { tipus: 'pagina', id: '/iaia', ruta: '/iaia', titol: "L'ànima de la iaia" }, participant: false }] });
    await act(async () => { await value.obriFilDePagina({ tipus: 'pagina', id: '/iaia', ruta: '/iaia', titol: "L'ànima de la iaia" }); });
    expect(value.chatThreads.map(f => f.id)).toEqual(['fil-A', 'g-iaia', 'sdp-per-defecte:javi']);
  });

  /* Gauntlet 261016_1530 (Bloc 3.6.1) · Derogat «qui gestiona l'entitat
     pilot no veu la fila de Sóc de Poble»: ningú no la veu, perquè no
     existix. Una fila sintètica seua que arribe d'un port vell tampoc no
     passa, ni per a qui gestiona l'entitat ni per a qui no. */
  it('cap fila sintètica de Sóc de Poble, gestione o no l’entitat pilot; la d’un port vell se’n va', async () => {
    const vella = { ...ambXatsPerDefecte([])[0], id: 'sdp-per-defecte:socdepoble', titol: 'Sóc de Poble', perDefecte: 'socdepoble' };
    mock.loadFils.mockResolvedValue([...ambXatsPerDefecte([fil()]), vella]);
    mock.identitats = [
      { tipus: 'persona', id: 'A', nom: 'Pepa' },
      { tipus: 'entitat', id: '00000000-0000-4000-8000-0000000000aa', slug: 'socdepoble', rol: 'admin' }
    ];
    const view = render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(perDefecte()).toEqual(['javi', 'iaia']);
    mock.identitats = [{ tipus: 'persona', id: 'A', nom: 'Pepa' }];
    view.rerender(tree(CONFIG));
    expect(perDefecte()).toEqual(['javi', 'iaia']);
    expect(value.chatThreads.some(f => f.id === 'sdp-per-defecte:socdepoble')).toBe(false);
  });

  /* Gauntlet 261016 (Bloc 3.6) · La mateixa regla d'identitat que la de dalt:
     ningú no es parla a si mateix. Javi no veu la fila «Javi Llinares»; la
     resta, sí.
     Auditoria adversarial 261016 (P2, suplantació) · Derogat «en remot, pel
     nom de la seua sessió»: el nom és el full_name que tria cada usuari, i un
     homònim perdia la fila de Javi. Ara per id o àlies del padró pilot; la
     prova d'abans fixava el forat i s'ha partit en dos a posta. */
  /* P1-70 (ordre del Mestre, 261029 18:20: «No me veo a mí como Javi Llinares
     […] esto es una regresión») · Derogat «Javi no veu la seua pròpia fila»:
     la veu, i la seua conversa és la d'atenció personal i servei tècnic de
     només lectura (filServeiTecnic), mai un directe amb ell mateix
     (SDP-XAT-002): creaFil no arriba al port. */
  it('P1-70 · Javi Llinares (per id o àlies del padró pilot) veu la seua fila; la conversa és la de servei tècnic i cap directe amb ell mateix', async () => {
    mock.loadFils.mockResolvedValue(ambXatsPerDefecte([fil()]));
    mock.session = { currentUser: { id: 'javillinares' }, generacio: 1 }; mock.actorKey = 'persona::javillinares';
    mock.identitats = [{ tipus: 'persona', id: 'javillinares', nom: 'Javi Llinares' }];
    await muntat();
    expect(perDefecte()).toEqual(['javi', 'iaia']);
    expect(value.filServeiTecnic).toMatchObject({ id: 'fake-javi', potEscriure: false, ultimText: null, avisNomesLectura: AVIS_TU });
    let filId;
    await act(async () => { filId = await value.creaFil('0001'); });
    expect(filId).toBe('fake-javi');
    expect(mock.creaFilDirecte).not.toHaveBeenCalled();
  });

  /* P1-70 (261029) · La conversa d'atenció personal i servei tècnic segons qui
     mira i el mode: Javi (per id o àlies, o el compte remot pel correu
     acreditat) → «tu mateix»; un veí en remot sense el compte de Javi declarat
     → «sense compte»; un veí en llavor o en local → cap (el directe de veres);
     el convidat → el xat de mostra de sempre. Mai cap crida al port. */
  it.each([['seed', '0001'], ['local', 'javillinares']])('P1-70 · en %s, Javi (%s) veu la seua fila; servei tècnic «tu mateix», cap bombolla i cap crida al port', async (dataMode, id) => {
    mock.loadFils.mockResolvedValue(ambXatsPerDefecte([fil()]));
    mock.session = { currentUser: { id }, generacio: 1 }; mock.actorKey = `persona::${id}`;
    render(tree({ dataMode }));
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(perDefecte()).toEqual(['javi', 'iaia']);
    expect(value.filServeiTecnic).toMatchObject({ id: 'fake-javi', avisNomesLectura: AVIS_TU, ultimSeq: 0 });
    expect(value.getThreadMessages('fake-javi')).toEqual([]);
    let filId;
    await act(async () => { filId = await value.creaFil(id); });
    expect(filId).toBe('fake-javi');
    expect(mock.creaFilDirecte).not.toHaveBeenCalled();
  });

  it('P1-70 · en remot, el compte de la persona pilot pel correu acreditat és «tu mateix»; sense confirmar, «sense compte»', async () => {
    mock.loadFils.mockResolvedValue(ambXatsPerDefecte([fil()]));
    mock.session = { currentUser: { id: '5a5a5a5a-0000-4000-8000-0000000000aa', email: 'SocDePobleCom@gmail.com', email_confirmed_at: '2026-10-18T10:00:00Z' }, generacio: 1 };
    await muntat();
    expect(value.filServeiTecnic.avisNomesLectura).toBe(AVIS_TU);
    cleanup();
    mock.session = { currentUser: { id: '5a5a5a5a-0000-4000-8000-0000000000aa', email: 'socdepoblecom@gmail.com' }, generacio: 1 };
    await muntat();
    expect(value.filServeiTecnic.avisNomesLectura).toBe(AVIS_SENSE);
  });

  it('P1-70 · en remot, un veí amb sessió: la fila sintètica es queda; ?amb= de Javi porta al servei tècnic sense cap RPC', async () => {
    mock.loadFils.mockResolvedValue(ambXatsPerDefecte([fil()]));
    await muntat();
    expect(value.chatThreads.map(f => f.id)).toEqual(['fil-A', 'sdp-per-defecte:javi', 'sdp-per-defecte:iaia']);
    expect(value.filServeiTecnic).toMatchObject({ id: 'fake-javi', avisNomesLectura: AVIS_SENSE, potEscriure: false });
    for (const id of ['0001', 'javillinares']) {
      let filId;
      await act(async () => { filId = await value.creaFil(id); });
      expect(filId).toBe('fake-javi');
    }
    expect(mock.creaFilDirecte).not.toHaveBeenCalled();
  });

  it('P1-70 · en llavor, un veí amb sessió: cap servei tècnic, creaFil de Javi va al port (el directe de veres)', async () => {
    mock.loadFils.mockResolvedValue(ambXatsPerDefecte([fil()]));
    mock.creaFilDirecte.mockResolvedValueOnce('d-javi');
    render(tree({ dataMode: 'seed' }));
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.filServeiTecnic).toBeNull();
    let filId;
    await act(async () => { filId = await value.creaFil('0001'); });
    expect(filId).toBe('d-javi');
    expect(mock.creaFilDirecte).toHaveBeenCalledTimes(1);
  });

  it('un homònim (un altre id amb el nom «Javi Llinares») sí que la veu: mai pel nom', async () => {
    mock.loadFils.mockResolvedValue(ambXatsPerDefecte([fil()]));
    mock.identitats = [{ tipus: 'persona', id: 'A', nom: 'Javi Llinares' }];
    await muntat();
    expect(value.joNom).toBe('Javi Llinares');
    expect(perDefecte()).toEqual(['javi', 'iaia']);
  });

  /* Auditoria adversarial 261016 (P2) · En llavor i en local el xat públic de
     /iaia és un grup on la IAIA no contesta: llegir-lo com a visitant no
     retira la fila «IAIA MarIA» (que porta al directe). En remot, sí (dalt). */
  it('en mode local, el xat públic de /iaia no retira la fila sintètica de la IAIA', async () => {
    mock.loadFils.mockResolvedValue(ambXatsPerDefecte([fil()], { paginaDeLaIAIA: false }));
    render(tree({ dataMode: 'local' }));
    await waitFor(() => expect(value.status).toBe('ready'));
    mock.obriFilDePagina.mockResolvedValue({ filId: 'g-iaia', fils: [{ id: 'g-iaia', tipus: 'grup', titol: "L'ànima de la iaia",
      subjecte: { tipus: 'pagina', id: '/iaia', ruta: '/iaia', titol: "L'ànima de la iaia" }, participant: false }] });
    await act(async () => { await value.obriFilDePagina({ tipus: 'pagina', id: '/iaia', ruta: '/iaia', titol: "L'ànima de la iaia" }); });
    expect(value.chatThreads.map(f => f.id)).toEqual(['fil-A', 'g-iaia', 'sdp-per-defecte:javi', 'sdp-per-defecte:iaia']);
  });
});

/* Auditoria adversarial 261016 (P3) · Ordre del Mestre (prompt 261016_0015,
   Bloc 3.6): «Si un usuari no registrat fa clic per parlar-hi, es mostra el
   missatge automàtic». En llavor i en local ningú no té sessió (l'entrada
   torna MODE_LOCAL) i el convidat té un xat de veres (joId): la fila de Javi
   el portava a un directe escrivible on ningú no contesta. Ara la fila és el
   xat de només lectura de Javi (filDeMostraDeJavi, la mateixa peça que el xat
   de mostra del remot), al mateix lloc de la cua, i res no arriba al port. */
describe('Javi Llinares per a qui no té sessió en llavor i en local', () => {
  const MISSATGE = '«Este missatge és automàtic: per a poder parlar amb mi has de registrar-te.»';
  async function convidat(config) {
    mock.session = { currentUser: null, generacio: 1, estat: 'fora' };
    mock.loadFils.mockResolvedValue(ambXatsPerDefecte([fil()]));
    render(tree(config));
    await waitFor(() => expect(value.status).toBe('ready'));
  }

  it.each([['seed'], ['local']])('en mode %s, la fila de Javi és el seu xat de només lectura, amb el literal, al lloc de la sintètica', async (dataMode) => {
    await convidat({ dataMode });
    expect(value.senseSessio).toBe(false);
    expect(value.chatThreads.map(f => f.id)).toEqual(['fil-A', 'fake-javi', 'sdp-per-defecte:iaia']);
    expect(value.chatThreads.find(f => f.id === 'fake-javi')).toMatchObject({
      name: 'Javi Llinares', potEscriure: false, ultimAl: null, noLlegits: 0, ultimText: MISSATGE,
      avisNomesLectura: "Si t'agrada el que veus, registra't per a entrar al xat de veritat!"
    });
    expect(value.getThreadMessages('fake-javi').map(m => [m.text, m.sender, m.author, m.is_ai])).toEqual([[MISSATGE, 'other', 'Javi Llinares', false]]);
    expect(value.totalNoLlegits).toBe(2);
  });

  it('obrir-lo, llegir-lo i demanar-ne més no van al port; enviar-hi no fa res', async () => {
    await convidat({ dataMode: 'seed' });
    const javi = value.chatThreads.find(f => f.id === 'fake-javi');
    act(() => value.obriFil('fake-javi'));
    act(() => value.marcaVist('fake-javi', 1));
    let antics;
    await act(async () => { antics = await value.carregaMesAntics('fake-javi'); });
    expect(antics).toBe(false);
    let enviats;
    await act(async () => { enviats = await value.sendChatMessage(javi, 'Hola, Javi'); });
    expect(enviats).toEqual([]);
    await act(async () => { await new Promise((resol) => setTimeout(resol, 0)); });
    expect(mock.loadMissatges).not.toHaveBeenCalled();
    expect(mock.marcaLlegit).not.toHaveBeenCalled();
    expect(mock.enviaMissatge).not.toHaveBeenCalled();
    expect(mock.subscribeToXat).not.toHaveBeenCalled();
    expect(value.avis).toBeNull();
    expect(value.getThreadMessages('fake-javi')).toHaveLength(1);
  });

  it('el ?amb= i «Nova conversa» amb Javi (per id o àlies) hi porten sense crear cap directe; una altra persona, com sempre', async () => {
    await convidat({ dataMode: 'seed' });
    for (const id of ['0001', 'javillinares']) {
      let filId;
      await act(async () => { filId = await value.creaFil(id); });
      expect(filId).toBe('fake-javi');
    }
    expect(mock.creaFilDirecte).not.toHaveBeenCalled();
    mock.creaFilDirecte.mockResolvedValue('fil-B');
    let altre;
    await act(async () => { altre = await value.creaFil('0002'); });
    expect(altre).toBe('fil-B');
    expect(mock.creaFilDirecte).toHaveBeenCalledWith('0002', null, expect.any(Object));
  });

  it('amb sessió (en llavor o en remot), la fila de Javi és la sintètica de sempre i creaFil va al port', async () => {
    mock.loadFils.mockResolvedValue(ambXatsPerDefecte([fil()]));
    render(tree({ dataMode: 'seed' }));
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.chatThreads.map(f => f.id)).toEqual(['fil-A', 'sdp-per-defecte:javi', 'sdp-per-defecte:iaia']);
    mock.creaFilDirecte.mockResolvedValue('fil-J');
    let filId;
    await act(async () => { filId = await value.creaFil('0001'); });
    expect(filId).toBe('fil-J');
  });
});

/* Auditoria 261007 (B) · Robustesa del xat: el cursor de servidor, les marques
   de lectura que fallen, el sondeig que no repinta per a res i la càrrega
   superada que no espaia el sondeig. */
describe('robustesa del xat (auditoria 261007 B)', () => {
  const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
  const deLaPepa = (seq) => message(`pepa-${seq}`, `m-pepa-${seq}`, { seq, usuariId: 'X', autorNom: 'Pepa' });
  const seqs = () => value.getThreadMessages('fil-A').map((m) => m.seq);
  /* Totes les promeses ja resoltes han acabat la seua cadena. */
  const buidaCua = () => act(async () => { await new Promise((resol) => setTimeout(resol, 0)); });
  async function obert(missatges) {
    mock.loadMissatges.mockResolvedValue(missatges);
    render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    act(() => value.obriFil('fil-A'));
    await waitFor(() => expect(mock.loadMissatges).toHaveBeenCalled());
    await buidaCua();
    return mock.subscribeToXat.mock.calls.at(-1)[1];
  }

  it('el missatge propi confirmat no mou el cursor: el de Pepa que s’hi ha creuat arriba', async () => {
    const avis = await obert([deLaPepa(10)]);
    mock.enviaMissatge.mockImplementationOnce(async (_, cos) => message(cos.text, cos.id, { seq: 12 }));
    await act(async () => { await value.sendChatMessage({ id: 'fil-A' }, 'meu'); });
    expect(seqs()).toEqual([10, 12]);
    const meu = value.getThreadMessages('fil-A').find((m) => m.seq === 12);
    mock.loadMissatges.mockResolvedValueOnce([deLaPepa(11), message('meu', meu.id, { seq: 12 })]);
    await act(async () => { avis(null, { tipus: 'nous', filId: 'fil-A', seq: 12 }); });
    await buidaCua();
    expect(mock.loadMissatges).toHaveBeenLastCalledWith('fil-A', expect.objectContaining({ despresDeSeq: 10 }));
    expect(seqs()).toEqual([10, 11, 12]);
  });

  /* Gauntlet 261025_0545 (XC-01) · Esta prova fixava la lectura SUPERADA: el
     segon avís en llançava una altra en paral·lel i la resposta de la primera
     es llençava sense moure el cursor. Eixe era el defecte de la ràfega que
     congelava la conversa oberta, i l'ítem XC-01 demana el contrari: una sola
     lectura en vol per fil, aplicada sempre, i una més si l'han tornada a
     demanar mentre volava. El que la prova vigilava es conserva: el meu 12
     confirmat no mou el cursor i el forat (l'11 de Pepa) arriba. */
  it('una lectura en vol no se supera: el segon avís en demana una més quan torna, i el meu confirmat no mou el cursor', async () => {
    const avis = await obert([deLaPepa(10)]);
    const primera = deferred(), segona = deferred();
    mock.loadMissatges.mockReturnValueOnce(primera.promise).mockReturnValueOnce(segona.promise);
    await act(async () => { avis(null, { tipus: 'nous', filId: 'fil-A', seq: 11 }); });
    await waitFor(() => expect(mock.loadMissatges).toHaveBeenLastCalledWith('fil-A', expect.objectContaining({ despresDeSeq: 10 })));
    /* Entre mig, el meu 12 confirmat: es pinta, però el cursor continua al 10. */
    mock.enviaMissatge.mockImplementationOnce(async (_, cos) => message(cos.text, cos.id, { seq: 12 }));
    let propi;
    await act(async () => { [propi] = await value.sendChatMessage({ id: 'fil-A' }, 'meu'); });
    const crides = mock.loadMissatges.mock.calls.length;
    await act(async () => { avis(null, { tipus: 'nous', filId: 'fil-A', seq: 12 }); });
    await buidaCua();
    /* Cap lectura en paral·lel: la que vola queda marcada. */
    expect(mock.loadMissatges.mock.calls.length).toBe(crides);
    await act(async () => { primera.resolve([deLaPepa(11)]); });
    await buidaCua();
    /* La primera s'aplica (abans es llençava) i en ix una més, des del seu 11. */
    expect(seqs()).toEqual([10, 11, 12]);
    expect(mock.loadMissatges.mock.calls.length).toBe(crides + 1);
    expect(mock.loadMissatges.mock.calls.at(-1)[1]).toMatchObject({ despresDeSeq: 11 });
    await act(async () => { segona.resolve([message('meu', propi.id, { seq: 12 })]); });
    await buidaCua();
    expect(seqs()).toEqual([10, 11, 12]);
    expect(value.getThreadMessages('fil-A').filter((m) => m.id === propi.id)).toHaveLength(1);
    mock.loadMissatges.mockResolvedValueOnce([]);
    await act(async () => { avis(null, { tipus: 'nous', filId: 'fil-A', seq: 12 }); });
    await buidaCua();
    expect(mock.loadMissatges).toHaveBeenLastCalledWith('fil-A', expect.objectContaining({ despresDeSeq: 12 }));
  });

  it('un fil buit queda amb el cursor a 0: la lectura següent ja és incremental', async () => {
    const avis = await obert([]);
    expect(mock.loadMissatges.mock.calls.at(-1)[1]).not.toHaveProperty('despresDeSeq');
    await act(async () => { avis(null, { tipus: 'nous', filId: 'fil-A', seq: 1 }); });
    await buidaCua();
    expect(mock.loadMissatges.mock.calls.at(-1)[1]).toMatchObject({ despresDeSeq: 0 });
  });

  it('dos sondejos sense res nou deixen la llista i la conversa amb la mateixa referència', async () => {
    const avis = await obert([deLaPepa(10)]);
    const fils = value.chatThreads;
    const missatges = value.getThreadMessages('fil-A');
    await act(async () => { await value.recarrega(); });
    await act(async () => { await value.recarrega(); });
    expect(value.chatThreads).toBe(fils);
    mock.loadMissatges.mockResolvedValueOnce([]);
    await act(async () => { avis(null, { tipus: 'nous', filId: 'fil-A', seq: 10 }); });
    await buidaCua();
    expect(mock.loadMissatges).toHaveBeenLastCalledWith('fil-A', expect.objectContaining({ despresDeSeq: 10 }));
    expect(value.getThreadMessages('fil-A')).toBe(missatges);
    /* Un canvi de veres sí que arriba. */
    mock.loadFils.mockResolvedValue([fil({ ultimSeq: 3, noLlegits: 3 })]);
    await act(async () => { await value.recarrega(); });
    expect(value.chatThreads).not.toBe(fils);
    expect(value.chatThreads[0].noLlegits).toBe(3);
  });

  it('una marca de lectura que falla avisa com fins ara i es torna a enviar en la lectura següent', async () => {
    mock.loadFils.mockResolvedValue([fil({ ultimSeq: 5, noLlegits: 5 })]);
    mock.marcaLlegit.mockRejectedValueOnce(Object.assign(new Error('No s’ha pogut marcar com a llegit.'), { retriable: true }));
    render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    vi.useFakeTimers();
    act(() => value.marcaVist('fil-A', 5));
    expect(value.chatThreads[0].noLlegits).toBe(0);
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    /* Gauntlet 261025_0545 (XC-13) · L'avís és del fil (avisFil) i ja no
       `avis`, que tapava la llista: l'ítem ho demana i esta línia ho fixa. */
    expect(value.avis).toBeNull();
    expect(value.avisFil('fil-A')).toBe('No s’ha pogut marcar com a llegit.');
    /* El sondeig torna el que diu el servidor: la marca no hi ha arribat. */
    await act(async () => { await value.recarrega(); });
    expect(value.chatThreads[0].noLlegits).toBe(5);
    act(() => value.marcaVist('fil-A', 5));
    expect(value.chatThreads[0].noLlegits).toBe(0);
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(2);
    expect(mock.marcaLlegit).toHaveBeenLastCalledWith('fil-A', expect.objectContaining({ llegitFinsSeq: 5 }));
  });

  it('un sondeig de la llista que ha eixit abans de la marca no torna a encendre els no llegits', async () => {
    mock.loadFils.mockResolvedValue([fil({ ultimSeq: 5, noLlegits: 5 })]);
    mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 5, rebutFinsSeq: 5 });
    render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    const tard = deferred();
    mock.loadFils.mockReturnValueOnce(tard.promise);
    let sondeig;
    act(() => { sondeig = value.recarrega(); });
    vi.useFakeTimers();
    act(() => value.marcaVist('fil-A', 5));
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
    expect(mock.loadFils).toHaveBeenLastCalledWith(expect.any(Object));
    await act(async () => { tard.resolve([fil({ ultimSeq: 5, noLlegits: 5 })]); await sondeig; });
    expect(value.chatThreads[0]).toMatchObject({ llegitFinsSeq: 5, noLlegits: 0 });
    expect(value.totalNoLlegits).toBe(0);
  });

  it('una càrrega de la llista superada no espaia el sondeig: el tic següent arriba als 25 s', async () => {
    render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    vi.useFakeTimers();
    /* Obrir un fil torna a armar el sondeig, ara amb els temporitzadors de la prova. */
    act(() => value.obriFil('fil-A'));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    const tard = deferred();
    mock.loadFils.mockReturnValueOnce(tard.promise);
    const abans = mock.loadFils.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(25000); });
    expect(mock.loadFils.mock.calls.length).toBe(abans + 1);
    /* Connectar amb diversos destinataris, el primer missatge com a visitant
       o el «Reintentar» de la cerca global recarreguen la llista mentre el
       tic és en vol, sense navegar: el sondeig no es torna a armar. */
    await act(async () => { await value.recarrega(); });
    await act(async () => { tard.resolve([fil()]); await vi.advanceTimersByTimeAsync(0); });
    const despres = mock.loadFils.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(25000); });
    expect(mock.loadFils.mock.calls.length).toBe(despres + 1);
  });

  /* Les etiquetes «14:32», «Ahir» i «Hui» es calculen amb l'hora del render:
     el primer sondeig del dia nou ha de repintar encara que la llista siga
     la mateixa. Només es fingix Date: els temporitzadors continuen reals. */
  it('el primer sondeig després de mitjanit aplica la llista equivalent; dins del mateix dia, no', async () => {
    render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 7, 23, 58));
    await act(async () => { await value.recarrega(); });
    const fils = value.chatThreads;
    await act(async () => { await value.recarrega(); });
    expect(value.chatThreads).toBe(fils);
    vi.setSystemTime(new Date(2026, 9, 8, 0, 0, 30));
    await act(async () => { await value.recarrega(); });
    expect(value.chatThreads).not.toBe(fils);
    expect(value.chatThreads).toEqual(fils);
    const delDiaNou = value.chatThreads;
    await act(async () => { await value.recarrega(); });
    expect(value.chatThreads).toBe(delDiaNou);
  });

  /* XatSection crida obriFil(null) en eixir del Xat: ací es comprova, amb el
     proveïdor real, que això tanca el canal i atura el sondeig del fil. */
  it('obriFil(null) dona de baixa el canal del fil i n’atura el sondeig', async () => {
    render(tree(CONFIG));
    await waitFor(() => expect(value.status).toBe('ready'));
    vi.useFakeTimers();
    act(() => value.obriFil('fil-A'));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(mock.subscribeToXat).toHaveBeenLastCalledWith('fil-A', expect.any(Function), expect.any(Object));
    /* Obert, el sondeig del fil demana els nous als 5 s. */
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(mock.loadMissatges).toHaveBeenLastCalledWith('fil-A', expect.objectContaining({ despresDeSeq: 1 }));
    const baixes = mock.unsubscribeFromXat.mock.calls.length;
    act(() => value.obriFil(null));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(value.filActiu).toBeNull();
    expect(mock.unsubscribeFromXat.mock.calls.length).toBe(baixes + 1);
    expect(mock.unsubscribeFromXat).toHaveBeenLastCalledWith('sub-A');
    const carregues = mock.loadMissatges.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
    expect(mock.loadMissatges.mock.calls.length).toBe(carregues);
  });
});
