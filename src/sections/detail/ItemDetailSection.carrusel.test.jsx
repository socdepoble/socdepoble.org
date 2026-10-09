/**
 * Ordre del Mestre (261007) · «A la targeta es veu la foto de la xica amb la
 * samarreta, però quan entres a la seua UniversalPage, la imatge de capçalera
 * és un logotip. La imatge de la xica ha de ser sempre la principal!» i
 * «aquest producte té 8 imatges. Implementa un carrusel a la imatge
 * principal».
 *  · La regla és dels productes: la portada és la primera de `images` (o, sense,
 *    image_url / image / imageSrc), mai el logotip ni l'avatar de qui ven.
 *  · Amb més d'una foto, la portada és un carrusel i la primera diapositiva
 *    és la portada: cap imatge pintada dues vegades (pla 261006_1140).
 *  · Amb una foto, la portada de sempre (Llei del Píxel); sense cap, cap.
 *  · La llavor de la samarreta porta les huit fotos, 01-08, i totes existixen.
 * Es prova amb la UniversalPage i el PageFrame de veres.
 */
import React from 'react';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sectionId: 'mercat', itemId: null, navigate: vi.fn(), t: (_, alternativa) => alternativa,
  mur: { events: [], feedPosts: [], marketItems: [] },
  sessio: { currentUser: null, estat: 'fora', rol: null, esSuperadmin: false }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: mocks.sectionId, itemId: mocks.itemId }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/${mocks.sectionId}/${mocks.itemId}`, state: null }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [] }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [] }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: mocks.t })
}));
/* La Sessió obligatòria del detall, amb el valor del proveïdor real per a qui
   visita sense entrar (el mateix doble que ItemDetailSection.capcalera.test.jsx). */
vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => mocks.sessio,
  useSessioOpcional: () => mocks.sessio
}));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import ItemDetailSection from './ItemDetailSection.jsx';
import { MARKET_ITEMS } from '../../data/sectionContent.js';
import { MOCK_MARKET_ITEMS } from '../mercat/marketSeed.js';
import { buildMercatDetailSectionMeta, imatgesDeProducte } from './detailSectionMeta.jsx';
import { createTranslator } from '../../config/i18n.js';

const CARPETA = '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble';
const XICA = `${CARPETA}/01-chica-jersey.png`;
const QUADRAT_VERD = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
/* Onada 8 (261009) · El quadrat de la llavor és ara el PNG; l'SVG d'abans
   (el de dalt) continua arribant de les files del servidor. */
const QUADRAT_VERD_PNG = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
const HUIT = [
  '01-chica-jersey.png',
  '02-samarreta-socdepoble-roly-plom-oscur-1024px.png',
  '03-young-man-tshirt.png',
  '04-iaia-tshirt.png',
  '05-samarreta-socdepoble-muntanya.jpg',
  '06-group-tshirt.png',
  '07-rustic-detail.png',
  '08-javi-llinares-perfil-1024px.jpg'
].map((fitxer) => `${CARPETA}/${fitxer}`);

const portada = (container) => container.querySelector('.hero-image');
const llavor = (id) => {
  const item = MARKET_ITEMS.find((element) => element.id === id);
  expect(item, id).toBeTruthy();
  return item;
};

function pinta(item) {
  mocks.itemId = item.id;
  mocks.mur = { events: [], feedPosts: [], marketItems: [item] };
  return render(<ItemDetailSection />).container;
}

beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

describe('la llavor de la samarreta: huit fotos, 01-08, i totes existixen', () => {
  test('les huit en ordre, amb la 05 que hi faltava; la primera és la xica', () => {
    const samarreta = MOCK_MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
    expect(samarreta.images).toEqual(HUIT);
    expect(samarreta.images[0]).toBe(XICA);
  });

  test('cada foto és a public/', () => {
    for (const src of HUIT) expect(existsSync(path.join(process.cwd(), 'public', src)), src).toBe(true);
  });
});

describe('/mercat/samarreta-socdepoble: la portada és un carrusel de huit fotos que comença per la xica', () => {
  test('cap logotip a la portada: la primera diapositiva és la xica', () => {
    const container = pinta(llavor('samarreta-socdepoble'));
    const marc = portada(container);
    expect(marc).toBeTruthy();
    const carrusel = within(marc).getByRole('region', { name: 'Imatges de Samarreta Sóc de Poble' });
    expect(carrusel.getAttribute('aria-roledescription')).toBe('carrusel');
    const srcs = [...marc.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(srcs).toEqual(HUIT);
    expect(srcs[0]).toBe(XICA);
    expect(srcs).not.toContain(QUADRAT_VERD);
    expect(srcs).not.toContain(QUADRAT_VERD_PNG);
    const diapositives = within(within(carrusel).getByRole('group', { name: 'Diapositives' })).getAllByRole('group');
    expect(diapositives.map((d) => d.getAttribute('aria-label')))
      .toEqual(HUIT.map((_, i) => `Imatge ${i + 1} de 8`));
  });

  test('la primera diapositiva és la portada: cap altra imatge de portada, cap repetida', () => {
    const container = pinta(llavor('samarreta-socdepoble'));
    const marc = portada(container);
    expect(container.querySelectorAll('.hero-image')).toHaveLength(1);
    expect([...marc.children].map((fill) => fill.tagName)).toEqual(['SECTION']);
    expect(marc.querySelectorAll('img')).toHaveLength(8);
    expect([...container.querySelectorAll('img')].filter((img) => img.getAttribute('src') === XICA)).toHaveLength(1);
    // La primera es carrega de seguida; la resta, quan s'hi arriba.
    const imatges = [...marc.querySelectorAll('img')];
    expect(imatges[0].hasAttribute('loading')).toBe(false);
    expect(imatges.slice(1).every((img) => img.getAttribute('loading') === 'lazy')).toBe(true);
    for (const img of imatges) expect(img.getAttribute('alt')).toBe('Samarreta Sóc de Poble');
  });

  test('el comptador diu «1 / 8»', () => {
    const container = pinta(llavor('samarreta-socdepoble'));
    expect(portada(container).querySelector('.sdp-carrusel__comptador').textContent).toContain('1 / 8');
  });

  /* Revisió del 261007 (M9, M2-01) · En una altra llengua, el carrusel la
     parla: els textos passen pel traductor de la pàgina (i18n.js). */
  test('M9 · en anglés, el carrusel parla anglés', () => {
    const abans = mocks.t;
    mocks.t = createTranslator('en');
    try {
      const container = pinta(llavor('samarreta-socdepoble'));
      const carrusel = within(portada(container)).getByRole('region', { name: 'Images of Samarreta Sóc de Poble' });
      expect(carrusel.getAttribute('aria-roledescription')).toBe('carousel');
      const diapositives = within(within(carrusel).getByRole('group', { name: 'Slides' })).getAllByRole('group');
      expect(diapositives[1].getAttribute('aria-label')).toBe('Image 2 of 8');
      expect(diapositives[1].getAttribute('aria-roledescription')).toBe('slide');
      expect(within(carrusel).getByRole('button', { name: 'Next image' })).toBeTruthy();
      expect(within(carrusel).getByRole('button', { name: 'Previous image' })).toBeTruthy();
    } finally {
      mocks.t = abans;
    }
  });
});

describe('una foto o cap: la portada de sempre (Llei del Píxel)', () => {
  test('/mercat/mac-mini-m4: la seua foto, sola i sense carrusel (abans, el quadrat verd de la marca)', () => {
    const mac = llavor('mac-mini-m4');
    const container = pinta(mac);
    const marc = portada(container);
    expect(marc.querySelector('.sdp-carrusel')).toBeNull();
    expect([...marc.children].map((fill) => fill.tagName)).toEqual(['IMG']);
    expect(marc.querySelector('img').getAttribute('src')).toBe(mac.images[0]);
    expect(marc.querySelector('img').getAttribute('alt')).toBe(mac.title);
  });

  test('un producte que només porta l’avatar de qui ven (el node l’escriu a imageSrc i image_url): cap portada', () => {
    const container = pinta({
      id: 'cadira', title: 'Cadira de bova', author_name: 'Pepa', author_id: 'pepa',
      avatar_url: QUADRAT_VERD, imageSrc: QUADRAT_VERD, image_url: QUADRAT_VERD, image: QUADRAT_VERD,
      created_at: '2026-09-01T10:00:00.000Z'
    });
    expect(portada(container)).toBeNull();
    // La boina de la barra taronja porta l'avatar de qui ven, com sempre; el bloc del títol, cap marca.
    expect([...container.querySelectorAll('header.page-title img')].map((img) => img.getAttribute('src'))).not.toContain(QUADRAT_VERD);
  });
});

describe('imatgesDeProducte i la secció del Mercat', () => {
  const seccio = buildMercatDetailSectionMeta({ marketItems: [], t: mocks.t });

  test('primer images; sense, image_url, image i imageSrc; mai avatar_url ni author_avatar; sense repetits', () => {
    expect(imatgesDeProducte({ images: ['/a.png', '/b.png', '/a.png'], imageSrc: '/logo.svg', avatar_url: '/logo.svg' })).toEqual(['/a.png', '/b.png']);
    expect(imatgesDeProducte({ images: [], image_url: '/foto.png', avatar_url: '/logo.svg' })).toEqual(['/foto.png']);
    expect(imatgesDeProducte({ image: '/foto.png', imageSrc: '/foto.png' })).toEqual(['/foto.png']);
    expect(imatgesDeProducte({ images: ['/logo.svg', '/cara.jpg', '/a.png'], avatar_url: '/logo.svg', author_avatar: '/cara.jpg' })).toEqual(['/a.png']);
    expect(imatgesDeProducte({ imageSrc: '/logo.svg', avatar_url: '/logo.svg' })).toEqual([]);
    expect(imatgesDeProducte({ images: ['<p><img src="/dins.png"></p>'] })).toEqual(['/dins.png']);
    expect(imatgesDeProducte(null)).toEqual([]);
  });

  /* Onada 8 (261009) · L'avatar de la identitat ja és el PNG, però una fila
     del servidor encara porta l'SVG a la imatge del producte (o al revés): el
     logotip no ix com a foto del producte. Una altra foto, sí. */
  test('el logotip en SVG i en PNG és el mateix recurs: mai ix com a foto, mescle com mescle', () => {
    expect(imatgesDeProducte({ author_avatar: QUADRAT_VERD_PNG, image: QUADRAT_VERD })).toEqual([]);
    expect(imatgesDeProducte({ avatar_url: QUADRAT_VERD, imageSrc: QUADRAT_VERD_PNG })).toEqual([]);
    expect(imatgesDeProducte({ author_avatar: QUADRAT_VERD_PNG, images: [QUADRAT_VERD, '/assets/mel.png'] })).toEqual(['/assets/mel.png']);
    // Sense cap avatar de la marca, el logotip continua sent una imatge com qualsevol altra (com abans).
    expect(imatgesDeProducte({ author_avatar: '/assets/gent/pepa.webp', image: QUADRAT_VERD })).toEqual([QUADRAT_VERD]);
  });

  test('getImage és la primera foto (o null) i getImages, totes', () => {
    const samarreta = llavor('samarreta-socdepoble');
    expect(seccio.getImage(samarreta)).toBe(XICA);
    expect(seccio.getImages(samarreta)).toEqual(HUIT);
    expect(seccio.getImage({ avatar_url: QUADRAT_VERD, imageSrc: QUADRAT_VERD })).toBeNull();
  });
});
