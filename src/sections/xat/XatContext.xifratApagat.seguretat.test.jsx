import { StrictMode } from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { XatProvider, useXat } from '../../sections/xat/XatContext.jsx';
import useXifratXat from '../../sections/xat/useXifratXat.js';
import { serveiXifratXat } from '../../data/xifratXat.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { backendScope } from '../../config/backendConfig.js';
import { delEfimer, getEfimer, setEfimer } from '../../config/storage.js';
import { CLAU_OBLITS_PENDENTS } from '../../data/xifratXatEixida.js';

const m = vi.hoisted(() => ({ session: {}, actorKey: '', backend: null, hostReady: null, loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(), creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(), obriFilDePagina: vi.fn(), teCapacitat: vi.fn(), showToast: vi.fn(), getBackendImplementation: vi.fn(), clausDelContextXat: vi.fn() }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => m.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: m.actorKey, identitats: undefined }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: '/xat' }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.showToast }) }));
vi.mock('../../data/backendPort.js', () => ({ ...m, getBackendImplementation: m.getBackendImplementation }));
vi.mock('../../host.js', () => ({ quanLlest: async () => { await m.hostReady; } }));
vi.mock('../../data/xifratXatContext.js', () => ({ clausDelContextXat: m.clausDelContextXat }));

const A = 'aaaaaaaa-1111-4111-8111-111111111111', B = 'bbbbbbbb-2222-4222-8222-222222222222';
const CONFIG = { backendId: 'supabase', supabaseUrl: 'https://backend.example.test', dataMode: 'remote', tenantId: null };
let value, consola;
function Sonda() { value = useXat(); return null; }
const arbre = (config = CONFIG) => <StrictMode><XatProvider config={config}><Sonda /></XatProvider></StrictMode>;
beforeEach(() => {
  vi.clearAllMocks();
  m.hostReady = null; m.session = { currentUser: { id: A }, generacio: 1, estat: 'dins' }; m.actorKey = `persona::${A}`; m.backend = {};
  m.getBackendImplementation.mockImplementation(() => m.backend);
  m.clausDelContextXat.mockImplementation(() => { throw new Error('clausDelContextXat no s’ha de cridar amb el flag apagat'); });
  m.loadFils.mockResolvedValue([]); m.loadMissatges.mockResolvedValue([]); m.subscribeToXat.mockResolvedValue({ subscription: null, error: null }); m.unsubscribeFromXat.mockResolvedValue(null); m.teCapacitat.mockReturnValue(false);
  vi.stubGlobal('indexedDB', { open: vi.fn() });
  consola = ['log', 'warn', 'error', 'info', 'debug'].map((k) => vi.spyOn(console, k));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const sorollE2EE = () => consola.flatMap((s) => s.mock.calls).map((c) => c.map(String).join(' ')).filter((t) => /xifra|e2ee|clau|indexeddb/i.test(t));

test('XatProvider amb el flag real: ready, cap clau de context, cap servei, cap IndexedDB, cap estat nou ni soroll', async () => {
  expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
  const v = render(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(m.loadFils).toHaveBeenCalled();
  expect(m.clausDelContextXat).not.toHaveBeenCalled();
  expect(m.getBackendImplementation).not.toHaveBeenCalled();
  expect(serveiXifratXat(m.backend)).toBeNull();
  expect(Object.keys(value).filter((k) => /xifra|e2ee|clau/i.test(k))).toEqual([]);
  // P1-12 pas 17 (D-09) · L'oblit en eixir: null, false i un reintent que no toca res
  expect(value.oblitXat).toBeNull();
  expect(value.oblitXatFallit).toBe(false);
  await expect(value.reintentaOblitXat()).resolves.toBeNull();
  expect(document.querySelector('dialog')).toBeNull();
  // Renovació de JWT, canvi d’actor i A→B→A: res de nou passa pel xifratge
  m.session = { ...m.session, generacio: 2 }; v.rerender(arbre());
  m.actorKey = `entitat::${B}`; v.rerender(arbre());
  m.actorKey = `persona::${A}`; v.rerender(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  v.unmount();
  expect(m.clausDelContextXat).not.toHaveBeenCalled();
  expect(m.getBackendImplementation).not.toHaveBeenCalled();
  expect(globalThis.indexedDB.open).not.toHaveBeenCalled();
  expect(sorollE2EE()).toEqual([]);
});

let sincronitza;
function SondaHook({ actor = `persona::${A}`, jwt = 1 }) { void jwt; sincronitza = useXifratXat({ config: CONFIG, joId: A, ambitEstable: JSON.stringify([backendScope(CONFIG), A, actor]) }); return null; }
test('useXifratXat amb el flag real: callback estable, retorna null, no consulta el port ni el context', () => {
  const v = render(<StrictMode><SondaHook /></StrictMode>);
  const primer = sincronitza;
  expect(primer()).toBeNull();
  v.rerender(<StrictMode><SondaHook jwt={2} /></StrictMode>);
  v.rerender(<StrictMode><SondaHook actor={`entitat::${B}`} /></StrictMode>);
  expect(sincronitza).toBe(primer);
  expect(sincronitza()).toBeNull();
  v.unmount();
  expect(m.clausDelContextXat).not.toHaveBeenCalled();
  expect(m.getBackendImplementation).not.toHaveBeenCalled();
  expect(sorollE2EE()).toEqual([]);
});

/* P1-12 pas 17 (D-09) · Ni una marca d'OBLIT_FALLIT d'una altra sessió a la capa
   efímera (recàrrega després d'eixir) fa res amb la bandera apagada: ni la
   llig, ni l'esborra, ni pinta l'avís, ni toca el port. */
test('XatProvider amb el flag real i una marca d’oblit pendent: cap avís, cap lectura, cap crida', async () => {
  const marca = [{ ci: JSON.stringify(['supabase', CONFIG.supabaseUrl, A]), mantenSessio: false, pendents: ['indexeddb'], quanMs: 1 }];
  setEfimer(CLAU_OBLITS_PENDENTS, marca);
  try {
    m.session = { currentUser: null, generacio: 2, estat: 'fora' };
    const v = render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.oblitXat).toBeNull();
    expect(value.oblitXatFallit).toBe(false);
    await expect(value.reintentaOblitXat()).resolves.toBeNull();
    expect(document.querySelector('dialog')).toBeNull();
    expect(v.container.innerHTML).toBe('');
    v.unmount();
    expect(getEfimer(CLAU_OBLITS_PENDENTS, null)).toEqual(marca);
    expect(m.getBackendImplementation).not.toHaveBeenCalled();
    expect(globalThis.indexedDB.open).not.toHaveBeenCalled();
    expect(sorollE2EE()).toEqual([]);
  } finally {
    delEfimer(CLAU_OBLITS_PENDENTS);
  }
});
