// @vitest-environment node
/* Clausura de l'empremta (revisió adversarial 261002: seguretat-01 i
   governanca-02). Des de les dues entrades de la Gestoria, la UI
   (ContenidorGestoria.jsx) i el tractor (nucli/tractor.js), es resseguixen
   les importacions relatives, estàtiques i dinàmiques. Cada fitxer de
   producció dels dos carrils (gestoria/ i tractors/) que hi apareix
   s'executa amb accés a les dades o aplica una aprovació: ha d'estar a les
   fonts d'algun manifest, perquè si canvia, l'empremta aprovada deixe de
   valdre. Les excepcions van a la llista blanca, cadascuna amb el motiu.

   També es comprova on viu el suport de proves (governanca-01): fora de
   src/, a tests/helpers/, perquè la porta Pedra Seca (LLEI_08) no el compte
   com un subarbre orfe i cap fitxer de producció el puga importar. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { parse } from '@babel/parser';
import { TRACTOR_CORREUS, TRACTOR_FACTURES, TRACTOR_TAULER } from '../gestoria/tractors.js';

const ARREL = process.cwd();
const GESTORIA = 'src/sections/gestoria';
const TRACTORS = 'src/sections/tractors';
/* Onada 2, pas 1 (ordre del Mestre del 261004, aprovat al xat): la closca de
   la Gestoria i el tractor del Tauler també són entrades, i el seu manifest
   ('gestoria.tauler') cobrix el que hi penja i no és dels dos signats. */
const ENTRADES_TAULER = Object.freeze([`${GESTORIA}/tauler/ShellGestoria.jsx`, `${GESTORIA}/tauler/nucli/tractorTauler.js`]);
const ENTRADES = Object.freeze([`${GESTORIA}/ContenidorGestoria.jsx`, `${GESTORIA}/nucli/tractor.js`, ...ENTRADES_TAULER]);

/* Del graf però fora de les fonts, a propòsit. */
const LLISTA_BLANCA = Object.freeze({
  [`${GESTORIA}/tractors.js`]: 'Són els manifests: calculaEmpremta en resumix els valors sencers (manifestNet) i el mòdul només els exporta congelats.'
});

/* La porta sencera i la UI que la fa servir: les dos aprovacions humanes
   passen per ací, siga quin siga el tractor. */
const COMUNS = Object.freeze([
  `${TRACTORS}/DialegAprovacio.jsx`,
  `${TRACTORS}/PanellTractors.jsx`,
  `${TRACTORS}/registreTractors.js`,
  `${TRACTORS}/useTractors.js`,
  `${GESTORIA}/ContenidorGestoria.jsx`,
  `${GESTORIA}/PanellGestoria.jsx`,
  `${GESTORIA}/useGestoria.js`
]);

/* LLEI_08: proves que encara importen el suport de dins de src/. Ja estan
   totes repuntades a tests/helpers/ (261002): la llista queda buida i només
   s'hi podria tornar a afegir una entrada amb motiu escrit. */
const PENDENTS_DE_REPUNTAR = Object.freeze([]);

const esProva = (ruta) => /\.test\.[cm]?jsx?$/.test(ruta) || ruta.includes('/__fixtures__/');
const dinsCarrils = (ruta) => ruta.startsWith(`${GESTORIA}/`) || ruta.startsWith(`${TRACTORS}/`);
const existix = (ruta) => existsSync(path.join(ARREL, ruta));
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

/* Els especificadors d'importació: estàtica (també en diverses línies),
   reexportació, d'efecte i dinàmica. */
function especificadors(codi) {
  const ast = parse(codi, { sourceType: 'module', plugins: ['jsx'], createImportExpressions: true });
  const imports = [];
  const visita = (node) => {
    if (!node || typeof node !== 'object') return;
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) {
      imports.push({ inici: node.start, valor: node.source.value });
    } else if (node.type === 'ImportExpression') {
      const font = node.source;
      const valor = font.type === 'StringLiteral' ? font.value
        : font.type === 'TemplateLiteral' && font.expressions.length === 0 ? font.quasis[0].value.cooked : null;
      if (typeof valor !== 'string') throw new Error('Importació dinàmica no literal: cal un camí explícit per al cens de l’empremta.');
      imports.push({ inici: node.start, valor });
    }
    for (const valor of Object.values(node)) {
      if (Array.isArray(valor)) valor.forEach((fill) => { if (fill?.type) visita(fill); });
      else if (valor?.type) visita(valor);
    }
  };
  visita(ast.program);
  return imports.sort((a, b) => a.inici - b.inici).map(({ valor }) => valor);
}

