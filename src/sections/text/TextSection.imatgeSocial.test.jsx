/**
 * Pla 261027_1154 (P1-61), Fase 1 · La imatge del <head> d'una pàgina de text
 * (/projecte, /constitucio, /ia, /legal, /page/:slug…).
 *
 * Abans, la targeta genèrica sempre. Ara og:image és la imatge que l'autor ha
 * triat per a xarxes (og_image, o si no, featured_image; Llibre Mestre, P1-61)
 * o, sense, la primera imatge pròpia de la pàgina (config/imatgeSocial.js ·
 * primeraImatgeSocial('pagina'): page.image i, després, les del cos),
 * absoluta i https. Els logotips no compten com a imatge, ni el panorama que
 * la pintura posa a una pàgina sense image: eixa pàgina porta la targeta
 * genèrica (OG-1). Una pàgina que nomena el panorama ella mateixa (/projecte)
 * el porta (P1-60). Una primera imatge que no es pot servir ('bloquejada')
 * porta la targeta, i mai la segona.
 *
 * Llei del Píxel · La portada que es pinta (heroImage de la UniversalPage) és
 * la de sempre en cada cas: cada prova la fixa.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  props: null, seo: vi.fn(), t: (_, alternativa) => alternativa,
  origen: null, supabaseUrl: 'https://projecte-1.supabase.test',
  /* Només les proves de «<head>» criden el useSEO i el seoHead de veres. */
  headReal: false, ui: null
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => (mocks.ui ||= { t: mocks.t, resolveAsset: (cami) => cami }),
  useUIState: () => ({ externalConfig: { manageDocumentHead: true } })
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: '/xat' }), useRouter: () => ({ basename: '' }) }));
vi.mock('../../hooks/useSEO', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, useSEO: (...args) => { mocks.seo(...args); return mocks.headReal ? real.useSEO(...args) : undefined; } };
});
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children, ...props }) => {
    mocks.props = props;
    return React.createElement('div', { 'data-pagina': '' }, children);
  }
}));
vi.mock('../../config/origenPublic.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, origenPublic: () => mocks.origen ?? real.origenPublic() };
});
vi.mock('../../config/capaDelPaquet.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, capaDelPaquet: () => ({ ...real.capaDelPaquet(), supabaseUrl: mocks.supabaseUrl }) };
});
import TextSection from './TextSection.jsx';
import { PAGE_COPY } from './pageContent.js';
import { CAP_SOCIAL_BASE, HERO_PER_DEFECTE, MARQUES_SVG_ANTIGUES, VARIANTS_SOCIALS } from '../../config/imatgeSocial.js';

/* Pla 261029_0216 (R-01 i R-02) · La il·lustració de l'Ànima (WebP de 414 KB) i
   el panorama (.png amb bytes JPEG, 1 MB) tenen variant social (JPEG real de
   1200x630 i ≤300 KB, imatgeSocial.js · VARIANTS_SOCIALS): el <head> la porta;
   la portada (heroImage) continua pintant l'original (Llei del Píxel). */
const ANIMA = '/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp';
const ANIMA_SOCIAL = VARIANTS_SOCIALS[ANIMA];
const HERO_SOCIAL = VARIANTS_SOCIALS[HERO_PER_DEFECTE];

/* La targeta genèrica tal com la passava TextSection abans (resolveAsset amb
   la base '/'): useSEO la fa absoluta i la reconeix com a base. */
const GENERICA = CAP_SOCIAL_BASE.image.url;
const ultimSeo = () => mocks.seo.mock.calls[mocks.seo.mock.calls.length - 1][0];
/* Revisió adversarial (261027) · La triada viatja com { url, alt }; la
   genèrica, com abans, el camí de la targeta. Ací es mira l'URL. */
const imatgeDelSeo = () => {
  const imatge = ultimSeo().image;
  return imatge && typeof imatge === 'object' ? imatge.url : imatge;
};
const pinta = (page, pageKey = 'provant') => render(<TextSection page={page} pageKey={pageKey} />);

afterEach(cleanup);
beforeEach(() => {
  mocks.props = null;
  mocks.seo.mockClear();
  mocks.origen = null;
  mocks.supabaseUrl = 'https://projecte-1.supabase.test';
  mocks.headReal = false;
});

