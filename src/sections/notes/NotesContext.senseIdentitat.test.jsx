import { beforeEach as abansDePublicar } from 'vitest';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
abansDePublicar(() => { globalThis.indexedDB = creaIdbFalsEstructurat(); });
/* D-7 (pla 261101_1246; P1-71) · NotesProvider amb el proveïdor de dades de
   només lectura (NotesDataContext sense IdentitatProvider: nomesLectura) i
   sense IdentitatProvider: no llança, i res del que escriu arriba a la cua de
   desat (IndexedDB), al Mur ni al port. Ni desar un camp, ni la capa local que
   semblaria desada, ni publicar, moure, esborrar o resoldre un conflicte.
   Amb nomesLectura fals, desar sí que encua (la prova mossega). La
   identitat (IdentitatContext.jsx) és la de veres. Dades sintètiques. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';

const m = vi.hoisted(() => ({
  nomesLectura: true, enqueue: vi.fn(), runExclusive: vi.fn(), oblida: vi.fn(), clearDraft: vi.fn(),
  envia: vi.fn(), promou: vi.fn(), updateNote: vi.fn(), mouNota: vi.fn(), esborraNota: vi.fn()
}));
const NOTA = Object.freeze({ id: 'n9', title: 'Nota de la persona A', revision: 1 });
const LLISTA = Object.freeze([NOTA]);
const CAP = Object.freeze([]);
vi.mock('./NotesDataContext', () => ({
  useNotesData: () => ({
    notes: LLISTA, noteFolders: CAP, status: 'ready', error: null, scopeKey: 'escopi', workspaceKey: 'espai',
    notesComplete: true, config: { dataMode: 'remote' }, canCreate: false, nomesLectura: m.nomesLectura,
    creaNota: vi.fn(), updateNote: m.updateNote, confirmaPublicacioNota: vi.fn(), mouNota: m.mouNota, esborraNota: m.esborraNota,
    resolveNote: vi.fn(), refresh: vi.fn()
  })
}));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: m.envia, feedPosts: CAP }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ normalizeSearchText: (s) => s, t: (_clau, reserva) => reserva })
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ generacio: 1, currentUser: { id: 'persona-a' }, estat: 'dins' }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../data/backendPort.js', () => ({ promoteToPublic: m.promou, teCapacitat: () => true }));
vi.mock('./GlobalSaveManager.js', () => ({
  bgSaveManager: {
    enqueue: m.enqueue, runExclusive: m.runExclusive, oblida: m.oblida, clearDraft: m.clearDraft,
    getExpectedRevision: () => 1, estat: () => null, serial: vi.fn(), retira: vi.fn(), rebaseDraft: vi.fn()
  }
}));

import { NotesProvider, useNotes } from './NotesContext.jsx';

const munta = () => renderHook(useNotes, { wrapper: ({ children }) => <NotesProvider>{children}</NotesProvider> });

beforeEach(() => {
  vi.clearAllMocks();
  m.nomesLectura = true;
  m.enqueue.mockResolvedValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('amb el Bloc de només lectura i sense IdentitatProvider', () => {
  test('no llança i porta la marca nomesLectura, sense cap error a la consola', () => {
    const errors = vi.spyOn(console, 'error');
    const { result } = munta();
    expect(result.current.nomesLectura).toBe(true);
    expect(result.current.notes.map((nota) => nota.id)).toEqual(['n9']);
    expect(errors).not.toHaveBeenCalled();
  });

  test('desar un camp resol fals i no encua res; la capa local no canvia la nota', async () => {
    const { result } = munta();
    await expect(result.current.saveNoteField('n9', 'title', 'Canvi')).resolves.toBe(false);
    await expect(result.current.desaNotaPreparada({ id: 'n9', revision: 1 }, { title: 'Canvi' }))
      .rejects.toMatchObject({ name: 'ErrorIdentitatDeLectura', code: 'SDP-IDENTITAT-001' });
    act(() => { result.current.setLocalNoteField('n9', 'title', 'Canvi'); });
    expect(result.current.notes[0].title).toBe(NOTA.title);
    expect(m.enqueue).not.toHaveBeenCalled();
    expect(m.updateNote).not.toHaveBeenCalled();
  });

  test('publicar es refusa amb ErrorIdentitatDeLectura: cap imatge pública, cap Mur, cap cua', async () => {
    const { result } = munta();
    await expect(result.current.publishNote({ ...NOTA, coverImage: 'sdp-media://foto' }))
      .rejects.toMatchObject({ name: 'ErrorIdentitatDeLectura', code: 'SDP-IDENTITAT-001' });
    expect(m.runExclusive).not.toHaveBeenCalled();
    expect(m.promou).not.toHaveBeenCalled();
    expect(m.envia).not.toHaveBeenCalled();
    expect(m.enqueue).not.toHaveBeenCalled();
  });

  test('moure, esborrar i resoldre un conflicte tornen fals sense tocar la cua ni el port', async () => {
    const { result } = munta();
    await expect(result.current.mouNota(NOTA, 'paperera')).resolves.toBe(false);
    await expect(result.current.esborraNota(NOTA)).resolves.toBe(false);
    await expect(result.current.resolConflicteEsborrany({ ...NOTA, draftConflict: { baseRevision: 0, remoteRevision: 1 } }, 'remot')).resolves.toBe(false);
    expect(m.runExclusive).not.toHaveBeenCalled();
    expect(m.oblida).not.toHaveBeenCalled();
    expect(m.clearDraft).not.toHaveBeenCalled();
    expect(m.mouNota).not.toHaveBeenCalled();
    expect(m.esborraNota).not.toHaveBeenCalled();
  });
});

test('sanitat: sense la marca, desar sí que encua (la prova mossega)', async () => {
  m.nomesLectura = false;
  const { result } = munta();
  await result.current.saveNoteField('n9', 'title', 'Canvi');
  expect(m.enqueue).toHaveBeenCalledTimes(1);
});
