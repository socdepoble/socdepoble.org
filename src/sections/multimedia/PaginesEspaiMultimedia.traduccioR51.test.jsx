/* R51 (P0-46; troballa R12G-SB-01) · La foto derivada d'una publicació del
   Mur, del Mercat o de l'Agenda (mediaContent.js · fotosDelMur,
   fotosDelMercat, fotosDeLAgenda) copiava el títol de l'article però no el
   seu translation_mode: la fitxa de la foto (FitxaWeb) oferia el Traduir de
   la pàgina amb el títol d'una publicació amb 'none' o amb la revisada (al
   títol i a la fila «Publicat a»). Ara la foto porta el mode i la llengua
   original de l'article i la fitxa en demana el veredicte del pla. I, com a
   TC3.2, la marca de visibilitat de l'article: la foto d'una fila del veïnat
   (section_submissions, ownerUserId) ja no es tracta com a pública, sense
   copiar-ne qui la va publicar. L'arnés de
   PaginesEspaiMultimedia.traduccio.test.jsx: la Pàgina Universal en registra
   les props i només compta `traduccio`. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';

const mocks = vi.hoisted(() => ({ pagines: [] }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => {
    mocks.pagines.push(props);
    return null;
  }
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }), useUIStateOpcional: () => null }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
import { FitxaWeb } from './PaginesEspaiMultimedia.jsx';
import { fotosDeLAgenda, fotosDelMercat, fotosDelMur } from './mediaContent.js';
import { objecteDe, rutaConnectarObjecte } from '../../config/navigation.js';

const t = (_clau, text) => text;
const revisades = Object.fromEntries(['ca', 'es', 'en', 'eu', 'gl']
  .map((codi) => [codi, { title: `Fira revisada ${codi}`, content: `<p>Cos revisat ${codi}</p>`, reviewed: true }]));
const espai = (item) => ({
  t, cens: null, obriVisor: () => {}, visorObert: false, refTitol: null,
  cataleg: { totes: [item], grupsMes: [] }, membresDe: () => [item], etiquetaDe: () => 'Galeria inventada'
});
const traduccioDe = (item) => {
  mocks.pagines.length = 0;
  render(<MemoryRouter rutaInicial="/multimedia"><FitxaWeb espai={espai(item)} item={item} /></MemoryRouter>);
  const props = mocks.pagines.at(-1);
  cleanup();
  return props?.traduccio;
};

/* Una publicació amb foto per a cada constructor (Mur, Mercat i Agenda). */
const CONSTRUCTORS = [
  ['del Mur', fotosDelMur, (extra) => ({ id: 'p1', type: 'feed', title: 'Fira de l’Oli', image: '/assets/uploads/fira.webp', ...extra })],
  ['del Mercat', fotosDelMercat, (extra) => ({ id: 'm1', type: 'market', title: 'Oli de la Torre', images: ['/assets/uploads/oli.webp'], ...extra })],
  ['de l’Agenda', fotosDeLAgenda, (extra) => ({ id: 'e1', type: 'event', title: 'Concert de la Banda', image_url: '/assets/uploads/concert.webp', ...extra })]
];
const fotoDe = (constructor, article) => {
  const [foto] = constructor([article]);
  expect(foto).toBeTruthy();
  return foto;
};

beforeEach(() => { mocks.pagines.length = 0; });
afterEach(cleanup);

describe.each(CONSTRUCTORS)('la foto %s', (_, constructor, article) => {
  test.each([
    ['«none»', { translation_mode: 'none', source_language: 'ca' }],
    ['la revisada', { translation_mode: 'curated_5_langs', source_language: 'es', translations: revisades }],
    ['un mode que no existix', { translation_mode: 'auto', source_language: 'ca' }],
    ['l’automàtica sense llengua original', { translation_mode: 'on_the_fly' }]
  ])('d’una publicació amb %s: la fitxa no oferix el Traduir de la pàgina', (__, extra) => {
    const foto = fotoDe(constructor, article(extra));
    expect(foto.translation_mode).toBe(extra.translation_mode);
    expect(traduccioDe(foto)).toBe(false);
  });

  test.each([
    ['sense mode (el de sempre)', {}],
    ['amb l’automàtica', { translation_mode: 'on_the_fly', source_language: 'ca' }]
  ])('d’una publicació %s: la fitxa es traduïx', (__, extra) => {
    expect(traduccioDe(fotoDe(constructor, article(extra)))).toBe(true);
  });

  test('d’una publicació sense mode ni marca: cap clau nova a la foto (la llavor no canvia)', () => {
    const foto = fotoDe(constructor, article({}));
    for (const clau of ['translation_mode', 'source_language', 'visibility', 'translations']) expect(Object.hasOwn(foto, clau), clau).toBe(false);
  });

  test('TC3.2 · d’una fila del veïnat (ownerUserId): no és pública, sense copiar qui la va publicar', () => {
    const foto = fotoDe(constructor, article({ ownerUserId: 'veina-u1' }));
    expect(foto.visibility).toBe('members');
    expect(Object.hasOwn(foto, 'ownerUserId')).toBe(false);
    expect(traduccioDe(foto)).toBe(false);
    // Connectar de la fitxa, el de sempre: cap identificador de la persona a la ruta.
    expect(rutaConnectarObjecte(objecteDe(foto, 'multimedia'))).not.toContain('veina-u1');
    // Amb la marca encara que siga null (elementDeFilaPublicada la posa sempre), igual.
    expect(fotoDe(constructor, article({ ownerUserId: null })).visibility).toBe('members');
  });
});

describe('la protecció de l’article, llegida com la llig el pla', () => {
  test('una visibilitat que no és text no tomba el constructor i compta com a «members»; «public», cap clau', () => {
    expect(fotoDe(fotosDelMur, CONSTRUCTORS[0][2]({ visibility: JSON.parse('{"toString":0}') })).visibility).toBe('members');
    expect(Object.hasOwn(fotoDe(fotosDelMur, CONSTRUCTORS[0][2]({ visibility: 'public' })), 'visibility')).toBe(false);
    expect(fotoDe(fotosDelMur, CONSTRUCTORS[0][2]({ visibility: 'private' })).visibility).toBe('private');
  });

  test('un accessor de translation_mode no s’executa ni viatja (el pla el compta com a absent)', () => {
    let cridat = false;
    const article = Object.defineProperty(CONSTRUCTORS[0][2]({}), 'translation_mode', { enumerable: false, get() { cridat = true; return 'none'; } });
    const foto = fotoDe(fotosDelMur, article);
    expect(cridat).toBe(false);
    expect(Object.hasOwn(foto, 'translation_mode')).toBe(false);
  });
});
