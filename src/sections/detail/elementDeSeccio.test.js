/**
 * T54 · El resolvedor únic de l'element original: el mateix per al detall de
 * la ruta (ItemDetailSection), per a la mini-card de Connectar i per al
 * lector de connexions del MAS.
 */
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mur: null, core: null, media: null, t: (_, alternativa) => alternativa
}));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
import { paginaDElement, trobaElement, useElementDeSeccio, useOriginalDeConnexio } from './elementDeSeccio.js';
import {
  buildEventsDetailSectionMeta, buildMercatDetailSectionMeta, buildMultimediaDetailSectionMeta, buildMurDetailSectionMeta,
  buildPoblesDetailSectionMeta
} from './detailSectionMeta.jsx';
import { COPYRIGHT_SDP, COPYRIGHT_VIQUIPEDIA, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { rutaXatDePagina } from '../../config/navigation.js';
import { objecteDelPobleXat } from '../pobles/xatDelPoble.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { MOCK_TOWNS } from '../pobles/townsSeed.js';
import { nomDeLaGent } from '../pobles/nomsDelPoble.js';

const SAMARRETA = { id: 'samarreta-socdepoble', slug: 'samarreta', title: 'Samarreta', image_url: '/assets/x.png', author_name: 'Sóc de Poble' };

afterEach(cleanup);
beforeEach(() => {
  mocks.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [SAMARRETA] };
  mocks.core = { status: 'ready', towns: [] };
  mocks.media = { status: 'ready', mediaItems: [] };
});

test('trobaElement: per id o per slug; sense clau, o amb una clau que no hi és, null', () => {
  const seccio = buildMercatDetailSectionMeta({ marketItems: [SAMARRETA, { id: 7, title: 'Mel' }], t: mocks.t });
  expect(trobaElement(seccio, 'samarreta-socdepoble')).toBe(SAMARRETA);
  expect(trobaElement(seccio, 'samarreta')).toBe(SAMARRETA);
  expect(trobaElement(seccio, 7).title).toBe('Mel');
  expect(trobaElement(seccio, '')).toBeNull();
  expect(trobaElement(seccio, undefined)).toBeNull();
  expect(trobaElement(seccio, 'no-hi-és')).toBeNull();
  expect(trobaElement(null, 'samarreta')).toBeNull();
  // Un element sense slug no casa amb la clau «undefined».
  expect(trobaElement(seccio, 'undefined')).toBeNull();
});

/* Auditoria 261007 (B) · El slug d'una publicació (ve del payload) no fa
   ombra a l'id d'una altra: l'id mana a tota la llista, encara que la que
   porta el slug vaja davant (les files arriben de la més nova a la més vella). */
test('trobaElement: l’id mana a tota la llista; el slug només si cap id no hi casa', () => {
  const intrusa = { id: 'b', slug: 'a', title: 'Intrusa' };
  const original = { id: 'a', title: 'Original' };
  const seccio = buildMurDetailSectionMeta({ feedPosts: [intrusa, original], t: mocks.t });
  expect(trobaElement(seccio, 'a')).toBe(original);
  expect(trobaElement(seccio, 'b')).toBe(intrusa);
  // Sense cap id que hi case, el slug continua valent.
  const nomesSlug = buildMurDetailSectionMeta({ feedPosts: [intrusa], t: mocks.t });
  expect(trobaElement(nomesSlug, 'a')).toBe(intrusa);
  // El mateix camí per al resolvedor dels proveïdors (detall, Connectar i MAS).
  mocks.mur = { status: 'ready', feedPosts: [intrusa, original], events: [], marketItems: [] };
  expect(renderHook(() => useElementDeSeccio('mur', 'a')).result.current.item).toBe(original);
});

