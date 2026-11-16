/* Onada R32 (corrector xat_tros_paralel) · El tros diferit del cablejat rural
   (cablejatXatRural.js) no rebutja: tarda o es queda penjat (xarxa rural lenta,
   primera obertura després d'un desplegament). XatContext.trosDiferit.test.jsx
   cobrix el tros que rebutja; ací, el que no arriba:
     · la lectura bona del servidor el demana en paral·lel i l'espera com a molt
       el sostre (400 ms): es pinta sense projecció, i les lectures següents del
       fil tampoc no s'hi queden;
     · quan el tros arriba, la projecció s'aplica sense cap lectura nova;
     · amb el tros ja a la memòria (el cas de sempre), el primer pintat ja porta
       la projecció: cap pintat intermedi (Llei del Píxel).
   Les proves comparteixen el registre de mòduls: la primera deixa el tros
   penjat i l'allibera al final; la segona l'allibera (és idempotent) i el
   carrega abans de muntar, siga quin siga l'ordre. */
import { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { XatProvider, useXat } from './XatContext.jsx';

const ALTRE = '11111111-1111-4111-8111-111111111111';
const MEU = '22222222-2222-4222-8222-222222222222';
const NOU = '33333333-3333-4333-8333-333333333333';
const FIL = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const VEI = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const tros = vi.hoisted(() => {
  let deixa;
  const arribat = new Promise((resolve) => { deixa = resolve; });
  return { arribat, deixa };
});
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
/* El tros que no arriba fins que la prova l'allibera: cap rebuig, cap error.
   L'espera va en una dependència del tros (només l'importa ell) i no en el
   mock del tros: Vitest servix el mòdul original a un segon import() que
   arriba mentre la factoria manual encara espera (el seu callstack per
   importador), i cada lectura en fa un. Així, com al navegador, tots els
   import() del tros esperen la mateixa avaluació. */
vi.mock('../../data/xat/estatSincronitzacioRural.js', async (importOriginal) => { await tros.arribat; return importOriginal(); });

const CONFIG = { dataMode: 'remote', backendUrl: 'https://test.invalid', tenantId: null };
let value;
let pintats;
function Sonda() {
  const actual = useXat();
  useLayoutEffect(() => {
    value = actual;
    const missatges = actual.getThreadMessages(FIL);
    if (missatges.length) pintats.push(missatges);
  });
  return null;
}
const arbre = () => <StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>;
const fil = () => ({ id: FIL, tipus: 'directe', titol: 'Conversa', altresNoms: [], ultimSeq: 2, llegitFinsSeq: 2, llegitPelsAltresFinsSeq: 0, rebutPelsAltresFinsSeq: 0 });
let servidor;
const textos = () => value.getThreadMessages(FIL).map((m) => m.text);
const meu = () => value.getThreadMessages(FIL).find((m) => m.id === MEU);

beforeEach(() => {
  vi.resetAllMocks();
  pintats = [];
  servidor = [
    { id: ALTRE, filId: FIL, usuariId: VEI, text: 'Bon dia', seq: 1 },
    { id: MEU, filId: FIL, usuariId: USER, text: 'Bon dia, Pepa', seq: 2 },
  ];
  mock.session = { currentUser: { id: USER }, generacio: 1, estat: 'dins' };
  mock.loadFils.mockResolvedValue([fil()]);
  /* Completa sense cursor; incremental (despresDeSeq), només el que és nou. */
  mock.loadMissatges.mockImplementation(async (_, opcions = {}) => servidor
    .filter((m) => opcions.despresDeSeq == null || m.seq > opcions.despresDeSeq));
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 2, rebutFinsSeq: 2 });
  mock.teCapacitat.mockReturnValue(false);
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub-A', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.loadPerfilPublic.mockResolvedValue(null);
});
afterEach(() => { cleanup(); });

describe('R32 · el tros diferit del cablejat rural tarda o es queda penjat', () => {
  it('la lectura bona es pinta dins del sostre, l’avís següent no l’espera i el tros, quan arriba, porta la projecció sense llegir de nou', async () => {
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    act(() => value.obriFil(FIL));
    /* Abans: [] per sempre (la lectura esperava l'import() penjat). El tros no
       arriba mai en esta part: si es pinta, és pel sostre. Marge per contenció. */
    await waitFor(() => expect(textos()).toEqual(['Bon dia', 'Bon dia, Pepa']), { timeout: 3000 });
    expect(meu()).not.toHaveProperty('estatSincronitzacio');
    expect(value.avisFil(FIL)).toBeNull();

    /* Un avís del fil amb el tros encara penjat: la lectura incremental també es pinta. */
    servidor.push({ id: NOU, filId: FIL, usuariId: VEI, text: 'Demà plou', seq: 3 });
    act(() => value.recarregaFil(FIL));
    await waitFor(() => expect(textos()).toEqual(['Bon dia', 'Bon dia, Pepa', 'Demà plou']), { timeout: 3000 });
    expect(meu()).not.toHaveProperty('estatSincronitzacio');

    /* Arriba el tros: la projecció s'aplica als missatges ja pintats, sense cap lectura nova. */
    const lectures = mock.loadMissatges.mock.calls.length;
    await act(async () => { tros.deixa(); await tros.arribat; });
    await waitFor(() => expect(meu()).toHaveProperty('estatSincronitzacio'));
    expect(meu().estatSincronitzacio).not.toBe('error_reintentable');
    expect(mock.loadMissatges).toHaveBeenCalledTimes(lectures);
    expect(textos()).toEqual(['Bon dia', 'Bon dia, Pepa', 'Demà plou']);
  });

  it('amb el tros ja a la memòria, el primer pintat ja porta la projecció (cap pintat sense)', async () => {
    tros.deixa();
    await import('./cablejatXatRural.js');
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    act(() => value.obriFil(FIL));
    await waitFor(() => expect(meu()).toHaveProperty('estatSincronitzacio'));
    const ambElMeu = pintats.filter((llista) => llista.some((m) => m.id === MEU));
    expect(ambElMeu.length).toBeGreaterThan(0);
    for (const llista of ambElMeu) {
      expect(llista.find((m) => m.id === MEU)).toHaveProperty('estatSincronitzacio');
    }
  });
});