describe('una pàgina amb imatge pròpia', () => {
  test('page.image arriba al <head> absoluta i https; la portada, la de sempre', () => {
    pinta({ title: 'Fira', image: '/assets/uploads/brain/fira.webp', html: '<p>Hola</p>' });
    expect(mocks.props.heroImage).toBe('/assets/uploads/brain/fira.webp');
    expect(imatgeDelSeo()).toBe('https://socdepoble.org/assets/uploads/brain/fira.webp');
  });

  test('L’Ànima de la IAIA (/ia): la seua il·lustració, no la targeta genèrica', () => {
    pinta(PAGE_COPY.anima, 'anima');
    expect(mocks.props.heroImage).toBe(ANIMA);
    expect(ANIMA_SOCIAL).toBe('/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431-social-1200x630.jpg');
    expect(imatgeDelSeo()).toBe(`https://socdepoble.org${ANIMA_SOCIAL}`);
  });

  /* Llibre Mestre, P1-60 (Fita 24; àudio del Mestre de les 05:08) · «Que la
     pàgina del projecte continga la seua imatge pròpia panoràmica de Pedra
     Seca al SEO (og:image)». /projecte nomena el panorama com a page.image:
     és la seua portada i la seua og:image, amb el seu imageAlt. */
  test('/projecte: la portada i el <head> porten la seua panoràmica, amb el seu alt (P1-60)', () => {
    pinta(PAGE_COPY.projecte, 'projecte');
    expect(PAGE_COPY.projecte.image).toBe(HERO_PER_DEFECTE);
    expect(mocks.props.heroImage).toBe(HERO_PER_DEFECTE);
    expect(HERO_SOCIAL).toBe('/assets/uploads/brain/hero_panoramic_rural_view_1774720664221-social-1200x630.jpg');
    expect(ultimSeo().image).toEqual({ url: `https://socdepoble.org${HERO_SOCIAL}`, alt: PAGE_COPY.projecte.imageAlt });
  });

  test('el panorama com a page.image i cap foto al cos: el panorama (en variant social), no la targeta (P1-60)', () => {
    pinta({ title: 'Panorama', image: HERO_PER_DEFECTE, html: '<p>Hola</p>' });
    expect(imatgeDelSeo()).toBe(`https://socdepoble.org${HERO_SOCIAL}`);
    expect(mocks.props.heroImage).toBe(HERO_PER_DEFECTE);
  });

  test('una foto del bucket públic (sdp-media://mitjans/…): l’URL pública del Supabase del paquet', () => {
    pinta({ title: 'Fira', image: 'sdp-media://mitjans/poble/u-1/pagines/fira.webp', html: '' });
    expect(imatgeDelSeo()).toBe('https://projecte-1.supabase.test/storage/v1/object/public/mitjans/poble/u-1/pagines/fira.webp');
  });

  test('un origen públic https mana sobre socdepoble.org', () => {
    mocks.origen = 'https://proves.socdepoble.test';
    pinta({ title: 'Fira', image: '/assets/uploads/brain/fira.webp', html: '' });
    expect(imatgeDelSeo()).toBe('https://proves.socdepoble.test/assets/uploads/brain/fira.webp');
  });
});

describe('una pàgina sense imatge pròpia: la targeta genèrica, com abans', () => {
  test('sense page.image: la portada és el panorama de reserva i el <head>, la targeta', () => {
    pinta({ title: 'Sense res', lead: 'Només entradilla', html: '<p>Hola</p>' });
    expect(imatgeDelSeo()).toBe(GENERICA);
    expect(mocks.props.heroImage).toBe(HERO_PER_DEFECTE);
  });

  test('amb el logotip de la marca com a page.image (notes_shared): la targeta', () => {
    pinta(PAGE_COPY.notes_shared, 'notes_shared');
    expect(PAGE_COPY.notes_shared.image).toBe(MARQUES_SVG_ANTIGUES.avatar);
    expect(imatgeDelSeo()).toBe(GENERICA);
    expect(mocks.props.heroImage).toBe(MARQUES_SVG_ANTIGUES.avatar);
  });
});

describe('una primera imatge que no es pot servir: bloquejada, la targeta i mai la segona', () => {
  test.each([
    ['un SVG propi', '/assets/uploads/brain/diagrama.svg'],
    ['una imatge d’un altre origen', 'https://rastreig.example/p.gif']
  ])('%s com a page.image, amb una foto pròpia al cos', (_, primera) => {
    pinta({ title: 'Bloquejada', image: primera, html: '<p><img src="/assets/uploads/brain/foto.png" alt="foto"></p>' });
    expect(imatgeDelSeo()).toBe(GENERICA);
    expect(mocks.props.heroImage).toBe(primera);
  });
});

/* Pla 261027_1154 (P1-61) · Revisió adversarial (261027) · L'alt de la
   triada: el de page.image (imageAlt) si és ella; si és una foto del cos, el
   títol de la pàgina. */
describe('l’alt de la imatge triada', () => {
  test('page.image amb imageAlt, el seu alt; una del cos, el títol; sense imageAlt, el títol', () => {
    pinta({ title: 'Fira', image: '/assets/uploads/brain/fira.webp', imageAlt: 'El cartell de la fira', html: '' });
    expect(ultimSeo().image).toEqual({ url: 'https://socdepoble.org/assets/uploads/brain/fira.webp', alt: 'El cartell de la fira' });
    pinta({ title: 'Fira', imageAlt: 'Panorama', html: '<p><img src="/assets/uploads/brain/foto.png" alt="foto"></p>' });
    expect(ultimSeo().image).toEqual({ url: 'https://socdepoble.org/assets/uploads/brain/foto.png', alt: 'Fira' });
    pinta({ title: 'Fira', image: '/assets/uploads/brain/fira.webp', html: '' });
    expect(ultimSeo().image).toEqual({ url: 'https://socdepoble.org/assets/uploads/brain/fira.webp', alt: 'Fira' });
  });
});

