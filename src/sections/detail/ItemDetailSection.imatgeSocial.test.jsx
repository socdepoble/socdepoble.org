/**
 * Pla 261027_1154 (P1-61), Fase 1 · La imatge del <head> del detall
 * (/mercat/:id, /mur/:id, /events/:id i /pobles/:id).
 *
 * Regla del Mestre (invariant) · Si l'autor ha triat la imatge per a xarxes
 * (og_image, o si no, featured_image; Llibre Mestre, P1-61), og:image és eixa;
 * si no, en una pàgina amb imatges, és la PRIMERA imatge que una persona veu a
 * la galeria o al cos; només una pàgina sense cap imatge pròpia ni triada
 * porta la targeta genèrica. Una primera imatge que hi és
 * però no es pot servir (SVG, bucket privat, un altre origen) NO se salta cap
 * a la segona ni cap al logotip: el selector la torna 'bloquejada' i, en
 * esta fase de client, el <head> porta la targeta genèrica (null a useSEO).
 * Les reserves i l'avatar de qui signa o ven no compten com a imatge.
 *
 * Llei del Píxel · La portada que es pinta és la de sempre en cada cas: cada
 * prova en fixa la font. Només canvia el que rep useSEO.
 *
 * La samarreta té la forma de la fila real de producció (app_content,
 * marketItems: set fotos, i imageSrc i avatar_url són el logotip SVG), només
 * amb els camins. Es prova amb la UniversalPage i el PageFrame de veres, sense
 * xarxa. Les proves de «<head>» passen per useSEO i seoHead de veres.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sectionId: 'mercat', itemId: null, navigate: vi.fn(), seo: vi.fn(), t: (_, alternativa) => alternativa,
  mur: { events: [], feedPosts: [], marketItems: [] },
  core: { towns: [] }, notes: [],
  sessio: { currentUser: null, estat: 'fora', rol: null, esSuperadmin: false },
  /* null: l'origen de la pàgina (jsdom, http://localhost:3000); si no, el que diu la prova. */
  origen: null,
  supabaseUrl: 'https://projecte-1.supabase.test',
  /* Només les proves de «<head>» criden el useSEO de veres. */
  headReal: false
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: mocks.sectionId, itemId: mocks.itemId }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/${mocks.sectionId}/${mocks.itemId}`, search: '', state: null }),
  useRouter: () => ({ basename: '' }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
  Navigate: () => null
}));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: mocks.notes, status: 'ready' }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [] }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: mocks.t, resolveAsset: (cami) => cami }),
  useUIState: () => ({ externalConfig: { manageDocumentHead: true } })
}));
vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => mocks.sessio,
  useSessioOpcional: () => mocks.sessio
}));
/* El que el detall passa a useSEO; amb headReal, també el useSEO de veres
   (que escriu og:image i twitter:image al <head> per seoHead). */
vi.mock('../../hooks/useSEO.js', async (importOriginal) => {
  const real = await importOriginal();
  const cap = () => undefined;
  return { ...real, useSEO: (opcions) => { mocks.seo(opcions); return (mocks.headReal ? real.useSEO : cap)(opcions); } };
});
vi.mock('../../config/origenPublic.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, origenPublic: () => mocks.origen ?? real.origenPublic() };
});
vi.mock('../../config/capaDelPaquet.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, capaDelPaquet: () => ({ ...real.capaDelPaquet(), supabaseUrl: mocks.supabaseUrl }) };
});
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import ItemDetailSection from './ItemDetailSection.jsx';
import { ModeracioContext } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { CAP_SOCIAL_BASE, ORIGEN_SOCIAL_PER_DEFECTE, VARIANTS_SOCIALS } from '../../config/imatgeSocial.js';
import { fixaBaseRecursos } from '../../config/assetResolver.js';

const CARPETA = '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble';
const XICA = `${CARPETA}/01-chica-jersey.png`;
/* Pla 261029_0216 (R-01 i R-02) · La xica pesa 782 KB i és un .png amb bytes
   JPEG: al <head> hi va la seua variant social (JPEG real de 1200x630 i
   ≤300 KB, imatgeSocial.js · VARIANTS_SOCIALS). La portada i el carrusel
   continuen pintant l'original (Llei del Píxel). */
const XICA_SOCIAL = VARIANTS_SOCIALS[XICA];
const LOGO_SVG = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
const RASTREIG = 'https://rastreig.example/p.gif';
const GENERICA = `${ORIGEN_SOCIAL_PER_DEFECTE}${CAP_SOCIAL_BASE.image.url}`;

/* La fila de producció (remote_market.json, 261027): les set fotos en
   l'ordre de la galeria, i el logotip SVG com a imageSrc i avatar_url. */
const SET_FOTOS = Object.freeze([
  '01-chica-jersey.png',
  '02-samarreta-socdepoble-roly-plom-oscur-1024px.png',
  '03-young-man-tshirt.png',
  '04-iaia-tshirt.png',
  '06-group-tshirt.png',
  '07-rustic-detail.png',
  '08-javi-llinares-perfil-1024px.webp'
].map((fitxer) => `${CARPETA}/${fitxer}`));
const SAMARRETA_REMOTA = Object.freeze({
  id: 'samarreta-socdepoble', type: 'product', sectionId: 'mercat', title: 'Samarreta Sóc de Poble',
  subtitle: "L'edició definitiva amb el logotip complet", price: '15.00€', images: SET_FOTOS,
  seller: 'Sóc de Poble', imageSrc: LOGO_SVG, avatar_url: LOGO_SVG, official: true,
  author_id: 'soc-de-poble_official', author_name: 'Sóc de Poble', author_role: 'business', author_entity_id: 'socdepoble',
  description: 'Mapa del tresor sobre cotó resistent.', population: 'La Torre de les Maçanes',
  created_at: '2026-08-15T12:33:00.000Z', variations: []
});

const AVATAR_DE_PEPA = '/assets/uploads/gent/pepa/avatars/pepa-perfil.webp';
const publicacio = (extra) => ({ id: 'p1', type: 'feed', title: 'Festa major', author_name: 'Pepa', owner_user_id: 'u-1', created_at: '2026-09-01T10:00:00.000Z', ...extra });
const acte = (extra) => ({ id: 'fira', title: 'Fira', author_name: 'Pepa', owner_user_id: 'u-1', date: '2026-11-14', created_at: '2026-09-01T10:00:00.000Z', ...extra });

const portada = (container) => container.querySelector('.hero-image');
const fontsDeLaPortada = (container) => [...(portada(container)?.querySelectorAll('img') ?? [])].map((img) => img.getAttribute('src'));
const ultimSeo = () => mocks.seo.mock.calls[mocks.seo.mock.calls.length - 1][0];
/* Revisió adversarial (261027) · La triada viatja com { url, alt }; la
   genèrica, null. Ací es mira l'URL; l'alt, a la seua prova. */
const urlDelSeo = () => {
  const imatge = ultimSeo().image;
  return imatge && typeof imatge === 'object' ? imatge.url : imatge;
};
const metaDelHead = (selector) => document.head.querySelector(selector)?.getAttribute('content') ?? null;

function pinta(sectionId, item, moderacio = null) {
  mocks.sectionId = sectionId;
  mocks.itemId = item.id;
  mocks.mur = {
    events: sectionId === 'events' ? [item] : [],
    feedPosts: sectionId === 'mur' ? [item] : [],
    marketItems: sectionId === 'mercat' ? [item] : []
  };
  mocks.core = { towns: sectionId === 'pobles' ? [item] : [] };
  mocks.notes = sectionId === 'notes' ? [item] : [];
  const arbre = moderacio
    ? <ModeracioContext.Provider value={moderacio}><ItemDetailSection /></ModeracioContext.Provider>
    : <ItemDetailSection />;
  return render(arbre).container;
}

/* El <head> d'index.html, reduït al que mira la prova: la targeta genèrica. */
function headDeLIndex() {
  const meta = (atribut, nom, contingut) => {
    const node = document.createElement('meta');
    node.setAttribute(atribut, nom);
    node.setAttribute('content', contingut);
    return node;
  };
  const titol = document.createElement('title');
  titol.textContent = CAP_SOCIAL_BASE.title;
  document.head.replaceChildren(
    titol,
    meta('name', 'description', CAP_SOCIAL_BASE.description),
    meta('property', 'og:image', GENERICA),
    meta('name', 'twitter:image', GENERICA)
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.origen = null;
  mocks.supabaseUrl = 'https://projecte-1.supabase.test';
  mocks.headReal = false;
});
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

describe('Mercat · la samarreta de producció', () => {
  test('og:image és la xica (01-chica-jersey) en la seua variant social, absoluta i https; mai el logotip d’imageSrc ni d’avatar_url', () => {
    pinta('mercat', SAMARRETA_REMOTA);
    expect(XICA_SOCIAL).toBe(`${CARPETA}/01-chica-jersey-social-1200x630.jpg`);
    expect(urlDelSeo()).toBe(`https://socdepoble.org${XICA_SOCIAL}`);
  });

  test('Llei del Píxel · el carrusel de la portada, el de sempre: les set fotos en ordre, la primera la xica', () => {
    const container = pinta('mercat', SAMARRETA_REMOTA);
    expect(fontsDeLaPortada(container)).toEqual(SET_FOTOS);
    expect(fontsDeLaPortada(container)).not.toContain(LOGO_SVG);
  });

  test('<head> · og:image i twitter:image porten la xica (useSEO i seoHead de veres)', () => {
    headDeLIndex();
    mocks.headReal = true;
    pinta('mercat', SAMARRETA_REMOTA);
    expect(metaDelHead('meta[property="og:image"]')).toBe(`https://socdepoble.org${XICA_SOCIAL}`);
    expect(metaDelHead('meta[name="twitter:image"]')).toBe(`https://socdepoble.org${XICA_SOCIAL}`);
  });

  test('un origen públic https mana sobre socdepoble.org', () => {
    mocks.origen = 'https://proves.socdepoble.test';
    pinta('mercat', SAMARRETA_REMOTA);
    expect(urlDelSeo()).toBe(`https://proves.socdepoble.test${XICA_SOCIAL}`);
  });

  test('Fase D · d’una samarreta bloquejada, cap imatge al <head> (ni la xica)', () => {
    const container = pinta('mercat', SAMARRETA_REMOTA, { disponible: true, esElementBloquejat: () => true });
    expect(portada(container)).toBeNull();
    /* P1-61 Fase 2 (261028) · i no indexable: el head prerenderitzat se'n va. */
    expect(ultimSeo()).toEqual({ title: null, description: '', image: null, index: false });
  });
});

