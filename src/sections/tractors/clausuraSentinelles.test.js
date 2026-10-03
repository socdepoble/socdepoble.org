// @vitest-environment node
/* Clausura de l'empremta dels sentinelles (com clausura.test.js per a la
   Gestoria). Des de l'entrada de la UI (PanellSentinelles.jsx) i des del
   mòdul de cada sentinella es resseguixen les importacions relatives,
   estàtiques i dinàmiques. Tot fitxer de producció dels carrils que s'executa
   per a un sentinella ha d'estar a les seues fonts: si canvia, l'aprovació
   deixa de valdre. A més, cap mòdul ni cap fitxa de sentinella pot quedar
   fora del registre, i cada font, fitxa i prova declarades existixen. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { parse } from '@babel/parser';
import { SENTINELLES } from './registreSentinelles.js';

const ARREL = process.cwd();
const GESTORIA = 'src/sections/gestoria';
const TRACTORS = 'src/sections/tractors';
const CARRIL = `${TRACTORS}/sentinelles`;
const ENTRADA = `${TRACTORS}/PanellSentinelles.jsx`;
/* Peces del carril que no són cap sentinella: el contracte, el corredor i les comunes. */
const PECES_COMUNES = Object.freeze([`${CARRIL}/comu.js`, `${CARRIL}/contracte.js`, `${CARRIL}/executa.js`]);

/* Del graf però fora de les fonts, a propòsit. */
const LLISTA_BLANCA = Object.freeze({
  [`${GESTORIA}/tractors.js`]: 'Són els manifests de la Gestoria: registreTractors.js els importa per al seu catàleg, i cap sentinella no els executa.'
});

const esProva = (ruta) => /\.test\.[cm]?jsx?$/.test(ruta) || ruta.includes('/__fixtures__/');
const dinsCarrils = (ruta) => ruta.startsWith(`${GESTORIA}/`) || ruta.startsWith(`${TRACTORS}/`);
const existix = (ruta) => existsSync(path.join(ARREL, ruta));
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

/* Els especificadors d'importació: estàtica, reexportació, d'efecte i dinàmica (literal). */
function especificadors(codi) {
  const ast = parse(codi, { sourceType: 'module', plugins: ['jsx'], createImportExpressions: true });
  const imports = [];
  const visita = (node) => {
    if (!node || typeof node !== 'object') return;
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) {
      imports.push(node.source.value);
    } else if (node.type === 'ImportExpression') {
      const font = node.source;
      const valor = font.type === 'StringLiteral' ? font.value
        : font.type === 'TemplateLiteral' && font.expressions.length === 0 ? font.quasis[0].value.cooked : null;
      if (typeof valor !== 'string') throw new Error('Importació dinàmica no literal: cal un camí explícit per al cens de l’empremta.');
      imports.push(valor);
    }
    for (const valor of Object.values(node)) {
      if (Array.isArray(valor)) valor.forEach((fill) => { if (fill?.type) visita(fill); });
      else if (valor?.type) visita(valor);
    }
  };
  visita(ast.program);
  return imports;
}

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

