/**
 * SPEC G · Base dels recursos universal (torn torn_ad8ad186).
 *
 * Sense amfitrió, resolveAsset() ha de tornar exactament el que tornava
 * (Llei del Píxel). Amb una base fixada (l'element <soc-de-poble>, embed.jsx),
 * les imatges de public/ es resolen dins de la carpeta del paquet, també les
 * que viuen en constants de mòdul o en HTML de contingut: es resolen en
 * pintar-les, no en importar-les.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

/* TextSection, reduïda al seu cos: sense closca, sense capçalera. */
vi.mock('../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => React.createElement('div', { 'data-pagina': '' }, children)
}));

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  baseRecursos,
  fixaBaseRecursos,
  resolRecursPropi,
  resolRecursosDeHtml,
  resolveAsset,
  resolveTownImageUrl,
  TOWN_FALLBACK_IMAGES
} from './assetResolver.js';
import { sanitizeHtml } from '../utils/sanitize.js';
import { DEFAULT_AUTHOR } from '../components/universal/UniversalUtils.js';
import * as pecesConsola from '../sections/consola/peces.jsx';
import { MemoryRouter } from '../app/contexts/RouterContext';
import { Aplec2023Article } from '../sections/mur/articles/Aplec2023Article.jsx';
import TextSection from '../sections/text/TextSection.jsx';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { TOWNS } from '../sections/pobles/townsContent.js';
import { MOCK_TOWNS } from '../sections/pobles/townsSeed.js';

/* Onada 8 (261009) · L'avatar de Sóc de Poble és el PNG (abans, l'SVG). */
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
const PAQUET = 'https://wp.example/wp-content/plugins/socdepoble-enxufe/dist';
const ARREL_PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public');

afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

test('sense amfitrió la base és buida i la resolució és la de sempre (Llei del Píxel)', () => {
  expect(baseRecursos()).toBe('');
  const casos = [
    [['/assets/x.png'], '/assets/x.png'],
    [['assets/x.png'], '/assets/x.png'],
    [['//assets/x.png'], '/assets/x.png'],
    [['https://cdn.example/x.png'], 'https://cdn.example/x.png'],
    [['data:image/png;base64,AAAA'], 'data:image/png;base64,AAAA'],
    [['blob:https://x/1'], 'blob:https://x/1'],
    [[''], ''],
    [[null], ''],
    [['/assets/x.png', '/comunitat/'], '/comunitat/assets/x.png'],
    [['/assets/x.png', '/', 'https://p.example/dist/'], 'https://p.example/dist/assets/x.png'],
    [['/assets/x.png', '/', '', '7'], '/assets/x.png?v=7'],
    [['/assets/x.png?a=1', '/', '', '7'], '/assets/x.png?a=1&v=7']
  ];
  for (const [args, esperat] of casos) expect(resolveAsset(...args)).toBe(esperat);
});

test('fixaBaseRecursos accepta una URL http(s) o un camí propi i els normalitza', () => {
  expect(fixaBaseRecursos(`${PAQUET}/`)).toBe(PAQUET);
  expect(baseRecursos()).toBe(PAQUET);
  expect(fixaBaseRecursos('http://localhost:5173')).toBe('http://localhost:5173');
  expect(fixaBaseRecursos('https://wp.example/dist/?ver=0.1.0#x')).toBe('https://wp.example/dist');
  expect(fixaBaseRecursos('  /comunitat/paquet//  ')).toBe('/comunitat/paquet');
  expect(fixaBaseRecursos('/')).toBe('');
  expect(baseRecursos()).toBe('');
});

test('fixaBaseRecursos rebutja la resta sense tocar la base vigent', () => {
  fixaBaseRecursos(PAQUET);
  const invalids = [
    '', '   ', null, undefined, 42, {}, [],
    '//atacant.example/x', 'javascript:alert(1)', 'data:text/html,x', 'ftp://x.example/y',
    'https://usuari:clau@x.example/y', 'relatiu/sense/barra',
    '/a/../b', '/a/./b', 'https://x.example/a/../b',
    '/a b', '/a\\b', "https://x.example/a'b", 'https://x.example/a"b', '/a<b', '/a\u0000b',
    // Invisibles i bidi, construïts per punt de codi: cap caràcter cru al codi font.
    ...[0x200b, 0x200f, 0x202a, 0x202e, 0x2066, 0x2069, 0xfeff].map((punt) => `/a${String.fromCodePoint(punt)}b`)
  ];
  for (const valor of invalids) expect(fixaBaseRecursos(valor)).toBe(PAQUET);
  expect(baseRecursos()).toBe(PAQUET);
});

