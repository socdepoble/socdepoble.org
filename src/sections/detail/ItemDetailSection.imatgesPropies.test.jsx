/**
 * Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
 * PROHIBIDES (PRIVACITAT). Per a evitar el rastreig d'IPs dels usuaris per
 * part de tercers, només es permetran imatges allotjades localment o pujades
 * al nostre servidor.» Relleu 261007 (peça «imatges-detall»).
 *
 * El detall d'un element del Mur, del Mercat o de l'agenda (/mur/:id,
 * /mercat/:id, /events/:id) ja no demana cap imatge de tercers:
 *  (a) l'avatar redó de davant de l'H1 (avatarAutorDElement): un de fora no es
 *      pinta i l'H1 va sol, com la silueta de la barra taronja;
 *  (b) el carrusel de la portada (portadaDElement): només les fotos pròpies;
 *      amb una o cap, sense carrusel;
 *  (c) les fotos de les variacions del Mercat;
 *  (d) og:image (useSEO): la portada ja filtrada; null cau a la imatge base.
 * Les pròpies (/assets, el Storage registrat, sdp-media://) es pinten com
 * abans, i Pobles i Multimèdia no canvien. Els orígens són sintètics. Es prova
 * amb la UniversalPage i el PageFrame de veres.
 */
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sectionId: 'mur', itemId: null, navigate: vi.fn(), seo: vi.fn(), t: (_, alternativa) => alternativa,
  mur: { events: [], feedPosts: [], marketItems: [] },
  core: { towns: [] }, media: { mediaItems: [] },
  sessio: { currentUser: null, estat: 'fora', rol: null, esSuperadmin: false }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: mocks.sectionId, itemId: mocks.itemId }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/${mocks.sectionId}/${mocks.itemId}`, state: null }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [] }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: mocks.t })
}));
/* La Sessió obligatòria del detall, el mateix doble que
   ItemDetailSection.capcalera.test.jsx. */
vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => mocks.sessio,
  useSessioOpcional: () => mocks.sessio
}));
/* (d) · el que el detall passa a useSEO, que és el que acabaria a og:image i
   a twitter:image del <head> (el detall no passa cap jsonLd). */
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: (...args) => mocks.seo(...args) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import ItemDetailSection from './ItemDetailSection.jsx';
import {
  avatarAutorDElement, buildDetailSectionMeta, buildMercatDetailSectionMeta, buildMultimediaDetailSectionMeta,
  buildPoblesDetailSectionMeta, cosAmbImatgesPropies, esSeccioDelMur, imatgePropiaDelDetall, portadaDElement
} from './detailSectionMeta.jsx';
import { renderRichText } from './detailRichText.jsx';
import { fixaBaseRecursos, resolveAsset } from '../../config/assetResolver.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';
import { rutaXatDePagina } from '../../config/navigation.js';
import { objecteDelPobleXat } from '../pobles/xatDelPoble.js';
import { COPYRIGHT_VIQUIPEDIA } from '../../components/universal/editorial.js';

const GOOGLE = 'https://lh3.googleusercontent.com/a/pepa.png';
const RASTREIG = 'https://rastreig.example/p.gif?campanya=1';
const STORAGE = 'https://detall-1.supabase.test';
const SDP_MEDIA = 'sdp-media://mitjans/poble/u/perfil/a.webp';
const t = (_, alternativa) => alternativa;

const capcalera = (container) => container.querySelector('header.page-title');
const fills = (container) => [...capcalera(container).children].map((e) => `${e.tagName}.${e.className}`);
const fonts = (container) => [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
const portada = (container) => container.querySelector('.hero-image');
const ultimSeo = () => mocks.seo.mock.calls[mocks.seo.mock.calls.length - 1][0];

/* Una persona (owner_user_id) que signa: la capçalera porta el seu avatar redó. */
const publicacio = (extra) => ({ id: 'p1', type: 'feed', title: 'Festa major', author_name: 'Pepa', owner_user_id: 'u-1', created_at: '2026-09-01T10:00:00.000Z', ...extra });
const producte = (extra) => ({ id: 'mel', title: 'Mel de romer', author_name: 'Pepa', author_id: 'pepa', seller: 'Pepa', created_at: '2026-09-01T10:00:00.000Z', ...extra });
const acte = (extra) => ({ id: 'fira', title: 'Fira', author_name: 'Pepa', owner_user_id: 'u-1', date: '2026-11-14', created_at: '2026-09-01T10:00:00.000Z', ...extra });

function pinta(sectionId, item) {
  mocks.sectionId = sectionId;
  mocks.itemId = item.id;
  mocks.mur = {
    events: sectionId === 'events' ? [item] : [],
    feedPosts: sectionId === 'mur' ? [item] : [],
    marketItems: sectionId === 'mercat' ? [item] : []
  };
  mocks.core = { towns: sectionId === 'pobles' ? [item] : [] };
  mocks.media = { mediaItems: sectionId === 'multimedia' ? [item] : [] };
  return render(<ItemDetailSection />).container;
}

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

describe('(a) l’avatar redó de davant de l’H1', () => {
  test.each([['mur', publicacio], ['mercat', producte], ['events', acte]])('%s · un avatar de fora no es demana: l’H1 va sol i la barra porta la silueta', (seccio, element) => {
    for (const avatar of [GOOGLE, RASTREIG, 'https://avatars.githubusercontent.com/u/1']) {
      const container = pinta(seccio, element({ author_avatar: avatar }));
      expect(fonts(container), avatar).not.toContain(avatar);
      expect(container.querySelector('.page-title-avatar'), avatar).toBeNull();
      expect(fills(container)[0], avatar).toBe('H1.');
      /* Revisió adversarial del 261008 · BarraTaronja pinta sempre el div de
         la silueta i, amb avatar, l'amaga: la silueta VISIBLE i cap <img>. */
      expect(container.querySelector('section.bar-orange .sp-card-avatar--fallback:not(.sp-card-avatar--amagat)'), avatar).not.toBeNull();
      expect(container.querySelector('section.bar-orange img.sp-card-avatar'), avatar).toBeNull();
      cleanup();
    }
  });

  test('un avatar propi es pinta com abans: /assets i el Storage registrat', () => {
    const container = pinta('mur', publicacio({ author_avatar: '/assets/gent/pepa.webp' }));
    expect(fills(container).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']);
    expect(capcalera(container).querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe('/assets/gent/pepa.webp');
    cleanup();
    permetOrigenMitjans(STORAGE);
    const cara = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/perfil/a.webp`;
    const ambStorage = pinta('mur', publicacio({ author_avatar: cara }));
    expect(capcalera(ambStorage).querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe(cara);
  });

  test('avatarAutorDElement: el mode estricte només per a les seccions del Mur, crua i resolta', () => {
    const metes = buildDetailSectionMeta({ t });
    const persona = { owner_user_id: 'u-1' };
    for (const seccio of [metes.mur, metes.mercat, metes.events, 'mur', 'mercat', 'events']) {
      expect(avatarAutorDElement({ ...persona, author_avatar: GOOGLE }, 'Pepa', seccio)).toBeNull();
      expect(avatarAutorDElement({ ...persona, author_avatar: '/\\rastreig.example/a.png' }, 'Pepa', seccio)).toBeNull();
      expect(avatarAutorDElement({ ...persona, author_avatar: '/assets/a.webp' }, 'Pepa', seccio)).toEqual({ src: '/assets/a.webp', alt: 'Avatar de Pepa' });
      // Un sdp-media:// el continua resolent el port (AvatarDeCapcalera), com abans.
      expect(avatarAutorDElement({ ...persona, author_avatar: SDP_MEDIA }, 'Pepa', seccio)).toEqual({ src: SDP_MEDIA, alt: 'Avatar de Pepa' });
    }
    // Pobles, Multimèdia i sense secció: com abans.
    for (const seccio of [metes.pobles, metes.multimedia, 'pobles', 'multimedia', undefined]) {
      expect(avatarAutorDElement({ ...persona, author_avatar: GOOGLE }, 'Pepa', seccio)).toEqual({ src: GOOGLE, alt: 'Avatar de Pepa' });
    }
  });
});

