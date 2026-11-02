/* M02 (marató 261101_2143; P1-12, disseny E2EE §4.4, CS-01, D-05 a) · El hook dels
   canvis de clau d'una conversa. Amb la bandera apagada (el valor de veres), cap
   lectura del port ni del servei i sempre el mateix objecte inert. Amb la bandera
   encesa (només ací, per una sonda del mòdul) i un servei simulat amb el contracte
   de l'especificació B2 §2.1.6: estats, bloqueig, cap resultat tardà ni d'un altre
   abast (PC155-02), ritme de refresc, acceptació només del canvi que es mostra,
   cap desbloqueig per una lectura fallida i els avisos suaus fins que es tanquen. */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ encesa: false, servei: null, backend: { nom: 'backend' } }));
vi.mock('../../config/xifratXat.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    get E2EE_ACTIU_PER_DEFECTE() { return m.encesa; }
  };
});
vi.mock('../../data/backendPort.js', () => ({ getBackendImplementation: vi.fn(() => m.backend) }));
vi.mock('../../data/xifratXat.js', () => ({ serveiXifratXat: vi.fn(() => m.servei) }));

const { getBackendImplementation } = await import('../../data/backendPort.js');
const { serveiXifratXat } = await import('../../data/xifratXat.js');
const { E2EE_ACTIU_PER_DEFECTE: BANDERA_REAL } = await vi.importActual('../../config/xifratXat.js');
const { TEXTOS_XIFRATGE } = await import('./estatXifratgeFil.js');
const {
  CANVIS_INERTS, ESTAT_CANVIS, MS_REFRESC_CANVIS, TEXT_BARRA_SENSE_CLAU, avisDelBloqueig, esFalladaDeClau, esManipulacio, nomDelMembre,
  normalitzaCanvis, teClauNova, useCanvisDeClau
} = await import('./useCanvisDeClau.js');

const PEPA = '22222222-2222-4222-8222-222222222222';
const TONI = '33333333-3333-4333-8333-333333333333';
const FIL = Object.freeze({ id: 'f-directe', tipus: 'directe', ultimSeq: 10, altres: [{ id: PEPA, nom: 'Pepa', tipus: 'persona' }] });
const NET = Object.freeze({ pendents: [], suaus: [], alarmes: [] });
const PENDENT = Object.freeze({ pendents: [{ usuari: PEPA, motiu: 'sense-continuitat', kidFixat: 'kid-vell', kidNou: 'kid-nou' }], suaus: [], alarmes: [] });

function promesaManual() {
  let resol;
  let rebutja;
  const promesa = new Promise((r, e) => { resol = r; rebutja = e; });
  return { promesa, resol, rebutja };
}
const errorAmb = (codi, extres = {}) => Object.assign(new Error(codi), { codi }, extres);

function serveiSimulat(sobreescriu = {}) {
  return {
    canvisDeClau: vi.fn(async () => PENDENT),
    acceptaCanviClau: vi.fn(async () => NET),
    ...sobreescriu
  };
}
/* Cada render queda anotat: «ni un sol render» es mira sobre tots. */
function renderGanxo(initialProps) {
  const pintats = [];
  const vista = renderHook((props) => {
    const valor = useCanvisDeClau({ fil: FIL, actiu: true, ...props });
    pintats.push(valor);
    return valor;
  }, { initialProps });
  return { ...vista, pintats };
}
const buidaPromeses = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

beforeEach(() => {
  m.encesa = false;
  m.servei = null;
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('bandera apagada (la de veres)', () => {
  test('la bandera del codi és apagada', () => {
    expect(BANDERA_REAL).toBe(false);
  });

  test('cap lectura del port ni del servei, i sempre el mateix objecte inert, també amb actiu', () => {
    m.servei = serveiSimulat();
    const { result, rerender } = renderHook(() => useCanvisDeClau({ fil: FIL, actiu: true, config: { tenantId: 't' } }));
    expect(result.current).toBe(CANVIS_INERTS);
    rerender();
    expect(result.current).toBe(CANVIS_INERTS);
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.inactiu, bloquejat: false, avis: false, pendents: [] });
    expect(getBackendImplementation).not.toHaveBeenCalled();
    expect(serveiXifratXat).not.toHaveBeenCalled();
    expect(m.servei.canvisDeClau).not.toHaveBeenCalled();
  });
});

