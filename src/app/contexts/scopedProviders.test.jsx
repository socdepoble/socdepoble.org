import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ actor: 'A', user: 'A', gen: 1, load: vi.fn(), estatGlobal: vi.fn() }));
/* Pla 261029_1605 (Bloc G, P1-71) · Mur i Multimèdia lligen useIdentitat;
   CoreContentProvider, useIdentitatOpcional. Tots dos, el mateix m.actor. */
vi.mock('./IdentitatContext.jsx', () => ({
  useIdentitat: () => ({ actorId: m.actor, actorKey: m.actor }),
  useIdentitatOpcional: () => ({ actorId: m.actor, actorKey: m.actor })
}));
vi.mock('./SessionContext.jsx', () => ({ useSession: () => ({ generacio: m.gen, currentUser: { id: m.user } }) }));
vi.mock('../../data/backendPort.js', () => ({ loadMur: m.load, loadMultimedia: m.load, loadCoreContent: m.load, appendSectionSubmissionNetworkOnly: vi.fn() }));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
/* Decisió 2 del Mestre (261007) · CoreContentProvider empeny el seu estat a
   l'estat global de la interfície: ací només s'anota. */
vi.mock('./UIContext.jsx', () => ({ useUIActions: () => ({ setGlobalStatus: m.estatGlobal }) }));
import { MurProvider, useMur } from '../../sections/mur/MurContext.jsx';
import { MultimediaProvider, useMultimedia } from '../../sections/multimedia/MultimediaContext.jsx';
import { CoreContentProvider, useCoreContent } from './CoreContentContext.jsx';
/* Pobles sintètics: backendScope (backendConfig.js) exigix tenant_id UUID. */
const POBLE_A = '00000000-0000-4000-8000-00000000000a';
const POBLE_B = '00000000-0000-4000-8000-00000000000b';
afterEach(() => { cleanup(); m.load.mockReset(); m.estatGlobal.mockClear(); });
test.each([[MurProvider, useMur, 'feedPosts'], [MultimediaProvider, useMultimedia, 'mediaItems']])(
  '%s amaga dades immediatament amb actor, sessió i tenant nous', async (Provider, useData, field) => {
    m.actor = 'A'; m.user = 'A'; m.gen++;
    let config = { tenantId: POBLE_A };
    m.load.mockResolvedValueOnce({ [field]: [{ id: 'A-only' }] });
    const wrapper = ({ children }) => <Provider config={config}>{children}</Provider>;
    const { result, rerender, unmount } = renderHook(useData, { wrapper });
    await waitFor(() => expect(result.current[field]).toHaveLength(1));
    let finish;
    m.load.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    m.actor = 'shared'; m.user = 'B'; m.gen++; rerender();
    expect(result.current[field]).toEqual([]);
    await waitFor(() => expect(m.load).toHaveBeenCalledTimes(2));
    const old = finish; m.user = 'A'; m.gen++; config = { tenantId: POBLE_B }; rerender();
    expect(result.current[field]).toEqual([]);
    await act(async () => old({ [field]: [{ id: 'B-old' }] }));
    expect(result.current[field]).toEqual([]);
    await waitFor(() => expect(m.load).toHaveBeenCalledTimes(3));
    const signal = m.load.mock.calls[2][1].signal; unmount(); expect(signal.aborted).toBe(true);
  }
);

/* ── Decisió 2 del Mestre (261007) · «El Mur "Carregant": RENOVACIÓ
   SILENCIOSA» ── Els tres proveïdors posen a la clau d'àmbit l'AÏLLAMENT
   (backend, persona, actor) i no la generació: renovar el JWT, o un
   sdp:refresh-data, conserva les dades en 'ready' mentre es tornen a demanar,
   i el contingut no fa parpellejar l'estat global. */
const PROVEIDORS = [[CoreContentProvider, useCoreContent, 'towns'], [MurProvider, useMur, 'feedPosts'], [MultimediaProvider, useMultimedia, 'mediaItems']];

