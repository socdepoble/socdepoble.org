/**
 * Revisió del Gauntlet 261017 (M2; C04 de Codex: «Obertura modal a pantalla
 * completa en fer clic a qualsevol imatge d'una galeria o publicació») · El
 * lector del MAS (PublicacioDetall) d'una publicació del Mur o d'un acte de
 * l'agenda amb portada porta el mateix disparador que la seua pàgina
 * (portadaDElement · VisorDePublicacio): la mateixa imatge dins d'un botó amb
 * nom, i el visor de l'Arxiu visual sense eixir del Bloc. Una portada pujada
 * (sdp-media://) es resol pel port, com la de PageFrame: mentre no es resol,
 * o sense la capacitat 'mitjans', la portada buida de sempre; resolta, el
 * botó amb la URL del port, i el visor no en llig l'EXIF (cap petició més a
 * una mitja privada). La Multimèdia i un producte del Mercat, com abans.
 * UniversalPage, PageFrame, VisorDeLArxiu i VisorImatges de veres (jsdom no
 * té showModal: el Dialeg posa `open`).
 */
import React from 'react';
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa, mitjans: false,
  identitat: { actor: { tipus: 'persona', id: 'U', nom: 'Pep' } },
  core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] },
  mur: { status: 'ready', feedPosts: [], events: [], marketItems: [] }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: '/notes', search: '?carpeta=mur', state: null }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => { throw new Error('fora de l’app'); }
}));
/* La capacitat 'mitjans' només quan una prova la demana: el port resol un
   sdp-media:// al Storage sintètic de la prova. */
vi.mock('../../data/backendPort.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    teCapacitat: (capacitat) => capacitat === 'mitjans' && mocks.mitjans,
    resolveAsset: (ref, opcions) => (mocks.mitjans
      ? Promise.resolve(String(ref).replace('sdp-media://', 'https://lector-1.supabase.test/storage/v1/object/public/'))
      : original.resolveAsset(ref, opcions))
  };
});
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));

import { PublicacioDetall } from './PublicacioDetall.jsx';
import { publicacioComANota } from './masDeLUsuari.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';
import { oblidaMetadades } from '../multimedia/useMetadadesFoto.js';

