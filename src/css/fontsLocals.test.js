import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { brotliDecompressSync } from 'node:zlib';
import { describe, expect, test } from 'vitest';

/* Q7 (Mestre, 261004) · Noto Sans de casa, sense Google Fonts. Dos fitxers:
   el d'amplada normal (variable en wght 100-900, sense eix wdth) i, des de
   P1-67 (Mestre, 261028), el variable en wdth i wght per a les amplades
   estretes. Procediment: _investigacio_ia_de_poble/261003_1330_onada4_claude/
   FONTS_LOCALS.txt (fora del repositori). jsdom no carrega fonts: es
   comproven els fitxers, i els eixos es lligen de la taula fvar del woff2. */

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');

const INDEX = llig('index.html');
const FONTS = senseComentaris(llig('public/fonts/noto-sans.css'));
const TOKENS = senseComentaris(llig('src/css/tokens.css'));
const WOFF2_NORMAL = 'o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7duw.woff2';
/* P1-67 (Mestre, 261028) · Procedència: Noto Sans v42 de Google Fonts, el
   bloc latin de css2?family=Noto+Sans:wdth,wght@62.5..100,100..900
   (https://fonts.gstatic.com/s/notosans/v42/o-0IIpQlx3QUlC5A4PNr5TRASf6M7Q.woff2),
   copiat a public/fonts el 261028 amb la mida i l'empremta que FONTS_LOCALS.txt
   va mesurar el 261004. Si Google publica la v43, l'empremta canvia: es baixa
   de nou, s'anota al LEDGER i es posa al dia ací. */
const WOFF2_ESTRET = 'noto-sans-wdth-wght-latin.woff2';
const ESTRET_SHA256 = '28a840bc6b70be55fe3ac10e4d2e91455dc4a84c97442a9f4b6a5c97a54d5d74';
const ESTRET_MIDA = 59936;
/* OFL.txt: el text sencer de la SIL OFL 1.1 amb l'avís de copyright de Noto
   (el de l'ID 0 de la taula name dels dos woff2), copiat el 261028 amb esta
   mida i esta empremta. Una llicència retallada o canviada canvia l'empremta. */
const OFL_SHA256 = 'cee9892f9f0cc8fe882c9e9537ee6a89621d86ee7ceaf70b02e2b2b1c25c061a';
const OFL_MIDA = 4396;
/* La pista format() de cada src: el navegador salta el src d'un format que no
   reconeix, i el text estret tornaria al 100% sense cap 404. */
const SRC_NORMAL = `url(./${WOFF2_NORMAL}) format('woff2')`;
const SRC_ESTRET = `url(./${WOFF2_ESTRET}) format('woff2')`;
const existixAFonts = (url) => existsSync(resolve(ARREL, 'public/fonts', url));
const binari = (nom) => readFileSync(resolve(ARREL, 'public/fonts', nom));

/** Les cares de noto-sans.css: { descriptor: valor }, amb `src` com a llista d'URL. */
function cares(css) {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => {
    const cara = {};
    for (const declaracio of m[1].split(';')) {
      const dos = declaracio.indexOf(':');
      if (dos === -1) continue;
      cara[declaracio.slice(0, dos).trim()] = declaracio.slice(dos + 1).trim().replace(/\s+/g, ' ');
    }
    cara.urls = [...(cara.src || '').matchAll(/url\(([^)]+)\)/g)].map((u) => u[1].replace(/['"]/g, ''));
    return cara;
  });
}

/* Taules amb índex fix a la capçalera WOFF2 (6 bits; el 63 porta l'etiqueta
   escrita darrere). */
const TAULES_WOFF2 = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];

/** Eixos variables d'un WOFF2 (taula fvar): { wght: [min, max], wdth: [min, max] }. */
function eixosWoff2(buf) {
  if (buf.toString('latin1', 0, 4) !== 'wOF2') throw new Error('no és WOFF2');
  const nombre = buf.readUInt16BE(12);
  const comprimit = buf.readUInt32BE(20);
  let p = 48;
  const base128 = () => {
    let valor = 0;
    for (let i = 0; i < 5; i += 1) {
      const octet = buf[p++];
      valor = valor * 128 + (octet & 0x7f);
      if (!(octet & 0x80)) return valor;
    }
    throw new Error('UIntBase128 massa llarg');
  };
  const directori = [];
  for (let i = 0; i < nombre; i += 1) {
    const marca = buf[p++];
    let etiqueta = TAULES_WOFF2[marca & 0x3f];
    if ((marca & 0x3f) === 63) { etiqueta = buf.toString('latin1', p, p + 4); p += 4; }
    const original = base128();
    // glyf i loca: la versió 0 és la transformada; la resta, qualsevol excepte la 0.
    const versio = marca >> 6;
    const transformada = ['glyf', 'loca'].includes(etiqueta) ? versio !== 3 : versio !== 0;
    directori.push({ etiqueta, llarg: transformada ? base128() : original });
  }
  const dades = brotliDecompressSync(buf.subarray(p, p + comprimit));
  let desplacament = 0;
  const eixos = {};
  for (const { etiqueta, llarg } of directori) {
    if (etiqueta === 'fvar') {
      const fvar = dades.subarray(desplacament, desplacament + llarg);
      const inici = fvar.readUInt16BE(4);
      const mida = fvar.readUInt16BE(10);
      for (let i = 0; i < fvar.readUInt16BE(8); i += 1) {
        const o = inici + i * mida;
        eixos[fvar.toString('latin1', o, o + 4)] = [fvar.readInt32BE(o + 4) / 65536, fvar.readInt32BE(o + 12) / 65536];
      }
    }
    desplacament += llarg;
  }
  return eixos;
}