/* Revisió de mutants (261027) · Llibre Mestre, P1-61 · La imatge que tria
   l'autor (og_image, o featured_image) va al <head> per davant de page.image;
   la portada no la llig (Llei del Píxel). L'alt és el títol: imageAlt descriu
   page.image, no la triada. */
describe('la imatge que tria l’autor (og_image, o featured_image)', () => {
  test('og_image al <head> amb el títol com a alt; la portada (page.image), la de sempre', () => {
    pinta({ title: 'Fira', image: '/assets/uploads/brain/fira.webp', imageAlt: 'El cartell de la fira', og_image: '/assets/uploads/brain/fira-xarxes.webp', html: '' });
    expect(mocks.props.heroImage).toBe('/assets/uploads/brain/fira.webp');
    expect(ultimSeo().image).toEqual({ url: 'https://socdepoble.org/assets/uploads/brain/fira-xarxes.webp', alt: 'Fira' });
  });

  test('featured_image, quan no hi ha og_image, per davant del panorama que porta la portada', () => {
    pinta({ title: 'Projecte', image: HERO_PER_DEFECTE, featured_image: '/assets/uploads/brain/destacada.webp', html: '<p><img src="/assets/uploads/brain/foto.png" alt="f"></p>' });
    expect(mocks.props.heroImage).toBe(HERO_PER_DEFECTE);
    expect(imatgeDelSeo()).toBe('https://socdepoble.org/assets/uploads/brain/destacada.webp');
  });
});

/* Pla 261027_1154 (P1-61) · Revisió adversarial (261027) · El document
   destacat de /xat (XatSection.jsx · DocumentDestacat): TextSection amb
   chrome 'context' i, darrere, SeoDelXat, que només es remunta quan canvien
   el títol o la descripció del document. Des que la imatge del <head> depén
   de la pàgina, un canvi de la seua foto (una còpia remota que arriba) tornava
   a registrar TextSection darrere de SeoDelXat: la pestanya passava a «El Xat
   | Sóc de Poble» (sense «(N) Xat») i l'og:image a la foto del document. Una
   pàgina en context només és la reserva del <head>. */
/* El germà de XatSection.jsx, amb el useSEO de veres (sense passar pel
   registre de mocks.seo, que és el de TextSection). */
let useSEODeVeres = null;
function SeoDelXat(seo) {
  useSEODeVeres(seo);
  return null;
}
describe('en context (el document destacat de /xat), el <head> és de qui la incrusta', () => {
  const XAT = { title: 'Xat', description: 'Obri converses', index: false };
  const document_ = (page) => (
    <div>
      <TextSection page={{ ...page, chrome: 'context' }} pageKey="xat" />
      <SeoDelXat key={`${page.title}\n${page.subtitle || page.lead || ''}`} {...XAT} />
    </div>
  );
  test('una pàgina en context es registra com a reserva; una de la seua ruta, com a vista', () => {
    pinta({ title: 'Fira', image: '/assets/uploads/brain/fira.webp', html: '', chrome: 'context' });
    expect(ultimSeo().fallback).toBe(true);
    pinta({ title: 'Fira', image: '/assets/uploads/brain/fira.webp', html: '' });
    expect(ultimSeo()).not.toHaveProperty('fallback');
  });

  test('canviar la foto del document sense canviar-ne el títol no li dona el <head> (useSEO i seoHead de veres)', async () => {
    ({ useSEO: useSEODeVeres } = await vi.importActual('../../hooks/useSEO'));
    mocks.headReal = true;
    document.head.replaceChildren(Object.assign(document.createElement('title'), { textContent: 'Sóc de Poble' }));
    const A = { title: 'El Xat', subtitle: 'Sub', image: '/assets/uploads/brain/xat_portada.png', html: '<p>Hola</p>' };
    const vista = render(document_(A));
    const estat = () => [document.title, document.head.querySelector('meta[property="og:image"]')?.content ?? null,
      document.head.querySelector('meta[name="robots"]')?.content ?? null];
    const delXat = ['Xat | Sóc de Poble', `https://socdepoble.org${CAP_SOCIAL_BASE.image.url}`, 'noindex, nofollow'];
    expect(estat()).toEqual(delXat);
    vista.rerender(document_({ ...A, image: '/assets/uploads/brain/xat_portada.webp' }));
    expect(estat()).toEqual(delXat);
    vista.rerender(document_({ ...A, html: '<p><img src="/assets/uploads/brain/cos.png" alt="c"></p>' }));
    expect(estat()).toEqual(delXat);
    vista.unmount();
    expect(document.title).toBe('Sóc de Poble');
  });
});