describe('Mur', () => {
  test('una publicació amb l’avatar de qui signa com a imageSrc: cap imatge pròpia, la targeta genèrica', () => {
    pinta('mur', publicacio({ imageSrc: AVATAR_DE_PEPA, avatar_url: AVATAR_DE_PEPA }));
    expect(ultimSeo().image).toBeNull();
  });

  test('Llei del Píxel · la portada de l’avatar, la de sempre', () => {
    const container = pinta('mur', publicacio({ imageSrc: AVATAR_DE_PEPA, avatar_url: AVATAR_DE_PEPA }));
    expect(fontsDeLaPortada(container)).toEqual([AVATAR_DE_PEPA]);
  });

  /* L'origen sobre el qual useSEO fa absoluta la targeta genèrica és de
     useSEO i seoHead (S3), no d'esta peça: ací es mira el camí. */
  test('<head> · amb l’avatar, og:image i twitter:image són la targeta genèrica', () => {
    headDeLIndex();
    mocks.headReal = true;
    pinta('mur', publicacio({ imageSrc: AVATAR_DE_PEPA, avatar_url: AVATAR_DE_PEPA }));
    const ogImage = metaDelHead('meta[property="og:image"]');
    expect(new URL(ogImage).pathname).toBe(CAP_SOCIAL_BASE.image.url);
    expect(metaDelHead('meta[name="twitter:image"]')).toBe(ogImage);
  });

  /* La primera és d'un altre origen: 'bloquejada'. La segona, pròpia, no la
     substituïx mai (ni a la portada, ni a images[], ni al cos). */
  test.each([
    ['la portada', publicacio({ image: RASTREIG, images: ['/assets/mur/segona.webp'] })],
    ['el cos', publicacio({ content: `<p><img src="${RASTREIG}" alt="fora"></p><p><img src="/assets/mur/segona.webp" alt="pròpia"></p>` })]
  ])('una primera imatge d’un altre origen a %s: la targeta genèrica, mai la segona', (_, element) => {
    const container = pinta('mur', element);
    /* Llei del Píxel · la de fora no es pinta (Decisió 3, 261007), com abans. */
    expect(fontsDeLaPortada(container)).toEqual([]);
    expect(ultimSeo().image).toBeNull();
  });

  test('una foto del bucket públic (sdp-media://mitjans/…): l’URL pública del Supabase del paquet', () => {
    pinta('mur', publicacio({ image: 'sdp-media://mitjans/poble/u-1/mur/festa.webp' }));
    expect(urlDelSeo()).toBe('https://projecte-1.supabase.test/storage/v1/object/public/mitjans/poble/u-1/mur/festa.webp');
  });

  test('una foto del bucket privat: bloquejada, la targeta genèrica', () => {
    pinta('mur', publicacio({ image: 'sdp-media://mitjans_privats/poble/u-1/mur/festa.webp' }));
    expect(ultimSeo().image).toBeNull();
  });
});

