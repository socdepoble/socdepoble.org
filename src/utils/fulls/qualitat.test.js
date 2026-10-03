// @vitest-environment node
/* Utilitats de les apps (Fase 0 del Bar i de Salut) · qualitat: src/utils/fulls/,
   src/utils/magatzemLocal.js i src/utils/diners.js, proves incloses.
   ESLint amb la configuració del projecte i zero missatges (com --max-warnings=0),
   i les fronteres que Salut exigirà a les seues dependències de utils/: res de
   xarxa, cap emmagatzematge del navegador fora d'IndexedDB, cap adreça fora
   dels espais de noms d'OOXML (només a xlsx.js), cap import de la Gestoria i
   res fora del Baseline 2022. Els patrons es componen a trossos perquè les
   portes que llegixen src/ no els troben ací. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const FULLS = 'src/utils/fulls';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const esProva = (f) => /\.test\.jsx?$/.test(f);

const DE_FULLS = readdirSync(path.join(ARREL, FULLS)).filter((f) => f.endsWith('.js')).map((f) => `${FULLS}/${f}`).sort();
const SOLTS = [
  'src/utils/magatzemLocal.js', 'src/utils/magatzemLocal.test.js', 'src/utils/magatzemLocal.jsdom.test.js',
  'src/utils/diners.js', 'src/utils/diners.test.js'
];
/* Suport de proves: els falsos d'IndexedDB, Web Locks i BroadcastChannel, i
   el fabricant de ZIP en DEFLATE (node:zlib) de les proves de lectura. */
const SUPORT = ['src/utils/__fixtures__/navegadorFals.js', `${FULLS}/__fixtures__/zipAmbDeflate.js`];
const TOTS = [...DE_FULLS, ...SOLTS, ...SUPORT];
const PRODUCCIO = TOTS.filter((f) => !esProva(f) && !SUPORT.includes(f));

