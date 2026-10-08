import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ generacio: 1, quanLlest: vi.fn(async () => undefined) }));
vi.mock('../../host.js', () => ({ quanLlest: (...args) => m.quanLlest(...args) }));
/* Auditoria 261007 (B) · useScopedResource llig la generació de la sessió. */
vi.mock('./SessionContext.jsx', () => ({ useSession: () => ({ generacio: m.generacio }) }));
import { useScopedResource } from './useScopedResource.js';
afterEach(() => { cleanup(); m.generacio = 1; m.quanLlest.mockClear(); });
test('StrictMode arranca la càrrega i aïlla el primer render del nou àmbit', async () => {
  const config = {};
  let finish;
  const loader = vi.fn().mockResolvedValueOnce({ id: 'A' });
  const { result, rerender, unmount } = renderHook(({ scope }) => useScopedResource(loader, scope, scope, config), {
    initialProps: { scope: 'A' }, wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>
  });
  await waitFor(() => expect(result.current.payload).toEqual({ id: 'A' }));
  loader.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  rerender({ scope: 'B' });
  expect(result.current.payload).toBeNull();
  await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  const signal = loader.mock.calls[1][1].signal;
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => finish({ id: 'B' }));
});

/* Auditoria 261007 (B) · La generació 0 és el pintat d'abans que el
   SessionProvider configure la sessió: la seua tanda moria avortada sense
   pintar-se. Ara no ix; la pantalla és la mateixa ('loading'). */
test('amb la generació 0 no es crida el loader ni s’espera el host; amb la 1, una sola càrrega', async () => {
  m.generacio = 0;
  const config = {};
  const loader = vi.fn().mockResolvedValue({ id: 'A' });
  const { result, rerender } = renderHook(() => useScopedResource(loader, 'A', JSON.stringify(['A', m.generacio]), config));
  await act(async () => { await Promise.resolve(); });
  expect(result.current.status).toBe('loading');
  expect(result.current.payload).toBeNull();
  expect(loader).not.toHaveBeenCalled();
  expect(m.quanLlest).not.toHaveBeenCalled();
  m.generacio = 1;
  rerender();
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(result.current.payload).toEqual({ id: 'A' });
  expect(loader).toHaveBeenCalledTimes(1);
});

test('la guarda no depén de la clau: la mateixa clau amb la generació nova també arrenca', async () => {
  m.generacio = 0;
  const config = {};
  const loader = vi.fn().mockResolvedValue({ id: 'A' });
  const { result, rerender } = renderHook(() => useScopedResource(loader, 'A', 'clau-fixa', config));
  await act(async () => { await Promise.resolve(); });
  expect(loader).not.toHaveBeenCalled();
  m.generacio = 1;
  rerender();
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(loader).toHaveBeenCalledTimes(1);
});

/* ── Decisió 2 del Mestre (261007) · «El Mur "Carregant": RENOVACIÓ
   SILENCIOSA» ── La clau d'AÏLLAMENT (àmbit, configuració, actor, loader)
   buida en el mateix pintat; la de FRESCOR (generació i refresh) conserva les
   dades bones en 'ready' i revalida en segon pla amb `revalidant`. */

/** Pinta el hook i anota cada `status` que veu un consumidor. */
function pintaAmbEstats(loader, config, initialProps = { actor: 'A' }) {
  const estats = [];
  const pintat = renderHook(({ actor }) => {
    const resultat = useScopedResource(loader, actor, `clau-${actor}`, config);
    estats.push(resultat.status);
    return resultat;
  }, { initialProps });
  return { ...pintat, estats };
}

test('Decisió 2 · una renovació (generació nova, mateix àmbit) conserva el payload en ready i revalida en segon pla', async () => {
  const config = {};
  const loader = vi.fn().mockResolvedValueOnce({ v: 1 });
  const { result, rerender, estats } = pintaAmbEstats(loader, config);
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(result.current.revalidant).toBe(false);
  const desDeLlest = estats.length;
  let acaba;
  loader.mockImplementationOnce(() => new Promise(resolve => { acaba = resolve; }));
  m.generacio = 2;
  rerender({ actor: 'A' });
  // El mateix pintat de la renovació ja és 'ready' amb les dades d'abans.
  expect(result.current).toMatchObject({ status: 'ready', payload: { v: 1 } });
  await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  expect(result.current).toMatchObject({ status: 'ready', payload: { v: 1 }, revalidant: true, error: null });
  await act(async () => acaba({ v: 2 }));
  expect(result.current).toMatchObject({ status: 'ready', payload: { v: 2 }, revalidant: false, errorRevalidacio: null });
  expect(estats.slice(desDeLlest)).toEqual(expect.not.arrayContaining(['loading']));
});

test('Decisió 2 · refresh (després de publicar, sdp:refresh-data) revalida igual, sense passar per loading', async () => {
  const config = {};
  const loader = vi.fn().mockResolvedValueOnce({ v: 1 });
  const { result, estats } = pintaAmbEstats(loader, config);
  await waitFor(() => expect(result.current.status).toBe('ready'));
  const desDeLlest = estats.length;
  let acaba;
  loader.mockImplementationOnce(() => new Promise(resolve => { acaba = resolve; }));
  act(() => result.current.refresh());
  expect(result.current).toMatchObject({ status: 'ready', payload: { v: 1 }, revalidant: true });
  await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  await act(async () => acaba({ v: 2 }));
  expect(result.current).toMatchObject({ status: 'ready', payload: { v: 2 }, revalidant: false });
  expect(estats.slice(desDeLlest)).toEqual(expect.not.arrayContaining(['loading']));
});

