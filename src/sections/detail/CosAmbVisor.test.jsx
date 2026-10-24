/**
 * T4 (pla 261024_1315, P1-06; auditoria Gemini 261024, G-01: «les dues
 * fotografies del cos del mateix article […] es renderitzen dins de <div
 * class="media-frame detail-content__figura"> […] i fer-hi clic no obri cap
 * visor») · Les fotos del cos d'un detall obrin el visor de l'Arxiu visual
 * (CosAmbVisor de VisorDePublicacio.jsx, des d'ItemDetailSection amb
 * visorDelCosDElement de detailSectionMeta.jsx):
 *   · Les fotos pròpies del cos porten la marca (data-sdp-ampliable, tabindex
 *     0, role=button, aria-haspopup=dialog i un nom que porta l'alt); cap
 *     visor abans de cap gest; el contenidor és el div.content-wrapper de
 *     sempre i, sense les marques, el cos és el de renderRichText byte a byte.
 *   · El clic, Intro (en prémer) i Espai (en alçar-se) l'obrin a la foto, amb
 *     les fotos del cos com a galeria; Esc i «Tancar» el tanquen i el focus
 *     torna a la foto. La portada continua obrint el seu.
 *   · Fora: una foto dins d'un enllaç, una de fora (bloquejada), una pujada
 *     opaca (sdp-media://), una amb data-sdp-sense-visor, una icona, una
 *     amagada, les targetes incrustades i la foto de la variant del Mercat.
 *   · L'Aplec 2023 (el cas de l'auditoria), el Mercat i una nota (sense
 *     «Publicat a»).
 *   · Quan React reescriu el cos, les fotos noves es marquen
 *     (MutationObserver); una que diu en carregar que és una icona perd la
 *     marca, i en desactivar-lo, l'aria-label d'autor torna.
 * Es prova amb ItemDetailSection, la UniversalPage, el PageFrame, el
 * VisorDeLArxiu i el VisorImatges de veres (jsdom no té showModal: el Dialeg
 * posa `open`). El diferit i la precàrrega, a VisorDePublicacio.diferit.test.jsx.
 */
import React from 'react';
import { act, cleanup, createEvent, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FONT_DELS_DICCIONARIS } from '../../../tests/helpers/diccionaris.js';

