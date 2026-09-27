import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ model: null, props: null, obri: () => {}, params: new URLSearchParams('nota=n1'), note: { id: 'n1', folderId: 'f-mur', categories: ['Sistema'], tags: ['Tutorial'], formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z' },
  actor: { tipus: 'entitat', id: 'socdepoble', slug: 'soc-de-poble', rol: 'owner' },
  mercat: [
    { id: 'samarreta', title: 'Samarreta', author_entity_id: 'socdepoble', seller: 'Sóc de Poble', created_at: '2026-08-15T12:33:00.000Z' },
    { id: 'mac-mini', title: 'Mac Mini', author_id: 'javillinares', seller: 'Mestre Poble', created_at: '2026-02-15T12:00:00.000Z' }
  ] }));
vi.mock('./NotesContext', async importOriginal => ({ ...await importOriginal(), useNotes: () => ({
  notes: [mocks.note], noteFolders: [{ id: 'f-mur', name: 'Mur' }], status: 'ready', canCreate: true,
  obriConfiguracioNotes: mocks.obri
}) }));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: { dataMode: 'seed' } }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useSearchParams: () => [mocks.params, vi.fn()] }));
/* T1 · el MAS creua el Mur amb l'actor: ací un actor de proves i un Mercat amb un article seu i un d'altri. */
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: mocks.actor }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: mocks.mercat }) }));
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

test('T1 · el MAS ensenya a «Mercat» només el que ha publicat l’actor, en lectura', () => {
  render(<NotesSection />);
  const publicacions = mocks.model.items.filter((item) => item.kind === 'publicacio');
  expect(publicacions.map((item) => item.title)).toEqual(['Samarreta']);
  expect(publicacions[0].categoryIds).toEqual(['f-mercat']);
  expect(publicacions[0].data.ruta).toBe('/mercat/samarreta');
  /* La carpeta de les connexions (T5) és al catàleg, abans d'«Altres notes». */
  expect(mocks.model.navigationGroups[0].options.map((o) => o.id)).toContain('f-connectats');
});

test('T1 · com a persona, l’article de l’entitat no és seu i el de la persona pilot sí (mode seed)', () => {
  mocks.actor = { tipus: 'persona', id: 'uuid-javi', rol: 'persona' };
  try {
    render(<NotesSection />);
    expect(mocks.model.items.filter((item) => item.kind === 'publicacio').map((item) => item.title)).toEqual(['Mac Mini']);
  } finally {
    mocks.actor = { tipus: 'entitat', id: 'socdepoble', slug: 'soc-de-poble', rol: 'owner' };
  }
});

test('la llavor del cos porta Heading 3 per a esborrar tot', async () => {
  const { LLAVOR_NOTA } = await import('./NotesSection.jsx');
  expect(LLAVOR_NOTA).toMatch(/<h3/i);
  expect(LLAVOR_NOTA).toMatch(/esborrar/i);
});
