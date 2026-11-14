/* R24 · Gauntlet Loop, ronda 2 (G-client-1 i G-client-2) · Prova de regressió permanent (arnés copiat de XatContext.entregaSegonPla.r24.test.jsx).
   R24 · xat_entrega (IDEA-260 b, P0-2) · Entrega en segon pla al proveïdor
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


const uuid = (n) => `24000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

describe('G-client · entrega en segon pla amb missatges que el servidor ja no torna', () => {
  it('G-client-1 · cinc converses amb missatges temporals caducats (xat_nous no els torna) es tornen a demanar a CADA llista i la sisena, amb novetats de veres, no arriba mai', async () => {
    /* ultim_seq compta els temporals caducats; xat_historial/xat_nous els filtren
       (caduca_al, 2610311800:841/924). El cursor no hi arriba mai i el fil
       continua sent candidat de filsPerEntregar per sempre. */
    const encallats = [1, 2, 3, 4, 5].map((i) => fil(uuid(i), 9, 0, { ultimAl: `2026-11-14T0${i}:30:00Z` }));
    const deVeres = fil(uuid(6), 2, 0, { ultimAl: '2026-11-13T23:00:00Z' });
    mock.loadFils.mockImplementation(async () => [...encallats, deVeres]);
    mock.loadMissatges.mockImplementation(async (filId) => (filId === uuid(6) ? [msg(filId, 1), msg(filId, 2)] : []));
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    await buidaCua();
    for (let i = 0; i < 3; i += 1) {
      await act(async () => { await value.recarrega(); });
      await buidaCua();
    }
    const perFil = filsCarregats().reduce((a, id) => ({ ...a, [id]: (a[id] ?? 0) + 1 }), {});
    /* Una llista inicial + 3 sondejos: cada encallat demanat 4 vegades, el de veres cap. */
    expect(perFil[uuid(6)] ?? 0, `la conversa amb novetats reals no s'ha descarregat; peticions: ${JSON.stringify(perFil)}`).toBeGreaterThan(0);
    expect(Math.max(...encallats.map((f) => perFil[f.id] ?? 0)), 'un fil sense res nou que descarregar no es torna a demanar a cada sondeig').toBeLessThanOrEqual(1);
  });


  it('G-client-1 · variant · cinc converses on la lectura falla sempre (p. ex. un sobre xifrat invàlid fa llançar l’adaptador) també tapen la sisena', async () => {
    const trencats = [1, 2, 3, 4, 5].map((i) => fil(uuid(10 + i), 4, 0, { ultimAl: `2026-11-14T0${i}:30:00Z` }));
    const deVeres = fil(uuid(16), 2, 0, { ultimAl: '2026-11-13T23:00:00Z' });
    mock.loadFils.mockImplementation(async () => [...trencats, deVeres]);
    mock.loadMissatges.mockImplementation(async (filId) => {
      if (filId === uuid(16)) return [msg(filId, 1), msg(filId, 2)];
      throw new TypeError('Sobre xifrat de recepció invàlid.');
    });
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    await buidaCua();
    for (let i = 0; i < 3; i += 1) { await act(async () => { await value.recarrega(); }); await buidaCua(); }
    const perFil = filsCarregats().reduce((a, id) => ({ ...a, [id]: (a[id] ?? 0) + 1 }), {});
    expect(perFil[uuid(16)] ?? 0, `peticions: ${JSON.stringify(perFil)}`).toBeGreaterThan(0);
  });


  it('G-client-2 · la primera passada després d’arrencar (cursor buit) baixa l’última pàgina (50) i confirma «ha arribat» també dels 70 que no ha baixat', async () => {
    /* Damià ha enviat 120 missatges mentre l'aplicació era tancada. xat_historial
       (càrrega completa, límit 50) en torna 71..120; el cursor passa a 120 i el
       rebut (un prefix: «tot fins a 120») confirma també 1..70, que cap byte
       no ha portat a l'aparell. */
    const ID = uuid(30);
    mock.loadFils.mockImplementation(async () => [fil(ID, 120, 0)]);
    mock.loadMissatges.mockImplementation(async (filId, opcions) => {
      const des = opcions?.despresDeSeq;
      const seqs = des == null ? Array.from({ length: 50 }, (_, i) => 71 + i) : [];
      return seqs.map((s) => msg(filId, s));
    });
    render(arbre());
    await waitFor(() => expect(filsCarregats()).toContain(ID));
    await buidaCua();
    const rebuts = mock.marcaLlegit.mock.calls.filter(([id]) => id === ID).map(([, c]) => c.rebutFinsSeq);
    expect(rebuts.every((r) => r <= 0), `rebuts enviats: ${JSON.stringify(rebuts)} (els missatges 1..70 no s'han descarregat)`).toBe(true);
  });

  it('G-client-2 · amb el forat obert, un sondeig incremental tampoc confirma; l’historial cap arrere que arriba al començament el tanca i el rebut ix', async () => {
    const ID = uuid(31);
    let ultim = 120;
    mock.loadFils.mockImplementation(async () => [fil(ID, ultim, 0)]);
    mock.loadMissatges.mockImplementation(async (filId, opcions) => {
      if (opcions?.abansDeSeq != null) {
        const fins = opcions.abansDeSeq - 1;
        const des = Math.max(1, fins - 49);
        return Array.from({ length: fins - des + 1 }, (_, i) => msg(filId, des + i));
      }
      if (opcions?.despresDeSeq != null) {
        return Array.from({ length: Math.max(0, ultim - opcions.despresDeSeq) }, (_, i) => msg(filId, opcions.despresDeSeq + 1 + i));
      }
      return Array.from({ length: 50 }, (_, i) => msg(filId, 71 + i));
    });
    render(arbre());
    await waitFor(() => expect(filsCarregats()).toContain(ID));
    await buidaCua();
    ultim = 121;
    await act(async () => { await value.recarrega(); });
    await buidaCua();
    const rebuts = () => mock.marcaLlegit.mock.calls.filter(([id]) => id === ID).map(([, c]) => c.rebutFinsSeq);
    expect(mock.loadMissatges.mock.calls.some(([id, o]) => id === ID && o?.despresDeSeq === 120)).toBe(true);
    expect(rebuts(), 'cap rebut amb el forat 1..70 obert').toEqual([]);
    /* La persona puja per la conversa: 21..70 (plena) i 1..20 (no plena, el començament). */
    await act(async () => { await value.carregaMesAntics(ID); });
    expect(rebuts(), 'una pàgina plena encara no arriba al rebut del servidor + 1').toEqual([]);
    await act(async () => { await value.carregaMesAntics(ID); });
    await buidaCua();
    expect(rebuts()).toEqual([121]);
  });

  it('sobreviu · canvi d’actor mentre carregaMissatges vola: cap rebut sota l’actor nou ni sota el vell', async () => {
    let allibera;
    mock.loadFils.mockImplementation(async () => [fil(A, 5, 2)]);
    mock.loadMissatges.mockImplementation((filId) => new Promise((ok) => { allibera = () => ok([msg(filId, 3), msg(filId, 4), msg(filId, 5)]); }));
    const vista = render(arbre());
    await waitFor(() => expect(mock.loadMissatges).toHaveBeenCalledTimes(1));
    mock.actorKey = 'entitat::ORG';
    mock.loadFils.mockImplementation(async () => []);
    vista.rerender(arbre());
    await buidaCua();
    await act(async () => { allibera(); });
    await buidaCua();
    expect(mock.marcaLlegit).not.toHaveBeenCalled();
    mock.actorKey = 'persona::A';
  });

  it('sobreviu · sense sessió (eixida) no hi ha segon pla ni rebut', async () => {
    mock.session = { currentUser: null, generacio: 2 };
    render(arbre());
    await buidaCua();
    expect(mock.loadMissatges).not.toHaveBeenCalled();
    expect(mock.marcaLlegit).not.toHaveBeenCalled();
  });

  it('sobreviu · E2EE i visitant no passen pel segon pla; cap repintada no en dispara cap', async () => {
    mock.loadFils.mockImplementation(async () => [
      fil(A, 5, 2, { epocaActual: 1 }),
      fil(B, 5, 2, { participant: false }),
      fil(C, 4, 1)
    ]);
    const vista = render(arbre());
    await waitFor(() => expect(filsCarregats()).toContain(C));
    await buidaCua();
    for (let i = 0; i < 5; i += 1) { vista.rerender(arbre()); await buidaCua(); }
    expect(filsCarregats()).toEqual([C]);
    for (const [, config] of mock.marcaLlegit.mock.calls) expect(config.llegitFinsSeq ?? 0).toBe(0);
  });
});