/** Pinta el proveïdor amb una primera càrrega i anota cada `status` que veu el consumidor. */
async function pintaLlest(Provider, useData, field) {
  m.actor = 'A'; m.user = 'A'; m.gen++;
  const config = { tenantId: POBLE_A };
  m.load.mockResolvedValueOnce({ [field]: [{ id: 'vell' }] });
  const estats = [];
  const wrapper = ({ children }) => <Provider config={config}>{children}</Provider>;
  const pintat = renderHook(() => {
    const dades = useData();
    estats.push(dades.status);
    return dades;
  }, { wrapper });
  await waitFor(() => expect(pintat.result.current[field]).toEqual([{ id: 'vell' }]));
  return { ...pintat, estats, desDeLlest: estats.length, globalsDesDeLlest: m.estatGlobal.mock.calls.length };
}

test.each(PROVEIDORS)('%s conserva les dades en renovar el JWT (mateixa persona i actor, generació nova)', async (Provider, useData, field) => {
  const { result, rerender, estats, desDeLlest, globalsDesDeLlest } = await pintaLlest(Provider, useData, field);
  let acaba;
  m.load.mockImplementationOnce(() => new Promise(resolve => { acaba = resolve; }));
  m.gen++; rerender();
  expect(result.current.status).toBe('ready');
  expect(result.current[field]).toEqual([{ id: 'vell' }]);
  await waitFor(() => expect(m.load).toHaveBeenCalledTimes(2));
  expect(result.current[field]).toEqual([{ id: 'vell' }]);
  await act(async () => acaba({ [field]: [{ id: 'nou' }] }));
  expect(result.current[field]).toEqual([{ id: 'nou' }]);
  expect(estats.slice(desDeLlest)).toEqual(expect.not.arrayContaining(['loading']));
  expect(m.estatGlobal.mock.calls.slice(globalsDesDeLlest).flat()).toEqual(expect.not.arrayContaining(['loading']));
});

test.each(PROVEIDORS)('%s conserva les dades amb sdp:refresh-data (recàrrega de l’amfitrió)', async (Provider, useData, field) => {
  const { result, estats, desDeLlest } = await pintaLlest(Provider, useData, field);
  let acaba;
  m.load.mockImplementationOnce(() => new Promise(resolve => { acaba = resolve; }));
  act(() => { window.dispatchEvent(new CustomEvent('sdp:refresh-data')); });
  expect(result.current.status).toBe('ready');
  expect(result.current[field]).toEqual([{ id: 'vell' }]);
  await waitFor(() => expect(m.load).toHaveBeenCalledTimes(2));
  await act(async () => acaba({ [field]: [{ id: 'nou' }] }));
  expect(result.current[field]).toEqual([{ id: 'nou' }]);
  expect(estats.slice(desDeLlest)).toEqual(expect.not.arrayContaining(['loading']));
});

test.each(PROVEIDORS)('%s continua buidant en el mateix pintat si canvia l’actor', async (Provider, useData, field) => {
  const { result, rerender } = await pintaLlest(Provider, useData, field);
  m.load.mockImplementationOnce(() => new Promise(() => {}));
  m.actor = 'B'; rerender();
  expect(result.current.status).toBe('loading');
  expect(result.current[field]).toEqual([]);
});

/* Decisió 2 · Sense `generacio` a la clau, l'únic que buida per un canvi de
   persona és la persona (`currentUser.id`) a la clau d'AÏLLAMENT. El primer
   pintat d'un canvi A→B amb una entitat compartida porta el mateix actorKey
   (IdentitatContext va un pintat endarrere): esta prova el fixa, i també que
   la revalidació de la persona anterior que encara és en vol no arriba mai a
   la nova. */
