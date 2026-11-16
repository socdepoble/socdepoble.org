/* Onada R30 · PF-01 (àrbitre, P2) · La columna de carpetes del Bloc (NotesSection de veres,
   amb l'espai de treball de veres) es queda igual abans i després de migrar una carpeta que
   només era al navegador. Després de la migració, la càrrega del port porta la rèplica remota
   («Festes», f-<uuid>) al costat de les de sèrie, i la carpeta local «Festes» (f-festes)
   continua a carpetesCreades. Amb l'entrada { local, remot } al registre, només es pinta una
   «Festes», la local, en el mateix lloc. Sense el filtre (useCarpetesDelBlocVisibles) se'n
   pintarien dues. Dades sintètiques. */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';

const AMBIT = 'supabase:poble_persona::1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5_7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
const REPLICA = 'f-0f0e0d0c-0b0a-4908-8706-050403020100';

const dades = vi.hoisted(() => ({ notes: [], noteFolders: [], buit: [], config: { dataMode: 'remote' }, scopeKey: null }));
vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: dades.noteFolders, status: 'ready', canCreate: true, teSessio: true,
    notesComplete: true, config: dades.config, scopeKey: dades.scopeKey, obriConfiguracioNotes: () => {}, informaError: () => {},
    creaNota: vi.fn(), setLocalNoteField: vi.fn(), resolveNote: vi.fn(async () => ({ status: 'not-found' }))
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: dades.config }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ generacio: 1, currentUser: { id: 'persona-a' }, estat: 'dins' }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', sortedFeedPosts: dades.buit, sortedEvents: dades.buit, sortedMarketItems: dades.buit }) }));
vi.mock('./NotesDetail.jsx', () => ({ default: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import NotesSection from './NotesSection.jsx';
import { NOTE_FOLDERS_SEED } from '../../data/carpetesSeed.js';
import { _reiniciaCarpetesCreades, desaCarpetaCreada } from '../../components/universal/classificacio/carpetesCreades.js';
import { _reiniciaMigracioCarpetes, registraReplica } from '../../components/universal/classificacio/migracioCarpetesLocals.js';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(() => {
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
  Object.assign(dades, { notes: [{ id: 'n-1', title: 'Les festes', folderId: 'f-festes' }], noteFolders: [...NOTE_FOLDERS_SEED], scopeKey: AMBIT });
  desaCarpetaCreada(AMBIT, { id: 'f-festes', nom: 'Festes' });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
});

/* Els noms del grup de carpetes de la columna (sense categories ni etiquetes), en l'ordre en què es pinten. */
const columnaDeCarpetes = () => {
  const vista = render(<MemoryRouter rutaInicial="/notes"><NotesSection /></MemoryRouter>);
  const grup = screen.getByRole('navigation', { name: 'CARPETES' }).querySelector('[data-group="folders"]');
  const noms = [...grup.querySelectorAll('.sdp-workspace-nav-item__label')].map((etiqueta) => etiqueta.textContent);
  vista.unmount();
  return noms;
};
const festes = (noms) => noms.filter((nom) => nom === 'Festes');

test('abans i després de migrar, la columna pinta les mateixes carpetes i una sola «Festes»', () => {
  const abans = columnaDeCarpetes();
  expect(festes(abans)).toHaveLength(1);
  /* La migració ha apuntat la rèplica i la càrrega següent la porta del servidor. */
  expect(registraReplica(AMBIT, { local: 'f-festes', remot: REPLICA })).toBe(true);
  dades.noteFolders = [...NOTE_FOLDERS_SEED, { id: REPLICA, nom: 'Festes', parentId: null }];
  const despres = columnaDeCarpetes();
  expect(despres).toEqual(abans);
  expect(festes(despres)).toHaveLength(1);
});

test('una rèplica que ja té alguna nota (d’un altre dispositiu) es pinta com sempre', () => {
  expect(registraReplica(AMBIT, { local: 'f-festes', remot: REPLICA })).toBe(true);
  dades.noteFolders = [...NOTE_FOLDERS_SEED, { id: REPLICA, nom: 'Festes', parentId: null }];
  dades.notes = [...dades.notes, { id: 'n-2', title: 'Des del mòbil', folderId: REPLICA }];
  expect(festes(columnaDeCarpetes())).toHaveLength(2);
});
