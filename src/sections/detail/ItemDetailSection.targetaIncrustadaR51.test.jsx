/* R51 (P0-46 / IDEA-177; forat G2 de l'auditoria R11) · Una publicació P2
   del Mur (/mur/p2) porta incrustada la targeta d'una altra, P1. La targeta
   incrustada es pinta amb les dades vives de P1 (SincronitzacioTargetes ·
   propsDeLOriginal → targetaDeLaPagina → CosAmbTargetes → UniversalCard), i
   ara també amb el seu translation_mode: amb 'none', la revisada o un mode
   invàlid, el botó Traduir de la targeta incrustada no hi és (cap text de P1
   cap al motor); sense mode o amb l'automàtica, el Traduir de sempre. Abast
   mínim: la targeta continua pintant el text de l'original de P1. Els
   mateixos dobles que ItemDetailSection.traduccioR51.test.jsx. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sectionId: 'mur', itemId: null, navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa, language: 'ca',
  mur: { events: [], feedPosts: [], marketItems: [] }, towns: [], pageCopy: undefined, notes: [],
  sessio: { currentUser: null, estat: 'fora', rol: null, esSuperadmin: false }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useRouter: () => ({ memoria: false }),
  useParams: () => ({ sectionId: mocks.sectionId, itemId: mocks.itemId }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/${mocks.sectionId}/${mocks.itemId}`, state: null }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: mocks.towns, pageCopy: mocks.pageCopy }) }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: mocks.notes, status: 'ready' }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [] }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: mocks.t, language: mocks.language })
}));
vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => mocks.sessio,
  useSessioOpcional: () => mocks.sessio
}));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
import ItemDetailSection from './ItemDetailSection.jsx';
import { propsDeLOriginal } from './SincronitzacioTargetes.jsx';
import { planTraduccioPublicacio } from '../../components/universal/traduccio/planTraduccioPublicacio.js';
import { planTraduccioPagina } from '../text/planTraduccioPagina.js';
import { PAGE_COPY } from '../text/pageContent.js';

const CREAT = '2026-10-20T10:00:00.000Z';
const revisades = Object.fromEntries(['ca', 'es', 'en', 'eu', 'gl']
  .map((codi) => [codi, { title: `Crònica revisada ${codi}`, content: `<p>Cos revisat ${codi}</p>`, reviewed: true }]));
/* La targeta de P1 dins del cos de P2, amb la instantània que es desa en inserir-la. */
const COS_P2 = '<p>Ací va la crònica de la fira.</p>'
  + '<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="dreta">'
  + '<div data-sdp-targeta="publicacio:p1" class="sdp-targeta" data-ruta="/mur/p1" data-titol="Instantània de P1" data-autor="Sóc de Poble">'
  + '<a href="/mur/p1">Instantània de P1</a></div></div>';