describe('bandera encesa (sonda) i servei simulat', () => {
  beforeEach(() => { m.encesa = true; });

  test('inactiu (conversa no xifrada) o sense fil: inert i cap crida', () => {
    m.servei = serveiSimulat();
    expect(renderHook(() => useCanvisDeClau({ fil: FIL, actiu: false })).result.current).toBe(CANVIS_INERTS);
    expect(renderHook(() => useCanvisDeClau({ fil: { id: '' }, actiu: true })).result.current).toBe(CANVIS_INERTS);
    expect(m.servei.canvisDeClau).not.toHaveBeenCalled();
  });

  test('un servei sense canvisDeClau (motor d’abans de B2a) deixa el hook inert', () => {
    m.servei = { numeroSeguretat: vi.fn() };
    const { result } = renderHook(() => useCanvisDeClau({ fil: FIL, actiu: true }));
    expect(result.current).toBe(CANVIS_INERTS);
  });

  test('obrir: carregant (sense bloqueig) i després el canvi pendent, que bloqueja i té avís', async () => {
    const pendent = promesaManual();
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(() => pendent.promesa) });
    const config = { tenantId: 'poble-a' };
    const { result } = renderGanxo({ config });
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.carregant, bloquejat: false, avis: false });
    expect(m.servei.canvisDeClau).toHaveBeenCalledWith('f-directe', config);
    await act(async () => { pendent.resol(PENDENT); });
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.pendent, bloquejat: true, avis: true, error: null, ocupat: false });
    expect(result.current.pendents).toEqual([{ usuari: PEPA, motiu: 'sense-continuitat', kidFixat: 'kid-vell', kidNou: 'kid-nou' }]);
    expect(avisDelBloqueig(result.current)).toBe(TEXTOS_XIFRATGE.clauNovaSenseConfirmar);
  });

  test('net: ni bloqueig ni avís', async () => {
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async () => NET) });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.net));
    expect(result.current).toMatchObject({ bloquejat: false, avis: false });
    expect(avisDelBloqueig(result.current)).toBeNull();
  });

  test('alarma de la clau pròpia (a la resposta o com a error): bloqueja', async () => {
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async () => ({ pendents: [], suaus: [], alarmes: [{ tipus: 'clau-propia', kidActiu: 'kid-altre' }] })) });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.alarma));
    expect(result.current).toMatchObject({ bloquejat: true, avis: true, alarmes: [{ tipus: 'clau-propia', kidActiu: 'kid-altre' }] });
    m.servei.canvisDeClau.mockRejectedValueOnce(errorAmb('clau-propia-alarma'));
    const segon = renderHook(() => useCanvisDeClau({ fil: { ...FIL, id: 'f-2' }, actiu: true }));
    await waitFor(() => expect(segon.result.current.estat).toBe(ESTAT_CANVIS.alarma));
    expect(segon.result.current.bloquejat).toBe(true);
  });

  test.each(['bifurcacio', 'kid-no-quadra', 'historia-incoherent'])('manipulació (%s): error, bloqueig, cap pendent per acceptar', async (codi) => {
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async () => { throw errorAmb(codi); }) });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.error));
    expect(result.current).toMatchObject({ error: codi, bloquejat: true, avis: true, pendents: [] });
    expect(esManipulacio(codi)).toBe(true);
    expect(avisDelBloqueig(result.current)).toBe(TEXTOS_XIFRATGE.canviInesperat);
    expect(await act(async () => result.current.accepta(PEPA, 'kid-nou'))).toBe(false);
    expect(m.servei.acceptaCanviClau).not.toHaveBeenCalled();
  });

  test('una manipulació detectada després d’un pendent: el pendent se’n va i ja no es pot acceptar res', async () => {
    m.servei = serveiSimulat();
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    m.servei.canvisDeClau.mockRejectedValueOnce(errorAmb('bifurcacio'));
    await act(async () => { result.current.refresca(); });
    await buidaPromeses();
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.error, error: 'bifurcacio', bloquejat: true, pendents: [] });
    expect(await act(async () => result.current.accepta(PEPA, 'kid-nou'))).toBe(false);
    expect(m.servei.acceptaCanviClau).not.toHaveBeenCalled();
  });

  test('una lectura que falla no desbloqueja: els pendents d’abans es queden; la primera fallada no inventa cap bloqueig', async () => {
    m.servei = serveiSimulat();
    const { result, rerender } = renderGanxo({ fil: FIL });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    m.servei.canvisDeClau.mockRejectedValueOnce(errorAmb('xarxa'));
    await act(async () => { result.current.refresca(); });
    await buidaPromeses();
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.pendent, error: 'lectura', bloquejat: true });
    expect(result.current.pendents).toHaveLength(1);

    m.servei.canvisDeClau.mockRejectedValueOnce(errorAmb('xarxa'));
    rerender({ fil: { ...FIL, id: 'f-nou' } });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.error));
    expect(result.current).toMatchObject({ error: 'lectura', bloquejat: false, avis: false });
  });

  test('un canvi d’àmbit: en silenci, inert', async () => {
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async () => { throw errorAmb('ambit-canviat', { name: 'AbortError', code: 'AMBIT_CANVIAT' }); }) });
    const { result } = renderGanxo({});
    await waitFor(() => expect(m.servei.canvisDeClau).toHaveBeenCalled());
    await buidaPromeses();
    expect(result.current).toBe(CANVIS_INERTS);
  });

  test('un resultat tardà d’un altre fil no es pinta mai', async () => {
    const vell = promesaManual();
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(() => vell.promesa) });
    const { result, rerender, pintats } = renderGanxo({ fil: FIL });
    m.servei.canvisDeClau.mockImplementation(async () => NET);
    rerender({ fil: { ...FIL, id: 'f-altre' } });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.net));
    await act(async () => { vell.resol(PENDENT); });
    expect(result.current.estat).toBe(ESTAT_CANVIS.net);
    expect(pintats.some((p) => p.pendents.length > 0)).toBe(false);
  });

  test('PC155-02 · mateix fil.id, tenant o persona nous: ni un sol render amb els pendents d’abans, i es llig amb la config nova', async () => {
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async (_fil, config) => (config.tenantId === 'poble-a' ? PENDENT : NET)) });
    const { result, rerender, pintats } = renderGanxo({ config: { tenantId: 'poble-a' }, ambit: 'anna' });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    const desDe = pintats.length;
    rerender({ config: { tenantId: 'poble-b' }, ambit: 'anna' });
    expect(pintats[desDe]).toMatchObject({ estat: ESTAT_CANVIS.carregant, bloquejat: false, pendents: [] });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.net));
    expect(pintats.slice(desDe).some((p) => p.pendents.length > 0)).toBe(false);
    expect(m.servei.canvisDeClau).toHaveBeenLastCalledWith('f-directe', { tenantId: 'poble-b' });

    m.servei.canvisDeClau.mockImplementation(async () => PENDENT);
    rerender({ config: { tenantId: 'poble-b' }, ambit: 'berta' });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(3);
  });

  test('ritme: un seq nou dins dels 25 s espera la resta i en fa una sola lectura; passats els 25 s, de seguida', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async () => NET) });
    const { rerender } = renderGanxo({ fil: FIL });
    await buidaPromeses();
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(1);
    await act(async () => { vi.advanceTimersByTime(5000); });
    rerender({ fil: { ...FIL, ultimSeq: 11 } });
    rerender({ fil: { ...FIL, ultimSeq: 12 } });
    await buidaPromeses();
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(1);
    await act(async () => { vi.advanceTimersByTime(MS_REFRESC_CANVIS - 5000 - 1); });
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(1);
    await act(async () => { vi.advanceTimersByTime(1); });
    await buidaPromeses();
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(2);
    /* El mateix seq no torna a llegir; un de nou passat el ritme, de seguida. */
    rerender({ fil: { ...FIL, ultimSeq: 12 } });
    await act(async () => { vi.advanceTimersByTime(MS_REFRESC_CANVIS); });
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(2);
    rerender({ fil: { ...FIL, ultimSeq: 13 } });
    await buidaPromeses();
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(3);
  });

  test('desmuntar descarta el refresc programat', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async () => NET) });
    const { rerender, unmount } = renderGanxo({ fil: FIL });
    await buidaPromeses();
    rerender({ fil: { ...FIL, ultimSeq: 11 } });
    unmount();
    await act(async () => { vi.advanceTimersByTime(MS_REFRESC_CANVIS * 2); });
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(1);
  });

  test('accepta: el canvi que es mostra, amb la config; ocupat mentre vola; la resposta és la lectura nova', async () => {
    const enVol = promesaManual();
    m.servei = serveiSimulat({ acceptaCanviClau: vi.fn(() => enVol.promesa) });
    const config = { tenantId: 'poble-a' };
    const { result } = renderGanxo({ config });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    let promesa;
    await act(async () => { promesa = result.current.accepta(PEPA, 'kid-nou'); });
    expect(result.current).toMatchObject({ ocupat: true, bloquejat: true });
    /* Un segon toc mentre vola no fa res. */
    expect(await act(async () => result.current.accepta(PEPA, 'kid-nou'))).toBe(false);
    expect(m.servei.acceptaCanviClau).toHaveBeenCalledTimes(1);
    expect(m.servei.acceptaCanviClau).toHaveBeenCalledWith('f-directe', { usuari: PEPA, kid: 'kid-nou' }, config);
    let fet;
    await act(async () => { enVol.resol(NET); fet = await promesa; });
    expect(fet).toBe(true);
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.net, ocupat: false, bloquejat: false });
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(1);
  });

  test('accepta mai una clau que no es mostra: altre kid, altra persona, o un pendent sense kid nou', async () => {
    m.servei = serveiSimulat({
      canvisDeClau: vi.fn(async () => ({ pendents: [PENDENT.pendents[0], { usuari: TONI, motiu: 'fora-d-historia', kidFixat: 'k', kidNou: null }] }))
    });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    for (const [usuari, kid] of [[PEPA, 'kid-altre'], [TONI, 'kid-nou'], [TONI, null], ['', 'kid-nou']]) {
      expect(await act(async () => result.current.accepta(usuari, kid))).toBe(false);
    }
    expect(m.servei.acceptaCanviClau).not.toHaveBeenCalled();
  });

  test('accepta i la clau ha tornat a canviar (kid-canviat): cap acceptació, es torna a llegir i es veu el canvi nou', async () => {
    m.servei = serveiSimulat({ acceptaCanviClau: vi.fn(async () => { throw errorAmb('kid-canviat'); }) });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    m.servei.canvisDeClau.mockResolvedValueOnce({ pendents: [{ usuari: PEPA, motiu: 'sense-continuitat', kidFixat: 'kid-vell', kidNou: 'kid-tercer' }] });
    let fet;
    await act(async () => { fet = await result.current.accepta(PEPA, 'kid-nou'); });
    expect(fet).toBe(false);
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.pendent, ocupat: false, error: null, bloquejat: true });
    expect(result.current.pendents[0].kidNou).toBe('kid-tercer');
  });

  test('accepta falla d’una altra manera: error d’acceptació, el pendent es queda i continua bloquejat', async () => {
    m.servei = serveiSimulat({ acceptaCanviClau: vi.fn(async () => { throw errorAmb('FALLA_IDB'); }) });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    await act(async () => { await result.current.accepta(PEPA, 'kid-nou'); });
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.pendent, error: 'acceptacio', ocupat: false, bloquejat: true, avis: true });
    expect(result.current.pendents).toHaveLength(1);
  });

  test('un abast nou a mig acceptar: la resposta tardana no es pinta', async () => {
    const enVol = promesaManual();
    m.servei = serveiSimulat({ acceptaCanviClau: vi.fn(() => enVol.promesa) });
    const { result, rerender } = renderGanxo({ config: { tenantId: 'poble-a' } });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    let promesa;
    await act(async () => { promesa = result.current.accepta(PEPA, 'kid-nou'); });
    rerender({ config: { tenantId: 'poble-b' } });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    let fet;
    await act(async () => { enVol.resol(NET); fet = await promesa; });
    expect(fet).toBe(false);
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.pendent, ocupat: false });
  });

  test('canvis suaus: es conserven entre lectures fins que es tanquen, i un de tancat no torna', async () => {
    const SUAU = { usuari: PEPA, kidAnterior: 'kid-vell', kidNou: 'kid-nou' };
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async () => ({ pendents: [], suaus: [SUAU], alarmes: [] })) });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.suau));
    expect(result.current).toMatchObject({ bloquejat: false, avis: true, suaus: [SUAU] });
    /* El motor ja ha avançat la fixació: la lectura següent no el torna a dir, però l'avís es queda. */
    m.servei.canvisDeClau.mockResolvedValueOnce(NET);
    await act(async () => { result.current.refresca(); });
    await buidaPromeses();
    expect(result.current.suaus).toEqual([SUAU]);
    await act(async () => { result.current.tancaSuau(PEPA, 'kid-nou'); });
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.net, suaus: [], avis: false });
    await act(async () => { result.current.refresca(); });
    await buidaPromeses();
    expect(result.current.suaus).toEqual([]);
  });
});

