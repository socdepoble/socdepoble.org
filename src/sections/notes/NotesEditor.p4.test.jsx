/* P4 (ordre del Mestre, 261003; desfà la targeta viva de l'editor de T50) ·
   El panell dret de vista prèvia del Bloc de Notes, fora: amb el
   DocumentEditor de veres, l'editor no porta l'embolcall de la targeta, ni
   l'aside «Previsualització de la targeta», ni el xip «Vista targeta», en cap
   estat (nota pròpia, nota preparada, còpia de prova del Foraster). La closca
   torna a ser filla directa de la columna del detall. Els botons de
   classificació (carpeta, categories, etiquetes, emoticona) es conserven.
   El motor TipTap no entra en joc: es prova l'estructura. Dades sintètiques. */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: {}, config: { tenantId: '00000000-0000-4000-8000-0000000000a1' }, setLocal: () => {},
  NET: Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) })
}));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: ({ onPublish, publishLabel }) => (
    <div className="sdp-editor-tools"><button type="button" onClick={onPublish}>{publishLabel || 'Publicar'}</button></div>
  ),
  UniversalRichTextContent: () => <div data-testid="cos" />
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('./NotesSection.jsx', () => ({ LLAVOR_NOTA: '<h3>Llavor del Bloc</h3>' }));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], t: (_clau, text) => text, config: mocks.config, workspaceKey: 'ambit-A',
    notes: [], setLocalNoteField: mocks.setLocal, saveNoteField: mocks.setLocal, notesComplete: true,
    potEsborrar: false, scopeKey: 'ambit-A'
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
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => mocks.session, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));

import NotesEditor from './NotesEditor.jsx';
import { NotaPreparadaContext } from './notaPreparada.js';

beforeEach(() => {
  mocks.session = {};
});
afterEach(cleanup);

/* Cap rastre del panell dret ni del seu xip; la closca, filla directa. */
function senseTargetaViva(container) {
  expect(container.querySelector('.sdp-editor-amb-targeta')).toBeNull();
  expect(container.querySelector('aside.sdp-targeta-viva')).toBeNull();
  expect(screen.queryByRole('complementary', { name: 'Previsualització de la targeta' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Vista targeta' })).toBeNull();
  const closca = container.querySelector('.sdp-editor-shell-atomic');
  expect(closca).not.toBeNull();
  expect(closca.parentElement).toBe(container);
}

test('una nota pròpia: l’editor ocupa el detall sencer, sense la vista prèvia de la dreta, i conserva la botonera', () => {
  mocks.session = { currentUser: { id: 'u' } };
  const { container } = render(<NotesEditor activeNote={{ id: 'p', title: 'Hort', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  senseTargetaViva(container);
  // Els botons de classificació que li agraden al Mestre, al seu lloc.
  // Gauntlet 261016 (Bloc 3.9) · El seu lloc és ara l'«Edició avançada», i el quart es diu «Emojis XL».
  const avancada = container.querySelector('details.sdp-edicio-avancada');
  expect(avancada).not.toBeNull();
  for (const nom of ['Carpetes: Mur', 'Categories: Sistema', /^Etiquetes/, /^Emojis XL/]) {
    expect(avancada.contains(screen.getByRole('button', { name: nom }))).toBe(true);
  }
});

test('la nota preparada i la còpia de prova del Foraster tampoc no porten la vista prèvia', () => {
  mocks.session = { currentUser: { id: 'u' } };
  const preparada = { id: '0f0e0d0c-0b0a-4000-8000-000000000001', folderId: 'f-mur', isPublished: false, preparada: true };
  const { container } = render(
    <NotaPreparadaContext.Provider value={{ escriu: () => {} }}>
      <NotesEditor activeNote={preparada} />
    </NotaPreparadaContext.Provider>
  );
  senseTargetaViva(container);
  cleanup();
  mocks.session = {};
  const foraster = render(<NotesEditor />);
  senseTargetaViva(foraster.container);
});