describe('Agenda i Pobles', () => {
  test('un acte amb imatge pròpia: absoluta i https; la portada, la de sempre', () => {
    const container = pinta('events', acte({ image_url: '/assets/agenda/fira.webp' }));
    expect(fontsDeLaPortada(container)).toEqual(['/assets/agenda/fira.webp']);
    expect(urlDelSeo()).toBe('https://socdepoble.org/assets/agenda/fira.webp');
  });

  test('un poble porta la seua image_url, absoluta i https (la variant social de 1200x630, OG-02); la portada, la de sempre', () => {
    const container = pinta('pobles', { id: 'sella', title: 'Sella', image_url: '/assets/towns/sella/1.jpg' });
    expect(fontsDeLaPortada(container)).toEqual(['/assets/towns/sella/1.jpg']);
    expect(urlDelSeo()).toBe('https://socdepoble.org/assets/towns/sella/1-social-1200x630.jpg');
  });

  test('un poble amb la imatge d’un altre origen: bloquejada; la portada, la de sempre', () => {
    const container = pinta('pobles', { id: 'sella', title: 'Sella', image_url: RASTREIG });
    expect(fontsDeLaPortada(container)).toEqual([RASTREIG]);
    expect(ultimSeo().image).toBeNull();
  });
});

describe('Notes', () => {
  test('una nota no té mai imatge social, encara que el cos en porte (la portada de sempre: cap)', () => {
    const container = pinta('notes', { id: 'n1', title: 'Nota', body: '<p><img src="/assets/notes/a.png" alt="a"></p>' });
    expect(portada(container)).toBeNull();
    expect(ultimSeo().image).toBeNull();
  });
});

