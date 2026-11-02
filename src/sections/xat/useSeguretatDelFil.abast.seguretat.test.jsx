/* PC155-02 i PC155-02b (auditoria Codex post-155d84bd8, marató 261101_2143) · El
   número de seguretat és d'un abast: fil, instància del servei, backend i tenant
   de la config i àmbit del xat (persona i actor). Amb el mateix fil.id i un abast
   nou, cap número ni marca de l'abast anterior es veu, ni llest ni en vol. El
   primer bloc és el reproductor de Codex
   (_investigacio_ia_de_poble/261101_auditoria_postcommit_codex/adversarial.ambit.test.jsx)
   girat: abans passava reproduint el defecte; ara exigix el comportament correcte. */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ servei: null }));
vi.mock('../../config/xifratXat.js', async (importOriginal) => ({ ...(await importOriginal()), E2EE_ACTIU_PER_DEFECTE: true }));
vi.mock('../../data/backendPort.js', () => ({ getBackendImplementation: () => ({}) }));
vi.mock('../../data/xifratXat.js', () => ({ serveiXifratXat: () => m.servei }));

const { ESTAT_NUMERO, clauDAbastDelNumero, useNumeroSeguretat } = await import('./useSeguretatDelFil.js');

const TENANT_A = '0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a0a';
const TENANT_B = '0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b';
const FIL = { id: 'mateix-fil' };

function promesaManual() {
  let resol;
  let rebutja;
  const promesa = new Promise((r, e) => { resol = r; rebutja = e; });
  return { promesa, resol, rebutja };
}
const errorAmb = (codi) => Object.assign(new Error(codi), { codi });
/* Un servei que torna, com a número, el tenant de la config amb què se li demana. */
const serveiPerTenant = () => ({
  numeroSeguretat: vi.fn(async (_fil, config) => ({ numero: `num-${config.tenantId}`, kid: `kid-${config.tenantId}`, verificat: true })),
  marcaVerificat: vi.fn(async (_fil, { kid, verificat }, config) => ({ numero: `num-${config.tenantId}`, kid, verificat }))
});
/* Cada render del ganxo queda anotat: «ni un sol render» es mira sobre tots, no
   només sobre l'últim (renderHook embolica el rerender en act i els efectes ja
   han corregut quan es llig result.current). */
function renderGanxo(initialProps) {
  const pintats = [];
  const vista = renderHook((props) => {
    const valor = useNumeroSeguretat({ fil: FIL, obert: true, potVerificar: true, ...props });
    pintats.push(valor);
    return valor;
  }, { initialProps });
  return { ...vista, pintats };
}

beforeEach(() => { m.servei = serveiPerTenant(); });
afterEach(cleanup);

describe('reproductor de Codex, girat', () => {
  test('literal de la sonda (poble-A → poble-B, el mateix kid): cap número verificat del tenant anterior, i es recalcula', async () => {
    m.servei.numeroSeguretat.mockImplementation(async (_id, c) => ({ numero: c.tenantId, kid: 'mateix-kid', verificat: true }));
    const { result, rerender, pintats } = renderGanxo({ config: { tenantId: 'poble-A' } });
    await waitFor(() => expect(result.current.estat).toBe('llest'));
    expect(result.current).toMatchObject({ numero: 'poble-A', verificat: true });
    const desDe = pintats.length;
    rerender({ config: { tenantId: 'poble-B' } });
    await Promise.resolve();
    /* Era el [DEFECTE]: numero 'poble-A', verificat true i una sola crida. */
    expect(result.current.numero).not.toBe('poble-A');
    expect(result.current.verificat).toBe(false);
    expect(pintats.slice(desDe).some((p) => p.numero === 'poble-A' || p.verificat === true)).toBe(false);
    await waitFor(() => expect(result.current).toMatchObject({ estat: 'llest', numero: 'poble-B' }));
    expect(m.servei.numeroSeguretat).toHaveBeenCalledTimes(2);
    expect(m.servei.numeroSeguretat).toHaveBeenLastCalledWith('mateix-fil', { tenantId: 'poble-B' });
  });

  test('amb tenants UUID: ni un sol render amb el número d’A, i el de B amb la config de B', async () => {
    const { result, rerender, pintats } = renderGanxo({ config: { tenantId: TENANT_A } });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    expect(result.current).toMatchObject({ numero: `num-${TENANT_A}`, verificat: true });
    const desDe = pintats.length;
    rerender({ config: { tenantId: TENANT_B } });
    expect(pintats[desDe]).toMatchObject({ estat: ESTAT_NUMERO.calculant, numero: null, kid: null, verificat: false });
    expect(pintats.slice(desDe).some((p) => p.numero === `num-${TENANT_A}` || p.kid === `kid-${TENANT_A}`)).toBe(false);
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    expect(result.current).toMatchObject({ numero: `num-${TENANT_B}`, kid: `kid-${TENANT_B}` });
    expect(m.servei.numeroSeguretat).toHaveBeenCalledTimes(2);
    expect(m.servei.numeroSeguretat).toHaveBeenLastCalledWith('mateix-fil', { tenantId: TENANT_B });
  });
});

