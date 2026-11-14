/* R22 (A-xat-fluxos-r1-2, Onada R22) · Una bombolla que espera la xarxa (XC-03)
   i la sessió que cau a «fora» (el que fa sessionService quan la renovació falla
   amb el JWT ja caducat: tancaPestanya → emetCanvi(null) → sincronitza). La
   pestanya s'ha buidat però el registre la pot tornar (sessioRecuperable): quan
   torna la MATEIXA persona, la bombolla torna en error, amb el text i el mateix
   id, i «Torna-ho a provar» la reenvia. Eixir de veres o una altra persona no
   la recuperen mai. Abans: la bombolla desapareixia sense avís. */
import { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { XatProvider, useXat } from './XatContext.jsx';

const mock = vi.hoisted(() => ({
  session: null, showToast: vi.fn(), recuperable: true,
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(), teCapacitat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: 'persona::A', identitats: undefined }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: '/xat' }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...await importOriginal(),
  loadFils: mock.loadFils, loadMissatges: mock.loadMissatges, enviaMissatge: mock.enviaMissatge, marcaLlegit: mock.marcaLlegit,
  subscribeToXat: mock.subscribeToXat, unsubscribeFromXat: mock.unsubscribeFromXat, teCapacitat: mock.teCapacitat
}));
vi.mock('../../data/identitat.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, sessioRecuperable: () => mock.recuperable };
});
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a', backendUrl: 'https://exemple.supabase.co' };
const TEXT = 'Vine a la plaça, que no tinc cobertura';
const fil = () => ({ id: 'fil-A', titol: 'Pepa', altresNoms: [], ultimSeq: 1, llegitFinsSeq: 1, llegitPelsAltresFinsSeq: 0, noLlegits: 0, ultimAutorId: 'X', ultimAl: '2026-11-13T10:00:00Z' });
let value;
function Sonda() { const actual = useXat(); useLayoutEffect(() => { value = actual; }); value = actual; return null; }
const arbre = () => <StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>;
const bombolles = () => value.getThreadMessages('fil-A').map((m) => [m.text, m.estatEnviament]);

beforeEach(() => {
  vi.clearAllMocks();
  mock.recuperable = true;
  mock.session = { currentUser: { id: 'A' }, generacio: 1, estat: 'dins' };
  mock.loadFils.mockResolvedValue([fil()]);
  mock.loadMissatges.mockResolvedValue([]);
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

/* Sense cobertura, una bombolla espera la xarxa; la sessió cau. */
async function bombollaQueEsperaICau(vista) {
  await waitFor(() => expect(value.status).toBe('ready'));
  vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
  mock.enviaMissatge.mockRejectedValue(Object.assign(new Error('Load failed'), { code: 'XARXA', retriable: true }));
  let promesa;
  await act(async () => { promesa = value.sendChatMessage({ id: 'fil-A' }, TEXT); await Promise.resolve(); });
  await waitFor(() => expect(mock.enviaMissatge).toHaveBeenCalledTimes(1));
  expect(bombolles()).toEqual([[TEXT, 'pendent']]);
  const id = mock.enviaMissatge.mock.calls[0][1].id;
  mock.session = { currentUser: null, generacio: 2, estat: 'fora' };
  await act(async () => { vista.rerender(arbre()); });
  expect(await promesa).toEqual([]);
  return id;
}
async function tornaLaSessio(vista, id) {
  mock.session = { currentUser: { id }, generacio: 3, estat: 'dins' };
  await act(async () => { vista.rerender(arbre()); });
  await waitFor(() => expect(value.status).toBe('ready'));
}

it('R22 · la renovació fallida buida la pestanya i torna la mateixa persona: la bombolla torna en error i es reenvia amb el mateix id', async () => {
  const vista = render(arbre());
  const id = await bombollaQueEsperaICau(vista);
  expect(value.getThreadMessages('fil-A')).toEqual([]);           // cap bombolla visible sense sessió
  vi.restoreAllMocks();                                             // torna la cobertura
  await tornaLaSessio(vista, 'A');
  const tornada = value.getThreadMessages('fil-A');
  expect(tornada.map((m) => [m.id, m.text, m.estatEnviament])).toEqual([[id, TEXT, 'error']]);
  mock.enviaMissatge.mockReset().mockResolvedValue({ id, fil_id: 'fil-A', usuari_id: 'A', text: TEXT, seq: 2, creat_al: '2026-11-13T10:05:00Z' });
  await act(async () => { await value.reintenta(id); });
  expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
  expect(mock.enviaMissatge.mock.calls[0][1]).toMatchObject({ id, text: TEXT });
  expect(bombolles().map(([, estat]) => estat)).not.toContain('error');
});

it('R22 · una altra persona entra a la pestanya: no veu la bombolla, i A ja no la recupera després', async () => {
  const vista = render(arbre());
  await bombollaQueEsperaICau(vista);
  vi.restoreAllMocks();
  await tornaLaSessio(vista, 'B');
  expect(value.getThreadMessages('fil-A')).toEqual([]);
  mock.session = { currentUser: null, generacio: 4, estat: 'fora' };
  await act(async () => { vista.rerender(arbre()); });
  await tornaLaSessio(vista, 'A');
  expect(value.getThreadMessages('fil-A')).toEqual([]);
});

it('R22 · eixir de veres (la sessió ja no és recuperable) oblida la bombolla, com fins ara', async () => {
  mock.recuperable = false;
  const vista = render(arbre());
  await bombollaQueEsperaICau(vista);
  vi.restoreAllMocks();
  await tornaLaSessio(vista, 'A');
  expect(value.getThreadMessages('fil-A')).toEqual([]);
});
