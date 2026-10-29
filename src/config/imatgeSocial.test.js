/* Pla 261027_1154 (P1-61) · El selector de la imatge social
   (config/imatgeSocial.js), amb fixtures en línia i cap xarxa:
     · és una fulla sense imports que també carrega node pla;
     · el <head> genèric (CAP_SOCIAL_BASE) és el que porta index.html;
     · les marques i la portada de reserva viuen allí i són els mateixos
       objectes que lligen UniversalUtils.js i paginaDeText.js;
     · la primera imatge és la que ha triat l'autor (og_image, o si no,
       featured_image; Llibre Mestre, P1-61) i, sense, la que veu una persona:
       la Samarreta tria la xica (01-chica-jersey), mai el logotip ni l'avatar
       de qui ven;
     · PARITAT amb mercat/imatgesDeProducte.js (la portada i el carrusel):
       sense cap imatge triada per l'autor, la portada i l'og:image no es poden
       separar; amb una triada, se separen a propòsit i la portada no la llig;
     · una primera imatge que no es pot servir queda 'bloquejada': mai es
       passa a la segona ni al logotip;
     · R-01/R-02 (pla 261029_0216): un original amb variant social
       (VARIANTS_SOCIALS) va al <head> com la variant -social-1200x630.jpg;
       `ref`, les candidates i la portada continuen sent l'original;
     · srcsDeLesImg llig HTML i Markdown en ordre i no penja amb 1 MB hostil.
   La instantània remota de la Samarreta és la fila marketItems d'app_content
   de producció (lectura anònima del 27-10-2026, versió 250035): set fotos, i
   imageSrc i avatar_url són l'SVG del logotip. Ací només en queden els camins. */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'acorn';
import { describe, expect, test } from 'vitest';
import {
  ATRIBUT_SSR,
  CAP_SOCIAL_BASE,
  HERO_PER_DEFECTE,
  IMATGES_DE_RESERVA,
  MARQUES,
  MARQUES_SVG_ANTIGUES,
  MOTIUS_DE_BLOQUEIG,
  ORIGEN_SOCIAL_PER_DEFECTE,
  TIPUS_DE_PAGINA,
  VARIANTS_SOCIALS,
  esImatgeDeReserva,
  imatgesDeLaPagina,
  primerValor,
  primeraImatgeSocial,
  srcsDeLesImg,
  urlSocialDe
} from './imatgeSocial.js';
import { ORIGEN_PUBLIC_PER_DEFECTE } from './origenPublic.js';
import { bessonaDe } from './politicaDeMitjans.js';
import { DEFAULT_AUTHOR, MARQUES_SVG_ANTIGUES as MARQUES_SVG_D_UNIVERSAL, camiDe } from '../components/universal/UniversalUtils.js';
import { getFirstImage } from '../sections/detail/detailHelpers.jsx';
import { imatgesDeProducte } from '../sections/mercat/imatgesDeProducte.js';
import { MOCK_MARKET_ITEMS } from '../sections/mercat/marketSeed.js';
import { propsDePaginaDeText } from '../sections/text/paginaDeText.js';
import { fotoDelBucketPublic } from '../utils/mitjaOpac.js';

const ARREL = process.cwd();
const FONT = path.join(ARREL, 'src/config/imatgeSocial.js');
const SUPABASE = 'https://abcdefghijklmnop.supabase.co';
const PUBLIC_DE_MITJANS = `${SUPABASE}/storage/v1/object/public/mitjans/`;

const CARPETA = '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble';
const XICA = `${CARPETA}/01-chica-jersey.png`;
/* R-01 · La variant social de la xica, la que va al <head> (la portada continua sent el .png). */
const XICA_SOCIAL = `${CARPETA}/01-chica-jersey-social-1200x630.jpg`;
const LOGO_SVG = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
const AVATAR_JAVI = '/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.webp';

/* La fila remota (producció), reduïda als camins i als camps que llig el selector. */
const SAMARRETA_REMOTA = Object.freeze({
  id: 'samarreta-socdepoble',
  type: 'product',
  title: 'Samarreta Sóc de Poble',
  description: 'Mapa del tresor sobre cotó resistent. La imatge complementa el text, no el substituïx.',
  seller: 'Sóc de Poble',
  imageSrc: LOGO_SVG,
  avatar_url: LOGO_SVG,
  images: [
    XICA,
    `${CARPETA}/02-samarreta-socdepoble-roly-plom-oscur-1024px.png`,
    `${CARPETA}/03-young-man-tshirt.png`,
    `${CARPETA}/04-iaia-tshirt.png`,
    `${CARPETA}/06-group-tshirt.png`,
    `${CARPETA}/07-rustic-detail.png`,
    `${CARPETA}/08-javi-llinares-perfil-1024px.webp`
  ],
  variations: [
    { name: 'Edició Gris Plom', image: `${CARPETA}/02-samarreta-socdepoble-roly-plom-oscur-1024px.png` },
    { name: 'Edició Verda', image: `${CARPETA}/samarreta-socdepoble-verd-638px.webp`, stock_status: 'Esgotat' }
  ]
});
const MAC_REMOT = Object.freeze({
  id: 'mac-mini-m4',
  type: 'product',
  title: 'Mac Mini Apple M4, 24/512GB',
  description: 'Mac Mini en perfecte estat. Comprat al març de 2025.',
  images: ['/assets/uploads/brain/mac_mini_m4_1787721966622.webp'],
  imageSrc: AVATAR_JAVI,
  avatar_url: AVATAR_JAVI
});

/* Les variants de la regla de sempre que hi ha a la llavor i a producció, i
   les que la cobrixen per les vores: on imatgesDeProducte i el selector han
   de dir el mateix. */
const VORES_DEL_MERCAT = Object.freeze([
  { id: 'sense-galeria', image_url: '/assets/uploads/mercat/a.jpg', imageSrc: '/assets/uploads/mercat/b.jpg' },
  { id: 'galeria-i-portada-vella', images: ['/assets/uploads/mercat/m1.jpg', '/assets/uploads/mercat/m2.jpg'], image_url: '/assets/uploads/mercat/vella.jpg', imageSrc: '/assets/uploads/mercat/x.jpg' },
  { id: 'galeria-buida', images: [], image: '/assets/uploads/mercat/c.webp' },
  { id: 'galeria-de-textos-buits', images: [''], image: '/assets/uploads/mercat/c2.webp' },
  { id: 'galeria-d-espais', images: ['', '   '], image: '/assets/uploads/mercat/c3.webp' },
  { id: 'nomes-avatar', images: [AVATAR_JAVI], avatar_url: AVATAR_JAVI, image_url: '/assets/uploads/mercat/d.jpg' },
  { id: 'imatge-de-l-avatar', imageSrc: AVATAR_JAVI, author_avatar: AVATAR_JAVI },
  { id: 'repetides', images: ['/assets/uploads/mercat/e.jpg', 'https://socdepoble.org/assets/uploads/mercat/e.jpg?v=2', '/assets/uploads/mercat/f.jpg'] },
  { id: 'html-a-la-galeria', images: ['<p><img src="/assets/uploads/mercat/g.jpg"></p>', '/assets/uploads/mercat/h.jpg'] },
  { id: 'llista-niada', images: [['/assets/uploads/mercat/i.jpg']] },
  { id: 'logo-svg-i-png', images: [MARQUES.avatar, '/assets/uploads/mercat/j.jpg'], avatar_url: LOGO_SVG }
]);
/* Un logotip de la marca dins de la galeria de qui NO el porta d'avatar: la
   portada el pinta, però és una reserva. Fora de la paritat, a propòsit. */
const MARCA_A_LA_GALERIA = Object.freeze({ id: 'marca-a-la-galeria', images: [MARQUES.avatar, '/assets/uploads/mercat/k.jpg'], avatar_url: AVATAR_JAVI });

const camins = (llista) => llista.map(camiDe);

