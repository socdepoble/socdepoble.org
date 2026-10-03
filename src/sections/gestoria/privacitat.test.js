// @vitest-environment node
/* Gestoria i Tractors · privacitat. Les factures només viuen en memòria i
   res ix d'este ordinador: ni xarxa, ni emmagatzematge del navegador, ni
   backend. Es llig el text de TOTS els fitxers de producció dels dos carrils
   (import.meta.glob amb ?raw, sense les proves ni el suport de proves de
   __fixtures__) i es comprova també la frontera: App.jsx no té cap ruta
   /gestoria (D3) i només la Wiki, i només en desenvolupament, carrega estes
   eines. Els patrons es componen a trossos perquè les portes que llegixen
   src/ no els troben ací. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { build } from 'vite';
import { describe, expect, test } from 'vitest';
import fontApp from '../../app/App.jsx?raw';
import fontWiki from '../wiki-de-poble/WikiDePobleSection.jsx?raw';
import { TRACTORS_GESTORIA } from './tractors.js';

const ARREL = process.cwd();
const GESTORIA = 'src/sections/gestoria';
const TRACTORS = 'src/sections/tractors';
const WIKI = 'src/sections/wiki-de-poble/WikiDePobleSection.jsx';

/* Ruta des de l'arrel del repositori: les claus del glob són relatives a este fitxer. */
const desDeArrel = (clau) => path.posix.normalize(path.posix.join(GESTORIA, clau));
const FONTS = Object.fromEntries(Object.entries({
  ...import.meta.glob(['./**/*.{js,jsx,md}', '!**/*.test.*', '!**/__fixtures__/**'], { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob(['../tractors/**/*.{js,jsx,md}', '!**/*.test.*', '!**/__fixtures__/**'], { query: '?raw', import: 'default', eager: true })
}).map(([clau, text]) => [desDeArrel(clau), text]));
const CODI = Object.entries(FONTS).filter(([ruta]) => /\.jsx?$/.test(ruta));

/* Els especificadors d'importació (estàtica, dinàmica, reexportació i require) d'un codi. */
function especificadors(codi) {
  const patro = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])([^'"\n]+)\1/g;
  return [...codi.matchAll(patro)].map((m) => m[2]);
}
/* Un especificador relatiu, resolt des de l'arrel; els paquets, tal qual. */
const resol = (ruta, especificador) => (especificador.startsWith('.')
  ? path.posix.normalize(path.posix.join(path.posix.dirname(ruta), especificador))
  : especificador);

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.(?:m?js|jsx)$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers;
}
const esProva = (ruta) => /\.test\.[cm]?jsx?$/.test(ruta) || ruta.includes('/__fixtures__/');

describe('el cens', () => {
  test('el glob porta el codi de producció dels dos carrils, sense proves ni suport de proves', () => {
    const rutes = Object.keys(FONTS);
    for (const esperada of [
      `${GESTORIA}/ContenidorGestoria.jsx`, `${GESTORIA}/PanellGestoria.jsx`, `${GESTORIA}/useGestoria.js`,
      `${GESTORIA}/nucli/tractor.js`, `${GESTORIA}/font/fontNavegador.js`, `${GESTORIA}/enviament/EnviamentGestoria.jsx`,
      `${GESTORIA}/enviament/correuGestoria.js`, `${GESTORIA}/aprendre/Aprendre.jsx`, `${GESTORIA}/fitxes/gestoria_factures.md`,
      `${TRACTORS}/useTractors.js`, `${TRACTORS}/nucli/aprovacio.js`, `${TRACTORS}/nucli/magatzem.js`
    ]) expect(rutes, esperada).toContain(esperada);
    expect(rutes.filter(esProva)).toEqual([]);
    expect(CODI.length).toBeGreaterThan(40);
  });
});

describe('res ix d’este ordinador', () => {
  test('cap API de xarxa', () => {
    const vetats = [
      [new RegExp(['\\bfet', 'ch\\s*\\('].join('')), 'fetch('],
      [new RegExp(['XMLHttp', 'Request'].join('')), 'XMLHttpRequest'],
      [new RegExp(['\\bWebSo', 'cket\\b'].join('')), 'WebSocket'],
      [new RegExp(['\\bEventSo', 'urce\\b'].join('')), 'EventSource'],
      [new RegExp(['sendBea', 'con'].join('')), 'sendBeacon'],
      [new RegExp(['navigator\\.service', 'Worker'].join('')), 'navigator.serviceWorker'],
      [new RegExp(['RTCPeer', 'Connection'].join('')), 'WebRTC'],
      [new RegExp(['\\bWeb', 'Transport\\b'].join('')), 'WebTransport'],
      [new RegExp(['\\bimport', 'Scripts\\s*\\('].join('')), 'importScripts']
    ];
    const trobats = CODI.flatMap(([ruta, codi]) => vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${ruta}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap emmagatzematge del navegador; IndexedDB només als dos magatzems que no guarden factures', () => {
    const vetats = [
      [new RegExp(['\\blocal', 'Storage\\b'].join('')), 'localStorage'],
      [new RegExp(['\\bsession', 'Storage\\b'].join('')), 'sessionStorage'],
      [new RegExp(['document\\.coo', 'kie'].join('')), 'document.cookie'],
      [new RegExp(['\\bcaches\\.', 'open\\b'].join('')), 'Cache API']
    ];
    const trobats = CODI.flatMap(([ruta, codi]) => vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${ruta}: ${que}`));
    expect(trobats).toEqual([]);
    /* Llista blanca: les aprovacions dels tractors (registres i claus públiques)
       i el progrés d'Aprendre (caixes de Leitner). Cap dels dos toca factures. */
    const idb = new RegExp(['\\bindexed', 'DB\\b'].join(''));
    expect(CODI.filter(([, codi]) => idb.test(codi)).map(([ruta]) => ruta).sort())
      .toEqual([`${GESTORIA}/aprendre/magatzemProgres.js`, `${TRACTORS}/nucli/magatzem.js`]);
  });

  test('cap importació del backend; fora dels dos carrils, només els components i utilitats declarats', () => {
    const backend = new RegExp(['supa', 'base|backend', 'Port|adapta', 'dors'].join(''), 'i');
    const permesos = [
      (r) => r.startsWith(`${GESTORIA}/`) || r.startsWith(`${TRACTORS}/`),
      (r) => r.startsWith('src/components/PedraSeca/'),
      (r) => r === 'src/app/contexts/RouterContext',
      (r) => r === 'src/utils/sanitize.js',
      (r) => r === 'src/sections/wiki-de-poble/parseMarkdown.js',
      (r) => r === 'react' || r === 'lucide-react'
    ];
    const ambBackend = [];
    const fora = [];
    for (const [ruta, codi] of CODI) {
      for (const especificador of especificadors(codi)) {
        if (backend.test(especificador)) ambBackend.push(`${ruta}: ${especificador}`);
        const desti = resol(ruta, especificador);
        if (!permesos.some((permes) => permes(desti))) fora.push(`${ruta}: ${especificador}`);
      }
    }
    expect(ambBackend).toEqual([]);
    expect(fora).toEqual([]);
  });

  test('cap URL de fora: només la redacció de Gmail i els espais de noms de l’XLSX', () => {
    /* Llista blanca EXPLÍCITA i mínima, amb el perquè:
       · correuGestoria.js compon l'adreça de redacció de Gmail, que obri la
         persona al pas 5; només porta destinatari, assumpte i text.
       · xlsx.js escriu els espais de noms XML de l'estàndard OOXML: són
         identificadors dins del fitxer i el navegador no s'hi connecta mai. */
    const PERMESES = {
      [`${GESTORIA}/enviament/correuGestoria.js`]: ['mail.google.com'],
      [`${GESTORIA}/nucli/xlsx.js`]: ['purl.org', 'schemas.openxmlformats.org']
    };
    const hosts = Object.fromEntries(CODI.map(([ruta, codi]) => [
      ruta, [...new Set([...codi.matchAll(/\bhttps?:\/\/([^/\s'"`)]+)/g)].map((m) => m[1]))].sort()
    ]).filter(([, llista]) => llista.length > 0));
    expect(hosts).toEqual(PERMESES);
  });

  test('obrir finestres o el menú de compartir: només el pas 5, que fa sempre la persona', () => {
    /* Llista blanca EXPLÍCITA i mínima, amb el perquè:
       · EnviamentGestoria.jsx obri la redacció de Gmail en una pestanya nova
         (window.open) i el menú de compartir del sistema (Web Share) amb el
         full que la persona ja ha revisat. Enviar ho fa ella.
       · correuGestoria.js només pregunta si el sistema pot compartir fitxers
         (canShare): no comparteix res.
       Ningú navega fora de l'app amb location. */
    const sortides = [
      { que: 'window.open', patro: /\bwindow\.open\s*\(/, permesos: [`${GESTORIA}/enviament/EnviamentGestoria.jsx`] },
      { que: 'Web Share', patro: /\.(?:share|canShare)\s*\(/, permesos: [`${GESTORIA}/enviament/EnviamentGestoria.jsx`, `${GESTORIA}/enviament/correuGestoria.js`] },
      { que: 'navigator.share', patro: /\bnavigator\.share\b/, permesos: [] },
      { que: 'location', patro: /\blocation\.(?:href\s*=[^=]|assign\s*\(|replace\s*\()/, permesos: [] }
    ];
    for (const { que, patro, permesos } of sortides) {
      const usen = CODI.filter(([, codi]) => patro.test(codi)).map(([ruta]) => ruta).sort();
      expect(usen.filter((ruta) => !permesos.includes(ruta)), que).toEqual([]);
    }
    // La llista blanca no és decorativa: els dos fitxers fan servir el que s'hi permet.
    expect(FONTS[`${GESTORIA}/enviament/EnviamentGestoria.jsx`]).toMatch(/\bwindow\.open\s*\(/);
    expect(FONTS[`${GESTORIA}/enviament/correuGestoria.js`]).toMatch(/mail\.google\.com/);
  });

  test('cap literal amb forma de DNI, NIE o IBAN al codi ni a les fitxes', () => {
    const vetats = [
      [/\b\d{8}[-\s]?[A-HJ-NP-TV-Z]\b/i, 'DNI'],
      [/\b[XYZ][-\s]?\d{7}[-\s]?[A-HJ-NP-TV-Z]\b/i, 'NIE'],
      [/\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){4,7}(?: ?[A-Z0-9]{1,3})?\b/, 'IBAN']
    ];
    const trobats = Object.entries(FONTS).flatMap(([ruta, text]) => vetats
      .map(([patro, que]) => [patro.exec(text), que]).filter(([m]) => m).map(([m, que]) => `${ruta}: ${que} «${m[0]}»`));
    expect(trobats).toEqual([]);
    // Les sondes: els patrons sí que troben les formes que vetem (fetes ací, no escrites senceres).
    const sonda = (...trossos) => trossos.join('');
    expect(vetats[0][0].test(sonda('1234', '5678', 'Z'))).toBe(true);
    expect(vetats[1][0].test(sonda('X', '1234567', 'L'))).toBe(true);
    expect(vetats[2][0].test(sonda('ES91 ', '2100 0418 ', '4502 0005 1332'))).toBe(true);
  });

  test('les dades personals exigixen signatura: cap tractor que les toque s’aprova amb una confirmació escrita', () => {
    expect(TRACTORS_GESTORIA.map((m) => m.id)).toEqual(['gestoria.factures', 'gestoria.correus']);
    for (const manifest of TRACTORS_GESTORIA) {
      expect(manifest, manifest.id).toMatchObject({ dadesPersonals: true, nivellMinim: 'signatura', xarxa: 'cap' });
    }
  });
});

describe('la frontera: només la Wiki, i només en desenvolupament', () => {
  test('D3 · App.jsx no té cap ruta /gestoria ni /tractors, ni importa els dos carrils', () => {
    const rutes = [...fontApp.matchAll(/<Route\b[^>]*?\bpath=["']([^"']+)["']/g)].map((m) => m[1]);
    expect(rutes.length).toBeGreaterThan(5);
    expect(rutes.filter((r) => /gestoria|tractors/i.test(r))).toEqual([]);
    expect(especificadors(fontApp).filter((e) => /sections\/(?:gestoria|tractors)\//.test(e))).toEqual([]);
  });

  test('cap fitxer de src fora dels carrils els importa, excepte la Wiki; ningú importa el suport de proves', () => {
    const fora = [];
    const suport = [];
    for (const ruta of fitxersDe('src')) {
      if (esProva(ruta)) continue;
      const codi = readFileSync(path.join(ARREL, ruta), 'utf8');
      for (const especificador of especificadors(codi)) {
        const desti = resol(ruta, especificador);
        if (desti.includes('/__fixtures__/')) suport.push(`${ruta}: ${especificador}`);
        const dinsCarril = ruta.startsWith(`${GESTORIA}/`) || ruta.startsWith(`${TRACTORS}/`);
        if (!dinsCarril && ruta !== WIKI && (desti.startsWith(`${GESTORIA}/`) || desti.startsWith(`${TRACTORS}/`))) {
          fora.push(`${ruta}: ${especificador}`);
        }
      }
    }
    expect(fora).toEqual([]);
    expect(suport).toEqual([]);
  });

  test('la Wiki decidix amb import.meta.env.DEV: la funció pura i els lazy() dins d’una constant nul·la fora de DEV', () => {
    expect(fontWiki).toContain('modulsLocalsActius({ DEV: import.meta.env.DEV })');
    const inici = fontWiki.indexOf('const EINES_LOCALS = import.meta.env.DEV ? {');
    expect(inici).toBeGreaterThan(-1);
    const fi = fontWiki.indexOf('} : null;', inici);
    expect(fi).toBeGreaterThan(inici);
    const bloc = fontWiki.slice(inici, fi);
    const delsCarrils = (text) => especificadors(text).filter((e) => /^\.\.\/(?:gestoria|tractors)\//.test(e));
    expect(delsCarrils(bloc)).toEqual([
      '../tractors/PanellTractors.jsx', '../tractors/PanellSentinelles.jsx', '../gestoria/ContenidorGestoria.jsx',
      '../gestoria/aprendre/Aprendre.jsx'
    ]);
    // Fora del bloc, cap importació dels dos carrils (tampoc estàtica).
    expect(delsCarrils(fontWiki.slice(0, inici) + fontWiki.slice(fi))).toEqual([]);
    expect([...bloc.matchAll(/lazy\(\(\) => import\(/g)]).toHaveLength(4);
  });

  /* Vite compila la Wiki sola (tota importació, externa) en mode producció i
     en mode desenvolupament: el literal es reemplaça i, en producció, les
     importacions dinàmiques de la Gestoria i dels Tractors desapareixen. */
  async function compila(produccio) {
    const abans = process.env.NODE_ENV;
    process.env.NODE_ENV = produccio ? 'production' : 'development';
    try {
      const resultat = await build({
        configFile: false,
        logLevel: 'silent',
        root: ARREL,
        mode: produccio ? 'production' : 'development',
        build: {
          write: false,
          minify: false,
          lib: { entry: path.join(ARREL, WIKI), formats: ['es'], fileName: 'wiki' },
          rollupOptions: { external: (_id, importador) => Boolean(importador) }
        }
      });
      return (Array.isArray(resultat) ? resultat : [resultat]).flatMap((r) => r.output).map((o) => o.code ?? '').join('\n');
    } finally {
      if (abans === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = abans;
    }
  }

  test('al build de producció no queda cap importació de la Gestoria ni dels Tractors', async () => {
    const carrils = /import\(\s*["'][^"']*(?:ContenidorGestoria|PanellTractors|PanellSentinelles|aprendre\/Aprendre)/g;
    const desenvolupament = await compila(false);
    expect(desenvolupament.match(carrils)).toHaveLength(4);
    const produccio = await compila(true);
    expect(produccio.match(carrils)).toBeNull();
    expect(produccio).not.toMatch(/ContenidorGestoria|PanellTractors|PanellSentinelles|Aprendre\.jsx/);
  }, 60000);
});
