/* Onada R30 · PF-01 (àrbitre, P2) · El selector «Carpeta» de l'editor del Bloc (NotesEditor
   de veres) ofereix les mateixes opcions abans i després de migrar una carpeta que només era
   al navegador. Després de migrar, el port porta la rèplica remota («Festes», f-<uuid>) i la
   carpeta local «Festes» (f-festes) continua a carpetesCreades: amb l'entrada { local, remot }
   al registre, el selector només en pinta una, la local, on era. Sense el filtre
   (useCarpetesDelBlocVisibles) n'hi hauria dues. El motor TipTap no entra en joc (com
   NotesEditor.p4.test.jsx). Dades sintètiques. */
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const AMBIT = 'supabase:poble_persona::1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5_7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
const REPLICA = 'f-0f0e0d0c-0b0a-4908-8706-050403020100';

const mocks = vi.hoisted(() => ({
  config: { tenantId: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7' }, setLocal: () => {}, noteFolders: [], notes: [],
  NET: Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) })
}));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => <div className="sdp-editor-tools" />,
  UniversalRichTextContent: () => <div data-testid="cos" />
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: mocks.noteFolders, t: (_clau, text) => text, config: mocks.config, workspaceKey: 'ambit-A',
    notes: mocks.notes, setLocalNoteField: mocks.setLocal, saveNoteField: mocks.setLocal, notesComplete: true,
    potEsborrar: false, scopeKey: AMBIT
  }),
  etiquetesDeNota: () => []
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...await importOriginal(),
  useEstatDesamentNota: () => mocks.NET
}));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'user' }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'u' } }), ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));

import NotesEditor from './NotesEditor.jsx';
import { NOTE_FOLDERS_SEED } from '../../data/carpetesSeed.js';
import { _reiniciaCarpetesCreades, desaCarpetaCreada } from '../../components/universal/classificacio/carpetesCreades.js';
import { _reiniciaMigracioCarpetes, registraReplica } from '../../components/universal/classificacio/migracioCarpetesLocals.js';

const NOTA = Object.freeze({ id: 'n-1', title: 'Les festes', folderId: 'f-festes', categories: [], tags: [] });

beforeEach(() => {
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
  mocks.noteFolders = [...NOTE_FOLDERS_SEED];
  mocks.notes = [NOTA];
  desaCarpetaCreada(AMBIT, { id: 'f-festes', nom: 'Festes' });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
});

/* Les opcions del selector «Carpeta» ([valor, text]), en l'ordre en què es pinten. */
const opcionsDelSelector = () => {
  const vista = render(<NotesEditor activeNote={NOTA} />);
  const opcions = within(screen.getByLabelText('Carpeta')).getAllByRole('option').map((o) => [o.value, o.textContent]);
  vista.unmount();
  return opcions;
};
const festes = (opcions) => opcions.filter(([, text]) => text === 'Festes');

test('abans i després de migrar, el selector ofereix les mateixes carpetes i una sola «Festes» (la local)', () => {
  const abans = opcionsDelSelector();
  expect(festes(abans)).toEqual([['f-festes', 'Festes']]);
  expect(registraReplica(AMBIT, { local: 'f-festes', remot: REPLICA })).toBe(true);
  mocks.noteFolders = [...NOTE_FOLDERS_SEED, { id: REPLICA, nom: 'Festes', parentId: null }];
  const despres = opcionsDelSelector();
  expect(despres).toEqual(abans);
  expect(festes(despres)).toEqual([['f-festes', 'Festes']]);
});

test('una rèplica amb notes (d’un altre dispositiu) continua sent una opció', () => {
  expect(registraReplica(AMBIT, { local: 'f-festes', remot: REPLICA })).toBe(true);
  mocks.noteFolders = [...NOTE_FOLDERS_SEED, { id: REPLICA, nom: 'Festes', parentId: null }];
  mocks.notes = [NOTA, { id: 'n-2', title: 'Des del mòbil', folderId: REPLICA }];
  expect(festes(opcionsDelSelector()).map(([valor]) => valor)).toEqual([REPLICA, 'f-festes']);
});
