/* F4 (ordre del Mestre, 261004; PRD de la Marató 2230, Fase 1) · El MAS del
   Bloc: les publicacions de l'actor a les carpetes de la seua secció,
   Multimèdia inclosa; una nota publicada al Mur és una sola peça (D2); i en
   remot l'entitat de l'slug declarat reconeix el contingut de la llavor.
   NotesSection.test.jsx el porta un altre torn: estes proves viuen a banda. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MOCK_MARKET_ITEMS } from '../mercat/marketSeed.js';

const PERSONA = { tipus: 'persona', id: 'uuid-pep', rol: 'persona' };
const mocks = vi.hoisted(() => ({
  model: null,
  actor: null,
  config: { dataMode: 'remote' },
  notes: [],
  feed: [],
  mercat: [],
  events: [],
  media: []
}));
vi.mock('./NotesContext', async (importOriginal) => ({ ...await importOriginal(), useNotes: () => ({
  notes: mocks.notes, noteFolders: [{ id: 'f-mur', name: 'Mur' }], status: 'ready', canCreate: true, teSessio: true,
  creaNota: vi.fn()
}) }));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: mocks.config }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useSearchParams: () => [new URLSearchParams('nota=n1'), vi.fn()] }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: mocks.actor, memberships: [] }) }));
/* Cada llista és la mateixa referència entre pintades, com al MurContext de
   veres (memo): una llista literal nova a cada crida refaria les publicacions
   i amagaria el que prova la identitat estable. */
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: mocks.feed, sortedEvents: mocks.events, sortedMarketItems: mocks.mercat }) }));
vi.mock('../multimedia/MultimediaContext.jsx', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: mocks.media }) }));
/* Només el model: el Workspace, el detall i les fitxes tenen les seues proves. */
vi.mock('../../components/universal/workspace/UniversalWorkspace', () => ({ UniversalWorkspace: (props) => {
  mocks.model = props.model;
  return null;
} }));
vi.mock('./NotesDetail.jsx', () => ({ default: () => null }));
vi.mock('./NotaFitxa.jsx', () => ({ NotaFitxa: () => null }));
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('./PublicacioDetall.jsx', () => ({ PublicacioDetall: () => null, PublicacioFitxa: () => null }));
import NotesSection from './NotesSection.jsx';

afterEach(() => {
  cleanup();
  Object.assign(mocks, { model: null, actor: null, config: { dataMode: 'remote' }, notes: [], feed: [], mercat: [], events: [], media: [] });
});

const pinta = (estat) => {
  Object.assign(mocks, estat);
  render(<NotesSection />);
  return mocks.model.items;
};
const publicacions = (items) => items.filter((item) => item.kind === 'publicacio');

test('F4 · el mitjà de l’actor apareix a «Multimèdia» (f-media) com a publicació de lectura; el d’altri, no', () => {
  const items = pinta({
    actor: PERSONA,
    media: [
      { id: 'm1', title: 'Bancal', src: '/f.jpg', kind: 'image', ownerUserId: PERSONA.id },
      { id: 'm2', title: 'Altri', src: '/a.jpg', kind: 'image', ownerUserId: 'uuid-altri' }
    ]
  });
  expect(publicacions(items).map((item) => [item.id, item.categoryIds, item.image])).toEqual([
    ['publicacio:multimedia:m1', ['f-media'], '/f.jpg']
  ]);
});