test('amb base, resolveAsset la usa només quan la crida no en porta cap', () => {
  fixaBaseRecursos(PAQUET);
  expect(resolveAsset(LOGO)).toBe(`${PAQUET}${LOGO}`);
  expect(resolveAsset('assets/x.png', '/', '', '3')).toBe(`${PAQUET}/assets/x.png?v=3`);
  expect(resolveAsset(LOGO, '/comunitat')).toBe(`/comunitat${LOGO}`);
  expect(resolveAsset(LOGO, '/', 'https://altre.example/dist/')).toBe(`https://altre.example/dist${LOGO}`);
  expect(resolveAsset('https://cdn.example/x.png')).toBe('https://cdn.example/x.png');
  expect(resolveAsset('')).toBe('');
});

test('resoldre dues vegades el mateix recurs no el prefixa dues vegades', () => {
  fixaBaseRecursos(PAQUET);
  expect(resolveAsset(resolveAsset(LOGO))).toBe(`${PAQUET}${LOGO}`);
  fixaBaseRecursos('/wp-content/plugins/socdepoble-enxufe/dist/');
  const una = resolveAsset(LOGO);
  expect(una).toBe(`/wp-content/plugins/socdepoble-enxufe/dist${LOGO}`);
  expect(resolveAsset(una)).toBe(una);
  // Un camí que només comença igual no és de la base: es prefixa.
  expect(resolveAsset('/wp-content/plugins/socdepoble-enxufe/distribucio/x.png'))
    .toBe('/wp-content/plugins/socdepoble-enxufe/dist/wp-content/plugins/socdepoble-enxufe/distribucio/x.png');
});

test('resolveTownImageUrl hereta la base i, sense, torna el de sempre', () => {
  expect(resolveTownImageUrl('/assets/towns/tibi/1.jpg')).toBe('/assets/towns/tibi/1.jpg');
  fixaBaseRecursos(PAQUET);
  expect(resolveTownImageUrl('/assets/towns/tibi/1.jpg')).toBe(`${PAQUET}/assets/towns/tibi/1.jpg`);
  expect(resolveTownImageUrl('', 'Sella')).toBe(`${PAQUET}/assets/uploads/brain/nano_mercat_llaurador_1774197050578.png`);
});

/* Gauntlet 261016 (I34) · Abans, les nou reserves apuntaven a /assets/img/,
   on no n'hi havia cap, i esta prova només mirava la cadena. Ara cada reserva
   ha d'existir de veres a public/ i ser una imatge decodificable. Algunes
   porten l'extensió .png però són JPEG per dins: el navegador les pinta pel
   contingut, i per això s'accepten les dues signatures. */
const SIGNATURA_PNG = [0x89, 0x50, 0x4e, 0x47];
const SIGNATURA_JPEG = [0xff, 0xd8, 0xff];
const comencaPer = (bytes, signatura) => signatura.every((octet, i) => bytes[i] === octet);

test('les reserves de pobles apunten a fitxers que existixen a public/', () => {
  for (const ruta of TOWN_FALLBACK_IMAGES) {
    const fitxer = path.join(ARREL_PUBLIC, ruta);
    expect(fs.existsSync(fitxer), ruta).toBe(true);
    const capcalera = fs.readFileSync(fitxer).subarray(0, 4);
    expect(comencaPer(capcalera, SIGNATURA_PNG) || comencaPer(capcalera, SIGNATURA_JPEG), ruta).toBe(true);
  }
  for (const poble of ['Benifallim', 'Sella', 'Orxeta', 'Relleu', 'Alcoleja', 'Xixona', 'Tibi', 'Penàguila']) {
    expect(TOWN_FALLBACK_IMAGES, poble).toContain(resolveTownImageUrl('', poble));
  }
});

/* Gauntlet 261017 (I34, MCR: «Les 9 reserves resolen recursos reals i
   decodificables amb base arrel i base incrustada; revisar les branques
   nominals i la selecció determinista. Mantindre intacta la resolució d'URL
   externa i de fotos pròpies existents.») i C08 (la versió davant del
   fragment). Sense amfitrió, cap eixida vàlida d'abans canvia: ho vigila la
   primera prova d'este fitxer. */
