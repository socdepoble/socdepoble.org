/* Onada R17 · AH-R17-11 / P0-88 (Sofía Bornay, Android) · La guarda
   d'hidratació (isHydrated) del Bloc amb sessió és de construcció, i ací es
   fixa perquè no es perda:
     · NotesDataProvider llig els esborranys d'IndexedDB (getDraftsForScope)
       ABANS de demanar cap nota, i cap nota arriba a la llista (ni a
       l'editor) sense el seu esborrany aplicat (applyDraft). Mentre la
       lectura no acaba, no hi ha cap nota on escriure.
     · resolveNote (una nota fora de la primera pàgina) tampoc l'afig abans
       de llegir els esborranys.
     · La cua (GlobalSaveManager.enqueue) escriu camp a camp dins del mateix
       llegir-modificar-escriure: una tecla en un camp (també només espais) no
       esborra el registre ni cap altre camp desat. Un text d'espais no és
       «buit»: es desa tal qual. */
import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const TENANT = '00000000-0000-4000-8000-0000000000a1';

const mocks = vi.hoisted(() => ({
  loadNotes: vi.fn(),
  getCurrentUser: vi.fn(),
  getDefaultUserId: vi.fn(),
  getRuntimeDataMode: vi.fn(),
  quanLlest: vi.fn(),
  getDraftsForScope: vi.fn(),
  repren: vi.fn()
}));

vi.mock('../../data/backendPort.js', () => ({
  loadNotes: mocks.loadNotes,
  createNote: vi.fn(),
  updateNote: vi.fn(),
  mouNota: vi.fn(),
  esborraNota: vi.fn(),
  getCurrentUser: mocks.getCurrentUser,
  getDefaultUserId: mocks.getDefaultUserId,
  getRuntimeDataMode: mocks.getRuntimeDataMode
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'user', actorKey: 'user' }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ generacio: 1, currentUser: { id: 'user' }, estat: 'dins' }) }));
vi.mock('../../host.js', () => ({ quanLlest: mocks.quanLlest }));
vi.mock('./GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: mocks.getDraftsForScope,
  bgSaveManager: { repren: mocks.repren }
}));
vi.mock('../../data/identitat.js', async importOriginal => ({ ...await importOriginal(), entradaSessio: () => 0 }));
import { NotesDataProvider, useNotesData } from './NotesDataContext';
import { GlobalSaveManager } from './GlobalSaveManager.js';

const wrapper = ({ children }) => <NotesDataProvider config={{ tenantId: TENANT }}>{children}</NotesDataProvider>;
const deixaCorrer = () => act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
/* Una lectura d'IndexedDB que deixem anar a mà, com en un Android lent. */
function lecturaLenta() {
  let acaba;
  mocks.getDraftsForScope.mockImplementation(() => new Promise((resolve) => { acaba = resolve; }));
  return (esborranys) => act(async () => { acaba(esborranys); });
}

afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getCurrentUser.mockReturnValue({ id: 'user' });
  mocks.getDefaultUserId.mockReturnValue('usuari-seed');
  mocks.getRuntimeDataMode.mockReturnValue('remote');
  mocks.quanLlest.mockResolvedValue(undefined);
  mocks.loadNotes.mockResolvedValue({
    notes: [{ id: 'n1', title: 'Remot', content: '<p>Remot</p>', revision: 1 }],
    noteFolders: [],
    notesComplete: true
  });
});

test('AH-R17-11 · mentre els esborranys no s’han llegit no es demana cap nota ni n’hi ha cap on escriure', async () => {
  const hidrata = lecturaLenta();
  const { result } = renderHook(useNotesData, { wrapper });
  await deixaCorrer();
  expect(mocks.getDraftsForScope).toHaveBeenCalledTimes(1);
  expect(mocks.loadNotes).not.toHaveBeenCalled();
  expect(result.current.status).toBe('loading');
  expect(result.current.notes).toEqual([]);

  await hidrata({ n1: { title: 'La meua recepta', _baseRevision: 1 } });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  // La primera vegada que la nota existix per a l'editor, ja porta l'esborrany.
  expect(result.current.notes).toEqual([{ id: 'n1', title: 'La meua recepta', content: '<p>Remot</p>', revision: 1 }]);
});

test('AH-R17-11 · resolveNote no afig la nota a la llista fins que els esborranys s’han llegit', async () => {
  mocks.getDraftsForScope.mockResolvedValue({});
  mocks.loadNotes.mockImplementation(async (_owner, cfg) => (cfg.noteId
    ? { notes: [{ id: 'n9', title: 'Remot', revision: 2 }], noteResolution: { id: 'n9', status: 'found' } }
    : { notes: [], noteFolders: [], notesComplete: true }));
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));

  const hidrata = lecturaLenta();
  let resolta;
  act(() => { resolta = result.current.resolveNote('n9'); });
  await deixaCorrer();
  expect(result.current.notes).toEqual([]);
  await hidrata({ n9: { title: 'Esborrany de n9', _baseRevision: 2 } });
  await act(async () => { await resolta; });
  expect(result.current.notes).toEqual([{ id: 'n9', title: 'Esborrany de n9', revision: 2 }]);
});

test('AH-R17-11 · la cua escriu camp a camp: uns espais al títol no esborren el registre ni el cos desat', async () => {
  const disc = new Map([['ambit:n1', { title: 'La meua recepta', content: '<p>Tomaca</p>', _operationVersion: 3, _fieldVersions: { title: 2, content: 3 }, _baseRevision: 1 }]]);
  const persist = async (clau, transforma) => {
    const registre = transforma(disc.get(clau) || {});
    if (registre == null) disc.delete(clau);
    else disc.set(clau, registre);
    return registre;
  };
  const gestor = new GlobalSaveManager({ persist, delay: 60_000, finestra: null, purga: async () => [], llegeix: async () => [] });
  void gestor.enqueue('ambit', 'n1', 'title', '   ', () => ({ revision: 1 }), vi.fn(), vi.fn(), vi.fn());
  // Espera que l'escriptura de la tecla passe pel disc (les escriptures d'una clau van en fila).
  await gestor.write('ambit:n1', (registre) => registre);
  gestor.cancelaCua('ambit:n1');
  expect(disc.get('ambit:n1')).toMatchObject({ title: '   ', content: '<p>Tomaca</p>', _baseRevision: 1 });
});