test('F4 (D2) · una nota publicada al Mur és una sola peça: la nota, a la seua carpeta i a «Mur»; n1 no canvia', () => {
  const n1 = { id: 'n1', isPublished: true, folderId: 'f-mur', categories: ['Sistema'], tags: ['Tutorial'] };
  const publicada = { id: 'n-pub', title: 'Hort', isPublished: true, publishedSubmissionId: 'p1', folderId: 'f-notes' };
  const jaAlMur = { id: 'n-mur', title: 'Plaça', isPublished: true, publishedSubmissionId: 'p3', folderId: 'f-mur' };
  const items = pinta({
    actor: PERSONA,
    notes: [n1, publicada, jaAlMur],
    feed: [
      { id: 'p1', title: 'Hort', ownerUserId: PERSONA.id },
      { id: 'p2', title: 'Directa', ownerUserId: PERSONA.id },
      { id: 'p3', title: 'Plaça', ownerUserId: PERSONA.id }
    ]
  });
  // Cap còpia de lectura de les publicacions nascudes de notes.
  expect(publicacions(items).map((item) => item.id)).toEqual(['publicacio:mur:p2']);
  const nota = items.find((item) => item.id === 'n-pub');
  expect(nota.kind).toBe('note');
  // La seua carpeta primer: una URL sense ?carpeta= hi torna.
  expect(nota.categoryIds.slice(0, 2)).toEqual(['f-notes', 'f-mur']);
  // Només al model de vista: la dada no es toca.
  expect(nota.data.folderId).toBe('f-notes');
  // Ja a «Mur»: no es repetix.
  expect(items.find((item) => item.id === 'n-mur').categoryIds).toEqual(['f-mur']);
  // Llei del Píxel en llavor: n1 (sense publishedSubmissionId) es pinta com sempre.
  expect(items.find((item) => item.id === 'n1').categoryIds).toEqual(['f-mur', 'cat_Sistema', 'tag_Tutorial']);
});

test('F4 · en remot, l’entitat amb l’slug declarat «soc-de-poble» veu la Samarreta a «Mercat»', () => {
  const items = pinta({
    actor: { tipus: 'entitat', id: 'uuid-org', slug: 'soc-de-poble', rol: 'owner' },
    config: { dataMode: 'remote' },
    mercat: MOCK_MARKET_ITEMS
  });
  expect(publicacions(items).map((item) => [item.id, item.categoryIds])).toEqual([
    ['publicacio:mercat:samarreta-socdepoble', ['f-mercat']]
  ]);
});

test('F4 · en remot, la persona no hereta res de la llavor (D1): el Mac Mini no és seu', () => {
  const items = pinta({ actor: PERSONA, config: { dataMode: 'remote' }, mercat: MOCK_MARKET_ITEMS });
  expect(publicacions(items)).toEqual([]);
});

/* Poliment de F4 (revisió de la Marató 2230) · El Set de publicades es memoritza
   sobre una clau de text: escriure en una nota (un array de notes nou a cada
   tecla) no refà les publicacions, i els seus objectes conserven la identitat. */
test('F4 · editar una nota no refà les publicacions: els objectes són els mateixos; publicar-ne una altra sí que canvia', () => {
  const publicada = { id: 'n-pub', title: 'Hort', isPublished: true, publishedSubmissionId: 'p1', folderId: 'f-notes' };
  const esborrany = { id: 'n-esb', title: 'Reg' };
  Object.assign(mocks, {
    actor: PERSONA,
    notes: [publicada, esborrany],
    feed: [
      { id: 'p1', title: 'Hort', ownerUserId: PERSONA.id },
      { id: 'p2', title: 'Directa', ownerUserId: PERSONA.id },
      { id: 'p4', title: 'Bancal', ownerUserId: PERSONA.id }
    ],
    media: [{ id: 'm1', title: 'Sega', src: '/s.jpg', kind: 'image', ownerUserId: PERSONA.id }]
  });
  const { rerender } = render(<NotesSection />);
  const abans = publicacions(mocks.model.items);
  expect(abans.map((item) => item.id)).toEqual(['publicacio:mur:p2', 'publicacio:mur:p4', 'publicacio:multimedia:m1']);
  // Una tecla: un array nou amb notes noves; els ids publicats no canvien.
  mocks.notes = [{ ...publicada, title: 'Hort de dalt' }, { ...esborrany, title: 'Reg a goteig' }];
  rerender(<NotesSection />);
  const despres = publicacions(mocks.model.items);
  expect(despres).toHaveLength(abans.length);
  despres.forEach((item, posicio) => expect(item).toBe(abans[posicio]));
  // Publicar una altra nota canvia la clau: la seua còpia de lectura desapareix.
  mocks.notes = [...mocks.notes, { id: 'n-nova', title: 'Bancal', isPublished: true, publishedSubmissionId: 'p4' }];
  rerender(<NotesSection />);
  expect(publicacions(mocks.model.items).map((item) => item.id)).toEqual(['publicacio:mur:p2', 'publicacio:multimedia:m1']);
});