/** «62.5% 87.5%» → [62.5, 87.5]; «100%» → [100, 100]. */
const rang = (valor) => {
  const [min, max = min] = valor.split(' ').map((v) => Number.parseFloat(v));
  return [min, max];
};
const token = (nom) => TOKENS.match(new RegExp(`${nom}\\s*:\\s*([^;]+);`))?.[1].trim();

describe('index.html · fonts de casa', () => {
  test('cap servidor de Google Fonts: ni full, ni preconnect, ni domini', () => {
    expect(INDEX).not.toMatch(/fonts\.googleapis/);
    expect(INDEX).not.toMatch(/fonts\.gstatic/);
    expect(INDEX).not.toMatch(/rel="preconnect"/);
  });

  test('carrega /fonts/noto-sans.css una sola vegada i precarrega el woff2 que hi apunta', () => {
    expect(INDEX.split('<link rel="stylesheet" href="/fonts/noto-sans.css" />')).toHaveLength(2);
    const preload = `<link rel="preload" href="/fonts/${WOFF2_NORMAL}" as="font" type="font/woff2" crossorigin />`;
    expect(INDEX.split(preload)).toHaveLength(2);
    // El preload va abans del full: el navegador demana el woff2 sense esperar el CSS.
    expect(INDEX.indexOf(preload)).toBeLessThan(INDEX.indexOf('href="/fonts/noto-sans.css"'));
    expect(existsSync(resolve(ARREL, 'public/fonts', WOFF2_NORMAL))).toBe(true);
  });

  /* P1-67 · Les barres pinten amb la cara estreta des de la primera pintada:
     si index.html en porta el preload, és un de sol i davant del full. */
  test('el preload del variable wdth+wght, si hi és, va una sola vegada i davant del full', () => {
    const preload = `<link rel="preload" href="/fonts/${WOFF2_ESTRET}" as="font" type="font/woff2" crossorigin />`;
    const vegades = INDEX.split(preload).length - 1;
    expect(vegades).toBeLessThanOrEqual(1);
    expect(INDEX.split(`/fonts/${WOFF2_ESTRET}`).length - 1).toBe(vegades);
    if (vegades) expect(INDEX.indexOf(preload)).toBeLessThan(INDEX.indexOf('href="/fonts/noto-sans.css"'));
  });
});

describe('public/fonts · els binaris i la llicència', () => {
  test('el variable wdth+wght és a public/fonts amb la mida i l’empremta de la v42', () => {
    const fitxer = binari(WOFF2_ESTRET);
    expect(fitxer.length).toBe(ESTRET_MIDA);
    expect(createHash('sha256').update(fitxer).digest('hex')).toBe(ESTRET_SHA256);
  });

  test('el variable porta els eixos wdth 62.5-100 i wght 100-900; el d’amplada normal, només wght', () => {
    expect(eixosWoff2(binari(WOFF2_ESTRET))).toEqual({ wght: [100, 900], wdth: [62.5, 100] });
    expect(eixosWoff2(binari(WOFF2_NORMAL))).toEqual({ wght: [100, 900] });
  });

  test('OFL.txt viatja amb les fonts: l’avís de copyright de Noto i la SIL OFL 1.1, sencera', () => {
    expect(existixAFonts('OFL.txt')).toBe(true);
    const ofl = llig('public/fonts/OFL.txt');
    expect(ofl).toContain('Copyright 2022 The Noto Project Authors');
    expect(ofl).toContain('SIL OPEN FONT LICENSE Version 1.1');
    const fitxer = binari('OFL.txt');
    expect(fitxer.length).toBe(OFL_MIDA);
    expect(createHash('sha256').update(fitxer).digest('hex')).toBe(OFL_SHA256);
  });
});

