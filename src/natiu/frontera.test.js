// @vitest-environment node
/* L'app nativa · la frontera (ARQUITECTURA.txt §1.2, §3.3 i §5; primera
   manera de fallar del §6). Tot el JS natiu viu a src/natiu/, i només ell pot
   importar Capacitor. Cap altre fitxer de src/ importa src/natiu/ ni cap
   paquet de Capacitor: així ni la web, ni la PWA, ni el paquet del connector de
   WordPress (embed.jsx) no poden arribar mai a Capacitor, ni directament ni de
   rebot. Es miren les fonts, sempre; l'eixida real del connector la mira
   tests/natiu-build.test.mjs quan existix. Patró de src/apps/nevera/frontera.test.js:
   els noms vetats es componen a trossos perquè les portes que llegixen src/
   no prenguen les sondes d'esta prova per imports de veres. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const NATIU = 'src/natiu';
const CAP = ['@capa', 'citor'].join('');
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const esProva = (ruta) => /\.test\.[cm]?jsx?$/.test(ruta) || ruta.includes('/__fixtures__/');

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    if (entrada.name === 'node_modules') continue;
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.(?:[cm]?js|jsx)$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

/* Tots els especificadors d'un fitxer: import … from, export … from, import
   amb efectes, import() dinàmic, require(), new URL(…, import.meta.url) i els
   patrons d'import.meta.glob (els negats, amb '!', no porten a cap fitxer).
   Un literal pot anar entre cometes simples, dobles o accents greus. D'una
   plantilla, cada ${…} és un comodí: Vite convertix import(`../x/${nom}.js`)
   en el glob ../x/*.js (dynamic-import-vars) i l'empaqueta sencer. Entre el
   parèntesi i el literal hi pot haver comentaris, com el de @vite-ignore. */