test('paginaDElement: els drets i la data de la publicació, com el detall de la ruta', () => {
  const seccio = buildMurDetailSectionMeta({ feedPosts: [], t: mocks.t });
  const item = { id: 'cc', title: 'Recepta de coca', copyright: 'CC BY 4.0', image_url: '/assets/coca.png',
    created_at: '2026-09-01T10:00:00.000Z', publish_date: '2026-10-05T08:30:00.000Z', author_name: 'Pepa', author_org_id: 'forn' };
  const pagina = paginaDElement(seccio, item);
  expect(pagina).toMatchObject({
    title: 'Recepta de coca', heroImage: '/assets/coca.png', heroAlt: 'Recepta de coca', copyright: 'CC BY 4.0',
    authorName: 'Pepa', authorHref: '/empresa/forn',
    labels: [{ text: 'Publicació', className: 'sdp-badge-system' }, { text: 'cc', className: 'sdp-badge-category' }],
    /* T51 · el format únic (dd/mm/aa i hh:mm) i un ISO de veres. */
    ...dataHoraDeBarra({ publicat: '2026-10-05T08:30:00.000Z' })
  });
  expect(pagina.date).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
  expect(pagina.time).toMatch(/^\d{2}:\d{2}$/);
  expect(new Date(pagina.dateTime).getTime()).toBe(Date.parse('2026-10-05T08:30:00Z'));
  const vella = paginaDElement(seccio, { id: 'v', title: 'Crònica', created_at: '2026-08-15T10:00:00.000Z' });
  expect(vella.copyright).toBe(COPYRIGHT_SDP);
  expect(vella).toMatchObject(dataHoraDeBarra({ creat: '2026-08-15T10:00:00.000Z' }));
  expect(vella.authorHref).toBeNull();
});

/* Revisió de l'Onada 5 · L'entradilla és la de l'element: el content d'una
   publicació és el cos HTML, que ja es pinta davall, i no es repetix com a
   <p class="lead"> (ni a l'entradilla de la seua targeta incrustada). */
test('Onada 5 · una publicació del Mur amb content HTML i sense entradilla no porta lead', () => {
  const seccio = buildMurDetailSectionMeta({ feedPosts: [], t: mocks.t });
  const item = { id: 'h', title: 'Festa', content: '<p>Hola <strong>poble</strong></p>', created_at: '2026-09-01T10:00:00.000Z' };
  expect(paginaDElement(seccio, item).lead).toBeUndefined();
  expect(paginaDElement(seccio, { ...item, entradilla: 'La festa major' }).lead).toBe('La festa major');
  mocks.mur = { status: 'ready', feedPosts: [item], events: [], marketItems: [] };
  expect(renderHook(() => useOriginalDeConnexio({ sectionId: 'mur', itemId: 'h' })).result.current.targeta.entradilla).toBe('');
});

/* Onada 5 (ordre del Mestre, 261008) · La pàgina d'un poble: les metes no
   porten id i el poble es reconeix per la seua llista (/pobles). La barra
   taronja signa amb la gent i el poble i porta al seu xat; l'entradilla és el
   text de la Viquipèdia; la província i la comarca, etiquetes; el logotip de
   Sóc de Poble damunt de l'H1; i el copyright, el de la Viquipèdia. Una llavor
   pròpia per a l'anatomia; la paritat amb MOCK_TOWNS té la seua prova, més
   avall. */
const POBLE = Object.freeze({
  id: 'la-torre-de-les-macanes', type: 'town', author: 'Gent de la Torre', title: 'La Torre de les Maçanes',
  provincia: 'Alacant', comarca: 'L’Alacantí', population: '700 hab', image_url: '/assets/towns/torre/hero.webp',
  content: 'La Torre de les Maçanes és una vila i municipi del País Valencià.'
});

