/* Onada R17 · AH-R17-11 / P0-88 (Sofía Bornay, Android) · La revisió de la
   còpia de prova (useLocalSandbox) arriba a la clau de l'editor: quan, en
   hidratar, l'esborrany desat guanya a una tecla feta abans sobre la
   benvinguda, l'editor es torna a muntar i pinta el desat (el cos de TipTap no
   se sincronitza amb un desat pendent). Amb la revisió a zero, la clau de
   sempre: hidratar sense descartar res no remunta l'editor. */
import React, { useEffect } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';

const mocks = vi.hoisted(() => ({
  config: { tenantId: '00000000-0000-4000-8000-0000000000a1' },
  sandbox: { nota: null, revisio: 0, update: () => {} },
  muntatges: 0,
  adapter: null
}));
vi.mock('./useLocalSandbox.js', () => ({
  useLocalSandbox: () => [mocks.sandbox.nota, mocks.sandbox.update, mocks.sandbox.revisio]
}));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], t: (_clau, reserva) => reserva, config: mocks.config, workspaceKey: mocks.config.tenantId,
    notes: [], setLocalNoteField: vi.fn(), notesComplete: true, mouNota: vi.fn(), esborraNota: vi.fn(),
    potEsborrar: false, publishNote: vi.fn(), compartirNota: vi.fn(), scopeKey: undefined
  }),
  etiquetesDeNota: () => []
}));
vi.mock('../../components/universal/DocumentEditor', () => ({
  DocumentEditor: ({ adapter }) => {
    mocks.adapter = adapter;
    useEffect(() => { mocks.muntatges += 1; }, []);
    return null;
  }
}));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'user' }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
/* El Foraster: la sessió ja resolta, sense ningú dins. */
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({}), ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import NotesEditor from './NotesEditor.jsx';

const BENVINGUDA = Object.freeze({ id: 'prova-local', title: 'Benvinguda', content: '<p>Benvinguda</p>', revision: 0 });

beforeEach(() => {
  mocks.sandbox = { nota: BENVINGUDA, revisio: 0, update: vi.fn() };
  mocks.muntatges = 0;
  mocks.adapter = null;
});
afterEach(cleanup);

test('AH-R17-11 · hidratar sense descartar cap tecla no remunta l’editor de la còpia de prova', () => {
  const { rerender } = render(<NotesEditor />);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(mocks.muntatges).toBe(1);
  // L'esborrany desat arriba (revisió 0): el document canvia, l'editor no es remunta.
  mocks.sandbox = { ...mocks.sandbox, nota: { ...BENVINGUDA, title: 'La meua recepta' } };
  rerender(<NotesEditor />);
  expect(mocks.adapter.document.title).toBe('La meua recepta');
  expect(mocks.muntatges).toBe(1);
});

test('AH-R17-11 · quan el desat guanya a una tecla d’abans d’hidratar, l’editor es torna a muntar amb el desat', () => {
  const { rerender } = render(<NotesEditor />);
  expect(mocks.muntatges).toBe(1);
  mocks.sandbox = { ...mocks.sandbox, nota: { ...BENVINGUDA, title: 'La meua recepta' }, revisio: 1 };
  rerender(<NotesEditor />);
  expect(mocks.muntatges).toBe(2);
  expect(mocks.adapter.document.title).toBe('La meua recepta');
  // La revisió no canvia: cap remuntatge més.
  rerender(<NotesEditor />);
  expect(mocks.muntatges).toBe(2);
});
