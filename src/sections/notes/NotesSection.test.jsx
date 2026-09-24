import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ model: null, props: null, obri: () => {}, params: new URLSearchParams('nota=n1'), note: { id: 'n1', folderId: 'f-mur', categories: ['Sistema'], tags: ['Tutorial'], formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z' } }));
vi.mock('./NotesContext', async importOriginal => ({ ...await importOriginal(), useNotes: () => ({
  notes: [mocks.note], noteFolders: [{ id: 'f-mur', name: 'Mur' }], status: 'ready', canCreate: true,
  obriConfiguracioNotes: mocks.obri
}) }));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {} }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useSearchParams: () => [mocks.params, vi.fn()] }));
vi.mock('../../components/universal/workspace/UniversalWorkspace', () => ({ UniversalWorkspace: (props) => { mocks.model = props.model; mocks.props = props; return null; } }));
vi.mock('./NotesDetail.jsx', () => ({ default: () => null }));
vi.mock('./NotaFitxa.jsx', () => ({ NotaFitxa: () => null }));
import NotesSection from './NotesSection.jsx';
import { etiquetesDeNota } from './NotesContext';
afterEach(cleanup);
test('el model de la llista comparteix labels editorials i data amb la nota de l’editor', () => {
  render(<NotesSection />);
  const item = mocks.model.items[0];
  expect(item.labels).toEqual(etiquetesDeNota(mocks.note, [{ id: 'f-mur', name: 'Mur' }]));
  expect(item.labels.map(label => label.text)).toEqual(['Sistema', 'Tutorial']);
  expect(item.subtitle).toBe(mocks.note.formattedDate);
  expect(item.data.formattedTime).toBe('09:37');
  expect(item.updatedAt).toBe(mocks.note.updatedAt);
});

test('la roda de CARPETES torna: el Bloc passa la seua configuració a l’espai de treball', () => {
  render(<NotesSection />);
  expect(mocks.props.onManageCategories).toBe(mocks.obri);
});

test('en entrar, la primera carpeta (Mur) és la categoria activa inicial', () => {
  render(<NotesSection />);
  expect(mocks.props.initialSelection).toEqual({ categoryId: 'f-mur' });
  expect(mocks.model.navigationGroups[0].options[0].id).toBe('f-mur');
});

test('la llavor del cos porta Heading 3 per a esborrar tot', async () => {
  const { LLAVOR_NOTA } = await import('./NotesSection.jsx');
  expect(LLAVOR_NOTA).toMatch(/<h3/i);
  expect(LLAVOR_NOTA).toMatch(/esborrar/i);
});
