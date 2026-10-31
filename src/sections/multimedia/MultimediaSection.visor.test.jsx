/* Onada 0.3 (Gauntlet 261016, M03-M06; pla 261016_1530: «En fer clic sobre
   qualsevol imatge de la galeria a /multimedia, prohibit saltar a cap pàgina
   externa ni a rutes estranyes. S'obri un visor modal») · /multimedia amb el
   router en memòria de veres i el visor de veres (VisorImatges sobre Dialeg):
     · les cel·les són botons; el clic obri el visor i posa ?foto=<id> amb una
       entrada nova a l'historial: tancar torna arrere (Arrere fa el mateix);
     · anterior i següent substituïxen l'entrada; un enllaç directe a ?foto=
       obri el visor i tancar-lo lleva la consulta;
     · el panell: drets per origen, el poble i «Publicat a» amb els seus
       enllaços interns; l'EXIF es llig de la foto oberta (només pròpia, 256
       KB), sense el GPS d'una persona; la resolució, de la foto pintada
       (Gauntlet 261017, C05);
     · en tancar, el focus torna a la cel·la; amb el focus al marc (el clic a
       la foto), el teclat continua (Gauntlet 261017);
     · l'apartat «IAIA» i el cens de public/assets (useCensImatges).
   Bloc E (IDEA-55 + P1-71, Onada 261029_1605) · /multimedia és un
   UniversalWorkspace de tres columnes: la graella és la Fototeca de
   ?categoria=galeria_tots, una cel·la obri la FITXA de la foto (columna del
   detall) i el visor s'obri amb el seu botó «Veure la imatge a pantalla
   completa» (el focus hi torna). Un enllaç directe a ?foto= obri el visor
   damunt de la fitxa i, en tancar-lo, s'hi queda. IAIA i la Cronologia són
   les seues categories. */
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext.jsx';
import { COPYRIGHT_SDP, COPYRIGHT_VIQUIPEDIA } from '../../components/universal/editorial.js';
import { gpsTorre, jpegAmbExif, orientacio, TIPUS } from '../../../tests/helpers/jpegProva.js';

const mocks = vi.hoisted(() => ({ multimedia: null, cens: null, towns: [], locale: null }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('./MultimediaContext', () => ({ useMultimedia: () => mocks.multimedia }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_clau, text) => text }),
  useUIStateOpcional: () => (mocks.locale ? { locale: mocks.locale } : null)
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('./useCensImatges.js', () => ({ useCensImatges: () => mocks.cens }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: mocks.towns }) }));
import MultimediaSection from './MultimediaSection.jsx';
import { oblidaMetadades } from './useMetadadesFoto.js';
import { indexaCens } from './origenImatges.js';

const MITJANS = [
  { id: 'town-tibi', title: 'Tibi', src: '/assets/towns/tibi/1.jpg', tag: 'Poble', source: 'Tibi', created_at: '2026-08-16T08:00:00.000Z', article: { sectionId: 'pobles', id: 'tibi' } },
  { id: 'nano-mur', title: 'Mur', src: '/assets/nano_cards/mur_nano_card.jpg', tag: 'Arxiu', source: 'Nano Banana', origen: 'ia', created_at: '2023-01-01T00:00:00Z' },
  { id: 'foto-javi', title: 'Javi Llinares', src: '/assets/fotos/javi-llinares-perfil-1200px.jpg', tag: 'Arxiu', source: 'Fotògraf Sóc de Poble', origen: 'foto', created_at: '2022-01-01T00:00:00Z' },
  { id: 'feed-fora', title: 'Fora', src: 'https://cdn.example/x.jpg', tag: 'Mur', created_at: '2026-07-01T10:00:00Z', article: { sectionId: 'mur', id: 'fora' } }
];
const CENS = [{ src: '/assets/towns/tibi/2.jpg', titol: 'Tibi, segona vista', ambit: 'poble', origen: 'foto', poble: 'tibi' }];
const MITJANS_DEL_CENS = [{ id: 'cens-towns-tibi-2', title: 'Tibi, segona vista', src: '/assets/towns/tibi/2.jpg', kind: 'image', tag: 'Arxiu', origen: 'foto', ambit: 'poble', poble: 'tibi', sectionId: 'multimedia' }];