test('Decisió 2 · un canvi d’actor buida en el mateix pintat i descarta la resposta tardana de l’àmbit vell', async () => {
  const config = {};
  const loader = vi.fn().mockResolvedValueOnce({ id: 'A' });
  const { result, rerender } = pintaAmbEstats(loader, config);
  await waitFor(() => expect(result.current.payload).toEqual({ id: 'A' }));
  // Una revalidació de l'àmbit A en vol…
  let tardana;
  loader.mockImplementationOnce(() => new Promise(resolve => { tardana = resolve; }));
  act(() => result.current.refresh());
  await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  expect(result.current).toMatchObject({ status: 'ready', payload: { id: 'A' }, revalidant: true });
  // …i canvia l'actor: res de l'àmbit A es pot vore a partir d'ara.
  let nova;
  loader.mockImplementationOnce(() => new Promise(resolve => { nova = resolve; }));
  rerender({ actor: 'B' });
  expect(result.current).toMatchObject({ status: 'loading', payload: null, revalidant: false, errorRevalidacio: null });
  await waitFor(() => expect(loader).toHaveBeenCalledTimes(3));
  expect(loader.mock.calls[1][1].signal.aborted).toBe(true);
  expect(loader.mock.calls[2][0]).toBe('B');
  await act(async () => tardana({ id: 'A-tard' }));
  expect(result.current).toMatchObject({ status: 'loading', payload: null });
  await act(async () => nova({ id: 'B' }));
  expect(result.current).toMatchObject({ status: 'ready', payload: { id: 'B' }, revalidant: false });
});

test('Decisió 2 · una fallada tardana de l’àmbit vell tampoc no arriba al nou', async () => {
  const config = {};
  const loader = vi.fn().mockResolvedValueOnce({ id: 'A' });
  const { result, rerender } = pintaAmbEstats(loader, config);
  await waitFor(() => expect(result.current.payload).toEqual({ id: 'A' }));
  let falla;
  loader.mockImplementationOnce(() => new Promise((_, rebutja) => { falla = rebutja; }));
  m.generacio = 2;
  rerender({ actor: 'A' });
  await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  loader.mockResolvedValueOnce({ id: 'B' });
  rerender({ actor: 'B' });
  await waitFor(() => expect(result.current.payload).toEqual({ id: 'B' }));
  await act(async () => falla(new Error('Load failed')));
  expect(result.current).toMatchObject({ status: 'ready', payload: { id: 'B' }, error: null, errorRevalidacio: null });
});

/* Decisió 2 · Comportament segur triat per a una revalidació fallida: les
   dades bones són de la MATEIXA identitat i es conserven en 'ready'; l'error
   va a `errorRevalidacio`, sense tocar `status` ni `error`. La propera
   renovació o refresh ho torna a provar. */
test('Decisió 2 · si la revalidació falla, es conserva l’últim payload bo en ready i l’error va a banda', async () => {
  const config = {};
  const fallada = new Error('Load failed');
  const loader = vi.fn().mockResolvedValueOnce({ v: 1 }).mockRejectedValueOnce(fallada).mockResolvedValueOnce({ v: 3 });
  const { result, rerender, estats } = pintaAmbEstats(loader, config);
  await waitFor(() => expect(result.current.status).toBe('ready'));
  const desDeLlest = estats.length;
  m.generacio = 2;
  rerender({ actor: 'A' });
  await waitFor(() => expect(result.current.errorRevalidacio).toBe(fallada));
  expect(result.current).toMatchObject({ status: 'ready', payload: { v: 1 }, error: null, revalidant: false });
  act(() => result.current.refresh());
  await waitFor(() => expect(result.current.payload).toEqual({ v: 3 }));
  expect(result.current).toMatchObject({ status: 'ready', error: null, revalidant: false, errorRevalidacio: null });
  expect(estats.slice(desDeLlest)).toEqual(expect.not.arrayContaining(['loading', 'error']));
});

/* Llei del Píxel · Sense dades bones no hi ha res a conservar: el
   «Torna-ho a provar» d'un error continua passant per «Carregant». */
test('Decisió 2 · des d’un error, refresh torna a loading com sempre', async () => {
  const config = {};
  const loader = vi.fn().mockRejectedValueOnce(new Error('403'));
  const { result } = pintaAmbEstats(loader, config);
  await waitFor(() => expect(result.current.status).toBe('error'));
  let acaba;
  loader.mockImplementationOnce(() => new Promise(resolve => { acaba = resolve; }));
  act(() => result.current.refresh());
  expect(result.current).toMatchObject({ status: 'loading', payload: null, error: null, revalidant: false });
  await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  await act(async () => acaba({ v: 1 }));
  expect(result.current).toMatchObject({ status: 'ready', payload: { v: 1 } });
});

test('Decisió 2 · una renovació amb la primera càrrega en vol continua en loading i no pinta la resposta vella', async () => {
  const config = {};
  let primera;
  const loader = vi.fn().mockImplementationOnce(() => new Promise(resolve => { primera = resolve; }));
  const { result, rerender } = pintaAmbEstats(loader, config);
  await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
  let segona;
  loader.mockImplementationOnce(() => new Promise(resolve => { segona = resolve; }));
  m.generacio = 2;
  rerender({ actor: 'A' });
  expect(result.current).toMatchObject({ status: 'loading', payload: null, revalidant: false });
  await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  await act(async () => primera({ v: 'generació 1' }));
  expect(result.current).toMatchObject({ status: 'loading', payload: null });
  await act(async () => segona({ v: 'generació 2' }));
  expect(result.current).toMatchObject({ status: 'ready', payload: { v: 'generació 2' } });
});
