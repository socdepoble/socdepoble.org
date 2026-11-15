/* Onada R29 · R29-E2EE-01 · Les converses locals amb la IAIA (IAIALocalProvider:
   el fil «iaia-local» i cada sessió «iaia-local-…») no entren a la còpia
   `.sdpbackup`: no són cap fil del servidor i les preguntes no ixen d'este
   navegador. Es munta l'IAIAProvider de veres en mode remot, com sota
   XatWorkspace, i es mira el que contingutDeLaCopia faria amb el chatThreads
   de useXat(), que és el que llig la pàgina de la còpia. */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { XatContext, useXat } from './XatContext.jsx';
import IAIAProvider from './IAIAProvider.jsx';
import { contingutDeLaCopia, filEntraALaCopia } from './copiaSeguretatXat.js';
import { ID_FIL_LOCAL_IAIA } from './useObriXatPerDefecte.js';
import { creaCanalFals, creaIdbFals } from '../../utils/__fixtures__/navegadorFals.js';

const api = vi.hoisted(() => ({ pendent: null }));
vi.mock('../../data/backendPort.js', async (original) => ({ ...await original(), teCapacitat: () => false, consultaIAIA: vi.fn() }));
vi.mock('../../data/iaiaLocal.js', () => ({ respostaDeLaIAIA: () => api.pendent ?? 'Resposta documental local' }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); api.pendent = null; });

const FIL_DEL_SERVIDOR = Object.freeze({
  id: '20000000-0000-4000-8000-000000000002', tipus: 'directe', title: 'Pepa', altresNoms: ['Pepa'], participant: true
});
const base = (chatThreads = []) => ({
  modeDades: 'remote', joId: '10000000-0000-4000-8000-000000000001', ambitEstable: 'poble:usuari-a', senseSessio: false,
  chatThreads, getThreadMessages: () => [], sendChatMessage: vi.fn(), obriFil: vi.fn(), marcaVist: vi.fn(),
  marcaLlegides: vi.fn().mockResolvedValue([]), filCarregat: () => true
});
const munta = (original) => renderHook(useXat, {
  wrapper: ({ children }) => <XatContext.Provider value={original}><IAIAProvider t={(_clau, reserva) => reserva}>{children}</IAIAProvider></XatContext.Provider>
});

test('sense cap conversa del servidor, la còpia queda buida: el fil «iaia-local» no hi compta', () => {
  const { result } = munta(base([]));
  /* El fil local hi és, a la llista del xat… */
  expect(result.current.chatThreads.map((f) => f.id)).toContain(ID_FIL_LOCAL_IAIA);
  /* …però no a la còpia (abans: fils = ['iaia-local'] i «Converses: 1»). */
  const contingut = contingutDeLaCopia({ chatThreads: result.current.chatThreads, getThreadMessages: result.current.getThreadMessages });
  expect(contingut.fils).toEqual([]);
  expect(contingut.missatges).toEqual([]);
});

test('una sessió local amb una pregunta: ni el seu títol ni la pregunta (un PIN, un telèfon) entren a la còpia', async () => {
  const fals = creaIdbFals();
  const canals = creaCanalFals();
  vi.stubGlobal('indexedDB', fals.idb);
  vi.stubGlobal('BroadcastChannel', canals.Canal);
  api.pendent = new Promise(() => {});
  const { result } = munta(base([FIL_DEL_SERVIDOR]));
  let id;
  act(() => { id = result.current.novaSessioIAIA(); });
  const sessio = result.current.chatThreads.find((f) => f.id === id);
  expect(sessio).toMatchObject({ filLocalIAIA: true, sessioLocalIAIA: true });
  await act(async () => { await result.current.sendChatMessage(sessio, 'El meu PIN és 4321 i el telèfon 600 11 22 33, què en faig?'); });
  await waitFor(() => expect(result.current.chatThreads.find((f) => f.id === id)?.ultimText).toContain('4321'));

  const fils = result.current.chatThreads;
  expect(fils.filter((f) => f.filLocalIAIA).map((f) => filEntraALaCopia(f))).toEqual(fils.filter((f) => f.filLocalIAIA).map(() => false));
  const contingut = contingutDeLaCopia({ chatThreads: fils, getThreadMessages: result.current.getThreadMessages });
  expect(contingut.fils.map((f) => f.id)).toEqual([FIL_DEL_SERVIDOR.id]);
  const text = JSON.stringify(contingut);
  for (const rastre of ['4321', '600 11 22 33', 'PIN', ID_FIL_LOCAL_IAIA]) expect([rastre, text.includes(rastre)]).toEqual([rastre, false]);
});
