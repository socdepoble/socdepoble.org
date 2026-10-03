// @vitest-environment node
/* Salut · privacitat (dades de salut: categoria especial, RGPD art. 9).
   Res ix d'este dispositiu: ni xarxa, ni backend, ni telemetria, ni
   traducció, ni cap model d'IA. Es llig el text de TOTS els fitxers de
   producció de Salut i de les utilitats de src/utils que importen, i es
   comprova la frontera: ningú de fora importa Salut (ni el xat ni els
   agents), llevat del registre de la plataforma, i el build de producció
   sense VITE_SDP_APP_SALUT no la porta. La telemetria (que necessita el
   navegador) es prova a AppSalut.test.jsx. Els patrons es componen a trossos
   perquè les portes que llegixen src/ no els troben ací (patró de
   src/sections/gestoria/privacitat.test.js). */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { build } from 'vite';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const SALUT = 'src/apps/salut';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori, extensio = /\.(?:m?js|jsx)$/) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    if (entrada.name === 'node_modules') continue;
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta, extensio));
    else if (extensio.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}
const esProva = (ruta) => /\.test\.[cm]?jsx?$/.test(ruta) || ruta.includes('/__fixtures__/');

/* Els especificadors d'importació (estàtica, dinàmica, reexportació i require) d'un codi. */
function especificadors(codi) {
  const patro = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])([^'"\n]+)\1/g;
  return [...codi.matchAll(patro)].map((m) => m[2]);
}
/* Un especificador relatiu, resolt des de l'arrel (amb extensió si en falta); els paquets, tal qual. */
function resol(ruta, especificador) {
  if (!especificador.startsWith('.')) return especificador;
  const net = path.posix.normalize(path.posix.join(path.posix.dirname(ruta), especificador));
  if (existsSync(path.join(ARREL, net)) && /\.[a-z]+$/.test(net)) return net;
  return ['.js', '.jsx'].map((ext) => `${net}${ext}`).find((candidat) => existsSync(path.join(ARREL, candidat))) || net;
}

const PRODUCCIO = fitxersDe(SALUT).filter((ruta) => !esProva(ruta));
/* Les utilitats de src/utils que Salut fa servir, i les que estes importen (tancament transitiu). */
function utilsDe(inicials) {
  const vistos = new Set();
  const pendents = [...inicials];
  while (pendents.length) {
    const ruta = pendents.pop();
    for (const especificador of especificadors(llig(ruta))) {
      const desti = resol(ruta, especificador);
      if (desti.startsWith('src/utils/') && !vistos.has(desti)) {
        vistos.add(desti);
        pendents.push(desti);
      }
    }
  }
  return [...vistos].sort();
}
const UTILS = utilsDe(PRODUCCIO);
const CODI = [...PRODUCCIO, ...UTILS].map((ruta) => [ruta, llig(ruta)]);
const DE_SALUT = CODI.filter(([ruta]) => ruta.startsWith(`${SALUT}/`));

describe('el cens', () => {
  test('el codi de producció de Salut i les utilitats que arrossega, sense proves', () => {
    expect(PRODUCCIO).toEqual(expect.arrayContaining([`${SALUT}/AppSalut.jsx`, `${SALUT}/magatzem.js`, `${SALUT}/nucli/diccionari.js`, `${SALUT}/vistes/DialegExportacio.jsx`]));
    expect(UTILS).toEqual(expect.arrayContaining(['src/utils/magatzemLocal.js', 'src/utils/fulls/index.js', 'src/utils/fulls/xlsx.js', 'src/utils/fulls/zip.js']));
    expect(CODI.filter(([ruta]) => esProva(ruta))).toEqual([]);
    expect(PRODUCCIO.length).toBeGreaterThan(20);
  });
});

describe('res ix d’este dispositiu', () => {
  test('cap API de xarxa (ni a Salut ni a les utilitats que importa)', () => {
    const vetats = [
      [new RegExp(['\\bfet', 'ch\\s*\\('].join('')), 'fetch('],
      [new RegExp(['XMLHttp', 'Request'].join('')), 'XMLHttpRequest'],
      [new RegExp(['\\bWebSo', 'cket\\b'].join('')), 'WebSocket'],
      [new RegExp(['\\bEventSo', 'urce\\b'].join('')), 'EventSource'],
      [new RegExp(['sendBea', 'con'].join('')), 'sendBeacon'],
      [new RegExp(['service', 'Worker'].join('')), 'serviceWorker'],
      [new RegExp(['RTCPeer', 'Connection'].join('')), 'WebRTC'],
      [new RegExp(['\\bWeb', 'Transport\\b'].join('')), 'WebTransport'],
      [new RegExp(['\\bimport', 'Scripts\\s*\\('].join('')), 'importScripts']
    ];
    const trobats = CODI.flatMap(([ruta, codi]) => vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${ruta}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('emmagatzematge: només la base local, i només a magatzem.js a través de utils/magatzemLocal.js', () => {
    const vetats = [
      [new RegExp(['\\blocal', 'Storage\\b'].join('')), 'localStorage'],
      [new RegExp(['\\bsession', 'Storage\\b'].join('')), 'sessionStorage'],
      [new RegExp(['document\\.coo', 'kie'].join('')), 'document.cookie'],
      [new RegExp(['\\bcaches\\.', 'open\\b'].join('')), 'Cache API'],
      [new RegExp(['\\bindexed', 'DB\\b'].join('')), 'IndexedDB directe']
    ];
    const trobats = DE_SALUT.flatMap(([ruta, codi]) => vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${ruta}: ${que}`));
    expect(trobats).toEqual([]);
    const usenElMagatzem = DE_SALUT.filter(([ruta, codi]) => especificadors(codi).some((e) => resol(ruta, e) === 'src/utils/magatzemLocal.js'))
      .map(([ruta]) => ruta);
    expect(usenElMagatzem).toEqual([`${SALUT}/magatzem.js`]);
    expect(llig(`${SALUT}/magatzem.js`)).toContain("export const NOM_BASE = 'sdp-salut';");
  });

  /* SAL-03: les preferències de la plataforma van a localStorage (config/storage.js).
     Salut només en llig els interruptors; el que la persona apaga va a la base de Salut. */
  test('cap escriptura de preferències de la plataforma: els interruptors només es lligen', () => {
    const usen = DE_SALUT.filter(([, codi]) => /\buseInterruptorsApp\s*\(/.test(codi)).map(([ruta]) => ruta);
    expect(usen).toEqual([`${SALUT}/vistes/comunes.jsx`]);
    expect(llig(`${SALUT}/vistes/comunes.jsx`)).toContain('const { avalua } = useInterruptorsApp();');
    const escriptures = /\b(?:desaInterruptorApagat|desaAppApagada|setVal)\b/;
    expect(DE_SALUT.filter(([, codi]) => escriptures.test(codi)).map(([ruta]) => ruta)).toEqual([]);
    expect(llig(`${SALUT}/useSalut.jsx`)).toMatch(/desaMeta\(magatzem, 'apagats'/);
  });

  test('cap import del backend ni de les capes que l’usen; fora de Salut, només les peces declarades', () => {
    const vetats = new RegExp(['supa', 'base|backend', 'Port|adapta', 'dors|data/telemetria|useTraduccioPagina|PageFrame|BarraBlava|',
      'UniversalEditorShell|TargetaViva|objecteConnectable|sections/xat|agentsSeed|iaia'].join(''), 'i');
    const permesos = [
      (r) => r.startsWith(`${SALUT}/`),
      (r) => r === 'src/apps/plataforma/index.js',
      (r) => r === 'src/components/PedraSeca/index.js',
      (r) => r === 'src/components/layout/AppGridColumn.jsx',
      (r) => r === 'src/app/contexts/RouterContext' || r === 'src/app/contexts/RouterContext.jsx',
      (r) => r === 'src/utils/magatzemLocal.js',
      (r) => r === 'src/utils/fulls/index.js',
      (r) => r === 'react' || r === 'lucide-react'
    ];
    const ambVetats = [];
    const fora = [];
    for (const [ruta, codi] of DE_SALUT) {
      for (const especificador of especificadors(codi)) {
        if (vetats.test(especificador)) ambVetats.push(`${ruta}: ${especificador}`);
        if (!permesos.some((permes) => permes(resol(ruta, especificador)))) fora.push(`${ruta}: ${especificador}`);
      }
    }
    expect(ambVetats).toEqual([]);
    expect(fora).toEqual([]);
  });

  test('cap URL de fora: només els espais de noms OOXML de utils/fulls/xlsx.js', () => {
    const hosts = Object.fromEntries(CODI.map(([ruta, codi]) => [
      ruta, [...new Set([...codi.matchAll(/\bhttps?:\/\/([^/\s'"`)]+)/g)].map((m) => m[1]))].sort()
    ]).filter(([, llista]) => llista.length > 0));
    expect(hosts).toEqual({ 'src/utils/fulls/xlsx.js': ['schemas.openxmlformats.org'] });
  });

  test('obrir finestres, compartir i fer fitxers: només on ho fa la persona', () => {
    const sortides = [
      { que: 'window.open', patro: /\bwindow\.open\s*\(/, permesos: [] },
      { que: 'Web Share', patro: /\.(?:share|canShare)\s*\(/, permesos: [`${SALUT}/vistes/DialegExportacio.jsx`] },
      { que: 'adreces de fitxer', patro: /createObjectURL/, permesos: [`${SALUT}/vistes/descarrega.js`] },
      { que: 'location', patro: /\blocation\.(?:href\s*=[^=]|assign\s*\(|replace\s*\()/, permesos: [] },
      { que: 'consola', patro: /\bconsole\.\w+\s*\(/, permesos: [] },
      { que: 'model d’IA', patro: new RegExp(['open', 'ai|anthro', 'pic|gemi', 'ni|\\bllm\\b|/api/'].join(''), 'i'), permesos: [] }
    ];
    for (const { que, patro, permesos } of sortides) {
      const usen = DE_SALUT.filter(([, codi]) => patro.test(codi)).map(([ruta]) => ruta).sort();
      expect(usen.filter((ruta) => !permesos.includes(ruta)), que).toEqual([]);
    }
    // La llista blanca no és decorativa.
    expect(llig(`${SALUT}/vistes/DialegExportacio.jsx`)).toMatch(/navigator\.share\(/);
    expect(llig(`${SALUT}/vistes/descarrega.js`)).toMatch(/URL\.createObjectURL\(/);
  });

  test('el 112 és un tel:112 normal', () => {
    expect(llig(`${SALUT}/vistes/comunes.jsx`)).toContain('<a href="tel:112" className="sdp-boto sdp-boto--perill">Truca al 112</a>');
  });
});

describe('la frontera', () => {
  test('ningú de src importa Salut, llevat del registre de la plataforma (i només el manifest)', () => {
    const importadors = [];
    for (const ruta of fitxersDe('src')) {
      if (esProva(ruta) || ruta.startsWith(`${SALUT}/`)) continue;
      for (const especificador of especificadors(llig(ruta))) {
        if (resol(ruta, especificador).startsWith(`${SALUT}/`)) importadors.push(`${ruta}: ${especificador}`);
      }
    }
    expect(importadors).toEqual(["src/apps/plataforma/registreApps.js: ../salut/manifest.js"]);
  });

  test('el xat i els agents no importen ni nomenen Salut', () => {
    const agents = [
      ...fitxersDe('src/sections/xat'), ...fitxersDe('src/sections/tractors'), ...fitxersDe('src/sections/realitat'),
      'src/data/agentsSeed.js', 'src/sections/profile/agentsSeed.js'
    ].filter((ruta) => !esProva(ruta));
    expect(agents.length).toBeGreaterThan(10);
    const trobats = agents.filter((ruta) => /apps\/salut|sdp-salut/.test(llig(ruta)));
    expect(trobats).toEqual([]);
  });

  test('cap eina de bundles, RAG ni prompts nomena la base de Salut', () => {
    const eines = fitxersDe('tooling', /\.(?:m?js|cjs)$/).filter((ruta) => !esProva(ruta));
    expect(eines.length).toBeGreaterThan(5);
    expect(eines.filter((ruta) => /sdp-salut/.test(llig(ruta)))).toEqual([]);
  });

  test('App.jsx no importa Salut: només entra pel registre i la ruta /app/*', () => {
    expect(especificadors(llig('src/app/App.jsx')).filter((e) => /salut/i.test(e))).toEqual([]);
  });

  test('el manifest: dades de salut (guarda d’ama del document) i càrrega darrere del literal de compilació', () => {
    const manifest = llig(`${SALUT}/manifest.js`);
    expect(manifest).toContain("dadesPersonals: 'salut'");
    expect(manifest).toContain("entorn: 'desenvolupament'");
    expect(manifest).toContain('actiuPerDefecte: false');
    expect(manifest).toContain("carrega: import.meta.env.DEV || import.meta.env.VITE_SDP_APP_SALUT === '1' ? () => import('./AppSalut.jsx') : null");
    expect(manifest.split('import(').length - 1).toBe(1);
  });
});

describe('el build', () => {
  /* Vite compila el manifest sol (tota importació, externa): el literal es
     reemplaça i, en producció sense VITE_SDP_APP_SALUT, la importació
     dinàmica d'AppSalut desapareix. */
  async function compila(produccio) {
    const abans = { node: process.env.NODE_ENV, salut: process.env.VITE_SDP_APP_SALUT };
    process.env.NODE_ENV = produccio ? 'production' : 'development';
    delete process.env.VITE_SDP_APP_SALUT;
    try {
      const resultat = await build({
        configFile: false,
        logLevel: 'silent',
        root: ARREL,
        mode: produccio ? 'production' : 'development',
        build: {
          write: false,
          minify: false,
          lib: { entry: path.join(ARREL, `${SALUT}/manifest.js`), formats: ['es'], fileName: 'manifest-salut' },
          rollupOptions: { external: (_id, importador) => Boolean(importador) }
        }
      });
      return (Array.isArray(resultat) ? resultat : [resultat]).flatMap((r) => r.output).map((o) => o.code ?? '').join('\n');
    } finally {
      if (abans.node === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = abans.node;
      if (abans.salut !== undefined) process.env.VITE_SDP_APP_SALUT = abans.salut;
    }
  }

  test('sense VITE_SDP_APP_SALUT, el build de producció no porta cap import( d’AppSalut', async () => {
    const importacio = /import\(\s*["'][^"']*AppSalut/g;
    expect((await compila(false)).match(importacio)).toHaveLength(1);
    const produccio = await compila(true);
    expect(produccio.match(importacio)).toBeNull();
    expect(produccio).not.toMatch(/AppSalut/);
  }, 60000);
});