const OBRI = 'Veure la imatge a pantalla completa';
const STORAGE = 'https://lector-1.supabase.test';
const CREAT = '2026-09-20T09:15:00Z';
const SDP_MEDIA = 'sdp-media://mitjans/poble/u/general/coca.webp';
const RESOLT = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/general/coca.webp`;

const pinta = (element, seccio) => render(<PublicacioDetall item={publicacioComANota(element, seccio)} />).container;
const portada = (container) => container.querySelector('.hero-image');
const visor = () => document.querySelector('dialog.sdp-visor');
const obert = () => visor()?.hasAttribute('open') === true;
const fotoDelVisor = () => visor().querySelector('img.sdp-visor__imatge');
const fila = (etiqueta) => [...visor().querySelectorAll('.sdp-visor__fila')].find((f) => f.querySelector('dt').textContent === etiqueta)?.querySelector('dd');
const persona = (extra) => ({ id: 'coca', title: 'Recepta de coca', author_name: 'Pepa', owner_user_id: 'u-1', created_at: CREAT, ...extra });

async function obri(boto) {
  act(() => boto.focus());
  act(() => { fireEvent.click(boto, { detail: 1 }); });
  await waitFor(() => expect(obert()).toBe(true));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mitjans = false;
  oblidaMetadades();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('una publicació del Mur o un acte, al lector del MAS: la portada obri el visor', () => {
  test.each([
    ['mur', persona({ image_url: '/assets/coca.png' }), '/assets/coca.png', '/mur/coca'],
    ['events', persona({ id: 'fira', title: 'Fira de Tibi', image_url: '/assets/fira.png' }), '/assets/fira.png', '/events/fira']
  ])('%s · la mateixa imatge (src i alt), dins d’un botó amb nom; el clic obri el visor amb la foto i «Publicat a» porta a la publicació', async (seccio, element, src, ruta) => {
    const container = pinta(element, seccio);
    const marc = portada(container);
    const boto = within(marc).getByRole('button', { name: OBRI });
    expect([...marc.children]).toEqual([boto]);
    expect(boto.className).toBe('sdp-visor__obridor');
    expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
    expect([...boto.children].map((fill) => fill.tagName)).toEqual(['IMG']);
    const img = boto.querySelector('img');
    expect([img.getAttribute('src'), img.getAttribute('alt')]).toEqual([src, element.title]);
    expect([...img.attributes].map((a) => a.name).sort()).toEqual(['alt', 'src']);
    expect(visor()).toBeNull();
    await obri(boto);
    expect(fotoDelVisor().getAttribute('src')).toBe(src);
    expect(marc.contains(visor())).toBe(false);
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(fila('Publicat a').querySelector('a').getAttribute('href')).toBe(ruta);
    expect(fila('Autor').textContent).toBe('Pepa');
    act(() => { visor().dispatchEvent(new Event('cancel', { cancelable: true })); });
    expect(obert()).toBe(false);
    expect(document.activeElement).toBe(boto);
  });

  test('sense portada, o amb una de fora, cap botó ni cap visor (com abans)', () => {
    const sense = pinta(persona(), 'mur');
    expect(portada(sense)).toBeNull();
    cleanup();
    const fora = pinta(persona({ image_url: 'https://rastreig.example/p.gif' }), 'events');
    expect(portada(fora)).toBeNull();
    expect(fora.querySelector('.sdp-visor__obridor')).toBeNull();
  });
});

describe('una portada pujada (sdp-media://), pel port', () => {
  test('resolta: el botó amb la URL del port; el visor la pinta i no en llig l’EXIF (cap petició a la mitja privada)', async () => {
    mocks.mitjans = true;
    permetOrigenMitjans(STORAGE);
    const container = pinta(persona({ image_url: SDP_MEDIA }), 'mur');
    const boto = await within(container).findByRole('button', { name: OBRI });
    expect([...portada(container).children]).toEqual([boto]);
    expect(boto.querySelector('img').getAttribute('src')).toBe(RESOLT);
    await obri(boto);
    expect(fotoDelVisor().getAttribute('src')).toBe(RESOLT);
    act(() => within(visor()).getByRole('button', { name: 'Informació de la imatge' }).click());
    expect(fila('Càmera').textContent).toBe('Desconegut');
    Object.defineProperty(fotoDelVisor(), 'naturalWidth', { configurable: true, value: 1600 });
    Object.defineProperty(fotoDelVisor(), 'naturalHeight', { configurable: true, value: 1200 });
    fireEvent.load(fotoDelVisor());
    expect(fila('Resolució').textContent).toBe('1600 × 1200 px');
    await act(async () => { await new Promise((resol) => { setTimeout(resol, 20); }); });
    expect(fetch).not.toHaveBeenCalled();
  });

  test('sense la capacitat de mitjans: la portada buida de sempre, sense botó ni cap petició', () => {
    const container = pinta(persona({ image_url: SDP_MEDIA }), 'mur');
    const marc = portada(container);
    expect(marc).not.toBeNull();
    expect([...marc.children]).toEqual([]);
    expect(container.querySelector('img[src*="sdp-media"]')).toBeNull();
  });
});

describe('fora del Mur i de l’agenda, com abans', () => {
  test('la Multimèdia: la imatge sola, sense botó', () => {
    const container = pinta(persona({ id: 'era', title: 'Era', src: '/assets/era.png', kind: 'image' }), 'multimedia');
    const marc = portada(container);
    expect([...marc.children].map((fill) => fill.tagName)).toEqual(['IMG']);
    expect(marc.querySelector('button')).toBeNull();
  });
});