describe('peces pures', () => {
  test('normalitzaCanvis: només el contracte, un pendent per persona, res que no siga una llista', () => {
    const net = normalitzaCanvis({
      pendents: [
        { usuari: PEPA, motiu: 'verificat', kidFixat: 'a', kidNou: 'b', extra: '<img>' },
        { usuari: PEPA, motiu: 'sense-continuitat', kidFixat: 'x', kidNou: 'y' },
        { usuari: '', kidNou: 'z' }, null, 'brossa', { usuari: TONI, kidNou: 7 }
      ],
      suaus: [{ usuari: PEPA, kidNou: 'b' }, { usuari: PEPA }, { kidNou: 'b' }],
      alarmes: [{ tipus: 'clau-propia', kidActiu: 'k' }, { tipus: 'altra' }]
    });
    expect(net.pendents).toEqual([
      { usuari: PEPA, motiu: 'verificat', kidFixat: 'a', kidNou: 'b' },
      { usuari: TONI, motiu: 'sense-continuitat', kidFixat: null, kidNou: null }
    ]);
    expect(net.suaus).toEqual([{ usuari: PEPA, kidAnterior: null, kidNou: 'b' }]);
    expect(net.alarmes).toEqual([{ tipus: 'clau-propia', kidActiu: 'k', senseClau: false }]);
    expect(Object.isFrozen(net.pendents[0])).toBe(true);
    expect(normalitzaCanvis(null)).toEqual({ pendents: [], suaus: [], alarmes: [] });
    expect(normalitzaCanvis({ pendents: 'no', suaus: {}, alarmes: 3 })).toEqual({ pendents: [], suaus: [], alarmes: [] });
    expect(normalitzaCanvis({ pendents: Array.from({ length: 300 }, (_, i) => ({ usuari: `u${i}`, kidNou: 'k' })) }).pendents).toHaveLength(256);
  });

  test('nomDelMembre: el de la llista; en un directe, la reserva o el nom del fil; en un grup desconegut, res', () => {
    expect(nomDelMembre(FIL, PEPA)).toBe('Pepa');
    expect(nomDelMembre({ tipus: 'directe', name: 'Pepa Soler', altres: [] }, PEPA)).toBe('Pepa Soler');
    expect(nomDelMembre({ tipus: 'directe', name: 'Fil', altres: [] }, PEPA, 'Pepa de la contrapart')).toBe('Pepa de la contrapart');
    expect(nomDelMembre({ tipus: 'grup', name: 'Comissió', altres: [{ id: TONI, nom: 'Toni' }] }, PEPA)).toBe('');
    expect(nomDelMembre({ tipus: 'grup', altres: [{ id: TONI, nom: '  Toni ' }] }, TONI)).toBe('Toni');
    expect(nomDelMembre(null, PEPA)).toBe('');
  });

  test('avisDelBloqueig: res sense bloqueig; manipulació, el canvi inesperat; si no, la clau nova sense confirmar', () => {
    expect(avisDelBloqueig(null)).toBeNull();
    expect(avisDelBloqueig(CANVIS_INERTS)).toBeNull();
    expect(avisDelBloqueig({ bloquejat: true, error: 'bifurcacio' })).toBe(TEXTOS_XIFRATGE.canviInesperat);
    expect(avisDelBloqueig({ bloquejat: true, error: null })).toBe(TEXTOS_XIFRATGE.clauNovaSenseConfirmar);
    expect(esManipulacio('xarxa')).toBe(false);
  });
});

