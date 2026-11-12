import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ config: {}, sessio: null, llista: vi.fn(), desa: vi.fn(), esborra: vi.fn() }));
vi.mock('../../app/contexts/UIContext.jsx', () => ({ useUIStateOpcional: () => ({ externalConfig: m.config }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => m.sessio }));
vi.mock('../../data/backendPort.js', () => ({
  llistaRevisionsPatrimoni: m.llista, desaRevisioPatrimoni: m.desa, esborraRevisioPatrimoni: m.esborra,
  teCapacitat: () => true, getRuntimeDataMode: () => 'seed'
}));
import { useRevisionsArbre } from './useRevisionsArbre.js';

const arbreId = 'arbre-01-albers-blancs-del-pont';
const fila = (campanyaAny = 2026) => ({ entitatTipus: 'arbre', entitatSlug: arbreId, campanyaAny,
  id: `${String(campanyaAny).padStart(8, '0')}-1111-4111-8111-111111111111`, versio: 1,
  estatConservacio: 'Observat en campanya', mesures: { alcadaM: 15 }, observacions: 'Cinta i clinòmetre.' });

beforeEach(() => {
  m.config = { dataMode: 'seed', tenantId: '11111111-1111-4111-8111-111111111111' };
  m.sessio = { estat: 'dins', currentUser: { id: '22222222-2222-4222-8222-222222222222' } };
  m.llista.mockReset().mockResolvedValue([]);
  m.desa.mockReset().mockResolvedValue(fila());
  m.esborra.mockReset().mockResolvedValue(true);
});

describe('R18 · connexió de la fitxa amb el port neutral', () => {
  it('consulta públicament i reflectix el rebut de desament amb versió', async () => {
    const { result } = renderHook(() => useRevisionsArbre(arbreId));
    await waitFor(() => expect(result.current.fase).toBe('llest'));
    await act(async () => result.current.desa({ campanyaAny: 2026, versio: 0,
      estatConservacio: 'Observat en campanya', mesures: { alcadaM: 15 }, observacions: '' }));
    expect(m.desa.mock.calls[0][0]).toMatchObject({ entitatTipus: 'arbre', entitatSlug: arbreId, versio: 0 });
    expect(result.current.files).toEqual([fila()]);
    await act(async () => result.current.esborra({ id: fila().id, versio: 1, campanyaAny: 2026 }));
    expect(result.current.files).toEqual([]);
  });

  it('rebutja una fila vàlida que pertany a una altra peça', async () => {
    m.llista.mockResolvedValue([{ ...fila(), entitatSlug: 'arbre-d-un-altre-poble' }]);
    const { result } = renderHook(() => useRevisionsArbre(arbreId));
    await waitFor(() => expect(result.current.fase).toBe('error'));
    expect(result.current.files).toEqual([]);
  });

  it('espera la lectura inicial abans d’escriure, perquè el snapshot antic no tape el rebut', async () => {
    let acaba;
    m.llista.mockImplementationOnce(() => new Promise(resolve => { acaba = resolve; }));
    const { result } = renderHook(() => useRevisionsArbre(arbreId));
    await waitFor(() => expect(m.llista).toHaveBeenCalledTimes(1));
    await expect(result.current.desa({})).rejects.toThrow('en curs');
    expect(m.desa).not.toHaveBeenCalled();
    await act(async () => { acaba([]); });
    await act(async () => result.current.desa({ campanyaAny: 2026, versio: 0 }));
    expect(result.current.files).toEqual([fila()]);
  });

  it('l’abast anterior queda avortat en canviar de compte i una resposta tardana no reapareix', async () => {
    let acaba;
    m.llista.mockImplementationOnce(() => new Promise(resolve => { acaba = resolve; }));
    const { result, rerender } = renderHook(() => useRevisionsArbre(arbreId));
    await waitFor(() => expect(m.llista).toHaveBeenCalledTimes(1));
    const desaAnterior = result.current.desa;
    const senyalAnterior = m.llista.mock.calls[0][1].signal;
    m.sessio = null;
    rerender();
    expect(senyalAnterior.aborted).toBe(true);
    await expect(desaAnterior({})).rejects.toMatchObject({ name: 'AbortError' });
    await act(async () => { acaba([fila()]); });
    await waitFor(() => expect(result.current.fase).toBe('llest'));
    expect(result.current.files).toEqual([]);
    expect(m.desa).not.toHaveBeenCalled();
  });

  it('carrega la pàgina següent amb el cursor anual i conserva les cent anteriors', async () => {
    m.llista.mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => fila(2026 - i))).mockResolvedValueOnce([fila(1926)]);
    const { result } = renderHook(() => useRevisionsArbre(arbreId));
    await waitFor(() => expect(result.current.files).toHaveLength(100));
    expect(result.current.mes).toBe(true);
    await act(async () => result.current.anteriors());
    expect(m.llista.mock.calls[1][0]).toMatchObject({ abansAny: 1927 });
    expect(result.current.files).toHaveLength(101);
    expect(result.current.mes).toBe(false);
  });

  it('una campanya antiga acabada de desar no mou el cursor de les pàgines pendents', async () => {
    m.llista.mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => fila(2026 - i)))
      .mockResolvedValueOnce([fila(1926), fila(1800)]);
    m.desa.mockResolvedValueOnce(fila(1800));
    const { result } = renderHook(() => useRevisionsArbre(arbreId));
    await waitFor(() => expect(result.current.files).toHaveLength(100));
    await act(async () => result.current.desa({ campanyaAny: 1800, versio: 0 }));
    await act(async () => result.current.anteriors());
    expect(m.llista.mock.calls[1][0]).toMatchObject({ abansAny: 1927 });
    expect(result.current.files).toHaveLength(102);
    expect(result.current.files.filter(item => item.campanyaAny === 1800)).toHaveLength(1);
  });
});