function fitxersDe(directori, extensio = /\.(?:m?js|jsx)$/) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta, extensio));
    else if (extensio.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const { fitxers: GRAF, importacions: IMPORTACIONS } = clausura([ENTRADA]);
const COBERTES = new Set(SENTINELLES.flatMap((s) => s.manifest.fonts));
const MODULS = fitxersDe(CARRIL).filter((ruta) => !esProva(ruta) && !PECES_COMUNES.includes(ruta) && llig(ruta).includes('definixSentinella('));
/* El mòdul de cada sentinella: l'única de les seues fonts que el definix. */
const modulDe = (s) => s.manifest.fonts.filter((ruta) => MODULS.includes(ruta));
/* La porta i la UI que fan servir tots: el graf de l'entrada dins de tractors/, sense els mòduls dels sentinelles. */
const PORTA = GRAF.filter((ruta) => ruta.startsWith(`${TRACTORS}/`) && !esProva(ruta) && !MODULS.includes(ruta) && !ruta.startsWith(`${CARRIL}/`));

describe('el lector d’importacions', () => {
  test('rebutja un import calculat que no pot incloure al cens', () => {
    expect(() => especificadors('await import(`./${nom}.js`);')).toThrow(/Importació dinàmica no literal/);
    expect(especificadors("export * from './a.js';\nawait import('./b.js');")).toEqual(['./a.js', './b.js']);
  });
});

describe('la clausura des del panell', () => {
  test('el graf arriba a cada sentinella, al corredor, al contracte i a la porta', () => {
    for (const esperat of [
      ...MODULS, ...PECES_COMUNES, `${TRACTORS}/registreSentinelles.js`, `${TRACTORS}/PanellTractors.jsx`,
      `${TRACTORS}/useTractors.js`, `${TRACTORS}/DialegAprovacio.jsx`, `${TRACTORS}/nucli/aprovacio.js`, `${GESTORIA}/nucli/concilia.js`
    ]) expect(GRAF, esperat).toContain(esperat);
  });

  test('cada importació relativa dins dels carrils apunta a un fitxer que existix', () => {
    expect(IMPORTACIONS.filter(({ desti }) => dinsCarrils(desti) && !existix(desti))).toEqual([]);
  });

  test('cada fitxer de producció del graf és a les fonts d’algun sentinella o a la llista blanca', () => {
    expect(GRAF.filter((ruta) => dinsCarrils(ruta) && !esProva(ruta) && !COBERTES.has(ruta) && !(ruta in LLISTA_BLANCA))).toEqual([]);
  });

  test('la llista blanca és justa: existix, és al graf, no és a cap font i porta motiu', () => {
    for (const [ruta, motiu] of Object.entries(LLISTA_BLANCA)) {
      expect(existix(ruta), ruta).toBe(true);
      expect(GRAF, ruta).toContain(ruta);
      expect(COBERTES.has(ruta), ruta).toBe(false);
      expect(motiu.length, ruta).toBeGreaterThan(20);
    }
  });

  test('cap fitxer de producció importa proves ni suport de proves', () => {
    expect(IMPORTACIONS.filter(({ des, desti }) => !esProva(des) && (esProva(desti) || desti.startsWith('tests/')))).toEqual([]);
  });
});

describe('cada sentinella', () => {
  test.each(SENTINELLES.map((s) => [s.id, s]))('%s: un sol mòdul, i la seua clausura, la porta i les peces comunes són a les fonts', (_id, s) => {
    const [modul, ...sobrants] = modulDe(s);
    expect(sobrants, s.id).toEqual([]);
    expect(modul, s.id).toBeDefined();
    const propia = clausura([modul]).fitxers.filter((ruta) => dinsCarrils(ruta) && !esProva(ruta));
    const falten = [...new Set([...propia, ...PORTA, ...PECES_COMUNES])].filter((ruta) => !s.manifest.fonts.includes(ruta));
    expect(falten, s.id).toEqual([]);
  });

  test.each(SENTINELLES.map((s) => [s.id, s]))('%s: cada font, la fitxa i cada prova declarades existixen', (_id, s) => {
    expect(s.manifest.fonts.filter((ruta) => !existix(ruta)), s.id).toEqual([]);
    expect(existix(s.manifest.fitxa), s.manifest.fitxa).toBe(true);
    expect(s.proves.filter((ruta) => !existix(ruta)), s.id).toEqual([]);
  });
});

describe('cap sentinella fora del registre', () => {
  test('cada mòdul que definix un sentinella és d’un sentinella registrat, i només d’un', () => {
    expect(MODULS).toHaveLength(SENTINELLES.length);
    expect(SENTINELLES.flatMap(modulDe).sort()).toEqual([...MODULS].sort());
  });

  test('cada fitxer de producció del carril és font d’algun sentinella', () => {
    expect(fitxersDe(CARRIL).filter((ruta) => !esProva(ruta) && !COBERTES.has(ruta))).toEqual([]);
  });

  test('cada fitxa és la d’un sentinella registrat', () => {
    const fitxes = fitxersDe(`${CARRIL}/fitxes`, /\.md$/);
    expect(fitxes.sort()).toEqual(SENTINELLES.map((s) => s.manifest.fitxa).sort());
  });
});
