// @vitest-environment node
/* Plataforma d'Apps Enxufables · les guardes d'un mòdul (guardesDelModul.js
   i vite.modul.config.js, contracte sdp.modul.v1, ADR-2026-12) sobre l'arbre
   de veritat de la Gestoria, sense compilar res:
   1 · les guardes del text: la xarxa sempre vetada; els magatzems i les
       adreces, només si el mòdul els declara;
   2 · la declaració de la Gestoria és la llista blanca de privacitat.test.js
       (aprovada pel Mestre) més les adreces de les fitxes que porta com a
       text, ni una més;
   3 · la clausura del pont (AppGestoria.jsx, amb les quatre vistes i els
       Tractors que arrosseguen): Pedra Seca, plataforma i router només del
       nucli i amb noms que exposa; cap context, dada ni host.js; cap paquet
       fora de lucide-react (React és del nucli); cap xarxa, magatzem ni
       adreça que no declare;
   4 · cap fitxer de producció de la Gestoria ni dels Tractors importa Pedra
       Seca de fora del nucli, encara que el pont encara no l'arribe;
   5 · Onada 7 (261009): la clausura del Bar, la Nevera, Salut i el Lector
       passa les mateixes guardes amb la declaració de cada una, que és
       exactament el que porta; la llavor de DEV del Lector, fora i amb motiu;
   6 · Onada 7: cap fitxer de producció d'estes quatre apps ni de l'esquelet
       comú importa Pedra Seca o el router de fora del nucli 1.1.0, i cada
       nom que l'1.1.0 afig el fa servir algú.
   Els builds de veritat de la Gestoria sencera i de les quatre apps són a
   modulDeBuild.test.jsx. Els patrons de les sondes es componen a trossos
   (patró de fronteres.test.js). */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { NOMS_PER_FITXER_DE_PEDRA_SECA, VERSIO_NUCLI, exposaElNom, portaDeLaFont } from './contracteNucli.js';
import {
  ADRECES_DE_TOTS, DECLARACIONS_DELS_MODULS, MAGATZEMS, XARXA, declaracioDe, hostsDe, infraccionsDelText
} from './guardesDelModul.js';
import { NOMS_DEL_NUCLI_1_1 } from './__fixtures__/nomsDelNucli.js';

const ARREL = process.cwd();
const PONT = 'src/apps/gestoria/AppGestoria.jsx';
const CARRILS = Object.freeze(['src/apps/gestoria', 'src/sections/gestoria', 'src/sections/tractors']);
const PEDRA_SECA = 'src/components/PedraSeca/';
/* Els paquets que el cos pot portar dins: els que permet privacitat.test.js (React és del nucli). */
const PAQUETS_DEL_COS = Object.freeze(['lucide-react']);
const CODI = /\.(?:[cm]?js|jsx)$/;
const t = (...trossos) => trossos.join('');

const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const esFitxer = (ruta) => {
  try {
    return statSync(path.join(ARREL, ruta)).isFile();
  } catch {
    return false;
  }
};
const esProva = (ruta) => /\.test\.[cm]?jsx?$/.test(ruta) || ruta.includes('/__fixtures__/');

function fitxersDe(directori, extensio = CODI) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta, extensio));
    else if (extensio.test(entrada.name) && !esProva(ruta)) fitxers.push(ruta);
  }
  return fitxers;
}

/* Els noms d'una clàusula d'importació: { a, b as c } → a, b; X → default; * as X → '*'. */
function nomsDeLaClausula(clausula) {
  const noms = [];
  const claus = clausula.match(/\{([^}]*)\}/);
  if (claus) {
    for (const tros of claus[1].split(',')) {
      const nom = tros.trim().split(/\s+as\s+/)[0].trim();
      if (nom) noms.push(nom);
    }
  }
  const resta = clausula.replace(/\{[^}]*\}/, '');
  if (/\*/.test(resta)) noms.push('*');
  else if (resta.split(',').some((tros) => tros.trim())) noms.push('default');
  return noms;
}

/* Les importacions d'un codi (estàtiques, de reexportació, d'efecte i dinàmiques), amb els noms.
   Les tres primeres, només a l'inici d'una sentència: un text que diu «import» no compta. */