const BASES = ['/', '/wp-content/plugins/socdepoble-enxufe/dist', PAQUET];
const ORIGEN = 'https://socdepoble.org';

/* Decodificable: la signatura, l'estructura de la capçalera amb unes
   dimensions i el marcador final (EOI d'un JPEG, IEND d'un PNG). Un fitxer
   tallat a mitges no passa. */
const SOF_JPEG = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
function dimensionsJpeg(bytes) {
  let i = 2;
  while (i + 9 < bytes.length && bytes[i] === 0xff) {
    const marcador = bytes[i + 1];
    if (marcador === 0xff) { i += 1; continue; }
    if (SOF_JPEG.has(marcador)) return { alcada: bytes.readUInt16BE(i + 5), amplada: bytes.readUInt16BE(i + 7) };
    i += 2 + bytes.readUInt16BE(i + 2);
  }
  return null;
}
function esImatgeSencera(fitxer) {
  const bytes = fs.readFileSync(fitxer);
  if (comencaPer(bytes, SIGNATURA_PNG)) {
    const amplada = bytes.readUInt32BE(16);
    const alcada = bytes.readUInt32BE(20);
    return amplada > 0 && alcada > 0 && bytes.subarray(bytes.length - 12).toString('latin1').includes('IEND');
  }
  if (comencaPer(bytes, SIGNATURA_JPEG)) {
    const mides = dimensionsJpeg(bytes);
    return Boolean(mides && mides.amplada > 0 && mides.alcada > 0)
      && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  }
  return false;
}

test('I34 · les nou reserves són imatges sanceres: signatura, dimensions i marcador final', () => {
  expect(TOWN_FALLBACK_IMAGES).toHaveLength(9);
  expect(new Set(TOWN_FALLBACK_IMAGES).size).toBe(9);
  for (const ruta of TOWN_FALLBACK_IMAGES) expect([ruta, esImatgeSencera(path.join(ARREL_PUBLIC, ruta))]).toEqual([ruta, true]);
});

test('I34 · cada reserva resol un fitxer real amb base arrel, base-camí i base https, i dues passades no dupliquen', () => {
  for (const base of BASES) {
    fixaBaseRecursos(base);
    const prefix = baseRecursos();
    for (const reserva of TOWN_FALLBACK_IMAGES) {
      const resolta = resolveAsset(reserva);
      expect(resolta).toBe(`${prefix}${reserva}`);
      expect(resolveAsset(resolta)).toBe(resolta);
      expect([resolta, fs.existsSync(path.join(ARREL_PUBLIC, resolta.slice(prefix.length)))]).toEqual([resolta, true]);
    }
    // Per la branca nominal i per la determinista, la mateixa base.
    expect(resolveTownImageUrl('', 'Sella')).toBe(`${prefix}${TOWN_FALLBACK_IMAGES[3]}`);
    expect(resolveTownImageUrl('', '', 'la-torre-de-les-macanes')).toBe(`${prefix}${TOWN_FALLBACK_IMAGES[0]}`);
  }
});

test('I34 · branques nominals: cada poble, la seua reserva exacta, en qualsevol caixa i dins d’un slug o d’un camí', () => {
  const NOMINALS = [['Benifallim', 0], ['Sella', 3], ['Orxeta', 4], ['Relleu', 5], ['Alcoleja', 6], ['Xixona', 7], ['Tibi', 8]];
  for (const [nom, index] of NOMINALS) {
    const esperada = TOWN_FALLBACK_IMAGES[index];
    for (const variant of [nom, nom.toUpperCase(), nom.toLowerCase(), `  ${nom}  `, `${nom} (l'Alacantí)`]) {
      expect([variant, resolveTownImageUrl('', variant)]).toEqual([variant, esperada]);
    }
    const slug = nom.toLowerCase();
    for (const antic of [`/assets/img/${slug}_1.jpg`, `/assets/uploads/poble/${slug}/foto.jpg`, `/assets/images/towns/${slug}2.jpg`]) {
      expect([antic, resolveTownImageUrl(antic)]).toEqual([antic, esperada]);
    }
  }
  // El primer que casa mana, com abans.
  expect(resolveTownImageUrl('', 'Alcoleja i Sella')).toBe(TOWN_FALLBACK_IMAGES[3]);
  // Un nom que només conté el d'un altre poble no és eixe poble.
  expect(resolveTownImageUrl('', 'Rossella')).not.toBe(TOWN_FALLBACK_IMAGES[3]);
  expect(resolveTownImageUrl('', 'Tibidabo')).not.toBe(TOWN_FALLBACK_IMAGES[8]);
});