const mocks = vi.hoisted(() => ({
  sectionId: 'mur', itemId: null, navigate: vi.fn(), t: (_, alternativa) => alternativa,
  mur: { events: [], feedPosts: [], marketItems: [] },
  notes: [],
  towns: [],
  sessio: { currentUser: null, estat: 'fora', rol: null, esSuperadmin: false }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: mocks.sectionId, itemId: mocks.itemId }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/${mocks.sectionId}/${mocks.itemId}`, search: '', state: null }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: mocks.towns }) }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: mocks.notes, status: 'ready' }) }));
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
import { CosAmbVisor, MARCA_AMPLIABLE, esImatgeDelCos, imatgesDelCos } from './VisorDePublicacio.jsx';
import { buildDetailSectionMeta, cosAmbImatgesPropies, visorDelCosDElement } from './detailSectionMeta.jsx';
import { renderRichText } from './detailRichText.jsx';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
import fontMeta from './detailSectionMeta.jsx?raw';
import { oblidaMetadades } from '../multimedia/useMetadadesFoto.js';

const OBRI = 'Veure la imatge a pantalla completa';
const PLANTILLA = 'Vore a pantalla completa: {alt}';
const obriFoto = (alt) => PLANTILLA.replace('{alt}', alt);
const GOOGLE = 'https://lh3.googleusercontent.com/a/foto.png';
const SDP_MEDIA = 'sdp-media://mitjans/poble/u/general/f.webp';
const CREAT = '2026-09-01T10:00:00.000Z';
const COS = '<p>Hola</p><p><img src="/assets/mur/a.webp" alt="Plaça"></p><p><img src="/assets/mur/b.webp" alt="Font"></p>';
const MARQUES = [MARCA_AMPLIABLE, 'tabindex', 'role', 'aria-haspopup', 'aria-label'];
const DADES = { titol: 'La plaça', autor: 'Pepa' };

const publicacio = (extra) => ({ id: 'placa', title: 'La plaça', author: 'Pepa', created_at: CREAT, content: COS, ...extra });

function pinta(item, seccio = 'mur') {
  mocks.sectionId = seccio;
  mocks.itemId = item.id;
  mocks.mur = {
    events: seccio === 'events' ? [item] : [],
    feedPosts: seccio === 'mur' ? [item] : [],
    marketItems: seccio === 'mercat' ? [item] : []
  };
  mocks.notes = seccio === 'notes' ? [item] : [];
  return render(<ItemDetailSection />);
}

const cos = (container) => container.querySelector('.detail-content');
const fotosDelCos = (container) => [...cos(container).querySelectorAll('img')];
const marcades = (container) => fotosDelCos(container).filter((img) => img.hasAttribute(MARCA_AMPLIABLE));
const capVisor = () => document.querySelector('dialog.sdp-visor');
const visor = () => document.querySelector('dialog.sdp-visor[open]');
const fotoDelVisor = () => visor().querySelector('img.sdp-visor__imatge');
const comptador = () => visor().querySelector('.sdp-visor__comptador').textContent;
const tancar = () => within(visor()).getByRole('button', { name: 'Tancar el visor' });
const fila = (etiqueta) => [...visor().querySelectorAll('.sdp-visor__fila')].find((f) => f.querySelector('dt').textContent === etiqueta)?.querySelector('dd');
const esc = () => act(() => { visor().dispatchEvent(new Event('cancel', { cancelable: true })); });
const espera = () => act(async () => { await new Promise((resol) => { setTimeout(resol, 30); }); });

/* Un clic de ratolí a la foto: jsdom no enfoca en clicar (el visor ho fa). El
   visor arriba en diferit: el clic n'espera el tros. */
async function clica(img) {
  act(() => { fireEvent.click(img, { detail: 1 }); });
  await waitFor(() => expect(visor()).not.toBeNull());
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.towns = [];
  mocks.t = (_, alternativa) => alternativa;
  oblidaMetadades();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('una publicació del Mur: les fotos del cos obrin el visor', () => {
  test('les fotos pròpies del cos porten la marca i un nom amb l’alt; cap visor abans de cap gest; el contenidor de sempre i el cos byte a byte', () => {
    const { container } = pinta(publicacio());
    const [a, b] = fotosDelCos(container);
    for (const [img, alt] of [[a, 'Plaça'], [b, 'Font']]) {
      expect(img.hasAttribute(MARCA_AMPLIABLE)).toBe(true);
      expect(img.getAttribute('tabindex')).toBe('0');
      expect(img.getAttribute('role')).toBe('button');
      expect(img.getAttribute('aria-haspopup')).toBe('dialog');
      expect(img.getAttribute('aria-label')).toBe(obriFoto(alt));
      expect(img.getAttribute('alt')).toBe(alt);
    }
    expect(screen.getByRole('button', { name: obriFoto('Plaça') })).toBe(a);
    expect(capVisor()).toBeNull();
    // El contenidor és el div.content-wrapper de sempre: cap node ni atribut nou.
    const embolcall = cos(container).parentElement;
    expect([embolcall.tagName, embolcall.className]).toEqual(['DIV', 'content-wrapper']);
    expect([...embolcall.attributes].map((atribut) => atribut.name)).toEqual(['class']);
    // Sense les marques, el cos és el que pinta renderRichText, byte a byte.
    const net = cos(container).cloneNode(true);
    for (const img of net.querySelectorAll('img')) for (const nom of MARQUES) img.removeAttribute(nom);
    const sol = render(<>{renderRichText(cosAmbImatgesPropies(COS))}</>).container;
    expect(net.outerHTML).toBe(sol.firstElementChild.outerHTML);
  });

  test('el clic obri la foto clicada, amb les fotos del cos de galeria; les fletxes donen la volta; Esc tanca i el focus torna a la foto', async () => {
    const { container } = pinta(publicacio());
    const [a, b] = fotosDelCos(container);
    await clica(b);
    expect(fotoDelVisor().getAttribute('src')).toBe('/assets/mur/b.webp');
    expect(comptador()).toBe('2 / 2Imatge 2 de 2');
    expect(document.activeElement).toBe(tancar());
    // El visor no és dins del cos.
    expect(cos(container).contains(visor())).toBe(false);
    fireEvent.keyDown(tancar(), { key: 'ArrowLeft' });
    expect(fotoDelVisor().getAttribute('src')).toBe('/assets/mur/a.webp');
    fireEvent.keyDown(tancar(), { key: 'ArrowLeft' });
    expect(fotoDelVisor().getAttribute('src')).toBe('/assets/mur/b.webp');
    // Les dades de la publicació, com la portada: «Publicat a» és la publicació.
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(fila('Publicat a').textContent).toBe('Mur · La plaça');
    esc();
    expect(visor()).toBeNull();
    expect(document.activeElement).toBe(b);
    await clica(a);
    expect(comptador()).toBe('1 / 2Imatge 1 de 2');
    act(() => tancar().click());
    expect(visor()).toBeNull();
    expect(document.activeElement).toBe(a);
  });

  test('la portada continua obrint el seu visor, amb la seua foto sola', async () => {
    const { container } = pinta(publicacio({ image_url: '/assets/mur/portada.webp' }));
    const boto = within(container.querySelector('.hero-image')).getByRole('button', { name: OBRI });
    act(() => { fireEvent.click(boto, { detail: 1 }); });
    await waitFor(() => expect(visor()).not.toBeNull());
    expect(fotoDelVisor().getAttribute('src')).toBe('/assets/mur/portada.webp');
    expect(comptador()).toBe('1 / 1Imatge 1 de 1');
    esc();
    expect(document.activeElement).toBe(boto);
    // Després, una foto del cos obri el seu, amb la galeria del cos.
    await clica(fotosDelCos(container)[0]);
    expect(comptador()).toBe('1 / 2Imatge 1 de 2');
  });

  test('Intro l’obri en prémer i Espai en alçar-se (prevenint el desplaçament); amb una tecla modificadora, una repetició o un altre clic, res', async () => {
    const { container } = pinta(publicacio());
    const [a, b] = fotosDelCos(container);
    act(() => a.focus());
    fireEvent.keyDown(a, { key: 'Enter', altKey: true });
    fireEvent.keyDown(a, { key: 'Enter', ctrlKey: true });
    fireEvent.keyDown(a, { key: 'Enter', repeat: true });
    fireEvent.keyDown(a, { key: 'a' });
    fireEvent.keyUp(a, { key: ' ' });
    // El segon clic d'un doble clic no obri.
    act(() => { fireEvent.click(b, { detail: 2 }); });
    await espera();
    expect(capVisor()).toBeNull();
    const espai = createEvent.keyDown(a, { key: ' ' });
    fireEvent(a, espai);
    expect(espai.defaultPrevented).toBe(true);
    await espera();
    expect(capVisor()).toBeNull();
    fireEvent.keyUp(a, { key: ' ' });
    await waitFor(() => expect(visor()).not.toBeNull());
    expect(fotoDelVisor().getAttribute('src')).toBe('/assets/mur/a.webp');
    esc();
    expect(document.activeElement).toBe(a);
    act(() => b.focus());
    const intro = createEvent.keyDown(b, { key: 'Enter' });
    fireEvent(b, intro);
    expect(intro.defaultPrevented).toBe(true);
    await waitFor(() => expect(visor()).not.toBeNull());
    expect(fotoDelVisor().getAttribute('src')).toBe('/assets/mur/b.webp');
  });

  test('fora del visor: un enllaç, una foto de fora (bloquejada), una pujada opaca, data-sdp-sense-visor, una icona i una amagada', async () => {
    const mixt = [
      '<p><img src="/assets/mur/a.webp" alt="Plaça"></p>',
      '<p><a href="/mur/altra"><img src="/assets/mur/enllac.webp" alt="Enllaç"></a></p>',
      `<p><img src="${GOOGLE}" alt="Fora"></p>`,
      `<p><img src="${SDP_MEDIA}" alt="Pujada"></p>`,
      '<p><img src="/assets/mur/deco.webp" alt="Decorativa" data-sdp-sense-visor=""></p>',
      '<p><img src="/assets/mur/icona.webp" alt="Icona" width="16" height="16"></p>',
      '<p><img src="/assets/mur/amagada.webp" alt="" aria-hidden="true"></p>'
    ].join('');
    const { container } = pinta(publicacio({ content: mixt }));
    const fotos = fotosDelCos(container);
    expect(fotos).toHaveLength(7);
    expect(marcades(container).map((img) => img.getAttribute('alt'))).toEqual(['Plaça']);
    expect(fotos[2].hasAttribute('data-sdp-bloquejada')).toBe(true);
    for (const img of fotos.slice(1)) expect([img.getAttribute('alt'), MARQUES.filter((nom) => img.hasAttribute(nom))]).toEqual([img.getAttribute('alt'), []]);
    // El clic a les de fora no obri res (la de l'enllaç navega: no es clica).
    for (const img of fotos.slice(2)) act(() => { fireEvent.click(img, { detail: 1 }); });
    await espera();
    expect(capVisor()).toBeNull();
    await clica(fotos[0]);
    expect(comptador()).toBe('1 / 1Imatge 1 de 1');
  });
});

describe('l’Aplec 2023, el Mercat i una nota', () => {
  test('l’Aplec 2023 (el cas de l’auditoria): les dues fotos de l’article obrin el visor', async () => {
    const { container } = pinta({ id: 'aplec-2023', title: 'Aplec 2023', created_at: CREAT }, 'events');
    expect(marcades(container).map((img) => img.getAttribute('aria-label'))).toEqual([
      obriFoto('Cartell Ponents Aplec'), obriFoto('Reunió preparatòria Aplec')
    ]);
    await clica(marcades(container)[1]);
    expect(fotoDelVisor().getAttribute('src')).toBe('/assets/events/aplec_2023_reunio.webp');
    expect(comptador()).toBe('2 / 2Imatge 2 de 2');
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(fila('Publicat a').textContent).toBe('Agenda · Aplec 2023');
  });

  test('el Mercat: la foto de la descripció obri el visor; la de la variant (.sdp-compra__foto), no', async () => {
    const mel = {
      id: 'mel', title: 'Mel de romer', seller: 'Pepa', created_at: CREAT, images: ['/assets/mercat/mel.png'],
      description: '<p>Del Carrascal.</p><p><img src="/assets/mercat/pot.webp" alt="Pot"></p>',
      variations: [{ id: 'gran', name: 'Pot gran', image: '/assets/mercat/gran.webp', price: '8 €' }]
    };
    const { container } = pinta(mel, 'mercat');
    const variant = container.querySelector('img.sdp-compra__foto');
    expect(variant.getAttribute('src')).toBe('/assets/mercat/gran.webp');
    expect(MARQUES.filter((nom) => variant.hasAttribute(nom))).toEqual([]);
    expect(marcades(container).map((img) => img.getAttribute('alt'))).toEqual(['Pot']);
    act(() => { fireEvent.click(variant, { detail: 1 }); });
    await espera();
    expect(capVisor()).toBeNull();
    await clica(marcades(container)[0]);
    expect(fotoDelVisor().getAttribute('src')).toBe('/assets/mercat/pot.webp');
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(fila('Publicat a').textContent).toBe('Mercat · Mel de romer');
  });

  test('una nota: la seua foto pròpia obri el visor, sense «Publicat a»; un avatar de fora (OAuth), no', async () => {
    const nota = {
      id: 'n1', title: 'Apunts', folderId: 'General', updatedAt: '',
      body: `<p><img src="/assets/notes/pissarra.webp" alt="Pissarra"></p><p><img src="${GOOGLE}" alt="Avatar"></p>`
    };
    const { container } = pinta(nota, 'notes');
    const [propia, oauth] = fotosDelCos(container);
    // El sanejador de les notes deixa l'avatar OAuth; el visor no el demana mai.
    expect(oauth.getAttribute('src')).toBe(GOOGLE);
    expect(oauth.hasAttribute(MARCA_AMPLIABLE)).toBe(false);
    expect(propia.getAttribute('aria-label')).toBe(obriFoto('Pissarra'));
    await clica(propia);
    expect(comptador()).toBe('1 / 1Imatge 1 de 1');
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(fila('Publicat a')).toBeUndefined();
    expect(fila('Resolució')).toBeDefined();
  });
});

describe('les marques segueixen el cos', () => {
  const Cos = ({ html, dades = DADES }) => (
    <CosAmbVisor className="content-wrapper" dades={dades} etiquetaObri={OBRI} etiquetaObriFoto={PLANTILLA}>
      {renderRichText(html)}
    </CosAmbVisor>
  );

  test('quan React reescriu l’HTML del cos, les fotos noves es marquen (MutationObserver) i la galeria és la nova', async () => {
    const vista = render(<Cos html={COS} />);
    expect(marcades(vista.container)).toHaveLength(2);
    vista.rerender(<Cos html={'<p><img src="/assets/mur/c.webp" alt="Riu"></p>'} />);
    await waitFor(() => expect(marcades(vista.container).map((img) => img.getAttribute('aria-label'))).toEqual([obriFoto('Riu')]));
    await clica(marcades(vista.container)[0]);
    expect(fotoDelVisor().getAttribute('src')).toBe('/assets/mur/c.webp');
    expect(comptador()).toBe('1 / 1Imatge 1 de 1');
  });

  test('una altra publicació amb el visor obert (Arrere): el visor es tanca, i no torna en tornar-hi', async () => {
    const altra = { titol: 'El riu', autor: 'Pep', article: { sectionId: 'mur', id: 'riu' } };
    const propia = { ...DADES, article: { sectionId: 'mur', id: 'placa' } };
    const vista = render(<Cos html={COS} dades={propia} />);
    await clica(marcades(vista.container)[1]);
    vista.rerender(<Cos html={'<p><img src="/assets/mur/c.webp" alt="Riu"></p>'} dades={altra} />);
    expect(visor()).toBeNull();
    vista.rerender(<Cos html={COS} dades={propia} />);
    await espera();
    expect(visor()).toBeNull();
    await waitFor(() => expect(marcades(vista.container)).toHaveLength(2));
    await clica(marcades(vista.container)[0]);
    expect(comptador()).toBe('1 / 2Imatge 1 de 2');
  });

  test('una foto que en carregar diu que és una icona (menys de 48 px) perd la marca', async () => {
    const vista = render(<Cos html={'<p><img src="/assets/mur/riure.webp" alt="Riure"></p><p><img src="/assets/mur/gran.webp" alt="Gran"></p>'} />);
    const [riure, gran] = fotosDelCos(vista.container);
    expect(riure.hasAttribute(MARCA_AMPLIABLE)).toBe(true);
    for (const [img, costat] of [[riure, 24], [gran, 1200]]) {
      Object.defineProperty(img, 'naturalWidth', { configurable: true, value: costat });
      Object.defineProperty(img, 'naturalHeight', { configurable: true, value: costat });
      fireEvent.load(img);
    }
    expect(MARQUES.filter((nom) => riure.hasAttribute(nom))).toEqual([]);
    expect(gran.hasAttribute(MARCA_AMPLIABLE)).toBe(true);
    await clica(gran);
    expect(comptador()).toBe('1 / 1Imatge 1 de 1');
  });

  test('sense dades, cap marca: el contenidor tal qual; en desactivar-lo, l’aria-label que portava torna', () => {
    const html = '<p><img src="/assets/mur/a.webp" alt="Plaça" aria-label="La plaça major"></p>';
    const vista = render(<Cos html={html} />);
    const [img] = fotosDelCos(vista.container);
    expect(img.getAttribute('aria-label')).toBe(obriFoto('Plaça'));
    vista.rerender(<Cos html={html} dades={null} />);
    expect(MARQUES.filter((nom) => img.hasAttribute(nom))).toEqual(['aria-label']);
    expect(img.getAttribute('aria-label')).toBe('La plaça major');
    act(() => { fireEvent.click(img, { detail: 1 }); });
    expect(capVisor()).toBeNull();
    cleanup();
    const sense = render(<Cos html={COS} dades={null} />);
    expect(marcades(sense.container)).toEqual([]);
    expect([...sense.container.firstElementChild.attributes].map((atribut) => atribut.name)).toEqual(['class']);
  });

  test('un data-sdp-ampliable que ja venia a l’HTML: la foto del cos es marca sencera; la de fora el perd', () => {
    const html = '<p><img src="/assets/mur/a.webp" alt="Plaça" data-sdp-ampliable=""></p>'
      + '<p><a href="/x"><img src="/assets/mur/b.webp" alt="Dins" data-sdp-ampliable=""></a></p>';
    const vista = render(<Cos html={html} />);
    const [dins, enllac] = fotosDelCos(vista.container);
    expect(MARQUES.filter((nom) => dins.hasAttribute(nom))).toEqual(MARQUES);
    expect(MARQUES.filter((nom) => enllac.hasAttribute(nom))).toEqual([]);
  });

  /* Correccions del 261024 (R4-06) · L'HTML de l'autor (el sanejador deixa
     els aria-*) amb una foto dins d'un pare aria-hidden: cap botó enfocable
     amagat al lector. L'observador mira hidden i inert dins del cos; un inert
     de fora del contenidor (modalLocal.js, AppGridShell) no desmarca res. */
  test('una foto dins d’un pare amagat del cos (aria-hidden, hidden, inert) no es marca; mostrar-lo la marca; un inert de fora no la desmarca', async () => {
    const html = '<p><img src="/assets/mur/a.webp" alt="Plaça"></p>'
      + '<div aria-hidden="true"><p><img src="/assets/mur/b.webp" alt="Amagada"></p></div>'
      + '<div class="plegable"><p><img src="/assets/mur/c.webp" alt="Plegada"></p></div>';
    const vista = render(<Cos html={html} />);
    const [placa, amagada, plegada] = fotosDelCos(vista.container);
    expect(amagada.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(marcades(vista.container)).toEqual([placa, plegada]);
    expect(MARQUES.filter((nom) => amagada.hasAttribute(nom))).toEqual([]);
    // Un pare del cos que s'amaga (hidden) o es fa inert: la foto perd la marca; tornat, la recupera.
    const plegable = vista.container.querySelector('.plegable');
    for (const atribut of ['hidden', 'inert']) {
      act(() => { plegable.setAttribute(atribut, ''); });
      await waitFor(() => expect(marcades(vista.container)).toEqual([placa]));
      expect(MARQUES.filter((nom) => plegada.hasAttribute(nom))).toEqual([]);
      act(() => { plegable.removeAttribute(atribut); });
      await waitFor(() => expect(marcades(vista.container)).toEqual([placa, plegada]));
    }
    // L'App inert de fora del contenidor (un modal obert): les marques es queden, també si es tornen a calcular.
    act(() => { vista.container.setAttribute('inert', ''); vista.container.setAttribute('aria-hidden', 'true'); });
    fireEvent.load(placa);
    expect(marcades(vista.container)).toEqual([placa, plegada]);
    vista.container.removeAttribute('inert');
    vista.container.removeAttribute('aria-hidden');
    // La galeria són les visibles: l'amagada no hi entra.
    await clica(plegada);
    expect(comptador()).toBe('2 / 2Imatge 2 de 2');
  });
});

describe('esImatgeDelCos i imatgesDelCos', () => {
  test('només les fotos pròpies de .detail-content, fora de targetes, enllaços, botons, la variant i el que s’amaga', () => {
    const node = render(
      <div>
        <article className="detail-content">
          <img id="si" src="/assets/a.webp" alt="A" />
          <img id="dades" src="data:image/png;base64,iVBORw0KGgo=" alt="Dades" />
          <div className="sdp-targetes"><img id="targeta" src="/assets/t.webp" alt="" /></div>
          <button type="button"><img id="boto" src="/assets/b.webp" alt="" /></button>
          <img id="variant" className="sdp-compra__foto" src="/assets/v.webp" alt="" />
          <img id="presentacio" role="presentation" src="/assets/p.webp" alt="" />
          <img id="buida" alt="" />
          <img id="fora" src="https://rastreig.example/p.gif" alt="" />
          <img id="declarada" src="/assets/d.webp" width="600" height="400" alt="" />
        </article>
        <img id="defora" src="/assets/f.webp" alt="" />
      </div>
    ).container.firstElementChild;
    const decidix = (id) => esImatgeDelCos(node.querySelector(`#${id}`), node);
    expect(['si', 'dades', 'declarada'].map(decidix)).toEqual([true, true, true]);
    expect(['targeta', 'boto', 'variant', 'presentacio', 'buida', 'fora', 'defora'].map(decidix)).toEqual(Array(7).fill(false));
    // Una mida declarada mana sobre la real; sense, la real (una icona de 20 px).
    const declarada = node.querySelector('#declarada');
    Object.defineProperty(declarada, 'naturalWidth', { configurable: true, value: 20 });
    Object.defineProperty(declarada, 'naturalHeight', { configurable: true, value: 20 });
    expect(decidix('declarada')).toBe(true);
    const si = node.querySelector('#si');
    Object.defineProperty(si, 'naturalWidth', { configurable: true, value: 20 });
    Object.defineProperty(si, 'naturalHeight', { configurable: true, value: 20 });
    expect(decidix('si')).toBe(false);
    // Fora del contenidor, mai; sense contenidor, cap.
    expect(esImatgeDelCos(node.querySelector('#dades'), document.createElement('div'))).toBe(false);
    expect(esImatgeDelCos(null, node)).toBe(false);
    expect(imatgesDelCos(node).map((img) => img.id)).toEqual(['dades', 'declarada']);
    expect(imatgesDelCos(null)).toEqual([]);
  });

  /* Correccions del 261024 (R4-06) · Amagada per un pare dins del contenidor
     (aria-hidden="true", hidden o inert), o ella mateixa: fora. Un pare amagat
     de fora del contenidor no compta. */
  test('fora també la foto dins d’un pare amagat del contenidor (aria-hidden, hidden, inert); un pare amagat de fora no compta', () => {
    const arrel = document.createElement('div');
    arrel.innerHTML = '<div id="columna" inert="" aria-hidden="true"><div id="contenidor"><article class="detail-content">'
      + '<img id="visible" src="/assets/a.webp" alt="A">'
      + '<div aria-hidden="true"><p><img id="ariaHidden" src="/assets/b.webp" alt="B"></p></div>'
      + '<div hidden><img id="hidden" src="/assets/c.webp" alt="C"></div>'
      + '<section inert=""><figure><img id="inert" src="/assets/d.webp" alt="D"></figure></section>'
      + '<img id="ellaMateixa" aria-hidden="true" src="/assets/e.webp" alt="">'
      + '<div aria-hidden="false"><img id="ariaFalse" src="/assets/f.webp" alt="F"></div>'
      + '</article></div></div>';
    document.body.append(arrel);
    try {
      const contenidor = arrel.querySelector('#contenidor');
      const decidix = (id) => esImatgeDelCos(arrel.querySelector(`#${id}`), contenidor);
      expect(['visible', 'ariaFalse'].map(decidix)).toEqual([true, true]);
      expect(['ariaHidden', 'hidden', 'inert', 'ellaMateixa'].map(decidix)).toEqual([false, false, false, false]);
      expect(imatgesDelCos(contenidor).map((img) => img.id)).toEqual(['visible', 'ariaFalse']);
      // El contenidor mateix amagat: les seues fotos, fora.
      contenidor.setAttribute('hidden', '');
      expect(imatgesDelCos(contenidor)).toEqual([]);
    } finally {
      arrel.remove();
    }
  });
});