/* Un especificador relatiu, resolt des de l'arrel del repositori, amb les
   extensions que completa Vite; la consulta (?raw) no canvia el fitxer. */
function resol(des, especificador) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(des), especificador.split('?')[0]));
  const candidats = [base, `${base}.js`, `${base}.jsx`, `${base}/index.js`, `${base}/index.jsx`];
  return candidats.find((ruta) => /\.(?:m?js|jsx)$/.test(ruta) && existix(ruta)) ?? base;
}

function clausura(entrades) {
  const vistos = new Set();
  const importacions = [];
  const pendents = [...entrades];
  while (pendents.length) {
    const ruta = pendents.pop();
    if (vistos.has(ruta)) continue;
    vistos.add(ruta);
    for (const especificador of especificadors(llig(ruta))) {
      if (!especificador.startsWith('.')) continue;
      const desti = resol(ruta, especificador);
      importacions.push({ des: ruta, especificador, desti });
      if (dinsCarrils(desti) && existix(desti) && !esProva(desti)) pendents.push(desti);
    }
  }
  return { fitxers: [...vistos].sort(), importacions };
}

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.(?:m?js|jsx)$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers;
}

const { fitxers: GRAF, importacions: IMPORTACIONS } = clausura(ENTRADES);
const COBERTES = new Set([...TRACTOR_FACTURES.fonts, ...TRACTOR_CORREUS.fonts, ...TRACTOR_TAULER.fonts]);

describe('el lector d’importacions', () => {

  test('l’AST llig comentaris dins d’import() i plantilles literals, sense confondre text amb codi', () => {
    const codi = [
      "const text = \"import('./fals.js')\";",
      "// import './comentari.js';",
      "await import(/* chunk */ './real.js');",
      'await import(`./literal.js`);',
      "export * from './exportat.js';"
    ].join('\n');
    expect(especificadors(codi)).toEqual(['./real.js', './literal.js', './exportat.js']);
  });

  test.each([
    "const ruta = './variable.js'; await import(ruta);",
    'await import(`./${nom}.js`);',
    "await import('./' + nom + '.js');"
  ])('rebutja un import calculat que no pot incloure al cens: %s', (codi) => {
    expect(() => especificadors(codi)).toThrow(/Importació dinàmica no literal/);
  });

  test('troba les estàtiques en diverses línies, les dinàmiques, les reexportacions i les d’efecte', () => {
    const codi = [
      'import {',
      '  a, b',
      "} from './a.js';",
      "export { c } from '../c.jsx';",
      "import './estil.css';",
      "const d = await import('./d.js');",
      "import fitxa from './fitxa.md?raw';",
      '// Les importacions estàtiques són de la base; import() dinàmic després.'
    ].join('\n');
    expect(especificadors(codi)).toEqual(['./a.js', '../c.jsx', './estil.css', './d.js', './fitxa.md?raw']);
  });
});