test('Onada 5 · paginaDElement d’un poble: la gent, el poble, l’entradilla, les etiquetes, el logotip i el copyright', () => {
  const seccio = buildPoblesDetailSectionMeta({ towns: [], t: mocks.t });
  const pagina = paginaDElement(seccio, POBLE);
  expect(pagina).toMatchObject({
    title: 'Gent de la Torre',
    subtitle: 'La Torre de les Maçanes',
    lead: POBLE.content,
    authorName: POBLE.author,
    authorLocation: 'La Torre de les Maçanes',
    /* Onada 6 (pla 261009_0245, ítem 4) · El xat de la gent: el descriptor
       d'objecteDelPobleXat, amb el nom de la gent com a títol. */
    authorHref: rutaXatDePagina(objecteDelPobleXat(POBLE)),
    labels: [
      { text: 'Poble', className: 'sdp-badge-system' },
      { text: 'Alacant', className: 'sdp-badge-category' },
      { text: 'L’Alacantí', className: 'sdp-badge-tag' }
    ],
    copyright: COPYRIGHT_VIQUIPEDIA
  });
  expect(pagina.authorHref).toMatch(/^\/xat\?sobre=poble:la-torre-de-les-macanes&/);
  expect(pagina.logoEntitat).toEqual(DEFAULT_AUTHOR.logo);
  // Sense província ni comarca, només la de sistema; uns drets propis manen.
  const sense = paginaDElement(seccio, { ...POBLE, provincia: ' ', comarca: undefined, copyright: 'CC BY 4.0' });
  expect(sense.labels).toEqual([{ text: 'Poble', className: 'sdp-badge-system' }]);
  expect(sense.copyright).toBe('CC BY 4.0');
  // Una entradilla pròpia mana sobre el content.
  expect(paginaDElement(seccio, { ...POBLE, entradilla: 'Vila de l’Alacantí' }).lead).toBe('Vila de l’Alacantí');
});

/* Onada 5 (F5, fase 3) · Sense author, l'H1 (getTitle) i la barra taronja
   signen amb la mateixa regla, nomDeLaGent de nomsDelPoble.js (la de la
   targeta de /pobles), sobre el nom del poble i no sobre l'H1. El nom curt
   «Gent de la Torre» és una dada de la llavor, no un literal del codi. */
test('Onada 5 · sense author, la barra i l’H1 deriven la gent del nom del poble amb nomDeLaGent', () => {
  const seccio = buildPoblesDetailSectionMeta({ towns: [], t: mocks.t });
  const pagina = (item) => paginaDElement(seccio, item);
  for (const [nom, gent] of [
    ['La Torre de les Maçanes', 'Gent de la Torre de les Maçanes'],
    ['Orxeta', "Gent d'Orxeta"],
    ['Sella', 'Gent de Sella'],
    ['El Campello', 'Gent del Campello']
  ]) {
    expect(nomDeLaGent(nom)).toBe(gent);
    expect(pagina({ id: 'p', title: nom })).toMatchObject({ title: gent, authorName: gent, authorLocation: nom });
  }
  // Un poble remot que només porta `name`.
  expect(pagina({ id: 'i', name: 'Ibi' })).toMatchObject({ title: "Gent d'Ibi", authorName: "Gent d'Ibi", authorLocation: 'Ibi' });
  // Sense cap nom, el de sempre.
  expect(pagina({ id: 'x' })).toMatchObject({ title: 'Gent de Poble', authorName: 'Gent de Poble' });
  // Un author de la fitxa mana sobre la regla, a l'H1 i a la barra.
  expect(pagina({ id: 't', title: 'La Torre de les Maçanes', author: 'Gent de la Torre' }))
    .toMatchObject({ title: 'Gent de la Torre', authorName: 'Gent de la Torre' });
});

/* Llei del Píxel · Els 9 pobles de la llavor porten author: l'H1 i la barra
   taronja de la seua pàgina són exactament els d'abans de la fase 3. */
test('Onada 5 · la llavor es pinta idèntica: l’H1 i la barra del poble són el seu author', () => {
  const seccio = buildPoblesDetailSectionMeta({ towns: MOCK_TOWNS, t: mocks.t });
  for (const town of MOCK_TOWNS) {
    expect(town.author).toBeTruthy();
    expect(paginaDElement(seccio, town)).toMatchObject({ title: town.author, authorName: town.author, authorLocation: town.title });
  }
  expect(paginaDElement(seccio, trobaElement(seccio, 'la-torre-de-les-macanes')).title).toBe('Gent de la Torre');
});

/* Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
   PROHIBIDES (PRIVACITAT).» La portada i l'avatar de la barra taronja del
   detall passen pel mode estricte: una de fora torna null (cap petició; null,
   no undefined, perquè PageFrame no hi pose el logotip de Sóc de Poble), i
   una de pròpia torna intacta. Ho hereta la targeta de l'original (Connectar
   i el lector del MAS). */
test('Decisió 3 · paginaDElement: la portada i l’avatar de fora no es demanen; els propis, intactes', () => {
  const seccio = buildMurDetailSectionMeta({ feedPosts: [], t: mocks.t });
  const deFora = paginaDElement(seccio, { id: 'f', title: 'Festa', author_name: 'Pepa',
    image: 'https://rastreig.example/p.gif', author_avatar: 'https://lh3.googleusercontent.com/a/pepa.png' });
  expect(deFora.heroImage).toBeNull();
  expect(deFora.authorAvatar).toBeNull();
  expect(paginaDElement(seccio, { id: 'g', title: 'Festa', imageSrc: '/\\rastreig.example/p.gif' }).heroImage).toBeNull();
  expect(paginaDElement(seccio, { id: 'h', title: 'Festa', image_url: 'https://avatars.githubusercontent.com/u/1' }).heroImage).toBeNull();

  const propia = paginaDElement(seccio, { id: 'p', title: 'Festa', image: '/assets/mur/festa.webp', author_avatar: '/assets/gent/pepa.webp' });
  expect(propia).toMatchObject({ heroImage: '/assets/mur/festa.webp', authorAvatar: '/assets/gent/pepa.webp' });
  const ref = 'sdp-media://mitjans/poble/u/general/f.webp';
  expect(paginaDElement(seccio, { id: 's', title: 'Festa', image: ref }).heroImage).toBe(ref);
  // Sense avatar, com sempre: undefined (PageFrame hi posa el de sèrie).
  expect(paginaDElement(seccio, { id: 'v', title: 'Festa' }).authorAvatar).toBeUndefined();
  // Un producte del Mercat: la portada és la primera foto, i una de fora tampoc.
  const mercat = buildMercatDetailSectionMeta({ marketItems: [], t: mocks.t });
  expect(paginaDElement(mercat, { id: 'm', title: 'Mel', images: ['https://rastreig.example/mel.jpg'] }).heroImage).toBeNull();
  expect(paginaDElement(mercat, { id: 'm', title: 'Mel', images: ['/assets/mercat/mel.webp'] }).heroImage).toBe('/assets/mercat/mel.webp');
});

/* Revisió adversarial del 261007 · És una regla del Mur: les tres seccions
   que el Mur llig (publicacions, Mercat i agenda, reconegudes per la seua
   llista) passen pel mode estricte; Pobles i Multimèdia, com abans (Llei del
   Píxel), fins que el Mestre diga si també hi van. */
test('Decisió 3 · només les seccions del Mur; Pobles i Multimèdia es pinten com abans', () => {
  const GOOGLE = 'https://lh3.googleusercontent.com/a/pepa.png';
  const RASTREIG = 'https://rastreig.example/p.gif';
  const delMur = [
    [buildMurDetailSectionMeta({ feedPosts: [], t: mocks.t }), { image: RASTREIG }],
    [buildMercatDetailSectionMeta({ marketItems: [], t: mocks.t }), { images: [RASTREIG] }],
    [buildEventsDetailSectionMeta({ events: [], t: mocks.t }), { image_url: RASTREIG }]
  ];
  for (const [seccio, imatge] of delMur) {
    const pagina = paginaDElement(seccio, { id: 'x', title: 'X', author_name: 'Pepa', author_avatar: GOOGLE, ...imatge });
    expect([pagina.heroImage, pagina.authorAvatar], seccio.listPath).toEqual([null, null]);
  }
  const poble = paginaDElement(buildPoblesDetailSectionMeta({ towns: [], t: mocks.t }),
    { id: 'sella', title: 'Sella', image_url: RASTREIG, author_avatar: GOOGLE });
  expect([poble.heroImage, poble.authorAvatar]).toEqual([RASTREIG, GOOGLE]);
  const media = paginaDElement(buildMultimediaDetailSectionMeta({ mediaItems: [], t: mocks.t }), { id: 'v1', title: 'Vídeo', src: RASTREIG });
  expect(media.heroImage).toBe(RASTREIG);
});

