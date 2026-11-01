/* D-7 (pla 261101_1246; P1-71) · El cas real: els proveïdors de l'arrel, en
   l'ordre d'App.jsx (AppContent), muntats FORA d'IdentitatProvider, com els
   deixa una recàrrega en calent amb un context vell, i amb una sessió oberta.
   Abans, MurProvider, NotesDataProvider, NotesProvider i XatProvider
   cridaven useIdentitat() i el pet tombava el Mas sencer a l'ErrorBoundary
   de l'arrel (MultimediaContext.jsx, capçalera de P1-71). Ara tot l'arbre es
   pinta (sense cap ErrorBoundary: si llançara, la prova cauria), es llig com
   un visitant i cap escriptura arriba al port. Proveïdors i IdentitatContext
   de veres; el port, la sessió i la interfície, simulats. Dades sintètiques. */
import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

const m = vi.hoisted(() => ({
  loadCoreContent: vi.fn(), loadMur: vi.fn(), loadMultimedia: vi.fn(), loadNotes: vi.fn(), createNote: vi.fn(),
  updateNote: vi.fn(), appendSectionSubmissionNetworkOnly: vi.fn(), loadFils: vi.fn(), enviaMissatge: vi.fn(),
  creaFilDirecte: vi.fn(), subscribeToXat: vi.fn(), getDraftsForScope: vi.fn()
}));
vi.mock('../../data/backendPort.js', () => ({
  loadCoreContent: m.loadCoreContent, loadMur: m.loadMur, loadMultimedia: m.loadMultimedia, loadSeccioPage: vi.fn(),
  loadNotes: m.loadNotes, createNote: m.createNote, updateNote: m.updateNote, mouNota: vi.fn(), esborraNota: vi.fn(),
  appendSectionSubmissionNetworkOnly: m.appendSectionSubmissionNetworkOnly, promoteToPublic: vi.fn(),
  getCurrentUser: () => ({ id: 'persona-a' }), getDefaultUserId: () => 'usuari-de-la-llavor', getRuntimeDataMode: () => 'remote',
  teCapacitat: () => false, loadFils: m.loadFils, loadMissatges: vi.fn(async () => []), enviaMissatge: m.enviaMissatge,
  marcaLlegit: vi.fn(), creaFilDirecte: m.creaFilDirecte, carregaMembres: vi.fn(async () => []),
  subscribeToXat: m.subscribeToXat, unsubscribeFromXat: vi.fn(async () => null), obriFilDePagina: vi.fn()
}));
vi.mock('./SessionContext.jsx', () => ({ useSession: () => ({ generacio: 1, currentUser: { id: 'persona-a' }, estat: 'dins' }) }));
vi.mock('./UIContext.jsx', () => ({
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ setGlobalStatus: () => {}, normalizeSearchText: (s) => s, t: (_clau, reserva) => reserva })
}));
vi.mock('./RouterContext.jsx', () => ({ useLocation: () => ({ pathname: '/notes' }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../../sections/notes/GlobalSaveManager.js', () => ({
  getDraftsForScope: m.getDraftsForScope, draftFields: () => ({}), bgSaveManager: { repren: vi.fn() }
}));
vi.mock('../../data/identitat.js', async (importOriginal) => ({ ...await importOriginal(), entradaSessio: () => 0 }));

import { CoreContentProvider, useCoreContent } from './CoreContentContext.jsx';
import { useIdentitatOpcional } from './IdentitatContext.jsx';
import { MurProvider, useMur } from '../../sections/mur/MurContext.jsx';
import { NotesDataProvider, useNotesData } from '../../sections/notes/NotesDataContext.jsx';
import { NotesProvider, useNotes } from '../../sections/notes/NotesContext.jsx';
import { XatProvider, useXat } from '../../sections/xat/XatContext.jsx';
import { MultimediaProvider, useMultimedia } from '../../sections/multimedia/MultimediaContext.jsx';

const CONFIG = Object.freeze({ backendId: 'supabase', tenantId: '00000000-0000-4000-8000-00000000000a' });
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks(); });

const vist = {};
function Sonda() {
  vist.identitat = useIdentitatOpcional();
  vist.core = useCoreContent();
  vist.mur = useMur();
  vist.dades = useNotesData();
  vist.notes = useNotes();
  vist.xat = useXat();
  vist.multimedia = useMultimedia();
  return <p>El Mas continua dret</p>;
}

/* L'arbre d'AppContent (App.jsx), sense la moderació (que no llig la identitat). */
const arbre = (
  <CoreContentProvider config={CONFIG}>
    <MurProvider config={CONFIG}>
      <NotesDataProvider config={CONFIG}>
        <NotesProvider>
          <XatProvider config={CONFIG}>
            <MultimediaProvider config={CONFIG}>
              <Sonda />
            </MultimediaProvider>
          </XatProvider>
        </NotesProvider>
      </NotesDataProvider>
    </MurProvider>
  </CoreContentProvider>
);

test('sense IdentitatProvider l’arbre de l’arrel es pinta, es llig com un visitant i res no s’escriu', async () => {
  const errors = vi.spyOn(console, 'error');
  m.loadCoreContent.mockResolvedValue({ towns: [], pages: [], agents: [] });
  m.loadMur.mockResolvedValue({ feedPosts: [], events: [], marketItems: [] });
  m.loadMultimedia.mockResolvedValue({ mediaItems: [] });
  m.loadFils.mockResolvedValue([]);
  await act(async () => { render(arbre); });
  expect(screen.getByText('El Mas continua dret')).toBeTruthy();
  // Sanitat: de veres no hi ha cap proveïdor d'identitat.
  expect(vist.identitat).toBeNull();
  await waitFor(() => expect(vist.mur.status).toBe('ready'));
  await waitFor(() => expect(vist.dades.status).toBe('ready'));
  // Lectures de visitant: cap actor, cap nota ni esborrany, cap fil.
  expect(m.loadMur.mock.calls.every(([actorId]) => actorId === null)).toBe(true);
  expect(m.loadCoreContent.mock.calls.every(([actorId]) => actorId === null)).toBe(true);
  expect(m.loadNotes).not.toHaveBeenCalled();
  expect(m.getDraftsForScope).not.toHaveBeenCalled();
  expect(m.loadFils).not.toHaveBeenCalled();
  expect(vist.dades.nomesLectura).toBe(true);
  expect(vist.notes.canCreate).toBe(false);
  expect(vist.xat.joId).toBeNull();
  // Escriptures: refusades abans del port.
  await expect(vist.notes.creaNota({ title: 'Nova' })).rejects.toMatchObject({ name: 'ErrorIdentitatDeLectura' });
  await expect(vist.mur.sendSectionSubmission({ section: 'mur', payload: {} })).rejects.toMatchObject({ name: 'ErrorIdentitatDeLectura' });
  await expect(vist.xat.sendChatMessage({ id: 'fil-a' }, 'Hola')).resolves.toEqual([]);
  expect(m.createNote).not.toHaveBeenCalled();
  expect(m.appendSectionSubmissionNetworkOnly).not.toHaveBeenCalled();
  expect(m.enviaMissatge).not.toHaveBeenCalled();
  expect(errors).not.toHaveBeenCalled();
});