describe('invalidació per abast', () => {
  test('una promesa en vol del tenant anterior no pinta res quan arriba tard', async () => {
    const deA = promesaManual();
    m.servei.numeroSeguretat.mockImplementationOnce(() => deA.promesa);
    const { result, rerender, pintats } = renderGanxo({ config: { tenantId: TENANT_A } });
    expect(result.current.estat).toBe(ESTAT_NUMERO.calculant);
    rerender({ config: { tenantId: TENANT_B } });
    await waitFor(() => expect(result.current.numero).toBe(`num-${TENANT_B}`));
    await act(async () => { deA.resol({ numero: `num-${TENANT_A}`, kid: `kid-${TENANT_A}`, verificat: true }); });
    expect(result.current).toMatchObject({ estat: ESTAT_NUMERO.llest, numero: `num-${TENANT_B}` });
    expect(pintats.some((p) => p.numero === `num-${TENANT_A}`)).toBe(false);
  });

  test('una altra instància del servei (backend reinstal·lat) amb la mateixa config: es recalcula amb la nova', async () => {
    const config = { tenantId: TENANT_A };
    const { result, rerender } = renderGanxo({ config });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    const vell = m.servei;
    m.servei = serveiPerTenant();
    m.servei.numeroSeguretat.mockResolvedValueOnce({ numero: 'num-servei-nou', kid: 'kid-nou', verificat: false });
    rerender({ config });
    expect(result.current.numero).toBeNull();
    await waitFor(() => expect(result.current.numero).toBe('num-servei-nou'));
    expect(vell.numeroSeguretat).toHaveBeenCalledTimes(1);
    expect(m.servei.numeroSeguretat).toHaveBeenCalledTimes(1);
  });

  test('un àmbit nou (persona o actor) amb el mateix fil i la mateixa config: es recalcula; una config igual, no', async () => {
    const { result, rerender } = renderGanxo({ config: { tenantId: TENANT_A }, ambit: '["b","anna","persona:anna"]' });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    /* Un objecte de config nou amb els mateixos valors (una renovació): cap càlcul nou. */
    rerender({ config: { tenantId: TENANT_A.toUpperCase() }, ambit: '["b","anna","persona:anna"]' });
    expect(result.current.estat).toBe(ESTAT_NUMERO.llest);
    expect(m.servei.numeroSeguretat).toHaveBeenCalledTimes(1);
    /* La mateixa persona actua com una entitat: un altre actor. */
    rerender({ config: { tenantId: TENANT_A }, ambit: '["b","anna","entitat:forn"]' });
    expect(result.current).toMatchObject({ numero: null, verificat: false });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    expect(m.servei.numeroSeguretat).toHaveBeenCalledTimes(2);
    /* Una altra persona. */
    rerender({ config: { tenantId: TENANT_A }, ambit: '["b","berta","persona:berta"]' });
    expect(result.current).toMatchObject({ numero: null, verificat: false });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    expect(m.servei.numeroSeguretat).toHaveBeenCalledTimes(3);
  });

  test('PC155-02b · una marca en vol de l’abast anterior no escriu sobre el nou, i la marca vella no envia res', async () => {
    const marcaA = promesaManual();
    m.servei.marcaVerificat.mockImplementationOnce(() => marcaA.promesa);
    const { result, rerender } = renderGanxo({ config: { tenantId: TENANT_A } });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    const marcaVella = result.current.marca;
    let enVol;
    act(() => { enVol = result.current.marca(true); });
    expect(m.servei.marcaVerificat).toHaveBeenCalledWith('mateix-fil', { kid: `kid-${TENANT_A}`, verificat: true }, { tenantId: TENANT_A });
    rerender({ config: { tenantId: TENANT_B } });
    await waitFor(() => expect(result.current.numero).toBe(`num-${TENANT_B}`));
    await act(async () => { marcaA.resol({ numero: `num-${TENANT_A}`, kid: `kid-${TENANT_A}`, verificat: true }); await enVol; });
    expect(result.current).toMatchObject({ numero: `num-${TENANT_B}`, kid: `kid-${TENANT_B}` });
    /* La marca capturada abans del canvi no envia el kid d'A amb la config de B. */
    await act(async () => { await marcaVella(true); });
    expect(m.servei.marcaVerificat).toHaveBeenCalledTimes(1);
    /* La marca vigent sí que marca, amb el kid i la config de B. */
    await act(async () => { await result.current.marca(true); });
    expect(m.servei.marcaVerificat).toHaveBeenLastCalledWith('mateix-fil', { kid: `kid-${TENANT_B}`, verificat: true }, { tenantId: TENANT_B });
  });

  test('una marca d’A que torna kid-canviat després del canvi d’abast no recalcula amb la clausura vella', async () => {
    const marcaA = promesaManual();
    m.servei.marcaVerificat.mockImplementationOnce(() => marcaA.promesa);
    const { result, rerender, pintats } = renderGanxo({ config: { tenantId: TENANT_A } });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    let enVol;
    act(() => { enVol = result.current.marca(true); });
    rerender({ config: { tenantId: TENANT_B } });
    await waitFor(() => expect(result.current.numero).toBe(`num-${TENANT_B}`));
    await act(async () => { marcaA.rebutja(errorAmb('kid-canviat')); await enVol; });
    expect(m.servei.numeroSeguretat).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ estat: ESTAT_NUMERO.llest, numero: `num-${TENANT_B}`, avis: null });
    expect(pintats.some((p) => p.avis === 'canviat')).toBe(false);
  });

  test('tancar i tornar a obrir amb un altre tenant: res d’A', async () => {
    const { result, rerender, pintats } = renderGanxo({ config: { tenantId: TENANT_A }, obert: true });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    rerender({ config: { tenantId: TENANT_A }, obert: false });
    expect(result.current.estat).toBe(ESTAT_NUMERO.inactiu);
    const desDe = pintats.length;
    rerender({ config: { tenantId: TENANT_B }, obert: true });
    expect(pintats.slice(desDe).some((p) => p.numero === `num-${TENANT_A}`)).toBe(false);
    await waitFor(() => expect(result.current.numero).toBe(`num-${TENANT_B}`));
  });

  /* ARB-PC155-02-01 (àrbitre, mutant G) · Sense el reinici en tancar, el primer
     render en tornar a obrir amb el mateix abast mostrava el número i el
     «verificat» d'abans, que pot haver canviat mentre era tancat. */
  test('tancar i tornar a obrir amb el mateix abast: cap render amb el número d’abans, i es torna a calcular', async () => {
    const { result, rerender, pintats } = renderGanxo({ config: { tenantId: TENANT_A }, obert: true });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    rerender({ config: { tenantId: TENANT_A }, obert: false });
    expect(result.current.estat).toBe(ESTAT_NUMERO.inactiu);
    const enVol = promesaManual();
    m.servei.numeroSeguretat.mockImplementationOnce(() => enVol.promesa);
    const desDe = pintats.length;
    rerender({ config: { tenantId: TENANT_A }, obert: true });
    expect(pintats[desDe]).toMatchObject({ estat: ESTAT_NUMERO.calculant, numero: null, kid: null, verificat: false });
    expect(pintats.slice(desDe).some((p) => p.numero !== null || p.verificat === true)).toBe(false);
    expect(m.servei.numeroSeguretat).toHaveBeenCalledTimes(2);
    await act(async () => { enVol.resol({ numero: 'num-reobert', kid: 'kid-reobert', verificat: false }); });
    expect(result.current).toMatchObject({ estat: ESTAT_NUMERO.llest, numero: 'num-reobert', verificat: false });
  });

  /* ARB-PC155-02-01 (àrbitre, mutant I) · Una marca que torna AMBIT_CANVIAT (la
     forma real de xifratXat.js) deixa el número de la clau vigent en «inactiu»:
     sense la clau, el derivat en pintar el tornaria «calculant» per sempre. */
  test('una marca rebutjada amb AMBIT_CANVIAT: inactiu, sense número ni roda, i cap recàlcul', async () => {
    m.servei.marcaVerificat.mockRejectedValueOnce(Object.assign(errorAmb('ambit-canviat'), { name: 'AbortError', code: 'AMBIT_CANVIAT' }));
    const { result } = renderGanxo({ config: { tenantId: TENANT_A } });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    await act(async () => { await result.current.marca(true); });
    expect(result.current).toMatchObject({ estat: ESTAT_NUMERO.inactiu, numero: null, kid: null, verificat: false, ocupat: false });
    /* Ni ara ni després: cap efecte el torna a «calculant» ni a calcular. */
    await act(async () => { await new Promise((r) => { setTimeout(r, 30); }); });
    expect(result.current.estat).toBe(ESTAT_NUMERO.inactiu);
    expect(m.servei.numeroSeguretat).toHaveBeenCalledTimes(1);
  });

  test('la forma pública no canvia: la clau no ix del ganxo', async () => {
    const { result } = renderGanxo({ config: { tenantId: TENANT_A } });
    await waitFor(() => expect(result.current.estat).toBe(ESTAT_NUMERO.llest));
    expect(Object.keys(result.current).sort()).toEqual(['avis', 'estat', 'kid', 'marca', 'numero', 'ocupat', 'pendent', 'verificat']);
  });
});

