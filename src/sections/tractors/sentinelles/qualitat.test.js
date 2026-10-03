// @vitest-environment node
/* Les portes del repo sobre el lot dels sentinelles: ESLint amb la
   configuració del projecte i zero missatges (l'equivalent de
   --max-warnings=0) a tots els fitxers nous i tocats, Pedra Seca al JSX del
   panell (només classes que ja tenen regla, cap estil en línia), la mateixa
   Policia del Disseny sobre el seu codi, i la higiene i el Baseline 2022 del
   codi de producció. Els patrons es componen a trossos perquè les portes que
   llegixen src/ no els troben ací. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';
import { revisaFitxer } from './policiaDisseny.js';

const ARREL = process.cwd();
const TRACTORS = 'src/sections/tractors';
const CARRIL = `${TRACTORS}/sentinelles`;
const esProva = (ruta) => /\.test\.jsx?$/.test(ruta);
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.jsx?$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const DEL_CARRIL = fitxersDe(CARRIL);
const CODI = [...DEL_CARRIL.filter((f) => !esProva(f)), `${TRACTORS}/registreSentinelles.js`, `${TRACTORS}/PanellSentinelles.jsx`];
const PROVES = [
  ...DEL_CARRIL.filter(esProva), `${TRACTORS}/registreSentinelles.test.js`, `${TRACTORS}/PanellSentinelles.test.jsx`, `${TRACTORS}/clausuraSentinelles.test.js`
];
/* Els fitxers d'altres carrils que este lot toca: l'entrada de la Wiki i les seues proves, i el comptador de privacitat. */
const TOCATS = [
  'src/sections/wiki-de-poble/WikiDePobleSection.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.einesLocals.test.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.produccio.test.jsx',
  'src/sections/gestoria/privacitat.test.js'
];

describe('el cens', () => {
  test('hi són el contracte, el corredor, els set sentinelles i les seues proves', () => {
    for (const esperat of [
      'contracte.js', 'executa.js', 'comu.js', 'estructural.js', 'trituradorFinancer.js', 'consolVendes.js', 'policiaDisseny.js',
      'auditoriaAparador.js', 'enllacTorn.js', 'detectiuPoble.js', 'qualitat.test.js', 'privacitat.test.js'
    ]) expect(DEL_CARRIL, esperat).toContain(`${CARRIL}/${esperat}`);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, als fitxers nous i tocats', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const tots = [...CODI, ...PROVES, ...TOCATS];
    const resultats = await eslint.lintFiles(tots.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(tots.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, CARRIL, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca al panell', () => {
  const panell = llig(`${TRACTORS}/PanellSentinelles.jsx`);

  test('cap estil en línia ni h1, i className sempre literal', () => {
    expect(new RegExp(['\\ssty', 'le=[{"]'].join('')).test(panell)).toBe(false);
    expect(new RegExp(['<h', '1[\\s>]'].join('')).test(panell)).toBe(false);
    expect(panell).not.toMatch(/className=\{/);
  });

  test('cada classe ja té regla al bloc dels tractors o al full canònic: cap CSS nou', () => {
    const css = ['modules.css', 'components.css', 'layout.css', 'base.css', 'utilities.css'].map((f) => llig(`src/css/${f}`)).join('\n');
    const classes = [...new Set([...panell.matchAll(/className="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)))];
    expect(classes.length).toBeGreaterThan(8);
    expect(classes.filter((c) => !c.startsWith('sdp-tractors-panell'))).toEqual([]);
    expect(classes.filter((c) => !new RegExp(`\\.${c}(?![\\w-])`).test(css))).toEqual([]);
  });

  test('la Policia del Disseny no troba cap roja al codi del lot', () => {
    const roges = CODI.flatMap((ruta) => revisaFitxer(ruta, llig(ruta))).filter((a) => a.severitat === 'roja');
    expect(roges).toEqual([]);
  });
});

describe('higiene i Baseline 2022 del codi de producció', () => {
  test('cap API ni patró vetat', () => {
    const vetats = [
      [new RegExp(['\\binner', 'HTML\\b|\\bouter', 'HTML\\b|insertAdjacent', 'HTML|dangerously', 'SetInnerHTML'].join('')), 'HTML cru'],
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join('')), 'emmagatzematge del navegador'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita'],
      [/from '@\//, 'import amb @/'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind (Safari 16.0 no el té)'],
      [/\/[gimsuy]*v[gimsuy]*\s*[,;)]/, 'expressió amb la bandera v'],
      [/[^\S\n\r\t ]/, 'espai invisible']
    ];
    const trobats = CODI.flatMap((fitxer) => vetats.filter(([patro]) => patro.test(llig(fitxer))).map(([, que]) => `${fitxer}: ${que}`));
    expect(trobats).toEqual([]);
  });

  /* La mateixa frontera que gestoria/privacitat.test.js: els carrils, PedraSeca,
     el router propi (la Clàusula dels Slugs: el sentinella triat viu a la URL),
     react i lucide. */
  test('cap import del backend ni de fora dels carrils, de PedraSeca, del router propi, de react i de lucide', () => {
    const backend = new RegExp(['supa', 'base|backend', 'Port|adapta', 'dors'].join(''), 'i');
    const fora = CODI.flatMap((fitxer) => [...llig(fitxer).matchAll(/\bfrom\s*'([^']+)'/g)].map((m) => [fitxer, m[1]]))
      .filter(([fitxer, especificador]) => {
        if (backend.test(especificador)) return true;
        if (!especificador.startsWith('.')) return !['react', 'lucide-react'].includes(especificador);
        const desti = path.posix.normalize(path.posix.join(path.posix.dirname(fitxer), especificador.split('?')[0]));
        if (desti === 'src/app/contexts/RouterContext') return false;
        return !(desti.startsWith('src/sections/tractors/') || desti.startsWith('src/sections/gestoria/') || desti.startsWith('src/components/PedraSeca/'));
      });
    expect(fora).toEqual([]);
  });
});

describe('formes valencianes del repo als textos que veu la persona', () => {
  /* El verb és eixir (ix, ixen); el patró es compon perquè no es trobe a si mateix. */
  const VETATS = [[new RegExp(['\\bsur', 't(?:en)?\\b'].join(''), 'i'), 'surt → ix'], [new RegExp(['\\bsor', 'tir\\b'].join(''), 'i'), 'sortir → eixir']];
  const FITXES = readdirSync(path.join(ARREL, CARRIL, 'fitxes')).filter((f) => f.endsWith('.md')).map((f) => `${CARRIL}/fitxes/${f}`);

  test('ni el codi ni les fitxes diuen «surt» ni «sortir»', () => {
    expect(FITXES.length).toBe(7);
    const trobats = [...CODI, ...FITXES].flatMap((fitxer) => VETATS.filter(([patro]) => patro.test(llig(fitxer))).map(([, que]) => `${fitxer}: ${que}`));
    expect(trobats).toEqual([]);
  });
});