describe('public/fonts/noto-sans.css · una cara per amplada, amb rangs', () => {
  const llista = cares(FONTS);
  const normal = llista.find((c) => c['font-stretch'] === '100%');
  const estreta = llista.find((c) => c['font-stretch'] !== '100%');

  test('dues cares de Noto Sans, recta, swap i el mateix subconjunt llatí', () => {
    expect(llista).toHaveLength(2);
    for (const cara of llista) {
      expect(cara['font-family']).toBe("'Noto Sans'");
      expect(cara['font-style']).toBe('normal');
      expect(cara['font-display']).toBe('swap');
      expect(cara['unicode-range']).toBe(llista[0]['unicode-range']);
    }
    expect(llista[0]['unicode-range']).toMatch(/^U\+0000-00FF, /);
  });

  /* P1-67 · La cara normal continua amb el fitxer de 35 KB: cap píxel
     canviat a amplada normal. */
  test('amplada normal: pes en rang 400-800 sobre el woff2 d’amplada normal, sol', () => {
    expect(normal['font-weight']).toBe('400 800');
    expect(normal.urls).toEqual([`./${WOFF2_NORMAL}`]);
    expect(normal.src).toBe(SRC_NORMAL);
  });

  /* Revisió del Gauntlet 261017 (GATE-1, M3, R1) · Mentre el variable no era
     a public/fonts, esta prova acceptava el d'amplada normal sol. P1-67
     (261028) · El fitxer ja hi és: la llista és literal, el variable davant
     i el normal darrere com a reserva. */
  test('amplades estretes 62.5-87.5%: primer el variable wdth+wght, després el d’amplada normal', () => {
    expect(estreta['font-stretch']).toBe('62.5% 87.5%');
    expect(estreta['font-weight']).toBe('400 800');
    expect(estreta.urls).toEqual([`./${WOFF2_ESTRET}`, `./${WOFF2_NORMAL}`]);
    expect(estreta.src).toBe(`${SRC_ESTRET}, ${SRC_NORMAL}`);
  });

  test('el rang de la cara estreta cobrix els tokens d’amplada i cau dins de l’eix wdth del fitxer', () => {
    const [min, max] = rang(estreta['font-stretch']);
    for (const nom of ['--sdp-font-amplada-semi', '--sdp-font-amplada-estreta']) {
      const valor = Number.parseFloat(token(nom));
      expect(valor, nom).toBeGreaterThanOrEqual(min);
      expect(valor, nom).toBeLessThanOrEqual(max);
    }
    const [eixMin, eixMax] = eixosWoff2(binari(WOFF2_ESTRET)).wdth;
    expect(min).toBeGreaterThanOrEqual(eixMin);
    expect(max).toBeLessThanOrEqual(eixMax);
    // L'amplada normal no és de la cara estreta: no s'encavalquen.
    expect(rang(normal['font-stretch'])[0]).toBeGreaterThan(max);
  });

  test('cada url de cada src és un fitxer de public/fonts: cap src remot i cap 404', () => {
    for (const cara of llista) {
      expect(cara.urls.length).toBeGreaterThan(0);
      expect(cara.urls.every((u) => u.startsWith('./') && u.endsWith('.woff2'))).toBe(true);
      expect(cara.urls.filter((u) => !existixAFonts(u))).toEqual([]);
    }
  });

  /* El primer src que existix és el que es pinta: el normal a 100% i el
     variable a les estretes. */
  test('el fitxer que pinta cada cara: el d’amplada normal a 100% i el variable a les estretes', () => {
    expect(llista.map((cara) => cara.urls.find(existixAFonts))).toEqual(llista.map((cara) => (
      cara['font-stretch'] === '100%' ? `./${WOFF2_NORMAL}` : `./${WOFF2_ESTRET}`
    )));
  });
});

describe('tipografia estreta · el contracte d’ús arriba al Shadow DOM', () => {
  test('index.css importa tipografia-estreta.css una sola vegada i sense layer()', () => {
    const index = senseComentaris(llig('src/css/index.css'));
    const imports = [...index.matchAll(/@import[^;]*tipografia-estreta\.css[^;]*;/g)].map((m) => m[0]);
    expect(imports).toEqual(["@import url('./tipografia-estreta.css');"]);
  });

  test('les classes viuen a @layer components i només consumixen els tokens d’amplada', () => {
    const full = senseComentaris(llig('src/css/tipografia-estreta.css'));
    expect(full.trim()).toMatch(/^@layer components \{[\s\S]*\}$/);
    expect(full).toMatch(/\.sdp-text-estret \{\s*font-stretch: var\(--sdp-font-amplada-semi\);\s*\}/);
    expect(full).toMatch(/\.sdp-text-estret--molt \{\s*font-stretch: var\(--sdp-font-amplada-estreta\);\s*\}/);
    expect(full).not.toMatch(/\d+(\.\d+)?%/);
  });
});