/* Pla 261027_1154 (P1-61) · Revisió adversarial (261027) · La triada porta el
   seu alt: el de la portada i el carrusel (pagina.heroAlt, el títol). Sense
   MIME ni mides, que no es lligen dels bytes. */
describe('l’alt de la imatge triada', () => {
  test('la samarreta: { url, alt } amb el títol, i al <head> og:image:alt i twitter:image:alt', () => {
    pinta('mercat', SAMARRETA_REMOTA);
    expect(ultimSeo().image).toEqual({ url: `https://socdepoble.org${XICA_SOCIAL}`, alt: 'Samarreta Sóc de Poble' });
    cleanup();
    headDeLIndex();
    mocks.headReal = true;
    pinta('mercat', SAMARRETA_REMOTA);
    expect(metaDelHead('meta[property="og:image:alt"]')).toBe('Samarreta Sóc de Poble');
    expect(metaDelHead('meta[name="twitter:image:alt"]')).toBe('Samarreta Sóc de Poble');
    expect([metaDelHead('meta[property="og:image:type"]'), metaDelHead('meta[property="og:image:width"]')]).toEqual([null, null]);
  });
});

/* Pla 261027_1154 (P1-61) · Revisió adversarial (261027) · AT9, el contracte:
   per a cada tipus de detall, i sense cap imatge triada per l'autor (og_image
   o featured_image, davall), l'og:image és la PRIMERA imatge que es pinta (la
   portada o la primera diapositiva i, sense, la primera del cos). Abans, el Mur
   i els Pobles prenien images[], que el detall no pinta; el Mercat, el content,
   que tampoc; i el Markdown del cos, que es pinta com a text. */
const primeraPintada = (container) => fontsDeLaPortada(container)[0]
  ?? container.querySelector('.content-wrapper img')?.getAttribute('src') ?? null;
const producte = (extra) => ({ id: 'cistella', type: 'product', title: 'Cistella', seller: 'Pepa', author_name: 'Pepa', owner_user_id: 'u-1',
  created_at: '2026-09-01T10:00:00.000Z', variations: [], ...extra });