function importacions(codi) {
  const llista = [];
  for (const m of codi.matchAll(/^[ \t]*(?:import|export)\s+([\w$*{}\s,]+?)\s+from\s*(['"])([^'"\n]+)\2/gm)) {
    llista.push({ especificador: m[3], noms: nomsDeLaClausula(m[1]) });
  }
  for (const m of codi.matchAll(/^[ \t]*import\s*(['"])([^'"\n]+)\1/gm)) llista.push({ especificador: m[2], noms: [] });
  for (const m of codi.matchAll(/\bimport\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g)) llista.push({ especificador: m[2], noms: ['*'] });
  return llista;
}

/* Els fitxers que porta com a text un import.meta.glob(..., { query: '?raw' }): Vite els
   inlina sencers al cos. Només s'entén la forma `<carpeta>/**\/*.{ext,…}` (i les negacions de
   proves i de suport de proves, que fitxersDe ja deixa fora); qualsevol altra és una infracció. */
function fitxersDelGlob(origen, codi) {
  const fitxers = [];
  const noEntesos = [];
  for (const crida of codi.matchAll(/import\.meta\.glob\(\s*\[([^\]]*)\]/g)) {
    for (const [, patro] of crida[1].matchAll(/'([^']+)'/g)) {
      if (patro.startsWith('!')) continue;
      const forma = patro.match(/^(\.\.?\/[\w/.-]*?)\/\*\*\/\*\.(?:\{([a-z,]+)\}|([a-z]+))$/);
      if (!forma) {
        noEntesos.push(`${origen}: glob que esta prova no entén (${patro})`);
        continue;
      }
      const carpeta = path.posix.normalize(path.posix.join(path.posix.dirname(origen), forma[1]));
      const extensions = (forma[2] || forma[3]).split(',');
      fitxers.push(...fitxersDe(carpeta, new RegExp(`\\.(?:${extensions.join('|')})$`)));
    }
  }
  return { fitxers, noEntesos };
}

/* Un especificador relatiu, resolt des de l'arrel (amb l'extensió que té al disc); un paquet, null. */
function resol(origen, especificador) {
  const net = especificador.replace(/\?.*$/, '');
  if (!net.startsWith('.')) return null;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(origen), net));
  return [base, `${base}.js`, `${base}.jsx`, `${base}/index.js`, `${base}/index.jsx`].find(esFitxer) || base;
}

/* La clausura del cos d'un mòdul, com la faria Rollup: s'atura a les fonts del nucli (externes) i
   als paquets. `fitxers`: ruta → text, el codi que s'executa i el text que viatja (?raw i globs).
   `deixa` (Onada 7, 261009): ruta → motiu dels fitxers que no se seguixen, codi que l'app només
   fa servir darrere d'un literal de DEV; `deixats` diu a quins s'hi ha arribat de veres. */
function clausura(entrada, deixa = new Map()) {
  const fitxers = new Map();
  const comText = new Set();
  const delNucli = [];
  const paquets = [];
  const noEntesos = [];
  const deixats = new Set();
  const pendents = [entrada];
  while (pendents.length) {
    const ruta = pendents.pop();
    if (fitxers.has(ruta) && !comText.has(ruta)) continue;
    const text = llig(ruta);
    fitxers.set(ruta, text);
    comText.delete(ruta);
    if (!CODI.test(ruta)) continue; // una fitxa .md viatja com a text: no importa res
    for (const { especificador, noms } of importacions(text)) {
      const desti = resol(ruta, especificador);
      const font = desti ?? especificador.replace(/\?.*$/, '');
      if (portaDeLaFont(font)) delNucli.push({ origen: ruta, font, noms });
      else if (desti === null) paquets.push({ origen: ruta, paquet: font });
      else if (deixa.has(desti)) deixats.add(desti);
      else if (/\?raw$/.test(especificador)) {
        if (!fitxers.has(desti)) { fitxers.set(desti, llig(desti)); comText.add(desti); }
      } else pendents.push(desti);
    }
    const glob = fitxersDelGlob(ruta, text);
    noEntesos.push(...glob.noEntesos);
    for (const fitxer of glob.fitxers) if (!fitxers.has(fitxer)) { fitxers.set(fitxer, llig(fitxer)); comText.add(fitxer); }
  }
  return { fitxers, comText, delNucli, paquets, noEntesos, deixats };
}

/* Les guardes del build (infraccionsDelCos de vite.modul.config.js) sobre una clausura de fonts.
   El text (?raw, globs) es mira com el codi: viatja sencer dins del cos. */
function infraccionsDeLaClausula({ fitxers, delNucli, paquets, noEntesos = [] }, id) {
  const trobades = [...noEntesos];
  for (const [ruta, text] of fitxers) {
    if (/^src\/(?:app\/contexts|data)\//.test(ruta) || ruta === 'src/host.js' || ruta === 'src/config/storage.js') {
      trobades.push(`porta el nucli de la pàgina (context, dades o host): ${ruta}`);
    } else if (/^src\/(?:apps\/plataforma|components\/PedraSeca)\//.test(ruta)) {
      trobades.push(`porta plataforma o Pedra Seca fora del nucli ${VERSIO_NUCLI}: ${ruta}`);
    }
    for (const infraccio of infraccionsDelText(text, { id })) trobades.push(`${ruta}: ${infraccio}`);
  }
  for (const { origen, font, noms } of delNucli) {
    const porta = portaDeLaFont(font);
    for (const nom of noms) {
      if (!exposaElNom(porta, nom)) trobades.push(`${origen}: importa ${nom === '*' ? 'tot' : nom} de ${font}, que el nucli ${VERSIO_NUCLI} no exposa`);
    }
  }
  for (const { origen, paquet } of paquets) if (!PAQUETS_DEL_COS.includes(paquet)) trobades.push(`${origen}: porta el paquet ${paquet}`);
  return trobades;
}

describe('1 · les guardes del text (guardesDelModul.js)', () => {
  test('les sondes: cada patró troba la forma que veta', () => {
    const sondes = {
      fetch: t('fet', 'ch("/x")'),
      'fetch per claudàtors': t('window["fet', 'ch"]("/x")'),
      XMLHttpRequest: t('new XMLHttp', 'Request()'),
      WebSocket: t('new Web', 'Socket(u)'),
      EventSource: t('new Event', 'Source(u)'),
      sendBeacon: t('navigator.send', 'Beacon(u,d)'),
      importScripts: t('import', 'Scripts(u)'),
      WebRTC: t('new RTCPeer', 'Connection()'),
      WebTransport: t('new Web', 'Transport(u)'),
      [t('navigator.service', 'Worker')]: t('navigator.service', 'Worker.register(u)'),
      'new Image (una balisa)': t('(new Ima', 'ge).src=u'),
      'URL protocol-relativa': t('a.href="', '//exemple.invalid/x"')
    };
    expect(Object.keys(sondes).sort()).toEqual(XARXA.map(([, que]) => que).sort());
    for (const [patro, que] of XARXA) expect(patro.test(sondes[que]), que).toBe(true);
    const magatzems = {
      idb: t('indexed', 'DB.open("x")'), local: t('local', 'Storage.getItem("x")'), sessio: t('session', 'Storage.clear()'),
      galeta: t('document.coo', 'kie="a=b"'), cache: t('caches.', 'open("x")')
    };
    for (const [clau, patro] of MAGATZEMS) expect(patro.test(magatzems[clau]), clau).toBe(true);
  });

  test('el que no és xarxa no salta: una ruta pròpia, un comentari, una regex de barres i els espais de noms del W3C', () => {
    const net = [
      'const r="/app/gestoria/tauler";',
      'const re=/^\\/\\//;',
      'e("svg",{xmlns:"http://www.w3.org/2000/svg"})',
      'const s="//";'
    ].join('\n');
    expect(infraccionsDelText(net, { id: null })).toEqual([]);
    expect(ADRECES_DE_TOTS).toEqual(['www.w3.org']);
  });

  test('les adreces i els magatzems valen només per al mòdul que els declara', () => {
    const text = t('const u="https:', '//MAIL.google.com/mail/?to=a";const b=indexed', 'DB;');
    expect(hostsDe(text)).toEqual(['mail.google.com']);
    expect(infraccionsDelText(text, { id: 'gestoria' })).toEqual([]);
    expect(infraccionsDelText(text, { id: 'llibreta' })).toEqual([
      'fa servir un magatzem que no declara: IndexedDB', 'porta una URL externa que no declara: mail.google.com'
    ]);
    /* Onada 7 (261009) · host per host i magatzem per magatzem: el Bar declara IndexedDB, però no Gmail. */
    expect(infraccionsDelText(text, { id: 'bar' })).toEqual(['porta una URL externa que no declara: mail.google.com']);
    expect(declaracioDe('inexistent')).toEqual({ adreces: [], magatzems: [] });
    expect(declaracioDe('toString')).toEqual({ adreces: [], magatzems: [] });
    expect(Object.isFrozen(DECLARACIONS_DELS_MODULS.gestoria.adreces)).toBe(true);
  });
});

/* La Gestoria de veritat, des del pont amb les quatre vistes. */
const GESTORIA = clausura(PONT);
const RUTES = [...GESTORIA.fitxers.keys()];

describe('2 · la declaració de la Gestoria és la de la seua guarda de privacitat', () => {
  const PRIVACITAT = llig('src/sections/gestoria/privacitat.test.js');
  const inici = PRIVACITAT.indexOf('const PERMESES = {');
  const fi = PRIVACITAT.indexOf('};', inici);
  const aprovats = [...new Set([...PRIVACITAT.slice(inici, fi).matchAll(/'([a-z0-9-]+(?:\.[a-z0-9-]+)+)'/g)].map((m) => m[1]))].sort();
  /* Les fitxes que el cos porta com a text: la guarda de privacitat no mira els .md. */
  const deLesFitxes = [...new Set(RUTES.filter((ruta) => !CODI.test(ruta)).flatMap((ruta) => hostsDe(GESTORIA.fitxers.get(ruta))))]
    .filter((host) => !ADRECES_DE_TOTS.includes(host)).sort();

  test('la llista blanca de privacitat.test.js es llig de veres', () => {
    expect(inici).toBeGreaterThan(-1);
    expect(fi).toBeGreaterThan(inici);
    expect(aprovats).toEqual(expect.arrayContaining(['mail.google.com', 'www2.agenciatributaria.gob.es']));
  });

  test('les adreces declarades són exactament les aprovades més les de les fitxes, i el magatzem, només IndexedDB', () => {
    expect(deLesFitxes).toEqual(['localhost:3340']);
    expect([...DECLARACIONS_DELS_MODULS.gestoria.adreces].sort()).toEqual([...new Set([...aprovats, ...deLesFitxes])].sort());
    expect(DECLARACIONS_DELS_MODULS.gestoria.magatzems).toEqual(['idb']);
  });
});

describe('3 · la clausura del pont de la Gestoria passa les guardes del build', () => {
  test('la clausura mira de veres: les quatre vistes, el Cofre, el QR, el correu, l’XLSX, els Tractors i les fitxes', () => {
    expect(RUTES).toEqual(expect.arrayContaining([
      'src/sections/gestoria/tauler/ShellGestoria.jsx', 'src/sections/gestoria/aprendre/Aprendre.jsx',
      'src/sections/gestoria/facturar/Facturacio.jsx', 'src/sections/gestoria/historic/Historic.jsx',
      'src/sections/gestoria/facturacio/registre/qr.js', 'src/sections/gestoria/enviament/correuGestoria.js',
      'src/utils/fulls/xlsx.js', 'src/sections/tractors/useTractors.js'
    ]));
    expect(RUTES.some((ruta) => ruta.endsWith('.md'))).toBe(true);
    expect(RUTES.length).toBeGreaterThan(60);
    expect(GESTORIA.delNucli.map(({ font }) => font)).toEqual(expect.arrayContaining([
      'react', 'src/app/contexts/RouterContext.jsx', 'src/apps/plataforma/index.js', `${PEDRA_SECA}organismes/Pestanyes.jsx`
    ]));
  });

  test('cap infracció: Pedra Seca i plataforma del nucli, cap context ni dada, cap paquet propi, cap xarxa ni adreça no declarada', () => {
    expect(infraccionsDeLaClausula(GESTORIA, 'gestoria')).toEqual([]);
  });

  test('la porta mira de veres: sense la declaració de la Gestoria, les seues adreces i el seu magatzem no passarien', () => {
    const sense = infraccionsDeLaClausula(GESTORIA, null).join('\n');
    for (const host of DECLARACIONS_DELS_MODULS.gestoria.adreces) expect(sense, host).toContain(`porta una URL externa que no declara: ${host}`);
    expect(sense).toContain('fa servir un magatzem que no declara: IndexedDB');
  });

  test('la porta mira de veres: una peça de Pedra Seca fora del nucli, un context i un paquet propi salten', () => {
    const sonda = {
      fitxers: new Map([[`${PEDRA_SECA}atoms/Avatar.jsx`, ''], ['src/app/contexts/SessionContext.jsx', '']]),
      delNucli: [{ origen: 'src/sections/gestoria/X.jsx', font: `${PEDRA_SECA}index.js`, noms: ['Avatar'] }],
      paquets: [{ origen: 'src/sections/gestoria/X.jsx', paquet: 'react-dom' }]
    };
    expect(infraccionsDeLaClausula(sonda, 'gestoria')).toEqual([
      `porta plataforma o Pedra Seca fora del nucli ${VERSIO_NUCLI}: ${PEDRA_SECA}atoms/Avatar.jsx`,
      'porta el nucli de la pàgina (context, dades o host): src/app/contexts/SessionContext.jsx',
      `src/sections/gestoria/X.jsx: importa Avatar de ${PEDRA_SECA}index.js, que el nucli ${VERSIO_NUCLI} no exposa`,
      'src/sections/gestoria/X.jsx: porta el paquet react-dom'
    ]);
    expect(nomsDeLaClausula('Fitxa, { a, b as c }')).toEqual(['a', 'b', 'default']);
    expect(nomsDeLaClausula('* as tot')).toEqual(['*']);
  });
});

describe('4 · Pedra Seca a tot l’arbre de la Gestoria i dels Tractors: només la del nucli', () => {
  const PRODUCCIO = CARRILS.flatMap((carril) => fitxersDe(carril));

  test('cada import de Pedra Seca és d’un fitxer del nucli i d’un nom que exposa', () => {
    const fora = [];
    let vistes = 0;
    for (const ruta of PRODUCCIO) {
      for (const { especificador, noms } of importacions(llig(ruta))) {
        const desti = resol(ruta, especificador);
        if (!desti || !desti.startsWith(PEDRA_SECA)) continue;
        vistes += 1;
        const porta = portaDeLaFont(desti);
        if (!porta) fora.push(`${ruta}: ${desti} no és del nucli ${VERSIO_NUCLI}`);
        else for (const nom of noms) if (!exposaElNom(porta, nom)) fora.push(`${ruta}: ${nom} de ${desti}`);
      }
    }
    expect(fora).toEqual([]);
    expect(PRODUCCIO.length).toBeGreaterThan(80);
    expect(vistes).toBeGreaterThan(60);
  });

  test('el nucli porta cada fitxer de Pedra Seca que importen (el fitxer, i no només la façana)', () => {
    const fitxers = new Set();
    for (const ruta of PRODUCCIO) {
      for (const { especificador } of importacions(llig(ruta))) {
        const desti = resol(ruta, especificador);
        if (desti && desti.startsWith(PEDRA_SECA) && !desti.endsWith('/index.js')) fitxers.add(desti);
      }
    }
    expect([...fitxers].filter((fitxer) => !Object.hasOwn(NOMS_PER_FITXER_DE_PEDRA_SECA, fitxer))).toEqual([]);
    expect([...fitxers]).toEqual(expect.arrayContaining([`${PEDRA_SECA}organismes/Pestanyes.jsx`, `${PEDRA_SECA}atoms/ControlContrasenya.jsx`]));
  });
});

/* ── Onada 7 (261009) · el Bar, la Nevera, Salut i el Lector com a mòduls ──
   La fase 1 de l'ADR-2026-12 per a les quatre apps de la recepta. L'entrada
   de cada cos és el component del manifest (el `import('./AppX.jsx')` de
   `carrega`). La clausura s'atura, a més, als fitxers de NOMES_EN_DEV: codi
   que l'app només fa servir darrere d'un literal de DEV, que el build d'un
   mòdul deixa en fals (mode production i cap VITE_* a l'envPrefix). Cada
   exclusió porta el seu motiu, una prova que la clausura hi arriba de veres i
   el build real (modulDeBuild.test.jsx), que diu que no és al cos.
   La carta de La Parròquia (bar/llavors/laParroquia.js, amb el seu CSV) també
   és de DEV, però no s'exclou: no porta cap adreça ni magatzem, i mirar-la és
   més estricte. El build real prova que tampoc no és al cos. */
const APPS_DE_LA_FASE_1 = Object.freeze({
  bar: 'src/apps/bar/AppBar.jsx',
  nevera: 'src/apps/nevera/AppNevera.jsx',
  salut: 'src/apps/salut/AppSalut.jsx',
  lector: 'src/apps/lector/AppLector.jsx'
});
const NOMES_EN_DEV = new Map([
  ['src/apps/lector/llavor/fontLlavor.js', t('La llavor sintètica del Lector. AppLector.jsx només la fa servir darrere de LLAVOR_ACTIVA ',
    '(import.meta.env.DEV o VITE_SDP_LECTOR_LLAVOR), que el build d’un mòdul deixa en fals. Porta com a text feeds ',
    'd’example.org amb els espais de noms de purl.org i search.yahoo.com: cap és una dada del Lector de producció.')]
]);
const CLAUSURES_DE_LA_FASE_1 = Object.freeze(Object.fromEntries(
  Object.entries(APPS_DE_LA_FASE_1).map(([id, entrada]) => [id, clausura(entrada, NOMES_EN_DEV)])
));
/* Els magatzems que nomena un conjunt de textos (les claus de la declaració). */
const magatzemsDe = (textos) => MAGATZEMS.filter(([, patro]) => textos.some((text) => patro.test(text))).map(([clau]) => clau);

describe('5 · Onada 7: la clausura de cada app de la fase 1 passa les guardes del build amb la seua declaració', () => {
  test.each(Object.keys(APPS_DE_LA_FASE_1))('%s: l’entrada és el component del manifest i la clausura mira de veres', (id) => {
    const entrada = APPS_DE_LA_FASE_1[id];
    expect(llig(`src/apps/${id}/manifest.js`)).toContain(`import('./${path.posix.basename(entrada)}')`);
    const { fitxers, delNucli } = CLAUSURES_DE_LA_FASE_1[id];
    expect([...fitxers.keys()]).toEqual(expect.arrayContaining([entrada, `src/apps/${id}/magatzem.js`, 'src/utils/magatzemLocal.js']));
    expect(fitxers.size).toBeGreaterThan(15);
    expect(delNucli.map(({ font }) => font)).toEqual(expect.arrayContaining([
      'react', 'src/app/contexts/RouterContext.jsx', 'src/apps/plataforma/index.js', `${PEDRA_SECA}index.js`
    ]));
  });

  test.each(Object.keys(APPS_DE_LA_FASE_1))('%s: cap infracció amb la seua declaració; sense, el magatzem i les adreces no passarien', (id) => {
    expect(infraccionsDeLaClausula(CLAUSURES_DE_LA_FASE_1[id], id)).toEqual([]);
    const sense = infraccionsDeLaClausula(CLAUSURES_DE_LA_FASE_1[id], null).join('\n');
    expect(sense).toContain('fa servir un magatzem que no declara: IndexedDB');
    for (const host of DECLARACIONS_DELS_MODULS[id].adreces) expect(sense, host).toContain(`porta una URL externa que no declara: ${host}`);
  });

  test('cada declaració és exactament el que porta la clausura: les adreces de fora del W3C i els magatzems', () => {
    for (const [id, { fitxers }] of Object.entries(CLAUSURES_DE_LA_FASE_1)) {
      const textos = [...fitxers.values()];
      const hosts = [...new Set(textos.flatMap(hostsDe))].filter((host) => !ADRECES_DE_TOTS.includes(host)).sort();
      expect(hosts, id).toEqual([...DECLARACIONS_DELS_MODULS[id].adreces].sort());
      expect(magatzemsDe(textos), id).toEqual([...DECLARACIONS_DELS_MODULS[id].magatzems]);
    }
    expect(DECLARACIONS_DELS_MODULS.bar.adreces).toEqual(['schemas.openxmlformats.org']);
    expect(DECLARACIONS_DELS_MODULS.salut.adreces).toEqual(['schemas.openxmlformats.org']);
  });

  test('les exclusions de DEV són reals: la clausura hi arriba, el literal hi és, i amb la llavor hi entrarien adreces que el Lector no declara', () => {
    const deixats = new Set(Object.values(CLAUSURES_DE_LA_FASE_1).flatMap(({ deixats: d }) => [...d]));
    expect([...NOMES_EN_DEV.keys()].filter((fitxer) => !deixats.has(fitxer))).toEqual([]);
    expect([...CLAUSURES_DE_LA_FASE_1.lector.deixats]).toEqual(['src/apps/lector/llavor/fontLlavor.js']);
    /* L'únic ús de l'adaptador de la llavor és darrere del literal de DEV. */
    const lector = llig(APPS_DE_LA_FASE_1.lector);
    expect(lector).toContain("const LLAVOR_ACTIVA = import.meta.env.DEV || import.meta.env.VITE_SDP_LECTOR_LLAVOR === '1';");
    expect(lector.match(/\bcreaAdaptadorLlavor\b/g)).toHaveLength(2);
    expect(lector).toContain('(LLAVOR_ACTIVA ? creaFontNoticies(creaAdaptadorLlavor(');
    const ambLlavor = infraccionsDeLaClausula(clausura(APPS_DE_LA_FASE_1.lector), 'lector').join('\n');
    for (const host of ['example.org', 'purl.org']) expect(ambLlavor, host).toContain(`porta una URL externa que no declara: ${host}`);
  });
});

describe('6 · Onada 7: Pedra Seca i el router a tot l’arbre de les quatre apps i de l’esquelet comú, només del nucli', () => {
  const CARRILS_DE_LES_APPS = Object.freeze(['src/apps/bar', 'src/apps/nevera', 'src/apps/salut', 'src/apps/lector', 'src/apps/comu']);
  /* Els noms que el nucli 1.1.0 afig al 1.0.0 són NOMS_DEL_NUCLI_1_1 (__fixtures__/nomsDelNucli.js):
     nucliModuls.test.js diu que són exactament els que el contracte afig, i ací es prova que estan en ús. */
  const fora = [];
  const usats = { router: new Set(), pedraSeca: new Set() };
  let vistes = 0;
  for (const carril of CARRILS_DE_LES_APPS) {
    for (const ruta of fitxersDe(carril)) {
      for (const { especificador, noms } of importacions(llig(ruta))) {
        const desti = resol(ruta, especificador);
        if (!desti) continue;
        const porta = portaDeLaFont(desti);
        if (!porta) {
          if (desti.startsWith(PEDRA_SECA) || desti.startsWith('src/app/contexts/')) fora.push(`${ruta}: ${desti} no és del nucli ${VERSIO_NUCLI}`);
          continue;
        }
        if (!Object.hasOwn(usats, porta.clau)) continue;
        vistes += 1;
        for (const nom of noms) {
          if (!exposaElNom(porta, nom)) fora.push(`${ruta}: ${nom} de ${desti}`);
          usats[porta.clau].add(nom);
        }
      }
    }
  }

  test('cada import de Pedra Seca i del router és d’un fitxer del nucli i d’un nom que exposa', () => {
    expect(fora).toEqual([]);
    expect(vistes).toBeGreaterThan(50); // 58 importacions del router i de Pedra Seca el 261009
  });

  test('la porta mira de veres: cada nom que el nucli 1.1.0 afig el fa servir alguna d’estes apps o l’esquelet comú', () => {
    for (const [clau, noms] of Object.entries(NOMS_DEL_NUCLI_1_1)) {
      expect(noms.filter((nom) => !usats[clau].has(nom)), clau).toEqual([]);
    }
  });
});