/* Revisió adversarial del 261007 · A l'app nativa (capacitor://localhost) un
   camí propi es resolia contra un origen 'capacitor:' i el mode estricte el
   rebutjava: la portada PRÒPIA del detall desapareixia (abans PageFrame la
   pintava sense filtre). Ara es pinta; una de fora, tampoc ací. */
test('Decisió 3 · a l’app nativa (capacitor://localhost), la portada pròpia del detall es conserva', () => {
  vi.stubGlobal('location', { origin: 'capacitor://localhost', protocol: 'capacitor:', host: 'localhost', hostname: 'localhost',
    href: 'capacitor://localhost/mur/p', pathname: '/mur/p', search: '', hash: '' });
  try {
    const seccio = buildMurDetailSectionMeta({ feedPosts: [], t: mocks.t });
    expect(paginaDElement(seccio, { id: 'p', title: 'Festa', image: '/assets/mur/festa.webp', author_avatar: '/assets/gent/pepa.webp' }))
      .toMatchObject({ heroImage: '/assets/mur/festa.webp', authorAvatar: '/assets/gent/pepa.webp' });
    const deFora = paginaDElement(seccio, { id: 'f', title: 'Festa', image: '//rastreig.example/p.gif', author_avatar: 'https://lh3.googleusercontent.com/a/pepa.png' });
    expect([deFora.heroImage, deFora.authorAvatar]).toEqual([null, null]);
  } finally {
    vi.unstubAllGlobals();
  }
});

test('Decisió 3 · la targeta de l’original (Connectar, MAS) no porta la portada de fora', () => {
  const item = { id: 'f', title: 'Festa', image: 'https://rastreig.example/p.gif', author_name: 'Pepa' };
  mocks.mur = { status: 'ready', feedPosts: [item], events: [], marketItems: [] };
  const { result } = renderHook(() => useOriginalDeConnexio({ sectionId: 'mur', itemId: 'f' }));
  expect(result.current.targeta.imatge).toBe('');
});

/* T51 · la regla de data de l'element viu a editorial.js (dataDElement, amb
   les seues proves); ací, que la pàgina de detall la porta. */
test('T51 · paginaDElement: una publicació editada després de publicar-se porta la data d’edició (updated_at)', () => {
  const seccio = buildMurDetailSectionMeta({ feedPosts: [], t: mocks.t });
  const editada = paginaDElement(seccio, { id: 'e', title: 'Fira', created_at: '2026-09-01T10:00:00', updated_at: '2026-09-20T12:15:00' });
  expect(editada).toMatchObject({ date: '20/09/26', time: '12:15' });
  expect(paginaDElement(seccio, { id: 's', title: 'Sense data' })).toMatchObject({ time: '', date: '', dateTime: '' });
});

test('useElementDeSeccio: troba l’element del Mercat amb la seua foto', () => {
  const { result } = renderHook(() => useElementDeSeccio('mercat', 'samarreta-socdepoble'));
  expect(result.current.estat).toBe('trobat');
  expect(result.current.item).toBe(SAMARRETA);
  expect(result.current.section.getImage(result.current.item)).toBe('/assets/x.png');
});

