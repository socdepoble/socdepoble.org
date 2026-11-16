import { StrictMode, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { XatProvider, useXat } from './XatContext.jsx';

const ID = '11111111-1111-4111-8111-111111111111';
const FIL = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const mock = vi.hoisted(() => ({
  session: {}, actorKey: 'persona-A', actor: null,
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), refrescaSessio: vi.fn(),
  marcaLlegit: vi.fn(), creaFilDirecte: vi.fn(), carregaMembres: vi.fn(),
  subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(), obriFilDePagina: vi.fn(),
  teCapacitat: vi.fn(), loadPerfilPublic: vi.fn(),
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, actor: mock.actor }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: '/xat' }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, fallback) => fallback }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
const CONFIG = { dataMode: 'remote', backendUrl: 'https://test.invalid', tenantId: null };
let value;
function Sonda() { const actual = useXat(); useLayoutEffect(() => { value = actual; }); return null; }
const arbre = () => <StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>;
const fil = (extra = {}) => ({ id: FIL, tipus: 'directe', titol: 'Conversa', altresNoms: [], ultimSeq: 1, llegitFinsSeq: 1, llegitPelsAltresFinsSeq: 0, rebutPelsAltresFinsSeq: 0, ...extra });
beforeEach(() => {
  vi.resetAllMocks();
  mock.session = { currentUser: { id: USER }, generacio: 1, estat: 'dins' };
  mock.actorKey = 'persona-A'; mock.actor = null;
  mock.loadFils.mockResolvedValue([fil()]);
  mock.loadMissatges.mockResolvedValue([{ id: ID, filId: FIL, usuariId: USER, text: 'Primer', seq: 1 }]);
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
  mock.teCapacitat.mockReturnValue(false);
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub-A', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.loadPerfilPublic.mockResolvedValue(null);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
async function obri() {
  const vista = render(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  act(() => value.obriFil(FIL));
  await waitFor(() => expect(value.chatMessages[0]?.text).toBe('Primer'));
  return vista;
}

describe('R30.2 · cablejat efectiu en XatProvider', () => {
  it('aplica la màquina rural als rebuts abans del primer enviament i només avança amb cursor alié', async () => {
    await obri();
    expect(value.chatMessages[0]).toMatchObject({ estatEnviament: 'enviat', estatSincronitzacio: 'enviat_servidor', persistitLocal: false });
    mock.loadFils.mockResolvedValue([fil({ rebutFinsSeq: 40, llegitFinsSeq: 40 })]);
    await act(async () => { await value.recarrega(); });
    expect(value.chatMessages[0].estatSincronitzacio).toBe('enviat_servidor');
    mock.loadFils.mockResolvedValue([fil({ rebutPelsAltresFinsSeq: 1 })]);
    await act(async () => { await value.recarrega(); });
    expect(value.chatMessages[0]).toMatchObject({ estatEnviament: 'lliurat', estatSincronitzacio: 'entregat_destinatari' });
    mock.loadFils.mockResolvedValue([fil({ llegitPelsAltresFinsSeq: 1 })]);
    await act(async () => { await value.recarrega(); });
    expect(value.chatMessages[0]).toMatchObject({ estatEnviament: 'llegit', estatSincronitzacio: 'llegit_destinatari' });
  });

  it('executa JWT → refresh → reintent idempotent i conserva un únic missatge confirmat després del relleu', async () => {
    const vista = await obri();
    mock.enviaMissatge.mockRejectedValueOnce(Object.assign(new Error('JWT expired'), { code: 'PGRST301', status: 401 }))
      .mockImplementationOnce(async (_, p) => ({ id: p.id, filId: FIL, usuariId: USER, text: p.text, seq: 2 }));
    mock.refrescaSessio.mockImplementationOnce(async () => {
      mock.session = { ...mock.session, generacio: 2 };
      flushSync(() => vista.rerender(arbre()));
      return true;
    });
    let resposta;
    await act(async () => { resposta = await value.sendChatMessage({ id: FIL }, 'Bon dia'); });
    expect(mock.refrescaSessio).toHaveBeenCalledTimes(1);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(2);
    expect(mock.enviaMissatge.mock.calls[0][1]).toBe(mock.enviaMissatge.mock.calls[1][1]);
    const id = mock.enviaMissatge.mock.calls[0][1].id;
    expect(mock.enviaMissatge.mock.calls[1][1].client_msg_id).toBe(id);
    expect(resposta).toEqual([expect.objectContaining({ id, seq: 2 })]);
    expect(value.chatMessages.filter((m) => m.id === id)).toEqual([expect.objectContaining({ estatSincronitzacio: 'enviat_servidor', estatEnviament: 'enviat' })]);
  });

  it('no eleva a enviat un HTTP satisfactori sense seq de servidor', async () => {
    await obri();
    mock.enviaMissatge.mockImplementationOnce(async (_, p) => ({ id: p.id, text: p.text, status: 200 }));
    await act(async () => { expect(await value.sendChatMessage({ id: FIL }, 'Sense ACK')).toEqual([]); });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    /* R32 · Sense el text tècnic «Prohibit marcar ✓…»: la bombolla diu el «No s'ha enviat» de sempre. */
    expect(value.chatMessages.at(-1)).toMatchObject({ text: 'Sense ACK', seq: null, estatEnviament: 'error', error: null, codiError: 'EVIDENCIA_SERVIDOR_SENSE_SEQ' });
  });

  it('R32 · un codi SDP del port i un error del xifrat conserven el seu text per a la persona', async () => {
    await obri();
    mock.enviaMissatge.mockRejectedValueOnce(Object.assign(new Error('Esta pàgina ja no existix o no la pots vore.'), { code: 'SDP-XAT-013' }))
      .mockRejectedValueOnce(Object.assign(new Error('La clau de seguretat d’esta persona ha canviat: cal confirmar-la abans d’escriure.'), { codi: 'clau-canviada-forta' }));
    await act(async () => { await value.sendChatMessage({ id: FIL }, 'Primer intent'); });
    await act(async () => { await value.sendChatMessage({ id: FIL }, 'Segon intent'); });
    expect(value.chatMessages.find((m) => m.text === 'Primer intent')).toMatchObject({ estatEnviament: 'error', error: 'Esta pàgina ja no existix o no la pots vore.', codiError: 'SDP-XAT-013' });
    expect(value.chatMessages.find((m) => m.text === 'Segon intent')).toMatchObject({ estatEnviament: 'error', error: 'La clau de seguretat d’esta persona ha canviat: cal confirmar-la abans d’escriure.', codiError: 'clau-canviada-forta' });
  });

  it('R32 · F7: el missatge que el motor E2EE encua a la safata queda pendent, sense ✓, sense error i sense reintent, també després d’una renovació', async () => {
    const vista = await obri();
    mock.enviaMissatge.mockImplementation(async (filId, p) => Object.freeze({ id: p.id, filId, encuat: true, reintentable: true, codi: 'encuat' }));
    let resposta;
    await act(async () => { resposta = await value.sendChatMessage({ id: FIL }, 'A la safata'); });
    expect(resposta).toEqual([]);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    const id = mock.enviaMissatge.mock.calls[0][1].id;
    expect(value.chatMessages.find((m) => m.id === id)).toMatchObject({ text: 'A la safata', seq: null, estatEnviament: 'pendent', estatSincronitzacio: 'cua_local', error: null });
    /* Una renovació (mateix àmbit) no la passa a error: «Descarta» no la trauria de la safata. */
    mock.session = { ...mock.session, generacio: 2 };
    vista.rerender(arbre());
    await act(async () => { await Promise.resolve(); });
    expect(value.chatMessages.find((m) => m.id === id)).toMatchObject({ estatEnviament: 'pendent', error: null });
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
  });

  it('un canvi d’actor talla el transport en vol i no projecta la resposta antiga al nou àmbit', async () => {
    const vista = await obri();
    let resolve;
    mock.enviaMissatge.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    let enviament;
    act(() => { enviament = value.sendChatMessage({ id: FIL }, 'Privat'); });
    await waitFor(() => expect(mock.enviaMissatge).toHaveBeenCalledTimes(1));
    const id = mock.enviaMissatge.mock.calls[0][1].id;
    const antic = value;
    mock.actor = { tipus: 'entitat', id: 'org-A', nom: 'Entitat' }; mock.actorKey = 'entitat-A';
    vista.rerender(arbre());
    await act(async () => { expect(await enviament).toEqual([]); });
    expect(mock.enviaMissatge.mock.calls[0][2].signal.aborted).toBe(true);
    expect(antic.getThreadMessages(FIL)).toEqual([]);
    expect(value.getThreadMessages(FIL).some((m) => m.id === id)).toBe(false);
    await act(async () => { resolve({ id, filId: FIL, usuariId: USER, text: 'Privat', seq: 2 }); });
    expect(value.getThreadMessages(FIL).some((m) => m.id === id)).toBe(false);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
  });
});