describe('la clausura des de les entrades de la Gestoria', () => {
  test('el graf arriba a la UI, a la porta i als mòduls que es carreguen després d’aprovar', () => {
    for (const esperat of [
      `${GESTORIA}/useGestoria.js`, `${GESTORIA}/PanellGestoria.jsx`, `${GESTORIA}/VistaPreviaFull.jsx`,
      `${GESTORIA}/enviament/EnviamentGestoria.jsx`, `${GESTORIA}/enviament/correuGestoria.js`,
      `${TRACTORS}/useTractors.js`, `${TRACTORS}/registreTractors.js`, `${TRACTORS}/DialegAprovacio.jsx`,
      `${TRACTORS}/nucli/aprovacio.js`, `${GESTORIA}/nucli/correus.js`, `${GESTORIA}/nucli/pdfText.js`,
      `${GESTORIA}/nucli/fullModel.js`
    ]) expect(GRAF, esperat).toContain(esperat);
  });

  test('cada importació relativa dins dels carrils apunta a un fitxer que existix', () => {
    expect(IMPORTACIONS.filter(({ desti }) => dinsCarrils(desti) && !existix(desti))).toEqual([]);
  });

  test('cada fitxer de producció del graf és a les fonts d’algun manifest o a la llista blanca', () => {
    const fora = GRAF.filter((ruta) => dinsCarrils(ruta) && !esProva(ruta) && !COBERTES.has(ruta) && !(ruta in LLISTA_BLANCA));
    expect(fora).toEqual([]);
  });

  test('el que només declara el tractor de correus és el codi del correu', () => {
    const nomesCorreus = TRACTOR_CORREUS.fonts.filter((ruta) => !TRACTOR_FACTURES.fonts.includes(ruta));
    expect(nomesCorreus).toEqual([`${GESTORIA}/nucli/correus.js`]);
  });

  test('la porta sencera i la UI comuna són a les fonts dels dos manifests', () => {
    const portaDelGraf = GRAF.filter((ruta) => ruta.startsWith(`${TRACTORS}/`) && !esProva(ruta));
    for (const manifest of [TRACTOR_FACTURES, TRACTOR_CORREUS]) {
      const falten = [...new Set([...COMUNS, ...portaDelGraf])].filter((ruta) => !manifest.fonts.includes(ruta));
      expect(falten, manifest.id).toEqual([]);
    }
  });

  test('el Tauler: el seu graf és a les fonts del seu manifest (o a les dels dos signats), amb la porta sencera', () => {
    const { fitxers } = clausura(ENTRADES_TAULER);
    const delsSignats = new Set([...TRACTOR_FACTURES.fonts, ...TRACTOR_CORREUS.fonts]);
    const fora = fitxers.filter((ruta) => dinsCarrils(ruta) && !esProva(ruta) && !TRACTOR_TAULER.fonts.includes(ruta)
      && !delsSignats.has(ruta) && !(ruta in LLISTA_BLANCA));
    expect(fora).toEqual([]);
    const porta = fitxers.filter((ruta) => ruta.startsWith(`${TRACTORS}/`) && !esProva(ruta));
    expect(porta.length).toBeGreaterThan(5);
    expect(porta.filter((ruta) => !TRACTOR_TAULER.fonts.includes(ruta))).toEqual([]);
    expect(fitxers).toContain(`${GESTORIA}/nucli/c43.js`);
    expect(fitxers).toContain(`${GESTORIA}/ContenidorGestoria.jsx`);
  });

  test('cap fitxer del Tauler ni de les estimacions és font dels dos tractors signats: les seues empremtes no canvien', () => {
    const delsSignats = [...TRACTOR_FACTURES.fonts, ...TRACTOR_CORREUS.fonts];
    expect(delsSignats.filter((ruta) => ruta.startsWith(`${GESTORIA}/tauler/`) || ruta.startsWith(`${GESTORIA}/impostos/`))).toEqual([]);
    expect(TRACTOR_TAULER.fonts.filter((ruta) => ruta.startsWith(`${GESTORIA}/tauler/`))).toEqual([
      `${GESTORIA}/tauler/ShellGestoria.jsx`, `${GESTORIA}/tauler/TargetaTauler.jsx`, `${GESTORIA}/tauler/Tauler.jsx`,
      `${GESTORIA}/tauler/nucli/resumTauler.js`, `${GESTORIA}/tauler/nucli/targetesTauler.js`, `${GESTORIA}/tauler/nucli/tractorTauler.js`,
      `${GESTORIA}/tauler/useTauler.js`
    ]);
  });

  test('la llista blanca és justa: cada entrada existix, és al graf, no és a cap font i porta motiu', () => {
    for (const [ruta, motiu] of Object.entries(LLISTA_BLANCA)) {
      expect(existix(ruta), ruta).toBe(true);
      expect(GRAF, ruta).toContain(ruta);
      expect(COBERTES.has(ruta), ruta).toBe(false);
      expect(motiu.length, ruta).toBeGreaterThan(20);
    }
  });
});

describe('el suport de proves viu fora de src/', () => {
  test('cap fitxer de producció del graf importa proves ni suport de proves', () => {
    const suport = IMPORTACIONS.filter(({ des, desti }) => !esProva(des) && (esProva(desti) || desti.startsWith('tests/')));
    expect(suport).toEqual([]);
  });

  test('LLEI_08: cap prova dels carrils importa suport de dins de src/, llevat de les pendents de repuntar', () => {
    const importadors = [...fitxersDe(GESTORIA), ...fitxersDe(TRACTORS)].filter(esProva).filter((ruta) => especificadors(llig(ruta))
      .some((especificador) => especificador.startsWith('.') && resol(ruta, especificador).includes('/__fixtures__/')));
    expect(importadors.filter((ruta) => !PENDENTS_DE_REPUNTAR.includes(ruta))).toEqual([]);
  });

  test('el suport de tests/helpers/ és el mateix autenticador que el de __fixtures__', () => {
    const nou = llig('tests/helpers/autenticadorSimulat.js');
    expect(nou).toContain('export async function creaAutenticadorSimulat(');
    expect(especificadors(nou).map((especificador) => resol('tests/helpers/autenticadorSimulat.js', especificador))).toEqual([
      `${TRACTORS}/nucli/aprovacio.js`, `${TRACTORS}/nucli/canonic.js`, `${TRACTORS}/nucli/webauthn.js`
    ]);
  });
});
