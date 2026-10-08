// @vitest-environment node
/* Enxufabilitat (T2b, 261002) · qualitat dels fitxers del lot: ESLint amb la
   configuració del projecte i zero missatges (l'equivalent de
   --max-warnings=0), i comprovacions per text. Patró de
   src/sections/gestoria/qualitat.test.js: els patrons vetats es componen a
   trossos perquè les portes que llegixen src/ no els troben ací. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

/* A1 (261003): la capa del paquet i les dues entrades pròpies que la fixen. */
const PRODUCCIO = [
  'src/host.js',
  'src/PedraSecaEmbed.jsx',
  'src/app/contexts/RouterContext.jsx',
  'src/config/contracteAmfitrio.js',
  'src/config/origensSollutia.js',
  'src/config/capaDelPaquet.js',
  'src/config/runtimePolicy.js',
  'src/main.jsx',
  'src/embed.jsx',
  /* Decisió 5 del Mestre (261007): el carregador clàssic del paquet trossejat
     i el costat ESM que en pren el control. */
  'src/config/carregadorDelPaquet.js',
  'src/config/provisionalDelPaquet.js'
];
/* El carregador és PUR: vite.standalone.config.js el compila tal qual en un
   script clàssic; la finestra, el document i l'script li arriben per paràmetre. */
const PURS = ['src/config/contracteAmfitrio.js', 'src/config/origensSollutia.js', 'src/config/carregadorDelPaquet.js'];
const PROVES = [
  'src/config/contracteAmfitrio.test.js',
  'src/config/contracteAmfitrio.paritat.test.js',
  'src/config/origensSollutia.test.js',
  'src/config/runtimePolicy.test.js',
  'src/config/qualitat.amfitrio.test.js',
  'src/config/capaDelPaquet.test.js',
  'src/config/hostAdapter.test.js',
  'src/config/hostIframeAdapter.test.js',
  'src/PedraSecaEmbed.config.test.jsx',
  'src/entrades.capaDelPaquet.test.jsx',
  'src/config/carregadorDelPaquet.test.js',
  'src/embed.carregador.test.jsx',
  'tests/host.test.js',
  'tests/conformitat-amfitrio.test.mjs',
  'tests/fixtures/amfitrio-sollutia.mjs'
];
const TOTS = [...PRODUCCIO, ...PROVES];

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers del lot', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/config/sonda.js') });
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

  test('el contracte, la llista d’orígens i el carregador són purs: sense import.meta, window, document ni globalThis', () => {
    const impurs = new RegExp(['import\\.', 'meta|\\bwin', 'dow\\.|\\bdocu', 'ment\\.|\\bglobal', 'This\\b'].join(''));
    const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const fitxer of PURS) expect(impurs.test(senseComentaris(llig(fitxer))), fitxer).toBe(false);
  });

  test('producció: res fora del Baseline 2022, cap lookbehind, cap emmagatzematge directe', () => {
    const vetats = [
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind'],
      [new RegExp(['local', 'Storage|session', 'Storage'].join('')), 'emmagatzematge directe']
    ];
    const trobats = PRODUCCIO.flatMap((fitxer) => {
      const codi = llig(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });

  test('l’element no escriu cap global nova (tractor-enxufe E4): només window.SocDePoble, des de host.js', () => {
    const assignacio = /\b(?:window|globalThis)(?:\.([A-Za-z_$][\w$]*)|\[['"`]([A-Za-z_$][\w$]*)['"`]\])\s*=(?!=)/g;
    const permeses = /^__SDP_(?:REACT_MOUNTED|GLOBAL_ERRORS_BOUND|OUTBOX_QUARANTINED)__$/;
    for (const fitxer of ['src/PedraSecaEmbed.jsx', 'src/app/contexts/RouterContext.jsx', 'src/config/capaDelPaquet.js', 'src/main.jsx', 'src/embed.jsx',
      'src/config/provisionalDelPaquet.js', ...PURS]) {
      const noves = [...llig(fitxer).matchAll(assignacio)].map((m) => m[1] || m[2]).filter((nom) => !permeses.test(nom));
      expect(noves, fitxer).toEqual([]);
    }
  });

  /* Decisió 5 del Mestre (261007) · declaració explícita del que E4 de
     tooling/gates/tractor-enxufe.mjs no veu: el carregador definix el
     SocDePoble PROVISIONAL amb defineProperty sobre un paràmetre (`finestra`),
     com exposaGlobal ho fa sobre `objectiu`, i la porta només mira window i
     globalThis. A src/ només ho fan eixos dos fitxers (wikiManifest.js és
     generat i en pot citar el text). El carregador no importa res: el compila
     tal qual vite.standalone.config.js, i un import el trauria de script
     clàssic. Ensenyar-ho a E4 necessita una lease. */
  test('només host.js i carregadorDelPaquet.js definixen SocDePoble, i el carregador no importa res', () => {
    const definicio = new RegExp(['define', 'Property\\(\\s*[\\w$.]+\\s*,\\s*[\'"`]SocDe', 'Poble[\'"`]'].join(''));
    const fonts = readdirSync(path.join(ARREL, 'src'), { recursive: true })
      .map((rel) => `src/${String(rel).split(path.sep).join('/')}`)
      .filter((rel) => /\.(?:js|jsx|mjs)$/.test(rel) && !/\.(?:test|spec)\.[cm]?jsx?$/.test(rel) && rel !== 'src/data/wikiManifest.js');
    expect(fonts.filter((rel) => definicio.test(llig(rel))).sort()).toEqual(['src/config/carregadorDelPaquet.js', 'src/host.js']);
    const carregador = llig('src/config/carregadorDelPaquet.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(carregador).not.toMatch(/\bimport\b/);
    expect(carregador).toMatch(/^export function instalaCarregador\(/m);
  });
});