test.each(PROVEIDORS)('%s buida en el mateix pintat si canvia la persona amb el mateix actor', async (Provider, useData, field) => {
  const { result, rerender } = await pintaLlest(Provider, useData, field);
  let tardana;
  m.load.mockImplementationOnce(() => new Promise(resolve => { tardana = resolve; }));
  act(() => { window.dispatchEvent(new CustomEvent('sdp:refresh-data')); });
  await waitFor(() => expect(m.load).toHaveBeenCalledTimes(2));
  m.load.mockImplementationOnce(() => new Promise(() => {}));
  m.user = 'B'; m.gen++; rerender();
  expect(result.current.status).toBe('loading');
  expect(result.current[field]).toEqual([]);
  await act(async () => tardana({ [field]: [{ id: 'A-tard' }] }));
  expect(result.current.status).toBe('loading');
  expect(result.current[field]).toEqual([]);
});

/* Decisió 2 · Una revalidació que falla conserva el contingut en 'ready' i
   deixa l'error a banda (`errorRevalidacio`), que el contingut core i la
   Multimèdia exposen. El Mur l'exposarà amb la peça de paginació. */
test.each([PROVEIDORS[0], PROVEIDORS[2]])('%s conserva les dades si la revalidació falla i exposa l’error a banda', async (Provider, useData, field) => {
  const { result, estats, desDeLlest } = await pintaLlest(Provider, useData, field);
  const fallada = new Error('Load failed');
  m.load.mockRejectedValueOnce(fallada);
  act(() => { window.dispatchEvent(new CustomEvent('sdp:refresh-data')); });
  await waitFor(() => expect(result.current.errorRevalidacio).toBe(fallada));
  expect(result.current).toMatchObject({ status: 'ready', error: null, [field]: [{ id: 'vell' }] });
  m.load.mockResolvedValueOnce({ [field]: [{ id: 'nou' }] });
  act(() => { window.dispatchEvent(new CustomEvent('sdp:refresh-data')); });
  await waitFor(() => expect(result.current[field]).toEqual([{ id: 'nou' }]));
  expect(result.current.errorRevalidacio).toBeNull();
  expect(estats.slice(desDeLlest)).toEqual(expect.not.arrayContaining(['loading', 'error']));
});

/* Decisió 2 i T7/T9 (estatConnexio.js) · La franja del node i el pilot del
   Perfil llegixen l'estat global, «l'última càrrega del contingut core», i
   «en el dubte, mai verd». Una revalidació fallida diu 'error' («Sense
   connexió») com abans, però el contingut no es buida; mentre la següent és
   en vol no torna a verd, i torna a 'ready' quan acaba bé. */
test('CoreContentProvider diu «error» a l’estat global si la revalidació falla, sense buidar el contingut', async () => {
  const { result, globalsDesDeLlest } = await pintaLlest(CoreContentProvider, useCoreContent, 'towns');
  await waitFor(() => expect(m.estatGlobal).toHaveBeenLastCalledWith('ready'));
  m.load.mockRejectedValueOnce(new Error('Load failed'));
  act(() => { window.dispatchEvent(new CustomEvent('sdp:refresh-data')); });
  await waitFor(() => expect(m.estatGlobal).toHaveBeenLastCalledWith('error'));
  expect(result.current).toMatchObject({ status: 'ready', towns: [{ id: 'vell' }] });
  let acaba;
  m.load.mockImplementationOnce(() => new Promise(resolve => { acaba = resolve; }));
  act(() => { window.dispatchEvent(new CustomEvent('sdp:refresh-data')); });
  await waitFor(() => expect(m.load).toHaveBeenCalledTimes(3));
  expect(m.estatGlobal).toHaveBeenLastCalledWith('error');
  expect(result.current.towns).toEqual([{ id: 'vell' }]);
  await act(async () => acaba({ towns: [{ id: 'nou' }] }));
  expect(result.current.towns).toEqual([{ id: 'nou' }]);
  expect(m.estatGlobal).toHaveBeenLastCalledWith('ready');
  expect(m.estatGlobal.mock.calls.slice(globalsDesDeLlest).flat()).toEqual(expect.not.arrayContaining(['loading']));
});
