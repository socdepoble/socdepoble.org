/**
 * Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
 * PROHIBIDES (PRIVACITAT).» Relleu 261007 (peça «imatges-detall»).
 *
 * El lector del MAS (PublicacioDetall) d'una publicació del Mur, del Mercat o
 * de l'agenda porta el mode estricte de la seua pàgina: l'avatar redó de
 * davant de l'H1, l'avatar de la barra taronja, la portada (també el
 * carrusel i les variacions d'un producte) i la miniatura de la fitxa del
 * llistat (PublicacioFitxa). Una imatge de fora no es demana; una de pròpia
 * es pinta com abans. Multimèdia no canvia. Els orígens són sintètics. Es
 * prova amb la UniversalPage i el PageFrame de veres.
 */
import React from 'react';
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa, mitjans: false,
  identitat: { actor: { tipus: 'persona', id: 'U', nom: 'Pep' } },
  core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] },
  mur: { status: 'ready', feedPosts: [], events: [], marketItems: [] }
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
/* Revisió adversarial del 261008 · La capacitat 'mitjans' només quan una
   prova la demana (mocks.mitjans): el port resol aleshores un sdp-media://
   al Storage sintètic de la prova. Les altres capacitats, mai. */
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

import { PublicacioDetall, PublicacioFitxa } from './PublicacioDetall.jsx';
import { publicacioComANota } from './masDeLUsuari.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';

const GOOGLE = 'https://lh3.googleusercontent.com/a/pepa.png';
const RASTREIG = 'https://rastreig.example/p.gif?campanya=1';
const STORAGE = 'https://lector-1.supabase.test';
const CREAT = '2026-09-20T09:15:00Z';

const pinta = (element, seccio) => render(<PublicacioDetall item={publicacioComANota(element, seccio)} />).container;
const fonts = (container) => [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
const capcalera = (container) => container.querySelector('header.page-title');
const fills = (container) => [...capcalera(container).children].map((e) => `${e.tagName}.${e.className}`);
const portada = (container) => container.querySelector('.hero-image');
const avatarDeLaBarra = (container) => container.querySelector('section.bar-orange img.sp-card-avatar');
const siluetaDeLaBarra = (container) => container.querySelector('section.bar-orange .sp-card-avatar--fallback:not(.sp-card-avatar--amagat)');

/* Una persona (owner_user_id) que signa: la capçalera porta el seu avatar redó. */
const persona = (extra) => ({ id: 'coca', title: 'Recepta de coca', author_name: 'Pepa', owner_user_id: 'u-1', created_at: CREAT, ...extra });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mitjans = false;
});
afterEach(cleanup);