describe('visorDelCosDElement', () => {
  const metes = buildDetailSectionMeta({ t: (_, alternativa) => alternativa });

  test('el Mur, el Mercat, l’agenda i les notes, amb un element amb id; Pobles, Multimèdia i un element sense id, null', () => {
    const pagina = { title: 'Mel', authorName: 'Pepa' };
    const mur = visorDelCosDElement(metes.mur, { id: 'mel', town_name: 'Tibi' }, pagina, mocks.t);
    expect(mur).toEqual({
      dades: { titol: 'Mel', autor: 'Pepa', drets: null, poble: 'Tibi', article: { sectionId: 'mur', id: 'mel' } },
      etiquetaObri: OBRI,
      etiquetaObriFoto: PLANTILLA
    });
    expect(visorDelCosDElement(metes.mercat, { id: 'mel' }, pagina, mocks.t).dades.article).toEqual({ sectionId: 'mercat', id: 'mel' });
    expect(visorDelCosDElement(metes.events, { id: 'fira' }, pagina, mocks.t).dades.article).toEqual({ sectionId: 'events', id: 'fira' });
    expect(visorDelCosDElement(metes.notes, { id: 'n1' }, pagina, mocks.t).ometFiles).toEqual(['publicat']);
    expect(visorDelCosDElement(metes.pobles, { id: 'tibi' }, pagina, mocks.t)).toBeNull();
    expect(visorDelCosDElement(metes.multimedia, { id: 'era' }, pagina, mocks.t)).toBeNull();
    expect(visorDelCosDElement(metes.mur, { id: '' }, pagina, mocks.t)).toBeNull();
    expect(visorDelCosDElement(metes.mur, {}, pagina, mocks.t)).toBeNull();
  });
});

describe('i18n del nom d’una foto del cos', () => {
  test('valor propi en les cinc llengües amb {alt}, una aparició per llengua; en valencià, la reserva del codi', () => {
    const clau = 'section.multimedia.visor.obriFoto';
    expect(fontMeta).toContain(`t('${clau}', '${PLANTILLA}')`);
    expect(createTranslator('ca')(clau)).toBe(PLANTILLA);
    for (const { code } of SUPPORTED_LANGUAGES) {
      const valor = createTranslator(code)(clau);
      expect([code, valor === clau, valor.includes('{alt}')]).toEqual([code, false, true]);
      if (code !== 'ca') expect([code, valor === PLANTILLA]).toEqual([code, false]);
    }
    expect(FONT_DELS_DICCIONARIS.split(`'${clau}':`).length - 1).toBe(SUPPORTED_LANGUAGES.length);
  });

  test('en anglés, la foto del cos parla anglés', () => {
    mocks.t = createTranslator('en');
    const { container } = pinta(publicacio());
    expect(fotosDelCos(container)[0].getAttribute('aria-label')).toBe('View full screen: Plaça');
  });
});
