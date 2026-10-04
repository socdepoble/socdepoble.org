// @vitest-environment node
/* Front «amfitrio-admin» (integració final, ordre del Mestre 261004) ·
   Higiene d'amfitrió (WordPress i Sollutia) i Admin: ESLint amb la
   configuració del projecte i zero missatges, avisos inclosos (l'equivalent
   de --max-warnings=0), als fitxers que toca el front i a les seues proves.
   Patró de src/config/qualitat.amfitrio.test.js: els patrons vetats es
   componen a trossos perquè les portes que llegixen src/ no els troben ací. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const PRODUCCIO = [
  'src/sections/profile/DetallEspai.jsx',
  'src/sections/profile/utilitatsActives.js',
  'src/sections/control/ControlSection.jsx',
  'src/sections/detail/PageDetailSection.jsx',
  'src/sections/consola/ConsolaSection.jsx',
  'src/sections/consola/consolaContent.js',
  'src/sections/consola/mapa/mapaContent.js',
  'src/sections/consola/mapa/useMapa.js',
  'src/components/universal/richText/extensions/slash.js',
  'src/config/navigation.js',
  'src/sections/xat/XatSection.jsx',
  'src/sections/admin/AdminSection.jsx'
];
const PROVES = [
  'src/sections/profile/DetallEspai.utilitats.test.jsx',
  'src/sections/control/ControlSection.espais.test.jsx',
  'src/sections/detail/PageDetailSection.test.jsx',
  'src/sections/consola/ConsolaSection.produccio.test.jsx',
  'src/components/universal/richText/extensions/slash.test.js',
  'src/config/navigation.autoria.test.js',
  'src/sections/xat/XatSection.test.jsx',
  'src/sections/admin/AdminSection.amfitrio.test.jsx',
  'src/config/qualitat.amfitrioAdmin.test.js'
];

describe('ESLint del front «amfitrio-admin»', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const tots = [...PRODUCCIO, ...PROVES];
    const resultats = await eslint.lintFiles(tots.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(tots.length);
    expect(missatges).toEqual([]);
  }, 120000);
});

describe('per text', () => {
  test('cap esdeveniment sintètic a la finestra de l’amfitrió: ni «storage» fals ni la nota creada', () => {
    const vetats = [
      new RegExp(['new Event\\(\\s*[\'"]stor', 'age[\'"]'].join('')),
      new RegExp(['[\'"]sdp:note-cre', 'ated[\'"]'].join(''))
    ];
    const trobats = PRODUCCIO.flatMap((fitxer) => {
      const codi = senseComentaris(llig(fitxer));
      return vetats.filter((patro) => patro.test(codi)).map((patro) => `${fitxer}: ${patro}`);
    });
    expect(trobats).toEqual([]);
  });
});