test('I34 · selecció determinista: les mateixes reserves, també amb l’accent compost o descompost (NFC/NFD)', () => {
  const FIXES = [['la-torre-de-les-macanes', 0], ['penaguila', 2], ['alcoi', 1]];
  for (const [llavor, index] of FIXES) {
    expect(resolveTownImageUrl('', '', llavor)).toBe(TOWN_FALLBACK_IMAGES[index]);
    expect(resolveTownImageUrl('', '', llavor)).toBe(resolveTownImageUrl('', '', llavor));
  }
  expect(resolveTownImageUrl('/assets/images/towns/x.jpg', 'Alcoi', 'alcoi')).toBe(TOWN_FALLBACK_IMAGES[1]);
  const nfc = 'Penàguila'.normalize('NFC');
  const nfd = 'Penàguila'.normalize('NFD');
  expect(nfc).not.toBe(nfd);
  expect(resolveTownImageUrl('', '', nfd)).toBe(resolveTownImageUrl('', '', nfc));
  expect(resolveTownImageUrl('', nfd)).toBe(resolveTownImageUrl('', nfc));
  expect(resolveTownImageUrl('', nfc)).toBe(TOWN_FALLBACK_IMAGES[2]);
});

test('I34 · les fotos pròpies dels pobles queden intactes, existixen i són imatges sanceres', () => {
  expect(TOWNS).toHaveLength(MOCK_TOWNS.length);
  for (const [i, poble] of TOWNS.entries()) {
    const propia = MOCK_TOWNS[i].image_url;
    expect([poble.id, poble.image_url, poble.imageSrc]).toEqual([poble.id, propia, propia]);
    for (const ruta of [propia, MOCK_TOWNS[i].avatar_url].filter(Boolean)) {
      expect([ruta, esImatgeSencera(path.join(ARREL_PUBLIC, ruta))]).toEqual([ruta, true]);
    }
  }
  fixaBaseRecursos(PAQUET);
  expect(resolveTownImageUrl(MOCK_TOWNS[0].image_url)).toBe(`${PAQUET}${MOCK_TOWNS[0].image_url}`);
});

test('I34 · les URL externes, data: i blob: no es toquen, amb base o sense', () => {
  const externes = ['https://cdn.example/x.png', 'HTTPS://CDN.example/X.png', 'http://cdn.example/x.png?a=1#b',
    'data:image/png;base64,AAAA', 'blob:https://x/1'];
  for (const base of BASES) {
    fixaBaseRecursos(base);
    for (const url of externes) {
      expect([base, resolveAsset(url)]).toEqual([base, url]);
      expect([base, resolveAsset(url, '/comunitat', 'https://p.example/dist', '7')]).toEqual([base, url]);
    }
    expect(resolveTownImageUrl('https://cdn.example/poble.jpg', 'Sella')).toBe('https://cdn.example/poble.jpg');
  }
});

test('I34 · caràcters especials: res es codifica (ni dues vegades), només es posa la base', () => {
  const rutes = ["/assets/fotos/Penàguila/l'era de dalt%20vella (2).jpg", '/assets/fotos/càrrega&mostra=1.jpg', '/assets/fotos/100%25.jpg'];
  for (const ruta of rutes) {
    expect(resolveAsset(ruta)).toBe(ruta);
    expect(resolveTownImageUrl(ruta)).toBe(ruta);
  }
  fixaBaseRecursos(PAQUET);
  for (const ruta of rutes) {
    expect(resolveAsset(ruta)).toBe(`${PAQUET}${ruta}`);
    expect(resolveAsset(ruta)).not.toContain('%2520');
  }
});

