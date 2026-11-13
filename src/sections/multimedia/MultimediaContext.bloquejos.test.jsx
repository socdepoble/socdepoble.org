/* Gauntlet R22 (notes-04) · versioBloquejos és frescor, no identitat. Dins de la
   clau d'AÏLLAMENT de MultimediaProvider, cada bloqueig o desbloqueig (també el
   fet des del xat) canviava el token de useScopedResource i l'Arxiu tornava a
   {status:'loading', payload:null}. Ara la clau és (backend, persona, actor) i
   un canvi de versioBloquejos fa refresh(): es revalida en segon pla. */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ claus: [], refresh: vi.fn(), moderacio: { versioBloquejos: 0 } }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => ({ actorId: 'A', actorKey: 'A' }),
  useIdentitatOpcional: () => ({ actorId: 'A', actorKey: 'A' })
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'u' } }) }));
vi.mock('../../app/contexts/useScopedResource.js', () => ({ useScopedResource: (_carrega, _actor, clau) => {
  m.claus.push(clau);
  return { status: 'ready', payload: { mediaItems: [] }, error: null, errorRevalidacio: null, refresh: m.refresh };
} }));
vi.mock('../../app/contexts/useRecarregaExterna.jsx', () => ({ useRecarregaExterna: () => {} }));
vi.mock('../../data/backendPort.js', () => ({ loadMultimedia: async () => ({}) }));
vi.mock('../mur/MurContext.jsx', () => ({ useMur: () => ({ feedPosts: [], marketItems: [], events: [] }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ towns: [] }), IDENTITAT_DE_RESERVA: { actorId: null, actorKey: 'anon' } }));
vi.mock('../../components/PedraSeca/hooks/moderacioDePoble.js', () => ({ useModeracio: () => m.moderacio }));
import { MultimediaProvider, useMultimedia } from './MultimediaContext.jsx';

const wrapper = ({ children }) => <MultimediaProvider config={{}}>{children}</MultimediaProvider>;

beforeEach(() => {
  m.claus = [];
  m.refresh.mockReset();
  m.moderacio = { versioBloquejos: 0 };
});

test('un bloqueig o un desbloqueig no canvia la clau d’aïllament: revalida amb refresh, una vegada per canvi', () => {
  const vista = renderHook(() => useMultimedia(), { wrapper });
  expect(m.refresh).not.toHaveBeenCalled();
  const clau = m.claus.at(-1);
  expect(JSON.parse(clau)).toHaveLength(3);
  act(() => { m.moderacio = { versioBloquejos: 1 }; vista.rerender(); });
  expect(m.claus.at(-1)).toBe(clau);
  expect(m.refresh).toHaveBeenCalledTimes(1);
  expect(vista.result.current.status).toBe('ready');
  act(() => { vista.rerender(); });
  expect(m.refresh).toHaveBeenCalledTimes(1);
  act(() => { m.moderacio = { versioBloquejos: 2 }; vista.rerender(); });
  expect(m.claus.every((c) => c === clau)).toBe(true);
  expect(m.refresh).toHaveBeenCalledTimes(2);
});

test('sense ProveidorModeracio (null) la clau és la mateixa i no es revalida res', () => {
  m.moderacio = null;
  renderHook(() => useMultimedia(), { wrapper });
  expect(m.refresh).not.toHaveBeenCalled();
  expect(JSON.parse(m.claus.at(-1))).toHaveLength(3);
});
