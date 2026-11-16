/* Onada R32 (corrector del clúster e2ee_xat_cablejat) · El tros diferit del
   cablejat rural (cablejatXatRural.js, R30.2) no arriba: una pestanya d'abans
   d'un desplegament el demana a un hash retirat, o no hi ha xarxa. Abans de
   R30.2 ni la lectura ni l'enviament depenien de cap tros. Ara:
     · la lectura bona del servidor es pinta igualment (XC-03/B04), sense avís;
     · l'enviament no arriba al port i la bombolla diu el «No s'ha enviat» de
       sempre (error null, codiError XAT_TROS_NO_CARREGAT), mai el text tècnic
       del navegador; «Torna-ho a provar» torna a demanar el tros. */
import { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { XatProvider, useXat } from './XatContext.jsx';
import { textDErrorDelXat } from './errorsXat.js';

const ID = '11111111-1111-4111-8111-111111111111';
const FIL = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ERROR_NAVEGADOR = 'Failed to fetch dynamically imported module: https://socdepoble.org/assets/cablejatXatRural-AbCd1234.js';
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
/* El tros que no arriba: cada import() diferit rebutja. */
vi.mock('./cablejatXatRural.js', () => { throw new TypeError('Failed to fetch dynamically imported module: https://socdepoble.org/assets/cablejatXatRural-AbCd1234.js'); });

const CONFIG = { dataMode: 'remote', backendUrl: 'https://test.invalid', tenantId: null };
let value;
function Sonda() { const actual = useXat(); useLayoutEffect(() => { value = actual; }); return null; }
const arbre = () => <StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>;
const fil = (extra = {}) => ({ id: FIL, tipus: 'directe', titol: 'Conversa', altresNoms: [], ultimSeq: 1, llegitFinsSeq: 1, llegitPelsAltresFinsSeq: 0, rebutPelsAltresFinsSeq: 0, ...extra });
const t = (_, reserva) => reserva;
beforeEach(() => {
  vi.resetAllMocks();
  mock.session = { currentUser: { id: USER }, generacio: 1, estat: 'dins' };
  mock.loadFils.mockResolvedValue([fil()]);
  mock.loadMissatges.mockResolvedValue([{ id: ID, filId: FIL, usuariId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', text: 'Bon dia', seq: 1 }]);
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
  mock.teCapacitat.mockReturnValue(false);
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub-A', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.loadPerfilPublic.mockResolvedValue(null);
  mock.enviaMissatge.mockImplementation(async (_, p) => ({ id: p.id, filId: FIL, usuariId: USER, text: p.text, seq: 2 }));
});
afterEach(() => { cleanup(); });

describe('R32 · el tros diferit del cablejat rural no arriba', () => {
  it('la lectura bona del servidor es pinta igualment, sense avís ni projecció', async () => {
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    act(() => value.obriFil(FIL));
    await waitFor(() => expect(value.getThreadMessages(FIL).map((m) => m.text)).toEqual(['Bon dia']));
    expect(value.avisFil(FIL)).toBeNull();
    expect(value.getThreadMessages(FIL)[0]).not.toHaveProperty('estatSincronitzacio');
  });

  it('l’enviament no arriba al port: «No s’ha enviat» traduït, mai el text del navegador, i el reintent torna a provar', async () => {
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    act(() => value.obriFil(FIL));
    await waitFor(() => expect(value.getThreadMessages(FIL)).toHaveLength(1));
    let resposta;
    await act(async () => { resposta = await value.sendChatMessage({ id: FIL }, 'Demà a les 8'); });
    expect(resposta).toEqual([]);
    expect(mock.enviaMissatge).not.toHaveBeenCalled();
    const bombolla = value.getThreadMessages(FIL).find((m) => m.text === 'Demà a les 8');
    expect(bombolla).toMatchObject({ estatEnviament: 'error', error: null, codiError: 'XAT_TROS_NO_CARREGAT' });
    const text = textDErrorDelXat({ code: bombolla.codiError, message: bombolla.error }, t, t('section.xat.missatge.noEnviat', "No s'ha enviat"));
    expect(text).toBe("No s'ha enviat");
    expect(text).not.toContain(ERROR_NAVEGADOR);
    await act(async () => { await value.reintenta(bombolla.id); });
    expect(mock.enviaMissatge).not.toHaveBeenCalled();
    expect(value.getThreadMessages(FIL).find((m) => m.id === bombolla.id)).toMatchObject({ estatEnviament: 'error', error: null, codiError: 'XAT_TROS_NO_CARREGAT' });
  });
});
