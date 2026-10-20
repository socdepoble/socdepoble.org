/**
 * Gauntlet 261017 (C04 de Codex: «La fotografia de /mercat/mac-mini-m4 no
 * obri cap modal en clicar-la […] El desencadenant ha de ser botó amb nom
 * accessible; focus de retorn, Esc, navegació i metadades verificades. La
 * falta d'EXIF és un estat vàlid; la resolució coneguda no s'ha d'ocultar
 * perquè falte EXIF») · Les fotos de la portada d'una publicació del Mur
 * obrin el visor de l'Arxiu visual sense eixir de la pàgina
 * (VisorDePublicacio.jsx, des de portadaDElement de detailSectionMeta.jsx).
 * Es prova amb ItemDetailSection, la UniversalPage, el PageFrame, el
 * CarruselImatges, el VisorDeLArxiu i el VisorImatges de veres (jsdom no té
 * showModal: el Dialeg posa `open`; no enfoca en clicar: el focus del clic es
 * fa a mà).
 *   · /mercat/mac-mini-m4 (una foto): la mateixa imatge, dins d'un botó amb nom.
 *   · La Samarreta (huit fotos): cada diapositiva és un botó; el visor s'obri a
 *     la foto clicada i hi passa amb les fletxes.
 *   · Esc i «Tancar» tanquen i el focus torna al botó; cap node del visor
 *     abans d'obrir-lo, ni dins de la portada.
 *   · El panell: les dades declarades de la publicació, la resolució de la
 *     foto pintada (sense EXIF), «Publicat a» sense enllaç a la mateixa
 *     pàgina, i cap GPS en la foto d'una persona.
 *   · Fora del Mur, i amb una portada opaca (sdp-media://), com abans.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { gpsTorre, jpegAmbExif, orientacio } from '../../components/universal/enquadrament/jpegProva.js';

const mocks = vi.hoisted(() => ({
  sectionId: 'mercat', itemId: null, navigate: vi.fn(), t: (_, alternativa) => alternativa,
  mur: { events: [], feedPosts: [], marketItems: [] },
  towns: [],
  sessio: { currentUser: null, estat: 'fora', rol: null, esSuperadmin: false },
  mitjans: false
}));
/* Revisió del Gauntlet 261017 (M2) · La capacitat 'mitjans' només quan una
   prova la demana: el port resol un sdp-media:// al Storage sintètic. */