test('I34 · extrems amb espais i segments de punts: mai fora de la carpeta del paquet ni d’un altre lloc', () => {
  for (const base of BASES) {
    fixaBaseRecursos(base);
    const prefix = baseRecursos();
    const esperada = `${prefix}/assets/x.png`;
    for (const ruta of ['./assets/x.png', '/./assets/x.png', '../assets/x.png', '/../assets/x.png', '../../assets/x.png',
      './../assets/x.png', ' /assets/x.png ', '\t/assets/x.png\n', 'assets/x.png', '//assets/x.png']) {
      expect([base, ruta, resolveAsset(ruta)]).toEqual([base, ruta, esperada]);
    }
    // '//' és el camí propi de sempre: mai una adreça d'un altre lloc.
    for (const ruta of [' //fora.example/x.png']) {
      const resolta = resolveAsset(ruta);
      expect([base, ruta, resolta]).toEqual([base, ruta, `${prefix}/fora.example/x.png`]);
      const origen = new URL(resolta, ORIGEN).origin;
      expect([ruta, origen]).toEqual([ruta, prefix.startsWith('https:') ? new URL(PAQUET).origin : ORIGEN]);
    }
    /* Revisió (Decisió 3) · Una barra inversa o un caràcter de control al
       principi amaga un altre lloc: no es resol. Si es rentava a un camí
       propi, el filtre d'imatges pròpies el deixava passar. */
    for (const ruta of ['/\\fora.example/x.png', '\\\\fora.example/x.png', '/\t/fora.example/x.png', './\\fora.example/x.png', '/\u0000/fora.example/x.png']) {
      expect([base, ruta, resolveAsset(ruta)]).toEqual([base, ruta, '']);
    }
    expect([resolveAsset('.'), resolveAsset('..'), resolveAsset('./')]).toEqual([`${prefix}/`, `${prefix}/`, `${prefix}/`]);
    expect([resolveAsset('   '), resolveAsset(' https://cdn.example/x.png ')]).toEqual(['', 'https://cdn.example/x.png']);
  }
  // Un nom que comença per punt no és cap segment de punts.
  fixaBaseRecursos('/');
  expect([resolveAsset('.well-known/x'), resolveAsset('..x/y.png')]).toEqual(['/.well-known/x', '/..x/y.png']);
});

test('C08 · la versió va a la consulta, davant del fragment; sense versió, el camí tal qual', () => {
  const casos = [
    ['/assets/banner.webp#crop', '/assets/banner.webp?v=7#crop'],
    ['/assets/banner.webp?size=1200#crop', '/assets/banner.webp?size=1200&v=7#crop'],
    ['/assets/banner.webp', '/assets/banner.webp?v=7'],
    ['/assets/x.png#a?b', '/assets/x.png?v=7#a?b']
  ];
  for (const [ruta, esperada] of casos) {
    const resolta = resolveAsset(ruta, '/', '', '7');
    expect(resolta).toBe(esperada);
    const url = new URL(resolta, ORIGEN);
    expect([ruta, url.searchParams.get('v'), url.hash]).toEqual([ruta, '7', ruta.includes('#') ? ruta.slice(ruta.indexOf('#')) : '']);
    expect(resolveAsset(ruta)).toBe(ruta);
  }
  fixaBaseRecursos(PAQUET);
  expect(resolveAsset('/assets/banner.webp#crop', '/', '', '7')).toBe(`${PAQUET}/assets/banner.webp?v=7#crop`);
});

test('resolRecursosDeHtml: sense base, el mateix HTML; amb base, només els src="/assets/…"', () => {
  const html = '<p><img src="/assets/a.jpg" alt="a"><img alt="b" src=\'/assets/b.jpg\'>'
    + '<img data-src="/assets/c.jpg"><img src="/altres/d.jpg"><img src="https://cdn.example/assets/e.jpg">'
    + '<a href="/assets/doc.pdf">doc</a></p>';
  expect(resolRecursosDeHtml(html)).toBe(html);
  expect(resolRecursosDeHtml(null)).toBeNull();
  fixaBaseRecursos(PAQUET);
  expect(resolRecursosDeHtml(html)).toBe(
    `<p><img src="${PAQUET}/assets/a.jpg" alt="a"><img alt="b" src='${PAQUET}/assets/b.jpg'>`
    + '<img data-src="/assets/c.jpg"><img src="/altres/d.jpg"><img src="https://cdn.example/assets/e.jpg">'
    + '<a href="/assets/doc.pdf">doc</a></p>'
  );
  expect(resolRecursosDeHtml(undefined)).toBeUndefined();
});

test('resolRecursPropi: sense base, qualsevol valor torna idèntic (Llei del Píxel)', () => {
  const objecte = {};
  const valors = [
    LOGO, '/assets/x.png?a=1', 'https://cdn.example/x.png', 'data:image/png;base64,AAAA', 'sdp-media://abc',
    'assets/x.png', '/altres/x.png', '', null, undefined, 42, objecte
  ];
  for (const valor of valors) expect(resolRecursPropi(valor)).toBe(valor);
});

