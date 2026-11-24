/* T47b (ordre del Mestre, 260928) · PENDENT FIXAT, no comportament desitjat.
   En mode incrustat, l'amfitrió sense refresh token torna a injectar la sessió
   abans de `exp` (host.js, injectaSessio → identitat.adoptaSessioExterna). Hui
   identitat.desaSessio compta cada injecció com una entrada nova, també la del
   mateix `sub`: el Bloc de Notes canvia de workspaceKey (l'editor es remunta) i
   un desat en curs torna AbortError encara que el PATCH haja arribat. La
   renovació que fa SdP amb el seu refresh token (`renovacio: true`) no ho fa.
   Quan identitat.js tracte la reinjecció del mateix `sub` com una renovació
   (cal ordre del Mestre), la segona prova s'ha de girar.
   identitat i storage reals; només la política, el port i els contextos es falsegen. */
import React from 'react';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { NotesDataProvider, useNotesData } from './NotesDataContext';
import { adoptaSessioExterna, desaSessio, esborraSessio, entradaSessio } from '../../data/identitat.js';

const EMISSOR = 'https://auth.example.test';
const A = '11111111-2222-4333-8444-555555555555';
const b64u = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const token = (sub, segons = 3600) => `${b64u({ alg: 'none' })}.${b64u({ sub, iss: EMISSOR, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + segons })}.c2ln`;

const mocks = vi.hoisted(() => ({
  policy: null,
  loadNotes: vi.fn(),
  updateNote: vi.fn(),
  getCurrentUser: vi.fn(),
  quanLlest: vi.fn(),
  getDraftsForScope: vi.fn(),
  repren: vi.fn(),
  generacio: 1
}));

vi.mock('../../config/runtimePolicy.js', () => ({ getRuntimePolicy: () => mocks.policy }));
vi.mock('../../data/backendPort.js', () => ({
  loadNotes: mocks.loadNotes,
  updateNote: mocks.updateNote,
  createNote: vi.fn(),
  mouNota: vi.fn(),
  esborraNota: vi.fn(),
  getCurrentUser: mocks.getCurrentUser,
  getDefaultUserId: () => 'usuari-seed',
  getRuntimeDataMode: () => 'remote'
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => ({ actorId: A, actorKey: `persona::${A}` })
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ generacio: mocks.generacio, currentUser: { id: A } })
}));
vi.mock('../../host.js', () => ({ quanLlest: mocks.quanLlest }));
vi.mock('./GlobalSaveManager.js', () => ({
  getDraftsForScope: mocks.getDraftsForScope,
  draftFields: draft => Object.fromEntries(Object.entries(draft).filter(([key]) => !key.startsWith('_'))),
  bgSaveManager: { repren: mocks.repren }
}));

afterEach(() => {
  cleanup();
  esborraSessio({ abast: 'tot' });
  window.sessionStorage.clear();
  window.localStorage.clear();
  mocks.policy = null;
});
beforeEach(() => {
  vi.resetAllMocks();
  mocks.generacio = 1;
  mocks.policy = { auth: { issuer: EMISSOR, audiences: ['authenticated'], persistencia: 'pestanya' } };
  mocks.getCurrentUser.mockReturnValue({ id: A });
  mocks.quanLlest.mockResolvedValue(undefined);
  mocks.getDraftsForScope.mockResolvedValue({});
  mocks.loadNotes.mockResolvedValue({ notes: [{ id: 'nota', revision: 1 }], noteFolders: [] });
});

// Una sola configuració: un objecte nou a cada render canviaria l'àmbit per si sol.
// L0 · backendConfig exigix un tenant_id UUID: abast sintètic, en minúscules.
const config = { tenantId: '00000000-0000-4000-8000-0000000000a1' };
const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;

async function blocAmbDesatEnCurs() {
  expect(adoptaSessioExterna({ access_token: token(A), user: { id: A } })).toBe(true);
  const vista = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(vista.result.current.status).toBe('ready'));
  let acaba;
  mocks.updateNote.mockImplementation(() => new Promise(resolve => { acaba = resolve; }));
  const desat = vista.result.current.updateNote('nota', { title: 'A' }, 1);
  return { ...vista, desat, acaba: (valor) => acaba(valor) };
}

test('la renovació pròpia del JWT (renovacio: true) no mou l’entrada ni avorta el desat', async () => {
  const { result, rerender, desat, acaba } = await blocAmbDesatEnCurs();
  const clau = result.current.workspaceKey;
  const entrada = entradaSessio();
  expect(desaSessio({ access_token: token(A, 7200), user: { id: A } }, { renovacio: true })).toBe(true);
  mocks.generacio++;
  rerender();
  expect(entradaSessio()).toBe(entrada);
  let desada;
  await act(async () => { acaba({ id: 'nota', title: 'A', revision: 2 }); desada = await desat; });
  expect(desada).toEqual({ id: 'nota', title: 'A', revision: 2 });
  expect(result.current.workspaceKey).toBe(clau);
});

/* R32.87 (Gemini Neon, LOT-2) · adoptaSessioExterna passa renovacio: true quan l'amfitrió torna a injectar el
   mateix `sub`: el que abans era PENDENT ara és el comportament vigent. */
test('R32.87 · la reinjecció de l’amfitrió del mateix `sub` ja no compta com a entrada nova: ni remunta el Bloc ni avorta el desat', async () => {
  const { result, rerender, desat, acaba } = await blocAmbDesatEnCurs();
  const clau = result.current.workspaceKey;
  const entrada = entradaSessio();
  // L'amfitrió torna a injectar la sessió del MATEIX compte abans de `exp`.
  expect(adoptaSessioExterna({ access_token: token(A, 7200), user: { id: A } })).toBe(true);
  mocks.generacio++;
  rerender();
  expect(entradaSessio()).toBe(entrada);
  let desada;
  await act(async () => { acaba({ id: 'nota', title: 'A', revision: 2 }); desada = await desat; });
  expect(desada).toEqual({ id: 'nota', title: 'A', revision: 2 });
  expect(result.current.workspaceKey).toBe(clau);
});
