/* R24 · xat_entrega (IDEA-260 b, P0-2) · Entrega en segon pla al proveïdor
   real amb el port simulat: després d'aplicar la llista, l'aplicació del
   destinatari descarrega les converses amb novetats que encara no té i
   confirma l'ENTREGA (rebut) dels bytes rebuts, mai la lectura. Així el
   remitent veu ✓✓ gris («ha arribat a l'aplicació») abans que el destinatari
   òbriga la conversa. Arnés de XatContext.verificacio0545.test.jsx. */
import { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: '24000000-0000-4000-8000-0000000000aa' }, generacio: 1 }, actorKey: 'persona::A', pathname: '/mur', showToast: vi.fn(),
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

const REMOT = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
const LLAVOR = { ...REMOT, dataMode: 'seed' };
const A = '24000000-0000-4000-8000-0000000000a1';
const B = '24000000-0000-4000-8000-0000000000b1';
const C = '24000000-0000-4000-8000-0000000000c1';
const ALTRA = '24000000-0000-4000-8000-0000000000ee';
const fil = (id, ultimSeq, rebutFinsSeq, extra = {}) => ({
  id, titol: id, altresNoms: ['Altra'], ultimSeq, llegitFinsSeq: rebutFinsSeq, rebutFinsSeq, noLlegits: ultimSeq - rebutFinsSeq,
  llegitPelsAltresFinsSeq: 0, rebutPelsAltresFinsSeq: 0, ultimAutorId: ALTRA, ultimAl: '2026-11-14T05:00:00Z', ...extra
});
const msg = (filId, seq) => ({ id: `${filId}-m${seq}`, filId, usuariId: ALTRA, text: `t${seq}`, seq, creatAl: '2026-11-14T05:00:00Z' });

let value;
function Sonda() {
  const actual = useXat();
  useLayoutEffect(() => { value = actual; });
  value = actual;
  return null;
}
const arbre = (config = REMOT) => <StrictMode><XatProvider config={config}><Sonda /></XatProvider></StrictMode>;
const buidaCua = () => act(async () => { await new Promise((resol) => setTimeout(resol, 0)); });
const filsCarregats = () => mock.loadMissatges.mock.calls.map(([filId]) => filId);

beforeEach(() => {
  vi.clearAllMocks();
  mock.session = { currentUser: { id: '24000000-0000-4000-8000-0000000000aa' }, generacio: 1 };
  mock.pathname = '/mur';
  mock.loadFils.mockImplementation(async () => [fil(A, 5, 2), fil(B, 3, 3)]);
  mock.loadMissatges.mockImplementation(async (filId) => (filId === A ? [msg(A, 3), msg(A, 4), msg(A, 5)] : []));
  mock.marcaLlegit.mockImplementation(async (_filId, config) => ({ llegitFinsSeq: 2, rebutFinsSeq: config.rebutFinsSeq ?? 0 }));
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('entrega en segon pla (✓✓ gris = ha arribat a l’aplicació)', () => {
  it('sense obrir cap conversa: descarrega la que té novetats i n’envia el rebut, mai la lectura', async () => {
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    await waitFor(() => expect(mock.marcaLlegit).toHaveBeenCalledWith(A, expect.objectContaining({ rebutFinsSeq: 5, llegitFinsSeq: 0 })));
    expect(filsCarregats()).toContain(A);
    expect(filsCarregats()).not.toContain(B);
    for (const [, config] of mock.marcaLlegit.mock.calls) expect(config.llegitFinsSeq ?? 0).toBe(0);
    /* La conversa continua sense llegir: el comptador no baixa per l'entrega. */
    expect(value.totalNoLlegits).toBe(3);
    expect(value.getThreadMessages(A).map((m) => m.seq)).toEqual([3, 4, 5]);
  });

  it('una segona llista sense novetats no torna a descarregar res', async () => {
    render(arbre());
    await waitFor(() => expect(mock.marcaLlegit).toHaveBeenCalledTimes(1));
    mock.loadFils.mockImplementation(async () => [fil(A, 5, 5, { noLlegits: 3 }), fil(B, 3, 3)]);
    await act(async () => { await value.recarrega(); });
    await buidaCua();
    expect(filsCarregats().filter((id) => id === A)).toHaveLength(1);
    expect(mock.marcaLlegit).toHaveBeenCalledTimes(1);
  });

  it('seqüencial i acotada: com a molt cinc converses, una darrere de l’altra', async () => {
    const ids = Array.from({ length: 7 }, (_, i) => `24000000-0000-4000-8000-00000000010${i}`);
    mock.loadFils.mockImplementation(async () => ids.map((id, i) => fil(id, 2, 0, { ultimAl: `2026-11-14T0${i}:00:00Z` })));
    let enVol = 0, maxim = 0;
    mock.loadMissatges.mockImplementation(async (filId) => {
      enVol += 1; maxim = Math.max(maxim, enVol);
      await new Promise((resol) => setTimeout(resol, 1));
      enVol -= 1;
      return [msg(filId, 1), msg(filId, 2)];
    });
    render(arbre());
    await waitFor(() => expect(mock.marcaLlegit).toHaveBeenCalledTimes(5));
    await buidaCua();
    expect(filsCarregats()).toEqual(ids.slice(2).reverse());
    expect(maxim).toBe(1);
  });

  it('el fil obert no passa pel segon pla: ja el descarrega la via d’obrir', async () => {
    mock.loadFils.mockImplementation(async () => [fil(B, 3, 3)]);
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    act(() => value.obriFil(A));
    await waitFor(() => expect(filsCarregats()).toContain(A));
    await buidaCua();
    const abans = filsCarregats().length;
    mock.loadFils.mockImplementation(async () => [fil(A, 6, 2), fil(C, 4, 1), fil(B, 3, 3)]);
    await act(async () => { await value.recarrega(); });
    await waitFor(() => expect(filsCarregats()).toContain(C));
    await buidaCua();
    expect(filsCarregats().slice(abans)).toEqual([C]);
  });

  it('en llavor (sense servidor) no hi ha segon pla', async () => {
    render(arbre(LLAVOR));
    await waitFor(() => expect(value.status).toBe('ready'));
    await buidaCua();
    expect(mock.loadMissatges).not.toHaveBeenCalled();
  });
});
