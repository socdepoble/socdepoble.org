/* P1-12 pas 17 (pla 261101_1246, T7 · S5) · Els hooks del xifratge per conversa.
   Amb la bandera apagada (el valor de veres), ni el port ni el servei es lligen.
   Amb la bandera encesa (només ací, per una sonda del mòdul) i un servei simulat:
   calculant → llest, els errors honestos, cap resultat tardà, i la marca amb el
   kid que s'ha mostrat (TOCTOU: si la clau ha canviat, el número nou i l'avís). */
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
const { ESTAT_NUMERO, useEstatXifratgeDelFil, useNumeroSeguretat } = await import('./useSeguretatDelFil.js');

const PERSONA = '22222222-2222-4222-8222-222222222222';
const FIL = { id: 'f-directe', tipus: 'directe', altres: [{ id: PERSONA, tipus: 'persona' }] };
const NUMERO = '12345 67890 12345 67890 12345 67890 12345 67890 12345 67890 12345 67890';
const NUMERO_NOU = '99999 67890 12345 67890 12345 67890 12345 67890 12345 67890 12345 00000';

function promesaManual() {
  let resol;
  let rebutja;
  const promesa = new Promise((r, e) => { resol = r; rebutja = e; });
  return { promesa, resol, rebutja };
}
const errorAmb = (codi, extres = {}) => Object.assign(new Error(codi), { codi }, extres);

function serveiSimulat(sobreescriu = {}) {
  return {
    abastDelFil: vi.fn(() => Object.freeze({ xifrat: true, obligatori: true, bloquejat: false, apegalos: false, motiu: 'directe-persona', tipusFil: 'directe' })),
    entornSegur: vi.fn(() => true),
    numeroSeguretat: vi.fn(async () => ({ usuari: PERSONA, kid: 'kid-a', numero: NUMERO, verificat: false })),
    marcaVerificat: vi.fn(async (_fil, { kid, verificat }) => ({ usuari: PERSONA, kid, numero: NUMERO, verificat })),
    contactesVerificats: vi.fn(async () => 0),
    ...sobreescriu
  };
}

beforeEach(() => {
  m.encesa = false;
  m.servei = null;
  vi.clearAllMocks();
});
afterEach(cleanup);

describe('bandera apagada (la de veres)', () => {
  test('la bandera del codi és apagada', () => {
    expect(BANDERA_REAL).toBe(false);
  });

  test('cap lectura del port ni del servei: estat apagat, número inactiu', () => {
    m.servei = serveiSimulat();
    const estat = renderHook(() => useEstatXifratgeDelFil(FIL));
    expect(estat.result.current).toMatchObject({ estat: 'apagat', visible: false, potVerificar: false });
    const numero = renderHook(() => useNumeroSeguretat({ fil: FIL, obert: true, potVerificar: true }));
    expect(numero.result.current.estat).toBe(ESTAT_NUMERO.inactiu);
    expect(getBackendImplementation).not.toHaveBeenCalled();
    expect(serveiXifratXat).not.toHaveBeenCalled();
    expect(m.servei.numeroSeguretat).not.toHaveBeenCalled();
  });
});

