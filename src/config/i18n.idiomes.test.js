/**
 * Fase D (261020, tasca 4.1) · L1 · El contracte dels cinc diccionaris de src/config/idiomes/.
 *  · Forma: un fitxer per llengua del selector, `export default {` i una clau
 *    per línia; cap clau repetida (un objecte literal la trepitjaria en silenci).
 *  · Paritat: tota clau del valencià és a les altres quatre, cap valor buit
 *    (LLEI_07 de tractor-pedra-seca fa el mateix sobre el text).
 *  · Peresa: només i18n.js els importa; el valencià, estàticament, i els altres
 *    quatre, amb un import() literal cadascun. i18n.js ja no porta cap
 *    diccionari. Cap altre fitxer de producció nomena la carpeta (cap import
 *    estàtic, cap plantilla, cap import.meta.glob): els tornaria a ficar al
 *    tros d'entrada.
 *  · Proves: tota prova que tradueix a una llengua que no és el valencià
 *    importa tests/helpers/diccionaris.js; si no, passaria en buit (el
 *    traductor tornaria el valencià i la prova compararia valencià amb valencià).
 *  · ESLint a zero, i cada fitxer acaba amb salt de línia.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';
import { IDIOMES_DIFERITS, SUPPORTED_LANGUAGES } from './i18n.js';
import CA from './idiomes/ca.js';
import ES from './idiomes/es.js';
import EN from './idiomes/en.js';
import EU from './idiomes/eu.js';
import GL from './idiomes/gl.js';

const ARREL = process.cwd();
const llig = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');
const CODIS = SUPPORTED_LANGUAGES.map((l) => l.code);
const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
const rutaDe = (codi) => `src/config/idiomes/${codi}.js`;

function fitxers(dir, acc = []) {
  for (const e of readdirSync(path.join(ARREL, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) fitxers(rel, acc);
    else if (/\.(?:js|jsx|mjs)$/.test(e.name)) acc.push(rel);
  }
  return acc;
}
const esProva = (rel) => /\.test\.[jt]sx?$/.test(rel);
const TOTS = fitxers('src');
const PRODUCCIO = TOTS.filter((rel) => !esProva(rel));

describe('forma i paritat', () => {
  test('un diccionari per llengua del selector, i res més a la carpeta', () => {
    expect(readdirSync(path.join(ARREL, 'src/config/idiomes')).sort()).toEqual(CODIS.map((c) => `${c}.js`).sort());
    expect(Object.keys(DICCIONARIS).sort()).toEqual([...CODIS].sort());
  });

  test.each(CODIS)('%s: export default d’un objecte, una clau per línia, cap de repetida', (codi) => {
    const font = llig(rutaDe(codi));
    expect(font).toMatch(/^export default \{$/m);
    expect(font.endsWith('};\n')).toBe(true);
    expect(font.slice(0, font.indexOf('export default {'))).not.toMatch(/[{}]/);
    const claus = [...font.matchAll(/^ {2}'([^']+)'\s*:/gm)].map((m) => m[1]);
    expect(claus.length).toBe(Object.keys(DICCIONARIS[codi]).length);
    expect(claus.filter((clau, i) => claus.indexOf(clau) !== i)).toEqual([]);
  });

  test.each(IDIOMES_DIFERITS)('%s: té totes les claus del valencià, cap buida', (codi) => {
    const dic = DICCIONARIS[codi];
    expect(Object.keys(CA).filter((clau) => !Object.hasOwn(dic, clau))).toEqual([]);
    expect(Object.entries(dic).filter(([, valor]) => typeof valor !== 'string' || valor.trim() === '').map(([clau]) => clau)).toEqual([]);
  });

  test('cap valor buit al valencià', () => {
    expect(Object.entries(CA).filter(([, valor]) => typeof valor !== 'string' || valor.trim() === '').map(([clau]) => clau)).toEqual([]);
  });

  /* Corrector del Gauntlet f4 (30-10-2026, i18n-sense-paritat-de-marcadors-nav)
     · Cada traducció porta els mateixos marcadors ({nom}, {n}, {llengua}…)
     que el valencià. Sense, el text perd la peça que s'hi interpola: un
     nav.replegaColumna sense {nom} faria dos botons «Pregar» iguals, sense el
     nom de la columna (WCAG 2.4.6 i 4.1.2), i cap prova ho veia. Les
     excepcions, en una llista tancada: section.traduir.traduint porta
     {llengua} només en valencià. Si una excepció deixa de divergir, ix de la
     llista (la segona prova). */
  const MARCADORS_DIVERGENTS = new Set(['section.traduir.traduint']);
  const marcadorsDe = (text) => [...new Set(String(text).match(/\{\w+\}/g) ?? [])].sort().join(' ');
  const divergents = (dic) => Object.keys(CA)
    .filter((clau) => Object.hasOwn(dic, clau) && marcadorsDe(CA[clau]) !== marcadorsDe(dic[clau]));

  test.each(IDIOMES_DIFERITS)('%s: cada clau porta els mateixos marcadors {…} que el valencià', (codi) => {
    expect(divergents(DICCIONARIS[codi]).filter((clau) => !MARCADORS_DIVERGENTS.has(clau))).toEqual([]);
  });

  test('les excepcions de marcadors divergixen de veres en alguna llengua', () => {
    const totes = new Set(IDIOMES_DIFERITS.flatMap((codi) => divergents(DICCIONARIS[codi])));
    expect([...MARCADORS_DIVERGENTS].filter((clau) => !totes.has(clau))).toEqual([]);
  });
});