/* E3 (marató 261101_2143; Gauntlet 2) · Les correccions de la interfície sobre el motor ja
   corregit (E1): l'alerta amb el fil obert (G2-A-doctr-01), el pendent sense cap clau nova que
   es puga confirmar (G2-A-doctr-02, G2-A-integ-02), l'acceptació feta sense refresc
   (G2-A-integ-03) i els avisos suaus que el motor conserva (petició E1 · H-2). */
describe('E3 · canvis de clau amb el fil obert, sense clau nova i acceptats sense refresc', () => {
  const PENDENT_SENSE_CLAU = Object.freeze({ pendents: [{ usuari: PEPA, motiu: 'sense-continuitat', kidFixat: 'kid-vell', kidNou: null }], suaus: [], alarmes: [] });

  test('G2-A-doctr-01 · el servidor passa a pendent sense cap seq nou: un enviament fallit sense motiu llig al moment i bloqueja', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    m.encesa = true;
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async () => NET) });
    const { result } = renderGanxo({});
    await buidaPromeses();
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.net, bloquejat: false });
    m.servei.canvisDeClau.mockImplementation(async () => PENDENT);
    /* El ritme sol no hi arriba mai: deu minuts sense seq nou, cap lectura. */
    await act(async () => { vi.advanceTimersByTime(10 * 60_000); });
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(1);
    await act(async () => { result.current.revisaEnviament(); });
    await buidaPromeses();
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.pendent, bloquejat: true, avis: true });
  });

  test.each([
    ['clau-canviada-forta', PENDENT, ESTAT_CANVIS.pendent],
    ['clau-propia-alarma', { pendents: [], suaus: [], alarmes: [{ tipus: 'clau-propia', kidActiu: 'k-altre' }] }, ESTAT_CANVIS.alarma]
  ])('G2-A-doctr-01 · un rebuig del motor amb %s llig al moment', async (codi, resposta, estat) => {
    m.encesa = true;
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async () => NET) });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.net));
    m.servei.canvisDeClau.mockImplementation(async () => resposta);
    await act(async () => { result.current.revisaEnviament(errorAmb(codi, { encuable: false })); });
    await waitFor(() => expect(result.current.estat).toBe(estat));
    expect(result.current.bloquejat).toBe(true);
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(2);
  });

  test('G2-A-doctr-01 · una altra fallada (normes rebutjades, xarxa, un codi qualsevol) no llig res; inert, no fa res', async () => {
    m.encesa = true;
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async () => NET) });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.net));
    for (const error of [new DOMException('Cal acceptar les normes de convivència.', 'AbortError'), new TypeError('Failed to fetch'), errorAmb('sense-xarxa'), {}]) {
      await act(async () => { result.current.revisaEnviament(error); });
    }
    await buidaPromeses();
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(1);
    expect(esFalladaDeClau(undefined)).toBe(true);
    expect(esFalladaDeClau(null)).toBe(true);
    expect(esFalladaDeClau({ codi: 'kid-canviat' })).toBe(false);
    /* Amb la bandera apagada, el mateix objecte inert, amb un revisaEnviament que no fa res. */
    m.encesa = false;
    const inert = renderHook(() => useCanvisDeClau({ fil: FIL, actiu: true })).result.current;
    expect(inert).toBe(CANVIS_INERTS);
    expect(() => inert.revisaEnviament()).not.toThrow();
  });

  test('G2-A-integ-03 · `refrescat: false`: acceptat, cap error a la vista, desbloquejat i es torna a llegir', async () => {
    m.encesa = true;
    m.servei = serveiSimulat({ acceptaCanviClau: vi.fn(async () => ({ ...NET, refrescat: false })) });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    m.servei.canvisDeClau.mockImplementation(async () => NET);
    let fet;
    await act(async () => { fet = await result.current.accepta(PEPA, 'kid-nou'); });
    expect(fet).toBe(true);
    await waitFor(() => expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(2));
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.net, error: null, bloquejat: false, avis: false, ocupat: false });
  });

  test('G2-A-integ-03 · `refrescat: false` i la relectura també falla: ni «Torna-ho a provar» ni bloqueig per la persona acceptada', async () => {
    m.encesa = true;
    m.servei = serveiSimulat({ acceptaCanviClau: vi.fn(async () => ({ ...NET, refrescat: false })) });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    m.servei.canvisDeClau.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
    await act(async () => { await result.current.accepta(PEPA, 'kid-nou'); });
    await waitFor(() => expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(2));
    await buidaPromeses();
    expect(result.current.error).not.toBe('acceptacio');
    expect(result.current).toMatchObject({ bloquejat: false, avis: false, pendents: [] });
  });

  test('una acceptació refeta de veres (sense `refrescat`) no torna a llegir', async () => {
    m.encesa = true;
    m.servei = serveiSimulat();
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    await act(async () => { await result.current.accepta(PEPA, 'kid-nou'); });
    await buidaPromeses();
    expect(m.servei.canvisDeClau).toHaveBeenCalledTimes(1);
  });

  test('G2-A-integ-02 · un pendent sense clau nova, o que el motor diu no acceptable: bloquejat i res a acceptar, sense cap crida', async () => {
    m.encesa = true;
    m.servei = serveiSimulat({
      canvisDeClau: vi.fn(async () => ({ pendents: [{ usuari: PEPA, motiu: 'sense-continuitat', kidFixat: 'v', kidNou: 'kid-x', acceptable: false }, { ...PENDENT_SENSE_CLAU.pendents[0], usuari: TONI }] }))
    });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    expect(result.current.bloquejat).toBe(true);
    expect(result.current.pendents.map((p) => p.kidNou)).toEqual([null, null]);
    expect(await act(async () => result.current.accepta(PEPA, 'kid-x'))).toBe(false);
    expect(m.servei.acceptaCanviClau).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  test('G2-A-doctr-02 · la barra no diu «Clau nova» si no n’hi ha cap que es puga confirmar', () => {
    const pend = (kidNou, extres = {}) => ({ usuari: PEPA, motiu: 'sense-continuitat', kidNou, ...extres });
    expect(avisDelBloqueig({ bloquejat: true, pendents: [pend(null)], alarmes: [] })).toBe(TEXT_BARRA_SENSE_CLAU);
    expect(avisDelBloqueig({ bloquejat: true, pendents: [pend('k', { acceptable: false })], alarmes: [] })).toBe(TEXT_BARRA_SENSE_CLAU);
    expect(avisDelBloqueig({ bloquejat: true, pendents: [], alarmes: [{ tipus: 'clau-propia', kidActiu: null, senseClau: true }] })).toBe(TEXT_BARRA_SENSE_CLAU);
    /* Amb una clau nova de veres, encara que n'hi haja una altra sense, «Clau nova sense confirmar». */
    expect(avisDelBloqueig({ bloquejat: true, pendents: [pend(null), pend('k', { usuari: TONI })], alarmes: [] })).toBe(TEXTOS_XIFRATGE.clauNovaSenseConfirmar);
    expect(avisDelBloqueig({ bloquejat: true, pendents: [pend(null)], alarmes: [{ tipus: 'clau-propia', kidActiu: 'k' }] })).toBe(TEXTOS_XIFRATGE.clauNovaSenseConfirmar);
    expect(avisDelBloqueig({ bloquejat: true, pendents: [], alarmes: [{ tipus: 'clau-propia', kidActiu: null }] })).toBe(TEXTOS_XIFRATGE.clauNovaSenseConfirmar);
    /* La manipulació mana. */
    expect(avisDelBloqueig({ bloquejat: true, error: 'bifurcacio', pendents: [pend(null)] })).toBe(TEXTOS_XIFRATGE.canviInesperat);
    expect(teClauNova(pend('k'))).toBe(true);
    expect(teClauNova(pend(''))).toBe(false);
  });

  test('G2-A-doctr-02 · normalitzaCanvis: `acceptable: false` sense kidNou; `senseClau` només amb kidActiu null expressat pel motor', () => {
    const net = normalitzaCanvis({
      pendents: [{ usuari: PEPA, kidNou: 'k', acceptable: false }, { usuari: TONI, kidNou: 'k2', acceptable: true }],
      alarmes: [{ tipus: 'clau-propia', kidActiu: null }, { tipus: 'clau-propia' }, { tipus: 'clau-propia', kidActiu: 'k' }]
    });
    expect(net.pendents.map((p) => p.kidNou)).toEqual([null, 'k2']);
    expect(net.alarmes.map((a) => a.senseClau)).toEqual([true, false, false]);
  });

  test('el parell de la barra és el títol de l’alerta, i la reserva és la del diccionari valencià', async () => {
    const { TEXTOS_SENSE_CLAU } = await import('./components/AvisClauCanviada.jsx');
    const { default: CA } = await import('../../config/idiomes/ca.js');
    expect(TEXT_BARRA_SENSE_CLAU).toEqual(TEXTOS_SENSE_CLAU.titol);
    for (const [clau, reserva] of Object.values(TEXTOS_SENSE_CLAU)) expect(CA[clau], clau).toBe(reserva);
  });

  test('petició E1 · H-2: un servei amb tancaAvisSuau conserva els suaus (tercer argument) i tancar-los l’avisa', async () => {
    m.encesa = true;
    const SUAU = { usuari: PEPA, kidAnterior: 'kid-vell', kidNou: 'kid-nou' };
    const config = { tenantId: 'poble-a' };
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async () => ({ pendents: [], suaus: [SUAU], alarmes: [] })), tancaAvisSuau: vi.fn() });
    const { result } = renderGanxo({ config });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.suau));
    expect(m.servei.canvisDeClau).toHaveBeenCalledWith('f-directe', config, { conservaSuaus: true });
    await act(async () => { result.current.tancaSuau(PEPA, 'kid-nou'); });
    expect(m.servei.tancaAvisSuau).toHaveBeenCalledWith(PEPA, 'kid-nou');
    expect(result.current.suaus).toEqual([]);
    /* Un servei que llança en tancar no trenca la vista. */
    m.servei.tancaAvisSuau.mockImplementation(() => { throw new Error('motor'); });
    expect(() => result.current.tancaSuau(PEPA, 'kid-altre')).not.toThrow();
  });

  /* ARB-E3-2 (mutant MA1) · Decisió 5 del constructor: l'alarma de reserva d'un rebuig amb
     clau-propia-alarma (sense llistes) no sap si el compte té una altra clau. senseClau false,
     i la barra «Clau nova sense confirmar», no «Sense cap clau de seguretat vàlida». */
  test('ARB-E3-2 · l’alarma de reserva (rebuig clau-propia-alarma sense llistes) no diu senseClau', async () => {
    m.encesa = true;
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async () => { throw errorAmb('clau-propia-alarma'); }) });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.alarma));
    expect(result.current.alarmes).toEqual([{ tipus: 'clau-propia', kidActiu: null, senseClau: false }]);
    expect(result.current).toMatchObject({ bloquejat: true, avis: true, error: null });
    expect(avisDelBloqueig(result.current)).toBe(TEXTOS_XIFRATGE.clauNovaSenseConfirmar);
  });

  /* ARB-E3-3 · Suaus encadenats K1→K2→K3 amb el fil obert: abans, dos avisos idèntics de la
     mateixa persona ([K1→K2], [K1→K3]). Ara un per persona, al mateix lloc; el d'una altra persona
     es queda, i tancar el nou deixa la vista neta d'eixa persona. */
  test('ARB-E3-3 · un suau nou d’una persona substituïx el seu suau obert; els d’altres persones es queden', async () => {
    m.encesa = true;
    const PEPA_2 = { usuari: PEPA, kidAnterior: 'k1', kidNou: 'k2' };
    const TONI_6 = { usuari: TONI, kidAnterior: 'k5', kidNou: 'k6' };
    const PEPA_3 = { usuari: PEPA, kidAnterior: 'k1', kidNou: 'k3' };
    m.servei = serveiSimulat({ canvisDeClau: vi.fn(async () => ({ pendents: [], suaus: [PEPA_2, TONI_6], alarmes: [] })), tancaAvisSuau: vi.fn() });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.suaus).toEqual([PEPA_2, TONI_6]));
    m.servei.canvisDeClau.mockResolvedValueOnce({ pendents: [], suaus: [PEPA_3], alarmes: [] });
    await act(async () => { result.current.refresca(); });
    await buidaPromeses();
    expect(result.current.suaus).toEqual([PEPA_3, TONI_6]);
    /* El motor el torna a dir (conserva): cap duplicat. */
    m.servei.canvisDeClau.mockResolvedValueOnce({ pendents: [], suaus: [PEPA_3, TONI_6], alarmes: [] });
    await act(async () => { result.current.refresca(); });
    await buidaPromeses();
    expect(result.current.suaus).toEqual([PEPA_3, TONI_6]);
    await act(async () => { result.current.tancaSuau(PEPA, 'k3'); });
    expect(m.servei.tancaAvisSuau).toHaveBeenCalledWith(PEPA, 'k3');
    expect(result.current).toMatchObject({ estat: ESTAT_CANVIS.suau, suaus: [TONI_6] });
    m.servei.canvisDeClau.mockResolvedValueOnce({ pendents: [], suaus: [TONI_6], alarmes: [] });
    await act(async () => { result.current.refresca(); });
    await buidaPromeses();
    expect(result.current.suaus).toEqual([TONI_6]);
  });

  test('petició E1 · H-2: l’acceptació també demana conservar-los; un servei sense tancaAvisSuau rep els arguments de sempre', async () => {
    m.encesa = true;
    m.servei = serveiSimulat({ tancaAvisSuau: vi.fn() });
    const { result } = renderGanxo({});
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_CANVIS.pendent));
    await act(async () => { await result.current.accepta(PEPA, 'kid-nou'); });
    expect(m.servei.acceptaCanviClau).toHaveBeenCalledWith('f-directe', { usuari: PEPA, kid: 'kid-nou', conservaSuaus: true }, {});
    cleanup();
    m.servei = serveiSimulat();
    const sense = renderGanxo({});
    await waitFor(() => expect(sense.result.current.estat).toBe(ESTAT_CANVIS.pendent));
    expect(m.servei.canvisDeClau.mock.calls[0]).toHaveLength(2);
    await act(async () => { await sense.result.current.accepta(PEPA, 'kid-nou'); });
    expect(m.servei.acceptaCanviClau).toHaveBeenCalledWith('f-directe', { usuari: PEPA, kid: 'kid-nou' }, {});
  });
});