test('resolRecursPropi: amb base, només els "/assets/…"; la resta intacta, i dues passades no dupliquen', () => {
  fixaBaseRecursos(PAQUET);
  expect(resolRecursPropi(LOGO)).toBe(`${PAQUET}${LOGO}`);
  expect(resolRecursPropi('/assets/x.png?a=1')).toBe(`${PAQUET}/assets/x.png?a=1`);
  expect(resolRecursPropi(resolRecursPropi(LOGO))).toBe(`${PAQUET}${LOGO}`);
  const objecte = {};
  const intactes = [
    'https://cdn.example/assets/x.png', 'data:image/png;base64,AAAA', 'blob:https://x/1', 'sdp-media://abc',
    'assets/x.png', '/assetsx/x.png', '/altres/assets/x.png', '//assets/x.png', '', null, undefined, 42, objecte
  ];
  for (const valor of intactes) expect(resolRecursPropi(valor)).toBe(valor);
  fixaBaseRecursos('/wp-content/plugins/socdepoble-enxufe/dist/');
  const una = resolRecursPropi(LOGO);
  expect(una).toBe(`/wp-content/plugins/socdepoble-enxufe/dist${LOGO}`);
  expect(resolRecursPropi(una)).toBe(una);
});

/* La base des de l'script clàssic que carrega el paquet: es llig en AVALUAR
   el mòdul. Cada cas en carrega una còpia nova (vi.resetModules) amb
   document.currentScript falsejat, i el deixa com estava. */
async function carregaAmbScript(script) {
  Object.defineProperty(document, 'currentScript', { configurable: true, get: () => script });
  try {
    vi.resetModules();
    return await import('./assetResolver.js');
  } finally {
    delete document.currentScript;
  }
}

function scriptAmb({ src = '', type } = {}) {
  const script = document.createElement('script');
  if (type !== undefined) script.type = type;
  if (src) script.src = src;
  return script;
}

test('en avaluar-se dins d’un script clàssic amb src, la base és la carpeta de l’script', async () => {
  expect(document.currentScript).toBeNull();
  const copia = await carregaAmbScript(scriptAmb({ src: `${PAQUET}/soc-de-poble.standalone.js?ver=0.1.0` }));
  expect(document.currentScript).toBeNull();
  expect(copia.baseRecursos()).toBe(PAQUET);
  expect(copia.resolveAsset(LOGO)).toBe(`${PAQUET}${LOGO}`);
  expect(copia.resolRecursPropi(LOGO)).toBe(`${PAQUET}${LOGO}`);
  expect(copia.resolveTownImageUrl('/assets/towns/tibi/1.jpg')).toBe(`${PAQUET}/assets/towns/tibi/1.jpg`);
  // Un type clàssic explícit també val.
  expect((await carregaAmbScript(scriptAmb({ src: `${PAQUET}/a.js`, type: 'text/javascript' }))).baseRecursos()).toBe(PAQUET);
  // La còpia de la resta del fitxer no se n'assabenta: les bases són per instància.
  expect(baseRecursos()).toBe('');
});

test('els mòduls que resolen imatges en importar-se (marketContent) ja hi troben la base', async () => {
  await carregaAmbScript(scriptAmb({ src: `${PAQUET}/soc-de-poble.standalone.js` }));
  const { MARKET_ITEMS } = await import('../sections/mercat/marketContent.js');
  const imatges = MARKET_ITEMS.flatMap((item) => item.images).filter(Boolean);
  expect(imatges.length).toBeGreaterThan(0);
  for (const imatge of imatges) expect(imatge.startsWith(`${PAQUET}/assets/`)).toBe(true);
});

test('sense script clàssic amb src la base es queda buida: Vite (mòdul), proves, inline, svg, blob, data i file', async () => {
  const casos = [
    null,
    scriptAmb({ src: `${PAQUET}/main.js`, type: 'module' }),
    scriptAmb({ src: `${PAQUET}/main.js`, type: ' MODULE ' }),
    scriptAmb(),
    document.createElementNS('http://www.w3.org/2000/svg', 'script'),
    scriptAmb({ src: 'blob:https://wp.example/0f1e' }),
    scriptAmb({ src: 'data:text/javascript,1' }),
    scriptAmb({ src: 'file:///Users/x/dist/soc-de-poble.standalone.js' })
  ];
  for (const script of casos) {
    const copia = await carregaAmbScript(script);
    expect(copia.baseRecursos()).toBe('');
    expect(copia.resolveAsset(LOGO)).toBe(LOGO);
    expect(copia.resolRecursPropi(LOGO)).toBe(LOGO);
  }
});

