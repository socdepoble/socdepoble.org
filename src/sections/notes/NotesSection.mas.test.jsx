/* F4 (ordre del Mestre, 261004; PRD de la Marató 2230, Fase 1) · El MAS del
   Bloc: les publicacions de l'actor a les carpetes de la seua secció,
   Multimèdia inclosa; una nota publicada al Mur és una sola peça (D2); i en
   remot l'entitat de l'slug declarat reconeix el contingut de la llavor.
   NotesSection.test.jsx el porta un altre torn: estes proves viuen a banda. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MOCK_MARKET_ITEMS } from '../mercat/marketSeed.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { PAGE_COPY } from '../text/pageContent.js';

const PERSONA = { tipus: 'persona', id: 'uuid-pep', rol: 'persona' };
const mocks = vi.hoisted(() => ({
  model: null,
  actor: null,
  config: { dataMode: 'remote' },
  notes: [],
  feed: [],
  mercat: [],
  events: [],
  media: [],
  /* null: sense CoreContentProvider (la reserva de veres: un objecte nou a cada crida). */
  core: null
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
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => mocks.core ?? { status: 'loading', towns: [], pages: [], pageCopy: {}, agents: [], sortedTowns: [], featuredTowns: [] }
}));
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
  Object.assign(mocks, { model: null, actor: null, config: { dataMode: 'remote' }, notes: [], feed: [], mercat: [], events: [], media: [], core: null });
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

/* Ordre del Mestre (261007) · El slug declarat és el de producció,
   'socdepoble' (ENTITAT_PILOT_SLUG); abans, 'soc-de-poble'. Amb el nou,
   l'entitat ja casa amb la Samarreta pel seu propi slug: el pont de F4 només
   es veu amb un article signat amb un àlies que no és cap slug
   ('soc-de-poble_official', sense signatura d'entitat). */
test('F4 · en remot, l’entitat amb l’slug declarat (ENTITAT_PILOT_SLUG) veu la Samarreta a «Mercat»', () => {
  const delPont = { id: 'pont-f4', title: 'Signat amb l’àlies de la llavor', author_id: 'soc-de-poble_official' };
  const items = pinta({
    actor: { tipus: 'entitat', id: 'uuid-org', slug: ENTITAT_PILOT_SLUG, rol: 'owner' },
    config: { dataMode: 'remote' },
    mercat: [...MOCK_MARKET_ITEMS, delPont]
  });
  expect(publicacions(items).map((item) => [item.id, item.categoryIds])).toEqual([
    ['publicacio:mercat:samarreta-socdepoble', ['f-mercat']], ['publicacio:mercat:pont-f4', ['f-mercat']]
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

/* ── Grup E de l'Onada 4 (prompt 261008_1201, tasca 2; decisió del Mestre del
   261008: el «Sóc de Poble loguejat» és l'ENTITAT socdepoble triada al
   selector d'identitat) ── Les deu pàgines del sistema que el Mur signa com a
   «Sóc de Poble» no són a MurContext: les construïx MurSection des del
   contingut core (targetesDeSistema). Ara també entren al Bloc de l'entitat.
   Onada 8 (261009) · Dotze: la Consola i el Cervell hi entren com a pàgines
   del sistema (SYSTEM_PAGES). Abans, deu.
   Ordre del Mestre (261026_2126; prompt 261026_2130, tasca 1) · Tretze:
   «Descàrregues i Aplicacions» hi entra com a pàgina del sistema. Abans,
   dotze. */
const NUCLI = Object.freeze({ status: 'ready', pageCopy: PAGE_COPY, refresh: () => {} });
const SISTEMA = SYSTEM_PAGES.map((pagina) => `publicacio:mur:${pagina.key}`);
const PAGINES_DEL_SISTEMA = 13;
const delMur = (items) => publicacions(items).filter((item) => item.categoryIds.includes('f-mur'));

test('Grup E · amb el contingut core, l’entitat Sóc de Poble veu les tretze pàgines del sistema a «Mur», darrere de les seues publicacions', () => {
  const items = pinta({
    actor: { tipus: 'entitat', id: ENTITAT_PILOT_ID, slug: ENTITAT_PILOT_SLUG, rol: 'owner' },
    config: { dataMode: 'seed' },
    core: NUCLI,
    feed: [{ id: 'p1', title: 'Directa', author_org_id: ENTITAT_PILOT_ID }]
  });
  expect(SISTEMA).toHaveLength(PAGINES_DEL_SISTEMA);
  expect(delMur(items).map((item) => item.id)).toEqual(['publicacio:mur:p1', ...SISTEMA]);
  const xat = items.find((item) => item.id === 'publicacio:mur:xat');
  expect(xat.data).toMatchObject({ seccio: 'mur', ruta: '/page/xat', item: { isSystem: true } });
});

test('Grup E · en remot, l’entitat amb l’uuid de servidor i l’slug declarat també les veu', () => {
  const items = pinta({ actor: { tipus: 'entitat', id: 'uuid-org', slug: ENTITAT_PILOT_SLUG, rol: 'owner' }, core: NUCLI });
  expect(delMur(items).map((item) => item.id)).toEqual(SISTEMA);
});

test('Grup E · una persona, o una altra entitat, no en veu cap', () => {
  expect(publicacions(pinta({ actor: PERSONA, core: NUCLI }))).toEqual([]);
  cleanup();
  expect(publicacions(pinta({ actor: { tipus: 'entitat', id: 'uuid-forn', slug: 'forn-de-la-torre', rol: 'owner' }, core: NUCLI }))).toEqual([]);
});

test('Grup E · sense proveïdor del core, ni pàgines ni llistes noves a cada pintada (identitat estable)', () => {
  Object.assign(mocks, {
    actor: { tipus: 'entitat', id: 'uuid-org', slug: ENTITAT_PILOT_SLUG, rol: 'owner' },
    feed: [{ id: 'p1', title: 'Directa', author_org_id: 'uuid-org' }]
  });
  const { rerender } = render(<NotesSection />);
  const abans = publicacions(mocks.model.items);
  expect(abans.map((item) => item.id)).toEqual(['publicacio:mur:p1']);
  mocks.notes = [{ id: 'n-esb', title: 'Reg' }];
  rerender(<NotesSection />);
  const despres = publicacions(mocks.model.items);
  expect(despres).toHaveLength(1);
  expect(despres[0]).toBe(abans[0]);
});

test('Grup E · amb les pàgines, editar una nota no refà les publicacions: els objectes són els mateixos', () => {
  Object.assign(mocks, { actor: { tipus: 'entitat', id: 'uuid-org', slug: ENTITAT_PILOT_SLUG, rol: 'owner' }, core: NUCLI, notes: [{ id: 'n-esb', title: 'Reg' }] });
  const { rerender } = render(<NotesSection />);
  const abans = publicacions(mocks.model.items);
  expect(abans).toHaveLength(PAGINES_DEL_SISTEMA);
  mocks.notes = [{ id: 'n-esb', title: 'Reg a goteig' }];
  // Un valor nou del proveïdor amb el mateix pageCopy, com en cada revalidació.
  mocks.core = { ...NUCLI };
  rerender(<NotesSection />);
  const despres = publicacions(mocks.model.items);
  despres.forEach((item, posicio) => expect(item).toBe(abans[posicio]));
});
