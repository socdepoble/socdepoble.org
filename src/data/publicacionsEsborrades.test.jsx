import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import {
  _reiniciaPublicacionsEsborradesPerAProves,
  esPublicacioEsborrada,
  filtraPublicacionsEsborrades,
  marcaPublicacioEsborrada,
  restauraPublicacioEsborrada
} from './publicacionsEsborrades.js';

const m = vi.hoisted(() => ({
  user: 'javillinares',
  generation: 1,
  load: vi.fn(),
  append: vi.fn(),
  pagina: vi.fn()
}));

vi.mock('../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('./backendPort.js', () => ({
  loadMur: (...args) => m.load(...args),
  appendSectionSubmissionNetworkOnly: (...args) => m.append(...args),
  loadSeccioPage: (...args) => m.pagina(...args),
  teCapacitat: () => true
}));
vi.mock('../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ currentUser: { id: m.user }, generacio: m.generation })
}));
vi.mock('../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => ({ actorId: m.user, actorKey: m.user, actor: { tipus: 'persona', id: m.user, rol: 'membre' } })
}));
vi.mock('../app/contexts/useRecarregaExterna.jsx', () => ({ useRecarregaExterna: () => {} }));

import { MurProvider, useMur } from '../sections/mur/MurContext.jsx';
import { usePublicacionsDeLaFitxa } from '../sections/profile/usePublicacionsDeLaFitxa.js';

const config = { tenantId: '11111111-2222-3333-4444-555555555555' };
const wrapper = ({ children }) => <MurProvider config={config}>{children}</MurProvider>;

beforeEach(() => {
  vi.clearAllMocks();
  _reiniciaPublicacionsEsborradesPerAProves();
});

afterEach(() => {
  cleanup();
});

describe('FEDI-24 · Esborrat en cascada mecànica de Cards i Pàgines + retirada del Mac Mini', () => {
  test('mercat:mac-mini-m4 està retirat de manera canònica i no apareix al Mercat ni al Perfil de Javi Llinares', async () => {
    expect(esPublicacioEsborrada('mercat', 'mac-mini-m4')).toBe(true);

    m.load.mockResolvedValue({
      feedPosts: [],
      events: [],
      marketItems: [
        { id: 'mac-mini-m4', type: 'product', title: 'Mac Mini Apple M4, 24/512GB', author_id: 'javillinares', seller: 'Javi Llinares' },
        { id: 'samarreta-socdepoble', type: 'product', title: 'Samarreta Sóc de Poble', author_id: 'soc-de-poble_official', author_entity_id: 'socdepoble' }
      ]
    });

    const { result } = renderHook(
      () => ({
        mur: useMur(),
        perfilJavi: usePublicacionsDeLaFitxa({ tipus: 'persona', id: 'javillinares' })
      }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.mur.status).toBe('ready'));

    expect(result.current.mur.marketItems.map((i) => i.id)).toEqual(['samarreta-socdepoble']);
    expect(result.current.mur.sortedMarketItems.map((i) => i.id)).toEqual(['samarreta-socdepoble']);
    expect(result.current.perfilJavi.mercat.elements).toEqual([]);
  });

  test('esborraPublicacio elimina a l’instant la Card del Mur/Mercat i del Perfil de l’autor', async () => {
    m.load.mockResolvedValue({
      feedPosts: [
        { id: 'post-javi-1', type: 'post', title: 'Bàndol de prova', author_id: 'javillinares', author_name: 'Javi Llinares' }
      ],
      events: [],
      marketItems: [
        { id: 'prod-javi-1', type: 'product', title: 'Cistella de tomaques', author_id: 'javillinares', seller: 'Javi Llinares' }
      ]
    });

    const { result } = renderHook(
      () => ({
        mur: useMur(),
        perfilJavi: usePublicacionsDeLaFitxa({ tipus: 'persona', id: 'javillinares' })
      }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.mur.status).toBe('ready'));
    expect(result.current.perfilJavi.mercat.elements.map((e) => e.id)).toEqual(['mercat:prod-javi-1']);
    expect(result.current.perfilJavi.mur.elements.map((e) => e.id)).toEqual(['mur:post-javi-1']);

    await act(async () => {
      await result.current.mur.esborraPublicacio('mercat', 'prod-javi-1');
    });

    expect(result.current.mur.marketItems).toEqual([]);
    expect(result.current.mur.sortedMarketItems).toEqual([]);
    expect(result.current.perfilJavi.mercat.elements).toEqual([]);

    await act(async () => {
      await result.current.mur.esborraPublicacio('mur', 'post-javi-1');
    });

    expect(result.current.mur.feedPosts).toEqual([]);
    expect(result.current.perfilJavi.mur.elements).toEqual([]);
  });

  test('marcaPublicacioEsborrada i restauraPublicacioEsborrada filtren i restauren qualsevol publicació no canònica', () => {
    const llista = [{ id: 'a' }, { id: 'b' }];
    expect(filtraPublicacionsEsborrades(llista, 'mur')).toBe(llista);

    marcaPublicacioEsborrada('mur', 'a');
    expect(esPublicacioEsborrada('mur', 'a')).toBe(true);
    expect(filtraPublicacionsEsborrades(llista, 'mur')).toEqual([{ id: 'b' }]);

    restauraPublicacioEsborrada('mur', 'a');
    expect(esPublicacioEsborrada('mur', 'a')).toBe(false);
    expect(filtraPublicacionsEsborrades(llista, 'mur')).toBe(llista);
  });
});