describe('peresa', () => {
  test('i18n.js importa el valencià estàticament i les altres quatre amb un import() literal cadascuna', () => {
    const font = llig('src/config/i18n.js');
    expect(font).toMatch(/^import CA from '\.\/idiomes\/ca\.js';$/m);
    const dinamics = [...font.matchAll(/import\(\s*'\.\/idiomes\/([a-z]{2})\.js'\s*\)/g)].map((m) => m[1]);
    expect(dinamics.sort()).toEqual([...IDIOMES_DIFERITS].sort());
    expect(font).not.toMatch(/^import\s[^;]*idiomes\/(?:es|en|eu|gl)\.js/m);
    /* El comentari del bloc L1 nomena import.meta.glob per a vetar-lo: es mira el codi. */
    expect(font.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')).not.toMatch(/import\.meta\.glob/);
  });

  test('i18n.js ja no porta cap diccionari: ni TRANSLATIONS ni línies de clau', () => {
    const font = llig('src/config/i18n.js');
    expect(font).not.toMatch(/\bTRANSLATIONS\b/);
    expect(font).not.toMatch(/^\s*['"][\w.-]+['"]\s*:/m);
  });

  test('cap altre fitxer de producció nomena la carpeta dels diccionaris', () => {
    const nomenen = PRODUCCIO.filter((rel) => rel !== 'src/config/i18n.js' && !rel.startsWith('src/config/idiomes/'))
      .filter((rel) => {
        const font = llig(rel);
        return /(['"`])[^'"`\n]*idiomes\/[^'"`\n]*\1/.test(font) || /import\.meta\.glob\([^)]*idiomes/.test(font);
      });
    expect(nomenen).toEqual([]);
  });

  test('cap fitxer de producció crida createTranslator amb una llengua literal que no siga el valencià', () => {
    const crides = PRODUCCIO
      .flatMap((rel) => [...llig(rel).matchAll(/createTranslator\(\s*'(?!ca')([^']*)'/g)].map((m) => `${rel}: ${m[1]}`));
    expect(crides).toEqual([]);
  });

  test('tota prova que tradueix a una llengua que no és el valencià importa els cinc diccionaris', () => {
    /* Les que proven la càrrega sota demanda comencen, a posta, amb el valencià
       tot sol (natiu/entrada.test.jsx prova que el primer pintat espera el
       diccionari d'una tria desada). */
    const A_POSTA = new Set([
      'src/config/i18n.diferit.test.js', 'src/app/contexts/UIContext.diferit.test.jsx', 'src/app/App.arrelContrast.test.jsx',
      'src/config/i18n.idiomes.test.js', 'src/natiu/entrada.test.jsx'
    ]);
    const sense = TOTS.filter((rel) => esProva(rel) && !A_POSTA.has(rel)).filter((rel) => {
      const font = llig(rel);
      const tradueix = /createTranslator\(\s*(?!'ca'\s*\))/.test(font)
        || /getSectionLabels\([^)]*'(?:es|en|eu|gl)'/.test(font)
        || /(?:setLanguage|desaIdiomaTriat)\(\s*'(?:es|en|eu|gl)'/.test(font)
        || (/language\s*[:=]\s*\{?\s*['"](?:es|en|eu|gl)['"]/.test(font) && /<(?:UIProvider|PedraSecaEmbed)\b/.test(font));
      return tradueix && !/tests\/helpers\/diccionaris\.js'/.test(font);
    });
    expect(sense).toEqual([]);
  });
});

describe('ESLint', () => {
  test('zero missatges als diccionaris, a i18n.js i al suport de proves', async () => {
    const rutes = [...CODIS.map(rutaDe), 'src/config/i18n.js', 'tests/helpers/diccionaris.js'];
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(rutes.map((rel) => path.join(ARREL, rel)));
    expect(resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} ${m.ruleId} ${m.message}`))).toEqual([]);
    for (const rel of rutes) expect([rel, llig(rel).endsWith('\n')]).toEqual([rel, true]);
  }, 60000);
});