function pinta(extraP1) {
  const p1 = { id: 'p1', type: 'feed', title: 'La crònica original', description: 'Entradeta de P1', created_at: CREAT, ...extraP1 };
  const p2 = { id: 'p2', type: 'feed', title: 'La pàgina que incrusta', content: COS_P2, created_at: CREAT };
  mocks.sectionId = 'mur';
  mocks.itemId = 'p2';
  mocks.mur = { events: [], feedPosts: [p1, p2], marketItems: [] };
  return render(<ItemDetailSection />).container;
}
const targetaIncrustada = (container) => container.querySelector('.sdp-targetes > .sdp-targeta > article.sp-card');
const accions = (targeta) => [...targeta.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label'));

beforeEach(() => { vi.clearAllMocks(); mocks.language = 'ca'; mocks.pageCopy = undefined; });
afterEach(cleanup);

test.each([
  ['sense mode (el de sempre)', {}],
  ['amb l’automàtica', { translation_mode: 'on_the_fly', source_language: 'ca' }]
])('%s: la targeta incrustada de P1, amb les dades vives, porta Traduir', (_, extra) => {
  const targeta = targetaIncrustada(pinta(extra));
  expect(targeta, 'la targeta incrustada es pinta amb UniversalCard').toBeTruthy();
  expect(targeta.querySelector('.sp-card-title').textContent).toBe('La crònica original');
  expect(accions(targeta)[0]).toBe('Traduir La crònica original');
});

test.each([
  ['none', { translation_mode: 'none', source_language: 'ca' }],
  ['la revisada', { translation_mode: 'curated_5_langs', source_language: 'es', translations: revisades }],
  ['un mode que no existix', { translation_mode: 'auto', source_language: 'ca' }]
])('amb %s a P1: la targeta incrustada no porta Traduir (la resta del peu, igual)', (_, extra) => {
  const targeta = targetaIncrustada(pinta(extra));
  expect(targeta).toBeTruthy();
  // Abast mínim: el text de l'original de P1, no la revisada.
  expect(targeta.querySelector('.sp-card-title').textContent).toBe('La crònica original');
  const botons = accions(targeta);
  expect(botons.some((nom) => nom.startsWith('Traduir'))).toBe(false);
  expect(botons).toContain('Compartir La crònica original');
});

/* Troballes RIG2-01 i DIS-R2-01 (paritat DQ-01) · P1 declara l'automàtica
   ('on_the_fly') però no porta cap llengua original de les cinc: el seu pla és
   un error (R51_LANGUAGE_INVALID), i la seua targeta al Mur i el seu detall el
   pinten en l'original, amb l'avís i sense Traduir. La targeta incrustada
   resolta en porta el mateix veredicte: tampoc no hi ha Traduir. Abans només
   hi viatjava el mode, 'on_the_fly' passava el pis mínim d'UniversalCard
   (allowsMachineTranslation) i el text de P1 anava al motor. */
test.each([
  ['sense llengua original', { translation_mode: 'on_the_fly' }],
  ['amb una llengua original de fora de les cinc (fr)', { translation_mode: 'on_the_fly', source_language: 'fr' }]
])('P1 amb l’automàtica %s: el pla és un error i la targeta incrustada no porta Traduir', (_, extra) => {
  expect(planTraduccioPublicacio({ id: 'p1', type: 'feed', title: 'La crònica original', ...extra }, 'ca').tipus).toBe('error');
  const targeta = targetaIncrustada(pinta(extra));
  expect(targeta, 'la targeta incrustada es pinta amb UniversalCard').toBeTruthy();
  expect(targeta.querySelector('.sp-card-title').textContent).toBe('La crònica original');
  const botons = accions(targeta);
  expect(botons.some((nom) => nom.startsWith('Traduir')), botons.join(' | ')).toBe(false);
  expect(botons).toContain('Compartir La crònica original');
});

/* El mateix per a una PÀGINA incrustada (latent: avui cap pàgina de PAGE_COPY
   no declara mode). La pàgina «Drets d'autor» del contingut core, amb el mode
   que se li done ací, incrustada en P2: amb l'automàtica i la seua llengua,
   el Traduir de sempre; amb un pla en error (translation_mode null, que es
   normalitza a l'automàtica, sense llengua original o amb una de fora de les
   cinc), TextSection la pinta sense Traduir (planTraduccioPagina), i la
   targeta incrustada, tampoc. */
const COS_P2_AMB_PAGINA = '<p>Ací van els drets.</p>'
  + '<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="dreta">'
  + '<div data-sdp-targeta="pagina:drets-autor" class="sdp-targeta" data-ruta="/page/drets-autor" data-titol="Instantània de la pàgina">'
  + '<a href="/page/drets-autor">Instantània de la pàgina</a></div></div>';

function pintaAmbPagina(extraPagina) {
  mocks.pageCopy = { 'drets-autor': { ...PAGE_COPY['drets-autor'], ...extraPagina } };
  const p2 = { id: 'p2', type: 'feed', title: 'La pàgina que incrusta', content: COS_P2_AMB_PAGINA, created_at: CREAT };
  mocks.sectionId = 'mur';
  mocks.itemId = 'p2';
  mocks.mur = { events: [], feedPosts: [p2], marketItems: [] };
  return render(<ItemDetailSection />).container;
}
const TITOL_DRETS = PAGE_COPY['drets-autor'].title;

test('una pàgina incrustada amb l’automàtica i la seua llengua porta el Traduir de sempre', () => {
  const targeta = targetaIncrustada(pintaAmbPagina({ translation_mode: 'on_the_fly', source_language: 'ca' }));
  expect(targeta, 'la targeta incrustada es pinta amb UniversalCard').toBeTruthy();
  expect(targeta.querySelector('.sp-card-title').textContent).toBe(TITOL_DRETS);
  expect(accions(targeta)[0]).toBe(`Traduir ${TITOL_DRETS}`);
});

test.each([
  ['translation_mode null (l’automàtica) sense llengua original', { translation_mode: null }],
  ['l’automàtica sense llengua original', { translation_mode: 'on_the_fly' }],
  ['l’automàtica amb una llengua de fora de les cinc (fr)', { translation_mode: 'on_the_fly', source_language: 'fr' }]
])('una pàgina incrustada amb %s: el pla és un error i la targeta no porta Traduir', (_, extra) => {
  expect(planTraduccioPagina({ ...PAGE_COPY['drets-autor'], ...extra }, 'ca').traduccio).toBe(false);
  const targeta = targetaIncrustada(pintaAmbPagina(extra));
  expect(targeta, 'la targeta incrustada es pinta amb UniversalCard').toBeTruthy();
  expect(targeta.querySelector('.sp-card-title').textContent).toBe(TITOL_DRETS);
  const botons = accions(targeta);
  expect(botons.some((nom) => nom.startsWith('Traduir')), botons.join(' | ')).toBe(false);
  expect(botons).toContain(`Compartir ${TITOL_DRETS}`);
});

/* Troballes R12G-BH-01, RIG-01 i D2 · P1 NO es resol (és més vell que la
   finestra carregada del Mur, d'un altre poble, esborrat, o el Mur encara
   carrega): la targeta pinta la instantània de l'HTML, que no porta el
   translation_mode de P1. El mode és desconegut i es tracta com a protegit:
   cap Traduir a la targeta incrustada, i la resta del peu, igual. */
function pintaSenseP1(estatMur = 'ready') {
  const p2 = { id: 'p2', type: 'feed', title: 'La pàgina que incrusta', content: COS_P2, created_at: CREAT };
  mocks.sectionId = 'mur';
  mocks.itemId = 'p2';
  mocks.mur = { events: [], feedPosts: [p2], marketItems: [], status: estatMur };
  return render(<ItemDetailSection />).container;
}

test.each([
  ['fora de la finestra carregada (absent)', 'ready'],
  ['amb el Mur que encara carrega', 'loading'],
  ['amb el Mur en error', 'error']
])('P1 sense resoldre, %s: la instantània de la targeta incrustada no porta Traduir', (_, estatMur) => {
  const targeta = targetaIncrustada(pintaSenseP1(estatMur));
  expect(targeta, 'la targeta incrustada es pinta amb UniversalCard').toBeTruthy();
  expect(targeta.querySelector('.sp-card-title').textContent).toBe('Instantània de P1');
  const botons = accions(targeta);
  expect(botons.some((nom) => nom.startsWith('Traduir')), botons.join(' | ')).toBe(false);
  expect(botons).toContain('Compartir Instantània de P1');
  expect(botons).toContain('Connectar amb Instantània de P1');
});

/* La peça pura: el mode viatja amb les props de dades de l'original (una
   publicació o una pàgina); sense mode, les props de sempre, sense cap clau
   nova (Llei del Píxel). */
test('propsDeLOriginal: el translation_mode de l’original viatja a la targeta; sense mode, cap clau nova', () => {
  const MUR = { id: 'mur', label: 'Mur', getTitle: (item) => item.title, getSubtitle: () => undefined, getImage: () => null };
  const item = { id: 'p1', type: 'feed', title: 'Crònica', created_at: CREAT };
  expect(Object.hasOwn(propsDeLOriginal({ tipus: 'seccio', section: MUR, item }, mocks.t), 'modeTraduccio')).toBe(false);
  expect(propsDeLOriginal({ tipus: 'seccio', section: MUR, item: { ...item, translation_mode: 'none' } }, mocks.t).modeTraduccio).toBe('none');
  const pagina = { title: 'Pàgina', html: '<p>Cos</p>', translation_mode: 'curated_5_langs' };
  expect(propsDeLOriginal({ tipus: 'pagina', page: pagina, pageKey: 'prova' }, mocks.t).modeTraduccio).toBe('curated_5_langs');
});

/* Troballes RIG2-01 i DIS-R2-01 · Amb l'element sencer, la targeta incrustada
   porta el veredicte del pla de l'original (showTranslate: false si el pla no
   oferix Traduir), a més del mode (la defensa en profunditat d'UniversalCard i
   del motor). Amb un pla que oferix Traduir, cap clau nova. */
test('propsDeLOriginal: amb el pla en error, el veredicte del pla viatja amb el mode; amb un pla traduïble, cap clau nova', () => {
  const MUR = { id: 'mur', label: 'Mur', getTitle: (item) => item.title, getSubtitle: () => undefined, getImage: () => null };
  const item = { id: 'p1', type: 'feed', title: 'Crònica', created_at: CREAT };
  const seccio = (extra) => propsDeLOriginal({ tipus: 'seccio', section: MUR, item: { ...item, ...extra } }, mocks.t);
  expect(seccio({ translation_mode: 'on_the_fly' })).toMatchObject({ modeTraduccio: 'on_the_fly', showTranslate: false });
  expect(seccio({ translation_mode: 'on_the_fly', source_language: 'fr' })).toMatchObject({ modeTraduccio: 'on_the_fly', showTranslate: false });
  expect(seccio({ translation_mode: 'none', source_language: 'ca' })).toMatchObject({ modeTraduccio: 'none', showTranslate: false });
  const traduible = seccio({ translation_mode: 'on_the_fly', source_language: 'ca' });
  expect(traduible.modeTraduccio).toBe('on_the_fly');
  expect(Object.hasOwn(traduible, 'showTranslate')).toBe(false);
  const pagina = (extra) => propsDeLOriginal({ tipus: 'pagina', page: { title: 'Pàgina', html: '<p>Cos</p>', ...extra }, pageKey: 'prova' }, mocks.t);
  expect(pagina({ translation_mode: null })).toMatchObject({ modeTraduccio: null, showTranslate: false });
  expect(pagina({ translation_mode: 'on_the_fly', source_language: 'fr' })).toMatchObject({ modeTraduccio: 'on_the_fly', showTranslate: false });
  const paginaTraduible = pagina({ translation_mode: 'on_the_fly', source_language: 'ca' });
  expect(paginaTraduible.modeTraduccio).toBe('on_the_fly');
  expect(Object.hasOwn(paginaTraduible, 'showTranslate')).toBe(false);
  expect(Object.hasOwn(pagina({}), 'showTranslate')).toBe(false);
});

/* Troballa DQ-01 · El mode d'una publicació es llig com el llig el seu pla
   (propietat pròpia de dades): un accessor no s'executa i hi compta com a
   absent, el mateix veredicte que la targeta de l'original al Mur
   (TargetaDelMur · propia). Abans s'executava el getter i el seu valor
   viatjava a la targeta incrustada. */
test('propsDeLOriginal: un accessor de translation_mode no s’executa i la targeta incrustada té el veredicte del pla', () => {
  const MUR = { id: 'mur', label: 'Mur', getTitle: (item) => item.title, getSubtitle: () => undefined, getImage: () => null };
  let cridat = false;
  // No enumerable: cap escampat ({ ...item }) de la targeta no el crida; només una lectura directa.
  const item = Object.defineProperty({ id: 'p1', type: 'feed', title: 'Crònica', created_at: CREAT }, 'translation_mode', {
    enumerable: false, get() { cridat = true; return 'none'; }
  });
  const props = propsDeLOriginal({ tipus: 'seccio', section: MUR, item }, mocks.t);
  expect(cridat).toBe(false);
  expect(Object.hasOwn(props, 'modeTraduccio')).toBe(false);
  expect(planTraduccioPublicacio(item, 'ca')).toBeNull();
});
