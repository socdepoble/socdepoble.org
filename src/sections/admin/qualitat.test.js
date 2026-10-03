// @vitest-environment node
/* Qualitat del Tauler d'administració i del seu bloc «Indicadors» (decisió
   del Mestre 261003, «Graphfy»). Patró de src/config/qualitat.amfitrio.test.js:
   ESLint amb la configuració del projecte i zero missatges (l'equivalent de
   --max-warnings=0), i comprovacions per text. Els patrons vetats es
   componen a trossos perquè les portes que llegixen src/ no els troben ací. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const DIR = 'src/sections/admin';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const PURS = [`${DIR}/indicadors.js`];
const VISTES = [`${DIR}/AdminSection.jsx`, `${DIR}/IndicadorsAdmin.jsx`];
const PRODUCCIO = [...VISTES, ...PURS];
const PROVES = [
  `${DIR}/AdminSection.test.jsx`,
  `${DIR}/IndicadorsAdmin.test.jsx`,
  `${DIR}/indicadors.test.js`,
  `${DIR}/qualitat.test.js`
];
const TOTS = [...PRODUCCIO, ...PROVES];
const NOUS = [`${DIR}/IndicadorsAdmin.jsx`, ...PURS];

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers de la secció', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, `${DIR}/sonda.js`) });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('per text', () => {
  test('cap caràcter de control, invisible ni bidi en cru', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF]];
    const car = (cp) => String.fromCodePoint(cp);
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const fitxer of TOTS) expect(re.test(llig(fitxer)), fitxer).toBe(false);
  });

  test('producció: res fora del Baseline 2022, cap lookbehind, cap emmagatzematge directe', () => {
    const vetats = [
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind'],
      [new RegExp(['local', 'Storage|session', 'Storage'].join('')), 'emmagatzematge directe']
    ];
    const trobats = PRODUCCIO.flatMap((fitxer) => {
      const codi = senseComentaris(llig(fitxer));
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });

  test('l’agregació és pura: no llig el rellotge ni el navegador, i només importa la zona per defecte', () => {
    const impurs = new RegExp(['Date\\.', 'now\\(|new Date\\(\\)|import\\.', 'meta|\\bwin', 'dow\\.|\\bdocu', 'ment\\.|\\bglobal', 'This\\b|\\bfet', 'ch\\('].join(''));
    for (const fitxer of PURS) {
      const codi = senseComentaris(llig(fitxer));
      expect(impurs.test(codi), fitxer).toBe(false);
      expect([...codi.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]), fitxer).toEqual(['../../utils/esdeveniment.js']);
    }
  });

  test('Model B: el bloc nou parla amb el backend només pel port, i cap fitxer de la secció importa Supabase ni fa fetch', () => {
    const vetat = new RegExp(['supa', 'base|\\bfet', 'ch\\(|axi', 'os'].join(''), 'i');
    for (const fitxer of PRODUCCIO) {
      const imports = [...llig(fitxer).matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
      expect(imports.filter((i) => vetat.test(i)), fitxer).toEqual([]);
      expect(vetat.test(senseComentaris(llig(fitxer)).replace(/^import .*$/gm, '')), fitxer).toBe(false);
    }
    const imports = [...llig(`${DIR}/IndicadorsAdmin.jsx`).matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
    expect(imports).toEqual([
      'react', 'lucide-react', '../../components/layout/AppGridColumn', '../../components/PedraSeca/index.js',
      '../../data/backendPort.js', './indicadors.js'
    ]);
  });

  test('Pedra Seca: el bloc nou no porta ni style=, ni className, ni colors crus', () => {
    const estil = new RegExp(['\\bsty', 'le='].join(''));
    const classe = new RegExp(['\\bclass', 'Name='].join(''));
    const cru = new RegExp(['#[0-9a-fA-F]{3,8}\\b|\\brgb', 'a?\\(|\\bhsl', 'a?\\('].join(''));
    for (const fitxer of NOUS) {
      const codi = senseComentaris(llig(fitxer));
      expect(estil.test(codi), fitxer).toBe(false);
      expect(classe.test(codi), fitxer).toBe(false);
      expect(cru.test(codi), fitxer).toBe(false);
    }
    expect(estil.test(senseComentaris(llig(`${DIR}/AdminSection.jsx`)))).toBe(false);
  });

  test('privacitat: el bloc nou no llig mai el correu de ningú', () => {
    const correu = new RegExp(['\\bema', 'il\\b'].join(''));
    for (const fitxer of NOUS) expect(correu.test(senseComentaris(llig(fitxer))), fitxer).toBe(false);
  });

  test('minimització: el bloc no crida el port en muntar-se (cap efecte), només quan es demana', () => {
    const codi = senseComentaris(llig(`${DIR}/IndicadorsAdmin.jsx`));
    expect(/\buse(?:Layout)?Effect\b/.test(codi)).toBe(false);
    expect(codi).toContain('onClick={calcula}');
  });
});