describe('clauDAbastDelNumero (pura)', () => {
  test('canvia amb el fil, el servei, el backend, l’URL, el tenant, el mode i l’àmbit', () => {
    const s1 = {};
    const s2 = {};
    const base = { filId: 'f', servei: s1, config: { backendId: 'supabase', backendUrl: 'https://a.example', tenantId: TENANT_A, dataMode: 'remote' }, ambit: 'x' };
    const clau = clauDAbastDelNumero(base);
    for (const canvi of [{ filId: 'g' }, { servei: s2 }, { servei: null }, { ambit: 'y' }, { ambit: null },
      { config: { ...base.config, tenantId: TENANT_B } },
      { config: { ...base.config, backendUrl: 'https://b.example' } },
      { config: { ...base.config, backendId: 'sdp-local' } },
      { config: { ...base.config, dataMode: 'local' } }]) {
      expect(clauDAbastDelNumero({ ...base, ...canvi }), JSON.stringify(canvi)).not.toBe(clau);
    }
  });

  test('no canvia amb la identitat de l’objecte, la caixa del tenant ni l’àlies; sí amb un espai (sense retallar)', () => {
    const s1 = {};
    const clau = clauDAbastDelNumero({ filId: 'f', servei: s1, config: { backendUrl: 'https://a.example', tenantId: TENANT_A } });
    expect(clauDAbastDelNumero({ filId: 'f', servei: s1, config: { backendUrl: 'https://a.example', tenantId: TENANT_A.toUpperCase() } })).toBe(clau);
    expect(clauDAbastDelNumero({ filId: 'f', servei: s1, config: { backend_url: 'https://a.example', tenant_id: TENANT_A } })).toBe(clau);
    expect(clauDAbastDelNumero({ filId: 'f', servei: s1, config: { supabaseUrl: 'https://a.example', tenantId: TENANT_A } })).toBe(clau);
    expect(clauDAbastDelNumero({ filId: 'f ', servei: s1, config: { backendUrl: 'https://a.example', tenantId: TENANT_A } })).not.toBe(clau);
  });

  test('mai llança: tenant que no és UUID, config nul·la o amb valors que no són text', () => {
    expect(() => clauDAbastDelNumero({ config: { tenantId: 'no-és-uuid' } })).not.toThrow();
    expect(() => clauDAbastDelNumero({ config: null })).not.toThrow();
    expect(() => clauDAbastDelNumero({ config: { tenantId: 7, backendUrl: {} }, servei: 'no-objecte' })).not.toThrow();
    expect(() => clauDAbastDelNumero()).not.toThrow();
  });
});
