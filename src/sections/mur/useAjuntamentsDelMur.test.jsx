/**
 * T3.3 (marató nocturna 261101, carril B3) · useAjuntamentsDelMur: quines
 * entitats candidates són un ajuntament, pel directori públic del port
 * (capacitat 'directoriEntitats'). Només kind 'city_hall'; fail-closed.
 */
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ capacitats: new Set(['directoriEntitats']), directori: vi.fn(), config: {} }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: mocks.config }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  listPublicOrganizations: (...args) => mocks.directori(...args)
}));
import { ajuntamentsDeLesFiles, KIND_AJUNTAMENT, useAjuntamentsDelMur } from './useAjuntamentsDelMur.js';

const AJ = 'aj-1';
const FILES = [
  { id: AJ, kind: 'city_hall' },
  { id: 'forn', kind: 'company' },
  { id: 'assoc', kind: 'entity' },
  { id: 'grup', kind: 'group' }
];

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.capacitats = new Set(['directoriEntitats']);
  mocks.config = {};
  mocks.directori.mockImplementation(async () => FILES);
});

describe('ajuntamentsDeLesFiles', () => {
  test('només les files amb kind «city_hall» i un id', () => {
    expect(KIND_AJUNTAMENT).toBe('city_hall');
    expect([...ajuntamentsDeLesFiles([...FILES, { kind: 'city_hall' }, { id: '', kind: 'city_hall' }, null, 'x', { id: 7, kind: 'city_hall' }])])
      .toEqual([AJ, '7']);
  });

  test('una resposta que no és una llista no en dona cap', () => {
    for (const resposta of [null, undefined, {}, 'city_hall', 3]) expect(ajuntamentsDeLesFiles(resposta).size).toBe(0);
  });
});

describe('useAjuntamentsDelMur', () => {
  test('sense candidats, cap petició', async () => {
    const { result } = renderHook(() => useAjuntamentsDelMur([]));
    await new Promise((resolta) => setTimeout(resolta, 0));
    expect(mocks.directori).not.toHaveBeenCalled();
    expect(result.current.estat).toBe('sense-candidats');
    expect(result.current.esAjuntament(AJ)).toBe(false);
  });

  test('sense la capacitat, cap petició i cap ajuntament', async () => {
    mocks.capacitats = new Set();
    const { result } = renderHook(() => useAjuntamentsDelMur([AJ]));
    await new Promise((resolta) => setTimeout(resolta, 0));
    expect(mocks.directori).not.toHaveBeenCalled();
    expect(result.current.estat).toBe('no-disponible');
    expect(result.current.esAjuntament(AJ)).toBe(false);
  });

  test('mentre carrega, cap; amb la resposta, només l’ajuntament', async () => {
    const candidats = [AJ, 'forn', 'assoc'];
    const { result } = renderHook(() => useAjuntamentsDelMur(candidats));
    expect(result.current.estat).toBe('loading');
    expect(result.current.esAjuntament(AJ)).toBe(false);
    await waitFor(() => expect(result.current.estat).toBe('ready'));
    expect(result.current.esAjuntament(AJ)).toBe(true);
    for (const id of ['forn', 'assoc', 'grup', 'una-altra']) expect(result.current.esAjuntament(id), id).toBe(false);
    expect(mocks.directori).toHaveBeenCalledTimes(1);
    const [filtre, config] = mocks.directori.mock.calls[0];
    expect(filtre).toMatchObject({ limit: 500 });
    expect(filtre.signal).toBeInstanceOf(AbortSignal);
    expect(config).toBe(mocks.config);
  });

  test('un error del directori deixa cap ajuntament (fail-closed)', async () => {
    mocks.directori.mockImplementation(async () => { throw new Error('Caigut'); });
    const { result } = renderHook(() => useAjuntamentsDelMur([AJ]));
    await waitFor(() => expect(result.current.estat).toBe('error'));
    expect(result.current.esAjuntament(AJ)).toBe(false);
  });

  test('els mateixos candidats no tornen a preguntar; uns de nous, sí, sense perdre la resposta d’abans', async () => {
    const { result, rerender } = renderHook(({ candidats }) => useAjuntamentsDelMur(candidats), { initialProps: { candidats: [AJ] } });
    await waitFor(() => expect(result.current.estat).toBe('ready'));
    const esAjuntament = result.current.esAjuntament;
    rerender({ candidats: [AJ] });
    expect(result.current.esAjuntament).toBe(esAjuntament);
    expect(mocks.directori).toHaveBeenCalledTimes(1);

    let respon;
    mocks.directori.mockImplementation(() => new Promise((resolta) => { respon = resolta; }));
    rerender({ candidats: [AJ, 'forn'] });
    expect(result.current.estat).toBe('loading');
    expect(result.current.esAjuntament(AJ)).toBe(true);
    await waitFor(() => expect(mocks.directori).toHaveBeenCalledTimes(2));
    respon(FILES);
    await waitFor(() => expect(result.current.estat).toBe('ready'));
    expect(result.current.esAjuntament('forn')).toBe(false);
  });

  test('un altre abast (un altre poble o backend) no hereta la resposta', async () => {
    mocks.config = { tenantId: '11111111-1111-4111-8111-111111111111', dataMode: 'remote' };
    const { result, rerender } = renderHook(() => useAjuntamentsDelMur([AJ]));
    await waitFor(() => expect(result.current.esAjuntament(AJ)).toBe(true));
    mocks.directori.mockImplementation(() => new Promise(() => {}));
    mocks.config = { tenantId: '22222222-2222-4222-8222-222222222222', dataMode: 'remote' };
    rerender();
    expect(result.current.esAjuntament(AJ)).toBe(false);
    expect(result.current.estat).toBe('loading');
  });
});