describe('AT9 · l’og:image és la primera imatge que es pinta', () => {
  test.each([
    ['la samarreta de producció', 'mercat', SAMARRETA_REMOTA, XICA],
    ['Mur: la portada, i no images[]', 'mur', publicacio({ image: '/assets/mur/portada.webp', images: ['/assets/mur/galeria.webp'] }), '/assets/mur/portada.webp'],
    ['Mur: images[] no es pinta; la primera és la del cos', 'mur',
      publicacio({ images: ['/assets/mur/a.webp'], content: '<p><img src="/assets/mur/b.webp" alt="b"></p>' }), '/assets/mur/b.webp'],
    ['Mur: un ![x](…) del cos és text; la primera és la <img>', 'mur',
      publicacio({ content: '<p>![x](/assets/mur/a.webp)</p><p><img src="/assets/mur/b.webp" alt="b"></p>' }), '/assets/mur/b.webp'],
    ['Mercat: sense galeria, la primera de la descripció, mai la del content', 'mercat',
      producte({ images: [], description: '<p><img src="/assets/mercat/desc.webp" alt="d"></p>', content: '<p><img src="/assets/mercat/content.webp" alt="c"></p>' }),
      '/assets/mercat/desc.webp'],
    ['Agenda: sense cartell, la primera del cos', 'events', acte({ description: '<p><img src="/assets/agenda/cos.webp" alt="c"></p>' }), '/assets/agenda/cos.webp'],
    ['Pobles: la portada, i no images[]', 'pobles', { id: 'sella', title: 'Sella', image_url: '/assets/towns/sella/1.jpg', images: ['/assets/towns/sella/2.jpg'] },
      '/assets/towns/sella/1.jpg']
  ])('%s', (_, sectionId, item, esperada) => {
    const container = pinta(sectionId, item);
    expect(primeraPintada(container)).toBe(esperada);
    // R-01 · Si la primera pintada té variant social, el <head> porta la variant; si no, la mateixa.
    expect(new URL(urlDelSeo()).pathname).toBe(VARIANTS_SOCIALS[esperada] ?? esperada);
  });

  test.each([
    ['Pobles: només images[]', 'pobles', { id: 'sella', title: 'Sella', images: ['/assets/towns/sella/2.jpg'] }],
    ['Mercat: només un content, que no es pinta', 'mercat', producte({ content: '<p><img src="/assets/mercat/content.webp" alt="c"></p>' })],
    ['Agenda: un cartell en Markdown, que es pinta com a text', 'events', acte({ description: 'Cartell: ![c](/assets/agenda/c.jpg)' })],
    ['Mur: només images[]', 'mur', publicacio({ images: ['/assets/mur/a.webp'] })]
  ])('%s: cap imatge pintada, la targeta genèrica', (_, sectionId, item) => {
    const container = pinta(sectionId, item);
    expect(primeraPintada(container)).toBeNull();
    expect(ultimSeo().image).toBeNull();
  });
});

/* Revisió de mutants (261027) · Llibre Mestre, P1-61 (àudio de les 12:08) ·
   La imatge que l'autor tria per a xarxes (og_image, o si no, featured_image)
   va al <head> per davant de la primera que es pinta; la portada i el carrusel
   no la lligen (Llei del Píxel). És l'única excepció a AT9: ací l'og:image ja
   no és la primera pintada. */
describe('la imatge que tria l’autor (og_image, o featured_image)', () => {
  const VERDA = `${CARPETA}/samarreta-socdepoble-verd-638px.webp`;

  test('Mercat: og_image al <head>; el carrusel, el de sempre (les set fotos, la xica primera)', () => {
    const container = pinta('mercat', { ...SAMARRETA_REMOTA, og_image: VERDA });
    expect(fontsDeLaPortada(container)).toEqual(SET_FOTOS);
    expect(urlDelSeo()).toBe(`https://socdepoble.org${VERDA}`);
  });

  test('Mur: featured_image al <head>; la portada, la de sempre', () => {
    const container = pinta('mur', publicacio({ image: '/assets/mur/portada.webp', featured_image: '/assets/mur/destacada.webp' }));
    expect(fontsDeLaPortada(container)).toEqual(['/assets/mur/portada.webp']);
    expect(urlDelSeo()).toBe('https://socdepoble.org/assets/mur/destacada.webp');
  });

  test('una og_image que no es pot servir: la targeta genèrica, mai el cartell', () => {
    const container = pinta('events', acte({ og_image: '/assets/agenda/cartell.svg', image_url: '/assets/agenda/fira.webp' }));
    expect(fontsDeLaPortada(container)).toEqual(['/assets/agenda/fira.webp']);
    expect(ultimSeo().image).toBeNull();
  });
});
