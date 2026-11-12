// @vitest-environment node
/* Arbre Genealògic · privacitat (P0-114). L'arbre porta dades de persones
   vives: res ix d'este dispositiu. Es llig el text de TOTS els fitxers de
   producció de l'app i de les utilitats de src/utils que importen, i es
   comprova la frontera: ni xarxa, ni backend, ni telemetria, ni cap model
   d'IA; IndexedDB només a magatzem.js de l'arrel (per utils/magatzemLocal.js); les
   adreces de fitxer només a gedcom/descarrega.js; cap HTML injectat; les úniques
   adreces https són les dels arxius oficials de la llista blanca; i el build
   de producció amb VITE_SDP_APP_GENEALOGIA=0 no porta l'app. Els patrons es
   componen a trossos perquè les portes que llegixen src/ no els troben ací
   (patró de src/apps/salut/privacitat.test.js). */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { build } from 'vite';
import { describe, expect, test } from 'vitest';
import { DOMINIS_OFICIALS } from './arxius/index.js';

const ARREL = process.cwd();
const APP = 'src/apps/genealogia';
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

const PRODUCCIO = fitxersDe(APP).filter((ruta) => !esProva(ruta));
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
const DE_APP = CODI.filter(([ruta]) => ruta.startsWith(`${APP}/`));

describe('el cens', () => {
  test('el codi de producció de l’app i les utilitats que arrossega, sense proves', () => {
    expect(PRODUCCIO).toEqual(expect.arrayContaining([
      `${APP}/manifest.js`, `${APP}/AppGenealogia.jsx`, `${APP}/rutesGenealogia.js`, `${APP}/textos.js`,
      `${APP}/magatzem.js`, `${APP}/gedcom/descarrega.js`, `${APP}/arxius/prompts.js`,
      `${APP}/vistes/comunes.jsx`, `${APP}/vistes/Entrevista.jsx`, `${APP}/vistes/Arbre.jsx`, `${APP}/vistes/Persones.jsx`,
      `${APP}/vistes/Arxius.jsx`, `${APP}/vistes/Intercanvi.jsx`
    ]));
    expect(UTILS).toContain('src/utils/magatzemLocal.js');
    expect(CODI.filter(([ruta]) => esProva(ruta))).toEqual([]);
  });
});

