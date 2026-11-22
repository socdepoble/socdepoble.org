import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ generacio: 2, registra: vi.fn(), user: null, jwt: null, entrada: 0 }));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('./SessionContext.jsx', () => ({ useSession: () => ({ generacio: m.generacio }) }));
vi.mock('../../pwa/lecturesPubliques.js', () => ({ registraLecturaPublica: m.registra }));
vi.mock('../../data/identitat.js', () => ({ usuariDeSessio: () => m.user, jwtPerBackend: () => m.jwt, capturaSessio: () => { const inici = m.entrada; return () => { if (inici !== m.entrada) throw new DOMException('Canvi', 'AbortError'); }; } }));
import { useScopedResource } from './useScopedResource.js';
import { estatSessioIntern as S } from './sessionContextIntern.js';
const anon = generacio => ({ estat: 'fora', usuari: null, generacio });
let antic;
beforeEach(() => { antic = S.estatActual; S.estatActual = anon(2); m.generacio = 2; m.user = null; m.jwt = null; m.entrada = 0; m.registra.mockReset(); });
afterEach(() => { cleanup(); S.estatActual = antic; });

describe('autoritat de lectura pública fixada a l’inici del FETCH', () => {
  test('una resposta crua anònima actual arriba al broker només al lloc propi', async () => {
    const config = { manageDocumentHead: true };
    const payload = { feedPosts: [{ id: 'public', title: 'Text del servidor' }] };
    const loader = vi.fn(async () => payload);
    renderHook(() => useScopedResource(loader, null, 'anon', config, 'mur'));
    await waitFor(() => expect(m.registra).toHaveBeenCalledWith('mur', payload, 2));
  });
  test('una lectura iniciada dins no es fa pública encara que s’haja eixit abans d’acabar', async () => {
    S.estatActual = { estat: 'dins', usuari: { id: 'a' }, generacio: 2 };
    const config = { manageDocumentHead: true };
    let acaba;
    const loader = vi.fn(() => new Promise(resolve => { acaba = resolve; }));
    renderHook(() => useScopedResource(loader, 'a', 'a', config, 'mur'));
    await waitFor(() => expect(loader).toHaveBeenCalledOnce());
    S.estatActual = anon(3);
    await act(async () => acaba({ feedPosts: [{ id: 'secret' }] }));
    expect(m.registra).not.toHaveBeenCalled();
  });
  test('canvi de generació, entrada posterior o amfitrió descarten la còpia', async () => {
    for (const cas of ['generacio', 'entrada', 'amfitrio']) {
      S.estatActual = anon(2);
      let acaba;
      const config = { manageDocumentHead: cas !== 'amfitrio' };
      const loader = vi.fn(() => new Promise(resolve => { acaba = resolve; }));
      const { unmount } = renderHook(() => useScopedResource(loader, null, 'anon', config, 'mur'));
      await waitFor(() => expect(loader).toHaveBeenCalledOnce());
      if (cas === 'generacio') S.estatActual = anon(3);
      if (cas === 'entrada') S.estatActual = { estat: 'dins', usuari: { id: 'a' }, generacio: 2 };
      await act(async () => acaba({ feedPosts: [{ id: 'private' }] }));
      expect(m.registra).not.toHaveBeenCalled();
      unmount();
    }
  });
  test('la sessió crua ja activa domina un estat reactiu encara anònim', async () => {
    const config = { manageDocumentHead: true };
    m.user = { id: 'raw-a' };
    m.jwt = 'jwt-en-memoria';
    const loader = vi.fn(async () => ({ feedPosts: [{ id: 'privat' }] }));
    const { result } = renderHook(() => useScopedResource(loader, null, 'anon', config, 'mur'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(m.registra).not.toHaveBeenCalled();
  });
  test('entrada i eixida crues durant el fetch no hereten la generació reactiva antiga', async () => {
    const config = { manageDocumentHead: true };
    let acaba;
    const loader = vi.fn(() => new Promise(resolve => { acaba = resolve; }));
    renderHook(() => useScopedResource(loader, null, 'anon', config, 'mur'));
    await waitFor(() => expect(loader).toHaveBeenCalledOnce());
    // El servei de React encara diu fora/generació 2: la captura canònica
    // sí que veu que s'ha entrat i s'ha eixit mentrestant.
    m.entrada += 2;
    await act(async () => acaba({ feedPosts: [{ id: 'privat' }] }));
    expect(m.registra).not.toHaveBeenCalled();
  });

});
