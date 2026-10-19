/**
 * Esmena 3 del pla 261007_1645 (ordre del Mestre, 261007: «El component
 * original renderitzava el carrusel de fotos i les variacions sense perdre la
 * localització de l'element; això s'ha de recuperar») · Un producte obert des
 * de Notes > Mercat (PublicacioDetall) es llig com la seua pàgina
 * (/mercat/:id): la portada és el carrusel de fotos (mai el logotip de qui
 * ven), el cos porta les variacions, el subtítol no es repetix com a
 * entradilla i «Obri al Mercat» i Compartir porten a la seua ruta, mai al Bloc.
 * Es conserven la boina (T6), l'etiqueta i els drets de reserva. El Mur pinta
 * com abans.
 * Ordre E (261007) · El logotip pujat damunt de l'H1 (logo_image) arriba al
 * lector, també el sdp-media:// que resol el port.
 * Es prova amb la UniversalPage i el PageFrame de veres.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa,
  identitat: { actor: { tipus: 'persona', id: 'U', nom: 'Pep' } },
  core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] },
  mur: { status: 'ready', feedPosts: [], events: [], marketItems: [] },
  capacitats: new Set(), resol: vi.fn()
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  /* Sense UIProvider: fora de l'app, cap crida al port del directori. */
  useUIState: () => { throw new Error('fora de l’app'); }
}));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  resolveAsset: (...args) => mocks.resol(...args)
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));

import { PublicacioDetall } from './PublicacioDetall.jsx';
import { publicacioComANota } from './masDeLUsuari.js';
import { MARKET_ITEMS } from '../../data/sectionContent.js';
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';

const CARPETA = '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble';
const XICA = `${CARPETA}/01-chica-jersey.png`;
const QUADRAT_VERD = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
/* Onada 8 (261009) · El quadrat de la llavor és ara el PNG; l'SVG d'abans
   (el de dalt) continua arribant de les files del servidor. */
const QUADRAT_VERD_PNG = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
const LOGO_NEGRE = '/assets/system/ui/logo-socdepoble-rect-negre.svg';
const CREAT = '2026-09-20T09:15:00Z';
const escriu = vi.fn();

const samarreta = () => {
  const item = MARKET_ITEMS.find((element) => element.id === 'samarreta-socdepoble');
  expect(item).toBeTruthy();
  return item;
};
function pinta(element, seccio = 'mercat') {
  return render(<PublicacioDetall item={publicacioComANota(element, seccio)} />).container;
}
const portada = (container) => container.querySelector('.hero-image');
const capcalera = (container) => container.querySelector('header.page-title');
const fills = (container) => [...capcalera(container).children].map((e) => `${e.tagName}.${e.className}`);
const barra = (container) => {
  const autor = container.querySelector('section.bar-orange .sp-card-author');
  return {
    nom: autor?.querySelector('.sp-card-author-name')?.textContent ?? null,
    href: autor?.matches('a.sp-card-author-link') ? autor.getAttribute('href') : null
  };
};
const vegades = (text, tros) => text.split(tros).length - 1;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.capacitats = new Set();
  escriu.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: escriu }, configurable: true });
});
afterEach(cleanup);