const LITERAL = "(?:'([^'\\n]*)'|\"([^\"\\n]*)\"|`([^`]*)`)";
const ENTRE = '(?:\\s|/\\*[\\s\\S]*?\\*/|//[^\\n]*\\n)*';
const FORMES = [
  new RegExp(`\\bfrom\\s*${LITERAL}`, 'g'),
  new RegExp(`\\bimport\\s*${LITERAL}`, 'g'),
  new RegExp(`\\bimport\\s*\\(${ENTRE}${LITERAL}`, 'g'),
  new RegExp(`\\brequire\\s*\\(${ENTRE}${LITERAL}`, 'g'),
  // El fitxer que nomena viatja dins del paquet com a recurs.
  new RegExp(`\\bnew\\s+URL\\s*\\(${ENTRE}${LITERAL}${ENTRE},${ENTRE}import\\.meta\\.url\\b`, 'g')
];
const LITERALS = new RegExp(LITERAL, 'g');
const BASE_DEL_GLOB = new RegExp(`\\bbase\\s*:\\s*${LITERAL}`);
const GLOB = /\bimport\.meta\.glob(?:Eager)?\s*\(/g;
const textDe = (m) => (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, '*');

/* L'índex del primer caràcter de `codi`, a partir d'`inici` i fora de cadenes,
   parèntesis, claudàtors i claus, que `atura` accepta (o la llargària). */
function finsA(codi, inici, atura) {
  let fondaria = 0;
  let cometa = null;
  for (let i = inici; i < codi.length; i += 1) {
    const c = codi[i];
    if (cometa) {
      if (c === '\\') i += 1;
      else if (c === cometa) cometa = null;
    } else if ('\'"`'.includes(c)) cometa = c;
    else if ('([{'.includes(c)) fondaria += 1;
    else if (fondaria === 0 && atura(c)) return i;
    else if (')]}'.includes(c)) fondaria -= 1;
  }
  return codi.length;
}

/* Els patrons d'import.meta.glob: el primer argument (un literal o una llista)
   i, si les opcions porten `base`, els relatius ./ i ../ resolts des d'ella,
   com fa Vite (toAbsoluteGlob). */
function patronsDeGlob(codi) {
  const patrons = [];
  for (const crida of codi.matchAll(GLOB)) {
    const inici = crida.index + crida[0].length;
    const args = codi.slice(inici, finsA(codi, inici, (c) => c === ')'));
    const coma = finsA(args, 0, (c) => c === ',');
    const base = args.slice(coma).match(BASE_DEL_GLOB);
    for (const literal of args.slice(0, coma).matchAll(LITERALS)) {
      const patro = textDe(literal);
      if (patro.startsWith('!')) continue;
      if (!base || !/^\.\.?\//.test(patro)) { patrons.push(patro); continue; }
      const unit = path.posix.join(textDe(base), patro);
      patrons.push(/^(?:\/|\.\.?\/)/.test(unit) ? unit : `./${unit}`);
    }
  }
  return patrons;
}

function especificadors(codi) {
  return [...FORMES.flatMap((forma) => [...codi.matchAll(forma)].map(textDe)), ...patronsDeGlob(codi)];
}

/* Un especificador resolt des de l'arrel: l'àlies @/ de Vite és src/, un camí
   que comença per / és de l'arrel del projecte i un glob que comença per **
   pot ser a qualsevol lloc. Un paquet torna null (Capacitor es mira abans). */
function resol(fitxer, especificador) {
  if (especificador.startsWith('@/')) return path.posix.normalize(`src/${especificador.slice(2)}`);
  if (especificador.startsWith('/')) return path.posix.normalize(especificador.slice(1));
  if (especificador.startsWith('**')) return especificador;
  if (!especificador.startsWith('.')) return null;
  return path.posix.normalize(path.posix.join(path.posix.dirname(fitxer), especificador));
}

const esCapacitor = (especificador) => especificador === CAP || especificador.startsWith(`${CAP}/`);

/* Cert si l'especificador (o el patró de glob) pot arribar a src/natiu/ o a
   Capacitor. D'un glob es mira la carpeta fixa, la d'abans del primer comodí:
   hi arriba si és dins de src/natiu/, si és una carpeta que la conté o si no
   n'hi ha cap (el comodí és al principi). */
function arribaAlNatiu(fitxer, especificador) {
  if (esCapacitor(especificador)) return true;
  const desti = resol(fitxer, especificador);
  if (desti === null) return false;
  const fix = desti.split(/[*{[?]/)[0];
  if (fix === desti) return desti === NATIU || desti.startsWith(`${NATIU}/`);
  const carpeta = fix.slice(0, fix.lastIndexOf('/') + 1);
  return carpeta === '' || carpeta.startsWith(`${NATIU}/`) || `${NATIU}/`.startsWith(carpeta);
}

const PRODUCCIO = fitxersDe('src').filter((ruta) => !esProva(ruta));
const FORA_DEL_NATIU = PRODUCCIO.filter((ruta) => !ruta.startsWith(`${NATIU}/`));
const DEL_NATIU = PRODUCCIO.filter((ruta) => ruta.startsWith(`${NATIU}/`));
const quinsArriben = (fitxers) => fitxers.flatMap((ruta) => especificadors(llig(ruta))
  .filter((e) => arribaAlNatiu(ruta, e)).map((e) => `${ruta}: ${e}`));

describe('les sondes: el detector veu cada forma d’arribar al natiu', () => {
  test('cada forma d’import, l’àlies @/, els camins de l’arrel i els globs', () => {
    const DE = 'src/data/x.js';
    for (const codi of [
      `import { App } from '${CAP}/app';`,
      `import '${CAP}/core';`,
      `export { Browser } from '${CAP}/browser';`,
      `const m = await import('${CAP}/preferences');`,
      `const m = require('${CAP}/filesystem');`,
      "import entrada from '../natiu/entrada.jsx';",
      "import x from '@/natiu/obridorOAuth.js';",
      "const f = import.meta.glob('../natiu/*.js');",
      "const f = import.meta.glob('/src/natiu/*.js');",
      "const f = import.meta.glob(['../**/*.js', '!**/*.test.*']);"
    ]) {
      expect(especificadors(codi).some((e) => arribaAlNatiu(DE, e)), codi).toBe(true);
    }
    for (const codi of [
      "import { x } from './natiuX.js';",
      "import y from '../config/capaDelPaquet.js';",
      "const f = import.meta.glob(['../sections/**/*.js', '!../natiu/**']);",
      `// ${CAP}: un comentari sense cap import`
    ]) {
      expect(especificadors(codi).some((e) => arribaAlNatiu(DE, e)), codi).toBe(false);
    }
  });

  /* Revisió adversarial (261003): formes que Vite i Rollup empaqueten i que la
     primera versió del detector no veia. Cada una es va provar en roig abans
     d'estendre'l. */
  test('les plantilles, els comentaris dins d’import(), el base dels globs, ** i new URL(…, import.meta.url)', () => {
    const DE = 'src/data/x.js';
    const arriba = (codi) => especificadors(codi).some((e) => arribaAlNatiu(DE, e));
    const positius = [
      'const m = await import(`' + CAP + '/app`);',
      'const m = require(`' + CAP + '/filesystem`);',
      `const m = await import(/* @vite-ignore */ '${CAP}/browser');`,
      `const m = await import(\n  // per a l'app\n  '${CAP}/browser'\n);`,
      // dynamic-import-vars: Vite ho convertix en el glob ../natiu/*.js i ho empaqueta sencer.
      "const m = await import(`../natiu/${nom}.js`);",
      "const f = import.meta.glob(`../natiu/*.js`);",
      "const f = import.meta.glob('./*.js', { base: '../natiu' });",
      "const f = import.meta.glob('./*.js', { eager: true, base: '/src/natiu' });",
      "const f = import.meta.glob(['../natiu/[ab]*.js']);",
      "const f = import.meta.glob('**/*.jsx');",
      "const u = new URL('../natiu/entrada.jsx', import.meta.url);"
    ];
    const negatius = [
      "const m = await import(`./${nom}.js`);",
      "const f = import.meta.glob('./*.js', { base: '../sections' });",
      "const f = import.meta.glob(['./*.js'], { query: '?raw', import: 'default', eager: true });",
      "const u = new URL('./icona.svg', import.meta.url);",
      "const m = await import(`${'@capa'}`);"
    ];
    expect(positius.filter((codi) => !arriba(codi)), 'formes que el detector no veu').toEqual([]);
    expect(negatius.filter(arriba), 'falsos positius').toEqual([]);
  });

  test('el cens mira de veres: hi ha producció fora del natiu, i les peces que nomena el §5 hi són', () => {
    expect(FORA_DEL_NATIU.length).toBeGreaterThan(200);
    for (const ruta of ['src/main.jsx', 'src/embed.jsx', 'src/PedraSecaEmbed.jsx', 'src/host.js', 'src/data/oauthRelay.js']) {
      expect(FORA_DEL_NATIU, ruta).toContain(ruta);
    }
    expect(FORA_DEL_NATIU.filter((ruta) => ruta.startsWith('src/data/')).length).toBeGreaterThan(20);
    expect(DEL_NATIU).toContain(`${NATIU}/entrada.jsx`);
  });
});

describe('la frontera', () => {
  test('main.jsx, embed.jsx, PedraSecaEmbed.jsx, host.js i src/data/** no importen src/natiu/ ni Capacitor', () => {
    const peces = FORA_DEL_NATIU.filter((ruta) => ['src/main.jsx', 'src/embed.jsx', 'src/PedraSecaEmbed.jsx', 'src/host.js'].includes(ruta)
      || ruta.startsWith('src/data/'));
    expect(peces.length).toBeGreaterThan(24);
    expect(quinsArriben(peces)).toEqual([]);
  });

  test('la capa de dades no importa mai Capacitor: src/data/oauthRelay.js tampoc (§3.3)', () => {
    const relay = llig('src/data/oauthRelay.js');
    expect(especificadors(relay).filter(esCapacitor)).toEqual([]);
    expect(relay.includes(`${CAP}/`)).toBe(false);
  });

  test('cap altre fitxer de producció de src/ fora de src/natiu/ hi arriba (ni de rebot: src/natiu/ és un pou)', () => {
    expect(quinsArriben(FORA_DEL_NATIU)).toEqual([]);
  });

  test('les configuracions del web i del connector no nomenen l’entrada nativa, i el web continua entrant per main.jsx', () => {
    for (const config of ['vite.config.js', 'vite.standalone.config.js']) {
      const codi = llig(config);
      expect(codi.includes('src/natiu') || codi.includes(CAP), config).toBe(false);
    }
    expect(llig('vite.standalone.config.js')).toMatch(/entry:\s*path\.resolve\(__dirname,\s*'src\/embed\.jsx'\)/);
    expect(llig('index.html')).toContain('<script type="module" src="/src/main.jsx"></script>');
  });
});

describe('el natiu d’abans de la lease', () => {
  test('cap fitxer de producció de src/natiu/ importa Capacitor encara: no hi ha cap dependència instal·lada', () => {
    /* Després de la lease, esta prova canvia: només els adaptadors natius
       (obridorOAuth, sessioDuradora, duradorMagatzem…) en podran importar. */
    expect(DEL_NATIU.flatMap((ruta) => especificadors(llig(ruta)).filter(esCapacitor).map((e) => `${ruta}: ${e}`))).toEqual([]);
  });

  test('l’entrada nativa no exposa cap global, no registra cap worker ni toca l’emmagatzematge directe', () => {
    const codi = llig(`${NATIU}/entrada.jsx`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(codi).not.toMatch(/exposaGlobal|pwa\/registre/);
    expect(codi).not.toMatch(new RegExp(['service', 'Worker|local', 'Storage|session', 'Storage'].join('')));
    expect(codi).not.toMatch(/\b(?:window|globalThis)(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])\s*=(?!=)/);
    expect(codi).toMatch(/dataMode: 'remote'/);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, als fitxers de l’app nativa', async () => {
    const fitxers = ['vite.natiu.config.js', 'tests/natiu-build.test.mjs', ...fitxersDe(NATIU)];
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(fitxers.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(fitxers.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa també dins de src/natiu/.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, `${NATIU}/sonda.js`) });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});