test('useElementDeSeccio: «carregant» mentre la seua font carrega; «absent» si no hi és', () => {
  mocks.mur = { status: 'loading', feedPosts: [], events: [], marketItems: [] };
  expect(renderHook(() => useElementDeSeccio('mur', 'p1')).result.current.estat).toBe('carregant');
  // Els Pobles no depenen del Mur: si el seu contingut ja és llest, no hi és.
  expect(renderHook(() => useElementDeSeccio('pobles', 'sella')).result.current.estat).toBe('absent');
  mocks.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [] };
  expect(renderHook(() => useElementDeSeccio('mercat', 'samarreta-socdepoble')).result.current).toMatchObject({ item: null, estat: 'absent' });
});

test('useElementDeSeccio: «error» si la seua font no s’ha pogut carregar, no «absent»', () => {
  mocks.mur = { status: 'error', error: new Error('Failed to fetch'), feedPosts: [], events: [], marketItems: [] };
  expect(renderHook(() => useElementDeSeccio('mercat', 'samarreta-socdepoble')).result.current).toMatchObject({ item: null, estat: 'error' });
  // Només compta la font de la secció: els Pobles, amb el seu contingut llest, no hi són.
  expect(renderHook(() => useElementDeSeccio('pobles', 'sella')).result.current.estat).toBe('absent');
  mocks.media = { status: 'error', mediaItems: [] };
  expect(renderHook(() => useElementDeSeccio('multimedia', 'v1')).result.current.estat).toBe('error');
  // Una secció que no es resol ací continua sent «absent», falle el que falle.
  expect(renderHook(() => useElementDeSeccio('perfil', 'x')).result.current.estat).toBe('absent');
});

test('useElementDeSeccio: perfils, pàgines, notes i claus estranyes no es resolen ací', () => {
  for (const seccio of ['perfil', 'pagina', 'notes', '', 'constructor', undefined]) {
    const { result } = renderHook(() => useElementDeSeccio(seccio, 'x'));
    expect(result.current).toEqual({ section: null, item: null, estat: 'absent' });
  }
});

/* ── T71 · el resolvedor únic de l'original d'una connexió ── */
const ANIMA_IMATGE = '/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp';

test('T71 · useOriginalDeConnexio: un element del Mercat, amb la targeta de l’original (no la de l’URL)', () => {
  const origen = { sectionId: 'mercat', itemId: 'samarreta-socdepoble', titol: 'Títol de l’URL', autorNom: 'Algú de l’URL', ruta: '/iaia' };
  const { result } = renderHook(() => useOriginalDeConnexio(origen));
  expect(result.current).toMatchObject({ tipus: 'seccio', item: SAMARRETA, estat: 'trobat', page: null, pageKey: null });
  expect(result.current.targeta).toMatchObject({
    titol: 'Samarreta', imatge: '/assets/x.png', autor: { nom: 'Sóc de Poble', propi: true }
  });
});

test('T71 · una pàgina de text (/iaia): L’Ànima de la IAIA amb la seua foto i l’autor de sèrie, mai el de l’URL', () => {
  const origen = { tipus: 'connexio', sectionId: '', itemId: '/iaia', ruta: '/iaia', titol: 'Un altre títol', autorNom: 'Foraster', objecte: 'pagina' };
  const { result } = renderHook(() => useOriginalDeConnexio(origen));
  expect(result.current).toMatchObject({ tipus: 'pagina', pageKey: 'anima', page: PAGE_COPY.anima, estat: 'trobat', item: null });
  /* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T6): la
     ruta de l'autor de sèrie ja no és null, és la del projecte, la mateixa
     que la barra taronja de la pàgina (PageFrame, DEFAULT_AUTHOR.href). */
  expect(result.current.targeta).toMatchObject({
    titol: "L'Ànima de la IAIA", subtitol: PAGE_COPY.anima.subtitle, entradilla: PAGE_COPY.anima.lead,
    imatge: ANIMA_IMATGE, autor: { nom: DEFAULT_AUTHOR.name, propi: false, ruta: '/projecte' }
  });
  expect(result.current.targeta.autor.ruta).toBe(DEFAULT_AUTHOR.href);
  expect(result.current.targeta.data).toEqual(dataHoraDeBarra({ creat: PAGE_COPY.anima.date }));
  expect(JSON.stringify(result.current.targeta)).not.toMatch(/Foraster|Un altre títol/);
});

