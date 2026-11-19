// @vitest-environment jsdom
import { webcrypto } from 'node:crypto';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { creaAutenticadorSimulat } from '../../../tests/helpers/autenticadorSimulat.js';
import { fullACsv, maquetaFull } from './nucli/fullModel.js';
import { crearFactura } from './nucli/model.js';
import { PLANTILLA_GESTORIA } from './nucli/plantilla.js';
import { TRACTOR_FACTURES } from './tractors.js';
import { incidenciesDe, useGestoria } from './useGestoria.js';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const subtle = webcrypto.subtle;
const ara = Date.UTC(2026, 9, 2, 10);
const empremta = `sha256:${'ab'.repeat(32)}`;
const autenticador = await creaAutenticadorSimulat({ subtle });
const registre = await autenticador.signa({ manifest: TRACTOR_FACTURES, empremta, ara: ara - 60000 });
const aprovacio = { manifest: TRACTOR_FACTURES, empremta, registres: [registre], claus: autenticador.claus, origen: autenticador.origen, rpId: autenticador.rpId, ara };
const hostil = 'a' + '\u0315'.repeat(16383) + '\u0300'.repeat(16384) + 'x';

async function munta() {
  const factura = crearFactura({ tipus: 'despesa', data: '15/08/2026', num: 'LAB1', contrapart: 'Proveïdor LAB SL', nif: '', subtotal: 10000, iva: 2100, total: 12100 });
  const csv = fullACsv(maquetaFull(PLANTILLA_GESTORIA, { titular: 'Titular LAB', any: 2026, t: 3, ingressos: [], despeses: [factura] }));
  const bytes = new TextEncoder().encode(csv);
  const font = { tipus: 'memoria', nom: 'LAB', llista: async () => [{ ruta: '2026_3T/2026-FACTURACIO-LAB-3T.csv', mida: bytes.length, modificat: 0 }], llig: async () => bytes, escriu: vi.fn() };
  const obteAprovacio = vi.fn(async () => aprovacio);
  const hook = renderHook(() => useGestoria({ obteAprovacio, subtle, inflate: null, avui: () => new Date(2026, 9, 2, 12) }));
  act(() => hook.result.current.usaFont(font));
  let ok;
  await act(async () => { ok = await hook.result.current.analitza({ any: 2026, t: 3 }); });
  expect(ok).toBe(true);
  act(() => hook.result.current.editaTitular('Titular LAB'));
  if (hook.result.current.proposta.despeses.length === 0) {
    let id;
    act(() => { id = hook.result.current.afegixFactura('despesa'); });
    act(() => hook.result.current.editaFactura(id, 'contrapart', 'Proveïdor LAB'));
  }
  let signada;
  await act(async () => { signada = await hook.result.current.aprovaProposta({ acceptaIncidencies: true }); });
  expect(signada).not.toBeNull();
  return { ...hook, font, obteAprovacio };
}

describe('R32.11 · pressupost Unicode abans de canviar o aprovar proposta Gestoria', () => {
  test('editar nom hostil conserva proposta, versió, aprovació i Font; tornafalse amb error controlat', async () => {
    const { result, font } = await munta();
    const proposta = result.current.proposta, versio = result.current.versio, aprovacioAnterior = result.current.aprovacioProposta;
    const abans = JSON.stringify(proposta);
    const factura = proposta.despeses[0];
    let ok;
    act(() => { ok = result.current.editaFactura(factura.id, 'contrapart', hostil); });
    expect(ok).toBe(false);
    expect(result.current.proposta).toBe(proposta);
    expect(JSON.stringify(result.current.proposta)).toBe(abans);
    expect(result.current.versio).toBe(versio);
    expect(result.current.aprovacioProposta).toBe(aprovacioAnterior);
    expect(result.current.propostaAprovada).toBe(true);
    expect(result.current.error).toMatchObject({ codi: 'UNICODE_MARK_LIMIT', accio: 'proposta', to: 'error' });
    expect(font.escriu).not.toHaveBeenCalled();
  });

  test('llegat invàlid és incidència alta i acceptaIncidencies:true no el pot aprovar', async () => {
    const { result, font, obteAprovacio } = await munta();
    // Simula un estat llegat anterior a la nova validació; no s'usa l'acció
    // d'edició, que el test anterior prova que el rebutja abans del commit.
    const proposta = result.current.proposta;
    expect(Object.isFrozen(proposta.despeses[0])).toBe(false);
    proposta.despeses[0].contrapart = hostil;
    const versio = result.current.versio, aprovacioAnterior = result.current.aprovacioProposta;
    const abans = JSON.stringify(proposta);
    const incidencies = incidenciesDe({ analisi: { documents: [], incidencies: [], proveidors: [] }, proposta });
    expect(incidencies).toContainEqual(expect.objectContaining({ codi: 'UNICODE_MARK_LIMIT', severitat: 'alta' }));
    let resposta;
    await act(async () => { resposta = await result.current.aprovaProposta({ acceptaIncidencies: true }); });
    expect(resposta).toBeNull();
    expect(result.current.error).toMatchObject({ codi: 'UNICODE_MARK_LIMIT', accio: 'proposta' });
    expect(result.current.versio).toBe(versio);
    expect(result.current.aprovacioProposta).toBe(aprovacioAnterior);
    expect(JSON.stringify(proposta)).toBe(abans);
    expect(font.escriu).not.toHaveBeenCalled();
    const crides = obteAprovacio.mock.calls.length;
    let generada;
    await act(async () => { generada = await result.current.genera(); });
    expect(generada).toBe(false);
    expect(obteAprovacio).toHaveBeenCalledTimes(crides);
    expect(result.current.entregables).toBeNull();
    expect(font.escriu).not.toHaveBeenCalled();
  });

  test('altres errors d’auditoria es propaguen i no es convertixen en pressupost ni fals verd', () => {
    const sentinel = Object.assign(new Error('Alié al pressupost'), { code: 'ALTRE_ERROR' });
    const proposta = { any: 2026, t: 3, ingressos: [], despeses: [] };
    const analisi = { documents: [], incidencies: [], get proveidors() { throw sentinel; } };
    expect(() => incidenciesDe({ analisi, proposta })).toThrow(sentinel);
  });

  test('generar un llegat invàlid es veta abans de consultar cap porta encara que conserve aprovació anterior', async () => {
    const { result, font, obteAprovacio } = await munta();
    result.current.proposta.despeses[0].contrapart = hostil;
    const abans = JSON.stringify(result.current.proposta);
    const crides = obteAprovacio.mock.calls.length;
    let generada;
    await act(async () => { generada = await result.current.genera(); });
    expect(generada).toBe(false);
    expect(obteAprovacio).toHaveBeenCalledTimes(crides);
    expect(result.current.entregables).toBeNull();
    expect(font.escriu).not.toHaveBeenCalled();
    expect(JSON.stringify(result.current.proposta)).toBe(abans);
  });
});