let ubicacio = null;
function Sonda() {
  const location = useLocation();
  ubicacio = location;
  return null;
}

function pinta(ruta = '/multimedia?categoria=galeria_tots') {
  return render(<MemoryRouter rutaInicial={ruta}><MultimediaSection /><Sonda /></MemoryRouter>);
}
const foto = () => new URLSearchParams(ubicacio.search).get('foto');
const visor = () => document.querySelector('dialog.sdp-visor');
const obert = () => visor()?.hasAttribute('open') === true;
/* La pàgina de la columna del detall (la Fototeca o la fitxa de la foto). */
const pagina = () => within(document.querySelector('#app-grid-main'));
const BOTO_VISOR = 'Veure la imatge a pantalla completa';
/* La cel·la de la Fototeca obri la fitxa; el botó de la fitxa, el visor. */
const obriAlVisor = (nom) => {
  act(() => pagina().getByRole('button', { name: nom }).click());
  act(() => pagina().getByRole('button', { name: BOTO_VISOR }).click());
};

beforeEach(() => {
  mocks.multimedia = { status: 'ready', mediaItems: MITJANS, mediaTimelineGroups: [] };
  mocks.cens = { mitjans: [], cens: new Map() };
  mocks.towns = [{ id: 'tibi', title: 'Tibi' }];
  mocks.locale = null;
  oblidaMetadades();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/* Revisió adversarial del 261016 (Llei del Píxel) · El botó és l'embolcall
   (.photo-grid__boto) i la cel·la de sempre (.photo-grid__item) hi va a dins
   amb la imatge: la caixa que creix com l'<a> d'abans. */
const botons = (container) => [...container.querySelectorAll('.photo-grid > .photo-grid__boto')];

describe('la graella', () => {
  test('cada cel·la és un botó (la fitxa, sense cap diàleg), sense cap enllaç; dins, la cel·la i la imatge de sempre', () => {
    const { container } = pinta();
    const celles = botons(container);
    expect(celles).toHaveLength(MITJANS.length);
    expect(celles.every((cella) => cella.tagName === 'BUTTON' && cella.type === 'button' && !cella.hasAttribute('aria-haspopup'))).toBe(true);
    expect(celles.every((cella) => cella.children.length === 1 && cella.firstElementChild.matches('span.photo-grid__item'))).toBe(true);
    expect(container.querySelectorAll('.photo-grid > :not(.photo-grid__boto)')).toHaveLength(0);
    expect(container.querySelector('.photo-grid a')).toBeNull();
    expect(celles[0].querySelector('.photo-grid__item > img').getAttribute('src')).toBe('/assets/towns/tibi/1.jpg');
    expect(obert()).toBe(false);
    expect(visor().querySelectorAll('img')).toHaveLength(0);
  });
});

describe('obrir, passar i tancar', () => {
  test('la cel·la obri la fitxa; el seu botó obri el visor a ?foto=<id> amb una entrada nova; «Tancar» torna arrere i el tanca', () => {
    pinta();
    act(() => pagina().getByRole('button', { name: 'Mur' }).click());
    expect(new URLSearchParams(ubicacio.search).get('item')).toBe('nano-mur');
    expect(foto()).toBeNull();
    expect(obert()).toBe(false);
    act(() => pagina().getByRole('button', { name: BOTO_VISOR }).click());
    expect(foto()).toBe('nano-mur');
    expect(ubicacio.pathname).toBe('/multimedia');
    expect(ubicacio.state).toEqual({ sdpVisor: true });
    expect(obert()).toBe(true);
    expect(visor().querySelector('img.sdp-visor__imatge').getAttribute('src')).toBe('/assets/nano_cards/mur_nano_card.jpg');
    act(() => within(visor()).getByRole('button', { name: 'Tancar el visor' }).click());
    expect(foto()).toBeNull();
    expect(ubicacio.state).toBeNull();
    expect(obert()).toBe(false);
    expect(new URLSearchParams(ubicacio.search).get('item')).toBe('nano-mur');
  });

  test('següent i anterior substituïxen l’entrada: un sol pas arrere tanca', () => {
    pinta();
    obriAlVisor('Tibi');
    act(() => within(visor()).getByRole('button', { name: 'Imatge següent' }).click());
    expect(foto()).toBe('nano-mur');
    fireEvent.keyDown(within(visor()).getByRole('button', { name: 'Tancar el visor' }), { key: 'ArrowRight' });
    expect(foto()).toBe('foto-javi');
    expect(ubicacio.state).toEqual({ sdpVisor: true });
    act(() => within(visor()).getByRole('button', { name: 'Imatge anterior' }).click());
    expect(foto()).toBe('nano-mur');
    act(() => within(visor()).getByRole('button', { name: 'Tancar el visor' }).click());
    expect([ubicacio.pathname, foto()]).toEqual(['/multimedia', null]);
    expect(obert()).toBe(false);
  });

  test('un enllaç directe a ?foto= obri el visor; tancar-lo lleva la consulta i deixa la fitxa de la foto (sense eixir de l’app)', () => {
    pinta('/multimedia?foto=town-tibi&x=1');
    expect(obert()).toBe(true);
    expect(visor().querySelector('img.sdp-visor__imatge').getAttribute('src')).toBe('/assets/towns/tibi/1.jpg');
    act(() => within(visor()).getByRole('button', { name: 'Tancar el visor' }).click());
    expect(ubicacio.pathname).toBe('/multimedia');
    expect(new URLSearchParams(ubicacio.search).toString()).toBe('x=1&categoria=galeria_tots&item=town-tibi');
    expect(obert()).toBe(false);
    expect(pagina().getByRole('button', { name: BOTO_VISOR })).toBeTruthy();
  });

  test('una ?foto= que no existix no obri res', () => {
    pinta('/multimedia?foto=no-hi-es');
    expect(obert()).toBe(false);
  });

  /* Gauntlet 261017 · El focus torna al control que ha obert el visor (Bloc
     E: el botó de la fitxa), amb «Tancar» i amb Escape, també després de
     passar fotos. jsdom no enfoca en clicar: el botó s'enfoca a mà, com ho
     fa el navegador. */
  test('en tancar (Tancar o Escape), el focus torna al botó de la fitxa que l’ha obert', () => {
    pinta();
    act(() => pagina().getByRole('button', { name: 'Tibi' }).click());
    const boto = pagina().getByRole('button', { name: BOTO_VISOR });
    act(() => boto.focus());
    act(() => boto.click());
    expect(obert()).toBe(true);
    expect(document.activeElement).toBe(within(visor()).getByRole('button', { name: 'Tancar el visor' }));
    act(() => within(visor()).getByRole('button', { name: 'Imatge següent' }).click());
    act(() => within(visor()).getByRole('button', { name: 'Tancar el visor' }).click());
    expect(obert()).toBe(false);
    expect(document.activeElement).toBe(boto);
    act(() => boto.focus());
    act(() => boto.click());
    expect(obert()).toBe(true);
    act(() => { visor().dispatchEvent(new Event('cancel', { cancelable: true })); });
    expect(obert()).toBe(false);
    expect(document.activeElement).toBe(boto);
  });

  /* Gauntlet 261017 · Després de clicar la foto (el focus va al marc), les
     fletxes continuen passant fotos. */
  test('amb el focus al marc (el clic a la foto), les fletxes passen de foto', () => {
    pinta('/multimedia?foto=town-tibi');
    const marc = visor().querySelector('.sdp-visor__marc');
    act(() => marc.focus());
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(foto()).toBe('nano-mur');
  });
});

describe('el panell', () => {
  const panell = () => visor().querySelector('aside.sdp-visor__panell');
  const fila = (etiqueta) => [...panell().querySelectorAll('.sdp-visor__fila')].find((f) => f.querySelector('dt').textContent === etiqueta)?.querySelector('dd');

  test('una foto de poble: els drets de la Viquipèdia, el poble i «Publicat a», amb enllaços interns', async () => {
    pinta('/multimedia?foto=town-tibi');
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(fila('Drets d’ús').textContent).toBe(COPYRIGHT_VIQUIPEDIA);
    expect(fila('Poble').querySelector('a').getAttribute('href')).toBe('/pobles/tibi');
    expect(fila('Publicat a').querySelector('a').getAttribute('href')).toBe('/pobles/tibi');
    expect(fila('Origen').textContent).toBe('Fotografia');
    await waitFor(() => expect(fila('Càmera').textContent).toBe('Desconegut'));
  });

  /* Ordre del Mestre (30-10-2026, prompt 2208, T4.2) · A l'Arxiu, la fila de
     l'enllaç continua sempre: la URL d'una foto pública i, d'una d'un altre
     origen, «No té cap enllaç públic d’este lloc» (on ja era cert). */
  test('l’enllaç de la imatge a l’Arxiu: la URL d’una pública; d’una de fora, el text de quan no n’hi ha cap', async () => {
    pinta('/multimedia?foto=town-tibi');
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(fila('Enllaç de la imatge').querySelector('[translate="no"]').textContent).toBe(`${window.location.origin}/assets/towns/tibi/1.jpg`);
    cleanup();
    pinta('/multimedia?foto=feed-fora');
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(fila('Enllaç de la imatge').textContent).toBe('No té cap enllaç públic d’este lloc');
    await waitFor(() => expect(fila('Càmera').textContent).toBe('Desconegut'));
  });

  /* Gauntlet 261017 (C05 de Codex: «la resolució coneguda no s'ha d'ocultar
     perquè falte EXIF») · La resolució, de la foto que es veu: «Llegint…»
     mentre carrega, les mides reals en carregar (sense EXIF: el fetch falla),
     «Desconegut» si no carrega. La mida d'una altra foto no s'hi queda. */
  test('la resolució de la foto pintada: llegint, les mides reals, i «Desconegut» si no carrega', async () => {
    pinta('/multimedia?foto=town-tibi');
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    const img = () => visor().querySelector('img.sdp-visor__imatge');
    const descodifica = (amplada, alcada) => {
      Object.defineProperty(img(), 'naturalWidth', { configurable: true, value: amplada });
      Object.defineProperty(img(), 'naturalHeight', { configurable: true, value: alcada });
      fireEvent.load(img());
    };
    expect(fila('Resolució').textContent).toBe('Llegint…');
    descodifica(1200, 800);
    expect(fila('Resolució').textContent).toBe('1200 × 800 px');
    expect([...panell().querySelectorAll('dt')].map((dt) => dt.textContent).slice(2, 4)).toEqual(['Càmera', 'Resolució']);
    await waitFor(() => expect(fila('Càmera').textContent).toBe('Desconegut'));
    expect(fila('Resolució').textContent).toBe('1200 × 800 px');
    act(() => within(visor()).getByRole('button', { name: 'Imatge següent' }).click());
    expect(fila('Resolució').textContent).toBe('Llegint…');
    fireEvent.error(img());
    expect(fila('Resolució').textContent).toBe('Desconegut');
    act(() => within(visor()).getByRole('button', { name: 'Imatge anterior' }).click());
    expect(fila('Resolució').textContent).toBe('Llegint…');
    descodifica(1200, 800);
    expect(fila('Resolució').textContent).toBe('1200 × 800 px');
  });

  /* Revisió del Gauntlet 261017 (M4) · La foto que no ha carregat es queda
     amb l'avís i no es torna a demanar: en tornar-hi després d'una altra que
     sí que ha carregat, «Resolució» diu «Desconegut», mai «Llegint…» per
     sempre al costat de l'avís. */
  test('tornar a una foto que no ha carregat: «Desconegut», també després d’una altra que sí', () => {
    pinta('/multimedia?foto=town-tibi');
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    const img = () => visor().querySelector('img.sdp-visor__imatge');
    fireEvent.error(img());
    expect(fila('Resolució').textContent).toBe('Desconegut');
    act(() => within(visor()).getByRole('button', { name: 'Imatge següent' }).click());
    expect(fila('Resolució').textContent).toBe('Llegint…');
    Object.defineProperty(img(), 'naturalWidth', { configurable: true, value: 800 });
    Object.defineProperty(img(), 'naturalHeight', { configurable: true, value: 600 });
    fireEvent.load(img());
    expect(fila('Resolució').textContent).toBe('800 × 600 px');
    act(() => within(visor()).getByRole('button', { name: 'Imatge anterior' }).click());
    expect(img()).toBeNull();
    expect(visor().querySelector('.sdp-visor__avis').textContent).toBe('No s’ha pogut carregar la imatge.');
    expect(fila('Resolució').textContent).toBe('Desconegut');
  });

  test('una il·lustració d’IA porta els drets de Sóc de Poble; una foto real, mai', () => {
    pinta('/multimedia?foto=nano-mur');
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(fila('Drets d’ús').textContent).toBe(COPYRIGHT_SDP);
    expect(fila('Publicat a').textContent).toBe('Cap article: és de l’arxiu');
    act(() => within(visor()).getByRole('button', { name: 'Imatge següent' }).click());
    expect(fila('Drets d’ús').textContent).toBe('No declarats');
  });

  test('l’EXIF de la foto oberta: els primers 256 KB d’una imatge pròpia (Range), amb la càmera i l’autor', async () => {
    const bytes = jpegAmbExif({ ifd0: [orientacio(1), { tag: 0x010f, tipus: TIPUS.ASCII, valors: 'Canon' }, { tag: 0x0110, tipus: TIPUS.ASCII, valors: 'EOS 5D' }, { tag: 0x013b, tipus: TIPUS.ASCII, valors: 'Pepa' }], gps: gpsTorre() });
    const peticio = vi.fn(async () => new Response(bytes, { status: 206 }));
    vi.stubGlobal('fetch', peticio);
    pinta('/multimedia?foto=town-tibi');
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    await waitFor(() => expect(fila('Càmera').textContent).toBe('Canon EOS 5D'));
    expect(fila('Autor').textContent).toBe('Pepa');
    expect(fila('Coordenades GPS').textContent).toBe('38.59190, -0.41840 · 456,7 m');
    expect(peticio).toHaveBeenCalledTimes(1);
    expect(peticio.mock.calls[0][0]).toBe('/assets/towns/tibi/1.jpg');
    expect(peticio.mock.calls[0][1].headers).toEqual({ Range: 'bytes=0-262143' });
  });

  /* Revisió adversarial del 261016 · La pàgina /multimedia/<id> portava
     Comentar (el xat comú de la foto) i Connectar; el visor els torna a dur. */
  test('Comentar i Connectar: el xat comú de la foto (multimedia:<id>) i Connectar-la, sense eixir de l’app', () => {
    pinta('/multimedia?foto=nano-mur');
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(fila('Comentar').querySelector('a').getAttribute('href')).toMatch(/^\/xat\?sobre=multimedia:nano-mur&/);
    expect(fila('Connectar').querySelector('a').getAttribute('href')).toMatch(/^\/connectar\?item_id=nano-mur&/);
    act(() => fila('Comentar').querySelector('a').click());
    expect(ubicacio.pathname).toBe('/xat');
    expect(new URLSearchParams(ubicacio.search).get('sobre')).toBe('multimedia:nano-mur');
  });

  test('privadesa: la foto d’una persona no diu on es va fer; una foto de tercers ni es demana', async () => {
    const bytes = jpegAmbExif({ ifd0: [orientacio(1)], gps: gpsTorre() });
    const peticio = vi.fn(async () => new Response(bytes, { status: 206 }));
    vi.stubGlobal('fetch', peticio);
    pinta('/multimedia?foto=foto-javi');
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    await waitFor(() => expect(peticio).toHaveBeenCalledTimes(1));
    expect(fila('Coordenades GPS').textContent).toBe('No es mostren en la foto d’una persona');
    cleanup();
    peticio.mockClear();
    pinta('/multimedia?foto=feed-fora');
    expect(obert()).toBe(true);
    expect(peticio).not.toHaveBeenCalled();
  });
});

describe('l’apartat IAIA i el cens', () => {
  test('«IAIA» deixa només les imatges d’IA, i el visor passa d’una a l’altra', () => {
    const { container } = pinta('/multimedia?categoria=galeria_iaia');
    const celles = botons(container);
    expect(celles.map((c) => c.querySelector('img').getAttribute('alt'))).toEqual(['Mur']);
    act(() => celles[0].click());
    expect(new URLSearchParams(ubicacio.search).get('categoria')).toBe('galeria_iaia');
    act(() => pagina().getByRole('button', { name: BOTO_VISOR }).click());
    expect(foto()).toBe('nano-mur');
    expect(within(visor()).queryByRole('button', { name: 'Imatge següent' })).toBeNull();
  });

  test('el cens s’afig darrere del port, compta a la Fototeca i, sense data, va a «Sense data» de la Cronologia', () => {
    mocks.cens = { mitjans: MITJANS_DEL_CENS, cens: indexaCens(CENS) };
    const { container } = pinta();
    expect(botons(container)).toHaveLength(MITJANS.length + 1);
    expect(container.querySelector('#app-grid-list .sdp-gestor-fitxa').textContent).toContain('5 imatges');
    cleanup();
    const cronologia = pinta('/multimedia?categoria=galeria_cronologia');
    const titols = [...cronologia.container.querySelectorAll('.stack-grid h3')].map((h) => h.textContent);
    expect(titols.at(-1)).toBe('Sense data');
    expect(titols).toHaveLength(5);
  });

  /* Revisió adversarial del 261016 · Els mesos de la Cronologia, en la llengua
     activa: abans, sempre «Agost de 2026», també en castellà. */
  test('la Cronologia en la llengua activa, la del proveïdor i la calculada amb el cens', () => {
    mocks.locale = 'es-ES';
    mocks.multimedia = { status: 'ready', mediaItems: MITJANS, mediaTimelineGroups: [{ key: '2026-08', label: 'Agost de 2026', items: [MITJANS[0]] }] };
    const titols = (container) => [...container.querySelectorAll('.stack-grid h3')].map((h) => h.textContent);
    const primer = pinta('/multimedia?categoria=galeria_cronologia');
    expect(titols(primer.container)).toEqual(['Agosto de 2026']);
    cleanup();
    mocks.cens = { mitjans: MITJANS_DEL_CENS, cens: indexaCens(CENS) };
    const segon = pinta('/multimedia?categoria=galeria_cronologia');
    expect(titols(segon.container)).toEqual(['Agosto de 2026', 'Julio de 2026', 'Enero de 2023', 'Enero de 2022', 'Sense data']);
  });

  test('mentre el port carrega, el cens espera: la graella no salta', () => {
    mocks.multimedia = { status: 'loading', mediaItems: [], mediaTimelineGroups: [] };
    mocks.cens = { mitjans: MITJANS_DEL_CENS, cens: indexaCens(CENS) };
    const { container } = pinta();
    expect(botons(container)).toHaveLength(0);
  });
});
