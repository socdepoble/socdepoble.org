/* D-7 (pla 261101_1246; P1-71) · NotesDataProvider muntat FORA
   d'IdentitatProvider (una recàrrega en calent amb un context vell), amb una
   sessió de veres: no llança (sense ErrorBoundary: si llançara, la prova
   cauria) i el Bloc és el d'un visitant, llest i buit. Ni es llegixen notes
   ni esborranys de ningú, no es pot crear res i cada escriptura es refusa
   amb ErrorIdentitatDeLectura abans del port. IdentitatContext.jsx és el de
   veres. Dades sintètiques. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

const m = vi.hoisted(() => ({
  loadNotes: vi.fn(), createNote: vi.fn(), updateNote: vi.fn(), mouNota: vi.fn(), esborraNota: vi.fn(),
  getCurrentUser: vi.fn(), getDefaultUserId: vi.fn(), getRuntimeDataMode: vi.fn(),
  getDraftsForScope: vi.fn(), usuari: { id: 'persona-a' }
}));
vi.mock('../../data/backendPort.js', () => ({
  loadNotes: m.loadNotes, createNote: m.createNote, updateNote: m.updateNote, mouNota: m.mouNota, esborraNota: m.esborraNota,
  getCurrentUser: m.getCurrentUser, getDefaultUserId: m.getDefaultUserId, getRuntimeDataMode: m.getRuntimeDataMode
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ generacio: 1, currentUser: m.usuari, estat: 'dins' }) }));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('./GlobalSaveManager.js', () => ({
  getDraftsForScope: m.getDraftsForScope,
  draftFields: (draft) => Object.fromEntries(Object.entries(draft).filter(([clau]) => !clau.startsWith('_'))),
  bgSaveManager: { repren: vi.fn() }
}));
vi.mock('../../data/identitat.js', async (importOriginal) => ({ ...await importOriginal(), entradaSessio: () => 0 }));

import { NotesDataProvider, useNotesData } from './NotesDataContext.jsx';

const TENANT = '00000000-0000-4000-8000-0000000000a1';
const ERROR_DE_LECTURA = { name: 'ErrorIdentitatDeLectura', code: 'SDP-IDENTITAT-001' };

function muntaSenseIdentitat(config = { tenantId: TENANT }) {
  const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;
  return renderHook(useNotesData, { wrapper });
}

beforeEach(() => {
  vi.resetAllMocks();
  m.usuari = { id: 'persona-a' };
  m.getCurrentUser.mockReturnValue({ id: 'persona-a' });
  m.getDefaultUserId.mockReturnValue('usuari-de-la-llavor');
  m.getRuntimeDataMode.mockReturnValue('remote');
  m.getDraftsForScope.mockResolvedValue({ n9: { title: 'Esborrany de la persona A' } });
  m.loadNotes.mockResolvedValue({ notes: [{ id: 'n9', title: 'Nota de la persona A', revision: 1 }], noteFolders: [], notesComplete: true });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('sense IdentitatProvider i amb sessió', () => {
  test('llest i buit, sense poder crear: ni loadNotes ni getDraftsForScope, i cap error', async () => {
    const errors = vi.spyOn(console, 'error');
    const { result } = muntaSenseIdentitat();
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.notes).toEqual([]);
    expect(result.current.notesComplete).toBe(true);
    expect(result.current.canCreate).toBe(false);
    expect(result.current.nomesLectura).toBe(true);
    // L'àmbit dels esborranys no és el de la persona de la sessió.
    expect(result.current.scopeKey).toContain('nomes-lectura');
    expect(result.current.scopeKey).not.toContain('persona-a');
    expect(m.loadNotes).not.toHaveBeenCalled();
    expect(m.getDraftsForScope).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  });

  test('en mode «seed» tampoc no hi ha propietari: ni la llavor ni crear', async () => {
    m.getRuntimeDataMode.mockReturnValue('seed');
    m.getCurrentUser.mockReturnValue(null);
    m.usuari = null;
    const { result } = muntaSenseIdentitat({ tenantId: TENANT, dataMode: 'seed' });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.notes).toEqual([]);
    expect(result.current.canCreate).toBe(false);
    expect(m.loadNotes).not.toHaveBeenCalled();
  });

  test('crear, desar, moure i esborrar es refusen amb ErrorIdentitatDeLectura sense cridar el port', async () => {
    const { result } = muntaSenseIdentitat();
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await expect(result.current.creaNota({ title: 'Nova' })).rejects.toMatchObject(ERROR_DE_LECTURA);
    await expect(result.current.updateNote('n9', { title: 'Canvi' }, 1)).rejects.toMatchObject(ERROR_DE_LECTURA);
    await expect(result.current.mouNota('n9', 'paperera', 1)).rejects.toMatchObject(ERROR_DE_LECTURA);
    await expect(result.current.esborraNota('n9', 1)).rejects.toMatchObject(ERROR_DE_LECTURA);
    expect(m.createNote).not.toHaveBeenCalled();
    expect(m.updateNote).not.toHaveBeenCalled();
    expect(m.mouNota).not.toHaveBeenCalled();
    expect(m.esborraNota).not.toHaveBeenCalled();
  });

  test('resoldre una nota per id no la llig: not-found', async () => {
    const { result } = muntaSenseIdentitat();
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await expect(result.current.resolveNote('n9')).resolves.toEqual({ status: 'not-found' });
    expect(m.loadNotes).not.toHaveBeenCalled();
    expect(m.getDraftsForScope).not.toHaveBeenCalled();
  });
});
