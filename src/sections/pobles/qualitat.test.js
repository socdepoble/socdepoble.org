// @vitest-environment node
/* Onada 6 (pàgina del poble, revisió adversarial) · Qualitat dels mòduls del
   front «pobles»: ESLint amb la configuració del projecte i zero missatges
   (avisos inclosos, l'equivalent de --max-warnings=0), les comprovacions de
   Pedra Seca per text i l'ordre del Mestre (prompt 261009_0230, punt 6: cap
   nom de poble escrit al codi) sobre els mòduls nous de la pestanya «Gent de
   …», del xat de la gent i del naixement. Fins ara cap porta d'ESLint cobria
   estos fitxers. Calcada de src/sections/xat/qualitat.test.js. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';
import { MOCK_TOWNS } from './townsSeed.js';

const ARREL = process.cwd();

/* Els mòduls nous del front i les seues proves, i les peces del front que
   cap altra porta qualitat no lint (PoblesSection, els noms, la Viquipèdia,
   el poble de l'amfitrió, l'autoria de la nota, les Pestanyes). */
const MODULS_NOUS = Object.freeze([
  'src/sections/pobles/clauDelPoble.js',
  'src/sections/pobles/publicacionsDelPoble.js',
  'src/sections/pobles/xatDelPoble.js',
  'src/sections/pobles/usePublicacionsDelPoble.js',
  'src/sections/pobles/PublicacionsDelPoble.jsx',
  /* P1-11 (pla 261024_2230, T5B-01) · La pestanya «Empreses i entitats». */
  'src/sections/pobles/useEntitatsDelPoble.js',
  'src/sections/pobles/EntitatsDelPoble.jsx'
]);
const FITXERS = Object.freeze([
  ...MODULS_NOUS,
  'src/sections/pobles/publicacionsDelPoble.test.js',
  'src/sections/pobles/xatDelPoble.test.js',
  'src/sections/pobles/PublicacionsDelPoble.test.jsx',
  'src/sections/pobles/EntitatsDelPoble.test.jsx',
  'src/sections/pobles/PoblesSection.jsx',
  'src/sections/pobles/PoblesSection.test.jsx',
  'src/sections/pobles/nomsDelPoble.js',
  'src/sections/pobles/nomsDelPoble.test.js',
  'src/sections/pobles/pobleDeViquipedia.js',
  'src/sections/pobles/pobleDeViquipedia.test.js',
  'src/sections/pobles/seedSql.pobles.test.js',
  'src/sections/pobles/qualitat.test.js',
  'src/sections/detail/detailSectionMeta.pobleDiferit.test.jsx',
  'src/sections/xat/pobleAmfitrio.js',
  'src/sections/xat/pobleAmfitrio.test.js',
  'src/sections/notes/autoriaNota.js',
  'src/sections/notes/autoriaNota.test.js',
  'src/sections/notes/NotesContext.dataPublicacio.test.jsx',
  'src/components/PedraSeca/organismes/Pestanyes.jsx',
  'src/components/PedraSeca/organismes/Pestanyes.test.jsx'
]);

const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const esProva = (f) => /\.test\.jsx?$/.test(f);
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const escapa = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const entreCometes = (valor) => new RegExp(`['"\`]${escapa(valor)}['"\`]`);

describe('el cens', () => {
  test('tots els fitxers del lot existixen', () => {
    expect(FITXERS.filter((f) => !existsSync(path.join(ARREL, f)))).toEqual([]);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís compta com a error).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/pobles/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  /* Sobre el codi sense comentaris: un comentari pot nomenar el que no es fa
     servir (Pestanyes.jsx explica per què no hi ha justify-content: safe). */
  test('fora de proves: cap style=, cap hex, cap :has(), res fora del Baseline 2022', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [/:has\(/, ':has()'],
      [/justify-content:\s*safe/, 'justify-content: safe'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind']
    ];
    const trobats = FITXERS.filter((f) => !esProva(f)).flatMap((fitxer) => {
      const codi = senseComentaris(llig(fitxer));
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });
});

/* Ordre del Mestre (prompt 261009_0230, punt 6) · «si demà algú obri un poble
   nou, la pestanya de la seua gent ha de funcionar automàticament sense tocar
   ni una línia de codi»: cap id ni nom de poble de la llavor, amb cap
   delimitador, al codi dels mòduls nous (els comentaris en poden parlar). */
describe('cap poble escrit al codi', () => {
  test('cap id ni nom de la llavor entre cometes als mòduls nous', () => {
    const trobats = MODULS_NOUS.flatMap((fitxer) => {
      const codi = senseComentaris(llig(fitxer));
      return MOCK_TOWNS.flatMap((town) => [town.id, town.title, town.author].filter(Boolean))
        .filter((valor) => entreCometes(valor).test(codi))
        .map((valor) => `${fitxer}: ${valor}`);
    });
    expect(trobats).toEqual([]);
    // Sonda: el patró veu un nom entre cometes dobles i dins d'una plantilla.
    expect(entreCometes('Sella').test('const a = "Sella";')).toBe(true);
    expect(entreCometes('Gent de la Torre').test('const b = `Gent de la Torre`;')).toBe(true);
  });
});