test('les constants de mòdul es resolen en llegir-les: hi val la base fixada després d’importar-les', () => {
  expect(DEFAULT_AUTHOR.avatarUrl).toBe(LOGO);
  fixaBaseRecursos(PAQUET);
  expect(DEFAULT_AUTHOR.avatarUrl).toBe(`${PAQUET}${LOGO}`);
});

/* AUTORIA_CONSOLA (l'autoria inventada «Consola Termodinàmica» amb el logo)
   continua sense existir. Derogat per l'ordre del Mestre del 261004 (xat:
   tota targeta amb boina i pàgina pròpia): «cap targeta de la Consola pinta
   avatar que calga resoldre». Ara totes porten la boina de l'autor real,
   l'entitat Sóc de Poble (AUTORIA_SOCDEPOBLE), i el seu logo es resol amb
   la base vigent, com tota imatge pròpia. */
test('la Consola ja no exporta cap autoria fingida', () => {
  expect(pecesConsola.AUTORIA_CONSOLA).toBeUndefined();
  expect(Object.keys(pecesConsola)).not.toContain('AUTORIA_CONSOLA');
});

test('la boina de les targetes de la Consola és la de Sóc de Poble, i el seu logo viatja amb el paquet', () => {
  const Icona = () => null;
  const targeta = () => React.createElement(MemoryRouter, null, React.createElement(pecesConsola.TargetaConsola, {
    icona: Icona, titol: 'Rebuts', subtitol: 'Per a comprovar què ha llegit l’eixam', entradilla: 'Cada lectura deixa un rebut.', a: '/consola/pols'
  }));
  const avatar = (container) => container.querySelector('.sp-card-header img.sp-card-avatar').getAttribute('src');
  const sense = render(targeta());
  expect(avatar(sense.container)).toBe(LOGO);
  /* Onada 8 (261009) · La boina porta al perfil de Sóc de Poble. */
  expect(sense.container.querySelector('.sp-card-header a.sp-card-author-link').getAttribute('href')).toBe(DEFAULT_AUTHOR.href);
  cleanup();
  fixaBaseRecursos(PAQUET);
  expect(avatar(render(targeta()).container)).toBe(`${PAQUET}${LOGO}`);
});

test('l’article de l’Aplec pinta les seues imatges amb la base vigent', () => {
  const srcs = (container) => [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
  const sense = render(React.createElement(Aplec2023Article));
  expect(srcs(sense.container)).toEqual(['/assets/events/aplec_2023_ponents.png', '/assets/events/aplec_2023_reunio.png']);
  cleanup();
  fixaBaseRecursos(PAQUET);
  const amb = render(React.createElement(Aplec2023Article));
  expect(srcs(amb.container)).toEqual([
    `${PAQUET}/assets/events/aplec_2023_ponents.png`, `${PAQUET}/assets/events/aplec_2023_reunio.png`
  ]);
});

test('TextSection (/projecte): sense base, el cos és idèntic; amb base, les infografies viatgen amb el paquet', () => {
  const pagina = PAGE_COPY.projecte;
  const cos = (container) => container.querySelector('article.cms-preview');
  const sense = render(React.createElement(TextSection, { page: pagina, pageKey: 'projecte' }));
  expect(cos(sense.container).innerHTML).toBe(sanitizeHtml(pagina.html));
  cleanup();
  /* Mateix origen que la pàgina: el sanejador només deixa passar imatges del
     nostre origen o dels orígens de mitjans permesos. */
  const paquet = `${window.location.origin}/wp-content/plugins/socdepoble-enxufe/dist`;
  fixaBaseRecursos(paquet);
  const amb = render(React.createElement(TextSection, { page: pagina, pageKey: 'projecte' }));
  const srcs = [...cos(amb.container).querySelectorAll('img')].map((img) => img.getAttribute('src'));
  expect(srcs).toEqual([1, 2, 3, 4].map((n) => `${paquet}/assets/img/que-es-socdepoble-${n}.jpg`));
});
