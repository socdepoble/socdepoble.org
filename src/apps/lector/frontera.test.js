// @vitest-environment node
/* Notícies del Poble · les fronteres: el que l'app pot importar i el que no.
   · Cap xarxa: ni fetch, ni XMLHttpRequest, ni WebSocket, ni EventSource, ni
     sendBeacon, ni cap URL http(s) al codi. Les notícies entren pel port
     (fontNoticies.js); en producció, el connector de l'amfitrió fa de proxy.
   · La llavor de desenvolupament (llavor/*.xml) només porta adreces
     d'example.org (domini reservat) i els espais de noms dels formats.
   · Cap import del Bar, de Salut, de la Nevera, de la Gestoria, dels Tractors
     ni del backend: la plataforma per plataforma/index.js, l'esquelet per
     comu/esquelet/index.js i Pedra Seca per la façana.
   · El nucli és pur: cap React, cap DOM, cap rellotge, cap atzar.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací (patró de src/sections/gestoria/qualitat.test.js). */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const APP = 'src/apps/lector';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori, extensio = /\.jsx?$/) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta, extensio));
    else if (extensio.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const esProva = (f) => /\.test\.jsx?$/.test(f) || f.includes('/__fixtures__/');
const PRODUCCIO = fitxersDe(APP).filter((f) => !esProva(f));
const NUCLI = PRODUCCIO.filter((f) => f.startsWith(`${APP}/nucli/`));
const LLAVOR_XML = fitxersDe(`${APP}/llavor`, /\.xml$/);
const especificadors = (codi) => [...codi.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/* El que l'app pot importar de fora de la seua carpeta (camins des de l'arrel). */
const PERMESOS_DE_FORA = new Set([
  'src/apps/plataforma/index.js',
  'src/apps/comu/esquelet/index.js',
  'src/components/PedraSeca/index.js',
  'src/components/layout/AppGridColumn.jsx',
  'src/app/contexts/RouterContext',
  'src/utils/magatzemLocal.js'
]);
const PAQUETS = new Set(['react', 'lucide-react']);

/* Un especificador resolt des de l'arrel (sense ?raw), o el nom del paquet. */
function resol(fitxer, especificador) {
  const net = especificador.replace(/\?.*$/, '');
  if (!net.startsWith('.')) return net;
  return path.posix.normalize(path.posix.join(path.posix.dirname(fitxer), net));
}

describe('el que pot importar', () => {
  test('el cens de producció no és buit (la porta mira de veres)', () => {
    expect(PRODUCCIO.length).toBeGreaterThan(20);
    /* SN (261003) · personals.js: les fonts que afig la persona, pendents del connector. */
    expect(NUCLI.map((f) => f.replace(`${APP}/nucli/`, ''))).toEqual([
      'analitzador.js', 'dates.js', 'entitats.js', 'estat.js', 'html.js', 'ids.js', 'index.js', 'model.js', 'noticies.js',
      'personals.js', 'urls.js', 'xml.js'
    ]);
    expect(LLAVOR_XML).toHaveLength(5);
  });

  test('només paquets permesos, fitxers propis o les portes públiques de la plataforma, l’esquelet, Pedra Seca i el magatzem', () => {
    const fora = PRODUCCIO.flatMap((fitxer) => especificadors(llig(fitxer)).map((e) => [fitxer, e, resol(fitxer, e)])
      .filter(([, , desti]) => !PAQUETS.has(desti) && !desti.startsWith(`${APP}/`) && !PERMESOS_DE_FORA.has(desti))
      .map(([fitxer, e]) => `${fitxer}: ${e}`));
    expect(fora).toEqual([]);
  });

  test('el motor local, només a magatzem.js; la llavor, només com a text (?raw) des de llavor/cataleg.js', () => {
    const ambMotor = PRODUCCIO.filter((f) => especificadors(llig(f)).some((e) => e.endsWith('utils/magatzemLocal.js')));
    expect(ambMotor).toEqual([`${APP}/magatzem.js`]);
    const ambXml = PRODUCCIO.filter((f) => especificadors(llig(f)).some((e) => /\.xml(?:\?|$)/.test(e)));
    expect(ambXml).toEqual([`${APP}/llavor/cataleg.js`]);
    expect(especificadors(llig(`${APP}/llavor/cataleg.js`)).filter((e) => e.endsWith('.xml?raw'))).toHaveLength(5);
  });

  test('cap import del Bar, de Salut, de la Nevera, de la Gestoria, dels Tractors, del backend ni de la telemetria', () => {
    const vetats = new RegExp(['apps/(?:bar|salut|nevera)/|\\.\\./(?:bar|salut|nevera)/|sections/(?:gestoria|tractors)/|data/(?:backend',
      'Port|adaptadors|supa', 'base|telemetria)|supa', 'base'].join(''));
    const trobats = fitxersDe(APP).flatMap((fitxer) => especificadors(llig(fitxer)).filter((e) => vetats.test(e)).map((e) => `${fitxer}: ${e}`));
    expect(trobats).toEqual([]);
    expect(vetats.test('../nevera/manifest.js')).toBe(true);
    expect(vetats.test('../../data/backendPort.js')).toBe(true);
  });
});

describe('cap xarxa', () => {
  test('ni fetch, ni XMLHttpRequest, ni WebSocket, ni EventSource, ni sendBeacon, ni cap URL http(s) al codi', () => {
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

  test('la llavor: només example.org i els espais de noms dels formats (RSS, Atom, Media RSS, Dublin Core, RDF, XHTML)', () => {
    const permesos = /^(?:example\.org|purl\.org|search\.yahoo\.com|www\.w3\.org)$/;
    for (const fitxer of LLAVOR_XML) {
      const hosts = [...llig(fitxer).matchAll(new RegExp(['https?', ':\\/\\/([^/"\'<\\s]+)'].join(''), 'g'))].map((m) => m[1]);
      expect(hosts.length, fitxer).toBeGreaterThan(0);
      expect(hosts.filter((host) => !permesos.test(host)), fitxer).toEqual([]);
    }
  });

  test('cap emmagatzematge directe: només el magatzem local de P2', () => {
    const directe = new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB|document\\.cookie|caches\\.'].join(''));
    expect(PRODUCCIO.filter((f) => directe.test(llig(f)))).toEqual([]);
  });
});

describe('el nucli és pur', () => {
  test('només s’importa a ell mateix', () => {
    for (const fitxer of NUCLI) {
      for (const e of especificadors(llig(fitxer))) expect(e, `${fitxer}: ${e}`).toMatch(/^\.\/[a-z]+\.js$/);
    }
  });

  test('cap React, DOM, rellotge, atzar ni temporitzador', () => {
    const impurs = /\b(?:React|use[A-Z]\w*|window|document|navigator|globalThis|Date|setTimeout|setInterval|queueMicrotask)\b|Math\.random|crypto\./;
    for (const fitxer of NUCLI) expect(senseComentaris(llig(fitxer)).match(impurs), fitxer).toBeNull();
  });
});