describe('res ix d’este dispositiu', () => {
  test('cap API de xarxa (ni a l’app ni a les utilitats que importa)', () => {
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

  test('emmagatzematge: només la base local, i només a magatzem.js de l’arrel a través de utils/magatzemLocal.js', () => {
    const vetats = [
      [new RegExp(['\\blocal', 'Storage\\b'].join('')), 'localStorage'],
      [new RegExp(['\\bsession', 'Storage\\b'].join('')), 'sessionStorage'],
      [new RegExp(['document\\.coo', 'kie'].join('')), 'document.cookie'],
      [new RegExp(['\\bcaches\\.', 'open\\b'].join('')), 'Cache API'],
      [new RegExp(['\\bindexed', 'DB\\b'].join('')), 'IndexedDB directe']
    ];
    const trobats = DE_APP.flatMap(([ruta, codi]) => vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${ruta}: ${que}`));
    expect(trobats).toEqual([]);
    const usenElMagatzem = DE_APP.filter(([ruta, codi]) => especificadors(codi).some((e) => resol(ruta, e) === 'src/utils/magatzemLocal.js'))
      .map(([ruta]) => ruta);
    expect(usenElMagatzem).toEqual([`${APP}/magatzem.js`]);
    expect(llig(`${APP}/magatzem.js`)).toContain("export const NOM_BASE = 'sdp-genealogia';");
    /* Les vistes no toquen mai el magatzem: només useGenealogia. */
    const vistes = DE_APP.filter(([ruta]) => ruta.startsWith(`${APP}/vistes/`) || ruta === `${APP}/AppGenealogia.jsx`);
    expect(vistes.filter(([ruta, codi]) => especificadors(codi).some((e) => /magatzem/.test(resol(ruta, e)))).map(([ruta]) => ruta)).toEqual([]);
  });

  test('cap import del backend ni de les capes que l’usen; fora de l’app, només les peces declarades', () => {
    const vetats = new RegExp(['supa', 'base|backend', 'Port|adapta', 'dors|data/telemetria|useTraduccioPagina|PageFrame|BarraBlava|',
      'UniversalEditorShell|TargetaViva|objecteConnectable|sections/xat|agentsSeed|iaia'].join(''), 'i');
    const permesos = [
      (r) => r.startsWith(`${APP}/`),
      (r) => r === 'src/apps/plataforma/index.js',
      (r) => r === 'src/components/PedraSeca/index.js',
      (r) => r === 'src/components/layout/AppGridColumn.jsx',
      (r) => r === 'src/app/contexts/RouterContext' || r === 'src/app/contexts/RouterContext.jsx',
      (r) => r === 'src/utils/magatzemLocal.js',
      (r) => r === 'react' || r === 'lucide-react'
    ];
    const ambVetats = [];
    const fora = [];
    for (const [ruta, codi] of DE_APP) {
      for (const especificador of especificadors(codi)) {
        if (vetats.test(especificador)) ambVetats.push(`${ruta}: ${especificador}`);
        if (!permesos.some((permes) => permes(resol(ruta, especificador)))) fora.push(`${ruta}: ${especificador}`);
      }
    }
    expect(ambVetats).toEqual([]);
    expect(fora).toEqual([]);
  });

  test('les úniques adreces https són les dels arxius oficials de la llista blanca', () => {
    const fora = CODI.flatMap(([ruta, codi]) => [...codi.matchAll(/\bhttps?:\/\/([^/\s'"`)]+)/g)]
      .map((m) => m[1]).filter((host) => !DOMINIS_OFICIALS.includes(host)).map((host) => `${ruta}: ${host}`));
    expect(fora).toEqual([]);
    expect(DOMINIS_OFICIALS).toContain('pares.cultura.gob.es');
  });

  test('cap HTML injectat ni codi avaluat amb dades de la persona', () => {
    /* Les etiquetes es componen igual que els patrons: cap nom d'API d'HTML cru en cru. */
    const html = (...trossos) => [new RegExp(trossos.join('')), trossos.join('')];
    const vetats = [
      html('inner', 'HTML'),
      html('outer', 'HTML'),
      html('dangerously', 'SetInner', 'HTML'),
      html('insertAdjacent', 'HTML'),
      [new RegExp(['\\bev', 'al\\s*\\('].join('')), 'eval('],
      [new RegExp(['new\\s+Func', 'tion\\s*\\('].join('')), 'new Function('],
      [new RegExp(['document\\.wri', 'te'].join('')), 'document.write']
    ];
    const trobats = DE_APP.flatMap(([ruta, codi]) => vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${ruta}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('obrir finestres, copiar i fer fitxers: només on ho fa la persona', () => {
    const sortides = [
      { que: 'window.open', patro: /\bwindow\.open\s*\(/, permesos: [] },
      { que: 'Web Share', patro: /\.(?:share|canShare)\s*\(/, permesos: [] },
      { que: 'adreces de fitxer', patro: /createObjectURL/, permesos: [`${APP}/gedcom/descarrega.js`] },
      { que: 'porta-retalls', patro: /clipboard\??\.\s*writeText\s*\(/, permesos: [`${APP}/vistes/comunes.jsx`] },
      { que: 'location', patro: /\blocation\.(?:href\s*=[^=]|assign\s*\(|replace\s*\()/, permesos: [] },
      { que: 'consola', patro: /\bconsole\.\w+\s*\(/, permesos: [] },
      { que: 'model d’IA', patro: new RegExp(['open', 'ai\\b|anthro', 'pic|\\bllm\\b|/api/'].join(''), 'i'), permesos: [] }
    ];
    for (const { que, patro, permesos } of sortides) {
      const usen = DE_APP.filter(([, codi]) => patro.test(codi)).map(([ruta]) => ruta).sort();
      expect(usen.filter((ruta) => !permesos.includes(ruta)), que).toEqual([]);
    }
    // La llista blanca no és decorativa.
    expect(llig(`${APP}/gedcom/descarrega.js`)).toMatch(/URL\.createObjectURL\(/);
    expect(llig(`${APP}/vistes/comunes.jsx`)).toMatch(/clipboard\.writeText\(/);
  });

  test('els enllaços externs s’obrin sense passar l’origen (noopener noreferrer)', () => {
    for (const [ruta, codi] of DE_APP.filter(([r]) => r.endsWith('.jsx'))) {
      for (const [etiqueta] of codi.matchAll(/<a\s[^>]*target="_blank"[^>]*>/g)) {
        expect(etiqueta, ruta).toContain('rel="noopener noreferrer"');
      }
    }
  });
});

describe('la frontera', () => {
  test('ningú de src importa l’app, llevat del registre de la plataforma (i només el manifest)', () => {
    const importadors = [];
    for (const ruta of fitxersDe('src')) {
      if (esProva(ruta) || ruta.startsWith(`${APP}/`)) continue;
      for (const especificador of especificadors(llig(ruta))) {
        if (resol(ruta, especificador).startsWith(`${APP}/`)) importadors.push(`${ruta}: ${resol(ruta, especificador)}`);
      }
    }
    /* L'integrador hi afig el manifest a registreApps.js; abans, ningú. */
    expect(importadors.filter((linia) => linia !== `src/apps/plataforma/registreApps.js: ${APP}/manifest.js`)).toEqual([]);
  });

  test('el xat i els agents no importen ni nomenen l’app', () => {
    const agents = [
      ...fitxersDe('src/sections/xat'), ...fitxersDe('src/sections/tractors'), ...fitxersDe('src/sections/realitat'),
      'src/data/agentsSeed.js', 'src/sections/profile/agentsSeed.js'
    ].filter((ruta) => !esProva(ruta) && existsSync(path.join(ARREL, ruta)));
    expect(agents.length).toBeGreaterThan(10);
    expect(agents.filter((ruta) => /apps\/genealogia|sdp-genealogia/.test(llig(ruta)))).toEqual([]);
  });

  test('el manifest: dades personals (guarda d’ama del document), gratuïta en producció i càrrega darrere del literal', () => {
    const manifest = llig(`${APP}/manifest.js`);
    expect(manifest).toContain("dadesPersonals: 'salut'");
    expect(manifest).toContain("entorn: 'produccio'");
    expect(manifest).toContain('actiuPerDefecte: true');
    expect(manifest).toContain("nivell: 'gratuit'");
    expect(manifest).toContain("carrega: import.meta.env.VITE_SDP_APP_GENEALOGIA !== '0' ? () => import('./AppGenealogia.jsx') : null");
    expect(manifest.split('import(').length - 1).toBe(1);
  });
});

describe('el build', () => {
  /* Vite compila el manifest sol (tota importació, externa): el literal es
     reemplaça i, en producció amb VITE_SDP_APP_GENEALOGIA=0, la importació
     dinàmica d'AppGenealogia desapareix. */
  async function compila(produccio, valor) {
    const abans = { node: process.env.NODE_ENV, valor: process.env.VITE_SDP_APP_GENEALOGIA };
    process.env.NODE_ENV = produccio ? 'production' : 'development';
    if (valor === undefined) delete process.env.VITE_SDP_APP_GENEALOGIA;
    else process.env.VITE_SDP_APP_GENEALOGIA = valor;
    try {
      const resultat = await build({
        configFile: false,
        logLevel: 'silent',
        root: ARREL,
        mode: produccio ? 'production' : 'development',
        build: {
          write: false,
          minify: false,
          lib: { entry: path.join(ARREL, `${APP}/manifest.js`), formats: ['es'], fileName: 'manifest-genealogia' },
          rollupOptions: { external: (_id, importador) => Boolean(importador) }
        }
      });
      return (Array.isArray(resultat) ? resultat : [resultat]).flatMap((r) => r.output).map((o) => o.code ?? '').join('\n');
    } finally {
      if (abans.node === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = abans.node;
      if (abans.valor === undefined) delete process.env.VITE_SDP_APP_GENEALOGIA;
      else process.env.VITE_SDP_APP_GENEALOGIA = abans.valor;
    }
  }

  const IMPORTACIO_DIFERIDA = /import\(\s*["'][^"']*AppGenealogia/g;
  const IMPORTACIO_ESTATICA = /(?:\bimport\s+[^('"]*?\bfrom\s*|\bimport\s+|\bexport\s+[^'"]*?\bfrom\s*)["'][^"']*AppGenealogia/;

  test('amb VITE_SDP_APP_GENEALOGIA=0, el build de producció no porta cap import( d’AppGenealogia', async () => {
    const produccio = await compila(true, '0');
    expect(produccio.match(IMPORTACIO_DIFERIDA)).toBeNull();
    expect(produccio).not.toMatch(/AppGenealogia/);
  }, 60000);

  test('sense la variable, AppGenealogia entra com a tros diferit i mai com a importació estàtica', async () => {
    for (const produccio of [true, false]) {
      const codi = await compila(produccio, undefined);
      expect(codi.match(IMPORTACIO_DIFERIDA), produccio ? 'producció' : 'desenvolupament').toHaveLength(1);
      expect(codi, produccio ? 'producció' : 'desenvolupament').not.toMatch(IMPORTACIO_ESTATICA);
    }
  }, 60000);
});
