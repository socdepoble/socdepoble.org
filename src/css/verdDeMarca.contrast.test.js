// @vitest-environment node
/* QA-H03 (pla 261029_0216, Pas 8; decisió IDEA-40 del Mestre, 261028) · La
   guarda fotomètrica del verd de marca: mesura el valor que tokens.css declara
   de veres per a --sdp-verd (no cap literal copiat) contra el blanc amb la
   fórmula exacta de WCAG 2.x i exigix 7:1 o més sense arredonir. El token
   venia del 0f672f (6,9966:1: AA, i cap calculadora honesta el pujava a 7) i
   passa al 0e662e (7,0978:1): AAA per a text normal (1.4.6). Fórmula:
   c = canal / 255; lineal = c <= 0,04045 ? c / 12,92 : ((c + 0,055) / 1,055)
   ^ 2,4; L = 0,2126 R + 0,7152 G + 0,0722 B; contrast = (L1 + 0,05) /
   (L2 + 0,05). La mateixa que src/config/contrast.js (que ací s'usa) i que
   tokens.contracte.test.js; una còpia literal de la fórmula fa de contrapès
   perquè una regressió del mòdul no amague una del token.
   També mira cada altre full .css de src/ (a qualsevol nivell) on el verd es
   declara o es cita:
   un sol hex, a tokens.css; la resta, var(--sdp-verd) o un token que hi
   apunta (--sdp-crom-barra-lector), i tots resolts fan el mateix 7:1 o més.
   Els hex en cru d'esta prova són mesures (ALLOW_RAW_COLOR): ningú no pinta
   res amb ells. */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { contrast, esHex6, luminancia } from '../config/contrast.js';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const TOKENS = llig('src/css/tokens.css');
const NET = senseComentaris(TOKENS);
const BLANC = /* ALLOW_RAW_COLOR */ '#ffffff';
const VERD_VELL = /* ALLOW_RAW_COLOR */ '#0f672f';
const LLINDAR_AAA = 7;

/* Totes les declaracions d'un token, en ordre de full (tema clar primer). */
const declaracions = (css, nom) => [...css.matchAll(new RegExp(`${nom}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].trim());
/* Resol var(--x) fins a un valor pla amb la primera declaració (tema clar). */
function resol(valor, vistos = new Set()) {
  return valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
    const [primera] = declaracions(NET, nom);
    expect(primera, `falta ${nom}`).toBeDefined();
    return resol(primera, new Set([...vistos, nom]));
  }).trim();
}

/* Còpia literal de la fórmula WCAG 2.x, sense arredonir. */
const linealitza = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function luminanciaLiteral(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map((x) => linealitza(parseInt(x, 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrastLiteral = (a, b) => {
  const [la, lb] = [luminanciaLiteral(a), luminanciaLiteral(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/* Tots els fulls de src/, també els que viuen al costat del component. */
const FULLS = readdirSync(join(ARREL, 'src'), { recursive: true })
  .filter((f) => f.endsWith('.css'))
  .map((f) => relative(ARREL, join(ARREL, 'src', f)).split('\\').join('/'))
  .sort();

describe('QA-H03 · el verd de marca (--sdp-verd) sobre blanc, mesurat del full', () => {
  const [verd, ...altres] = declaracions(NET, '--sdp-verd');

  test('una sola declaració a tokens.css, un #rrggbb opac en minúscules', () => {
    expect(altres).toEqual([]);
    expect(esHex6(verd)).toBe(true);
    expect(verd).toBe(verd.toLowerCase());
    expect(FULLS).toContain('src/css/tokens.css');
  });

  test('7:1 o més sobre blanc amb la fórmula exacta, sense arredonir, i el mòdul i la còpia literal coincidixen', () => {
    const r = contrast(verd, BLANC);
    expect(r).toBeGreaterThanOrEqual(LLINDAR_AAA);
    expect(contrastLiteral(verd, BLANC)).toBeGreaterThanOrEqual(LLINDAR_AAA);
    expect(contrastLiteral(verd, BLANC)).toBeCloseTo(r, 12);
    expect(luminanciaLiteral(verd)).toBeCloseTo(luminancia(verd), 12);
    // Simètric: el blanc sobre el verd (la icona del semàfor, el títol del Lector) és el mateix nombre.
    expect(contrast(BLANC, verd)).toBe(r);
  });

  test('el comentari de la línia diu el que es mesura (a 0,01), i el verd vell no arribava a 7:1', () => {
    const linia = TOKENS.split('\n').find((l) => /^\s*--sdp-verd\s*:/.test(l));
    const dit = /\/\*\s*(\d+[.,]\d+)\s*:\s*1\b/.exec(linia);
    expect(dit, linia).not.toBeNull();
    expect(Math.abs(parseFloat(dit[1].replace(',', '.')) - contrast(verd, BLANC))).toBeLessThan(0.01);
    expect(linia).toMatch(/AAA/);
    expect(linia).not.toMatch(/no AAA/);
    // La raó del canvi: el vell, mesurat igual, es quedava en AA.
    expect(contrast(VERD_VELL, BLANC)).toBeLessThan(LLINDAR_AAA);
    expect(contrast(VERD_VELL, BLANC)).toBeGreaterThan(4.5);
    expect(verd).not.toBe(VERD_VELL);
  });

  test('cada altre full .css de src/ on el verd es declara o es cita: cap hex en cru, i resolt fa 7:1 o més', () => {
    const ambHex = [];
    const citen = [];
    for (const full of FULLS) {
      const css = senseComentaris(llig(full));
      for (const m of css.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
        if ([verd, VERD_VELL].includes(m[0].toLowerCase())) ambHex.push(`${full}:${m[0]}`);
      }
      if (/var\(--sdp-verd\)/.test(css)) citen.push(full);
    }
    // El hex només viu a tokens.css, una vegada, i el vell ja no és en cap full.
    expect(ambHex).toEqual([`src/css/tokens.css:${verd}`]);
    // Qui el cita (hui: tokens.css pel token del crom i modules.css pel semàfor).
    expect(citen).toEqual(expect.arrayContaining(['src/css/tokens.css', 'src/css/modules.css']));
    // Cada token de tokens.css que hi apunta resol al mateix píxel i fa el mateix contrast.
    const apunten = [...NET.matchAll(/(--sdp-[\w-]+)\s*:\s*var\(--sdp-verd\);/g)].map((m) => m[1]);
    expect(apunten).toEqual(['--sdp-crom-barra-lector']);
    for (const nom of apunten) {
      expect(resol(`var(${nom})`), nom).toBe(verd);
      expect(contrast(resol(`var(${nom})`), BLANC), nom).toBeGreaterThanOrEqual(LLINDAR_AAA);
    }
    // I els blancs que van damunt del verd (la icona del semàfor i la lletra del Lector) són blanc pur.
    for (const nom of ['--sdp-sobre-color', '--sdp-crom-text']) {
      const blanc = resol(`var(${nom})`);
      expect(blanc, nom).toBe(BLANC);
      expect(contrast(verd, blanc), nom).toBeGreaterThanOrEqual(LLINDAR_AAA);
    }
  });
});
