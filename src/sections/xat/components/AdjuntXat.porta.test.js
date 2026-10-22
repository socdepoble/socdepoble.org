/* Gauntlet 261022_0225 (crítica Claude, MEDIA-2 i MEDIA-5) · La porta dels
   adjunts del xat, com la de tests/lint_xat.test.mjs per a la resta de peces
   (que encara no llista AdjuntXat ni ControlsAdjunt): cada clau que usen és
   als cinc diccionaris i, en valencià, diu el text de reserva del codi; cada
   classe és declarada; el full arriba al Shadow DOM per index.css; i les CSP
   deixen sonar les notes de veu i els vídeos (URL signades https del
   Storage, blob: de la previsualització). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import ca from '../../../config/idiomes/ca.js';
import es from '../../../config/idiomes/es.js';
import en from '../../../config/idiomes/en.js';
import eu from '../../../config/idiomes/eu.js';
import gl from '../../../config/idiomes/gl.js';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const FONTS = ['src/sections/xat/components/AdjuntXat.jsx', 'src/sections/xat/components/ControlsAdjunt.jsx', 'src/sections/xat/adjuntLocal.js'];
const DICCIONARIS = { ca, es, en, eu, gl };

describe('i18n dels adjunts', () => {
  const usos = FONTS.flatMap((f) => [...llig(f).matchAll(/\bt\('(section\.xat\.[A-Za-z0-9_.]+)',\s*'((?:[^'\\]|\\.)*)'\)/g)].map((m) => [m[1], m[2], f]));
  const claus = new Set(FONTS.flatMap((f) => [...llig(f).matchAll(/'(section\.xat\.[A-Za-z0-9_.]+)'/g)].map((m) => m[1])));
  test('les peces usen claus (cap text visible fixat al codi sense t)', () => {
    expect(usos.length).toBeGreaterThan(30);
    expect(claus.size).toBeGreaterThan(50);
  });
  test.each(Object.keys(DICCIONARIS))('cada clau existix en %s', (llengua) => {
    const absents = [...claus].filter((c) => typeof DICCIONARIS[llengua][c] !== 'string' || !DICCIONARIS[llengua][c].trim());
    expect(absents).toEqual([]);
  });
  test('en valencià, el diccionari diu el mateix que la reserva del codi', () => {
    const diferents = usos.filter(([clau, reserva]) => ca[clau] !== reserva).map(([clau, reserva, f]) => `${f}: ${clau} → «${reserva}» ≠ «${ca[clau]}»`);
    expect(diferents).toEqual([]);
  });
  test('cap llengua no deixa la clau en valencià (excepte els marcadors)', () => {
    const iguals = Object.entries({ es, en, eu, gl }).flatMap(([l, d]) => [...claus]
      .filter((c) => d[c] === ca[c] && !/^\{|^Foto/.test(ca[c]))
      .map((c) => `${l}: ${c}`));
    expect(iguals).toEqual([]);
  });
});

describe('Pedra Seca i Shadow DOM', () => {
  const css = llig('src/sections/xat/components/AdjuntXat.css');
  const canonics = [css, llig('src/css/modules.css'), llig('src/css/components.css')].join('\n');
  test('cada classe del JSX és declarada', () => {
    const classes = new Set(FONTS.flatMap((f) => [...llig(f).matchAll(/className="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/))).filter(Boolean));
    const orfes = [...classes].filter((c) => !new RegExp(`\\.${c.replace(/[-_]/g, '\\$&')}(?![\\w-])`).test(canonics));
    expect(orfes).toEqual([]);
  });
  test('cap color en brut ni estil en línia', () => {
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/);
    for (const f of FONTS) expect(llig(f)).not.toMatch(/\sstyle=\{|import\s+[^;]*\.css['"]/);
  });
  test('el full viatja dins del CSS compartit que la SPA i l’encastat injecten', () => {
    expect(llig('src/css/index.css')).toMatch(/@import url\('\.\.\/sections\/xat\/components\/AdjuntXat\.css'\);/);
    expect(css.trimStart().startsWith('@layer components')).toBe(true);
  });
});

describe('CSP: media-src', () => {
  const directives = (csp) => Object.fromEntries(csp.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
    const [nom, ...fonts] = d.split(/\s+/);
    return [nom, fonts];
  }));
  const meta = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/.exec(llig('index.html'))[1];
  const vercel = JSON.parse(llig('vercel.json')).headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy').value;
  test.each([['index.html', meta], ['vercel.json', vercel]])('%s deixa sonar les URL signades, blob: i data:', (_on, csp) => {
    const d = directives(csp);
    expect(d['media-src']).toEqual(expect.arrayContaining(["'self'", 'data:', 'blob:', 'https:']));
    // Amb la mateixa amplària que img-src: res que img-src no admeta.
    expect(d['media-src'].filter((font) => !d['img-src'].includes(font))).toEqual([]);
  });
  test('el literal que substituïx el build natiu és el mateix que la meta d’index.html', () => {
    const natiu = llig('vite.natiu.config.js');
    expect(natiu).toContain(`content="${meta}">\`;`);
    expect(natiu).toContain(`"media-src 'self' data: blob: https:"`);
  });
});