describe('Decisió 3 · el lector d’una publicació del Mur, del Mercat o de l’agenda', () => {
  test.each(['mur', 'mercat', 'events'])('%s · l’avatar de fora no es demana: ni a l’H1 ni a la barra (silueta)', (seccio) => {
    for (const avatar of [GOOGLE, RASTREIG]) {
      const container = pinta(persona({ author_avatar: avatar }), seccio);
      expect(fonts(container), avatar).not.toContain(avatar);
      expect(container.querySelector('.page-title-avatar'), avatar).toBeNull();
      expect(fills(container)[0], avatar).toBe('H1.');
      expect(avatarDeLaBarra(container), avatar).toBeNull();
      expect(siluetaDeLaBarra(container), avatar).not.toBeNull();
      // La barra no cau a l'avatar de sèrie (la marca de Sóc de Poble).
      expect(fonts(container).some((font) => font?.includes('logo-socdepoble')), avatar).toBe(false);
      cleanup();
    }
  });

  test('la portada de fora d’una publicació i d’un acte no es demana', () => {
    const coca = pinta(persona({ image_url: RASTREIG }), 'mur');
    expect(portada(coca)).toBeNull();
    expect(fonts(coca)).not.toContain(RASTREIG);
    cleanup();
    const fira = pinta(persona({ id: 'fira', title: 'Fira', image_url: GOOGLE }), 'events');
    expect(portada(fira)).toBeNull();
    expect(fonts(fira)).not.toContain(GOOGLE);
  });

  test('un producte: el carrusel només amb les fotos pròpies, i les variacions de fora sense foto', () => {
    const container = pinta({
      id: 'mel', title: 'Mel', seller: 'Pepa', created_at: CREAT,
      images: [GOOGLE, '/assets/mercat/a.png', '/assets/mercat/b.png'],
      variations: [{ name: 'Gran', image: RASTREIG, price: '20 €' }, { name: 'Xica', image: '/assets/mercat/xica.png', price: '8 €' }]
    }, 'mercat');
    expect([...portada(container).querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual(['/assets/mercat/a.png', '/assets/mercat/b.png']);
    /* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 1) · Expectativa
       actualitzada a propòsit: cap .note-card per variació; la foto és la de
       la variant triada (.sdp-compra__foto), i es comprova triant-les. */
    const fotoDe = (nom) => {
      fireEvent.click(within(container).getByRole('radio', { name: nom }));
      return container.querySelector('.sdp-compra__foto')?.getAttribute('src') ?? null;
    };
    expect(container.querySelector('.note-card')).toBeNull();
    expect([fotoDe('Gran'), fotoDe('Xica')]).toEqual([null, '/assets/mercat/xica.png']);
    expect(fonts(container)).not.toContain(GOOGLE);
    expect(fonts(container)).not.toContain(RASTREIG);
  });

  test('les pròpies es pinten com abans: l’avatar a l’H1 i a la barra, i la portada', () => {
    const container = pinta(persona({ author_avatar: '/assets/gent/pepa.webp', image_url: '/assets/coca.png' }), 'mur');
    expect(fills(container).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']);
    expect(capcalera(container).querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe('/assets/gent/pepa.webp');
    expect(avatarDeLaBarra(container).getAttribute('src')).toBe('/assets/gent/pepa.webp');
    expect(portada(container).querySelector('img').getAttribute('src')).toBe('/assets/coca.png');
  });

  test('el nostre Storage, quan la configuració el registra, també', () => {
    permetOrigenMitjans(STORAGE);
    const cara = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/perfil/a.webp`;
    const foto = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/general/f.webp`;
    const container = pinta(persona({ author_avatar: cara, image_url: foto }), 'mur');
    expect(capcalera(container).querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe(cara);
    expect(avatarDeLaBarra(container).getAttribute('src')).toBe(cara);
    expect(portada(container).querySelector('img').getAttribute('src')).toBe(foto);
  });

  /* Revisió adversarial del 261008 · sdp-media:// també és propi: el lector
     del Mur el pinta com la Multimèdia, que no passa pel mode estricte.
     L'avatar redó, la barra i la portada han de resoldre pel port: una
     referència opaca no és una ruta que puga demanar el navegador. */
  test('un avatar i una portada sdp-media:// es pinten com abans', async () => {
    mocks.mitjans = true;
    permetOrigenMitjans(STORAGE);
    const SDP_MEDIA = 'sdp-media://mitjans/poble/u/perfil/a.webp';
    const RESOLT = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/perfil/a.webp`;
    const capcaleraIBarra = async (seccio, element) => {
      const container = pinta(element, seccio);
      await waitFor(() => expect(capcalera(container).querySelector('img.page-title-avatar__imatge')?.getAttribute('src')).toBe(RESOLT));
      const resultat = { fills: fills(container).slice(0, 2), barra: avatarDeLaBarra(container)?.getAttribute('src') ?? null };
      cleanup();
      return resultat;
    };
    const mur = await capcaleraIBarra('mur', persona({ author_avatar: SDP_MEDIA }));
    const media = await capcaleraIBarra('multimedia', persona({ id: 'era', title: 'Era', kind: 'image', author_avatar: SDP_MEDIA }));
    expect(mur).toEqual(media);
    expect(mur.fills).toEqual(['DIV.page-title-avatar', 'H1.']);
    expect(mur.barra).toBe(RESOLT);
    const ambPortada = pinta(persona({ image_url: SDP_MEDIA }), 'mur');
    expect(fonts(ambPortada)).not.toContain(`/${SDP_MEDIA}`);
    await waitFor(() => expect(portada(ambPortada).querySelector('img')?.getAttribute('src')).toBe(RESOLT));
  });

  test('una portada opaca sense capacitat de mitjans no genera cap petició d’imatge', () => {
    const container = pinta(persona({ image_url: 'sdp-media://mitjans/poble/u/general/f.webp' }), 'mur');
    expect(portada(container)?.querySelector('img')).toBeNull();
    expect(fonts(container)).toEqual([]);
  });

  /* (g) · El cos HTML, pel mode estricte del sanejador (cosAmbImatgesPropies). */
  test.each([['mur', 'content'], ['events', 'description'], ['mercat', 'description']])('%s · una <img> de fora al cos no es demana; la pròpia, com abans', (seccio, camp) => {
    const html = `<p>Hola</p><p><img src="${GOOGLE}" alt="a"></p><p><img src="/assets/coca.png" alt="b"></p><p><img src="${RASTREIG}" alt="c"></p>`;
    const container = pinta(persona({ [camp]: html }), seccio);
    const cos = [...container.querySelectorAll('.detail-content img')];
    expect(cos.map((img) => img.getAttribute('src'))).toEqual([null, '/assets/coca.png', null]);
    expect(fonts(container)).not.toContain(GOOGLE);
    expect(fonts(container)).not.toContain(RASTREIG);
  });

  test('sense avatar declarat, la barra com abans: la silueta', () => {
    const container = pinta(persona(), 'mur');
    expect(avatarDeLaBarra(container)).toBeNull();
    expect(siluetaDeLaBarra(container)).not.toBeNull();
  });
});

describe('Multimèdia queda com abans', () => {
  test('la portada i l’avatar de fora es pinten igual que abans', () => {
    const container = pinta(persona({ id: 'era', title: 'Era', src: RASTREIG, kind: 'image', author_avatar: GOOGLE }), 'multimedia');
    expect(portada(container).querySelector('img').getAttribute('src')).toBe(RASTREIG);
    expect(capcalera(container).querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe(GOOGLE);
  });

  test('el cos admet el que admetia el sanejador de sempre', () => {
    const container = pinta(persona({ id: 'era', title: 'Era', kind: 'image', content: `<p><img src="${GOOGLE}" alt="a"></p>` }), 'multimedia');
    expect([...container.querySelectorAll('.detail-content img')].map((img) => img.getAttribute('src'))).toEqual([GOOGLE]);
  });
});

describe('Decisió 3 · la miniatura de la fitxa del llistat (PublicacioFitxa)', () => {
  const fitxa = (element, seccio) => render(<PublicacioFitxa item={publicacioComANota(element, seccio)} active={false} onSelect={() => {}} />).container;

  test('una miniatura de fora no es demana: la fitxa porta el glif de sempre', async () => {
    for (const seccio of ['mur', 'mercat', 'events']) {
      const container = fitxa(persona({ image_url: RASTREIG, images: [RASTREIG] }), seccio);
      await waitFor(() => expect(container.querySelector('.sdp-gestor-fitxa__media').getAttribute('data-asset-status')).toBe('idle'));
      expect(fonts(container), seccio).toEqual([]);
      expect(container.querySelector('.sdp-gestor-fitxa__inicial'), seccio).not.toBeNull();
      cleanup();
    }
  });

  test('una de pròpia es pinta com abans; a Multimèdia, la de fora també', async () => {
    const propia = fitxa(persona({ image_url: '/assets/coca.png' }), 'mur');
    await waitFor(() => expect(fonts(propia)).toEqual(['/assets/coca.png']));
    cleanup();
    const media = fitxa(persona({ id: 'era', title: 'Era', src: RASTREIG, kind: 'image' }), 'multimedia');
    await waitFor(() => expect(fonts(media)).toEqual([RASTREIG]));
  });
});
