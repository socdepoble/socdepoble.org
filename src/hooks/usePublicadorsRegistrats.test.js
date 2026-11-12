import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { usePublicadorsRegistrats } from './usePublicadorsRegistrats.js';

const port = vi.hoisted(() => ({ llig: vi.fn(), disponible: true }));
vi.mock('../data/backendPort.js', () => ({
  lligPublicadorsRegistrats: port.llig,
  teCapacitat: () => port.disponible
}));

const recurs = recursId => ({ recursTipus: 'pagina', recursId });

beforeEach(() => { port.llig.mockReset(); port.disponible = true; });
afterEach(cleanup);

test('la reserva oficial és immediata i una resposta de la fitxa anterior queda descartada', async () => {
  let resolAntiga;
  port.llig
    .mockImplementationOnce(() => new Promise(resolve => { resolAntiga = resolve; }))
    .mockResolvedValueOnce({ ...recurs('herbari'), versio: 2, publicadorsRegistrats: [] });
  const { result, rerender } = renderHook(({ id }) => usePublicadorsRegistrats(recurs(id)),
    { initialProps: { id: 'receptes' } });
  expect(result.current.publicadorEfectiu.actor_id).toBe('socdepoble');
  await waitFor(() => expect(port.llig).toHaveBeenCalledTimes(1));
  const senyalAntic = port.llig.mock.calls[0][1].signal;
  rerender({ id: 'herbari' });
  expect(senyalAntic.aborted).toBe(true);
  await waitFor(() => expect(result.current.versio).toBe(2));
  await act(async () => resolAntiga({ ...recurs('receptes'), versio: 5, publicadorsRegistrats: [] }));
  expect(result.current).toMatchObject({ fase: 'llest', recursId: 'herbari', versio: 2 });
});

test('sense capacitat o amb esquema antic, reserva el publicador i fa visible l’estat', async () => {
  port.disponible = false;
  const { result, rerender } = renderHook(() => usePublicadorsRegistrats(recurs('herbari')));
  expect(result.current).toMatchObject({ fase: 'no-disponible', versio: 0 });
  expect(port.llig).not.toHaveBeenCalled();
  port.llig.mockRejectedValueOnce(Object.assign(new Error('Manca la migració.'), { code: 'no-disponible' }))
    .mockResolvedValueOnce({ ...recurs('herbari'), versio: 4, publicadorsRegistrats: [] });
  port.disponible = true;
  rerender();
  await waitFor(() => expect(result.current.error?.code).toBe('no-disponible'));
  act(() => result.current.recarrega());
  await waitFor(() => expect(result.current).toMatchObject({ fase: 'llest', versio: 4, error: null }));
});

test('projecta a la barra només els comptes de la lectura del port', async () => {
  const principal = { nom: 'Organització de prova', poble_nom: 'Poble sintètic',
    avatar_url: null, slug_ruta: '/perfil/00000000-0000-4000-8000-000000000001' };
  port.llig.mockResolvedValue({ recursTipus: 'planta', recursId: 'herbari-113-timo',
    versio: 1, publicadorsRegistrats: [principal], publicadorEfectiu: principal });
  const { result } = renderHook(() => usePublicadorsRegistrats({ recursTipus: 'planta', recursId: 'herbari-113-timo' }));
  expect(result.current.dadesBarra).toBeNull();
  await waitFor(() => expect(result.current.dadesBarra).toEqual({
    authorName: principal.nom, authorLocation: principal.poble_nom,
    authorAvatar: null, authorHref: principal.slug_ruta, publicadorsRegistrats: [principal]
  }));
});
