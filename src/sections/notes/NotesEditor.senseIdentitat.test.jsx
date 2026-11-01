/* D-7 (pla 261101_1246; P1-71) · Revisió adversarial T6b (G-T6b-02) · L'editor
   del Bloc (NotesEditor) i el lector d'una connexió (ConnexioDetall) FORA
   d'IdentitatProvider (una recàrrega en calent amb un context vell), amb
   sessió. Els dos prenen la reserva anònima de només lectura
   (useIdentitatOReserva.js) i es pinten: cap pet a l'ErrorBoundary ni cap
   error a la consola. IdentitatContext.jsx és el de veres i no hi ha cap
   IdentitatProvider: si un dels dos torna a cridar useIdentitat(), esta
   prova cau. La resta de contextos, dobles mínims. Dades sintètiques. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const NET = Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) });
  return {
    NET, adapter: null, toast: vi.fn(), navigate: vi.fn(), t: (_clau, reserva) => reserva,
    session: { currentUser: { id: 'persona-a' }, estat: 'dins' },
    config: { tenantId: '00000000-0000-4000-8000-0000000000a1' },
    mur: { status: 'ready', feedPosts: [], events: [], marketItems: [{ id: 'samarreta', title: 'Samarreta', image_url: '/assets/x.png', author_name: 'Sóc de Poble' }] }
  };
});
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], notes: [], t: (_clau, reserva) => reserva, config: mocks.config, workspaceKey: mocks.config.tenantId,
    notesComplete: true, setLocalNoteField: vi.fn(), mouNota: vi.fn(), esborraNota: vi.fn(), potEsborrar: false,
    publishNote: vi.fn(), compartirNota: vi.fn(), scopeKey: undefined
  }),
  etiquetesDeNota: () => []
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...await importOriginal(),
  useEstatDesamentNota: () => mocks.NET
}));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ status: 'ready', agents: [], towns: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => mocks.session, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [] }) }));

import NotesEditor from './NotesEditor.jsx';
import { ConnexioDetall } from './ConnexioDetall.jsx';

beforeEach(() => { mocks.adapter = null; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('sense IdentitatProvider: l’editor pinta la Card en lectura (sense nota) i una nota, sense cap error', () => {
  const errors = vi.spyOn(console, 'error');
  const { rerender } = render(<NotesEditor activeNote={null} />);
  expect(mocks.adapter).not.toBeNull();
  rerender(<NotesEditor activeNote={{ id: 'n-7', title: 'Una nota', content: '<p>Hola</p>', folderId: 'f-notes', categories: [], tags: [] }} />);
  expect(mocks.adapter).not.toBeNull();
  expect(errors).not.toHaveBeenCalled();
});

test('sense IdentitatProvider: el lector d’una connexió es pinta, sense cap error', () => {
  const errors = vi.spyOn(console, 'error');
  const nota = {
    id: 'n-9', title: 'Samarreta', folderId: 'f-connectats', content: '<p>Element connectat.</p>',
    origen: { tipus: 'connexio', sectionId: 'mercat', itemId: 'samarreta', titol: 'Samarreta', autorNom: 'Sóc de Poble', ruta: '/mercat/samarreta', objecte: 'producte' }
  };
  const { container } = render(<ConnexioDetall nota={nota} />);
  expect(container.querySelector('header.page-title h1')?.textContent).toBe('Samarreta');
  expect(errors).not.toHaveBeenCalled();
});
