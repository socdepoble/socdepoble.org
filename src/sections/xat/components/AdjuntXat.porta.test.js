/* Gauntlet 261022_0225 (crítica Claude, MEDIA-2 i MEDIA-5) · La porta dels
   adjunts del xat, com la de tests/lint_xat.test.mjs per a la resta de peces
   (que encara no llista AdjuntXat ni ControlsAdjunt): cada clau que usen és
   als cinc diccionaris i, en valencià, diu el text de reserva del codi; cada
   classe és declarada; el full arriba al Shadow DOM per index.css; i les CSP
   deixen sonar les notes de veu i els vídeos (URL signades https del
   Storage, blob: de la previsualització).
   Gauntlet 261024 (P0-19, Codex C-05) · Qui servix socdepoble.org és
   Firebase Hosting, i de capçaleres la porta només llegia vercel.json: el 23/10 la
   capçalera de firebase.json va eixir sense media-src i, com que el navegador
   aplica alhora la meta i la capçalera, els mitjans https queien a
   default-src i no sonaven. Ara la porta llig també firebase.json i exigix que
   la seua regla cobrisca totes les rutes, que siga idèntica a la de
   vercel.json, que cap capçalera estrenga la meta i que el servidor de
   desenvolupament només hi pose frame-ancestors. */
import { existsSync, readFileSync } from 'node:fs';
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
  /* tractor-vocabulari (ordre del Mestre, 261030) · El full dels adjunts és el
     bloc AdjuntXat de src/css/modules.css, entre les seues marques. */
  const moduls = llig('src/css/modules.css');
  const inici = moduls.indexOf('/* ═══ BLOC AdjuntXat · ');
  const fi = moduls.indexOf('/* ═══ FI DEL BLOC AdjuntXat ═══ */');
  const css = inici >= 0 && fi > inici ? moduls.slice(inici, fi) : '';
  const canonics = [css, moduls, llig('src/css/components.css')].join('\n');
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
    /* Un sol bloc, dins de modules.css, que index.css importa sense layer(). */
    expect(inici).toBeGreaterThan(-1);
    expect(fi).toBeGreaterThan(inici);
    expect(moduls.split('/* ═══ BLOC AdjuntXat · ')).toHaveLength(2);
    expect(llig('src/css/index.css')).toMatch(/@import url\('\.\/modules\.css'\);/);
    expect(llig('src/css/index.css')).not.toMatch(/AdjuntXat\.css/);
    expect(existsSync(resolve(process.cwd(), 'src/sections/xat/components/AdjuntXat.css'))).toBe(false);
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '').trimStart().startsWith('@layer components')).toBe(true);
  });
});

describe('CSP: media-src', () => {
  const directives = (csp) => Object.fromEntries(csp.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
    const [nom, ...fonts] = d.split(/\s+/);
    return [nom, fonts];
  }));
  const meta = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/.exec(llig('index.html'))[1];
  const vercel = JSON.parse(llig('vercel.json')).headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy').value;
  const reglesFirebase = JSON.parse(llig('firebase.json')).hosting.headers.filter((r) => r.headers.some((h) => h.key === 'Content-Security-Policy'));
  const firebase = reglesFirebase.flatMap((r) => r.headers).find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
  test.each([['index.html', meta], ['vercel.json', vercel], ['firebase.json', firebase]])('%s deixa sonar les URL signades, blob: i data:', (_on, csp) => {
    const d = directives(csp);
    expect(d['media-src']).toEqual(expect.arrayContaining(["'self'", 'data:', 'blob:', 'https:']));
    // Amb la mateixa amplària que img-src: res que img-src no admeta.
    expect(d['media-src'].filter((font) => !d['img-src'].includes(font))).toEqual([]);
  });
  test('la CSP de firebase.json és una sola regla i cobrix totes les rutes (també /xat)', () => {
    expect(reglesFirebase.map((r) => r.source)).toEqual(['**']);
    expect(reglesFirebase[0].headers.filter((h) => h.key === 'Content-Security-Policy')).toHaveLength(1);
  });
  test('firebase.json i vercel.json porten la mateixa CSP de capçalera', () => {
    expect(firebase).toBe(vercel);
  });
  /* Una directiva de recurs (*-src) que la meta declara i la capçalera no, en
     la capçalera cau a default-src i bloqueja el que la meta admet: és el
     forat del P0-19. Si la meta n'estrena una, les dos capçaleres l'han de
     declarar també. */
  test.each([['vercel.json', vercel], ['firebase.json', firebase]])('%s no estreny la meta: declara cada directiva de recurs que la meta declara', (_on, csp) => {
    const capcalera = directives(csp);
    const absents = Object.keys(directives(meta)).filter((nom) => nom.endsWith('-src') && !capcalera[nom]);
    expect(absents).toEqual([]);
  });
  test('la capçalera del servidor de desenvolupament només porta frame-ancestors', () => {
    const vite = llig('vite.config.js');
    const csps = [...vite.matchAll(/['"`]Content-Security-Policy['"`]\s*:\s*(['"`])([\s\S]*?)\1/g)].map((m) => m[2]);
    // Cap CSP més que no es puga llegir ací (una constant, un altre bloc de preview).
    expect(csps).toHaveLength(vite.split('Content-Security-Policy').length - 1);
    expect(csps.map((csp) => Object.keys(directives(csp)))).toEqual([['frame-ancestors']]);
  });
  test('el literal que substituïx el build natiu és el mateix que la meta d’index.html', () => {
    const natiu = llig('vite.natiu.config.js');
    expect(natiu).toContain(`content="${meta}">\`;`);
    expect(natiu).toContain(`"media-src 'self' data: blob: https:"`);
  });
});