/* T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · La targeta d'un
   element porta on porta la barra taronja del seu detall: la pàgina de qui
   signa (l'entitat pilot, al projecte; una altra, al seu perfil) o, amb
   l'autor de sèrie, el projecte. Un nom propi sense identitat, cap ruta. */
test('T6 · la ruta de l’autor de la targeta d’un element és la de la barra del seu detall', () => {
  const ruta = (item) => {
    mocks.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [item] };
    return renderHook(() => useOriginalDeConnexio({ sectionId: 'mercat', itemId: item.id })).result.current.targeta.autor;
  };
  expect(ruta({ id: 'a', title: 'Sense autor' })).toEqual({ nom: DEFAULT_AUTHOR.name, propi: false, ruta: '/projecte' });
  expect(ruta({ id: 'b', title: 'Del forn', author_name: 'Forn', author_org_id: 'forn' })).toEqual({ nom: 'Forn', propi: true, ruta: '/empresa/forn' });
  expect(ruta({ id: 'c', title: 'Del projecte', author_name: 'Sóc de Poble', author_org_id: 'socdepoble' })).toMatchObject({ ruta: '/empresa/socdepoble' });
  expect(ruta({ id: 'd', title: 'Sense identitat', author_name: 'Pepa' })).toEqual({ nom: 'Pepa', propi: true, ruta: null });
  /* La de la barra: paginaDElement porta el mateix enllaç (o cap, i PageFrame hi posa el de sèrie). */
  const seccio = buildMercatDetailSectionMeta({ marketItems: [], t: mocks.t });
  expect(paginaDElement(seccio, { id: 'b', title: 'Del forn', author_name: 'Forn', author_org_id: 'forn' }).authorHref).toBe('/empresa/forn');
});

test('T71 · el copy del core mana; una pàgina que encara no és al contingut diu l’estat del core', () => {
  mocks.core = { status: 'ready', towns: [], pageCopy: { anima: { title: 'Ànima del core', image: '/assets/nova.png' } } };
  expect(renderHook(() => useOriginalDeConnexio({ ruta: '/iaia' })).result.current.targeta).toMatchObject({ titol: 'Ànima del core', imatge: '/assets/nova.png' });
  mocks.core = { status: 'loading', towns: [], pages: [] };
  expect(renderHook(() => useOriginalDeConnexio({ ruta: '/page/festes' })).result.current).toMatchObject({ tipus: null, estat: 'carregant', targeta: null });
  mocks.core = { status: 'error', towns: [] };
  expect(renderHook(() => useOriginalDeConnexio({ ruta: '/page/festes' })).result.current.estat).toBe('error');
  mocks.core = { status: 'ready', towns: [], pages: [{ slug: 'festes', title: 'Festes' }] };
  expect(renderHook(() => useOriginalDeConnexio({ ruta: '/page/festes' })).result.current).toMatchObject({ tipus: 'pagina', pageKey: 'festes', estat: 'trobat' });
});

test('T71 · absent: un perfil, /disseny, una ruta estranya o un element de secció que no hi és no es fan passar per pàgina', () => {
  const casos = [
    { sectionId: 'perfil', itemId: 'u1', ruta: '/gent/u1' },
    { sectionId: '', itemId: '/disseny', ruta: '/disseny' },
    { sectionId: '', itemId: '/connectar', ruta: '/connectar?item_id=x' },
    // Secció coneguda sense l'element: la ruta desada no la substituïx.
    { sectionId: 'mercat', itemId: 'no-hi-es', ruta: '/iaia' },
    {}, null, undefined
  ];
  for (const origen of casos) {
    const { result } = renderHook(() => useOriginalDeConnexio(origen));
    expect(result.current).toMatchObject({ tipus: null, item: null, page: null, targeta: null, estat: 'absent' });
  }
});
