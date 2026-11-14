/* Auditoria del kit de Gemini R22 (kit_gemini_auditor) · L'arxiu de converses
   del kit (arxivaFil, en memòria per àmbit, D-B8C-4). Guardes de privadesa
   executades amb el proveïdor real: res de l'arxiu va al disc del navegador;
   una altra persona (encara que siga membre del mateix fil) no hereta l'arxiu
   d'A; canviar d'actor (persona → entitat) l'oblida. */
import { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { XatProvider, useXat } from './XatContext.jsx';

const mock = vi.hoisted(() => ({
  session: null, showToast: vi.fn(), recuperable: true, actorKey: 'persona::A',
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(), teCapacitat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: undefined }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: '/xat' }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...await importOriginal(),
  loadFils: mock.loadFils, loadMissatges: mock.loadMissatges, enviaMissatge: mock.enviaMissatge, marcaLlegit: mock.marcaLlegit,
  subscribeToXat: mock.subscribeToXat, unsubscribeFromXat: mock.unsubscribeFromXat, teCapacitat: mock.teCapacitat
}));
vi.mock('../../data/identitat.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, sessioRecuperable: () => mock.recuperable };
});
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));


const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a', backendUrl: 'https://exemple.supabase.co' };
const fil = () => ({ id: 'fil-A', titol: 'Pepa', tipus: 'directe', altresNoms: [], ultimSeq: 1, llegitFinsSeq: 1, llegitPelsAltresFinsSeq: 0, noLlegits: 0, ultimAutorId: 'X', ultimAl: '2026-11-13T10:00:00Z' });
let value;
function Sonda() { const actual = useXat(); useLayoutEffect(() => { value = actual; }); value = actual; return null; }
const arbre = () => <StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>;
const arxivat = () => value.chatThreads.find((f) => f.id === 'fil-A')?.arxivat === true;

beforeEach(() => {
  vi.clearAllMocks();
  mock.recuperable = true;
  mock.actorKey = 'persona::A';
  mock.session = { currentUser: { id: 'A' }, generacio: 1, estat: 'dins' };
  mock.loadFils.mockResolvedValue([fil()]);
  mock.loadMissatges.mockResolvedValue([]);
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

async function arxivaElFil() {
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(value.potArxivarFil('fil-A')).toBe(true);
  let r;
  await act(async () => { r = await value.arxivaFil('fil-A', true); });
  expect(r).toEqual({ estat: 'local', arxivat: true });
  expect(arxivat()).toBe(true);
}

it('arxivar no escriu res al disc del navegador (ni localStorage ni sessionStorage)', async () => {
  const escrites = [];
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (clau, valor) { escrites.push(`${clau}=${valor}`); });
  render(arbre());
  await arxivaElFil();
  expect(escrites.filter((e) => e.includes('fil-A'))).toEqual([]);
});

it('una altra persona a la mateixa pestanya, membre del mateix fil, no hereta l’arxiu d’A', async () => {
  const vista = render(arbre());
  await arxivaElFil();
  mock.session = { currentUser: { id: 'B' }, generacio: 2, estat: 'dins' };
  mock.actorKey = 'persona::B';
  await act(async () => { vista.rerender(arbre()); });
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(value.chatThreads.some((f) => f.id === 'fil-A')).toBe(true);
  expect(arxivat()).toBe(false);
});

it('canviar d’actor (actuar com a entitat) oblida l’arxiu en memòria', async () => {
  const vista = render(arbre());
  await arxivaElFil();
  mock.actorKey = 'entitat::org-1';
  await act(async () => { vista.rerender(arbre()); });
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(arxivat()).toBe(false);
});