describe('una fulla sense imports, per a Vite i per a node pla', () => {
  /* Els identificadors lliures que una fulla neutral no pot nomenar: només el
     global URL i els d'ECMAScript. */
  const GLOBALS_PROHIBITS = new Set(['window', 'document', 'globalThis', 'self', 'navigator', 'location', 'process', 'require', 'module', 'exports', '__dirname', '__filename', 'fetch', 'localStorage', 'sessionStorage']);

  function* nodes(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const fill of node) yield* nodes(fill);
      return;
    }
    if (typeof node.type === 'string') yield node;
    for (const [clau, valor] of Object.entries(node)) if (clau !== 'type') yield* nodes(valor);
  }

  test('el codi no importa res: cap import, export … from, import(), import.meta ni require', () => {
    const arbre = parse(readFileSync(FONT, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' });
    const tots = [...nodes(arbre)];
    expect(tots.length).toBeGreaterThan(500);
    const importacions = tots.filter((node) => node.type === 'ImportDeclaration' || node.type === 'ImportExpression'
      || node.type === 'MetaProperty' || node.type === 'ExportAllDeclaration'
      || (node.type === 'ExportNamedDeclaration' && node.source)
      || (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'require'));
    expect(importacions.map((node) => `${node.type}@${node.start}`)).toEqual([]);
  });

  test('cap global de navegador ni de node: només URL', () => {
    const arbre = parse(readFileSync(FONT, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' });
    const propietats = new Set();
    for (const node of nodes(arbre)) {
      if (node.type === 'MemberExpression' && !node.computed) propietats.add(node.property);
      if (node.type === 'Property' && !node.computed) propietats.add(node.key);
    }
    const prohibits = [...nodes(arbre)]
      .filter((node) => node.type === 'Identifier' && !propietats.has(node) && GLOBALS_PROHIBITS.has(node.name))
      .map((node) => node.name);
    expect(prohibits).toEqual([]);
    expect(readFileSync(FONT, 'utf8')).toMatch(/new URL\(/);
  });

  test('node pla l’importa tal com diu el pla, i la Samarreta hi tria la xica', () => {
    const codi = `import('./src/config/imatgeSocial.js').then((m) => {
      const fila = ${JSON.stringify(SAMARRETA_REMOTA)};
      process.stdout.write(JSON.stringify({ noms: Object.keys(m).sort(), triada: m.primeraImatgeSocial('mercat', fila) }));
    });`;
    const eixida = spawnSync(process.execPath, ['-e', codi], { cwd: ARREL, encoding: 'utf8', timeout: 20000 });
    expect(eixida.stderr).toBe('');
    expect(eixida.status).toBe(0);
    const { noms, triada } = JSON.parse(eixida.stdout);
    expect(noms).toEqual(['ATRIBUT_SSR', 'CAP_SOCIAL_BASE', 'HERO_PER_DEFECTE', 'IMATGES_DE_RESERVA', 'MARQUES', 'MARQUES_SVG_ANTIGUES',
      'MOTIUS_DE_BLOQUEIG', 'ORIGEN_SOCIAL_PER_DEFECTE', 'TIPUS_DE_PAGINA', 'VARIANTS_SOCIALS', 'esImatgeDeReserva', 'imatgesDeLaPagina', 'primerValor',
      'primeraImatgeSocial', 'srcsDeLesImg', 'urlSocialDe']);
    expect(triada).toEqual({ estat: 'triada', ref: XICA, url: `https://socdepoble.org${XICA_SOCIAL}`, posicio: 0 });
  });
});

describe('el <head> genèric és el d’index.html (OG-1)', () => {
  const html = readFileSync(path.join(ARREL, 'index.html'), 'utf8');
  const cap = html.slice(0, html.indexOf('</head>'));
  const metes = new Map([...cap.matchAll(/<meta\s+(?:property|name)="([^"]+)"\s+content="([^"]*)"\s*\/?>/g)].map(([, nom, valor]) => [nom, valor]));

  test('cada valor de CAP_SOCIAL_BASE és el que servix index.html', () => {
    const imatge = `${ORIGEN_SOCIAL_PER_DEFECTE}${CAP_SOCIAL_BASE.image.url}`;
    expect({
      title: cap.match(/<title>([^<]*)<\/title>/)[1],
      description: metes.get('description'),
      'og:title': metes.get('og:title'),
      'og:description': metes.get('og:description'),
      'og:type': metes.get('og:type'),
      'og:image': metes.get('og:image'),
      'og:image:type': metes.get('og:image:type'),
      'og:image:width': metes.get('og:image:width'),
      'og:image:height': metes.get('og:image:height'),
      'og:image:alt': metes.get('og:image:alt'),
      'twitter:card': metes.get('twitter:card'),
      'twitter:title': metes.get('twitter:title'),
      'twitter:description': metes.get('twitter:description'),
      'twitter:image': metes.get('twitter:image'),
      'twitter:image:alt': metes.get('twitter:image:alt')
    }).toEqual({
      title: CAP_SOCIAL_BASE.title,
      description: CAP_SOCIAL_BASE.description,
      'og:title': CAP_SOCIAL_BASE.title,
      'og:description': CAP_SOCIAL_BASE.description,
      'og:type': CAP_SOCIAL_BASE.ogType,
      'og:image': imatge,
      'og:image:type': CAP_SOCIAL_BASE.image.type,
      'og:image:width': CAP_SOCIAL_BASE.image.width,
      'og:image:height': CAP_SOCIAL_BASE.image.height,
      'og:image:alt': CAP_SOCIAL_BASE.image.alt,
      'twitter:card': CAP_SOCIAL_BASE.twitterCard,
      'twitter:title': CAP_SOCIAL_BASE.title,
      'twitter:description': CAP_SOCIAL_BASE.description,
      'twitter:image': imatge,
      'twitter:image:alt': CAP_SOCIAL_BASE.image.alt
    });
  });

  test('els valors del Mestre, literals, i congelats sencers', () => {
    expect(CAP_SOCIAL_BASE).toEqual({
      title: 'Sóc de Poble',
      description: 'Portal de pobles connectats',
      ogType: 'website',
      twitterCard: 'summary_large_image',
      image: {
        url: '/assets/system/ui/og-socdepoble-1200x630.png',
        type: 'image/png',
        width: '1200',
        height: '630',
        alt: 'Logotip de Sóc de Poble, Portal de Pobles Connectats, sobre el mapa verd'
      }
    });
    expect(Object.isFrozen(CAP_SOCIAL_BASE)).toBe(true);
    expect(Object.isFrozen(CAP_SOCIAL_BASE.image)).toBe(true);
    expect(existsSync(path.join(ARREL, 'public', CAP_SOCIAL_BASE.image.url))).toBe(true);
  });

  test('l’origen és el de config/origenPublic.js, i el shell estàtic no porta la marca del servidor', () => {
    expect(ORIGEN_SOCIAL_PER_DEFECTE).toBe(ORIGEN_PUBLIC_PER_DEFECTE);
    expect(ATRIBUT_SSR).toBe('data-sdp-ssr');
    expect(html).not.toContain(ATRIBUT_SSR);
  });
});

describe('les reserves: una sola còpia, que no compta com a imatge', () => {
  test('MARQUES i MARQUES_SVG_ANTIGUES són els objectes que llig UniversalUtils.js, amb els valors de sempre', () => {
    expect(MARQUES_SVG_D_UNIVERSAL).toBe(MARQUES_SVG_ANTIGUES);
    expect(MARQUES).toEqual({
      avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
      clar: '/assets/system/ui/logo-socdepoble-rect-negre-985x256.png',
      fosc: '/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png'
    });
    expect(MARQUES_SVG_ANTIGUES).toEqual({
      avatar: LOGO_SVG,
      clar: '/assets/system/ui/logo-socdepoble-rect-negre.svg',
      fosc: '/assets/system/ui/logo-socdepoble-rect-blanc.svg'
    });
    expect(Object.isFrozen(MARQUES)).toBe(true);
    expect(Object.isFrozen(MARQUES_SVG_ANTIGUES)).toBe(true);
    expect([DEFAULT_AUTHOR.avatarUrl, DEFAULT_AUTHOR.logo.clar, DEFAULT_AUTHOR.logo.fosc].map(camiDe))
      .toEqual([MARQUES.avatar, MARQUES.clar, MARQUES.fosc]);
  });

  test('HERO_PER_DEFECTE és la portada que paginaDeText posa a una pàgina sense imatge', () => {
    expect(propsDePaginaDeText({ title: 'X' }, 'x').heroImage).toBe(HERO_PER_DEFECTE);
  });

  test('cada reserva existix a public/, sense repetides, i les WebP són les bessones dels seus originals', () => {
    expect(Object.isFrozen(IMATGES_DE_RESERVA)).toBe(true);
    expect(new Set(IMATGES_DE_RESERVA).size).toBe(IMATGES_DE_RESERVA.length);
    expect(IMATGES_DE_RESERVA.filter((cami) => !existsSync(path.join(ARREL, 'public', cami)))).toEqual([]);
    for (const original of [...Object.values(MARQUES), HERO_PER_DEFECTE, CAP_SOCIAL_BASE.image.url]) {
      expect(IMATGES_DE_RESERVA).toContain(original);
      expect(IMATGES_DE_RESERVA).toContain(`/${bessonaDe(original.slice(1))}`);
    }
    for (const svg of Object.values(MARQUES_SVG_ANTIGUES)) expect(IMATGES_DE_RESERVA).toContain(svg);
  });

  test('esImatgeDeReserva reconeix el camí, la URL absoluta i el camí resolt sota una base', () => {
    expect(esImatgeDeReserva(MARQUES.avatar)).toBe(true);
    expect(esImatgeDeReserva(`https://socdepoble.org${LOGO_SVG}?v=3`)).toBe(true);
    expect(esImatgeDeReserva(`/wp-content/plugins/socdepoble/dist${HERO_PER_DEFECTE}`)).toBe(true);
    expect(esImatgeDeReserva(`  ${CAP_SOCIAL_BASE.image.url}  `)).toBe(true);
    expect(esImatgeDeReserva(XICA)).toBe(false);
    expect(esImatgeDeReserva('/assets/system/ui/og-socdepoble-1200x630.png.jpg')).toBe(false);
    expect(esImatgeDeReserva('')).toBe(false);
    expect(esImatgeDeReserva(null)).toBe(false);
  });

  /* Revisió adversarial (261027) · Una reserva es reconeix també codificada o
     amb barres repetides (Firebase servix el mateix fitxer), i només en un host
     propi: el mateix camí en un altre host no és el nostre logotip. */
  test('esImatgeDeReserva: codificada o amb barres repetides sí; en un altre host, no; amb l’origen de qui crida, sí', () => {
    expect(esImatgeDeReserva('/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.pn%67')).toBe(true);
    expect(esImatgeDeReserva('/assets/%73ystem/ui/logo-socdepoble-cuadrat-verd-256x256.png')).toBe(true);
    expect(esImatgeDeReserva('/assets/system/ui/%6fg-socdepoble-1200x630.png')).toBe(true);
    expect(esImatgeDeReserva('/assets//system/ui/logo-socdepoble-cuadrat-verd-256x256.png')).toBe(true);
    expect(esImatgeDeReserva(`https://fora.example${LOGO_SVG}`)).toBe(false);
    expect(esImatgeDeReserva(`//fora.example${MARQUES.avatar}`)).toBe(false);
    expect(esImatgeDeReserva(`https://staging.socdepoble.org${MARQUES.avatar}`)).toBe(false);
    expect(esImatgeDeReserva(`https://staging.socdepoble.org${MARQUES.avatar}`, { origen: 'https://staging.socdepoble.org' })).toBe(true);
  });

  test('les icones de l’app de l’arrel de public/ són la marca: reserves', () => {
    for (const icona of ['/icona-app-192.png', '/icona-app-512.png', '/apple-touch-icon.png', '/favicon.svg', '/favicon.ico']) {
      expect(esImatgeDeReserva(icona), icona).toBe(true);
    }
    expect(primeraImatgeSocial('pagina', { image: '/icona-app-512.png' })).toEqual({ estat: 'absent' });
  });
});

describe('srcsDeLesImg: les imatges d’un cos, en ordre', () => {
  const MARKDOWN = { markdown: true };

  test('HTML amb cometes dobles, simples o cap, en qualsevol caixa, i Markdown (format declarat), barrejats en l’ordre del document', () => {
    const cos = [
      '<p>Hola</p><IMG class="x" SRC="/a.png">',
      "![primera](/b.png 'títol')",
      "<img alt='a > b' src='/c.png'>",
      '<img src=/d.png?x=1&amp;y=2 alt=x>',
      '![amb angles](</e f.png>)',
      '![amb parèntesis](/g_(1).png)',
      '<img data-src="/no.png" src="/h.png" src="/tampoc.png">'
    ].join('\n');
    expect(srcsDeLesImg(cos, 32, MARKDOWN)).toEqual(['/a.png', '/b.png', '/c.png', '/d.png?x=1&y=2', '/e f.png', '/g_(1).png', '/h.png']);
    /* Revisió adversarial (261027) · Sense el format declarat, el Markdown és
       text: renderRichText i CosDeLaPagina el pinten literal. */
    expect(srcsDeLesImg(cos)).toEqual(['/a.png', '/c.png', '/d.png?x=1&y=2', '/h.png']);
  });

  test('no compten les de dins d’un comentari, d’un contingut inert ni d’un bloc de codi', () => {
    const cos = [
      '<!-- <img src="/comentari.png"> -->',
      '<script>const x = \'<img src="/script.png">\';</script>',
      '<template><img src="/template.png"></template>',
      '<textarea><img src="/textarea.png"></textarea>',
      '<noscript><img src="/noscript.png"></noscript>',
      '```',
      '![codi](/codi.png)',
      '```',
      '<img src="/vista.png">'
    ].join('\n');
    expect(srcsDeLesImg(cos, 32, MARKDOWN)).toEqual(['/vista.png']);
    expect(srcsDeLesImg(cos)).toEqual(['/vista.png']);
  });

  /* Revisió adversarial (261027) · Un '<img' dins del valor d'un atribut d'una
     altra etiqueta no és cap etiqueta per al navegador. En HTML, una tanca de
     Markdown és text i la <img> de davall es pinta. */
  test('cap <img> de dins de les cometes d’una altra etiqueta; sense Markdown, una tanca ``` no amaga res', () => {
    expect(srcsDeLesImg('<a title="<img src=/assets/z.jpg>">x</a><img src=/assets/y.jpg>')).toEqual(['/assets/y.jpg']);
    expect(srcsDeLesImg("<p data-x='<img src=\"/a.png\">' >t</p></p title=\"<img src=/b.png>\"><img src='/c.png'>")).toEqual(['/c.png']);
    expect(srcsDeLesImg('<p>![x](/assets/a.jpg)</p><img src="/assets/b.jpg">')).toEqual(['/assets/b.jpg']);
    expect(srcsDeLesImg('```\n<img src="/assets/es-veu.jpg">\n```')).toEqual(['/assets/es-veu.jpg']);
    expect(srcsDeLesImg('<a title="sense tancar><img src="/assets/x.jpg">')).toEqual([]);
  });

  test('mai el text sencer: prosa, una <img> sense src, un src buit o una etiqueta sense tancar no en donen cap', () => {
    expect(srcsDeLesImg('Una frase sense cap imatge, encara que porte /assets/x.png')).toEqual([]);
    expect(srcsDeLesImg('<img alt="sense src">')).toEqual([]);
    expect(srcsDeLesImg('<img src="">')).toEqual([]);
    expect(srcsDeLesImg('<img src="/a.png"')).toEqual([]);
    expect(srcsDeLesImg('![sense destí]()')).toEqual([]);
    expect(srcsDeLesImg(null)).toEqual([]);
    expect(srcsDeLesImg(42)).toEqual([]);
  });

  test('maxim: 32 per defecte, i el que es demane', () => {
    const cos = '<img src="/x.png">'.repeat(40);
    expect(srcsDeLesImg(cos)).toHaveLength(32);
    expect(srcsDeLesImg(cos, 3)).toHaveLength(3);
    expect(srcsDeLesImg(cos, 0)).toEqual([]);
  });

  test('torna de pressa amb 1 MB hostil (cap recorregut quadràtic)', () => {
    const M = 1 << 20;
    const hostils = {
      imgSenseTancar: '<img'.repeat(M / 4),
      srcSenseTancar: `<img src="${'a'.repeat(M)}`,
      claudators: '!['.repeat(M / 2),
      markdownSenseTancar: '![a]('.repeat(M / 5),
      parentesis: `![](${'('.repeat(M)}`,
      titolsSenseTancar: '![a](x "'.repeat(M / 8),
      titolsDeParentesis: '![a](x ('.repeat(M / 8),
      destinsLlargs: `![a](${'x'.repeat(2000)}`.repeat(M / 2005),
      unSolClaudator: `${'!['.repeat(M / 2.2)}](${'x'.repeat(2047)}`,
      niats: '![a](('.repeat(M / 6),
      comentariObert: `<!--${'x'.repeat(M)}`,
      scriptObert: `<script>${'<img src=/x.png>'.repeat(M / 16)}`,
      tanques: '```\n'.repeat(M / 4),
      espais: `![a](${' '.repeat(M)}`,
      /* Revisió adversarial (261027) · Les etiquetes es travessen senceres. */
      etiquetesObertes: '<a '.repeat(M / 3),
      atributsSenseTancar: '<a title="'.repeat(M / 10),
      nomsLlargs: `<${'a'.repeat(M)}`
    };
    for (const [nom, text] of Object.entries(hostils)) {
      for (const opcions of [undefined, { markdown: true }]) {
        const inici = performance.now();
        const imatges = srcsDeLesImg(text, 32, opcions);
        const durada = performance.now() - inici;
        expect(durada, nom).toBeLessThan(2000);
        expect(imatges.every((src) => src.length <= 2048), nom).toBe(true);
      }
      expect(primerValor(text), nom).toBe(null);
    }
  });

  /* Revisió adversarial (261027) · FITXER_D_IMATGE feia marxa arrere
     quadràtica sobre un camp amb un espai (188 KB, 3 s). */
  test('primerValor i la tria tornen de pressa amb un camp hostil de 192 KB', () => {
    const hostil = `${'x.png?'.repeat(32000)} z`;
    for (const prova of [() => primerValor(hostil), () => primerValor(hostil.replaceAll('?', '#')),
      () => primeraImatgeSocial('mur', { imageSrc: hostil }), () => primeraImatgeSocial('mercat', { images: [hostil, hostil, '/assets/a.png'] })]) {
      const inici = performance.now();
      prova();
      expect(performance.now() - inici).toBeLessThan(2000);
    }
    expect(primerValor(hostil)).toBe(null);
  });
});

describe('primerValor: la primera referència d’un camp, mai la prosa', () => {
  test('camí, URL, referència del port, HTML i Markdown', () => {
    expect(primerValor('  /assets/x.png ')).toBe('/assets/x.png');
    expect(primerValor('https://socdepoble.org/assets/x.png')).toBe('https://socdepoble.org/assets/x.png');
    expect(primerValor('sdp-media://mitjans/a/b.jpg')).toBe('sdp-media://mitjans/a/b.jpg');
    expect(primerValor('<p><img src="/y.png"></p>')).toBe('/y.png');
    expect(primerValor('foto.jpg')).toBe('foto.jpg');
    expect(primerValor('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
    /* Revisió adversarial (261027) · Un esquema desconegut sense espais és una
       referència (la portada el pinta primer, i la tria la bloqueja); amb
       espais, prosa. Una imatge de Markdown en un camp no és cap imatge: la
       portada no la llig. */
    expect(primerValor('ipfs://bafybeigd/x.png')).toBe('ipfs://bafybeigd/x.png');
    expect(primerValor('Nota: res a vore')).toBe(null);
    expect(primerValor('![z](/z.png)')).toBe(null);
  });

  test('de la llista, el primer element que en dona una; prosa, objectes i números, null', () => {
    expect(primerValor(['', '   ', null, '/primera.png', '/segona.png'])).toBe('/primera.png');
    expect(primerValor([['/niada.png']])).toBe('/niada.png');
    const circular = [];
    circular.push(circular);
    expect(primerValor(circular)).toBe(null);
    expect(primerValor('Una frase de prosa')).toBe(null);
    expect(primerValor('Nota: res a vore')).toBe(null);
    expect(primerValor({ src: '/x.png' })).toBe(null);
    expect(primerValor(7)).toBe(null);
    expect(primerValor('')).toBe(null);
  });

  test('a diferència de getFirstImage, la prosa no es torna com si fora una URL', () => {
    expect(getFirstImage('Una frase de prosa')).toBe('Una frase de prosa');
    expect(primerValor('Una frase de prosa')).toBe(null);
  });
});

describe('imatgesDeLaPagina · Mercat: la Samarreta i la paritat amb la portada', () => {
  test('la fila remota: les set fotos en ordre, cap logotip (imageSrc i avatar_url)', () => {
    expect(imatgesDeLaPagina('mercat', SAMARRETA_REMOTA)).toEqual(SAMARRETA_REMOTA.images);
    expect(imatgesDeLaPagina('mercat', SAMARRETA_REMOTA)).not.toContain(LOGO_SVG);
  });

  test('la llavor (huit fotos): la mateixa primera', () => {
    const llavor = MOCK_MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
    expect(llavor.images).toHaveLength(8);
    expect(imatgesDeLaPagina('mercat', llavor)).toHaveLength(8);
    expect(imatgesDeLaPagina('mercat', llavor)[0]).toBe(XICA);
  });

  test('el Mac Mini: la seua foto, mai l’avatar de qui ven (imageSrc = avatar_url)', () => {
    expect(imatgesDeLaPagina('mercat', MAC_REMOT)).toEqual(['/assets/uploads/brain/mac_mini_m4_1787721966622.webp']);
  });

  test('PARITAT: per a cada producte de la llavor, de producció i de les vores, el mateix que imatgesDeProducte, element a element', () => {
    const items = [...MOCK_MARKET_ITEMS, SAMARRETA_REMOTA, MAC_REMOT, ...VORES_DEL_MERCAT];
    expect(items.length).toBeGreaterThanOrEqual(14);
    let ambFotos = 0;
    for (const item of items) {
      const delProducte = imatgesDeProducte(item);
      if (delProducte.length > 0) ambFotos += 1;
      expect(camins(imatgesDeLaPagina('mercat', item)), item.id).toEqual(camins(delProducte));
      expect(primeraImatgeSocial('mercat', item).ref ?? null, item.id).toBe(delProducte[0] ?? null);
    }
    expect(ambFotos).toBeGreaterThanOrEqual(10);
  });

  test('on la regla social va més enllà de la portada, i per què (cap de les dues a la llavor ni a producció)', () => {
    /* Un logotip dins de la galeria (de qui no el porta d'avatar) és una
       reserva: la portada el pinta, l'og:image no el tria. */
    expect(imatgesDeProducte(MARCA_A_LA_GALERIA)[0]).toBe(MARQUES.avatar);
    expect(imatgesDeLaPagina('mercat', MARCA_A_LA_GALERIA)).toEqual(['/assets/uploads/mercat/k.jpg']);
    /* Sense galeria, la primera foto que es veu és la del cos. */
    const ambCos = { id: 'cos', description: '<p>Mireu:</p><img src="/assets/uploads/mercat/cos.jpg">' };
    expect(imatgesDeProducte(ambCos)).toEqual([]);
    expect(imatgesDeLaPagina('mercat', ambCos)).toEqual(['/assets/uploads/mercat/cos.jpg']);
    /* Amb galeria, el cos va darrere. */
    expect(imatgesDeLaPagina('mercat', { ...MAC_REMOT, description: '<img src="/assets/uploads/mercat/cos.jpg">' }))
      .toEqual(['/assets/uploads/brain/mac_mini_m4_1787721966622.webp', '/assets/uploads/mercat/cos.jpg']);
    /* Les variacions no són la galeria. */
    expect(imatgesDeLaPagina('mercat', { variations: [{ image: '/assets/uploads/mercat/v.jpg' }] })).toEqual([]);
  });

  /* Revisió adversarial (261027) · La resta de diferències amb la portada, a
     la vista: cap no és a la llavor ni a producció. imatgesDeProducte només
     lleva avatar_url i author_avatar; la regla social lleva també el logotip
     propi (logo_image), author.avatar i avatarUrl (l'avatar que llig
     elementDeSeccio.js): si la galeria comença per un d'ells, la portada el
     pinta i l'og:image pren la foto següent (cap avatar no és mai la imatge
     d'una publicació). I una foto d'un altre host amb el mateix camí que una
     pròpia no és la mateixa: la portada les fon, la regla no. */
  test.each([
    ['logo_image', { images: ['/assets/u/x.jpg', '/assets/u/b.jpg'], logo_image: '/assets/u/x.jpg' }],
    ['author.avatar', { images: ['/assets/u/x.jpg', '/assets/u/b.jpg'], author: { avatar: '/assets/u/x.jpg' } }],
    ['avatarUrl', { images: ['/assets/u/x.jpg', '/assets/u/b.jpg'], avatarUrl: '/assets/u/x.jpg' }]
  ])('excepció a la paritat, a propòsit: l’avatar de %s al cap de la galeria', (_, item) => {
    expect(imatgesDeProducte(item)).toEqual(['/assets/u/x.jpg', '/assets/u/b.jpg']);
    expect(imatgesDeLaPagina('mercat', item)).toEqual(['/assets/u/b.jpg']);
  });

  test('excepció a la paritat, a propòsit: el mateix camí en un altre host no és la mateixa foto', () => {
    const item = { images: ['/assets/u/e.jpg', 'https://fora.example/assets/u/e.jpg'] };
    expect(imatgesDeProducte(item)).toEqual(['/assets/u/e.jpg']);
    expect(imatgesDeLaPagina('mercat', item)).toEqual(['/assets/u/e.jpg', 'https://fora.example/assets/u/e.jpg']);
  });

  /* Revisió adversarial (261027) · El cos que es pinta al detall del Mercat és
     item.description (renderBody), mai content. */
  test('el cos del Mercat és la descripció: el content no es pinta i no compta', () => {
    expect(imatgesDeLaPagina('mercat', { content: '<img src="/assets/u/c.jpg">' })).toEqual([]);
    expect(imatgesDeLaPagina('mercat', { description: '<img src="/assets/u/d.jpg">', content: '<img src="/assets/u/c.jpg">' }))
      .toEqual(['/assets/u/d.jpg']);
  });
});

describe('imatgesDeLaPagina · Mur, Agenda, Pobles, Pàgines i Notes', () => {
  const FOTO = '/assets/uploads/mur/foto.jpg';

  test('Mur: un imageSrc que és l’avatar_url de qui signa no hi és; queden les del cos', () => {
    const publicacio = { imageSrc: AVATAR_JAVI, avatar_url: AVATAR_JAVI, content: `<p>Hola</p><img src="${FOTO}">` };
    expect(imatgesDeLaPagina('mur', publicacio)).toEqual([FOTO]);
  });

  /* Revisió adversarial (261027) · El detall del Mur no pinta images[] (cap
     getImages, cap carrusel) ni llig Markdown al cos: cap de les dues no la
     veu ningú. */
  test('Mur: la portada (imageSrc, o image_url o image) i el cos (content, o summary); mai images[] ni Markdown', () => {
    expect(imatgesDeLaPagina('mur', {
      imageSrc: '/assets/uploads/mur/portada.jpg',
      image_url: '/assets/uploads/mur/no-es-veu.jpg',
      images: ['/assets/uploads/mur/galeria-que-no-es-pinta.jpg'],
      content: `<p><img src="${FOTO}"></p>`
    })).toEqual(['/assets/uploads/mur/portada.jpg', FOTO]);
    expect(imatgesDeLaPagina('mur', { image_url: '<img src="/assets/uploads/mur/u.jpg">', summary: `<img src="${FOTO}">` }))
      .toEqual(['/assets/uploads/mur/u.jpg', FOTO]);
    expect(imatgesDeLaPagina('mur', { image: '/assets/uploads/mur/i.jpg' })).toEqual(['/assets/uploads/mur/i.jpg']);
    expect(imatgesDeLaPagina('mur', { images: ['/assets/mur/a.webp'], content: '<p><img src="/assets/mur/b.webp"></p>' })).toEqual(['/assets/mur/b.webp']);
    expect(imatgesDeLaPagina('mur', { content: `<p>![x](/assets/mur/a.webp)</p><p><img src="${FOTO}"></p>` })).toEqual([FOTO]);
    expect(imatgesDeLaPagina('events', { description: 'Cartell: ![c](/assets/agenda/c.jpg)' })).toEqual([]);
    expect(imatgesDeLaPagina('pagina', { html: '<p>![x](/assets/a.jpg)</p><img src="/assets/b.jpg">' })).toEqual(['/assets/b.jpg']);
  });

  test('cap avatar ni logotip de qui signa, en cap tipus (author_avatar, author.avatar, logo_image, avatarUrl)', () => {
    const avatars = {
      author_avatar: '/assets/uploads/gent/a.webp',
      author: { name: 'Algú', avatar: '/assets/uploads/gent/b.webp' },
      logo_image: '/assets/uploads/empresa/c.png',
      avatarUrl: '/assets/uploads/gent/d.webp'
    };
    const cos = '<img src="/assets/uploads/gent/a.webp"><img src="/assets/uploads/gent/b.webp"><img src="/assets/uploads/empresa/c.png"><img src="/assets/uploads/gent/d.webp">';
    expect(imatgesDeLaPagina('mur', { ...avatars, content: `${cos}<img src="${FOTO}">` })).toEqual([FOTO]);
    expect(imatgesDeLaPagina('events', { ...avatars, image_url: avatars.logo_image, description: `${cos}<img src="${FOTO}">` })).toEqual([FOTO]);
    expect(imatgesDeLaPagina('mercat', { ...avatars, images: [avatars.avatarUrl, FOTO] })).toEqual([FOTO]);
    expect(imatgesDeLaPagina('pobles', { ...avatars, image_url: avatars.author.avatar, images: [FOTO] })).toEqual([]);
    expect(imatgesDeLaPagina('pagina', { ...avatars, image: avatars.author_avatar, html: `<img src="${FOTO}">` })).toEqual([FOTO]);
  });

  /* Revisió adversarial (261027) · El mateix avatar en les seues altres formes
     també és l'avatar: codificat, resolt sota la base de l'amfitrió, o la
     mateixa foto del bucket públic com a sdp-media:// o com a URL pública. */
  test('l’avatar en qualsevol de les seues formes pròpies tampoc no compta', () => {
    const opcions = { supabaseUrl: SUPABASE };
    const publica = `${PUBLIC_DE_MITJANS}perfils/joan.png`;
    expect(imatgesDeLaPagina('mercat', { avatar_url: '/assets/u/joan.png', images: ['/assets/u/joa%6E.png'] })).toEqual([]);
    expect(imatgesDeLaPagina('mercat', { avatar_url: '/wp-content/plugins/sdp/assets/u/joan.png', images: ['/assets/u/joan.png'] })).toEqual([]);
    expect(imatgesDeLaPagina('mercat', { avatar_url: 'sdp-media://mitjans/perfils/joan.png', images: [publica] }, opcions)).toEqual([]);
    expect(imatgesDeLaPagina('mur', { avatar_url: publica, image: 'sdp-media://mitjans/perfils/joan.png' }, opcions)).toEqual([]);
    expect(imatgesDeLaPagina('mercat', { avatar_url: 'sdp-media://MITJANS/perfils/joan.png', images: ['sdp-media://mitjans/perfils/joan.png'] }, opcions)).toEqual([]);
    /* El mateix camí en un altre host no és l'avatar: queda, i es bloqueja. */
    expect(primeraImatgeSocial('mercat', { avatar_url: '/assets/u/joan.png', images: ['https://fora.example/assets/u/joan.png'] }))
      .toEqual({ estat: 'bloquejada', ref: 'https://fora.example/assets/u/joan.png', motiu: 'origen' });
  });

  test('Agenda: image_url, i després el cos (description, o content)', () => {
    expect(imatgesDeLaPagina('events', { image_url: '/assets/uploads/aplec/cartell.jpg', description: `<img src="${FOTO}">` }))
      .toEqual(['/assets/uploads/aplec/cartell.jpg', FOTO]);
    expect(imatgesDeLaPagina('events', { content: `<img src="${FOTO}">` })).toEqual([FOTO]);
  });

  /* Revisió adversarial (261027) · La pàgina d'un poble només pinta image_url
     (cap getImages, i el cos no porta fotos). */
  test('Pobles: image_url, i res més (images[] no es pinta)', () => {
    expect(imatgesDeLaPagina('pobles', { image_url: '/assets/towns/tibi/1.webp', images: ['/assets/towns/tibi/2.webp', '/assets/towns/tibi/1.webp'] }))
      .toEqual(['/assets/towns/tibi/1.webp']);
    expect(primeraImatgeSocial('pobles', { images: ['/assets/towns/x/9.jpg'] })).toEqual({ estat: 'absent' });
  });

  test('Pàgina: la seua imatge i el cos', () => {
    expect(imatgesDeLaPagina('pagina', { image: '/assets/uploads/brain/pagina.webp', html: `<p><img src="${FOTO}"></p>` }))
      .toEqual(['/assets/uploads/brain/pagina.webp', FOTO]);
    expect(imatgesDeLaPagina('pagina', { title: 'Sense res' })).toEqual([]);
    expect(imatgesDeLaPagina('pagina', { image: MARQUES.avatar, html: `<img src="${FOTO}">` })).toEqual([FOTO]);
  });

  /* Llibre Mestre, P1-60 (Fita 24; àudio del Mestre de les 05:08) · /projecte
     porta al SEO la seua panoràmica de Pedra Seca. El panorama que nomena una
     pàgina de text (page.image o el cos) és seu; el que posa la pintura a una
     pàgina sense image (paginaDeText) no hi arriba, i als altres tipus (la
     decoració d'un poble) continua sent reserva. */
  test('Pàgina: el panorama que nomena ella mateixa és seu (P1-60); als altres tipus, reserva', () => {
    const PANORAMA_WEBP = HERO_PER_DEFECTE.replace(/\.png$/, '.webp');
    expect(imatgesDeLaPagina('pagina', { image: HERO_PER_DEFECTE })).toEqual([HERO_PER_DEFECTE]);
    expect(imatgesDeLaPagina('pagina', { image: HERO_PER_DEFECTE, html: `<img src="${FOTO}">` })).toEqual([HERO_PER_DEFECTE, FOTO]);
    expect(imatgesDeLaPagina('pagina', { html: `<p><img src="${PANORAMA_WEBP}"></p>` })).toEqual([PANORAMA_WEBP]);
    expect(imatgesDeLaPagina('pobles', { image_url: HERO_PER_DEFECTE })).toEqual([]);
    expect(imatgesDeLaPagina('mur', { imageSrc: HERO_PER_DEFECTE, content: `<img src="${FOTO}">` })).toEqual([FOTO]);
    expect(imatgesDeLaPagina('mercat', { images: [HERO_PER_DEFECTE, FOTO] })).toEqual([FOTO]);
    expect(imatgesDeLaPagina('events', { image_url: PANORAMA_WEBP })).toEqual([]);
  });

  test('Notes, un tipus desconegut o un element que no és objecte: cap', () => {
    expect(imatgesDeLaPagina('notes', { image_url: FOTO, images: [FOTO], content: `<img src="${FOTO}">` })).toEqual([]);
    expect(imatgesDeLaPagina('wiki', { image: FOTO })).toEqual([]);
    expect(imatgesDeLaPagina('perfil', { hero: FOTO })).toEqual([]);
    expect(imatgesDeLaPagina('mercat', null)).toEqual([]);
    expect(imatgesDeLaPagina('mercat', 'text')).toEqual([]);
    expect(TIPUS_DE_PAGINA).toEqual(['mercat', 'mur', 'events', 'pobles', 'pagina', 'notes']);
    expect(Object.isFrozen(TIPUS_DE_PAGINA)).toBe(true);
  });
});

describe('urlSocialDe: només el que pot baixar un rastrejador sense sessió', () => {
  test('/assets/… i el mateix origen dins d’/assets/, amb l’origen públic o el que es passe', () => {
    // R-01 · La xica té variant social: el <head> porta la variant, sense la consulta de l'original.
    expect(urlSocialDe(XICA)).toBe(`https://socdepoble.org${XICA_SOCIAL}`);
    expect(urlSocialDe(`https://socdepoble.org${XICA}?v=2#diapositiva`)).toBe(`https://socdepoble.org${XICA_SOCIAL}`);
    // OG-01 (revisió final 261029) · La bessona .webp d'un original amb variant (una publicació remota la nomena) també va a la variant: WhatsApp no pinta WebP.
    expect(urlSocialDe('/assets/uploads/brain/mac_mini_m4_1787721966622.webp')).toBe('https://socdepoble.org/assets/uploads/brain/mac_mini_m4_1787721966622-social-1200x630.jpg');
    expect(urlSocialDe('/assets/events/aplec_2023_cartell.webp')).toBe('https://socdepoble.org/assets/events/aplec_2023_cartell-social-1200x630.jpg');
    // Una .webp sense original amb variant es queda com està.
    expect(urlSocialDe('/assets/uploads/mercat/sense-variant.webp')).toBe('https://socdepoble.org/assets/uploads/mercat/sense-variant.webp');
    // Sense variant: el fragment se'n lleva i la consulta es queda, com sempre.
    expect(urlSocialDe('https://socdepoble.org/assets/uploads/mercat/foto.jpg?v=2#diapositiva')).toBe('https://socdepoble.org/assets/uploads/mercat/foto.jpg?v=2');
    expect(urlSocialDe('/assets/uploads/l\'horta amb espai.jpg')).toBe("https://socdepoble.org/assets/uploads/l'horta%20amb%20espai.jpg");
    expect(urlSocialDe('/assets/x.jpg', { origen: 'https://staging.socdepoble.org/' })).toBe('https://staging.socdepoble.org/assets/x.jpg');
    expect(urlSocialDe('/assets/x.jpg', { origen: 'http://localhost:3340' })).toBe(null);
    expect(urlSocialDe('/mercat/samarreta-socdepoble')).toBe(null);
    expect(urlSocialDe('https://socdepoble.org/fonts/x.woff2')).toBe(null);
  });

  test('el bucket públic de mitjans: amb l’URL de Supabase, la URL pública; sense, cap', () => {
    expect(urlSocialDe('sdp-media://mitjans/poble/uid/mur/x.jpg', { supabaseUrl: SUPABASE })).toBe(`${PUBLIC_DE_MITJANS}poble/uid/mur/x.jpg`);
    expect(urlSocialDe('SDP-MEDIA://mitjans/x.jpg', { supabaseUrl: `${SUPABASE}/` })).toBe(`${PUBLIC_DE_MITJANS}x.jpg`);
    expect(urlSocialDe('sdp-media://mitjans/x.jpg')).toBe(null);
    expect(urlSocialDe('sdp-media://mitjans/x.jpg', { supabaseUrl: 'http://127.0.0.1:54321' })).toBe(null);
    expect(urlSocialDe(`${PUBLIC_DE_MITJANS}poble/x.jpg`, { supabaseUrl: SUPABASE })).toBe(`${PUBLIC_DE_MITJANS}poble/x.jpg`);
    expect(urlSocialDe(`${PUBLIC_DE_MITJANS}poble/x.jpg`)).toBe(null);
    expect(urlSocialDe(`${SUPABASE}/storage/v1/object/public/altre/x.jpg`, { supabaseUrl: SUPABASE })).toBe(null);
  });

  test('la mateixa regla del bucket públic que mitjaOpac.js · fotoDelBucketPublic', () => {
    const refs = ['sdp-media://mitjans/a/b.jpg', 'sdp-media://mitjans/a/.amagat.jpg', 'sdp-media://mitjans/a/../b.jpg',
      'sdp-media://mitjans/a%2fb.jpg', 'sdp-media://mitjans/a b.jpg', 'sdp-media://mitjans_privats/a.jpg',
      'sdp-media://altre/a.jpg', 'sdp-media://mitjans/', ' sdp-media://mitjans/c.webp ', 'sdp-media://Mitjans/D.PNG'];
    for (const ref of refs) {
      expect(urlSocialDe(ref, { supabaseUrl: SUPABASE }) !== null, ref).toBe(fotoDelBucketPublic(ref) !== null);
    }
  });

  test('es rebutja: privats, signats, esquemes, camins bruts, credencials, SVG i altres orígens', () => {
    const opcions = { supabaseUrl: SUPABASE, permesos: [{ origen: SUPABASE, prefix: '/storage/v1/' }] };
    const rebutjades = [
      'sdp-media://mitjans_privats/poble/x.jpg',
      `${SUPABASE}/storage/v1/object/public/mitjans_privats/x.jpg`,
      `${SUPABASE}/storage/v1/object/sign/mitjans/x.jpg?token=abc`,
      `${SUPABASE}/storage/v1/object/authenticated/mitjans/x.jpg`,
      `${SUPABASE}/storage/v1/render/image/public/mitjans/x.jpg?width=600`,
      'https://socdepoble.org/assets/x.jpg?token=abc',
      'data:image/png;base64,AAAA',
      'blob:https://socdepoble.org/1234',
      'http://socdepoble.org/assets/x.jpg',
      'javascript:alert(1)',
      '/assets/../index.html',
      '/assets/x/..',
      '/assets/%2e%2e/x.jpg',
      '/assets/%2E/x.jpg',
      '/assets\\x.jpg',
      '/\\fora.example/x.jpg',
      '/assets/x\t.jpg',
      '/assets/x\u0000.jpg',
      '/assets/x​.jpg',
      'https://usuari:clau@socdepoble.org/assets/x.jpg',
      '/assets/uploads/x.svg',
      '/assets/uploads/x.SVG?v=1',
      '/assets/uploads/x.svgz',
      'https://socdepoble.org/assets/x.s%76g',
      'https://lh3.googleusercontent.com/a/avatar.jpg',
      '//fora.example/assets/x.jpg',
      'https://www.socdepoble.org/assets/x.jpg',
      'assets/relatiu.jpg',
      'Una frase',
      '',
      null
    ];
    expect(rebutjades.filter((ref) => urlSocialDe(ref, opcions) !== null)).toEqual([]);
  });

  test('permesos: parells explícits d’origen https i prefix, mai un origen sencer', () => {
    const permesos = [{ origen: 'https://cdn.example.org', prefix: '/imatges' }, { origen: 'http://pla.example.org', prefix: '/' }, null];
    expect(urlSocialDe('https://cdn.example.org/imatges/a.jpg', { permesos })).toBe('https://cdn.example.org/imatges/a.jpg');
    expect(urlSocialDe('https://cdn.example.org/imatgesx/a.jpg', { permesos })).toBe(null);
    expect(urlSocialDe('https://cdn.example.org/altres/a.jpg', { permesos })).toBe(null);
    expect(urlSocialDe('https://pla.example.org/a.jpg', { permesos })).toBe(null);
    expect(urlSocialDe('https://cdn.example.org/imatges/a.svg', { permesos })).toBe(null);
    /* Revisió adversarial (261027) · El prefix '/' (o amb '.' o '..') era un
       origen sencer. */
    for (const prefix of ['/', '//', '/./', '/imatges/../']) {
      expect(urlSocialDe('https://cdn.example.com/qualsevol/x.png', { permesos: [{ origen: 'https://cdn.example.com', prefix }] }), prefix).toBe(null);
    }
  });

  /* Revisió adversarial (261027) · Les claus signades es miren descodificades
     i en minúscules, també separades per ';'; una carpeta no és cap imatge; i
     cap referència de més de 2.048 caràcters (abans, 5 MB tornaven com a
     og:image). */
  test('consultes signades codificades, carpetes i referències massa llargues', () => {
    const permesos = [{ origen: 'https://img.example.com', prefix: '/pub' }];
    for (const ref of ['/assets/x.png?%74oken=a', '/assets/x.png?%58-Amz-Signature=1', '/assets/x.png?a=1;token=a', '/assets/x.png?X-Goog-Credential=c',
      '/assets/x.png?Policy=p&Key-Pair-Id=k']) {
      expect(urlSocialDe(ref), ref).toBe(null);
    }
    expect(urlSocialDe('https://img.example.com/pub/x.png?%58-Amz-Signature=1', { permesos })).toBe(null);
    expect(urlSocialDe('https://img.example.com/pub/x.png?w=600', { permesos })).toBe('https://img.example.com/pub/x.png?w=600');
    expect(urlSocialDe('/assets/x.png?tokenitzat=1&v=2')).toBe('https://socdepoble.org/assets/x.png?tokenitzat=1&v=2');
    for (const ref of ['/assets/', '/assets/carpeta/', '/assets/x.svg/', 'https://img.example.com/pub/']) {
      expect(urlSocialDe(ref, { permesos }), ref).toBe(null);
    }
    expect(primeraImatgeSocial('mur', { image: '/assets/' })).toEqual({ estat: 'bloquejada', ref: '/assets/', motiu: 'no-servit' });
    const llarga = `/assets/${'a'.repeat(5e6)}.png`;
    const inici = performance.now();
    expect(primeraImatgeSocial('mur', { image: llarga })).toEqual({ estat: 'bloquejada', ref: llarga, motiu: 'llargaria' });
    expect(urlSocialDe(`/assets/x.png?${'q'.repeat(5e6)}`)).toBe(null);
    expect(urlSocialDe(`/assets/${'/'.repeat(1e6)}x.png`)).toBe(null);
    expect(performance.now() - inici).toBeLessThan(2000);
    expect(urlSocialDe(`/assets/${'a'.repeat(2030)}.png`)).toBe(`https://socdepoble.org/assets/${'a'.repeat(2030)}.png`);
  });
});

describe('primeraImatgeSocial: la primera, o bloquejada, o absent', () => {
  test('la Samarreta de producció i la de la llavor: la xica, posició 0, URL de socdepoble.org', () => {
    const esperada = { estat: 'triada', ref: XICA, url: `https://socdepoble.org${XICA_SOCIAL}`, posicio: 0 };
    expect(primeraImatgeSocial('mercat', SAMARRETA_REMOTA)).toEqual(esperada);
    expect(primeraImatgeSocial('mercat', MOCK_MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble'))).toEqual(esperada);
  });

  test('una primera de tercers al Mur queda bloquejada: mai la segona', () => {
    const publicacio = { imageSrc: 'https://fora.example.org/foto.jpg', images: ['/assets/uploads/mur/propia.jpg'] };
    expect(primeraImatgeSocial('mur', publicacio)).toEqual({ estat: 'bloquejada', ref: 'https://fora.example.org/foto.jpg', motiu: 'origen' });
  });

  test('una primera en SVG queda bloquejada: mai la segona', () => {
    const producte = { images: ['/assets/uploads/mercat/dibuix.svg', '/assets/uploads/mercat/foto.jpg'] };
    expect(primeraImatgeSocial('mercat', producte)).toEqual({ estat: 'bloquejada', ref: '/assets/uploads/mercat/dibuix.svg', motiu: 'svg' });
  });

  /* Revisió adversarial (261027) · Abans, un logotip d'un altre host es prenia
     per reserva (pel final del camí), i un esquema desconegut es descartava:
     en tots dos casos, la tria passava a la SEGONA foto. */
  test('una primera d’un altre host amb el camí del logotip, o d’un esquema desconegut, queda bloquejada: mai la segona', () => {
    const segona = '/assets/u/segona.png';
    expect(primeraImatgeSocial('mercat', { images: [`https://fora.example${MARQUES.avatar}`, segona] }))
      .toEqual({ estat: 'bloquejada', ref: `https://fora.example${MARQUES.avatar}`, motiu: 'origen' });
    expect(primeraImatgeSocial('mercat', { images: [`https://fora.example${LOGO_SVG}`, segona] }).estat).toBe('bloquejada');
    for (const primera of ['ipfs://bafybeigd/x.png', 'ws://evil.com/x.png', 'content://media/external/images/media/12',
      'filesystem:https://socdepoble.org/temporary/x.png', 'x-raw-image:///abc', 'android-resource://pkg/drawable/x']) {
      expect(primeraImatgeSocial('mercat', { images: [primera, segona] }), primera).toEqual({ estat: 'bloquejada', ref: primera, motiu: 'esquema' });
      /* La portada de sempre (getFirstImage) també la porta primera. */
      expect(imatgesDeProducte({ images: [primera, segona] })[0]).toBe(primera);
    }
  });

  test('una foto del bucket públic: triada amb l’URL de Supabase, bloquejada sense', () => {
    const publicacio = { imageSrc: LOGO_SVG, content: '<img src="sdp-media://mitjans/poble/uid/mur/x.jpg"><img src="/assets/uploads/mur/b.jpg">' };
    expect(primeraImatgeSocial('mur', publicacio, { supabaseUrl: SUPABASE }))
      .toEqual({ estat: 'triada', ref: 'sdp-media://mitjans/poble/uid/mur/x.jpg', url: `${PUBLIC_DE_MITJANS}poble/uid/mur/x.jpg`, posicio: 0 });
    expect(primeraImatgeSocial('mur', publicacio))
      .toEqual({ estat: 'bloquejada', ref: 'sdp-media://mitjans/poble/uid/mur/x.jpg', motiu: 'sense-supabase' });
    expect(primeraImatgeSocial('mur', publicacio, null).estat).toBe('bloquejada');
  });

  test('una primera privada o signada queda bloquejada amb el seu motiu', () => {
    expect(primeraImatgeSocial('events', { image_url: 'sdp-media://mitjans_privats/a.jpg', description: '<img src="/assets/b.jpg">' }))
      .toEqual({ estat: 'bloquejada', ref: 'sdp-media://mitjans_privats/a.jpg', motiu: 'privat' });
    expect(primeraImatgeSocial('pobles', { image_url: 'data:image/png;base64,AAAA', images: ['/assets/towns/x/1.webp'] }))
      .toEqual({ estat: 'bloquejada', ref: 'data:image/png;base64,AAAA', motiu: 'esquema' });
  });

  test('cada motiu de bloqueig té nom i explicació', () => {
    expect(Object.keys(MOTIUS_DE_BLOQUEIG).sort()).toEqual(['cami', 'credencials', 'esquema', 'llargaria', 'no-analitzable', 'no-servit', 'origen', 'privat', 'sense-supabase', 'svg']);
    expect(Object.isFrozen(MOTIUS_DE_BLOQUEIG)).toBe(true);
    const motius = [
      primeraImatgeSocial('mercat', { images: ['/assets/x/../y.jpg'] }).motiu,
      primeraImatgeSocial('mercat', { images: ['https://u:p@socdepoble.org/assets/x.jpg'] }).motiu,
      primeraImatgeSocial('mercat', { images: ['/mercat/x.jpg'] }).motiu,
      primeraImatgeSocial('mercat', { images: ['assets/x.jpg'] }).motiu
    ];
    expect(motius).toEqual(['cami', 'credencials', 'no-servit', 'no-analitzable']);
    for (const motiu of motius) expect(Object.hasOwn(MOTIUS_DE_BLOQUEIG, motiu)).toBe(true);
  });

  test('absent: només quan no hi ha cap imatge (una pàgina sense image, una nota, res)', () => {
    expect(primeraImatgeSocial('pagina', { title: 'Sense imatge', html: '<p>Hola</p>' })).toEqual({ estat: 'absent' });
    /* P1-60 · /projecte nomena el panorama: és la seua. */
    expect(primeraImatgeSocial('pagina', { title: 'Projecte', image: HERO_PER_DEFECTE }))
      .toEqual({ estat: 'triada', ref: HERO_PER_DEFECTE, url: `https://socdepoble.org${VARIANTS_SOCIALS[HERO_PER_DEFECTE]}`, posicio: 0 });
    expect(primeraImatgeSocial('pagina', { image: '/assets/uploads/brain/pagina.webp' }))
      .toEqual({ estat: 'triada', ref: '/assets/uploads/brain/pagina.webp', url: 'https://socdepoble.org/assets/uploads/brain/pagina.webp', posicio: 0 });
    expect(primeraImatgeSocial('notes', { image_url: XICA })).toEqual({ estat: 'absent' });
    expect(primeraImatgeSocial('mercat', { imageSrc: LOGO_SVG, avatar_url: LOGO_SVG })).toEqual({ estat: 'absent' });
    expect(primeraImatgeSocial('mur', {})).toEqual({ estat: 'absent' });
  });
});

/* Llibre Mestre, P1-61 (directiva del Mestre, àudio del 27-10-2026 a les
   12:08; esmena de Gemini 0920 §8.1) · La imatge que l'autor tria per a
   xarxes, `item.og_image || item.featured_image`, va per davant de la
   primera de la galeria. La portada que es pinta no la llig. */
describe('la imatge que tria l’autor (og_image, o featured_image) va primera', () => {
  const TRIADA = '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/03-triada.jpg';
  const DESTACADA = '/assets/uploads/mur/destacada.jpg';

  test('Mercat: og_image per davant de la xica; la portada de sempre (imatgesDeProducte) continua amb la xica', () => {
    const producte = { ...SAMARRETA_REMOTA, og_image: TRIADA };
    expect(imatgesDeLaPagina('mercat', producte)[0]).toBe(TRIADA);
    expect(imatgesDeLaPagina('mercat', producte)[1]).toBe(XICA);
    expect(primeraImatgeSocial('mercat', producte)).toEqual({ estat: 'triada', ref: TRIADA, url: `https://socdepoble.org${TRIADA}`, posicio: 0 });
    expect(imatgesDeProducte(producte)[0]).toBe(XICA);
  });

  test('featured_image quan no hi ha og_image; og_image guanya quan hi són totes dues', () => {
    expect(imatgesDeLaPagina('mur', { featured_image: DESTACADA, imageSrc: '/assets/uploads/mur/portada.jpg' })[0]).toBe(DESTACADA);
    /* `og_image || featured_image`: una sola tria de l'autor. Amb totes dues,
       featured_image no hi entra. */
    expect(imatgesDeLaPagina('events', { og_image: TRIADA, featured_image: DESTACADA, image_url: '/assets/agenda/c.jpg' }))
      .toEqual([TRIADA, '/assets/agenda/c.jpg']);
    expect(imatgesDeLaPagina('pobles', { og_image: '   ', featured_image: DESTACADA, image_url: '/assets/towns/x/1.webp' })[0]).toBe(DESTACADA);
    expect(imatgesDeLaPagina('pagina', { featured_image: DESTACADA, image: '/assets/uploads/brain/pagina.webp' })[0]).toBe(DESTACADA);
  });

  test('una triada per l’autor que no es pot servir queda bloquejada: mai la galeria', () => {
    expect(primeraImatgeSocial('mercat', { og_image: '/assets/uploads/mercat/dibuix.svg', images: [XICA] }))
      .toEqual({ estat: 'bloquejada', ref: '/assets/uploads/mercat/dibuix.svg', motiu: 'svg' });
    expect(primeraImatgeSocial('mur', { featured_image: 'https://fora.example.org/f.jpg', imageSrc: DESTACADA }))
      .toEqual({ estat: 'bloquejada', ref: 'https://fora.example.org/f.jpg', motiu: 'origen' });
  });

  test('ni una nota, ni una reserva, ni l’avatar de qui ven, ni una repetida', () => {
    expect(primeraImatgeSocial('notes', { og_image: TRIADA })).toEqual({ estat: 'absent' });
    expect(imatgesDeLaPagina('mercat', { og_image: HERO_PER_DEFECTE, images: [XICA] })).toEqual([XICA]);
    expect(imatgesDeLaPagina('mercat', { og_image: AVATAR_JAVI, avatar_url: AVATAR_JAVI, images: [XICA] })).toEqual([XICA]);
    expect(imatgesDeLaPagina('mercat', { og_image: XICA, images: [XICA, TRIADA] })).toEqual([XICA, TRIADA]);
  });

  /* Revisió de mutants (261027) · `og_image || featured_image` és UNA sola
     tria: una og_image que hi és però no es pot servir queda bloquejada, i
     featured_image no la substituïx (mai es passa a la segona). */
  test('una og_image que no es pot servir no passa a featured_image: bloquejada, mai la segona tria', () => {
    expect(primeraImatgeSocial('mercat', { og_image: '/assets/uploads/mercat/dibuix.svg', featured_image: DESTACADA, images: [XICA] }))
      .toEqual({ estat: 'bloquejada', ref: '/assets/uploads/mercat/dibuix.svg', motiu: 'svg' });
    expect(primeraImatgeSocial('mur', { og_image: 'https://fora.example.org/o.jpg', featured_image: DESTACADA, imageSrc: '/assets/uploads/mur/portada.jpg' }))
      .toEqual({ estat: 'bloquejada', ref: 'https://fora.example.org/o.jpg', motiu: 'origen' });
  });

  /* Revisió de mutants (261027) · Els dos camps de l'autor es lligen com
     qualsevol camp d'imatge (primerValor): el src d'un HTML amb <img>, el
     primer d'una llista, retallats; la prosa i el Markdown no són cap tria (i
     passen a featured_image). Un port que llija el text cru (el productor de
     WordPress, el servidor de la Fase 2) ha de donar el mateix. */
  test('og_image i featured_image es lligen amb primerValor: HTML, llistes i espais sí; prosa i Markdown, cap tria', () => {
    expect(primeraImatgeSocial('mur', { og_image: `<p><img src="${TRIADA}" alt="t"></p>`, imageSrc: DESTACADA }))
      .toEqual({ estat: 'triada', ref: TRIADA, url: `https://socdepoble.org${TRIADA}`, posicio: 0 });
    expect(imatgesDeLaPagina('events', { og_image: ['', TRIADA], image_url: '/assets/agenda/c.jpg' })).toEqual([TRIADA, '/assets/agenda/c.jpg']);
    expect(imatgesDeLaPagina('pagina', { featured_image: [[DESTACADA]], image: '/assets/uploads/brain/pagina.webp' })[0]).toBe(DESTACADA);
    expect(primeraImatgeSocial('mercat', { og_image: `  ${TRIADA}\n`, images: [XICA] }).ref).toBe(TRIADA);
    expect(imatgesDeLaPagina('mur', { og_image: 'La foto de la fira', featured_image: DESTACADA, imageSrc: '/assets/uploads/mur/portada.jpg' })[0]).toBe(DESTACADA);
    expect(imatgesDeLaPagina('mur', { og_image: `![t](${TRIADA})`, imageSrc: '/assets/uploads/mur/portada.jpg' })).toEqual(['/assets/uploads/mur/portada.jpg']);
  });

  /* Revisió de mutants (261027) · Una og_image que és una reserva o l'avatar
     de qui ven hi és (featured_image no hi entra: una sola tria), però no
     compta com a imatge: la primera és la de la pàgina. DECISIÓ OBERTA del
     Mestre: si vol que featured_image la substituïsca, esta prova canvia. */
  test('una og_image que és una reserva o l’avatar no és cap imatge, i featured_image no hi entra', () => {
    expect(imatgesDeLaPagina('mercat', { og_image: HERO_PER_DEFECTE, featured_image: DESTACADA, images: [XICA] })).toEqual([XICA]);
    expect(imatgesDeLaPagina('mur', { og_image: AVATAR_JAVI, avatar_url: AVATAR_JAVI, featured_image: DESTACADA, imageSrc: '/assets/uploads/mur/portada.jpg' }))
      .toEqual(['/assets/uploads/mur/portada.jpg']);
  });
});

/* Pla 261029_0216 (R-01/GM2-01 i R-02) · Les variants socials: el mapa, la
   URL del <head> i la Llei del Píxel (ref i portada no canvien). El pes, les
   mides, el format i l'EXIF de cada fitxer els fixa imatgeSocial.pes300.test.js. */
describe('VARIANTS_SOCIALS: la variant va al <head>; l’original, a la pàgina (R-01, R-02)', () => {
  test('cada parell existix a public/, a la mateixa carpeta i amb el sufix -social-1200x630.jpg; congelat; cap variant és reserva', () => {
    expect(Object.isFrozen(VARIANTS_SOCIALS)).toBe(true);
    expect(Object.keys(VARIANTS_SOCIALS).length).toBeGreaterThanOrEqual(24);
    for (const [original, variant] of Object.entries(VARIANTS_SOCIALS)) {
      expect(variant).toBe(original.replace(/\.[^./]+$/, '-social-1200x630.jpg'));
      expect(existsSync(path.join(ARREL, 'public', original)), original).toBe(true);
      expect(existsSync(path.join(ARREL, 'public', variant)), variant).toBe(true);
      expect(IMATGES_DE_RESERVA).not.toContain(variant);
    }
    expect(VARIANTS_SOCIALS[XICA]).toBe(XICA_SOCIAL);
    // La targeta base es commuta amb index.html i useSEO.js alhora: no és cap parell del mapa.
    expect(VARIANTS_SOCIALS).not.toHaveProperty([CAP_SOCIAL_BASE.image.url]);
  });

  test('urlSocialDe: l’original propi (també codificat, amb barres repetides, amb consulta o amb l’origen de qui crida) dona la variant; un altre host, no', () => {
    const variant = `https://socdepoble.org${XICA_SOCIAL}`;
    expect(urlSocialDe(XICA)).toBe(variant);
    expect(urlSocialDe(`https://socdepoble.org${XICA}?v=2#diapositiva`)).toBe(variant);
    expect(urlSocialDe(XICA.replace('01-chica', '01-chic%61'))).toBe(variant);
    expect(urlSocialDe(XICA.replace('/mercat/', '//mercat/'))).toBe(variant);
    expect(urlSocialDe(XICA, { origen: 'https://staging.socdepoble.org' })).toBe(`https://staging.socdepoble.org${XICA_SOCIAL}`);
    expect(urlSocialDe(`https://fora.example${XICA}`)).toBe(null);
    expect(urlSocialDe(XICA_SOCIAL)).toBe(variant);
  });

  test('primeraImatgeSocial i imatgesDeLaPagina: ref i candidates són l’original (Llei del Píxel); només url canvia', () => {
    const samarreta = MOCK_MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
    expect(imatgesDeLaPagina('mercat', samarreta)[0]).toBe(XICA);
    expect(primeraImatgeSocial('mercat', samarreta)).toEqual({ estat: 'triada', ref: XICA, url: `https://socdepoble.org${XICA_SOCIAL}`, posicio: 0 });
    expect(primeraImatgeSocial('pobles', { image_url: '/assets/towns/relleu/1.jpg' }))
      .toEqual({ estat: 'triada', ref: '/assets/towns/relleu/1.jpg', url: 'https://socdepoble.org/assets/towns/relleu/1-social-1200x630.jpg', posicio: 0 });
    // Un original sense variant, com sempre.
    expect(primeraImatgeSocial('pobles', { image_url: '/assets/towns/sella/2.jpg' }).url).toBe('https://socdepoble.org/assets/towns/sella/2.jpg');
  });
});
