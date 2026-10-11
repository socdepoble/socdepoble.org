// @vitest-environment node
/* La Nevera de Casa · les fronteres: el que l'app pot importar i el que no.
   · Cap xarxa: ni fetch, ni XMLHttpRequest, ni WebSocket, ni sendBeacon, ni
     cap URL http(s). Les dades no ixen del dispositiu.
   · Cap import del Bar, de Salut, de la Gestoria ni del backend: entra a la
     plataforma per plataforma/index.js, a l'esquelet per comu/esquelet/index.js
     i a Pedra Seca per la façana. La resta, només fitxers propis.
   · El nucli és pur: cap React, cap DOM, cap rellotge, cap atzar.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací (patró de src/sections/gestoria/qualitat.test.js). */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const APP = 'src/apps/nevera';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.jsx?$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const esProva = (f) => /\.test\.jsx?$/.test(f);
const PRODUCCIO = fitxersDe(APP).filter((f) => !esProva(f));
const NUCLI = PRODUCCIO.filter((f) => f.startsWith(`${APP}/nucli/`));
const especificadors = (codi) => [...codi.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/* El que una app pot importar de fora de la seua carpeta (camins des de l'arrel).
   El lector de CSV comú (sense xarxa ni disc) és només per a l'importador de
   productes de botiga, que viu fora del nucli: ho vigila una prova de baix. */
const LECTOR_CSV = 'src/utils/fulls/csv.js';
const PERMESOS_DE_FORA = new Set([
  'src/apps/plataforma/index.js',
  'src/apps/comu/esquelet/index.js',
  'src/components/PedraSeca/index.js',
  'src/components/layout/AppGridColumn.jsx',
  'src/app/contexts/RouterContext',
  'src/utils/magatzemLocal.js',
  'src/utils/temporada/index.js',
  LECTOR_CSV
]);
const PAQUETS = new Set(['react', 'lucide-react']);

/* Un especificador resolt des de l'arrel, o el nom del paquet. */
function resol(fitxer, especificador) {
  if (!especificador.startsWith('.')) return especificador;
  return path.posix.normalize(path.posix.join(path.posix.dirname(fitxer), especificador));
}

describe('el que pot importar', () => {
  test('el cens de producció no és buit (la porta mira de veres)', () => {
    expect(PRODUCCIO.length).toBeGreaterThan(10);
    /* Onada 12 (261011; ordres 261011_0130, punt 6) · Els ingredients, el receptari i el recomanador. */
    expect(NUCLI).toEqual([
      `${APP}/nucli/cataleg.js`, `${APP}/nucli/copia.js`, `${APP}/nucli/index.js`, `${APP}/nucli/ingredients.js`, `${APP}/nucli/nevera.js`,
      `${APP}/nucli/productes.js`, `${APP}/nucli/receptes.js`, `${APP}/nucli/recomanador.js`
    ]);
  });

  test('el lector de CSV comú només l’importa l’importador de productes (fora del nucli)', () => {
    const qui = PRODUCCIO.filter((fitxer) => especificadors(llig(fitxer)).some((e) => resol(fitxer, e) === LECTOR_CSV));
    expect(qui).toEqual([`${APP}/importador.js`]);
  });

  test('només paquets permesos, fitxers propis o les portes públiques de la plataforma, l’esquelet, Pedra Seca i el magatzem', () => {
    const fora = PRODUCCIO.flatMap((fitxer) => especificadors(llig(fitxer)).map((e) => [fitxer, e, resol(fitxer, e)])
      .filter(([, , desti]) => !PAQUETS.has(desti) && !desti.startsWith(`${APP}/`) && !PERMESOS_DE_FORA.has(desti))
      .map(([fitxer, e]) => `${fitxer}: ${e}`));
    expect(fora).toEqual([]);
  });

  test('cap import del Bar, de Salut, de la Gestoria, dels Tractors, del backend ni de la telemetria', () => {
    const vetats = new RegExp(['apps/(?:bar|salut)/|sections/(?:gestoria|tractors)/|data/(?:backend', 'Port|adaptadors|supa', 'base|telemetria)|supa', 'base'].join(''));
    const trobats = PRODUCCIO.flatMap((fitxer) => especificadors(llig(fitxer)).filter((e) => vetats.test(e)).map((e) => `${fitxer}: ${e}`));
    expect(trobats).toEqual([]);
    /* Sonda: el patró casa amb el que veta. */
    expect(vetats.test('../bar/manifest.js'.replace('../', 'apps/'))).toBe(true);
    expect(vetats.test('../../data/backendPort.js')).toBe(true);
  });

  test('les proves tampoc no importen el Bar, Salut ni la Gestoria', () => {
    const vetats = /apps\/(?:bar|salut)\/|\.\.\/(?:bar|salut)\/|sections\/gestoria\//;
    const proves = fitxersDe(APP).filter(esProva);
    expect(proves.flatMap((f) => especificadors(llig(f)).filter((e) => vetats.test(e)))).toEqual([]);
  });
});

describe('cap xarxa', () => {
  test('ni fetch, ni XMLHttpRequest, ni WebSocket, ni EventSource, ni sendBeacon, ni cap URL http(s)', () => {
    const vetats = [
      [new RegExp(['\\bfet', 'ch\\s*\\('].join('')), 'fetch'],
      [new RegExp(['XMLHttp', 'Request'].join('')), 'XMLHttpRequest'],
      [new RegExp(['Web', 'Socket|Event', 'Source'].join('')), 'socket'],
      [new RegExp(['send', 'Beacon'].join('')), 'sendBeacon'],
      [new RegExp(['https?', ':\\/\\/'].join('')), 'URL externa']
    ];
    const trobats = PRODUCCIO.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap emmagatzematge directe: només el magatzem local de P2', () => {
    const directe = new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB|document\\.cookie'].join(''));
    expect(PRODUCCIO.filter((f) => directe.test(llig(f)))).toEqual([]);
    expect(especificadors(llig(`${APP}/magatzem.js`))).toContain('../../utils/magatzemLocal.js');
  });
});

const IMPURS = /\b(?:React|use[A-Z]\w*|window|document|navigator|globalThis|Date|setTimeout|setInterval|queueMicrotask)\b|Math\.random|crypto\./;

describe('el nucli és pur', () => {
  test('només s’importa a ell mateix', () => {
    for (const fitxer of NUCLI) {
      for (const e of especificadors(llig(fitxer))) expect(e, `${fitxer}: ${e}`).toMatch(/^\.\/[a-z]+\.js$/);
    }
  });

  test('cap React, DOM, rellotge, atzar ni temporitzador', () => {
    for (const fitxer of NUCLI) expect(senseComentaris(llig(fitxer)).match(IMPURS), fitxer).toBeNull();
  });
});

/* La part de dades de la Temporada viu a vistes/ (el mes d'ara el posa la
   vista), però és tan pura com el nucli: només llig el nucli i el calendari. */
describe('la temporada de la vista és pura', () => {
  const PER_TEMPORADA = `${APP}/vistes/perTemporada.js`;

  test('només importa la porta del nucli i la del calendari', () => {
    expect(especificadors(llig(PER_TEMPORADA)).map((e) => resol(PER_TEMPORADA, e)).sort()).toEqual([
      `${APP}/nucli/index.js`, 'src/utils/temporada/index.js'
    ]);
  });

  test('cap React, DOM, rellotge, atzar ni temporitzador', () => {
    expect(senseComentaris(llig(PER_TEMPORADA)).match(IMPURS)).toBeNull();
    /* Sonda: el patró veu el rellotge i un hook. */
    for (const sonda of ['new Date()', 'useState(0)']) expect(IMPURS.test(sonda), sonda).toBe(true);
  });
});

/* Onada 12 (261011; ordres 261011_0130, punt 6) · La part de dades de les
   Receptes també viu a vistes/ i és igual de pura: només llig el nucli. El
   recomanador no rep cap rellotge (el Rebost no guarda dates). */
describe('les receptes de la vista són pures', () => {
  const PER_RECEPTES = `${APP}/vistes/perReceptes.js`;

  test('només importa la porta del nucli', () => {
    expect(especificadors(llig(PER_RECEPTES)).map((e) => resol(PER_RECEPTES, e))).toEqual([`${APP}/nucli/index.js`]);
  });

  test('cap React, DOM, rellotge, atzar ni temporitzador (tampoc a Receptes.jsx: cap dia d’avui)', () => {
    expect(senseComentaris(llig(PER_RECEPTES)).match(IMPURS)).toBeNull();
    expect(senseComentaris(llig(`${APP}/vistes/Receptes.jsx`)).match(/\bDate\b|Math\.random/)).toBeNull();
  });
});
