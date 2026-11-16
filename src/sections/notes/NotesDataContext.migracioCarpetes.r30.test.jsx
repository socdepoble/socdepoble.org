/* Onada R30 · PF-01 · L'inici de sessió del Bloc (NotesDataProvider) llança la migració
   de les carpetes que només són al navegador: amb sessió real, una vegada, pel port i
   sense esperar-la. Una xarxa que falla no talla la càrrega, no avisa i no toca la
   carpeta local; sense sessió no hi ha cap crida.
   Onada R30 · PF-01 (àrbitre, P3) · El mòdul porta un espia que delega en el de veres: es veu
   si el disparador hi arriba. Amb una persona dins però en mode del navegador (seed, o el port
   en local), hi arriba i el mòdul es nega a pujar res; sense persona, el propietari per defecte
   del mode seed no el dispara. */
import React from 'react';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { backendScope } from '../../config/backendConfig.js';
import { STORAGE_PREFIX } from '../../config/storage.js';
import { NotesDataProvider, useNotesData } from './NotesDataContext';
import { CLAU_CARPETES_CREADES, _reiniciaCarpetesCreades, desaCarpetaCreada } from '../../components/universal/classificacio/carpetesCreades.js';
import { _reiniciaMigracioCarpetes, migraCarpetesLocals, repliquesDeCarpetes } from '../../components/universal/classificacio/migracioCarpetesLocals.js';

const TENANT = '00000000-0000-4000-8000-0000000000a1';
const CARPETA = 'f-0f0e0d0c-0b0a-4908-8706-050403020100';

const mocks = vi.hoisted(() => ({
  loadNotes: vi.fn(),
  creaCarpetaNotes: vi.fn(),
  getCurrentUser: vi.fn(),
  getDefaultUserId: vi.fn(),
  getRuntimeDataMode: vi.fn(),
  quanLlest: vi.fn(),
  getDraftsForScope: vi.fn(),
  showToast: vi.fn(),
  migraReal: null,
  usuari: { id: 'user' },
  estat: 'dins'
}));

vi.mock('../../components/universal/classificacio/migracioCarpetesLocals.js', async (importOriginal) => {
  const real = await importOriginal();
  mocks.migraReal = real.migraCarpetesLocals;
  return { ...real, migraCarpetesLocals: vi.fn(real.migraCarpetesLocals) };
});

vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => cap === 'carpetesNotes',
  loadNotes: mocks.loadNotes,
  creaCarpetaNotes: mocks.creaCarpetaNotes,
  createNote: vi.fn(), updateNote: vi.fn(), mouNota: vi.fn(), esborraNota: vi.fn(),
  getCurrentUser: mocks.getCurrentUser,
  getDefaultUserId: mocks.getDefaultUserId,
  getRuntimeDataMode: mocks.getRuntimeDataMode
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => ({ actorId: 'user', actorKey: 'user' })
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ generacio: 1, currentUser: mocks.usuari, estat: mocks.estat })
}));
vi.mock('../../host.js', () => ({ quanLlest: mocks.quanLlest }));
vi.mock('./GlobalSaveManager.js', () => ({
  getDraftsForScope: mocks.getDraftsForScope,
  draftFields: (draft) => Object.fromEntries(Object.entries(draft).filter(([key]) => !key.startsWith('_'))),
  bgSaveManager: { repren: vi.fn() }
}));

const CONFIG = Object.freeze({ tenantId: TENANT });
const AMBIT = `${backendScope(CONFIG)}_user_user_${TENANT}`;
const CLAU_LOCAL = STORAGE_PREFIX + CLAU_CARPETES_CREADES;
const wrapper = ({ children }) => <NotesDataProvider config={CONFIG}>{children}</NotesDataProvider>;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(migraCarpetesLocals).mockImplementation(mocks.migraReal);
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
  mocks.usuari = { id: 'user' };
  mocks.estat = 'dins';
  mocks.getCurrentUser.mockReturnValue({ id: 'user' });
  mocks.getDefaultUserId.mockReturnValue('usuari-seed');
  mocks.getRuntimeDataMode.mockReturnValue('remote');
  mocks.quanLlest.mockResolvedValue(undefined);
  mocks.getDraftsForScope.mockResolvedValue({});
  mocks.loadNotes.mockResolvedValue({ notes: [{ id: 'n-1', folderId: 'f-festes', revision: 1 }], noteFolders: [] });
  desaCarpetaCreada(AMBIT, { id: 'f-festes', nom: 'Festes' });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
});

test('amb sessió real, l’inici puja la carpeta pel port i n’apunta la rèplica', async () => {
  mocks.creaCarpetaNotes.mockResolvedValue({ id: CARPETA, nom: 'Festes', parentId: null });
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await waitFor(() => expect(repliquesDeCarpetes(AMBIT)).toEqual([{ local: 'f-festes', remot: CARPETA }]));
  expect(mocks.creaCarpetaNotes).toHaveBeenCalledTimes(1);
  expect(mocks.creaCarpetaNotes).toHaveBeenCalledWith({ nom: 'Festes' }, CONFIG);
  expect(JSON.parse(localStorage.getItem(CLAU_LOCAL)).ambits[AMBIT]).toEqual([{ id: 'f-festes', nom: 'Festes' }]);
});

