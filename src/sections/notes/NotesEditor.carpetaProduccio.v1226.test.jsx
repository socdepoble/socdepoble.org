/* v1.2.26 · IDEA-358.1 (Llibre Mestre, l. 3691) i Gauntlet G26, Lent 1 punt 10 · El
   selector «Carpeta» de l'editor del Bloc (NotesEditor de veres) oferix «En producció»
   també a un compte que ja té carpetes al servidor i no la porta, com la columna del Bloc
   (carpetesDelBloc): la nota s'hi pot moure des de l'editor. Fixa també que:
     · «Tot» no és mai una destinació;
     · la Safata d’Entrada només hi ix si el servidor (o la llavor) ja la porta, com abans:
       si ha de ser destinació manual ho decidix el Mestre;
     · si el servidor ja porta f-produccio, mana el seu nom i no es duplica;
     · una nota que ja és a «En producció» la mostra triada, encara que el servidor no
       tinga la carpeta.
   El motor TipTap no entra en joc (com NotesEditor.repliquesCarpetes.r30.test.jsx). Dades
   sintètiques. */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const AMBIT = 'supabase:poble_persona::1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5_7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';

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
import { CARPETA_CONNECTATS, CARPETA_EN_PRODUCCIO } from './carpetes.js';
import { _reiniciaCarpetesCreades } from '../../components/universal/classificacio/carpetesCreades.js';
import { _reiniciaMigracioCarpetes } from '../../components/universal/classificacio/migracioCarpetesLocals.js';

const NOTA = Object.freeze({ id: 'n-1', title: 'La fira de tardor', folderId: 'f-notes', categories: [], tags: [] });
/* Un compte existent: les carpetes que ja té al servidor, sense «En producció» ni la Safata. */
const DEL_SERVIDOR = Object.freeze([
  Object.freeze({ id: 'f-mur', name: 'Mur', parentId: null }),
  Object.freeze({ id: 'f-mercat', name: 'Mercat', parentId: null }),
  Object.freeze({ id: 'f-notes', name: 'Altres notes', parentId: null })
]);

beforeEach(() => {
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
  mocks.setLocal = vi.fn();
  mocks.noteFolders = DEL_SERVIDOR;
  mocks.notes = [NOTA];
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  _reiniciaCarpetesCreades();
  _reiniciaMigracioCarpetes();
});

const selector = () => screen.getByLabelText('Carpeta');
/* Les opcions del selector «Carpeta» ([valor, text]), en l'ordre en què es pinten. */
const opcions = () => within(selector()).getAllByRole('option').map((o) => [o.value, o.textContent]);

test('un compte amb carpetes al servidor sense «En producció»: el selector la porta davant d’«Altres notes»', () => {
  render(<NotesEditor activeNote={NOTA} />);
  expect(opcions()).toEqual([
    ['f-mur', 'Mur'], ['f-mercat', 'Mercat'], [CARPETA_EN_PRODUCCIO, 'En producció'], ['f-notes', 'Altres notes']
  ]);
  // Ni «Tot» ni la Safata, que el servidor no porta: com abans.
  expect(opcions().map(([valor]) => valor)).not.toContain('f-tot');
  expect(opcions().map(([valor]) => valor)).not.toContain(CARPETA_CONNECTATS);
});

test('triar «En producció» mou la nota a f-produccio, amb l’id de sèrie', () => {
  render(<NotesEditor activeNote={NOTA} />);
  fireEvent.change(selector(), { target: { value: CARPETA_EN_PRODUCCIO } });
  expect(mocks.setLocal).toHaveBeenCalledWith(NOTA.id, 'folderId', CARPETA_EN_PRODUCCIO);
});

test('una nota que ja és a «En producció» la mostra triada encara que el servidor no tinga la carpeta', () => {
  const enProduccio = { ...NOTA, folderId: CARPETA_EN_PRODUCCIO };
  mocks.notes = [enProduccio];
  render(<NotesEditor activeNote={enProduccio} />);
  expect(selector().value).toBe(CARPETA_EN_PRODUCCIO);
  expect(within(selector()).getByRole('option', { selected: true }).textContent).toBe('En producció');
});

test('amb la Safata i «Tot» al servidor: la Safata una sola volta, «Tot» mai, «En producció» davant d’«Altres notes»', () => {
  mocks.noteFolders = [
    { id: 'f-tot', name: 'Tot', parentId: null }, { id: 'f-mur', name: 'Mur', parentId: null },
    { id: CARPETA_CONNECTATS, name: 'Safata d’Entrada', parentId: null }, { id: 'f-notes', name: 'Altres notes', parentId: null }
  ];
  render(<NotesEditor activeNote={NOTA} />);
  expect(opcions().map(([valor]) => valor)).toEqual(['f-mur', CARPETA_CONNECTATS, CARPETA_EN_PRODUCCIO, 'f-notes']);
});

test('si el servidor ja porta f-produccio, mana el seu nom i no es duplica', () => {
  mocks.noteFolders = [...DEL_SERVIDOR.slice(0, 2), { id: CARPETA_EN_PRODUCCIO, name: 'Esborranys', parentId: null }, DEL_SERVIDOR[2]];
  render(<NotesEditor activeNote={NOTA} />);
  expect(opcions().filter(([valor]) => valor === CARPETA_EN_PRODUCCIO)).toEqual([[CARPETA_EN_PRODUCCIO, 'Esborranys']]);
});

test('sense carpetes al servidor, les de la llavor sense «Tot», com abans (amb la Safata i «En producció»)', () => {
  mocks.noteFolders = [];
  render(<NotesEditor activeNote={NOTA} />);
  expect(opcions().map(([valor]) => valor)).toEqual(NOTE_FOLDERS_SEED.filter((carpeta) => carpeta.id !== 'f-tot').map((carpeta) => carpeta.id));
});