describe('el cens', () => {
  test('hi són els mòduls i les seues proves', () => {
    for (const nom of ['zip', 'xlsx', 'csv', 'model', 'inflate', 'lector']) {
      expect(DE_FULLS).toContain(`${FULLS}/${nom}.js`);
      expect(DE_FULLS).toContain(`${FULLS}/${nom}.test.js`);
    }
    expect(DE_FULLS).toContain(`${FULLS}/index.js`);
    expect(DE_FULLS).toContain(`${FULLS}/qualitat.test.js`);
    expect(readdirSync(path.join(ARREL, FULLS, '__fixtures__'))).toEqual(['zipAmbDeflate.js']);
    expect(PRODUCCIO).toHaveLength(9);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, FULLS, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('res ix d’este ordinador', () => {
  test('cap API de xarxa ni Web Share ni finestres noves (proves incloses)', () => {
    const vetats = [
      [new RegExp(['\\bfet', 'ch\\s*\\('].join('')), 'fetch('],
      [new RegExp(['XMLHttp', 'Request'].join('')), 'XMLHttpRequest'],
      [new RegExp(['\\bWebSo', 'cket\\b'].join('')), 'WebSocket'],
      [new RegExp(['\\bEventSo', 'urce\\b'].join('')), 'EventSource'],
      [new RegExp(['sendBea', 'con'].join('')), 'sendBeacon'],
      [new RegExp(['service', 'Worker'].join('')), 'serviceWorker'],
      [new RegExp(['RTCPeer', 'Connection'].join('')), 'WebRTC'],
      [new RegExp(['\\bWeb', 'Transport\\b'].join('')), 'WebTransport'],
      [new RegExp(['\\bimport', 'Scripts\\s*\\('].join('')), 'importScripts'],
      [new RegExp(['\\bwindow\\.op', 'en\\s*\\('].join('')), 'window.open'],
      [new RegExp(['\\.(?:share|can', 'Share)\\s*\\('].join('')), 'Web Share']
    ];
    const trobats = TOTS.filter((f) => f !== `${FULLS}/qualitat.test.js`)
      .flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap emmagatzematge del navegador; IndexedDB només a magatzemLocal.js', () => {
    const vetats = [
      [new RegExp(['local', 'Storage|session', 'Storage'].join('')), 'emmagatzematge del navegador'],
      [new RegExp(['document\\.coo', 'kie'].join('')), 'document.cookie'],
      [new RegExp(['\\bcaches\\.', 'open\\b'].join('')), 'Cache API']
    ];
    const trobats = PRODUCCIO.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
    const idb = new RegExp(['\\bindexed', 'DB\\b'].join(''));
    expect(PRODUCCIO.filter((f) => idb.test(llig(f)))).toEqual(['src/utils/magatzemLocal.js']);
  });

  test('cap adreça de fora: només els espais de noms d’OOXML a xlsx.js', () => {
    const hosts = Object.fromEntries(TOTS.map((f) => [
      f, [...new Set([...llig(f).matchAll(/\bhttps?:\/\/([^/\s'"`)]+)/g)].map((m) => m[1]))].sort()
    ]).filter(([, llista]) => llista.length > 0));
    expect(hosts).toEqual({ [`${FULLS}/xlsx.js`]: ['schemas.openxmlformats.org'] });
  });

  test('cap import de la Gestoria ni del backend; només imports relatius dins de utils/', () => {
    const especificadors = (codi) => [...codi.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"\n]+)\1/g)].map((m) => m[2]);
    const fora = PRODUCCIO.flatMap((f) => especificadors(llig(f))
      .filter((e) => !e.startsWith('./') || /gestoria|supa|backend|adapta/i.test(e))
      .map((e) => `${f}: ${e}`));
    expect(fora).toEqual([]);
  });
});

describe('el suport de proves', () => {
  test('cap fitxer de producció de src importa navegadorFals.js ni zipAmbDeflate.js', () => {
    const fitxersDe = (directori) => readdirSync(path.join(ARREL, directori), { withFileTypes: true }).flatMap((entrada) => {
      const ruta = `${directori}/${entrada.name}`;
      if (entrada.isDirectory()) return fitxersDe(ruta);
      return /\.(?:m?js|jsx)$/.test(entrada.name) ? [ruta] : [];
    });
    const importadors = fitxersDe('src')
      .filter((f) => !esProva(f) && !f.includes('/__fixtures__/'))
      .filter((f) => /navegadorFals|zipAmbDeflate/.test(llig(f)));
    expect(importadors).toEqual([]);
  });
});

describe('higiene', () => {
  test('cap literal de DNI, NIE o IBAN, cap caràcter invisible, cap terme vetat (proves incloses)', () => {
    const vetats = [
      [/\b\d{8}[-\s]?[A-HJ-NP-TV-Z]\b/i, 'DNI'],
      [/\b[XYZ][-\s]?\d{7}[-\s]?[A-HJ-NP-TV-Z]\b/i, 'NIE'],
      [/\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){4,7}(?: ?[A-Z0-9]{1,3})?\b/, 'IBAN'],
      [new RegExp(['Local-', 'First|Offline-', 'First'].join('')), 'terme vetat']
    ];
    /* Espais que no són l'espai normal (dur, BOM…), amplada zero, unió de
       paraules, guionet tou i no-caràcters: al codi van com a escapaments. */
    const invisible = new RegExp(['[^\\S\\n\\r\\t ]', '[\\u00AD\\u200B-\\u200F\\u2060-\\u2064\\uFFFE\\uFFFF]'].join('|'), 'gu');
    const trobats = TOTS.flatMap((f) => {
      const codi = llig(f);
      const invisibles = codi.split('\n').flatMap((linia, i) => [...linia.matchAll(invisible)].map(() => `${f}:${i + 1} caràcter invisible`));
      return [...vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${f}: ${que}`), ...invisibles];
    });
    expect(trobats).toEqual([]);
  });

  test('res fora del Baseline 2022 i cap global escrita', () => {
    const vetats = [
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita']
    ];
    const trobats = PRODUCCIO.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });
});
