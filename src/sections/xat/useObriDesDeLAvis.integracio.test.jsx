/* B8C-6 (marató 261101_2143; B8-CLIENT §5.1, ARB-07) · useObriDesDeLAvis
   amb el XatProvider DE DEBÒ, el router de memòria de debò, el registre de
   debò dels avisos push i el port simulat (arnés de XatContext.silenci).

   El defecte que vigila: després d'`await xat.recarrega()`, els fils del
   render encara són els vells (el context escriu la seua ref al moment, però
   chatThreads canvia en el pintat següent). Si el destí es calculara dins de
   la promesa, un avís d'una conversa NOVA no la trobaria i la persona es
   quedaria on era. Ací, abans del toc la llista no té cap no llegit; la
   recàrrega tarda 50 ms i porta un fil nou amb un missatge: després del toc,
   la ruta ha de ser la d'eixe fil.

   La bandera és la de debò (apagada): el toc no en depén (només arriba si hi
   ha un adaptador registrat), i la ruta de l'avís només lleva el marcador. */
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../host.js';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { XatProvider, useXat } from './XatContext.jsx';
import { ambXatsPerDefecte } from '../../data/xatsPerDefecte.js';
import { AVISOS_PUSH_XAT_ACTIUS, registraAvisosPush } from '../../config/avisosPushXat.js';
import useObriDesDeLAvis from './useObriDesDeLAvis.js';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A', showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn(() => true)
}));
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => mock.session,
  useSessioOpcional: () => ({ estat: 'dins', currentUser: mock.session.currentUser })
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: undefined }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, reserva) => reserva }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

let toca = null;
registraAvisosPush({
  tipus: 'web',
  motiu: () => null,
  estat: async () => ({ estat: 'inactiu' }),
  activa: async () => ({ estat: 'actiu' }),
  desactiva: async () => ({ estat: 'inactiu' }),
  sincronitza: async () => ({ estat: 'inactiu' }),
  neteja: async () => {},
  oblida: () => {},
  escoltaToc: (fn) => { toca = fn; return () => {}; }
});

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
const ara = '2026-11-02T05:00:00Z';
/* Pepa: llegida. Quim: una conversa nova, amb un missatge. */
const filDePepa = () => ({ id: 'f-pepa', tipus: 'directe', titol: 'Pepa', altres: [{ id: 'P', nom: 'Pepa', tipus: 'persona' }], ultimSeq: 4, llegitFinsSeq: 4, noLlegits: 0, ultimAutorId: 'P', ultimAl: ara });
const filDeQuim = () => ({ id: 'f-quim', tipus: 'directe', titol: 'Quim', altres: [{ id: 'Q', nom: 'Quim', tipus: 'persona' }], ultimSeq: 1, llegitFinsSeq: 0, noLlegits: 1, ultimAutorId: 'Q', ultimAl: ara });

let value = null;
function Sonda() {
  useObriDesDeLAvis();
  value = useXat();
  return null;
}
let rutes = [];
const munta = (rutaInicial) => render(
  <MemoryRouter rutaInicial={rutaInicial} onCanvi={(ruta) => { rutes.push(ruta); }}>
    <XatProvider config={CONFIG}><Sonda /></XatProvider>
  </MemoryRouter>
);
const ultimaRuta = () => rutes[rutes.length - 1];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  rutes = [];
  value = null;
  mock.loadFils.mockResolvedValue(ambXatsPerDefecte([filDePepa()]));
  mock.loadMissatges.mockResolvedValue([]);
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.teCapacitat.mockImplementation(() => true);
});
afterEach(() => { cleanup(); localStorage.clear(); });

test('toc → recàrrega de 50 ms amb un fil NOU no llegit → la ruta és la d\'eixe fil (el destí es calcula després del pintat)', async () => {
  munta('/mur');
  await waitFor(() => expect(value?.status).toBe('ready'));
  await waitFor(() => expect(value.chatThreads.some((f) => f.id === 'f-pepa')).toBe(true));
  expect(value.chatThreads.filter((f) => Number(f.noLlegits) > 0 && !String(f.id).startsWith('sdp-per-defecte:'))).toEqual([]);
  const carreguesAbans = mock.loadFils.mock.calls.length;

  mock.loadFils.mockImplementation(() => new Promise((resol) => {
    setTimeout(() => resol(ambXatsPerDefecte([filDePepa(), filDeQuim()])), 50);
  }));
  expect(typeof toca).toBe('function');
  await act(async () => { toca({}); });

  await waitFor(() => expect(ultimaRuta()).toBe('/xat/f-quim'));
  expect(mock.loadFils.mock.calls.length).toBe(carreguesAbans + 1);
  expect(value.chatThreads.some((f) => f.id === 'f-quim')).toBe(true);
});

test('toc amb la llista ja fresca i cap no llegit: la persona es queda on és', async () => {
  munta('/xat/f-pepa');
  await waitFor(() => expect(value?.status).toBe('ready'));
  await waitFor(() => expect(value.chatThreads.some((f) => f.id === 'f-pepa')).toBe(true));
  const abans = [...rutes];
  await act(async () => { toca({}); });
  await waitFor(() => expect(mock.loadFils.mock.calls.length).toBeGreaterThan(1));
  await act(async () => { await new Promise((r) => { setTimeout(r, 30); }); });
  expect(rutes).toEqual(abans);
});

test('amb la bandera de debò (apagada), /xat?obri=no-llegits només lleva el marcador i no recarrega res de més', async () => {
  expect(AVISOS_PUSH_XAT_ACTIUS).toBe(false);
  munta('/xat?obri=no-llegits');
  await waitFor(() => expect(ultimaRuta()).toBe('/xat'));
  await waitFor(() => expect(value?.status).toBe('ready'));
  /* Només la càrrega inicial del proveïdor (i el que faça per ell mateix), cap pel marcador. */
  const carregues = mock.loadFils.mock.calls.length;
  await act(async () => { await new Promise((r) => { setTimeout(r, 30); }); });
  expect(mock.loadFils.mock.calls.length).toBe(carregues);
  expect(rutes.filter((r) => r.includes('obri='))).toEqual(['/xat?obri=no-llegits']);
});