describe('(b) el carrusel de la portada', () => {
  test('només les fotos pròpies: les de fora no es demanen i la primera pròpia obri el carrusel', () => {
    const container = pinta('mercat', producte({ images: [GOOGLE, '/assets/mercat/a.png', RASTREIG, '/assets/mercat/b.png'] }));
    const marc = portada(container);
    expect(marc.querySelector('.sdp-carrusel')).not.toBeNull();
    expect([...marc.querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual(['/assets/mercat/a.png', '/assets/mercat/b.png']);
    expect(fonts(container)).not.toContain(GOOGLE);
    expect(fonts(container)).not.toContain(RASTREIG);
  });

  test('si en queda una o cap, sense carrusel; la portada sola ja la filtra paginaDElement', () => {
    const una = pinta('mercat', producte({ images: [RASTREIG, '/assets/mercat/a.png'] }));
    expect(una.querySelector('.sdp-carrusel')).toBeNull();
    expect(fonts(una)).not.toContain(RASTREIG);
    cleanup();
    const cap = pinta('mercat', producte({ images: [RASTREIG, GOOGLE] }));
    expect(cap.querySelector('.sdp-carrusel')).toBeNull();
    expect(portada(cap)).toBeNull();
    expect(fonts(cap)).not.toContain(RASTREIG);
    expect(fonts(cap)).not.toContain(GOOGLE);
  });

  test('les pròpies, com abans: /assets, el Storage registrat i sdp-media:// (resolt com sempre)', () => {
    permetOrigenMitjans(STORAGE);
    const foto = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/mercat/m.webp`;
    const container = pinta('mercat', producte({ images: ['/assets/mercat/a.png', foto, SDP_MEDIA] }));
    expect([...portada(container).querySelectorAll('img')].map((img) => img.getAttribute('src')))
      .toEqual(['/assets/mercat/a.png', foto, resolveAsset(SDP_MEDIA)]);
  });

  test('portadaDElement fora del Mur no filtra res (cap meta de Pobles ni de Multimèdia porta getImages)', () => {
    const metaAmbFotos = { listPath: '/pobles', getImages: () => [RASTREIG, GOOGLE] };
    const resultat = portadaDElement(metaAmbFotos, { id: 'x' }, { title: 'X', heroAlt: 'X' }, t);
    const { container } = render(<>{resultat.topBarData.heroComponent}</>);
    expect(fonts(container)).toEqual([RASTREIG, GOOGLE]);
  });
});

describe('(c) les fotos de les variacions del Mercat', () => {
  const variacions = [
    { name: 'Gran', image: GOOGLE, price: '20 €' },
    { name: 'Xica', image: '/assets/mercat/xica.png', price: '8 €' },
    { name: 'Mitjana', image: RASTREIG, price: '12 €' }
  ];

  test('una de fora no es demana i la variació es pinta com sense foto; la pròpia, com abans', () => {
    const container = pinta('mercat', producte({ images: ['/assets/mercat/a.png'], variations: variacions }));
    const targetes = [...container.querySelectorAll('.note-card')];
    expect(targetes.map((targeta) => targeta.querySelector('h3').textContent)).toEqual(['Gran', 'Xica', 'Mitjana']);
    expect(targetes.map((targeta) => targeta.querySelector('img')?.getAttribute('src') ?? null)).toEqual([null, '/assets/mercat/xica.png', null]);
    expect(fonts(container)).not.toContain(GOOGLE);
    expect(fonts(container)).not.toContain(RASTREIG);
  });

  /* Revisió adversarial del 261008 · Les pròpies de totes les formes. El
     Storage registrat, com abans. Un sdp-media:// cru passa el mode estricte
     però ací no el resol ningú: la variació es pinta com sense foto, mai amb
     una imatge trencada (Relleu 261007 · Verificació final: exclòs per la
     forma, REFERENCIA_OPACA de detailSectionMeta.jsx). */
  test('el Storage registrat es pinta com abans; un sdp-media:// cru, com sense foto', () => {
    permetOrigenMitjans(STORAGE);
    const foto = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/mercat/gran.webp`;
    const container = pinta('mercat', producte({ images: ['/assets/mercat/a.png'], variations: [
      { name: 'Gran', image: foto, price: '20 €' },
      { name: 'Xica', image: SDP_MEDIA, price: '8 €' }
    ] }));
    const targetes = [...container.querySelectorAll('.note-card')];
    expect(targetes.map((targeta) => targeta.querySelector('img')?.getAttribute('src') ?? null)).toEqual([foto, null]);
    expect(fonts(container).some((font) => font?.includes('sdp-media:'))).toBe(false);
  });

  test('Multimèdia queda com abans: la seua <img> del cos no passa pel mode estricte', () => {
    const { container } = render(buildMultimediaDetailSectionMeta({ t }).renderBody({ title: 'Era', src: RASTREIG }));
    expect(fonts(container)).toEqual([RASTREIG]);
  });

  test('el cos del Mercat, fora de la pàgina (el lector del MAS el crida igual), filtra igual', () => {
    const { container } = render(buildMercatDetailSectionMeta({ t }).renderBody({ variations: variacions }));
    expect(fonts(container)).toEqual(['/assets/mercat/xica.png']);
  });

  /* Relleu 261007 · Verificació final de la peça «imatges-detall» · A l'app
     nativa (capacitor://localhost, vite.natiu.config.js) isSafeAsset resolia
     un camí propi contra un origen 'capacitor:' i el rebutjava: la foto PRÒPIA
     d'una variació (la Samarreta de la llavor, marketSeed.js) desapareixia del
     detall i del lector del MAS, que criden este mateix renderBody. Ara es
     pinta amb el mateix src; un sdp-media:// cru i les de fora, com sense
     foto. La mateixa forma que elementDeSeccio.test.js per a la portada. */
  test('a l’app nativa (capacitor://localhost), la foto pròpia d’una variació es pinta com abans; sdp-media:// i les de fora, com sense foto', () => {
    const SAMARRETA = '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/samarreta-socdepoble-verd-638px.jpg';
    vi.stubGlobal('location', { origin: 'capacitor://localhost', protocol: 'capacitor:', host: 'localhost', hostname: 'localhost',
      href: 'capacitor://localhost/mercat/mel', pathname: '/mercat/mel', search: '', hash: '' });
    try {
      const { container } = render(buildMercatDetailSectionMeta({ t }).renderBody({ variations: [
        { name: 'Verd', image: SAMARRETA, price: '15 €' },
        { name: 'Opaca', image: SDP_MEDIA, price: '10 €' },
        { name: 'Gran', image: GOOGLE, price: '20 €' },
        { name: 'Mitjana', image: '//rastreig.example/p.gif', price: '12 €' },
        { name: 'Sense', price: '5 €' }
      ] }));
      const targetes = [...container.querySelectorAll('.note-card')];
      expect(targetes.map((targeta) => targeta.querySelector('h3').textContent)).toEqual(['Verd', 'Opaca', 'Gran', 'Mitjana', 'Sense']);
      expect(targetes.map((targeta) => targeta.querySelector('img')?.getAttribute('src') ?? null)).toEqual([SAMARRETA, null, null, null, null]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('(d) og:image (useSEO)', () => {
  test('una portada de fora no arriba a useSEO: null, i useSEO hi posa la imatge base', () => {
    pinta('mur', publicacio({ image: RASTREIG }));
    expect(ultimSeo().image).toBeNull();
    cleanup();
    pinta('mercat', producte({ images: [GOOGLE] }));
    expect(ultimSeo().image).toBeNull();
    cleanup();
    pinta('events', acte({ image_url: RASTREIG }));
    expect(ultimSeo().image).toBeNull();
  });

  test('una portada pròpia hi arriba com abans', () => {
    pinta('mur', publicacio({ image: '/assets/mur/festa.webp' }));
    expect(ultimSeo().image).toBe('/assets/mur/festa.webp');
    cleanup();
    pinta('mercat', producte({ images: ['/assets/mercat/a.png', '/assets/mercat/b.png'] }));
    expect(ultimSeo().image).toBe('/assets/mercat/a.png');
  });

  test('Pobles i Multimèdia, com abans: la imatge de l’element tal qual', () => {
    pinta('pobles', { id: 'sella', title: 'Sella', image_url: RASTREIG });
    expect(ultimSeo().image).toBe(RASTREIG);
    cleanup();
    pinta('multimedia', { id: 'era', title: 'Era', src: RASTREIG });
    expect(ultimSeo().image).toBe(RASTREIG);
  });

  test('un element no trobat: cap imatge, com abans', () => {
    mocks.sectionId = 'mur';
    mocks.itemId = 'no-hi-es';
    mocks.mur = { events: [], feedPosts: [], marketItems: [] };
    render(<ItemDetailSection />);
    expect(ultimSeo().image).toBeNull();
  });
});

/* (g) · El cos HTML. El sanejador de sempre admet a les <img> els avatars dels
   proveïdors d'entrada: el cos d'una publicació, d'un producte o d'un acte del
   Mur passa pel mode estricte del sanejador (cosAmbImatgesPropies). */
describe('(g) el cos HTML de la publicació, del producte i de l’acte', () => {
  const cosAmb = (...srcs) => `<p>Hola</p>${srcs.map((src) => `<p><img src="${src}" alt="foto"></p>`).join('')}`;
  const cos = (container) => container.querySelector('.content-wrapper');

  test.each([
    ['mur', (html) => publicacio({ content: html })],
    ['mercat', (html) => producte({ description: html })],
    ['events', (html) => acte({ description: html })]
  ])('%s · una <img> de fora (Google, un servidor qualsevol) no es demana; la pròpia, com abans', (seccio, element) => {
    const container = pinta(seccio, element(cosAmb(GOOGLE, '/assets/mur/a.webp', RASTREIG)));
    const imatges = [...cos(container).querySelectorAll('img')];
    expect(imatges.map((img) => img.getAttribute('src'))).toEqual([null, '/assets/mur/a.webp', null]);
    expect(imatges.map((img) => img.getAttribute('data-sdp-bloquejada'))).toEqual(['1', null, '1']);
    expect(fonts(container)).not.toContain(GOOGLE);
    expect(fonts(container)).not.toContain(RASTREIG);
  });

  test('el Storage registrat i sdp-media:// es conserven al cos', () => {
    permetOrigenMitjans(STORAGE);
    const foto = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/general/f.webp`;
    const container = pinta('mur', publicacio({ content: cosAmb(foto, SDP_MEDIA) }));
    expect([...cos(container).querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual([foto, SDP_MEDIA]);
  });

  test('un cos només amb imatges pròpies, o sense cap, es pinta byte a byte com abans (Llei del Píxel)', () => {
    fixaBaseRecursos('https://wp-cos.example/wp-content/plugins/soc-de-poble/dist');
    permetOrigenMitjans('https://wp-cos.example');
    const mostres = [
      cosAmb('/assets/mur/a.webp', 'data:image/png;base64,iVBORw0KGgo='),
      '<h2>Títol</h2><p>a &amp; b <strong>c</strong></p><img src="/assets/mur/b.webp"><ul><li>u</li></ul>',
      'Text pla amb < i & sense etiquetes\n\nsegon paràgraf',
      '<p>Sense imatges</p>',
      '',
      undefined
    ];
    for (const text of mostres) {
      const ara = render(<>{renderRichText(cosAmbImatgesPropies(text))}</>).container.innerHTML;
      cleanup();
      const abans = render(<>{renderRichText(text)}</>).container.innerHTML;
      cleanup();
      expect(ara, String(text)).toBe(abans);
    }
  });

  test('sense cap <img>, el mateix text, sense passar pel sanejador', () => {
    const text = '<p>Sense imatges, amb <a href="/mur/1">enllaç</a></p>';
    expect(cosAmbImatgesPropies(text)).toBe(text);
    expect(cosAmbImatgesPropies('Text pla <img sense tancar')).toBe('Text pla <img sense tancar');
  });

  test('Multimèdia, com abans: el cos admet el que admetia el sanejador de sempre', () => {
    const { container } = render(<>
      {buildMultimediaDetailSectionMeta({ t }).renderBody({ title: 'Era', description: cosAmb(GOOGLE) })}
    </>);
    expect(fonts(container)).toEqual([GOOGLE]);
  });

  /* Onada 5 (ordre del Mestre, 261008) · El content d'un poble (el text de la
     Viquipèdia) ja no és el cos: és l'entradilla (paginaDElement), un text pla
     dins de <p class="lead">. El cos no el pinta, i cap <img> que hi vinguera
     es demana. */
  test('Pobles: el content va a l’entradilla com a text pla; el cos no el pinta', () => {
    const html = cosAmb(GOOGLE);
    const { container } = render(<>{buildPoblesDetailSectionMeta({ t }).renderBody({ id: 'sella', title: 'Sella', content: html })}</>);
    expect(fonts(container)).toEqual([]);
    expect(container.textContent).not.toContain('Hola');
    cleanup();
    const pagina = pinta('pobles', { id: 'sella', title: 'Sella', content: html });
    expect(pagina.querySelector('.page-intro .lead').textContent).toBe(html);
    expect(fonts(pagina)).not.toContain(GOOGLE);
  });

  /* Revisió adversarial del 261008 · Una targeta incrustada al cos l'original
     de la qual no es resol (retirat, o d'una font no carregada) pinta la seua
     instantània (data-imatge). El seu filtre admet els avatars OAuth: la
     passada estricta li lleva una imatge que no és pròpia. */
  const grup = (imatge) => '<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="esquerra">'
    + `<div data-sdp-targeta="publicacio:no-hi-es" class="sdp-targeta" data-ruta="/mur/no-hi-es" data-titol="La festa" data-imatge="${imatge}" data-autor="Pep" data-autor-ruta="/perfil/persona/pep">`
    + '<a href="/mur/no-hi-es" rel="noopener noreferrer nofollow">La festa</a></div></div>';

  test.each([
    ['mur', (html) => publicacio({ content: html })],
    ['mercat', (html) => producte({ description: html })],
    ['events', (html) => acte({ description: html })]
  ])('%s · la instantània d’una targeta incrustada amb una imatge de Google no es demana; la targeta es queda', (seccio, element) => {
    const container = pinta(seccio, element(`<p>Abans</p>${grup(GOOGLE)}<p>Després</p>`));
    expect(cos(container).querySelector('.sdp-targeta')).not.toBeNull();
    expect(cos(container).textContent).toContain('La festa');
    expect(fonts(container)).not.toContain(GOOGLE);
  });

  /* Onada 5 · El content d'un poble no passa pel cos: una targeta que hi
     vinguera no es pinta, ni la seua instantània. */
  test('Pobles: una targeta del content no es pinta al cos, ni la seua instantània', () => {
    const { container } = render(<>{buildPoblesDetailSectionMeta({ t }).renderBody({ id: 'sella', title: 'Sella', content: grup(GOOGLE) })}</>);
    expect(container.querySelector('.sdp-targeta')).toBeNull();
    expect(fonts(container)).not.toContain(GOOGLE);
  });

  test('un cos amb targetes pròpies, sense imatge o amb la imatge buida es pinta byte a byte com abans (Llei del Píxel)', () => {
    fixaBaseRecursos('https://wp-cos.example/wp-content/plugins/soc-de-poble/dist');
    permetOrigenMitjans('https://wp-cos.example');
    permetOrigenMitjans(STORAGE);
    const mostres = [
      `<p>Abans</p>${grup('/assets/mur/1.webp')}<p>Després</p>`,
      `${grup(`${STORAGE}/storage/v1/object/public/mitjans/poble/u/general/f.webp`)}<p><img src="/assets/mur/a.webp" alt="a"></p>`,
      grup(''),
      grup('/assets/mur/1.webp').replace(' data-imatge="/assets/mur/1.webp"', ''),
      '<p>data-sdp-targetes és el nom de la marca</p>'
    ];
    for (const text of mostres) {
      const ara = render(<>{renderRichText(cosAmbImatgesPropies(text))}</>).container.innerHTML;
      cleanup();
      const abans = render(<>{renderRichText(text)}</>).container.innerHTML;
      cleanup();
      expect(ara, text).toBe(abans);
    }
  });
});

/* Revisió adversarial del 261008 · El mode estricte només admet data:image
   ràster: una data:image/svg+xml (que abans passava pel filtre de l'avatar,
   isSafeAsset, o per cap filtre al carrusel i a les variacions) ja no es
   pinta. Cap font legítima n'escriu; canvi declarat. */
describe('data:image/svg+xml al detall del Mur', () => {
  const SVG = 'data:image/svg+xml;base64,PHN2Zy8+';

  test('ni l’avatar redó, ni el carrusel, ni les variacions', () => {
    const avatar = pinta('mur', publicacio({ author_avatar: SVG }));
    expect(fonts(avatar)).not.toContain(SVG);
    expect(fills(avatar)[0]).toBe('H1.');
    cleanup();
    const container = pinta('mercat', producte({
      images: ['/assets/mercat/a.png', SVG, '/assets/mercat/b.png'],
      variations: [{ name: 'Gran', image: SVG, price: '20 €' }]
    }));
    expect([...portada(container).querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual(['/assets/mercat/a.png', '/assets/mercat/b.png']);
    expect(container.querySelector('.note-card img')).toBeNull();
    expect(fonts(container)).not.toContain(SVG);
  });
});

/* Onada 5 (ordre del Mestre, 261008) · L'anatomia de la pàgina d'un poble
   (/pobles/<slug>): el logotip de Sóc de Poble damunt de l'H1, l'H1 és la gent
   del poble i l'H2 el poble, la província i la comarca són etiquetes de la
   capçalera, l'entradilla és el text de la Viquipèdia i, davall, el botó blau
   gros cap al xat de la gent del poble. Una llavor pròpia: MOCK_TOWNS és d'un
   altre paquet. */
describe('Onada 5 · la pàgina d’un poble', () => {
  const POBLE = Object.freeze({
    id: 'la-torre-de-les-macanes', type: 'town', author: 'Gent de la Torre', title: 'La Torre de les Maçanes',
    provincia: 'Alacant', comarca: 'L’Alacantí', population: '700 hab',
    content: 'La Torre de les Maçanes és una vila i municipi del País Valencià.'
  });
  /* Onada 6 (pla 261009_0245, ítem 4) · El xat del poble porta el nom de la
     gent (objecteDelPobleXat): el mateix subjecte poble:<id>. */
  const XAT = rutaXatDePagina(objecteDelPobleXat(POBLE));

  test('logotip damunt de l’H1, H1 la gent, H2 el poble, l’entradilla i les etiquetes província i comarca', () => {
    const container = pinta('pobles', POBLE);
    const ordre = fills(container);
    expect(ordre[0]).toMatch(/^IMG\.page-title-logo/);
    expect(ordre.indexOf('H1.')).toBeGreaterThan(0);
    expect(capcalera(container).querySelector('h1').textContent).toBe('Gent de la Torre');
    expect(container.querySelector('.page-intro h2').textContent).toBe('La Torre de les Maçanes');
    expect(container.querySelector('.page-intro .lead').textContent).toBe(POBLE.content);
    expect([...capcalera(container).querySelectorAll('li.sp-card-label')].map((li) => [li.textContent, li.className]))
      .toEqual([
        ['Poble', 'sp-card-label sdp-badge-system'],
        ['Alacant', 'sp-card-label sdp-badge-category'],
        ['L’Alacantí', 'sp-card-label sdp-badge-tag']
      ]);
    expect(capcalera(container).querySelector('.page-title-copyright').textContent).toBe(COPYRIGHT_VIQUIPEDIA);
  });

  /* Onada 8 (261009) · Derogat el «porta al seu xat»: la boina porta a la
     fitxa del poble (s'hi enllaça a si mateixa), mai al xat; el xat es queda
     al botó blau i a «Comentar · En públic». */
  test('la barra taronja signa amb la gent i el poble, i porta a la fitxa del poble, mai al xat', () => {
    const barra = pinta('pobles', POBLE).querySelector('section.bar-orange');
    expect(barra.querySelector('.sp-card-author-name').textContent).toBe('Gent de la Torre');
    expect(barra.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
    expect(barra.querySelector('a.sp-card-author-link').getAttribute('href')).toBe('/pobles/la-torre-de-les-macanes');
    expect(barra.querySelector('a.sp-card-author-link').getAttribute('href')).not.toBe(XAT);
  });

  test('davall de l’entradilla, el botó blau gros cap al xat; el cos no repetix la província ni la comarca', () => {
    const container = pinta('pobles', POBLE);
    expect(XAT).toMatch(/^\/xat\?sobre=poble:la-torre-de-les-macanes&titol=Gent%20de%20la%20Torre&/);
    const boto = container.querySelector('.sdp-pagina-accio > a');
    expect(boto.className).toBe('sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple');
    expect(boto.getAttribute('href')).toBe(XAT);
    expect(boto.textContent).toBe('Parlar amb la Gent de la Torre');
    // El primer del cos, just després de l'entradilla.
    expect(container.querySelector('.page-intro').nextElementSibling.firstElementChild.className).toBe('sdp-pagina-accio');
    const pindoles = [...container.querySelectorAll('.page-intro ~ * .pill')].map((pill) => pill.textContent.trim());
    expect(pindoles).toEqual(['700 hab', 'La Torre de les Maçanes']);
  });

  test('una entitat que no és «Gent …»: el verb de la porta d’El Xat', () => {
    const { container } = render(<>{buildPoblesDetailSectionMeta({ t }).renderBody({ ...POBLE, author: 'Ajuntament de Sella' })}</>);
    expect(container.querySelector('.sdp-pagina-accio > a').textContent).toBe('Anar al xat');
  });

  /* Onada 6 (pla 261009_0245, ítem 5; prompt 261009_0230, punt 6) · Davall
     del botó blau i de les píndoles, la barra de pestanyes centrada. La
     primera, «Gent de …» (l'H1), amb les targetes publicades des del poble
     (Mur, Agenda i Mercat), casades per dades: poble_id o el nom del poble. */
  const pintaAmbMur = (poble, mur) => {
    mocks.sectionId = 'pobles';
    mocks.itemId = poble.id;
    mocks.core = { towns: [poble] };
    mocks.mur = { status: 'ready', error: null, feedPosts: [], marketItems: [], events: [], ...mur };
    return render(<ItemDetailSection />).container;
  };

  test('Onada 6 · la barra de pestanyes centrada, després del botó blau i de les píndoles, amb «Gent de la Torre» seleccionada', () => {
    const container = pinta('pobles', POBLE);
    const barra = container.querySelector('.sdp-pestanyes');
    expect(barra.className).toBe('sdp-pestanyes sdp-pestanyes--centrades');
    const llista = barra.querySelector('[role="tablist"]');
    expect(llista.getAttribute('aria-label')).toBe('Continguts del poble');
    expect([...llista.querySelectorAll('[role="tab"]')].map((p) => [p.textContent, p.getAttribute('aria-selected')]))
      .toEqual([['Gent de la Torre', 'true']]);
    expect(container.querySelector('.page-intro').nextElementSibling.firstElementChild.className).toBe('sdp-pagina-accio');
    expect(container.querySelector('.content-wrapper > .badge-row').nextElementSibling).toBe(barra);
  });

  test('Onada 6 · el panell porta les targetes del poble en l’ordre del Mur, i cap d’un altre poble ni del sistema', async () => {
    const container = pintaAmbMur(POBLE, {
      feedPosts: [
        { id: 'f1', type: 'feed', title: 'Festa de la Torre', author_location: 'La Torre de les Maçanes', created_at: '2026-09-02T10:00:00Z' },
        { id: 'f2', type: 'feed', title: 'Festa de Sella', author_location: 'Sella', created_at: '2026-09-03T10:00:00Z' },
        { id: 'f3', type: 'feed', title: 'Declarada', poble_id: 'la-torre-de-les-macanes', author_location: 'Alacant', created_at: '2026-09-01T10:00:00Z' },
        { id: 'pagina', type: 'sistema', isSystem: true, title: 'Pàgina del sistema', author_location: 'La Torre de les Maçanes' }
      ],
      marketItems: [{ id: 'm1', type: 'product', title: 'Mel de romer', population: 'La Torre de les Maçanes', created_at: '2026-09-04T10:00:00Z' }]
    });
    const panell = container.querySelector('[role="tabpanel"]');
    await waitFor(() => expect(panell.querySelectorAll('article.sp-card')).toHaveLength(3));
    expect([...panell.querySelectorAll('.sp-card-title')].map((e) => e.textContent)).toEqual(['Mel de romer', 'Festa de la Torre', 'Declarada']);
    // Només les targetes: cap capçalera dins del panell (la pestanya ja el nomena).
    expect(panell.querySelector('h2')).toBeNull();
  });

  test('Onada 6 · un poble inventat funciona sense tocar codi: «Gent del Campello» i les seues targetes', async () => {
    const campello = { id: 'el-campello', title: 'El Campello', content: 'Vila de l’Alacantí.' };
    const container = pintaAmbMur(campello, {
      feedPosts: [
        { id: 'c1', type: 'feed', title: 'Peix fresc', author_location: 'El Campello', created_at: '2026-09-02T10:00:00Z' },
        { id: 't1', type: 'feed', title: 'De la Torre', author_location: 'La Torre de les Maçanes', created_at: '2026-09-03T10:00:00Z' }
      ]
    });
    expect(container.querySelector('[role="tab"]').textContent).toBe('Gent del Campello');
    const panell = container.querySelector('[role="tabpanel"]');
    await waitFor(() => expect(panell.querySelectorAll('article.sp-card')).toHaveLength(1));
    expect(panell.querySelector('.sp-card-title').textContent).toBe('Peix fresc');
  });

  test('Onada 6 · sense cap publicació del poble, el text buit (role=status)', async () => {
    const container = pintaAmbMur(POBLE, {});
    const panell = container.querySelector('[role="tabpanel"]');
    await waitFor(() => expect(panell.querySelector('p[role="status"]')).not.toBeNull());
    expect(panell.querySelector('p[role="status"]').textContent).toBe('Encara no hi ha cap publicació des d’este poble.');
  });

  /* Requisit 15 de l'Onada 5 · La pastilla del poble és el seu naixement: si
     una publicació que DECLARA el poble (poble_id) és anterior a la fitxa, la
     seua data. Revisió adversarial · Una casada només pel text del lloc no el
     data (clauDelPoble.js): la barra diu la fitxa, com abans. */
  test('Onada 6 · la barra taronja de la pàgina del poble diu el naixement: la primera publicació declarada, si és anterior a la fitxa', () => {
    const pastillaDe = (container) => [...container.querySelectorAll('section.bar-orange .btn-date-time span')].map((s) => s.textContent);
    const ambDeclarada = pintaAmbMur({ ...POBLE, created_at: '2026-08-20T08:00:00.000Z' }, {
      feedPosts: [{ id: 'vella', type: 'feed', title: 'La primera', poble_id: 'la-torre-de-les-macanes', created_at: '2026-08-02T08:00:00.000Z' }]
    });
    expect(pastillaDe(ambDeclarada)).toEqual(['10:00', '02/08/26']);
    cleanup();
    const nomesText = pintaAmbMur({ ...POBLE, created_at: '2026-08-20T08:00:00.000Z' }, {
      marketItems: [{ id: 'mac', type: 'product', title: 'Mac', population: 'La Torre de les Maçanes', created_at: '2026-02-15T12:00:00.000Z' }]
    });
    expect(pastillaDe(nomesText)).toEqual(['10:00', '20/08/26']);
  });

  /* Ull del pla · renderBody també el pinta el lector de connexions del MAS
     (ConnexioDetall), que no passa { detall: true }: allà, cap pestanya. */
  test('Onada 6 · sense { detall: true } (el lector del MAS), cap barra de pestanyes', () => {
    const { container } = render(<>{buildPoblesDetailSectionMeta({ t }).renderBody(POBLE)}</>);
    expect(container.querySelector('.sdp-pestanyes')).toBeNull();
    expect(container.querySelector('.sdp-pagina-accio')).not.toBeNull();
  });
});

describe('la regla única (detailSectionMeta.jsx)', () => {
  test('esSeccioDelMur: per la llista de la meta o per l’id; cap altra', () => {
    const metes = buildDetailSectionMeta({ t });
    expect([metes.mur, metes.mercat, metes.events].every(esSeccioDelMur)).toBe(true);
    expect([metes.pobles, metes.multimedia, metes.notes].some(esSeccioDelMur)).toBe(false);
    expect(['mur', 'mercat', 'events'].every(esSeccioDelMur)).toBe(true);
    expect(['pobles', 'multimedia', 'notes', 'constructor', '', null, undefined].some(esSeccioDelMur)).toBe(false);
  });

  test('imatgePropiaDelDetall: intacte si és pròpia o fora del Mur, null si és de fora, i un buit tal qual', () => {
    expect(imatgePropiaDelDetall('mur', '/assets/a.png')).toBe('/assets/a.png');
    expect(imatgePropiaDelDetall('mur', GOOGLE)).toBeNull();
    expect(imatgePropiaDelDetall('mur', '//rastreig.example/a.png')).toBeNull();
    expect(imatgePropiaDelDetall('mur', '')).toBe('');
    expect(imatgePropiaDelDetall('mur', undefined)).toBeUndefined();
    expect(imatgePropiaDelDetall('multimedia', GOOGLE)).toBe(GOOGLE);
  });
});