describe('bandera encesa (sonda) i servei simulat', () => {
  beforeEach(() => { m.encesa = true; });

  test('useEstatXifratgeDelFil: l’abast i l’entorn del servei decidixen l’estat', () => {
    m.servei = serveiSimulat();
    const { result, rerender } = renderHook(({ fil }) => useEstatXifratgeDelFil(fil), { initialProps: { fil: FIL } });
    expect(result.current).toMatchObject({ estat: 'xifrat', visible: true, potVerificar: true });
    expect(m.servei.abastDelFil).toHaveBeenCalledWith(FIL);
    m.servei.entornSegur.mockReturnValue(false);
    rerender({ fil: FIL });
    expect(result.current).toMatchObject({ estat: 'sense-primitives', potVerificar: false });
    /* Sense servei (backend local o encara no instal·lat): apagat. */
    m.servei = null;
    rerender({ fil: FIL });
    expect(result.current).toMatchObject({ estat: 'apagat', visible: false });
  });

  test('tancat o sense número: cap càlcul', () => {
    m.servei = serveiSimulat();
    renderHook(() => useNumeroSeguretat({ fil: FIL, obert: false, potVerificar: true }));
    renderHook(() => useNumeroSeguretat({ fil: FIL, obert: true, potVerificar: false }));
    expect(m.servei.numeroSeguretat).not.toHaveBeenCalled();
  });

  test('obert: calculant i després llest, amb el fil i la config', async () => {
    const pendent = promesaManual();
    m.servei = serveiSimulat({ numeroSeguretat: vi.fn(() => pendent.promesa) });
    const config = { backendId: 'x' };
    const { result } = renderHook(() => useNumeroSeguretat({ fil: FIL, config, obert: true, potVerificar: true }));
    expect(result.current.estat).toBe(ESTAT_NUMERO.calculant);
    expect(m.servei.numeroSeguretat).toHaveBeenCalledWith('f-directe', config);
    await act(async () => { pendent.resol({ usuari: PERSONA, kid: 'kid-a', numero: NUMERO, verificat: true }); });
    expect(result.current).toMatchObject({ estat: ESTAT_NUMERO.llest, numero: NUMERO, kid: 'kid-a', verificat: true, avis: null });
  });

  test.each([
    ['sense-clau-altre', ESTAT_NUMERO.senseClau],
    ['claus-bloquejades', ESTAT_NUMERO.senseClausPropies],
    ['kid-no-fixat', ESTAT_NUMERO.clauCanviada],
    ['xarxa', ESTAT_NUMERO.error]
  ])('l’error %s es mostra com a %s, sense número', async (codi, esperat) => {
    m.servei = serveiSimulat({ numeroSeguretat: vi.fn(async () => { throw errorAmb(codi); }) });
    const { result } = renderHook(() => useNumeroSeguretat({ fil: FIL, obert: true, potVerificar: true }));
    await waitFor(() => expect(result.current.estat).toBe(esperat));
    expect(result.current.numero).toBeNull();
  });

  test('un canvi d’àmbit: en silenci, sense número ni roda', async () => {
    m.servei = serveiSimulat({ numeroSeguretat: vi.fn(async () => { throw errorAmb('ambit-canviat', { name: 'AbortError', code: 'AMBIT_CANVIAT' }); }) });
    const { result } = renderHook(() => useNumeroSeguretat({ fil: FIL, obert: true, potVerificar: true }));
    await waitFor(() => expect(m.servei.numeroSeguretat).toHaveBeenCalled());
    await act(async () => {});
    expect(result.current.estat).toBe(ESTAT_NUMERO.inactiu);
  });

  test('un resultat tardà, després de tancar el panell, no pinta cap número', async () => {
    const pendent = promesaManual();
    m.servei = serveiSimulat({ numeroSeguretat: vi.fn(() => pendent.promesa) });
    const { result, rerender } = renderHook(({ obert }) => useNumeroSeguretat({ fil: FIL, obert, potVerificar: true }), { initialProps: { obert: true } });
    expect(result.current.estat).toBe(ESTAT_NUMERO.calculant);
    rerender({ obert: false });
    expect(result.current.estat).toBe(ESTAT_NUMERO.inactiu);
    await act(async () => { pendent.resol({ usuari: PERSONA, kid: 'kid-a', numero: NUMERO, verificat: false }); });
    expect(result.current.estat).toBe(ESTAT_NUMERO.inactiu);
    expect(result.current.numero).toBeNull();
  });

  test('marca(true) envia el kid que s’ha mostrat i pinta la marca; marca(false) la lleva', async () => {
    m.servei = serveiSimulat();
    const { result } = renderHook(() => useNumeroSeguretat({ fil: FIL, obert: true, potVerificar: true }));
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    await act(async () => { await result.current.marca(true); });
    expect(m.servei.marcaVerificat).toHaveBeenLastCalledWith('f-directe', { kid: 'kid-a', verificat: true }, {});
    expect(result.current).toMatchObject({ verificat: true, ocupat: false, avis: null });
    await act(async () => { await result.current.marca(false); });
    expect(m.servei.marcaVerificat).toHaveBeenLastCalledWith('f-directe', { kid: 'kid-a', verificat: false }, {});
    expect(result.current.verificat).toBe(false);
  });

  test('la clau ha canviat entremig (kid-canviat): cap marca, el número nou i l’avís', async () => {
    m.servei = serveiSimulat({ marcaVerificat: vi.fn(async () => { throw errorAmb('kid-canviat'); }) });
    const { result } = renderHook(() => useNumeroSeguretat({ fil: FIL, obert: true, potVerificar: true }));
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    m.servei.numeroSeguretat.mockResolvedValueOnce({ usuari: PERSONA, kid: 'kid-b', numero: NUMERO_NOU, verificat: false });
    await act(async () => { await result.current.marca(true); });
    expect(m.servei.numeroSeguretat).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ estat: ESTAT_NUMERO.llest, numero: NUMERO_NOU, kid: 'kid-b', verificat: false, avis: 'canviat' });
  });

  /* Gauntlet T7b-G01 · Un canvi fort detectat mentre es marca (el cas MITM): fora el
     número vell i el botó, i l'estat honest; cap «Torna-ho a provar». */
  test.each([
    ['kid-no-fixat', ESTAT_NUMERO.clauCanviada],
    ['sense-clau-altre', ESTAT_NUMERO.senseClau],
    ['claus-bloquejades', ESTAT_NUMERO.senseClausPropies]
  ])('marcaVerificat rebutja %s: estat %s, sense número ni avís', async (codi, esperat) => {
    m.servei = serveiSimulat({ marcaVerificat: vi.fn(async () => { throw errorAmb(codi); }) });
    const { result } = renderHook(() => useNumeroSeguretat({ fil: FIL, obert: true, potVerificar: true }));
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    await act(async () => { await result.current.marca(true); });
    expect(result.current).toMatchObject({ estat: esperat, numero: null, kid: null, verificat: false, avis: null, ocupat: false });
    /* Sense número llest, una marca nova no fa res. */
    await act(async () => { await result.current.marca(true); });
    expect(m.servei.marcaVerificat).toHaveBeenCalledTimes(1);
  });

  /* Gauntlet T7b-G03 · L'avís «canviat» només acompanya un número llest. */
  test('kid-canviat i, en recalcular, un canvi fort: clau-canviada sense l’avís «canviat»', async () => {
    m.servei = serveiSimulat({ marcaVerificat: vi.fn(async () => { throw errorAmb('kid-canviat'); }) });
    const { result } = renderHook(() => useNumeroSeguretat({ fil: FIL, obert: true, potVerificar: true }));
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    m.servei.numeroSeguretat.mockRejectedValueOnce(errorAmb('kid-no-fixat'));
    await act(async () => { await result.current.marca(true); });
    expect(result.current).toMatchObject({ estat: ESTAT_NUMERO.clauCanviada, numero: null, avis: null });
  });

  test('kid-canviat però el número nou és de la mateixa clau (la fixació no quadra): cap «ha canviat», sinó errorMarca', async () => {
    m.servei = serveiSimulat({ marcaVerificat: vi.fn(async () => { throw errorAmb('kid-canviat'); }) });
    const { result } = renderHook(() => useNumeroSeguretat({ fil: FIL, obert: true, potVerificar: true }));
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    await act(async () => { await result.current.marca(true); });
    expect(m.servei.numeroSeguretat).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ estat: ESTAT_NUMERO.llest, numero: NUMERO, kid: 'kid-a', verificat: false, avis: 'errorMarca' });
  });

  test('mentre es recalcula després de kid-canviat, cap avís al costat de «Calculant…»', async () => {
    const pendent = promesaManual();
    m.servei = serveiSimulat({ marcaVerificat: vi.fn(async () => { throw errorAmb('kid-canviat'); }) });
    const { result } = renderHook(() => useNumeroSeguretat({ fil: FIL, obert: true, potVerificar: true }));
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    m.servei.numeroSeguretat.mockReturnValueOnce(pendent.promesa);
    let marca;
    await act(async () => { marca = result.current.marca(true); });
    expect(result.current).toMatchObject({ estat: ESTAT_NUMERO.calculant, avis: null });
    await act(async () => { pendent.resol({ usuari: PERSONA, kid: 'kid-b', numero: NUMERO_NOU, verificat: false }); await marca; });
    expect(result.current).toMatchObject({ estat: ESTAT_NUMERO.llest, numero: NUMERO_NOU, avis: 'canviat' });
  });

  test('una altra fallada en desar la marca: el número es queda i l’avís ho diu', async () => {
    m.servei = serveiSimulat({ marcaVerificat: vi.fn(async () => { throw errorAmb('FALLA_IDB'); }) });
    const { result } = renderHook(() => useNumeroSeguretat({ fil: FIL, obert: true, potVerificar: true }));
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    await act(async () => { await result.current.marca(true); });
    expect(result.current).toMatchObject({ estat: ESTAT_NUMERO.llest, numero: NUMERO, verificat: false, ocupat: false, avis: 'errorMarca' });
  });
});