test('un error de xarxa no talla la càrrega, no avisa i conserva la carpeta local', async () => {
  const abans = localStorage.getItem(CLAU_LOCAL);
  const consola = vi.spyOn(console, 'error');
  mocks.creaCarpetaNotes.mockRejectedValue(new TypeError('Failed to fetch'));
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await waitFor(() => expect(mocks.creaCarpetaNotes).toHaveBeenCalledTimes(1));
  await new Promise((resol) => setTimeout(resol, 0));
  expect(result.current.status).toBe('ready');
  expect(result.current.error).toBeNull();
  expect(result.current.notes.map((n) => n.id)).toEqual(['n-1']);
  expect(mocks.showToast).not.toHaveBeenCalled();
  expect(consola).not.toHaveBeenCalled();
  expect(repliquesDeCarpetes(AMBIT)).toEqual([]);
  expect(localStorage.getItem(CLAU_LOCAL)).toBe(abans);
  consola.mockRestore();
});

test('sense sessió no hi ha cap crida', async () => {
  mocks.usuari = null;
  mocks.estat = 'fora';
  mocks.getCurrentUser.mockReturnValue(null);
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await new Promise((resol) => setTimeout(resol, 0));
  expect(migraCarpetesLocals).not.toHaveBeenCalled();
  expect(mocks.creaCarpetaNotes).not.toHaveBeenCalled();
  expect(mocks.loadNotes).not.toHaveBeenCalled();
});

/* La crida del disparador i el que n'ha respost el mòdul de veres. */
async function respostaDelModul() {
  await waitFor(() => expect(migraCarpetesLocals).toHaveBeenCalledTimes(1));
  return migraCarpetesLocals.mock.results[0].value;
}

test('amb una persona dins però en mode seed, el disparador arriba al mòdul i el mòdul no puja res', async () => {
  const seed = Object.freeze({ tenantId: TENANT, dataMode: 'seed' });
  const ambitSeed = `${backendScope(seed)}_user_user_${TENANT}`;
  desaCarpetaCreada(ambitSeed, { id: 'f-festes', nom: 'Festes' });
  const abans = localStorage.getItem(CLAU_LOCAL);
  mocks.getRuntimeDataMode.mockReturnValue('seed');
  mocks.creaCarpetaNotes.mockResolvedValue({ id: CARPETA, nom: 'Festes', parentId: null });
  const { result } = renderHook(useNotesData, { wrapper: ({ children }) => <NotesDataProvider config={seed}>{children}</NotesDataProvider> });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await expect(respostaDelModul()).resolves.toMatchObject({ estat: 'omes', motiu: 'sense-sessio' });
  expect(migraCarpetesLocals.mock.calls[0][0]).toMatchObject({ scopeKey: ambitSeed, config: seed });
  expect(migraCarpetesLocals.mock.calls[0][1]).toBe('user');
  expect(mocks.creaCarpetaNotes).not.toHaveBeenCalled();
  expect(repliquesDeCarpetes(ambitSeed)).toEqual([]);
  expect(localStorage.getItem(CLAU_LOCAL)).toBe(abans);
});

test('amb una persona dins però amb el port en mode local, el mòdul hi arriba i no troba cap servidor on escriure', async () => {
  mocks.getRuntimeDataMode.mockReturnValue('local');
  mocks.creaCarpetaNotes.mockResolvedValue({ id: CARPETA, nom: 'Festes', parentId: null });
  const abans = localStorage.getItem(CLAU_LOCAL);
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await expect(respostaDelModul()).resolves.toMatchObject({ estat: 'omes', motiu: 'sense-capacitat' });
  expect(migraCarpetesLocals.mock.calls[0][0]).toMatchObject({ scopeKey: AMBIT });
  expect(migraCarpetesLocals.mock.calls[0][1]).toBe('user');
  expect(mocks.creaCarpetaNotes).not.toHaveBeenCalled();
  expect(repliquesDeCarpetes(AMBIT)).toEqual([]);
  expect(localStorage.getItem(CLAU_LOCAL)).toBe(abans);
});

test('sense persona, el propietari per defecte del mode seed carrega el Bloc però no dispara la migració', async () => {
  mocks.usuari = null;
  mocks.estat = 'fora';
  mocks.getCurrentUser.mockReturnValue(null);
  mocks.getRuntimeDataMode.mockReturnValue('seed');
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(mocks.loadNotes).toHaveBeenCalled());
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(mocks.loadNotes.mock.calls[0][0]).toBe('usuari-seed');
  await new Promise((resol) => setTimeout(resol, 0));
  expect(migraCarpetesLocals).not.toHaveBeenCalled();
  expect(mocks.creaCarpetaNotes).not.toHaveBeenCalled();
});