vi.mock('../../data/backendPort.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    teCapacitat: (capacitat) => (capacitat === 'mitjans' ? mocks.mitjans : original.teCapacitat(capacitat)),
    resolveAsset: (ref, opcions) => (mocks.mitjans
      ? Promise.resolve(String(ref).replace('sdp-media://', 'https://lector-1.supabase.test/storage/v1/object/public/'))
      : original.resolveAsset(ref, opcions))
  };
});
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: mocks.sectionId, itemId: mocks.itemId }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/${mocks.sectionId}/${mocks.itemId}`, search: '', state: null }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: mocks.towns }) }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [] }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [] }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: mocks.t })
}));
vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => mocks.sessio,
  useSessioOpcional: () => mocks.sessio
}));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import ItemDetailSection from './ItemDetailSection.jsx';
import { fotosDeLaPublicacio } from './VisorDePublicacio.jsx';
import { MARKET_ITEMS } from '../../data/sectionContent.js';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
import fontPortada from './detailSectionMeta.jsx?raw';
import fontVisor from './VisorDePublicacio.jsx?raw';
import { oblidaMetadades } from '../multimedia/useMetadadesFoto.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';

const OBRI = 'Veure la imatge a pantalla completa';
const TORRE = { id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes' };

const llavor = (id) => {
  const item = MARKET_ITEMS.find((element) => element.id === id);
  expect(item, id).toBeTruthy();
  return item;
};
const portada = (container) => container.querySelector('.hero-image');
const visor = () => document.querySelector('dialog.sdp-visor');
const obert = () => visor()?.hasAttribute('open') === true;
const fotoDelVisor = () => visor().querySelector('img.sdp-visor__imatge');
const panell = () => visor().querySelector('aside.sdp-visor__panell');
const fila = (etiqueta) => [...panell().querySelectorAll('.sdp-visor__fila')].find((f) => f.querySelector('dt').textContent === etiqueta)?.querySelector('dd');
const tancar = () => within(visor()).getByRole('button', { name: 'Tancar el visor' });
const esc = () => act(() => { visor().dispatchEvent(new Event('cancel', { cancelable: true })); });

/* Un clic de ratolí al botó: el navegador l'enfoca (Chrome) i el visor
   l'enfoca igualment abans d'obrir (Safari no ho fa).
   Revisió del Gauntlet 261017 (R3) · El visor arriba en diferit (import() en
   obrir-lo per primera vegada): el clic n'espera el tros. */
async function clica(boto) {
  fireEvent.pointerDown(boto, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 50, clientY: 50 });
  act(() => { fireEvent.click(boto, { detail: 1, clientX: 51, clientY: 50 }); });
  await waitFor(() => expect(obert()).toBe(true));
}

function pinta(item, seccio = 'mercat') {
  mocks.sectionId = seccio;
  mocks.itemId = item.id;
  mocks.mur = seccio === 'mur' ? { events: [], feedPosts: [item], marketItems: [] } : { events: [], feedPosts: [], marketItems: [item] };
  return render(<ItemDetailSection />).container;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.towns = [TORRE];
  mocks.t = (_, alternativa) => alternativa;
  mocks.mitjans = false;
  oblidaMetadades();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('/mercat/mac-mini-m4: la foto sola obri el visor', () => {
  test('la mateixa imatge (src i alt), dins d’un botó amb nom que obri un diàleg; cap visor abans de clicar', () => {
    const mac = llavor('mac-mini-m4');
    const container = pinta(mac);
    const marc = portada(container);
    expect(marc.querySelector('.sdp-carrusel')).toBeNull();
    const boto = within(marc).getByRole('button', { name: OBRI });
    expect([...marc.children]).toEqual([boto]);
    expect(boto.className).toBe('sdp-visor__obridor');
    expect(boto.type).toBe('button');
    expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
    expect([...boto.children].map((fill) => fill.tagName)).toEqual(['IMG']);
    const img = boto.querySelector('img');
    expect(img.getAttribute('src')).toBe(mac.images[0]);
    expect(img.getAttribute('alt')).toBe(mac.title);
    expect([...img.attributes].map((a) => a.name).sort()).toEqual(['alt', 'src']);
    expect(visor()).toBeNull();
  });

  test('el clic l’obri amb la mateixa foto i el focus a «Tancar»; Esc el tanca i el focus torna al botó; es torna a obrir', async () => {
    const mac = llavor('mac-mini-m4');
    const container = pinta(mac);
    const boto = within(portada(container)).getByRole('button', { name: OBRI });
    await clica(boto);
    expect(obert()).toBe(true);
    expect(fotoDelVisor().getAttribute('src')).toBe(mac.images[0]);
    expect(document.activeElement).toBe(tancar());
    expect(within(visor()).queryByRole('button', { name: 'Imatge següent' })).toBeNull();
    // El visor no és dins de la portada: .hero-image img l'estiraria.
    expect(portada(container).contains(visor())).toBe(false);
    esc();
    expect(obert()).toBe(false);
    expect(document.activeElement).toBe(boto);
    await clica(boto);
    expect(obert()).toBe(true);
    act(() => tancar().click());
    expect(obert()).toBe(false);
    expect(document.activeElement).toBe(boto);
  });

  test('Intro i Espai també l’obrin (un clic sense punter)', async () => {
    const container = pinta(llavor('mac-mini-m4'));
    const boto = within(portada(container)).getByRole('button', { name: OBRI });
    act(() => boto.focus());
    act(() => { fireEvent.click(boto, { detail: 0 }); });
    await waitFor(() => expect(obert()).toBe(true));
  });

  test('el panell: les dades declarades, la resolució de la foto pintada sense EXIF, i «Publicat a» sense enllaç a la mateixa pàgina', async () => {
    const mac = llavor('mac-mini-m4');
    const container = pinta(mac);
    await clica(within(portada(container)).getByRole('button', { name: OBRI }));
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(panell().querySelector('.sdp-visor__titol').textContent).toBe(mac.title);
    expect(fila('Resolució').textContent).toBe('Llegint…');
    Object.defineProperty(fotoDelVisor(), 'naturalWidth', { configurable: true, value: 1024 });
    Object.defineProperty(fotoDelVisor(), 'naturalHeight', { configurable: true, value: 768 });
    fireEvent.load(fotoDelVisor());
    expect(fila('Resolució').textContent).toBe('1024 × 768 px');
    await waitFor(() => expect(fila('Càmera').textContent).toBe('Desconegut'));
    expect(fila('Resolució').textContent).toBe('1024 × 768 px');
    expect(fila('Autor').textContent).toBe('Javi Llinares');
    expect(fila('Poble').textContent).toBe('La Torre de les Maçanes');
    expect(fila('Poble').querySelector('a').getAttribute('href')).toBe('/pobles/la-torre-de-les-macanes');
    expect(fila('Publicat a').textContent).toBe(`Mercat · ${mac.title}`);
    expect(fila('Publicat a').querySelector('a')).toBeNull();
    expect(fila('Drets d’ús').textContent).toBe('No declarats');
    // Cap xat ni Connectar de la foto: són els de la pàgina.
    expect(fila('Comentar')).toBeUndefined();
    expect(fila('Connectar')).toBeUndefined();
  });

  test('un poble que no és al cens: el nom de la publicació, sense enllaç', async () => {
    mocks.towns = [];
    const container = pinta(llavor('mac-mini-m4'));
    await clica(within(portada(container)).getByRole('button', { name: OBRI }));
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(fila('Poble').textContent).toBe('La Torre de les Maçanes');
    expect(fila('Poble').querySelector('a')).toBeNull();
  });
});

describe('la Samarreta: el carrusel de huit fotos obri el visor a la foto clicada', () => {
  test('cada diapositiva és un botó amb nom; el clic obri la seua foto; les fletxes hi passen; Esc tanca i torna el focus', async () => {
    const samarreta = llavor('samarreta-socdepoble');
    const container = pinta(samarreta);
    const marc = portada(container);
    // La portada és el carrusel sol: el visor no hi deixa cap node.
    expect([...marc.children].map((fill) => fill.tagName)).toEqual(['SECTION']);
    const carrusel = within(marc).getByRole('region', { name: `Imatges de ${samarreta.title}` });
    const botons = within(carrusel).getAllByRole('button', { name: OBRI });
    expect(botons).toHaveLength(8);
    expect(botons.every((boto) => boto.getAttribute('aria-haspopup') === 'dialog')).toBe(true);
    expect(visor()).toBeNull();
    await clica(botons[2]);
    expect(obert()).toBe(true);
    expect(fotoDelVisor().getAttribute('src')).toBe(samarreta.images[2]);
    expect(visor().querySelector('.sdp-visor__comptador').textContent).toBe('3 / 8Imatge 3 de 8');
    fireEvent.keyDown(tancar(), { key: 'ArrowRight' });
    expect(fotoDelVisor().getAttribute('src')).toBe(samarreta.images[3]);
    fireEvent.keyDown(tancar(), { key: 'ArrowLeft' });
    fireEvent.keyDown(tancar(), { key: 'ArrowLeft' });
    fireEvent.keyDown(tancar(), { key: 'ArrowLeft' });
    expect(fotoDelVisor().getAttribute('src')).toBe(samarreta.images[0]);
    fireEvent.keyDown(tancar(), { key: 'ArrowLeft' });
    expect(fotoDelVisor().getAttribute('src')).toBe(samarreta.images[7]);
    // Les tecles del visor no passen el carrusel de darrere.
    expect(carrusel.querySelector('.sdp-carrusel__comptador').textContent).toContain('1 / 8');
    esc();
    expect(obert()).toBe(false);
    expect(document.activeElement).toBe(botons[2]);
    expect([...marc.children].map((fill) => fill.tagName)).toEqual(['SECTION']);
  });

  test('arrossegar la foto no obri el visor', async () => {
    const container = pinta(llavor('samarreta-socdepoble'));
    const [primer] = within(portada(container)).getAllByRole('button', { name: OBRI });
    fireEvent.pointerDown(primer, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 300, clientY: 100 });
    act(() => { fireEvent.click(primer, { detail: 1, clientX: 120, clientY: 100 }); });
    // Revisió del Gauntlet 261017 (R3) · El temps d'arribar el tros diferit: tampoc s'obri després.
    await act(async () => { await new Promise((resol) => { setTimeout(resol, 30); }); });
    expect(visor()).toBeNull();
  });

  test('privadesa: la foto d’una persona (la 08) no diu on es va fer, encara que l’EXIF ho porte', async () => {
    const bytes = jpegAmbExif({ ifd0: [orientacio(1)], gps: gpsTorre() });
    const peticio = vi.fn(async () => new Response(bytes, { status: 206 }));
    vi.stubGlobal('fetch', peticio);
    const samarreta = llavor('samarreta-socdepoble');
    const container = pinta(samarreta);
    await clica(within(portada(container)).getAllByRole('button', { name: OBRI })[7]);
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    await waitFor(() => expect(peticio).toHaveBeenCalled());
    expect(peticio.mock.calls.at(-1)[0]).toBe(samarreta.images[7]);
    await waitFor(() => expect(fila('Data i hora de captura').textContent).not.toBe('Llegint…'));
    expect(fila('Coordenades GPS').textContent).toBe('No es mostren en la foto d’una persona');
  });

  test('en anglés, el botó de cada foto parla anglés', () => {
    mocks.t = createTranslator('en');
    const container = pinta(llavor('samarreta-socdepoble'));
    expect(within(portada(container)).getAllByRole('button', { name: 'View the image full screen' })).toHaveLength(8);
  });
});

describe('fora del visor, com abans', () => {
  test('una publicació del Mur amb portada: també obri el visor; amb una portada opaca (sdp-media://) que el port no resol, la portada buida de PageFrame', () => {
    const coca = { id: 'coca', title: 'Recepta de coca', image_url: '/assets/coca.png', author: 'Pepa', created_at: '2026-09-01T10:00:00.000Z' };
    const container = pinta(coca, 'mur');
    const boto = within(portada(container)).getByRole('button', { name: OBRI });
    expect(boto.querySelector('img').getAttribute('src')).toBe('/assets/coca.png');
    cleanup();
    const opaca = pinta({ ...coca, image_url: 'sdp-media://mitjans/poble/u/general/f.webp' }, 'mur');
    expect(within(document.body).queryByRole('button', { name: OBRI })).toBeNull();
    expect(portada(opaca)?.querySelector('button')).toBeFalsy();
    expect(portada(opaca)?.querySelector('img')).toBeFalsy();
  });

  /* Revisió del Gauntlet 261017 (M2; C04: «qualsevol imatge d'una galeria o
     publicació») · Una portada pujada (sdp-media://, la forma de tota pujada)
     es resol pel port, com la de PageFrame (ImatgeDePortada), i obri el
     visor amb la URL del port; el visor no en llig l'EXIF: cap petició més a
     una mitja privada. */
  test('una portada pujada (sdp-media://) que el port resol: el botó amb la URL del port i el visor, sense llegir-ne l’EXIF', async () => {
    mocks.mitjans = true;
    permetOrigenMitjans('https://lector-1.supabase.test');
    const resolt = 'https://lector-1.supabase.test/storage/v1/object/public/mitjans/poble/u/general/f.webp';
    const coca = { id: 'coca', title: 'Recepta de coca', image_url: 'sdp-media://mitjans/poble/u/general/f.webp', author: 'Pepa', created_at: '2026-09-01T10:00:00.000Z' };
    const container = pinta(coca, 'mur');
    const boto = await within(portada(container)).findByRole('button', { name: OBRI });
    expect([...portada(container).children]).toEqual([boto]);
    expect(boto.querySelector('img').getAttribute('src')).toBe(resolt);
    await clica(boto);
    expect(fotoDelVisor().getAttribute('src')).toBe(resolt);
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(fila('Càmera').textContent).toBe('Desconegut');
    await act(async () => { await new Promise((resol) => { setTimeout(resol, 20); }); });
    expect(fetch).not.toHaveBeenCalled();
  });

  test('un producte sense cap foto: cap portada ni cap botó', () => {
    const container = pinta({ id: 'cadira', title: 'Cadira', seller: 'Pepa', created_at: '2026-09-01T10:00:00.000Z' });
    expect(portada(container)).toBeNull();
    expect(within(container).queryByRole('button', { name: OBRI })).toBeNull();
  });
});

/* Revisió del Gauntlet 261017 (R3, pes) · detailSectionMeta.jsx (i, per ell,
   /xat, Notes i cada pàgina de text) només porta el disparador: VisorDeLArxiu
   i el cens arriben per import() en obrir el visor. */
describe('el visor no viatja amb la portada', () => {
  test('cap import estàtic de VisorDeLArxiu ni d’useCensImatges; tots dos, per import() diferit', () => {
    const estatics = [...fontVisor.matchAll(/^import\s[^;]*?from\s+'([^']+)'/gm)].map((m) => m[1]);
    expect(estatics.filter((ruta) => /VisorDeLArxiu|useCensImatges|useMetadadesFoto|VisorImatges|enquadrament\/exif/.test(ruta))).toEqual([]);
    expect(fontVisor).toContain("import('../multimedia/VisorDeLArxiu.jsx')");
    expect(fontVisor).toContain("import('../multimedia/useCensImatges.js')");
  });
});

describe('fotosDeLaPublicacio: el model de foto de l’Arxiu, sense inventar res', () => {
  test('una entrada per foto, amb les dades declarades; sense autoria, null; sense drets ni poble, cap camp; cap id', () => {
    const article = { sectionId: 'mercat', id: 'mel' };
    expect(fotosDeLaPublicacio(['/a.png', '', null, '/b.png'], { titol: ' Mel ', autor: 'Pepa', drets: 'CC BY', poble: 'Tibi', article })).toEqual([
      { src: '/a.png', title: 'Mel', autor: 'Pepa', copyright: 'CC BY', nomPoble: 'Tibi', article },
      { src: '/b.png', title: 'Mel', autor: 'Pepa', copyright: 'CC BY', nomPoble: 'Tibi', article }
    ]);
    expect(fotosDeLaPublicacio(['/a.png'], { titol: 'Mel', autor: '  ', article: { sectionId: 'mur', id: null } })).toEqual([{ src: '/a.png', title: 'Mel', autor: null }]);
    expect(fotosDeLaPublicacio(null)).toEqual([]);
  });
});

describe('i18n del botó', () => {
  test('valor propi en les cinc llengües, i en valencià, la reserva de la portada', () => {
    const clau = 'section.multimedia.visor.obri';
    expect(fontPortada).toContain(`t('${clau}', '${OBRI}')`);
    expect(createTranslator('ca')(clau)).toBe(OBRI);
    for (const { code } of SUPPORTED_LANGUAGES) {
      const valor = createTranslator(code)(clau);
      expect([code, valor === clau]).toEqual([code, false]);
      if (code !== 'ca') expect([code, valor === OBRI]).toEqual([code, false]);
    }
  });
});