describe('Esmena 3 · la Samarreta al lector del MAS, com la seua pàgina', () => {
  test('la portada és el carrusel de huit fotos que comença per la xica: cap logotip de qui ven', () => {
    const element = samarreta();
    const container = pinta(element);
    const marc = portada(container);
    expect(marc).toBeTruthy();
    expect(container.querySelectorAll('.hero-image')).toHaveLength(1);
    const carrusel = within(marc).getByRole('region', { name: 'Imatges de Samarreta Sóc de Poble' });
    expect(carrusel.getAttribute('aria-roledescription')).toBe('carrusel');
    const srcs = [...marc.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(srcs).toHaveLength(8);
    expect(srcs).toEqual(element.images);
    expect(srcs[0]).toBe(XICA);
    expect(srcs).not.toContain(QUADRAT_VERD);
    expect(srcs).not.toContain(QUADRAT_VERD_PNG);
  });

  /* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 1) · Expectativa
     actualitzada a propòsit: cap targeta per variació (.note-card); les
     variacions són les píndoles del selector (radiogroup, per l'id estable) i
     una sola caixa de compra amb la variant triada i el seu preu. */
  test('les variacions, al selector de la caixa de compra, davall de «Obri al Mercat»; la descripció una vegada', () => {
    const element = samarreta();
    const container = pinta(element);
    expect(container.querySelector('.note-card')).toBeNull();
    const grup = within(container).getByRole('radiogroup', { name: 'Tria la variant' });
    const radios = within(grup).getAllByRole('radio');
    expect(radios.map((radio) => radio.value)).toEqual(['gris-plom', 'verda-pi']);
    expect(radios.map((radio) => radio.labels[0].textContent)).toEqual(['Edició Gris Plom', 'Edició Verda Esgotat']);
    expect(container.querySelectorAll('.sdp-compra .sp-card-price')).toHaveLength(1);
    expect(container.querySelector('.sdp-compra .sp-card-price').textContent).toBe('15.00€');
    expect(vegades(container.textContent, element.description)).toBe(1);
    // El cos va darrere del botó que porta a la publicació.
    const boto = screen.getByRole('button', { name: 'Obri al Mercat' });
    expect(boto.compareDocumentPosition(grup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('el subtítol es llig una sola vegada: l’entradilla ja no el repetix', () => {
    const element = samarreta();
    const container = pinta(element);
    const intro = container.querySelector('.page-intro');
    expect(intro.querySelector('h2').textContent).toBe(element.subtitle);
    expect(intro.querySelector('.lead')).toBeNull();
    expect(vegades(container.textContent, element.subtitle)).toBe(1);
  });

  /* Revisió adversarial del 261007 · El valor esperat és literal (la ruta
     del projecte, T6), com a PublicacioDetall.boina.test.jsx: calculat amb la
     mateixa funció que la implementació, les dues bandes podien ser null. */
  test('la boina continua on la porta T6, amb l’etiqueta i els drets de reserva de sempre', () => {
    const element = samarreta();
    const container = pinta(element);
    /* Onada 8 (261009) · El perfil de Sóc de Poble, ja no /projecte. */
    expect(RUTA_PERFIL_PROJECTE).toBe('/empresa/socdepoble');
    expect(barra(container)).toEqual({ nom: 'Sóc de Poble', href: RUTA_PERFIL_PROJECTE });
    expect(container.querySelector('.sdp-badge-system').textContent).toBe('Mercat');
    expect(container.textContent).toContain('© Sóc de Poble');
  });

  test('«Obri al Mercat» porta a /mercat/samarreta-socdepoble', () => {
    pinta(samarreta());
    fireEvent.click(screen.getByRole('button', { name: 'Obri al Mercat' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/mercat/samarreta-socdepoble');
  });

  test('Compartir envia l’enllaç del producte, mai el del Bloc (/notes?…)', async () => {
    pinta(samarreta());
    fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
    await waitFor(() => expect(escriu).toHaveBeenCalledTimes(1));
    const url = escriu.mock.calls[0][0];
    expect(url).toBe(new URL('/mercat/samarreta-socdepoble', window.location.origin).href);
    expect(url.endsWith('/mercat/samarreta-socdepoble')).toBe(true);
    expect(url).not.toContain('/notes');
  });
});

describe('Esmena 3 · altres productes i les altres seccions', () => {
  /* Gauntlet 261017 (C04) · La foto sola obri el visor: el mateix <img> de
     sempre, dins d'un botó (VisorDePublicacio · .sdp-visor__obridor). */
  test('un producte d’una foto: la seua foto sola, sense carrusel, obri el visor', () => {
    const container = pinta({ id: 'mel', title: 'Mel de romer', images: ['/assets/mel.png'], avatar_url: QUADRAT_VERD, imageSrc: QUADRAT_VERD, created_at: CREAT });
    const marc = portada(container);
    expect(marc.querySelector('.sdp-carrusel')).toBeNull();
    expect([...marc.children].map((fill) => fill.tagName)).toEqual(['BUTTON']);
    const obridor = marc.querySelector('button.sdp-visor__obridor[aria-haspopup="dialog"]');
    expect(obridor.childNodes).toHaveLength(1);
    expect(obridor.firstChild).toBe(marc.querySelector('img'));
    expect(marc.querySelector('img').getAttribute('src')).toBe('/assets/mel.png');
  });

  test('un producte que només porta l’avatar de qui ven: cap portada (com la seua pàgina)', () => {
    const container = pinta({ id: 'cadira', title: 'Cadira', seller: 'Pepa', avatar_url: QUADRAT_VERD, imageSrc: QUADRAT_VERD, created_at: CREAT });
    expect(portada(container)).toBeNull();
  });

  test('un producte que només porta seller «Pepa» conserva la barra «Pepa», sense enllaç', () => {
    const container = pinta({ id: 'cistella', title: 'Cistella', seller: 'Pepa', images: ['/assets/a.png', '/assets/b.png'], created_at: CREAT });
    expect(barra(container)).toEqual({ nom: 'Pepa', href: null });
    // El carrusel no xafa l'autoria de la barra.
    expect(portada(container).querySelector('.sdp-carrusel')).toBeTruthy();
  });

  test('el Mur pinta com abans: la portada de la fitxa, l’entradilla i el text', () => {
    const coca = { id: 'coca', title: 'Recepta de coca', image_url: '/assets/coca.png', description: 'Una coca de llanda', content: '<p>Farina i oli.</p>', created_at: CREAT };
    const container = pinta(coca, 'mur');
    expect(portada(container).querySelector('img').getAttribute('src')).toBe('/assets/coca.png');
    expect(vegades(container.textContent, 'Una coca de llanda')).toBe(1);
    expect(container.textContent).toContain('Farina i oli.');
    expect(container.querySelector('.note-card')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Obri al Mur' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/mur/coca');
  });

  test('Compartir d’una publicació del Mur també porta a la seua ruta', async () => {
    pinta({ id: 'coca', title: 'Recepta de coca', created_at: CREAT }, 'mur');
    fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
    await waitFor(() => expect(escriu).toHaveBeenCalledWith(new URL('/mur/coca', window.location.origin).href));
  });
});

describe('Ordre E · el logotip pujat damunt de l’H1 arriba al lector', () => {
  test('un logo_image segur: el logotip de l’entitat davant de l’H1, abans que l’avatar', () => {
    const container = pinta({
      id: 'pa', title: 'Pa de llenya', author_name: 'Javi', owner_user_id: 'javillinares', author_avatar: '/assets/javi.png',
      logo_image: '/assets/logo-forn.png', created_at: CREAT
    }, 'mur');
    expect(fills(container).slice(0, 2)).toEqual(['IMG.page-title-logo page-title-logo--entitat', 'H1.']);
    expect(capcalera(container).querySelector('img').getAttribute('src')).toBe('/assets/logo-forn.png');
    expect(container.querySelector('.page-title-avatar')).toBeNull();
  });

  test('sense logo_image, o amb la marca de Sóc de Poble, la capçalera de sempre', () => {
    const persona = { id: 'mac', title: 'Mac', author_name: 'Javi', owner_user_id: 'javillinares', author_avatar: '/assets/javi.png', created_at: CREAT };
    expect(fills(pinta(persona, 'mercat')).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']);
    cleanup();
    expect(fills(pinta({ ...persona, logo_image: LOGO_NEGRE }, 'mercat')).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']);
    cleanup();
    expect(fills(pinta({ ...persona, logo_image: 'javascript:alert(1)' }, 'mercat')).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']);
  });

  /* Decisió 3 del Mestre (261007, confirmada: «Imatges externes al Mur:
     PROHIBIDES (PRIVACITAT)») · El logotip resolt pel port només es pinta si
     ve del NOSTRE servidor de mitjans, el que registra la configuració
     (runtime.js) en producció. Ací, el Storage sintètic de la prova. */
  test('un sdp-media:// es pinta quan el port el resol', async () => {
    permetOrigenMitjans('https://mitjans.poble.test');
    mocks.capacitats = new Set(['mitjans']);
    mocks.resol.mockResolvedValue('https://mitjans.poble.test/logo.webp');
    const container = pinta({ id: 'pa', title: 'Pa', author_name: 'Forn', author_org_id: 'forn', logo_image: 'sdp-media://mitjans/forn/logo.webp', created_at: CREAT }, 'mur');
    await waitFor(() => expect(capcalera(container).querySelector('img.page-title-logo--entitat')).not.toBeNull());
    expect(capcalera(container).querySelector('img.page-title-logo--entitat').getAttribute('src')).toBe('https://mitjans.poble.test/logo.webp');
    expect(mocks.resol.mock.calls[0][0]).toBe('sdp-media://mitjans/forn/logo.webp');
  });

  /* Revisió adversarial del 261007 · Mentre el port resol el logotip d'una
     persona, cap avatar redó (el logotip el llevaria en arribar), com a la
     pàgina de la ruta; si el port no el resol, l'avatar torna. */
  test('un sdp-media:// d’una persona: cap avatar mentre es resol; sense resoldre, l’avatar torna', async () => {
    const persona = { id: 'pa', title: 'Pa', author_name: 'Javi', owner_user_id: 'javillinares', author_avatar: '/assets/javi.png',
      logo_image: 'sdp-media://mitjans/javi/logo.webp', created_at: CREAT };
    mocks.capacitats = new Set(['mitjans']);
    let entrega;
    mocks.resol.mockReturnValueOnce(new Promise((resol) => { entrega = resol; }));
    const container = pinta(persona, 'mur');
    await waitFor(() => expect(mocks.resol).toHaveBeenCalledTimes(1));
    expect(fills(container)[0]).toBe('H1.');
    expect(container.querySelector('.page-title-avatar')).toBeNull();
    await act(async () => { entrega(''); });
    await waitFor(() => expect(fills(container).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']));
    expect(container.querySelector('.page-title-logo')).toBeNull();
  });
});
